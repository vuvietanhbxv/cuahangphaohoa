import { useEffect, useState } from "react";
import { api } from "../../api/client.js";
import { GlassCard, TextInput } from "../../components/ui.jsx";
import { formatRelative } from "../../lib/format.js";

const TARGET_TYPES = ["FraudReport", "Seller", "PriceSubmission", "User", "Product", "LookupEntity"];

export default function AdminActivityPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [targetType, setTargetType] = useState("");
  const [action, setAction] = useState("");

  const load = () => {
    setLoading(true);
    api
      .get("/admin/activity", { params: { target_type: targetType || undefined, action: action || undefined }, auth: true })
      .then((d) => setItems(d.items || []))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    const t = setTimeout(load, 300);
    return () => clearTimeout(t);
    // eslint-disable-next-line
  }, [targetType, action]);

  return (
    <div className="space-y-5">
      <header>
        <h1 className="text-2xl font-black text-white md:text-3xl">Lịch sử thao tác</h1>
        <p className="mt-1 text-sm text-slate-400">Mọi hành động của admin được lưu lại để audit.</p>
      </header>

      <GlassCard className="p-4">
        <div className="flex flex-wrap items-end gap-3">
          <div>
            <p className="mb-1 text-xs uppercase tracking-wide text-amber-200/80">Loại đối tượng</p>
            <select value={targetType} onChange={(e) => setTargetType(e.target.value)} className="h-12 rounded-xl border border-white/10 bg-slate-950/70 px-3 text-sm font-bold text-white outline-none focus:border-amber-300">
              <option value="">Tất cả</option>
              {TARGET_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div className="min-w-[240px] flex-1">
            <TextInput label="Tìm action (VD: REPORT_VERIFIED)" value={action} onChange={(e) => setAction(e.target.value)} />
          </div>
        </div>
      </GlassCard>

      <GlassCard className="overflow-hidden">
        {loading ? <p className="p-5 text-slate-400">Đang tải...</p>
          : items.length === 0 ? <p className="p-5 text-slate-400">Chưa có log.</p>
          : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[900px] text-left text-sm">
                <thead className="border-b border-white/10 text-xs uppercase tracking-wide text-amber-300">
                  <tr>
                    <th className="px-4 py-3">Thời gian</th>
                    <th>Admin</th>
                    <th>Action</th>
                    <th>Đối tượng</th>
                    <th>Thay đổi</th>
                    <th>IP</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 text-slate-200">
                  {items.map((i) => (
                    <tr key={i.id} className="hover:bg-white/5">
                      <td className="px-4 py-3 text-xs text-slate-400" title={new Date(i.created_at).toLocaleString("vi-VN")}>
                        {formatRelative(i.created_at)}
                      </td>
                      <td className="font-bold text-white">{i.admin || "?"}</td>
                      <td><span className="rounded-full bg-amber-400/15 px-2 py-0.5 text-xs font-black text-amber-200">{i.action}</span></td>
                      <td>{i.target_type}{i.target_id ? <span className="text-slate-500"> #{i.target_id}</span> : null}</td>
                      <td className="max-w-[300px] truncate text-xs text-slate-400" title={JSON.stringify({ old: i.old_value, new: i.new_value }, null, 2)}>
                        {i.new_value ? Object.entries(i.new_value).filter(([,v])=>v!=null).map(([k,v])=>`${k}=${typeof v==="string"?v:JSON.stringify(v)}`).join(" · ") : "—"}
                        {i.note && <span className="ml-1 text-amber-300">[{i.note}]</span>}
                      </td>
                      <td className="font-mono text-xs text-slate-500">{i.ip_address || "—"}</td>
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
