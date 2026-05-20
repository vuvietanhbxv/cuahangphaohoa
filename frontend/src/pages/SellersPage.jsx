import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { SectionTitle, TextInput } from "../components/ui.jsx";
import { api } from "../api/client.js";
import SellerCard from "../components/SellerCard.jsx";

export default function SellersPage() {
  const [items, setItems] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const t = setTimeout(() => {
      api
        .get("/sellers", { params: { search: search || undefined, limit: 60 } })
        .then((data) => setItems(data.items || []))
        .finally(() => setLoading(false));
    }, 300);
    return () => clearTimeout(t);
  }, [search]);

  return (
    <section className="mx-auto max-w-7xl px-5 py-12">
      <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
        <SectionTitle
          dark
          eyebrow="Người bán uy tín"
          title="Danh sách đã xác minh"
          desc="Tìm theo tên cửa hàng để xem thông tin liên hệ và đánh giá cộng đồng."
        />
        <div className="flex items-end gap-3">
          <div className="w-72">
            <TextInput
              label="Tìm kiếm"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Tên cửa hàng..."
            />
          </div>
          <Link
            to="/submit/seller"
            className="h-12 rounded-2xl bg-gradient-to-r from-amber-300 to-orange-400 px-5 text-sm font-black text-slate-950 shadow-lg shadow-amber-500/20 hover:from-yellow-200 hover:to-amber-300 inline-flex items-center"
          >
            Đăng ký người bán
          </Link>
        </div>
      </div>

      <div className="mt-7 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {loading ? (
          <p className="text-muted">Đang tải...</p>
        ) : items.length === 0 ? (
          <p className="text-muted">Không có người bán nào.</p>
        ) : (
          items.map((seller) => <SellerCard key={seller.id} seller={seller} />)
        )}
      </div>
    </section>
  );
}
