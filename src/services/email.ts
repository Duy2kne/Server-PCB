import { WEB3FORMS_ACCESS_KEY } from '../config';
import type { QuoteRequest } from '../types';

/**
 * Gửi yêu cầu báo giá về email chủ website qua Web3Forms (web tĩnh không tự gửi mail được).
 * Thư được gửi tới email đã đăng ký với Access Key; bấm "Trả lời" là trả lời thẳng cho khách.
 */

export const isEmailConfigured = () => WEB3FORMS_ACCESS_KEY.trim().length > 0;

export async function sendQuoteEmail(quote: QuoteRequest): Promise<void> {
  if (!isEmailConfigured()) throw new Error('Chưa cấu hình WEB3FORMS_ACCESS_KEY');

  const files = quote.attachedFiles.length
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
      'Tệp khách đã chọn (chưa đính kèm, hãy xin khách gửi qua email/Zalo)': files,
    }),
  });

  const data = (await res.json().catch(() => null)) as { success?: boolean; message?: string } | null;
  if (!res.ok || !data?.success) throw new Error(data?.message || `HTTP ${res.status}`);
}
