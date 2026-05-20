import { prisma } from "../lib/prisma.js";

export async function recomputeDailyPrice(productId, region, date) {
  const day = new Date(date);
  day.setUTCHours(0, 0, 0, 0);

  const submissions = await prisma.priceSubmission.findMany({
    where: {
      productId,
      region,
      priceDate: day,
      status: "APPROVED",
    },
  });

  if (submissions.length === 0) {
    await prisma.dailyPrice
      .delete({
        where: { productId_region_date: { productId, region, date: day } },
      })
      .catch(() => {});
    return null;
  }

  const prices = submissions.map((s) => s.price);
  const sum = prices.reduce((a, b) => a + b, 0);
  const avg = Math.round(sum / prices.length);
  const low = Math.min(...prices);
  const high = Math.max(...prices);
  const storeCount = new Set(submissions.map((s) => s.storeName.trim().toLowerCase())).size;

  const upserted = await prisma.dailyPrice.upsert({
    where: { productId_region_date: { productId, region, date: day } },
    update: { avg, low, high, storeCount },
    create: { productId, region, date: day, avg, low, high, storeCount },
  });
  return upserted;
}
