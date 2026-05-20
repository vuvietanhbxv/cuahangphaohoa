import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ShieldCheck,
  ShieldAlert,
  Search,
  TrendingUp,
  CheckCircle2,
  BadgeCheck,
  Store,
  Flame,
  FileWarning,
} from "lucide-react";
import { api } from "../api/client.js";
import { formatRelative } from "../lib/format.js";
import { Badge, FireworkBurst, GlassCard, SectionTitle } from "../components/ui.jsx";
import LookupCard from "../components/LookupCard.jsx";
import WarningCard from "../components/WarningCard.jsx";
import SellerCard from "../components/SellerCard.jsx";
import MarketPage from "./MarketPage.jsx";
import StoresPage from "./StoresPage.jsx";
import { useSiteConfig } from "../context/SiteConfigContext.jsx";

export default function HomePage() {
  const [warnings, setWarnings] = useState([]);
  const [sellers, setSellers] = useState([]);
  const [stats, setStats] = useState({ sellers: 0, warnings: 0, stores: 0 });
  const { settings, banners } = useSiteConfig();
  const heroBanner = banners?.home_hero?.[0] || null;
  const heroEyebrow = settings.hero_eyebrow || "Cộng đồng xác thực · Dữ liệu cập nhật liên tục";
  const heroBgUrl = settings.hero_bg_url || heroBanner?.desktop_image_url || "";
  const heroOverlay = Number(settings.hero_bg_overlay) || 0.55;

  useEffect(() => {
    api
      .get("/reports", { params: { limit: 3 } })
      .then((data) => setWarnings(data.items || []))
      .catch(() => {});
    api
      .get("/sellers", { params: { limit: 4 } })
      .then((data) => {
        setSellers(data.items || []);
        setStats((s) => ({ ...s, sellers: data.total || 0 }));
      })
      .catch(() => {});
    api
      .get("/prices/summary")
      .then((data) => {
        setStats((s) => ({ ...s, stores: data.items?.reduce((sum, r) => sum + (r.stores || 0), 0) || 0 }));
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    api
      .get("/reports", { params: { limit: 200 } })
      .then((data) => {
        const total = (data.items || []).reduce((sum, r) => sum + (r.reportsCount || 1), 0);
        setStats((s) => ({ ...s, warnings: total }));
      })
      .catch(() => {});
  }, []);

  return (
    <>
      {/* ============================================================
         1. BANNER TRA CỨU NHANH (Hero)
         ============================================================ */}
      <section className="relative overflow-hidden border-b border-line">
        {/* Background image nếu admin đã chọn */}
        {heroBgUrl && (
          <>
            <div
              className="absolute inset-0 -z-0 bg-cover bg-center bg-no-repeat"
              style={{ backgroundImage: `url(${heroBgUrl})` }}
            />
            <div
              className="absolute inset-0 -z-0"
              style={{ background: `rgba(6, 11, 29, ${heroOverlay})` }}
            />
          </>
        )}

        <FireworkBurst className="absolute -left-10 top-10 h-48 w-48 text-amber-500 opacity-70" />
        <FireworkBurst tone="red" className="absolute right-0 top-8 h-56 w-56 opacity-60" />
        <FireworkBurst tone="purple" className="absolute bottom-10 left-1/2 h-40 w-40 opacity-35" />
        <div className="absolute inset-x-0 bottom-0 h-32 bg-[radial-gradient(ellipse_at_center,rgba(251,191,36,0.32),transparent_55%)]" />
        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-amber-300/60 to-transparent" />

        <div className="relative mx-auto grid max-w-7xl gap-8 px-5 py-12 lg:grid-cols-[1.05fr_0.95fr] lg:py-16">
          <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} className="relative z-10">
            <Badge variant="warn">{heroEyebrow}</Badge>
            <h2 className={`mt-7 max-w-3xl text-4xl font-black leading-tight tracking-tight md:text-6xl ${heroBgUrl ? "text-white" : "text-main"}`}>
              {heroBanner?.title || "Kiểm tra độ tin cậy người bán"}{" "}
              <span className="bg-gradient-to-r from-amber-200 via-yellow-300 to-orange-400 bg-clip-text text-transparent">
                {heroBanner?.subtitle || "trước khi thanh toán"}
              </span>
            </h2>
            <p className={`mt-5 max-w-2xl text-lg leading-8 ${heroBgUrl ? "text-slate-200" : "text-soft"}`}>
              {heroBanner?.description || "TinCậy360 giúp bạn tra cứu số điện thoại, số tài khoản và cập nhật cảnh báo lừa đảo trong giao dịch pháo hoa. Giao dịch an toàn — Chơi Tết trọn vẹn."}
            </p>
            <div className={`mt-6 flex flex-wrap gap-4 text-sm font-semibold ${heroBgUrl ? "text-slate-200" : "text-soft"}`}>
              <span className="inline-flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-amber-500" /> Cộng đồng xác thực</span>
              <span className="inline-flex items-center gap-2"><BadgeCheck className="h-4 w-4 text-amber-500" /> Dữ liệu cập nhật liên tục</span>
              <span className="inline-flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-amber-500" /> Miễn phí & minh bạch</span>
            </div>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                to={heroBanner?.cta_primary_url || "/lookup"}
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-amber-300 to-orange-400 px-7 py-4 font-black text-slate-950 shadow-xl shadow-amber-500/20 hover:from-yellow-200 hover:to-amber-300"
              >
                <Search className="h-5 w-5" /> {heroBanner?.cta_primary_label || "Kiểm tra ngay"}
              </Link>
              <Link
                to={heroBanner?.cta_secondary_url || "/market"}
                className="inline-flex items-center justify-center gap-2 rounded-2xl border border-amber-300/30 bg-white/5 px-7 py-4 font-bold text-amber-100 backdrop-blur hover:bg-white/10"
              >
                <TrendingUp className="h-5 w-5" /> {heroBanner?.cta_secondary_label || "Xem bảng giá"}
              </Link>
            </div>
            <div className="mt-10 grid gap-4 sm:grid-cols-3">
              {[
                [ShieldCheck, "Người bán uy tín", stats.sellers || "—", "đã xác minh"],
                [ShieldAlert, "Cảnh báo", stats.warnings || "—", "báo cáo cộng đồng"],
                [Store, "Nguồn giá", stats.stores || "—", "lượt cửa hàng"],
              ].map(([Icon, label, value, sub]) => (
                <div key={label} className="rounded-3xl border border-white/10 bg-white/[0.06] p-5 shadow-xl shadow-black/20 backdrop-blur">
                  <Icon className="h-7 w-7 text-amber-500" />
                  <p className={`mt-4 text-sm ${heroBgUrl ? "text-slate-200" : "text-muted"}`}>{label}</p>
                  <p className={`mt-1 text-3xl font-black ${heroBgUrl ? "text-white" : "text-main"}`}>{value}</p>
                  <p className={`text-sm ${heroBgUrl ? "text-slate-300" : "text-muted"}`}>{sub}</p>
                </div>
              ))}
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} className="relative z-10">
            <LookupCard />
          </motion.div>
        </div>
      </section>

      {/* ============================================================
         2. GIÁ PHÁO HOA HÔM NAY — embed nguyên MarketPage
         ============================================================ */}
      <MarketPage />

      {/* ============================================================
         3. HỆ THỐNG CỬA HÀNG — embed nguyên StoresPage có bản đồ
         ============================================================ */}
      <StoresPage />

      {/* ============================================================
         4. NGƯỜI BÁN UY TÍN
         ============================================================ */}
      <section className="mx-auto max-w-7xl px-5 py-12">
        <div className="flex items-end justify-between gap-5">
          <SectionTitle
            dark
            eyebrow="Người bán uy tín"
            title="Được cộng đồng đánh giá cao"
            desc="Các hồ sơ đã xác minh giấy tờ, lịch sử giao dịch và điểm đánh giá."
          />
          <Link to="/sellers" className="hidden text-sm font-bold text-amber-500 hover:text-amber-200 md:block">
            Xem tất cả →
          </Link>
        </div>
        <div className="mt-7 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {sellers.length === 0 && (
            <p className="col-span-4 text-sm text-muted">Chưa có người bán nào được duyệt.</p>
          )}
          {sellers.map((seller) => (
            <SellerCard key={seller.id} seller={seller} />
          ))}
        </div>
      </section>

      {/* ============================================================
         5. CẢNH BÁO LỪA ĐẢO MỚI NHẤT
         ============================================================ */}
      <section className="mx-auto max-w-7xl px-5 py-12">
        <div className="flex items-end justify-between gap-5">
          <SectionTitle
            dark
            eyebrow="Cảnh báo lừa đảo mới nhất"
            title="Các số đang bị cộng đồng báo cáo"
            desc="Hiển thị nhanh mức độ rủi ro để người mua kiểm tra trước khi đặt cọc hoặc chuyển khoản."
          />
          <Link to="/warnings" className="hidden text-sm font-bold text-amber-500 hover:text-amber-200 md:block">
            Xem tất cả →
          </Link>
        </div>
        <div className="mt-6 grid gap-4 lg:grid-cols-3">
          {warnings.length === 0 && (
            <p className="col-span-3 text-sm text-muted">Chưa có cảnh báo nào được duyệt.</p>
          )}
          {warnings.slice(0, 3).map((item, index) => (
            <WarningCard key={item.id} item={item} index={index} />
          ))}
        </div>
      </section>

      {/* CTA strip cuối cùng — đóng góp */}
      <section className="mx-auto max-w-7xl px-5 pb-14">
        <div className="grid gap-5 md:grid-cols-3">
          {[
            [FileWarning, "Báo cáo lừa đảo", "Gửi bằng chứng, ảnh chuyển khoản, nội dung chat để cộng đồng kiểm chứng.", "text-rose-300", "/submit/report"],
            [BadgeCheck, "Đăng người bán uy tín", "Hồ sơ uy tín cần có số điện thoại, tài khoản ngân hàng, địa chỉ và lịch sử giao dịch.", "text-emerald-300", "/submit/seller"],
            [TrendingUp, "Đăng giá pháo hoa", "Đóng góp giá niêm yết của cửa hàng để cộng đồng tham khảo.", "text-amber-500", "/submit/price"],
          ].map(([Icon, title, desc, color, to]) => (
            <Link key={title} to={to}>
              <GlassCard className="p-6 transition hover:-translate-y-1 hover:border-amber-300/30">
                <Icon className={`h-9 w-9 ${color}`} />
                <h4 className="mt-4 text-lg font-black text-main">{title}</h4>
                <p className="mt-2 text-sm leading-6 text-muted">{desc}</p>
              </GlassCard>
            </Link>
          ))}
        </div>
      </section>
    </>
  );
}
