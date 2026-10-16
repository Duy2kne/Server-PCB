import React, { useState } from 'react';
import {
  LayoutDashboard,
  Cpu,
  FileSpreadsheet,
  Settings,
  Plus,
  Search,
  Edit2,
  Trash2,
  Eye,
  ExternalLink,
  RotateCcw,
  CheckCircle2,
  Clock,
  Phone,
  Mail,
  Building,
  Check,
  AlertCircle,
  LogOut,
  Images,
  Loader2,
  CloudOff
} from 'lucide-react';
import { Product, QuoteRequest, CompanySettings, QuoteStatus } from '../../types';
import { StorageService } from '../../services/storage';
import { ProductFormModal } from './ProductFormModal';
import { QuoteDetailModal } from './QuoteDetailModal';
import { MediaLibrary, ImageField } from './MediaLibrary';
import { GitHubConnectPanel } from './GitHubConnectPanel';
import { GitHubService } from '../../services/github';
import { adminImageUrl, publishProducts, publishSettings } from '../../services/content';

type PublishToast = { kind: 'saving' | 'ok' | 'warn' | 'error'; text: string } | null;

interface AdminDashboardProps {
  products: Product[];
  quotes: QuoteRequest[];
  settings: CompanySettings;
  onNavigateClient: () => void;
  onLogout: () => void;
  onRefreshData: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  products,
  quotes,
  settings,
  onNavigateClient,
  onLogout,
  onRefreshData,
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'products' | 'quotes' | 'media' | 'settings'>('overview');
  const [githubConnected, setGithubConnected] = useState(GitHubService.isConnected());
  const [toast, setToast] = useState<PublishToast>(null);
  
