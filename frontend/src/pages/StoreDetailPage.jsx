import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  ArrowLeft, MapPin, Phone, Mail, Globe, CheckCircle2, AlertTriangle,
  Star, Clock, ShieldCheck, Navigation, ShieldAlert, ExternalLink,
} from "lucide-react";
import { api } from "../api/client.js";
import { GlassCard, SectionTitle, Badge } from "../components/ui.jsx";
import { formatCurrency, formatRelative } from "../lib/format.js";

const VERIFICATION_LABEL = {
  VERIFIED: "Đã xác minh",
  PENDING: "Chờ xác minh",
  REJECTED: "Chưa xác minh",
  UNDER_REVIEW: "Đang kiểm tra",
};

function googleMapsUrl(loc) {
  if (loc.latitude && loc.longitude) {
    return `https://www.google.com/maps/dir/?api=1&destination=${loc.latitude},${loc.longitude}`;
  }
  return `https://www.google.com/maps/search/${encodeURIComponent(loc.address)}`;
}

export default function StoreDetailPage() {
  const { slug } = useParams();
  const [store, setStore] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    setLoading(true);
    api
      .get(`/stores/${slug}`)
      .then(setStore)
      .catch((err) => setError(err.message || "Không tìm thấy"))
      .finally(() => setLoading(false));
  }, [slug]);

  if (loading) return <section className="mx-auto max-w-5xl px-5 py-10"><p className="text-muted">Đang tải...</p></section>;
  if (error || !store) return <section className="mx-auto max-w-5xl px-5 py-10"><p className="text-rose-300">{error || "Không tìm thấy cửa hàng"}</p></section>;

  const verified = store.verification_status === "VERIFIED";
  const hasWarning = store.lookup_risk?.verified_count > 0 || store.lookup_risk?.pending_count > 0;
  const mainLoc = store.locations?.find((l) => l.is_main_branch) || store.locations?.[0];

  return (
    <section className="mx-auto max-w-5xl px-5 py-8">
      <Link to="/he-thong-cua-hang" className="inline-flex items-center gap-2 text-sm text-amber-500 hover:text-amber-200">
        <ArrowLeft className="h-4 w-4" /> Quay lại hệ thống cửa hàng
      </Link>

      {/* Cover */}
      <div
        className="relative mt-4 h-48 overflow-hidden rounded-3xl"
        style={{
          background: store.cover_url
            ? `url(${store.cover_url}) center/cover`
            : `linear-gradient(135deg, ${store.brand_color || "#fbbf24"}, #fb7185, #c084fc)`,
        }}
      >
        <div className="absolute -bottom-10 left-6 h-24 w-24 overflow-hidden rounded-3xl border-4 border-page bg-card-strong">
          {store.avatar_url ? (
            <img src={store.avatar_url} alt={store.name} className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-4xl font-black text-amber-500">
              {store.name[0]}
            </div>
          )}
        </div>
      </div>

      <div className="mt-14 flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-black text-main md:text-3xl">{store.name}</h1>
            {verified ? (
              <Badge variant="gold"><CheckCircle2 className="mr-1 inline h-3 w-3" /> {VERIFICATION_LABEL[store.verification_status]}</Badge>
            ) : (
              <Badge variant="warn">{VERIFICATION_LABEL[store.verification_status]}</Badge>
            )}
          </div>
          {store.description && <p className="mt-2 text-soft">{store.description}</p>}
          <div className="mt-2 flex items-center gap-1 text-sm">
            <Star className="h-4 w-4 fill-current text-amber-500" />
            <span className="font-black text-main">{Number(store.rating || 0).toFixed(1)}</span>
            <span className="text-muted">· {store.review_count || 0} đánh giá · {store.successful_transactions || 0} giao dịch</span>
          </div>
        </div>
      </div>

      {/* Khối an toàn / cảnh báo */}
      {hasWarning ? (
        <GlassCard className="mt-5 border border-rose-400/30 bg-rose-500/10 p-4">
          <div className="flex items-start gap-3">
            <ShieldAlert className="h-6 w-6 flex-shrink-0 text-rose-500" />
            <div>
              <p className="font-black text-rose-500">Cửa hàng này có cảnh báo liên quan</p>
              <p className="mt-1 text-sm text-soft">
                Có <b>{store.lookup_risk.verified_count}</b> báo cáo đã xác minh và <b>{store.lookup_risk.pending_count}</b> báo cáo đang xem xét cho số điện thoại của cửa hàng.
                Vui lòng cẩn trọng trước khi giao dịch.
              </p>
              <Link
                to={`/lookup/phone/${store.phone_masked?.replace(/\D/g, "") || ""}`}
                className="mt-2 inline-flex items-center gap-1 text-xs font-bold text-amber-500 underline"
              >
                Xem chi tiết tra cứu <ExternalLink className="h-3 w-3" />
              </Link>
            </div>
          </div>
        </GlassCard>
      ) : verified ? (
        <GlassCard className="mt-5 border border-emerald-400/30 bg-emerald-500/10 p-4">
          <div className="flex items-start gap-3">
            <ShieldCheck className="h-6 w-6 flex-shrink-0 text-emerald-500" />
            <div>
              <p className="font-black text-emerald-500">Thông tin an toàn giao dịch</p>
              <ul className="mt-1 list-disc space-y-0.5 pl-5 text-sm text-soft">
                <li>Số điện thoại đã xác minh</li>
                {store.bank_account_masked && <li>Tài khoản nhận tiền đã xác minh ({store.bank_account_masked})</li>}
                <li>Chưa ghi nhận cảnh báo nghiêm trọng</li>
                <li>Tin cậy: <b>{store.trust_score}/100</b></li>
              </ul>
            </div>
          </div>
        </GlassCard>
      ) : null}

      <div className="mt-5 grid gap-5 lg:grid-cols-[1.4fr_1fr]">
        {/* Thông tin liên hệ + chi nhánh */}
        <div className="space-y-5">
          <GlassCard className="p-5">
            <p className="text-xs font-black uppercase tracking-wide text-amber-500">Thông tin liên hệ</p>
            <dl className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
              {store.phone_masked && (
                <div>
                  <dt className="text-muted">Số điện thoại</dt>
                  <dd className="font-bold text-main">{store.phone_masked}</dd>
                </div>
              )}
              {store.bank_account_masked && (
                <div>
                  <dt className="text-muted">Tài khoản ngân hàng</dt>
                  <dd className="font-bold text-main">{store.bank_account_masked} {store.bank_name && `(${store.bank_name})`}</dd>
                </div>
              )}
              {store.email && (
                <div>
                  <dt className="text-muted">Email</dt>
                  <dd className="text-main">{store.email}</dd>
                </div>
              )}
              {store.opening_hours && (
                <div>
                  <dt className="text-muted">Giờ mở cửa</dt>
                  <dd className="text-main"><Clock className="mr-1 inline h-3 w-3" /> {store.opening_hours}</dd>
                </div>
              )}
              {store.website && (
                <div className="sm:col-span-2">
                  <dt className="text-muted">Website</dt>
                  <dd><a href={store.website} target="_blank" rel="noreferrer" className="text-amber-500 underline">{store.website}</a></dd>
                </div>
              )}
            </dl>
          </GlassCard>

          <GlassCard className="p-5">
            <p className="text-xs font-black uppercase tracking-wide text-amber-500">Chi nhánh ({store.locations?.length || 0})</p>
            <div className="mt-3 space-y-3">
              {store.locations?.map((loc) => (
                <div key={loc.id} className="rounded-2xl border border-line bg-card-strong p-3">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <p className="font-bold text-main">
                        {loc.branch_name || "Chi nhánh chính"}
                        {loc.is_main_branch && <span className="ml-2 rounded-full bg-amber-500/15 px-2 py-0.5 text-[10px] font-black text-amber-500">CHÍNH</span>}
                      </p>
                      <p className="mt-1 text-sm text-soft"><MapPin className="mr-1 inline h-3.5 w-3.5 text-amber-500" /> {loc.address}</p>
                      <p className="text-xs text-muted">
                        {loc.province}
                        {loc.district ? ` · ${loc.district}` : ""}
                        {loc.ward ? ` · ${loc.ward}` : ""}
                      </p>
                      {loc.phone && <p className="text-xs text-soft"><Phone className="mr-1 inline h-3 w-3" /> {loc.phone}</p>}
                    </div>
                    <a
                      href={googleMapsUrl(loc)}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 rounded-xl bg-amber-500/15 px-3 py-2 text-xs font-black text-amber-500 hover:bg-amber-500/25"
                    >
                      <Navigation className="h-3.5 w-3.5" /> Chỉ đường
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </GlassCard>

          {/* Sản phẩm đang bán */}
          {store.store_products?.length > 0 && (
            <GlassCard className="p-5">
              <p className="text-xs font-black uppercase tracking-wide text-amber-500">Sản phẩm đang bán</p>
              <div className="mt-3 overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="border-b border-line text-xs uppercase text-muted">
                    <tr>
                      <th className="py-2">Sản phẩm</th>
                      <th>Giá</th>
                      <th>Tình trạng</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-line text-soft">
                    {store.store_products.map((p) => (
                      <tr key={p.product_id}>
                        <td className="py-2 font-bold text-main">{p.product_name}</td>
                        <td className="font-black text-amber-500">{p.price ? formatCurrency(p.price) : "—"}</td>
                        <td className="text-xs">
                          {p.stock_status === "available" ? <span className="text-emerald-500">Còn hàng</span>
                            : p.stock_status === "out_of_stock" ? <span className="text-rose-500">Hết hàng</span>
                            : p.stock_status === "pre_order" ? <span className="text-sky-500">Đặt trước</span>
                            : <span className="text-muted">—</span>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </GlassCard>
          )}
        </div>

        {/* Aside: Hành động + đánh giá */}
        <aside className="space-y-4">
          <GlassCard className="p-5">
            <p className="text-xs font-black uppercase tracking-wide text-amber-500">Hành động nhanh</p>
            <div className="mt-3 space-y-2">
              {store.phone_masked && (
                <button
                  onClick={() => alert("Liên hệ trực tiếp qua kênh chính thức của cửa hàng. SĐT đầy đủ chỉ hiển thị khi cửa hàng cho phép.")}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-500/15 px-4 py-2.5 text-sm font-black text-emerald-500 hover:bg-emerald-500/25"
                >
                  <Phone className="h-4 w-4" /> Gọi cửa hàng
                </button>
              )}
              {mainLoc && (
                <a
                  href={googleMapsUrl(mainLoc)}
                  target="_blank"
                  rel="noreferrer"
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-sky-500/15 px-4 py-2.5 text-sm font-black text-sky-500 hover:bg-sky-500/25"
                >
                  <Navigation className="h-4 w-4" /> Chỉ đường
                </a>
              )}
              <Link
                to={`/submit/report?type=phone&value=${store.phone_masked?.replace(/[^0-9]/g, "") || ""}`}
                className="flex w-full items-center justify-center gap-2 rounded-xl border border-line bg-card-strong px-4 py-2.5 text-sm font-bold text-soft hover:text-rose-500"
              >
                <AlertTriangle className="h-4 w-4" /> Báo cáo cửa hàng
              </Link>
            </div>
          </GlassCard>

          {store.reviews?.length > 0 && (
            <GlassCard className="p-5">
              <p className="text-xs font-black uppercase tracking-wide text-amber-500">Đánh giá gần nhất</p>
              <div className="mt-3 space-y-3">
                {store.reviews.slice(0, 5).map((r) => (
                  <div key={r.id} className="border-b border-line pb-2 last:border-b-0">
                    <div className="flex items-center gap-1 text-amber-500">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star key={i} className={`h-3.5 w-3.5 ${i < r.rating ? "fill-current" : ""}`} />
                      ))}
                    </div>
                    {r.content && <p className="mt-1 text-sm text-soft">{r.content}</p>}
                    <p className="text-xs text-muted">{formatRelative(r.created_at)}</p>
                  </div>
                ))}
              </div>
            </GlassCard>
          )}
        </aside>
      </div>
    </section>
  );
}
