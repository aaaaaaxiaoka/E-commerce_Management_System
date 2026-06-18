# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

AdminFlow is a full-stack enterprise admin management system (商品订单管理系统). Two user-facing apps:
- **Management backend** (`/`): dashboard, product/order CRUD, RBAC user/role/menu management — for admin/editor roles
- **Shop** (`/shop`): product catalog, detail page, cart, checkout, order tracking — restricted to **guest role only**

## Development Commands

### First-time setup

```bash
cd server && npm install && npx prisma db push --schema=src/prisma/schema.prisma && npm run db:seed
cd ../client && npm install
```

### Running

```bash
cd server && npm run dev     # Terminal 1: backend on port 3000
cd client && npm run dev     # Terminal 2: frontend on port 5173 (proxies /api → :3000)
```

Docker is **not required** — the project uses SQLite by default. Only need `docker-compose up -d postgres redis` if switching to PostgreSQL.

### Server (`server/`)

| Command | Description |
|---------|-------------|
| `npm run dev` | tsx watch (hot reload) |
| `npm run build` | tsc compilation |
| `npm run db:push` | Sync schema → SQLite |
| `npm run db:seed` | Seed test data |
| `npm run db:reset` | Force-reset + re-seed |

### Client (`client/`)

| Command | Description |
|---------|-------------|
| `npm run dev` | Vite dev server |
| `npm run build` | tsc + vite build |
| `npm test` | Vitest watch |
| `npm run test:run` | Vitest single run (CI) |

### Test accounts

| Username | Password | Role | Shop access |
|----------|----------|------|-------------|
| admin | 123456 | Admin | ❌ blocked |
| editor | 123456 | Editor | ❌ blocked |
| guest | 123456 | Guest | ✅ only shop user |

## Architecture

### Stack

`React 18 + Vite + Ant Design + Zustand` → HTTP `/api/*` → `Express + Prisma + SQLite`

### Backend: module pattern (`server/src/modules/`)

Every feature is a `controller` + `service` pair. Controller = Express Router with Zod validation. Service = business logic with its own `PrismaClient` instance.

**Request flow:** global middleware → route → controller (Zod parse) → service (Prisma) → `utils/response.ts` helpers (`success`/`fail`/`page`)

**Global middleware** (in `app.ts` order): compression → cors → JSON parser → rate limit (1000/15min on `/api`) → `/uploads` static → route handlers → error handler

