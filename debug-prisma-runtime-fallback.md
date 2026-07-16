# Debug Session: prisma-runtime-fallback
- **Status**: [OPEN]
- **Issue**: Local API can bootstrap and listen, but runtime Prisma access still crashes or destabilizes request paths in development mode.
- **Debug Server**: pending
- **Log File**: pending

## Reproduction Steps
1. Start the local API in development mode with `pnpm exec ts-node --project apps/api/tsconfig.json apps/api/src/main.ts`.
2. Verify the process reaches the listen phase on port `3001`.
3. Hit low-risk endpoints such as `/api/v1/health/ping` and `/docs`.
4. Observe whether the process stays alive or crashes on a Prisma-backed request path.

## Hypotheses & Verification
| ID | Hypothesis | Likelihood | Effort | Evidence |
|----|------------|------------|--------|----------|
| A | Health or docs requests still trigger a Prisma-backed code path that crashes after listen. | High | Low | Rejected |
| B | A non-health request path hits another undegraded `this.prisma.*` access outside `TrustGovernanceService`. | High | Medium | Partially confirmed |
| C | The process remains stable and only isolated endpoints fail, so the current blocker is route-specific rather than bootstrap-wide. | Medium | Low | Confirmed |
| D | A background job or post-listen module task crashes asynchronously, independent of incoming requests. | Medium | Medium | Rejected |

## Log Evidence
- Pre-fix: `/tmp/m5-api-runtime-3101.log` shows `TenantConfigRepository` raising `P2021` at startup during `loadAllInstances()`, with `public.ConfigInstance` missing, while the app still reaches `listen completed`.
- Instrumentation pass: `tenant-config.repository.ts` now logs operation name and Prisma code for persistence failures.
- Post-fix: `/tmp/m5-api-runtime-3103.log` shows a single warning: `TenantConfigRepository [loadAllInstances] dev-mode persistence disabled: P2021:missing-table`.
- Post-fix validation: `GET /api/v1/health/ping`, `GET /docs`, `GET /api/v1/foundation/overview`, and `GET /api/v1/tenant-config/meta/definitions` all return `200` on port `3103`.
- Post-fix log scan on `3103` shows no repeated `TenantConfigRepository` errors and no further Prisma `P2021` / `P1010` noise for the exercised routes.

## Verification Conclusion
- Pre-fix behavior: startup emitted hard `ERROR` logs from `TenantConfigRepository` because local development DB lacks the `ConfigInstance` table.
- Post-fix behavior: development mode detects `P2021` / access-denied persistence failures once, switches tenant-config persistence to in-memory fallback, and keeps the API serving verified endpoints.
- Remaining scope: continue scanning higher-value business paths for other direct Prisma dependencies outside tenant-config and trust-governance.
