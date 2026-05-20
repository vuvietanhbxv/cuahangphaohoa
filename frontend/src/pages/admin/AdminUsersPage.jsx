import { useEffect, useState } from "react";
import { Lock, Unlock, Shield } from "lucide-react";
import { api } from "../../api/client.js";
import { GlassCard, Badge, TextInput } from "../../components/ui.jsx";
import { formatRelative } from "../../lib/format.js";
import { useAuth } from "../../context/AuthContext.jsx";

const ROLE_LABEL = {
  USER: "Người dùng",
  MODERATOR: "Moderator",
  ADMIN: "Admin",
  SUPER_ADMIN: "Super Admin",
  PRICE_EDITOR: "Price Editor",
  SELLER_MANAGER: "Seller Manager",
};
const ROLES = Object.keys(ROLE_LABEL);

export default function AdminUsersPage() {
  const { user: me } = useAuth();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [busy, setBusy] = useState(null);

  const load = () => {
    setLoading(true);
    api
      .get("/admin/users", { params: { search: search || undefined, role: roleFilter || undefined }, auth: true })
      .then((d) => setItems(d.items || []))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    const t = setTimeout(load, 300);
    return () => clearTimeout(t);
    // eslint-disable-next-line
  }, [search, roleFilter]);

  const toggleLock = async (u) => {
    if (u.id === me?.id) {
      alert("Không thể tự khoá tài khoản của mình");
      return;
    }
    const lock = !u.isLocked;
    const reason = lock ? window.prompt("Lý do khoá:") || "" : "";
    setBusy(u.id);
    try {
      await api.patch(`/admin/users/${u.id}`, { isLocked: lock, lockReason: reason }, { auth: true });
      load();
    } catch (err) {
      alert(err.message);
    } finally {
      setBusy(null);
    }
  };

  const changeRole = async (u) => {
    const r = window.prompt(`Role mới (${ROLES.join(", ")}):`, u.role);
    if (!r || !ROLES.includes(r)) return;
    setBusy(u.id);
    try {
      await api.patch(`/admin/users/${u.id}`, { role: r }, { auth: true });
      load();
    } catch (err) {
      alert(err.message);
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="space-y-5">
      <header>
        <h1 className="text-2xl font-black text-white md:text-3xl">Người dùng</h1>
        <p className="mt-1 text-sm text-slate-400">Quản lý tài khoản, phân quyền, khóa user spam.</p>
      </header>

      <GlassCard className="p-4">
        <div className="flex flex-wrap items-end gap-3">
          <div className="min-w-[280px] flex-1">
            <TextInput label="Tìm email / tên" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="@ hoặc tên hiển thị" />
          </div>
          <div>
            <p className="mb-1 text-xs uppercase tracking-wide text-amber-200/80">Vai trò</p>
            <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)} className="h-12 rounded-xl border border-white/10 bg-slate-950/70 px-3 text-sm font-bold text-white outline-none focus:border-amber-300">
              <option value="">Tất cả</option>
              {ROLES.map((r) => <option key={r} value={r}>{ROLE_LABEL[r]}</option>)}
            </select>
          </div>
        </div>
      </GlassCard>

      <GlassCard className="overflow-hidden">
        {loading ? <p className="p-5 text-slate-400">Đang tải...</p>
          : items.length === 0 ? <p className="p-5 text-slate-400">Không có user.</p>
          : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[900px] text-left text-sm">
                <thead className="border-b border-white/10 text-xs uppercase tracking-wide text-amber-300">
                  <tr>
                    <th className="px-4 py-3">ID</th>
                    <th>Tên / Email</th>
                    <th>Vai trò</th>
                    <th>Trust</th>
                    <th>Báo cáo (đã duyệt / tổng)</th>
                    <th>Trạng thái</th>
                    <th>Tạo lúc</th>
                    <th className="px-4 py-3 text-right">Hành động</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 text-slate-200">
                  {items.map((u) => (
                    <tr key={u.id} className="hover:bg-white/5">
                      <td className="px-4 py-3 text-slate-500">{u.id}</td>
                      <td>
                        <p className="font-bold text-white">{u.displayName}</p>
                        <p className="text-xs text-slate-500">{u.email}</p>
                      </td>
                      <td><Badge variant={u.role === "ADMIN" || u.role === "SUPER_ADMIN" ? "gold" : "neutral"}>{ROLE_LABEL[u.role] || u.role}</Badge></td>
                      <td className="font-black text-amber-300">{u.trustScore}</td>
                      <td>
                        <span className="text-emerald-300">{u.reportsVerified}</span>
                        <span className="text-slate-500"> / </span>
                        <span>{u.reportsTotal}</span>
                      </td>
                      <td>{u.isLocked ? <Badge variant="danger">Bị khoá</Badge> : <Badge variant="safe">Hoạt động</Badge>}</td>
                      <td className="text-slate-400">{formatRelative(u.createdAt)}</td>
                      <td className="px-4 py-3 text-right">
                        <div className="inline-flex gap-2">
                          <button disabled={busy === u.id} onClick={() => changeRole(u)} className="rounded-lg bg-amber-300/15 px-3 py-1.5 text-xs font-black text-amber-200 hover:bg-amber-300/25 disabled:opacity-40" title="Đổi role">
                            <Shield className="h-3.5 w-3.5" />
                          </button>
                          <button
                            disabled={busy === u.id || u.id === me?.id}
                            onClick={() => toggleLock(u)}
                            className={`rounded-lg px-3 py-1.5 text-xs font-black disabled:opacity-40 ${u.isLocked ? "bg-emerald-400/15 text-emerald-200 hover:bg-emerald-400/25" : "bg-rose-500/15 text-rose-200 hover:bg-rose-500/25"}`}
                            title={u.isLocked ? "Mở khoá" : "Khoá"}
                          >
                            {u.isLocked ? <Unlock className="h-3.5 w-3.5" /> : <Lock className="h-3.5 w-3.5" />}
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
