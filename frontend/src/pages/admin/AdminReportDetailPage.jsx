import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Copy,
  Phone,
  CreditCard,
  Clock,
  Layers,
} from "lucide-react";
import { api } from "../../api/client.js";
import { GlassCard, Badge, TextArea, PrimaryButton, SelectBox } from "../../components/ui.jsx";
import { formatCurrency, formatRelative } from "../../lib/format.js";

const STATUS_LABEL = {
  PENDING: "Chờ duyệt",
  REVIEWING: "Đang kiểm tra",
  VERIFIED: "Đã xác minh",
  REJECTED: "Từ chối",
  DUPLICATE: "Trùng",
  NEED_MORE_INFO: "Cần bổ sung",
};

const REJECT_PRESETS = [
  "Không đủ bằng chứng",
  "Thông tin không rõ ràng",
  "Không liên quan",
  "Báo cáo sai sự thật",
  "Trùng báo cáo",
  "Nội dung spam",
];

const ACTION_LABEL = {
  SUBMIT: "Gửi báo cáo",
  ADD_INFO: "Bổ sung thông tin",
  ADMIN_PATCH: "Admin xử lý",
};

export default function AdminReportDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [actionForm, setActionForm] = useState({ admin_note: "", reject_reason: "", risk_level: "medium", duplicate_of: "" });
  const [error, setError] = useState("");
  const [related, setRelated] = useState({ samePhone: 0, sameAccount: 0 });

  const load = () => {
    setLoading(true);
    api
      .get(`/admin/reports/${id}`, { auth: true })
      .then((r) => {
        setReport(r);
        setActionForm((f) => ({ ...f, risk_level: r.riskLevelInput || "medium" }));
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  // Lấy thông tin entity từ lookup để biết số báo cáo khác
  useEffect(() => {
    if (!report?.entity?.normalizedValue) return;
    api
      .post("/lookup", {
        type: report.entity.type === "PHONE" ? "phone" : "bank_account",
        value: report.entity.normalizedValue,
      })
      .then((d) => {
        setRelated({
          totalReports: d.report_count,
          relatedEntities: d.related_entities?.length || 0,
        });
      })
      .catch(() => {});
  }, [report]);

  const evidence = (() => {
    try {
      const arr = typeof report?.evidenceUrls === "string" ? JSON.parse(report.evidenceUrls) : report?.evidenceUrls;
      return Array.isArray(arr) ? arr : [];
    } catch {
      return [];
    }
  })();

  const doAction = async (status) => {
    setBusy(true);
    setError("");
    try {
      const body = { status, admin_note: actionForm.admin_note || undefined };
      if (status === "REJECTED") body.reject_reason = actionForm.reject_reason || undefined;
      if (status === "VERIFIED") body.risk_level = actionForm.risk_level;
      if (status === "DUPLICATE") {
        if (!actionForm.duplicate_of) {
          setError("Vui lòng nhập ID báo cáo gốc.");
          setBusy(false);
          return;
        }
        body.duplicate_of = Number(actionForm.duplicate_of);
      }
      await api.patch(`/admin/reports/${id}`, body, { auth: true });
      load();
      setActionForm({ admin_note: "", reject_reason: "", risk_level: actionForm.risk_level, duplicate_of: "" });
    } catch (err) {
      setError(err.message || "Thao tác thất bại");
    } finally {
      setBusy(false);
    }
  };

  if (loading) return <p className="text-slate-400">Đang tải...</p>;
  if (!report) return <p className="text-rose-300">Không tìm thấy báo cáo</p>;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <Link to="/admin/reports" className="inline-flex items-center gap-2 text-sm text-amber-300 hover:text-amber-200">
          <ArrowLeft className="h-4 w-4" /> Quay lại danh sách
        </Link>
        <Badge variant={report.status === "VERIFIED" ? "danger" : report.status === "PENDING" ? "warn" : "neutral"}>
          {STATUS_LABEL[report.status]}
        </Badge>
      </div>

      <header>
        <p className="font-mono text-xs text-slate-500">Mã báo cáo: #RP-{String(report.id).padStart(6, "0")}</p>
        <div className="mt-1 flex flex-wrap items-center gap-3">
          {report.entity?.type === "PHONE" ? <Phone className="h-6 w-6 text-amber-300" /> : <CreditCard className="h-6 w-6 text-amber-300" />}
          <h1 className="text-2xl font-black text-white md:text-3xl">{report.entity?.displayValue}</h1>
          <button
            onClick={() => navigator.clipboard?.writeText(report.entity?.displayValue || "")}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-white/5"
            title="Copy"
          >
            <Copy className="h-4 w-4" />
          </button>
          <Badge variant={report.riskLevelInput === "high" ? "danger" : report.riskLevelInput === "medium" ? "warn" : "neutral"}>
            Rủi ro {report.riskLevelInput}
          </Badge>
        </div>
        <p className="mt-2 text-sm text-slate-400">
          Người gửi: <b className="text-slate-200">{report.submittedBy?.displayName}</b> ({report.submittedBy?.email}) · {formatRelative(report.createdAt)}
        </p>
        {(related.totalReports || related.relatedEntities) && (
          <div className="mt-3 inline-flex items-center gap-2 rounded-xl bg-amber-400/10 px-3 py-2 text-sm text-amber-200">
            <Layers className="h-4 w-4" />
            Đối tượng này có tổng <b>{related.totalReports || 0}</b> báo cáo · <b>{related.relatedEntities || 0}</b> entity liên quan
          </div>
        )}
      </header>

      <div className="grid gap-5 lg:grid-cols-[1.5fr_1fr]">
        <div className="space-y-5">
          <GlassCard className="p-5">
            <p className="text-xs font-black uppercase tracking-wide text-amber-300">Thông tin người bị báo cáo</p>
            <dl className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
              <div><dt className="text-slate-400">Loại</dt><dd className="text-white">{report.entity?.type}</dd></div>
              <div><dt className="text-slate-400">Giá trị</dt><dd className="font-bold text-white">{report.entity?.displayValue}</dd></div>
              {report.entity?.bankName && <div><dt className="text-slate-400">Ngân hàng</dt><dd className="text-white">{report.entity.bankName}</dd></div>}
              {report.bankOwnerName && <div><dt className="text-slate-400">Tên chủ TK</dt><dd className="text-white">{report.bankOwnerName}</dd></div>}
              {report.sellerName && <div><dt className="text-slate-400">Tên người bán</dt><dd className="text-white">{report.sellerName}</dd></div>}
              {report.sellerShopName && <div><dt className="text-slate-400">Shop</dt><dd className="text-white">{report.sellerShopName}</dd></div>}
              {report.region && <div><dt className="text-slate-400">Khu vực</dt><dd className="text-white">{report.region}</dd></div>}
              {report.socialLink && <div className="sm:col-span-2"><dt className="text-slate-400">Link liên quan</dt><dd className="break-all"><a className="text-amber-300 underline" href={report.socialLink} target="_blank" rel="noreferrer">{report.socialLink}</a></dd></div>}
              {report.relatedAccountEntity && <div className="sm:col-span-2"><dt className="text-slate-400">Tài khoản liên quan</dt><dd className="text-white">{report.relatedAccountEntity.displayValue} {report.relatedAccountEntity.bankName && `(${report.relatedAccountEntity.bankName})`}</dd></div>}
            </dl>
          </GlassCard>

          <GlassCard className="p-5">
            <p className="text-xs font-black uppercase tracking-wide text-amber-300">Thông tin giao dịch</p>
            <dl className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
              {report.productName && <div><dt className="text-slate-400">Sản phẩm</dt><dd className="text-white">{report.productName}</dd></div>}
              {report.amount && <div><dt className="text-slate-400">Số tiền</dt><dd className="font-black text-amber-300">{formatCurrency(report.amount)}</dd></div>}
              {report.transactionDate && <div><dt className="text-slate-400">Ngày GD</dt><dd className="text-white">{new Date(report.transactionDate).toLocaleDateString("vi-VN")}</dd></div>}
              {report.paymentMethod && <div><dt className="text-slate-400">Hình thức</dt><dd className="text-white">{report.paymentMethod}</dd></div>}
              {report.contactChannel && <div><dt className="text-slate-400">Kênh liên hệ</dt><dd className="text-white">{report.contactChannel}</dd></div>}
              <div><dt className="text-slate-400">Lý do</dt><dd className="text-white">{report.reason_label}</dd></div>
            </dl>
          </GlassCard>

          {report.detail && (
            <GlassCard className="p-5">
              <p className="text-xs font-black uppercase tracking-wide text-amber-300">Mô tả sự việc</p>
              <p className="mt-2 whitespace-pre-wrap rounded-xl bg-slate-950/70 p-3 text-sm text-slate-200">{report.detail}</p>
            </GlassCard>
          )}

          {evidence.length > 0 && (
            <GlassCard className="p-5">
              <p className="text-xs font-black uppercase tracking-wide text-amber-300">Bằng chứng ({evidence.length})</p>
              <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
                {evidence.map((url, idx) => {
                  const isImage = /\.(jpe?g|png|webp|gif)$/i.test(url);
                  return isImage ? (
                    <a key={idx} href={url} target="_blank" rel="noreferrer" className="group relative aspect-square overflow-hidden rounded-lg border border-white/10 hover:border-amber-300">
                      <img src={url} alt={`evidence-${idx}`} className="h-full w-full object-cover transition group-hover:scale-105" />
                    </a>
                  ) : (
                    <a key={idx} href={url} target="_blank" rel="noreferrer" className="flex aspect-square items-center justify-center rounded-lg border border-white/10 bg-slate-900 text-xs font-bold text-amber-300 hover:bg-slate-800">
                      Tệp #{idx + 1}
                    </a>
                  );
                })}
              </div>
            </GlassCard>
          )}

          <GlassCard className="p-5">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-amber-300" />
              <p className="text-xs font-black uppercase tracking-wide text-amber-300">Lịch sử xử lý</p>
            </div>
            <ol className="mt-4 space-y-3 border-l-2 border-amber-300/30 pl-4">
              {(report.status_logs || []).map((log) => (
                <li key={log.id} className="relative">
                  <span className="absolute -left-[1.4rem] top-1 flex h-4 w-4 items-center justify-center rounded-full bg-amber-400 ring-4 ring-slate-950" />
                  <p className="text-sm font-bold text-white">
                    {ACTION_LABEL[log.action] || log.action}{" "}
                    <span className="text-slate-400">— {log.new_status}</span>
                  </p>
                  <p className="text-xs text-slate-500">{log.changed_by} · {formatRelative(log.created_at)}</p>
                  {log.note && <p className="mt-1 text-xs text-slate-300">{log.note}</p>}
                </li>
              ))}
              {(!report.status_logs || report.status_logs.length === 0) && <li className="text-sm text-slate-400">Chưa có log.</li>}
            </ol>
          </GlassCard>
        </div>

        <aside className="space-y-4">
          <GlassCard className="p-5">
            <p className="text-xs font-black uppercase tracking-wide text-amber-300">Hành động</p>

            <TextArea
              label="Ghi chú nội bộ"
              value={actionForm.admin_note}
              onChange={(e) => setActionForm({ ...actionForm, admin_note: e.target.value })}
              rows={3}
              placeholder="Note cho admin khác..."
            />

            <SelectBox
              label="Mức rủi ro (nếu xác minh)"
              value={actionForm.risk_level}
              onChange={(v) => setActionForm({ ...actionForm, risk_level: v })}
              options={[
                { value: "low", label: "Thấp" },
                { value: "medium", label: "Trung bình" },
                { value: "high", label: "Cao" },
              ]}
            />

            {error && <p className="rounded-xl bg-rose-500/10 px-3 py-2 text-xs text-rose-200">{error}</p>}

            <div className="mt-2 space-y-2">
              <button
                disabled={busy}
                onClick={() => doAction("VERIFIED")}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-400/20 px-4 py-2 text-sm font-black text-emerald-200 hover:bg-emerald-400/30 disabled:opacity-50"
              >
                <CheckCircle2 className="h-4 w-4" /> Xác minh
              </button>
              <button
                disabled={busy}
                onClick={() => doAction("REVIEWING")}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-sky-400/20 px-4 py-2 text-sm font-black text-sky-200 hover:bg-sky-400/30 disabled:opacity-50"
              >
                Đang kiểm tra
              </button>
              <button
                disabled={busy}
                onClick={() => doAction("NEED_MORE_INFO")}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-amber-400/20 px-4 py-2 text-sm font-black text-amber-200 hover:bg-amber-400/30 disabled:opacity-50"
              >
                <AlertTriangle className="h-4 w-4" /> Yêu cầu bổ sung
              </button>

              <div className="rounded-xl border border-white/10 bg-slate-950/60 p-3 text-xs">
                <p className="font-bold text-slate-300">Đánh dấu trùng:</p>
                <input
                  type="number"
                  placeholder="ID báo cáo gốc"
                  value={actionForm.duplicate_of}
                  onChange={(e) => setActionForm({ ...actionForm, duplicate_of: e.target.value })}
                  className="mt-2 w-full rounded-lg border border-white/10 bg-slate-900 px-3 py-1.5 text-sm text-white outline-none focus:border-amber-300"
                />
                <button
                  disabled={busy || !actionForm.duplicate_of}
                  onClick={() => doAction("DUPLICATE")}
                  className="mt-2 w-full rounded-lg bg-slate-500/20 px-3 py-1.5 font-black text-slate-200 hover:bg-slate-500/30 disabled:opacity-40"
                >
                  Gộp duplicate
                </button>
              </div>

              <div className="rounded-xl border border-white/10 bg-slate-950/60 p-3 text-xs">
                <p className="font-bold text-slate-300">Từ chối:</p>
                <select
                  value={actionForm.reject_reason}
                  onChange={(e) => setActionForm({ ...actionForm, reject_reason: e.target.value })}
                  className="mt-2 w-full rounded-lg border border-white/10 bg-slate-900 px-3 py-1.5 text-sm font-bold text-white"
                >
                  <option value="">— Chọn lý do —</option>
                  {REJECT_PRESETS.map((p) => <option key={p} value={p}>{p}</option>)}
                </select>
                <button
                  disabled={busy}
                  onClick={() => doAction("REJECTED")}
                  className="mt-2 flex w-full items-center justify-center gap-1 rounded-lg bg-rose-500/20 py-1.5 font-black text-rose-200 hover:bg-rose-500/30 disabled:opacity-40"
                >
                  <XCircle className="h-4 w-4" /> Từ chối báo cáo
                </button>
              </div>
            </div>
          </GlassCard>
        </aside>
      </div>
    </div>
  );
}
