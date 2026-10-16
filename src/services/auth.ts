import { ADMIN_PASSWORD_HASH, ADMIN_SESSION_HOURS } from '../config';

/**
 * Đăng nhập trang Quản trị phía trình duyệt.
 *
 * Mật khẩu chỉ lưu dạng hash PBKDF2-SHA256 (210.000 vòng, salt ngẫu nhiên) nên lộ mã hash
 * cũng khó dò ngược nếu mật khẩu đủ mạnh. Vì là web tĩnh nên đây là lớp chặn giao diện:
 * dữ liệu Quản trị vẫn chỉ nằm trong localStorage của chính trình duyệt đang mở.
 */

const SESSION_KEY = 'dy_automation_admin_session_v1';
const LOCK_KEY = 'dy_automation_admin_lock_v1';
const ITERATIONS = 210_000;
const MAX_ATTEMPTS = 5;
const LOCK_MS = 60_000;

const enc = new TextEncoder();
const toB64 = (bytes: Uint8Array) => btoa(String.fromCharCode(...bytes));
const fromB64 = (s: string) => Uint8Array.from(atob(s), c => c.charCodeAt(0));

function requireSubtle() {
  if (!globalThis.crypto?.subtle) {
    throw new Error('Trình duyệt chỉ hỗ trợ đăng nhập qua HTTPS hoặc localhost.');
  }
  return crypto.subtle;
}

async function derive(password: string, salt: Uint8Array<ArrayBuffer>, iterations: number) {
  const subtle = requireSubtle();
  const key = await subtle.importKey('raw', enc.encode(password), 'PBKDF2', false, ['deriveBits']);
  const bits = await subtle.deriveBits({ name: 'PBKDF2', hash: 'SHA-256', salt, iterations }, key, 256);
  return new Uint8Array(bits);
}

interface LockState {
  failures: number;
  lockedUntil: number;
}

function readLock(): LockState {
  try {
    return JSON.parse(sessionStorage.getItem(LOCK_KEY) || '') as LockState;
  } catch {
    return { failures: 0, lockedUntil: 0 };
  }
}

function writeLock(state: LockState) {
  try {
    sessionStorage.setItem(LOCK_KEY, JSON.stringify(state));
  } catch {
    /* bỏ qua khi trình duyệt chặn storage */
  }
}

export const AuthService = {
  isConfigured(): boolean {
    return ADMIN_PASSWORD_HASH.startsWith('pbkdf2$');
  },

  isLoggedIn(): boolean {
    if (!this.isConfigured()) return false;
    try {
      const session = JSON.parse(sessionStorage.getItem(SESSION_KEY) || 'null') as { exp: number; hash: string } | null;
      // Đổi mật khẩu (hash mới) thì phiên cũ tự hết hiệu lực
      return !!session && session.exp > Date.now() && session.hash === ADMIN_PASSWORD_HASH;
    } catch {
      return false;
    }
  },

  /** Số giây còn bị khóa do nhập sai nhiều lần (0 = không khóa) */
  lockSecondsLeft(): number {
    return Math.max(0, Math.ceil((readLock().lockedUntil - Date.now()) / 1000));
  },

  async login(password: string): Promise<boolean> {
    if (!this.isConfigured() || this.lockSecondsLeft() > 0) return false;

    const [, iter, saltB64, hashB64] = ADMIN_PASSWORD_HASH.split('$');
    const actual = await derive(password, fromB64(saltB64), Number(iter));
    const expected = fromB64(hashB64);
    let diff = actual.length ^ expected.length;
    for (let i = 0; i < Math.min(actual.length, expected.length); i++) diff |= actual[i] ^ expected[i];

    if (diff !== 0) {
      const lock = readLock();
      const failures = lock.failures + 1;
      writeLock(failures >= MAX_ATTEMPTS ? { failures: 0, lockedUntil: Date.now() + LOCK_MS } : { failures, lockedUntil: 0 });
      return false;
    }

    writeLock({ failures: 0, lockedUntil: 0 });
    sessionStorage.setItem(
      SESSION_KEY,
      JSON.stringify({ exp: Date.now() + ADMIN_SESSION_HOURS * 3600_000, hash: ADMIN_PASSWORD_HASH })
    );
    return true;
  },

  logout(): void {
    try {
      sessionStorage.removeItem(SESSION_KEY);
    } catch {
      /* bỏ qua */
    }
  },

  /** Tạo mã hash để dán vào ADMIN_PASSWORD_HASH trong src/config.ts */
  async createPasswordHash(password: string): Promise<string> {
    const salt = crypto.getRandomValues(new Uint8Array(16));
    const hash = await derive(password, salt, ITERATIONS);
    return `pbkdf2$${ITERATIONS}$${toB64(salt)}$${toB64(hash)}`;
  },
};
