import React, { useEffect, useState } from 'react';
import { ArrowLeft, Copy, KeyRound, Lock, ShieldCheck, AlertCircle } from 'lucide-react';
import { AuthService } from '../../services/auth';

interface AdminLoginProps {
  onSuccess: () => void;
  onCancel: () => void;
}

const inputClass =
  'w-full px-3.5 py-2.5 text-sm bg-slate-950 border border-slate-700 focus:border-cyan-500 rounded-lg text-white outline-none transition-colors';

/** Chưa cấu hình mật khẩu: cho phép tạo mã hash để dán vào src/config.ts */
const PasswordHashGenerator: React.FC = () => {
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [hash, setHash] = useState('');
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const [busy, setBusy] = useState(false);

  const generate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setHash('');
    if (password.length < 10) return setError('Mật khẩu cần ít nhất 10 ký tự.');
    if (password !== confirm) return setError('Hai lần nhập mật khẩu không khớp.');
    setBusy(true);
    try {
      setHash(await AuthService.createPasswordHash(password));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không tạo được mã hash.');
    } finally {
      setBusy(false);
    }
  };

  const copy = async () => {
    await navigator.clipboard.writeText(hash);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <form onSubmit={generate} className="space-y-4">
      <div className="p-3 rounded-lg bg-amber-950/50 border border-amber-500/40 text-xs text-amber-200 leading-relaxed">
        Trang Quản trị đang <strong>bị khóa</strong> vì chưa đặt mật khẩu. Nhập mật khẩu mới bên dưới để tạo mã hash,
        sau đó dán mã vào <code className="text-amber-100">ADMIN_PASSWORD_HASH</code> trong file{' '}
        <code className="text-amber-100">src/config.ts</code> rồi build/deploy lại.
      </div>
      <input type="password" autoComplete="new-password" placeholder="Mật khẩu mới (≥ 10 ký tự)" className={inputClass} value={password} onChange={e => setPassword(e.target.value)} />
      <input type="password" autoComplete="new-password" placeholder="Nhập lại mật khẩu" className={inputClass} value={confirm} onChange={e => setConfirm(e.target.value)} />
      {error && <p className="text-xs text-red-300">{error}</p>}
      <button type="submit" disabled={busy} className="w-full py-2.5 text-xs font-semibold text-slate-950 bg-cyan-400 hover:bg-cyan-300 disabled:opacity-60 rounded-lg transition-colors flex items-center justify-center gap-2">
        <KeyRound className="w-4 h-4" />
        <span>{busy ? 'Đang tạo...' : 'Tạo mã hash mật khẩu'}</span>
      </button>
      {hash && (
        <div className="space-y-2">
          <textarea readOnly value={hash} rows={3} className={`${inputClass} font-mono text-[11px] break-all`} onFocus={e => e.target.select()} />
          <button type="button" onClick={copy} className="w-full py-2 text-xs font-semibold text-cyan-300 bg-slate-800 hover:bg-slate-700 rounded-lg flex items-center justify-center gap-2">
            <Copy className="w-3.5 h-3.5" />
            <span>{copied ? 'Đã sao chép!' : 'Sao chép mã hash'}</span>
          </button>
          <p className="text-[11px] text-slate-400">Mã hash không chứa mật khẩu gốc nên có thể commit lên GitHub. Hãy ghi nhớ mật khẩu — không thể khôi phục từ mã hash.</p>
        </div>
      )}
    </form>
  );
};

export const AdminLogin: React.FC<AdminLoginProps> = ({ onSuccess, onCancel }) => {
  const configured = AuthService.isConfigured();
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [lockLeft, setLockLeft] = useState(AuthService.lockSecondsLeft());

  useEffect(() => {
    if (lockLeft <= 0) return;
    const t = setInterval(() => setLockLeft(AuthService.lockSecondsLeft()), 1000);
    return () => clearInterval(t);
  }, [lockLeft > 0]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password || lockLeft > 0) return;
    setBusy(true);
    setError('');
    try {
      if (await AuthService.login(password)) return onSuccess();
      const left = AuthService.lockSecondsLeft();
      setLockLeft(left);
      setError(left > 0 ? 'Nhập sai quá nhiều lần.' : 'Mật khẩu không đúng.');
      setPassword('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không đăng nhập được.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 bg-slate-950">
      <div className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 space-y-5">
        <div className="text-center space-y-2">
          <div className="w-12 h-12 mx-auto rounded-full bg-cyan-500/15 border border-cyan-500/40 text-cyan-400 flex items-center justify-center">
            {configured ? <Lock className="w-6 h-6" /> : <ShieldCheck className="w-6 h-6" />}
          </div>
          <h1 className="text-lg font-bold text-white">{configured ? 'Đăng nhập Quản trị' : 'Thiết lập mật khẩu Quản trị'}</h1>
        </div>

        {configured ? (
          <form onSubmit={submit} className="space-y-4">
            <input
              type="password"
              autoFocus
              autoComplete="current-password"
              placeholder="Mật khẩu"
              className={inputClass}
              value={password}
              disabled={lockLeft > 0}
              onChange={e => setPassword(e.target.value)}
            />
            {(error || lockLeft > 0) && (
              <div className="flex items-center gap-2 text-xs text-red-300">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>
                  {error}
                  {lockLeft > 0 && ` Thử lại sau ${lockLeft} giây.`}
                </span>
              </div>
            )}
            <button type="submit" disabled={busy || lockLeft > 0 || !password} className="w-full py-2.5 text-xs font-semibold text-slate-950 bg-cyan-400 hover:bg-cyan-300 disabled:opacity-60 rounded-lg transition-colors">
              {busy ? 'Đang kiểm tra...' : 'Đăng nhập'}
            </button>
          </form>
        ) : (
          <PasswordHashGenerator />
        )}

        <button type="button" onClick={onCancel} className="w-full py-2 text-xs text-slate-400 hover:text-white flex items-center justify-center gap-1.5">
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Quay lại trang khách hàng</span>
        </button>
      </div>
    </div>
  );
};
