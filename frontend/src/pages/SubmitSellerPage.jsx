import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api/client.js";
import { GlassCard, PrimaryButton, SectionTitle, TextArea, TextInput } from "../components/ui.jsx";

export default function SubmitSellerPage() {
  const [form, setForm] = useState({
    name: "",
    phone: "",
    bankAccount: "",
    bankName: "",
    location: "",
    description: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();

  const update = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await api.post("/sellers", form, { auth: true });
      setSuccess(true);
      setForm({ name: "", phone: "", bankAccount: "", bankName: "", location: "", description: "" });
    } catch (err) {
      setError(err.message || "Gửi yêu cầu thất bại");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="mx-auto max-w-2xl px-5 py-12">
      <SectionTitle
        dark
        eyebrow="Đóng góp cộng đồng"
        title="Đăng ký người bán uy tín"
        desc="Hồ sơ sẽ chờ admin xác minh giấy tờ và lịch sử giao dịch trước khi hiển thị."
      />
      <GlassCard className="mt-6 p-6">
        {success && (
          <div className="mb-4 rounded-xl bg-emerald-400/10 px-4 py-3 text-sm text-emerald-200">
            Đã gửi! Hồ sơ đang chờ duyệt.
          </div>
        )}
        <form onSubmit={handleSubmit} className="space-y-4">
          <TextInput label="Tên cửa hàng" value={form.name} onChange={update("name")} required />
          <TextInput label="Số điện thoại" value={form.phone} onChange={update("phone")} required />
          <TextInput
            label="Số tài khoản (tuỳ chọn)"
            value={form.bankAccount}
            onChange={update("bankAccount")}
          />
          <TextInput
            label="Tên ngân hàng (tuỳ chọn)"
            value={form.bankName}
            onChange={update("bankName")}
          />
          <TextInput
            label="Địa điểm"
            value={form.location}
            onChange={update("location")}
            placeholder="VD: Hà Nội"
            required
          />
          <TextArea
            label="Mô tả (tuỳ chọn)"
            value={form.description}
            onChange={update("description")}
            rows={4}
          />
          {error && <p className="rounded-xl bg-rose-500/10 px-4 py-2 text-sm text-rose-200">{error}</p>}
          <div className="flex gap-3">
            <PrimaryButton type="submit" disabled={loading}>
              {loading ? "Đang gửi..." : "Gửi đăng ký"}
            </PrimaryButton>
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="rounded-2xl border border-white/10 bg-white/5 px-5 py-3 text-sm font-bold text-soft hover:bg-white/10"
            >
              Huỷ
            </button>
          </div>
        </form>
      </GlassCard>
    </section>
  );
}
