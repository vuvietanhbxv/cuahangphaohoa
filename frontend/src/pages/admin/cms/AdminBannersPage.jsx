import { useEffect, useState } from "react";
import { Plus, Pencil, Trash2, X, Eye, Upload } from "lucide-react";
import { api, getToken } from "../../../api/client.js";
import { GlassCard, Badge, TextInput, TextArea, PrimaryButton, SelectBox } from "../../../components/ui.jsx";
import { formatRelative } from "../../../lib/format.js";

const POSITION_OPTIONS = [
  { value: "home_hero",   label: "Trang chủ – Hero" },
  { value: "home_middle", label: "Trang chủ – Giữa trang" },
  { value: "price_page",  label: "Trang giá pháo hoa" },
  { value: "seller_page", label: "Trang người bán" },
  { value: "report_page", label: "Trang cảnh báo" },
];

const STATUS_OPTIONS = [
  { value: "draft",     label: "Bản nháp" },
  { value: "active",    label: "Đang chạy" },
  { value: "scheduled", label: "Đã lên lịch" },
  { value: "expired",   label: "Hết hạn" },
  { value: "disabled",  label: "Đã tắt" },
];

const STATUS_VARIANT = { active: "gold", draft: "neutral", scheduled: "warn", expired: "neutral", disabled: "neutral" };

const BASE_URL = import.meta.env.VITE_API_URL || "/api/v1";

async function uploadFile(file, usageType = "banner") {
  const fd = new FormData();
  fd.append("files", file);
  const res = await fetch(`${BASE_URL}/uploads?usage_type=${usageType}`, {
    method: "POST",
    headers: { Authorization: `Bearer ${getToken()}` },
    body: fd,
  });
  if (!res.ok) throw new Error("Upload thất bại");
  const data = await res.json();
  return data.items[0]?.url || "";
}

function ImageUploadField({ value, onChange, label }) {
  const [busy, setBusy] = useState(false);
  return (
    <div>
      <p className="mb-1 text-xs font-black uppercase tracking-wide text-amber-200/80">{label}</p>
      <div className="flex items-start gap-3">
        {value ? (
          <img src={value} alt="" className="h-20 w-32 rounded-lg object-cover ring-1 ring-white/10" />
        ) : (
          <div className="flex h-20 w-32 items-center justify-center rounded-lg border border-dashed border-white/20 bg-slate-950/60 text-slate-500 text-xs">
            Chưa có ảnh
          </div>
        )}
        <div className="flex flex-1 flex-col gap-2">
          <label className="cursor-pointer rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-bold text-slate-200 hover:bg-white/10">
            {busy ? "Đang upload..." : <span className="inline-flex items-center gap-1"><Upload className="h-3.5 w-3.5" /> Chọn ảnh</span>}
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={async (e) => {
                const f = e.target.files?.[0];
                if (!f) return;
                setBusy(true);
                try {
                  const url = await uploadFile(f);
                  onChange(url);
                } catch (err) {
                  alert(err.message);
                } finally {
                  setBusy(false);
                  e.target.value = "";
                }
              }}
            />
          </label>
          <input
            type="text"
            value={value || ""}
            onChange={(e) => onChange(e.target.value)}
            placeholder="hoặc dán URL..."
            className="rounded-xl border border-white/10 bg-slate-950/80 px-3 py-2 text-xs text-white outline-none focus:border-amber-300"
          />
        </div>
      </div>
    </div>
  );
}

