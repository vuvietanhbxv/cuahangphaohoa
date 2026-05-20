import { buildEntityShape, findEntity } from "../services/lookupEntity.service.js";
import { computeRisk, riskLevelLabel } from "../services/riskScore.service.js";
import { maskPhone, maskAccount } from "../lib/normalize.js";
import { reasonLabel } from "../lib/reasonCodes.js";

const REASON_GROUP_ORDER = [
  "blocked_after_payment",
  "deposit_required",
  "fake_seller",
  "suspicious_bank_account",
  "fake_product_image",
  "wrong_product",
  "no_refund",
  "other",
];

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

const lookupBodySchema = {
  body: {
    type: "object",
    required: ["type", "value"],
    properties: {
      type: { type: "string", enum: ["phone", "bank_account", "auto"] },
      value: { type: "string", minLength: 1, maxLength: 100 },
    },
  },
};

const lookupQuerySchema = {
  querystring: {
    type: "object",
    required: ["type", "value"],
    properties: {
      type: { type: "string", enum: ["phone", "bank_account"] },
      value: { type: "string", minLength: 1, maxLength: 100 },
    },
  },
};

function maskByType(type, normalizedValue) {
  if (type === "PHONE") return maskPhone(normalizedValue);
  if (type === "BANK_ACCOUNT") return maskAccount(normalizedValue);
  return normalizedValue;
}

function groupReasons(reports) {
  const counts = {};
  for (const r of reports) {
    counts[r.reasonCode] = (counts[r.reasonCode] || 0) + 1;
  }
  return Object.entries(counts)
    .map(([code, count]) => ({ code, label: reasonLabel(code), count }))
    .sort((a, b) => {
      const ai = REASON_GROUP_ORDER.indexOf(a.code);
      const bi = REASON_GROUP_ORDER.indexOf(b.code);
      if (ai === bi) return b.count - a.count;
      if (ai === -1) return 1;
      if (bi === -1) return -1;
      return ai - bi;
    });
}

