/**
 * Thu nhỏ & nén ảnh trước khi upload để repo / web nhẹ (ảnh điện thoại 5–10 MB → vài trăm KB).
 * SVG bị chặn vì có thể chứa mã script chạy trên cùng tên miền với trang Quản trị.
 */

const MAX_EDGE_PX = 1920;
const QUALITY = 0.85;
export const MAX_UPLOAD_BYTES = 8 * 1024 * 1024;

const ACCEPTED = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/avif'];
export const ACCEPT_ATTR = ACCEPTED.join(',');

export async function prepareImage(file: File): Promise<{ blob: Blob; ext: string }> {
  if (!ACCEPTED.includes(file.type)) {
    throw new Error(`"${file.name}" không phải ảnh JPG / PNG / WebP / GIF.`);
  }

  // GIF giữ nguyên để không mất ảnh động
  if (file.type === 'image/gif') return checkSize({ blob: file, ext: 'gif' }, file.name);

  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, MAX_EDGE_PX / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext('2d')!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();

  const webp = await new Promise<Blob | null>(resolve => canvas.toBlob(resolve, 'image/webp', QUALITY));
  // Ảnh đã nhỏ sẵn mà nén lại còn to hơn thì dùng bản gốc
  if (!webp || (scale === 1 && webp.size >= file.size)) {
    return checkSize({ blob: file, ext: file.type.split('/')[1].replace('jpeg', 'jpg') }, file.name);
  }
  return checkSize({ blob: webp, ext: 'webp' }, file.name);
}

function checkSize(result: { blob: Blob; ext: string }, name: string) {
  if (result.blob.size > MAX_UPLOAD_BYTES) {
    throw new Error(`"${name}" quá lớn (${(result.blob.size / 1048576).toFixed(1)} MB, tối đa 8 MB).`);
  }
  return result;
}
