import { useEffect, useState } from "react";
import { CheckCircle2, XCircle } from "lucide-react";
import { api, REGION_LABEL } from "../../api/client.js";
import { GlassCard, Badge } from "../../components/ui.jsx";
import { formatCurrency, formatRelative } from "../../lib/format.js";

const STATUS_OPTIONS = [
  { value: "PENDING", label: "Chờ duyệt" },
  { value: "APPROVED", label: "Đã duyệt" },
  { value: "REJECTED", label: "Từ chối" },
];

export default function AdminPricesPage() {
  const [items, setItems] = useState([]);
  const [status, setStatus] = useState("PENDING");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(null);

  const load = () => {
    setLoading(true);
    api
      .get("/admin/queue", { params: { type: "prices", status }, auth: true })
      .then((d) => setItems(d.items || []))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [status]);

  const handle = async (item, action) => {
    let body = { status: action };
    if (action === "REJECTED") body.reject_reason = window.prompt("Lý do từ chối:") || "";
    setBusy(item.id);
    try {
      await api.patch(`/admin/prices/${item.id}`, body, { auth: true });
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
          <h1 className="text-2xl font-black text-white md:text-3xl">Bảng giá pháo hoa</h1>
          <p className="mt-1 text-sm text-slate-400">Duyệt giá do cửa hàng / cộng đồng đăng. Khi APPROVED, hệ thống tự recompute giá trung bình ngày.</p>
        </div>
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="h-10 rounded-xl border border-white/10 bg-slate-950/70 px-3 text-sm font-bold text-white outline-none focus:border-amber-300"
        >
          {STATUS_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      </header>

      <GlassCard className="overflow-hidden">
        {loading ? <p className="p-5 text-slate-400">Đang tải...</p>
          : items.length === 0 ? <p className="p-5 text-slate-400">Không có giá nào.</p>
          : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[800px] text-left text-sm">
                <thead className="border-b border-white/10 text-xs uppercase tracking-wide text-amber-300">
                  <tr>
                    <th className="px-4 py-3">Sản phẩm</th>
                    <th>Khu vực</th>
                    <th>Giá</th>
                    <th>Cửa hàng</th>
                    <th>Ngày niêm yết</th>
                    <th>Người gửi</th>
                    <th>Trạng thái</th>
                    <th className="px-4 py-3 text-right">Hành động</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 text-slate-200">
                  {items.map((p) => (
                    <tr key={p.id} className="hover:bg-white/5">
                      <td className="px-4 py-3 font-bold text-white">{p.product?.name}</td>
                      <td>Miền {REGION_LABEL[p.region]}</td>
                      <td className="font-black text-amber-300">{formatCurrency(p.price)}</td>
                      <td>
                        {p.storeName}
                        {p.storeUrl && <a href={p.storeUrl} target="_blank" rel="noreferrer" className="ml-1 text-amber-300 underline">link</a>}
                      </td>
                      <td>{new Date(p.priceDate).toLocaleDateString("vi-VN")}</td>
                      <td className="text-slate-400">{p.submittedBy?.displayName}</td>
                      <td><Badge variant={p.status === "APPROVED" ? "gold" : p.status === "REJECTED" ? "neutral" : "warn"}>{p.status}</Badge></td>
                      <td className="px-4 py-3 text-right">
                        {p.status === "PENDING" && (
                          <div className="inline-flex gap-2">
                            <button disabled={busy === p.id} onClick={() => handle(p, "APPROVED")} className="rounded-lg bg-emerald-400/20 px-3 py-1.5 text-xs font-black text-emerald-200 hover:bg-emerald-400/30 disabled:opacity-50">Duyệt</button>
                            <button disabled={busy === p.id} onClick={() => handle(p, "REJECTED")} className="rounded-lg bg-rose-500/20 px-3 py-1.5 text-xs font-black text-rose-200 hover:bg-rose-500/30 disabled:opacity-50">Từ chối</button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
      </GlassCard>
    </div>
  );
}
