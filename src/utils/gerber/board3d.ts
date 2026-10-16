import * as THREE from 'three';
import type { Point } from './outline';
import type { RenderedBoard } from './stackup';

interface Hole {
  x: number;
  y: number;
  r: number;
}

interface BoardFrame {
  /** Khung viewBox của ảnh SVG (mm) — ảnh texture phủ đúng khung này */
  vb: { minX: number; minY: number; width: number; height: number };
  outer: Point[];
  holes: Point[][];
}

const unitToMm = (units: 'mm' | 'in') => (units === 'in' ? 25.4 : 1);

function polygonArea(pts: Point[]) {
  let a = 0;
  for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) a += (pts[j].x + pts[i].x) * (pts[j].y - pts[i].y);
  return a / 2;
}

function pointInPolygon(p: Point, poly: Point[]) {
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const a = poly[i];
    const b = poly[j];
    if (a.y > p.y !== b.y > p.y && p.x < ((b.x - a.x) * (p.y - a.y)) / (b.y - a.y) + a.x) inside = !inside;
  }
  return inside;
}

function distanceToPolygon(p: Point, poly: Point[]) {
  let best = Infinity;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const a = poly[j];
    const b = poly[i];
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const t = Math.max(0, Math.min(1, ((p.x - a.x) * dx + (p.y - a.y) * dy) / (dx * dx + dy * dy || 1)));
    best = Math.min(best, Math.hypot(p.x - (a.x + t * dx), p.y - (a.y + t * dy)));
  }
  return best;
}

/** Lấy lỗ khoan tròn từ lớp drill đã render: <circle id=pad r> trong defs + <use href x y> trong layer */
function extractDrillHoles(board: RenderedBoard): Hole[] {
  const holes: Hole[] = [];
  for (const layer of board.stackup.layers) {
    if (layer.type !== 'drill') continue;
    const conv = layer.converter as unknown as { defs: string[]; layer: string[]; units: 'mm' | 'in' };
    const k = unitToMm(conv.units) / 1000;
    const radius = new Map<string, number>();
    for (const def of conv.defs) {
      const m = def.match(/^<circle cx="0" cy="0" r="([\d.]+)" id="([^"]+)"/);
      if (m) radius.set(m[2], parseFloat(m[1]));
    }
    for (const el of conv.layer) {
      const m = el.match(/^<use xlink:href="#([^"]+)" x="(-?[\d.]+)" y="(-?[\d.]+)"/);
      const r = m && radius.get(m[1]);
      if (r) holes.push({ x: parseFloat(m[2]) * k, y: parseFloat(m[3]) * k, r: r * k });
    }
  }
  return holes;
}

function circlePoints(h: Hole): Point[] {
  const n = Math.max(12, Math.min(48, Math.round(h.r * 24)));
  return Array.from({ length: n }, (_, i) => {
    const a = (i / n) * Math.PI * 2;
    return { x: h.x + h.r * Math.cos(a), y: h.y + h.r * Math.sin(a) };
  });
}

const MAX_GEOMETRY_HOLES = 2500;

