import { recomputeDailyPrice } from "../services/dailyPrice.service.js";

const REGION_ENUM = ["BAC", "TRUNG", "NAM"];

const submitSchema = {
  body: {
    type: "object",
    required: ["productId", "region", "price", "storeName"],
    properties: {
      productId: { type: "integer" },
      region: { type: "string", enum: REGION_ENUM },
      price: { type: "integer", minimum: 1000, maximum: 100000000 },
      storeName: { type: "string", minLength: 1, maxLength: 200 },
      storeUrl: { type: "string", maxLength: 500 },
      priceDate: { type: "string", format: "date" },
    },
  },
};

function formatDate(date) {
  const d = new Date(date);
  const dd = String(d.getUTCDate()).padStart(2, "0");
  const mm = String(d.getUTCMonth() + 1).padStart(2, "0");
  return `${dd}/${mm}`;
}

export default async function pricesRoutes(app) {
  app.get("/products", async () => {
    const products = await app.prisma.product.findMany({
      orderBy: { id: "asc" },
    });
    return { items: products };
  });

  app.get("/prices/history", async (request, reply) => {
    const productId = Number(request.query.productId);
    const region = request.query.region;
    const days = Math.min(Math.max(Number(request.query.days || 7), 1), 90);

    if (!productId || !REGION_ENUM.includes(region)) {
      return reply.code(400).send({ error: "productId và region là bắt buộc" });
    }

    const rows = await app.prisma.dailyPrice.findMany({
      where: { productId, region },
      orderBy: { date: "desc" },
      take: days,
    });

    const items = rows
      .reverse()
      .map((r) => ({
        date: formatDate(r.date),
        rawDate: r.date.toISOString().slice(0, 10),
        price: r.avg,
        low: r.low,
        high: r.high,
        storeCount: r.storeCount,
      }));

    return { items };
  });

  app.get("/prices/summary", async () => {
    const products = await app.prisma.product.findMany({ orderBy: { id: "asc" } });
    const rows = [];

    for (const product of products) {
      for (const region of REGION_ENUM) {
        const latest = await app.prisma.dailyPrice.findMany({
          where: { productId: product.id, region },
          orderBy: { date: "desc" },
          take: 2,
        });
        if (latest.length === 0) continue;
        const today = latest[0];
        const yesterday = latest[1];
        const change =
          yesterday && yesterday.avg > 0
            ? Number((((today.avg - yesterday.avg) / yesterday.avg) * 100).toFixed(1))
            : 0;
        rows.push({
          productId: product.id,
          product: product.name,
          region,
          avg: today.avg,
          low: today.low,
          high: today.high,
          stores: today.storeCount,
          change,
          date: today.date.toISOString().slice(0, 10),
        });
      }
    }

    return { items: rows };
  });

  app.post(
    "/prices",
    { preHandler: app.authenticate, schema: submitSchema },
    async (request, reply) => {
      const body = request.body;
      const product = await app.prisma.product.findUnique({ where: { id: body.productId } });
      if (!product) return reply.code(404).send({ error: "Sản phẩm không tồn tại" });

      const priceDate = body.priceDate ? new Date(body.priceDate) : new Date();
      priceDate.setUTCHours(0, 0, 0, 0);

      const submission = await app.prisma.priceSubmission.create({
        data: {
          productId: body.productId,
          region: body.region,
          price: body.price,
          storeName: body.storeName,
          storeUrl: body.storeUrl || null,
          priceDate,
          status: "PENDING",
          submittedById: request.user.id,
        },
      });
      return reply.code(201).send({ id: submission.id, status: submission.status });
    }
  );
}
