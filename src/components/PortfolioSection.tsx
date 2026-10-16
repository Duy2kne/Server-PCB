import React, { useState, useMemo } from 'react';
import { Search, Eye, ArrowUpRight, Cpu, Filter } from 'lucide-react';
import { Product, ProductCategory } from '../types';

interface PortfolioSectionProps {
  products: Product[];
  onViewProductDetail: (product: Product) => void;
  onQuickQuote: (product: Product) => void;
}

export const PortfolioSection: React.FC<PortfolioSectionProps> = ({
  products,
  onViewProductDetail,
  onQuickQuote,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('Tất cả');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const categories: string[] = [
    'Tất cả',
    'Thiết kế PCB',
    'Gia công & PCBA',
    'Automation Tools',
  ];

  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      const matchesCategory =
        selectedCategory === 'Tất cả' || product.category === selectedCategory;
      const matchesSearch =
        product.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.shortDesc.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.category.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [products, selectedCategory, searchQuery]);

  return (
    <section id="portfolio" className="py-20 lg:py-28 bg-slate-950 relative border-t border-slate-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
          <div>
            <div className="text-xs font-semibold text-cyan-400 font-mono tracking-wider uppercase mb-2">
              Dự Án & Sản Phẩm Tiêu Biểu
            </div>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-white tracking-tight">
              Danh Mục Sản Phẩm & Portfolio Kỹ Thuật
            </h2>
            <p className="mt-3 text-sm sm:text-base text-slate-300 max-w-2xl">
              Khám phá các giải pháp phần cứng vi điều khiển, bo mạch công nghiệp và phần mềm tự động hóa đã được hoàn thiện bởi DY AUTOMATION.
            </p>
          </div>

          {/* Search Box */}
          <div className="relative w-full md:w-72 shrink-0">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm kiếm sản phẩm, MCU..."
              className="w-full pl-10 pr-4 py-2.5 text-xs bg-slate-900 border border-slate-800 rounded-lg text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-colors"
            />
          </div>
        </div>

        {/* Category Filter Tabs (Interactive segmented buttons with click handlers) */}
        <div className="flex items-center gap-2 overflow-x-auto pb-4 mb-8 scrollbar-none">
          {categories.map((cat) => {
            const isActive = selectedCategory === cat;
            return (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-4 py-2 text-xs font-medium rounded-lg whitespace-nowrap shrink-0 transition-all ${
                  isActive
                    ? 'bg-cyan-500 text-slate-950 font-semibold shadow-md shadow-cyan-500/20'
                    : 'bg-slate-900/90 text-slate-400 hover:text-slate-200 hover:bg-slate-800 border border-slate-800'
                }`}
              >
                {cat}
              </button>
            );
          })}
        </div>

        {/* Product Cards Grid */}
        {filteredProducts.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredProducts.map((product) => (
              <div
                key={product.id}
                className="group rounded-2xl bg-slate-900/40 hover:bg-slate-900/80 border border-slate-800/80 hover:border-cyan-500/50 transition-all duration-300 flex flex-col overflow-hidden shadow-lg shadow-black/40"
              >
                {/* Product Image */}
                <div 
                  className="relative aspect-4/3 overflow-hidden bg-slate-950 cursor-pointer"
                  onClick={() => onViewProductDetail(product)}
                >
                  <img
                    src={product.imageUrl}
                    alt={product.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/20 to-transparent pointer-events-none" />

                  {/* Clean unboxed status in upper-right corner */}
                  <div className="absolute top-3 right-3 text-[11px] font-mono px-2.5 py-1 rounded bg-slate-950/80 backdrop-blur-md border border-slate-700/80 text-cyan-300">
                    {product.status}
                  </div>

                  <div className="absolute bottom-3 left-4 right-4 flex items-center justify-between text-xs text-slate-300">
                    <span className="font-mono text-cyan-400 font-semibold">{product.priceEstimate}</span>
                  </div>
                </div>

                {/* Card Content */}
                <div className="p-6 flex-1 flex flex-col justify-between">
                  <div>
                    {/* Unboxed Metadata Discipline */}
                    <div className="flex items-center gap-2 text-xs text-slate-400 mb-2 font-mono">
                      <span className="text-cyan-400">{product.category}</span>
                      <span aria-hidden="true">·</span>
                      <span>{product.updatedAt}</span>
                    </div>

                    <h3 
                      onClick={() => onViewProductDetail(product)}
                      className="text-base font-bold text-white group-hover:text-cyan-300 transition-colors cursor-pointer line-clamp-2"
                    >
                      {product.title}
                    </h3>

                    <p className="mt-2.5 text-xs text-slate-300 leading-relaxed line-clamp-3">
                      {product.shortDesc}
                    </p>

                    {/* Key Specs Snapshot */}
                    {product.specs && product.specs.length > 0 && (
                      <div className="mt-4 pt-4 border-t border-slate-800/80 space-y-1.5">
                        {product.specs.slice(0, 2).map((s, idx) => (
                          <div key={idx} className="flex items-center justify-between text-[11px]">
                            <span className="text-slate-400 truncate max-w-[45%]">{s.key}:</span>
                            <span className="text-cyan-200 font-mono truncate max-w-[55%]">{s.value}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Card Actions */}
                  <div className="mt-6 pt-4 border-t border-slate-800 flex items-center gap-2.5">
                    <button
                      onClick={() => onViewProductDetail(product)}
                      className="flex-1 py-2 text-xs font-semibold text-slate-200 hover:text-white bg-slate-800/80 hover:bg-slate-700 rounded-lg transition-colors flex items-center justify-center gap-1.5"
                    >
                      <Eye className="w-3.5 h-3.5 text-cyan-400" />
                      <span>Xem chi tiết</span>
                    </button>
                    <button
                      onClick={() => onQuickQuote(product)}
                      className="py-2 px-3 text-xs font-semibold text-cyan-400 hover:text-slate-950 bg-cyan-950/50 hover:bg-cyan-400 border border-cyan-500/40 rounded-lg transition-colors flex items-center justify-center gap-1"
                      title="Gửi yêu cầu báo giá cho sản phẩm này"
                    >
                      <span>Báo giá</span>
                      <ArrowUpRight className="w-3.5 h-3.5" />
                    </button>
                  </div>

                </div>

              </div>
            ))}
          </div>
        ) : (
          <div className="p-12 text-center rounded-2xl bg-slate-900/30 border border-slate-800 max-w-lg mx-auto">
            <Cpu className="w-10 h-10 text-slate-600 mx-auto mb-3" />
            <h4 className="text-base font-semibold text-white">Không tìm thấy sản phẩm phù hợp</h4>
            <p className="text-xs text-slate-400 mt-1">
              Thử tìm kiếm với từ khóa khác hoặc chuyển sang danh mục "Tất cả".
            </p>
            <button
              onClick={() => {
                setSelectedCategory('Tất cả');
                setSearchQuery('');
              }}
              className="mt-4 px-4 py-2 text-xs font-semibold text-cyan-400 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors"
            >
              Đặt lại bộ lọc
            </button>
          </div>
        )}

      </div>
    </section>
  );
};
