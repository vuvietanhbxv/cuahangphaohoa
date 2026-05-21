import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { KeyRound, Eye, EyeOff } from "lucide-react";
import { useAuth } from "../context/AuthContext.jsx";
import { GlassCard, TextInput, PrimaryButton } from "../components/ui.jsx";

export default function ChangePasswordPage() {
  const { user, changePassword, logout } = useAuth();
  const navigate = useNavigate();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const isMandatory = user?.mustChangePassword;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (newPassword.length < 6) {
      setError("Mật khẩu mới phải có ít nhất 6 ký tự.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("Xác nhận mật khẩu không khớp.");
      return;
    }

    setSaving(true);
    try {
      await changePassword(currentPassword, newPassword);
      navigate("/");
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex min-h-[60vh] items-center justify-center px-4 py-12">
      <GlassCard className="w-full max-w-md p-6">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-amber-500/15">
            <KeyRound className="h-7 w-7 text-amber-500" />
          </div>
          <h1 className="text-2xl font-black text-main">Đổi mật khẩu</h1>
          {isMandatory && (
            <p className="mt-2 rounded-xl bg-amber-500/10 px-3 py-2 text-sm text-amber-500">
              Bạn cần đổi mật khẩu trước khi tiếp tục sử dụng hệ thống.
            </p>
          )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative">
            <TextInput
              label="Mật khẩu hiện tại"
              type={showCurrent ? "text" : "password"}
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              required
            />
            <button
              type="button"
              onClick={() => setShowCurrent(!showCurrent)}
              className="absolute right-3 top-9 text-muted hover:text-amber-500"
            >
              {showCurrent ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>

          <div className="relative">
            <TextInput
              label="Mật khẩu mới"
              type={showNew ? "text" : "password"}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
            />
            <button
              type="button"
              onClick={() => setShowNew(!showNew)}
              className="absolute right-3 top-9 text-muted hover:text-amber-500"
            >
              {showNew ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>

          <TextInput
            label="Xác nhận mật khẩu mới"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
          />

          {error && <p className="rounded-xl bg-rose-500/10 px-3 py-2 text-sm text-rose-400">{error}</p>}

          <PrimaryButton type="submit" disabled={saving} className="w-full">
            {saving ? "Đang xử lý..." : "Đổi mật khẩu"}
          </PrimaryButton>

          {isMandatory && (
            <button
              type="button"
              onClick={logout}
              className="w-full rounded-xl border border-line px-4 py-2 text-sm font-bold text-muted hover:text-rose-500"
            >
              Đăng xuất
            </button>
          )}
        </form>
      </GlassCard>
    </div>
  );
}
