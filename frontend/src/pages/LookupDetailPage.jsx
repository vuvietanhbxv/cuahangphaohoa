import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  AlertTriangle,
  CheckCircle2,
  ShieldAlert,
  ShieldCheck,
  BadgeCheck,
  Eye,
  Phone,
  CreditCard,
  Store,
  Sparkles,
} from "lucide-react";
import { api } from "../api/client.js";
import { GlassCard, SectionTitle, Badge } from "../components/ui.jsx";
import { STATUS_META, RISK_LEVEL_META } from "../lib/lookup.js";
import { formatRelative } from "../lib/format.js";

const ICONS = { AlertTriangle, CheckCircle2, ShieldAlert, ShieldCheck, BadgeCheck, Eye };

function RiskGauge({ score }) {
  const pct = Math.max(0, Math.min(100, score));
  const color =
    pct <= 20 ? "from-emerald-300 to-emerald-500"
    : pct <= 40 ? "from-emerald-300 to-amber-400"
    : pct <= 65 ? "from-amber-300 to-orange-400"
    : pct <= 85 ? "from-orange-400 to-rose-500"
    : "from-rose-400 to-rose-600";
  return (
    <div>
      <div className="flex items-baseline gap-2">
        <span className="text-5xl font-black text-main">{pct}</span>
        <span className="text-muted">/ 100</span>
      </div>
      <div className="mt-2 h-3 w-full overflow-hidden rounded-full bg-slate-800">
        <div className={`h-full bg-gradient-to-r ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <div className="mt-2 flex justify-between text-xs text-muted">
        <span>0</span><span>20</span><span>40</span><span>65</span><span>85</span><span>100</span>
      </div>
    </div>
  );
}

export default function LookupDetailPage() {
  const { type, value } = useParams();
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    setLoading(true);
    const apiType = type === "bank" ? "bank_account" : "phone";
    api
      .post("/lookup", { type: apiType, value })
      .then(setResult)
      .catch((err) => setError(err.message || "Không tra cứu được"))
      .finally(() => setLoading(false));
  }, [type, value]);

  if (loading) {
    return (
      <section className="mx-auto max-w-4xl px-5 py-12">
        <p className="text-soft">Đang tra cứu...</p>
      </section>
    );
  }
  if (error) {
    return (
      <section className="mx-auto max-w-4xl px-5 py-12">
        <p className="text-rose-300">{error}</p>
      </section>
    );
  }
  if (!result) return null;

  const meta = STATUS_META[result.status] || STATUS_META.unknown;
  const Icon = ICONS[meta.icon] || Eye;
  const riskMeta = RISK_LEVEL_META[result.risk_level] || RISK_LEVEL_META.very_low;

  return (
    <section className="mx-auto max-w-5xl px-5 py-10">
      <Link to="/lookup" className="text-sm text-amber-500 hover:text-amber-200">
        ← Quay lại tra cứu
      </Link>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        {result.query.type === "PHONE" ? <Phone className="h-6 w-6 text-amber-500" /> : <CreditCard className="h-6 w-6 text-amber-500" />}
        <h1 className="text-3xl font-black text-main md:text-4xl">{result.query.display_value}</h1>
        <Badge variant={meta.tone === "danger" ? "danger" : meta.tone === "warn" ? "warn" : meta.tone === "verified" ? "gold" : "neutral"}>
          {meta.label}
        </Badge>
      </div>

      <div className="mt-6 grid gap-5 lg:grid-cols-[1.2fr_0.8fr]">
        <GlassCard className={`p-6 ${meta.border} border`}>
          <div className="flex items-start gap-3">
            <div className={`rounded-xl p-3 ${meta.bg} ring-1 ${meta.border}`}>
              <Icon className={`h-7 w-7 ${meta.color}`} />
            </div>
            <div className="flex-1">
              <p className={`text-lg font-black ${meta.color}`}>{meta.label}</p>
              <p className="mt-1 text-soft">{result.summary}</p>
            </div>
          </div>
          {result.status !== "unknown" && result.status !== "verified_seller" && (
            <div className="mt-5">
              <RiskGauge score={result.risk_score} />
              <p className={`mt-2 text-sm font-bold ${riskMeta.color}`}>Mức rủi ro: {riskMeta.label}</p>
            </div>
          )}
        </GlassCard>

        <GlassCard className="p-6">
          <p className="text-xs font-bold uppercase tracking-wide text-amber-500">Thống kê báo cáo</p>
          <div className="mt-3 space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-muted">Tổng báo cáo</span><b className="text-main">{result.report_count}</b></div>
            <div className="flex justify-between"><span className="text-muted">Đã admin xác minh</span><b className="text-rose-300">{result.verified_report_count}</b></div>
            <div className="flex justify-between"><span className="text-muted">Đang chờ duyệt</span><b className="text-amber-500">{result.pending_report_count}</b></div>
            <div className="flex justify-between"><span className="text-muted">Báo cáo gần nhất</span><span className="text-main">{result.last_reported_at ? formatRelative(result.last_reported_at) : "—"}</span></div>
            <div className="flex justify-between"><span className="text-muted">Bằng chứng</span><span className="text-main">{result.evidence_summary?.total_evidence_files || 0} tệp · {result.evidence_summary?.reports_with_evidence || 0} báo cáo</span></div>
          </div>
        </GlassCard>
      </div>

      {result.is_verified_seller && result.trusted_seller && (
        <GlassCard className="mt-5 border border-emerald-400/30 p-6">
          <div className="flex items-start gap-3">
            <Store className="h-7 w-7 text-emerald-300" />
            <div>
              <p className="text-xs font-bold uppercase tracking-wide text-emerald-300">Người bán đã xác minh</p>
              <p className="mt-1 text-2xl font-black text-main">{result.trusted_seller.name}</p>
              <p className="text-sm text-soft">
                {result.trusted_seller.location} · {Number(result.trusted_seller.rating_avg).toFixed(1)}/5 · {result.trusted_seller.orders_count} giao dịch
              </p>
              {result.verified_report_count > 0 && (
                <p className="mt-2 rounded-xl bg-rose-500/10 px-3 py-2 text-sm text-rose-200">
                  Lưu ý: người bán từng được xác minh nhưng hiện có cảnh báo mới đang được xem xét.
                </p>
              )}
            </div>
          </div>
        </GlassCard>
      )}

      {result.reasons && result.reasons.length > 0 && (
        <div className="mt-6">
          <SectionTitle dark eyebrow="Lý do bị báo cáo" title="Phân loại theo mã lý do" />
          <GlassCard className="mt-4 p-5">
            <ul className="space-y-2 text-sm">
              {result.reasons.map((r) => {
                const max = Math.max(...result.reasons.map((x) => x.count));
                const pct = Math.round((r.count / max) * 100);
                return (
                  <li key={r.code} className="rounded-xl bg-slate-950/60 px-4 py-3">
                    <div className="flex items-center justify-between text-main">
                      <span className="font-bold">{r.label}</span>
                      <span className="font-black text-amber-500">{r.count} báo cáo</span>
                    </div>
                    <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-slate-800">
                      <div className="h-full rounded-full bg-gradient-to-r from-rose-400 to-amber-300" style={{ width: `${pct}%` }} />
                    </div>
                  </li>
                );
              })}
            </ul>
          </GlassCard>
        </div>
      )}

      {result.related_entities && result.related_entities.length > 0 && (
        <div className="mt-6">
          <SectionTitle dark eyebrow="Liên kết phát hiện được" title="Thông tin liên quan" desc="Các số điện thoại / tài khoản đã được cộng đồng liên hệ với thông tin này." />
          <GlassCard className="mt-4 p-5">
            <ul className="space-y-2">
              {result.related_entities.map((r, idx) => (
                <li key={idx} className="flex items-center justify-between rounded-xl bg-slate-950/60 px-4 py-3 text-sm">
                  <div className="flex items-center gap-3">
                    {r.type === "phone" ? <Phone className="h-4 w-4 text-amber-500" /> : <CreditCard className="h-4 w-4 text-amber-500" />}
                    <span className="font-bold text-main">{r.display_value}</span>
                    {r.bank_name && <span className="text-muted">· {r.bank_name}</span>}
                  </div>
                  <span className="text-xs text-muted">{r.type === "phone" ? "Số điện thoại" : "Tài khoản ngân hàng"}</span>
                </li>
              ))}
            </ul>
          </GlassCard>
        </div>
      )}

      <div className="mt-6">
        <SectionTitle dark eyebrow="Hành động" title="Khuyến nghị & gửi báo cáo" />
        <GlassCard className="mt-4 p-5">
          <ul className="list-disc space-y-1 pl-5 text-sm text-soft">
            {result.recommendations.map((r, idx) => (
              <li key={idx}>{r}</li>
            ))}
          </ul>
          <div className="mt-4 flex flex-wrap gap-3">
            <Link
              to={`/submit/report?type=${result.query.type === "PHONE" ? "phone" : "bank_account"}&value=${encodeURIComponent(result.query.normalized_value)}`}
              className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-rose-500 to-orange-500 px-5 py-3 text-sm font-black text-main shadow-lg shadow-rose-500/20 hover:from-rose-400 hover:to-amber-400"
            >
              <Sparkles className="h-4 w-4" /> Gửi báo cáo bổ sung
            </Link>
            <Link
              to="/lookup"
              className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-5 py-3 text-sm font-bold text-soft hover:bg-white/10"
            >
              Tra cứu thông tin khác
            </Link>
          </div>
        </GlassCard>
      </div>
    </section>
  );
}
