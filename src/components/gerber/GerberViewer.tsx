import React, { useState, useRef, useEffect, useMemo, useCallback, lazy, Suspense } from 'react';
import {
  UploadCloud,
  Check,
  FileCode,
  Sliders,
  ArrowRight,
  FileX2,
  RefreshCw,
  Cpu,
  Sparkles,
  Columns,
  ZoomIn,
  ZoomOut,
  Layers,
  ArrowLeft,
  AlertTriangle,
  Box,
} from 'lucide-react';
import {
  parseGerberFiles,
  recolorGerberBoard,
  GerberParseError,
  type ParsedGerberBoard,
  type StackupColors,
  type DetectedLayer,
} from '../../utils/gerberParser';
import { createDemoGerberZip } from '../../utils/gerber/sampleBoard';
import type { CameraPreset } from './Board3DView';

// three.js chỉ tải khi người dùng mở chế độ 3D
const Board3DView = lazy(() => import('./Board3DView').then(m => ({ default: m.Board3DView })));

export type SolderMaskColor = 'green' | 'purple' | 'red' | 'yellow' | 'blue' | 'white' | 'black';
export type SurfaceFinish = 'HASL' | 'LeadFree_HASL' | 'ENIG' | 'OSP';
export type BaseMaterial = 'FR-4' | 'Flex' | 'Aluminum' | 'Copper Core' | 'Rogers' | 'PTFE Teflon' | 'HDI';

type ViewMode = 'side-by-side' | 'top' | 'bottom' | '3d';

interface GerberViewerProps {
  onApplyToQuote?: (config: {
    fileName: string;
    width: number;
    height: number;
    color: SolderMaskColor;
    finish: SurfaceFinish;
    layers: number;
    quantity: number;
    estimatedPriceVnd: number;
    files?: File[];
  }) => void;
}

// Màu theo lớp vật liệu thật: sm = solder mask (bán trong suốt, để thấy đường đồng bên dưới),
// cu = đồng nằm dưới mask, fr4 = nền, ss = silkscreen, edge = cạnh bo trong chế độ 3D
const MASK_COLORS: Record<SolderMaskColor, { label: string; swatch: string; sm: string; cu: string; fr4: string; ss: string; edge: string }> = {
  green: { label: 'Green', swatch: '#15803d', sm: 'rgba(0, 92, 36, 0.86)', cu: '#5e9e3c', fr4: '#3b4a22', ss: '#ffffff', edge: '#3d6b35' },
  purple: { label: 'Purple', swatch: '#7e22ce', sm: 'rgba(76, 22, 122, 0.88)', cu: '#9c6cc4', fr4: '#3a2a4a', ss: '#ffffff', edge: '#4b2d66' },
  red: { label: 'Red', swatch: '#b91c1c', sm: 'rgba(164, 22, 26, 0.88)', cu: '#dc5e50', fr4: '#4a2a1a', ss: '#ffffff', edge: '#7a2626' },
  yellow: { label: 'Yellow', swatch: '#ca8a04', sm: 'rgba(214, 168, 18, 0.9)', cu: '#f2d266', fr4: '#6a5a2a', ss: '#ffffff', edge: '#9a7a24' },
  blue: { label: 'Blue', swatch: '#0369a1', sm: 'rgba(12, 62, 152, 0.88)', cu: '#5288d2', fr4: '#22324a', ss: '#ffffff', edge: '#1f3f73' },
  white: { label: 'White', swatch: '#f8fafc', sm: 'rgba(242, 242, 238, 0.93)', cu: '#ffffff', fr4: '#d8d4c4', ss: '#111111', edge: '#d9d7cf' },
  black: { label: 'Black', swatch: '#27272a', sm: 'rgba(20, 20, 22, 0.93)', cu: '#45454a', fr4: '#1a1a1a', ss: '#ffffff', edge: '#2a2a2d' },
};

const FINISHES: Record<SurfaceFinish, { label: string; cf: string }> = {
  HASL: { label: 'HASL(with lead)', cf: '#d3d6d9' },
  LeadFree_HASL: { label: 'LeadFree HASL', cf: '#e2e5e8' },
  ENIG: { label: 'ENIG', cf: '#e0b54e' },
  OSP: { label: 'OSP', cf: '#cf8f58' },
};

const LAYER_OPTIONS = [1, 2, 4, 6, 8, 10, 12, 14, 16];

function stackupColorsFor(mask: SolderMaskColor, finish: SurfaceFinish): StackupColors {
  const m = MASK_COLORS[mask];
  return { fr4: m.fr4, cu: m.cu, cf: FINISHES[finish].cf, sm: m.sm, ss: m.ss, sp: 'rgba(0,0,0,0)', out: 'rgba(0,0,0,0)' };
}

const STATUS_STYLE: Record<DetectedLayer['status'], { dot: string; text: string; note: string }> = {
  used: { dot: 'bg-emerald-400', text: 'text-slate-200', note: '' },
  empty: { dot: 'bg-amber-400', text: 'text-slate-400', note: 'trống' },
  skipped: { dot: 'bg-slate-500', text: 'text-slate-400', note: 'không hiển thị' },
  ignored: { dot: 'bg-slate-700', text: 'text-slate-500', note: 'bỏ qua' },
};

