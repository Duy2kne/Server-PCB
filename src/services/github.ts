import { GITHUB_REPO } from '../config';

/**
 * Ghi / đọc file trong repo GitHub qua REST API (dùng cho trang Quản trị).
 *
 * Token (fine-grained, chỉ quyền Contents trên đúng repo) chỉ lưu trong localStorage của trình duyệt
 * admin đã nhập, không bao giờ nằm trong mã nguồn.
 */

const TOKEN_KEY = 'dy_automation_github_token_v1';
const API = 'https://api.github.com';

export interface RepoFile {
  name: string;
  path: string;
  sha: string;
  size: number;
}

export class GitHubError extends Error {
  constructor(message: string, public status: number) {
    super(message);
  }
}

/** base64 cho dữ liệu nhị phân lớn (tránh tràn stack khi dùng String.fromCharCode(...bytes)) */
export function bytesToBase64(bytes: Uint8Array): string {
  let binary = '';
  for (let i = 0; i < bytes.length; i += 0x8000) {
    binary += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  }
  return btoa(binary);
}

const base64ToText = (b64: string) => new TextDecoder().decode(Uint8Array.from(atob(b64.replace(/\s/g, '')), c => c.charCodeAt(0)));
const encodePath = (path: string) => path.split('/').map(encodeURIComponent).join('/');
const contentsUrl = (path: string) => `${API}/repos/${GITHUB_REPO.owner}/${GITHUB_REPO.repo}/contents/${encodePath(path)}`;

function describeError(status: number, apiMessage?: string) {
  if (status === 401) return 'Token GitHub không hợp lệ hoặc đã hết hạn. Hãy tạo token mới.';
  if (status === 403) return 'Token GitHub không có quyền ghi (cần quyền "Contents: Read and write" cho repo).';
  if (status === 404) return `Không tìm thấy repo ${GITHUB_REPO.owner}/${GITHUB_REPO.repo} hoặc token chưa được cấp quyền repo này.`;
  if (status === 409) return 'Dữ liệu trên GitHub vừa thay đổi, hãy thử lại.';
  if (status === 422) return `GitHub từ chối yêu cầu: ${apiMessage || 'dữ liệu không hợp lệ'}`;
  return `Lỗi GitHub (${status}): ${apiMessage || 'không rõ nguyên nhân'}`;
}

// Các lệnh ghi chạy lần lượt để không bị xung đột sha khi lưu liên tiếp
let writeQueue: Promise<unknown> = Promise.resolve();
function enqueue<T>(task: () => Promise<T>): Promise<T> {
  const run = writeQueue.then(task, task);
  writeQueue = run.catch(() => undefined);
  return run;
}

export const GitHubService = {
  getToken(): string {
    try {
      return localStorage.getItem(TOKEN_KEY) || '';
    } catch {
      return '';
    }
  },

  isConnected(): boolean {
    return this.getToken().length > 0;
  },

  setToken(token: string) {
    localStorage.setItem(TOKEN_KEY, token.trim());
  },

  disconnect() {
    try {
      localStorage.removeItem(TOKEN_KEY);
    } catch {
      /* bỏ qua */
    }
  },

  async request<T>(url: string, init: RequestInit = {}, explicitToken?: string): Promise<T> {
    const token = explicitToken ?? this.getToken();
    if (!token) throw new GitHubError('Chưa kết nối GitHub.', 0);
    const res = await fetch(url, {
      ...init,
      cache: 'no-store',
      headers: {
        Accept: 'application/vnd.github+json',
        Authorization: `Bearer ${token}`,
        'X-GitHub-Api-Version': '2022-11-28',
        ...(init.body ? { 'Content-Type': 'application/json' } : {}),
      },
    });
    if (!res.ok) {
      const body = (await res.json().catch(() => null)) as { message?: string } | null;
      throw new GitHubError(describeError(res.status, body?.message), res.status);
    }
    return (res.status === 204 ? null : await res.json()) as T;
  },

  /** Kiểm tra token đọc được repo; trả về tên tài khoản sở hữu repo */
  async verify(token: string): Promise<string> {
    const repo = await this.request<{ full_name: string }>(
      `${API}/repos/${GITHUB_REPO.owner}/${GITHUB_REPO.repo}`,
      {},
      token.trim()
    );
    return repo.full_name;
  },

  async getFile(path: string): Promise<{ sha: string; text: string } | null> {
    try {
      const file = await this.request<{ sha: string; content: string }>(`${contentsUrl(path)}?ref=${GITHUB_REPO.branch}`);
      return { sha: file.sha, text: base64ToText(file.content) };
    } catch (err) {
      if (err instanceof GitHubError && err.status === 404) return null;
      throw err;
    }
  },

  async listDir(path: string): Promise<RepoFile[]> {
    try {
      const items = await this.request<(RepoFile & { type: string })[]>(`${contentsUrl(path)}?ref=${GITHUB_REPO.branch}`);
      return items.filter(i => i.type === 'file');
    } catch (err) {
      if (err instanceof GitHubError && err.status === 404) return [];
      throw err;
    }
  },

  /** Tạo hoặc ghi đè file (contentBase64 đã mã hóa base64) */
  putFile(path: string, contentBase64: string, message: string): Promise<void> {
    return enqueue(async () => {
      const current = await this.getFile(path).catch(() => null);
      await this.request(contentsUrl(path), {
        method: 'PUT',
        body: JSON.stringify({ message, content: contentBase64, branch: GITHUB_REPO.branch, ...(current ? { sha: current.sha } : {}) }),
      });
    });
  },

  putJson(path: string, data: unknown, message: string): Promise<void> {
    const text = JSON.stringify(data, null, 2) + '\n';
    return this.putFile(path, bytesToBase64(new TextEncoder().encode(text)), message);
  },

  deleteFile(path: string, sha: string, message: string): Promise<void> {
    return enqueue(async () => {
      await this.request(contentsUrl(path), {
        method: 'DELETE',
        body: JSON.stringify({ message, sha, branch: GITHUB_REPO.branch }),
      });
    });
  },
};
