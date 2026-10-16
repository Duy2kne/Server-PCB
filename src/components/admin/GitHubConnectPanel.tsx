import React, { useState } from 'react';
import { CheckCircle2, ExternalLink, Github, Link2Off, UploadCloud } from 'lucide-react';
import { GITHUB_REPO } from '../../config';
import { GitHubService } from '../../services/github';

interface GitHubConnectPanelProps {
  /** Gọi sau khi kết nối / ngắt kết nối thành công */
  onChange: () => void;
  /** Đưa toàn bộ dữ liệu hiện tại lên GitHub (lần đầu sử dụng) */
  onPublishAll: () => Promise<void>;
}

const TOKEN_URL = 'https://github.com/settings/personal-access-tokens/new';

export const GitHubConnectPanel: React.FC<GitHubConnectPanelProps> = ({ onChange, onPublishAll }) => {
  const connected = GitHubService.isConnected();
  const [token, setToken] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);

  const connect = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token.trim()) return;
    setBusy(true);
    setMessage(null);
    try {
      const repo = await GitHubService.verify(token);
      GitHubService.setToken(token);
      setToken('');
      setMessage({ ok: true, text: `Đã kết nối repo ${repo}.` });
      onChange();
    } catch (err) {
      setMessage({ ok: false, text: err instanceof Error ? err.message : 'Không kết nối được.' });
    } finally {
      setBusy(false);
    }
  };

  const publishAll = async () => {
    if (!confirm('Đưa toàn bộ sản phẩm và cấu hình doanh nghiệp đang có trên máy này lên web (ghi đè bản trên GitHub)?')) return;
    setBusy(true);
    setMessage(null);
    try {
      await onPublishAll();
      setMessage({ ok: true, text: 'Đã xuất bản. Web sẽ cập nhật sau khoảng 1–2 phút.' });
    } catch (err) {
      setMessage({ ok: false, text: err instanceof Error ? err.message : 'Xuất bản thất bại.' });
    } finally {
      setBusy(false);
    }
  };

  const disconnect = () => {
    if (!confirm('Ngắt kết nối GitHub trên trình duyệt này? (Nên làm khi dùng máy tính chung)')) return;
    GitHubService.disconnect();
    setMessage(null);
    onChange();
  };

  return (
    <div className="p-5 rounded-2xl bg-slate-900/50 border border-slate-800 space-y-4 text-xs">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Github className="w-5 h-5 text-white" />
          <h3 className="text-sm font-bold text-white">Kết nối GitHub (nơi lưu ảnh & nội dung web)</h3>
        </div>
        {connected && (
          <span className="flex items-center gap-1.5 text-emerald-300 font-mono">
            <CheckCircle2 className="w-4 h-4" /> {GITHUB_REPO.owner}/{GITHUB_REPO.repo}
          </span>
        )}
      </div>

      {connected ? (
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={publishAll} disabled={busy} className="px-3.5 py-2 font-semibold text-slate-950 bg-cyan-400 hover:bg-cyan-300 disabled:opacity-60 rounded-lg flex items-center gap-1.5">
            <UploadCloud className="w-4 h-4" />
            <span>{busy ? 'Đang xuất bản...' : 'Xuất bản toàn bộ dữ liệu hiện tại'}</span>
          </button>
          <button type="button" onClick={disconnect} className="px-3.5 py-2 text-slate-300 hover:text-red-300 bg-slate-950 border border-slate-800 rounded-lg flex items-center gap-1.5">
            <Link2Off className="w-4 h-4" />
            <span>Ngắt kết nối</span>
          </button>
        </div>
      ) : (
        <>
          <ol className="list-decimal pl-5 space-y-1 text-slate-300 leading-relaxed">
            <li>
              Mở{' '}
              <a href={TOKEN_URL} target="_blank" rel="noreferrer" className="text-cyan-400 hover:underline inline-flex items-center gap-1">
                trang tạo token GitHub <ExternalLink className="w-3 h-3" />
              </a>{' '}
              (đăng nhập tài khoản <strong>{GITHUB_REPO.owner}</strong>).
            </li>
            <li>Đặt tên bất kỳ, <em>Expiration</em> tùy chọn (vd. 1 năm).</li>
            <li>
              <em>Repository access</em> → <strong>Only select repositories</strong> → chọn <strong>{GITHUB_REPO.repo}</strong>.
            </li>
            <li>
              <em>Permissions</em> → <em>Repository permissions</em> → <strong>Contents</strong> → <strong>Read and write</strong>.
            </li>
            <li>Bấm <strong>Generate token</strong>, sao chép token (bắt đầu bằng <code>github_pat_</code>) và dán vào ô dưới.</li>
          </ol>
          <form onSubmit={connect} className="flex flex-col sm:flex-row gap-2">
            <input
              type="password"
              value={token}
              onChange={e => setToken(e.target.value)}
              placeholder="github_pat_..."
              autoComplete="off"
              className="flex-1 px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white font-mono focus:outline-none focus:border-cyan-500"
            />
            <button type="submit" disabled={busy || !token.trim()} className="px-4 py-2 font-semibold text-slate-950 bg-cyan-400 hover:bg-cyan-300 disabled:opacity-60 rounded-lg">
              {busy ? 'Đang kiểm tra...' : 'Kết nối'}
            </button>
          </form>
          <p className="text-[11px] text-slate-500">
            Token chỉ lưu trong trình duyệt này, không nằm trong mã nguồn web. Trên máy tính dùng chung, hãy bấm "Ngắt kết nối" sau khi dùng xong.
          </p>
        </>
      )}

      {message && <p className={message.ok ? 'text-emerald-300' : 'text-red-300'}>{message.text}</p>}
    </div>
  );
};
