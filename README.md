# Driver Licensing Management System

DLMS is a milestone-driven Next.js 16 application using PostgreSQL, Drizzle ORM, Auth.js credentials, and private S3-compatible storage. Milestones 1 and 2 provide the platform, role access, master data, user administration, policy/fee configuration, deterministic seeds, append-only auditing, and the shared applicant registry with protected photo storage.

## Local setup

1. Copy `.env.example` to `.env.local` and supply a runtime PostgreSQL URL plus an Auth.js secret.
2. Create a separate PostgreSQL database whose name contains `test`, then set `DATABASE_URL_TEST`. Never reuse the runtime database.
3. Set `SEED_DEMO_USERS=true` and a development-only `DEMO_USER_PASSWORD` of at least 12 characters when demo accounts are needed.
4. Run `npm run db:migrate`, `npm run db:seed`, then `npm run dev`.

If Docker is installed, `docker compose -f compose.test.yml up -d` provides disposable PostgreSQL and MinIO services. The matching test database URL is:

```text
postgresql://dlms_test:dlms_test_password@localhost:55432/dlms_test
```

## Commands

- `npm run db:generate` — generate a forward migration after a reviewed schema change.
- `npm run db:migrate` / `npm run db:seed` — migrate or seed the runtime database.
- `npm run db:reset:test` — drop only the verified test schema, migrate, and seed test fixtures.
- `npm test` — run unit tests without external services.
- `npm run test:integration` — verify migrations and idempotent seeds against `DATABASE_URL_TEST`.
- `npm run test:e2e` — reset the test database and run the Auth.js browser suite with one worker.
- `npm run lint`, `npm run typecheck`, `npm run build` — required release checks.

## Access model

The five roles are Administrator, Data Entry Operator, Payment Officer, License Officer, and Examiner. Administrators have global access. Specialists require one assigned branch. `proxy.ts` performs only optimistic login redirection; every protected page and mutation reloads the active user from PostgreSQL and checks role, branch, and authentication version.

Demo accounts use the addresses documented in `lib/db/seed-data.ts`. Their shared password comes only from `DEMO_USER_PASSWORD`; demo seeding is rejected in production.

## Vercel deployment

Use a pooled PostgreSQL connection for `DATABASE_URL`, set a strong `AUTH_SECRET`, and configure the S3 variables from `.env.example` against a private bucket. Run migrations as a separate deployment/CI step before promoting the application. Preview, test, and production environments must use separate databases, buckets, credentials, and Auth.js secrets. Leave `SEED_DEMO_USERS=false` in production.
