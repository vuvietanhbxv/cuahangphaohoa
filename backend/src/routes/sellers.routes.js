import { upsertEntity } from "../services/lookupEntity.service.js";

const submitSchema = {
  body: {
    type: "object",
    required: ["name", "phone", "location"],
    properties: {
      name: { type: "string", minLength: 1, maxLength: 200 },
      phone: { type: "string", minLength: 6, maxLength: 30 },
      bankAccount: { type: "string", maxLength: 40 },
      bankName: { type: "string", maxLength: 100 },
      location: { type: "string", minLength: 1, maxLength: 200 },
      description: { type: "string", maxLength: 2000 },
      thumbnailUrl: { type: "string", maxLength: 500 },
    },
  },
};

const reviewSchema = {
  body: {
    type: "object",
    required: ["rating"],
    properties: {
      rating: { type: "integer", minimum: 1, maximum: 5 },
      comment: { type: "string", maxLength: 1000 },
    },
  },
};

function publicSeller(s) {
  return {
    id: s.id,
    name: s.name,
    phone: s.phone,
    bankAccount: s.bankAccount,
    bankName: s.bankName,
    location: s.location,
    description: s.description,
    thumbnailUrl: s.thumbnailUrl,
    ratingAvg: s.ratingAvg,
    ordersCount: s.ordersCount,
    status: s.status,
    createdAt: s.createdAt,
  };
}

export default async function sellersRoutes(app) {
  app.get("/", async (request) => {
    const { location, search, page = 1, limit = 24 } = request.query;
    const skip = (Number(page) - 1) * Number(limit);
    const where = { status: "APPROVED" };
    if (location) where.location = { contains: location, mode: "insensitive" };
    if (search) where.name = { contains: search, mode: "insensitive" };

    const [items, total] = await Promise.all([
      app.prisma.seller.findMany({
        where,
        orderBy: [{ ratingAvg: "desc" }, { ordersCount: "desc" }],
        skip,
        take: Number(limit),
      }),
      app.prisma.seller.count({ where }),
    ]);
    return { items: items.map(publicSeller), total, page: Number(page), limit: Number(limit) };
  });

  app.get("/:id", async (request, reply) => {
    const id = Number(request.params.id);
    const seller = await app.prisma.seller.findUnique({
      where: { id },
      include: {
        reviews: {
          where: { status: "APPROVED" },
          orderBy: { createdAt: "desc" },
          take: 50,
          include: { user: { select: { displayName: true } } },
        },
      },
    });
    if (!seller || seller.status !== "APPROVED") {
      return reply.code(404).send({ error: "Không tìm thấy người bán" });
    }
    return {
      ...publicSeller(seller),
      reviews: seller.reviews.map((r) => ({
        id: r.id,
        rating: r.rating,
        comment: r.comment,
        createdAt: r.createdAt,
        userName: r.user.displayName,
      })),
    };
  });

  app.post(
    "/",
    { preHandler: app.authenticate, schema: submitSchema },
    async (request, reply) => {
      const body = request.body;
      let phoneEntity = null;
      let accountEntity = null;
      try {
        phoneEntity = await upsertEntity(app.prisma, "PHONE", body.phone);
        if (body.bankAccount) {
          accountEntity = await upsertEntity(app.prisma, "BANK_ACCOUNT", body.bankAccount, {
            bankName: body.bankName,
          });
        }
      } catch (err) {
        return reply.code(400).send({ error: err.message });
      }

      const seller = await app.prisma.seller.create({
        data: {
          name: body.name,
          phone: body.phone,
          phoneEntityId: phoneEntity.id,
          bankAccount: body.bankAccount || null,
          accountEntityId: accountEntity?.id || null,
          bankName: body.bankName || null,
          location: body.location,
          description: body.description || null,
          thumbnailUrl: body.thumbnailUrl || null,
          status: "PENDING",
          submittedById: request.user.id,
        },
      });
      return reply.code(201).send(publicSeller(seller));
    }
  );

  app.post(
    "/:id/reviews",
    { preHandler: app.authenticate, schema: reviewSchema },
    async (request, reply) => {
      const sellerId = Number(request.params.id);
      const seller = await app.prisma.seller.findUnique({ where: { id: sellerId } });
      if (!seller) return reply.code(404).send({ error: "Không tìm thấy người bán" });

      const review = await app.prisma.sellerReview.create({
        data: {
          sellerId,
          userId: request.user.id,
          rating: request.body.rating,
          comment: request.body.comment || null,
          status: "PENDING",
        },
      });
      return reply.code(201).send({ id: review.id, status: review.status });
    }
  );
}
