import { useEffect, useState, useCallback } from "react";
import { Clock } from "lucide-react";
import { api, REGION_LABEL } from "../../api/client.js";
import { GlassCard, SectionTitle, Badge } from "../../components/ui.jsx";
import { formatCurrency, formatRelative } from "../../lib/format.js";

const ACTION_LABEL = {
  SUBMIT: "Gửi báo cáo",
  ADD_INFO: "Bổ sung thông tin",
  ADMIN_PATCH: "Admin xử lý",
  DUPLICATE_MERGE: "Gộp duplicate",
};

const TABS = [
  { id: "sellers", label: "Người bán" },
  { id: "reports", label: "Báo cáo lừa đảo" },
  { id: "prices", label: "Giá pháo hoa" },
  { id: "reviews", label: "Đánh giá" },
];

const REPORT_STATUS_OPTIONS = [
  { value: "PENDING", label: "Chờ duyệt" },
  { value: "REVIEWING", label: "Đang kiểm tra" },
  { value: "VERIFIED", label: "Đã xác minh" },
  { value: "NEED_MORE_INFO", label: "Cần thêm thông tin" },
  { value: "DUPLICATE", label: "Trùng" },
  { value: "REJECTED", label: "Từ chối" },
];

const SIMPLE_STATUS_OPTIONS = [
  { value: "PENDING", label: "Chờ duyệt" },
  { value: "APPROVED", label: "Đã duyệt" },
  { value: "REJECTED", label: "Từ chối" },
];

const STATUS_BADGE_VARIANT = {
  PENDING: "warn",
  REVIEWING: "neutral",
  VERIFIED: "danger",
  APPROVED: "gold",
  REJECTED: "neutral",
  DUPLICATE: "neutral",
  NEED_MORE_INFO: "warn",
};

