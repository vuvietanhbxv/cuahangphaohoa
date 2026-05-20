import { useEffect, useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { TrendingUp, TrendingDown, ArrowRight } from "lucide-react";
import { api, REGION_LABEL, REGION_VALUES } from "../api/client.js";
import { formatCurrency } from "../lib/format.js";
import { GlassCard } from "./ui.jsx";

const REGION_TABS = [
  { value: "BAC",   label: "Miền Bắc" },
  { value: "TRUNG", label: "Miền Trung" },
  { value: "NAM",   label: "Miền Nam" },
];

export default function MarketTeaser() {
  const [summary, setSummary] = useState([]);
  const [loading, setLoading] = useState(true);
  const [region, setRegion] = useState("BAC");

  useEffect(() => {
    api.get("/prices/summary").then((d) => setSummary(d.items || [])).finally(() => setLoading(false));
  }, []);

  const rows = useMemo(
    () => summary.filter((r) => r.region === region),
    [summary, region]
  );

  return (
    <GlassCard className="p-5 md:p-6">
      {/* Region tabs */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="theme-border inline-flex rounded-xl border p-1">
          {REGION_TABS.map((t) => (
            <button
              key={t.value}
              onClick={() => setRegion(t.value)}
              className={`rounded-lg px-3 py-1.5 text-xs font-bold transition ${
                region === t.value
                  ? "bg-amber-400 text-slate-950 shadow-sm"
                  : "text-soft hover:text-amber-500"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
        <Link
          to="/market"
          className="inline-flex items-center gap-1 text-xs font-bold text-amber-500 hover:text-amber-400"
        >
          Xem đầy đủ <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>

      {/* Table */}
      <div className="mt-4 overflow-x-auto">
        <table className="w-full min-w-[520px] text-left text-sm">
          <thead className="border-b border-line text-xs uppercase tracking-wide text-muted">
            <tr>
              <th className="py-2">Sản phẩm</th>
              <th className="py-2 text-right">Giá TB</th>
              <th className="py-2 text-right">Thấp</th>
              <th className="py-2 text-right">Cao</th>
              <th className="py-2 text-right">Biến động</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line text-soft">
            {loading && (
              <tr><td colSpan={5} className="py-6 text-center text-muted">Đang tải...</td></tr>
            )}
            {!loading && rows.length === 0 && (
              <tr><td colSpan={5} className="py-6 text-center text-muted">Chưa có giá miền này</td></tr>
            )}
            {rows.map((r) => (
              <tr key={r.productId} className="hover:bg-card-strong">
                <td className="py-2.5 font-bold text-main">{r.product}</td>
                <td className="py-2.5 text-right font-black text-amber-500">{formatCurrency(r.avg)}</td>
                <td className="py-2.5 text-right">{formatCurrency(r.low)}</td>
                <td className="py-2.5 text-right">{formatCurrency(r.high)}</td>
                <td className="py-2.5 text-right">
                  <span
                    className={`inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-xs font-black ${
                      r.change >= 0 ? "bg-emerald-500/10 text-emerald-600" : "bg-rose-500/10 text-rose-600"
                    }`}
                  >
                    {r.change >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                    {r.change >= 0 ? "+" : ""}{r.change}%
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="mt-3 text-xs text-muted">
        Giá cập nhật từ {summary.reduce((sum, r) => sum + (r.stores || 0), 0)} lượt cửa hàng đóng góp.
      </p>
    </GlassCard>
  );
}
