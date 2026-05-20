import { MapPin, CheckCircle2, Trophy, Star } from "lucide-react";
import { GlassCard, ProductThumb, Badge } from "./ui.jsx";

export default function SellerCard({ seller }) {
  return (
    <GlassCard className="p-5 transition hover:-translate-y-1 hover:border-amber-300/30">
      <div className="flex items-start justify-between gap-3">
        <ProductThumb className="h-14 w-14" />
        <Badge variant="gold">VERIFIED</Badge>
      </div>
      <h4 className="mt-5 text-lg font-black text-main">{seller.name}</h4>
      <div className="mt-3 flex items-center gap-1 text-amber-500">
        <span className="font-black text-main">{Number(seller.ratingAvg || 0).toFixed(1)}</span>
        {Array.from({ length: 5 }).map((_, index) => (
          <Star key={index} className="h-4 w-4 fill-current" />
        ))}
      </div>
      <div className="mt-4 space-y-2 text-sm text-muted">
        <p className="flex items-center gap-2">
          <MapPin className="h-4 w-4 text-amber-500" /> {seller.location}
        </p>
        <p className="flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 text-emerald-300" /> Đã xác thực giấy tờ
        </p>
        <p className="flex items-center gap-2">
          <Trophy className="h-4 w-4 text-amber-500" /> {seller.ordersCount} giao dịch
        </p>
      </div>
    </GlassCard>
  );
}