export default function AdminBannersPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null); // null | "new" | banner object

  const load = () => {
    setLoading(true);
    api.get("/admin/banners", { auth: true }).then((d) => setItems(d.items || [])).finally(() => setLoading(false));
  };
  useEffect(() => { load(); }, []);

  const remove = async (b) => {
    if (!window.confirm(`Xoá banner "${b.title}"?`)) return;
    try {
      await api.del(`/admin/banners/${b.id}`, { auth: true });
      load();
    } catch (err) {
      alert(err.message);
    }
  };

  const toggleStatus = async (b, status) => {
    try {
      await api.patch(`/admin/banners/${b.id}`, { title: b.title, status }, { auth: true });
      load();
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div className="space-y-5">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black text-white md:text-3xl">Banner trang chủ</h1>
          <p className="mt-1 text-sm text-slate-400">Quản lý các banner hero, giữa trang. Chỉ banner status=active mới hiển thị public.</p>
        </div>
        <button
          onClick={() => setEditing("new")}
          className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-amber-300 to-orange-400 px-5 py-3 text-sm font-black text-slate-950 shadow-lg shadow-amber-500/20 hover:from-yellow-200 hover:to-amber-300"
        >
          <Plus className="h-4 w-4" /> Thêm banner
        </button>
      </header>

      <GlassCard className="overflow-hidden">
        {loading ? <p className="p-5 text-slate-400">Đang tải...</p>
          : items.length === 0 ? <p className="p-5 text-slate-400">Chưa có banner.</p>
          : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[900px] text-left text-sm">
                <thead className="border-b border-white/10 text-xs uppercase tracking-wide text-amber-300">
                  <tr>
                    <th className="px-4 py-3">Ảnh</th>
                    <th>Tiêu đề</th>
                    <th>Vị trí</th>
                    <th>Trạng thái</th>
                    <th>Lịch chạy</th>
                    <th>Order</th>
                    <th className="px-4 py-3 text-right">Hành động</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 text-slate-200">
                  {items.map((b) => (
                    <tr key={b.id} className="hover:bg-white/5">
                      <td className="px-4 py-3">
                        {b.desktopImageUrl ? (
                          <img src={b.desktopImageUrl} className="h-12 w-20 rounded-lg object-cover ring-1 ring-white/10" alt={b.title} />
                        ) : (
                          <div className="flex h-12 w-20 items-center justify-center rounded-lg bg-slate-800 text-xs text-slate-500">—</div>
                        )}
                      </td>
                      <td className="font-bold text-white">{b.title}</td>
                      <td className="text-xs text-slate-400">{b.position}</td>
                      <td><Badge variant={STATUS_VARIANT[b.status] || "neutral"}>{b.status}</Badge></td>
                      <td className="text-xs text-slate-400">
                        {b.startAt || b.endAt ? (
                          <>
                            {b.startAt && new Date(b.startAt).toLocaleDateString("vi-VN")}
                            {(b.startAt || b.endAt) && " → "}
                            {b.endAt && new Date(b.endAt).toLocaleDateString("vi-VN")}
                          </>
                        ) : "—"}
                      </td>
                      <td className="text-slate-500">{b.sortOrder}</td>
                      <td className="px-4 py-3 text-right">
                        <div className="inline-flex gap-2">
                          {b.status !== "active" && (
                            <button onClick={() => toggleStatus(b, "active")} className="rounded-lg bg-emerald-400/15 px-2 py-1.5 text-xs font-black text-emerald-200 hover:bg-emerald-400/25" title="Bật">
                              <Eye className="h-3.5 w-3.5" />
                            </button>
                          )}
                          <button onClick={() => setEditing(b)} className="rounded-lg bg-amber-300/15 px-2 py-1.5 text-xs font-black text-amber-200 hover:bg-amber-300/25">
                            <Pencil className="h-3.5 w-3.5" />
                          </button>
                          <button onClick={() => remove(b)} className="rounded-lg bg-rose-500/15 px-2 py-1.5 text-xs font-black text-rose-200 hover:bg-rose-500/25">
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

      {editing && <BannerEditor item={editing === "new" ? null : editing} onClose={() => setEditing(null)} onSaved={() => { setEditing(null); load(); }} />}
    </div>
  );
}

function BannerEditor({ item, onClose, onSaved }) {
  const [form, setForm] = useState(item || {
    title: "",
    subtitle: "",
    description: "",
    desktopImageUrl: "",
    mobileImageUrl: "",
    ctaPrimaryLabel: "",
    ctaPrimaryUrl: "",
    ctaSecondaryLabel: "",
    ctaSecondaryUrl: "",
    position: "home_hero",
    status: "draft",
    sortOrder: 0,
    startAt: "",
    endAt: "",
  });
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const set = (k, v) => setForm({ ...form, [k]: v });

  const save = async () => {
    setSaving(true);
    setError("");
    try {
      const body = { ...form };
      if (body.startAt && body.startAt.length === 10) body.startAt = body.startAt + "T00:00:00.000Z";
      if (body.endAt && body.endAt.length === 10) body.endAt = body.endAt + "T23:59:59.000Z";
      if (!body.startAt) delete body.startAt;
      if (!body.endAt) delete body.endAt;
      body.sortOrder = Number(body.sortOrder) || 0;

      if (item) {
        await api.patch(`/admin/banners/${item.id}`, body, { auth: true });
      } else {
        await api.post("/admin/banners", body, { auth: true });
      }
      onSaved();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={onClose}>
      <GlassCard className="max-h-[90vh] w-full max-w-5xl overflow-y-auto p-6" onClick={(e) => e.stopPropagation()}>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-black text-white">{item ? "Sửa banner" : "Thêm banner"}</h2>
          <button onClick={onClose} className="rounded-lg p-1 hover:bg-white/5"><X className="h-5 w-5" /></button>
        </div>

        <div className="grid gap-5 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="space-y-3">
            <TextInput label="Tiêu đề *" value={form.title} onChange={(e) => set("title", e.target.value)} required />
            <TextInput label="Tiêu đề phụ" value={form.subtitle} onChange={(e) => set("subtitle", e.target.value)} />
            <TextArea label="Mô tả" value={form.description} onChange={(e) => set("description", e.target.value)} rows={3} />

            <ImageUploadField label="Ảnh desktop" value={form.desktopImageUrl} onChange={(v) => set("desktopImageUrl", v)} />
            <ImageUploadField label="Ảnh mobile" value={form.mobileImageUrl} onChange={(v) => set("mobileImageUrl", v)} />

            <div className="grid grid-cols-2 gap-3">
              <TextInput label="CTA chính - nhãn" value={form.ctaPrimaryLabel} onChange={(e) => set("ctaPrimaryLabel", e.target.value)} placeholder="Kiểm tra ngay" />
              <TextInput label="CTA chính - URL" value={form.ctaPrimaryUrl} onChange={(e) => set("ctaPrimaryUrl", e.target.value)} placeholder="/lookup" />
              <TextInput label="CTA phụ - nhãn" value={form.ctaSecondaryLabel} onChange={(e) => set("ctaSecondaryLabel", e.target.value)} placeholder="Xem bảng giá" />
              <TextInput label="CTA phụ - URL" value={form.ctaSecondaryUrl} onChange={(e) => set("ctaSecondaryUrl", e.target.value)} placeholder="/market" />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <SelectBox label="Vị trí" value={form.position} onChange={(v) => set("position", v)} options={POSITION_OPTIONS} />
              <SelectBox label="Trạng thái" value={form.status} onChange={(v) => set("status", v)} options={STATUS_OPTIONS} />
              <TextInput label="Bắt đầu" type="date" value={form.startAt ? String(form.startAt).slice(0, 10) : ""} onChange={(e) => set("startAt", e.target.value)} />
              <TextInput label="Kết thúc" type="date" value={form.endAt ? String(form.endAt).slice(0, 10) : ""} onChange={(e) => set("endAt", e.target.value)} />
              <TextInput label="Thứ tự (sort)" type="number" value={form.sortOrder} onChange={(e) => set("sortOrder", e.target.value)} />
            </div>

            {error && <p className="rounded-xl bg-rose-500/10 px-3 py-2 text-sm text-rose-200">{error}</p>}
            <div className="flex gap-2 pt-2">
              <PrimaryButton onClick={save} disabled={saving}>{saving ? "Đang lưu..." : "Lưu banner"}</PrimaryButton>
              <button onClick={onClose} className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-bold text-slate-200 hover:bg-white/10">Huỷ</button>
            </div>
          </div>

          <aside>
            <p className="mb-2 text-xs font-black uppercase tracking-wide text-amber-300">Preview</p>
            <div className="overflow-hidden rounded-2xl border border-white/10 bg-[#060b1d] p-5">
              {form.desktopImageUrl && (
                <img src={form.desktopImageUrl} alt="" className="mb-3 h-32 w-full rounded-xl object-cover ring-1 ring-white/10" />
              )}
              <p className="text-2xl font-black text-white">{form.title || "Tiêu đề"}</p>
              {form.subtitle && <p className="mt-1 bg-gradient-to-r from-amber-200 via-yellow-300 to-orange-400 bg-clip-text text-lg font-black text-transparent">{form.subtitle}</p>}
              {form.description && <p className="mt-2 text-sm text-slate-300">{form.description}</p>}
              <div className="mt-4 flex flex-wrap gap-2">
                {form.ctaPrimaryLabel && <span className="rounded-xl bg-gradient-to-r from-amber-300 to-orange-400 px-4 py-2 text-xs font-black text-slate-950">{form.ctaPrimaryLabel}</span>}
                {form.ctaSecondaryLabel && <span className="rounded-xl border border-amber-300/30 bg-white/5 px-4 py-2 text-xs font-bold text-amber-100">{form.ctaSecondaryLabel}</span>}
              </div>
            </div>
          </aside>
        </div>
      </GlassCard>
    </div>
  );
}
