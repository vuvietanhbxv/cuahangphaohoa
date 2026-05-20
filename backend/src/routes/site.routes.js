// Public endpoints để frontend public lấy cấu hình site + banner active.

function jsonValueOrRaw(value) {
  try {
    return JSON.parse(value);
  } catch {
    return value;
  }
}

export default async function siteRoutes(app) {
  app.get("/config", async () => {
    const [settings, banners] = await Promise.all([
      app.prisma.siteSetting.findMany(),
      app.prisma.banner.findMany({
        where: { status: "active" },
        orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
      }),
    ]);

    // Lọc theo lịch chạy (startAt/endAt)
    const now = Date.now();
    const activeBanners = banners.filter((b) => {
      if (b.startAt && new Date(b.startAt).getTime() > now) return false;
      if (b.endAt && new Date(b.endAt).getTime() < now) return false;
      return true;
    });

    // Map settings về object phẳng key→value đã parse
    const settingsMap = {};
    for (const s of settings) {
      settingsMap[s.key] = jsonValueOrRaw(s.value);
    }

    // Gom banner theo position
    const bannersByPosition = {};
    for (const b of activeBanners) {
      if (!bannersByPosition[b.position]) bannersByPosition[b.position] = [];
      bannersByPosition[b.position].push({
        id: b.id,
        title: b.title,
        subtitle: b.subtitle,
        description: b.description,
        desktop_image_url: b.desktopImageUrl,
        mobile_image_url: b.mobileImageUrl,
        cta_primary_label: b.ctaPrimaryLabel,
        cta_primary_url: b.ctaPrimaryUrl,
        cta_secondary_label: b.ctaSecondaryLabel,
        cta_secondary_url: b.ctaSecondaryUrl,
      });
    }

    return {
      settings: settingsMap,
      banners: bannersByPosition,
    };
  });
}
