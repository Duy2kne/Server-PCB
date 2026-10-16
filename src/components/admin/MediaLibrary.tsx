import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Check, Copy, ImagePlus, Loader2, RefreshCw, Trash2, X } from 'lucide-react';
import type { Product } from '../../types';
import { GitHubService } from '../../services/github';
import {
  BUILTIN_IMAGES,
  adminImageUrl,
  deleteUploadedImage,
  listUploadedImages,
  uploadImage,
  type MediaItem,
} from '../../services/content';
import { ACCEPT_ATTR, prepareImage } from '../../utils/imageCompress';

interface MediaLibraryProps {
  /** Có onPick = chế độ chọn ảnh (bấm ảnh để chọn); không có = chế độ quản lý */
  onPick?: (url: string) => void;
  selectedUrl?: string;
  /** Dùng để cảnh báo khi xóa ảnh đang được sản phẩm sử dụng */
  products?: Product[];
  /** Ảnh đang dùng ở nơi khác (vd. ảnh banner) */
  extraUsedUrls?: string[];
}

const formatSize = (bytes?: number) =>
  bytes === undefined ? '' : bytes > 1048576 ? `${(bytes / 1048576).toFixed(1)} MB` : `${Math.max(1, Math.round(bytes / 1024))} KB`;

export const MediaLibrary: React.FC<MediaLibraryProps> = ({ onPick, selectedUrl, products = [], extraUsedUrls = [] }) => {
  const connected = GitHubService.isConnected();
  const [uploaded, setUploaded] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const refresh = useCallback(async () => {
    if (!GitHubService.isConnected()) return;
    setLoading(true);
    setError('');
    try {
      setUploaded(await listUploadedImages());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không tải được danh sách ảnh.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const handleFiles = async (files: File[]) => {
    setError('');
    const added: MediaItem[] = [];
    for (const [i, file] of files.entries()) {
      setUploading(`Đang nén & tải lên ${i + 1}/${files.length}: ${file.name}`);
      try {
        const { blob, ext } = await prepareImage(file);
        added.push(await uploadImage(blob, file.name, ext));
      } catch (err) {
        setError(err instanceof Error ? err.message : `Không tải lên được ${file.name}.`);
        break;
      }
    }
    setUploading(null);
    if (added.length) {
      setUploaded(prev => [...added.reverse(), ...prev]);
      // Chế độ chọn: upload xong chọn luôn ảnh vừa tải
      if (onPick && files.length === 1) onPick(added[0].url);
      // Danh sách thật (có sha để xóa) lấy lại từ GitHub
      refresh();
    }
  };

  const usageOf = (url: string) => products.filter(p => p.imageUrl === url).length + extraUsedUrls.filter(u => u === url).length;

  const handleDelete = async (item: MediaItem) => {
    const used = usageOf(item.url);
    const warning = used ? `\n\n⚠ Ảnh đang được dùng ở ${used} nơi — các nơi đó sẽ mất ảnh.` : '';
    if (!confirm(`Xóa vĩnh viễn ảnh "${item.name}"?${warning}`)) return;
    setError('');
    try {
      await deleteUploadedImage(item);
      setUploaded(prev => prev.filter(u => u.url !== item.url));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không xóa được ảnh.');
    }
  };

  const copyUrl = async (url: string) => {
    await navigator.clipboard.writeText(url);
    setCopied(url);
    setTimeout(() => setCopied(''), 1500);
  };

  const items: MediaItem[] = [...uploaded, ...BUILTIN_IMAGES.map(b => ({ name: b.label, url: b.url }))];

  return (
    <div className="space-y-4 text-xs">
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          disabled={!connected || !!uploading}
          onClick={() => inputRef.current?.click()}
          className="px-4 py-2 font-semibold text-slate-950 bg-cyan-400 hover:bg-cyan-300 disabled:opacity-50 rounded-lg flex items-center gap-1.5"
        >
          {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ImagePlus className="w-4 h-4" />}
          <span>Tải ảnh lên</span>
        </button>
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPT_ATTR}
          multiple={!onPick}
          className="hidden"
          onChange={e => {
            const files = Array.from(e.target.files ?? []);
            e.target.value = '';
            if (files.length) handleFiles(files);
          }}
        />
        {connected && (
          <button type="button" onClick={refresh} disabled={loading} className="px-3 py-2 text-slate-300 bg-slate-950 border border-slate-800 hover:text-white rounded-lg flex items-center gap-1.5">
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Làm mới</span>
          </button>
        )}
        <span className="text-slate-500">
          {connected
            ? 'Ảnh được tự thu nhỏ (tối đa 1920px) và nén WebP trước khi lưu lên GitHub.'
            : 'Kết nối GitHub (tab Thư viện ảnh) để tải ảnh mới lên. Hiện chỉ chọn được ảnh có sẵn.'}
        </span>
      </div>

      {uploading && <p className="text-cyan-300">{uploading}</p>}
      {error && <p className="text-red-300">{error}</p>}

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        {items.map(item => {
          const selected = selectedUrl === item.url;
          const used = usageOf(item.url);
          return (
            <div
              key={item.url}
              className={`group rounded-xl border overflow-hidden bg-slate-950 ${selected ? 'border-cyan-400 ring-2 ring-cyan-400/40' : 'border-slate-800'}`}
            >
              <button
                type="button"
                onClick={() => (onPick ? onPick(item.url) : copyUrl(item.url))}
                className="relative block w-full aspect-[4/3] bg-slate-900"
                title={onPick ? 'Chọn ảnh này' : 'Sao chép đường dẫn ảnh'}
              >
                <img src={adminImageUrl(item.url)} alt={item.name} loading="lazy" className="w-full h-full object-cover" />
                {selected && (
                  <span className="absolute top-2 right-2 p-1 rounded-full bg-cyan-400 text-slate-950">
                    <Check className="w-3.5 h-3.5" />
                  </span>
                )}
              </button>
              <div className="px-2.5 py-2 flex items-center gap-2">
                <div className="flex-1 min-w-0">
                  <div className="truncate text-slate-200" title={item.name}>{item.name}</div>
                  <div className="text-[10px] text-slate-500 font-mono">
                    {item.file ? formatSize(item.size) : 'Ảnh có sẵn'}
                    {used > 0 && ` · đang dùng ${used}`}
                  </div>
                </div>
                <button type="button" onClick={() => copyUrl(item.url)} className="p-1 text-slate-400 hover:text-cyan-300" title="Sao chép đường dẫn">
                  {copied === item.url ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
                {item.file && !onPick && (
                  <button type="button" onClick={() => handleDelete(item)} className="p-1 text-slate-400 hover:text-red-400" title="Xóa ảnh">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

interface ImageFieldProps {
  label: string;
  value: string;
  onChange: (url: string) => void;
  products?: Product[];
}

/** Ô chọn ảnh: xem trước + mở thư viện để chọn / tải ảnh mới */
export const ImageField: React.FC<ImageFieldProps> = ({ label, value, onChange, products }) => {
  const [open, setOpen] = useState(false);

  return (
    <div className="space-y-2 text-xs">
      <label className="block font-medium text-slate-300">{label}</label>
      <div className="flex items-center gap-3">
        <div className="w-28 h-20 rounded-lg border border-slate-700 overflow-hidden bg-slate-950 shrink-0">
          {value && <img src={adminImageUrl(value)} alt="Xem trước" className="w-full h-full object-cover" />}
        </div>
        <div className="flex-1 space-y-2">
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="px-3.5 py-2 font-semibold text-cyan-300 bg-cyan-950/60 border border-cyan-500/40 hover:bg-cyan-900/60 rounded-lg flex items-center gap-1.5"
          >
            <ImagePlus className="w-4 h-4" />
            <span>Chọn / tải ảnh lên</span>
          </button>
          <input
            type="text"
            value={value}
            onChange={e => onChange(e.target.value)}
            placeholder="hoặc dán đường dẫn ảnh (https://...)"
            className="w-full px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-slate-300 font-mono text-[11px] focus:outline-none focus:border-cyan-500"
          />
        </div>
      </div>

      {open && (
        <div className="fixed inset-0 z-[60] bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setOpen(false)}>
          <div className="w-full max-w-4xl max-h-[88vh] overflow-y-auto bg-slate-900 border border-slate-700 rounded-2xl p-5 space-y-4" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white">Thư viện ảnh</h3>
              <button type="button" onClick={() => setOpen(false)} className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800">
                <X className="w-5 h-5" />
              </button>
            </div>
            <MediaLibrary
              selectedUrl={value}
              products={products}
              onPick={url => {
                onChange(url);
                setOpen(false);
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
};
