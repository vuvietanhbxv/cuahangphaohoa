# TinCậy360 — An tâm giao dịch pháo hoa

Web app cộng đồng giúp:

- Kiểm tra số điện thoại / số tài khoản có bị cảnh báo lừa đảo không.
- Chia sẻ thông tin người bán uy tín & cảnh báo lừa đảo (admin duyệt trước khi public).
- Hiển thị giá pháo hoa biến động theo ngày theo từng khu vực (giống bảng giá vàng), tổng hợp từ giá do cộng đồng đăng.

## Kiến trúc

```
D:\cuahangphaohoa\
├── frontend\     React + Vite + Tailwind + React Router + Recharts
├── backend\      Fastify + Prisma + Postgres
└── docker-compose.yml   Postgres 16 cho dev
```

## Yêu cầu môi trường

- **Node.js ≥ 20** (đã test với Node 24).
- **KHÔNG cần cài Postgres/Docker** — mặc định dùng SQLite (file `backend/prisma/dev.db`). Nếu muốn dùng Postgres cho production, xem mục [Chuyển sang Postgres](#chuyển-sang-postgres-tuỳ-chọn) ở cuối.

## Cài đặt lần đầu

```powershell
# 1. Backend: cài deps + tạo SQLite db + seed demo data
cd backend
npm install
npx prisma migrate dev --name init
npm run seed

# 2. Frontend: cài deps
cd ..\frontend
npm install
```

Sau seed, sẽ có 2 tài khoản mặc định (xem `backend/.env`):
- **Admin**: `admin@tincay360.vn` / `Admin@123`
- **User**: `demo@tincay360.vn` / `Demo@123`

⚠️ Đổi password admin trước khi deploy production.

## Chạy dev

Mở 2 terminal:

```powershell
# Terminal 1 - backend (cổng 4000)
cd backend
npm run dev

# Terminal 2 - frontend (cổng 5173)
cd frontend
npm run dev
```

Mở <http://localhost:5173>.

## Kịch bản kiểm thử

- [ ] Trang chủ hiển thị dữ liệu thật (lấy từ DB sau khi seed).
- [ ] Mở DevTools Network: thấy các request `GET /api/v1/sellers`, `/reports`, `/prices/summary`, `/prices/history`.
- [ ] Gõ `0378 123 456` vào ô tra cứu → hiện **Rủi ro cao**.
- [ ] Gõ một số chưa có (`0900 000 000`) → hiện **Chưa ghi nhận cảnh báo**.
- [ ] Đăng ký tài khoản mới → đăng nhập tự động.
- [ ] Submit "Gửi báo cáo" với một số mới → admin queue nhận được.
- [ ] Đăng nhập admin → `/admin` → duyệt báo cáo → reload `/warnings` thấy báo cáo.
- [ ] Đăng giá mới → admin duyệt → bảng giá `/market` cập nhật.
- [ ] Gọi `GET /api/v1/admin/queue` không có JWT admin → 401/403.
- [ ] Spam `/api/v1/lookup?...` >30 lần/phút → 429.

## API tóm tắt

| Method | Path | Auth | Mô tả |
|---|---|---|---|
| GET | /api/v1/health | — | Health check |
| POST | /api/v1/auth/register | — | Đăng ký, trả JWT |
| POST | /api/v1/auth/login | — | Đăng nhập, trả JWT |
| GET | /api/v1/auth/me | JWT | Profile |
| GET | /api/v1/sellers | — | List người bán đã duyệt |
| GET | /api/v1/sellers/:id | — | Chi tiết |
| POST | /api/v1/sellers | JWT | Submit (PENDING) |
| POST | /api/v1/sellers/:id/reviews | JWT | Submit review |
| GET | /api/v1/reports | — | List cảnh báo đã duyệt (gom theo target) |
| POST | /api/v1/reports | JWT | Submit báo cáo (PENDING) |
| GET | /api/v1/lookup?type=phone\|bank_account&value=... | — | Tra cứu (rate-limit 30/phút) |
| GET | /api/v1/products | — | Danh sách sản phẩm |
| GET | /api/v1/prices/history?productId=&region=&days= | — | Lịch sử giá theo ngày |
| GET | /api/v1/prices/summary | — | Bảng giá tổng hợp |
| POST | /api/v1/prices | JWT | Submit giá (PENDING) |
| GET | /api/v1/admin/queue?type=sellers\|reports\|prices\|reviews | ADMIN | Hàng chờ duyệt |
| GET | /api/v1/admin/stats | ADMIN | Đếm pending |
| PATCH | /api/v1/admin/sellers/:id | ADMIN | Approve/Reject |
| PATCH | /api/v1/admin/reports/:id | ADMIN | Approve/Reject |
| PATCH | /api/v1/admin/prices/:id | ADMIN | Approve/Reject + recompute daily |
| PATCH | /api/v1/admin/reviews/:id | ADMIN | Approve/Reject + recompute rating |
| GET | /api/v1/captcha | — | Tạo math captcha (JWT-signed, TTL 5 phút) |
| POST | /api/v1/uploads | JWT | Upload bằng chứng (multipart, image/pdf, ≤5MB × 5 file) |
| GET | /uploads/:filename | — | Tải file đã upload (static) |

## Cấu trúc thư mục frontend

```
frontend/src/
├── api/client.js               fetch wrapper + JWT
├── context/AuthContext.jsx
├── components/
│   ├── ui.jsx                  Badge, GlassCard, SelectBox, FireworkBurst, ...
│   ├── LookupCard.jsx
│   ├── SellerCard.jsx
│   ├── WarningCard.jsx
│   └── RequireAuth.jsx
├── layouts/MainLayout.jsx
├── pages/
│   ├── HomePage.jsx
│   ├── LookupPage.jsx
│   ├── MarketPage.jsx
│   ├── SellersPage.jsx
│   ├── WarningsPage.jsx
│   ├── LoginPage.jsx / RegisterPage.jsx
│   ├── SubmitReportPage.jsx / SubmitSellerPage.jsx / SubmitPricePage.jsx
│   └── admin/AdminDashboard.jsx
└── App.jsx                     React Router root
```

## Cấu trúc backend

```
backend/
├── prisma/
│   ├── schema.prisma           Postgres models
│   └── seed.js                 Seed demo + admin user
└── src/
    ├── server.js               Fastify entry (helmet + cors + rate-limit + jwt)
    ├── lib/{prisma,hash,normalize}.js
    ├── routes/{auth,sellers,reports,lookup,prices,admin}.routes.js
    └── services/dailyPrice.service.js   Recompute DailyPrice khi duyệt giá
```

## Build production

```powershell
cd frontend
npm run build       # output dist/

cd ..\backend
npm start
```

Frontend `dist/` có thể phục vụ bằng bất kỳ static host nào (Nginx, Vercel, Cloudflare Pages). Backend deploy trên Railway/Render/Fly.io/VPS.

## Chuyển sang Postgres (tuỳ chọn)

SQLite phù hợp cho dev & demo. Khi deploy production thật (nhiều người dùng đồng thời, full-text search tốt hơn), nên chuyển sang Postgres:

1. Cài Postgres (Docker hoặc cloud Neon/Supabase). Nếu dùng Docker:
   ```powershell
   docker compose up -d
   ```
2. Sửa `backend/prisma/schema.prisma`: đổi `provider = "sqlite"` → `provider = "postgresql"`.
3. Sửa `backend/.env`:
   ```
   DATABASE_URL="postgresql://tincay:tincay_dev_password@localhost:5432/tincay360?schema=public"
   ```
4. Xoá migration cũ & tạo lại:
   ```powershell
   cd backend
   Remove-Item -Recurse -Force prisma\migrations, prisma\dev.db -ErrorAction SilentlyContinue
   npx prisma migrate dev --name init
   npm run seed
   ```

Lưu ý: bản SQLite lưu `evidenceUrls` dưới dạng JSON string. Khi chuyển sang Postgres bạn có thể đổi sang `String[] @default([])` (đã có ghi chú trong schema) nếu muốn dùng array native.
