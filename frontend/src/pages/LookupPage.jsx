import LookupCard from "../components/LookupCard.jsx";
import { SectionTitle } from "../components/ui.jsx";

export default function LookupPage() {
  return (
    <section className="mx-auto max-w-3xl px-5 py-12">
      <SectionTitle
        dark
        eyebrow="Tra cứu lừa đảo"
        title="Kiểm tra số điện thoại / số tài khoản"
        desc="Dữ liệu được đối chiếu với danh sách báo cáo đã duyệt và danh sách người bán uy tín."
      />
      <div className="mt-6">
        <LookupCard />
      </div>
    </section>
  );
}
