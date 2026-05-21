import { hashPassword, verifyPassword } from "../lib/hash.js";

const registerSchema = {
  body: {
    type: "object",
    required: ["email", "password", "displayName"],
    properties: {
      email: { type: "string", format: "email", maxLength: 200 },
      password: { type: "string", minLength: 6, maxLength: 200 },
      displayName: { type: "string", minLength: 1, maxLength: 100 },
      phone: { type: "string", maxLength: 30 },
    },
  },
};

const loginSchema = {
  body: {
    type: "object",
    required: ["email", "password"],
    properties: {
      email: { type: "string", format: "email" },
      password: { type: "string", minLength: 1 },
    },
  },
};

function publicUser(user) {
  return {
    id: user.id,
    email: user.email,
    displayName: user.displayName,
    phone: user.phone,
    role: user.role,
    trustScore: user.trustScore,
    mustChangePassword: user.mustChangePassword || false,
  };
}

export default async function authRoutes(app) {
  app.post("/register", { schema: registerSchema }, async (request, reply) => {
    const { email, password, displayName, phone } = request.body;
    const exists = await app.prisma.user.findUnique({ where: { email } });
    if (exists) return reply.code(409).send({ error: "Email đã được sử dụng" });

    const passwordHash = await hashPassword(password);
    const user = await app.prisma.user.create({
      data: { email, passwordHash, displayName, phone },
    });

    const token = app.jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      { expiresIn: "7d" }
    );
    return { token, user: publicUser(user) };
  });

  app.post("/login", { schema: loginSchema }, async (request, reply) => {
    const { email, password } = request.body;
    const user = await app.prisma.user.findUnique({ where: { email } });
    if (!user) return reply.code(401).send({ error: "Email hoặc mật khẩu không đúng" });

    const ok = await verifyPassword(password, user.passwordHash);
    if (!ok) return reply.code(401).send({ error: "Email hoặc mật khẩu không đúng" });

    if (user.isLocked) {
      return reply.code(403).send({
        error: user.lockReason || "Tài khoản đã bị khóa. Vui lòng liên hệ admin.",
        code: "ACCOUNT_LOCKED",
      });
    }

    // Cập nhật lastLoginAt (best-effort)
    app.prisma.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } }).catch(() => {});

    const token = app.jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      { expiresIn: "7d" }
    );
    return { token, user: publicUser(user) };
  });

  app.get("/me", { preHandler: app.authenticate }, async (request) => {
    const user = await app.prisma.user.findUnique({ where: { id: request.user.id } });
    if (!user) return { user: null };
    return { user: publicUser(user) };
  });

  // Đổi mật khẩu (bắt buộc khi mustChangePassword = true)
  app.post(
    "/change-password",
    {
      preHandler: app.authenticate,
      schema: {
        body: {
          type: "object",
          required: ["currentPassword", "newPassword"],
          properties: {
            currentPassword: { type: "string", minLength: 1 },
            newPassword: { type: "string", minLength: 6, maxLength: 200 },
          },
        },
      },
    },
    async (request, reply) => {
      const { currentPassword, newPassword } = request.body;
      const user = await app.prisma.user.findUnique({ where: { id: request.user.id } });
      if (!user) return reply.code(404).send({ error: "Không tìm thấy tài khoản" });

      const ok = await verifyPassword(currentPassword, user.passwordHash);
      if (!ok) return reply.code(400).send({ error: "Mật khẩu hiện tại không đúng" });

      if (currentPassword === newPassword) {
        return reply.code(400).send({ error: "Mật khẩu mới phải khác mật khẩu cũ" });
      }

      const passwordHash = await hashPassword(newPassword);
      const updated = await app.prisma.user.update({
        where: { id: user.id },
        data: { passwordHash, mustChangePassword: false },
      });

      // Trả JWT mới (role có thể đã thay đổi)
      const token = app.jwt.sign(
        { id: updated.id, email: updated.email, role: updated.role },
        { expiresIn: "7d" }
      );
      return { token, user: publicUser(updated), message: "Đổi mật khẩu thành công" };
    }
  );
}
