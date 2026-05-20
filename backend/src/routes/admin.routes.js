import { recomputeDailyPrice } from "../services/dailyPrice.service.js";
import { reasonLabel } from "../lib/reasonCodes.js";
import { logReportStatus } from "../services/reportLog.service.js";
import { logAdminAction } from "../services/adminLog.service.js";

const REPORT_STATUSES = ["PENDING", "REVIEWING", "VERIFIED", "REJECTED", "DUPLICATE", "NEED_MORE_INFO"];
const SIMPLE_STATUSES = ["APPROVED", "REJECTED"]; // cho seller / review / price
const ALL_REPORT_STATUSES_FOR_PATCH = [...REPORT_STATUSES, "APPROVED"]; // accept APPROVED alias

const reportModerationSchema = {
  body: {
    type: "object",
    required: ["status"],
    properties: {
      status: { type: "string", enum: ALL_REPORT_STATUSES_FOR_PATCH },
      reject_reason: { type: "string", maxLength: 500 },
      admin_note: { type: "string", maxLength: 1000 },
      duplicate_of: { type: "integer" },
      risk_level: { type: "string", enum: ["low", "medium", "high"] },
    },
  },
};

const simpleModerationSchema = {
  body: {
    type: "object",
    required: ["status"],
    properties: {
      status: { type: "string", enum: SIMPLE_STATUSES },
      reject_reason: { type: "string", maxLength: 500 },
    },
  },
};

async function recomputeSellerRating(prisma, sellerId) {
  const stats = await prisma.sellerReview.aggregate({
    where: { sellerId, status: "APPROVED" },
    _avg: { rating: true },
  });
  await prisma.seller.update({
    where: { id: sellerId },
    data: { ratingAvg: stats._avg.rating || 0 },
  });
}

