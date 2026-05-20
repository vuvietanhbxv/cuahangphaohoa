import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { MapPin, Phone, ArrowRight, CheckCircle2, Store as StoreIcon } from "lucide-react";
import { api } from "../api/client.js";
import StoresMap from "./StoresMap.jsx";

export default function StoresTeaser() {
  const [items, setItems] = useState([]);
  const [activeId, setActiveId] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get("/stores", { params: { verified: "true", limit: 6 } })
      .then((d) => setItems(d.items || []))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="grid gap-4 lg:grid-cols-[1.2fr_1fr]">
      {/* Map */}
      <div className="theme-store-panel relative h-[420px] overflow-hidden">
        <StoresMap
          stores={items}
          activeId={activeId}
          onMarkerClick={setActiveId}
        />
        <Link
          to="/he-thong-cua-hang"
          className="absolute right-3 top-3 z-[1000] inline-flex items-center gap-1 rounded-xl border-2 border-rose-500 bg-page px-3 py-1.5 text-xs font-black uppercase text-rose-400 shadow-md hover:bg-rose-500/10"
        >
          Xem toàn bộ <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>

      {/* List */}
      <div className="space-y-3">
        {loading ? (
          <p className="text-muted">Đang tải...</p>
        ) : items.length === 0 ? (
          <p className="text-muted">Chưa có cửa hàng nào.</p>
        ) : (
          items.slice(0, 4).map((store) => {
            const main = store.locations?.[0];
            const active = activeId === store.id;
            return (
              <button
                key={store.id}
                onClick={() => setActiveId(store.id)}
                className={`theme-store-card group flex w-full gap-3 p-3 text-left transition ${active ? "active" : ""}`}
              >
                <div className="flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-orange-400 to-orange-500 text-white">
                  {store.avatar_url ? (
                    <img src={store.avatar_url} alt={store.name} className="h-full w-full rounded-xl object-cover" />
                  ) : (
                    <StoreIcon className="h-7 w-7" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1">
                    <p className="truncate text-sm font-black text-main">{store.name}</p>
                    {store.verification_status === "VERIFIED" && (
                      <CheckCircle2 className="h-3.5 w-3.5 flex-shrink-0 text-emerald-500" />
                    )}
                  </div>
                  {main && (
                    <p className="mt-0.5 flex items-start gap-1 text-xs text-soft">
                      <MapPin className="mt-0.5 h-3 w-3 flex-shrink-0 text-orange-500" />
                      <span className="line-clamp-1">{main.province}{main.district ? ` · ${main.district}` : ""}</span>
                    </p>
                  )}
                  {store.phone_masked && (
                    <p className="mt-0.5 flex items-center gap-1 text-xs text-muted">
                      <Phone className="h-3 w-3 text-orange-500" />
                      {store.phone_masked}
                    </p>
                  )}
                  <div className="mt-1.5 flex gap-1.5">
                    <Link
                      to={`/he-thong-cua-hang/${store.slug}`}
                      onClick={(e) => e.stopPropagation()}
                      className="rounded-md bg-orange-500 px-2.5 py-1 text-[11px] font-bold text-white hover:bg-orange-600"
                    >
                      Đến cửa hàng
                    </Link>
                  </div>
                </div>
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}
