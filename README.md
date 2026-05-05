# EI Phase 1A

EI Phase 1A establishes a database-backed agent builder and runtime foundation.

## Included

- Prisma schema for identity, tenant membership, RBAC, agent builder, runtime, audit, security, deployment requests, and knowledge document metadata.
- Seed data for EI permissions, organization roles, starter templates, starter tools, one demo organization, and one demo owner.
- Backend services for current organization lookup, permission enforcement, audit logging, security events, run events, agent creation, agent version creation, version activation, and single-agent runtime execution.
- Minimal permission-aware App Router pages for templates, agents, agent creation, agent detail, playground, runs, and run detail.

## Commands

```bash
pnpm install
pnpm prisma generate
pnpm prisma db push
pnpm prisma db seed
pnpm lint
pnpm typecheck
pnpm build
```

The database provider is PostgreSQL. Configure `DATABASE_URL` before running database commands.

## Deferred to Phase 1B

- Marketplace and public publishing.
- Payments, billing, revenue sharing, and enterprise SSO.
- Real external provider integrations.
- Complex workflow automation and multi-agent orchestration.
- Vector search and retrieval.
- Messaging and email automation.
