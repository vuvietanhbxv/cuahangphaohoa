import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { GlassCard, PrimaryButton, TextInput, SectionTitle } from "../components/ui.jsx";
import { useAuth } from "../context/AuthContext.jsx";

export default function RegisterPage() {
  const { register } = useAuth();
  const [form, setForm] = useState({ email: "", password: "", displayName: "", phone: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const update = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setLoading(true);
    try {
      await register(form);
      navigate("/", { replace: true });
    } catch (err) {
      setError(err.message || "Đăng ký thất bại");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="mx-auto max-w-md px-5 py-16">
      <SectionTitle dark eyebrow="Tham gia cộng đồng" title="Đăng ký TinCậy360" />
      <GlassCard className="mt-6 p-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <TextInput label="Tên hiển thị" value={form.displayName} onChange={update("displayName")} required />
          <TextInput label="Email" type="email" value={form.email} onChange={update("email")} required />
          <TextInput label="Số điện thoại (tuỳ chọn)" value={form.phone} onChange={update("phone")} />
          <TextInput
            label="Mật khẩu (≥6 ký tự)"
            type="password"
            value={form.password}
            onChange={update("password")}
            required
            minLength={6}
          />
          {error && <p className="rounded-xl bg-rose-500/10 px-4 py-2 text-sm text-rose-200">{error}</p>}
          <PrimaryButton type="submit" disabled={loading} className="w-full">
            {loading ? "Đang tạo tài khoản..." : "Tạo tài khoản"}
          </PrimaryButton>
          <p className="text-center text-sm text-muted">
            Đã có tài khoản?{" "}
            <Link to="/login" className="font-bold text-amber-500 hover:text-amber-200">
              Đăng nhập
            </Link>
          </p>
        </form>
      </GlassCard>
    </section>
  );
}
