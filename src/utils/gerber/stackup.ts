import type { StackupLayer } from './layers';
import { normalizeOutline, type OutlineResult } from './outline';

/** Màu theo khóa của pcb-stackup-core */
export interface StackupColors {
  fr4: string; // nền FR4
  cu: string; // đồng nằm dưới solder mask
  cf: string; // đồng hở mask (lớp mạ HASL / ENIG / OSP)
  sm: string; // solder mask
  ss: string; // silkscreen
  sp: string; // paste (không render)
  out: string; // đường viền
}

interface Converter {
  width: number;
  height: number;
  units: 'mm' | 'in';
  viewBox: [number, number, number, number];
}

export interface StackupSide {
  svg: string;
  width: number;
  height: number;
  units: 'mm' | 'in';
  viewBox: [number, number, number, number];
}

interface StackupInputLayer extends Partial<StackupLayer> {
  converter?: Converter;
}

export interface StackupResult {
  top: StackupSide;
  bottom: StackupSide;
  layers: (StackupInputLayer & { converter: Converter })[];
}

export type PcbStackupFn = (layers: StackupInputLayer[], options?: Record<string, unknown>) => Promise<StackupResult>;

export interface RenderedBoard {
  stackup: StackupResult;
  /** File outline gốc được chọn (null nếu không có outline khép kín) */
  outlineFile: string | null;
  outline: OutlineResult | null;
  widthMm: number;
  heightMm: number;
}

const toMm = (value: number, units: 'mm' | 'in') => (units === 'in' ? value * 25.4 : value);

// Tên lớp outline "chuẩn": KiCad Edge_Cuts, EasyEDA BoardOutline, Altium GKO / GM1, Eagle GML...
const PRIMARY_OUTLINE = /(edge[._-]?cuts|boardoutline|outline|profile|\.gko$|\.gm1$|\.gml$|\.gm$)/i;

let renderSeq = 0;

/**
 * Chọn 1 lớp outline: chỉ nhận lớp tạo được vòng khép kín, ưu tiên tên chuẩn,
 * sau đó lấy lớp có khung bao lớn nhất (đường bao bo nằm ngoài cùng; keep-out nằm bên trong).
 */
function pickOutline(candidates: StackupLayer[]) {
  const scored = candidates
    .map(layer => ({ layer, outline: normalizeOutline(layer.gerber) }))
    .filter((c): c is { layer: StackupLayer; outline: OutlineResult } => c.outline !== null)
    .map(c => {
      const b = c.outline.bounds;
      return { ...c, primary: PRIMARY_OUTLINE.test(c.layer.filename) ? 1 : 0, area: (b.maxX - b.minX) * (b.maxY - b.minY) };
    });
  scored.sort((a, b) => b.primary - a.primary || b.area - a.area);
  return scored[0] ?? null;
}

function stackupOptions(color: StackupColors, useOutline: boolean) {
  return { id: `pcb${renderSeq++}`, color, useOutline };
}

export async function renderBoard(
  pcbStackup: PcbStackupFn,
  layers: StackupLayer[],
  outlineCandidates: StackupLayer[],
  color: StackupColors
): Promise<RenderedBoard> {
  const picked = pickOutline(outlineCandidates);
  const input: StackupInputLayer[] = picked
    ? [...layers, { filename: picked.layer.filename, gerber: picked.outline.gerber, type: 'outline', side: 'all' }]
    : layers;

  const stackup = await pcbStackup(input, stackupOptions(color, !!picked));

  // Kích thước bo lấy từ outline (nếu có), ngược lại lấy khung bao của toàn bộ các lớp
  const b = picked?.outline.bounds;
  return {
    stackup,
    outlineFile: picked?.layer.filename ?? null,
    outline: picked?.outline ?? null,
    widthMm: b ? b.maxX - b.minX : toMm(stackup.top.width, stackup.top.units),
    heightMm: b ? b.maxY - b.minY : toMm(stackup.top.height, stackup.top.units),
  };
}

/** Render lại với màu mới — dùng lại converter đã parse nên rất nhanh */
export async function recolorBoard(pcbStackup: PcbStackupFn, board: RenderedBoard, color: StackupColors) {
  const stackup = await pcbStackup(board.stackup.layers, stackupOptions(color, !!board.outline));
  return { ...board, stackup };
}