export default async function adminRoutes(app) {
  app.addHook("preHandler", app.requireAdmin);

  app.get("/queue", async (request) => {
    const type = request.query.type || "sellers";
    const status = request.query.status || (type === "reports" ? "PENDING" : "PENDING");
    const limit = Math.min(Number(request.query.limit || 50), 200);

    switch (type) {
      case "sellers": {
        const items = await app.prisma.seller.findMany({
          where: { status },
          orderBy: { createdAt: "desc" },
          take: limit,
          include: {
            submittedBy: { select: { id: true, displayName: true, email: true } },
            phoneEntity: true,
            accountEntity: true,
          },
        });
        return { items };
      }
      case "reports": {
        const items = await app.prisma.fraudReport.findMany({
          where: { status },
          orderBy: { createdAt: "desc" },
          take: limit,
          include: {
            entity: true,
            relatedAccountEntity: true,
            submittedBy: { select: { id: true, displayName: true, email: true } },
          },
        });
        return {
          items: items.map((r) => ({
            ...r,
            reason_label: reasonLabel(r.reasonCode),
          })),
        };
      }
      case "prices": {
        const items = await app.prisma.priceSubmission.findMany({
          where: { status },
          orderBy: { createdAt: "desc" },
          take: limit,
          include: {
            product: true,
            submittedBy: { select: { id: true, displayName: true, email: true } },
          },
        });
        return { items };
      }
      case "reviews": {
        const items = await app.prisma.sellerReview.findMany({
          where: { status },
          orderBy: { createdAt: "desc" },
          take: limit,
          include: {
            seller: { select: { id: true, name: true } },
            user: { select: { id: true, displayName: true } },
          },
        });
        return { items };
      }
      default:
        return { items: [] };
    }
  });

  app.get("/stats", async () => {
    const [pendingSellers, pendingReports, reviewingReports, pendingPrices, pendingReviews] = await Promise.all([
      app.prisma.seller.count({ where: { status: "PENDING" } }),
      app.prisma.fraudReport.count({ where: { status: "PENDING" } }),
      app.prisma.fraudReport.count({ where: { status: "REVIEWING" } }),
      app.prisma.priceSubmission.count({ where: { status: "PENDING" } }),
      app.prisma.sellerReview.count({ where: { status: "PENDING" } }),
    ]);
    return {
      pendingSellers,
      pendingReports,
      reviewingReports,
      pendingPrices,
      pendingReviews,
    };
  });

  app.patch("/sellers/:id", { schema: simpleModerationSchema }, async (request, reply) => {
    const id = Number(request.params.id);
    const seller = await app.prisma.seller.findUnique({ where: { id } });
    if (!seller) return reply.code(404).send({ error: "Không tìm thấy" });
    const updated = await app.prisma.seller.update({
      where: { id },
      data: {
        status: request.body.status,
        rejectReason: request.body.status === "REJECTED" ? request.body.reject_reason || null : null,
        approvedById: request.user.id,
      },
    });
    await logAdminAction(app.prisma, {
      adminId: request.user.id,
      action: request.body.status === "APPROVED" ? "APPROVE_SELLER" : "REJECT_SELLER",
      targetType: "Seller",
      targetId: id,
      oldValue: { status: seller.status },
      newValue: { status: request.body.status, rejectReason: request.body.reject_reason || null },
      ipAddress: request.ip,
    });
    return updated;
  });

  app.patch("/reports/:id", { schema: reportModerationSchema }, async (request, reply) => {
    const id = Number(request.params.id);
    const report = await app.prisma.fraudReport.findUnique({ where: { id } });
    if (!report) return reply.code(404).send({ error: "Không tìm thấy" });

    // Normalize: 'APPROVED' alias → 'VERIFIED' cho consistency với UI cũ
    let status = request.body.status;
    if (status === "APPROVED") status = "VERIFIED";

    const data = {
      status,
      adminNote: request.body.admin_note ?? report.adminNote,
      approvedById: request.user.id,
    };
    if (status === "REJECTED") data.rejectReason = request.body.reject_reason || null;
    if (status === "DUPLICATE" && request.body.duplicate_of) data.duplicateOfId = request.body.duplicate_of;
    if (request.body.risk_level) data.riskLevelInput = request.body.risk_level;

    const updated = await app.prisma.fraudReport.update({ where: { id }, data });

    await logReportStatus(app.prisma, {
      reportId: id,
      changedById: request.user.id,
      oldStatus: report.status,
      newStatus: status,
      action: "ADMIN_PATCH",
      note: request.body.admin_note || request.body.reject_reason || null,
    });
    await logAdminAction(app.prisma, {
      adminId: request.user.id,
      action: `REPORT_${status}`,
      targetType: "FraudReport",
      targetId: id,
      oldValue: { status: report.status },
      newValue: { status, riskLevel: data.riskLevelInput || report.riskLevelInput },
      note: request.body.admin_note || request.body.reject_reason || null,
      ipAddress: request.ip,
    });

    return updated;
  });

  // Trả timeline cho 1 báo cáo cụ thể
  app.get("/reports/:id", async (request, reply) => {
    const id = Number(request.params.id);
    const report = await app.prisma.fraudReport.findUnique({
      where: { id },
      include: {
        entity: true,
        relatedAccountEntity: true,
        submittedBy: { select: { id: true, displayName: true, email: true } },
        statusLogs: {
          orderBy: { createdAt: "asc" },
        },
      },
    });
    if (!report) return reply.code(404).send({ error: "Không tìm thấy" });

    // Lấy display name cho changedById trong logs
    const userIds = [...new Set(report.statusLogs.map((l) => l.changedById).filter(Boolean))];
    const users = userIds.length > 0
      ? await app.prisma.user.findMany({ where: { id: { in: userIds } }, select: { id: true, displayName: true } })
      : [];
    const userMap = Object.fromEntries(users.map((u) => [u.id, u.displayName]));

    return {
      ...report,
      reason_label: reasonLabel(report.reasonCode),
      status_logs: report.statusLogs.map((l) => ({
        id: l.id,
        old_status: l.oldStatus,
        new_status: l.newStatus,
        action: l.action,
        note: l.note,
        changed_by: l.changedById ? userMap[l.changedById] || "Người dùng #" + l.changedById : "Hệ thống",
        created_at: l.createdAt,
      })),
    };
  });

  app.patch("/prices/:id", { schema: simpleModerationSchema }, async (request, reply) => {
    const id = Number(request.params.id);
    const submission = await app.prisma.priceSubmission.findUnique({ where: { id } });
    if (!submission) return reply.code(404).send({ error: "Không tìm thấy" });
    const updated = await app.prisma.priceSubmission.update({
      where: { id },
      data: {
        status: request.body.status,
        rejectReason: request.body.status === "REJECTED" ? request.body.reject_reason || null : null,
        approvedById: request.user.id,
      },
    });
    if (request.body.status === "APPROVED") {
      await recomputeDailyPrice(submission.productId, submission.region, submission.priceDate);
    }
    await logAdminAction(app.prisma, {
      adminId: request.user.id,
      action: request.body.status === "APPROVED" ? "APPROVE_PRICE" : "REJECT_PRICE",
      targetType: "PriceSubmission",
      targetId: id,
      oldValue: { status: submission.status },
      newValue: { status: request.body.status, price: submission.price },
      ipAddress: request.ip,
    });
    return updated;
  });

  app.patch("/reviews/:id", { schema: simpleModerationSchema }, async (request, reply) => {
    const id = Number(request.params.id);
    const review = await app.prisma.sellerReview.findUnique({ where: { id } });
    if (!review) return reply.code(404).send({ error: "Không tìm thấy" });
    const updated = await app.prisma.sellerReview.update({
      where: { id },
      data: { status: request.body.status },
    });
    if (request.body.status === "APPROVED") {
      await recomputeSellerRating(app.prisma, review.sellerId);
    }
    return updated;
  });

  // Logs / analytics — đếm lookup theo ngày
  app.get("/lookup-logs/summary", async (request) => {
    const limit = Math.min(Number(request.query.limit || 100), 500);
    const top = await app.prisma.lookupLog.groupBy({
      by: ["lookupType", "queryNormalized"],
      _count: { _all: true },
      orderBy: { _count: { queryNormalized: "desc" } },
      take: limit,
    });
    return { items: top };
  });

  // ============================================================
  // Charts data cho dashboard admin (timeseries 7 ngày gần nhất)
  // ============================================================
  app.get("/charts", async () => {
    const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    since.setUTCHours(0, 0, 0, 0);

    const allLookups = await app.prisma.lookupLog.findMany({
      where: { createdAt: { gte: since } },
      select: { createdAt: true, lookupType: true, queryNormalized: true },
    });
    const allReports = await app.prisma.fraudReport.findMany({
      where: { createdAt: { gte: since } },
      select: { createdAt: true, status: true },
    });

    // Bucket theo ngày
    const days = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
      d.setUTCHours(0, 0, 0, 0);
      days.push(d);
    }

    const dayKey = (date) => date.toISOString().slice(0, 10);
    const lookupsByDay = Object.fromEntries(days.map((d) => [dayKey(d), 0]));
    const reportsByDay = Object.fromEntries(days.map((d) => [dayKey(d), 0]));
    const verifiedByDay = Object.fromEntries(days.map((d) => [dayKey(d), 0]));

    for (const l of allLookups) {
      const k = dayKey(new Date(l.createdAt));
      if (lookupsByDay[k] !== undefined) lookupsByDay[k]++;
    }
    for (const r of allReports) {
      const k = dayKey(new Date(r.createdAt));
      if (reportsByDay[k] !== undefined) {
        reportsByDay[k]++;
        if (r.status === "VERIFIED") verifiedByDay[k]++;
      }
    }

    // Top entities bị tra cứu nhiều
    const top = await app.prisma.lookupLog.groupBy({
      by: ["lookupType", "queryNormalized"],
      where: { createdAt: { gte: since } },
      _count: { _all: true },
      orderBy: { _count: { queryNormalized: "desc" } },
      take: 10,
    });

    return {
      timeseries: days.map((d) => ({
        date: dayKey(d),
        label: d.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit" }),
        lookups: lookupsByDay[dayKey(d)],
        reports: reportsByDay[dayKey(d)],
        verified: verifiedByDay[dayKey(d)],
      })),
      top_targets: top.map((t) => ({
        type: t.lookupType,
        value: t.queryNormalized,
        count: t._count._all,
      })),
    };
  });

  // ============================================================
  // BLACKLIST (cảnh báo công khai) — group verified reports by entity
  // ============================================================
  app.get("/blacklist", async (request) => {
    const limit = Math.min(Number(request.query.limit || 100), 500);
    const search = request.query.search;

    const grouped = await app.prisma.fraudReport.groupBy({
      by: ["entityId"],
      where: { status: "VERIFIED" },
      _count: { _all: true },
      _max: { createdAt: true, riskLevelInput: true },
      orderBy: { _max: { createdAt: "desc" } },
      take: limit,
    });

    if (grouped.length === 0) return { items: [] };
    const entityIds = grouped.map((g) => g.entityId);
    const entities = await app.prisma.lookupEntity.findMany({
      where: { id: { in: entityIds } },
    });
    const entityMap = Object.fromEntries(entities.map((e) => [e.id, e]));

    let items = grouped.map((g) => {
      const e = entityMap[g.entityId];
      return {
        entity_id: g.entityId,
        type: e?.type,
        display_value: e?.displayValue,
        normalized_value: e?.normalizedValue,
        bank_name: e?.bankName || null,
        report_count: g._count._all,
        risk_level: g._max.riskLevelInput,
        last_reported_at: g._max.createdAt,
      };
    });

    if (search) {
      const s = search.toLowerCase();
      items = items.filter(
        (i) => i.normalized_value?.toLowerCase().includes(s) || i.display_value?.toLowerCase().includes(s)
      );
    }
    return { items };
  });

  // PATCH /blacklist/:entityId — chỉnh mức rủi ro cho toàn bộ verified reports của entity
  app.patch("/blacklist/:entityId", async (request, reply) => {
    const entityId = Number(request.params.entityId);
    const { risk_level, hide } = request.body || {};
    if (risk_level && !["low", "medium", "high"].includes(risk_level)) {
      return reply.code(400).send({ error: "risk_level không hợp lệ" });
    }
    const entity = await app.prisma.lookupEntity.findUnique({ where: { id: entityId } });
    if (!entity) return reply.code(404).send({ error: "Không tìm thấy" });

    const data = {};
    if (risk_level) data.riskLevelInput = risk_level;
    if (hide === true) data.status = "REMOVED";   // ẩn khỏi public
    if (hide === false) data.status = "VERIFIED"; // khôi phục

    const result = await app.prisma.fraudReport.updateMany({
      where: { entityId, status: { in: ["VERIFIED", "REMOVED"] } },
      data,
    });

    await logAdminAction(app.prisma, {
      adminId: request.user.id,
      action: hide === true ? "HIDE_BLACKLIST" : hide === false ? "UNHIDE_BLACKLIST" : "UPDATE_BLACKLIST",
      targetType: "LookupEntity",
      targetId: entityId,
      newValue: { risk_level, hide },
      ipAddress: request.ip,
    });

    return { success: true, updated_count: result.count };
  });

  // ============================================================
  // PRODUCTS CRUD (admin)
  // ============================================================
  app.get("/products", async () => {
    const items = await app.prisma.product.findMany({ orderBy: { id: "asc" } });
    return { items };
  });

  app.post(
    "/products",
    {
      schema: {
        body: {
          type: "object",
          required: ["name", "slug"],
          properties: {
            name: { type: "string", minLength: 1, maxLength: 200 },
            slug: { type: "string", minLength: 1, maxLength: 200, pattern: "^[a-z0-9-]+$" },
            description: { type: "string", maxLength: 2000 },
            imageUrl: { type: "string", maxLength: 500 },
          },
        },
      },
    },
    async (request, reply) => {
      try {
        const product = await app.prisma.product.create({ data: request.body });
        await logAdminAction(app.prisma, {
          adminId: request.user.id,
          action: "CREATE_PRODUCT",
          targetType: "Product",
          targetId: product.id,
          newValue: product,
          ipAddress: request.ip,
        });
        return reply.code(201).send(product);
      } catch (err) {
        return reply.code(409).send({ error: "Sản phẩm đã tồn tại hoặc slug bị trùng" });
      }
    }
  );

  app.patch("/products/:id", async (request, reply) => {
    const id = Number(request.params.id);
    const existing = await app.prisma.product.findUnique({ where: { id } });
    if (!existing) return reply.code(404).send({ error: "Không tìm thấy" });
    const allowed = ["name", "slug", "description", "imageUrl"];
    const data = {};
    for (const k of allowed) {
      if (request.body[k] !== undefined) data[k] = request.body[k];
    }
    const updated = await app.prisma.product.update({ where: { id }, data });
    await logAdminAction(app.prisma, {
      adminId: request.user.id,
      action: "UPDATE_PRODUCT",
      targetType: "Product",
      targetId: id,
      oldValue: existing,
      newValue: updated,
      ipAddress: request.ip,
    });
    return updated;
  });

  app.delete("/products/:id", async (request, reply) => {
    const id = Number(request.params.id);
    const existing = await app.prisma.product.findUnique({ where: { id } });
    if (!existing) return reply.code(404).send({ error: "Không tìm thấy" });
    // Kiểm tra có price submission / dailyPrice liên quan không
    const [hasPrices, hasDaily] = await Promise.all([
      app.prisma.priceSubmission.count({ where: { productId: id } }),
      app.prisma.dailyPrice.count({ where: { productId: id } }),
    ]);
    if (hasPrices > 0 || hasDaily > 0) {
      return reply.code(409).send({ error: "Sản phẩm đã có dữ liệu giá. Không thể xoá." });
    }
    await app.prisma.product.delete({ where: { id } });
    await logAdminAction(app.prisma, {
      adminId: request.user.id,
      action: "DELETE_PRODUCT",
      targetType: "Product",
      targetId: id,
      oldValue: existing,
      ipAddress: request.ip,
    });
    return { success: true };
  });

  // ============================================================
  // USERS (admin)
  // ============================================================
  app.get("/users", async (request) => {
    const limit = Math.min(Number(request.query.limit || 100), 500);
    const search = request.query.search;
    const role = request.query.role;
    const where = {};
    if (role) where.role = role;
    if (search) {
      where.OR = [
        { email: { contains: search } },
        { displayName: { contains: search } },
      ];
    }

    const users = await app.prisma.user.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: limit,
    });

    // Đếm report cho mỗi user
    const ids = users.map((u) => u.id);
    const reportCounts = await app.prisma.fraudReport.groupBy({
      by: ["submittedById", "status"],
      where: { submittedById: { in: ids } },
      _count: { _all: true },
    });
    const countMap = {};
    for (const c of reportCounts) {
      if (!countMap[c.submittedById]) countMap[c.submittedById] = { total: 0, verified: 0 };
      countMap[c.submittedById].total += c._count._all;
      if (c.status === "VERIFIED") countMap[c.submittedById].verified += c._count._all;
    }

    return {
      items: users.map((u) => ({
        id: u.id,
        email: u.email,
        displayName: u.displayName,
        phone: u.phone,
        role: u.role,
        trustScore: u.trustScore,
        isLocked: u.isLocked,
        lockReason: u.lockReason,
        createdAt: u.createdAt,
        reportsTotal: countMap[u.id]?.total || 0,
        reportsVerified: countMap[u.id]?.verified || 0,
      })),
    };
  });

  app.patch(
    "/users/:id",
    {
      schema: {
        body: {
          type: "object",
          properties: {
            role: { type: "string", enum: ["USER", "MODERATOR", "ADMIN", "SUPER_ADMIN", "PRICE_EDITOR", "SELLER_MANAGER"] },
            isLocked: { type: "boolean" },
            lockReason: { type: "string", maxLength: 500 },
            trustScore: { type: "integer", minimum: 0, maximum: 1000 },
          },
        },
      },
    },
    async (request, reply) => {
      const id = Number(request.params.id);
      const existing = await app.prisma.user.findUnique({ where: { id } });
      if (!existing) return reply.code(404).send({ error: "Không tìm thấy" });

      // Không cho tự khoá chính mình
      if (id === request.user.id && request.body.isLocked === true) {
        return reply.code(400).send({ error: "Không thể tự khoá tài khoản của mình" });
      }

      const data = {};
      if (request.body.role !== undefined) data.role = request.body.role;
      if (request.body.isLocked !== undefined) data.isLocked = request.body.isLocked;
      if (request.body.lockReason !== undefined) data.lockReason = request.body.lockReason || null;
      if (request.body.trustScore !== undefined) data.trustScore = request.body.trustScore;

      const updated = await app.prisma.user.update({ where: { id }, data });
      await logAdminAction(app.prisma, {
        adminId: request.user.id,
        action: request.body.isLocked === true ? "LOCK_USER"
              : request.body.isLocked === false ? "UNLOCK_USER"
              : request.body.role ? "CHANGE_ROLE" : "UPDATE_USER",
        targetType: "User",
        targetId: id,
        oldValue: { role: existing.role, isLocked: existing.isLocked, trustScore: existing.trustScore },
        newValue: data,
        ipAddress: request.ip,
      });
      return {
        id: updated.id,
        email: updated.email,
        displayName: updated.displayName,
        role: updated.role,
        isLocked: updated.isLocked,
        lockReason: updated.lockReason,
        trustScore: updated.trustScore,
      };
    }
  );

  // ============================================================
  // ACTIVITY LOG
  // ============================================================
  app.get("/activity", async (request) => {
    const limit = Math.min(Number(request.query.limit || 100), 500);
    const targetType = request.query.target_type;
    const adminId = request.query.admin_id;
    const action = request.query.action;
    const where = {};
    if (targetType) where.targetType = targetType;
    if (adminId) where.adminId = Number(adminId);
    if (action) where.action = { contains: action };

    const items = await app.prisma.adminActivityLog.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: limit,
      include: { admin: { select: { id: true, displayName: true, email: true } } },
    });
    return {
      items: items.map((i) => ({
        id: i.id,
        action: i.action,
        target_type: i.targetType,
        target_id: i.targetId,
        admin: i.admin?.displayName,
        admin_id: i.adminId,
        old_value: i.oldValue ? JSON.parse(i.oldValue) : null,
        new_value: i.newValue ? JSON.parse(i.newValue) : null,
        note: i.note,
        ip_address: i.ipAddress,
        created_at: i.createdAt,
      })),
    };
  });
}
