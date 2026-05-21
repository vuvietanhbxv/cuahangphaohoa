import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

const ADMIN_ROLES = ["ADMIN", "SUPER_ADMIN", "SELLER_MANAGER"];

export default function RequireAuth({ children, requireRole }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center text-muted">
        Đang kiểm tra phiên đăng nhập...
      </div>
    );
  }
  if (!user) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }

  // Bắt buộc đổi mật khẩu (trừ khi đang ở trang change-password)
  if (user.mustChangePassword && location.pathname !== "/change-password") {
    return <Navigate to="/change-password" replace />;
  }

  if (requireRole === "ADMIN" && !ADMIN_ROLES.includes(user.role)) {
    return (
      <div className="mx-auto max-w-xl px-5 py-16 text-center text-soft">
        <h2 className="text-2xl font-black">Không đủ quyền truy cập</h2>
        <p className="mt-2 text-muted">Trang này chỉ dành cho quản trị viên.</p>
      </div>
    );
  }
  if (requireRole && requireRole !== "ADMIN" && user.role !== requireRole) {
    return (
      <div className="mx-auto max-w-xl px-5 py-16 text-center text-soft">
        <h2 className="text-2xl font-black">Không đủ quyền truy cập</h2>
        <p className="mt-2 text-muted">Bạn không có quyền xem trang này.</p>
      </div>
    );
  }
  return children;
}
