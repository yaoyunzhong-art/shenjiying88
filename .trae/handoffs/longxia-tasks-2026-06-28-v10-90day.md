# Dragon V10 90-Day Sprint Plan (2026-06-28 to 2026-09-25)

> Dragon (backend AI) | V10 spec: .trae/specs/v10-90day-sprint/spec.md
> 90 days / 13 weeks / 6 sprints + 1 week gray release
> 100% backend commitment | 50 commits | 84 working days

## Sprint-by-Sprint (Dragon Home)

### Sprint 1 (Day 1-14, 2026-06-28 to 2026-07-11) - AI Model Config (Home 70%)
Day 1-3: ai-model-config NestJS module + 6-param schema
Day 4-6: 4 system presets (GPT-4o / Claude 3.5 / Qwen-VL / custom)
Day 7-9: Store self-config CRUD + AES-256 encryption + 90d snapshot
Day 10-12: Hot-reload switch + WebSocket push + rollback API
Day 13-14: 25 tests + Swagger doc

Acceptance: switch P95 < 500ms, availability >= 99.9%, 25/25 tests

### Sprint 2 (Day 15-28, 2026-07-12 to 2026-07-25) - License (Home 80%)
Day 15-17: license table + activation_log + migration
Day 18-20: LicenseGuard NestJS Guard + @RequireLicense decorator
Day 21-23: 4 triggers (order webhook + cron 1min + trial scan + level check)
Day 24-26: Redis cache (TTL 5min) + miss fallback
Day 27-28: 30 tests + admin API

Acceptance: intercept 100% accurate, activation < 60s, 30/30 tests

### Sprint 3 (Day 29-42, 2026-07-26 to 2026-08-08) - OpenAPI (Home 90%)
Day 29-31: openapi module + RESTful routes (auth/sync/command)
Day 32-34: OAuth 2.0 (client_credentials + token lifecycle)
Day 35-37: HMAC-SHA256 signature + Idempotency-Key
Day 38-40: Whitelist (client_id + IP + scopes) + Rate limit (100 QPS)
Day 41-42: OpenAPI 3.0 doc + Swagger UI + 40 tests

Acceptance: 40/40 tests, 5+ parallel clients, doc score >= 4.5

### Sprint 4 (Day 43-56, 2026-08-09 to 2026-08-22) - 3-Level Config (Home 40%)
Day 43-46: Self-service integration backend (linkage test + auto-activate)
Day 47-50: Batch debug API (async task queue + progress callback)
Day 51-53: Simplified gray release (one-shot switch + monitoring)
Day 54-56: Backend tests for 3 workstations

Acceptance: 35/35 tests, self-service completion >= 95%

### Sprint 5 (Day 57-70, 2026-08-23 to 2026-09-05) - Isolation + DJCP (Home 70%)
Day 57-59: Column-level encryption (AES-256 + redaction middleware)
Day 60-62: PostgreSQL RLS 3-layer policies
Day 63-65: Row-level filter (NestJS Interceptor + session inject)
Day 66-68: Audit log (full ops + 180d retention) + PII keyword detection
Day 69-70: DJCP Level 3 booking confirmation + 50 tests

Acceptance: 50/50 tests, internal pentest 0 high-risk, DJCP ready

### Sprint 6 (Day 71-84, 2026-09-06 to 2026-09-19) - Acceptance (Home 40%)
Day 71-73: 180 tests full regression (backend 100+)
Day 74-76: Backend perf test (P95 + concurrency + stability)
Day 77-79: DJCP Level 3 on-site (Day 71-77, 7 days)
Day 80-82: Bug fixes + perf optimization
Day 83-84: Backend test report

Acceptance: 180/180 tests, DJCP Level 3 passed, report complete

### Week 13 (Day 85-90, 2026-09-20 to 2026-09-25) - Gray Release
Day 85-87: Gray release (10% -> 50% -> 100%)
Day 88-89: Monitoring + emergency fixes
Day 90: V10 GO LIVE

## Dragon Daily Routine (V10)

09:00 - Standup (15min, sync with Ant)
09:15-12:00 - Backend module development
12:00-13:00 - Lunch
13:00-17:00 - Backend development
17:00-17:30 - Integration test (sync with Ant)
17:30-18:00 - Commit + close

Resource-caring: V6.3 nice -n 19 + 900s rhythm + cache layer

## Dragon 50 Commits Plan

- Sprint 1: 8 commits (AI model config)
- Sprint 2: 8 commits (License)
- Sprint 3: 10 commits (OpenAPI)
- Sprint 4: 5 commits (3-level config backend)
- Sprint 5: 10 commits (Isolation + DJCP)
- Sprint 6: 5 commits (Acceptance)
- Week 13: 4 commits (gray + fixes)

## Risk Mitigation (V10 90-day)

1. DJCP agency no-show -> Day 1 booking + 2 backup agencies
2. 180 tests behind -> Daily incremental + weekend dedicated
3. RLS perf bottleneck -> Early P95 test + Redis cache
4. OpenAPI doc site hard -> SwaggerHub SaaS as fallback
5. Backend/Frontend contract conflict -> Day 1 OpenAPI draft + daily sync

## Constitution Signatures

```
Dragon (backend AI):        [OK] accept V10 90-day 50 commits
Da Feige (product owner):   [OK] approve
Champion E41-E44 + E19:     [OK] unanimous + 24h decision
Effective: 2026-06-28 12:10 CST
Launch: 2026-09-25
```

> Dragon: "90 days = 50 commits + 6 modules + DJCP L3 + V10 launch"
> Stats: "50 commits / 100 backend tests / 6 modules / 13 weeks / 2026-09-25 launch"
