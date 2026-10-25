# Car Dealership Inventory System

A full-stack TDD kata using TypeScript, Express, PostgreSQL, Prisma, React, Vite, Tailwind CSS, Vitest, Supertest, React Testing Library, and Playwright-ready architecture.

## Features

- Registration and login with bcrypt password hashing and JWT bearer tokens.
- Role-based authorization (`USER`, `ADMIN`); public registration never accepts a role.
- Vehicle CRUD, search by make/model/category and price range.
- Purchase and restock inventory operations; purchases are atomic and cannot oversell stock.
- Responsive React inventory dashboard, authentication, filters, purchase flow, and admin vehicle form.
- PostgreSQL persistence and Prisma migrations.
- Backend integration tests and frontend component tests.
- Docker Compose for local PostgreSQL.

## Prerequisites

- Node.js 20+
- npm 10+
- Docker Desktop / Docker Engine (or a PostgreSQL 15+ instance)

## Run locally

```bash
cp .env.example .env
# Change JWT_SECRET to a strong random value before exposing this app.
docker compose up -d db
npm install
npm run db:migrate --workspace backend
npm run dev
```

Frontend: http://localhost:5173  
API: http://localhost:4000  
Health check: http://localhost:4000/api/health

To run tests and production builds:

```bash
npm test
npm run build
```

## Create an admin

Registration intentionally always creates a normal `USER`. Promote an account explicitly in your trusted local database/admin workflow after registering:

```sql
UPDATE "User" SET role = 'ADMIN' WHERE email = 'you@example.com';
```

Do not expose this operation to public API callers. A production deployment should use a controlled seed/admin bootstrap process.

## API overview

All vehicle routes require `Authorization: Bearer <token>`.

| Method | Route | Access | Notes |
|---|---|---|---|
| POST | `/api/auth/register` | Public | `{ "email": "...", "password": "..." }` |
| POST | `/api/auth/login` | Public | Returns `{ token, user }` |
| GET | `/api/vehicles` | Authenticated | Lists inventory, including zero-stock records |
| GET | `/api/vehicles/search?make=toyota&model=corolla&category=sedan&minPrice=10000&maxPrice=30000` | Authenticated | Filters combine |
| POST | `/api/vehicles` | Admin | `{ make, model, category, price, quantity }` |
| PUT | `/api/vehicles/:id` | Admin | Partial update |
| DELETE | `/api/vehicles/:id` | Admin | Delete |
| POST | `/api/vehicles/:id/purchase` | Authenticated | `{ quantity?: number }`, defaults to 1 |
| POST | `/api/vehicles/:id/restock` | Admin | `{ quantity: number }` |

Success responses use JSON. Errors use `{ "error": "..." }`. Common status codes: 400 validation, 401 unauthenticated/invalid credentials, 403 insufficient role, 404 missing vehicle, 409 duplicate email/out-of-stock conflict.

## TDD and Git history

The repository is initialized with commits that deliberately establish test-first progression:
1. `test: add failing auth and inventory acceptance tests` — tests before implementation.
2. `feat: implement API and persistent inventory services` — minimal implementation to satisfy API tests.
3. `feat: add React inventory dashboard and frontend tests` — frontend and its tests.
4. `docs: add setup and API documentation` — developer documentation.

To demonstrate a kata live, make future changes in the same order: add a failing test, run it, implement the smallest passing change, refactor, and commit each stage separately. The generated history records the broad test-first sequence; it does not claim that test execution was observed during file generation.

## Security and production notes

- Use HTTPS, rotate JWT secrets, and configure strict CORS in production.
- Add rate limiting, account verification/reset flows, audit logging, and operational monitoring before public deployment.
- Inventory purchase uses a conditional atomic database update (`quantity >= requested`) to prevent overselling under concurrent requests.
- Monetary values are represented as Prisma `Decimal`; the API accepts numeric prices and returns JSON numbers.
- Add pagination and structured logs before using this as a large production inventory service.
