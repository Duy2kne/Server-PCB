// Đặt mật khẩu trang Quản trị: hỏi mật khẩu, tạo mã hash PBKDF2 và ghi vào src/config.ts.
// Chạy: npm run set-password
// Thông số phải khớp với src/services/auth.ts (PBKDF2-SHA256, 210.000 vòng, salt 16 byte, khóa 32 byte).
import { pbkdf2Sync, randomBytes } from 'node:crypto';
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const ITERATIONS = 210_000;
const MIN_LENGTH = 10;
const configPath = fileURLToPath(new URL('../src/config.ts', import.meta.url));

/** Đọc một dòng từ bàn phím, hiện dấu * thay cho ký tự */
function askHidden(question) {
  return new Promise((resolve, reject) => {
    const { stdin, stdout } = process;
    if (!stdin.isTTY) return reject(new Error('Hãy chạy lệnh này trong terminal (PowerShell / CMD).'));
    stdout.write(question);
    stdin.setRawMode(true);
    stdin.resume();
    stdin.setEncoding('utf8');
    let value = '';
    const onData = chunk => {
      for (const ch of chunk) {
        if (ch === '\r' || ch === '\n') {
          stdin.setRawMode(false);
          stdin.pause();
          stdin.off('data', onData);
          stdout.write('\n');
          return resolve(value);
        }
        if (ch === '\u0003') {
          stdout.write('\n');
          process.exit(130); // Ctrl+C
        }
        if (ch === '\u007f' || ch === '\b') {
          if (value.length) {
            value = value.slice(0, -1);
            stdout.write('\b \b');
          }
        } else {
          value += ch;
          stdout.write('*');
        }
      }
    };
    stdin.on('data', onData);
  });
}

const password = await askHidden(`Mật khẩu Quản trị mới (ít nhất ${MIN_LENGTH} ký tự): `).catch(err => {
  console.error(`✗ ${err.message}`);
  process.exit(1);
});
if (password.length < MIN_LENGTH) {
  console.error(`✗ Mật khẩu quá ngắn (${password.length} ký tự). Cần ít nhất ${MIN_LENGTH} ký tự.`);
  process.exit(1);
}
if ((await askHidden('Nhập lại mật khẩu: ')) !== password) {
  console.error('✗ Hai lần nhập không khớp.');
  process.exit(1);
}

const salt = randomBytes(16);
const hash = pbkdf2Sync(password, salt, ITERATIONS, 32, 'sha256');
const value = `pbkdf2$${ITERATIONS}$${salt.toString('base64')}$${hash.toString('base64')}`;

const source = readFileSync(configPath, 'utf8');
const pattern = /export const ADMIN_PASSWORD_HASH = '[^']*';/;
if (!pattern.test(source)) {
  console.error('✗ Không tìm thấy dòng ADMIN_PASSWORD_HASH trong src/config.ts');
  process.exit(1);
}
writeFileSync(configPath, source.replace(pattern, `export const ADMIN_PASSWORD_HASH = '${value}';`));

console.log('✓ Đã ghi mã hash vào src/config.ts');
console.log('  Mật khẩu gốc KHÔNG được lưu ở đâu cả — hãy ghi nhớ nó.');
console.log('  Tiếp theo: upload src/config.ts lên GitHub để web cập nhật.');
