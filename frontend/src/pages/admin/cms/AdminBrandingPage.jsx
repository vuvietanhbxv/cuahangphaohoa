import { useEffect, useState } from "react";
import { Save, Sparkles, ShieldCheck, Upload, X } from "lucide-react";
import { api, getToken } from "../../../api/client.js";
import { GlassCard, PrimaryButton, TextInput, TextArea } from "../../../components/ui.jsx";

const FIELDS = [
  { key: "site_name",       label: "Tên website",        type: "string", group: "brand" },
  { key: "site_slogan",     label: "Slogan",             type: "string", group: "brand" },
  { key: "primary_color",   label: "Màu chủ đạo",        type: "color",  group: "brand" },
  { key: "secondary_color", label: "Màu phụ",            type: "color",  group: "brand" },
  { key: "danger_color",    label: "Màu cảnh báo",       type: "color",  group: "brand" },
  { key: "safe_color",      label: "Màu an toàn",        type: "color",  group: "brand" },
  { key: "bg_color",        label: "Màu nền chính",      type: "color",  group: "brand" },
  { key: "logo_url",        label: "Logo URL",           type: "image",  group: "brand" },
  { key: "favicon_url",     label: "Favicon URL",        type: "image",  group: "brand" },
  { key: "hero_eyebrow",    label: "Hero eyebrow text",  type: "string", group: "hero" },
  { key: "hero_bg_url",     label: "Ảnh nền banner hero",type: "image",  group: "hero" },
  { key: "hero_bg_overlay", label: "Độ mờ overlay (0..1)",type: "string",group: "hero" },
  { key: "hotline",         label: "Hotline",            type: "string", group: "footer" },
  { key: "support_email",   label: "Email hỗ trợ",       type: "string", group: "footer" },
  { key: "address",         label: "Địa chỉ",            type: "string", group: "footer" },
];

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

function ImageField({ value, onChange, usageType, label }) {
  const [busy, setBusy] = useState(false);
  return (
    <div>
      <p className="mb-1 text-xs font-black uppercase tracking-wide text-amber-200/80">{label}</p>
      <div className="flex items-center gap-3">
        {value ? (
          <div className="relative">
            <img src={value} alt={label} className="h-16 w-16 rounded-lg object-cover ring-1 ring-white/10" />
            <button
              type="button"
              onClick={() => onChange("")}
              className="absolute -right-1 -top-1 rounded-full bg-rose-500 p-0.5 text-white"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        ) : (
          <div className="flex h-16 w-16 items-center justify-center rounded-lg border border-dashed border-white/20 bg-slate-950/60 text-slate-500">
            <Sparkles className="h-5 w-5" />
          </div>
        )}
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
                const url = await uploadFile(f, usageType);
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
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="hoặc dán URL..."
          className="min-w-0 flex-1 rounded-xl border border-white/10 bg-slate-950/80 px-3 py-2 text-sm text-white outline-none focus:border-amber-300"
        />
      </div>
    </div>
  );
}

