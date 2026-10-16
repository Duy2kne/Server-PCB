import React, { useState, useEffect } from 'react';
import { Cpu, ShieldCheck, Menu, X, ArrowUpRight, Lock } from 'lucide-react';
import { CompanySettings } from '../types';

interface HeaderProps {
  currentView: 'client' | 'admin';
  onNavigateView: (view: 'client' | 'admin') => void;
  onNavigateSection: (sectionId: string) => void;
  settings: CompanySettings;
}

export const Header: React.FC<HeaderProps> = ({
  currentView,
  onNavigateView,
  onNavigateSection,
  settings,
}) => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleNavClick = (sectionId: string) => {
    setMobileMenuOpen(false);
    if (currentView === 'admin') {
      onNavigateView('client');
      setTimeout(() => {
        onNavigateSection(sectionId);
      }, 50);
    } else {
      onNavigateSection(sectionId);
    }
  };

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-200 ${
        isScrolled
          ? 'bg-slate-950/90 backdrop-blur-md border-b border-slate-800 shadow-xl shadow-cyan-950/10'
          : 'bg-slate-950/70 backdrop-blur-sm border-b border-slate-800/60'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-8 h-20">
          
          {/* Zone 1: Brand Wordmark (Single clean element) */}
          <button
            onClick={() => handleNavClick('hero')}
            className="group flex items-center gap-3 text-left whitespace-nowrap shrink-0 focus:outline-none"
          >
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-cyan-500/20 to-blue-600/30 border border-cyan-500/40 flex items-center justify-center text-cyan-400 group-hover:border-cyan-400 transition-colors shadow-inner">
              <Cpu className="w-5 h-5 text-cyan-400" />
            </div>
            <div className="flex flex-col">
              <span className="text-xl font-extrabold tracking-tight text-white group-hover:text-cyan-300 transition-colors">
                DY <span className="text-cyan-400 font-light">AUTOMATION</span>
              </span>
              <span className="text-[10px] uppercase tracking-widest text-slate-400 font-mono">
                Hardware & Testing Systems
              </span>
            </div>
          </button>

          {/* Zone 2: Navigation Links (single-line, concise) */}
          <nav className="hidden lg:flex items-center gap-7 text-sm font-medium text-slate-300">
            <button
              onClick={() => handleNavClick('hero')}
              className="hover:text-cyan-400 transition-colors whitespace-nowrap shrink-0"
            >
              Trang chủ
            </button>
            <button
              onClick={() => handleNavClick('services')}
              className="hover:text-cyan-400 transition-colors whitespace-nowrap shrink-0"
            >
              Dịch vụ
            </button>
            <button
              onClick={() => handleNavClick('portfolio')}
              className="hover:text-cyan-400 transition-colors whitespace-nowrap shrink-0"
            >
              Sản phẩm & Dự án
            </button>
            <button
              onClick={() => handleNavClick('gerber-viewer')}
              className="hover:text-cyan-400 text-cyan-300 transition-colors whitespace-nowrap shrink-0 font-semibold flex items-center gap-1"
            >
              <span>Xem Gerber 2D</span>
            </button>
            <button
              onClick={() => handleNavClick('workflow')}
              className="hover:text-cyan-400 transition-colors whitespace-nowrap shrink-0"
            >
              Quy trình kỹ thuật
            </button>
            <button
              onClick={() => handleNavClick('about')}
              className="hover:text-cyan-400 transition-colors whitespace-nowrap shrink-0"
            >
              Về chúng tôi
            </button>
            <button
              onClick={() => handleNavClick('contact')}
              className="hover:text-cyan-400 transition-colors whitespace-nowrap shrink-0"
            >
              Liên hệ
            </button>
          </nav>

          {/* Zone 3: Primary Action & Admin Portal Switcher */}
          <div className="hidden sm:flex items-center gap-3 shrink-0">
            {currentView === 'client' ? (
              <>
                <button
                  onClick={() => onNavigateView('admin')}
                  className="px-3 py-2 text-xs font-medium text-slate-400 hover:text-slate-200 hover:bg-slate-900 border border-slate-800 rounded-lg transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0"
                  title="Truy cập Bảng điều khiển quản trị"
                >
                  <Lock className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Quản trị (Admin)</span>
                </button>
                <button
                  onClick={() => handleNavClick('contact')}
                  className="px-4 py-2.5 text-xs font-semibold text-slate-950 bg-gradient-to-r from-cyan-400 to-cyan-300 hover:from-cyan-300 hover:to-cyan-200 rounded-lg shadow-lg shadow-cyan-500/20 hover:shadow-cyan-500/30 transition-all flex items-center gap-1.5 whitespace-nowrap shrink-0"
                >
                  <span>Yêu cầu báo giá</span>
                  <ArrowUpRight className="w-4 h-4 text-slate-950" />
                </button>
              </>
            ) : (
              <button
                onClick={() => onNavigateView('client')}
                className="px-4 py-2 text-xs font-semibold text-cyan-300 bg-cyan-950/60 hover:bg-cyan-900/60 border border-cyan-500/50 rounded-lg transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0"
              >
                <span>← Trở về Trang Khách Hàng</span>
              </button>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="lg:hidden flex items-center gap-2">
            <button
              onClick={() => onNavigateView(currentView === 'client' ? 'admin' : 'client')}
              className="p-2 text-xs text-slate-300 bg-slate-900 border border-slate-800 rounded-lg"
              title="Chuyển chế độ"
            >
              {currentView === 'client' ? <Lock className="w-4 h-4 text-cyan-400" /> : 'Web'}
            </button>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 text-slate-300 hover:text-white bg-slate-900/80 border border-slate-800 rounded-lg focus:outline-none"
              aria-label="Toggle mobile menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>

        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-slate-950 border-b border-slate-800 px-4 pt-3 pb-6 space-y-3">
          <div className="flex flex-col space-y-2 text-base font-medium text-slate-200">
            <button
              onClick={() => handleNavClick('hero')}
              className="text-left py-2 px-3 hover:bg-slate-900 rounded-md transition-colors"
            >
              Trang chủ
            </button>
            <button
              onClick={() => handleNavClick('services')}
              className="text-left py-2 px-3 hover:bg-slate-900 rounded-md transition-colors"
            >
              Dịch vụ
            </button>
            <button
              onClick={() => handleNavClick('portfolio')}
              className="text-left py-2 px-3 hover:bg-slate-900 rounded-md transition-colors"
            >
              Sản phẩm & Dự án
            </button>
            <button
              onClick={() => handleNavClick('gerber-viewer')}
              className="text-left py-2 px-3 hover:bg-slate-900 rounded-md transition-colors text-cyan-300 font-semibold"
            >
              Xem Gerber 2D (DFM Viewer)
            </button>
            <button
              onClick={() => handleNavClick('workflow')}
              className="text-left py-2 px-3 hover:bg-slate-900 rounded-md transition-colors"
            >
              Quy trình kỹ thuật
            </button>
            <button
              onClick={() => handleNavClick('about')}
              className="text-left py-2 px-3 hover:bg-slate-900 rounded-md transition-colors"
            >
              Về chúng tôi
            </button>
            <button
              onClick={() => handleNavClick('contact')}
              className="text-left py-2 px-3 hover:bg-slate-900 rounded-md transition-colors"
            >
              Liên hệ
            </button>
          </div>

          <div className="pt-3 border-t border-slate-800/80 flex flex-col gap-2.5">
            <button
              onClick={() => handleNavClick('contact')}
              className="w-full py-2.5 text-center text-sm font-semibold text-slate-950 bg-gradient-to-r from-cyan-400 to-cyan-300 rounded-lg shadow-md"
            >
              Yêu cầu báo giá kỹ thuật
            </button>
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                onNavigateView(currentView === 'client' ? 'admin' : 'client');
              }}
              className="w-full py-2 text-center text-xs font-medium text-slate-300 bg-slate-900 border border-slate-800 rounded-lg"
            >
              {currentView === 'client' ? 'Truy cập Trang Quản Trị (Admin)' : 'Xem giao diện Khách Hàng'}
            </button>
          </div>
        </div>
      )}
    </header>
  );
};
