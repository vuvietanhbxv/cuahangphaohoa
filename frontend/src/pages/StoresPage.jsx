import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  Search,
  MapPin,
  Phone,
  Navigation,
  Store as StoreIcon,
  CheckCircle2,
  ShoppingBag,
  ChevronDown,
} from "lucide-react";
import { api } from "../api/client.js";
import StoresMap from "../components/StoresMap.jsx";

const REGION_OPTIONS = [
  { value: "",      label: "Chọn miền" },
  { value: "BAC",   label: "Miền Bắc" },
  { value: "TRUNG", label: "Miền Trung" },
  { value: "NAM",   label: "Miền Nam" },
];

function StoreCardItem({ store, active, onClick }) {
  const main = store.locations?.[0];
  return (
    <button
      onClick={onClick}
      className={`theme-store-card group flex w-full gap-4 p-3 text-left transition ${active ? "active" : ""}`}
    >
      {/* Thumbnail vuông cam */}
      <div className="flex h-28 w-28 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-orange-400 to-orange-500 text-white shadow-inner">
        {store.avatar_url ? (
          <img src={store.avatar_url} alt={store.name} className="h-full w-full rounded-xl object-cover" />
        ) : (
          <StoreIcon className="h-12 w-12 opacity-90" />
        )}
      </div>

      {/* Info */}
      <div className="min-w-0 flex-1 py-1">
        <div className="flex items-start gap-2">
          <h3 className="flex-1 text-base font-black text-main group-hover:text-rose-500">
            {store.name}
          </h3>
          {store.verification_status === "VERIFIED" && (
            <CheckCircle2 className="h-4 w-4 flex-shrink-0 text-emerald-500" title="Đã xác minh" />
          )}
        </div>

        {main && (
          <p className="mt-2 flex items-start gap-1.5 text-sm text-soft">
            <MapPin className="mt-0.5 h-4 w-4 flex-shrink-0 text-orange-500" />
            <span className="line-clamp-2">
              <span className="font-bold">Địa Chỉ:</span> {main.address}
              {main.district ? `, ${main.district}` : ""}
              {main.province ? `, ${main.province}` : ""}
            </span>
          </p>
        )}

        {store.phone_masked && (
          <p className="mt-3 flex items-center gap-1.5 text-sm text-soft">
            <Phone className="h-4 w-4 text-orange-500" />
            <span className="font-bold">Điện thoại:</span>
            <span>{store.phone_masked}</span>
          </p>
        )}

        <div className="mt-3 flex flex-wrap gap-2">
          <Link
            to={`/he-thong-cua-hang/${store.slug}`}
            onClick={(e) => e.stopPropagation()}
            className="inline-flex items-center gap-1 rounded-md bg-orange-500 px-3 py-1.5 text-xs font-bold text-white shadow-sm hover:bg-orange-600"
          >
            Đến cửa hàng
          </Link>
          {main && (
            <a
              href={
                main.latitude && main.longitude
                  ? `https://www.google.com/maps/dir/?api=1&destination=${main.latitude},${main.longitude}`
                  : `https://www.google.com/maps/search/${encodeURIComponent(main.address)}`
              }
              target="_blank"
              rel="noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="inline-flex items-center gap-1 rounded-md border border-line bg-card-strong px-3 py-1.5 text-xs font-bold text-main shadow-sm hover:bg-rose-500/10"
            >
              <ShoppingBag className="h-3.5 w-3.5" /> Đặt hàng
            </a>
          )}
        </div>
      </div>
    </button>
  );
}

