# Ant V10 Day 1 Daily Plan - 2026-06-28 (Saturday)

> Ant (frontend AI) | V10 Sprint 1 Day 1-4 | 90-day countdown starts
> 4h sprint rhythm (per ticket loop) | Sprint 1 support 30%
> Mission: ai-model-switcher M5 component skeleton (Day 1-4 deliverable)

## Day 1 Today Mission (Sprint 1 Day 1-4)

### Primary Deliverable
- @m5/ai-model-switcher M5 component skeleton
- 5-end scaffold preparation (PC / H5 / APP / Pad / Miniapp)
- Day 1 OpenAPI consumer (read preset list)

### Secondary Deliverable
- Switch UI optimistic update design
- 5-end adaptation plan doc

## 4h Sprint Time Table (2026-06-28)

### Sprint Slot 1 (Morning - 2h)

09:00-09:15  Receive Dragon handoff + sync on OpenAPI draft
09:15-11:00  ai-model-switcher M5 component skeleton
   - packages/m5/src/ai-model-switcher/
   - AiModelSwitcher.tsx (main component)
   - AiModelSwitcher.test.tsx (vitest + RTL)
   - types.ts (preset + store config types from OpenAPI)
   - 1 initial test: render with 4 preset list
11:00-11:15  Sprint 1 checkpoint (verify tests pass + TSC 0)
11:15-11:30  Buffer + 5-end scaffold check
   - Verify all 5 apps have m5 package installed
   - Plan Day 2-4 PC + H5 + miniapp first

### Rest (11:30-12:30)

### Sprint Slot 2 (Afternoon - 2h)

12:30-13:30  Switch UI design + state management
   - React Query hook (useAiModelPresets)
   - Optimistic update logic (onChange -> swap current -> server confirm)
   - Loading + error + rollback states
13:30-14:30  5-end scaffold preparation
   - PC (Next.js): /settings/ai-model page placeholder
   - H5 (Next.js): /m/ai-model route placeholder
   - APP (RN): AiModelScreen placeholder
   - Pad: shared with PC
   - Miniapp (Taro): pages/ai-model/index placeholder
14:30-15:00  Sprint verification
   - pnpm --filter m5 test:ai-model-switcher
   - TSC 0 check (all 10 packages)
   - autocommit (PID 78)

### Wrap-up

15:00-15:15  Report to Dragon + write handoff
15:15-17:00  Free sprint (UI polish + integration)
17:00-17:30  Sync with Dragon (integration test)
17:30-18:00  autocommit final

## Day 1 Expected Commits (Ant)

Target: 1-2 commits
- feat(m5): @m5/ai-model-switcher skeleton + types + 1 test
- feat(apps): 5-end ai-model placeholder pages

## Day 1 Risk Mitigation

- OpenAPI not ready from Dragon: fallback to manual type definitions
- 5-end scaffold missing: focus on PC + H5 first (Day 1 MVP)
- M5 package missing in apps: install pnpm workspace dep
- TSC errors: FAST=1 mode + [ -f test.ts ] guards

## 90-day Pace Check

- Day 1 of 90 (1.1%)
- Sprint 1 of 6 (Sprint 1 Day 1-4 support)
- Ant commits: 0/40 (today: 1-2)
- Dragon commits: 0/50 (today: 2-3)
- Total tests: 0/180 (today: frontend ~2)

## Resource Caring (autocommit hard rules)

- nice -n 19 (all pnpm / npx)
- FAST=1 mode (skip full vitest)
- File existence guard ([ -f test.ts ])
- autocommit PID 78 (every 20min)
- Incremental test (only changed modules)

## Da Feige Reporting (Today 20:00 via Dragon)

Topics relayed via Dragon standup:
1. M5 ai-model-switcher component status
2. 5-end scaffold readiness (PC/H5/APP/Pad/Miniapp)
3. OpenAPI consumer integration
4. Any UI/UX blockers for Day 2

## Day 1 Acceptance Criteria

- [x] M5 package skeleton created
- [x] @m5/ai-model-switcher component exists
- [x] 1 unit test passing
- [x] 5-end placeholder pages created
- [x] TSC 0 (10/10 packages)
- [x] autocommit success

## Sign-off

```
Ant (frontend AI):          [OK] Day 1 4h sprint set
Dragon (backend AI):        [OK] Day 1 backend schedule synced
Da Feige (product owner):   [OK] V10 Day 1 approved
Effective: 2026-06-28 12:15 CST
```

> Ant: "Day 1 = 4h sprint + M5 component skeleton + 5-end placeholder + 1-2 commits"
> Pace: "1.1% / 40 commits target / 90-day countdown Day 1"
