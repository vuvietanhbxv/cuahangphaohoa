import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { api } from "../api/client.js";

const SiteConfigContext = createContext({ settings: {}, banners: {}, loading: true, refresh: () => {} });

const DEFAULTS = {
  site_name: "TinCậy360",
  site_slogan: "An tâm giao dịch pháo hoa",
  primary_color: "#fbbf24",
  secondary_color: "#fb7185",
  danger_color: "#f43f5e",
  safe_color: "#34d399",
  bg_color: "#060b1d",
  logo_url: "",
  hero_eyebrow: "Cộng đồng xác thực · Dữ liệu cập nhật liên tục",
  hotline: "1900 6360",
  support_email: "hotro@tincay360.vn",
  address: "Tầng 6, 123 Trần Duy Hưng, Hà Nội",
};

export function SiteConfigProvider({ children }) {
  const [data, setData] = useState({ settings: { ...DEFAULTS }, banners: {} });
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const res = await api.get("/site/config");
      setData({
        settings: { ...DEFAULTS, ...(res.settings || {}) },
        banners: res.banners || {},
      });
    } catch (err) {
      // giữ defaults
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  // Áp dụng favicon nếu có
  useEffect(() => {
    const favicon = data.settings?.favicon_url;
    if (!favicon) return;
    const link = document.querySelector("link[rel='icon']") || (() => {
      const l = document.createElement("link");
      l.rel = "icon";
      document.head.appendChild(l);
      return l;
    })();
    link.href = favicon;
  }, [data.settings?.favicon_url]);

  // Áp dụng title
  useEffect(() => {
    const n = data.settings?.site_name;
    if (n) document.title = `${n} - ${data.settings?.site_slogan || ""}`;
  }, [data.settings?.site_name, data.settings?.site_slogan]);

  return (
    <SiteConfigContext.Provider value={{ ...data, loading, refresh }}>
      {children}
    </SiteConfigContext.Provider>
  );
}

export function useSiteConfig() {
  return useContext(SiteConfigContext);
}
