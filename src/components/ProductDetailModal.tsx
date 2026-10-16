import React from 'react';
import { X, CheckCircle, Cpu, Zap, Layers, ArrowRight, ShieldCheck } from 'lucide-react';
import { Product } from '../types';

interface ProductDetailModalProps {
  product: Product | null;
  onClose: () => void;
  onRequestQuoteForProduct: (product: Product) => void;
}

export const ProductDetailModal: React.FC<ProductDetailModalProps> = ({
  product,
  onClose,
  onRequestQuoteForProduct,
}) => {
  if (!product) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-200">
      <div 
        className="relative w-full max-w-4xl bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl shadow-cyan-950/50 overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Bar */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-cyan-950 border border-cyan-500/40 flex items-center justify-center text-cyan-400">
              <Cpu className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-mono text-cyan-400 font-semibold">{product.category}</div>
              <h3 className="text-lg font-bold text-white leading-tight">{product.title}</h3>
            </div>
          </div>
          
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors focus:outline-none"
            aria-label="Đóng cửa sổ"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="overflow-y-auto p-6 space-y-6">
          
          {/* Main Media & Overview Split */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
            {/* Product Image */}
            <div className="relative rounded-xl overflow-hidden border border-slate-700 bg-slate-950 aspect-4/3">
              <img
                src={product.imageUrl}
                alt={product.title}
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
              <div className="absolute top-3 left-3 px-3 py-1 rounded bg-slate-950/80 backdrop-blur-md border border-slate-700 text-xs font-mono text-cyan-300">
                {product.status}
              </div>
            </div>

            {/* Overview & Pricing */}
            <div className="space-y-4">
              <div>
                <span className="text-xs text-slate-400 uppercase tracking-wider font-mono">Định mức chi phí:</span>
                <div className="text-xl font-bold text-cyan-400 font-mono mt-0.5">{product.priceEstimate}</div>
              </div>

              <div>
                <span className="text-xs text-slate-400 uppercase tracking-wider font-mono">Mô tả tổng quan:</span>
                <p className="text-sm text-slate-300 leading-relaxed mt-1">{product.shortDesc}</p>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-950/50 border border-slate-800 space-y-2">
                <div className="flex items-center gap-2 text-xs font-semibold text-slate-200">
                  <ShieldCheck className="w-4 h-4 text-cyan-400" />
                  <span>Cam kết kỹ thuật từ DY AUTOMATION:</span>
                </div>
                <ul className="text-xs text-slate-400 space-y-1 pl-6 list-disc">
                  <li>Cung cấp đầy đủ Gerber, BOM, và Schematic khi bàn giao</li>
                  <li>Bảo hành chức năng phần cứng 12 tháng</li>
                  <li>Hỗ trợ hiệu chỉnh firmware & nạp code trọn đời</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Detailed Description */}
          <div>
            <h4 className="text-xs font-bold text-cyan-400 uppercase tracking-wider font-mono mb-2">
              Chi Tiết Kỹ Thuật & Nguyên Lý Hoạt Động
            </h4>
            <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 text-sm text-slate-300 leading-relaxed">
              {product.fullDesc}
            </div>
          </div>

          {/* Specifications Table */}
          {product.specs && product.specs.length > 0 && (
            <div>
              <h4 className="text-xs font-bold text-cyan-400 uppercase tracking-wider font-mono mb-2">
                Thông Số Kỹ Thuật Chi Tiết (Technical Specifications)
              </h4>
              <div className="rounded-xl border border-slate-800 overflow-hidden">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-950/80 text-slate-400 font-mono uppercase border-b border-slate-800">
                    <tr>
                      <th className="px-4 py-3 w-1/3">Thông số</th>
                      <th className="px-4 py-3">Giá trị kỹ thuật</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800 bg-slate-900/40">
                    {product.specs.map((item, index) => (
                      <tr key={index} className="hover:bg-slate-800/40 transition-colors">
                        <td className="px-4 py-2.5 font-medium text-slate-300 bg-slate-950/30">{item.key}</td>
                        <td className="px-4 py-2.5 text-cyan-200 font-mono">{item.value}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Feature Highlights */}
          {product.features && product.features.length > 0 && (
            <div>
              <h4 className="text-xs font-bold text-cyan-400 uppercase tracking-wider font-mono mb-2">
                Tính Năng Nổi Bật & Ứng Dụng Thực Tế
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {product.features.map((feat, index) => (
                  <div key={index} className="flex items-start gap-2 text-xs text-slate-300 p-2.5 rounded-lg bg-slate-950/40 border border-slate-800">
                    <CheckCircle className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                    <span>{feat}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>

        {/* Modal Footer with Action */}
        <div className="px-6 py-4 border-t border-slate-800 bg-slate-950/90 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-xs text-slate-400">
            Cập nhật kỹ thuật lần cuối: <span className="font-mono text-slate-300">{product.updatedAt}</span>
          </div>
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <button
              onClick={onClose}
              className="w-full sm:w-auto px-4 py-2.5 text-xs font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors"
            >
              Đóng
            </button>
            <button
              onClick={() => {
                onClose();
                onRequestQuoteForProduct(product);
              }}
              className="w-full sm:w-auto px-5 py-2.5 text-xs font-semibold text-slate-950 bg-gradient-to-r from-cyan-400 to-cyan-300 hover:from-cyan-300 hover:to-cyan-200 rounded-lg shadow-lg shadow-cyan-500/20 transition-all flex items-center justify-center gap-2"
            >
              <span>Yêu cầu báo giá sản phẩm này</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
