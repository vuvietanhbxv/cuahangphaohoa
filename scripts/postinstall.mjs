/**
 * postinstall script for Vibe Hosting (TenTen / Plesk)
 *
 * Hosting chỉ chạy `npm install` rồi `npm start`.
 * Script này xử lý toàn bộ:
 *   1. Cài backend dependencies
 *   2. Tạo .env từ .env.example nếu chưa có
 *   3. Generate Prisma client
 *   4. Chạy DB migration
 *   5. Seed dữ liệu demo (bỏ qua nếu đã seed)
 */

import { execSync } from "node:child_process";
import { existsSync, copyFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");
const backend = resolve(root, "backend");

function run(cmd, cwd = backend) {
  console.log(`\n> ${cmd}`);
  execSync(cmd, { cwd, stdio: "inherit", env: { ...process.env, PRISMA_SKIP_POSTINSTALL_GENERATE: "1" } });
}

// 1. Install backend dependencies only
console.log("\n=== 1/5 Installing backend dependencies ===");
run("npm install --omit=dev");

// 2. Create .env from .env.example if missing
console.log("\n=== 2/5 Checking .env ===");
const envPath = resolve(backend, ".env");
const envExample = resolve(backend, ".env.example");
if (!existsSync(envPath) && existsSync(envExample)) {
  copyFileSync(envExample, envPath);
  console.log("Created backend/.env from .env.example");
  console.log("IMPORTANT: Update JWT_SECRET and ADMIN_PASSWORD in backend/.env for production!");
} else if (existsSync(envPath)) {
  console.log(".env already exists, skipping");
} else {
  console.log("WARNING: No .env or .env.example found!");
}

// 3. Generate Prisma client
console.log("\n=== 3/5 Generating Prisma client ===");
run("npx prisma generate");

// 4. Run database migrations
console.log("\n=== 4/5 Running database migrations ===");
run("npx prisma migrate deploy");

// 5. Seed demo data
console.log("\n=== 5/5 Seeding database ===");
try {
  run("node prisma/seed.js");
} catch (e) {
  console.log("Seed skipped (may already exist):", e.message?.slice(0, 100));
}

console.log("\n=== Setup complete! Ready to start. ===\n");
