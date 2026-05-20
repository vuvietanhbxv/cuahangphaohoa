// Module Giao diện website — admin endpoints CMS:
//   /admin/site-settings   (bulk JSON config)
//   /admin/banners         (CRUD)
//   /admin/media           (gallery)
//   /admin/sellers/:id/branding  (admin chỉnh + duyệt branding của shop)

import { logAdminAction } from "../services/adminLog.service.js";

const BANNER_POSITIONS = ["home_hero", "home_middle", "price_page", "seller_page", "report_page"];
const BANNER_STATUSES = ["draft", "active", "scheduled", "expired", "disabled"];

function jsonValueOrRaw(value) {
  try {
    return JSON.parse(value);
  } catch {
    return value;
  }
}

export default async function adminCmsRoutes(app) {
  app.addHook("preHandler", app.requireAdmin);

  // ============================================================
  // SITE SETTINGS — key/value JSON
  // ============================================================
  app.get("/site-settings", async (request) => {
    const group = request.query.group;
    const where = group ? { group } : {};
    const rows = await app.prisma.siteSetting.findMany({ where, orderBy: { key: "asc" } });
    return {
      items: rows.map((r) => ({
        key: r.key,
        value: jsonValueOrRaw(r.value),
        type: r.type,
        group: r.group,
        description: r.description,
        updatedAt: r.updatedAt,
      })),
    };
  });

  // PATCH bulk: body = { items: [{key, value, type?, group?, description?}] }
  app.patch(
    "/site-settings",
    {
      schema: {
        body: {
          type: "object",
          required: ["items"],
          properties: {
            items: {
              type: "array",
              maxItems: 100,
              items: {
                type: "object",
                required: ["key", "value"],
                properties: {
                  key: { type: "string", minLength: 1, maxLength: 100 },
                  value: {},
                  type: { type: "string", enum: ["string", "color", "image", "json", "bool"] },
                  group: { type: "string", maxLength: 50 },
                  description: { type: "string", maxLength: 500 },
                },
              },
            },
          },
        },
      },
    },
    async (request) => {
      const updated = [];
      for (const item of request.body.items) {
        const valueStr = JSON.stringify(item.value);
        const row = await app.prisma.siteSetting.upsert({
          where: { key: item.key },
          update: {
            value: valueStr,
            type: item.type || undefined,
            group: item.group || undefined,
            description: item.description ?? undefined,
            updatedById: request.user.id,
          },
          create: {
            key: item.key,
            value: valueStr,
            type: item.type || "string",
            group: item.group || "general",
            description: item.description || null,
            updatedById: request.user.id,
          },
        });
        updated.push(row.key);
      }
      await logAdminAction(app.prisma, {
        adminId: request.user.id,
        action: "UPDATE_SITE_SETTINGS",
        targetType: "SiteSetting",
        newValue: { keys: updated },
        ipAddress: request.ip,
      });
      return { success: true, updated_keys: updated };
    }
  );

  // ============================================================
  // BANNERS
  // ============================================================
  const bannerSchema = {
    body: {
      type: "object",
      required: ["title"],
      properties: {
        title:             { type: "string", minLength: 1, maxLength: 200 },
        subtitle:          { type: "string", maxLength: 200 },
        description:       { type: "string", maxLength: 1000 },
        desktopImageUrl:   { type: "string", maxLength: 500 },
        mobileImageUrl:    { type: "string", maxLength: 500 },
        ctaPrimaryLabel:   { type: "string", maxLength: 100 },
        ctaPrimaryUrl:     { type: "string", maxLength: 500 },
        ctaSecondaryLabel: { type: "string", maxLength: 100 },
        ctaSecondaryUrl:   { type: "string", maxLength: 500 },
        position:          { type: "string", enum: BANNER_POSITIONS },
        status:            { type: "string", enum: BANNER_STATUSES },
        startAt:           { type: "string", format: "date-time" },
        endAt:             { type: "string", format: "date-time" },
        sortOrder:         { type: "integer" },
      },
    },
  };

  app.get("/banners", async (request) => {
    const where = {};
    if (request.query.position) where.position = request.query.position;
    if (request.query.status) where.status = request.query.status;
    const items = await app.prisma.banner.findMany({
      where,
      orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
    });
    return { items };
  });

  app.get("/banners/:id", async (request, reply) => {
    const banner = await app.prisma.banner.findUnique({ where: { id: Number(request.params.id) } });
    if (!banner) return reply.code(404).send({ error: "Không tìm thấy banner" });
    return banner;
  });

  app.post("/banners", { schema: bannerSchema }, async (request, reply) => {
    const data = { ...request.body };
    if (data.startAt) data.startAt = new Date(data.startAt);
    if (data.endAt) data.endAt = new Date(data.endAt);
    data.createdById = request.user.id;
    data.updatedById = request.user.id;
    const banner = await app.prisma.banner.create({ data });
    await logAdminAction(app.prisma, {
      adminId: request.user.id, action: "CREATE_BANNER",
      targetType: "Banner", targetId: banner.id, newValue: banner, ipAddress: request.ip,
    });
    return reply.code(201).send(banner);
  });

  app.patch("/banners/:id", { schema: bannerSchema }, async (request, reply) => {
    const id = Number(request.params.id);
    const existing = await app.prisma.banner.findUnique({ where: { id } });
    if (!existing) return reply.code(404).send({ error: "Không tìm thấy banner" });
    const data = { ...request.body };
    if (data.startAt) data.startAt = new Date(data.startAt);
    if (data.endAt) data.endAt = new Date(data.endAt);
    data.updatedById = request.user.id;
    const banner = await app.prisma.banner.update({ where: { id }, data });
    await logAdminAction(app.prisma, {
      adminId: request.user.id, action: "UPDATE_BANNER",
      targetType: "Banner", targetId: id, oldValue: existing, newValue: banner, ipAddress: request.ip,
    });
    return banner;
  });

  app.delete("/banners/:id", async (request, reply) => {
    const id = Number(request.params.id);
    const existing = await app.prisma.banner.findUnique({ where: { id } });
    if (!existing) return reply.code(404).send({ error: "Không tìm thấy banner" });
    await app.prisma.banner.delete({ where: { id } });
    await logAdminAction(app.prisma, {
      adminId: request.user.id, action: "DELETE_BANNER",
      targetType: "Banner", targetId: id, oldValue: existing, ipAddress: request.ip,
    });
    return { success: true };
  });

  // ============================================================
  // MEDIA ASSETS
  // ============================================================
  app.get("/media", async (request) => {
    const usage = request.query.usage_type;
    const limit = Math.min(Number(request.query.limit || 100), 500);
    const where = {};
    if (usage) where.usageType = usage;

    const items = await app.prisma.mediaAsset.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: limit,
    });
    return {
      items: items.map((m) => ({
        id: m.id,
        file_url: m.fileUrl,
        file_name: m.fileName,
        mime_type: m.mimeType,
        file_size: m.fileSize,
        width: m.width,
        height: m.height,
        usage_type: m.usageType,
        visibility: m.visibility,
        uploaded_by_id: m.uploadedById,
        report_id: m.reportId,
        created_at: m.createdAt,
      })),
    };
  });

  app.delete("/media/:id", async (request, reply) => {
    const id = Number(request.params.id);
    const existing = await app.prisma.mediaAsset.findUnique({ where: { id } });
    if (!existing) return reply.code(404).send({ error: "Không tìm thấy" });
    if (existing.visibility === "private" || existing.usageType === "report_evidence") {
      return reply.code(403).send({ error: "Không xoá được media là bằng chứng báo cáo." });
    }
    await app.prisma.mediaAsset.delete({ where: { id } });
    await logAdminAction(app.prisma, {
      adminId: request.user.id, action: "DELETE_MEDIA",
      targetType: "MediaAsset", targetId: id, oldValue: existing, ipAddress: request.ip,
    });
    return { success: true };
  });

  // ============================================================
  // SELLER BRANDING — admin chỉnh + duyệt hồ sơ thiết kế shop
  // ============================================================
  const sellerBrandingSchema = {
    body: {
      type: "object",
      properties: {
        coverUrl:         { type: "string", maxLength: 500 },
        mobileCoverUrl:   { type: "string", maxLength: 500 },
        thumbnailUrl:     { type: "string", maxLength: 500 },
        brandColor:       { type: "string", maxLength: 20 },
        slogan:           { type: "string", maxLength: 200 },
        featuredImageUrl: { type: "string", maxLength: 500 },
        brandingStatus:   { type: "string", enum: ["PENDING", "APPROVED", "REJECTED", "DISABLED"] },
        brandingRejectReason: { type: "string", maxLength: 500 },
      },
    },
  };

  app.get("/sellers-branding", async (request) => {
    const status = request.query.status || "PENDING";
    const items = await app.prisma.seller.findMany({
      where: { brandingStatus: status },
      orderBy: { createdAt: "desc" },
      take: 100,
      select: {
        id: true, name: true, slogan: true, brandColor: true,
        thumbnailUrl: true, coverUrl: true, mobileCoverUrl: true,
        featuredImageUrl: true, brandingStatus: true, brandingRejectReason: true,
        location: true, ratingAvg: true, ordersCount: true,
      },
    });
    return { items };
  });

  app.patch("/sellers/:id/branding", { schema: sellerBrandingSchema }, async (request, reply) => {
    const id = Number(request.params.id);
    const seller = await app.prisma.seller.findUnique({ where: { id } });
    if (!seller) return reply.code(404).send({ error: "Không tìm thấy shop" });
    const data = {};
    const allowed = ["coverUrl", "mobileCoverUrl", "thumbnailUrl", "brandColor", "slogan", "featuredImageUrl", "brandingStatus", "brandingRejectReason"];
    for (const k of allowed) {
      if (request.body[k] !== undefined) data[k] = request.body[k] || null;
    }
    if (data.brandingStatus === "APPROVED") {
      data.brandingApprovedById = request.user.id;
      data.brandingRejectReason = null;
    }
    const updated = await app.prisma.seller.update({ where: { id }, data });
    await logAdminAction(app.prisma, {
      adminId: request.user.id,
      action: `SELLER_BRANDING_${data.brandingStatus || "UPDATE"}`,
      targetType: "Seller", targetId: id,
      oldValue: { brandingStatus: seller.brandingStatus, brandColor: seller.brandColor, slogan: seller.slogan },
      newValue: data, ipAddress: request.ip,
    });
    return updated;
  });
}
