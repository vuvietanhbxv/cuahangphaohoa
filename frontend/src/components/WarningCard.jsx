import { Link } from "react-router-dom";
import { Flame } from "lucide-react";
import { Badge } from "./ui.jsx";
import { formatRelative } from "../lib/format.js";
import { buildDetailUrl } from "../lib/lookup.js";

const LEVEL_LABEL = { high: "Rủi ro cao", medium: "Rủi ro trung bình", low: "Rủi ro thấp" };

export default function WarningCard({ item, index = 0 }) {
  const level = item.risk_level || item.riskLevel || "medium";
  const value = item.target_value || item.target_display || item.targetValue || "";
  const reasonLabel = item.reason_label || item.reason || item.reasonText || "";
  const targetType = item.target_type || item.targetType || "PHONE";
  const count = item.reports_count || item.reportsCount || 0;
  const date = item.created_at || item.createdAt;

  const styleClass =
    level === "high"
      ? "border-rose-400/30 bg-gradient-to-br from-rose-950/80 to-slate-950"
      : level === "medium"
      ? "border-amber-400/30 bg-gradient-to-br from-amber-950/55 to-slate-950"
      : "border-yellow-300/25 bg-gradient-to-br from-yellow-950/35 to-slate-950";

  // Lấy normalized value để build detail link
  const normalizedValue = String(value).replace(/[^\d]/g, "");

  return (
    <Link
      to={buildDetailUrl(targetType, normalizedValue)}
      className={`group relative block overflow-hidden rounded-3xl border p-5 shadow-2xl shadow-black/20 transition hover:-translate-y-1 ${styleClass}`}
    >
      <Flame className="absolute -right-3 -top-3 h-20 w-20 text-amber-500 opacity-10 transition group-hover:scale-110" />
      <Badge variant={level === "high" ? "danger" : "warn"}>{LEVEL_LABEL[level]}</Badge>
      <p className="mt-4 text-2xl font-black text-main">{value}</p>
      <p className="mt-2 text-sm text-soft">{reasonLabel}</p>
      <div className="mt-4 flex items-center justify-between text-xs text-muted">
        <span>{formatRelative(date)}</span>
        <span>{count} báo cáo</span>
      </div>
    </Link>
  );
}
