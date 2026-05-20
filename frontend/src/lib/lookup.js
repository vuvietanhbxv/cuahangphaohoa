// Constants & helpers cho UI lookup module.

export const STATUS_META = {
  danger: {
    label: "Có cảnh báo rủi ro",
    tone: "danger",
    bg: "bg-rose-500/10",
    border: "border-rose-400/40",
    color: "text-rose-200",
    icon: "AlertTriangle",
  },
  watchlist: {
    label: "Đang theo dõi",
    tone: "warn",
    bg: "bg-amber-400/10",
    border: "border-amber-300/40",
    color: "text-amber-200",
    icon: "ShieldAlert",
  },
  verified_seller: {
    label: "Người bán đã xác minh",
    tone: "verified",
    bg: "bg-emerald-400/10",
    border: "border-emerald-400/30",
    color: "text-emerald-300",
    icon: "BadgeCheck",
  },
  safe: {
    label: "Chưa có cảnh báo nghiêm trọng",
    tone: "safe",
    bg: "bg-emerald-400/10",
    border: "border-emerald-400/30",
    color: "text-emerald-300",
    icon: "CheckCircle2",
  },
  unknown: {
    label: "Chưa có dữ liệu",
    tone: "neutral",
    bg: "bg-slate-500/10",
    border: "border-white/10",
    color: "text-slate-200",
    icon: "Eye",
  },
};

export const RISK_LEVEL_META = {
  very_low: { label: "Rất thấp", color: "text-emerald-300" },
  low: { label: "Thấp", color: "text-emerald-300" },
  medium: { label: "Trung bình", color: "text-amber-300" },
  high: { label: "Cao", color: "text-rose-300" },
  very_high: { label: "Rất cao", color: "text-rose-400" },
};

export function buildDetailUrl(type, normalizedValue) {
  const slug = type === "PHONE" ? "phone" : "bank";
  return `/lookup/${slug}/${normalizedValue}`;
}
