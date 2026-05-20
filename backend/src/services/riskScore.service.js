// Rule-based risk scoring cho module tra cứu.
// Đầu vào: thông tin tổng hợp từ DB. Đầu ra: score 0..100 + risk_level + status + recommendations.

const HIGH_SEVERITY_REASONS = new Set([
  "blocked_after_payment",
  "deposit_required",
  "fake_seller",
  "suspicious_bank_account",
]);

const RECOMMEND_BY_STATUS = {
  danger: [
    "Không nên chuyển khoản hoặc đặt cọc trong bất kỳ tình huống nào.",
    "Nếu đã giao dịch, hãy lưu ảnh chuyển khoản và nội dung chat để gửi báo cáo.",
    "Cân nhắc trình báo công an địa phương nếu số tiền lớn.",
  ],
  watchlist: [
    "Đã có báo cáo nhưng chưa được admin xác minh. Không nên chuyển khoản trước.",
    "Yêu cầu video xác minh hàng thật trước khi đặt cọc.",
    "Chỉ giao dịch qua kênh có bảo vệ người mua (sàn TMĐT, ship COD).",
  ],
  safe: [
    "Chưa ghi nhận cảnh báo. Tuy nhiên vẫn nên kiểm tra video sản phẩm, đối chiếu CCCD nếu có thể.",
    "Ưu tiên các phương thức giao dịch có bảo vệ người mua.",
  ],
  unknown: [
    "Hệ thống chưa có dữ liệu cho thông tin này. Không có nghĩa là an toàn.",
    "Nên xác minh người bán trực tiếp (video, gọi điện) trước khi chuyển khoản.",
    "Nếu phát hiện gian lận, hãy gửi báo cáo để bảo vệ cộng đồng.",
  ],
  verified_seller: [
    "Người bán đã được admin xác minh.",
    "Vẫn nên đối chiếu đúng số tài khoản trước khi chuyển — đề phòng số bị giả mạo.",
  ],
};

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function diffDays(a, b) {
  return Math.floor((new Date(a) - new Date(b)) / (1000 * 60 * 60 * 24));
}

/**
 * @param {Object} ctx
 * @param {Array}  ctx.reports         Tất cả FraudReport gắn với entity này (mọi status, trừ REJECTED/DUPLICATE).
 * @param {Object|null} ctx.seller     Bản ghi Seller liên kết (status=APPROVED) nếu có.
 * @param {Number} ctx.relatedEntityCount  Số entity khác có liên kết (cùng seller hoặc cùng report).
 * @returns {{score:number, riskLevel:string, status:string, summary:string, recommendations:string[], breakdown:object}}
 */
export function computeRisk(ctx) {
  const { reports = [], seller = null, relatedEntityCount = 0 } = ctx;

  const verifiedReports = reports.filter((r) => r.status === "VERIFIED" || r.status === "APPROVED");
  const pendingReports  = reports.filter((r) => r.status === "PENDING" || r.status === "REVIEWING" || r.status === "NEED_MORE_INFO");

  const now = Date.now();
  const recentReports = reports.filter((r) => diffDays(now, r.createdAt) <= 7);
  const reportsWithEvidence = reports.filter((r) => Array.isArray(r.evidenceUrlsParsed) ? r.evidenceUrlsParsed.length > 0 : false);
  const highSeverity = reports.filter((r) => HIGH_SEVERITY_REASONS.has(r.reasonCode));

  let score = 0;
  const breakdown = {};

  const a = pendingReports.length * 10;
  score += a; breakdown.pendingReports = a;

  const b = verifiedReports.length * 25;
  score += b; breakdown.verifiedReports = b;

  const c = reportsWithEvidence.length > 0 ? 15 : 0;
  score += c; breakdown.hasEvidence = c;

  const d = recentReports.length >= 3 ? 20 : 0;
  score += d; breakdown.recentBurst = d;

  const e = highSeverity.length > 0 ? 10 : 0;
  score += e; breakdown.highSeverityReason = e;

  const f = relatedEntityCount * 5;
  score += f; breakdown.relatedEntities = f;

  let g = 0;
  if (seller) {
    g -= 40;
    if (seller.ratingAvg >= 4.5) g -= 20;
    if (seller.ordersCount >= 500) g -= 10;
  }
  score += g; breakdown.verifiedSeller = g;

  score = clamp(score, 0, 100);

  let riskLevel;
  if (score <= 20) riskLevel = "very_low";
  else if (score <= 40) riskLevel = "low";
  else if (score <= 65) riskLevel = "medium";
  else if (score <= 85) riskLevel = "high";
  else riskLevel = "very_high";

  let status;
  if (verifiedReports.length > 0 && score >= 60) {
    status = "danger";
  } else if (seller && verifiedReports.length === 0 && score < 40) {
    status = "verified_seller";
  } else if (verifiedReports.length > 0 || score >= 60) {
    status = "danger";
  } else if (pendingReports.length > 0) {
    status = "watchlist";
  } else if (reports.length === 0 && !seller) {
    status = "unknown";
  } else {
    status = "safe";
  }

  const summary = buildSummary({ status, riskLevel, reports, verifiedReports, seller });
  const recommendations = RECOMMEND_BY_STATUS[status] || RECOMMEND_BY_STATUS.unknown;

  return { score, riskLevel, status, summary, recommendations, breakdown };
}

function buildSummary({ status, riskLevel, reports, verifiedReports, seller }) {
  switch (status) {
    case "danger":
      return `Có cảnh báo rủi ro ${riskLevelLabel(riskLevel)}. Đã có ${verifiedReports.length} báo cáo được admin xác minh trong tổng ${reports.length} báo cáo.`;
    case "watchlist":
      return `Có ${reports.length} báo cáo từ cộng đồng nhưng chưa được admin xác minh. Cân nhắc kỹ trước khi giao dịch.`;
    case "verified_seller":
      return `Thuộc người bán đã được xác minh: ${seller?.name || ""}.`;
    case "safe":
      return `Chưa ghi nhận cảnh báo nghiêm trọng cho thông tin này.`;
    case "unknown":
    default:
      return `Chưa có dữ liệu trong hệ thống. Vẫn nên xác minh người bán trước khi giao dịch.`;
  }
}

export function riskLevelLabel(level) {
  switch (level) {
    case "very_low": return "rất thấp";
    case "low": return "thấp";
    case "medium": return "trung bình";
    case "high": return "cao";
    case "very_high": return "rất cao";
    default: return level;
  }
}
