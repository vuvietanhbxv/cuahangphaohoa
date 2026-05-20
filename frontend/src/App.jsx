import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext.jsx";
import { SiteConfigProvider, useSiteConfig } from "./context/SiteConfigContext.jsx";
import { ThemeProvider } from "./context/ThemeContext.jsx";
import AdminBrandingPage from "./pages/admin/cms/AdminBrandingPage.jsx";
import AdminBannersPage from "./pages/admin/cms/AdminBannersPage.jsx";
import AdminMediaPage from "./pages/admin/cms/AdminMediaPage.jsx";
import AdminSellerBrandingPage from "./pages/admin/cms/AdminSellerBrandingPage.jsx";
import AdminThemesPage from "./pages/admin/cms/AdminThemesPage.jsx";

function ThemeBootstrap({ children }) {
  const { settings, loading } = useSiteConfig();
  // Nếu user đã chọn localStorage thì giữ; nếu không lấy default từ admin (settings.default_theme).
  const defaultMode = loading ? "dark" : (settings?.default_theme === "light" ? "light" : "dark");
  return <ThemeProvider defaultMode={defaultMode}>{children}</ThemeProvider>;
}
import RequireAuth from "./components/RequireAuth.jsx";
import MainLayout from "./layouts/MainLayout.jsx";
import AdminLayout from "./layouts/AdminLayout.jsx";
import HomePage from "./pages/HomePage.jsx";
import LookupPage from "./pages/LookupPage.jsx";
import LookupDetailPage from "./pages/LookupDetailPage.jsx";
import MarketPage from "./pages/MarketPage.jsx";
import SellersPage from "./pages/SellersPage.jsx";
import WarningsPage from "./pages/WarningsPage.jsx";
import LoginPage from "./pages/LoginPage.jsx";
import RegisterPage from "./pages/RegisterPage.jsx";
import SubmitReportPage from "./pages/SubmitReportPage.jsx";
import SubmitSellerPage from "./pages/SubmitSellerPage.jsx";
import SubmitPricePage from "./pages/SubmitPricePage.jsx";
import MyReportsPage from "./pages/MyReportsPage.jsx";
import MyReportDetailPage from "./pages/MyReportDetailPage.jsx";
import StoresPage from "./pages/StoresPage.jsx";
import StoreDetailPage from "./pages/StoreDetailPage.jsx";
import AdminStoresPage from "./pages/admin/AdminStoresPage.jsx";
import AdminDashboardPage from "./pages/admin/AdminDashboardPage.jsx";
import AdminReportsPage from "./pages/admin/AdminReportsPage.jsx";
import AdminReportDetailPage from "./pages/admin/AdminReportDetailPage.jsx";
import AdminBlacklistPage from "./pages/admin/AdminBlacklistPage.jsx";
import AdminSellersPage from "./pages/admin/AdminSellersPage.jsx";
import AdminPricesPage from "./pages/admin/AdminPricesPage.jsx";
import AdminProductsPage from "./pages/admin/AdminProductsPage.jsx";
import AdminUsersPage from "./pages/admin/AdminUsersPage.jsx";
import AdminActivityPage from "./pages/admin/AdminActivityPage.jsx";

export default function App() {
  return (
    <AuthProvider>
      <SiteConfigProvider>
      <ThemeBootstrap>
      <BrowserRouter>
        <Routes>
          {/* Public site */}
          <Route element={<MainLayout />}>
            <Route index element={<HomePage />} />
            <Route path="lookup" element={<LookupPage />} />
            <Route path="lookup/:type/:value" element={<LookupDetailPage />} />
            <Route path="market" element={<MarketPage />} />
            <Route path="sellers" element={<SellersPage />} />
            <Route path="warnings" element={<WarningsPage />} />
            <Route path="he-thong-cua-hang" element={<StoresPage />} />
            <Route path="he-thong-cua-hang/:slug" element={<StoreDetailPage />} />
            <Route path="login" element={<LoginPage />} />
            <Route path="register" element={<RegisterPage />} />
            <Route
              path="submit/report"
              element={<RequireAuth><SubmitReportPage /></RequireAuth>}
            />
            <Route
              path="submit/seller"
              element={<RequireAuth><SubmitSellerPage /></RequireAuth>}
            />
            <Route
              path="submit/price"
              element={<RequireAuth><SubmitPricePage /></RequireAuth>}
            />
            <Route
              path="my-reports"
              element={<RequireAuth><MyReportsPage /></RequireAuth>}
            />
            <Route
              path="my-reports/:id"
              element={<RequireAuth><MyReportDetailPage /></RequireAuth>}
            />
          </Route>

          {/* Admin */}
          <Route
            path="admin"
            element={
              <RequireAuth requireRole="ADMIN">
                <AdminLayout />
              </RequireAuth>
            }
          >
            <Route index element={<AdminDashboardPage />} />
            <Route path="reports" element={<AdminReportsPage />} />
            <Route path="reports/:id" element={<AdminReportDetailPage />} />
            <Route path="blacklist" element={<AdminBlacklistPage />} />
            <Route path="sellers" element={<AdminSellersPage />} />
            <Route path="prices" element={<AdminPricesPage />} />
            <Route path="products" element={<AdminProductsPage />} />
            <Route path="users" element={<AdminUsersPage />} />
            <Route path="activity" element={<AdminActivityPage />} />
            <Route path="cms/branding" element={<AdminBrandingPage />} />
            <Route path="cms/banners" element={<AdminBannersPage />} />
            <Route path="cms/media" element={<AdminMediaPage />} />
            <Route path="cms/seller-branding" element={<AdminSellerBrandingPage />} />
            <Route path="cms/themes" element={<AdminThemesPage />} />
            <Route path="stores" element={<AdminStoresPage />} />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
      </ThemeBootstrap>
      </SiteConfigProvider>
    </AuthProvider>
  );
}
