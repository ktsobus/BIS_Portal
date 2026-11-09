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
- Everything else lives in `apps/web`: shadcn components in `components/ui`, Drizzle in `db/`, React Email templates in `emails/`. Env vars are in `apps/web/.env`.
- Feature folders: feature code lives in `apps/web/features/<feature>/` (`components/`, `server/router.ts`, feature helpers). Pages in `app/` stay thin and compose feature components. Features don't import each other's internals; code several features need goes to `components/ui`, `lib/`, `db/` or `emails/`. Contracts/schemas stay in `packages/api` (one file per feature), Drizzle tables in `db/schema/`.

## Data access

- Client components fetch and mutate app data **only** through oRPC + TanStack Query: `useQuery(orpc.x.y.queryOptions(...))`, `useMutation(orpc.x.y.mutationOptions())` from `apps/web/lib/orpc.ts`.
- **No Next.js server functions**: no `"use server"`, no server actions, no form `action={serverFn}`. The only route handlers are `/rpc` (oRPC) and `/api/auth` (better-auth). Don't add others.
- Server code that reads per-request state from the DB without `headers()`/`cookies()` must call `await connection()` (see `lib/setup.ts`), otherwise Next.js prerenders it at build time.
- Server components may read the session (`apps/web/lib/session.ts`) to gate or redirect. If a server component ever needs app data, it must call the same oRPC router through a server-side router client (not set up yet), never `db` directly.
- All business logic lives in oRPC procedures (`apps/web/features/*/server/router.ts`, each starting with `import "server-only"`, combined in `server/router.ts`) behind the middlewares in `apps/web/server/orpc.ts` (`authed`, `adminOnly`).

## Auth

- Public sign-up is disabled (`emailAndPassword.disableSignUp` in `apps/web/lib/auth.ts`). The first admin is created at `/setup`, which is only reachable while no admin exists. After that, admins create password users in the admin section.
- SAML (`@better-auth/sso`) is optional. Admins add providers at runtime in the admin section (stored in the DB); SAML users are provisioned on first sign-in with role `user`. LDAP lives on the `feat/ldap` branch.
- TOTP 2FA can be required for admins with a password (`credential`) account. This is controlled by the `requireAdminTwoFactor` app setting (`app_settings` table), which is **off by default** and toggled by admins (`apps/web/lib/two-factor.ts`). SAML users and regular password users never need it. Enforcement lives in the `authed`/`adminOnly` middlewares and `requireSession()`; keep both in sync.
- SAML identities must never be linked into an existing password admin account, since that would bypass TOTP. This is enforced by `resolveUser` in `lib/auth.ts`.
- `@better-auth/sso` management endpoints (`/sso/register`, `/sso/providers`, …) are restricted to admins by a `hooks.before` guard in `lib/auth.ts`. Admins manage providers through the `sso.*` oRPC procedures. Keep `@better-auth/sso` pinned to the exact `better-auth` version.
