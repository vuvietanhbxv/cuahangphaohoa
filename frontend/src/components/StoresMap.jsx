import { useEffect, useMemo, useRef } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap, Circle } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Fix marker icon mặc định Leaflet bị mất khi bundling qua Vite.
import iconUrl from "leaflet/dist/images/marker-icon.png";
import iconRetinaUrl from "leaflet/dist/images/marker-icon-2x.png";
import iconShadow from "leaflet/dist/images/marker-shadow.png";

L.Icon.Default.mergeOptions({
  iconUrl,
  iconRetinaUrl,
  shadowUrl: iconShadow,
});

// Marker custom màu cam giống Z121
const orangeIcon = L.divIcon({
  className: "store-marker",
  html: `<div style="width:24px;height:24px;border-radius:50%;background:linear-gradient(135deg,#fb923c,#ef4444);border:3px solid white;box-shadow:0 4px 12px rgba(0,0,0,0.25);"></div>`,
  iconSize: [24, 24],
  iconAnchor: [12, 12],
});

const activeIcon = L.divIcon({
  className: "store-marker-active",
  html: `<div style="width:30px;height:30px;border-radius:50%;background:#dc2626;border:4px solid white;box-shadow:0 6px 16px rgba(220,38,38,0.5);animation:pulse 1.5s infinite;"></div>`,
  iconSize: [30, 30],
  iconAnchor: [15, 15],
});

// Việt Nam center
const VN_CENTER = [16.0, 106.5];
const VN_ZOOM = 5;

function FlyToActive({ position, zoom = 14 }) {
  const map = useMap();
  useEffect(() => {
    if (position) map.flyTo(position, zoom, { duration: 0.6 });
  }, [position, zoom, map]);
  return null;
}

export default function StoresMap({ stores = [], activeId, onMarkerClick, userLocation, radius }) {
  // Flatten thành markers (mỗi location 1 marker)
  const markers = useMemo(() => {
    const list = [];
    for (const s of stores) {
      for (const loc of s.locations || []) {
        if (loc.latitude && loc.longitude) {
          list.push({
            id: `${s.id}-${loc.id || 0}`,
            storeId: s.id,
            storeName: s.name,
            slug: s.slug,
            position: [loc.latitude, loc.longitude],
            address: loc.address,
            branchName: loc.branch_name,
            phone: s.phone_masked,
            province: loc.province,
            district: loc.district,
          });
        }
      }
    }
    return list;
  }, [stores]);

  const activeMarker = markers.find((m) => m.storeId === activeId);

  return (
    <MapContainer
      center={VN_CENTER}
      zoom={VN_ZOOM}
      scrollWheelZoom
      className="h-full w-full"
      style={{ minHeight: 560 }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      {markers.map((m) => (
        <Marker
          key={m.id}
          position={m.position}
          icon={m.storeId === activeId ? activeIcon : orangeIcon}
          eventHandlers={{
            click: () => onMarkerClick?.(m.storeId),
          }}
        >
          <Popup>
            <div className="font-sans">
              <p className="m-0 text-sm font-black text-slate-900">{m.storeName}</p>
              {m.branchName && <p className="m-0 mt-0.5 text-xs text-slate-600">{m.branchName}</p>}
              <p className="m-0 mt-1 text-xs text-slate-600">{m.address}</p>
              {m.phone && <p className="m-0 mt-1 text-xs text-slate-700"><b>📞</b> {m.phone}</p>}
            </div>
          </Popup>
        </Marker>
      ))}

      {/* User location + radius khi tìm gần nhất */}
      {userLocation && (
        <>
          <Marker
            position={[userLocation.lat, userLocation.lng]}
            icon={L.divIcon({
              className: "user-marker",
              html: `<div style="width:18px;height:18px;border-radius:50%;background:#0ea5e9;border:3px solid white;box-shadow:0 0 0 6px rgba(14,165,233,0.25);"></div>`,
              iconSize: [18, 18],
              iconAnchor: [9, 9],
            })}
          >
            <Popup>Vị trí của bạn</Popup>
          </Marker>
          {radius && (
            <Circle
              center={[userLocation.lat, userLocation.lng]}
              radius={radius * 1000}
              pathOptions={{ color: "#0ea5e9", weight: 2, fillColor: "#0ea5e9", fillOpacity: 0.08 }}
            />
          )}
        </>
      )}

      {activeMarker && <FlyToActive position={activeMarker.position} zoom={14} />}
      {userLocation && !activeMarker && <FlyToActive position={[userLocation.lat, userLocation.lng]} zoom={12} />}
    </MapContainer>
  );
}
