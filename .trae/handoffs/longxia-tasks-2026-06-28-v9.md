# Dragon Backend V9 Plan - Shenjiying SaaS (2026-06-28)

> Dragon (backend AI) | V9 spec: .trae/specs/v9-shenjiying-saas/spec.md
> Phase 87-92 / 18 months / 6 stages / 2027-12 launch

## V9 6 Core Requirements - Backend Tasks

### Phase 87 (2026-07~09) AI Model Config (home 70%)
P0 Tasks (T-V9-P87-001..004):
1. ai-model-config module (NestJS)
2. System preset configs (4 packages: GPT-4o general / Claude game / Qwen family / custom)
3. Store self-config (6 params + AES-256 encryption)
4. Hot-reload config center + WebSocket push
5. History version (90d) + rollback

Acceptance: switch P95 < 500ms, availability >= 99.9%, 25 tests pass

### Phase 88 (2026-10~12) License (home 80%)
P0 Tasks (T-V9-P88-001..005):
1. license table + activation_log table
2. LicenseGuard NestJS Guard
3. @RequireLicense decorator
4. Activation cron (1min) + order webhook
5. Redis cache (TTL 5min)
6. License admin UI backend API

Acceptance: intercept 100% accurate, activation latency < 60s, 30 tests pass

### Phase 89 (2027-01~03) OpenAPI (home 90%)
P0 Tasks (T-V9-P89-001..006):
1. openapi module + RESTful controllers
2. OAuth 2.0 (token issue / refresh / revoke)
3. HMAC-SHA256 signature middleware
4. Whitelist (IP / client_id / scopes)
5. Rate limit (Redis token bucket 100 QPS)
6. OpenAPI 3.0 docs + Swagger UI
7. Call audit log

Acceptance: 40 tests pass, 5+ parallel clients, doc score >= 4.5

### Phase 90 (2027-04~06) 3-Level Config (home 40%)
P0 Tasks (T-V9-P90-005..006):
1. Self-service integration backend (test + auto-activate)
2. Batch debug API (async task queue)
3. Gray release backend (10% -> 50% -> 100%)
4. M5 component backing API

Acceptance: 35 tests pass, usability score >= 4.5

### Phase 91 (2027-07~09) Permission Isolation (home 70%)
P0 Tasks (T-V9-P91-001..006):
1. Column-level encryption (AES-256 + redaction)
2. PostgreSQL RLS (3-layer policies)
3. Row-level filter (NestJS Interceptor + session inject)
4. Audit log (full ops + 180d retention)
5. DJCP Level 3 prep (5-layer)
6. PII detection + redaction

Acceptance: 50 tests pass, 0 high-risk penetration, DJCP Level 3 pass

### Phase 92 (2027-10~12) Acceptance (home 40%)
P0 Tasks (T-V9-P92-001..006):
1. 180 test cases full regression
2. Test report (screenshots / logs / data)
3. OpenAPI docs (5 languages)
4. Error code table (100+)
5. Integration guide (sandbox + 5 steps)
6. DJCP Level 3 evaluation + filing

Acceptance: 180/180 tests pass, docs complete, DJCP pass

## V9 18-Month KPI (Dragon Backend)

- Dragon V9 commits: 0 -> 100
- Dragon V9 tests: 0 -> 1800
- AI model preset: 0 -> 4 packages
- License features: 0 -> 3 categories
- OpenAPI endpoints: 0 -> 15 endpoints
- 3-level APIs: 0 -> 9 APIs (W-S/W-T/W-B * 3)
- Isolation policies: 0 -> 50 RLS policies + 30 fields encryption
- Audit log retention: 0 -> 180 days

## R-06/R-07 Defense

- R-06 auto-stash + auto-commit continuous
- R-07 24-dim anti-pattern lint
- race-safe-commit V4 --checklist force
- TSC 0 error (10/10 packages)

## Constitution Signatures

```
Dragon (backend AI):        [OK] accept V9 plan
Da Feige (product owner):   [OK] approve
Champion E41-E44 + E19:     [OK] unanimous
Effective: 2026-06-28 12:00 CST
Next review: 2026-07-28
```

> Dragon: "Backend 18-month sprint + V8 collab + V9 6 demands = Shenjiying SaaS ready"
> Stats: "100 commits / 1800 tests / 6 stages / 180 acceptance / 2027-12 launch"
