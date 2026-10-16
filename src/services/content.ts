import { GITHUB_REPO } from '../config';
import type { CompanySettings, Product } from '../types';
import { GitHubService, bytesToBase64, type RepoFile } from './github';
import { StorageService } from './storage';

/**
 * Nội dung "đã xuất bản" nằm trong repo (thư mục public/ → được deploy kèm web):
 *   public/content/products.json, public/content/settings.json, public/uploads/<ảnh>
 * Khách đọc bản đã deploy trên GitHub Pages; máy admin đã kết nối GitHub đọc thẳng từ repo
 * (luôn mới nhất, không phải chờ deploy).
 */

const PRODUCTS_PATH = 'public/content/products.json';
const SETTINGS_PATH = 'public/content/settings.json';
export const UPLOADS_DIR = 'public/uploads';

/** Ảnh có sẵn trong public/images (không xóa được từ trang Quản trị) */
export const BUILTIN_IMAGES = [
  { label: 'Chiller Mini ESP32', url: 'images/chiller_esp32_board_1792125857487.jpg' },
  { label: 'Boiler Nồi hơi 2 que dò', url: 'images/boiler_controller_pcb_1792125859286.jpg' },
  { label: 'IoT / Automation Software', url: 'images/automation_software_pcb_1792125859834.jpg' },
  { label: 'SMT Line & PCB Layout', url: 'images/hero_pcb_automation_1792125856876.jpg' },
  { label: 'Test Jig Fixture', url: 'images/test_jig_fixture_1792125858830.jpg' },
];

export interface MediaItem {
  name: string;
  /** Đường dẫn lưu trong dữ liệu (tương đối, chạy trên GitHub Pages sau khi deploy) */
  url: string;
  size?: number;
  /** Có khi là ảnh admin đã upload (xóa được) */
  file?: RepoFile;
}

const UPLOAD_PREFIX = 'uploads/';

/**
 * Ảnh vừa upload chưa có trên GitHub Pages cho tới khi deploy xong (1–2 phút),
 * nên trong trang Quản trị hiển thị qua raw.githubusercontent.com.
 */
export function adminImageUrl(url: string): string {
  if (!url.startsWith(UPLOAD_PREFIX)) return url;
  const { owner, repo, branch } = GITHUB_REPO;
  return `https://raw.githubusercontent.com/${owner}/${repo}/${branch}/public/${url}`;
}

async function fetchPublishedJson<T>(repoPath: string): Promise<T | null> {
  if (GitHubService.isConnected()) {
    const file = await GitHubService.getFile(repoPath);
    return file ? (JSON.parse(file.text) as T) : null;
  }
  const res = await fetch(repoPath.replace(/^public\//, ''), { cache: 'no-cache' });
  if (!res.ok) return null;
  return (await res.json()) as T;
}

/** Tải nội dung đã xuất bản và ghi đè bản trong trình duyệt (nếu chưa từng xuất bản thì giữ nguyên) */
export async function syncPublishedContent(): Promise<void> {
  const [products, settings] = await Promise.all([
    fetchPublishedJson<Product[]>(PRODUCTS_PATH).catch(() => null),
    fetchPublishedJson<CompanySettings>(SETTINGS_PATH).catch(() => null),
  ]);
  if (Array.isArray(products) && products.length > 0) StorageService.saveProducts(products);
  if (settings && typeof settings === 'object') StorageService.saveSettings({ ...StorageService.getSettings(), ...settings });
}

export function publishProducts(message: string) {
  return GitHubService.putJson(PRODUCTS_PATH, StorageService.getProducts(), message);
}

export function publishSettings(message: string) {
  return GitHubService.putJson(SETTINGS_PATH, StorageService.getSettings(), message);
}

export async function listUploadedImages(): Promise<MediaItem[]> {
  const files = await GitHubService.listDir(UPLOADS_DIR);
  return files
    .filter(f => /\.(webp|jpe?g|png|gif|avif)$/i.test(f.name))
    .sort((a, b) => b.name.localeCompare(a.name)) // tên bắt đầu bằng thời gian → mới nhất lên đầu
    .map(f => ({ name: f.name, url: `${UPLOAD_PREFIX}${f.name}`, size: f.size, file: f }));
}

/** Tên file an toàn: thời gian + tên gốc bỏ dấu */
function uploadFileName(original: string, ext: string) {
  const stamp = new Date().toISOString().replace(/[-:T]/g, '').slice(0, 14);
  const base = original
    .replace(/\.[^.]+$/, '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/đ/gi, 'd')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40) || 'anh';
  return `${stamp}-${base}.${ext}`;
}

export async function uploadImage(blob: Blob, originalName: string, ext: string): Promise<MediaItem> {
  const name = uploadFileName(originalName, ext);
  const base64 = bytesToBase64(new Uint8Array(await blob.arrayBuffer()));
  await GitHubService.putFile(`${UPLOADS_DIR}/${name}`, base64, `Upload ảnh ${name}`);
  return { name, url: `${UPLOAD_PREFIX}${name}`, size: blob.size };
}

export function deleteUploadedImage(item: MediaItem) {
  if (!item.file) throw new Error('Ảnh có sẵn của hệ thống không xóa được.');
  return GitHubService.deleteFile(item.file.path, item.file.sha, `Xóa ảnh ${item.name}`);
}
