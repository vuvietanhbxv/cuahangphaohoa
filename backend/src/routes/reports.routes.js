import { upsertEntity } from "../services/lookupEntity.service.js";
import {
  REASON_CODE_VALUES,
  reasonLabel,
  CONTACT_CHANNEL_VALUES,
  PAYMENT_METHOD_VALUES,
} from "../lib/reasonCodes.js";
import { maskPhone, maskAccount } from "../lib/normalize.js";
import { verifyCaptcha } from "./captcha.routes.js";
import { logReportStatus } from "../services/reportLog.service.js";

const DAILY_LIMIT_PER_USER = 5;       // chống spam
const SAME_TARGET_LIMIT_30D = 3;      // chống báo cáo cùng entity quá nhiều lần

const submitBodySchema = {
  body: {
    type: "object",
    required: ["type", "value", "reason_code"],
    properties: {
      type:                { type: "string", enum: ["phone", "bank_account"] },
      value:               { type: "string", minLength: 4, maxLength: 60 },
      reason_code:         { type: "string", enum: REASON_CODE_VALUES },
      reason_text:         { type: "string", maxLength: 500 },
      detail:              { type: "string", maxLength: 4000 },
      amount:              { type: "integer", minimum: 1000, maximum: 100000000000 },
      transaction_date:    { type: "string", format: "date" },
      payment_method:      { type: "string", enum: PAYMENT_METHOD_VALUES },
      contact_channel:     { type: "string", enum: CONTACT_CHANNEL_VALUES },
      product_name:        { type: "string", maxLength: 200 },
      seller_name:         { type: "string", maxLength: 200 },
      seller_shop_name:    { type: "string", maxLength: 200 },
      bank_owner_name:     { type: "string", maxLength: 200 },
      social_link:         { type: "string", maxLength: 500 },
      region:              { type: "string", enum: ["BAC", "TRUNG", "NAM"] },
      related_bank_account:{ type: "string", maxLength: 60 },
      bank_name:           { type: "string", maxLength: 100 },
      evidence_urls:       { type: "array", items: { type: "string", maxLength: 500 }, maxItems: 10 },
      risk_level_input:    { type: "string", enum: ["low", "medium", "high"] },
      captcha_token:       { type: "string", maxLength: 1000 },
      captcha_answer:      { type: ["string", "number"] },
      acknowledged:        { type: "boolean" },  // cam kết thông tin đúng sự thật
    },
  },
};

const addInfoBodySchema = {
  body: {
    type: "object",
    properties: {
      additional_note:   { type: "string", maxLength: 4000 },
      related_phone:     { type: "string", maxLength: 60 },
      related_bank_account: { type: "string", maxLength: 60 },
      social_link:       { type: "string", maxLength: 500 },
      evidence_urls:     { type: "array", items: { type: "string", maxLength: 500 }, maxItems: 10 },
    },
  },
};

