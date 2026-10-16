import React from 'react';
import { Cpu, Target, Award, Wrench, ShieldCheck, Microchip, Layers } from 'lucide-react';
import { CompanySettings } from '../types';

interface AboutSectionProps {
  settings: CompanySettings;
}

export const AboutSection: React.FC<AboutSectionProps> = ({ settings }) => {
  return (
    <section id="about" className="py-20 lg:py-28 bg-slate-950 relative border-t border-slate-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          
          <div className="lg:col-span-6 space-y-6">
            <div className="text-xs font-semibold text-cyan-400 font-mono tracking-wider uppercase">
              Về Chúng Tôi · DY AUTOMATION
            </div>

            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-white tracking-tight leading-snug">
              Đối Tác Kỹ Thuật Đáng Tin Cậy Của Các Doanh Nghiệp Công Nghệ & Tự Động Hóa
            </h2>

            <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
              DY AUTOMATION là đơn vị chuyên sâu về nghiên cứu và phát triển phần cứng điện tử (Hardware R&D), 
              thiết kế vi mạch PCB, gia công PCBA và phát triển phần mềm tự động hóa giám sát sản xuất (Automation Tools). 
              Với đội ngũ kỹ sư điện tử và lập trình nhúng giàu kinh nghiệm, chúng tôi giải quyết bài toán phức tạp từ phòng thí nghiệm tới phân xưởng sản xuất thực tế.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div className="p-4 rounded-xl bg-slate-900/50 border border-slate-800">
                <Target className="w-5 h-5 text-cyan-400 mb-2" />
                <h4 className="text-sm font-bold text-white">Sứ Mệnh</h4>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                  Rút ngắn chu kỳ ra mắt sản phẩm điện tử, tối ưu hóa chi phí sản xuất và nâng cao tỷ lệ mạch đạt chuẩn 100%.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-slate-900/50 border border-slate-800">
                <Award className="w-5 h-5 text-cyan-400 mb-2" />
                <h4 className="text-sm font-bold text-white">Chất Lượng Vượt Trội</h4>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                  Tuân thủ nghiêm ngặt tiêu chuẩn IPC, sử dụng linh kiện chính hãng và thử nghiệm môi trường khắc nghiệt.
                </p>
              </div>
            </div>

            <div className="pt-2">
              <div className="text-xs text-slate-400 font-mono">Tiêu chuẩn tuân thủ:</div>
              <div className="text-xs font-semibold text-cyan-300 mt-1">{settings.techStandards}</div>
            </div>
          </div>

          <div className="lg:col-span-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-4">
                <div className="p-5 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-800">
                  <div className="text-3xl font-extrabold text-cyan-400 font-mono tabular-nums">10+ Năm</div>
                  <div className="text-xs font-semibold text-white mt-1">Kinh nghiệm chuyên môn</div>
                  <p className="text-[11px] text-slate-400 mt-1">Thiết kế vi xử lý 32-bit, FPGA, RF & mạch nguồn xung công suất</p>
                </div>

                <div className="p-5 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-800">
                  <div className="text-3xl font-extrabold text-cyan-400 font-mono tabular-nums">100%</div>
                  <div className="text-xs font-semibold text-white mt-1">Nguồn gốc linh kiện</div>
                  <p className="text-[11px] text-slate-400 mt-1">Chứng chỉ CO/CQ rõ ràng từ các nhà phân phối toàn cầu</p>
                </div>
              </div>

              <div className="space-y-4 pt-6">
                <div className="p-5 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-800">
                  <div className="text-3xl font-extrabold text-cyan-400 font-mono tabular-nums">&lt; 3-5 Ngày</div>
                  <div className="text-xs font-semibold text-white mt-1">Gia công mẫu nhanh</div>
                  <p className="text-[11px] text-slate-400 mt-1">Gia công prototype PCB & hàn dán PCBA tốc độ cao</p>
                </div>

                <div className="p-5 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-800">
                  <div className="text-3xl font-extrabold text-cyan-400 font-mono tabular-nums">24/7</div>
                  <div className="text-xs font-semibold text-white mt-1">Hỗ trợ kỹ thuật</div>
                  <p className="text-[11px] text-slate-400 mt-1">Đồng hành bảo hành và sửa đổi nâng cấp firmware trọn đời</p>
                </div>
              </div>
            </div>
          </div>

        </div>

      </div>
    </section>
  );
};