**API routes** (all require `authenticate` middleware except auth's register/login/refresh):

| Base path | Module | Key endpoints |
|-----------|--------|---------------|
| `/api/auth` | auth | POST register/login/refresh/logout, GET profile, PATCH profile |
| `/api/users` | user | CRUD (admin-managed) |
| `/api/roles` | role | CRUD + permission assignment |
| `/api/permissions` | role | GET list (read-only) |
| `/api/products` | product | CRUD + paginated list with keyword/category/status filter |
| `/api/categories` | product | GET tree, POST create, DELETE |
| `/api/orders` | order | GET list, GET /my (user's orders), POST create, PUT /:id/status |
| `/api/addresses` | address | CRUD scoped to `req.user.userId`, PUT /:id/default |
| `/api/upload` | upload | POST single/multiple file (multer, 5MB, images only) |
| `/api/dashboard` | common | GET /stats (counts), GET /charts (trend/status/category) |

### Auth system

- **JWT dual-token**: Access Token (15min) + Refresh Token (7d). Refresh Token stored in `user.refreshToken` DB field.
- **Middleware**: `authenticate` (required, 401 if missing) and `optionalAuth` (best-effort).
- **Logout**: nullifies `refreshToken` in DB. No Redis blacklist yet.
- **Profile**: GET returns full user fields including phone/nickname/realName/gender/birthday/location; PATCH allows partial update with Zod validation (phone regex, idNumber regex, etc.)

### RBAC model

`User → UserRole → Role → RolePermission → Permission` and `User → UserRole → Role → RoleMenu → Menu`

- Permission codes: `admin` (super-access), `product:*`, `order:*`, `user:*`, `role:*`
- Menu tree: self-referential (`parentId`), built from flat DB rows by `useAuthStore.buildMenuTree()`
- Admin/editor roles are **blocked from the shop** by `ShopAuthGuard` (checks `user.roles` includes "guest")

### Error handling

Global `errorHandler` catches: ZodError → 400, Prisma P2002 → 409, generic → 500. All responses use `{ code, message, data }`.

### Database (Prisma + SQLite)

Schema: `server/src/prisma/schema.prisma`. 11 models: User, Role, Permission, RolePermission, UserRole, Menu, RoleMenu, Category, Product, Order, OrderItem, Address. SQLite with `DATABASE_URL=file:./dev.db`.

Key model notes:
- **User** has profile fields: phone, nickname, realName, idNumber, gender (0/1/2), birthday, province/city/district
- **Order.status** flow: 1=pendingPay → 2=pendingShip → 3=pendingReceive → 4=finished; any → 5=cancelled
- **Address** scoped to userId, supports isDefault (via Prisma $transaction to ensure only one default)
- **Product.images** stored as JSON string array; **Order.address** stored as JSON string `{name, phone, province, city, detail}`

## Frontend Architecture

### Routing (`client/src/router/index.tsx`)

All pages are `React.lazy()` loaded. Two layout trees:

| Path | Guard | Layout | Pages |
|------|-------|--------|-------|
| `/login` | none | none | admin login |
| `/shop/login`, `/shop/register` | none | none | shop auth pages |
| `/shop/*` | ShopAuthGuard (guest only) | ShopLayout (top nav) | catalog, product/:id, cart, checkout, orders, profile |
| `/*` | AuthGuard (any logged-in user) | MainLayout (sidebar) | dashboard, product, order, system/user, system/role, system/menu, profile |

### State management (Zustand)

| Store | Key state | Persistence |
|-------|-----------|-------------|
| `useAuthStore` | token, user, permissions, menuTree; actions: login, logout, fetchProfile, hasPermission, isAdmin, updateProfile | localStorage (token + user + permissions + menuTree); auto-hydrates on page refresh |
| `useAppStore` | theme (light/dark) | localStorage |
| `useCartStore` | items[], addItem, removeItem, updateQuantity, clearCart, totalCount, totalAmount | localStorage **per-user**: key = `shop-cart-{userId}` |

### Auth store lifecycle

1. **Login**: sets token + user + permissions + menuTree in Zustand and localStorage; sets `adminflow_cart_user` marker for cart isolation
2. **Page refresh**: restores all state from localStorage immediately; calls `fetchProfile()` in background for fresh data
3. **Logout**: clears Zustand + localStorage + in-memory cart items (persisted cart stays for next login)

### Axios interceptor (`api/request.ts`)

- **Request**: attaches `Authorization: Bearer <token>`
- **Response 401**: queues concurrent requests, refreshes token once, replays all. On failure: redirects to `/shop/login` if on a `/shop/*` path, otherwise `/login`

### Auth components

- `<AuthGuard>` — checks token existence, redirects to `/login`
- `<ShopAuthGuard>` — checks token + verifies `user.roles` includes "guest"; non-guest gets 403 page with link to admin dashboard
- `<AuthButton permission="code" confirm="text?" />` — hides if user lacks permission (admin role bypasses all checks)

### Profile page (`/profile` or `/shop/profile`)

5-tab layout (same component, different layouts):

1. **AccountBasicInfo** — avatar upload, read-only (id/username/registered/status), editable (phone/email)
2. **PersonalIdentity** — nickname, realName, idNumber, gender, birthday, region (Cascader)
3. **ShippingAddresses** — full CRUD table + modal form with region Cascader, default toggle
4. **PaymentInfo** — placeholder stats (wallet/points/coupons/cards = 0)
5. **BehavioralData** — cart summary (from useCartStore), recent 5 orders, browse history/favorites placeholders

All forms use `Form.useForm()` + `useEffect` sync to handle async user data loading after page refresh.

### Shop catalog → product detail flow

- Catalog cards: click navigates to `/shop/product/:id`; "add to cart" buttons use `e.stopPropagation()` to prevent navigation
- Detail page: image preview group, quantity selector, add-to-cart with login check, product description and metadata

### i18n

i18next with `zh-CN`/`en-US`. Keys organized by namespace: common, menu, user, product, order, shop, cart, checkout, dashboard, profile, theme, lang. Language persisted to localStorage (`adminflow_lang`).

### Vite build

Code split: `vendor` (React), `antd` (Ant Design), `echarts` (charts), `i18n` (i18next). Production: Terser with `drop_console: true`. Analysis: `rollup-plugin-visualizer` → `dist/stats.html`.

## Docker / Deployment

`docker-compose.yml` services: postgres (profile `postgres`), redis (profile `redis`/`full`), server (Node multi-stage, SQLite), nginx (multi-stage, gzip, asset caching, SPA fallback, API proxy).

CI/CD (`.github/workflows/deploy.yml`): on push/PR to main → client test+build, server type-check → Docker build (push/deploy steps commented out).
