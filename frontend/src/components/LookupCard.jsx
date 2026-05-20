import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  Phone,
  CreditCard,
  Eye,
  CheckCircle2,
  AlertTriangle,
  ShieldCheck,
  ShieldAlert,
  BadgeCheck,
  Store,
  ExternalLink,
} from "lucide-react";
import { api } from "../api/client.js";
import { GlassCard } from "./ui.jsx";
import { STATUS_META, RISK_LEVEL_META, buildDetailUrl } from "../lib/lookup.js";

const ICONS = { AlertTriangle, CheckCircle2, ShieldAlert, ShieldCheck, BadgeCheck, Eye };

function useDebounced(value, delay = 400) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

function RiskMeter({ score }) {
  const pct = Math.max(0, Math.min(100, score));
  const color =
    pct <= 20 ? "from-emerald-300 to-emerald-500"
    : pct <= 40 ? "from-emerald-300 to-amber-400"
    : pct <= 65 ? "from-amber-300 to-orange-400"
    : pct <= 85 ? "from-orange-400 to-rose-500"
    : "from-rose-400 to-rose-600";
  return (
    <div className="mt-2">
      <div className="flex items-center justify-between text-xs text-muted">
        <span>Điểm rủi ro</span>
        <span className="font-black text-main">{pct}/100</span>
      </div>
      <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-slate-800">
        <div
          className={`h-full rounded-full bg-gradient-to-r ${color}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

export default function LookupCard({ idAnchor = "lookup", compact = false }) {
  const [lookupType, setLookupType] = useState("phone");
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const debouncedQuery = useDebounced(query, 500);
  const cleaned = useMemo(() => String(debouncedQuery).replace(/[^\d+A-Za-z]/g, ""), [debouncedQuery]);

  useEffect(() => {
    let cancelled = false;
    if (cleaned.length < 4) {
      setResult(null);
      setError(null);
      return;
    }
    setLoading(true);
    api
      .post("/lookup", { type: lookupType, value: debouncedQuery })
      .then((data) => {
        if (!cancelled) {
          setResult(data);
          setError(null);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err.message || "Không tra cứu được");
          setResult(null);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [cleaned, lookupType, debouncedQuery]);

  const meta = result ? STATUS_META[result.status] : null;
  const Icon = meta ? ICONS[meta.icon] : Eye;

  return (
    <GlassCard className="p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-bold text-amber-500">Tra cứu nhanh</p>
          <h3 className="mt-1 text-2xl font-black text-main">
            Kiểm tra số điện thoại hoặc tài khoản
          </h3>
        </div>
        <div className="rounded-2xl bg-amber-300/15 p-3 text-amber-500 ring-1 ring-amber-300/20">
          <ShieldCheck className="h-6 w-6" />
        </div>
      </div>

      <div id={idAnchor} className="mt-6 grid grid-cols-2 gap-3 rounded-2xl border border-white/10 bg-slate-950/70 p-1">
        <button
          onClick={() => setLookupType("phone")}
          className={`flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-black ${
            lookupType === "phone"
              ? "bg-gradient-to-r from-amber-300 to-orange-400 text-slate-950"
              : "text-muted"
          }`}
        >
          <Phone className="h-4 w-4" /> Số điện thoại
        </button>
        <button
          onClick={() => setLookupType("bank_account")}
          className={`flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-black ${
            lookupType === "bank_account"
              ? "bg-gradient-to-r from-amber-300 to-orange-400 text-slate-950"
              : "text-muted"
          }`}
        >
          <CreditCard className="h-4 w-4" /> Số tài khoản
        </button>
      </div>

      <div className="mt-5 flex gap-3">
        <div className="flex items-center rounded-2xl border border-white/10 bg-slate-950/80 px-3 text-sm font-bold text-main">
          🇻🇳 <span className="ml-2 text-soft">+84</span>
        </div>
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder={
            lookupType === "phone"
              ? "Nhập số điện thoại — ví dụ 0378 123 456"
              : "Nhập số tài khoản — ví dụ 9704 1234 5678 999"
          }
          className="min-w-0 flex-1 rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-4 text-main outline-none transition placeholder:text-muted focus:border-amber-300 focus:ring-4 focus:ring-amber-300/10"
        />
      </div>

      <div className="mt-5 rounded-2xl border border-white/10 bg-slate-950/65 p-5">
        <p className="mb-3 text-sm font-bold text-amber-500">Kết quả tra cứu</p>

        {loading && <p className="text-sm text-soft">Đang tra cứu...</p>}
        {error && <p className="text-sm text-rose-300">{error}</p>}

        {!loading && !error && !result && (
          <div className="flex items-start gap-3 text-muted">
            <Eye className="mt-1 h-5 w-5 text-amber-500" />
            <p>Nhập tối thiểu 4 chữ số. Hệ thống sẽ đối chiếu với danh sách cảnh báo, người bán uy tín và báo cáo cộng đồng.</p>
          </div>
        )}

        {!loading && !error && result && meta && (
          <div className="space-y-4">
            <div className={`rounded-2xl border p-4 ${meta.bg} ${meta.border}`}>
              <div className="flex items-start gap-3">
                <div className={`rounded-xl p-2 ${meta.bg} ring-1 ${meta.border}`}>
                  <Icon className={`h-6 w-6 ${meta.color}`} />
                </div>
                <div className="flex-1">
                  <p className={`text-base font-black ${meta.color}`}>{meta.label}</p>
                  <p className="mt-1 text-sm text-soft">{result.summary}</p>
                  {result.status !== "unknown" && result.status !== "verified_seller" && (
                    <RiskMeter score={result.risk_score} />
                  )}
                </div>
              </div>

              <div className="mt-3 flex flex-wrap gap-3 text-xs text-soft">
                {result.report_count > 0 && (
                  <span>
                    Tổng <b className="text-main">{result.report_count}</b> báo cáo
                    {result.verified_report_count > 0 && (
                      <> · <b className="text-rose-300">{result.verified_report_count}</b> đã xác minh</>
                    )}
                  </span>
                )}
                {result.is_verified_seller && result.trusted_seller && (
                  <span className="inline-flex items-center gap-1 text-emerald-300">
                    <Store className="h-3.5 w-3.5" /> {result.trusted_seller.name}
                  </span>
                )}
              </div>
            </div>

            {result.reasons && result.reasons.length > 0 && (
              <div>
                <p className="text-xs font-bold uppercase tracking-wide text-amber-500">Lý do phổ biến</p>
                <ul className="mt-2 space-y-1 text-sm text-soft">
                  {result.reasons.map((r) => (
                    <li key={r.code} className="flex items-center justify-between gap-3 rounded-xl bg-slate-950/60 px-3 py-2">
                      <span>{r.label}</span>
                      <span className="font-black text-amber-500">{r.count}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {result.related_entities && result.related_entities.length > 0 && (
              <div>
                <p className="text-xs font-bold uppercase tracking-wide text-amber-500">Thông tin liên quan</p>
                <ul className="mt-2 space-y-1 text-sm text-soft">
                  {result.related_entities.map((r, idx) => (
                    <li key={idx} className="rounded-xl bg-slate-950/60 px-3 py-2">
                      {r.type === "phone" ? "Số điện thoại liên quan: " : "Tài khoản liên quan: "}
                      <span className="font-bold text-main">{r.display_value}</span>
                      {r.bank_name ? <span className="text-muted"> · {r.bank_name}</span> : null}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {result.evidence_summary?.reports_with_evidence > 0 && (
              <div className="rounded-xl border border-white/10 bg-slate-950/60 px-3 py-2 text-sm text-soft">
                Có <b className="text-main">{result.evidence_summary.reports_with_evidence}</b> báo cáo kèm bằng chứng
                ({result.evidence_summary.total_evidence_files} tệp). Ảnh chi tiết chỉ admin xem được.
              </div>
            )}

            {result.recommendations && result.recommendations.length > 0 && (
              <div>
                <p className="text-xs font-bold uppercase tracking-wide text-amber-500">Khuyến nghị</p>
                <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-soft">
                  {result.recommendations.map((r, idx) => (
                    <li key={idx}>{r}</li>
                  ))}
                </ul>
              </div>
            )}

            <div className="flex flex-wrap gap-2 pt-1">
              <Link
                to={buildDetailUrl(result.query.type, result.query.normalized_value)}
                className="inline-flex items-center gap-2 rounded-xl bg-white/5 px-4 py-2 text-sm font-bold text-slate-100 ring-1 ring-white/10 hover:bg-white/10"
              >
                <ExternalLink className="h-4 w-4" /> Xem chi tiết
              </Link>
              <Link
                to={`/submit/report?type=${result.query.type === "PHONE" ? "phone" : "bank_account"}&value=${encodeURIComponent(
                  result.query.normalized_value
                )}`}
                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-rose-500 to-orange-500 px-4 py-2 text-sm font-black text-main shadow-lg shadow-rose-500/20 hover:from-rose-400 hover:to-amber-400"
              >
                Gửi thêm báo cáo
              </Link>
            </div>
          </div>
        )}
      </div>
    </GlassCard>
  );
}
