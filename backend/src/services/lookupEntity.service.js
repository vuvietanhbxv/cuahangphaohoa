import {
  normalizePhone,
  normalizeAccount,
  formatPhoneDisplay,
  formatAccountDisplay,
} from "../lib/normalize.js";

export function buildEntityShape(type, rawValue, extra = {}) {
  const t = String(type).toUpperCase();
  let normalized = "";
  let display = String(rawValue || "").trim();

  if (t === "PHONE") {
    normalized = normalizePhone(rawValue);
    display = formatPhoneDisplay(normalized);
  } else if (t === "BANK_ACCOUNT") {
    normalized = normalizeAccount(rawValue);
    display = formatAccountDisplay(normalized);
  } else {
    normalized = String(rawValue || "").trim().toLowerCase();
    display = String(rawValue || "").trim();
  }

  return {
    type: t,
    rawValue: String(rawValue || "").trim(),
    normalizedValue: normalized,
    displayValue: display,
    bankName: extra.bankName || null,
  };
}

/**
 * Tìm entity theo (type, normalizedValue). Không tạo mới.
 */
export async function findEntity(prisma, type, normalizedValue) {
  if (!normalizedValue) return null;
  return prisma.lookupEntity.findUnique({
    where: { type_normalizedValue: { type, normalizedValue } },
  });
}

/**
 * Tạo nếu chưa có, trả về entity.
 */
export async function upsertEntity(prisma, type, rawValue, extra = {}) {
  const shape = buildEntityShape(type, rawValue, extra);
  if (!shape.normalizedValue || shape.normalizedValue.length < 4) {
    throw new Error("Giá trị tra cứu quá ngắn để chuẩn hoá");
  }
  return prisma.lookupEntity.upsert({
    where: { type_normalizedValue: { type: shape.type, normalizedValue: shape.normalizedValue } },
    update: {
      bankName: shape.bankName || undefined,
    },
    create: shape,
  });
}
