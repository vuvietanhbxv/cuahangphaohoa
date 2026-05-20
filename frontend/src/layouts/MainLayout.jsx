import { useEffect, useState } from "react";
import { Link, NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import {
  ShieldCheck,
  Search,
  Bell,
  Store,
  Newspaper,
  HelpCircle,
  MapPin,
  Smartphone,
  Mail,
  Globe2,
  LogOut,
  UserCircle2,
  X,
} from "lucide-react";
import { LocalChevronDown, LocalFacebook, FireworkBurst, GlassCard } from "../components/ui.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { useSiteConfig } from "../context/SiteConfigContext.jsx";
import ThemeToggle from "../components/ThemeToggle.jsx";

// 4 menu chính — không icon, gọn
const MAIN_NAV = [
  { to: "/",        label: "Trang chủ",         exact: true },
  { to: "/lookup",  label: "Tra cứu" },
  { to: "/market",  label: "Bảng giá" },
  { to: "/sellers", label: "Cửa hàng uy tín" },
];

// Mục phụ trong dropdown "Thêm"
const MORE_NAV = [
  { to: "/warnings",            label: "Cảnh báo mới nhất", icon: Bell },
  { to: "/he-thong-cua-hang",   label: "Hệ thống cửa hàng", icon: Store },
  { to: "/news",                label: "Tin tức",           icon: Newspaper, disabled: true },
  { to: "/help",                label: "Hướng dẫn",         icon: HelpCircle, disabled: true },
];

// Pill nav item — active dùng amber background
function PillNavLink({ to, label, exact, onClick }) {
  return (
    <NavLink
      to={to}
      end={exact}
      onClick={onClick}
      className={({ isActive }) =>
        `rounded-xl px-4 py-2 text-sm font-bold transition ${
          isActive
            ? "bg-amber-300 text-slate-950 shadow-sm"
            : "text-soft hover:bg-card-strong hover:text-amber-500"
        }`
      }
    >
      {label}
    </NavLink>
  );
}

export default function MainLayout() {
  const { user, logout } = useAuth();
  const { settings } = useSiteConfig();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const siteName = settings.site_name || "TinCậy360";
  const siteSlogan = settings.site_slogan || "An tâm giao dịch pháo hoa";
  const logoUrl = settings.logo_url;

  const handleLogout = () => {
    logout();
    setMobileOpen(false);
    navigate("/");
  };

  // Đóng mobile drawer khi đổi route
  useEffect(() => { setMobileOpen(false); }, [location.pathname]);

  // Tách "TinCậy" / "360" để giữ accent
  const nameMain = siteName.replace(/(360|6360|360°)\s*$/i, "");
  const nameAccent = siteName.match(/(360|6360|360°)\s*$/i)?.[0] || "";

  // Check xem có route "Thêm" nào đang active không
  const moreActive = MORE_NAV.some((m) => !m.disabled && location.pathname.startsWith(m.to));

  return (
    <div className="min-h-screen overflow-hidden text-main">
      <div className="theme-page-bg pointer-events-none fixed inset-0 -z-10" />
      <div className="theme-dot-pattern pointer-events-none fixed inset-0 -z-10" />

      <header className="theme-header sticky top-0 z-40">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-5 px-5 py-3">
          {/* Brand */}
          <Link to="/" className="flex shrink-0 items-center gap-3">
            {logoUrl ? (
              <img src={logoUrl} alt={siteName} className="h-11 w-11 rounded-2xl object-cover shadow-lg" />
            ) : (
              <div className="relative flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-300 to-orange-500 text-slate-950 shadow-lg shadow-amber-500/25">
                <ShieldCheck className="h-6 w-6" />
                <span className="absolute -right-1 -top-1 h-3 w-3 rounded-full bg-rose-500 shadow-lg shadow-rose-500/50" />
              </div>
            )}
            <div className="hidden sm:block">
              <h1 className="text-lg font-black leading-none tracking-tight text-main">
                {nameMain || siteName}
                {nameAccent && <span className="text-amber-500">{nameAccent}</span>}
              </h1>
              <p className="mt-1 text-[11px] text-muted">{siteSlogan}</p>
            </div>
          </Link>

          {/* Main pill nav (desktop) */}
          <nav className="hidden flex-1 items-center justify-center lg:flex">
            <div className="theme-border flex items-center gap-1 rounded-2xl border bg-card/40 p-1 text-sm font-bold shadow-lg shadow-black/10 backdrop-blur">
              {MAIN_NAV.map((m) => (
                <PillNavLink key={m.to} to={m.to} label={m.label} exact={m.exact} />
              ))}

              {/* Dropdown "Thêm" — hover-based, theo style của bạn */}
              <div className="group relative">
                <button
                  className={`inline-flex items-center gap-1 rounded-xl px-4 py-2 text-sm font-bold transition ${
                    moreActive
                      ? "bg-amber-300 text-slate-950 shadow-sm"
                      : "text-soft hover:bg-card-strong hover:text-amber-500"
                  }`}
                >
                  Thêm <LocalChevronDown className="h-4 w-4" />
                </button>

                <div className="theme-border invisible absolute right-0 top-full z-50 mt-3 w-56 translate-y-2 rounded-2xl border bg-page/95 p-2 opacity-0 shadow-2xl shadow-black/40 backdrop-blur-2xl transition group-hover:visible group-hover:translate-y-0 group-hover:opacity-100">
                  {MORE_NAV.map((m) => {
                    const Icon = m.icon;
                    if (m.disabled) {
                      return (
                        <div
                          key={m.label}
                          className="flex cursor-not-allowed items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-muted"
                          title="Sắp có"
                        >
                          <Icon className="h-4 w-4 text-amber-500/60" />
                          <span className="flex-1">{m.label}</span>
                          <span className="rounded-full bg-amber-500/10 px-2 py-0.5 text-[10px] font-black text-amber-500">SOON</span>
                        </div>
                      );
                    }
                    return (
                      <NavLink
                        key={m.to}
                        to={m.to}
                        className={({ isActive }) =>
                          `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition ${
                            isActive ? "bg-amber-500/15 text-amber-500" : "text-soft hover:bg-card-strong hover:text-amber-500"
                          }`
                        }
                      >
                        <Icon className="h-4 w-4 text-amber-500" />
                        {m.label}
                      </NavLink>
                    );
                  })}
                </div>
              </div>
            </div>
          </nav>

          {/* Right actions */}
          <div className="flex shrink-0 items-center gap-2">
            <ThemeToggle />

            <button
              type="button"
              onClick={() => navigate("/lookup")}
              className="theme-border hidden h-10 w-10 items-center justify-center rounded-2xl border bg-card/5 text-soft transition hover:border-amber-300/40 hover:text-amber-500 md:flex"
              title="Tra cứu nhanh"
            >
              <Search className="h-5 w-5" />
            </button>

            {user ? (
              <>
                <Link
                  to="/submit/report"
                  className="hidden rounded-2xl bg-gradient-to-r from-rose-500 to-orange-500 px-4 py-2.5 text-sm font-black text-white shadow-lg shadow-rose-500/20 transition hover:from-rose-400 hover:to-amber-400 sm:block"
                >
                  Gửi báo cáo
                </Link>
                <div className="theme-border hidden items-center gap-1.5 rounded-2xl border bg-card/5 px-3 py-2 text-sm xl:flex">
                  <UserCircle2 className="h-4 w-4 text-amber-500" />
                  <span className="font-bold text-main">{user.displayName}</span>
                </div>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  state={{ from: location.pathname }}
                  className="hidden rounded-2xl px-3 py-2 text-sm font-bold text-soft hover:text-amber-500 sm:inline-flex"
                >
                  Đăng nhập
                </Link>
                <Link
                  to="/register"
                  className="hidden rounded-2xl bg-gradient-to-r from-rose-500 to-orange-500 px-4 py-2.5 text-sm font-black text-white shadow-lg shadow-rose-500/20 transition hover:from-rose-400 hover:to-amber-400 sm:block"
                >
                  Tham gia
                </Link>
              </>
            )}

            <button
              onClick={() => setMobileOpen(true)}
              className="theme-border flex h-10 w-10 items-center justify-center rounded-2xl border bg-card/5 text-xl font-black text-soft lg:hidden"
              aria-label="Mở menu"
            >
              ☰
            </button>
          </div>
        </div>
      </header>

      {/* Mobile drawer */}
      {mobileOpen && (
        <>
          <div
            className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm lg:hidden"
            onClick={() => setMobileOpen(false)}
          />
          <aside className="theme-header fixed right-0 top-0 z-50 h-full w-[85%] max-w-sm overflow-y-auto border-l p-5 lg:hidden">
            <div className="flex items-center justify-between">
              <p className="text-sm font-black text-main">{siteName}</p>
              <button
                onClick={() => setMobileOpen(false)}
                className="theme-border flex h-9 w-9 items-center justify-center rounded-xl border bg-card/5 text-soft"
                aria-label="Đóng"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <nav className="mt-6 flex flex-col gap-1">
              {MAIN_NAV.map((m) => (
                <NavLink
                  key={m.to}
                  to={m.to}
                  end={m.exact}
                  className={({ isActive }) =>
                    `rounded-xl px-3 py-3 text-sm font-bold transition ${
                      isActive ? "bg-amber-300 text-slate-950" : "text-soft hover:bg-card-strong"
                    }`
                  }
                >
                  {m.label}
                </NavLink>
              ))}

              <div className="my-3 border-t border-line" />
              <p className="px-3 text-[10px] font-black uppercase tracking-widest text-muted">Thêm</p>
              {MORE_NAV.map((m) => {
                const Icon = m.icon;
                if (m.disabled) {
                  return (
                    <div key={m.label} className="flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm text-muted">
                      <Icon className="h-4 w-4" />
                      {m.label}
                      <span className="ml-auto rounded-full bg-amber-500/10 px-2 py-0.5 text-[10px] font-black text-amber-500">SOON</span>
                    </div>
                  );
                }
                return (
                  <NavLink
                    key={m.to}
                    to={m.to}
                    className={({ isActive }) =>
                      `flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm transition ${
                        isActive ? "bg-amber-500/15 text-amber-500" : "text-soft hover:bg-card-strong"
                      }`
                    }
                  >
                    <Icon className="h-4 w-4" />
                    {m.label}
                  </NavLink>
                );
              })}

              {user && (
                <>
                  <div className="my-3 border-t border-line" />
                  <p className="px-3 text-[10px] font-black uppercase tracking-widest text-muted">Tài khoản</p>
                  <NavLink to="/my-reports" className="rounded-xl px-3 py-2.5 text-sm font-bold text-soft hover:bg-card-strong">
                    Báo cáo của tôi
                  </NavLink>
                  {user.role === "ADMIN" && (
                    <NavLink to="/admin" className="rounded-xl px-3 py-2.5 text-sm font-bold text-soft hover:bg-card-strong">
                      Quản trị
                    </NavLink>
                  )}
                </>
              )}
            </nav>

            <div className="mt-6 flex flex-col gap-2">
              {user ? (
                <>
                  <Link
                    to="/submit/report"
                    className="rounded-xl bg-gradient-to-r from-rose-500 to-orange-500 px-4 py-2.5 text-center text-sm font-black text-white shadow-md"
                  >
                    Gửi báo cáo
                  </Link>
                  <div className="theme-border flex items-center gap-2 rounded-xl border bg-card/5 px-3 py-2 text-sm">
                    <UserCircle2 className="h-4 w-4 text-amber-500" />
                    <span className="flex-1 font-bold text-main">{user.displayName}</span>
                    <button onClick={handleLogout} className="text-muted hover:text-rose-500" title="Đăng xuất">
                      <LogOut className="h-4 w-4" />
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <Link
                    to="/login"
                    state={{ from: location.pathname }}
                    className="theme-border rounded-xl border bg-card/5 px-4 py-2.5 text-center text-sm font-bold text-soft"
                  >
                    Đăng nhập
                  </Link>
                  <Link
                    to="/register"
                    className="rounded-xl bg-gradient-to-r from-rose-500 to-orange-500 px-4 py-2.5 text-center text-sm font-black text-white"
                  >
                    Tham gia
                  </Link>
                </>
              )}
            </div>
          </aside>
        </>
      )}

      <main>
        <Outlet />
      </main>

      <footer className="theme-footer relative">
        <FireworkBurst className="absolute bottom-8 right-8 h-36 w-36 opacity-20" />
        <div className="mx-auto grid max-w-7xl gap-8 px-5 py-10 md:grid-cols-[1.2fr_0.8fr_0.8fr_0.8fr_1fr]">
          <div>
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-300 to-orange-500 text-slate-950 shadow-lg shadow-amber-500/25">
                <ShieldCheck className="h-7 w-7" />
              </div>
              <div>
                <h2 className="text-xl font-black text-main">{siteName}</h2>
                <p className="text-xs text-muted">{siteSlogan}</p>
              </div>
            </div>
            <p className="mt-4 max-w-sm text-sm leading-6 text-muted">
              Nền tảng cộng đồng giúp kiểm tra độ tin cậy người bán, cảnh báo lừa đảo và cập nhật giá pháo hoa mỗi ngày.
            </p>
            <div className="mt-5 flex gap-3">
              <button className="theme-border flex h-10 w-10 items-center justify-center rounded-xl border bg-card/5 text-soft hover:text-amber-500">
                <LocalFacebook className="h-5 w-5" />
              </button>
              <button className="theme-border flex h-10 w-10 items-center justify-center rounded-xl border bg-card/5 text-soft hover:text-amber-500">
                <Mail className="h-5 w-5" />
              </button>
              <button className="theme-border flex h-10 w-10 items-center justify-center rounded-xl border bg-card/5 text-soft hover:text-amber-500">
                <Globe2 className="h-5 w-5" />
              </button>
            </div>
          </div>
          <div>
            <h3 className="font-black text-amber-500">Tính năng</h3>
            <div className="mt-4 space-y-3 text-sm text-muted">
              <Link to="/lookup" className="block hover:text-amber-500">Kiểm tra số điện thoại</Link>
              <Link to="/lookup" className="block hover:text-amber-500">Kiểm tra số tài khoản</Link>
              <Link to="/warnings" className="block hover:text-amber-500">Cảnh báo lừa đảo</Link>
              <Link to="/market" className="block hover:text-amber-500">Giá pháo hoa</Link>
              <Link to="/sellers" className="block hover:text-amber-500">Cửa hàng uy tín</Link>
              <Link to="/he-thong-cua-hang" className="block hover:text-amber-500">Hệ thống cửa hàng</Link>
            </div>
          </div>
          <div>
            <h3 className="font-black text-amber-500">Đóng góp</h3>
            <div className="mt-4 space-y-3 text-sm text-muted">
              <Link to="/submit/report" className="block hover:text-amber-500">Báo cáo lừa đảo</Link>
              <Link to="/submit/seller" className="block hover:text-amber-500">Đăng người bán uy tín</Link>
              <Link to="/submit/price" className="block hover:text-amber-500">Đăng giá pháo hoa</Link>
            </div>
          </div>
          <div>
            <h3 className="font-black text-amber-500">Liên hệ</h3>
            <div className="mt-4 space-y-3 text-sm text-muted">
              <p>Hotline: {settings.hotline || "1900 6360"}</p>
              <p>Email: {settings.support_email || "hotro@tincay360.vn"}</p>
              <p>{settings.address || "Tầng 6, 123 Trần Duy Hưng, Hà Nội"}</p>
            </div>
          </div>
          <GlassCard className="p-5">
            <Smartphone className="h-8 w-8 text-amber-500" />
            <h3 className="mt-3 font-black text-main">Tải ứng dụng</h3>
            <p className="mt-2 text-sm text-muted">Tra cứu nhanh hơn trên di động</p>
            <div className="mt-4 grid gap-2">
              <button className="theme-border rounded-xl border bg-card/5 px-4 py-2 text-sm font-bold text-main">App Store</button>
              <button className="theme-border rounded-xl border bg-card/5 px-4 py-2 text-sm font-bold text-main">Google Play</button>
            </div>
          </GlassCard>
        </div>
        <div className="theme-border border-t py-5">
          <div className="mx-auto flex max-w-7xl flex-col justify-between gap-3 px-5 text-sm text-muted md:flex-row">
            <p>© 2026 {siteName}. All rights reserved.</p>
            <p>Dữ liệu được cộng đồng đóng góp và cập nhật liên tục</p>
            <p>Made with <span className="text-rose-500">♥</span> for a safer community</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
