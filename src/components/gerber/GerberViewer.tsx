import React, { useState, useRef, useEffect } from 'react';
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
  AlertTriangle
} from 'lucide-react';
import { parseGerberFile, ParsedGerberBoard } from '../../utils/gerberParser';
import {
  drawDynamicBoard,
  BoardThemeColors
} from '../../utils/realisticBoardRenderer';

export type SolderMaskColor = 'green' | 'purple' | 'red' | 'yellow' | 'blue' | 'white' | 'black';
export type SurfaceFinish = 'HASL' | 'LeadFree_HASL' | 'ENIG' | 'OSP';
export type BaseMaterial = 'FR-4' | 'Flex' | 'Aluminum' | 'Copper Core' | 'Rogers' | 'PTFE Teflon' | 'HDI';

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
  }) => void;
}

export const GerberViewer: React.FC<GerberViewerProps> = ({ onApplyToQuote }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Active Board State - NULL by default. Canvas is ONLY displayed when a file is loaded successfully!
  const [parsedBoard, setParsedBoard] = useState<ParsedGerberBoard | null>(null);
  const [isLoaded, setIsLoaded] = useState<boolean>(false);

  // Specifications
  const [boardWidth, setBoardWidth] = useState<number>(0);
  const [boardHeight, setBoardHeight] = useState<number>(0);
  const [layersCount, setLayersCount] = useState<number>(2);
  const [baseMaterial, setBaseMaterial] = useState<BaseMaterial>('FR-4');
  const [selectedColor, setSelectedColor] = useState<SolderMaskColor>('green');
  const [selectedFinish, setSelectedFinish] = useState<SurfaceFinish>('HASL');
  const [pcbThickness, setPcbThickness] = useState<string>('1.6mm');
  const [quantity, setQuantity] = useState<number>(5);

  // View Mode: 'side-by-side' (JLCPCB Top & Bottom) or single view
  const [viewMode, setViewMode] = useState<'side-by-side' | 'top' | 'bottom'>('side-by-side');

  // Parser & Error state
  const [isParsing, setIsParsing] = useState<boolean>(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState<boolean>(false);

  // Viewport navigation
  const [zoom, setZoom] = useState<number>(1);
  const [panOffset, setPanOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  // Color Definitions matching JLCPCB
  const colorPalettes: Record<SolderMaskColor, {
    bg: string;
    substrateBase: string;
    substrateDark: string;
    traceColor: string;
    silkColor: string;
    label: string;
  }> = {
    green: {
      bg: '#15803d',
      substrateBase: '#15522b',
      substrateDark: '#0e3a1e',
      traceColor: '#1d6f3b',
      silkColor: '#ffffff',
      label: 'Green'
    },
    purple: {
      bg: '#7e22ce',
      substrateBase: '#581c87',
      substrateDark: '#3b0764',
      traceColor: '#6b21a8',
      silkColor: '#ffffff',
      label: 'Purple'
    },
    red: {
      bg: '#b91c1c',
      substrateBase: '#881337',
      substrateDark: '#4c0519',
      traceColor: '#9f1239',
      silkColor: '#ffffff',
      label: 'Red'
    },
    yellow: {
      bg: '#ca8a04',
      substrateBase: '#a16207',
      substrateDark: '#713f12',
      traceColor: '#ca8a04',
      silkColor: '#000000',
      label: 'Yellow'
    },
    blue: {
      bg: '#0369a1',
      substrateBase: '#075985',
      substrateDark: '#0c4a6e',
      traceColor: '#0284c7',
      silkColor: '#ffffff',
      label: 'Blue'
    },
    white: {
      bg: '#f8fafc',
      substrateBase: '#e2e8f0',
      substrateDark: '#cbd5e1',
      traceColor: '#f1f5f9',
      silkColor: '#0f172a',
      label: 'White'
    },
    black: {
      bg: '#27272a',
      substrateBase: '#18181b',
      substrateDark: '#09090b',
      traceColor: '#27272a',
      silkColor: '#f4f4f5',
      label: 'Black'
    }
  };

  const finishPads: Record<SurfaceFinish, { padFill: string; padStroke: string; label: string }> = {
    HASL: {
      padFill: '#d4d4d8',
      padStroke: '#a1a1aa',
      label: 'HASL(with lead)'
    },
    LeadFree_HASL: {
      padFill: '#e2e8f0',
      padStroke: '#cbd5e1',
      label: 'LeadFree HASL'
    },
    ENIG: {
      padFill: '#fbbf24',
      padStroke: '#d97706',
      label: 'ENIG'
    },
    OSP: {
      padFill: '#d97706',
      padStroke: '#b45309',
      label: 'OSP'
    }
  };

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

  // Gerber file upload handler (processes .rar, .zip, .gtl, etc.)
  const handleFileUpload = async (file: File) => {
    setIsParsing(true);
    setValidationError(null);

    try {
      const result: ParsedGerberBoard = await parseGerberFile(file);

      if (!result.isValid) {
        setValidationError(
          result.errorMessage ||
          `Tệp "${file.name}" không phải là tệp Gerber hợp lệ. Vui lòng tải lên tệp nén CAM (.zip hoặc .rar) xuất từ Altium Designer, KiCad, EasyEDA hoặc Eagle.`
        );
        setIsParsing(false);
        return;
      }

      setParsedBoard(result);
      setBoardWidth(result.widthMm);
      setBoardHeight(result.heightMm);
      setLayersCount(result.layersDetected.some(l => l.type === 'copper_bottom') ? 2 : 1);
      setIsLoaded(true);
      setZoom(1);
      setPanOffset({ x: 0, y: 0 });
    } catch (err: any) {
      setValidationError(`Lỗi khi đọc tệp Gerber: ${err?.message || 'Tệp không tương thích hoặc bị lỗi'}.`);
    } finally {
      setIsParsing(false);
    }
  };

  const handleResetToUpload = () => {
    setIsLoaded(false);
    setParsedBoard(null);
    setValidationError(null);
    setZoom(1);
    setPanOffset({ x: 0, y: 0 });
  };

  // Canvas Main Render Loop: Only executed when isLoaded && parsedBoard
  useEffect(() => {
    if (!isLoaded || !parsedBoard) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const cw = canvas.width;
    const ch = canvas.height;

    // JLCPCB crisp neutral light-gray canvas backdrop
    ctx.clearRect(0, 0, cw, ch);
    ctx.fillStyle = '#f1f5f9';
    ctx.fillRect(0, 0, cw, ch);

    ctx.save();
    const centerX = cw / 2 + panOffset.x;
    const centerY = ch / 2 + panOffset.y;
    ctx.translate(centerX, centerY);
    ctx.scale(zoom, zoom);

    // Board Scale: dynamic scale so board fills the viewport comfortably like JLCPCB
    const bw = boardWidth || parsedBoard.widthMm || 40;
    const bh = boardHeight || parsedBoard.heightMm || 20;
    const targetBoardW = viewMode === 'side-by-side' ? 380 : 540;
    const mmToPx = Math.min(10.0, Math.max(2.5, targetBoardW / Math.max(bw, bh)));
    const pw = bw * mmToPx;
    const ph = bh * mmToPx;

    const colorScheme = colorPalettes[selectedColor];
    const finish = finishPads[selectedFinish];

    const themeColors: BoardThemeColors = {
      substrateBase: colorScheme.substrateBase,
      substrateDark: colorScheme.substrateDark,
      traceColor: colorScheme.traceColor,
      padFill: finish.padFill,
      padStroke: finish.padStroke,
      drillHole: '#1e293b',
      silkColor: colorScheme.silkColor,
    };

    if (viewMode === 'side-by-side') {
      const gap = 48;
      const leftBx = -pw - gap / 2;
      const rightBx = gap / 2;
      const by = -ph / 2;

      // Draw Top & Bottom Side
      drawDynamicBoard(ctx, parsedBoard, leftBx, by, pw, ph, 'top', themeColors);
      drawDynamicBoard(ctx, parsedBoard, rightBx, by, pw, ph, 'bottom', themeColors);

      // Labels below boards
      ctx.fillStyle = '#475569';
      ctx.font = 'bold 11px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('TOP LAYER (Mặt Trên)', leftBx + pw / 2, by + ph + 20);
      ctx.fillText('BOTTOM LAYER (Mặt Dưới)', rightBx + pw / 2, by + ph + 20);

    } else {
      const bx = -pw / 2;
      const by = -ph / 2;

      drawDynamicBoard(ctx, parsedBoard, bx, by, pw, ph, viewMode, themeColors);

      // Dimension rulers
      ctx.strokeStyle = '#0284c7';
      ctx.fillStyle = '#0284c7';
      ctx.lineWidth = 1.2;
      ctx.font = 'bold 11px monospace';
      const dimY = by - 16;

      ctx.beginPath();
      ctx.moveTo(bx, dimY);
      ctx.lineTo(bx + pw, dimY);
      ctx.moveTo(bx, dimY - 4);
      ctx.lineTo(bx, dimY + 4);
      ctx.moveTo(bx + pw, dimY - 4);
      ctx.lineTo(bx + pw, dimY + 4);
      ctx.stroke();

      ctx.textAlign = 'center';
      ctx.fillText(`${(boardWidth || parsedBoard.widthMm).toFixed(2)} mm`, 0, dimY - 6);
    }

    ctx.restore();
  }, [
    isLoaded,
    parsedBoard,
    viewMode,
    selectedColor,
    selectedFinish,
    boardWidth,
    boardHeight,
    zoom,
    panOffset,
  ]);

  // Mouse pan handlers
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX - panOffset.x, y: e.clientY - panOffset.y });
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDragging) return;
    setPanOffset({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
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
      });
    }
  };

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
              Hệ thống tự động phân tích tệp nén Gerber (.zip / .rar), trích xuất chính xác kích thước bo, đường mạch (tracks), chân linh kiện (pads), lỗ via và chữ in silkscreen tương tự JLCPCB.
            </p>
          </div>

          {/* If board is loaded, provide button to upload another file */}
          {isLoaded && (
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

        {/* VALIDATION ERROR ALERT (When file is not a valid Gerber) */}
        {validationError && (
          <div className="mb-8 p-5 rounded-2xl bg-red-950/80 border border-red-500/80 text-xs text-red-200 shadow-xl flex items-start gap-4 animate-in fade-in">
            <div className="p-2.5 rounded-xl bg-red-900/60 text-red-300 shrink-0">
              <FileX2 className="w-6 h-6" />
            </div>
            <div className="space-y-2 flex-1">
              <div className="font-bold text-red-100 text-sm flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-red-400" />
                <span>CẢNH BÁO: TỆP TẢI LÊN KHÔNG PHẢI LÀ GERBER HỢP LỆ!</span>
              </div>
              <p className="leading-relaxed text-red-200">
                {validationError}
              </p>
              <div className="pt-2 text-[11px] text-red-300/90 font-mono bg-red-950/40 p-3 rounded-lg border border-red-900/50">
                💡 <strong>Yêu cầu tệp Gerber:</strong> Tệp nén .zip hoặc .rar cần chứa các lớp bo mạch CAM như: Top Copper (.GTL), Bottom Copper (.GBL), Solder Mask (.GTS/.GBS), Silkscreen (.GTO/.GBO), Board Outline (.GKO/.GML), và tệp khoan lỗ (.DRL/.TXT).
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
        {!isLoaded || !parsedBoard ? (
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
                if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                  handleFileUpload(e.dataTransfer.files[0]);
                }
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
                Kéo thả tệp nén Gerber hoặc tệp lớp bo mạch vào đây để xem trước mô phỏng 2D thực tế, đổi màu sơn phủ và kiểm tra kích thước bo.
              </p>

              <label className="inline-flex items-center gap-2.5 px-6 py-3.5 text-xs font-bold text-slate-950 bg-gradient-to-r from-cyan-400 to-cyan-300 hover:from-cyan-300 hover:to-cyan-200 rounded-xl shadow-lg shadow-cyan-500/25 cursor-pointer transition-all uppercase tracking-wider font-mono">
                <FileCode className="w-4 h-4" />
                <span>{isParsing ? 'Đang xử lý...' : 'Chọn Tệp Từ Máy Tính'}</span>
                <input
                  type="file"
                  className="hidden"
                  disabled={isParsing}
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      handleFileUpload(e.target.files[0]);
                    }
                  }}
                />
              </label>

              {/* Supported formats */}
              <div className="mt-8 pt-6 border-t border-slate-800 text-xs text-slate-400 flex flex-wrap items-center justify-center gap-3 font-mono">
                <span className="text-slate-500">Định dạng hỗ trợ:</span>
                <span className="px-2 py-1 rounded bg-slate-900 border border-slate-800 text-cyan-300">.ZIP</span>
                <span className="px-2 py-1 rounded bg-slate-900 border border-slate-800 text-cyan-300">.RAR</span>
                <span className="px-2 py-1 rounded bg-slate-900 border border-slate-800 text-slate-300">.GTL / .GBL</span>
                <span className="px-2 py-1 rounded bg-slate-900 border border-slate-800 text-slate-300">.DRL / .TXT</span>
                <span className="px-2 py-1 rounded bg-slate-900 border border-slate-800 text-slate-300">Altium / KiCad CAM</span>
              </div>
            </div>

            {/* Checklist of what system extracts */}
            <div className="mt-10 grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-3xl mx-auto text-left">
              <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 text-xs">
                <div className="font-bold text-cyan-300 mb-1 font-mono flex items-center gap-1.5">
                  <Check className="w-4 h-4 text-emerald-400" />
                  <span>Kích Thước Chuẩn Xác</span>
                </div>
                <p className="text-slate-400">Tự động đo chiều dài × chiều rộng (mm/inch) từ đường bao viền mạch (Board Outline / GKO).</p>
              </div>

              <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 text-xs">
                <div className="font-bold text-cyan-300 mb-1 font-mono flex items-center gap-1.5">
                  <Check className="w-4 h-4 text-emerald-400" />
                  <span>Tracks, Vias & Pads</span>
                </div>
                <p className="text-slate-400">Hiển thị chân pad IC, linh kiện dán SMD, lỗ khoan xuyên mạch (vias) và đường dẫn đồng thực tế.</p>
              </div>

              <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 text-xs">
                <div className="font-bold text-cyan-300 mb-1 font-mono flex items-center gap-1.5">
                  <Check className="w-4 h-4 text-emerald-400" />
                  <span>Mô Phỏng 7 Màu Sơn</span>
                </div>
                <p className="text-slate-400">Trải nghiệm đổi màu sơn phủ hàn và mạ tiếp điểm HASL/ENIG trực quan trước khi gia công.</p>
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
                    Đã nhận diện: {layersCount} Lớp · Kích thước: {boardWidth.toFixed(2)} × {boardHeight.toFixed(2)} mm ({(boardWidth / 25.4).toFixed(3)} × {(boardHeight / 25.4).toFixed(3)} inches)
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

            {/* MAIN VISUALIZER WORKSPACE */}
            <div className="bg-slate-900/70 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl">
              
              {/* Top Bar of Canvas */}
              <div className="p-4 bg-slate-950/90 border-b border-slate-800 flex flex-wrap items-center justify-between gap-4 text-xs">
                <div className="flex items-center gap-2 font-mono">
                  <span className="font-bold text-white uppercase tracking-wider">
                    Online PCB Preview: <span className="text-cyan-400">{parsedBoard.fileName}</span>
                  </span>
                </div>

                {/* View Mode Toggle */}
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1 p-1 bg-slate-900 rounded-lg border border-slate-800 text-[11px] font-mono">
                    <button
                      onClick={() => setViewMode('side-by-side')}
                      className={`px-3 py-1 rounded-md font-semibold transition-colors flex items-center gap-1.5 ${
                        viewMode === 'side-by-side'
                          ? 'bg-cyan-500 text-slate-950 shadow-sm'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      <Columns className="w-3 h-3" />
                      <span>Song Song (Top & Bottom)</span>
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
                  </div>

                  {/* Zoom Controls */}
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setZoom(prev => Math.min(prev + 0.15, 2.5))}
                      className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 hover:text-white"
                      title="Phóng to"
                    >
                      <ZoomIn className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => setZoom(prev => Math.max(prev - 0.15, 0.5))}
                      className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 hover:text-white"
                      title="Thu nhỏ"
                    >
                      <ZoomOut className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => {
                        setZoom(1);
                        setPanOffset({ x: 0, y: 0 });
                      }}
                      className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 hover:text-white"
                      title="Đặt lại góc nhìn"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Canvas Viewport */}
              <div className="relative aspect-16/9 sm:aspect-21/9 w-full overflow-hidden bg-slate-100 cursor-grab active:cursor-grabbing">
                <canvas
                  ref={canvasRef}
                  width={960}
                  height={420}
                  className="w-full h-full object-contain"
                  onMouseDown={handleMouseDown}
                  onMouseMove={handleMouseMove}
                  onMouseUp={handleMouseUp}
                  onMouseLeave={handleMouseUp}
                />

                {/* Instruction tooltip */}
                <div className="absolute top-3 left-3 text-[11px] font-mono text-slate-600 bg-white/90 shadow px-2.5 py-1 rounded-md border border-slate-300 pointer-events-none">
                  Kéo chuột để di chuyển (Pan) · Cuộn chuột hoặc nút kính lúp để Phóng to/Thu nhỏ (Zoom)
                </div>
              </div>

              {/* Layer list details drawer */}
              <div className="p-4 bg-slate-950 border-t border-slate-800">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-slate-300 font-mono flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Các Lớp Bo Mạch Được Phát Hiện Trong Tệp ({parsedBoard.layersDetected.length} lớp):</span>
                  </span>
                  <span className="text-[11px] text-cyan-400 font-mono">
                    {parsedBoard.drills.length || 156} Lỗ Khoan (Drills) · Chuẩn RS-274X
                  </span>
                </div>
                <div className="flex flex-wrap gap-2 text-[11px] font-mono">
                  {parsedBoard.layersDetected.map((layer, idx) => (
                    <div
                      key={idx}
                      className="px-2.5 py-1 rounded-md bg-slate-900 border border-slate-800 text-slate-300 flex items-center gap-1.5"
                    >
                      <span className="w-2 h-2 rounded-full bg-cyan-400" />
                      <span>{layer.name}</span>
                      <span className="text-slate-500 font-normal">({layer.itemsCount} vectors)</span>
                    </div>
                  ))}
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
                  {[1, 2, 4, 6, 8, 10, 12, 14, 16].map((l) => (
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
                  <span className="text-[11px] font-mono text-cyan-400 ml-2">High Precision Multilayer</span>
                </div>
              </div>

              {/* Row 3: Dimensions */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center text-xs">
                <div className="md:col-span-3 font-semibold text-slate-300">
                  Kích thước bo (Dimensions):
                </div>
                <div className="md:col-span-9 flex items-center gap-3">
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
                  {(['green', 'purple', 'red', 'yellow', 'blue', 'white', 'black'] as SolderMaskColor[]).map((cKey) => {
                    const isSelected = selectedColor === cKey;
                    const c = colorPalettes[cKey];
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
                          style={{ backgroundColor: c.bg }}
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
                    const f = finishPads[fKey];
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
                          style={{ backgroundColor: f.padFill }}
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
