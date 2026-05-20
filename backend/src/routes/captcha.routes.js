// Math captcha JWT-signed (không cần state server-side).
// Quy trình:
//   1. Frontend gọi GET /captcha → trả {token, question}
//   2. User nhập đáp án + gửi cùng token tới /reports
//   3. Backend verify token (JWT có expiry 5 phút) so với answer

import crypto from "node:crypto";

const TTL_SECONDS = 300; // 5 phút

function buildChallenge() {
  // Phép cộng đơn giản 2 số 1–9
  const a = 1 + Math.floor(Math.random() * 9);
  const b = 1 + Math.floor(Math.random() * 9);
  return { question: `${a} + ${b}`, answer: a + b };
}

export default async function captchaRoutes(app) {
  app.get(
    "/",
    {
      config: { rateLimit: { max: 60, timeWindow: "1 minute" } },
    },
    async () => {
      const { question, answer } = buildChallenge();
      // JWT chứa answer (nguời ngoài không đoán được vì có sign secret)
      const token = app.jwt.sign(
        { captcha: true, answer, nonce: crypto.randomBytes(8).toString("hex") },
        { expiresIn: `${TTL_SECONDS}s` }
      );
      return { token, question, expires_in: TTL_SECONDS };
    }
  );
}

/**
 * Helper để verify captcha trong các route khác.
 * @param {FastifyInstance} app
 * @param {string} token
 * @param {string|number} userAnswer
 * @returns {boolean}
 */
export function verifyCaptcha(app, token, userAnswer) {
  if (!token || userAnswer === undefined || userAnswer === null || userAnswer === "") return false;
  try {
    const payload = app.jwt.verify(token);
    if (!payload?.captcha) return false;
    return Number(payload.answer) === Number(userAnswer);
  } catch {
    return false;
  }
}
