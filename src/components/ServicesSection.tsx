import React, { useState } from 'react';
import { Cpu, CircuitBoard, MonitorPlay, CheckSquare2, ArrowRight, ShieldCheck, Zap, Layers, Binary } from 'lucide-react';

interface ServicesSectionProps {
  onSelectService: (serviceName: string) => void;
}

export const ServicesSection: React.FC<ServicesSectionProps> = ({ onSelectService }) => {
  const [activeTab, setActiveTab] = useState<number>(0);

  const services = [
    {
      id: 'pcb-design',
      num: '01',
      title: 'Thiết kế PCB (PCB Design)',
      subtitle: 'Schematic, Layout Đa Lớp, Tối Ưu EMI/EMC & High-Speed',
      icon: Cpu,
      description: 'Dịch vụ thiết kế phần cứng toàn diện từ sơ đồ nguyên lý (Schematic), phân tích tính toàn vẹn tín hiệu (Signal Integrity), tính toàn vẹn nguồn điện (Power Integrity), đến Layout PCB từ 2 đến 16 lớp với khả năng chống nhiễu công nghiệp.',
      deliverables: [
        'Sơ đồ nguyên lý hoàn chỉnh (Altium Designer / KiCad / OrCAD)',
        'Bản vẽ Layout PCB tối ưu tản nhiệt, chống nhiễu cross-talk & EMI/EMC',
        'Bộ tệp Gerber RS-274X, NC Drill, ODB++, và Pick & Place file',
        'BOM (Bill of Materials) chuẩn hóa mã linh kiện chính hãng Digikey, Mouser, LCSC',
        'Mô hình 3D STEP mô phỏng cơ khí chính xác khớp vỏ hộp thiết bị'
      ],
      highlights: ['2 - 16 Layers', 'High-Speed RF/DDR', 'Tương thích vỏ 3D', 'Kiểm tra DFM/DFA']
    },
    {
      id: 'pcba-fabrication',
      num: '02',
      title: 'Gia công & Sản xuất PCB (PCB Fabrication & PCBA)',
      subtitle: 'Gia Công Mạch In & Hàn Linh Kiện SMT/DIP Chuẩn Xác',
      icon: CircuitBoard,
      description: 'Dây chuyền sản xuất bo mạch trọn gói từ làm phôi mạch in (FR4, Nhôm Aluminum, Rogers cao tần) đến mua sắm linh kiện gốc và hàn dán SMT tự động tốc độ cao, hàn cắm DIP, kiểm tra quang học tự động AOI và rửa siêu âm.',
      deliverables: [
        'Gia công bo mạch từ prototype nhanh (3 - 5 ngày) đến sản xuất hàng nghìn chiếc',
        'Dán linh kiện SMT chuẩn 0201, BGA pitch 0.4mm, QFN, IC chân gầm siêu mịn',
        'Linh kiện 100% nhập chính ngạch có chứng nhận xuất xứ CO/CQ',
        'Kiểm tra quang học AOI 100% mối hàn và soi tia X-Ray các chip BGA phức tạp',
        'Phủ Conformal Coating cách điện, chống ẩm muối và chống ăn mòn hóa chất'
      ],
      highlights: ['Hàn SMT 0201 & BGA', 'Linh kiện chính hãng', 'Kiểm tra AOI & X-Ray', 'Phủ keo chống ẩm']
    },
    {
      id: 'automation-tools',
      num: '03',
      title: 'Phát triển Tool Automation (Automation Tools)',
      subtitle: 'Phần Mềm Điều Khiển Dây Chuyền & Hệ Thống Giám Sát PC/Web',
      icon: MonitorPlay,
      description: 'Lập trình các công cụ phần mềm tự động hóa sản xuất trên nền tảng Desktop (C#, Python, Electron) và Web Dashboard. Kết nối trực tiếp máy đo, camera kiểm tra ngoại quan (Machine Vision), PLC và hệ thống nhúng qua RS485/CAN/Modbus/Ethernet.',
      deliverables: [
        'Phần mềm PC điều khiển dây chuyền, thu thập dữ liệu sản xuất thời gian thực',
        'Hệ thống Web Dashboard SCADA giám sát OEE, sản lượng và lỗi từ xa qua Internet',
        'Tích hợp camera AI phát hiện lỗi dị vật, thiếu linh kiện và lệch chân chân chip',
        'Tự động đồng bộ dữ liệu vào cơ sở dữ liệu SQL, Google Sheets hoặc phần mềm ERP',
        'Giao diện người dùng đồ họa (GUI) trực quan, hỗ trợ màn hình cảm ứng công nghiệp'
      ],
      highlights: ['Giao thức Modbus/CAN', 'SCADA Web/PC', 'Camera AI Vision', 'Tích hợp máy đo Lab']
    }
  ];

  return (
    <section id="services" className="py-20 lg:py-28 bg-slate-950 relative border-t border-slate-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="max-w-3xl mb-16">
          <div className="text-xs font-semibold text-cyan-400 font-mono tracking-wider uppercase mb-2">
            Năng Lực Kỹ Thuật Cốt Lõi
          </div>
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-white tracking-tight">
            Dịch Vụ Kỹ Thuật Trọn Gói Tại DY AUTOMATION
          </h2>
          <p className="mt-4 text-base text-slate-300 leading-relaxed">
            Chúng tôi cung cấp chuỗi giải pháp khép kín giúp đối tác hiện thực hóa sản phẩm điện tử 
            nhanh chóng, đạt chuẩn chất lượng quốc tế và sẵn sàng cho dây chuyền sản xuất tự động.
          </p>
        </div>

        {/* Grid Layout of 3 Core Services */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {services.map((service, index) => {
            const Icon = service.icon;
            return (
              <div
                key={service.id}
                className="group p-8 rounded-2xl bg-slate-900/50 hover:bg-slate-900/80 border border-slate-800 hover:border-cyan-500/40 transition-all duration-300 flex flex-col justify-between"
              >
                <div>
                  {/* Top Bar inside Card */}
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-cyan-950/70 border border-cyan-500/30 flex items-center justify-center text-cyan-400 group-hover:scale-105 transition-transform">
                        <Icon className="w-6 h-6" />
                      </div>
                      <div>
                        <span className="text-xs font-mono font-bold text-cyan-400 tracking-wider">
                          {service.num}. SERVICE
                        </span>
                        <h3 className="text-xl font-bold text-white group-hover:text-cyan-300 transition-colors">
                          {service.title}
                        </h3>
                      </div>
                    </div>
                  </div>

                  <p className="text-sm font-medium text-cyan-200/80 mb-3">
                    {service.subtitle}
                  </p>

                  <p className="text-sm text-slate-300 leading-relaxed mb-6">
                    {service.description}
                  </p>

                  {/* Highlights Tags (Quiet clean style) */}
                  <div className="flex flex-wrap items-center gap-2 mb-6">
                    {service.highlights.map((hl, i) => (
                      <span
                        key={i}
                        className="text-xs px-2.5 py-1 rounded-md bg-slate-800/80 text-cyan-300 border border-slate-700 font-mono"
                      >
                        {hl}
                      </span>
                    ))}
                  </div>

                  {/* Deliverables Checklist */}
                  <div className="space-y-2.5 mb-8">
                    <div className="text-xs font-semibold uppercase tracking-wider text-slate-400 font-mono">
                      Hồ Sơ Bàn Giao Kỹ Thuật:
                    </div>
                    {service.deliverables.map((item, idx) => (
                      <div key={idx} className="flex items-start gap-2.5 text-xs text-slate-300">
                        <span className="text-cyan-400 font-mono shrink-0 mt-0.5">•</span>
                        <span>{item}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Bottom Card Action */}
                <div className="pt-4 border-t border-slate-800/80 flex items-center justify-between">
                  <span className="text-xs text-slate-500">Tư vấn DFM & Báo giá trong 24h</span>
                  <button
                    onClick={() => onSelectService(service.title)}
                    className="px-4 py-2 text-xs font-semibold text-cyan-400 hover:text-white bg-cyan-950/40 hover:bg-cyan-500 border border-cyan-500/40 hover:border-transparent rounded-lg transition-all flex items-center gap-1.5 whitespace-nowrap"
                  >
                    <span>Yêu cầu báo giá dịch vụ</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>

              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
};
