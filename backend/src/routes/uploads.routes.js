import { pipeline } from "node:stream/promises";
import { createWriteStream } from "node:fs";
import { mkdir, stat, unlink } from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";
import { prisma } from "../lib/prisma.js";

const VALID_USAGE_TYPES = new Set([
  "logo", "banner", "seller_avatar", "seller_cover", "seller_featured",
  "product_image", "report_evidence", "public_media", "private_evidence",
]);

const ALLOWED_MIME = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "application/pdf",
]);

const MAX_BYTES = 5 * 1024 * 1024; // 5 MB / file

function safeExtension(filename = "") {
  const ext = path.extname(filename).toLowerCase();
  return /^\.(jpe?g|png|webp|gif|pdf)$/.test(ext) ? ext : "";
}

export default async function uploadsRoutes(app) {
  const uploadsDir = path.resolve(process.cwd(), "uploads");
  await mkdir(uploadsDir, { recursive: true });

  app.post(
    "/",
    {
      preHandler: app.authenticate,
      config: { rateLimit: { max: 30, timeWindow: "1 minute" } },
    },
    async (request, reply) => {
      if (!request.isMultipart()) {
        return reply.code(415).send({ error: "Expected multipart/form-data" });
      }

      const uploaded = [];
      // Cho phép tối đa 5 file/lần
      const parts = request.files({ limits: { files: 5, fileSize: MAX_BYTES } });

      for await (const file of parts) {
        if (!ALLOWED_MIME.has(file.mimetype)) {
          return reply.code(415).send({
            error: `Loại file không hỗ trợ: ${file.mimetype}`,
          });
        }
        const ext = safeExtension(file.filename) || guessExtFromMime(file.mimetype);
        const id = crypto.randomBytes(12).toString("hex");
        const finalName = `${Date.now()}_${id}${ext}`;
        const fullPath = path.join(uploadsDir, finalName);

        try {
          await pipeline(file.file, createWriteStream(fullPath));
        } catch (err) {
          // Xóa file nửa vời nếu lỗi
          try { await unlink(fullPath); } catch {}
          if (file.file.truncated) {
            return reply.code(413).send({ error: `File "${file.filename}" vượt quá ${MAX_BYTES / 1024 / 1024}MB.` });
          }
          return reply.code(500).send({ error: "Không lưu được file" });
        }

        // Kiểm tra size thực tế
        const s = await stat(fullPath);
        if (s.size > MAX_BYTES) {
          try { await unlink(fullPath); } catch {}
          return reply.code(413).send({ error: "File quá lớn" });
        }
        if (s.size === 0) {
          try { await unlink(fullPath); } catch {}
          continue;
        }

        const url = `/uploads/${finalName}`;

        // Xác định usage_type (admin có thể chỉ định qua query, mặc định public_media)
        const usageType = VALID_USAGE_TYPES.has(request.query?.usage_type)
          ? request.query.usage_type
          : "public_media";
        const visibility = usageType === "report_evidence" || usageType === "private_evidence"
          ? "admin_only" : "public";

        // Ghi MediaAsset (best-effort)
        try {
          await prisma.mediaAsset.create({
            data: {
              fileUrl: url,
              fileName: file.filename || finalName,
              mimeType: file.mimetype,
              fileSize: s.size,
              usageType,
              visibility,
              uploadedById: request.user?.id || null,
            },
          });
        } catch (err) {
          console.error("mediaAsset create failed:", err.message);
        }

        uploaded.push({
          url,
          filename: file.filename,
          mimetype: file.mimetype,
          size: s.size,
          usage_type: usageType,
        });
      }

      if (uploaded.length === 0) {
        return reply.code(400).send({ error: "Không có file nào hợp lệ" });
      }
      return { items: uploaded };
    }
  );
}

function guessExtFromMime(mime) {
  switch (mime) {
    case "image/jpeg": return ".jpg";
    case "image/png": return ".png";
    case "image/webp": return ".webp";
    case "image/gif": return ".gif";
    case "application/pdf": return ".pdf";
    default: return "";
  }
}