function buildFrame(board: RenderedBoard): BoardFrame {
  const { top } = board.stackup;
  const k = unitToMm(top.units) / 1000;
  const vb = { minX: top.viewBox[0] * k, minY: top.viewBox[1] * k, width: top.viewBox[2] * k, height: top.viewBox[3] * k };

  let loops = board.outline?.loops ?? [];
  if (loops.length === 0) {
    const { minX, minY, width, height } = vb;
    loops = [[{ x: minX, y: minY }, { x: minX + width, y: minY }, { x: minX + width, y: minY + height }, { x: minX, y: minY + height }]];
  }

  // Vòng lớn nhất là đường bao; các vòng nằm trong nó là khe/lỗ cắt
  const sorted = [...loops].sort((a, b) => Math.abs(polygonArea(b)) - Math.abs(polygonArea(a)));
  const outer = sorted[0];
  const holes = sorted.slice(1).filter(l => pointInPolygon(l[0], outer));

  // Lỗ khoan: bỏ lỗ chồng lên lỗ khác / chạm mép bo / nằm trong khe cắt (làm hỏng tam giác hóa)
  const drills = extractDrillHoles(board).sort((a, b) => b.r - a.r);
  const accepted: Hole[] = [];
  const cell = 2;
  const grid = new Map<string, Hole[]>();
  for (const h of drills) {
    if (accepted.length >= MAX_GEOMETRY_HOLES) break;
    const c = { x: h.x, y: h.y };
    if (!pointInPolygon(c, outer) || distanceToPolygon(c, outer) < h.r + 0.05) continue;
    if (holes.some(l => pointInPolygon(c, l) || distanceToPolygon(c, l) < h.r + 0.05)) continue;
    const gx = Math.floor(h.x / cell);
    const gy = Math.floor(h.y / cell);
    let overlaps = false;
    for (let dx = -2; dx <= 2 && !overlaps; dx++) {
      for (let dy = -2; dy <= 2 && !overlaps; dy++) {
        overlaps = (grid.get(`${gx + dx},${gy + dy}`) ?? []).some(o => Math.hypot(o.x - h.x, o.y - h.y) < o.r + h.r + 0.02);
      }
    }
    if (overlaps) continue;
    accepted.push(h);
    const key = `${gx},${gy}`;
    grid.set(key, [...(grid.get(key) ?? []), h]);
  }

  return { vb, outer, holes: [...holes, ...accepted.map(circlePoints)] };
}

/** Raster SVG thành texture; đặt lại width/height theo pixel để trình duyệt vẽ nét ở đúng độ phân giải */
async function svgToTexture(svg: string, pxW: number, pxH: number, renderer: THREE.WebGLRenderer) {
  const sized = svg.replace(/^<svg([^>]*?)\swidth="[^"]*"\sheight="[^"]*"/, `<svg$1 width="${pxW}" height="${pxH}"`);
  const url = URL.createObjectURL(new Blob([sized], { type: 'image/svg+xml' }));
  try {
    const img = new Image();
    img.src = url;
    await img.decode();
    const canvas = document.createElement('canvas');
    canvas.width = pxW;
    canvas.height = pxH;
    canvas.getContext('2d')!.drawImage(img, 0, 0, pxW, pxH);
    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = renderer.capabilities.getMaxAnisotropy();
    return tex;
  } finally {
    URL.revokeObjectURL(url);
  }
}

function makeShape(frame: BoardFrame, cx: number, cy: number) {
  const toV = (p: Point) => new THREE.Vector2(p.x - cx, p.y - cy);
  const shape = new THREE.Shape(frame.outer.map(toV));
  shape.holes = frame.holes.map(h => new THREE.Path(h.map(toV)));
  return shape;
}

/** Gán UV theo khung viewBox; mặt dưới của pcb-stackup là ảnh lật gương nên đảo trục u */
function mapUv(geo: THREE.BufferGeometry, frame: BoardFrame, cx: number, cy: number, mirror: boolean) {
  const pos = geo.attributes.position;
  const uv = new Float32Array(pos.count * 2);
  for (let i = 0; i < pos.count; i++) {
    const u = (pos.getX(i) + cx - frame.vb.minX) / frame.vb.width;
    uv[i * 2] = mirror ? 1 - u : u;
    uv[i * 2 + 1] = (pos.getY(i) + cy - frame.vb.minY) / frame.vb.height;
  }
  geo.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
}

