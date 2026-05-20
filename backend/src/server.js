import "dotenv/config";
import path from "node:path";
import Fastify from "fastify";
import cors from "@fastify/cors";
import helmet from "@fastify/helmet";
import rateLimit from "@fastify/rate-limit";
import jwt from "@fastify/jwt";
import multipart from "@fastify/multipart";
import fastifyStatic from "@fastify/static";

import { prisma } from "./lib/prisma.js";
import authRoutes from "./routes/auth.routes.js";
import sellersRoutes from "./routes/sellers.routes.js";
import reportsRoutes from "./routes/reports.routes.js";
import lookupRoutes from "./routes/lookup.routes.js";
import pricesRoutes from "./routes/prices.routes.js";
import adminRoutes from "./routes/admin.routes.js";
import uploadsRoutes from "./routes/uploads.routes.js";
import captchaRoutes from "./routes/captcha.routes.js";
import adminCmsRoutes from "./routes/adminCms.routes.js";
import siteRoutes from "./routes/site.routes.js";
import storesRoutes from "./routes/stores.routes.js";
import adminStoresRoutes from "./routes/adminStores.routes.js";

const app = Fastify({ logger: { level: "info" } });

await app.register(helmet, {
  contentSecurityPolicy: false,
  crossOriginResourcePolicy: { policy: "cross-origin" },
});
await app.register(cors, {
  origin: process.env.CORS_ORIGIN?.split(",") ?? true,
  credentials: true,
});
await app.register(rateLimit, {
  global: false,
  max: 100,
  timeWindow: "1 minute",
});
await app.register(jwt, {
  secret: process.env.JWT_SECRET || "dev-secret",
});
await app.register(multipart, {
  limits: { fileSize: 5 * 1024 * 1024, files: 5 },
});
await app.register(fastifyStatic, {
  root: path.resolve(process.cwd(), "uploads"),
  prefix: "/uploads/",
  decorateReply: false,
});

app.decorate("prisma", prisma);

app.decorate("authenticate", async (request, reply) => {
  try {
    await request.jwtVerify();
  } catch {
    return reply.code(401).send({ error: "Unauthorized" });
  }
});

app.decorate("requireAdmin", async (request, reply) => {
  try {
    await request.jwtVerify();
    if (request.user?.role !== "ADMIN") {
      return reply.code(403).send({ error: "Forbidden" });
    }
  } catch {
    return reply.code(401).send({ error: "Unauthorized" });
  }
});

app.get("/api/v1/health", async () => ({ status: "ok", time: new Date().toISOString() }));

await app.register(authRoutes, { prefix: "/api/v1/auth" });
await app.register(sellersRoutes, { prefix: "/api/v1/sellers" });
await app.register(reportsRoutes, { prefix: "/api/v1/reports" });
await app.register(lookupRoutes, { prefix: "/api/v1/lookup" });
await app.register(pricesRoutes, { prefix: "/api/v1" });
await app.register(adminRoutes, { prefix: "/api/v1/admin" });
await app.register(uploadsRoutes, { prefix: "/api/v1/uploads" });
await app.register(captchaRoutes, { prefix: "/api/v1/captcha" });
await app.register(adminCmsRoutes, { prefix: "/api/v1/admin" });
await app.register(siteRoutes, { prefix: "/api/v1/site" });
await app.register(storesRoutes, { prefix: "/api/v1/stores" });
await app.register(adminStoresRoutes, { prefix: "/api/v1/admin" });

const port = Number(process.env.PORT || 4000);
const host = process.env.HOST || "0.0.0.0";

try {
  await app.listen({ port, host });
  app.log.info(`TinCậy360 backend ready on http://${host}:${port}`);
} catch (err) {
  app.log.error(err);
  process.exit(1);
}
