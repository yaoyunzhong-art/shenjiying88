# Ant Frontend V9 Plan - Shenjiying SaaS (2026-06-28)

> Ant (frontend AI) | V9 spec: .trae/specs/v9-shenjiying-saas/spec.md
> Phase 87-92 / 18 months / 6 stages / 2027-12 launch
> 4h sprint rhythm, follow Dragon backend API contracts

## V9 6 Core Requirements - Frontend Tasks

### Phase 87 (2026-07~09) AI Model Config UI (support 30%)
P0 Tasks (T-V9-P87-005):
1. AI model switch UI (store config panel) - PC + Pad
2. Switch optimistic update + WebSocket listener
3. History version view + rollback confirmation
4. Model parameters visual editor (temperature slider / context window select)
5. 5-end adaptation (PC primary + H5 read-only + APP notification)

Acceptance: switch UI < 500ms perceived, 25 tests pass

### Phase 88 (2026-10~12) License UI (support 20%)
P0 Tasks (T-V9-P88-006):
1. License status badge in all entry points
2. Disabled state with "Upgrade" tooltip
3. License management in W-4 (admin) + W-T (tenant)
4. Activation log viewer
5. Trial countdown UI

Acceptance: license gate UX score >= 4.5, 30 tests pass

### Phase 89 (2027-01~03) OpenAPI Docs (support 10%)
P0 Tasks (T-V9-P89-007):
1. Swagger UI embed in admin docs site
2. Try-it-out console
3. Code sample auto-gen (curl / Python / JS)
4. Sandbox env badge + test client_id guide

Acceptance: docs usable by external devs, 40 tests pass

### Phase 90 (2027-04~06) 3-Level Config Workstations (home 60%)
P0 Tasks (T-V9-P90-001..004):
1. W-S Store Config Workstation (PC + Pad primary)
   - System list dropdown + basic params + linkage test
2. W-T Tenant Config Workstation (PC primary)
   - Multi-store select + batch debug + async progress bar
3. W-B Brand Config Workstation (PC primary)
   - Global config + gray release (10%->50%->100%)
4. M5 components: StoreConfigPanel + TenantBatchPanel + BrandGrayRelease
5. 5-end responsive (PC full / Pad full / H5 view-only / APP notify / miniapp view-only)

Acceptance: 35 tests pass, self-service completion rate >= 95%, usability >= 4.5

### Phase 91 (2027-07~09) Permission Isolation UI (support 30%)
P0 Tasks (T-V9-P91-007):
1. Field-level redaction UI (api_key show as mask)
2. Row-level scope indicator (which stores accessible)
3. Audit log viewer (UI for ops)
4. DJCP Level 3 compliance badge

Acceptance: 50 tests pass, 0 leakage in penetration test

### Phase 92 (2027-10~12) Acceptance Docs (home 60%)
P0 Tasks (T-V9-P92-007):
1. 180 test cases UI regression
2. Test report UI screenshots
3. OpenAPI docs site + 5 language samples
4. Error code reference page
5. Integration guide UI + sandbox UI
6. DJCP Level 3 evaluation report

Acceptance: 180/180 UI tests pass, docs complete

## V9 18-Month KPI (Ant Frontend)

- Ant V9 commits: 0 -> 80
- Ant V9 tests: 0 -> 1700 (UI regression + new components)
- AI model switch UI: 0 -> 5-end adaptation
- License UI badges: 0 -> 4 entry points
- OpenAPI docs site: 0 -> live + 5 samples
- 3 workstations: 0 -> W-S / W-T / W-B (full)
- M5 new components: 0 -> 3 (StoreConfigPanel / TenantBatchPanel / BrandGrayRelease)
- UI for 180 acceptance tests
- DJCP Level 3 UI compliance badge

## R-06/R-07 Defense

- R-06 auto-stash + auto-commit (autocommit PID 78)
- R-07 24-dim anti-pattern lint (commit pre-check)
- race-safe-commit V4 --checklist force
- TSC 0 error (10/10 packages)
- Naming lint (Chinese describe + English it/test)

## Constitution Signatures

```
Ant (frontend AI):          [OK] accept V9 plan
Da Feige (product owner):   [OK] approve
Champion E41-E44 + E19:     [OK] unanimous
Effective: 2026-06-28 12:00 CST
Next review: 2026-07-28
```

> Ant: "Frontend 18-month sprint + 3 new workstations + 5-end adaptation = V9 ready"
> Stats: "80 commits / 1700 tests / 3 workstations / 5 docs / 2027-12 launch"