function ReportRow({ item, busy, onAction }) {
  const [showTimeline, setShowTimeline] = useState(false);
  const [timeline, setTimeline] = useState(null);

  const evidence = (() => {
    try {
      const arr = typeof item.evidenceUrls === "string" ? JSON.parse(item.evidenceUrls) : item.evidenceUrls;
      return Array.isArray(arr) ? arr : [];
    } catch {
      return [];
    }
  })();

  const toggleTimeline = async () => {
    if (showTimeline) {
      setShowTimeline(false);
      return;
    }
    setShowTimeline(true);
    if (!timeline) {
      try {
        const data = await api.get(`/admin/reports/${item.id}`, { auth: true });
        setTimeline(data.status_logs || []);
      } catch {
        setTimeline([]);
      }
    }
  };

  return (
    <div className="rounded-2xl border border-white/10 bg-slate-950/60 p-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <div className="flex items-center gap-2">
            <p className="text-lg font-black text-white">{item.entity?.displayValue || "?"}</p>
            <Badge variant={STATUS_BADGE_VARIANT[item.status] || "neutral"}>{item.status}</Badge>
            <Badge variant={item.riskLevelInput === "high" ? "danger" : item.riskLevelInput === "medium" ? "warn" : "neutral"}>
              {item.riskLevelInput}
            </Badge>
          </div>
          <p className="mt-1 text-sm text-slate-300">
            <b className="text-amber-200">{item.reason_label || item.reasonCode}</b>
            {item.reasonText && ` — ${item.reasonText}`}
          </p>
          {item.detail && <p className="mt-1 text-sm text-slate-400">{item.detail}</p>}
          {(item.amount || item.transactionDate) && (
            <p className="mt-1 text-xs text-slate-400">
              {item.amount && <>Thiệt hại: <b className="text-white">{formatCurrency(item.amount)}</b></>}
              {item.amount && item.transactionDate && " · "}
              {item.transactionDate && <>Ngày GD: {new Date(item.transactionDate).toLocaleDateString("vi-VN")}</>}
            </p>
          )}
          {item.relatedAccountEntity && (
            <p className="mt-1 text-xs text-slate-400">
              Tài khoản liên quan: <span className="text-white">{item.relatedAccountEntity.displayValue}</span>
              {item.relatedAccountEntity.bankName && ` (${item.relatedAccountEntity.bankName})`}
            </p>
          )}
        </div>
        <p className="text-xs text-slate-500">
          {item.submittedBy?.displayName || "?"} · {formatRelative(item.createdAt)}
        </p>
      </div>

      {evidence.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {evidence.map((url, idx) => {
            const isImage = /\.(jpe?g|png|webp|gif)$/i.test(url);
            return isImage ? (
              <a key={idx} href={url} target="_blank" rel="noreferrer">
                <img src={url} alt="evidence" className="h-16 w-16 rounded-lg object-cover ring-1 ring-white/10 hover:ring-amber-300" />
              </a>
            ) : (
              <a
                key={idx}
                href={url}
                target="_blank"
                rel="noreferrer"
                className="rounded-lg border border-white/10 bg-slate-900 px-3 py-2 text-xs text-amber-300 hover:bg-slate-800"
              >
                Tệp #{idx + 1}
              </a>
            );
          })}
        </div>
      )}

      {item.adminNote && (
        <p className="mt-2 rounded-lg bg-amber-500/10 px-3 py-2 text-xs text-amber-200">Ghi chú admin: {item.adminNote}</p>
      )}

      <div className="mt-3 flex flex-wrap gap-2">
        <button
          disabled={busy}
          onClick={() => onAction(item, "VERIFIED")}
          className="rounded-xl bg-emerald-400/20 px-4 py-2 text-sm font-black text-emerald-200 hover:bg-emerald-400/30 disabled:opacity-50"
        >
          Xác minh
        </button>
        <button
          disabled={busy}
          onClick={() => onAction(item, "REVIEWING")}
          className="rounded-xl bg-sky-400/20 px-4 py-2 text-sm font-black text-sky-200 hover:bg-sky-400/30 disabled:opacity-50"
        >
          Đang kiểm tra
        </button>
        <button
          disabled={busy}
          onClick={() => onAction(item, "NEED_MORE_INFO")}
          className="rounded-xl bg-amber-400/20 px-4 py-2 text-sm font-black text-amber-200 hover:bg-amber-400/30 disabled:opacity-50"
        >
          Cần thêm thông tin
        </button>
        <button
          disabled={busy}
          onClick={() => onAction(item, "DUPLICATE")}
          className="rounded-xl bg-slate-500/20 px-4 py-2 text-sm font-black text-slate-200 hover:bg-slate-500/30 disabled:opacity-50"
        >
          Gộp duplicate
        </button>
        <button
          disabled={busy}
          onClick={() => onAction(item, "REJECTED")}
          className="rounded-xl bg-rose-500/20 px-4 py-2 text-sm font-black text-rose-200 hover:bg-rose-500/30 disabled:opacity-50"
        >
          Từ chối
        </button>
        <button
          type="button"
          onClick={toggleTimeline}
          className="inline-flex items-center gap-1 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-bold text-slate-200 hover:bg-white/10"
        >
          <Clock className="h-4 w-4" /> {showTimeline ? "Ẩn lịch sử" : "Lịch sử"}
        </button>
      </div>

      {showTimeline && (
        <div className="mt-3 rounded-xl border border-white/10 bg-slate-950/80 p-3">
          <p className="text-xs font-black uppercase tracking-wide text-amber-200/80">Lịch sử xử lý</p>
          {timeline === null ? (
            <p className="mt-2 text-xs text-slate-400">Đang tải...</p>
          ) : timeline.length === 0 ? (
            <p className="mt-2 text-xs text-slate-400">Chưa có log.</p>
          ) : (
            <ol className="mt-2 space-y-2 border-l border-amber-300/30 pl-3">
              {timeline.map((log) => (
                <li key={log.id} className="text-xs">
                  <p className="font-bold text-white">
                    {ACTION_LABEL[log.action] || log.action} → <span className="text-amber-300">{log.new_status}</span>
                  </p>
                  <p className="text-slate-400">
                    {log.changed_by} · {formatRelative(log.created_at)}
                  </p>
                  {log.note && <p className="mt-0.5 text-slate-300">{log.note}</p>}
                </li>
              ))}
            </ol>
          )}
        </div>
      )}
    </div>
  );
}