async function buildLookupResponse(app, request, requestedType, rawValue) {
  // Chuẩn hoá theo loại yêu cầu
  let type = requestedType;
  if (type === "auto") {
    // Tạm thời: nếu có chữ cái hoặc dài >12 → bank_account; ngược lại phone
    const v = String(rawValue).trim();
    const digits = v.replace(/\D/g, "");
    type = digits.length >= 12 || /[A-Za-z]/.test(v) ? "BANK_ACCOUNT" : "PHONE";
  } else if (type === "phone") type = "PHONE";
  else if (type === "bank_account") type = "BANK_ACCOUNT";

  const shape = buildEntityShape(type, rawValue);
  const queryInfo = {
    type: shape.type,
    raw_value: shape.rawValue,
    normalized_value: shape.normalizedValue,
    display_value: shape.displayValue,
  };

  if (!shape.normalizedValue || shape.normalizedValue.length < 4) {
    return {
      query: queryInfo,
      status: "unknown",
      risk_level: "very_low",
      risk_score: 0,
      summary: "Giá trị tra cứu quá ngắn.",
      report_count: 0,
      verified_report_count: 0,
      pending_report_count: 0,
      last_reported_at: null,
      is_verified_seller: false,
      trusted_seller: null,
      reasons: [],
      related_entities: [],
      recommendations: ["Vui lòng nhập số điện thoại hoặc số tài khoản hợp lệ."],
    };
  }

  const entity = await findEntity(app.prisma, shape.type, shape.normalizedValue);

  // Tìm seller liên kết
  let seller = null;
  if (entity) {
    if (shape.type === "PHONE") {
      seller = await app.prisma.seller.findFirst({
        where: { phoneEntityId: entity.id, status: "APPROVED" },
      });
    } else if (shape.type === "BANK_ACCOUNT") {
      seller = await app.prisma.seller.findFirst({
        where: { accountEntityId: entity.id, status: "APPROVED" },
      });
    }
  }

  // Reports gắn với entity
  const allReports = entity
    ? await app.prisma.fraudReport.findMany({
        where: {
          entityId: entity.id,
          status: { in: ["PENDING", "REVIEWING", "VERIFIED", "NEED_MORE_INFO"] },
        },
        orderBy: { createdAt: "desc" },
      })
    : [];

  // Parse evidence cho từng report (để risk score tính đúng)
  const reports = allReports.map((r) => ({
    ...r,
    evidenceUrlsParsed: parseEvidence(r.evidenceUrls),
  }));

  // Related entities — qua các báo cáo có liên kết phone↔account
  let relatedEntities = [];
  if (entity) {
    // Nếu là phone: lấy các account_entity từ reports relatedAccountEntityId
    if (shape.type === "PHONE") {
      const accountIds = [...new Set(reports.map((r) => r.relatedAccountEntityId).filter(Boolean))];
      if (accountIds.length > 0) {
        const accounts = await app.prisma.lookupEntity.findMany({
          where: { id: { in: accountIds } },
        });
        relatedEntities.push(
          ...accounts.map((a) => ({
            type: "bank_account",
            display_value: maskAccount(a.normalizedValue),
            bank_name: a.bankName,
          }))
        );
      }
    }
    // Nếu là account: lấy phone entities qua các báo cáo entityId=PHONE có relatedAccountEntityId = entity.id
    if (shape.type === "BANK_ACCOUNT") {
      const phoneReports = await app.prisma.fraudReport.findMany({
        where: {
          relatedAccountEntityId: entity.id,
          status: { in: ["PENDING", "REVIEWING", "VERIFIED"] },
        },
        include: { entity: true },
      });
      const phoneIds = [...new Set(phoneReports.map((r) => r.entityId))];
      const phones = await app.prisma.lookupEntity.findMany({
        where: { id: { in: phoneIds } },
      });
      relatedEntities.push(
        ...phones.map((p) => ({
          type: "phone",
          display_value: maskPhone(p.normalizedValue),
        }))
      );
    }
  }

  const risk = computeRisk({
    reports,
    seller,
    relatedEntityCount: relatedEntities.length,
  });

  const verifiedReports = reports.filter((r) => r.status === "VERIFIED");
  const pendingReports = reports.filter((r) => ["PENDING", "REVIEWING", "NEED_MORE_INFO"].includes(r.status));

  const response = {
    query: queryInfo,
    status: risk.status,
    risk_level: risk.riskLevel,
    risk_level_label: riskLevelLabel(risk.riskLevel),
    risk_score: risk.score,
    summary: risk.summary,
    report_count: reports.length,
    verified_report_count: verifiedReports.length,
    pending_report_count: pendingReports.length,
    last_reported_at: reports[0]?.createdAt || null,
    is_verified_seller: !!seller,
    trusted_seller: seller
      ? {
          id: seller.id,
          name: seller.name,
          location: seller.location,
          rating_avg: seller.ratingAvg,
          orders_count: seller.ordersCount,
        }
      : null,
    reasons: groupReasons(reports),
    related_entities: relatedEntities,
    evidence_summary: {
      total_evidence_files: reports.reduce((sum, r) => sum + r.evidenceUrlsParsed.length, 0),
      reports_with_evidence: reports.filter((r) => r.evidenceUrlsParsed.length > 0).length,
    },
    recommendations: risk.recommendations,
    breakdown: risk.breakdown,
  };

  // Ghi LookupLog (best-effort, không block response)
  app.prisma.lookupLog
    .create({
      data: {
        userId: request.user?.id || null,
        ipAddress: request.ip || null,
        lookupType: shape.type,
        queryRaw: shape.rawValue.slice(0, 100),
        queryNormalized: shape.normalizedValue,
        resultStatus: risk.status,
        resultRiskScore: risk.score,
        entityId: entity?.id || null,
      },
    })
    .catch(() => {});

  return response;
}

export default async function lookupRoutes(app) {
  // POST /lookup — phương thức chính theo spec mới
  app.post(
    "/",
    {
      schema: lookupBodySchema,
      config: { rateLimit: { max: 30, timeWindow: "1 minute" } },
    },
    async (request) => buildLookupResponse(app, request, request.body.type, request.body.value)
  );

  // GET /lookup — giữ tương thích ngược với frontend cũ + dễ test bằng curl
  app.get(
    "/",
    {
      schema: lookupQuerySchema,
      config: { rateLimit: { max: 30, timeWindow: "1 minute" } },
    },
    async (request) => buildLookupResponse(app, request, request.query.type, request.query.value)
  );

  // Trả danh sách reason_codes / contact_channels / payment_methods cho frontend
  app.get("/reasons", async () => {
    const { REASON_CODES, CONTACT_CHANNELS, PAYMENT_METHODS, REGIONS } = await import("../lib/reasonCodes.js");
    return {
      items: REASON_CODES,
      contact_channels: CONTACT_CHANNELS,
      payment_methods: PAYMENT_METHODS,
      regions: REGIONS,
    };
  });
}
