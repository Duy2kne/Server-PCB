import React from 'react';
import { ArrowRight, Cpu, Layers, CheckCircle2, Shield, Wrench } from 'lucide-react';

interface HeroProps {
  onQuoteClick: () => void;
  onExploreClick: () => void;
  onGerberViewerClick?: () => void;
  imageUrl?: string;
}

export const Hero: React.FC<HeroProps> = ({ onQuoteClick, onExploreClick, onGerberViewerClick, imageUrl }) => {
  return (
    <section id="hero" className="relative pt-28 pb-16 lg:pt-36 lg:pb-24 overflow-hidden">
      {/* Background Tech Glow & Grids */}
      <div className="absolute inset-0 bg-circuit-grid opacity-25 pointer-events-none" />
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[350px] bg-gradient-to-tr from-cyan-600/15 via-blue-600/10 to-transparent blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Two-Column Split Hero Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
          
          {/* Left Column: Headline & Action */}
          <div className="lg:col-span-7 space-y-6">
            
            {/* Clean unboxed domain metadata kicker */}
            <div className="flex items-center gap-2 text-xs font-semibold tracking-wider uppercase text-cyan-400 font-mono">
              <span>Hardware Engineering</span>
              <span aria-hidden="true" className="text-slate-600">/</span>
              <span>PCB Assembly</span>
              <span aria-hidden="true" className="text-slate-600">/</span>
              <span>Automation Systems</span>
            </div>

            {/* Main Headline */}
            <h1 
              className="text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-extrabold tracking-tight text-white leading-[1.15]"
              style={{ textWrap: 'balance' }}
            >
              Giải Pháp Trọn Gói Từ{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-sky-300 to-blue-500">
                Thiết Kế Hardware
              </span>
              , Sản Xuất PCB Đến{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-cyan-300 to-teal-300">
                Phần Mềm Tự Động Hóa SCADA/IoT
              </span>
            </h1>

            {/* Concrete Value Proposition */}
            <p className="text-base sm:text-lg text-slate-300 max-w-2xl leading-relaxed">
              DY AUTOMATION đồng hành cùng doanh nghiệp từ giai đoạn ý tưởng mạch điện tử (R&D), 
              layout PCB đa lớp tối ưu EMI/EMC, gia công linh kiện SMT/DIP hàng loạt, 
              đến lập trình firmware nhúng và phần mềm điều khiển tự động hóa dây chuyền sản xuất.
            </p>

            {/* Key Advantages Chips (Clean unboxed style) */}
            <div className="pt-2 grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs text-slate-300">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0" />
                <span>Layout 2 - 16 lớp tốc độ cao</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0" />
                <span>Hàn dán SMT / DIP tự động</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0" />
                <span>Chuẩn IPC-A-610 Class 2/3</span>
              </div>
            </div>

            {/* CTAs */}
            <div className="pt-4 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <button
                onClick={onQuoteClick}
                className="px-6 py-3.5 text-sm font-semibold text-slate-950 bg-gradient-to-r from-cyan-400 to-cyan-300 hover:from-cyan-300 hover:to-cyan-200 rounded-lg shadow-xl shadow-cyan-500/20 hover:shadow-cyan-500/35 transition-all flex items-center justify-center gap-2 whitespace-nowrap"
              >
                <span>Nhận Báo Giá (Gerber/BOM)</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              {onGerberViewerClick && (
                <button
                  onClick={onGerberViewerClick}
                  className="px-5 py-3.5 text-sm font-semibold text-cyan-300 hover:text-white bg-cyan-950/60 hover:bg-cyan-900/60 border border-cyan-500/50 rounded-lg transition-colors flex items-center justify-center gap-2 whitespace-nowrap shadow-md"
                >
                  <Layers className="w-4 h-4 text-cyan-400" />
                  <span>Xem Gerber 2D & Đổi Màu Bo</span>
                </button>
              )}

              <button
                onClick={onExploreClick}
                className="px-5 py-3.5 text-sm font-medium text-slate-300 hover:text-white bg-slate-900/90 hover:bg-slate-800 border border-slate-700/80 hover:border-cyan-500/50 rounded-lg transition-colors flex items-center justify-center gap-2 whitespace-nowrap"
              >
                <span>Sản phẩm mẫu</span>
              </button>
            </div>

          </div>

          {/* Right Column: Hero Visual Asset Carrier */}
          <div className="lg:col-span-5 relative">
            <div className="relative rounded-2xl overflow-hidden border border-cyan-500/30 bg-slate-900/60 shadow-2xl shadow-cyan-950/40 group">
              <img
                src={imageUrl || 'images/hero_pcb_automation_1792125856876.jpg'}
                alt="DY AUTOMATION - Dây chuyền SMT và Thiết kế bo mạch kiểm thử"
                className="w-full h-[340px] sm:h-[400px] lg:h-[420px] object-cover group-hover:scale-[1.02] transition-transform duration-500"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/30 to-transparent pointer-events-none" />
              
              {/* Overlay engineering badge */}
              <div className="absolute bottom-4 left-4 right-4 p-4 rounded-xl bg-slate-950/85 backdrop-blur-md border border-slate-800 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
                    <Layers className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-white">Xưởng SMT & R&D Hardware</div>
                    <div className="text-[11px] text-slate-400">Kiểm thử quang học AOI & X-Ray 100%</div>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-xs font-mono font-bold text-cyan-400">ISO 9001:2015</span>
                  <div className="text-[10px] text-slate-500">Tiêu chuẩn quốc tế</div>
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* Full-width KPI Trust Strip below hero split */}
        <div className="mt-16 pt-8 border-t border-slate-800/80 grid grid-cols-2 md:grid-cols-4 gap-6 lg:gap-8">
          <div className="p-4 rounded-xl bg-slate-900/40 border border-slate-800/70 hover:border-cyan-500/40 transition-colors">
            <div className="text-2xl sm:text-3xl font-extrabold text-white font-mono tabular-nums tracking-tight">
              150<span className="text-cyan-400">+</span>
            </div>
            <div className="text-xs sm:text-sm font-medium text-slate-300 mt-1">Dự án Hardware & Jig</div>
            <p className="text-[11px] text-slate-500 mt-0.5">Triển khai thành công cho khách hàng công nghiệp</p>
          </div>

          <div className="p-4 rounded-xl bg-slate-900/40 border border-slate-800/70 hover:border-cyan-500/40 transition-colors">
            <div className="text-2xl sm:text-3xl font-extrabold text-white font-mono tabular-nums tracking-tight">
              99.8<span className="text-cyan-400">%</span>
            </div>
            <div className="text-xs sm:text-sm font-medium text-slate-300 mt-1">Chuẩn Xác & Đạt Test</div>
            <p className="text-[11px] text-slate-500 mt-0.5">Kiểm định nghiêm ngặt theo tiêu chuẩn IPC</p>
          </div>

          <div className="p-4 rounded-xl bg-slate-900/40 border border-slate-800/70 hover:border-cyan-500/40 transition-colors">
            <div className="text-2xl sm:text-3xl font-extrabold text-white font-mono tabular-nums tracking-tight">
              24<span className="text-cyan-400">-48h</span>
            </div>
            <div className="text-xs sm:text-sm font-medium text-slate-300 mt-1">Phản Hồi Báo Giá</div>
            <p className="text-[11px] text-slate-500 mt-0.5">Báo giá DFM, Gerber và phân tích BOM chi tiết</p>
          </div>

          <div className="p-4 rounded-xl bg-slate-900/40 border border-slate-800/70 hover:border-cyan-500/40 transition-colors">
            <div className="text-2xl sm:text-3xl font-extrabold text-white font-mono tabular-nums tracking-tight">
              100<span className="text-cyan-400">%</span>
            </div>
            <div className="text-xs sm:text-sm font-medium text-slate-300 mt-1">Bảo Mật Thiết Kế NDA</div>
            <p className="text-[11px] text-slate-500 mt-0.5">Cam kết quyền sở hữu trí tuệ phần cứng tuyệt đối</p>
          </div>
        </div>

      </div>
    </section>
  );
};
