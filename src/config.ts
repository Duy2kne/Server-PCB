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
export const WEB3FORMS_ACCESS_KEY = '98287f43-87cf-4a33-97e0-9e3c60364af6';

/** Thời gian giữ phiên đăng nhập Quản trị */
export const ADMIN_SESSION_HOURS = 8;