const baseName = (path: string) => path.split('/').pop() || path;

/** Tạo blob URL cho SVG và tự thu hồi khi đổi */
function useSvgUrl(svg: string | undefined) {
  const url = useMemo(() => (svg ? URL.createObjectURL(new Blob([svg], { type: 'image/svg+xml' })) : null), [svg]);
  useEffect(() => () => {
    if (url) URL.revokeObjectURL(url);
  }, [url]);
  return url;
}

export const GerberViewer: React.FC<GerberViewerProps> = ({ onApplyToQuote }) => {
  const viewportRef = useRef<HTMLDivElement | null>(null);

  // Bo đang hiển thị — null cho tới khi tải tệp thành công
  const [parsedBoard, setParsedBoard] = useState<ParsedGerberBoard | null>(null);

  // Specifications
  const [boardWidth, setBoardWidth] = useState<number>(0);
  const [boardHeight, setBoardHeight] = useState<number>(0);
  const [layersCount, setLayersCount] = useState<number>(2);
  const [baseMaterial, setBaseMaterial] = useState<BaseMaterial>('FR-4');
  const [selectedColor, setSelectedColor] = useState<SolderMaskColor>('green');
  const [selectedFinish, setSelectedFinish] = useState<SurfaceFinish>('HASL');
  const [pcbThickness, setPcbThickness] = useState<string>('1.6mm');
  const [quantity, setQuantity] = useState<number>(5);

  const [viewMode, setViewMode] = useState<ViewMode>('side-by-side');
  const [cameraPreset, setCameraPreset] = useState<CameraPreset>('iso');
  const [cameraResetKey, setCameraResetKey] = useState(0);

  // Parser & Error state
  const [isParsing, setIsParsing] = useState<boolean>(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState<boolean>(false);

  // Viewport navigation (2D)
  const [view, setView] = useState({ zoom: 1, x: 0, y: 0 });
  const dragRef = useRef<{ x: number; y: number; panX: number; panY: number } | null>(null);

  const topUrl = useSvgUrl(parsedBoard?.render.stackup.top.svg);
  const bottomUrl = useSvgUrl(parsedBoard?.render.stackup.bottom.svg);

  // Pricing calculation
  const calculateCost = () => {
    const areaSqCm = ((boardWidth || 10) * (boardHeight || 10)) / 100;
    let basePricePerPiece = 14000;
    if (layersCount === 4) basePricePerPiece *= 2.2;
    if (layersCount >= 6) basePricePerPiece *= 3.8;
    if (selectedFinish === 'ENIG') basePricePerPiece += 12000;
    if (['black', 'white', 'purple'].includes(selectedColor)) basePricePerPiece += 3000;
    if (areaSqCm > 50) basePricePerPiece *= 1 + (areaSqCm - 50) * 0.015;

    const toolingCost = layersCount <= 2 ? 160000 : 320000;
    const totalVnd = Math.round((toolingCost + basePricePerPiece * quantity) / 1000) * 1000;
    const unitPriceVnd = Math.round(totalVnd / quantity);

    return {
      areaSqCm: areaSqCm.toFixed(1),
      totalVnd,
      unitPriceVnd,
      totalUsd: (totalVnd / 25400).toFixed(2),
    };
  };

  const pricing = calculateCost();

  const resetView = () => {
    setView({ zoom: 1, x: 0, y: 0 });
    setCameraResetKey(k => k + 1);
  };

  // Tăng mỗi khi đổi màu hoặc đổi bo, để kết quả đổi màu cũ không ghi đè bo mới
  const recolorSeq = useRef(0);

  // Tải 1 tệp nén (.zip/.rar) hoặc nhiều tệp lớp Gerber/Excellon rời
  const sourceFilesRef = useRef<File[]>([]);

  const handleFileUpload = async (files: File[]) => {
    if (files.length === 0) return;
    recolorSeq.current++;
    setIsParsing(true);
    setValidationError(null);

    try {
      const result = await parseGerberFiles(files, stackupColorsFor(selectedColor, selectedFinish));
      sourceFilesRef.current = files;
      setParsedBoard(result);
      setBoardWidth(parseFloat(result.widthMm.toFixed(2)));
      setBoardHeight(parseFloat(result.heightMm.toFixed(2)));
      setLayersCount(LAYER_OPTIONS.find(n => n >= result.copperLayerCount) ?? 2);
      resetView();
    } catch (err) {
      setValidationError(
        err instanceof GerberParseError
          ? err.message
          : `Lỗi khi đọc tệp Gerber: ${(err as Error)?.message || 'Tệp không tương thích hoặc bị lỗi'}.`
      );
    } finally {
      setIsParsing(false);
    }
  };

  const handleLoadDemoBoard = async () => {
    setIsParsing(true);
    setValidationError(null);
    try {
      const demoZip = await createDemoGerberZip();
      await handleFileUpload([demoZip]);
    } catch (err) {
      setValidationError(err instanceof Error ? err.message : 'Không tạo được bo mạch mẫu.');
      setIsParsing(false);
    }
  };

  // Đổi màu mask / lớp mạ: render lại từ dữ liệu đã parse (không đọc lại tệp)
  const boardRef = useRef(parsedBoard);
  boardRef.current = parsedBoard;
  useEffect(() => {
    const board = boardRef.current;
    if (!board) return;
    const seq = ++recolorSeq.current;
    recolorGerberBoard(board, stackupColorsFor(selectedColor, selectedFinish))
      .then(next => seq === recolorSeq.current && setParsedBoard(next))
      .catch(() => undefined);
  }, [selectedColor, selectedFinish]);

  const handleResetToUpload = () => {
    recolorSeq.current++;
    setParsedBoard(null);
    setValidationError(null);
    resetView();
  };

  // Zoom bằng con lăn chuột quanh vị trí con trỏ (cần listener non-passive để chặn cuộn trang)
  useEffect(() => {
    const el = viewportRef.current;
    if (!el || viewMode === '3d') return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const rect = el.getBoundingClientRect();
      const px = e.clientX - rect.left - rect.width / 2;
      const py = e.clientY - rect.top - rect.height / 2;
      setView(v => {
        const zoom = Math.min(20, Math.max(0.5, v.zoom * Math.exp(-e.deltaY * 0.0015)));
        const k = zoom / v.zoom;
        return { zoom, x: px - (px - v.x) * k, y: py - (py - v.y) * k };
      });
    };
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, [viewMode, parsedBoard !== null]);

  const zoomBy = useCallback((factor: number) => {
    setView(v => {
      const zoom = Math.min(20, Math.max(0.5, v.zoom * factor));
      const k = zoom / v.zoom;
      return { zoom, x: v.x * k, y: v.y * k };
    });
  }, []);

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (viewMode === '3d') return;
    e.currentTarget.setPointerCapture(e.pointerId);
    dragRef.current = { x: e.clientX, y: e.clientY, panX: view.x, panY: view.y };
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const d = dragRef.current;
    if (!d) return;
    setView(v => ({ ...v, x: d.panX + e.clientX - d.x, y: d.panY + e.clientY - d.y }));
  };

  const handlePointerUp = () => {
    dragRef.current = null;
  };

  const handleApplyConfig = () => {
    if (onApplyToQuote && parsedBoard) {
      onApplyToQuote({
        fileName: parsedBoard.fileName,
        width: boardWidth || parsedBoard.widthMm,
        height: boardHeight || parsedBoard.heightMm,
        color: selectedColor,
        finish: selectedFinish,
        layers: layersCount,
        quantity,
        estimatedPriceVnd: pricing.totalVnd,
        // Gửi kèm đúng tệp khách đã nạp để kỹ sư nhận được file Gerber thật
        files: sourceFilesRef.current,
      });
    }
  };

  const usedLayers = parsedBoard?.layers.filter(l => l.status !== 'ignored') ?? [];
  const ignoredCount = (parsedBoard?.layers.length ?? 0) - usedLayers.length;
  const hasDrill = parsedBoard?.layers.some(l => l.type === 'drill' && l.status === 'used') ?? false;
  const realW = parsedBoard?.widthMm ?? 0;
  const realH = parsedBoard?.heightMm ?? 0;

  const boardImage = (url: string | null, label: string) => (
    <figure className="flex flex-col items-center gap-2 min-w-0 min-h-0 h-full flex-1">
      {/* Ảnh SVG có kích thước gốc theo mm/inch rất nhỏ — cho giãn hết khung, giữ tỉ lệ bằng object-contain */}
      <div className="relative w-full flex-1 min-h-0">
        {url && (
          <img
            src={url}
            alt={label}
            draggable={false}
            className="absolute inset-0 w-full h-full object-contain drop-shadow-[0_6px_14px_rgba(15,23,42,0.35)] select-none"
          />
        )}
      </div>
      <figcaption className="text-[11px] font-bold font-mono text-slate-600 whitespace-nowrap">
        {label} · {realW.toFixed(2)} × {realH.toFixed(2)} mm
      </figcaption>
    </figure>
  );

  return (
    <section id="gerber-viewer" className="py-16 lg:py-24 bg-slate-950 relative border-t border-slate-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Top Product Tabs */}
        <div className="mb-6 flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
          <div className="px-5 py-2.5 rounded-xl bg-cyan-950/80 border border-cyan-500/60 text-cyan-300 font-bold text-xs flex items-center gap-2 whitespace-nowrap shadow-md">
            <Cpu className="w-4 h-4 text-cyan-400" />
            <span>Standard PCB / PCBA (JLCPCB Standard)</span>
          </div>
          <div className="px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 text-xs whitespace-nowrap">
            Advanced High-Density PCB
          </div>
          <div className="px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 text-xs whitespace-nowrap">
            SMT Stencil Laser Cut
          </div>
          <div className="px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 text-xs whitespace-nowrap">
            Flexible & Aluminum PCB
          </div>
        </div>

        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-cyan-400 font-mono tracking-wider uppercase mb-1.5">
              <Sparkles className="w-4 h-4" />
              <span>Online PCB Quote & Real Gerber DFM Inspection</span>
            </div>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-white tracking-tight">
              Kiểm Tra File Gerber Thực Tế & Mô Phỏng Sau Gia Công
            </h2>
            <p className="mt-2 text-sm text-slate-300 max-w-3xl">
              Hệ thống giải nén tệp Gerber (.zip / .rar), đọc trực tiếp các lớp RS-274X và Excellon để dựng ảnh 2D mặt trên / mặt dưới và mô hình 3D đúng với dữ liệu thiết kế: đường mạch, pad, vùng đổ đồng, lỗ khoan, silkscreen và hình dạng bo.
            </p>
          </div>

          {parsedBoard && (
            <div className="shrink-0 flex items-center gap-3">
              <button
                onClick={handleResetToUpload}
                className="px-4 py-2.5 text-xs font-semibold text-cyan-300 bg-slate-900 hover:bg-slate-800 border border-cyan-500/50 rounded-lg shadow transition-all flex items-center gap-2 whitespace-nowrap font-mono"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Tải Lên Tệp Gerber Khác</span>
              </button>
            </div>
          )}
        </div>

        {/* VALIDATION ERROR ALERT */}
        {validationError && (
          <div className="mb-8 p-5 rounded-2xl bg-red-950/80 border border-red-500/80 text-xs text-red-200 shadow-xl flex items-start gap-4 animate-in fade-in">
            <div className="p-2.5 rounded-xl bg-red-900/60 text-red-300 shrink-0">
              <FileX2 className="w-6 h-6" />
            </div>
            <div className="space-y-2 flex-1">
              <div className="font-bold text-red-100 text-sm flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-red-400" />
                <span>KHÔNG ĐỌC ĐƯỢC TỆP GERBER</span>
              </div>
              <p className="leading-relaxed text-red-200">
                {validationError}
              </p>
              <div className="pt-2 text-[11px] text-red-300/90 font-mono bg-red-950/40 p-3 rounded-lg border border-red-900/50">
                💡 <strong>Yêu cầu tệp Gerber:</strong> Tệp nén .zip hoặc .rar cần chứa các lớp bo mạch CAM như: Top Copper (.GTL), Bottom Copper (.GBL), Solder Mask (.GTS/.GBS), Silkscreen (.GTO/.GBO), Board Outline (.GKO/.GM1/Edge_Cuts), và tệp khoan lỗ (.DRL/.TXT).
              </div>
            </div>
            <button
              onClick={() => setValidationError(null)}
              className="px-3 py-1.5 text-xs rounded-lg bg-red-900/70 hover:bg-red-800 text-red-200 font-mono transition-colors"
            >
              Đóng
            </button>
          </div>
        )}

        {/* 1. STATE: NO GERBER LOADED YET -> SHOW DEDICATED UPLOAD DROPZONE */}
        {!parsedBoard ? (
          <div className="bg-slate-900/70 border border-slate-800 rounded-3xl p-8 sm:p-12 text-center shadow-2xl relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-b from-cyan-950/10 to-transparent pointer-events-none" />

            <div
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragOver(true);
              }}
              onDragLeave={() => setIsDragOver(false)}
              onDrop={(e) => {
                e.preventDefault();
                setIsDragOver(false);
                if (!isParsing) handleFileUpload(Array.from(e.dataTransfer.files));
              }}
              className={`max-w-2xl mx-auto border-2 border-dashed rounded-2xl p-10 sm:p-14 transition-all duration-200 ${
                isDragOver
                  ? 'border-cyan-400 bg-cyan-950/30 scale-[1.01]'
                  : 'border-slate-700 bg-slate-950/60 hover:border-cyan-500/70 hover:bg-slate-900/50'
              }`}
            >
              <div className="w-16 h-16 mx-auto mb-5 rounded-2xl bg-cyan-950/80 border border-cyan-500/40 flex items-center justify-center text-cyan-400 shadow-lg shadow-cyan-500/10">
                {isParsing ? (
                  <RefreshCw className="w-8 h-8 animate-spin" />
                ) : (
                  <UploadCloud className="w-8 h-8" />
                )}
              </div>

              <h3 className="text-xl sm:text-2xl font-bold text-white mb-2">
                {isParsing ? 'Đang Giải Nén & Phân Tích Tệp Gerber...' : 'Tải Lên Tệp Nén Gerber (.zip / .rar)'}
              </h3>
              <p className="text-sm text-slate-300 mb-6 max-w-md mx-auto">
                Kéo thả tệp nén Gerber, hoặc chọn cùng lúc nhiều tệp lớp rời (.GTL, .GBL, .DRL, ...), để xem 2D / 3D đúng thực tế, đổi màu sơn phủ và kiểm tra kích thước bo.
              </p>

              <div className="flex flex-wrap items-center justify-center gap-3">
                <label className="inline-flex items-center gap-2.5 px-6 py-3.5 text-xs font-bold text-slate-950 bg-gradient-to-r from-cyan-400 to-cyan-300 hover:from-cyan-300 hover:to-cyan-200 rounded-xl shadow-lg shadow-cyan-500/25 cursor-pointer transition-all uppercase tracking-wider font-mono">
                  <FileCode className="w-4 h-4" />
                  <span>{isParsing ? 'Đang xử lý...' : 'Chọn Tệp Từ Máy Tính'}</span>
                  <input
                    type="file"
                    multiple
                    className="hidden"
                    disabled={isParsing}
                    onChange={(e) => {
                      const files = Array.from(e.target.files ?? []);
                      e.target.value = '';
                      handleFileUpload(files);
                    }}
                  />
                </label>

                <button
                  type="button"
                  onClick={handleLoadDemoBoard}
                  disabled={isParsing}
                  className="inline-flex items-center gap-2 px-5 py-3.5 text-xs font-bold text-cyan-300 bg-cyan-950/60 hover:bg-cyan-900/60 border border-cyan-500/40 hover:border-cyan-400 rounded-xl shadow-lg shadow-cyan-950/50 cursor-pointer transition-all uppercase tracking-wider font-mono"
                >
                  <Sparkles className="w-4 h-4 text-cyan-400" />
                  <span>{isParsing ? 'Đang nạp...' : 'Xem Thử Bo Mạch Mẫu'}</span>
                </button>
              </div>

              {/* Supported formats */}
              <div className="mt-8 pt-6 border-t border-slate-800 text-xs text-slate-400 flex flex-wrap items-center justify-center gap-3 font-mono">
                <span className="text-slate-500">Định dạng hỗ trợ:</span>
                <span className="px-2 py-1 rounded bg-slate-900 border border-slate-800 text-cyan-300">.ZIP</span>
                <span className="px-2 py-1 rounded bg-slate-900 border border-slate-800 text-cyan-300">.RAR</span>
                <span className="px-2 py-1 rounded bg-slate-900 border border-slate-800 text-slate-300">.GTL / .GBL / .GBR</span>
                <span className="px-2 py-1 rounded bg-slate-900 border border-slate-800 text-slate-300">.DRL / .TXT</span>
                <span className="px-2 py-1 rounded bg-slate-900 border border-slate-800 text-slate-300">Altium / KiCad / EasyEDA / Eagle</span>
              </div>
            </div>

            {/* Checklist of what system extracts */}
            <div className="mt-10 grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-3xl mx-auto text-left">
              <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 text-xs">
                <div className="font-bold text-cyan-300 mb-1 font-mono flex items-center gap-1.5">
                  <Check className="w-4 h-4 text-emerald-400" />
                  <span>Kích Thước Chuẩn Xác</span>
                </div>
                <p className="text-slate-400">Đo chiều dài × chiều rộng từ đường bao viền mạch thật (Board Outline / GKO / Edge_Cuts), giữ nguyên bo góc và khe cắt.</p>
              </div>

              <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 text-xs">
                <div className="font-bold text-cyan-300 mb-1 font-mono flex items-center gap-1.5">
                  <Check className="w-4 h-4 text-emerald-400" />
                  <span>Tracks, Vias & Pads</span>
                </div>
                <p className="text-slate-400">Hiển thị đúng pad, vùng đổ đồng, đường mạch, lỗ khoan / lỗ oval và silkscreen từ dữ liệu RS-274X / Excellon.</p>
              </div>

              <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 text-xs">
                <div className="font-bold text-cyan-300 mb-1 font-mono flex items-center gap-1.5">
                  <Check className="w-4 h-4 text-emerald-400" />
                  <span>Xem 3D & 7 Màu Sơn</span>
                </div>
                <p className="text-slate-400">Xoay mô hình 3D theo độ dày bo, đổi màu sơn phủ và lớp mạ HASL/ENIG/OSP trước khi gia công.</p>
              </div>
            </div>

          </div>
        ) : (
          /* 2. STATE: GERBER LOADED SUCCESSFULLY -> DISPLAY WORKSPACE & SPECIFICATIONS */
          <div className="space-y-8 animate-in fade-in">

            {/* Success Status Banner */}
            <div className="p-4 rounded-2xl bg-slate-900/90 border border-cyan-500/40 flex flex-wrap items-center justify-between gap-4 text-xs font-mono shadow-xl">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-emerald-950 border border-emerald-500/50 flex items-center justify-center text-emerald-400">
                  <Check className="w-5 h-5" />
                </div>
                <div>
                  <div className="font-bold text-white text-sm">
                    {parsedBoard.fileName} <span className="text-slate-400 text-xs">({parsedBoard.fileSizeFormatted})</span>
                  </div>
                  <div className="text-cyan-300 text-[11px]">
                    Đã nhận diện: {parsedBoard.copperLayerCount} lớp đồng · Kích thước: {realW.toFixed(2)} × {realH.toFixed(2)} mm ({(realW / 25.4).toFixed(3)} × {(realH / 25.4).toFixed(3)} inches)
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleResetToUpload}
                  className="px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-700 hover:border-cyan-400 text-slate-300 hover:text-white transition-colors flex items-center gap-1.5"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Tải tệp khác</span>
                </button>
              </div>
            </div>

            {(!parsedBoard.outlineFile || !hasDrill) && (
              <div className="p-3 rounded-xl bg-amber-950/60 border border-amber-500/50 text-[11px] text-amber-200 font-mono flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                <span>
                  {!parsedBoard.outlineFile && 'Không tìm thấy đường bao bo (outline) khép kín — hình dạng bo đang lấy theo khung bao chữ nhật của các lớp. '}
                  {!hasDrill && 'Không có tệp khoan (.DRL / .TXT) — ảnh sẽ không có lỗ khoan; hãy xuất thêm NC Drill khi gửi gia công.'}
                </span>
              </div>
            )}

            {/* MAIN VISUALIZER WORKSPACE */}
            <div className="bg-slate-900/70 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl">

              {/* Top Bar of Canvas */}
              <div className="p-4 bg-slate-950/90 border-b border-slate-800 flex flex-wrap items-center justify-between gap-4 text-xs">
                <div className="flex items-center gap-2 font-mono min-w-0">
                  <span className="font-bold text-white uppercase tracking-wider truncate">
                    Online PCB Preview: <span className="text-cyan-400">{parsedBoard.fileName}</span>
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <div className="flex items-center gap-1 p-1 bg-slate-900 rounded-lg border border-slate-800 text-[11px] font-mono">
                    <button
                      onClick={() => setViewMode('side-by-side')}
                      className={`px-3 py-1 rounded-md font-semibold transition-colors flex items-center gap-1.5 ${
                        viewMode === 'side-by-side' ? 'bg-cyan-500 text-slate-950 shadow-sm' : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      <Columns className="w-3 h-3" />
                      <span>Song Song</span>
                    </button>
                    <button
                      onClick={() => setViewMode('top')}
                      className={`px-2.5 py-1 rounded-md transition-colors ${
                        viewMode === 'top' ? 'bg-cyan-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      Mặt Trên
                    </button>
                    <button
                      onClick={() => setViewMode('bottom')}
                      className={`px-2.5 py-1 rounded-md transition-colors ${
                        viewMode === 'bottom' ? 'bg-cyan-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      Mặt Dưới
                    </button>
                    <button
                      onClick={() => setViewMode('3d')}
                      className={`px-2.5 py-1 rounded-md transition-colors flex items-center gap-1.5 ${
                        viewMode === '3d' ? 'bg-cyan-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      <Box className="w-3 h-3" />
                      <span>3D</span>
                    </button>
                  </div>

                  {viewMode === '3d' ? (
                    <div className="flex items-center gap-1 p-1 bg-slate-900 rounded-lg border border-slate-800 text-[11px] font-mono">
                      {([['iso', 'Góc nghiêng'], ['top', 'Nhìn trên'], ['bottom', 'Nhìn dưới']] as const).map(([key, label]) => (
                        <button
                          key={key}
                          onClick={() => {
                            setCameraPreset(key);
                            setCameraResetKey(k => k + 1);
                          }}
                          className={`px-2.5 py-1 rounded-md transition-colors ${
                            cameraPreset === key ? 'bg-slate-700 text-white font-bold' : 'text-slate-400 hover:text-white'
                          }`}
                        >
                          {label}
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => zoomBy(1.25)}
                        className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 hover:text-white"
                        title="Phóng to"
                      >
                        <ZoomIn className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => zoomBy(0.8)}
                        className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 hover:text-white"
                        title="Thu nhỏ"
                      >
                        <ZoomOut className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                  <button
                    onClick={resetView}
                    className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 hover:text-white"
                    title="Đặt lại góc nhìn"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Viewport */}
              <div
                ref={viewportRef}
                className={`relative aspect-[4/3] sm:aspect-[16/9] lg:aspect-[21/9] w-full overflow-hidden touch-none ${
                  viewMode === '3d'
                    ? 'bg-gradient-to-b from-slate-700 via-slate-800 to-slate-950'
                    : 'bg-slate-100 cursor-grab active:cursor-grabbing'
                }`}
                onPointerDown={handlePointerDown}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
                onPointerCancel={handlePointerUp}
              >
                {viewMode === '3d' ? (
                  <Suspense
                    fallback={
                      <div className="absolute inset-0 flex items-center justify-center text-cyan-300 text-xs font-mono gap-2">
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>Đang tải trình xem 3D...</span>
                      </div>
                    }
                  >
                    <Board3DView
                      board={parsedBoard.render}
                      thicknessMm={parseFloat(pcbThickness) || 1.6}
                      edgeColor={MASK_COLORS[selectedColor].edge}
                      preset={cameraPreset}
                      resetKey={cameraResetKey}
                    />
                  </Suspense>
                ) : (
                  <div
                    className="absolute inset-0 flex items-stretch gap-8 p-6 sm:p-10"
                    style={{ transform: `translate(${view.x}px, ${view.y}px) scale(${view.zoom})` }}
                  >
                    {viewMode !== 'bottom' && boardImage(topUrl, 'TOP LAYER (Mặt Trên)')}
                    {viewMode !== 'top' && boardImage(bottomUrl, 'BOTTOM LAYER (Mặt Dưới, nhìn từ dưới lên)')}
                  </div>
                )}

                <div className={`absolute top-3 left-3 text-[11px] font-mono shadow px-2.5 py-1 rounded-md border pointer-events-none ${
                  viewMode === '3d' ? 'text-slate-200 bg-slate-900/80 border-slate-700' : 'text-slate-600 bg-white/90 border-slate-300'
                }`}>
                  {viewMode === '3d'
                    ? 'Kéo chuột trái để xoay · Chuột phải để di chuyển · Cuộn để phóng to/thu nhỏ'
                    : 'Kéo chuột để di chuyển (Pan) · Cuộn chuột hoặc nút kính lúp để Phóng to/Thu nhỏ (Zoom)'}
                </div>
                {viewMode !== '3d' && (
                  <div className="absolute bottom-3 right-3 text-[11px] font-mono text-slate-500 bg-white/80 px-2 py-0.5 rounded pointer-events-none">
                    {Math.round(view.zoom * 100)}%
                  </div>
                )}
              </div>

              {/* Layer list details drawer */}
              <div className="p-4 bg-slate-950 border-t border-slate-800">
                <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                  <span className="text-xs font-bold text-slate-300 font-mono flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Các lớp trong tệp ({usedLayers.length} lớp Gerber/Drill{ignoredCount > 0 ? `, ${ignoredCount} tệp khác bỏ qua` : ''}):</span>
                  </span>
                  <span className="text-[11px] text-cyan-400 font-mono">
                    {hasDrill
                      ? `${parsedBoard.holeCount} lỗ khoan${parsedBoard.minHoleMm ? ` · lỗ nhỏ nhất Ø${parsedBoard.minHoleMm.toFixed(2)} mm` : ''}`
                      : 'Không có tệp khoan'}
                    {parsedBoard.outlineFile && ` · Outline: ${baseName(parsedBoard.outlineFile)}`}
                  </span>
                </div>
                <div className="flex flex-wrap gap-2 text-[11px] font-mono">
                  {usedLayers.map((layer) => {
                    const st = STATUS_STYLE[layer.status];
                    return (
                      <div
                        key={layer.fileName}
                        title={layer.fileName}
                        className="px-2.5 py-1 rounded-md bg-slate-900 border border-slate-800 flex items-center gap-1.5"
                      >
                        <span className={`w-2 h-2 rounded-full ${st.dot}`} />
                        <span className={st.text}>{layer.label}</span>
                        <span className="text-slate-500 font-normal">{baseName(layer.fileName)}{st.note && ` · ${st.note}`}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

            </div>

            {/* JLCPCB SPECIFICATION CONFIGURATION FORM */}
            <div className="p-6 sm:p-8 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-6">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Sliders className="w-4 h-4 text-cyan-400" />
                  <span>Thông Số Kỹ Thuật Đặt Hàng (PCB Specifications)</span>
                </h3>
                <span className="text-xs text-slate-400 font-mono">Đồng bộ tự động từ tệp Gerber</span>
              </div>

              {/* Row 1: Base Material */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center text-xs">
                <div className="md:col-span-3 font-semibold text-slate-300">
                  Vật liệu nền (Base Material):
                </div>
                <div className="md:col-span-9 flex flex-wrap gap-2">
                  {(['FR-4', 'Flex', 'Aluminum', 'Copper Core', 'Rogers', 'PTFE Teflon', 'HDI'] as BaseMaterial[]).map((mat) => (
                    <button
                      key={mat}
                      type="button"
                      onClick={() => setBaseMaterial(mat)}
                      className={`px-3.5 py-1.5 rounded-lg border font-mono font-medium transition-colors ${
                        baseMaterial === mat
                          ? 'bg-cyan-950 border-cyan-400 text-cyan-300 font-bold shadow-sm'
                          : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      {mat}
                    </button>
                  ))}
                </div>
              </div>

              {/* Row 2: Layers */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center text-xs">
                <div className="md:col-span-3 font-semibold text-slate-300">
                  Số lớp mạch (Layers):
                </div>
                <div className="md:col-span-9 flex flex-wrap items-center gap-2">
                  {LAYER_OPTIONS.map((l) => (
                    <button
                      key={l}
                      type="button"
                      onClick={() => setLayersCount(l)}
                      className={`w-9 h-8 rounded-lg border font-mono font-bold transition-colors ${
                        layersCount === l
                          ? 'bg-cyan-500 text-slate-950 border-cyan-400 shadow-sm'
                          : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      {l}
                    </button>
                  ))}
                  <span className="text-[11px] font-mono text-cyan-400 ml-2">
                    Phát hiện {parsedBoard.copperLayerCount} lớp đồng trong tệp
                  </span>
                </div>
              </div>

              {/* Row 3: Dimensions */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center text-xs">
                <div className="md:col-span-3 font-semibold text-slate-300">
                  Kích thước bo (Dimensions):
                </div>
                <div className="md:col-span-9 flex flex-wrap items-center gap-3">
                  <div className="flex items-center gap-1.5 bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5">
                    <input
                      type="number"
                      step="0.01"
                      value={boardWidth}
                      onChange={(e) => setBoardWidth(parseFloat(e.target.value) || 10)}
                      className="w-16 bg-transparent text-cyan-300 font-mono font-bold focus:outline-none"
                    />
                    <span className="text-slate-500 font-mono">mm</span>
                  </div>
                  <span className="text-slate-500 font-mono font-bold">*</span>
                  <div className="flex items-center gap-1.5 bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5">
                    <input
                      type="number"
                      step="0.01"
                      value={boardHeight}
                      onChange={(e) => setBoardHeight(parseFloat(e.target.value) || 10)}
                      className="w-16 bg-transparent text-cyan-300 font-mono font-bold focus:outline-none"
                    />
                    <span className="text-slate-500 font-mono">mm</span>
                  </div>
                  <span className="text-slate-400 font-mono text-[11px]">
                    (~{(boardWidth / 25.4).toFixed(3)} × {(boardHeight / 25.4).toFixed(3)} inches)
                  </span>
                </div>
              </div>

              {/* Row 4: PCB Color (Solder Mask - Exact 7 colors from JLCPCB) */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center text-xs">
                <div className="md:col-span-3 font-semibold text-slate-300">
                  Màu sơn phủ hàn (PCB Color):
                </div>
                <div className="md:col-span-9 flex flex-wrap gap-2.5">
                  {(Object.keys(MASK_COLORS) as SolderMaskColor[]).map((cKey) => {
                    const isSelected = selectedColor === cKey;
                    const c = MASK_COLORS[cKey];
                    return (
                      <button
                        key={cKey}
                        type="button"
                        onClick={() => setSelectedColor(cKey)}
                        className={`px-3 py-1.5 rounded-lg border font-mono text-xs flex items-center gap-2 transition-all ${
                          isSelected
                            ? 'bg-cyan-950 border-cyan-400 text-white font-bold ring-1 ring-cyan-400'
                            : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                        }`}
                      >
                        <span
                          className="w-3.5 h-3.5 rounded-full border border-white/20"
                          style={{ backgroundColor: c.swatch }}
                        />
                        <span>{c.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Row 5: Surface Finish (Exact options from JLCPCB) */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center text-xs">
                <div className="md:col-span-3 font-semibold text-slate-300">
                  Mạ tiếp điểm (Surface Finish):
                </div>
                <div className="md:col-span-9 flex flex-wrap gap-2">
                  {(['OSP', 'HASL', 'LeadFree_HASL', 'ENIG'] as SurfaceFinish[]).map((fKey) => {
                    const isSelected = selectedFinish === fKey;
                    const f = FINISHES[fKey];
                    return (
                      <button
                        key={fKey}
                        type="button"
                        onClick={() => setSelectedFinish(fKey)}
                        className={`px-3 py-1.5 rounded-lg border font-mono text-xs flex items-center gap-2 transition-all ${
                          isSelected
                            ? 'bg-cyan-950 border-cyan-400 text-white font-bold ring-1 ring-cyan-400'
                            : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                        }`}
                      >
                        <span
                          className="w-3 h-3 rounded-full border border-black/40"
                          style={{ backgroundColor: f.cf }}
                        />
                        <span>{f.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Row 6: PCB Thickness */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center text-xs">
                <div className="md:col-span-3 font-semibold text-slate-300">
                  Độ dày bo (PCB Thickness):
                </div>
                <div className="md:col-span-9 flex flex-wrap gap-2">
                  {['0.4mm', '0.6mm', '0.8mm', '1.0mm', '1.2mm', '1.6mm', '2.0mm'].map((th) => (
                    <button
                      key={th}
                      type="button"
                      onClick={() => setPcbThickness(th)}
                      className={`px-3 py-1.5 rounded-lg border font-mono text-xs transition-colors ${
                        pcbThickness === th
                          ? 'bg-cyan-500 text-slate-950 border-cyan-400 font-bold'
                          : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      {th}
                    </button>
                  ))}
                </div>
              </div>

              {/* Row 7: Quantity */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center text-xs">
                <div className="md:col-span-3 font-semibold text-slate-300">
                  Số lượng gia công (PCB Qty):
                </div>
                <div className="md:col-span-9 flex flex-wrap gap-2">
                  {[5, 10, 15, 20, 25, 50, 100].map((qty) => (
                    <button
                      key={qty}
                      type="button"
                      onClick={() => setQuantity(qty)}
                      className={`px-3.5 py-1.5 rounded-lg border font-mono font-bold text-xs transition-colors ${
                        quantity === qty
                          ? 'bg-cyan-500 text-slate-950 border-cyan-400 shadow-sm'
                          : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      {qty}
                    </button>
                  ))}
                </div>
              </div>

              {/* Final Bottom Calculation Strip & Action */}
              <div className="pt-6 border-t border-slate-800 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-6">
                <div className="flex items-center gap-6">
                  <div>
                    <div className="text-[11px] text-slate-400 font-mono">Dự toán gia công ({quantity} pcs):</div>
                    <div className="text-2xl font-black text-cyan-400 font-mono tabular-nums mt-0.5">
                      {pricing.totalVnd.toLocaleString('vi-VN')} <span className="text-sm font-normal text-slate-300">VND</span>
                      <span className="text-xs font-mono text-slate-400 ml-2">(~${pricing.totalUsd})</span>
                    </div>
                  </div>

                  <div className="hidden sm:block border-l border-slate-800 pl-6 text-xs text-slate-400 font-mono">
                    <div>Đơn giá: <strong className="text-white">{pricing.unitPriceVnd.toLocaleString('vi-VN')} VND / bo</strong></div>
                    <div>Thời gian hoàn thành: <strong>3 - 5 ngày làm việc</strong></div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleApplyConfig}
                  className="px-6 py-3 font-bold text-xs text-slate-950 bg-gradient-to-r from-cyan-400 to-cyan-300 hover:from-cyan-300 hover:to-cyan-200 rounded-xl shadow-lg shadow-cyan-500/25 transition-all flex items-center justify-center gap-2 whitespace-nowrap"
                >
                  <span>Áp Dụng Cấu Hình Vào Phiếu Báo Giá Kỹ Thuật</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>

            </div>

          </div>
        )}

      </div>
    </section>
  );
};