function parseEvidence(raw) {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw;
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function maskByType(type, value) {
  if (type === "PHONE") return maskPhone(value);
  if (type === "BANK_ACCOUNT") return maskAccount(value);
  return value;
}

function publicReport(r, count = null) {
  return {
    id: r.id,
    target_type: r.entity?.type,
    target_value: r.entity ? maskByType(r.entity.type, r.entity.normalizedValue) : null,
    target_display: r.entity?.displayValue,
    reason_code: r.reasonCode,
    reason_label: reasonLabel(r.reasonCode),
    reason_text: r.reasonText,
    detail: r.detail,
    amount: r.amount,
    transaction_date: r.transactionDate,
    risk_level: r.riskLevelInput,
    status: r.status,
    created_at: r.createdAt,
    evidence_count: parseEvidence(r.evidenceUrls).length,
    reports_count: count,
  };
}

function myReport(r) {
  // Trả nhiều info hơn cho chính chủ
  return {
    ...publicReport(r),
    region: r.region,
    contact_channel: r.contactChannel,
    payment_method: r.paymentMethod,
    product_name: r.productName,
    seller_name: r.sellerName,
    seller_shop_name: r.sellerShopName,
    bank_owner_name: r.bankOwnerName,
    social_link: r.socialLink,
    evidence_urls: parseEvidence(r.evidenceUrls),
    admin_note: r.adminNote,
    reject_reason: r.rejectReason,
    duplicate_of_id: r.duplicateOfId,
    updated_at: r.updatedAt,
  };
}

export default async function reportsRoutes(app) {
  // GET /reports — danh sách cảnh báo public (gom theo entity)
  app.get("/", async (request) => {
    const { risk, page = 1, limit = 20 } = request.query;
    const whereStatus = { status: { in: ["VERIFIED"] } };

    const grouped = await app.prisma.fraudReport.groupBy({
      by: ["entityId", "riskLevelInput"],
      where: whereStatus,
      _count: { _all: true },
      _max: { createdAt: true },
      orderBy: [{ _max: { createdAt: "desc" } }],
      skip: (Number(page) - 1) * Number(limit),
      take: Number(limit),
    });

    const byEntity = {};
    for (const g of grouped) {
      const k = g.entityId;
      if (!byEntity[k]) byEntity[k] = { entityId: k, count: 0, lastAt: null };
      byEntity[k].count += g._count._all;
      const m = g._max.createdAt;
      if (!byEntity[k].lastAt || m > byEntity[k].lastAt) byEntity[k].lastAt = m;
    }

    const entityIds = Object.keys(byEntity).map(Number);
    if (entityIds.length === 0) return { items: [] };

    const latestReports = await app.prisma.fraudReport.findMany({
      where: { entityId: { in: entityIds }, status: "VERIFIED" },
      orderBy: { createdAt: "desc" },
      include: { entity: true },
    });

    const seen = new Set();
    const results = [];
    for (const r of latestReports) {
      if (seen.has(r.entityId)) continue;
      seen.add(r.entityId);
      if (risk && r.riskLevelInput !== risk) continue;
      results.push(publicReport(r, byEntity[r.entityId].count));
    }
    return { items: results };
  });

  // POST /reports — submit báo cáo mới
  app.post(
    "/",
    { preHandler: app.authenticate, schema: submitBodySchema },
    async (request, reply) => {
      const body = request.body;

      // 1. Acknowledged checkbox (cam kết)
      if (body.acknowledged === false) {
        return reply.code(400).send({ error: "Vui lòng xác nhận thông tin đúng sự thật." });
      }

      // 2. Captcha (bypass cho user trustScore≥30)
      const me = await app.prisma.user.findUnique({ where: { id: request.user.id } });
      const skipCaptcha = (me?.trustScore || 0) >= 30;
      if (!skipCaptcha) {
        const ok = verifyCaptcha(app, body.captcha_token, body.captcha_answer);
        if (!ok) {
          return reply.code(400).send({
            error: "Mã xác thực không đúng hoặc đã hết hạn. Vui lòng làm mới và thử lại.",
            code: "CAPTCHA_FAILED",
          });
        }
      }

      // 3. Rate-limit theo user
      const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
      const count24h = await app.prisma.fraudReport.count({
        where: { submittedById: request.user.id, createdAt: { gte: since } },
      });
      if (count24h >= DAILY_LIMIT_PER_USER) {
        return reply.code(429).send({
          error: `Bạn đã gửi tối đa ${DAILY_LIMIT_PER_USER} báo cáo trong 24 giờ. Vui lòng quay lại sau.`,
          code: "DAILY_LIMIT_REACHED",
        });
      }

      // 4. Tạo entity chính
      const type = body.type === "phone" ? "PHONE" : "BANK_ACCOUNT";
      let entity;
      try {
        entity = await upsertEntity(app.prisma, type, body.value, { bankName: body.bank_name });
      } catch (err) {
        return reply.code(400).send({ error: err.message });
      }

      // 5. Entity liên quan
      let relatedEntity = null;
      if (body.related_bank_account) {
        try {
          relatedEntity = await upsertEntity(app.prisma, "BANK_ACCOUNT", body.related_bank_account, {
            bankName: body.bank_name,
          });
        } catch { /* ignore */ }
      }

      // 6. Chống cùng user báo cáo cùng entity cùng reason
      const dup = await app.prisma.fraudReport.findFirst({
        where: {
          submittedById: request.user.id,
          entityId: entity.id,
          reasonCode: body.reason_code,
          status: { in: ["PENDING", "REVIEWING", "VERIFIED", "NEED_MORE_INFO"] },
        },
      });
      if (dup) {
        return reply.code(409).send({
          success: false,
          code: "DUPLICATE_REPORT",
          message: "Bạn đã gửi báo cáo tương tự trước đó. Bạn có thể bổ sung bằng chứng cho báo cáo cũ.",
          existing_report_id: dup.id,
        });
      }

      // 7. Chống cùng entity bị 1 user báo cáo > 3 lần trong 30 ngày
      const since30d = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const sameTargetCount = await app.prisma.fraudReport.count({
        where: {
          submittedById: request.user.id,
          entityId: entity.id,
          createdAt: { gte: since30d },
        },
      });
      if (sameTargetCount >= SAME_TARGET_LIMIT_30D) {
        return reply.code(429).send({
          error: "Bạn đã báo cáo entity này quá nhiều lần trong 30 ngày.",
          code: "SAME_TARGET_LIMIT",
        });
      }

      // 8. Tạo report
      const report = await app.prisma.fraudReport.create({
        data: {
          entityId: entity.id,
          reasonCode: body.reason_code,
          reasonText: body.reason_text || null,
          detail: body.detail || null,
          amount: body.amount || null,
          transactionDate: body.transaction_date ? new Date(body.transaction_date) : null,
          paymentMethod: body.payment_method || null,
          contactChannel: body.contact_channel || null,
          productName: body.product_name || null,
          sellerName: body.seller_name || null,
          sellerShopName: body.seller_shop_name || null,
          bankOwnerName: body.bank_owner_name || null,
          socialLink: body.social_link || null,
          region: body.region || null,
          reporterIp: request.ip || null,
          reporterUA: request.headers["user-agent"]?.slice(0, 500) || null,
          relatedAccountEntityId: relatedEntity?.id || null,
          evidenceUrls: JSON.stringify(body.evidence_urls || []),
          riskLevelInput: body.risk_level_input || "medium",
          status: "PENDING",
          submittedById: request.user.id,
        },
      });

      await logReportStatus(app.prisma, {
        reportId: report.id,
        changedById: request.user.id,
        oldStatus: null,
        newStatus: "PENDING",
        action: "SUBMIT",
        note: body.reason_text || null,
      });

      return reply.code(201).send({
        success: true,
        message: "Báo cáo đã được gửi và đang chờ kiểm duyệt.",
        report_id: report.id,
        status: report.status,
      });
    }
  );

  // ===== "Báo cáo của tôi" =====

  app.get("/my", { preHandler: app.authenticate }, async (request) => {
    const reports = await app.prisma.fraudReport.findMany({
      where: { submittedById: request.user.id },
      orderBy: { createdAt: "desc" },
      include: { entity: true },
      take: 100,
    });
    return { items: reports.map(myReport) };
  });

  app.get("/my/:id", { preHandler: app.authenticate }, async (request, reply) => {
    const id = Number(request.params.id);
    const report = await app.prisma.fraudReport.findUnique({
      where: { id },
      include: {
        entity: true,
        relatedAccountEntity: true,
        statusLogs: { orderBy: { createdAt: "asc" } },
      },
    });
    if (!report) return reply.code(404).send({ error: "Không tìm thấy báo cáo" });
    if (report.submittedById !== request.user.id && request.user.role !== "ADMIN") {
      return reply.code(403).send({ error: "Forbidden" });
    }
    return {
      ...myReport(report),
      related_account_display: report.relatedAccountEntity?.displayValue,
      status_logs: report.statusLogs.map((l) => ({
        id: l.id,
        old_status: l.oldStatus,
        new_status: l.newStatus,
        action: l.action,
        note: l.note,
        created_at: l.createdAt,
      })),
    };
  });

  app.post(
    "/my/:id/add-info",
    { preHandler: app.authenticate, schema: addInfoBodySchema },
    async (request, reply) => {
      const id = Number(request.params.id);
      const report = await app.prisma.fraudReport.findUnique({ where: { id } });
      if (!report) return reply.code(404).send({ error: "Không tìm thấy báo cáo" });
      if (report.submittedById !== request.user.id) {
        return reply.code(403).send({ error: "Forbidden" });
      }
      if (!["PENDING", "REVIEWING", "NEED_MORE_INFO"].includes(report.status)) {
        return reply.code(400).send({ error: "Báo cáo này không còn cho phép bổ sung." });
      }

      const body = request.body;
      const existing = parseEvidence(report.evidenceUrls);
      const newEvidence = [...existing, ...(body.evidence_urls || [])].slice(0, 10);

      // Gộp note vào detail (append)
      let newDetail = report.detail || "";
      if (body.additional_note) {
        const stamp = new Date().toLocaleString("vi-VN");
        newDetail = (newDetail ? newDetail + "\n\n" : "") + `[Bổ sung ${stamp}] ${body.additional_note}`;
      }

      let relatedAccountEntityId = report.relatedAccountEntityId;
      if (body.related_bank_account && !relatedAccountEntityId) {
        try {
          const ent = await upsertEntity(app.prisma, "BANK_ACCOUNT", body.related_bank_account);
          relatedAccountEntityId = ent.id;
        } catch { /* ignore */ }
      }

      // Sau khi user bổ sung, chuyển NEED_MORE_INFO → REVIEWING tự động
      const newStatus = report.status === "NEED_MORE_INFO" ? "REVIEWING" : report.status;

      const updated = await app.prisma.fraudReport.update({
        where: { id },
        data: {
          detail: newDetail || null,
          evidenceUrls: JSON.stringify(newEvidence),
          socialLink: body.social_link || report.socialLink,
          relatedAccountEntityId,
          status: newStatus,
        },
      });

      await logReportStatus(app.prisma, {
        reportId: id,
        changedById: request.user.id,
        oldStatus: report.status,
        newStatus,
        action: "ADD_INFO",
        note: body.additional_note?.slice(0, 200) || null,
      });

      return { success: true, message: "Đã bổ sung thông tin.", evidence_count: newEvidence.length, status: updated.status };
    }
  );
}
