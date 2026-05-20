import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Filter, Search, Eye } from "lucide-react";
import { api } from "../../api/client.js";
import { GlassCard, Badge, TextInput } from "../../components/ui.jsx";
import { formatRelative, formatCurrency } from "../../lib/format.js";

const STATUS_OPTIONS = [
  { value: "PENDING", label: "Chờ duyệt" },
  { value: "REVIEWING", label: "Đang kiểm tra" },
  { value: "NEED_MORE_INFO", label: "Cần bổ sung" },
  { value: "VERIFIED", label: "Đã xác minh" },
  { value: "REJECTED", label: "Từ chối" },
  { value: "DUPLICATE", label: "Trùng" },
];

const STATUS_VARIANT = {
  PENDING: "warn",
  REVIEWING: "neutral",
  VERIFIED: "danger",
  REJECTED: "neutral",
  DUPLICATE: "neutral",
  NEED_MORE_INFO: "warn",
};

const STATUS_LABEL = {
  PENDING: "Chờ duyệt",
  REVIEWING: "Đang kiểm tra",
  VERIFIED: "Đã xác minh",
  REJECTED: "Từ chối",
  DUPLICATE: "Trùng",
  NEED_MORE_INFO: "Cần bổ sung",
};

export default function AdminReportsPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState("PENDING");
  const [reasons, setReasons] = useState([]);
  const [reasonFilter, setReasonFilter] = useState("");
  const [riskFilter, setRiskFilter] = useState("");
  const [search, setSearch] = useState("");

  useEffect(() => {
    api.get("/lookup/reasons").then((d) => setReasons(d.items || []));
  }, []);

  useEffect(() => {
    setLoading(true);
    api
      .get("/admin/queue", { params: { type: "reports", status }, auth: true })
      .then((data) => setItems(data.items || []))
      .finally(() => setLoading(false));
  }, [status]);

  const filtered = items.filter((r) => {
    if (reasonFilter && r.reasonCode !== reasonFilter) return false;
    if (riskFilter && r.riskLevelInput !== riskFilter) return false;
    if (search) {
      const s = search.toLowerCase();
      const hay = `${r.entity?.displayValue || ""} ${r.entity?.normalizedValue || ""} ${r.sellerShopName || ""} ${r.region || ""}`.toLowerCase();
      if (!hay.includes(s)) return false;
    }
    return true;
  });

  return (
    <div className="space-y-5">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black text-white md:text-3xl">Báo cáo lừa đảo</h1>
          <p className="mt-1 text-sm text-slate-400">Danh sách báo cáo theo trạng thái. Bấm "Xem" để mở chi tiết và xử lý.</p>
        </div>
      </header>

      <GlassCard className="p-4">
        <div className="flex flex-wrap items-end gap-3">
          <div>
            <p className="mb-1 text-xs uppercase tracking-wide text-amber-200/80">Trạng thái</p>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="h-10 rounded-xl border border-white/10 bg-slate-950/70 px-3 text-sm font-bold text-white outline-none focus:border-amber-300"
            >
              {STATUS_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>
          <div>
            <p className="mb-1 text-xs uppercase tracking-wide text-amber-200/80">Lý do</p>
            <select
              value={reasonFilter}
              onChange={(e) => setReasonFilter(e.target.value)}
              className="h-10 rounded-xl border border-white/10 bg-slate-950/70 px-3 text-sm font-bold text-white outline-none focus:border-amber-300"
            >
              <option value="">Tất cả</option>
              {reasons.map((r) => <option key={r.code} value={r.code}>{r.label}</option>)}
            </select>
          </div>
          <div>
            <p className="mb-1 text-xs uppercase tracking-wide text-amber-200/80">Mức rủi ro</p>
            <select
              value={riskFilter}
              onChange={(e) => setRiskFilter(e.target.value)}
              className="h-10 rounded-xl border border-white/10 bg-slate-950/70 px-3 text-sm font-bold text-white outline-none focus:border-amber-300"
            >
              <option value="">Tất cả</option>
              <option value="low">Thấp</option>
              <option value="medium">Trung bình</option>
              <option value="high">Cao</option>
            </select>
          </div>
          <div className="min-w-[200px] flex-1">
            <TextInput label="Tìm số/shop/khu vực" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="0378..." />
          </div>
        </div>
      </GlassCard>

      <GlassCard className="overflow-hidden">
        {loading ? (
          <p className="p-5 text-slate-400">Đang tải...</p>
        ) : filtered.length === 0 ? (
          <p className="p-5 text-slate-400">Không có báo cáo phù hợp.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-left text-sm">
              <thead className="border-b border-white/10 text-xs uppercase tracking-wide text-amber-300">
                <tr>
                  <th className="px-4 py-3">Mã</th>
                  <th>Ngày gửi</th>
                  <th>Người gửi</th>
                  <th>Đối tượng</th>
                  <th>Lý do</th>
                  <th>Số tiền</th>
                  <th>Bằng chứng</th>
                  <th>Rủi ro</th>
                  <th>Trạng thái</th>
                  <th className="px-4 py-3 text-right">Hành động</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-slate-200">
                {filtered.map((r) => {
                  let evCount = 0;
                  try {
                    const arr = typeof r.evidenceUrls === "string" ? JSON.parse(r.evidenceUrls) : r.evidenceUrls;
                    evCount = Array.isArray(arr) ? arr.length : 0;
                  } catch { /* */ }
                  return (
                    <tr key={r.id} className="hover:bg-white/5">
                      <td className="px-4 py-3 font-mono text-xs text-amber-300">#{r.id}</td>
                      <td>{formatRelative(r.createdAt)}</td>
                      <td className="text-slate-300">{r.submittedBy?.displayName || "?"}</td>
                      <td className="font-bold text-white">{r.entity?.displayValue}</td>
                      <td className="text-slate-300">{r.reason_label}</td>
                      <td className="text-amber-300">{r.amount ? formatCurrency(r.amount) : "—"}</td>
                      <td>{evCount > 0 ? <span className="rounded bg-emerald-400/10 px-2 py-0.5 text-emerald-200">{evCount}</span> : <span className="text-slate-600">—</span>}</td>
                      <td><Badge variant={r.riskLevelInput === "high" ? "danger" : r.riskLevelInput === "medium" ? "warn" : "neutral"}>{r.riskLevelInput}</Badge></td>
                      <td><Badge variant={STATUS_VARIANT[r.status]}>{STATUS_LABEL[r.status]}</Badge></td>
                      <td className="px-4 py-3 text-right">
                        <Link
                          to={`/admin/reports/${r.id}`}
                          className="inline-flex items-center gap-1 rounded-lg bg-amber-300/15 px-3 py-1.5 text-xs font-black text-amber-200 hover:bg-amber-300/25"
                        >
                          <Eye className="h-3.5 w-3.5" /> Xem
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </GlassCard>
    </div>
  );
}
