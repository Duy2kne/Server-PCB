import JSZip from 'jszip';
import { createExtractorFromData } from 'node-unrar-js';
import whatsThatGerber from 'whats-that-gerber';

export type LayerType = 'copper' | 'soldermask' | 'silkscreen' | 'solderpaste' | 'drill' | 'outline' | 'drawing';
export type LayerSide = 'top' | 'bottom' | 'inner' | 'all';

export interface SourceFile {
  name: string;
  content: string;
}

export interface StackupLayer {
  filename: string;
  gerber: string;
  type: LayerType;
  side: LayerSide;
}

/**
 * - used: đưa vào ảnh render
 * - empty: đúng định dạng nhưng không có đối tượng nào (vd. GM1 rỗng của Altium)
 * - skipped: lớp hợp lệ nhưng không hiển thị (paste, outline phụ, lớp bản vẽ...)
 * - ignored: không phải file Gerber / Excellon (báo cáo, README, .Cam, ...)
 */
export type LayerStatus = 'used' | 'empty' | 'skipped' | 'ignored';

export interface DetectedLayer {
  fileName: string;
  type: LayerType | null;
  side: LayerSide | null;
  label: string;
  status: LayerStatus;
}

export interface ClassifiedLayers {
  /** Lớp đưa vào pcb-stackup (chưa gồm outline) */
  renderLayers: StackupLayer[];
  /** Các ứng viên outline có nội dung — chọn 1 ở bước render */
  outlineCandidates: StackupLayer[];
  detected: DetectedLayer[];
  copperLayerCount: number;
}

const ARCHIVE_EXT = /\.(zip|rar)$/i;

export function isArchive(name: string) {
  return ARCHIVE_EXT.test(name);
}

function decodeText(data: Uint8Array) {
  return new TextDecoder('utf-8').decode(data);
}

/**
 * Giải nén .zip / .rar thật sự (không đoán từ dữ liệu nén) và trả về nội dung text của từng file.
 * `wasmBinary` là nội dung unrar.wasm — bắt buộc trên trình duyệt, tùy chọn trong Node.
 */
export async function extractFiles(
  name: string,
  data: ArrayBuffer,
  opts: { wasmBinary?: ArrayBuffer } = {}
): Promise<SourceFile[]> {
  const lower = name.toLowerCase();

  if (lower.endsWith('.zip')) {
    const zip = await JSZip.loadAsync(data);
    const entries = Object.values(zip.files).filter(f => !f.dir);
    return Promise.all(
      entries.map(async f => ({ name: f.name, content: decodeText(await f.async('uint8array')) }))
    );
  }

  if (lower.endsWith('.rar')) {
    const extractor = await createExtractorFromData({ data, wasmBinary: opts.wasmBinary });
    const { files } = extractor.extract();
    const result: SourceFile[] = [];
    for (const f of files) {
      if (f.fileHeader.flags.directory || !f.extraction) continue;
      result.push({ name: f.fileHeader.name.replace(/\\/g, '/'), content: decodeText(f.extraction) });
    }
    return result;
  }

  return [{ name, content: decodeText(new Uint8Array(data)) }];
}

const isGerberContent = (c: string) => /%FS[LTD]?[AI]X\d+Y\d+/.test(c);
const isExcellonContent = (c: string) => /^M48/m.test(c) || /^T\d+(?:F\d+)?(?:S\d+)?C\d*\.?\d+/m.test(c);
const hasGerberObjects = (c: string) => /D0?[13]\*/.test(c);
const hasDrillHits = (c: string) => /^(?:G\d\d)?[XY][+-]?[\d.]+/m.test(c);

/** Đọc thuộc tính X2 %TF.FileFunction% (KiCad, Altium mới, ...) — tin cậy hơn tên file */
function identifyByX2(content: string): { type: LayerType; side: LayerSide | null } | null {
  const m = content.match(/TF\.FileFunction,([^*]+)\*/);
  if (!m) return null;
  const parts = m[1].split(',').map(p => p.trim().toLowerCase());
  const sideOf = (s?: string): LayerSide | null =>
    s?.startsWith('top') ? 'top' : s?.startsWith('bot') ? 'bottom' : null;

  switch (parts[0]) {
    case 'copper':
      return { type: 'copper', side: parts[2] === 'top' ? 'top' : parts[2] === 'bot' ? 'bottom' : 'inner' };
    case 'soldermask':
      return { type: 'soldermask', side: sideOf(parts[1]) };
    case 'legend':
      return { type: 'silkscreen', side: sideOf(parts[1]) };
    case 'paste':
      return { type: 'solderpaste', side: sideOf(parts[1]) };
    case 'profile':
      return { type: 'outline', side: 'all' };
    case 'plated':
    case 'nonplated':
      return { type: 'drill', side: 'all' };
    default:
      return { type: 'drawing', side: null };
  }
}

