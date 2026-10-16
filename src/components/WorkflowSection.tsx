import React from 'react';
import { FileCode2, Cpu, Layers, CircuitBoard, Gauge, CheckCircle2, ShieldAlert, Award } from 'lucide-react';

export const WorkflowSection: React.FC = () => {
  const steps = [
    {
      step: '01',
      title: 'Đặc Tả Yêu Cầu & Kiến Trúc Phần Cứng',
      desc: 'Phân tích chức năng, chọn linh kiện MCU/Power tối ưu giá thành & chuỗi cung ứng, lập sơ đồ khối hệ thống.',
      icon: FileCode2,
    },
    {
      step: '02',
      title: 'Thiết Kế Schematic & Mô Phỏng Mạch',
      desc: 'Vẽ sơ đồ nguyên lý chuẩn công nghiệp, tính toán tản nhiệt, phân tích tính toàn vẹn nguồn & tín hiệu cao tần.',
      icon: Cpu,
    },
    {
      step: '03',
      title: 'Layout PCB Đa Lớp & Tối Ưu EMI/EMC',
      desc: 'Đi dây vi sai (Differential pairs), trở kháng kiểm soát (Controlled Impedance), xếp chồng lớp (Stack-up) chống nhiễu.',
      icon: Layers,
    },
    {
      step: '04',
      title: 'Gia Công Phôi Mạch & Hàn Dán PCBA',
      desc: 'Lên phôi FR4/Nhôm chất lượng cao, cắt Stencil laser, hàn dán SMT tự động và kiểm tra quang học AOI 100%.',
      icon: CircuitBoard,
    },
    {
      step: '05',
      title: 'Kiểm Định Chất Lượng, Đóng Gói & Bàn Giao',
      desc: 'Kiểm thử lão hóa (Burn-in test), đo đạc thông số điện áp/dòng tiêu thụ, đóng gói chống tĩnh điện ESD và bàn giao trọn bộ tệp thiết kế.',
      icon: Award,
    },
  ];

  return (
    <section id="workflow" className="py-20 lg:py-28 bg-slate-950/60 relative border-t border-slate-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="text-xs font-semibold text-cyan-400 font-mono tracking-wider uppercase mb-2">
            Phương Pháp Luận Kỹ Thuật
          </div>
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-white tracking-tight">
            Quy Trình 5 Bước Kỹ Thuật Chuẩn Hóa Tại DY AUTOMATION
          </h2>
          <p className="mt-3 text-sm sm:text-base text-slate-300">
            Từ ý tưởng sơ khai trên bản vẽ đến khi sản phẩm hoàn thiện, chạy ổn định trên dây chuyền và đạt chứng chỉ chất lượng cao nhất.
          </p>
        </div>

        {/* 6 Steps Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
          {steps.map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.step}
                className="p-6 rounded-2xl bg-slate-900/50 border border-slate-800/80 hover:border-cyan-500/40 transition-colors duration-200 relative group flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-2xl font-black font-mono text-cyan-500/60 group-hover:text-cyan-400 transition-colors">
                      {item.step}
                    </span>
                    <div className="p-2.5 rounded-lg bg-slate-800/60 text-cyan-300 group-hover:bg-cyan-950 transition-colors">
                      <Icon className="w-5 h-5" />
                    </div>
                  </div>

                  <h3 className="text-base font-bold text-white mb-2 group-hover:text-cyan-300 transition-colors">
                    {item.title}
                  </h3>

                  <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                    {item.desc}
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-800/50 flex items-center gap-1.5 text-[11px] font-mono text-cyan-400">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>QC Sign-off Đạt chuẩn</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Quality Standards Strip */}
        <div className="mt-12 p-6 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-900/90 to-cyan-950/40 border border-slate-800 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 shrink-0">
              <Award className="w-7 h-7" />
            </div>
            <div>
              <div className="text-sm font-bold text-white">Cam kết tiêu chuẩn phòng Lab & Nhà xưởng</div>
              <div className="text-xs text-slate-400 mt-0.5">
                IPC-A-610 Class 2 & 3 · IPC-2221 PCB Design · RoHS 2.0 · ISO 9001:2015
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4 text-xs font-mono text-slate-300">
            <div className="px-3 py-1.5 rounded-lg bg-slate-950/70 border border-slate-800">
              Trang bị máy đo RF 6GHz
            </div>
            <div className="px-3 py-1.5 rounded-lg bg-slate-950/70 border border-slate-800">
              Buồng nhiệt kiểm tra lão hóa
            </div>
          </div>
        </div>

      </div>
    </section>
  );
};
