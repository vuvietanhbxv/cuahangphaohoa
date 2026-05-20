// Public APIs cho module "Hệ thống cửa hàng".

import { VN_PROVINCES, provinceSlug } from "../lib/locations.js";
import { maskPhone, maskAccount } from "../lib/normalize.js";

function maskedStore(s, includeFull = false) {
  return {
    id: s.id,
    name: s.name,
    slug: s.slug,
    description: s.description,
    avatar_url: s.avatarUrl,
    cover_url: s.coverUrl,
    brand_color: s.brandColor,
    phone_masked: s.phoneNormalized ? maskPhone(s.phoneNormalized) : null,
    phone: includeFull ? s.phone : undefined,
    bank_account_masked: s.bankAccountNormalized ? maskAccount(s.bankAccountNormalized) : null,
    bank_name: s.bankName,
    bank_owner_name: includeFull ? s.bankOwnerName : null,
    email: s.email,
    website: s.website,
    facebook_url: s.facebookUrl,
    zalo_url: s.zaloUrl,
    opening_hours: s.openingHours,
    verification_status: s.verificationStatus,
    trust_score: s.trustScore,
    rating: s.rating,
    review_count: s.reviewCount,
    successful_transactions: s.successfulTransactions,
    warning_count: s.warningCount,
    has_price_today: s.hasPriceToday,
    locations: (s.locations || []).map((l) => ({
      id: l.id,
      branch_name: l.branchName,
      region: l.region,
      province: l.province,
      province_slug: l.provinceSlug,
      district: l.district,
      district_slug: l.districtSlug,
      ward: l.ward,
      address: l.address,
      latitude: l.latitude,
      longitude: l.longitude,
      phone: l.phone,
      opening_hours: l.openingHours,
      is_main_branch: l.isMainBranch,
    })),
    store_products: (s.storeProducts || []).map((p) => ({
      product_id: p.productId,
      product_name: p.product?.name,
      product_slug: p.product?.slug,
      price: p.price,
      stock_status: p.stockStatus,
    })),
    reviews_count_public: s._count?.reviews || 0,
    created_at: s.createdAt,
  };
}

function distanceKm(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export default async function storesRoutes(app) {
  // ============================================================
  // Locations meta
  // ============================================================
  app.get("/locations/provinces", async (request) => {
    const region = request.query.region;
    const list = region ? VN_PROVINCES.filter((p) => p.region === region) : VN_PROVINCES;
    return {
      items: list.map((p) => ({
        region: p.region,
        province: p.province,
        slug: p.slug,
      })),
    };
  });

  app.get("/locations/districts", async (request) => {
    const province = request.query.province_slug || request.query.province;
    if (!province) return { items: [] };
    const found = VN_PROVINCES.find((p) => p.slug === province || p.province === province);
    if (!found) return { items: [] };
    return {
      items: found.districts.map((d) => ({ district: d, district_slug: provinceSlug(d) })),
    };
  });

  // ============================================================
  // Stores list — có filter
  // ============================================================
  app.get("/", async (request) => {
    const { region, province, district, verified, product, search, page = 1, limit = 24 } = request.query;
    const skip = (Number(page) - 1) * Number(limit);

    const where = { status: "ACTIVE" };
    if (verified === "true") where.verificationStatus = "VERIFIED";
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { phoneNormalized: { contains: String(search).replace(/\D/g, "") } },
      ];
    }

    // Filter theo location
    if (region || province || district) {
      where.locations = {
        some: {
          ...(region ? { region } : {}),
          ...(province ? { OR: [{ provinceSlug: province }, { province }] } : {}),
          ...(district ? { OR: [{ districtSlug: district }, { district }] } : {}),
        },
      };
    }

    // Filter theo product slug
    if (product) {
      where.storeProducts = {
        some: { product: { slug: product } },
      };
    }

    const [items, total] = await Promise.all([
      app.prisma.store.findMany({
        where,
        orderBy: [
          { verificationStatus: "asc" }, // VERIFIED trước
          { trustScore: "desc" },
          { rating: "desc" },
        ],
        include: {
          locations: { orderBy: [{ isMainBranch: "desc" }] },
          storeProducts: { include: { product: true } },
        },
        skip,
        take: Number(limit),
      }),
      app.prisma.store.count({ where }),
    ]);

    return {
      items: items.map((s) => maskedStore(s)),
      total,
      page: Number(page),
      limit: Number(limit),
    };
  });

  // ============================================================
  // Store detail
  // ============================================================
  app.get("/:slug", async (request, reply) => {
    const store = await app.prisma.store.findUnique({
      where: { slug: request.params.slug },
      include: {
        locations: { orderBy: [{ isMainBranch: "desc" }] },
        storeProducts: { include: { product: true } },
        reviews: {
          where: { status: "APPROVED" },
          orderBy: { createdAt: "desc" },
          take: 20,
        },
        _count: { select: { reviews: { where: { status: "APPROVED" } } } },
      },
    });
    if (!store || store.status !== "ACTIVE") {
      return reply.code(404).send({ error: "Không tìm thấy cửa hàng" });
    }

    // Tra cứu warning từ lookup module
    let lookupRisk = null;
    if (store.phoneNormalized) {
      const reports = await app.prisma.fraudReport.findMany({
        where: {
          entity: { type: "PHONE", normalizedValue: store.phoneNormalized },
          status: { in: ["VERIFIED", "REVIEWING", "PENDING"] },
        },
        select: { status: true, riskLevelInput: true, createdAt: true },
      });
      lookupRisk = {
        total_reports: reports.length,
        verified_count: reports.filter((r) => r.status === "VERIFIED").length,
        pending_count: reports.filter((r) => r.status !== "VERIFIED").length,
        last_reported_at: reports[0]?.createdAt || null,
      };
    }

    return {
      ...maskedStore(store),
      reviews: store.reviews.map((r) => ({
        id: r.id,
        rating: r.rating,
        content: r.content,
        transaction_status: r.transactionStatus,
        created_at: r.createdAt,
      })),
      lookup_risk: lookupRisk,
    };
  });

  // ============================================================
  // Nearby search
  // ============================================================
  app.get("/nearby", async (request, reply) => {
    const lat = Number(request.query.lat);
    const lng = Number(request.query.lng);
    const radius = Math.min(Number(request.query.radius || 10), 50); // km
    if (!isFinite(lat) || !isFinite(lng)) {
      return reply.code(400).send({ error: "lat/lng không hợp lệ" });
    }

    // Lấy toàn bộ cửa hàng ACTIVE có toạ độ (đơn giản cho MVP, sau có thể dùng PostGIS)
    const stores = await app.prisma.store.findMany({
      where: {
        status: "ACTIVE",
        locations: { some: { latitude: { not: null }, longitude: { not: null } } },
      },
      include: { locations: { where: { latitude: { not: null } } } },
    });

    const results = [];
    for (const s of stores) {
      for (const loc of s.locations) {
        const d = distanceKm(lat, lng, loc.latitude, loc.longitude);
        if (d <= radius) {
          results.push({
            ...maskedStore({ ...s, locations: [loc] }),
            distance_km: Number(d.toFixed(2)),
            location_id: loc.id,
          });
        }
      }
    }
    results.sort((a, b) => a.distance_km - b.distance_km);
    return { items: results.slice(0, 50) };
  });
}
