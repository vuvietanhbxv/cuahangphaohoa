import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

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
  if (requireRole && user.role !== requireRole) {
    return (
      <div className="mx-auto max-w-xl px-5 py-16 text-center text-soft">
        <h2 className="text-2xl font-black">Không đủ quyền truy cập</h2>
        <p className="mt-2 text-muted">Trang này chỉ dành cho quản trị viên.</p>
      </div>
    );
  }
  return children;
}
