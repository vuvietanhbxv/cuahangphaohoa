import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api, REGION_LABEL, REGION_VALUES } from "../api/client.js";
import {
  GlassCard,
  PrimaryButton,
  SectionTitle,
  SelectBox,
  TextInput,
} from "../components/ui.jsx";

export default function SubmitPricePage() {
  const [products, setProducts] = useState([]);
  const [form, setForm] = useState({
    productId: "",
    region: "BAC",
    price: "",
    storeName: "",
    storeUrl: "",
    priceDate: new Date().toISOString().slice(0, 10),
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    api.get("/products").then((data) => {
      setProducts(data.items || []);
      if (data.items?.length > 0) setForm((f) => ({ ...f, productId: String(data.items[0].id) }));
    });
  }, []);

  const update = (key, value) => setForm((f) => ({ ...f, [key]: value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await api.post(
        "/prices",
        {
          productId: Number(form.productId),
          region: form.region,
          price: Number(form.price),
          storeName: form.storeName,
          storeUrl: form.storeUrl || undefined,
          priceDate: form.priceDate,
        },
        { auth: true }
      );
      setSuccess(true);
      setForm((f) => ({ ...f, price: "", storeName: "", storeUrl: "" }));
    } catch (err) {
      setError(err.message || "Gửi giá thất bại");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="mx-auto max-w-2xl px-5 py-12">
      <SectionTitle
        dark
        eyebrow="Đóng góp cộng đồng"
        title="Đăng giá pháo hoa từ cửa hàng"
        desc="Giá sẽ chờ admin duyệt rồi tổng hợp vào bảng giá ngày."
      />
      <GlassCard className="mt-6 p-6">
        {success && (
          <div className="mb-4 rounded-xl bg-emerald-400/10 px-4 py-3 text-sm text-emerald-200">
            Đã gửi! Giá đang chờ duyệt.
          </div>
        )}
        <form onSubmit={handleSubmit} className="space-y-4">
          <SelectBox
            label="Sản phẩm"
            value={form.productId}
            onChange={(v) => update("productId", v)}
            options={products.map((p) => ({ value: String(p.id), label: p.name }))}
          />
          <SelectBox
            label="Khu vực"
            value={form.region}
            onChange={(v) => update("region", v)}
            options={REGION_VALUES.map((r) => ({ value: r, label: `Miền ${REGION_LABEL[r]}` }))}
          />
          <TextInput
            label="Giá (VND)"
            type="number"
            min="1000"
            value={form.price}
            onChange={(e) => update("price", e.target.value)}
            required
          />
          <TextInput
            label="Tên cửa hàng"
            value={form.storeName}
            onChange={(e) => update("storeName", e.target.value)}
            required
          />
          <TextInput
            label="Link cửa hàng (tuỳ chọn)"
            value={form.storeUrl}
            onChange={(e) => update("storeUrl", e.target.value)}
            placeholder="https://..."
          />
          <TextInput
            label="Ngày niêm yết"
            type="date"
            value={form.priceDate}
            onChange={(e) => update("priceDate", e.target.value)}
            required
          />
          {error && <p className="rounded-xl bg-rose-500/10 px-4 py-2 text-sm text-rose-200">{error}</p>}
          <div className="flex gap-3">
            <PrimaryButton type="submit" disabled={loading}>
              {loading ? "Đang gửi..." : "Gửi giá"}
            </PrimaryButton>
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="rounded-2xl border border-white/10 bg-white/5 px-5 py-3 text-sm font-bold text-soft hover:bg-white/10"
            >
              Huỷ
            </button>
          </div>
        </form>
      </GlassCard>
    </section>
  );
}
