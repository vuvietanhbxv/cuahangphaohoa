import { useEffect, useState } from "react";
import { Link, NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  FileWarning,
  ShieldAlert,
  Store,
  TrendingUp,
  Package,
  Users,
  ScrollText,
  LogOut,
  Bell,
  ShieldCheck,
  Home,
  Menu,
  X,
  Palette,
  Image as ImageIcon,
  LayoutTemplate,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import { useAuth } from "../context/AuthContext.jsx";
import { api } from "../api/client.js";

const NAV = [
  { to: "/admin",          icon: LayoutDashboard, label: "Tổng quan",          end: true },
  { to: "/admin/reports",  icon: FileWarning,     label: "Báo cáo lừa đảo" },
  { to: "/admin/blacklist",icon: ShieldAlert,     label: "Cảnh báo công khai" },
  { to: "/admin/sellers",  icon: Store,           label: "Người bán uy tín" },
  { to: "/admin/stores",   icon: Store,           label: "Hệ thống cửa hàng" },
  { to: "/admin/prices",   icon: TrendingUp,      label: "Bảng giá pháo hoa" },
  { to: "/admin/products", icon: Package,         label: "Sản phẩm" },
  {
    label: "Giao diện website",
    icon: Palette,
    children: [
      { to: "/admin/cms/branding",        icon: Palette,        label: "Cài đặt thương hiệu" },
      { to: "/admin/cms/themes",          icon: LayoutTemplate, label: "Mẫu giao diện" },
      { to: "/admin/cms/banners",         icon: LayoutTemplate, label: "Banner trang chủ" },
      { to: "/admin/cms/seller-branding", icon: Store,          label: "Hồ sơ cửa hàng" },
      { to: "/admin/cms/media",           icon: ImageIcon,      label: "Thư viện media" },
    ],
  },
  { to: "/admin/users",    icon: Users,           label: "Người dùng" },
  { to: "/admin/activity", icon: ScrollText,      label: "Lịch sử thao tác" },
];

function NavGroup({ item, onSelect }) {
  const location = useLocation();
  const isAnyChildActive = item.children.some((c) => location.pathname.startsWith(c.to));
  const [open, setOpen] = useState(isAnyChildActive);
  const Icon = item.icon;

  return (
    <div className="mb-1">
      <button
        onClick={() => setOpen(!open)}
        className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-bold transition ${
          isAnyChildActive ? "text-amber-200" : "text-slate-300 hover:bg-white/5 hover:text-amber-200"
        }`}
      >
        <Icon className="h-4 w-4 flex-shrink-0" />
        <span className="flex-1 text-left">{item.label}</span>
        {open ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
      </button>
      {open && (
        <div className="ml-3 mt-1 space-y-1 border-l border-white/10 pl-3">
          {item.children.map((c) => {
            const CIcon = c.icon;
            return (
              <NavLink
                key={c.to}
                to={c.to}
                onClick={onSelect}
                className={({ isActive }) =>
                  `flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-bold transition ${
                    isActive
                      ? "bg-amber-300/15 text-amber-200 ring-1 ring-amber-300/30"
                      : "text-slate-400 hover:bg-white/5 hover:text-amber-200"
                  }`
                }
              >
                <CIcon className="h-3.5 w-3.5 flex-shrink-0" />
                <span>{c.label}</span>
              </NavLink>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function AdminLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    api.get("/admin/stats", { auth: true }).then(setStats).catch(() => {});
  }, []);

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const totalPending =
    (stats?.pendingReports || 0) +
    (stats?.pendingSellers || 0) +
    (stats?.pendingPrices || 0) +
    (stats?.pendingReviews || 0);

  return (
    <div className="min-h-screen bg-[#050716] text-slate-100">
      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-[260px] transform border-r border-white/10 bg-[#0f172a] transition-transform lg:translate-x-0 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
          <Link to="/admin" className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-amber-300 to-orange-500 text-slate-950 shadow-lg shadow-amber-500/20">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm font-black tracking-tight">TinCậy<span className="text-amber-300">360</span></p>
              <p className="text-[10px] uppercase tracking-widest text-amber-300/70">Admin Panel</p>
            </div>
          </Link>
          <button className="lg:hidden" onClick={() => setOpen(false)}>
            <X className="h-5 w-5 text-slate-400" />
          </button>
        </div>

        <nav className="px-3 py-4">
          {NAV.map((item, idx) => {
            if (item.children) {
              return <NavGroup key={"g-" + idx} item={item} onSelect={() => setOpen(false)} />;
            }
            const { to, icon: Icon, label, end } = item;
            return (
              <NavLink
                key={to}
                to={to}
                end={end}
                onClick={() => setOpen(false)}
                className={({ isActive }) =>
                  `mb-1 flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-bold transition ${
                    isActive
                      ? "bg-amber-300/15 text-amber-200 ring-1 ring-amber-300/30"
                      : "text-slate-300 hover:bg-white/5 hover:text-amber-200"
                  }`
                }
              >
                <Icon className="h-4 w-4 flex-shrink-0" />
                <span>{label}</span>
                {to === "/admin/reports" && stats?.pendingReports > 0 && (
                  <span className="ml-auto rounded-full bg-rose-500/20 px-2 py-0.5 text-xs font-black text-rose-200">
                    {stats.pendingReports}
                  </span>
                )}
                {to === "/admin/sellers" && stats?.pendingSellers > 0 && (
                  <span className="ml-auto rounded-full bg-amber-400/20 px-2 py-0.5 text-xs font-black text-amber-200">
                    {stats.pendingSellers}
                  </span>
                )}
                {to === "/admin/prices" && stats?.pendingPrices > 0 && (
                  <span className="ml-auto rounded-full bg-amber-400/20 px-2 py-0.5 text-xs font-black text-amber-200">
                    {stats.pendingPrices}
                  </span>
                )}
              </NavLink>
            );
          })}
        </nav>

        <div className="absolute inset-x-0 bottom-0 border-t border-white/10 px-3 py-3 text-xs">
          <Link
            to="/"
            className="flex items-center gap-2 rounded-xl px-3 py-2 text-slate-400 hover:bg-white/5 hover:text-amber-200"
          >
            <Home className="h-4 w-4" /> Quay về trang public
          </Link>
        </div>
      </aside>

      {/* Main */}
      <div className="lg:pl-[260px]">
        {/* Topbar */}
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-white/10 bg-[#0f172a]/90 px-5 backdrop-blur-xl">
          <div className="flex items-center gap-3">
            <button className="rounded-lg p-2 hover:bg-white/5 lg:hidden" onClick={() => setOpen(true)}>
              <Menu className="h-5 w-5" />
            </button>
            <p className="text-sm font-bold text-slate-200">Quản trị TinCậy360</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative">
              <Bell className="h-5 w-5 text-slate-400" />
              {totalPending > 0 && (
                <span className="absolute -right-1.5 -top-1.5 rounded-full bg-rose-500 px-1.5 text-[10px] font-black text-white">
                  {totalPending}
                </span>
              )}
            </div>
            <div className="hidden items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-1.5 sm:flex">
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-amber-300 to-orange-500 text-xs font-black text-slate-950">
                {user?.displayName?.[0] || "A"}
              </div>
              <div className="text-xs">
                <p className="font-black">{user?.displayName}</p>
                <p className="text-amber-300/80">{user?.role}</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              title="Đăng xuất"
              className="rounded-lg p-2 text-slate-400 hover:bg-white/5 hover:text-amber-200"
            >
              <LogOut className="h-5 w-5" />
            </button>
          </div>
        </header>

        <main className="min-h-[calc(100vh-4rem)] p-5 lg:p-8">
          <Outlet />
        </main>
      </div>

      {/* Backdrop mobile */}
      {open && (
        <div
          className="fixed inset-0 z-30 bg-black/40 lg:hidden"
          onClick={() => setOpen(false)}
        />
      )}
    </div>
  );
}
