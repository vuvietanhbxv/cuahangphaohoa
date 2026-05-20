import { useEffect, useState } from "react";
import { Trash2, ExternalLink, Filter } from "lucide-react";
import { api } from "../../../api/client.js";
import { GlassCard } from "../../../components/ui.jsx";
import { formatRelative } from "../../../lib/format.js";

const USAGE_OPTIONS = [
  { value: "",                  label: "Tất cả" },
  { value: "logo",              label: "Logo" },
  { value: "banner",            label: "Banner" },
  { value: "seller_avatar",     label: "Avatar shop" },
  { value: "seller_cover",      label: "Bìa shop" },
  { value: "seller_featured",   label: "Ảnh nổi bật shop" },
  { value: "product_image",     label: "Ảnh sản phẩm" },
  { value: "report_evidence",   label: "Bằng chứng (admin only)" },
  { value: "public_media",      label: "Public media" },
];

function bytes(n) {
  if (!n) return "—";
  if (n < 1024) return n + " B";
  if (n < 1024 * 1024) return (n / 1024).toFixed(1) + " KB";
  return (n / 1024 / 1024).toFixed(2) + " MB";
}

export default function AdminMediaPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [usageType, setUsageType] = useState("");

  const load = () => {
    setLoading(true);
    api
      .get("/admin/media", { params: { usage_type: usageType || undefined }, auth: true })
      .then((d) => setItems(d.items || []))
      .finally(() => setLoading(false));
  };
  useEffect(() => { load(); /* eslint-disable-next-line */ }, [usageType]);

  const remove = async (m) => {
    if (!window.confirm("Xoá media này khỏi DB? (file vật lý vẫn còn trên ổ đĩa)")) return;
    try {
      await api.del(`/admin/media/${m.id}`, { auth: true });
      load();
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div className="space-y-5">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black text-white md:text-3xl">Thư viện media</h1>
          <p className="mt-1 text-sm text-slate-400">Mọi file đã upload trong hệ thống. Bằng chứng báo cáo được bảo vệ riêng.</p>
        </div>
        <div>
          <p className="mb-1 text-xs uppercase tracking-wide text-amber-200/80"><Filter className="mr-1 inline h-3 w-3" /> Loại media</p>
          <select
            value={usageType}
            onChange={(e) => setUsageType(e.target.value)}
            className="h-10 rounded-xl border border-white/10 bg-slate-950/70 px-3 text-sm font-bold text-white outline-none focus:border-amber-300"
          >
            {USAGE_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>
      </header>

      <GlassCard className="p-4">
        {loading ? <p className="text-slate-400">Đang tải...</p>
          : items.length === 0 ? <p className="text-slate-400">Chưa có media.</p>
          : (
            <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
              {items.map((m) => {
                const isImage = m.mime_type?.startsWith("image/");
                const isPrivate = m.visibility !== "public";
                return (
                  <div key={m.id} className="group relative overflow-hidden rounded-2xl border border-white/10 bg-slate-950/60">
                    <div className="aspect-square bg-slate-900">
                      {isImage && !isPrivate ? (
                        <img src={m.file_url} alt={m.file_name} className="h-full w-full object-cover" />
                      ) : (
                        <div className="flex h-full items-center justify-center text-xs text-slate-500">
                          {isPrivate ? "🔒 Bằng chứng riêng" : (m.mime_type || "file")}
                        </div>
                      )}
                    </div>
                    <div className="p-2 text-xs">
                      <p className="truncate font-bold text-white" title={m.file_name}>{m.file_name || "—"}</p>
                      <p className="text-slate-500">{bytes(m.file_size)} · {m.usage_type}</p>
                      <p className="text-slate-600">{formatRelative(m.created_at)}</p>
                    </div>
                    <div className="absolute right-1 top-1 flex gap-1 opacity-0 transition group-hover:opacity-100">
                      <a href={m.file_url} target="_blank" rel="noreferrer" className="rounded-lg bg-slate-900/90 p-1.5 text-amber-300 hover:bg-slate-800">
                        <ExternalLink className="h-3.5 w-3.5" />
                      </a>
                      <button onClick={() => remove(m)} className="rounded-lg bg-rose-500/80 p-1.5 text-white hover:bg-rose-500">
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
      </GlassCard>
    </div>
  );
}
