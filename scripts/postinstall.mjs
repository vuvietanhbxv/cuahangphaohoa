/**
 * postinstall script for Vibe Hosting (TenTen / Plesk)
 *
 * Dependencies đã ở root package.json → npm install chỉ chạy 1 lần.
 * Script này chỉ lo:
 *   1. Tạo .env từ .env.example nếu chưa có
 *   2. Generate Prisma client
 *   3. Chạy DB migration
 *   4. Seed dữ liệu demo
 */

import { execSync } from "node:child_process";
import { existsSync, copyFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");
const backend = resolve(root, "backend");

function run(cmd, cwd = backend) {
  console.log(`> ${cmd}`);
  execSync(cmd, { cwd, stdio: "inherit" });
}

// 1. Create .env from .env.example if missing
console.log("\n=== 1/4 Checking .env ===");
const envPath = resolve(backend, ".env");
const envExample = resolve(backend, ".env.example");
if (!existsSync(envPath) && existsSync(envExample)) {
  copyFileSync(envExample, envPath);
  console.log("Created backend/.env from .env.example");
} else {
  console.log(".env OK");
}

// 2. Generate Prisma client
console.log("\n=== 2/4 Generating Prisma client ===");
run("npx prisma generate");

// 3. Run database migrations
console.log("\n=== 3/4 Running database migrations ===");
run("npx prisma migrate deploy");

// 4. Seed demo data
console.log("\n=== 4/4 Seeding database ===");
try {
  run("node prisma/seed.js");
} catch (e) {
  console.log("Seed skipped (may already exist)");
}

console.log("\n=== Setup complete! ===\n");
