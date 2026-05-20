import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, Clock, Plus, ShieldCheck } from "lucide-react";
import { api } from "../api/client.js";
import { GlassCard, SectionTitle, Badge, TextArea, TextInput, PrimaryButton } from "../components/ui.jsx";
import EvidenceUploader from "../components/EvidenceUploader.jsx";
import { formatRelative, formatCurrency } from "../lib/format.js";

const STATUS_LABEL = {
  PENDING: "Chờ duyệt",
  REVIEWING: "Đang kiểm tra",
  NEED_MORE_INFO: "Cần bổ sung thông tin",
  VERIFIED: "Đã xác minh",
  REJECTED: "Bị từ chối",
  DUPLICATE: "Trùng báo cáo",
};

const ACTION_LABEL = {
  SUBMIT: "Gửi báo cáo",
  ADD_INFO: "Bổ sung thông tin",
  ADMIN_PATCH: "Admin xử lý",
  DUPLICATE_MERGE: "Gộp duplicate",
};

export default function MyReportDetailPage() {
  const { id } = useParams();
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [addForm, setAddForm] = useState({ additional_note: "", related_bank_account: "", social_link: "" });
  const [addEvidence, setAddEvidence] = useState([]);
  const [addLoading, setAddLoading] = useState(false);
  const [addError, setAddError] = useState("");
  const [addSuccess, setAddSuccess] = useState("");

  const load = () => {
    setLoading(true);
    api
      .get(`/reports/my/${id}`, { auth: true })
      .then(setReport)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const handleAdd = async (e) => {
    e.preventDefault();
    setAddError("");
    setAddSuccess("");
    setAddLoading(true);
    try {
      const payload = {
        additional_note: addForm.additional_note || undefined,
        related_bank_account: addForm.related_bank_account || undefined,
        social_link: addForm.social_link || undefined,
        evidence_urls: addEvidence.map((e) => e.url),
      };
      const res = await api.post(`/reports/my/${id}/add-info`, payload, { auth: true });
      setAddSuccess(res.message || "Đã bổ sung thông tin.");
      setAddForm({ additional_note: "", related_bank_account: "", social_link: "" });
      setAddEvidence([]);
      setShowAddForm(false);
      load();
    } catch (err) {
      setAddError(err.message || "Bổ sung thất bại");
    } finally {
      setAddLoading(false);
    }
  };

  if (loading) {
    return <section className="mx-auto max-w-4xl px-5 py-12"><p className="text-soft">Đang tải...</p></section>;
  }
  if (!report) {
    return <section className="mx-auto max-w-4xl px-5 py-12"><p className="text-rose-300">Không tìm thấy báo cáo</p></section>;
  }

  const canAdd = ["PENDING", "REVIEWING", "NEED_MORE_INFO"].includes(report.status);

  return (
    <section className="mx-auto max-w-4xl px-5 py-10">
      <Link to="/my-reports" className="inline-flex items-center gap-2 text-sm text-amber-500 hover:text-amber-200">
        <ArrowLeft className="h-4 w-4" /> Quay lại danh sách
      </Link>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <h1 className="text-2xl font-black text-main md:text-3xl">{report.target_display}</h1>
        <Badge variant={report.status === "VERIFIED" ? "gold" : report.status === "REJECTED" ? "neutral" : "warn"}>
          {STATUS_LABEL[report.status] || report.status}
        </Badge>
      </div>

      <GlassCard className="mt-4 p-5">
        <SectionTitle dark eyebrow="Tóm tắt" title={report.reason_label} />
        <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
          {report.amount && <div><dt className="text-muted">Số tiền</dt><dd className="font-black text-amber-500">{formatCurrency(report.amount)}</dd></div>}
          {report.transaction_date && <div><dt className="text-muted">Ngày giao dịch</dt><dd className="text-main">{new Date(report.transaction_date).toLocaleDateString("vi-VN")}</dd></div>}
          {report.product_name && <div><dt className="text-muted">Sản phẩm</dt><dd className="text-main">{report.product_name}</dd></div>}
          {report.contact_channel && <div><dt className="text-muted">Kênh liên hệ</dt><dd className="text-main">{report.contact_channel}</dd></div>}
          {report.payment_method && <div><dt className="text-muted">Hình thức</dt><dd className="text-main">{report.payment_method}</dd></div>}
          {report.region && <div><dt className="text-muted">Khu vực</dt><dd className="text-main">{report.region}</dd></div>}
          {report.seller_shop_name && <div><dt className="text-muted">Shop</dt><dd className="text-main">{report.seller_shop_name}</dd></div>}
          {report.social_link && <div className="sm:col-span-2"><dt className="text-muted">Link liên quan</dt><dd className="break-all text-main"><a href={report.social_link} target="_blank" rel="noreferrer" className="text-amber-500 underline">{report.social_link}</a></dd></div>}
          {report.related_account_display && <div className="sm:col-span-2"><dt className="text-muted">Tài khoản liên quan</dt><dd className="text-main">{report.related_account_display}</dd></div>}
        </dl>

        {report.detail && (
          <div className="mt-4">
            <p className="text-xs font-black uppercase tracking-wide text-amber-600 dark:text-amber-200/80">Mô tả sự việc</p>
            <p className="mt-2 whitespace-pre-wrap rounded-xl bg-slate-950/60 px-4 py-3 text-sm text-soft">{report.detail}</p>
          </div>
        )}

        {report.evidence_urls?.length > 0 && (
          <div className="mt-4">
            <p className="text-xs font-black uppercase tracking-wide text-amber-600 dark:text-amber-200/80">Bằng chứng đã gửi ({report.evidence_urls.length})</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {report.evidence_urls.map((url, idx) => {
                const isImage = /\.(jpe?g|png|webp|gif)$/i.test(url);
                return isImage ? (
                  <a key={idx} href={url} target="_blank" rel="noreferrer">
                    <img src={url} alt={`evidence-${idx}`} className="h-20 w-20 rounded-lg object-cover ring-1 ring-white/10 hover:ring-amber-300" />
                  </a>
                ) : (
                  <a key={idx} href={url} target="_blank" rel="noreferrer" className="rounded-lg border border-white/10 bg-slate-900 px-3 py-2 text-xs text-amber-500 hover:bg-slate-800">
                    Tệp #{idx + 1}
                  </a>
                );
              })}
            </div>
          </div>
        )}

        {(report.admin_note || report.reject_reason) && (
          <div className="mt-4 rounded-xl bg-amber-500/10 px-4 py-3 text-sm text-amber-200">
            <p className="font-black">Phản hồi từ admin</p>
            {report.admin_note && <p className="mt-1">Ghi chú: {report.admin_note}</p>}
            {report.reject_reason && <p className="mt-1 text-rose-200">Lý do từ chối: {report.reject_reason}</p>}
          </div>
        )}
      </GlassCard>

      <GlassCard className="mt-4 p-5">
        <div className="flex items-center gap-2 text-amber-500">
          <Clock className="h-5 w-5" />
          <p className="font-black uppercase tracking-wide text-xs">Lịch sử xử lý</p>
        </div>
        <ol className="mt-4 space-y-3 border-l-2 border-amber-300/30 pl-4">
          {(report.status_logs || []).map((log) => (
            <li key={log.id} className="relative">
              <span className="absolute -left-[1.4rem] top-1 flex h-4 w-4 items-center justify-center rounded-full bg-amber-400 ring-4 ring-slate-950" />
              <p className="text-sm font-bold text-main">
                {ACTION_LABEL[log.action] || log.action}{" "}
                <span className="text-muted">— {log.new_status}</span>
              </p>
              {log.note && <p className="mt-1 text-xs text-muted">{log.note}</p>}
              <p className="text-xs text-muted">{formatRelative(log.created_at)}</p>
            </li>
          ))}
          {(!report.status_logs || report.status_logs.length === 0) && (
            <li className="text-sm text-muted">Chưa có lịch sử.</li>
          )}
        </ol>
      </GlassCard>

      {canAdd && (
        <div className="mt-4">
          {!showAddForm ? (
            <button
              onClick={() => setShowAddForm(true)}
              className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-amber-300 to-orange-400 px-5 py-3 text-sm font-black text-slate-950 shadow-lg shadow-amber-500/20 hover:from-yellow-200 hover:to-amber-300"
            >
              <Plus className="h-4 w-4" /> Bổ sung bằng chứng / thông tin
            </button>
          ) : (
            <GlassCard className="p-5">
              <p className="font-black text-main">Bổ sung thông tin</p>
              {addSuccess && <p className="mt-2 rounded-xl bg-emerald-400/10 px-4 py-2 text-sm text-emerald-200">{addSuccess}</p>}
              <form onSubmit={handleAdd} className="mt-3 space-y-3">
                <TextArea
                  label="Ghi chú bổ sung"
                  value={addForm.additional_note}
                  onChange={(e) => setAddForm({ ...addForm, additional_note: e.target.value })}
                  rows={4}
                  placeholder="VD: Sau đó người này đổi sang số Zalo khác là 0988 777 666..."
                />
                <TextInput
                  label="Số tài khoản liên quan (nếu mới phát hiện)"
                  value={addForm.related_bank_account}
                  onChange={(e) => setAddForm({ ...addForm, related_bank_account: e.target.value })}
                />
                <TextInput
                  label="Link liên quan (nếu có)"
                  value={addForm.social_link}
                  onChange={(e) => setAddForm({ ...addForm, social_link: e.target.value })}
                />
                <EvidenceUploader value={addEvidence} onChange={setAddEvidence} />
                {addError && <p className="rounded-xl bg-rose-500/10 px-4 py-2 text-sm text-rose-200">{addError}</p>}
                <div className="flex gap-3">
                  <PrimaryButton type="submit" disabled={addLoading}>
                    {addLoading ? "Đang gửi..." : "Gửi bổ sung"}
                  </PrimaryButton>
                  <button
                    type="button"
                    onClick={() => setShowAddForm(false)}
                    className="rounded-2xl border border-white/10 bg-white/5 px-5 py-3 text-sm font-bold text-soft hover:bg-white/10"
                  >
                    Huỷ
                  </button>
                </div>
              </form>
            </GlassCard>
          )}
        </div>
      )}
    </section>
  );
}
