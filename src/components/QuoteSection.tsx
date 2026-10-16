import React, { useState } from 'react';
import { Send, UploadCloud, FileText, CheckCircle2, AlertCircle, X, Shield, Phone, Mail, MapPin } from 'lucide-react';
import { CompanySettings, AttachedFile, QuoteRequest } from '../types';
import { StorageService } from '../services/storage';
import { sendQuoteEmail } from '../services/email';

export interface GerberConfigData {
  fileName: string;
  width: number;
  height: number;
  color: string;
  finish: string;
  layers: number;
  quantity: number;
  estimatedPriceVnd: number;
}

interface QuoteSectionProps {
  settings: CompanySettings;
  prefilledService?: string;
  prefilledProductName?: string;
  prefilledGerberConfig?: GerberConfigData | null;
  onOpenGerberViewer?: () => void;
}

export const QuoteSection: React.FC<QuoteSectionProps> = ({
  settings,
  prefilledService,
  prefilledProductName,
  prefilledGerberConfig,
  onOpenGerberViewer,
}) => {
  const [fullName, setFullName] = useState('');
  const [company, setCompany] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [serviceType, setServiceType] = useState(
    prefilledGerberConfig ? 'Gia công & PCBA' : (prefilledService || 'Thiết kế PCB')
  );
  const [quantityEstimate, setQuantityEstimate] = useState(
    prefilledGerberConfig ? `${prefilledGerberConfig.quantity} pcs` : ''
  );
  const [timeline, setTimeline] = useState('Trong vòng 2 - 4 tuần');
  const [requirements, setRequirements] = useState(() => {
    if (prefilledGerberConfig) {
      return `Gia công PCB theo tệp Gerber: ${prefilledGerberConfig.fileName}\n- Kích thước: ${prefilledGerberConfig.width} × ${prefilledGerberConfig.height} mm\n- Màu sơn hàn: ${prefilledGerberConfig.color.toUpperCase()}\n- Mạ tiếp điểm: ${prefilledGerberConfig.finish}\n- Số lớp: ${prefilledGerberConfig.layers} lớp\n- Ước tính chi phí sơ bộ: ${prefilledGerberConfig.estimatedPriceVnd.toLocaleString('vi-VN')} VND`;
    }
    if (prefilledProductName) {
      return `Yêu cầu báo giá kỹ thuật và số lượng cho sản phẩm: ${prefilledProductName}`;
    }
    return '';
  });
  const [attachedFiles, setAttachedFiles] = useState<AttachedFile[]>(() => {
    if (prefilledGerberConfig) {
      return [
        {
          name: prefilledGerberConfig.fileName,
          size: '4.2 MB',
          type: 'application/zip',
        },
      ];
    }
    return [];
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedQuote, setSubmittedQuote] = useState<QuoteRequest | null>(null);
  const [errorMessage, setErrorMessage] = useState('');

  // Sync when prefilledGerberConfig changes
  React.useEffect(() => {
    if (prefilledGerberConfig) {
      setServiceType('Gia công & PCBA');
      setQuantityEstimate(`${prefilledGerberConfig.quantity} pcs`);
      setRequirements(
        `Gia công PCB theo tệp Gerber: ${prefilledGerberConfig.fileName}\n- Kích thước: ${prefilledGerberConfig.width} × ${prefilledGerberConfig.height} mm\n- Màu sơn hàn: ${prefilledGerberConfig.color.toUpperCase()}\n- Mạ tiếp điểm: ${prefilledGerberConfig.finish}\n- Số lớp: ${prefilledGerberConfig.layers} lớp\n- Ước tính chi phí sơ bộ: ${prefilledGerberConfig.estimatedPriceVnd.toLocaleString('vi-VN')} VND`
      );
      setAttachedFiles((prev) => {
        const exists = prev.some((f) => f.name === prefilledGerberConfig.fileName);
        if (exists) return prev;
        return [
          ...prev,
          {
            name: prefilledGerberConfig.fileName,
            size: '4.2 MB',
            type: 'application/zip',
          },
        ];
      });
    }
  }, [prefilledGerberConfig]);

  // Handle file upload simulation (can accept real files or provide sample uploads)
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const filesArray = Array.from(e.target.files);
      const newFiles: AttachedFile[] = filesArray.map(f => {
        const sizeMb = (f.size / (1024 * 1024)).toFixed(2);
        const sizeKb = (f.size / 1024).toFixed(0);
        return {
          name: f.name,
          size: f.size > 1024 * 1024 ? `${sizeMb} MB` : `${sizeKb} KB`,
          type: f.type || 'application/octet-stream',
        };
      });
      setAttachedFiles(prev => [...prev, ...newFiles]);
    }
  };

  const handleAddSampleFile = (type: 'gerber' | 'bom' | 'spec') => {
    if (type === 'gerber') {
      setAttachedFiles(prev => [
        ...prev,
        { name: 'Gerber_Archive_Design_v1.zip', size: '4.8 MB', type: 'application/zip' }
      ]);
    } else if (type === 'bom') {
      setAttachedFiles(prev => [
        ...prev,
        { name: 'BOM_Component_List.xlsx', size: '320 KB', type: 'application/vnd.ms-excel' }
      ]);
    } else {
      setAttachedFiles(prev => [
        ...prev,
        { name: 'Technical_Specification_Doc.pdf', size: '1.2 MB', type: 'application/pdf' }
      ]);
    }
  };

  const removeFile = (index: number) => {
    setAttachedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!fullName.trim() || !phone.trim() || !email.trim()) {
      setErrorMessage('Vui lòng điền họ tên, số điện thoại và email liên hệ.');
      return;
    }

    setIsSubmitting(true);

    let newQuote: QuoteRequest | null = null;
    try {
      newQuote = StorageService.addQuote({
        fullName: fullName.trim(),
        company: company.trim() || 'Doanh nghiệp cá nhân',
        phone: phone.trim(),
        email: email.trim(),
        serviceType,
        quantityEstimate: quantityEstimate.trim() || 'Thỏa thuận theo dự án',
        timeline,
        requirements: requirements.trim() || 'Khách hàng yêu cầu tư vấn kỹ thuật tổng quan.',
        attachedFiles,
      });

      // Gửi về email chủ website; lỗi thì giữ nguyên form để khách gửi lại hoặc gọi hotline
      await sendQuoteEmail(newQuote);

      setSubmittedQuote(newQuote);
      // Reset fields
      setFullName('');
      setCompany('');
      setPhone('');
      setEmail('');
      setQuantityEstimate('');
      setRequirements('');
      setAttachedFiles([]);
    } catch (err) {
      console.error('Gửi yêu cầu báo giá thất bại:', err);
      if (newQuote) StorageService.deleteQuote(newQuote.id);
      setErrorMessage(
        `Chưa gửi được yêu cầu (lỗi kết nối hệ thống). Vui lòng thử lại, hoặc liên hệ trực tiếp hotline ${settings.hotline} / Zalo / email ${settings.email}.`
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section id="contact" className="py-20 lg:py-28 bg-slate-950 relative border-t border-slate-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
          
          {/* Left Column: Contact Details & Engineering Consultation Info */}
          <div className="lg:col-span-5 space-y-8">
            <div>
              <div className="text-xs font-semibold text-cyan-400 font-mono tracking-wider uppercase mb-2">
                Liên Hệ & Báo Giá Kỹ Thuật
              </div>
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-white tracking-tight">
                Hiện Thực Hóa Dự Án Phần Cứng Của Bạn
              </h2>
              <p className="mt-3 text-sm sm:text-base text-slate-300 leading-relaxed">
                Gửi cho chúng tôi tệp thiết kế Gerber, danh mục linh kiện BOM hoặc mô tả ý tưởng kỹ thuật. 
                Đội ngũ kỹ sư R&D DY AUTOMATION sẽ phân tích DFM và gửi báo giá trong 24 giờ.
              </p>
            </div>

            {/* Direct Contact Cards */}
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 flex items-start gap-3.5">
                <div className="p-2.5 rounded-lg bg-cyan-950 border border-cyan-500/30 text-cyan-400 shrink-0">
                  <Phone className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs text-slate-400 font-mono">Hotline Kỹ Thuật & Zalo:</div>
                  <div className="text-sm font-bold text-white font-mono mt-0.5">{settings.hotline}</div>
                  <div className="text-xs text-cyan-400 mt-0.5">{settings.technicalSupport}</div>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 flex items-start gap-3.5">
                <div className="p-2.5 rounded-lg bg-cyan-950 border border-cyan-500/30 text-cyan-400 shrink-0">
                  <Mail className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs text-slate-400 font-mono">Email Tiếp Nhận Dự Án:</div>
                  <div className="text-sm font-bold text-white font-mono mt-0.5">{settings.email}</div>
                  <div className="text-xs text-slate-400 mt-0.5">Tiếp nhận Gerber, BOM 24/7</div>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 flex items-start gap-3.5">
                <div className="p-2.5 rounded-lg bg-cyan-950 border border-cyan-500/30 text-cyan-400 shrink-0">
                  <MapPin className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs text-slate-400 font-mono">Trụ Sở R&D & Nhà Xưởng:</div>
                  <div className="text-xs font-medium text-slate-200 mt-1">{settings.addressHanoi}</div>
                  <div className="text-xs text-slate-400 mt-1">{settings.addressHcm}</div>
                </div>
              </div>
            </div>

            {/* NDA & Security Guarantee */}
            <div className="p-4 rounded-xl bg-slate-900/30 border border-slate-800/80 flex items-center gap-3 text-xs text-slate-300">
              <Shield className="w-5 h-5 text-cyan-400 shrink-0" />
              <span>
                Cam kết ký thỏa thuận bảo mật <strong className="text-white">NDA</strong> bảo vệ 100% bản quyền sơ đồ nguyên lý và mã nguồn của khách hàng.
              </span>
            </div>

          </div>

          {/* Right Column: Quote Request Form */}
          <div className="lg:col-span-7 bg-slate-900/70 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-2xl relative">
            
            <h3 className="text-lg font-bold text-white mb-2">
              Biểu Mẫu Yêu Cầu Báo Giá Kỹ Thuật
            </h3>
            <p className="text-xs text-slate-400 mb-6">
              Điền thông tin và đính kèm tài liệu mô tả để nhận tư vấn kỹ thuật trực tiếp.
            </p>

            {errorMessage && (
              <div className="mb-6 p-3 rounded-lg bg-red-950/60 border border-red-500/50 flex items-center gap-2 text-xs text-red-200">
                <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">
                    Họ và tên khách hàng <span className="text-cyan-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Nguyễn Văn A"
                    className="w-full px-3.5 py-2.5 text-xs bg-slate-950 border border-slate-800 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">
                    Tên công ty / Đơn vị
                  </label>
                  <input
                    type="text"
                    value={company}
                    onChange={(e) => setCompany(e.target.value)}
                    placeholder="Công ty TNHH Kỹ Thuật..."
                    className="w-full px-3.5 py-2.5 text-xs bg-slate-950 border border-slate-800 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition-colors"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">
                    Số điện thoại liên hệ <span className="text-cyan-400">*</span>
                  </label>
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="0912 345 678"
                    className="w-full px-3.5 py-2.5 text-xs bg-slate-950 border border-slate-800 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">
                    Email nhận báo giá <span className="text-cyan-400">*</span>
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="contact@company.com"
                    className="w-full px-3.5 py-2.5 text-xs bg-slate-950 border border-slate-800 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition-colors"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">
                    Dịch vụ cần báo giá
                  </label>
                  <select
                    value={serviceType}
                    onChange={(e) => setServiceType(e.target.value)}
                    className="w-full px-3 py-2.5 text-xs bg-slate-950 border border-slate-800 rounded-lg text-white focus:outline-none focus:border-cyan-500"
                  >
                    <option value="Thiết kế PCB">Thiết kế PCB (Schematic/Layout)</option>
                    <option value="Gia công & PCBA">Gia công & Sản xuất PCBA</option>
                    <option value="Tool Automation">Phát triển Tool Automation & SCADA</option>
                    <option value="Trọn gói R&D đến Sản xuất">Trọn gói từ R&D đến Sản xuất</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">
                    Số lượng dự kiến
                  </label>
                  <input
                    type="text"
                    value={quantityEstimate}
                    onChange={(e) => setQuantityEstimate(e.target.value)}
                    placeholder="5 prototype / 500 pcs..."
                    className="w-full px-3.5 py-2.5 text-xs bg-slate-950 border border-slate-800 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">
                    Tiến độ mong muốn
                  </label>
                  <select
                    value={timeline}
                    onChange={(e) => setTimeline(e.target.value)}
                    className="w-full px-3 py-2.5 text-xs bg-slate-950 border border-slate-800 rounded-lg text-white focus:outline-none focus:border-cyan-500"
                  >
                    <option value="Cực gấp (3 - 7 ngày)">Cực gấp (3 - 7 ngày)</option>
                    <option value="Trong vòng 2 - 4 tuần">Trong vòng 2 - 4 tuần</option>
                    <option value="Theo giai đoạn dự án">Theo từng mốc milestone</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Mô tả yêu cầu kỹ thuật & chức năng mong muốn
                </label>
                <textarea
                  rows={3}
                  value={requirements}
                  onChange={(e) => setRequirements(e.target.value)}
                  placeholder="Ví dụ: Thiết kế bo mạch nguồn 12V 5A, MCU ESP32 kết nối RS485, phần mềm giám sát SCADA..."
                  className="w-full px-3.5 py-2.5 text-xs bg-slate-950 border border-slate-800 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 resize-none leading-relaxed"
                />
              </div>

              {/* File Upload Zone */}
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Đính kèm tệp mô tả (Gerber .zip, BOM .xlsx, Tài liệu kỹ thuật .pdf)
                </label>

                <div className="border border-dashed border-slate-700 hover:border-cyan-500/60 rounded-xl p-4 bg-slate-950/60 text-center transition-colors">
                  <UploadCloud className="w-7 h-7 text-cyan-400 mx-auto mb-2" />
                  <div className="text-xs text-slate-300">
                    <label className="text-cyan-400 font-semibold cursor-pointer hover:underline">
                      Chọn tệp từ máy tính
                      <input
                        type="file"
                        multiple
                        className="hidden"
                        onChange={handleFileUpload}
                      />
                    </label>
                    <span className="text-slate-500"> hoặc tải tệp mẫu thử nghiệm:</span>
                  </div>

                  <div className="mt-2 flex flex-wrap items-center justify-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleAddSampleFile('gerber')}
                      className="text-[11px] font-mono px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700"
                    >
                      + Gerber_Sample.zip
                    </button>
                    <button
                      type="button"
                      onClick={() => handleAddSampleFile('bom')}
                      className="text-[11px] font-mono px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700"
                    >
                      + BOM_Components.xlsx
                    </button>
                    <button
                      type="button"
                      onClick={() => handleAddSampleFile('spec')}
                      className="text-[11px] font-mono px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700"
                    >
                      + Spec_Doc.pdf
                    </button>
                  </div>

                  {onOpenGerberViewer && (
                    <div className="mt-3 pt-2.5 border-t border-slate-800/80">
                      <button
                        type="button"
                        onClick={onOpenGerberViewer}
                        className="text-xs text-cyan-400 hover:text-cyan-300 font-semibold inline-flex items-center gap-1.5 hover:underline"
                      >
                        <span>🔬 Muốn xem file Gerber 2D, đo kích thước & đổi màu mạch như JLCPCB? Bấm vào đây</span>
                      </button>
                    </div>
                  )}
                </div>

                {/* Attached Files List */}
                {attachedFiles.length > 0 && (
                  <div className="mt-3 space-y-2">
                    {attachedFiles.map((f, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between p-2 rounded-lg bg-slate-950 border border-slate-800 text-xs"
                      >
                        <div className="flex items-center gap-2 truncate">
                          <FileText className="w-4 h-4 text-cyan-400 shrink-0" />
                          <span className="text-slate-200 font-mono truncate">{f.name}</span>
                          <span className="text-[10px] text-slate-500 font-mono">({f.size})</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeFile(idx)}
                          className="p-1 text-slate-500 hover:text-red-400 transition-colors"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3 px-6 text-sm font-semibold text-slate-950 bg-gradient-to-r from-cyan-400 to-cyan-300 hover:from-cyan-300 hover:to-cyan-200 rounded-lg shadow-xl shadow-cyan-500/20 hover:shadow-cyan-500/30 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <Send className="w-4 h-4" />
                <span>{isSubmitting ? 'Đang gửi yêu cầu...' : 'Gửi Yêu Cầu Báo Giá Kỹ Thuật'}</span>
              </button>

            </form>

          </div>

        </div>

      </div>

      {/* Confirmation Modal on Successful Submission */}
      {submittedQuote && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-slate-900 border border-cyan-500/50 rounded-2xl max-w-md w-full p-6 text-center shadow-2xl space-y-4">
            <div className="w-14 h-14 rounded-full bg-cyan-500/20 border border-cyan-500/40 text-cyan-400 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <h3 className="text-xl font-bold text-white">Tiếp Nhận Thành Công!</h3>
            
            <p className="text-xs text-slate-300">
              Yêu cầu báo giá của bạn đã được chuyển tới bộ phận kỹ sư R&D của DY AUTOMATION.
            </p>

            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs space-y-1">
              <div className="text-slate-400">Mã yêu cầu (Reference Code):</div>
              <div className="text-base font-bold font-mono text-cyan-400">{submittedQuote.code}</div>
              <div className="text-[11px] text-slate-500">Dịch vụ: {submittedQuote.serviceType}</div>
            </div>

            <p className="text-[11px] text-slate-400">
              Chúng tôi sẽ liên hệ qua số <strong className="text-slate-200">{submittedQuote.phone}</strong> hoặc email <strong className="text-slate-200">{submittedQuote.email}</strong> trong vòng 24 giờ làm việc.
            </p>

            <button
              onClick={() => setSubmittedQuote(null)}
              className="w-full py-2.5 text-xs font-semibold text-slate-950 bg-cyan-400 hover:bg-cyan-300 rounded-lg transition-colors"
            >
              Hoàn tất & Tiếp tục duyệt website
            </button>
          </div>
        </div>
      )}

    </section>
  );
};
