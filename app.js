/**
 * app.js — Entry point cho Plesk Node.js hosting
 *
 * Plesk tìm file này ở root (httpdocs/app.js).
 * Chuyển cwd sang backend/ rồi load server thực tế.
 */

import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));

// chdir to backend/ để process.cwd() trỏ đúng thư mục
// (uploads, .env, prisma đều cần chạy từ backend/)
process.chdir(resolve(__dirname, "backend"));

// Load server thực tế
await import("./backend/src/server.js");