export default function AdminBrandingPage() {
  const [values, setValues] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const data = await api.get("/admin/site-settings", { auth: true });
      const map = {};
      for (const i of data.items || []) map[i.key] = i.value;
      setValues(map);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { load(); }, []);

  const set = (key, val) => setValues((v) => ({ ...v, [key]: val }));

  const save = async () => {
    setSaving(true);
    try {
      const items = FIELDS.map((f) => ({
        key: f.key,
        value: values[f.key] ?? "",
        type: f.type,
        group: f.group,
      }));
      await api.patch("/admin/site-settings", { items }, { auth: true });
      setSavedAt(new Date());
    } catch (err) {
      alert(err.message);
    } finally {
      setSaving(false);
    }
  };

  const primary = values.primary_color || "#fbbf24";
  const secondary = values.secondary_color || "#fb7185";
  const bg = values.bg_color || "#060b1d";
  const name = values.site_name || "TinCậy360";
  const slogan = values.site_slogan || "An tâm giao dịch pháo hoa";
  const logo = values.logo_url;

  return (
    <div className="space-y-5">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black text-white md:text-3xl">Cài đặt thương hiệu</h1>
          <p className="mt-1 text-sm text-slate-400">Chỉnh tên, slogan, màu sắc, logo của toàn bộ website. Lưu xong sẽ áp dụng cho trang public.</p>
        </div>
        <div className="flex items-center gap-2">
          {savedAt && <p className="text-xs text-emerald-300">Đã lưu lúc {savedAt.toLocaleTimeString("vi-VN")}</p>}
          <PrimaryButton onClick={save} disabled={loading || saving}>
            <Save className="h-4 w-4" /> {saving ? "Đang lưu..." : "Lưu thay đổi"}
          </PrimaryButton>
        </div>
      </header>

      <div className="grid gap-5 lg:grid-cols-2">
        <GlassCard className="p-5">
          <p className="mb-4 text-xs font-black uppercase tracking-wide text-amber-300">Form chỉnh sửa</p>
          {loading ? <p className="text-slate-400">Đang tải...</p> : (
            <div className="space-y-4">
              {FIELDS.filter((f) => f.group === "brand").map((f) => (
                f.type === "image" ? (
                  <ImageField
                    key={f.key}
                    label={f.label}
                    value={values[f.key] || ""}
                    onChange={(v) => set(f.key, v)}
                    usageType={f.key === "logo_url" ? "logo" : "public_media"}
                  />
                ) : f.type === "color" ? (
                  <div key={f.key}>
                    <p className="mb-1 text-xs font-black uppercase tracking-wide text-amber-200/80">{f.label}</p>
                    <div className="flex gap-2">
                      <input type="color" value={values[f.key] || "#000000"} onChange={(e) => set(f.key, e.target.value)} className="h-12 w-16 cursor-pointer rounded-xl border border-white/10 bg-slate-950 p-1" />
                      <input
                        type="text"
                        value={values[f.key] || ""}
                        onChange={(e) => set(f.key, e.target.value)}
                        className="flex-1 rounded-xl border border-white/10 bg-slate-950/80 px-3 py-2 text-sm text-white outline-none focus:border-amber-300"
                      />
                    </div>
                  </div>
                ) : (
                  <TextInput key={f.key} label={f.label} value={values[f.key] || ""} onChange={(e) => set(f.key, e.target.value)} />
                )
              ))}

              <div className="border-t border-white/10 pt-4">
                <p className="mb-2 text-xs font-black uppercase tracking-wide text-amber-300">Hero & Footer</p>
                {FIELDS.filter((f) => f.group !== "brand").map((f) => (
                  <div key={f.key} className="mt-3">
                    {f.type === "image" ? (
                      <ImageField
                        label={f.label}
                        value={values[f.key] || ""}
                        onChange={(v) => set(f.key, v)}
                        usageType="banner"
                      />
                    ) : (
                      <TextInput label={f.label} value={values[f.key] || ""} onChange={(e) => set(f.key, e.target.value)} />
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </GlassCard>

        <div className="space-y-4">
          <p className="text-xs font-black uppercase tracking-wide text-amber-300">Preview trực tiếp</p>

          {/* Preview header */}
          <div className="rounded-2xl border border-white/10 p-5" style={{ background: bg }}>
            <div className="flex items-center gap-3">
              {logo ? (
                <img src={logo} alt="logo" className="h-12 w-12 rounded-xl object-cover" />
              ) : (
                <div className="flex h-12 w-12 items-center justify-center rounded-xl text-slate-950 shadow-lg" style={{ background: `linear-gradient(to bottom right, ${primary}, ${secondary})` }}>
                  <ShieldCheck className="h-7 w-7" />
                </div>
              )}
              <div>
                <p className="text-xl font-black text-white">{name}</p>
                <p className="text-xs text-slate-300">{slogan}</p>
              </div>
            </div>
          </div>

          {/* Preview button */}
          <div className="rounded-2xl border border-white/10 p-5" style={{ background: bg }}>
            <p className="text-xs uppercase text-slate-400">Button preview</p>
            <div className="mt-3 flex flex-wrap gap-3">
              <button className="rounded-2xl px-5 py-3 text-sm font-black text-slate-950 shadow-lg" style={{ background: `linear-gradient(to right, ${primary}, ${secondary})` }}>
                Nút chính
              </button>
              <button className="rounded-2xl border px-5 py-3 text-sm font-bold" style={{ borderColor: primary + "55", color: primary, background: "rgba(255,255,255,0.05)" }}>
                Nút phụ
              </button>
              <span className="inline-flex items-center rounded-full px-3 py-1 text-xs font-black uppercase tracking-wide" style={{ background: (values.danger_color || "#f43f5e") + "22", color: values.danger_color || "#f43f5e", boxShadow: `inset 0 0 0 1px ${values.danger_color || "#f43f5e"}55` }}>
                Cảnh báo
              </span>
              <span className="inline-flex items-center rounded-full px-3 py-1 text-xs font-black uppercase tracking-wide" style={{ background: (values.safe_color || "#34d399") + "22", color: values.safe_color || "#34d399", boxShadow: `inset 0 0 0 1px ${values.safe_color || "#34d399"}55` }}>
                An toàn
              </span>
            </div>
          </div>

          {/* Preview card */}
          <div className="rounded-2xl border border-white/10 p-5" style={{ background: bg }}>
            <p className="text-xs uppercase text-slate-400">Card preview</p>
            <div className="mt-3 rounded-2xl border border-white/10 bg-white/[0.06] p-4 backdrop-blur">
              <p className="text-sm font-bold" style={{ color: primary }}>{values.hero_eyebrow || "Cộng đồng xác thực · Dữ liệu cập nhật liên tục"}</p>
              <h3 className="mt-1 text-lg font-black text-white">Kiểm tra độ tin cậy người bán</h3>
              <p className="mt-1 text-xs text-slate-300">{slogan}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
