import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  TrendingUp,
  TrendingDown,
  Filter,
  CalendarDays,
} from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import { api, REGION_LABEL, REGION_VALUES } from "../api/client.js";
import { formatCurrency } from "../lib/format.js";
import {
  FireworkBurst,
  GlassCard,
  SectionTitle,
  SelectBox,
  ProductThumb,
} from "../components/ui.jsx";

export default function MarketPage() {
  const [products, setProducts] = useState([]);
  const [productId, setProductId] = useState(null);
  const [region, setRegion] = useState("BAC");
  const [history, setHistory] = useState([]);
  const [summary, setSummary] = useState([]);

  useEffect(() => {
    api.get("/products").then((data) => {
      setProducts(data.items || []);
      if ((data.items || []).length > 0 && !productId) setProductId(data.items[0].id);
    });
  }, []);

  useEffect(() => {
    api.get("/prices/summary").then((data) => setSummary(data.items || []));
  }, []);

  useEffect(() => {
    if (!productId) return;
    api
      .get("/prices/history", { params: { productId, region, days: 7 } })
      .then((data) => setHistory(data.items || []));
  }, [productId, region]);

  const productOptions = useMemo(
    () => products.map((p) => ({ value: String(p.id), label: p.name })),
    [products]
  );
  const regionOptions = useMemo(
    () => REGION_VALUES.map((r) => ({ value: r, label: `Miền ${REGION_LABEL[r]}` })),
    []
  );

  const currentSummary = summary.find(
    (row) => row.productId === productId && row.region === region
  );

  const latestPrice = history[history.length - 1]?.price || 0;
  const previousPrice = history[history.length - 2]?.price || 0;
  const priceDiff = latestPrice - previousPrice;

  const selectedProduct = products.find((p) => p.id === productId);

  return (
    <section className="relative border-y border-white/10 bg-[#080f2b] py-12 text-main">
      <FireworkBurst className="absolute -right-8 top-8 h-44 w-44 opacity-25" />
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-amber-300/50 to-transparent" />
      <div className="mx-auto max-w-7xl px-5">
        <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
          <SectionTitle
            dark
            eyebrow="Giá pháo hoa hôm nay"
            title="Bảng giá theo khu vực & sản phẩm"
            desc="Tổng hợp giá đăng bán từ cộng đồng và các nhà cung cấp uy tín. Bộ lọc giúp xem nhanh biến động giá theo miền Bắc, Trung, Nam."
          />
          <GlassCard className="grid gap-3 p-4 lg:min-w-[520px] lg:grid-cols-2">
            <SelectBox
              label="Khu vực"
              value={region}
              onChange={setRegion}
              options={regionOptions}
            />
            <SelectBox
              label="Sản phẩm"
              value={String(productId || "")}
              onChange={(v) => setProductId(Number(v))}
              options={productOptions}
            />
          </GlassCard>
        </div>

        <div className="mt-8 grid gap-5 md:grid-cols-4">
          <div className="rounded-3xl bg-gradient-to-br from-amber-300 to-orange-400 p-5 text-slate-950 shadow-xl shadow-amber-500/20">
            <p className="text-sm font-bold text-slate-800/80">Giá hôm nay</p>
            <p className="mt-2 text-3xl font-black">{formatCurrency(latestPrice)}</p>
            <p className="mt-2 inline-flex items-center gap-1 text-sm font-black">
              {priceDiff >= 0 ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
              {priceDiff >= 0 ? "+" : ""}{formatCurrency(priceDiff)} so với hôm qua
            </p>
          </div>
          <GlassCard className="p-5">
            <p className="text-sm text-muted">Giá thấp nhất</p>
            <p className="mt-2 text-2xl font-black text-main">{formatCurrency(currentSummary?.low || 0)}</p>
            <p className="mt-2 text-sm text-muted">Trong dữ liệu miền {REGION_LABEL[region]}</p>
          </GlassCard>
          <GlassCard className="p-5">
            <p className="text-sm text-muted">Giá cao nhất</p>
            <p className="mt-2 text-2xl font-black text-main">{formatCurrency(currentSummary?.high || 0)}</p>
            <p className="mt-2 text-sm text-muted">Biên độ tham khảo trong ngày</p>
          </GlassCard>
          <GlassCard className="p-5">
            <p className="text-sm text-muted">Nguồn tham chiếu</p>
            <p className="mt-2 text-2xl font-black text-main">{currentSummary?.stores || 0} cửa hàng</p>
            <p className="mt-2 text-sm text-muted">Đã ghi nhận giá niêm yết</p>
          </GlassCard>
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-[1.35fr_0.65fr]">
          <GlassCard className="p-6">
            <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
              <div className="flex items-center gap-4">
                <ProductThumb className="h-14 w-14" />
                <div>
                  <p className="text-sm font-bold text-amber-500">Biểu đồ 7 ngày qua</p>
                  <h4 className="mt-1 text-2xl font-black text-main">
                    {selectedProduct?.name || ""} · Miền {REGION_LABEL[region]}
                  </h4>
                </div>
              </div>
              <Link
                to="/submit/price"
                className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-bold text-soft hover:text-amber-500"
              >
                <CalendarDays className="h-4 w-4 text-amber-500" /> Đóng góp giá
              </Link>
            </div>
            <div className="mt-6 h-80 rounded-3xl border border-white/10 bg-slate-950/60 p-4">
              {history.length === 0 ? (
                <div className="flex h-full items-center justify-center text-sm text-muted">
                  Chưa có dữ liệu giá
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={history} margin={{ top: 10, right: 20, left: 10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" />
                    <XAxis dataKey="date" tickLine={false} axisLine={false} tick={{ fill: "#94a3b8", fontSize: 12 }} />
                    <YAxis
                      tickFormatter={(value) => `${Math.round(value / 1000)}K`}
                      tickLine={false}
                      axisLine={false}
                      tick={{ fill: "#94a3b8", fontSize: 12 }}
                    />
                    <Tooltip
                      contentStyle={{
                        background: "#0f172a",
                        border: "1px solid rgba(251,191,36,0.3)",
                        borderRadius: 16,
                        color: "#fff",
                      }}
                      formatter={(value) => formatCurrency(value)}
                      labelFormatter={(label) => `Ngày ${label}`}
                    />
                    <Line
                      type="monotone"
                      dataKey="price"
                      stroke="#fbbf24"
                      strokeWidth={4}
                      dot={{ r: 5, fill: "#fbbf24", stroke: "#fff" }}
                      activeDot={{ r: 8 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </div>
          </GlassCard>

          <GlassCard className="p-6">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-bold text-amber-500">So sánh giá</p>
                <h4 className="mt-1 text-2xl font-black text-main">Theo bộ lọc</h4>
              </div>
              <Filter className="h-6 w-6 text-amber-500" />
            </div>
            <div className="mt-5 overflow-hidden rounded-2xl border border-white/10 bg-slate-950/70">
              <table className="w-full text-left text-sm">
                <tbody className="divide-y divide-white/10">
                  <tr>
                    <td className="px-4 py-4 text-muted">Sản phẩm</td>
                    <td className="px-4 py-4 font-bold text-main">{selectedProduct?.name || "—"}</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-4 text-muted">Khu vực</td>
                    <td className="px-4 py-4 font-bold text-main">Miền {REGION_LABEL[region]}</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-4 text-muted">Giá TB</td>
                    <td className="px-4 py-4 font-black text-amber-500">
                      {formatCurrency(currentSummary?.avg || 0)}
                    </td>
                  </tr>
                  <tr>
                    <td className="px-4 py-4 text-muted">Biến động</td>
                    <td className="px-4 py-4">
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-black ${
                          (currentSummary?.change || 0) >= 0
                            ? "bg-emerald-400/10 text-emerald-300"
                            : "bg-rose-500/10 text-rose-300"
                        }`}
                      >
                        {(currentSummary?.change || 0) >= 0 ? (
                          <TrendingUp className="h-3.5 w-3.5" />
                        ) : (
                          <TrendingDown className="h-3.5 w-3.5" />
                        )}
                        {(currentSummary?.change || 0) >= 0 ? "+" : ""}
                        {currentSummary?.change || 0}%
                      </span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p className="mt-4 text-sm leading-6 text-muted">
              Dữ liệu tổng hợp từ giá người dùng đóng góp đã được admin duyệt.
            </p>
          </GlassCard>
        </div>

        <div className="mt-10">
          <h4 className="text-xl font-black text-main">Toàn bộ bảng giá hôm nay</h4>
          <div className="mt-4 overflow-x-auto rounded-2xl border border-white/10 bg-slate-950/70">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead className="bg-white/5 text-xs uppercase text-amber-200">
                <tr>
                  <th className="px-4 py-3">Sản phẩm</th>
                  <th className="px-4 py-3">Khu vực</th>
                  <th className="px-4 py-3">TB</th>
                  <th className="px-4 py-3">Thấp</th>
                  <th className="px-4 py-3">Cao</th>
                  <th className="px-4 py-3">Cửa hàng</th>
                  <th className="px-4 py-3">Biến động</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10 text-soft">
                {summary.map((row) => (
                  <tr key={`${row.productId}-${row.region}`}>
                    <td className="px-4 py-3 font-semibold">{row.product}</td>
                    <td className="px-4 py-3">Miền {REGION_LABEL[row.region]}</td>
                    <td className="px-4 py-3 font-black text-amber-500">{formatCurrency(row.avg)}</td>
                    <td className="px-4 py-3">{formatCurrency(row.low)}</td>
                    <td className="px-4 py-3">{formatCurrency(row.high)}</td>
                    <td className="px-4 py-3">{row.stores}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-black ${
                          row.change >= 0
                            ? "bg-emerald-400/10 text-emerald-300"
                            : "bg-rose-500/10 text-rose-300"
                        }`}
                      >
                        {row.change >= 0 ? "+" : ""}{row.change}%
                      </span>
                    </td>
                  </tr>
                ))}
                {summary.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-muted">
                      Chưa có dữ liệu giá
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </section>
  );
}