const TYPE_LABEL: Record<LayerType, string> = {
  copper: 'Copper',
  soldermask: 'Solder Mask',
  silkscreen: 'Silkscreen',
  solderpaste: 'Paste',
  drill: 'Drill',
  outline: 'Board Outline',
  drawing: 'Drawing',
};
const SIDE_LABEL: Record<LayerSide, string> = { top: 'Top', bottom: 'Bottom', inner: 'Inner', all: '' };

function labelOf(type: LayerType | null, side: LayerSide | null) {
  if (!type) return 'Không phải Gerber';
  return [side ? SIDE_LABEL[side] : '', TYPE_LABEL[type]].filter(Boolean).join(' ');
}

/**
 * Nhận diện loại lớp và mặt của file Gerber/drill từ tên file và nội dung.
 */
export function identifyGerberLayer(filename: string, content?: string): {
  type: LayerType | null;
  side: LayerSide | null;
  label: string;
} {
  const byName = whatsThatGerber([filename])[filename];
  let type = (byName?.type ?? null) as LayerType | null;
  let side = (byName?.side ?? null) as LayerSide | null;
  if (content && isGerberContent(content)) {
    const x2 = identifyByX2(content);
    if (x2) {
      type = (x2.type as LayerType) ?? type;
      side = (x2.side as LayerSide) ?? side;
    }
  }
  return {
    type,
    side,
    label: labelOf(type, side),
  };
}

/** Phân loại file: nhận diện lớp theo X2 → tên file, rồi kiểm tra nội dung để loại file báo cáo / file rỗng */
export function classifyLayers(files: SourceFile[]): ClassifiedLayers {
  const byName = whatsThatGerber(files.map(f => f.name));
  const renderLayers: StackupLayer[] = [];
  const outlineCandidates: StackupLayer[] = [];
  const detected: DetectedLayer[] = [];
  let copperLayerCount = 0;

  for (const file of files) {
    const { name, content } = file;
    const isGerber = isGerberContent(content);
    const isDrill = !isGerber && isExcellonContent(content);

    const id = (isGerber && identifyByX2(content)) || byName[name];
    const type = (id?.type ?? null) as LayerType | null;
    const side = (id?.side ?? null) as LayerSide | null;

    const push = (status: LayerStatus) =>
      detected.push({ fileName: name, type: status === 'ignored' ? null : type, side, label: labelOf(status === 'ignored' ? null : type, side), status });

    if (!type || (!isGerber && !isDrill) || (type === 'drill') !== (isDrill || /TF\.FileFunction,(Non)?Plated/i.test(content))) {
      push('ignored');
      continue;
    }

    if (type === 'copper') copperLayerCount++;

    const hasContent = isDrill ? hasDrillHits(content) : hasGerberObjects(content);
    if (!hasContent) {
      push('empty');
      continue;
    }

    const layer: StackupLayer = { filename: name, gerber: content, type, side: side ?? 'all' };

    if (type === 'outline') {
      // Lớp outline có vùng tô (G36) là lớp cơ khí vẽ linh kiện, không phải đường bao bo
      if (/^G36\*/m.test(content)) {
        push('skipped');
      } else {
        outlineCandidates.push(layer);
        push('used'); // có thể đổi thành 'skipped' khi chọn outline
      }
      continue;
    }

    if (type === 'solderpaste' || type === 'drawing' || side === 'inner') {
      push('skipped');
      continue;
    }

    renderLayers.push(layer);
    push('used');
  }

  return { renderLayers, outlineCandidates, detected, copperLayerCount };
}

export interface DrillStats {
  holeCount: number;
  minHoleMm: number | null;
}

/** Đếm lỗ khoan và đường kính lỗ nhỏ nhất từ các file Excellon */
export function computeDrillStats(layers: StackupLayer[]): DrillStats {
  let holeCount = 0;
  let minHoleMm: number | null = null;

  for (const l of layers) {
    if (l.type !== 'drill' || !isExcellonContent(l.gerber)) continue;
    const toMm = /\bINCH\b/.test(l.gerber) || /^M72/m.test(l.gerber) ? 25.4 : 1;
    const headerEnd = l.gerber.search(/^(?:%|M95)\s*$/m);
    const body = headerEnd >= 0 ? l.gerber.slice(headerEnd) : l.gerber;

    for (const m of l.gerber.matchAll(/^T\d+(?:F\d+)?(?:S\d+)?C(\d*\.?\d+)/gm)) {
      const d = parseFloat(m[1]) * toMm;
      if (d > 0 && (minHoleMm === null || d < minHoleMm)) minHoleMm = d;
    }
    holeCount += (body.match(/^(?:G\d\d)?[XY][+-]?[\d.]+/gm) || []).length;
  }

  return { holeCount, minHoleMm };
}