function SimpleRow({ tab, item, busy, onAction }) {
  let primary = null;
  if (tab === "sellers") {
    primary = (
      <>
        <p className="text-lg font-black text-white">{item.name}</p>
        <p className="text-sm text-slate-300">{item.phone} {item.bankAccount ? `· ${item.bankAccount}` : ""} · {item.location}</p>
        {item.description && <p className="mt-1 text-sm text-slate-400">{item.description}</p>}
      </>
    );
  } else if (tab === "prices") {
    primary = (
      <>
        <p className="text-lg font-black text-white">{item.product?.name} · Miền {REGION_LABEL[item.region]}</p>
        <p className="text-sm text-slate-300">
          {formatCurrency(item.price)} · {item.storeName}{" "}
          {item.storeUrl && <a className="text-amber-300 underline" href={item.storeUrl} target="_blank" rel="noreferrer">link</a>}
        </p>
        <p className="text-xs text-slate-400">Ngày niêm yết: {new Date(item.priceDate).toLocaleDateString("vi-VN")}</p>
      </>
    );
  } else if (tab === "reviews") {
    primary = (
      <>
        <p className="text-lg font-black text-white">{item.seller?.name} · ⭐ {item.rating}</p>
        {item.comment && <p className="text-sm text-slate-300">{item.comment}</p>}
      </>
    );
  }

  return (
    <div className="rounded-2xl border border-white/10 bg-slate-950/60 p-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>{primary}</div>
        <Badge variant={STATUS_BADGE_VARIANT[item.status] || "neutral"}>{item.status}</Badge>
      </div>
      <p className="text-xs text-slate-500">
        Gửi bởi {item.submittedBy?.displayName || item.user?.displayName || "?"} · {formatRelative(item.createdAt)}
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        <button
          disabled={busy}
          onClick={() => onAction(item, "APPROVED")}
          className="rounded-xl bg-emerald-400/20 px-4 py-2 text-sm font-black text-emerald-200 hover:bg-emerald-400/30 disabled:opacity-50"
        >
          Duyệt
        </button>
        <button
          disabled={busy}
          onClick={() => onAction(item, "REJECTED")}
          className="rounded-xl bg-rose-500/20 px-4 py-2 text-sm font-black text-rose-200 hover:bg-rose-500/30 disabled:opacity-50"
        >
          Từ chối
        </button>
      </div>
    </div>
  );
}

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState("reports");
  const [statusFilter, setStatusFilter] = useState("PENDING");
  const [items, setItems] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);

  const loadStats = useCallback(() => {
    api.get("/admin/stats", { auth: true }).then(setStats).catch(() => {});
  }, []);

  const loadQueue = useCallback((tab, status) => {
    setLoading(true);
    api
      .get("/admin/queue", { params: { type: tab, status }, auth: true })
      .then((data) => setItems(data.items || []))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  useEffect(() => {
    loadQueue(activeTab, statusFilter);
  }, [activeTab, statusFilter, loadQueue]);

  const handleReportAction = async (item, action) => {
    let body = { status: action };

    if (action === "DUPLICATE") {
      const dupId = window.prompt(`Báo cáo này là duplicate của báo cáo ID nào? (nhập số)`);
      if (!dupId) return;
      if (!/^\d+$/.test(dupId.trim())) {
        alert("ID không hợp lệ");
        return;
      }
      body.duplicate_of = Number(dupId.trim());
    }
    if (action === "REJECTED") {
      const reason = window.prompt("Lý do từ chối (tuỳ chọn)") || "";
      body.reject_reason = reason;
    }
    if (action === "NEED_MORE_INFO") {
      const note = window.prompt("Ghi chú yêu cầu thêm thông tin (tuỳ chọn)") || "";
      if (note) body.admin_note = note;
    }
    if (action === "VERIFIED") {
      const note = window.prompt("Ghi chú nội bộ (tuỳ chọn)") || "";
      if (note) body.admin_note = note;
      const rl = window.prompt("Mức rủi ro (low/medium/high) — bỏ trống = giữ nguyên", item.riskLevelInput || "");
      if (rl && ["low", "medium", "high"].includes(rl.trim())) body.risk_level = rl.trim();
    }

    setBusyId(item.id);
    try {
      await api.patch(`/admin/reports/${item.id}`, body, { auth: true });
      setItems((prev) => prev.filter((x) => x.id !== item.id));
      loadStats();
    } catch (err) {
      alert(err.message || "Thao tác thất bại");
    } finally {
      setBusyId(null);
    }
  };

  const handleSimpleAction = async (item, action) => {
    let body = { status: action };
    if (action === "REJECTED") {
      const reason = window.prompt("Lý do từ chối (tuỳ chọn)") || "";
      body.reject_reason = reason;
    }
    setBusyId(item.id);
    try {
      await api.patch(`/admin/${activeTab}/${item.id}`, body, { auth: true });
      setItems((prev) => prev.filter((x) => x.id !== item.id));
      loadStats();
    } catch (err) {
      alert(err.message || "Thao tác thất bại");
    } finally {
      setBusyId(null);
    }
  };

  const statusOptions = activeTab === "reports" ? REPORT_STATUS_OPTIONS : SIMPLE_STATUS_OPTIONS;

  return (
    <section className="mx-auto max-w-6xl px-5 py-12">
      <SectionTitle
        dark
        eyebrow="Quản trị viên"
        title="Hàng chờ duyệt"
        desc="Tất cả nội dung user gửi đều ở trạng thái chờ. Riêng báo cáo lừa đảo có 6 trạng thái: PENDING → REVIEWING → VERIFIED / REJECTED / DUPLICATE / NEED_MORE_INFO."
      />

      {stats && (
        <div className="mt-6 grid gap-4 md:grid-cols-5">
          {[
            ["Người bán", stats.pendingSellers],
            ["Báo cáo chờ", stats.pendingReports],
            ["Đang kiểm tra", stats.reviewingReports || 0],
            ["Giá", stats.pendingPrices],
            ["Đánh giá", stats.pendingReviews],
          ].map(([label, count]) => (
            <GlassCard key={label} className="p-4">
              <p className="text-xs text-slate-400">{label}</p>
              <p className="mt-1 text-3xl font-black text-amber-300">{count}</p>
            </GlassCard>
          ))}
        </div>
      )}

      <div className="mt-6 flex flex-wrap items-center gap-3">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => {
              setActiveTab(t.id);
              setStatusFilter(t.id === "reports" ? "PENDING" : "PENDING");
            }}
            className={`rounded-2xl px-4 py-2 text-sm font-black ${
              activeTab === t.id
                ? "bg-gradient-to-r from-amber-300 to-orange-400 text-slate-950"
                : "border border-white/10 bg-white/5 text-slate-200 hover:bg-white/10"
            }`}
          >
            {t.label}
          </button>
        ))}
        <span className="ml-auto inline-flex items-center gap-2 text-xs text-slate-400">
          Lọc theo trạng thái:
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-xl border border-white/10 bg-slate-950/70 px-3 py-2 text-sm font-bold text-white outline-none focus:border-amber-300"
          >
            {statusOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </span>
      </div>

      <GlassCard className="mt-4 p-5">
        {loading ? (
          <p className="text-slate-400">Đang tải...</p>
        ) : items.length === 0 ? (
          <p className="text-slate-400">Không có mục nào.</p>
        ) : (
          <div className="space-y-3">
            {items.map((item) =>
              activeTab === "reports" ? (
                <ReportRow key={item.id} item={item} busy={busyId === item.id} onAction={handleReportAction} />
              ) : (
                <SimpleRow key={item.id} tab={activeTab} item={item} busy={busyId === item.id} onAction={handleSimpleAction} />
              )
            )}
          </div>
        )}
      </GlassCard>
    </section>
  );
}
