import { QUOTE_APPS_SCRIPT_URL, WEB3FORMS_ACCESS_KEY } from '../config';
import type { QuoteRequest } from '../types';
import { bytesToBase64 } from './github';

/**
 * Gửi yêu cầu báo giá về email chủ website (web tĩnh không tự gửi mail được).
 *  - Có QUOTE_APPS_SCRIPT_URL: gửi qua Google Apps Script → tệp khách lưu vào Google Drive của bạn
 *    và được đính kèm email (xem scripts/google-apps-script.gs).
 *  - Chỉ có WEB3FORMS_ACCESS_KEY: gửi qua Web3Forms, email chỉ ghi TÊN tệp (gói miễn phí không đính kèm được).
 */

/** Giới hạn khớp với Apps Script: tổng 25 MB, tối đa 10 tệp */
export const MAX_QUOTE_FILES = 10;
export const MAX_QUOTE_TOTAL_BYTES = 25 * 1024 * 1024;

export const canSendFiles = () => QUOTE_APPS_SCRIPT_URL.trim().length > 0;
export const isEmailConfigured = () => canSendFiles() || WEB3FORMS_ACCESS_KEY.trim().length > 0;

export async function sendQuoteEmail(quote: QuoteRequest, files: File[] = []): Promise<void> {
  if (canSendFiles()) return sendViaAppsScript(quote, files);
  if (WEB3FORMS_ACCESS_KEY.trim()) return sendViaWeb3Forms(quote);
  throw new Error('Chưa cấu hình QUOTE_APPS_SCRIPT_URL hoặc WEB3FORMS_ACCESS_KEY');
}

async function sendViaAppsScript(quote: QuoteRequest, files: File[]) {
  const payload = {
    quote,
    files: await Promise.all(
      files.map(async f => ({
        name: f.name,
        type: f.type || 'application/octet-stream',
        data: bytesToBase64(new Uint8Array(await f.arrayBuffer())),
      }))
    ),
  };

  // text/plain để trình duyệt không gửi preflight CORS (Apps Script không trả lời OPTIONS)
  const res = await fetch(QUOTE_APPS_SCRIPT_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify(payload),
  });
  const data = (await res.json().catch(() => null)) as { success?: boolean; message?: string } | null;
  if (!res.ok || !data?.success) throw new Error(data?.message || `HTTP ${res.status}`);
}

async function sendViaWeb3Forms(quote: QuoteRequest) {
  const fileNames = quote.attachedFiles.length
    ? quote.attachedFiles.map(f => `${f.name} (${f.size})`).join('\n')
    : 'Không có';

  const res = await fetch('https://api.web3forms.com/submit', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({
      access_key: WEB3FORMS_ACCESS_KEY,
      subject: `[${quote.code}] Yêu cầu báo giá ${quote.serviceType} - ${quote.fullName}`,
      from_name: 'Website DY AUTOMATION',
      replyto: quote.email,
      'Mã yêu cầu': quote.code,
      'Thời gian gửi': new Date(quote.createdAt).toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' }),
      'Họ tên': quote.fullName,
      'Công ty': quote.company,
      'Điện thoại': quote.phone,
      Email: quote.email,
      'Dịch vụ': quote.serviceType,
      'Số lượng dự kiến': quote.quantityEstimate,
      'Tiến độ mong muốn': quote.timeline,
      'Yêu cầu kỹ thuật': quote.requirements,
      'Tệp khách đã chọn (chưa đính kèm, hãy xin khách gửi qua email/Zalo)': fileNames,
    }),
  });

  const data = (await res.json().catch(() => null)) as { success?: boolean; message?: string } | null;
  if (!res.ok || !data?.success) throw new Error(data?.message || `HTTP ${res.status}`);
}
