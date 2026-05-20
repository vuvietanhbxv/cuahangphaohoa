import { useEffect, useState } from "react";
import { Plus, Pencil, Trash2, X } from "lucide-react";
import { api } from "../../api/client.js";
import { GlassCard, TextInput, TextArea, PrimaryButton } from "../../components/ui.jsx";

function slugify(s) {
  return (s || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/đ/g, "d")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export default function AdminProductsPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null); // null | "new" | productObj
  const [form, setForm] = useState({ name: "", slug: "", description: "", imageUrl: "" });
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const load = () => {
    setLoading(true);
    api.get("/admin/products", { auth: true }).then((d) => setItems(d.items || [])).finally(() => setLoading(false));
  };
  useEffect(() => { load(); }, []);

  const openCreate = () => {
    setEditing("new");
    setForm({ name: "", slug: "", description: "", imageUrl: "" });
    setError("");
  };
  const openEdit = (p) => {
    setEditing(p);
    setForm({ name: p.name, slug: p.slug, description: p.description || "", imageUrl: p.imageUrl || "" });
    setError("");
  };
  const close = () => setEditing(null);

  const save = async (e) => {
    e.preventDefault();
    setError("");
    setSaving(true);
    try {
      if (editing === "new") {
        await api.post("/admin/products", form, { auth: true });
      } else {
        await api.patch(`/admin/products/${editing.id}`, form, { auth: true });
      }
      close();
      load();
    } catch (err) {
      setError(err.message || "Lỗi");
    } finally {
      setSaving(false);
    }
  };

  const remove = async (p) => {
    if (!window.confirm(`Xoá sản phẩm "${p.name}"?`)) return;
    try {
      await api.del(`/admin/products/${p.id}`, { auth: true });
      load();
    } catch (err) {
      alert(err.message || "Lỗi");
    }
  };

  return (
    <div className="space-y-5">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black text-white md:text-3xl">Sản phẩm pháo hoa</h1>
          <p className="mt-1 text-sm text-slate-400">Quản lý danh mục sản phẩm để dùng cho bảng giá.</p>
        </div>
        <button
          onClick={openCreate}
          className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-amber-300 to-orange-400 px-5 py-3 text-sm font-black text-slate-950 shadow-lg shadow-amber-500/20 hover:from-yellow-200 hover:to-amber-300"
        >
          <Plus className="h-4 w-4" /> Thêm sản phẩm
        </button>
      </header>

      <GlassCard className="overflow-hidden">
        {loading ? <p className="p-5 text-slate-400">Đang tải...</p>
          : items.length === 0 ? <p className="p-5 text-slate-400">Chưa có sản phẩm.</p>
          : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px] text-left text-sm">
                <thead className="border-b border-white/10 text-xs uppercase tracking-wide text-amber-300">
                  <tr>
                    <th className="px-4 py-3">ID</th>
                    <th>Tên</th>
                    <th>Slug</th>
                    <th>Mô tả</th>
                    <th className="px-4 py-3 text-right">Hành động</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 text-slate-200">
                  {items.map((p) => (
                    <tr key={p.id} className="hover:bg-white/5">
                      <td className="px-4 py-3 text-slate-500">{p.id}</td>
                      <td className="font-bold text-white">{p.name}</td>
                      <td className="font-mono text-xs text-amber-300">{p.slug}</td>
                      <td className="max-w-[300px] truncate text-slate-400">{p.description || "—"}</td>
                      <td className="px-4 py-3 text-right">
                        <div className="inline-flex gap-2">
                          <button onClick={() => openEdit(p)} className="rounded-lg bg-amber-300/15 px-3 py-1.5 text-xs font-black text-amber-200 hover:bg-amber-300/25">
                            <Pencil className="h-3.5 w-3.5" />
                          </button>
                          <button onClick={() => remove(p)} className="rounded-lg bg-rose-500/15 px-3 py-1.5 text-xs font-black text-rose-200 hover:bg-rose-500/25">
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

      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={close}>
          <GlassCard className="w-full max-w-lg p-6" onClick={(e) => e.stopPropagation()}>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-black text-white">{editing === "new" ? "Thêm sản phẩm" : "Sửa sản phẩm"}</h2>
              <button onClick={close} className="rounded-lg p-1 hover:bg-white/5"><X className="h-5 w-5" /></button>
            </div>
            <form onSubmit={save} className="space-y-3">
              <TextInput
                label="Tên sản phẩm"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value, slug: editing === "new" ? slugify(e.target.value) : form.slug })}
                required
              />
              <TextInput label="Slug (URL-friendly)" value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} required />
              <TextArea label="Mô tả" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} />
              <TextInput label="Image URL" value={form.imageUrl} onChange={(e) => setForm({ ...form, imageUrl: e.target.value })} />
              {error && <p className="rounded-xl bg-rose-500/10 px-3 py-2 text-sm text-rose-200">{error}</p>}
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={close} className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-bold text-slate-200 hover:bg-white/10">Huỷ</button>
                <PrimaryButton type="submit" disabled={saving}>{saving ? "Đang lưu..." : "Lưu"}</PrimaryButton>
              </div>
            </form>
          </GlassCard>
        </div>
      )}
    </div>
  );
}
