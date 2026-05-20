import { useEffect, useState } from "react";
import { CheckCircle2, Moon, Sun, Eye } from "lucide-react";
import { api } from "../../../api/client.js";
import { GlassCard, PrimaryButton, SectionTitle } from "../../../components/ui.jsx";
import { useTheme } from "../../../context/ThemeContext.jsx";

const PRESETS = [
  {
    id: "dark",
    name: "Pháo hoa nền tối",
    description: "Cảm giác cao cấp, lễ hội, ban đêm. Phù hợp trang chủ, bảng giá, người bán uy tín.",
    bg: "#060b1d",
    primary: "#fbbf24",
    secondary: "#fb923c",
    danger: "#f43f5e",
    safe: "#34d399",
    cardBg: "rgba(255,255,255,0.06)",
    text: "#ffffff",
    muted: "#94a3b8",
    icon: Moon,
  },
  {
    id: "light",
    name: "Tin cậy nền sáng",
    description: "Sạch, dễ đọc, phổ thông, thân thiện. Phù hợp tra cứu, báo cáo, hướng dẫn.",
    bg: "#f8fafc",
    primary: "#d97706",
    secondary: "#f59e0b",
    danger: "#e11d48",
    safe: "#059669",
    cardBg: "#ffffff",
    text: "#0f172a",
    muted: "#64748b",
    icon: Sun,
  },
];

function PreviewCard({ preset, isActive, onActivate, onPreview }) {
  const Icon = preset.icon;
  return (
    <div
      className="overflow-hidden rounded-2xl border shadow-xl"
      style={{ background: preset.bg, color: preset.text, borderColor: preset.id === "dark" ? "rgba(255,255,255,0.1)" : "#e2e8f0" }}
    >
      <div className="flex items-center justify-between border-b p-4" style={{ borderColor: preset.id === "dark" ? "rgba(255,255,255,0.1)" : "#e2e8f0" }}>
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl shadow-lg" style={{ background: `linear-gradient(135deg, ${preset.primary}, ${preset.secondary})`, color: preset.bg }}>
            <Icon className="h-5 w-5" />
          </div>
          <div>
            <p className="text-base font-black">{preset.name}</p>
            <p className="text-xs" style={{ color: preset.muted }}>Theme · {preset.id}</p>
          </div>
        </div>
        {isActive && (
          <span className="inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-black" style={{ background: preset.primary + "22", color: preset.primary }}>
            <CheckCircle2 className="h-3.5 w-3.5" /> Đang dùng
          </span>
        )}
      </div>

      <div className="p-4 space-y-3">
        <p className="text-sm" style={{ color: preset.muted }}>{preset.description}</p>

        {/* Mini preview hero */}
        <div className="rounded-xl border p-3" style={{ borderColor: preset.id === "dark" ? "rgba(255,255,255,0.1)" : "#e2e8f0", background: preset.cardBg }}>
          <p className="text-xs font-bold" style={{ color: preset.primary }}>Cộng đồng xác thực</p>
          <h4 className="mt-1 font-black">Kiểm tra độ tin cậy người bán</h4>
          <div className="mt-2 flex gap-2">
            <span className="rounded-lg px-3 py-1 text-xs font-black" style={{ background: `linear-gradient(to right, ${preset.primary}, ${preset.secondary})`, color: preset.bg }}>
              Kiểm tra ngay
            </span>
            <span className="rounded-lg border px-3 py-1 text-xs font-bold" style={{ borderColor: preset.primary + "55", color: preset.primary }}>
              Xem bảng giá
            </span>
          </div>
        </div>

        {/* Color swatches */}
        <div className="grid grid-cols-5 gap-1.5">
          {[preset.primary, preset.secondary, preset.danger, preset.safe, preset.text].map((c, idx) => (
            <div key={idx} className="aspect-square rounded-md ring-1 ring-black/5" style={{ background: c }} title={c} />
          ))}
        </div>

        <div className="flex gap-2 pt-1">
          <button
            onClick={onActivate}
            disabled={isActive}
            className="flex-1 rounded-lg px-3 py-2 text-xs font-black disabled:cursor-not-allowed disabled:opacity-40"
            style={{ background: preset.primary, color: preset.bg }}
          >
            {isActive ? "Đang dùng" : "Kích hoạt"}
          </button>
          <button
            onClick={onPreview}
            className="rounded-lg border px-3 py-2 text-xs font-bold"
            style={{ borderColor: preset.primary + "55", color: preset.primary }}
          >
            <Eye className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}

export default function AdminThemesPage() {
  const { mode, setMode } = useTheme();
  const [defaultTheme, setDefaultTheme] = useState("dark");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const data = await api.get("/admin/site-settings", { auth: true });
      const def = (data.items || []).find((i) => i.key === "default_theme");
      setDefaultTheme(def?.value === "light" ? "light" : "dark");
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { load(); }, []);

  const activate = async (presetId) => {
    setSaving(true);
    try {
      await api.patch(
        "/admin/site-settings",
        {
          items: [
            { key: "default_theme", value: presetId, type: "string", group: "brand", description: "Theme mặc định cho khách mới" },
          ],
        },
        { auth: true }
      );
      setDefaultTheme(presetId);
      setSavedAt(new Date());
    } catch (err) {
      alert(err.message);
    } finally {
      setSaving(false);
    }
  };

  const preview = (presetId) => setMode(presetId);

  return (
    <div className="space-y-5">
      <header>
        <h1 className="text-2xl font-black text-white md:text-3xl">Mẫu giao diện</h1>
        <p className="mt-1 text-sm text-slate-400">
          Chọn theme mặc định khi khách mới truy cập. Người dùng vẫn có thể chuyển ☀️/🌙 ở header và lựa chọn của họ được lưu trong trình duyệt.
        </p>
      </header>

      {savedAt && (
        <p className="text-xs text-emerald-300">Đã lưu lúc {savedAt.toLocaleTimeString("vi-VN")} — khách mới sẽ thấy theme này từ giờ.</p>
      )}

      {loading ? <p className="text-slate-400">Đang tải...</p> : (
        <div className="grid gap-5 md:grid-cols-2">
          {PRESETS.map((p) => (
            <PreviewCard
              key={p.id}
              preset={p}
              isActive={defaultTheme === p.id}
              onActivate={() => !saving && activate(p.id)}
              onPreview={() => preview(p.id)}
            />
          ))}
        </div>
      )}

      <GlassCard className="p-5">
        <SectionTitle dark eyebrow="Gợi ý sử dụng" title="Theme nào dùng cho trang nào?" />
        <ul className="mt-3 grid gap-2 text-sm text-slate-300 md:grid-cols-2">
          <li>🌙 <b className="text-amber-200">Pháo hoa nền tối</b>: Trang chủ, bảng giá pháo hoa, người bán uy tín — cảm giác lễ hội cao cấp.</li>
          <li>☀️ <b className="text-amber-200">Tin cậy nền sáng</b>: Trang tra cứu, gửi báo cáo, hướng dẫn — dễ đọc, tin cậy, phù hợp form nhập liệu.</li>
        </ul>
        <p className="mt-3 text-xs text-slate-500">Phase 2: chọn theme khác nhau cho từng trang (default = áp dụng toàn site).</p>
      </GlassCard>

      <p className="text-xs text-slate-500">
        Preview hiện tại: <b className="text-amber-300">{mode === "dark" ? "🌙 Nền tối" : "☀️ Nền sáng"}</b> — bấm "Xem trước" để đổi tạm trong session, hoặc "Kích hoạt" để áp dụng cho khách mới.
      </p>
    </div>
  );
}
