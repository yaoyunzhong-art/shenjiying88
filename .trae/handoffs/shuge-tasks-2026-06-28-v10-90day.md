# Ant V10 90-Day Sprint Plan (2026-06-28 to 2026-09-25)

> Ant (frontend AI) | V10 spec: .trae/specs/v10-90day-sprint/spec.md
> 90 days / 13 weeks / 6 sprints + 1 week gray release
> 100% frontend commitment | 40 commits | 84 working days

## Sprint-by-Sprint (Ant Home)

### Sprint 1 (Day 1-14, 2026-06-28 to 2026-07-11) - AI Model Config UI (Support 30%)
Day 1-4: AI model switcher M5 component + 5-end skeleton
Day 5-9: History version view + rollback confirmation
Day 10-12: 5-end adaptation (PC full + H5 read-only + miniapp view + Pad full + APP notif)
Day 13-14: UI tests + integration

Acceptance: switch UI < 500ms perceived, 5-end consistent 100%

### Sprint 2 (Day 15-28, 2026-07-12 to 2026-07-25) - License UI (Support 20%)
Day 15-18: License status badges (4 entry points: home / settings / admin / detail)
Day 19-22: Upgrade guide UI (plan select + trial apply + level benefit)
Day 23-26: License management (W-4 admin + W-T tenant)
Day 27-28: UI tests

Acceptance: license gate UX >= 4.5, 30 tests pass

### Sprint 3 (Day 29-42, 2026-07-26 to 2026-08-08) - OpenAPI Docs (Support 10%)
Day 29-35: Swagger UI embed in admin docs site + Try-it-out console
Day 36-42: Code sample auto-gen (curl + Python + JS)

Acceptance: docs usable, 40 tests pass

### Sprint 4 (Day 43-56, 2026-08-09 to 2026-08-22) - 3-Level Config Workstations (HOME 60%)
Day 43-46: W-S Store Config Workstation (PC + Pad full + H5 read-only)
Day 47-50: W-T Tenant Config Workstation (multi-store select + batch + progress)
Day 51-54: W-B Brand Config Workstation (global + simplified gray)
Day 55-56: 3 workstations integration + 35 tests

Acceptance: 35 tests pass, self-service completion >= 95%, usability >= 4.5

### Sprint 5 (Day 57-70, 2026-08-23 to 2026-09-05) - Isolation UI (Support 30%)
Day 57-60: Field redaction UI (api_key mask + scope indicator)
Day 61-64: Audit log viewer (W-4 admin)
Day 65-68: DJCP Level 3 UI badge + security prompts
Day 69-70: UI tests + 50 tests pass

Acceptance: 50 tests pass, 0 leakage in penetration test

### Sprint 6 (Day 71-84, 2026-09-06 to 2026-09-19) - Acceptance Docs (HOME 60%)
Day 71-73: 180 tests UI regression (frontend 80+)
Day 74-76: 5-end compatibility test + UI screenshots
Day 77-79: OpenAPI docs site (3 languages: curl/Python/JS)
Day 80-82: Error code reference + integration guide UI
Day 83-84: Frontend test report

Acceptance: 180/180 UI tests, docs complete

### Week 13 (Day 85-90, 2026-09-20 to 2026-09-25) - Gray Release
Day 85-87: Gray release monitoring (10% -> 50% -> 100%)
Day 88-89: UI hot fixes
Day 90: V10 GO LIVE

## Ant Daily Routine (V10)

09:00 - Standup (15min, sync with Dragon)
09:15-12:00 - Frontend development
12:00-13:00 - Lunch
13:00-17:00 - Frontend development
17:00-17:30 - Integration test (sync with Dragon)
17:30-18:00 - Commit + close (autocommit PID 78)

Resource-caring: nice -n 19 + FAST=1 + file-existence guard

## Ant 40 Commits Plan

- Sprint 1: 5 commits (AI switch UI)
- Sprint 2: 5 commits (License UI)
- Sprint 3: 5 commits (OpenAPI docs)
- Sprint 4: 12 commits (3 workstations home)
- Sprint 5: 5 commits (Isolation UI)
- Sprint 6: 5 commits (Acceptance docs)
- Week 13: 3 commits (gray + fixes)

## M5 New Components (V10)

- @m5/ai-model-switcher (Sprint 1)
- @m5/license-badge (Sprint 2)
- @m5/license-upgrade-guide (Sprint 2)
- @m5/store-config-panel (Sprint 4)
- @m5/tenant-batch-panel (Sprint 4)
- @m5/brand-gray-release (Sprint 4, simplified)
- @m5/audit-log-viewer (Sprint 5)
- @m5/djcp-badge (Sprint 5)

## Risk Mitigation (V10 90-day)

1. Pad + APP full adaptation delayed -> MVP: PC + H5 + miniapp 3-end full, Pad + APP simplified
2. OpenAPI docs site complex -> Swagger UI embed (zero-build)
3. 5-end UI consistency -> M5 Design tokens shared across 5 apps
4. Frontend/Backend contract drift -> Day 1 OpenAPI draft + 17:00 daily sync
5. UI regression -> 80 frontend tests + 5-end screenshots

## Constitution Signatures

```
Ant (frontend AI):          [OK] accept V10 90-day 40 commits
Da Feige (product owner):   [OK] approve
Champion E41-E44 + E19:     [OK] unanimous + 24h decision
Effective: 2026-06-28 12:10 CST
Launch: 2026-09-25
```

> Ant: "90 days = 40 commits + 3 workstations + 5-end adapt + 8 M5 components + V10 launch"
> Stats: "40 commits / 80 frontend tests / 3 WS / 5-end / 8 components / 2026-09-25 launch"
