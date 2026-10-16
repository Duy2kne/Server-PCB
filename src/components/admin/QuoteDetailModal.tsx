import React, { useState } from 'react';
import { X, Check, FileText, Phone, Mail, Building2, Calendar, Download, Trash2, Clock, AlertTriangle } from 'lucide-react';
import { QuoteRequest, QuoteStatus } from '../../types';

interface QuoteDetailModalProps {
  quote: QuoteRequest | null;
  onClose: () => void;
  onUpdateStatus: (id: string, status: QuoteStatus, internalNotes?: string) => void;
  onDelete: (id: string) => void;
}

export const QuoteDetailModal: React.FC<QuoteDetailModalProps> = ({
  quote,
  onClose,
  onUpdateStatus,
  onDelete,
}) => {
  if (!quote) return null;

  const [status, setStatus] = useState<QuoteStatus>(quote.status);
  const [internalNotes, setInternalNotes] = useState(quote.internalNotes || '');
  const [savedToast, setSavedToast] = useState(false);

  const handleSave = () => {
    onUpdateStatus(quote.id, status, internalNotes);
    setSavedToast(true);
    setTimeout(() => setSavedToast(false), 2000);
  };

  const statusLabels: Record<QuoteStatus, { label: string; color: string }> = {
    new: { label: 'Mới tiếp nhận', color: 'text-amber-400 bg-amber-950/60 border-amber-500/40' },
    reviewing: { label: 'Đang xử lý kỹ thuật', color: 'text-sky-400 bg-sky-950/60 border-sky-500/40' },
    quoted: { label: 'Đã gửi báo giá', color: 'text-cyan-400 bg-cyan-950/60 border-cyan-500/40' },
    completed: { label: 'Đã hoàn thành / Chốt', color: 'text-emerald-400 bg-emerald-950/60 border-emerald-500/40' },
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
      <div 
        className="relative w-full max-w-2xl bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/70">
          <div className="flex items-center gap-3">
            <span className="font-mono text-cyan-400 font-bold text-sm">{quote.code}</span>
            <span className={`px-2.5 py-0.5 rounded text-[11px] font-mono border ${statusLabels[quote.status].color}`}>
              {statusLabels[quote.status].label}
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto p-6 space-y-6 text-xs">
          
          {/* Customer Overview */}
          <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <div className="text-slate-400 font-mono text-[10px] uppercase">Khách hàng:</div>
              <div className="text-sm font-bold text-white mt-0.5">{quote.fullName}</div>
              <div className="text-slate-400 mt-1 flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                <span>{quote.company || 'Doanh nghiệp cá nhân'}</span>
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center gap-2 text-slate-300">
                <Phone className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                <span className="font-mono font-semibold text-white">{quote.phone}</span>
              </div>
              <div className="flex items-center gap-2 text-slate-300">
                <Mail className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                <span>{quote.email}</span>
              </div>
              <div className="flex items-center gap-2 text-slate-400 font-mono text-[11px]">
                <Calendar className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                <span>{new Date(quote.createdAt).toLocaleString('vi-VN')}</span>
              </div>
            </div>
          </div>

          {/* Requested Service & Scope */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-3 rounded-lg bg-slate-950/40 border border-slate-800">
              <span className="text-slate-400 text-[10px] uppercase font-mono">Dịch vụ yêu cầu:</span>
              <div className="text-xs font-bold text-cyan-300 mt-1">{quote.serviceType}</div>
            </div>
            <div className="p-3 rounded-lg bg-slate-950/40 border border-slate-800">
              <span className="text-slate-400 text-[10px] uppercase font-mono">Số lượng dự kiến:</span>
              <div className="text-xs font-semibold text-white mt-1 font-mono">{quote.quantityEstimate}</div>
            </div>
            <div className="p-3 rounded-lg bg-slate-950/40 border border-slate-800">
              <span className="text-slate-400 text-[10px] uppercase font-mono">Tiến độ mong muốn:</span>
              <div className="text-xs font-semibold text-white mt-1">{quote.timeline}</div>
            </div>
          </div>

          {/* Technical Requirements Description */}
          <div>
            <span className="text-slate-400 text-[10px] uppercase font-mono block mb-1.5">
              Chi tiết yêu cầu kỹ thuật của khách:
            </span>
            <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-300 leading-relaxed whitespace-pre-wrap">
              {quote.requirements}
            </div>
          </div>

          {/* Attached Files */}
          <div>
            <span className="text-slate-400 text-[10px] uppercase font-mono block mb-1.5">
              Tệp đính kèm ({quote.attachedFiles?.length || 0}):
            </span>
            {quote.attachedFiles && quote.attachedFiles.length > 0 ? (
              <div className="space-y-2">
                {quote.attachedFiles.map((file, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-lg bg-slate-950 border border-slate-800 flex items-center justify-between"
                  >
                    <div className="flex items-center gap-2.5 truncate">
                      <FileText className="w-4 h-4 text-cyan-400 shrink-0" />
                      <span className="text-white font-mono truncate">{file.name}</span>
                      <span className="text-[10px] text-slate-500 font-mono">({file.size})</span>
                    </div>
                    <span className="text-[11px] font-mono text-cyan-400 px-2 py-0.5 rounded bg-slate-900 border border-slate-800">
                      Sẵn sàng tải / Đọc Gerber
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-slate-500 italic p-3 rounded-lg bg-slate-950/30 border border-slate-800/60">
                Khách hàng không đính kèm tệp tin.
              </div>
            )}
          </div>

          {/* Status & Engineering Internal Notes */}
          <div className="pt-4 border-t border-slate-800 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
              <div>
                <label className="block text-slate-300 font-medium mb-1">
                  Cập nhật trạng thái xử lý:
                </label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as QuoteStatus)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white font-semibold focus:outline-none focus:border-cyan-500"
                >
                  <option value="new">Mới tiếp nhận (Chưa liên hệ)</option>
                  <option value="reviewing">Đang xử lý kỹ thuật (Phân tích DFM)</option>
                  <option value="quoted">Đã gửi báo giá (Chờ phản hồi)</option>
                  <option value="completed">Đã hoàn thành / Chốt hợp đồng</option>
                </select>
              </div>

              <div>
                <span className="text-slate-400 text-[10px] block mb-1">Thao tác dữ liệu:</span>
                <button
                  type="button"
                  onClick={() => {
                    if (confirm(`Bạn có chắc chắn muốn xóa yêu cầu ${quote.code}?`)) {
                      onDelete(quote.id);
                      onClose();
                    }
                  }}
                  className="px-3 py-2 text-xs text-red-400 hover:text-red-300 bg-red-950/40 hover:bg-red-950/80 border border-red-500/30 rounded-lg transition-colors flex items-center gap-1.5"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Xóa bản ghi yêu cầu này</span>
                </button>
              </div>
            </div>

            <div>
              <label className="block text-slate-300 font-medium mb-1">
                Ghi chú nội bộ kỹ sư (Internal Notes):
              </label>
              <textarea
                rows={2}
                value={internalNotes}
                onChange={(e) => setInternalNotes(e.target.value)}
                placeholder="Ghi lại tiến trình trao đổi với khách, dự kiến chi phí, mã linh kiện thay thế..."
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 resize-none leading-relaxed"
              />
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-800 bg-slate-950/80 flex items-center justify-between">
          <div>
            {savedToast && (
              <span className="text-emerald-400 flex items-center gap-1 text-xs font-medium animate-in fade-in">
                <Check className="w-3.5 h-3.5" />
                <span>Đã lưu trạng thái thành công!</span>
              </span>
            )}
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-slate-400 hover:text-white bg-slate-800 rounded-lg transition-colors text-xs"
            >
              Đóng
            </button>
            <button
              onClick={handleSave}
              className="px-5 py-2 font-semibold text-slate-950 bg-cyan-400 hover:bg-cyan-300 rounded-lg transition-colors text-xs flex items-center gap-1.5"
            >
              <Check className="w-4 h-4" />
              <span>Lưu Cập Nhật</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
