import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Eye, EyeOff, ShieldAlert, Pencil } from "lucide-react";
import { api } from "../../api/client.js";
import { GlassCard, Badge, TextInput } from "../../components/ui.jsx";
import { formatRelative } from "../../lib/format.js";
import { buildDetailUrl } from "../../lib/lookup.js";

export default function AdminBlacklistPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [busy, setBusy] = useState(null);
  const [filterType, setFilterType] = useState("");

  const load = () => {
    setLoading(true);
    api
      .get("/admin/blacklist", { params: { search: search || undefined }, auth: true })
      .then((d) => setItems(d.items || []))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    const t = setTimeout(load, 300);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  const filtered = filterType ? items.filter((i) => i.type === filterType) : items;

  const setRisk = async (item) => {
    const lvl = window.prompt("Mức rủi ro mới (low/medium/high):", item.risk_level || "medium");
    if (!lvl || !["low", "medium", "high"].includes(lvl)) return;
    setBusy(item.entity_id);
    try {
      await api.patch(`/admin/blacklist/${item.entity_id}`, { risk_level: lvl }, { auth: true });
      load();
    } catch (err) {
      alert(err.message || "Lỗi");
    } finally {
      setBusy(null);
    }
  };

  const toggleHide = async (item, hide) => {
    setBusy(item.entity_id);
    try {
      await api.patch(`/admin/blacklist/${item.entity_id}`, { hide }, { auth: true });
      load();
    } catch (err) {
      alert(err.message || "Lỗi");
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="space-y-5">
      <header>
        <h1 className="text-2xl font-black text-white md:text-3xl">Cảnh báo công khai</h1>
        <p className="mt-1 text-sm text-slate-400">Danh sách các đối tượng (số/tài khoản) đã có ≥1 báo cáo được xác minh — đang hiển thị ở trang public.</p>
      </header>

      <GlassCard className="p-4">
        <div className="flex flex-wrap items-end gap-3">
          <div className="min-w-[280px] flex-1">
            <TextInput label="Tìm số / tài khoản" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="0378..." />
          </div>
          <div>
            <p className="mb-1 text-xs uppercase tracking-wide text-amber-200/80">Loại</p>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="h-12 rounded-xl border border-white/10 bg-slate-950/70 px-3 text-sm font-bold text-white outline-none focus:border-amber-300"
            >
              <option value="">Tất cả</option>
              <option value="PHONE">Số điện thoại</option>
              <option value="BANK_ACCOUNT">Số tài khoản</option>
            </select>
          </div>
        </div>
      </GlassCard>

      <GlassCard className="overflow-hidden">
        {loading ? (
          <p className="p-5 text-slate-400">Đang tải...</p>
        ) : filtered.length === 0 ? (
          <p className="p-5 text-slate-400">Chưa có cảnh báo nào.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[800px] text-left text-sm">
              <thead className="border-b border-white/10 text-xs uppercase tracking-wide text-amber-300">
                <tr>
                  <th className="px-4 py-3">Đối tượng</th>
                  <th>Loại</th>
                  <th>Ngân hàng</th>
                  <th>Số báo cáo</th>
                  <th>Mức rủi ro</th>
                  <th>Cập nhật gần nhất</th>
                  <th className="px-4 py-3 text-right">Hành động</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-slate-200">
                {filtered.map((item) => (
                  <tr key={item.entity_id} className="hover:bg-white/5">
                    <td className="px-4 py-3 font-bold text-white">
                      <Link to={buildDetailUrl(item.type, item.normalized_value)} className="hover:text-amber-300">
                        {item.display_value}
                      </Link>
                    </td>
                    <td>
                      <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${item.type === "PHONE" ? "bg-sky-400/15 text-sky-200" : "bg-emerald-400/15 text-emerald-200"}`}>
                        {item.type}
                      </span>
                    </td>
                    <td className="text-slate-400">{item.bank_name || "—"}</td>
                    <td className="font-black text-amber-300">{item.report_count}</td>
                    <td><Badge variant={item.risk_level === "high" ? "danger" : item.risk_level === "medium" ? "warn" : "neutral"}>{item.risk_level}</Badge></td>
                    <td className="text-slate-400">{formatRelative(item.last_reported_at)}</td>
                    <td className="px-4 py-3 text-right">
                      <div className="inline-flex gap-2">
                        <button
                          disabled={busy === item.entity_id}
                          onClick={() => setRisk(item)}
                          className="inline-flex items-center gap-1 rounded-lg bg-amber-300/15 px-3 py-1.5 text-xs font-black text-amber-200 hover:bg-amber-300/25 disabled:opacity-40"
                          title="Sửa mức rủi ro"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                        <button
                          disabled={busy === item.entity_id}
                          onClick={() => toggleHide(item, true)}
                          className="inline-flex items-center gap-1 rounded-lg bg-rose-500/15 px-3 py-1.5 text-xs font-black text-rose-200 hover:bg-rose-500/25 disabled:opacity-40"
                          title="Ẩn khỏi public"
                        >
                          <EyeOff className="h-3.5 w-3.5" />
                        </button>
                        <button
                          disabled={busy === item.entity_id}
                          onClick={() => toggleHide(item, false)}
                          className="inline-flex items-center gap-1 rounded-lg bg-emerald-400/15 px-3 py-1.5 text-xs font-black text-emerald-200 hover:bg-emerald-400/25 disabled:opacity-40"
                          title="Hiện lại"
                        >
                          <Eye className="h-3.5 w-3.5" />
                        </button>
                      </div>
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
