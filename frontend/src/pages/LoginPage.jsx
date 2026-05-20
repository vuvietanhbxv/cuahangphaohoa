import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { GlassCard, PrimaryButton, TextInput, SectionTitle } from "../components/ui.jsx";
import { useAuth } from "../context/AuthContext.jsx";

export default function LoginPage() {
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const redirectTo = location.state?.from || "/";

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setLoading(true);
    try {
      const u = await login(email, password);
      if (u?.role === "ADMIN" || u?.role === "SUPER_ADMIN") {
        navigate("/admin", { replace: true });
      } else {
        navigate(redirectTo, { replace: true });
      }
    } catch (err) {
      if (err.payload?.code === "ACCOUNT_LOCKED") {
        setError("Tài khoản đã bị khóa: " + (err.message || ""));
      } else {
        setError(err.message || "Đăng nhập thất bại");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="mx-auto max-w-md px-5 py-16">
      <SectionTitle dark eyebrow="Tài khoản" title="Đăng nhập TinCậy360" />
      <GlassCard className="mt-6 p-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <TextInput
            label="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoFocus
          />
          <TextInput
            label="Mật khẩu"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          {error && <p className="rounded-xl bg-rose-500/10 px-4 py-2 text-sm text-rose-200">{error}</p>}
          <PrimaryButton type="submit" disabled={loading} className="w-full">
            {loading ? "Đang đăng nhập..." : "Đăng nhập"}
          </PrimaryButton>
          <p className="text-center text-sm text-muted">
            Chưa có tài khoản?{" "}
            <Link to="/register" className="font-bold text-amber-500 hover:text-amber-200">
              Đăng ký ngay
            </Link>
          </p>
        </form>
      </GlassCard>
    </section>
  );
}