  // Product state
  const [productSearch, setProductSearch] = useState('');
  const [productCategoryFilter, setProductCategoryFilter] = useState('All');
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);

  // Quote state
  const [quoteSearch, setQuoteSearch] = useState('');
  const [quoteStatusFilter, setQuoteStatusFilter] = useState<string>('all');
  const [inspectingQuote, setInspectingQuote] = useState<QuoteRequest | null>(null);

  // Settings form state
  const [settingsForm, setSettingsForm] = useState<CompanySettings>({ ...settings });
  const [settingsSaveSuccess, setSettingsSaveSuccess] = useState(false);
  const [resetSuccess, setResetSuccess] = useState(false);

  // KPI calculations
  const totalProducts = products.length;
  const totalQuotes = quotes.length;
  const newQuotesCount = quotes.filter(q => q.status === 'new').length;
  const reviewingQuotesCount = quotes.filter(q => q.status === 'reviewing').length;
  const completedQuotesCount = quotes.filter(q => q.status === 'completed' || q.status === 'quoted').length;

  // Filtered Products
  const filteredProducts = products.filter(p => {
    const matchCat = productCategoryFilter === 'All' || p.category === productCategoryFilter;
    const matchSearch = p.title.toLowerCase().includes(productSearch.toLowerCase()) ||
      p.shortDesc.toLowerCase().includes(productSearch.toLowerCase());
    return matchCat && matchSearch;
  });

  // Filtered Quotes
  const filteredQuotes = quotes.filter(q => {
    const matchStatus = quoteStatusFilter === 'all' || q.status === quoteStatusFilter;
    const matchSearch =
      q.code.toLowerCase().includes(quoteSearch.toLowerCase()) ||
      q.fullName.toLowerCase().includes(quoteSearch.toLowerCase()) ||
      q.company.toLowerCase().includes(quoteSearch.toLowerCase()) ||
      q.phone.includes(quoteSearch);
    return matchStatus && matchSearch;
  });

  /** Lưu thay đổi lên GitHub để khách thấy (bản trên máy đã được lưu trước đó) */
  const publish = async (task: () => Promise<void>) => {
    if (!GitHubService.isConnected()) {
      setToast({ kind: 'warn', text: 'Đã lưu trên máy này. Chưa kết nối GitHub nên khách chưa thấy — vào tab "Thư viện ảnh" để kết nối.' });
      return;
    }
    setToast({ kind: 'saving', text: 'Đang lưu lên GitHub...' });
    try {
      await task();
      setToast({ kind: 'ok', text: 'Đã lưu lên GitHub. Web của khách cập nhật sau khoảng 1–2 phút.' });
      setTimeout(() => setToast(t => (t?.kind === 'ok' ? null : t)), 6000);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setToast({ kind: 'error', text: `Lưu lên GitHub thất bại: ${msg} Thay đổi mới chỉ nằm trên máy này — hãy bấm Lưu lại.` });
    }
  };

  // Handlers for Products
  const handleOpenAddProduct = () => {
    setEditingProduct(null);
    setIsProductModalOpen(true);
  };

  const handleOpenEditProduct = (product: Product) => {
    setEditingProduct(product);
    setIsProductModalOpen(true);
  };

  const handleSaveProduct = (productData: Omit<Product, 'id' | 'updatedAt'>) => {
    if (editingProduct) {
      StorageService.updateProduct(editingProduct.id, productData);
    } else {
      StorageService.addProduct(productData);
    }
    setIsProductModalOpen(false);
    onRefreshData();
    publish(() => publishProducts(`${editingProduct ? 'Sửa' : 'Thêm'} sản phẩm: ${productData.title}`));
  };

  const handleDeleteProduct = (id: string, title: string) => {
    if (confirm(`Bạn có chắc chắn muốn xóa sản phẩm "${title}"?`)) {
      StorageService.deleteProduct(id);
      onRefreshData();
      publish(() => publishProducts(`Xóa sản phẩm: ${title}`));
    }
  };

  // Handlers for Quotes
  const handleUpdateQuoteStatus = (id: string, status: QuoteStatus, internalNotes?: string) => {
    StorageService.updateQuoteStatus(id, status, internalNotes);
    onRefreshData();
  };

  const handleDeleteQuote = (id: string) => {
    StorageService.deleteQuote(id);
    onRefreshData();
  };

  // Handlers for Settings
  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    StorageService.saveSettings(settingsForm);
    setSettingsSaveSuccess(true);
    setTimeout(() => setSettingsSaveSuccess(false), 2500);
    onRefreshData();
    publish(() => publishSettings('Cập nhật cấu hình doanh nghiệp'));
  };

  const handleResetDefaults = () => {
    const online = GitHubService.isConnected() ? '\n\n⚠ Đang kết nối GitHub: bản mẫu sẽ GHI ĐÈ nội dung trên web của khách.' : '';
    if (confirm(`Khôi phục toàn bộ danh sách sản phẩm, báo giá và cấu hình về dữ liệu mẫu ban đầu?${online}`)) {
      StorageService.resetAllDefaults();
      setResetSuccess(true);
      setTimeout(() => setResetSuccess(false), 2500);
      onRefreshData();
      setSettingsForm(StorageService.getSettings());
      publish(async () => {
        await publishProducts('Khôi phục sản phẩm mẫu');
        await publishSettings('Khôi phục cấu hình mẫu');
      });
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      
      {/* Top Admin Header */}
      <header className="bg-slate-900 border-b border-slate-800 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-cyan-950 border border-cyan-500/40 flex items-center justify-center text-cyan-400">
                <Cpu className="w-4 h-4" />
              </div>
              <span className="font-extrabold text-white text-base tracking-tight">
                DY AUTOMATION <span className="text-cyan-400 font-mono text-xs font-semibold px-2 py-0.5 rounded bg-cyan-950 border border-cyan-500/30 ml-1">ADMIN CONSOLE</span>
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={onNavigateClient}
              className="px-3.5 py-1.5 text-xs font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors flex items-center gap-1.5"
            >
              <span>Xem trang Khách hàng</span>
              <ExternalLink className="w-3.5 h-3.5 text-cyan-400" />
            </button>
            <button
              onClick={onLogout}
              className="px-3.5 py-1.5 text-xs font-medium text-red-300 hover:text-white bg-red-950/60 hover:bg-red-900/70 border border-red-500/30 rounded-lg transition-colors flex items-center gap-1.5"
            >
              <span>Đăng xuất</span>
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Admin Workspace with Sidebar/Tabs */}
      <div className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Navigation Tabs Bar */}
        <div className="flex items-center gap-2 border-b border-slate-800 pb-3 mb-8 overflow-x-auto scrollbar-none">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-4 py-2 text-xs font-semibold rounded-lg flex items-center gap-2 transition-all whitespace-nowrap ${
              activeTab === 'overview'
                ? 'bg-cyan-500 text-slate-950 shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
          >
            <LayoutDashboard className="w-4 h-4" />
            <span>Tổng Quan (Overview)</span>
          </button>

          <button
            onClick={() => setActiveTab('products')}
            className={`px-4 py-2 text-xs font-semibold rounded-lg flex items-center gap-2 transition-all whitespace-nowrap ${
              activeTab === 'products'
                ? 'bg-cyan-500 text-slate-950 shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
          >
            <Cpu className="w-4 h-4" />
            <span>Quản Lý Sản Phẩm & Dự Án ({products.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('quotes')}
            className={`px-4 py-2 text-xs font-semibold rounded-lg flex items-center gap-2 transition-all whitespace-nowrap relative ${
              activeTab === 'quotes'
                ? 'bg-cyan-500 text-slate-950 shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Yêu Cầu Báo Giá ({quotes.length})</span>
            {newQuotesCount > 0 && (
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono font-bold ${
                activeTab === 'quotes' ? 'bg-slate-950 text-cyan-300' : 'bg-amber-500 text-slate-950'
              }`}>
                {newQuotesCount} mới
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('media')}
            className={`px-4 py-2 text-xs font-semibold rounded-lg flex items-center gap-2 transition-all whitespace-nowrap ${
              activeTab === 'media'
                ? 'bg-cyan-500 text-slate-950 shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
          >
            <Images className="w-4 h-4" />
            <span>Thư Viện Ảnh</span>
            {!githubConnected && <CloudOff className="w-3.5 h-3.5 text-amber-400" />}
          </button>

          <button
            onClick={() => setActiveTab('settings')}
            className={`px-4 py-2 text-xs font-semibold rounded-lg flex items-center gap-2 transition-all whitespace-nowrap ${
              activeTab === 'settings'
                ? 'bg-cyan-500 text-slate-950 shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
          >
            <Settings className="w-4 h-4" />
            <span>Cấu Hình Doanh Nghiệp</span>
          </button>
        </div>

        {!githubConnected && activeTab !== 'media' && (
          <div className="mb-6 p-3.5 rounded-lg bg-amber-950/50 border border-amber-500/40 text-amber-200 text-xs flex items-center gap-2">
            <CloudOff className="w-4 h-4 shrink-0" />
            <span>
              Chưa kết nối GitHub: mọi thay đổi chỉ lưu trên trình duyệt này, khách vào web sẽ không thấy.{' '}
              <button type="button" onClick={() => setActiveTab('media')} className="underline font-semibold hover:text-white">Kết nối ngay</button>
            </span>
          </div>
        )}

        {/* TAB 1: OVERVIEW */}
        {activeTab === 'overview' && (
          <div className="space-y-8 animate-in fade-in duration-200">
            {/* KPI Cards Strip */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800">
                <div className="flex items-center justify-between text-slate-400 text-xs">
                  <span>Tổng Sản Phẩm / Dự Án</span>
                  <Cpu className="w-4 h-4 text-cyan-400" />
                </div>
                <div className="text-3xl font-extrabold text-white font-mono mt-2 tabular-nums">
                  {totalProducts}
                </div>
                <div className="text-[11px] text-cyan-400 mt-1 flex items-center gap-1">
                  <span>Hiển thị trên danh mục khách hàng</span>
                </div>
              </div>

              <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800">
                <div className="flex items-center justify-between text-slate-400 text-xs">
                  <span>Yêu Cầu Báo Giá (Leads)</span>
                  <FileSpreadsheet className="w-4 h-4 text-blue-400" />
                </div>
                <div className="text-3xl font-extrabold text-white font-mono mt-2 tabular-nums">
                  {totalQuotes}
                </div>
                <div className="text-[11px] text-slate-400 mt-1">
                  Từ biểu mẫu tiếp nhận trực tuyến
                </div>
              </div>

              <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800">
                <div className="flex items-center justify-between text-slate-400 text-xs">
                  <span>Yêu Cầu Mới Tiếp Nhận</span>
                  <Clock className="w-4 h-4 text-amber-400" />
                </div>
                <div className="text-3xl font-extrabold text-amber-400 font-mono mt-2 tabular-nums">
                  {newQuotesCount}
                </div>
                <div className="text-[11px] text-amber-300/80 mt-1">
                  Cần kỹ sư R&D xem xét và phản hồi
                </div>
              </div>

              <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800">
                <div className="flex items-center justify-between text-slate-400 text-xs">
                  <span>Đã Báo Giá / Hoàn Thành</span>
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                </div>
                <div className="text-3xl font-extrabold text-emerald-400 font-mono mt-2 tabular-nums">
                  {completedQuotesCount}
                </div>
                <div className="text-[11px] text-emerald-300/80 mt-1">
                  Tỷ lệ chuyển đổi tốt
                </div>
              </div>
            </div>

            {/* Quick Actions & Recent Quotes */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              
              {/* Left 2 Cols: Recent Leads */}
              <div className="lg:col-span-2 p-6 rounded-2xl bg-slate-900/40 border border-slate-800 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono">
                    Yêu Cầu Báo Giá Mới Nhất
                  </h3>
                  <button
                    onClick={() => setActiveTab('quotes')}
                    className="text-xs text-cyan-400 hover:underline"
                  >
                    Xem tất cả ({quotes.length}) →
                  </button>
                </div>

                <div className="space-y-3">
                  {quotes.slice(0, 4).map((q) => (
                    <div
                      key={q.id}
                      onClick={() => setInspectingQuote(q)}
                      className="p-3.5 rounded-xl bg-slate-950/70 hover:bg-slate-950 border border-slate-800 hover:border-cyan-500/40 transition-colors cursor-pointer flex items-center justify-between gap-4"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-cyan-400 font-semibold text-xs">{q.code}</span>
                          <span className="text-xs font-bold text-white">{q.fullName}</span>
                          <span className="text-[11px] text-slate-400">({q.company})</span>
                        </div>
                        <div className="text-[11px] text-slate-400">
                          Dịch vụ: <span className="text-slate-200">{q.serviceType}</span> · SL: <span className="text-slate-200">{q.quantityEstimate}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 shrink-0">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-mono border ${
                          q.status === 'new' ? 'text-amber-400 bg-amber-950/60 border-amber-500/40' :
                          q.status === 'reviewing' ? 'text-sky-400 bg-sky-950/60 border-sky-500/40' :
                          'text-emerald-400 bg-emerald-950/60 border-emerald-500/40'
                        }`}>
                          {q.status === 'new' ? 'Mới' : q.status === 'reviewing' ? 'Đang xử lý' : 'Đã báo giá'}
                        </span>
                        <Eye className="w-4 h-4 text-slate-400" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Right Col: Admin Shortcuts & System Info */}
              <div className="space-y-6">
                <div className="p-6 rounded-2xl bg-slate-900/40 border border-slate-800 space-y-4">
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono">
                    Lối Tắt Thao Tác
                  </h3>
                  <div className="space-y-2.5">
                    <button
                      onClick={handleOpenAddProduct}
                      className="w-full py-2.5 px-3 text-xs font-semibold text-slate-950 bg-cyan-400 hover:bg-cyan-300 rounded-lg transition-colors flex items-center justify-center gap-2"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Thêm Sản Phẩm / Dự Án Mới</span>
                    </button>

                    <button
                      onClick={() => setActiveTab('quotes')}
                      className="w-full py-2.5 px-3 text-xs font-medium text-slate-200 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors flex items-center justify-center gap-2"
                    >
                      <FileSpreadsheet className="w-4 h-4 text-cyan-400" />
                      <span>Xem Danh Sách Khách Hàng</span>
                    </button>

                    <button
                      onClick={() => setActiveTab('settings')}
                      className="w-full py-2.5 px-3 text-xs font-medium text-slate-200 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors flex items-center justify-center gap-2"
                    >
                      <Settings className="w-4 h-4 text-cyan-400" />
                      <span>Cập Nhật Thông Tin Liên Hệ</span>
                    </button>
                  </div>
                </div>

                <div className="p-5 rounded-2xl bg-slate-900/30 border border-slate-800 space-y-2 text-xs text-slate-400">
                  <div className="font-semibold text-white">Trạng thái hệ thống:</div>
                  <div>Lưu trữ: <span className="text-cyan-400 font-mono">LocalStorage Persistent + Memory Bus</span></div>
                  <div>Tự động đồng bộ: <span className="text-emerald-400 font-mono">Sẵn sàng 100%</span></div>
                  <div className="pt-2">
                    <button
                      onClick={handleResetDefaults}
                      className="text-[11px] text-slate-500 hover:text-red-400 flex items-center gap-1 transition-colors"
                    >
                      <RotateCcw className="w-3 h-3" />
                      <span>Khôi phục dữ liệu mẫu gốc</span>
                    </button>
                  </div>
                </div>

              </div>

            </div>
          </div>
        )}

        {/* TAB 2: PRODUCTS CRUD */}
        {activeTab === 'products' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            {/* Top Toolbar */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
              <div className="flex flex-1 items-center gap-3">
                <div className="relative flex-1 max-w-sm">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={productSearch}
                    onChange={(e) => setProductSearch(e.target.value)}
                    placeholder="Tìm theo tên sản phẩm..."
                    className="w-full pl-9 pr-3 py-2 text-xs bg-slate-900 border border-slate-800 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                  />
                </div>

                <select
                  value={productCategoryFilter}
                  onChange={(e) => setProductCategoryFilter(e.target.value)}
                  className="px-3 py-2 text-xs bg-slate-900 border border-slate-800 rounded-lg text-slate-300 focus:outline-none focus:border-cyan-500"
                >
                  <option value="All">Tất cả danh mục</option>
                  <option value="Thiết kế PCB">Thiết kế PCB</option>
                  <option value="Gia công & PCBA">Gia công & PCBA</option>
                  <option value="Automation Tools">Automation Tools</option>
                </select>
              </div>

              <button
                onClick={handleOpenAddProduct}
                className="px-4 py-2 text-xs font-semibold text-slate-950 bg-cyan-400 hover:bg-cyan-300 rounded-lg transition-colors flex items-center justify-center gap-1.5 whitespace-nowrap"
              >
                <Plus className="w-4 h-4" />
                <span>Thêm sản phẩm mới</span>
              </button>
            </div>

            {/* Products Table */}
            <div className="rounded-2xl border border-slate-800 overflow-hidden bg-slate-900/40">
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-950/80 text-slate-400 font-mono uppercase border-b border-slate-800">
                    <tr>
                      <th className="px-4 py-3.5">Hình ảnh & Tên</th>
                      <th className="px-4 py-3.5">Danh mục</th>
                      <th className="px-4 py-3.5">Tình trạng</th>
                      <th className="px-4 py-3.5">Định mức chi phí</th>
                      <th className="px-4 py-3.5">Thông số kỹ thuật</th>
                      <th className="px-4 py-3.5 text-right">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {filteredProducts.map((p) => (
                      <tr key={p.id} className="hover:bg-slate-800/40 transition-colors">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <img
                              src={adminImageUrl(p.imageUrl)}
                              alt={p.title}
                              className="w-12 h-9 object-cover rounded-md border border-slate-800 bg-slate-950 shrink-0"
                            />
                            <div>
                              <div className="font-bold text-white">{p.title}</div>
                              <div className="text-[11px] text-slate-400 line-clamp-1 max-w-xs">{p.shortDesc}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-cyan-300 font-medium">
                          {p.category}
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-slate-950 border border-slate-800 text-slate-300">
                            {p.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 font-mono text-slate-300">
                          {p.priceEstimate}
                        </td>
                        <td className="px-4 py-3 text-slate-400">
                          {p.specs?.length || 0} thông số · {p.features?.length || 0} tính năng
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => handleOpenEditProduct(p)}
                              className="p-1.5 text-slate-400 hover:text-cyan-400 hover:bg-slate-800 rounded transition-colors"
                              title="Chỉnh sửa sản phẩm"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteProduct(p.id, p.title)}
                              className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-slate-800 rounded transition-colors"
                              title="Xóa sản phẩm"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: QUOTES & LEADS MANAGEMENT */}
        {activeTab === 'quotes' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            {/* Filter toolbar */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
              <div className="relative flex-1 max-w-sm">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={quoteSearch}
                  onChange={(e) => setQuoteSearch(e.target.value)}
                  placeholder="Tìm theo mã, tên khách, số điện thoại..."
                  className="w-full pl-9 pr-3 py-2 text-xs bg-slate-900 border border-slate-800 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="flex items-center gap-2 overflow-x-auto">
                {['all', 'new', 'reviewing', 'quoted', 'completed'].map((st) => (
                  <button
                    key={st}
                    onClick={() => setQuoteStatusFilter(st)}
                    className={`px-3 py-1.5 text-xs font-medium rounded-lg whitespace-nowrap transition-colors ${
                      quoteStatusFilter === st
                        ? 'bg-cyan-500 text-slate-950 font-semibold'
                        : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                    }`}
                  >
                    {st === 'all' ? 'Tất cả' :
                     st === 'new' ? 'Mới tiếp nhận' :
                     st === 'reviewing' ? 'Đang xử lý' :
                     st === 'quoted' ? 'Đã báo giá' : 'Hoàn thành'}
                  </button>
                ))}
              </div>
            </div>

            {/* Quotes Table */}
            <div className="rounded-2xl border border-slate-800 overflow-hidden bg-slate-900/40">
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-950/80 text-slate-400 font-mono uppercase border-b border-slate-800">
                    <tr>
                      <th className="px-4 py-3.5">Mã YC</th>
                      <th className="px-4 py-3.5">Khách hàng / Công ty</th>
                      <th className="px-4 py-3.5">Liên hệ</th>
                      <th className="px-4 py-3.5">Dịch vụ & Số lượng</th>
                      <th className="px-4 py-3.5">Tệp đính kèm</th>
                      <th className="px-4 py-3.5">Trạng thái</th>
                      <th className="px-4 py-3.5 text-right">Chi tiết</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {filteredQuotes.map((q) => (
                      <tr key={q.id} className="hover:bg-slate-800/40 transition-colors">
                        <td className="px-4 py-3 font-mono font-bold text-cyan-400">
                          {q.code}
                        </td>
                        <td className="px-4 py-3">
                          <div className="font-semibold text-white">{q.fullName}</div>
                          <div className="text-[11px] text-slate-400">{q.company}</div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="font-mono text-slate-300">{q.phone}</div>
                          <div className="text-[11px] text-slate-400">{q.email}</div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="font-medium text-cyan-200">{q.serviceType}</div>
                          <div className="text-[11px] text-slate-400">SL: {q.quantityEstimate}</div>
                        </td>
                        <td className="px-4 py-3 text-slate-400 font-mono">
                          {q.attachedFiles?.length ? (
                            <span className="text-cyan-300 underline cursor-pointer" onClick={() => setInspectingQuote(q)}>
                              {q.attachedFiles.length} tệp (Gerber/BOM)
                            </span>
                          ) : (
                            <span className="text-slate-600">Không có</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-0.5 rounded text-[11px] font-mono border ${
                            q.status === 'new' ? 'text-amber-400 bg-amber-950/60 border-amber-500/40' :
                            q.status === 'reviewing' ? 'text-sky-400 bg-sky-950/60 border-sky-500/40' :
                            q.status === 'quoted' ? 'text-cyan-400 bg-cyan-950/60 border-cyan-500/40' :
                            'text-emerald-400 bg-emerald-950/60 border-emerald-500/40'
                          }`}>
                            {q.status === 'new' ? 'Mới' :
                             q.status === 'reviewing' ? 'Đang xử lý' :
                             q.status === 'quoted' ? 'Đã báo giá' : 'Hoàn thành'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <button
                            onClick={() => setInspectingQuote(q)}
                            className="px-2.5 py-1 text-[11px] font-semibold text-cyan-400 bg-slate-800 hover:bg-slate-700 rounded transition-colors inline-flex items-center gap-1"
                          >
                            <Eye className="w-3 h-3" />
                            <span>Xem & Duyệt</span>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB: MEDIA LIBRARY */}
        {activeTab === 'media' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <GitHubConnectPanel
              onChange={() => setGithubConnected(GitHubService.isConnected())}
              onPublishAll={async () => {
                await publishProducts('Xuất bản toàn bộ sản phẩm');
                await publishSettings('Xuất bản cấu hình doanh nghiệp');
              }}
            />
            <div className="p-5 rounded-2xl bg-slate-900/50 border border-slate-800 space-y-4">
              <div>
                <h3 className="text-sm font-bold text-white">Thư viện ảnh</h3>
                <p className="text-xs text-slate-400 mt-1">
                  Tải ảnh lên để dùng cho sản phẩm, bài viết và banner trang chủ. Bấm vào ảnh để sao chép đường dẫn.
                </p>
              </div>
              <MediaLibrary key={String(githubConnected)} products={products} extraUsedUrls={settings.heroImageUrl ? [settings.heroImageUrl] : []} />
            </div>
          </div>
        )}

        {/* TAB 4: GENERAL CONFIGURATION (CẤU HÌNH DOANH NGHIỆP) */}
        {activeTab === 'settings' && (
          <div className="max-w-3xl space-y-8 animate-in fade-in duration-200">
            <div className="p-6 rounded-2xl bg-slate-900/50 border border-slate-800">
              <h3 className="text-base font-bold text-white mb-1">
                Cấu Hình Thông Tin DY AUTOMATION
              </h3>
              <p className="text-xs text-slate-400 mb-6">
                Các thông tin sau sẽ được cập nhật đồng bộ lên toàn bộ giao diện khách hàng, footer, và biểu mẫu liên hệ.
              </p>

              {settingsSaveSuccess && (
                <div className="mb-6 p-3.5 rounded-lg bg-emerald-950/70 border border-emerald-500/50 text-emerald-300 text-xs flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Đã lưu thành công! Thông tin mới đã được cập nhật lên website.</span>
                </div>
              )}

              {resetSuccess && (
                <div className="mb-6 p-3.5 rounded-lg bg-cyan-950/70 border border-cyan-500/50 text-cyan-300 text-xs flex items-center gap-2">
                  <RotateCcw className="w-4 h-4 text-cyan-400 shrink-0" />
                  <span>Đã khôi phục toàn bộ dữ liệu mẫu ban đầu!</span>
                </div>
              )}

              <form onSubmit={handleSaveSettings} className="space-y-4 text-xs">
                <div>
                  <label className="block font-medium text-slate-300 mb-1">Tên pháp nhân công ty</label>
                  <input
                    type="text"
                    value={settingsForm.companyName}
                    onChange={(e) => setSettingsForm({ ...settingsForm, companyName: e.target.value })}
                    className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white focus:outline-none focus:border-cyan-500"
                  />
                </div>

                <div>
                  <label className="block font-medium text-slate-300 mb-1">Slogan thương hiệu</label>
                  <input
                    type="text"
                    value={settingsForm.brandSlogan}
                    onChange={(e) => setSettingsForm({ ...settingsForm, brandSlogan: e.target.value })}
                    className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white focus:outline-none focus:border-cyan-500"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-medium text-slate-300 mb-1">Hotline kinh doanh</label>
                    <input
                      type="text"
                      value={settingsForm.hotline}
                      onChange={(e) => setSettingsForm({ ...settingsForm, hotline: e.target.value })}
                      className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white font-mono focus:outline-none focus:border-cyan-500"
                    />
                  </div>

                  <div>
                    <label className="block font-medium text-slate-300 mb-1">Hỗ trợ kỹ thuật R&D</label>
                    <input
                      type="text"
                      value={settingsForm.technicalSupport}
                      onChange={(e) => setSettingsForm({ ...settingsForm, technicalSupport: e.target.value })}
                      className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white focus:outline-none focus:border-cyan-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-medium text-slate-300 mb-1">Email tiếp nhận dự án</label>
                    <input
                      type="email"
                      value={settingsForm.email}
                      onChange={(e) => setSettingsForm({ ...settingsForm, email: e.target.value })}
                      className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white focus:outline-none focus:border-cyan-500"
                    />
                  </div>

                  <div>
                    <label className="block font-medium text-slate-300 mb-1">Mã số thuế doanh nghiệp</label>
                    <input
                      type="text"
                      value={settingsForm.taxCode}
                      onChange={(e) => setSettingsForm({ ...settingsForm, taxCode: e.target.value })}
                      className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white font-mono focus:outline-none focus:border-cyan-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-medium text-slate-300 mb-1">Địa chỉ Trụ sở Hà Nội</label>
                  <input
                    type="text"
                    value={settingsForm.addressHanoi}
                    onChange={(e) => setSettingsForm({ ...settingsForm, addressHanoi: e.target.value })}
                    className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white focus:outline-none focus:border-cyan-500"
                  />
                </div>

                <div>
                  <label className="block font-medium text-slate-300 mb-1">Địa chỉ Chi nhánh TP. Hồ Chí Minh</label>
                  <input
                    type="text"
                    value={settingsForm.addressHcm}
                    onChange={(e) => setSettingsForm({ ...settingsForm, addressHcm: e.target.value })}
                    className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white focus:outline-none focus:border-cyan-500"
                  />
                </div>

                <ImageField
                  label="Ảnh banner trang chủ"
                  value={settingsForm.heroImageUrl || ''}
                  onChange={url => setSettingsForm({ ...settingsForm, heroImageUrl: url })}
                  products={products}
                />

                <div>
                  <label className="block font-medium text-slate-300 mb-1">Chứng chỉ & Tiêu chuẩn chất lượng</label>
                  <input
                    type="text"
                    value={settingsForm.techStandards}
                    onChange={(e) => setSettingsForm({ ...settingsForm, techStandards: e.target.value })}
                    className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white font-mono focus:outline-none focus:border-cyan-500"
                  />
                </div>

                <div className="pt-4 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={handleResetDefaults}
                    className="px-3.5 py-2 text-xs font-medium text-slate-400 hover:text-red-400 bg-slate-900 border border-slate-800 rounded-lg transition-colors flex items-center gap-1.5"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Khôi phục dữ liệu mẫu gốc</span>
                  </button>

                  <button
                    type="submit"
                    className="px-6 py-2.5 text-xs font-semibold text-slate-950 bg-cyan-400 hover:bg-cyan-300 rounded-lg transition-colors flex items-center gap-2 shadow-lg shadow-cyan-500/20"
                  >
                    <Check className="w-4 h-4" />
                    <span>Lưu Cấu Hình Mới</span>
                  </button>
                </div>

              </form>
            </div>
          </div>
        )}

      </div>

      {/* Product Form Modal (Add / Edit) */}
      {isProductModalOpen && (
        <ProductFormModal
          product={editingProduct}
          onClose={() => setIsProductModalOpen(false)}
          onSave={handleSaveProduct}
          products={products}
        />
      )}

      {/* Quote Detail Modal */}
      {inspectingQuote && (
        <QuoteDetailModal
          quote={inspectingQuote}
          onClose={() => setInspectingQuote(null)}
          onUpdateStatus={handleUpdateQuoteStatus}
          onDelete={handleDeleteQuote}
        />
      )}

      {/* Trạng thái lưu lên GitHub */}
      {toast && (
        <div
          className={`fixed bottom-6 right-6 z-[70] max-w-sm p-3.5 rounded-xl border shadow-2xl text-xs flex items-start gap-2 ${
            toast.kind === 'ok'
              ? 'bg-emerald-950/95 border-emerald-500/50 text-emerald-200'
              : toast.kind === 'error'
                ? 'bg-red-950/95 border-red-500/50 text-red-200'
                : toast.kind === 'warn'
                  ? 'bg-amber-950/95 border-amber-500/50 text-amber-200'
                  : 'bg-slate-900/95 border-cyan-500/40 text-cyan-200'
          }`}
        >
          {toast.kind === 'saving' ? <Loader2 className="w-4 h-4 animate-spin shrink-0" /> : toast.kind === 'ok' ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
          <span className="flex-1">{toast.text}</span>
          {toast.kind !== 'saving' && (
            <button type="button" onClick={() => setToast(null)} className="opacity-70 hover:opacity-100">✕</button>
          )}
        </div>
      )}

    </div>
  );
};
