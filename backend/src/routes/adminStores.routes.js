// Admin endpoints quản lý hệ thống cửa hàng.

import { logAdminAction } from "../services/adminLog.service.js";
import { VN_PROVINCES, provinceSlug } from "../lib/locations.js";
import { hashPassword } from "../lib/hash.js";
import crypto from "node:crypto";

const digits = (s) => String(s || "").replace(/\D/g, "");

/** Sinh mật khẩu ngẫu nhiên dễ đọc, 10 ký tự */
function generateRandomPassword(length = 10) {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789";
  let result = "";
  const bytes = crypto.randomBytes(length);
  for (let i = 0; i < length; i++) {
    result += chars[bytes[i] % chars.length];
  }
  return result;
}

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

const officialStoreSchema = {
  body: {
    type: "object",
    required: ["name", "slug", "ownerEmail", "ownerDisplayName"],
    properties: {
      name:             { type: "string", minLength: 1, maxLength: 200 },
      slug:             { type: "string", minLength: 1, maxLength: 200, pattern: "^[a-z0-9-]+$" },
      description:      { type: "string", maxLength: 2000 },
      phone:            { type: "string", maxLength: 30 },
      email:            { type: "string", maxLength: 200 },
      website:          { type: "string", maxLength: 500 },
      facebookUrl:      { type: "string", maxLength: 500 },
      zaloUrl:          { type: "string", maxLength: 500 },
      bankAccount:      { type: "string", maxLength: 40 },
      bankName:         { type: "string", maxLength: 100 },
      bankOwnerName:    { type: "string", maxLength: 200 },
      brandColor:       { type: "string", maxLength: 20 },
      openingHours:     { type: "string", maxLength: 200 },
      // Owner account info
      ownerEmail:       { type: "string", format: "email", maxLength: 200 },
      ownerDisplayName: { type: "string", minLength: 1, maxLength: 100 },
      ownerPhone:       { type: "string", maxLength: 30 },
    },
  },
};

export default async function adminStoresRoutes(app) {
  app.addHook("preHandler", app.requireAdmin);

  // ============================================================
  // Tạo cửa hàng chính hãng (official_store)
  // Auto-tạo user account + random password
  // ============================================================
  app.post("/stores/official", { schema: officialStoreSchema }, async (request, reply) => {
    const { ownerEmail, ownerDisplayName, ownerPhone, ...storeData } = request.body;

    // Kiểm tra email đã tồn tại chưa
    const existingUser = await app.prisma.user.findUnique({ where: { email: ownerEmail } });
    if (existingUser) {
      return reply.code(409).send({ error: `Email "${ownerEmail}" đã được sử dụng. Hãy dùng email khác.` });
    }

    // Kiểm tra slug đã tồn tại chưa
    const existingStore = await app.prisma.store.findUnique({ where: { slug: storeData.slug } });
    if (existingStore) {
      return reply.code(409).send({ error: `Slug "${storeData.slug}" đã tồn tại. Hãy chọn slug khác.` });
    }

    // 1. Sinh mật khẩu ngẫu nhiên
    const rawPassword = generateRandomPassword(10);
    const passwordHash = await hashPassword(rawPassword);

    // 2. Tạo user + store trong transaction
    const result = await app.prisma.$transaction(async (tx) => {
      // Tạo user account
      const user = await tx.user.create({
        data: {
          email: ownerEmail,
          passwordHash,
          displayName: ownerDisplayName,
          phone: ownerPhone || storeData.phone || null,
          role: "OFFICIAL_STORE_OWNER",
          mustChangePassword: true,
          createdByAdminId: request.user.id,
        },
      });

      // Tạo store
      const store = await tx.store.create({
        data: {
          name: storeData.name,
          slug: storeData.slug,
          description: storeData.description || null,
          phone: storeData.phone || null,
          phoneNormalized: digits(storeData.phone),
          email: storeData.email || ownerEmail,
          website: storeData.website || null,
          facebookUrl: storeData.facebookUrl || null,
          zaloUrl: storeData.zaloUrl || null,
          bankAccount: storeData.bankAccount || null,
          bankAccountNormalized: digits(storeData.bankAccount),
          bankName: storeData.bankName || null,
          bankOwnerName: storeData.bankOwnerName || null,
          brandColor: storeData.brandColor || null,
          openingHours: storeData.openingHours || null,
          // Seller type fields
          sellerType: "official_store",
          source: "admin_created",
          isOfficial: true,
          // Trust
          baseTrustScore: 80,
          trustScore: 80,
          riskScore: 0,
          riskStatus: "normal",
          // Status
          status: "ACTIVE",
          verificationStatus: "VERIFIED",
          // Ownership
          ownerUserId: user.id,
          createdByAdminId: request.user.id,
        },
      });

      return { user, store };
    });

    // 3. Log admin action
    await logAdminAction(app.prisma, {
      adminId: request.user.id,
      action: "CREATE_OFFICIAL_STORE",
      targetType: "Store",
      targetId: result.store.id,
      newValue: {
        storeName: result.store.name,
        storeSlug: result.store.slug,
        ownerEmail,
        ownerUserId: result.user.id,
      },
      ipAddress: request.ip,
    });

    // 4. Trả kết quả kèm mật khẩu (chỉ hiển thị 1 lần này)
    return reply.code(201).send({
      store: result.store,
      account: {
        userId: result.user.id,
        email: result.user.email,
        displayName: result.user.displayName,
        password: rawPassword,        // ← CHỈ TRẢ 1 LẦN, admin chép gửi cho chủ cửa hàng
        role: result.user.role,
        mustChangePassword: true,
      },
    });
  });

  // ============================================================
  // Reset mật khẩu cho store owner
  // ============================================================
  app.post("/stores/:id/reset-password", async (request, reply) => {
    const storeId = Number(request.params.id);
    const store = await app.prisma.store.findUnique({ where: { id: storeId } });
    if (!store) return reply.code(404).send({ error: "Không tìm thấy cửa hàng" });
    if (!store.ownerUserId) return reply.code(400).send({ error: "Cửa hàng chưa có tài khoản chủ sở hữu" });

    const rawPassword = generateRandomPassword(10);
    const passwordHash = await hashPassword(rawPassword);

    const user = await app.prisma.user.update({
      where: { id: store.ownerUserId },
      data: { passwordHash, mustChangePassword: true },
    });

    await logAdminAction(app.prisma, {
      adminId: request.user.id,
      action: "RESET_STORE_OWNER_PASSWORD",
      targetType: "Store",
      targetId: storeId,
      newValue: { ownerUserId: user.id, ownerEmail: user.email },
      ipAddress: request.ip,
    });

    return {
      storeId,
      account: {
        userId: user.id,
        email: user.email,
        displayName: user.displayName,
        password: rawPassword,          // ← CHỈ TRẢ 1 LẦN
        mustChangePassword: true,
      },
    };
  });

  // ============================================================
  // Stores list
  // ============================================================
  app.get("/stores", async (request) => {
    const { region, province, verification_status, status, seller_type, search, limit = 200 } = request.query;
    const where = {};
    if (status) where.status = status;
    if (verification_status) where.verificationStatus = verification_status;
    if (seller_type) where.sellerType = seller_type;
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
        owner: { select: { id: true, email: true, displayName: true } },
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
        owner: { select: { id: true, email: true, displayName: true, role: true, mustChangePassword: true, isLocked: true, lastLoginAt: true } },
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
