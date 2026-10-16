/**
 * Cấu hình website — chỉ cần sửa file này (có thể sửa trực tiếp trên GitHub rồi Commit).
 *
 * Lưu ý: đây là web tĩnh, mọi giá trị ở đây đều nằm trong file JS công khai.
 * Không bao giờ đặt mật khẩu dạng chữ thường hay API key bí mật vào đây.
 */

/**
 * Mã hash mật khẩu trang Quản trị (dạng `pbkdf2$...`).
 * Cách tạo: mở trang web → bấm "Quản trị" → mục "Tạo mã hash mật khẩu" → dán kết quả vào đây.
 * Để trống = khóa hoàn toàn trang Quản trị.
 */
export const ADMIN_PASSWORD_HASH = 'pbkdf2$210000$uJJ33xPue0kRTPGISTPl5Q==$MmPNikt7nV2rpaRmsMFZPP2V1NjiDyyTzZlE+sGKv1Y=';

/**
 * Access Key của Web3Forms — dùng để gửi yêu cầu báo giá về email của bạn.
 * Lấy miễn phí tại https://web3forms.com (nhập email nhận thư → key được gửi vào hộp thư).
 * Key này được thiết kế để đặt công khai trên web, chỉ gửi được thư tới email đã đăng ký.
 */
export const WEB3FORMS_ACCESS_KEY = '619edd4d-c87a-4832-ad23-3f2401050907';

/**
 * URL Google Apps Script (dạng https://script.google.com/macros/s/.../exec) — nhận yêu cầu báo giá
 * KÈM TỆP khách gửi: lưu tệp vào Google Drive của bạn và gửi email có đính kèm.
 * Mã script nằm ở scripts/google-apps-script.gs. Để trống = dùng Web3Forms (không gửi được tệp).
 */
export const QUOTE_APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbxEXEAHVhSQ1NHCRg1uCwhRrYobohiLoR_E6peeARqaP3ZvvGLvq9NUnG-LED6KPVHB/exec';

/**
 * Repo GitHub dùng làm kho lưu ảnh và nội dung (sản phẩm, cấu hình công ty).
 * Admin bấm Lưu → web commit file vào repo này → GitHub Actions build lại → khách thấy sau 1–2 phút.
 */
export const GITHUB_REPO = {
  owner: 'duy2kne',
  repo: 'Server-PCB',
  branch: 'main',
};

/** Thời gian giữ phiên đăng nhập Quản trị */
export const ADMIN_SESSION_HOURS = 8;
