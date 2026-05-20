import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  ShieldCheck,
  ChevronRight,
  Eye,
} from "lucide-react";
import { api } from "../api/client.js";
import {
  GlassCard,
  PrimaryButton,
  SectionTitle,
  SelectBox,
  TextArea,
  TextInput,
} from "../components/ui.jsx";
import EvidenceUploader from "../components/EvidenceUploader.jsx";
import CaptchaInput from "../components/CaptchaInput.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { formatCurrency } from "../lib/format.js";

const STEPS = [
  { id: 1, label: "Loại rủi ro" },
  { id: 2, label: "Thông tin người bán" },
  { id: 3, label: "Giao dịch & bằng chứng" },
  { id: 4, label: "Xác nhận" },
];

const MIN_DETAIL = 30;

const TARGET_OPTIONS = [
  { value: "phone", label: "Số điện thoại" },
  { value: "bank_account", label: "Số tài khoản ngân hàng" },
];

const LEVEL_OPTIONS = [
  { value: "low", label: "Rủi ro thấp" },
  { value: "medium", label: "Rủi ro trung bình" },
  { value: "high", label: "Rủi ro cao" },
];

function StepIndicator({ current }) {
  return (
    <ol className="flex flex-wrap items-center gap-2 text-sm">
      {STEPS.map((step, idx) => {
        const isDone = current > step.id;
        const isActive = current === step.id;
        return (
          <li key={step.id} className="flex items-center gap-2">
            <span
              className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-black ${
                isDone
                  ? "bg-emerald-400/20 text-emerald-200 ring-1 ring-emerald-400/40"
                  : isActive
                  ? "bg-gradient-to-r from-amber-300 to-orange-400 text-slate-950"
                  : "bg-slate-800 text-muted"
              }`}
            >
              {isDone ? <CheckCircle2 className="h-4 w-4" /> : step.id}
            </span>
            <span className={`font-bold ${isActive ? "text-amber-200" : isDone ? "text-emerald-300" : "text-muted"}`}>
              {step.label}
            </span>
            {idx < STEPS.length - 1 && <ChevronRight className="h-4 w-4 text-slate-700" />}
          </li>
        );
      })}
    </ol>
  );
}

function Step1Reason({ reasonOptions, form, update, next }) {
  return (
    <div className="space-y-4">
      <SectionTitle dark eyebrow="Bước 1/4" title="Bạn muốn báo cáo điều gì?" desc="Chọn loại rủi ro phù hợp nhất với sự việc." />
      <div className="grid gap-3 sm:grid-cols-2">
        {reasonOptions.map((opt) => {
          const active = form.reason_code === opt.code;
          return (
            <button
              key={opt.code}
              type="button"
              onClick={() => update("reason_code", opt.code)}
              className={`rounded-2xl border p-4 text-left transition ${
                active
                  ? "border-amber-300 bg-amber-300/10 text-amber-100 ring-2 ring-amber-300/40"
                  : "border-white/10 bg-slate-950/60 text-soft hover:bg-slate-900"
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="font-black">{opt.label}</span>
                {active && <CheckCircle2 className="h-5 w-5 text-amber-500" />}
              </div>
              <p className="mt-1 text-xs text-muted">Mã: {opt.code}</p>
              <p className="mt-1 text-xs uppercase tracking-wide text-muted">Mức độ: {opt.severity}</p>
            </button>
          );
        })}
      </div>
      <div className="flex justify-end pt-2">
        <PrimaryButton type="button" onClick={next} disabled={!form.reason_code}>
          Tiếp tục <ArrowRight className="h-4 w-4" />
        </PrimaryButton>
      </div>
    </div>
  );
}

function Step2Seller({ form, update, prev, next, existingHint }) {
  const ok = form.value.replace(/\D/g, "").length >= 4;
  return (
    <div className="space-y-4">
      <SectionTitle dark eyebrow="Bước 2/4" title="Thông tin người bán" desc="Nhập ít nhất số điện thoại hoặc số tài khoản. Các thông tin khác tuỳ chọn." />

      <SelectBox label="Loại thông tin chính *" value={form.type} onChange={(v) => update("type", v)} options={TARGET_OPTIONS} />
      <TextInput
        label={form.type === "phone" ? "Số điện thoại *" : "Số tài khoản *"}
        value={form.value}
        onChange={(e) => update("value", e.target.value)}
        placeholder={form.type === "phone" ? "VD: 0378 123 456" : "VD: 9704 1234 5678 999"}
        required
      />

      {existingHint && (
        <div className="rounded-2xl border border-amber-400/30 bg-amber-400/10 p-4 text-sm text-amber-100">
          <div className="flex items-start gap-2">
            <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0 text-amber-500" />
            <div>
              <p className="font-black">{existingHint.title}</p>
              <p className="mt-1 text-soft">{existingHint.message}</p>
            </div>
          </div>
        </div>
      )}

      {form.type === "bank_account" && (
        <div className="grid gap-3 sm:grid-cols-2">
          <TextInput label="Ngân hàng" value={form.bank_name} onChange={(e) => update("bank_name", e.target.value)} placeholder="VD: Vietcombank" />
          <TextInput label="Tên chủ tài khoản" value={form.bank_owner_name} onChange={(e) => update("bank_owner_name", e.target.value)} placeholder="VD: Nguyễn Văn H" />
        </div>
      )}

      <div className="grid gap-3 sm:grid-cols-2">
        <TextInput label="Tên người bán (cá nhân)" value={form.seller_name} onChange={(e) => update("seller_name", e.target.value)} placeholder="Nếu biết" />
        <TextInput label="Tên shop / cửa hàng" value={form.seller_shop_name} onChange={(e) => update("seller_shop_name", e.target.value)} placeholder="VD: Pháo hoa giá rẻ 24h" />
      </div>
      <TextInput label="Link liên hệ (Facebook / Zalo / Shopee...)" value={form.social_link} onChange={(e) => update("social_link", e.target.value)} placeholder="https://..." />
      {form.type === "phone" && (
        <TextInput label="Số tài khoản liên quan (nếu có)" value={form.related_bank_account} onChange={(e) => update("related_bank_account", e.target.value)} placeholder="Nếu bạn biết số tài khoản nhận tiền" />
      )}

      <div className="flex justify-between pt-2">
        <button type="button" onClick={prev} className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-5 py-3 text-sm font-bold text-soft hover:bg-white/10">
          <ArrowLeft className="h-4 w-4" /> Quay lại
        </button>
        <PrimaryButton type="button" onClick={next} disabled={!ok}>
          Tiếp tục <ArrowRight className="h-4 w-4" />
        </PrimaryButton>
      </div>
    </div>
  );
}

function Step3Transaction({ form, update, prev, next, channels, payments, regions, evidence, setEvidence }) {
  const detailLen = (form.detail || "").length;
  const ok = detailLen >= MIN_DETAIL;
  return (
    <div className="space-y-4">
      <SectionTitle dark eyebrow="Bước 3/4" title="Thông tin giao dịch & bằng chứng" desc={`Mô tả ngắn gọn sự việc (tối thiểu ${MIN_DETAIL} ký tự).`} />

      <div className="grid gap-3 sm:grid-cols-2">
        <TextInput label="Sản phẩm" value={form.product_name} onChange={(e) => update("product_name", e.target.value)} placeholder="VD: Pháo hoa giàn 36 ống Z121" />
        <TextInput
          label="Số tiền (VND)"
          type="number"
          min="1000"
          value={form.amount}
          onChange={(e) => update("amount", e.target.value)}
          placeholder="500000"
        />
      </div>
      <div className="grid gap-3 sm:grid-cols-3">
        <TextInput label="Ngày giao dịch" type="date" value={form.transaction_date} onChange={(e) => update("transaction_date", e.target.value)} />
        <SelectBox
          label="Hình thức thanh toán"
          value={form.payment_method}
          onChange={(v) => update("payment_method", v)}
          options={[{ value: "", label: "— Chọn —" }, ...payments.map((p) => ({ value: p.code, label: p.label }))]}
        />
        <SelectBox
          label="Kênh liên hệ"
          value={form.contact_channel}
          onChange={(v) => update("contact_channel", v)}
          options={[{ value: "", label: "— Chọn —" }, ...channels.map((c) => ({ value: c.code, label: c.label }))]}
        />
      </div>
      <SelectBox
        label="Khu vực"
        value={form.region}
        onChange={(v) => update("region", v)}
        options={[{ value: "", label: "— Không rõ —" }, ...regions.map((r) => ({ value: r.code, label: r.label }))]}
      />
      <TextArea
        label={`Mô tả sự việc * (${detailLen}/${MIN_DETAIL} ký tự tối thiểu)`}
        value={form.detail}
        onChange={(e) => update("detail", e.target.value)}
        rows={6}
        placeholder="VD: Tôi chuyển cọc 500.000đ vào ngày 18/05. Sau khi nhận tiền, người bán không phản hồi và chặn Zalo."
        error={detailLen > 0 && detailLen < MIN_DETAIL ? `Cần thêm ${MIN_DETAIL - detailLen} ký tự` : ""}
      />
      <SelectBox
        label="Mức rủi ro đề xuất"
        value={form.risk_level_input}
        onChange={(v) => update("risk_level_input", v)}
        options={LEVEL_OPTIONS}
      />
      <EvidenceUploader value={evidence} onChange={setEvidence} />

      <div className="flex justify-between pt-2">
        <button type="button" onClick={prev} className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-5 py-3 text-sm font-bold text-soft hover:bg-white/10">
          <ArrowLeft className="h-4 w-4" /> Quay lại
        </button>
        <PrimaryButton type="button" onClick={next} disabled={!ok}>
          Tiếp tục <ArrowRight className="h-4 w-4" />
        </PrimaryButton>
      </div>
    </div>
  );
}

function Step4Review({ form, evidence, reasonLabel, needCaptcha, captcha, setCaptcha, reloadCaptcha, ack, setAck, prev, submit, loading, error }) {
  return (
    <div className="space-y-4">
      <SectionTitle dark eyebrow="Bước 4/4" title="Xác nhận và gửi" desc="Vui lòng kiểm tra lại trước khi gửi. Báo cáo sẽ vào hàng chờ duyệt." />

      <div className="rounded-2xl border border-white/10 bg-slate-950/60 p-4">
        <dl className="space-y-2 text-sm">
          <div className="flex justify-between gap-3"><dt className="text-muted">Loại báo cáo</dt><dd className="font-bold text-main">{reasonLabel}</dd></div>
          <div className="flex justify-between gap-3"><dt className="text-muted">{form.type === "phone" ? "Số điện thoại" : "Số tài khoản"}</dt><dd className="font-bold text-main">{form.value}</dd></div>
          {form.bank_name && <div className="flex justify-between"><dt className="text-muted">Ngân hàng</dt><dd className="text-main">{form.bank_name}</dd></div>}
          {form.seller_shop_name && <div className="flex justify-between"><dt className="text-muted">Shop</dt><dd className="text-main">{form.seller_shop_name}</dd></div>}
          {form.product_name && <div className="flex justify-between"><dt className="text-muted">Sản phẩm</dt><dd className="text-main">{form.product_name}</dd></div>}
          {form.amount && <div className="flex justify-between"><dt className="text-muted">Số tiền</dt><dd className="font-bold text-amber-500">{formatCurrency(Number(form.amount))}</dd></div>}
          {form.transaction_date && <div className="flex justify-between"><dt className="text-muted">Ngày giao dịch</dt><dd className="text-main">{form.transaction_date}</dd></div>}
          <div className="flex justify-between"><dt className="text-muted">Bằng chứng</dt><dd className="text-main">{evidence.length} tệp</dd></div>
          <div className="flex justify-between"><dt className="text-muted">Mức rủi ro đề xuất</dt><dd className="text-main">{form.risk_level_input}</dd></div>
        </dl>
        {form.detail && (
          <details className="mt-3 cursor-pointer rounded-xl bg-slate-900 p-3 text-sm text-soft" open>
            <summary className="cursor-pointer font-bold text-amber-500">Mô tả sự việc</summary>
            <p className="mt-2 whitespace-pre-wrap">{form.detail}</p>
          </details>
        )}
      </div>

      <label className="flex items-start gap-3 rounded-2xl border border-white/10 bg-slate-950/60 p-4 cursor-pointer">
        <input type="checkbox" checked={ack} onChange={(e) => setAck(e.target.checked)} className="mt-1 h-4 w-4 accent-amber-400" />
        <span className="text-sm text-soft">
          Tôi cam kết thông tin cung cấp là <b>đúng sự thật</b> và <b>chịu trách nhiệm</b> về nội dung báo cáo.
          Tôi hiểu rằng báo cáo sai sự thật có thể bị từ chối hoặc khoá tài khoản.
        </span>
      </label>

      {needCaptcha && <CaptchaInput key={reloadCaptcha} value={captcha} onChange={setCaptcha} />}

      {error && <p className="rounded-xl bg-rose-500/10 px-4 py-2 text-sm text-rose-200">{error}</p>}

      <div className="flex justify-between pt-2">
        <button type="button" onClick={prev} className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-5 py-3 text-sm font-bold text-soft hover:bg-white/10">
          <ArrowLeft className="h-4 w-4" /> Quay lại
        </button>
        <PrimaryButton type="button" onClick={submit} disabled={!ack || loading}>
          {loading ? "Đang gửi..." : "Gửi báo cáo"}
        </PrimaryButton>
      </div>
    </div>
  );
}

export default function SubmitReportPage() {
  const [searchParams] = useSearchParams();
  const [step, setStep] = useState(1);
  const [reasonOptions, setReasonOptions] = useState([]);
  const [channels, setChannels] = useState([]);
  const [payments, setPayments] = useState([]);
  const [regions, setRegions] = useState([]);
  const [form, setForm] = useState({
    type: searchParams.get("type") || "phone",
    value: searchParams.get("value") || "",
    reason_code: "",
    reason_text: "",
    detail: "",
    amount: "",
    transaction_date: "",
    payment_method: "",
    contact_channel: "",
    product_name: "",
    seller_name: "",
    seller_shop_name: "",
    bank_owner_name: "",
    social_link: "",
    region: "",
    related_bank_account: "",
    bank_name: "",
    risk_level_input: "medium",
  });
  const [evidence, setEvidence] = useState([]);
  const [captcha, setCaptcha] = useState({ token: "", answer: "" });
  const [ack, setAck] = useState(false);
  const { user } = useAuth();
  const needCaptcha = (user?.trustScore || 0) < 30;
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [submitted, setSubmitted] = useState(null);
  const [existingHint, setExistingHint] = useState(null);
  const [reloadCaptcha, setReloadCaptcha] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    api.get("/lookup/reasons").then((data) => {
      setReasonOptions(data.items || []);
      setChannels(data.contact_channels || []);
      setPayments(data.payment_methods || []);
      setRegions(data.regions || []);
    });
  }, []);

  const update = (key, value) => setForm((f) => ({ ...f, [key]: value }));

  // Khi vào bước 2 (hoặc value đổi), check entity đã có cảnh báo chưa
  useEffect(() => {
    if (step !== 2 || form.value.replace(/\D/g, "").length < 4) {
      setExistingHint(null);
      return;
    }
    const t = setTimeout(() => {
      api
        .post("/lookup", { type: form.type, value: form.value })
        .then((data) => {
          if (data.status === "danger" || data.status === "watchlist") {
            setExistingHint({
              title: `Số này đã có ${data.report_count} báo cáo trước đó.`,
              message: `Mức rủi ro hiện tại: ${data.risk_level_label}. Bạn vẫn có thể gửi báo cáo mới để bổ sung bằng chứng.`,
            });
          } else if (data.status === "verified_seller") {
            setExistingHint({
              title: "Số này thuộc người bán đã được xác minh",
              message: `${data.trusted_seller.name} · ${data.trusted_seller.location}. Hãy chắc chắn đây thật sự là lừa đảo trước khi báo cáo.`,
            });
          } else {
            setExistingHint(null);
          }
        })
        .catch(() => setExistingHint(null));
    }, 500);
    return () => clearTimeout(t);
  }, [step, form.value, form.type]);

  const reasonLabelFinal = useMemo(
    () => reasonOptions.find((r) => r.code === form.reason_code)?.label || form.reason_code,
    [reasonOptions, form.reason_code]
  );

  const submit = async () => {
    setError("");
    setLoading(true);
    try {
      const payload = {
        type: form.type,
        value: form.value,
        reason_code: form.reason_code,
        reason_text: form.reason_text || undefined,
        detail: form.detail || undefined,
        amount: form.amount ? Number(form.amount) : undefined,
        transaction_date: form.transaction_date || undefined,
        payment_method: form.payment_method || undefined,
        contact_channel: form.contact_channel || undefined,
        product_name: form.product_name || undefined,
        seller_name: form.seller_name || undefined,
        seller_shop_name: form.seller_shop_name || undefined,
        bank_owner_name: form.bank_owner_name || undefined,
        social_link: form.social_link || undefined,
        region: form.region || undefined,
        related_bank_account: form.related_bank_account || undefined,
        bank_name: form.bank_name || undefined,
        risk_level_input: form.risk_level_input,
        evidence_urls: evidence.map((e) => e.url),
        acknowledged: ack,
      };
      if (needCaptcha) {
        payload.captcha_token = captcha.token;
        payload.captcha_answer = captcha.answer;
      }
      const res = await api.post("/reports", payload, { auth: true });
      setSubmitted(res);
    } catch (err) {
      const code = err.payload?.code;
      if (code === "CAPTCHA_FAILED") {
        setReloadCaptcha((n) => n + 1);
      }
      if (code === "DUPLICATE_REPORT") {
        setError(err.payload?.message + " Mở 'Báo cáo của tôi' để bổ sung bằng chứng.");
      } else {
        setError(err.message || "Gửi báo cáo thất bại");
      }
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    const reportId = submitted.report_id;
    const code = `RP-${new Date().toISOString().slice(0, 10).replace(/-/g, "")}-${String(reportId).padStart(4, "0")}`;
    return (
      <section className="mx-auto max-w-2xl px-5 py-16">
        <GlassCard className="border border-emerald-400/30 p-8 text-center">
          <CheckCircle2 className="mx-auto h-12 w-12 text-emerald-300" />
          <h2 className="mt-4 text-2xl font-black text-main">Báo cáo đã được gửi</h2>
          <p className="mt-2 text-soft">Mã báo cáo: <b className="text-amber-500">{code}</b></p>
          <p className="mt-1 text-muted">Trạng thái: Chờ kiểm duyệt</p>
          <p className="mt-3 text-sm text-muted">Thời gian xử lý dự kiến: 24 – 72 giờ.</p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <PrimaryButton type="button" onClick={() => navigate("/my-reports")}>
              Xem báo cáo của tôi
            </PrimaryButton>
            <button
              type="button"
              onClick={() => navigate(`/my-reports/${reportId}`)}
              className="rounded-2xl border border-white/10 bg-white/5 px-5 py-3 text-sm font-bold text-soft hover:bg-white/10"
            >
              Bổ sung bằng chứng
            </button>
            <button
              type="button"
              onClick={() => navigate("/")}
              className="rounded-2xl border border-white/10 bg-white/5 px-5 py-3 text-sm font-bold text-soft hover:bg-white/10"
            >
              Về trang chủ
            </button>
          </div>
        </GlassCard>
      </section>
    );
  }

  return (
    <section className="mx-auto max-w-5xl px-5 py-12">
      <SectionTitle dark eyebrow="Đóng góp cộng đồng" title="Báo cáo lừa đảo" />
      <div className="mt-6 grid gap-6 lg:grid-cols-[1.4fr_0.6fr]">
        <GlassCard className="p-6">
          <StepIndicator current={step} />
          <div className="mt-6">
            {step === 1 && <Step1Reason reasonOptions={reasonOptions} form={form} update={update} next={() => setStep(2)} />}
            {step === 2 && <Step2Seller form={form} update={update} prev={() => setStep(1)} next={() => setStep(3)} existingHint={existingHint} />}
            {step === 3 && <Step3Transaction form={form} update={update} prev={() => setStep(2)} next={() => setStep(4)} channels={channels} payments={payments} regions={regions} evidence={evidence} setEvidence={setEvidence} />}
            {step === 4 && <Step4Review form={form} evidence={evidence} reasonLabel={reasonLabelFinal} needCaptcha={needCaptcha} captcha={captcha} setCaptcha={setCaptcha} reloadCaptcha={reloadCaptcha} ack={ack} setAck={setAck} prev={() => setStep(3)} submit={submit} loading={loading} error={error} />}
          </div>
        </GlassCard>

        <aside>
          <GlassCard className="p-5">
            <div className="flex items-center gap-2 text-amber-500">
              <ShieldCheck className="h-5 w-5" />
              <p className="font-black uppercase tracking-wide text-xs">Hướng dẫn & lưu ý</p>
            </div>
            <ul className="mt-4 list-disc space-y-2 pl-5 text-sm text-soft">
              <li>Báo cáo của bạn sẽ được <b>kiểm duyệt</b> trước khi hiển thị công khai.</li>
              <li>Vui lòng cung cấp <b>bằng chứng rõ ràng</b>: ảnh chuyển khoản, đoạn chat, ảnh bài đăng.</li>
              <li>Không đăng <b>thông tin cá nhân không liên quan</b> (CCCD, địa chỉ riêng tư).</li>
              <li><b>Báo cáo sai sự thật</b> có thể bị từ chối hoặc khoá tài khoản.</li>
              <li>Giới hạn: <b>5 báo cáo / 24 giờ</b>, tối đa <b>3 lần</b> cùng 1 đối tượng trong 30 ngày.</li>
            </ul>
          </GlassCard>
          <GlassCard className="mt-4 p-5">
            <div className="flex items-center gap-2 text-amber-500">
              <Eye className="h-5 w-5" />
              <p className="font-black uppercase tracking-wide text-xs">Quy tắc hiển thị</p>
            </div>
            <p className="mt-3 text-sm text-soft">
              Số điện thoại / tài khoản sẽ được <b>che một phần</b> khi hiển thị công khai.
              Ảnh bằng chứng <b>chỉ admin xem được</b> ở giai đoạn đầu.
            </p>
          </GlassCard>
        </aside>
      </div>
    </section>
  );
}
