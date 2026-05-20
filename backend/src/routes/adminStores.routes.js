// Admin endpoints quản lý hệ thống cửa hàng.

import { logAdminAction } from "../services/adminLog.service.js";
import { VN_PROVINCES, provinceSlug } from "../lib/locations.js";

const digits = (s) => String(s || "").replace(/\D/g, "");

const storeBodySchema = {
  body: {
    type: "object",
    required: ["name", "slug"],
    properties: {
      name:          { type: "string", minLength: 1, maxLength: 200 },
      slug:          { type: "string", minLength: 1, maxLength: 200, pattern: "^[a-z0-9-]+$" },
      description:   { type: "string", maxLength: 2000 },
      avatarUrl:     { type: "string", maxLength: 500 },
      coverUrl:      { type: "string", maxLength: 500 },
      phone:         { type: "string", maxLength: 30 },
      email:         { type: "string", maxLength: 200 },
      website:       { type: "string", maxLength: 500 },
      facebookUrl:   { type: "string", maxLength: 500 },
      zaloUrl:       { type: "string", maxLength: 500 },
      bankAccount:   { type: "string", maxLength: 40 },
      bankName:      { type: "string", maxLength: 100 },
      bankOwnerName: { type: "string", maxLength: 200 },
      brandColor:    { type: "string", maxLength: 20 },
      openingHours:  { type: "string", maxLength: 200 },
      verificationStatus: { type: "string", enum: ["PENDING", "VERIFIED", "REJECTED", "UNDER_REVIEW"] },
      status:        { type: "string", enum: ["ACTIVE", "HIDDEN", "SUSPENDED"] },
      rejectReason:  { type: "string", maxLength: 500 },
      trustScore:    { type: "integer", minimum: 0, maximum: 100 },
    },
  },
};

const locationBodySchema = {
  body: {
    type: "object",
    required: ["region", "province", "address"],
    properties: {
      branchName:   { type: "string", maxLength: 200 },
      region:       { type: "string", enum: ["BAC", "TRUNG", "NAM"] },
      province:     { type: "string", maxLength: 100 },
      provinceSlug: { type: "string", maxLength: 100 },
      district:     { type: "string", maxLength: 100 },
      districtSlug: { type: "string", maxLength: 100 },
      ward:         { type: "string", maxLength: 100 },
      address:      { type: "string", minLength: 1, maxLength: 500 },
      latitude:     { type: "number" },
      longitude:    { type: "number" },
      phone:        { type: "string", maxLength: 30 },
      openingHours: { type: "string", maxLength: 200 },
      isMainBranch: { type: "boolean" },
      status:       { type: "string", enum: ["ACTIVE", "CLOSED"] },
    },
  },
};

