import React from 'react';
import { Cpu, Phone, Mail, MapPin, ShieldCheck, ArrowUpRight, Lock } from 'lucide-react';
import { CompanySettings } from '../types';

interface FooterProps {
  settings: CompanySettings;
  onNavigateSection: (sectionId: string) => void;
  onOpenAdmin: () => void;
}

export const Footer: React.FC<FooterProps> = ({
  settings,
  onNavigateSection,
  onOpenAdmin,
}) => {
  return (
    <footer className="bg-slate-950 border-t border-slate-900 text-slate-400">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10">
          
          {/* Brand & Mission (2 cols) */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-cyan-950/80 border border-cyan-500/40 flex items-center justify-center text-cyan-400">
                <Cpu className="w-5 h-5" />
              </div>
              <span className="text-xl font-extrabold text-white tracking-tight">
                DY <span className="text-cyan-400 font-light">AUTOMATION</span>
              </span>
            </div>
            
            <p className="text-xs sm:text-sm text-slate-400 leading-relaxed max-w-sm">
              Đơn vị kỹ thuật chuyên sâu về Thiết kế Hardware, Sản xuất gia công PCB/PCBA, và phát triển Tool Automation & Validation công nghiệp hàng đầu.
            </p>

            <div className="pt-2 text-xs font-mono text-slate-500">
              MST: {settings.taxCode} · {settings.techStandards}
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-xs font-bold text-white uppercase tracking-wider font-mono mb-4">
              Điều Hướng Nhanh
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <button
                  onClick={() => onNavigateSection('hero')}
                  className="hover:text-cyan-400 transition-colors"
                >
                  Trang chủ
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigateSection('services')}
                  className="hover:text-cyan-400 transition-colors"
                >
                  Dịch vụ kỹ thuật
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigateSection('portfolio')}
                  className="hover:text-cyan-400 transition-colors"
                >
                  Sản phẩm & Dự án
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigateSection('workflow')}
                  className="hover:text-cyan-400 transition-colors"
                >
                  Quy trình 6 bước
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigateSection('about')}
                  className="hover:text-cyan-400 transition-colors"
                >
                  Về chúng tôi
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigateSection('contact')}
                  className="hover:text-cyan-400 transition-colors"
                >
                  Yêu cầu báo giá
                </button>
              </li>
            </ul>
          </div>

          {/* Services Quicklist */}
          <div>
            <h4 className="text-xs font-bold text-white uppercase tracking-wider font-mono mb-4">
              Lĩnh Vực Chuyên Môn
            </h4>
            <ul className="space-y-2 text-xs text-slate-400">
              <li>Thiết kế Schematic & Layout PCB</li>
              <li>Gia công mạch in & Hàn SMT tự động</li>
              <li>Lập trình Firmware & Hệ thống nhúng</li>
              <li>Phát triển Tool SCADA & Web App</li>
              <li>Tối ưu hóa EMI/EMC & Signal Integrity</li>
              <li>Nghiên cứu & Chuyển giao công nghệ</li>
            </ul>
          </div>

          {/* Contact Details */}
          <div>
            <h4 className="text-xs font-bold text-white uppercase tracking-wider font-mono mb-4">
              Thông Tin Liên Hệ
            </h4>
            <ul className="space-y-2.5 text-xs text-slate-400">
              <li className="flex items-start gap-2">
                <Phone className="w-3.5 h-3.5 text-cyan-400 shrink-0 mt-0.5" />
                <span className="font-mono text-slate-200">{settings.hotline}</span>
              </li>
              <li className="flex items-start gap-2">
                <Mail className="w-3.5 h-3.5 text-cyan-400 shrink-0 mt-0.5" />
                <span className="text-slate-200">{settings.email}</span>
              </li>
              <li className="flex items-start gap-2">
                <MapPin className="w-3.5 h-3.5 text-cyan-400 shrink-0 mt-0.5" />
                <span className="leading-tight">{settings.addressHanoi}</span>
              </li>
            </ul>

            <div className="mt-4 pt-4 border-t border-slate-900">
              <button
                onClick={onOpenAdmin}
                className="text-xs text-slate-500 hover:text-cyan-400 flex items-center gap-1.5 transition-colors font-mono"
              >
                <Lock className="w-3 h-3 text-cyan-500" />
                <span>Trang quản trị (Admin Portal)</span>
              </button>
            </div>
          </div>

        </div>

        {/* Bottom Bar */}
        <div className="mt-12 pt-8 border-t border-slate-900 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <div>
            © {new Date().getFullYear()} <strong className="text-slate-300 font-semibold">{settings.companyName}</strong>. Bản quyền đã được bảo hộ.
          </div>
          <div className="flex items-center gap-6">
            <span>Chính sách bảo mật NDA</span>
            <span>·</span>
            <span>Tiêu chuẩn IPC-A-610</span>
            <span>·</span>
            <span>Quy chuẩn chất lượng</span>
          </div>
        </div>

      </div>
    </footer>
  );
};
