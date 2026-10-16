/**
 * Chuẩn hóa lớp outline: đọc các đoạn thẳng / cung tròn, nối thành các vòng khép kín
 * (chấp nhận đoạn ngược chiều và khe hở nhỏ), rồi xuất lại Gerber sạch.
 *
 * Cần bước này vì nhiều phần mềm (vd. EasyEDA) xuất outline với cạnh và cung bo góc lệch nhau
 * vài chục µm, khiến pcb-stackup không tạo được vùng cắt bo và ảnh bị vỡ.
 */

export interface Point {
  x: number;
  y: number;
}

interface LineSeg {
  kind: 'line';
  start: Point;
  end: Point;
}

interface ArcSeg {
  kind: 'arc';
  start: Point;
  end: Point;
  center: Point;
  clockwise: boolean;
}

type Segment = LineSeg | ArcSeg;

export interface OutlineResult {
  /** Gerber outline đã chuẩn hóa (mm) — đưa vào pcb-stackup thay cho file gốc */
  gerber: string;
  /** Các vòng khép kín, cung đã chia thành điểm (mm, trục Y hướng lên) */
  loops: Point[][];
  bounds: { minX: number; minY: number; maxX: number; maxY: number };
}

const JOIN_TOLERANCE_MM = 0.2;
const EPS = 1e-6;

const dist = (a: Point, b: Point) => Math.hypot(a.x - b.x, a.y - b.y);

function parseSegments(content: string): Segment[] {
  let toMm = 1;
  let zeroOmit: 'L' | 'T' = 'L';
  let incremental = false;
  let intX = 2, decX = 4, intY = 2, decY = 4;

  const fs = content.match(/%FS([LTD]?)([AI])X(\d)(\d)Y(\d)(\d)/);
  if (fs) {
    zeroOmit = fs[1] === 'T' ? 'T' : 'L';
    incremental = fs[2] === 'I';
    [intX, decX, intY, decY] = [fs[3], fs[4], fs[5], fs[6]].map(Number);
  }
  if (/%MOIN/.test(content)) toMm = 25.4;
  else if (/%MOMM/.test(content)) toMm = 1;

  const coord = (raw: string, int: number, dec: number) => {
    const neg = raw.startsWith('-');
    let digits = raw.replace(/^[+-]/, '');
    let value: number;
    if (digits.includes('.')) {
      value = parseFloat(digits);
    } else {
      if (zeroOmit === 'T') digits = digits.padEnd(int + dec, '0');
      value = parseInt(digits, 10) / Math.pow(10, dec);
    }
    return (neg ? -value : value) * toMm;
  };

  const segments: Segment[] = [];
  let cur: Point = { x: 0, y: 0 };
  let interp: 'G01' | 'G02' | 'G03' = 'G01';
  let multiQuadrant = false;
  let lastD = '02';

  // Bỏ các khối lệnh mở rộng %...%, tách lệnh theo dấu '*'
  const body = content.replace(/%[^%]*%/g, '');
  for (const rawCmd of body.split('*')) {
    const cmd = rawCmd.replace(/\s+/g, '');
    if (!cmd || cmd.startsWith('G04')) continue;

    if (/G70/.test(cmd)) toMm = 25.4;
    if (/G71/.test(cmd)) toMm = 1;
    if (/G74/.test(cmd)) multiQuadrant = false;
    if (/G75/.test(cmd)) multiQuadrant = true;
    const g = cmd.match(/G0?([123])(?!\d)/);
    if (g) interp = `G0${g[1]}` as typeof interp;

    const x = cmd.match(/X([+-]?[\d.]+)/);
    const y = cmd.match(/Y([+-]?[\d.]+)/);
    const i = cmd.match(/I([+-]?[\d.]+)/);
    const j = cmd.match(/J([+-]?[\d.]+)/);
    const d = cmd.match(/D0?([123])(?!\d)/);
    // Lệnh chọn aperture (D10, D11...) không khớp D0?[123] nên bị bỏ qua ở đây
    if (!(x || y || i || j) && !d) continue;
    if (d) lastD = `0${d[1]}`;

    const nx = x ? coord(x[1], intX, decX) : 0;
    const ny = y ? coord(y[1], intY, decY) : 0;
    const next: Point = incremental
      ? { x: cur.x + nx, y: cur.y + ny }
      : { x: x ? nx : cur.x, y: y ? ny : cur.y };

    if (lastD === '01') {
      if (interp === 'G01') {
        if (dist(cur, next) > EPS) segments.push({ kind: 'line', start: cur, end: next });
      } else {
        const ox = i ? coord(i[1], intX, decX) : 0;
        const oy = j ? coord(j[1], intY, decY) : 0;
        const clockwise = interp === 'G02';
        const center = multiQuadrant
          ? { x: cur.x + ox, y: cur.y + oy }
          : singleQuadrantCenter(cur, next, Math.abs(ox), Math.abs(oy), clockwise);
        segments.push({ kind: 'arc', start: cur, end: next, center, clockwise });
      }
    }
    cur = next;
  }

  return segments;
}

/** G74: I/J không dấu — chọn tâm sao cho bán kính hai đầu khớp và cung ≤ 90° */
function singleQuadrantCenter(start: Point, end: Point, i: number, j: number, clockwise: boolean): Point {
  let best = { x: start.x + i, y: start.y + j };
  let bestErr = Infinity;
  for (const sx of [1, -1]) {
    for (const sy of [1, -1]) {
      const c = { x: start.x + sx * i, y: start.y + sy * j };
      const sweep = arcSweep({ kind: 'arc', start, end, center: c, clockwise });
      if (sweep > Math.PI / 2 + 1e-3) continue;
      const err = Math.abs(dist(c, start) - dist(c, end));
      if (err < bestErr) {
        bestErr = err;
        best = c;
      }
    }
  }
  return best;
}

