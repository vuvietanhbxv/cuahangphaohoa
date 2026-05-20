import { useEffect, useState } from "react";
import { CheckCircle2, XCircle, X, Save, Upload } from "lucide-react";
import { api, getToken } from "../../../api/client.js";
import { GlassCard, Badge, TextInput, TextArea, PrimaryButton, SelectBox } from "../../../components/ui.jsx";

const STATUS_OPTIONS = [
  { value: "PENDING",  label: "Chờ duyệt" },
  { value: "APPROVED", label: "Đã duyệt" },
  { value: "REJECTED", label: "Bị từ chối" },
  { value: "DISABLED", label: "Đã tắt" },
];

const STATUS_VARIANT = { PENDING: "warn", APPROVED: "gold", REJECTED: "neutral", DISABLED: "neutral" };

const BASE_URL = import.meta.env.VITE_API_URL || "/api/v1";

async function uploadFile(file, usageType) {
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

function ImgField({ value, onChange, label, usageType }) {
  const [busy, setBusy] = useState(false);
  return (
    <div>
      <p className="mb-1 text-xs font-black uppercase tracking-wide text-amber-200/80">{label}</p>
      <div className="flex gap-2">
        {value ? <img src={value} alt="" className="h-14 w-20 rounded-lg object-cover ring-1 ring-white/10" />
              : <div className="flex h-14 w-20 items-center justify-center rounded-lg border border-dashed border-white/20 bg-slate-950/60 text-xs text-slate-500">—</div>}
        <label className="cursor-pointer rounded-xl border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-bold text-slate-200 hover:bg-white/10">
          {busy ? "..." : <span className="inline-flex items-center gap-1"><Upload className="h-3.5 w-3.5" /> Chọn ảnh</span>}
          <input type="file" accept="image/*" className="hidden" onChange={async (e) => {
            const f = e.target.files?.[0];
            if (!f) return;
            setBusy(true);
            try { onChange(await uploadFile(f, usageType)); } catch (err) { alert(err.message); }
            finally { setBusy(false); e.target.value = ""; }
          }} />
        </label>
        <input type="text" value={value || ""} onChange={(e) => onChange(e.target.value)} placeholder="URL..." className="min-w-0 flex-1 rounded-xl border border-white/10 bg-slate-950/80 px-2 py-1 text-xs text-white outline-none focus:border-amber-300" />
      </div>
    </div>
  );
}

export default function AdminSellerBrandingPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState("PENDING");
  const [editing, setEditing] = useState(null);

  const load = () => {
    setLoading(true);
    api.get("/admin/sellers-branding", { params: { status }, auth: true }).then((d) => setItems(d.items || [])).finally(() => setLoading(false));
  };
  useEffect(() => { load(); /* eslint-disable-next-line */ }, [status]);

  return (
    <div className="space-y-5">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black text-white md:text-3xl">Hồ sơ cửa hàng</h1>
          <p className="mt-1 text-sm text-slate-400">Duyệt thiết kế (cover / avatar / slogan / màu) của các shop trước khi public.</p>
        </div>
        <select value={status} onChange={(e) => setStatus(e.target.value)} className="h-10 rounded-xl border border-white/10 bg-slate-950/70 px-3 text-sm font-bold text-white outline-none focus:border-amber-300">
          {STATUS_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      </header>

      <GlassCard className="p-4">
        {loading ? <p className="text-slate-400">Đang tải...</p>
          : items.length === 0 ? <p className="text-slate-400">Không có shop nào.</p>
          : (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {items.map((s) => (
                <div key={s.id} className="overflow-hidden rounded-2xl border border-white/10 bg-slate-950/60">
                  <div className="relative h-24" style={{ background: s.coverUrl ? `url(${s.coverUrl}) center/cover` : `linear-gradient(135deg, ${s.brandColor || "#fbbf24"}, ${s.brandColor ? "#000" : "#fb7185"})` }}>
                    <div className="absolute -bottom-6 left-3 h-14 w-14 overflow-hidden rounded-2xl border-2 border-slate-950 bg-slate-800">
                      {s.thumbnailUrl ? <img src={s.thumbnailUrl} alt="" className="h-full w-full object-cover" /> : <div className="flex h-full w-full items-center justify-center text-lg font-black text-amber-300">{s.name?.[0]}</div>}
                    </div>
                  </div>
                  <div className="px-4 pb-3 pt-8">
                    <div className="flex items-center gap-2">
                      <p className="font-black text-white">{s.name}</p>
                      <Badge variant={STATUS_VARIANT[s.brandingStatus]}>{s.brandingStatus}</Badge>
                    </div>
                    {s.slogan && <p className="text-xs text-slate-300">{s.slogan}</p>}
                    <p className="text-xs text-slate-500">{s.location} · ⭐ {Number(s.ratingAvg || 0).toFixed(1)} · {s.ordersCount} GD</p>
                    {s.brandingRejectReason && <p className="mt-1 rounded bg-rose-500/10 px-2 py-1 text-xs text-rose-200">Từ chối: {s.brandingRejectReason}</p>}
                  </div>
                  <div className="border-t border-white/10 p-2">
                    <button onClick={() => setEditing(s)} className="w-full rounded-lg bg-amber-300/15 px-3 py-2 text-xs font-black text-amber-200 hover:bg-amber-300/25">
                      Xem & chỉnh
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
      </GlassCard>

      {editing && <BrandingEditor seller={editing} onClose={() => setEditing(null)} onSaved={() => { setEditing(null); load(); }} />}
    </div>
  );
}

function BrandingEditor({ seller, onClose, onSaved }) {
  const [form, setForm] = useState({
    thumbnailUrl: seller.thumbnailUrl || "",
    coverUrl: seller.coverUrl || "",
    mobileCoverUrl: seller.mobileCoverUrl || "",
    featuredImageUrl: seller.featuredImageUrl || "",
    brandColor: seller.brandColor || "#fbbf24",
    slogan: seller.slogan || "",
    brandingStatus: seller.brandingStatus,
    brandingRejectReason: seller.brandingRejectReason || "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const set = (k, v) => setForm({ ...form, [k]: v });

  const doSave = async (overrideStatus) => {
    setSaving(true);
    setError("");
    try {
      const body = { ...form };
      if (overrideStatus) body.brandingStatus = overrideStatus;
      await api.patch(`/admin/sellers/${seller.id}/branding`, body, { auth: true });
      onSaved();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={onClose}>
      <GlassCard className="max-h-[90vh] w-full max-w-4xl overflow-y-auto p-6" onClick={(e) => e.stopPropagation()}>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-black text-white">Hồ sơ shop: {seller.name}</h2>
          <button onClick={onClose} className="rounded-lg p-1 hover:bg-white/5"><X className="h-5 w-5" /></button>
        </div>

        <div className="grid gap-4 lg:grid-cols-[1fr_1fr]">
          <div className="space-y-3">
            <ImgField label="Avatar (1:1)" value={form.thumbnailUrl} onChange={(v) => set("thumbnailUrl", v)} usageType="seller_avatar" />
            <ImgField label="Ảnh bìa desktop (16:4)" value={form.coverUrl} onChange={(v) => set("coverUrl", v)} usageType="seller_cover" />
            <ImgField label="Ảnh bìa mobile" value={form.mobileCoverUrl} onChange={(v) => set("mobileCoverUrl", v)} usageType="seller_cover" />
            <ImgField label="Ảnh nổi bật" value={form.featuredImageUrl} onChange={(v) => set("featuredImageUrl", v)} usageType="seller_featured" />

            <div>
              <p className="mb-1 text-xs font-black uppercase tracking-wide text-amber-200/80">Màu thương hiệu</p>
              <div className="flex gap-2">
                <input type="color" value={form.brandColor || "#fbbf24"} onChange={(e) => set("brandColor", e.target.value)} className="h-10 w-14 rounded-lg border border-white/10 bg-slate-950 p-1" />
                <input type="text" value={form.brandColor || ""} onChange={(e) => set("brandColor", e.target.value)} className="flex-1 rounded-xl border border-white/10 bg-slate-950/80 px-3 py-1.5 text-sm text-white outline-none focus:border-amber-300" />
              </div>
            </div>
            <TextInput label="Slogan" value={form.slogan} onChange={(e) => set("slogan", e.target.value)} placeholder="VD: Uy tín – Giá tốt – Giao nhanh" />

            <SelectBox label="Trạng thái" value={form.brandingStatus} onChange={(v) => set("brandingStatus", v)} options={STATUS_OPTIONS} />
            {form.brandingStatus === "REJECTED" && (
              <TextArea label="Lý do từ chối" value={form.brandingRejectReason} onChange={(e) => set("brandingRejectReason", e.target.value)} rows={2} />
            )}

            {error && <p className="rounded-xl bg-rose-500/10 px-3 py-2 text-sm text-rose-200">{error}</p>}

            <div className="flex flex-wrap gap-2 pt-2">
              <PrimaryButton onClick={() => doSave()} disabled={saving}><Save className="h-4 w-4" /> Lưu</PrimaryButton>
              <button onClick={() => doSave("APPROVED")} disabled={saving} className="inline-flex items-center gap-1 rounded-xl bg-emerald-400/20 px-4 py-2 text-sm font-black text-emerald-200 hover:bg-emerald-400/30 disabled:opacity-50"><CheckCircle2 className="h-4 w-4" /> Duyệt</button>
              <button onClick={() => doSave("REJECTED")} disabled={saving} className="inline-flex items-center gap-1 rounded-xl bg-rose-500/20 px-4 py-2 text-sm font-black text-rose-200 hover:bg-rose-500/30 disabled:opacity-50"><XCircle className="h-4 w-4" /> Từ chối</button>
            </div>
          </div>

          <div>
            <p className="mb-2 text-xs font-black uppercase tracking-wide text-amber-300">Preview hồ sơ shop</p>
            <div className="overflow-hidden rounded-2xl border border-white/10 bg-[#060b1d]">
              <div className="relative h-40" style={{ background: form.coverUrl ? `url(${form.coverUrl}) center/cover` : `linear-gradient(135deg, ${form.brandColor || "#fbbf24"}, #fb7185)` }}>
                <div className="absolute -bottom-8 left-4 h-20 w-20 overflow-hidden rounded-2xl border-4 border-[#060b1d] bg-slate-800">
                  {form.thumbnailUrl ? <img src={form.thumbnailUrl} alt="" className="h-full w-full object-cover" /> : <div className="flex h-full w-full items-center justify-center text-3xl font-black" style={{ color: form.brandColor || "#fbbf24" }}>{seller.name?.[0]}</div>}
                </div>
              </div>
              <div className="px-4 pb-4 pt-10">
                <p className="text-xl font-black text-white">{seller.name}</p>
                {form.slogan && <p className="text-sm text-slate-300">{form.slogan}</p>}
                <p className="mt-2 text-xs text-slate-400">{seller.location} · ⭐ {Number(seller.ratingAvg || 0).toFixed(1)} · {seller.ordersCount} giao dịch</p>
                {form.featuredImageUrl && <img src={form.featuredImageUrl} alt="" className="mt-3 h-32 w-full rounded-lg object-cover ring-1 ring-white/10" />}
              </div>
            </div>
          </div>
        </div>
      </GlassCard>
    </div>
  );
}
