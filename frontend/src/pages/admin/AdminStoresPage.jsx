import { useEffect, useState } from "react";
import { Plus, Pencil, Trash2, X, CheckCircle2, XCircle, MapPin, Pause, Play } from "lucide-react";
import { api } from "../../api/client.js";
import { GlassCard, Badge, TextInput, TextArea, PrimaryButton, SelectBox } from "../../components/ui.jsx";
import { formatRelative } from "../../lib/format.js";

const REGION_OPTIONS = [
  { value: "BAC",   label: "Miền Bắc" },
  { value: "TRUNG", label: "Miền Trung" },
  { value: "NAM",   label: "Miền Nam" },
];

const VERIFICATION_OPTIONS = [
  { value: "", label: "Tất cả" },
  { value: "PENDING",      label: "Chờ xác minh" },
  { value: "UNDER_REVIEW", label: "Đang kiểm tra" },
  { value: "VERIFIED",     label: "Đã xác minh" },
  { value: "REJECTED",     label: "Từ chối" },
];

const STATUS_OPTIONS = [
  { value: "ACTIVE",    label: "Hoạt động" },
  { value: "HIDDEN",    label: "Ẩn" },
  { value: "SUSPENDED", label: "Tạm khoá" },
];

function slugify(s) {
  return String(s || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/đ/g, "d")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export default function AdminStoresPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ verification_status: "", search: "" });
  const [editing, setEditing] = useState(null); // null | "new" | storeObj
  const [busyId, setBusyId] = useState(null);

  const load = () => {
    setLoading(true);
    api
      .get("/admin/stores", {
        params: { verification_status: filters.verification_status || undefined, search: filters.search || undefined },
        auth: true,
      })
      .then((d) => setItems(d.items || []))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    const t = setTimeout(load, 300);
    return () => clearTimeout(t);
    // eslint-disable-next-line
  }, [filters.verification_status, filters.search]);

  const action = async (store, type) => {
    setBusyId(store.id);
    try {
      if (type === "verify") await api.post(`/admin/stores/${store.id}/verify`, {}, { auth: true });
      if (type === "reject") {
        const reason = window.prompt("Lý do từ chối:") || "";
        await api.post(`/admin/stores/${store.id}/reject`, { reject_reason: reason }, { auth: true });
      }
      if (type === "suspend") await api.post(`/admin/stores/${store.id}/suspend`, {}, { auth: true });
      if (type === "activate") await api.post(`/admin/stores/${store.id}/activate`, {}, { auth: true });
      if (type === "delete") {
        if (!window.confirm(`Xoá cửa hàng "${store.name}"?`)) return;
        await api.del(`/admin/stores/${store.id}`, { auth: true });
      }
      load();
    } catch (err) {
      alert(err.message);
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="space-y-5">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black text-main md:text-3xl">Hệ thống cửa hàng</h1>
          <p className="mt-1 text-sm text-muted">Quản lý cửa hàng pháo hoa: xác minh giấy phép, thêm/sửa chi nhánh, gắn cảnh báo.</p>
        </div>
        <button
          onClick={() => setEditing("new")}
          className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-amber-300 to-orange-400 px-5 py-3 text-sm font-black text-slate-950 shadow-lg shadow-amber-500/20"
        >
          <Plus className="h-4 w-4" /> Thêm cửa hàng
        </button>
      </header>

      <GlassCard className="p-4">
        <div className="flex flex-wrap items-end gap-3">
          <div className="min-w-[280px] flex-1">
            <TextInput
              label="Tìm tên / số điện thoại"
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              placeholder="VD: An Phát hoặc 0988..."
            />
          </div>
          <div>
            <p className="mb-1 text-xs font-black uppercase tracking-wide text-amber-600 dark:text-amber-200/80">Trạng thái xác minh</p>
            <select
              value={filters.verification_status}
              onChange={(e) => setFilters({ ...filters, verification_status: e.target.value })}
              className="theme-input h-12 px-3 text-sm font-bold"
            >
              {VERIFICATION_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>
        </div>
      </GlassCard>

      <GlassCard className="overflow-hidden">
        {loading ? <p className="p-5 text-muted">Đang tải...</p>
          : items.length === 0 ? <p className="p-5 text-muted">Không có cửa hàng.</p>
          : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[900px] text-left text-sm">
                <thead className="border-b border-line text-xs uppercase tracking-wide text-amber-600 dark:text-amber-300">
                  <tr>
                    <th className="px-4 py-3">Cửa hàng</th>
                    <th>Khu vực</th>
                    <th>SĐT</th>
                    <th>Chi nhánh / SP</th>
                    <th>Xác minh</th>
                    <th>Trạng thái</th>
                    <th>Tạo lúc</th>
                    <th className="px-4 py-3 text-right">Hành động</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line text-soft">
                  {items.map((s) => (
                    <tr key={s.id} className="hover:bg-card-strong">
                      <td className="px-4 py-3">
                        <p className="font-bold text-main">{s.name}</p>
                        <p className="text-xs text-muted">{s.slug}</p>
                      </td>
                      <td className="text-xs">
                        {s.locations?.[0] ? (
                          <>
                            <p>{s.locations[0].province}</p>
                            {s.locations[0].district && <p className="text-muted">{s.locations[0].district}</p>}
                          </>
                        ) : "—"}
                      </td>
                      <td className="font-mono text-xs">{s.phone || "—"}</td>
                      <td className="text-xs">
                        <p>{s._count?.locations || 0} chi nhánh</p>
                        <p className="text-muted">{s._count?.storeProducts || 0} sản phẩm</p>
                      </td>
                      <td>
                        <Badge variant={s.verificationStatus === "VERIFIED" ? "gold" : s.verificationStatus === "REJECTED" ? "neutral" : "warn"}>
                          {s.verificationStatus}
                        </Badge>
                      </td>
                      <td>
                        <Badge variant={s.status === "ACTIVE" ? "safe" : "neutral"}>{s.status}</Badge>
                      </td>
                      <td className="text-xs text-muted">{formatRelative(s.createdAt)}</td>
                      <td className="px-4 py-3 text-right">
                        <div className="inline-flex flex-wrap gap-1">
                          {s.verificationStatus !== "VERIFIED" && (
                            <button disabled={busyId === s.id} onClick={() => action(s, "verify")} className="rounded-lg bg-emerald-500/15 px-2 py-1 text-xs font-black text-emerald-500 hover:bg-emerald-500/25 disabled:opacity-40" title="Xác minh">
                              <CheckCircle2 className="h-3.5 w-3.5" />
                            </button>
                          )}
                          {s.verificationStatus !== "REJECTED" && (
                            <button disabled={busyId === s.id} onClick={() => action(s, "reject")} className="rounded-lg bg-rose-500/15 px-2 py-1 text-xs font-black text-rose-500 hover:bg-rose-500/25 disabled:opacity-40" title="Từ chối">
                              <XCircle className="h-3.5 w-3.5" />
                            </button>
                          )}
                          {s.status === "ACTIVE" ? (
                            <button disabled={busyId === s.id} onClick={() => action(s, "suspend")} className="rounded-lg bg-amber-500/15 px-2 py-1 text-xs font-black text-amber-500 hover:bg-amber-500/25 disabled:opacity-40" title="Tạm khoá">
                              <Pause className="h-3.5 w-3.5" />
                            </button>
                          ) : (
                            <button disabled={busyId === s.id} onClick={() => action(s, "activate")} className="rounded-lg bg-emerald-500/15 px-2 py-1 text-xs font-black text-emerald-500 hover:bg-emerald-500/25 disabled:opacity-40" title="Kích hoạt">
                              <Play className="h-3.5 w-3.5" />
                            </button>
                          )}
                          <button onClick={() => setEditing(s)} className="rounded-lg bg-sky-500/15 px-2 py-1 text-xs font-black text-sky-500 hover:bg-sky-500/25" title="Sửa">
                            <Pencil className="h-3.5 w-3.5" />
                          </button>
                          <button disabled={busyId === s.id} onClick={() => action(s, "delete")} className="rounded-lg bg-rose-500/15 px-2 py-1 text-xs font-black text-rose-500 hover:bg-rose-500/25 disabled:opacity-40" title="Xoá">
                            <Trash2 className="h-3.5 w-3.5" />
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

      {editing && <StoreEditor item={editing === "new" ? null : editing} onClose={() => setEditing(null)} onSaved={() => { setEditing(null); load(); }} />}
    </div>
  );
}

function StoreEditor({ item, onClose, onSaved }) {
  const [form, setForm] = useState(item ? {
    name: item.name || "", slug: item.slug || "", description: item.description || "",
    phone: item.phone || "", bankAccount: item.bankAccount || "", bankName: item.bankName || "",
    bankOwnerName: item.bankOwnerName || "", email: item.email || "", website: item.website || "",
    openingHours: item.openingHours || "", brandColor: item.brandColor || "#fbbf24",
    verificationStatus: item.verificationStatus || "PENDING", status: item.status || "ACTIVE",
  } : {
    name: "", slug: "", description: "", phone: "", bankAccount: "", bankName: "",
    bankOwnerName: "", email: "", website: "", openingHours: "", brandColor: "#fbbf24",
    verificationStatus: "PENDING", status: "ACTIVE",
  });
  const [branches, setBranches] = useState(item?.locations || []);
  const [newBranch, setNewBranch] = useState({ region: "BAC", province: "", district: "", address: "", isMainBranch: false });
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const set = (k, v) => setForm({ ...form, [k]: v });

  const save = async () => {
    setSaving(true); setError("");
    try {
      let storeId = item?.id;
      if (item) {
        await api.patch(`/admin/stores/${item.id}`, form, { auth: true });
      } else {
        const created = await api.post("/admin/stores", form, { auth: true });
        storeId = created.id;
      }
      // Lưu chi nhánh mới (nếu tạo store mới hoặc thêm thêm)
      for (const b of branches.filter((x) => !x.id)) {
        await api.post(`/admin/stores/${storeId}/locations`, {
          branchName: b.branchName || null,
          region: b.region, province: b.province, district: b.district || null,
          address: b.address, latitude: b.latitude || null, longitude: b.longitude || null,
          phone: b.phone || null, isMainBranch: !!b.isMainBranch,
        }, { auth: true });
      }
      onSaved();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const addBranch = () => {
    if (!newBranch.province || !newBranch.address) {
      alert("Cần tỉnh và địa chỉ");
      return;
    }
    setBranches([...branches, { ...newBranch }]);
    setNewBranch({ region: "BAC", province: "", district: "", address: "", isMainBranch: false });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={onClose}>
      <GlassCard className="max-h-[90vh] w-full max-w-3xl overflow-y-auto p-6" onClick={(e) => e.stopPropagation()}>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-black text-main">{item ? "Sửa cửa hàng" : "Thêm cửa hàng"}</h2>
          <button onClick={onClose} className="rounded-lg p-1 hover:bg-card-strong"><X className="h-5 w-5" /></button>
        </div>

        <div className="space-y-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <TextInput label="Tên cửa hàng *" value={form.name} onChange={(e) => set("name", e.target.value)} required onBlur={() => !form.slug && set("slug", slugify(form.name))} />
            <TextInput label="Slug *" value={form.slug} onChange={(e) => set("slug", e.target.value)} required />
          </div>
          <TextArea label="Mô tả" value={form.description} onChange={(e) => set("description", e.target.value)} rows={2} />
          <div className="grid gap-3 sm:grid-cols-2">
            <TextInput label="Số điện thoại" value={form.phone} onChange={(e) => set("phone", e.target.value)} />
            <TextInput label="Email" value={form.email} onChange={(e) => set("email", e.target.value)} />
            <TextInput label="Số tài khoản" value={form.bankAccount} onChange={(e) => set("bankAccount", e.target.value)} />
            <TextInput label="Ngân hàng" value={form.bankName} onChange={(e) => set("bankName", e.target.value)} />
            <TextInput label="Tên chủ tài khoản" value={form.bankOwnerName} onChange={(e) => set("bankOwnerName", e.target.value)} />
            <TextInput label="Giờ mở cửa" value={form.openingHours} onChange={(e) => set("openingHours", e.target.value)} placeholder="08:00-21:00" />
            <TextInput label="Website" value={form.website} onChange={(e) => set("website", e.target.value)} />
            <TextInput label="Brand color" type="color" value={form.brandColor} onChange={(e) => set("brandColor", e.target.value)} />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <SelectBox label="Trạng thái xác minh" value={form.verificationStatus} onChange={(v) => set("verificationStatus", v)}
              options={[
                { value: "PENDING", label: "Chờ xác minh" },
                { value: "UNDER_REVIEW", label: "Đang kiểm tra" },
                { value: "VERIFIED", label: "Đã xác minh" },
                { value: "REJECTED", label: "Từ chối" },
              ]} />
            <SelectBox label="Trạng thái hoạt động" value={form.status} onChange={(v) => set("status", v)} options={STATUS_OPTIONS} />
          </div>

          {/* Chi nhánh */}
          <div className="rounded-2xl border border-line p-3">
            <p className="text-xs font-black uppercase tracking-wide text-amber-500">Chi nhánh ({branches.length})</p>
            <ul className="mt-2 space-y-2">
              {branches.map((b, idx) => (
                <li key={b.id || `new-${idx}`} className="rounded-xl bg-card-strong px-3 py-2 text-sm">
                  <p className="font-bold text-main">
                    {b.branchName || "Chi nhánh chính"}
                    {b.isMainBranch && <span className="ml-2 text-[10px] text-amber-500">CHÍNH</span>}
                  </p>
                  <p className="text-xs text-soft">{b.address}</p>
                  <p className="text-xs text-muted">{b.region} · {b.province} {b.district && `· ${b.district}`}</p>
                  {!b.id && (
                    <button onClick={() => setBranches(branches.filter((_, i) => i !== idx))} className="mt-1 text-xs text-rose-500 hover:underline">Bỏ</button>
                  )}
                </li>
              ))}
            </ul>
            <div className="mt-3 grid gap-2 rounded-xl border border-dashed border-line p-3 sm:grid-cols-2">
              <p className="col-span-2 text-xs text-muted">Thêm chi nhánh mới:</p>
              <SelectBox label="Miền" value={newBranch.region} onChange={(v) => setNewBranch({ ...newBranch, region: v })} options={REGION_OPTIONS} />
              <TextInput label="Tỉnh / Thành phố" value={newBranch.province} onChange={(e) => setNewBranch({ ...newBranch, province: e.target.value })} placeholder="Hà Nội" />
              <TextInput label="Quận / Huyện" value={newBranch.district} onChange={(e) => setNewBranch({ ...newBranch, district: e.target.value })} placeholder="Cầu Giấy" />
              <TextInput label="Địa chỉ chi tiết" value={newBranch.address} onChange={(e) => setNewBranch({ ...newBranch, address: e.target.value })} placeholder="123 Xuân Thuỷ" />
              <label className="col-span-2 inline-flex cursor-pointer items-center gap-2 text-sm text-soft">
                <input type="checkbox" checked={newBranch.isMainBranch} onChange={(e) => setNewBranch({ ...newBranch, isMainBranch: e.target.checked })} className="h-4 w-4 accent-amber-400" />
                Chi nhánh chính
              </label>
              <button type="button" onClick={addBranch} className="col-span-2 rounded-xl bg-amber-500/15 px-3 py-2 text-xs font-black text-amber-500 hover:bg-amber-500/25">
                <Plus className="mr-1 inline h-3.5 w-3.5" /> Thêm chi nhánh vào hồ sơ
              </button>
            </div>
          </div>

          {error && <p className="rounded-xl bg-rose-500/10 px-3 py-2 text-sm text-rose-200">{error}</p>}
          <div className="flex gap-2 pt-2">
            <PrimaryButton onClick={save} disabled={saving}>{saving ? "Đang lưu..." : "Lưu cửa hàng"}</PrimaryButton>
            <button onClick={onClose} className="rounded-xl border border-line bg-card-strong px-4 py-2 text-sm font-bold text-soft hover:text-amber-500">Huỷ</button>
          </div>
        </div>
      </GlassCard>
    </div>
  );
}
