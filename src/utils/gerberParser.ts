import pcbStackupUrl from 'pcb-stackup/dist/pcb-stackup.min.js?url';
import unrarWasmUrl from 'node-unrar-js/esm/js/unrar.wasm?url';
import {
  classifyLayers,
  computeDrillStats,
  extractFiles,
  isArchive,
  type DetectedLayer,
  type SourceFile,
} from './gerber/layers';
import { recolorBoard, renderBoard, type PcbStackupFn, type RenderedBoard, type StackupColors } from './gerber/stackup';

export type { DetectedLayer } from './gerber/layers';
export type { StackupColors } from './gerber/stackup';

export interface ParsedGerberBoard {
  fileName: string;
  fileSizeFormatted: string;
  widthMm: number;
  heightMm: number;
  copperLayerCount: number;
  holeCount: number;
  minHoleMm: number | null;
  /** File outline được dùng làm hình dạng bo (null = không có outline khép kín) */
  outlineFile: string | null;
  layers: DetectedLayer[];
  render: RenderedBoard;
}

export class GerberParseError extends Error {}

// pcb-stackup dùng stream của Node; bản dist đã đóng gói sẵn polyfill nên nạp bằng <script> khi cần
let pcbStackupPromise: Promise<PcbStackupFn> | null = null;
function loadPcbStackup(): Promise<PcbStackupFn> {
  pcbStackupPromise ??= new Promise((resolve, reject) => {
    const w = window as unknown as { pcbStackup?: PcbStackupFn };
    if (w.pcbStackup) return resolve(w.pcbStackup);
    const script = document.createElement('script');
    script.src = pcbStackupUrl;
    script.onload = () => (w.pcbStackup ? resolve(w.pcbStackup) : reject(new Error('pcb-stackup không khởi tạo được')));
    script.onerror = () => {
      pcbStackupPromise = null;
      reject(new Error('Không tải được thư viện render Gerber'));
    };
    document.head.appendChild(script);
  });
  return pcbStackupPromise;
}

let unrarWasmPromise: Promise<ArrayBuffer> | null = null;
function loadUnrarWasm() {
  unrarWasmPromise ??= fetch(unrarWasmUrl).then(r => r.arrayBuffer());
  return unrarWasmPromise;
}

function formatSize(bytes: number) {
  return bytes > 1024 * 1024 ? `${(bytes / (1024 * 1024)).toFixed(2)} MB` : `${Math.max(1, Math.round(bytes / 1024))} KB`;
}

/**
 * Đọc 1 file nén (.zip/.rar) hoặc nhiều file lớp Gerber/Excellon rời, rồi render top/bottom thật bằng pcb-stackup.
 */
export async function parseGerberFiles(inputs: File[], color: StackupColors): Promise<ParsedGerberBoard> {
  if (inputs.length === 0) throw new GerberParseError('Chưa chọn tệp nào.');

  const sources: SourceFile[] = [];
  for (const file of inputs) {
    const data = await file.arrayBuffer();
    const wasmBinary = file.name.toLowerCase().endsWith('.rar') ? await loadUnrarWasm() : undefined;
    try {
      sources.push(...(await extractFiles(file.name, data, { wasmBinary })));
    } catch (err) {
      throw new GerberParseError(
        `Không giải nén được "${file.name}": ${(err as Error)?.message || 'tệp bị lỗi hoặc có mật khẩu'}.`
      );
    }
  }

  const classified = classifyLayers(sources);
  const hasCopper = classified.renderLayers.some(l => l.type === 'copper');
  if (!hasCopper && classified.outlineCandidates.length === 0) {
    throw new GerberParseError(
      'Không tìm thấy lớp đồng (Copper) hay đường bao bo (Outline) hợp lệ. Hãy nén toàn bộ thư mục xuất Gerber/CAM từ Altium, KiCad, EasyEDA hoặc Eagle.'
    );
  }

  const pcbStackup = await loadPcbStackup();
  const render = await renderBoard(pcbStackup, classified.renderLayers, classified.outlineCandidates, color);
  const drills = computeDrillStats(classified.renderLayers);

  // Chỉ lớp outline được chọn là "used"; các ứng viên còn lại chuyển sang "skipped"
  const layers = classified.detected.map(l =>
    l.type === 'outline' && l.status === 'used' && l.fileName !== render.outlineFile ? { ...l, status: 'skipped' as const } : l
  );

  const totalSize = inputs.reduce((s, f) => s + f.size, 0);
  return {
    fileName: inputs.length === 1 || isArchive(inputs[0].name) ? inputs[0].name : `${inputs.length} tệp Gerber`,
    fileSizeFormatted: formatSize(totalSize),
    widthMm: render.widthMm,
    heightMm: render.heightMm,
    copperLayerCount: classified.copperLayerCount,
    holeCount: drills.holeCount,
    minHoleMm: drills.minHoleMm,
    outlineFile: render.outlineFile,
    layers,
    render,
  };
}

/** Đổi màu solder mask / lớp mạ mà không cần parse lại */
export async function recolorGerberBoard(board: ParsedGerberBoard, color: StackupColors): Promise<ParsedGerberBoard> {
  const pcbStackup = await loadPcbStackup();
  return { ...board, render: await recolorBoard(pcbStackup, board.render, color) };
}
