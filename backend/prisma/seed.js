import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import {
  normalizePhone,
  normalizeAccount,
  formatPhoneDisplay,
  formatAccountDisplay,
} from "../src/lib/normalize.js";

const prisma = new PrismaClient();

const PRODUCTS = [
  { name: "Pháo hoa giàn 36 ống Z121", slug: "phao-hoa-gian-36-ong-z121" },
  { name: "Giàn phun viên 25 ống", slug: "gian-phun-vien-25-ong" },
  { name: "Cây hoa lửa cầm tay", slug: "cay-hoa-lua-cam-tay" },
  { name: "Thác nước bạc", slug: "thac-nuoc-bac" },
];

const DATES = ["2026-05-09", "2026-05-10", "2026-05-11", "2026-05-12", "2026-05-13", "2026-05-14", "2026-05-15"];

const PRICE_HISTORY = {
  "Pháo hoa giàn 36 ống Z121": {
    BAC: [560000, 570000, 585000, 578000, 568000, 550000, 560000],
    TRUNG: [548000, 552000, 565000, 560000, 552000, 540000, 545000],
    NAM: [570000, 580000, 590000, 586000, 575000, 560000, 568000],
  },
  "Giàn phun viên 25 ống": {
    BAC: [420000, 435000, 428000, 455000, 462000, 448000, 472000],
    TRUNG: [410000, 422000, 430000, 438000, 446000, 442000, 456000],
    NAM: [438000, 450000, 445000, 468000, 475000, 466000, 486000],
  },
  "Cây hoa lửa cầm tay": {
    BAC: [76000, 78000, 81000, 83000, 85000, 84000, 87000],
    TRUNG: [72000, 75000, 77000, 79000, 80500, 80000, 83000],
    NAM: [82000, 85000, 88000, 90000, 92000, 91000, 96000],
  },
  "Thác nước bạc": {
    BAC: [112000, 115000, 118000, 121000, 125000, 123000, 129000],
    TRUNG: [105000, 110000, 113000, 116000, 119000, 118000, 122000],
    NAM: [118000, 123000, 126000, 130000, 133000, 132000, 138000],
  },
};

const MARKET_STORE_COUNTS = {
  "Pháo hoa giàn 36 ống Z121": { BAC: 128, TRUNG: 86, NAM: 104 },
  "Giàn phun viên 25 ống": { BAC: 18, TRUNG: 11, NAM: 16 },
  "Cây hoa lửa cầm tay": { BAC: 31, TRUNG: 19, NAM: 28 },
  "Thác nước bạc": { BAC: 22, TRUNG: 17, NAM: 24 },
};

const MARKET_LOW_HIGH = {
  "Pháo hoa giàn 36 ống Z121": { BAC: [520000, 590000], TRUNG: [515000, 575000], NAM: [530000, 600000] },
  "Giàn phun viên 25 ống": { BAC: [445000, 510000], TRUNG: [430000, 488000], NAM: [458000, 525000] },
  "Cây hoa lửa cầm tay": { BAC: [76000, 98000], TRUNG: [72000, 94000], NAM: [82000, 110000] },
  "Thác nước bạc": { BAC: [112000, 148000], TRUNG: [105000, 139000], NAM: [118000, 158000] },
};

const TRUSTED_SELLERS = [
  { name: "Pháo Hoa Chính Hãng 247", phone: "0988 123 456", bankAccount: "9704 1234 5678 999", bankName: "Vietcombank", location: "Hà Nội", ratingAvg: 4.9, ordersCount: 2300 },
  { name: "Kho Pháo Miền Bắc", phone: "0912 888 345", bankAccount: "9704 9988 2233 111", bankName: "Techcombank", location: "Bắc Ninh", ratingAvg: 4.8, ordersCount: 1500 },
  { name: "Pháo Hoa An Phát", phone: "0966 456 789", bankAccount: "9704 7777 1212 555", bankName: "BIDV", location: "TP. Hồ Chí Minh", ratingAvg: 4.9, ordersCount: 2800 },
  { name: "Pháo Hoa Thành Đạt", phone: "0903 555 888", bankAccount: "9704 1122 3344 556", bankName: "MB Bank", location: "Đà Nẵng", ratingAvg: 4.8, ordersCount: 1100 },
];