export default function StoresPage() {
  const [searchParams] = useSearchParams();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [provinces, setProvinces] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [activeId, setActiveId] = useState(null);
  const [userLocation, setUserLocation] = useState(null);
  const [nearbyRadius, setNearbyRadius] = useState(null);
  const [filters, setFilters] = useState({
    region: "",
    province: "",
    district: "",
    search: "",
  });

  const listRef = useRef(null);
  const cardRefs = useRef({});

  // Provinces
  useEffect(() => {
    api
      .get("/stores/locations/provinces", { params: { region: filters.region || undefined } })
      .then((d) => setProvinces(d.items || []));
    setFilters((f) => ({ ...f, province: "", district: "" }));
    setDistricts([]);
  }, [filters.region]);

  // Districts
  useEffect(() => {
    if (!filters.province) { setDistricts([]); return; }
    api
      .get("/stores/locations/districts", { params: { province_slug: filters.province } })
      .then((d) => setDistricts(d.items || []));
    setFilters((f) => ({ ...f, district: "" }));
  }, [filters.province]);

  // Stores
  useEffect(() => {
    setLoading(true);
    const t = setTimeout(() => {
      // Nếu đang ở chế độ "nearby" thì skip filter list — nearby fetch tự xử lý ở effect khác
      if (userLocation) { setLoading(false); return; }
      api
        .get("/stores", {
          params: {
            region: filters.region || undefined,
            province: filters.province || undefined,
            district: filters.district || undefined,
            search: filters.search || undefined,
            limit: 100,
          },
        })
        .then((d) => {
          setItems(d.items || []);
        })
        .finally(() => setLoading(false));
    }, 300);
    return () => clearTimeout(t);
  }, [filters, userLocation]);

  // Khi đổi active, scroll card vào view
  useEffect(() => {
    if (!activeId) return;
    const el = cardRefs.current[activeId];
    if (el && listRef.current) {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [activeId]);

  const handleFindNearest = () => {
    if (!navigator.geolocation) {
      alert("Trình duyệt không hỗ trợ định vị");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        setUserLocation({ lat, lng });
        setNearbyRadius(50);
        setLoading(true);
        try {
          const d = await api.get("/stores/nearby", { params: { lat, lng, radius: 50 } });
          setItems(d.items || []);
          if (d.items?.length > 0) setActiveId(d.items[0].id);
        } finally {
          setLoading(false);
        }
      },
      () => alert("Không lấy được vị trí. Hãy bật quyền truy cập vị trí trong trình duyệt.")
    );
  };

  const clearNearby = () => {
    setUserLocation(null);
    setNearbyRadius(null);
    setActiveId(null);
  };

  return (
    <section className="border-y border-line bg-page-soft px-5 py-12">
      {/* Title */}
      <h1 className="mb-8 text-center text-4xl font-black tracking-tight text-main md:text-5xl">
        HỆ THỐNG <span className="bg-gradient-to-r from-rose-400 to-orange-400 bg-clip-text text-transparent">CỬA HÀNG</span>
      </h1>

      <div className="mx-auto grid max-w-7xl gap-4 lg:grid-cols-[1.1fr_1fr]">
        {/* Map column */}
        <div className="theme-store-panel relative h-[680px] overflow-hidden">
          <StoresMap
            stores={items}
            activeId={activeId}
            onMarkerClick={setActiveId}
            userLocation={userLocation}
            radius={nearbyRadius}
          />
          {/* Nút tìm cửa hàng gần nhất, đè lên map */}
          <button
            onClick={userLocation ? clearNearby : handleFindNearest}
            className={`absolute right-3 top-3 z-[1000] flex items-center gap-2 rounded-xl border-2 px-3.5 py-2 text-xs font-black uppercase shadow-md transition ${
              userLocation
                ? "border-sky-500 bg-sky-500 text-white hover:bg-sky-600"
                : "border-rose-500 bg-page text-rose-400 hover:bg-rose-500/10"
            }`}
          >
            <Navigation className="h-4 w-4" />
            {userLocation ? "Bỏ chọn vị trí" : "Tìm cửa hàng gần tôi nhất"}
          </button>
        </div>

        {/* List column */}
        <div className="theme-store-panel flex h-[680px] flex-col overflow-hidden">
          {/* Filters */}
          <div className="space-y-3 border-b border-line p-4">
            <div className="relative">
              <input
                type="text"
                value={filters.search}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                placeholder="Tìm kiếm"
                className="w-full rounded-xl border border-line bg-card-strong py-2.5 pl-4 pr-10 text-sm text-main outline-none focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20"
              />
              <Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
            </div>

            <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
              <div className="relative">
                <select
                  value={filters.region}
                  onChange={(e) => setFilters({ ...filters, region: e.target.value })}
                  className="w-full appearance-none rounded-xl border border-line bg-card-strong px-3 py-2 pr-8 text-sm text-soft outline-none focus:border-rose-500"
                >
                  {REGION_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
                <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
              </div>
              <div className="relative">
                <select
                  value={filters.province}
                  onChange={(e) => setFilters({ ...filters, province: e.target.value })}
                  disabled={!provinces.length}
                  className="w-full appearance-none rounded-xl border border-line bg-card-strong px-3 py-2 pr-8 text-sm text-soft outline-none focus:border-rose-500 disabled:opacity-50"
                >
                  <option value="">Tỉnh thành</option>
                  {provinces.map((p) => <option key={p.slug} value={p.slug}>{p.province}</option>)}
                </select>
                <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
              </div>
              <div className="relative">
                <select
                  value={filters.district}
                  onChange={(e) => setFilters({ ...filters, district: e.target.value })}
                  disabled={!districts.length}
                  className="w-full appearance-none rounded-xl border border-line bg-card-strong px-3 py-2 pr-8 text-sm text-soft outline-none focus:border-rose-500 disabled:opacity-50"
                >
                  <option value="">Phường / xã</option>
                  {districts.map((d) => <option key={d.district_slug} value={d.district_slug}>{d.district}</option>)}
                </select>
                <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
              </div>
            </div>

            {userLocation && (
              <p className="rounded-lg bg-sky-500/10 px-3 py-2 text-xs text-sky-400">
                <Navigation className="mr-1 inline h-3 w-3" />
                Đang hiển thị {items.length} cửa hàng gần bạn nhất (bán kính {nearbyRadius}km).
                {items[0]?.distance_km !== undefined && ` Gần nhất: ${items[0].distance_km}km`}
              </p>
            )}
          </div>

          {/* List */}
          <div ref={listRef} className="flex-1 space-y-3 overflow-y-auto p-4">
            {loading ? (
              <p className="text-center text-muted">Đang tải...</p>
            ) : items.length === 0 ? (
              <p className="text-center text-muted">Không có cửa hàng phù hợp.</p>
            ) : (
              items.map((store) => (
                <div key={store.id} ref={(el) => (cardRefs.current[store.id] = el)}>
                  <StoreCardItem
                    store={store}
                    active={activeId === store.id}
                    onClick={() => setActiveId(store.id)}
                  />
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