export default async function adminStoresRoutes(app) {
  app.addHook("preHandler", app.requireAdmin);

  // ============================================================
  // Stores list
  // ============================================================
  app.get("/stores", async (request) => {
    const { region, province, verification_status, status, search, limit = 200 } = request.query;
    const where = {};
    if (status) where.status = status;
    if (verification_status) where.verificationStatus = verification_status;
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { phoneNormalized: { contains: digits(search) || "_no_match_" } },
      ];
    }
    if (region || province) {
      where.locations = {
        some: {
          ...(region ? { region } : {}),
          ...(province ? { OR: [{ provinceSlug: province }, { province }] } : {}),
        },
      };
    }
    const items = await app.prisma.store.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        locations: { take: 3, orderBy: [{ isMainBranch: "desc" }] },
        _count: { select: { locations: true, storeProducts: true } },
      },
      take: Math.min(Number(limit), 500),
    });
    return { items };
  });

  app.get("/stores/:id", async (request, reply) => {
    const id = Number(request.params.id);
    const store = await app.prisma.store.findUnique({
      where: { id },
      include: {
        locations: { orderBy: [{ isMainBranch: "desc" }] },
        storeProducts: { include: { product: true } },
        verifications: { orderBy: { createdAt: "desc" } },
      },
    });
    if (!store) return reply.code(404).send({ error: "Không tìm thấy" });
    return store;
  });

  app.post("/stores", { schema: storeBodySchema }, async (request, reply) => {
    const body = request.body;
    try {
      const store = await app.prisma.store.create({
        data: {
          ...body,
          phoneNormalized: digits(body.phone),
          bankAccountNormalized: digits(body.bankAccount),
        },
      });
      await logAdminAction(app.prisma, {
        adminId: request.user.id,
        action: "CREATE_STORE",
        targetType: "Store",
        targetId: store.id,
        newValue: { name: store.name, slug: store.slug },
        ipAddress: request.ip,
      });
      return reply.code(201).send(store);
    } catch (err) {
      return reply.code(409).send({ error: "Slug đã tồn tại hoặc dữ liệu không hợp lệ." });
    }
  });

  app.patch("/stores/:id", { schema: storeBodySchema }, async (request, reply) => {
    const id = Number(request.params.id);
    const existing = await app.prisma.store.findUnique({ where: { id } });
    if (!existing) return reply.code(404).send({ error: "Không tìm thấy" });
    const body = request.body;
    const data = {
      ...body,
      phoneNormalized: body.phone !== undefined ? digits(body.phone) : undefined,
      bankAccountNormalized: body.bankAccount !== undefined ? digits(body.bankAccount) : undefined,
    };
    const store = await app.prisma.store.update({ where: { id }, data });
    await logAdminAction(app.prisma, {
      adminId: request.user.id,
      action: "UPDATE_STORE",
      targetType: "Store",
      targetId: id,
      oldValue: { name: existing.name, verificationStatus: existing.verificationStatus },
      newValue: data,
      ipAddress: request.ip,
    });
    return store;
  });

  app.delete("/stores/:id", async (request, reply) => {
    const id = Number(request.params.id);
    const existing = await app.prisma.store.findUnique({ where: { id } });
    if (!existing) return reply.code(404).send({ error: "Không tìm thấy" });
    await app.prisma.store.delete({ where: { id } });
    await logAdminAction(app.prisma, {
      adminId: request.user.id,
      action: "DELETE_STORE",
      targetType: "Store",
      targetId: id,
      oldValue: existing,
      ipAddress: request.ip,
    });
    return { success: true };
  });

  // Verify / Suspend shortcut
  app.post("/stores/:id/verify", async (request, reply) => {
    const id = Number(request.params.id);
    const existing = await app.prisma.store.findUnique({ where: { id } });
    if (!existing) return reply.code(404).send({ error: "Không tìm thấy" });
    const store = await app.prisma.store.update({
      where: { id },
      data: { verificationStatus: "VERIFIED", rejectReason: null },
    });
    await logAdminAction(app.prisma, {
      adminId: request.user.id, action: "VERIFY_STORE",
      targetType: "Store", targetId: id, ipAddress: request.ip,
    });
    return store;
  });

  app.post("/stores/:id/reject", async (request, reply) => {
    const id = Number(request.params.id);
    const reason = request.body?.reject_reason || "";
    const store = await app.prisma.store.update({
      where: { id },
      data: { verificationStatus: "REJECTED", rejectReason: reason },
    });
    await logAdminAction(app.prisma, {
      adminId: request.user.id, action: "REJECT_STORE",
      targetType: "Store", targetId: id, note: reason, ipAddress: request.ip,
    });
    return store;
  });

  app.post("/stores/:id/suspend", async (request, reply) => {
    const id = Number(request.params.id);
    const store = await app.prisma.store.update({
      where: { id },
      data: { status: "SUSPENDED" },
    });
    await logAdminAction(app.prisma, {
      adminId: request.user.id, action: "SUSPEND_STORE",
      targetType: "Store", targetId: id, ipAddress: request.ip,
    });
    return store;
  });

  app.post("/stores/:id/activate", async (request, reply) => {
    const id = Number(request.params.id);
    const store = await app.prisma.store.update({
      where: { id },
      data: { status: "ACTIVE" },
    });
    await logAdminAction(app.prisma, {
      adminId: request.user.id, action: "ACTIVATE_STORE",
      targetType: "Store", targetId: id, ipAddress: request.ip,
    });
    return store;
  });

  // ============================================================
  // Locations / Branches
  // ============================================================
  app.post("/stores/:id/locations", { schema: locationBodySchema }, async (request, reply) => {
    const storeId = Number(request.params.id);
    const store = await app.prisma.store.findUnique({ where: { id: storeId } });
    if (!store) return reply.code(404).send({ error: "Không tìm thấy cửa hàng" });
    const body = request.body;
    const data = {
      ...body,
      storeId,
      provinceSlug: body.provinceSlug || provinceSlug(body.province),
      districtSlug: body.districtSlug || (body.district ? provinceSlug(body.district) : null),
    };
    const loc = await app.prisma.storeLocation.create({ data });
    await logAdminAction(app.prisma, {
      adminId: request.user.id, action: "CREATE_LOCATION",
      targetType: "StoreLocation", targetId: loc.id, newValue: data, ipAddress: request.ip,
    });
    return reply.code(201).send(loc);
  });

  app.patch("/stores/:storeId/locations/:locId", { schema: locationBodySchema }, async (request, reply) => {
    const locId = Number(request.params.locId);
    const existing = await app.prisma.storeLocation.findUnique({ where: { id: locId } });
    if (!existing) return reply.code(404).send({ error: "Không tìm thấy chi nhánh" });
    const body = request.body;
    const data = {
      ...body,
      provinceSlug: body.provinceSlug || provinceSlug(body.province),
      districtSlug: body.districtSlug || (body.district ? provinceSlug(body.district) : null),
    };
    const loc = await app.prisma.storeLocation.update({ where: { id: locId }, data });
    await logAdminAction(app.prisma, {
      adminId: request.user.id, action: "UPDATE_LOCATION",
      targetType: "StoreLocation", targetId: locId, oldValue: existing, newValue: data, ipAddress: request.ip,
    });
    return loc;
  });

  app.delete("/stores/:storeId/locations/:locId", async (request, reply) => {
    const locId = Number(request.params.locId);
    const existing = await app.prisma.storeLocation.findUnique({ where: { id: locId } });
    if (!existing) return reply.code(404).send({ error: "Không tìm thấy chi nhánh" });
    await app.prisma.storeLocation.delete({ where: { id: locId } });
    await logAdminAction(app.prisma, {
      adminId: request.user.id, action: "DELETE_LOCATION",
      targetType: "StoreLocation", targetId: locId, oldValue: existing, ipAddress: request.ip,
    });
    return { success: true };
  });
}
