/**
 * app.js — Entry point cho Plesk / Phusion Passenger
 *
 * File này dùng CommonJS (không phải ESM) để tương thích với Passenger.
 * Backend code vẫn là ESM (backend/package.json có "type": "module").
 */

const path = require("path");

// chdir to backend/ để dotenv, prisma, uploads resolve đúng thư mục
process.chdir(path.resolve(__dirname, "backend"));

// Dynamic import() để load ESM server module
import("./backend/src/server.js").catch((err) => {
  console.error("Server failed to start:", err);
  process.exit(1);
});
