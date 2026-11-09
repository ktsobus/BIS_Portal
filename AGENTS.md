<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## Repo conventions

- Package manager: pnpm 11 workspace. `minimumReleaseAge` (7 days) is enforced in `pnpm-workspace.yaml`; don't remove it. If an install is blocked, loosen the version range instead.
- TanStack Table is **v9** (`useTable`, `tableFeatures`, `create*RowModel`), not v8. See `node_modules/@tanstack/react-table/skills/`.
- shadcn forms use `Field` + react-hook-form `Controller` (there is no `Form` component).
- API changes start in `packages/api` (contract), then the feature's `server/router.ts` (registered in `apps/web/server/router.ts`).
- `packages/api` is the only shared package. It holds the wire contract (zod + `@orpc/contract` only) and must stay free of server code; the client imports it.
- Everything else lives in `apps/web`: shadcn components in `components/ui`, Drizzle in `db/`. The portal sends no email (no password reset, no email verification). Env vars are in `apps/web/.env`.
- Feature folders: feature code lives in `apps/web/features/<feature>/` (`components/`, `server/router.ts`, feature helpers). Pages in `app/` stay thin and compose feature components. Features don't import each other's internals; code several features need goes to `components/ui`, `lib/` or `db/`. Contracts/schemas stay in `packages/api` (one file per feature), Drizzle tables in `db/schema/`.

## Data access

- Client components fetch and mutate app data **only** through oRPC + TanStack Query: `useQuery(orpc.x.y.queryOptions(...))`, `useMutation(orpc.x.y.mutationOptions())` from `apps/web/lib/orpc.ts`.
- **No Next.js server functions**: no `"use server"`, no server actions, no form `action={serverFn}`. The only route handlers are `/rpc` (oRPC) and `/api/auth` (better-auth). Don't add others.
- Server code that reads per-request state from the DB without `headers()`/`cookies()` must call `await connection()` (see `lib/setup.ts`), otherwise Next.js prerenders it at build time.
- Server components may read the session (`apps/web/lib/session.ts`) to gate or redirect. If a server component needs app data, it calls the same oRPC router through `serverClient` from `apps/web/lib/orpc-server.ts` (see `features/catalog/load.ts`), never `db` or the catalog store directly.
- All business logic lives in oRPC procedures (`apps/web/features/*/server/router.ts`, each starting with `import "server-only"`, combined in `server/router.ts`) behind the middlewares in `apps/web/server/orpc.ts` (`authed`, `adminOnly`).
- Catalog snapshots are stored as JSON (`catalog_snapshot.payload`) and validated with `catalogSnapshotSchema` when loaded. Add new snapshot fields with `.optional()` or `.default()`; bump `CATALOG_SCHEMA_VERSION` only for real breaking changes and then add a step to `apps/web/lib/catalog/snapshot-migrations.ts`, so stored snapshots stay readable after an upgrade.
- Env vars are validated in `apps/web/lib/env-schema.ts` (empty values count as unset); `lib/env-schema.test.ts` checks `apps/web/.env.example` against it.

## Auth

- Public sign-up is disabled (`emailAndPassword.disableSignUp` in `apps/web/lib/auth.ts`). The first admin is created at `/setup`, which closes for good once setup is done (`app_settings.setup_completed_at`, not "no admin exists"). After that, admins create password accounts (always role `admin`) in the admin section. `lib/auth.ts` guards roles (only via set-role, never the last admin), the 12-character password rule and a per-account sign-in throttle (`lib/sign-in-throttle.ts`). `/rpc` rejects cross-origin mutations and requires the `x-csrf-token` header that `lib/orpc.ts` sends (`server/rpc-handler.ts`).
- SAML (`@better-auth/sso`) is optional. Admins add providers at runtime in the admin section (stored in the DB); SAML users are provisioned on first sign-in with role `user`. LDAP lives on the `feat/ldap` branch.
- TOTP 2FA can be required for admins with a password (`credential`) account. This is controlled by the `requireAdminTwoFactor` app setting (`app_settings` table), which is **off by default** and toggled by admins (`apps/web/lib/two-factor.ts`). SAML users and regular password users never need it. Enforcement lives in the `authed`/`adminOnly` middlewares and `requireSession()`; keep both in sync.
- SAML identities must never be linked into an existing password admin account, since that would bypass TOTP. This is enforced by `resolveUser` in `lib/auth.ts`.
- `@better-auth/sso` management endpoints (`/sso/register`, `/sso/providers`, …) are restricted to admins by a `hooks.before` guard in `lib/auth.ts`. Admins manage providers through the `sso.*` oRPC procedures. Keep `@better-auth/sso` pinned to the exact `better-auth` version.

## Catalog (LeanIX)

- LeanIX is the only source of truth; the portal only reads. The mapping of the LeanIX metamodel (fact sheet types, channel field/option, relations, root category id, resource type rules) lives in `apps/web/lib/leanix/model.ts`; client, GraphQL queries and raw types are in `apps/web/lib/leanix/`.
- `apps/web/lib/catalog/`: `mapper.ts` turns raw LeanIX data into a validated snapshot (publication rule, quality issues; pure, tested with the fixtures in `__fixtures__/`), `assess.ts` decides whether a new snapshot is plausible, `sync.ts` runs a sync (advisory lock, persistence in `catalog_snapshot`/`catalog_sync_run`), `store.ts` holds the current snapshot in memory, `scheduler.ts` runs periodic syncs. `instrumentation.ts` starts the scheduler at runtime (not during `next build`).
- Pages and client components never read the store or `db` directly: everything goes through the `catalog.*` and `catalogAdmin.*` oRPC procedures (`features/catalog/server/router.ts`, `features/catalog-admin/server/router.ts`).
- Demo mode: without `LEANIX_API_TOKEN` (or with `CATALOG_SOURCE=demo`) the store serves `apps/web/data/demo-catalog.json` and no sync runs. Regenerate it with `pnpm --filter web catalog:demo` after changing the mapper or the fixtures. For local syncs without LeanIX use `node scripts/mock-leanix.mjs` (see README).
- Deployment: `docker-compose.prod.yml` must pass every `LEANIX_*`/`CATALOG_*` variable from `apps/web/.env.example` to the app container (checked by `apps/web/lib/env-prod-config.test.ts`); document new variables in `.env.prod.example` and the README configuration table. Operations: `docs/betrieb.md`.
