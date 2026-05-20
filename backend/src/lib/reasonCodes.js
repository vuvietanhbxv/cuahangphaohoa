// Danh mục mã lý do báo cáo (rule-based, có thể mở rộng sau).
// severity: 'low' | 'medium' | 'high' — dùng cho risk score.

export const REASON_CODES = [
  { code: "blocked_after_payment",  label: "Nhận tiền rồi chặn liên lạc",            severity: "high" },
  { code: "deposit_no_delivery",    label: "Yêu cầu cọc trước nhưng không giao hàng", severity: "high" },
  { code: "deposit_required",       label: "Yêu cầu cọc trước, không giao hàng",      severity: "high" }, // alias cũ
  { code: "fake_seller",            label: "Giả mạo cửa hàng / shop uy tín",          severity: "high" },
  { code: "fake_product_image",     label: "Dùng ảnh sản phẩm giả",                   severity: "medium" },
  { code: "wrong_product",          label: "Giao hàng sai sản phẩm",                  severity: "medium" },
  { code: "no_refund",              label: "Không hoàn tiền khi sai cam kết",         severity: "medium" },
  { code: "suspicious_bank_account",label: "Tài khoản nhận tiền đáng ngờ",            severity: "high" },
  { code: "suspicious_phone",       label: "Số điện thoại đáng ngờ",                  severity: "medium" },
  { code: "abnormal_price",         label: "Báo giá bất thường / giá quá rẻ",         severity: "low" },
  { code: "other",                  label: "Lý do khác",                              severity: "low" },
];

export const REASON_CODE_VALUES = REASON_CODES.map((r) => r.code);

export const REASON_BY_CODE = Object.fromEntries(REASON_CODES.map((r) => [r.code, r]));

export function reasonLabel(code) {
  return REASON_BY_CODE[code]?.label || code;
}

export const CONTACT_CHANNELS = [
  { code: "zalo",      label: "Zalo" },
  { code: "facebook",  label: "Facebook" },
  { code: "shopee",    label: "Shopee" },
  { code: "tiktok",    label: "TikTok" },
  { code: "telegram",  label: "Telegram" },
  { code: "phone_call",label: "Điện thoại" },
  { code: "other",     label: "Khác" },
];
export const CONTACT_CHANNEL_VALUES = CONTACT_CHANNELS.map((c) => c.code);

export const PAYMENT_METHODS = [
  { code: "deposit",      label: "Chuyển cọc" },
  { code: "full_payment", label: "Thanh toán đủ" },
  { code: "cod",          label: "COD" },
  { code: "other",        label: "Khác" },
];
export const PAYMENT_METHOD_VALUES = PAYMENT_METHODS.map((p) => p.code);

export const REGIONS = [
  { code: "BAC",   label: "Miền Bắc" },
  { code: "TRUNG", label: "Miền Trung" },
  { code: "NAM",   label: "Miền Nam" },
];
