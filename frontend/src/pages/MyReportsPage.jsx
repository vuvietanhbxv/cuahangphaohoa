import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { FileWarning, ChevronRight, Inbox } from "lucide-react";
import { api } from "../api/client.js";
import { GlassCard, SectionTitle, Badge } from "../components/ui.jsx";
import { formatRelative, formatCurrency } from "../lib/format.js";

const STATUS_LABEL = {
  PENDING: "Chờ duyệt",
  REVIEWING: "Đang kiểm tra",
  NEED_MORE_INFO: "Cần bổ sung",
  VERIFIED: "Đã xác minh",
  REJECTED: "Bị từ chối",
  DUPLICATE: "Trùng báo cáo",
  DRAFT: "Nháp",
  REMOVED: "Đã gỡ",
};

const STATUS_VARIANT = {
  PENDING: "warn",
  REVIEWING: "neutral",
  NEED_MORE_INFO: "warn",
  VERIFIED: "gold",
  REJECTED: "neutral",
  DUPLICATE: "neutral",
};

export default function MyReportsPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get("/reports/my", { auth: true })
      .then((data) => setItems(data.items || []))
      .finally(() => setLoading(false));
  }, []);

  return (
    <section className="mx-auto max-w-4xl px-5 py-12">
      <SectionTitle
        dark
        eyebrow="Hồ sơ cá nhân"
        title="Báo cáo của tôi"
        desc="Danh sách các báo cáo bạn đã gửi và trạng thái xử lý của admin."
      />

      {loading ? (
        <p className="mt-6 text-muted">Đang tải...</p>
      ) : items.length === 0 ? (
        <GlassCard className="mt-6 p-8 text-center text-soft">
          <Inbox className="mx-auto h-10 w-10 text-amber-500" />
          <p className="mt-3 font-bold">Bạn chưa gửi báo cáo nào</p>
          <p className="mt-1 text-sm text-muted">Khi gặp lừa đảo, hãy đóng góp cảnh báo để bảo vệ cộng đồng.</p>
          <Link
            to="/submit/report"
            className="mt-4 inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-rose-500 to-orange-500 px-5 py-3 text-sm font-black text-main shadow-lg shadow-rose-500/20 hover:from-rose-400 hover:to-amber-400"
          >
            Gửi báo cáo
          </Link>
        </GlassCard>
      ) : (
        <ul className="mt-6 space-y-3">
          {items.map((r) => (
            <li key={r.id}>
              <Link
                to={`/my-reports/${r.id}`}
                className="block rounded-2xl border border-white/10 bg-slate-950/60 p-4 transition hover:border-amber-300/40 hover:bg-slate-900"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <FileWarning className="h-4 w-4 text-amber-500" />
                      <p className="font-black text-main">{r.target_display}</p>
                      <Badge variant={STATUS_VARIANT[r.status] || "neutral"}>{STATUS_LABEL[r.status] || r.status}</Badge>
                    </div>
                    <p className="mt-1 text-sm text-soft">{r.reason_label}</p>
                    <div className="mt-1 flex flex-wrap gap-3 text-xs text-muted">
                      <span>{formatRelative(r.created_at)}</span>
                      {r.amount && <span>{formatCurrency(r.amount)}</span>}
                      <span>{r.evidence_count} bằng chứng</span>
                    </div>
                  </div>
                  <ChevronRight className="h-5 w-5 flex-shrink-0 text-muted" />
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