// Mỗi cảnh báo có nhiều reason_code khác nhau để demo việc gom theo lý do.
const WARNINGS = [
  {
    phone: "0378 123 456",
    relatedAccount: "9706 0987 6543 222",
    bankName: "Sacombank",
    riskLevel: "high",
    // Tổng 23 reports, chia theo các lý do
    breakdown: [
      { reason_code: "blocked_after_payment", count: 12, hasEvidence: true, amount: 800000 },
      { reason_code: "deposit_required", count: 7, hasEvidence: true, amount: 500000 },
      { reason_code: "fake_product_image", count: 4, hasEvidence: false, amount: null },
    ],
    summary: "Nhận tiền rồi chặn liên lạc",
  },
  {
    phone: "0921 765 432",
    relatedAccount: null,
    bankName: null,
    riskLevel: "medium",
    breakdown: [
      { reason_code: "deposit_required", count: 11, hasEvidence: true, amount: 300000 },
      { reason_code: "wrong_product", count: 6, hasEvidence: false, amount: null },
    ],
    summary: "Báo giá rẻ, yêu cầu cọc trước",
  },
  {
    phone: "0703 555 888",
    relatedAccount: null,
    bankName: null,
    riskLevel: "low",
    breakdown: [
      { reason_code: "wrong_product", count: 6, hasEvidence: false, amount: null },
      { reason_code: "no_refund", count: 3, hasEvidence: false, amount: null },
    ],
    summary: "Giao hàng chậm, sản phẩm khác mô tả",
  },
];

function entityShape(type, rawValue, bankName) {
  let normalized = "";
  let display = rawValue;
  if (type === "PHONE") {
    normalized = normalizePhone(rawValue);
    display = formatPhoneDisplay(normalized);
  } else if (type === "BANK_ACCOUNT") {
    normalized = normalizeAccount(rawValue);
    display = formatAccountDisplay(normalized);
  }
  return { type, rawValue, normalizedValue: normalized, displayValue: display, bankName: bankName || null };
}

async function upsertEntityDirect(type, rawValue, bankName) {
  const shape = entityShape(type, rawValue, bankName);
  return prisma.lookupEntity.upsert({
    where: { type_normalizedValue: { type: shape.type, normalizedValue: shape.normalizedValue } },
    update: { bankName: shape.bankName || undefined },
    create: shape,
  });
}

