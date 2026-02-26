# AGENTS.md

## Cursor Cloud specific instructions

### Overview

Gestor is a multi-tenant SaaS ERP built with Next.js + tRPC + Better Auth + Prisma (Better-T-Stack). The main service is the Next.js web app at `apps/web/` which serves both frontend and API (tRPC + Better Auth routes). See `README.md` for standard commands (`pnpm dev`, `pnpm run check`, etc.).

### Prerequisites (already installed in VM snapshot)

- **Node.js 22+** (via nvm)
- **pnpm 10.27.0** (declared in `package.json` `"packageManager"`)
- **PostgreSQL 16** (central database)

### Database

- PostgreSQL must be running before starting the dev server: `sudo pg_ctlcluster 16 main start`
- Central DB connection: `postgresql://gestor:gestor@localhost:5432/gestor`
- The `.env` file at `apps/web/.env` is pre-configured with this connection string.
- MariaDB/MySQL per-tenant databases are optional and only needed for tenant-specific business data features.

### Starting the dev server

```bash
sudo pg_ctlcluster 16 main start
pnpm dev:web
```

The app runs at `http://localhost:3001`.

### Lint / Format

- `pnpm run check` — runs Biome check with auto-fix across the entire repo.
- `pnpm dlx ultracite fix` — runs Ultracite formatting (also the afterFileEdit hook in `.cursor/hooks.json`).

### Prisma

- Generate clients: `pnpm db:generate`, `pnpm db:gestor:generate`, `pnpm db:dfe:generate`
- Push schema: `pnpm db:push` (requires `DATABASE_URL` in `apps/web/.env`)
- The `pnpm.onlyBuiltDependencies` field in root `package.json` allows Prisma and sharp build scripts to run during install.

### Gotchas

- The `pnpm install` warning about ignored build scripts is resolved by the `pnpm.onlyBuiltDependencies` config in `package.json`. Without it, Prisma client generation will fail.
- Prisma auto-detects `apps/web/.env` via dotenv. No separate `.env` files are needed in `packages/db*`.
- The dev server uses Turbopack (Next.js 16) and starts quickly (~500ms).
- The `db:generate` commands for db-gestor and db-dfe need a dummy `DATABASE_URL` with mysql:// scheme if the real one is not available, but they successfully generate the client without a live MySQL connection.