/** Dải tứ giác dọc theo từng vòng, cao từ -t/2 đến +t/2 */
function buildWalls(loops: Point[][], cx: number, cy: number, t: number) {
  const segCount = loops.reduce((n, l) => n + l.length, 0);
  const pos = new Float32Array(segCount * 18);
  let o = 0;
  for (const loop of loops) {
    for (let i = 0; i < loop.length; i++) {
      const a = loop[i];
      const b = loop[(i + 1) % loop.length];
      const ax = a.x - cx, ay = a.y - cy, bx = b.x - cx, by = b.y - cy;
      pos.set([ax, ay, -t / 2, bx, by, -t / 2, bx, by, t / 2, ax, ay, -t / 2, bx, by, t / 2, ax, ay, t / 2], o);
      o += 18;
    }
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  geo.computeVertexNormals();
  return geo;
}

export interface Board3DOptions {
  thicknessMm: number;
  edgeColor: string;
  /** Kích thước texture lớn nhất (px) */
  maxTextureSize?: number;
}

/** Dựng khối bo: thân đùn từ outline thật (có khoét lỗ), hai mặt dán ảnh top/bottom */
export async function buildBoardMesh(board: RenderedBoard, renderer: THREE.WebGLRenderer, opts: Board3DOptions) {
  const frame = buildFrame(board);
  const cx = frame.vb.minX + frame.vb.width / 2;
  const cy = frame.vb.minY + frame.vb.height / 2;
  const t = opts.thicknessMm;

  const maxPx = Math.min(opts.maxTextureSize ?? 4096, renderer.capabilities.maxTextureSize);
  const scale = maxPx / Math.max(frame.vb.width, frame.vb.height);
  const pxW = Math.max(1, Math.round(frame.vb.width * scale));
  const pxH = Math.max(1, Math.round(frame.vb.height * scale));
  const [topTex, bottomTex] = await Promise.all([
    svgToTexture(board.stackup.top.svg, pxW, pxH, renderer),
    svgToTexture(board.stackup.bottom.svg, pxW, pxH, renderer),
  ]);

  const shape = makeShape(frame, cx, cy);
  const group = new THREE.Group();

  // Thân bo: chỉ cần mặt bên (cạnh bo + thành lỗ); hai mặt nắp là mặt có texture bên dưới
  const wallGeo = buildWalls([frame.outer, ...frame.holes], cx, cy, t);
  const edgeMat = new THREE.MeshStandardMaterial({ color: opts.edgeColor, roughness: 0.75, side: THREE.DoubleSide });
  group.add(new THREE.Mesh(wallGeo, edgeMat));

  const faceGeoTop = new THREE.ShapeGeometry(shape, 1);
  mapUv(faceGeoTop, frame, cx, cy, false);
  const faceGeoBottom = faceGeoTop.clone();
  mapUv(faceGeoBottom, frame, cx, cy, true);

  const faceMat = (map: THREE.Texture, side: THREE.Side) =>
    new THREE.MeshStandardMaterial({ map, side, roughness: 0.55, metalness: 0.05, alphaTest: 0.5, transparent: false });
  const topMesh = new THREE.Mesh(faceGeoTop, faceMat(topTex, THREE.FrontSide));
  topMesh.position.z = t / 2 + 0.001;
  const bottomMesh = new THREE.Mesh(faceGeoBottom, faceMat(bottomTex, THREE.BackSide));
  bottomMesh.position.z = -t / 2 - 0.001;
  group.add(topMesh, bottomMesh);

  // Bo nằm trên mặt phẳng XZ, mặt top hướng lên +Y
  group.rotation.x = -Math.PI / 2;

  const dispose = () => {
    group.traverse(obj => {
      if (obj instanceof THREE.Mesh) {
        obj.geometry.dispose();
        (Array.isArray(obj.material) ? obj.material : [obj.material]).forEach(m => m.dispose());
      }
    });
    topTex.dispose();
    bottomTex.dispose();
  };

  return { group, dispose, widthMm: frame.vb.width, heightMm: frame.vb.height, holeCount: frame.holes.length };
}

/**
 * Tương thích ngược: tạo mô hình 3D của bo mạch.
 */
export const createBoard3D = buildBoardMesh;

