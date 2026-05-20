// Chuẩn hoá thông tin tra cứu trước khi lưu / so khớp.
// Triết lý: lưu cả raw (người dùng nhập) lẫn normalized (để index/khớp chính xác).

export function normalizeDigits(value) {
  if (!value) return "";
  return String(value).replace(/\D/g, "");
}

/**
 * Chuẩn hoá số điện thoại Việt Nam.
 *  +84 378 123 456 → 0378123456
 *  84 378 123 456  → 0378123456
 *  0378.123.456    → 0378123456
 *  378123456       → 0378123456   (thiếu 0 đầu)
 *  0378123456      → 0378123456
 */
export function normalizePhone(value) {
  let digits = normalizeDigits(value);
  if (!digits) return "";
  if (digits.startsWith("84") && digits.length >= 10) {
    digits = "0" + digits.slice(2);
  } else if (!digits.startsWith("0") && digits.length === 9) {
    digits = "0" + digits;
  }
  return digits;
}

/**
 * Chuẩn hoá số tài khoản: chỉ giữ chữ số (và chữ cái nếu có).
 */
export function normalizeAccount(value) {
  if (!value) return "";
  // Cho phép giữ chữ cái A-Z (một số ngân hàng có ký tự alpha)
  return String(value)
    .toUpperCase()
    .replace(/[^0-9A-Z]/g, "");
}

/**
 * Định dạng hiển thị để dễ đọc lại cho người dùng:
 *   0378123456        → 0378 123 456
 *   970412345678999   → 9704 1234 5678 999
 */
export function formatPhoneDisplay(digits) {
  const d = normalizeDigits(digits);
  if (d.length === 10) return `${d.slice(0, 4)} ${d.slice(4, 7)} ${d.slice(7)}`;
  if (d.length === 11) return `${d.slice(0, 4)} ${d.slice(4, 7)} ${d.slice(7)}`;
  return d;
}

export function formatAccountDisplay(value) {
  const v = normalizeAccount(value);
  return v.replace(/(.{4})/g, "$1 ").trim();
}

/**
 * Tự nhận diện loại đầu vào.
 * Dùng cho chế độ auto_detect (chưa expose trong UI nhưng có sẵn ở backend).
 */
export function detectType(value) {
  const raw = String(value || "").trim();
  if (!raw) return null;

  const digitsOnly = normalizeDigits(raw);

  // Heuristic số điện thoại VN: bắt đầu 0 hoặc +84/84, độ dài 9–11.
  if (
    (/^(\+?84|0)/.test(raw.replace(/\s+/g, "")) && digitsOnly.length >= 9 && digitsOnly.length <= 11) ||
    (digitsOnly.length >= 9 && digitsOnly.length <= 11 && digitsOnly.startsWith("0"))
  ) {
    return "PHONE";
  }
  // Số tài khoản ngân hàng VN thường dài 9–20 chữ số (hoặc có thêm chữ cái).
  if (/^[0-9A-Za-z\s\-]+$/.test(raw) && normalizeAccount(raw).length >= 6) {
    return "BANK_ACCOUNT";
  }
  return null;
}

/**
 * Mask hiển thị: che thông tin nhạy cảm khi public.
 *   0378123456       → 0378 *** 456
 *   970412345678999  → 9704 **** **** 999
 */
export function maskPhone(value) {
  const d = normalizeDigits(value);
  if (d.length < 7) return d;
  const head = d.slice(0, 4);
  const tail = d.slice(-3);
  return `${head} *** ${tail}`;
}

export function maskAccount(value) {
  const v = normalizeAccount(value);
  if (v.length < 7) return v;
  const head = v.slice(0, 4);
  const tail = v.slice(-3);
  const masked = "*".repeat(Math.max(v.length - 7, 4));
  return `${head} ${masked.replace(/(.{4})/g, "$1 ").trim()} ${tail}`;
}
