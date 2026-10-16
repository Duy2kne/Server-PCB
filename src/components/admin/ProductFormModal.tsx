import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2, Cpu, Check, AlertCircle } from 'lucide-react';
import { Product, ProductCategory, ProductSpec } from '../../types';
import { BUILTIN_IMAGES } from '../../services/content';
import { ImageField } from './MediaLibrary';

interface ProductFormModalProps {
  product: Product | null; // null means adding a new product
  onClose: () => void;
  onSave: (productData: Omit<Product, 'id' | 'updatedAt'>) => void;
  /** Danh sách sản phẩm (để thư viện ảnh biết ảnh nào đang dùng) */
  products?: Product[];
}

export const ProductFormModal: React.FC<ProductFormModalProps> = ({
  product,
  onClose,
  onSave,
  products,
}) => {
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<ProductCategory>('Thiết kế PCB');
  const [status, setStatus] = useState<Product['status']>('Thương mại sẵn có');
  const [priceEstimate, setPriceEstimate] = useState('Liên hệ báo giá kỹ thuật');
  const [shortDesc, setShortDesc] = useState('');
  const [fullDesc, setFullDesc] = useState('');
  const [imageUrl, setImageUrl] = useState(BUILTIN_IMAGES[0].url);
  const [specs, setSpecs] = useState<ProductSpec[]>([
    { key: 'Vi điều khiển / CPU', value: '32-bit MCU' },
    { key: 'Điện áp cấp', value: '12V - 24V DC' },
  ]);
  const [features, setFeatures] = useState<string[]>([
    'Tối ưu hóa chống nhiễu công nghiệp',
    'Bảo vệ quá áp và ngắn mạch ngõ ra'
  ]);
  const [error, setError] = useState('');

  useEffect(() => {
    if (product) {
      setTitle(product.title);
      setCategory(product.category);
      setStatus(product.status);
      setPriceEstimate(product.priceEstimate);
      setShortDesc(product.shortDesc);
      setFullDesc(product.fullDesc);
      setImageUrl(product.imageUrl);
      setSpecs(product.specs && product.specs.length > 0 ? product.specs : [{ key: '', value: '' }]);
      setFeatures(product.features && product.features.length > 0 ? product.features : ['']);
    }
  }, [product]);

  const handleAddSpec = () => {
    setSpecs([...specs, { key: '', value: '' }]);
  };

  const handleSpecChange = (index: number, field: 'key' | 'value', value: string) => {
    const updated = [...specs];
    updated[index][field] = value;
    setSpecs(updated);
  };

  const handleRemoveSpec = (index: number) => {
    setSpecs(specs.filter((_, i) => i !== index));
  };

  const handleAddFeature = () => {
    setFeatures([...features, '']);
  };

  const handleFeatureChange = (index: number, value: string) => {
    const updated = [...features];
    updated[index] = value;
    setFeatures(updated);
  };

  const handleRemoveFeature = (index: number) => {
    setFeatures(features.filter((_, i) => i !== index));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !shortDesc.trim()) {
      setError('Vui lòng nhập tên sản phẩm và mô tả ngắn.');
      return;
    }

    // Clean up empty specs and features
    const cleanedSpecs = specs.filter(s => s.key.trim() && s.value.trim());
    const cleanedFeatures = features.filter(f => f.trim());

    onSave({
      title: title.trim(),
      category,
      status,
      priceEstimate: priceEstimate.trim() || 'Liên hệ báo giá',
      shortDesc: shortDesc.trim(),
      fullDesc: fullDesc.trim() || shortDesc.trim(),
      imageUrl: imageUrl.trim() || BUILTIN_IMAGES[0].url,
      specs: cleanedSpecs,
      features: cleanedFeatures,
    });
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
      <div 
        className="relative w-full max-w-3xl bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/70">
          <div className="flex items-center gap-2.5">
            <Cpu className="w-5 h-5 text-cyan-400" />
            <h3 className="text-base font-bold text-white">
              {product ? 'Chỉnh Sửa Thông Tin Sản Phẩm' : 'Thêm Sản Phẩm / Dự Án Mới'}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="overflow-y-auto p-6 space-y-6 text-xs">
          
          {error && (
            <div className="p-3 rounded-lg bg-red-950/60 border border-red-500/50 flex items-center gap-2 text-red-200">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Row 1: Title & Category */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-2">
              <label className="block font-medium text-slate-300 mb-1">
                Tên sản phẩm / Dự án <span className="text-cyan-400">*</span>
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ví dụ: Mạch điều khiển Chiller Mini 12V ESP32..."
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div>
              <label className="block font-medium text-slate-300 mb-1">
                Danh mục kỹ thuật <span className="text-cyan-400">*</span>
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as ProductCategory)}
                className="w-full px-3 py-2.5 bg-slate-950 border border-slate-800 rounded-lg text-white focus:outline-none focus:border-cyan-500"
              >
                <option value="Thiết kế PCB">Thiết kế PCB</option>
                <option value="Gia công & PCBA">Gia công & PCBA</option>
                <option value="Automation Tools">Automation Tools</option>
              </select>
            </div>
          </div>

          {/* Row 2: Status & Price */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-medium text-slate-300 mb-1">
                Tình trạng sản phẩm
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as Product['status'])}
                className="w-full px-3 py-2.5 bg-slate-950 border border-slate-800 rounded-lg text-white focus:outline-none focus:border-cyan-500"
              >
                <option value="Thương mại sẵn có">Thương mại sẵn có</option>
                <option value="Sản xuất theo đơn">Sản xuất theo đơn</option>
                <option value="Sẵn sàng chuyển giao">Sẵn sàng chuyển giao</option>
                <option value="Dự án OEM/ODM">Dự án OEM/ODM</option>
              </select>
            </div>

            <div>
              <label className="block font-medium text-slate-300 mb-1">
                Định mức giá / Tùy chọn chi phí
              </label>
              <input
                type="text"
                value={priceEstimate}
                onChange={(e) => setPriceEstimate(e.target.value)}
                placeholder="Ví dụ: Liên hệ báo giá / Theo số lượng..."
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 font-mono"
              />
            </div>
          </div>

          {/* Image Selection & Preview */}
          <ImageField label="Hình ảnh sản phẩm / bài viết" value={imageUrl} onChange={setImageUrl} products={products} />

          {/* Short Description */}
          <div>
            <label className="block font-medium text-slate-300 mb-1">
              Mô tả ngắn (hiển thị trên thẻ sản phẩm) <span className="text-cyan-400">*</span>
            </label>
            <textarea
              rows={2}
              required
              value={shortDesc}
              onChange={(e) => setShortDesc(e.target.value)}
              placeholder="Tóm tắt 1 - 2 câu về ứng dụng chính của sản phẩm..."
              className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 resize-none"
            />
          </div>

          {/* Detailed Description */}
          <div>
            <label className="block font-medium text-slate-300 mb-1">
              Mô tả chi tiết kỹ thuật & nguyên lý hoạt động
            </label>
            <textarea
              rows={4}
              value={fullDesc}
              onChange={(e) => setFullDesc(e.target.value)}
              placeholder="Giải thích chi tiết về linh kiện, cách ly, tín hiệu, phần mềm nhúng..."
              className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 resize-none"
            />
          </div>

          {/* Technical Specifications Builder */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="font-medium text-slate-300">
                Thông số kỹ thuật (Key - Value)
              </label>
              <button
                type="button"
                onClick={handleAddSpec}
                className="px-2.5 py-1 text-[11px] font-semibold text-cyan-400 bg-slate-800 hover:bg-slate-700 rounded transition-colors flex items-center gap-1"
              >
                <Plus className="w-3 h-3" />
                <span>Thêm thông số</span>
              </button>
            </div>

            <div className="space-y-2">
              {specs.map((spec, index) => (
                <div key={index} className="flex items-center gap-2">
                  <input
                    type="text"
                    value={spec.key}
                    onChange={(e) => handleSpecChange(index, 'key', e.target.value)}
                    placeholder="Tên thông số (Ví dụ: Điện áp)"
                    className="w-1/3 px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-md text-white placeholder-slate-600 focus:outline-none focus:border-cyan-500"
                  />
                  <input
                    type="text"
                    value={spec.value}
                    onChange={(e) => handleSpecChange(index, 'value', e.target.value)}
                    placeholder="Giá trị (Ví dụ: 12V DC ±5%)"
                    className="flex-1 px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-md text-cyan-200 font-mono placeholder-slate-600 focus:outline-none focus:border-cyan-500"
                  />
                  {specs.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveSpec(index)}
                      className="p-1.5 text-slate-500 hover:text-red-400 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Features Builder */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="font-medium text-slate-300">
                Tính năng nổi bật (Bullet points)
              </label>
              <button
                type="button"
                onClick={handleAddFeature}
                className="px-2.5 py-1 text-[11px] font-semibold text-cyan-400 bg-slate-800 hover:bg-slate-700 rounded transition-colors flex items-center gap-1"
              >
                <Plus className="w-3 h-3" />
                <span>Thêm tính năng</span>
              </button>
            </div>

            <div className="space-y-2">
              {features.map((feat, index) => (
                <div key={index} className="flex items-center gap-2">
                  <input
                    type="text"
                    value={feat}
                    onChange={(e) => handleFeatureChange(index, e.target.value)}
                    placeholder="Mô tả 1 tính năng nổi bật..."
                    className="flex-1 px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-md text-white placeholder-slate-600 focus:outline-none focus:border-cyan-500"
                  />
                  {features.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveFeature(index)}
                      className="p-1.5 text-slate-500 hover:text-red-400 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Form Actions */}
          <div className="pt-4 border-t border-slate-800 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors"
            >
              Hủy
            </button>
            <button
              type="submit"
              className="px-5 py-2 font-semibold text-slate-950 bg-cyan-400 hover:bg-cyan-300 rounded-lg transition-colors flex items-center gap-1.5"
            >
              <Check className="w-4 h-4" />
              <span>{product ? 'Lưu thay đổi' : 'Thêm sản phẩm'}</span>
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