function arcSweep(a: ArcSeg) {
  const a0 = Math.atan2(a.start.y - a.center.y, a.start.x - a.center.x);
  const a1 = Math.atan2(a.end.y - a.center.y, a.end.x - a.center.x);
  let sweep = a.clockwise ? a0 - a1 : a1 - a0;
  while (sweep <= EPS) sweep += Math.PI * 2; // điểm đầu trùng điểm cuối = vòng tròn đủ
  return sweep;
}

function reverse(s: Segment): Segment {
  return s.kind === 'line'
    ? { kind: 'line', start: s.end, end: s.start }
    : { ...s, start: s.end, end: s.start, clockwise: !s.clockwise };
}

/** Nối các đoạn thành chuỗi; chèn đoạn thẳng nối khi hai đầu lệch nhau trong ngưỡng */
function chainLoops(segments: Segment[]): Segment[][] {
  const unused = new Set(segments.map((_, idx) => idx));
  const loops: Segment[][] = [];

  // Đoạn tự khép kín (vd. lỗ tròn vẽ bằng 1 cung 360°) là một vòng riêng
  for (const idx of [...unused]) {
    const s = segments[idx];
    if (s.kind === 'arc' && dist(s.start, s.end) < EPS) {
      loops.push([s]);
      unused.delete(idx);
    }
  }

  while (unused.size > 0) {
    const firstIdx = unused.values().next().value as number;
    unused.delete(firstIdx);
    const chain: Segment[] = [segments[firstIdx]];

    for (;;) {
      const tail = chain[chain.length - 1].end;
      if (chain.length > 1 && dist(tail, chain[0].start) < JOIN_TOLERANCE_MM) break;

      let bestIdx = -1;
      let bestDist = JOIN_TOLERANCE_MM;
      let bestReversed = false;
      for (const idx of unused) {
        const s = segments[idx];
        const ds = dist(tail, s.start);
        const de = dist(tail, s.end);
        if (ds < bestDist) [bestIdx, bestDist, bestReversed] = [idx, ds, false];
        if (de < bestDist) [bestIdx, bestDist, bestReversed] = [idx, de, true];
      }
      if (bestIdx < 0) break;

      unused.delete(bestIdx);
      const next = bestReversed ? reverse(segments[bestIdx]) : segments[bestIdx];
      if (dist(tail, next.start) > EPS) chain.push({ kind: 'line', start: tail, end: next.start });
      chain.push(next);
    }

    const tail = chain[chain.length - 1].end;
    const closed = dist(tail, chain[0].start) < JOIN_TOLERANCE_MM;
    if (closed && dist(tail, chain[0].start) > EPS) {
      chain.push({ kind: 'line', start: tail, end: chain[0].start });
    }
    // Chuỗi hở (đường kích thước, ký hiệu...) không tạo được vùng cắt — bỏ qua
    if (closed) loops.push(chain);
  }

  return loops;
}

function flatten(loop: Segment[]): Point[] {
  const pts: Point[] = [];
  for (const s of loop) {
    if (s.kind === 'line') {
      pts.push(s.start);
      continue;
    }
    const r = dist(s.center, s.start);
    const sweep = arcSweep(s);
    const steps = Math.max(4, Math.ceil((sweep * r) / 0.25)); // ~0.25 mm mỗi bước
    const a0 = Math.atan2(s.start.y - s.center.y, s.start.x - s.center.x);
    const dir = s.clockwise ? -1 : 1;
    for (let k = 0; k < steps; k++) {
      const a = a0 + dir * (sweep * k) / steps;
      pts.push({ x: s.center.x + r * Math.cos(a), y: s.center.y + r * Math.sin(a) });
    }
  }
  return pts;
}

const fmt = (v: number) => Math.round(v * 1e6).toString();

function toGerber(loops: Segment[][]): string {
  const out = ['%FSLAX46Y46*%', '%MOMM*%', '%ADD10C,0.100000*%', 'D10*', 'G75*'];
  for (const loop of loops) {
    out.push(`X${fmt(loop[0].start.x)}Y${fmt(loop[0].start.y)}D02*`);
    for (const s of loop) {
      if (s.kind === 'line') {
        out.push(`G01X${fmt(s.end.x)}Y${fmt(s.end.y)}D01*`);
      } else {
        const i = s.center.x - s.start.x;
        const j = s.center.y - s.start.y;
        out.push(`${s.clockwise ? 'G02' : 'G03'}X${fmt(s.end.x)}Y${fmt(s.end.y)}I${fmt(i)}J${fmt(j)}D01*`);
      }
    }
  }
  out.push('M02*');
  return out.join('\n');
}

export function normalizeOutline(content: string): OutlineResult | null {
  const loops = chainLoops(parseSegments(content));
  if (loops.length === 0) return null;

  const flat = loops.map(flatten);
  const bounds = { minX: Infinity, minY: Infinity, maxX: -Infinity, maxY: -Infinity };
  for (const loop of flat) {
    for (const p of loop) {
      bounds.minX = Math.min(bounds.minX, p.x);
      bounds.minY = Math.min(bounds.minY, p.y);
      bounds.maxX = Math.max(bounds.maxX, p.x);
      bounds.maxY = Math.max(bounds.maxY, p.y);
    }
  }
  // Với cung tròn, khung bao cần cả các điểm cực trị — flatten đã lấy mẫu dày nên sai số < 0.01 mm
  return { gerber: toGerber(loops), loops: flat, bounds };
}
