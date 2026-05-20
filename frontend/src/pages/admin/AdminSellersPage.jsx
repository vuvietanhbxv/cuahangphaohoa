import { useEffect, useState } from "react";
import { CheckCircle2, XCircle } from "lucide-react";
import { api } from "../../api/client.js";
import { GlassCard, Badge } from "../../components/ui.jsx";
import { formatRelative } from "../../lib/format.js";

const STATUS_OPTIONS = [
  { value: "PENDING", label: "Chờ xác minh" },
  { value: "APPROVED", label: "Đã xác minh" },
  { value: "REJECTED", label: "Bị từ chối" },
];

export default function AdminSellersPage() {
  const [items, setItems] = useState([]);
  const [status, setStatus] = useState("PENDING");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(null);

  const load = () => {
    setLoading(true);
    api
      .get("/admin/queue", { params: { type: "sellers", status }, auth: true })
      .then((d) => setItems(d.items || []))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [status]);

  const handle = async (item, action) => {
    let body = { status: action };
    if (action === "REJECTED") body.reject_reason = window.prompt("Lý do từ chối:") || "";
    setBusy(item.id);
    try {
      await api.patch(`/admin/sellers/${item.id}`, body, { auth: true });
      load();
    } catch (err) {
      alert(err.message);
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="space-y-5">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black text-white md:text-3xl">Người bán uy tín</h1>
          <p className="mt-1 text-sm text-slate-400">Duyệt hồ sơ người bán do cộng đồng đề xuất.</p>
        </div>
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="h-10 rounded-xl border border-white/10 bg-slate-950/70 px-3 text-sm font-bold text-white outline-none focus:border-amber-300"
        >
          {STATUS_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      </header>

      <GlassCard className="p-4">
        {loading ? (
          <p className="text-slate-400">Đang tải...</p>
        ) : items.length === 0 ? (
          <p className="text-slate-400">Không có hồ sơ nào.</p>
        ) : (
          <div className="space-y-3">
            {items.map((s) => (
              <div key={s.id} className="rounded-2xl border border-white/10 bg-slate-950/60 p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="text-lg font-black text-white">{s.name}</p>
                      <Badge variant={s.status === "APPROVED" ? "gold" : s.status === "REJECTED" ? "neutral" : "warn"}>{s.status}</Badge>
                    </div>
                    <p className="mt-1 text-sm text-slate-300">{s.phone} {s.bankAccount && `· ${s.bankAccount}`} {s.bankName && `(${s.bankName})`}</p>
                    <p className="text-sm text-slate-400">{s.location} · {s.ordersCount || 0} giao dịch · ⭐ {Number(s.ratingAvg || 0).toFixed(1)}</p>
                    {s.description && <p className="mt-1 text-sm text-slate-400">{s.description}</p>}
                  </div>
                  <p className="text-xs text-slate-500">
                    {s.submittedBy?.displayName || "?"} · {formatRelative(s.createdAt)}
                  </p>
                </div>
                {s.status === "PENDING" && (
                  <div className="mt-3 flex gap-2">
                    <button disabled={busy === s.id} onClick={() => handle(s, "APPROVED")} className="inline-flex items-center gap-1 rounded-xl bg-emerald-400/20 px-4 py-2 text-sm font-black text-emerald-200 hover:bg-emerald-400/30 disabled:opacity-50">
                      <CheckCircle2 className="h-4 w-4" /> Xác minh
                    </button>
                    <button disabled={busy === s.id} onClick={() => handle(s, "REJECTED")} className="inline-flex items-center gap-1 rounded-xl bg-rose-500/20 px-4 py-2 text-sm font-black text-rose-200 hover:bg-rose-500/30 disabled:opacity-50">
                      <XCircle className="h-4 w-4" /> Từ chối
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </GlassCard>
    </div>
  );
}
