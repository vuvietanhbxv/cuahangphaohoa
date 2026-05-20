import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { SectionTitle } from "../components/ui.jsx";
import { api } from "../api/client.js";
import WarningCard from "../components/WarningCard.jsx";

const LEVEL_OPTIONS = [
  { value: "", label: "Tất cả mức độ" },
  { value: "HIGH", label: "Rủi ro cao" },
  { value: "MEDIUM", label: "Rủi ro trung bình" },
  { value: "LOW", label: "Rủi ro thấp" },
];

export default function WarningsPage() {
  const [items, setItems] = useState([]);
  const [level, setLevel] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    api
      .get("/reports", { params: { level: level || undefined, limit: 60 } })
      .then((data) => setItems(data.items || []))
      .finally(() => setLoading(false));
  }, [level]);

  return (
    <section className="mx-auto max-w-7xl px-5 py-12">
      <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
        <SectionTitle
          dark
          eyebrow="Cảnh báo lừa đảo"
          title="Toàn bộ số bị báo cáo đã được duyệt"
          desc="Lọc theo mức độ rủi ro. Nếu bạn từng gặp lừa đảo, vui lòng đóng góp báo cáo của mình."
        />
        <div className="flex items-center gap-3">
          <select
            value={level}
            onChange={(e) => setLevel(e.target.value)}
            className="h-12 rounded-2xl border border-amber-300/20 bg-slate-950/70 px-4 text-sm font-semibold text-main outline-none focus:border-amber-300"
          >
            {LEVEL_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          <Link
            to="/submit/report"
            className="rounded-2xl bg-gradient-to-r from-rose-500 to-orange-500 px-5 py-3 text-sm font-black text-main shadow-lg shadow-rose-500/25 hover:from-rose-400 hover:to-amber-400"
          >
            Gửi báo cáo
          </Link>
        </div>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {loading ? (
          <p className="text-muted">Đang tải...</p>
        ) : items.length === 0 ? (
          <p className="text-muted">Chưa có cảnh báo nào.</p>
        ) : (
          items.map((item) => <WarningCard key={item.id} item={item} />)
        )}
      </div>
    </section>
  );
}