async function main() {
  console.log("Seeding TinCậy360 demo data (v2 — lookup module)...");

  const adminEmail = process.env.ADMIN_EMAIL || "admin@tincay360.vn";
  const adminPassword = process.env.ADMIN_PASSWORD || "Admin@123";
  const adminName = process.env.ADMIN_NAME || "Quản trị viên";
  const adminHash = await bcrypt.hash(adminPassword, 12);

  const admin = await prisma.user.upsert({
    where: { email: adminEmail },
    update: {},
    create: {
      email: adminEmail,
      passwordHash: adminHash,
      displayName: adminName,
      role: "ADMIN",
      trustScore: 100,
    },
  });

  const demoUser = await prisma.user.upsert({
    where: { email: "demo@tincay360.vn" },
    update: {},
    create: {
      email: "demo@tincay360.vn",
      passwordHash: await bcrypt.hash("Demo@123", 12),
      displayName: "Người dùng demo",
      role: "USER",
      trustScore: 10,
    },
  });

  // Tạo thêm 1 vài user phụ để mỗi báo cáo có submitter khác nhau (tránh trùng unique)
  const reporters = [];
  for (let i = 0; i < 25; i++) {
    const u = await prisma.user.upsert({
      where: { email: `reporter${i}@tincay360.vn` },
      update: {},
      create: {
        email: `reporter${i}@tincay360.vn`,
        passwordHash: await bcrypt.hash("Reporter@123", 12),
        displayName: `Người báo cáo ${i + 1}`,
        role: "USER",
        trustScore: Math.floor(Math.random() * 20),
      },
    });
    reporters.push(u);
  }

  // Products
  const productMap = {};
  for (const p of PRODUCTS) {
    const product = await prisma.product.upsert({
      where: { slug: p.slug },
      update: { name: p.name },
      create: p,
    });
    productMap[p.name] = product;
  }

  // Sellers + entities
  for (const s of TRUSTED_SELLERS) {
    const phoneEntity = await upsertEntityDirect("PHONE", s.phone);
    const accountEntity = await upsertEntityDirect("BANK_ACCOUNT", s.bankAccount, s.bankName);
    const existing = await prisma.seller.findFirst({ where: { phoneEntityId: phoneEntity.id } });
    if (existing) continue;
    await prisma.seller.create({
      data: {
        name: s.name,
        phone: s.phone,
        phoneEntityId: phoneEntity.id,
        bankAccount: s.bankAccount,
        accountEntityId: accountEntity.id,
        bankName: s.bankName,
        location: s.location,
        ratingAvg: s.ratingAvg,
        ordersCount: s.ordersCount,
        status: "APPROVED",
        submittedById: admin.id,
        approvedById: admin.id,
      },
    });
  }

  // Fraud reports + entities
  for (const w of WARNINGS) {
    const phoneEntity = await upsertEntityDirect("PHONE", w.phone);
    const accountEntity = w.relatedAccount
      ? await upsertEntityDirect("BANK_ACCOUNT", w.relatedAccount, w.bankName)
      : null;

    // Có phải đã seed rồi không? — kiểm tra một entity đã có report nào chưa
    const exists = await prisma.fraudReport.findFirst({ where: { entityId: phoneEntity.id } });
    if (exists) continue;

    let reporterIdx = 0;
    for (const group of w.breakdown) {
      for (let i = 0; i < group.count; i++) {
        const reporter = reporters[reporterIdx % reporters.length];
        reporterIdx++;
        const now = Date.now();
        const daysAgo = Math.floor(Math.random() * 14);
        const createdAt = new Date(now - daysAgo * 86400000);

        await prisma.fraudReport.create({
          data: {
            entityId: phoneEntity.id,
            reasonCode: group.reason_code,
            reasonText: w.summary,
            amount: group.amount || null,
            transactionDate: group.amount ? new Date(now - daysAgo * 86400000) : null,
            relatedAccountEntityId: accountEntity?.id || null,
            evidenceUrls: JSON.stringify(group.hasEvidence ? ["https://placeholder.example/evidence.jpg"] : []),
            riskLevelInput: w.riskLevel,
            status: "VERIFIED",
            submittedById: reporter.id,
            approvedById: admin.id,
            createdAt,
            updatedAt: createdAt,
          },
        });
      }
    }
  }

  // Daily prices
  for (const [productName, byRegion] of Object.entries(PRICE_HISTORY)) {
    const product = productMap[productName];
    const lowHigh = MARKET_LOW_HIGH[productName];
    const stores = MARKET_STORE_COUNTS[productName];
    for (const [region, prices] of Object.entries(byRegion)) {
      for (let i = 0; i < DATES.length; i++) {
        const date = new Date(DATES[i]);
        const avg = prices[i];
        const [low, high] = lowHigh[region];
        await prisma.dailyPrice.upsert({
          where: { productId_region_date: { productId: product.id, region, date } },
          update: { avg, low, high, storeCount: stores[region] },
          create: { productId: product.id, region, date, avg, low, high, storeCount: stores[region] },
        });
      }
    }
  }

  // ============================================================
  // CMS — Site settings + banner mặc định
  // ============================================================
  const SITE_DEFAULTS = [
    { key: "site_name",     value: "TinCậy360",                                              type: "string", group: "brand", description: "Tên website" },
    { key: "site_slogan",   value: "An tâm giao dịch pháo hoa",                              type: "string", group: "brand", description: "Slogan" },
    { key: "primary_color", value: "#fbbf24",                                                type: "color",  group: "brand", description: "Màu chủ đạo" },
    { key: "secondary_color", value: "#fb7185",                                              type: "color",  group: "brand", description: "Màu phụ" },
    { key: "danger_color",  value: "#f43f5e",                                                type: "color",  group: "brand", description: "Màu cảnh báo" },
    { key: "safe_color",    value: "#34d399",                                                type: "color",  group: "brand", description: "Màu an toàn" },
    { key: "bg_color",      value: "#060b1d",                                                type: "color",  group: "brand", description: "Màu nền" },
    { key: "logo_url",      value: "",                                                       type: "image",  group: "brand", description: "Logo chính" },
    { key: "favicon_url",   value: "",                                                       type: "image",  group: "brand", description: "Favicon" },
    { key: "hotline",       value: "1900 6360",                                              type: "string", group: "footer", description: "Số hotline" },
    { key: "support_email", value: "hotro@tincay360.vn",                                     type: "string", group: "footer", description: "Email hỗ trợ" },
    { key: "address",       value: "Tầng 6, 123 Trần Duy Hưng, Hà Nội",                      type: "string", group: "footer", description: "Địa chỉ" },
    { key: "hero_eyebrow",  value: "Cộng đồng xác thực · Dữ liệu cập nhật liên tục",         type: "string", group: "hero",  description: "Eyebrow trên hero" },
    { key: "hero_bg_url",   value: "",                                                       type: "image",  group: "hero",  description: "Ảnh nền banner hero (tuỳ chọn)" },
    { key: "hero_bg_overlay", value: "0.55",                                                 type: "string", group: "hero",  description: "Độ mờ overlay phủ ảnh hero (0..1)" },
  ];
  for (const s of SITE_DEFAULTS) {
    await prisma.siteSetting.upsert({
      where: { key: s.key },
      update: {},
      create: {
        key: s.key,
        value: JSON.stringify(s.value),
        type: s.type, group: s.group, description: s.description,
        updatedById: admin.id,
      },
    });
  }

  // Banner mặc định cho home_hero
  const existingBanner = await prisma.banner.findFirst({ where: { position: "home_hero", status: "active" } });
  if (!existingBanner) {
    await prisma.banner.create({
      data: {
        title: "Kiểm tra độ tin cậy người bán",
        subtitle: "trước khi thanh toán",
        description: "TinCậy360 giúp bạn tra cứu số điện thoại, số tài khoản và cập nhật cảnh báo lừa đảo trong giao dịch pháo hoa. Giao dịch an toàn — Chơi Tết trọn vẹn.",
        ctaPrimaryLabel: "Kiểm tra ngay",
        ctaPrimaryUrl: "/lookup",
        ctaSecondaryLabel: "Xem bảng giá",
        ctaSecondaryUrl: "/market",
        position: "home_hero",
        status: "active",
        sortOrder: 0,
        createdById: admin.id,
        updatedById: admin.id,
      },
    });
  }

  // ============================================================
  // Stores — Hệ thống cửa hàng (demo)
  // ============================================================
  const STORES = [
    {
      name: "Pháo Hoa Chính Hãng 247",
      slug: "phao-hoa-chinh-hang-247",
      description: "Hệ thống chính hãng Z121, có giấy phép kinh doanh đầy đủ.",
      phone: "0988 123 456",
      bankAccount: "9704 1234 5678 999",
      bankName: "Vietcombank",
      bankOwnerName: "Nguyễn Thành Đạt",
      brandColor: "#dc2626",
      openingHours: "08:00-21:00 hàng ngày",
      verificationStatus: "VERIFIED",
      trustScore: 92,
      rating: 4.9,
      reviewCount: 312,
      successfulTransactions: 2300,
      hasPriceToday: true,
      locations: [
        { branchName: "Chi nhánh Cầu Giấy",  region: "BAC", province: "Hà Nội",    provinceSlug: "ha-noi",    district: "Cầu Giấy", address: "123 Xuân Thuỷ, Cầu Giấy, Hà Nội", isMainBranch: true,  latitude: 21.0312, longitude: 105.7836 },
        { branchName: "Chi nhánh Hoàn Kiếm", region: "BAC", province: "Hà Nội",    provinceSlug: "ha-noi",    district: "Hoàn Kiếm", address: "45 Hàng Bài, Hoàn Kiếm, Hà Nội", latitude: 21.0245, longitude: 105.8534 },
      ],
      products: [{ slug: "phao-hoa-gian-36-ong-z121", price: 560000 }, { slug: "gian-phun-vien-25-ong", price: 472000 }],
    },
    {
      name: "Kho Pháo Miền Bắc",
      slug: "kho-phao-mien-bac",
      description: "Phân phối sỉ pháo hoa cho khu vực phía Bắc.",
      phone: "0912 888 345",
      bankAccount: "9704 9988 2233 111",
      bankName: "Techcombank",
      bankOwnerName: "Trần Hữu Phúc",
      openingHours: "07:30-20:00",
      verificationStatus: "VERIFIED",
      trustScore: 88,
      rating: 4.8,
      reviewCount: 156,
      successfulTransactions: 1500,
      hasPriceToday: true,
      locations: [
        { branchName: null, region: "BAC", province: "Bắc Ninh", provinceSlug: "bac-ninh", district: "Từ Sơn", address: "Khu Công Nghiệp Tiên Du, Bắc Ninh", isMainBranch: true, latitude: 21.1861, longitude: 105.9694 },
      ],
      products: [{ slug: "phao-hoa-gian-36-ong-z121", price: 545000 }, { slug: "thac-nuoc-bac", price: 122000 }],
    },
    {
      name: "Pháo Hoa An Phát",
      slug: "phao-hoa-an-phat",
      description: "Cửa hàng pháo hoa uy tín tại TP.HCM, giao hàng toàn quốc.",
      phone: "0966 456 789",
      bankAccount: "9704 7777 1212 555",
      bankName: "BIDV",
      bankOwnerName: "Lê Minh An",
      openingHours: "09:00-22:00",
      verificationStatus: "VERIFIED",
      trustScore: 95,
      rating: 4.9,
      reviewCount: 421,
      successfulTransactions: 2800,
      hasPriceToday: true,
      locations: [
        { branchName: "Chi nhánh Quận 1",   region: "NAM", province: "TP. Hồ Chí Minh", provinceSlug: "tp-ho-chi-minh", district: "Quận 1", address: "234 Lê Lợi, Quận 1, TP.HCM", isMainBranch: true, latitude: 10.7720, longitude: 106.6987 },
        { branchName: "Chi nhánh Quận 7",   region: "NAM", province: "TP. Hồ Chí Minh", provinceSlug: "tp-ho-chi-minh", district: "Quận 7", address: "Phú Mỹ Hưng, Quận 7, TP.HCM", latitude: 10.7295, longitude: 106.7178 },
        { branchName: "Chi nhánh Gò Vấp",   region: "NAM", province: "TP. Hồ Chí Minh", provinceSlug: "tp-ho-chi-minh", district: "Gò Vấp", address: "189 Quang Trung, Gò Vấp, TP.HCM", latitude: 10.8388, longitude: 106.6700 },
      ],
      products: [{ slug: "phao-hoa-gian-36-ong-z121", price: 570000 }, { slug: "gian-phun-vien-25-ong", price: 486000 }, { slug: "cay-hoa-lua-cam-tay", price: 96000 }],
    },
    {
      name: "Pháo Hoa Thành Đạt",
      slug: "phao-hoa-thanh-dat",
      description: "Cửa hàng địa phương Đà Nẵng, có giấy phép.",
      phone: "0903 555 888",
      bankAccount: "9704 1122 3344 556",
      bankName: "MB Bank",
      bankOwnerName: "Phạm Thành Đạt",
      openingHours: "08:00-20:00",
      verificationStatus: "VERIFIED",
      trustScore: 85,
      rating: 4.8,
      reviewCount: 98,
      successfulTransactions: 1100,
      hasPriceToday: false,
      locations: [
        { branchName: null, region: "TRUNG", province: "Đà Nẵng", provinceSlug: "da-nang", district: "Hải Châu", address: "78 Hùng Vương, Hải Châu, Đà Nẵng", isMainBranch: true, latitude: 16.0721, longitude: 108.2210 },
      ],
      products: [{ slug: "phao-hoa-gian-36-ong-z121", price: 552000 }],
    },
    {
      name: "Pháo Hoa Tây Đô",
      slug: "phao-hoa-tay-do",
      description: "Cửa hàng mới, đang chờ xác minh thông tin.",
      phone: "0907 333 444",
      openingHours: "08:30-21:30",
      verificationStatus: "PENDING",
      trustScore: 50,
      rating: 0,
      reviewCount: 0,
      hasPriceToday: false,
      locations: [
        { branchName: null, region: "NAM", province: "Cần Thơ", provinceSlug: "can-tho", district: "Ninh Kiều", address: "56 Trần Hưng Đạo, Ninh Kiều, Cần Thơ", isMainBranch: true, latitude: 10.0364, longitude: 105.7869 },
      ],
      products: [],
    },
  ];

  const digits = (s) => String(s || "").replace(/\D/g, "");

  for (const s of STORES) {
    const exists = await prisma.store.findUnique({ where: { slug: s.slug } });
    if (exists) continue;

    const created = await prisma.store.create({
      data: {
        name: s.name,
        slug: s.slug,
        description: s.description,
        phone: s.phone,
        phoneNormalized: digits(s.phone),
        bankAccount: s.bankAccount,
        bankAccountNormalized: digits(s.bankAccount),
        bankName: s.bankName,
        bankOwnerName: s.bankOwnerName,
        brandColor: s.brandColor || null,
        openingHours: s.openingHours,
        verificationStatus: s.verificationStatus,
        trustScore: s.trustScore || 50,
        rating: s.rating || 0,
        reviewCount: s.reviewCount || 0,
        successfulTransactions: s.successfulTransactions || 0,
        hasPriceToday: !!s.hasPriceToday,
        locations: { create: s.locations },
      },
    });

    // Gán sản phẩm
    for (const p of s.products) {
      const prod = productMap[Object.keys(productMap).find((k) => productMap[k].slug === p.slug)];
      if (!prod) continue;
      await prisma.storeProduct.create({
        data: {
          storeId: created.id,
          productId: prod.id,
          price: p.price,
          stockStatus: "available",
        },
      });
    }
  }

  console.log("Seeding complete.");
  console.log(`  Admin     : ${adminEmail} / ${adminPassword}`);
  console.log(`  Demo user : demo@tincay360.vn / Demo@123`);
  console.log(`  Reporters : reporter0..reporter24@tincay360.vn / Reporter@123`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
