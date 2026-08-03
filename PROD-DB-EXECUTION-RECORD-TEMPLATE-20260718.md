# Production DB Execution Record Template

## Change Metadata

- Change title:
- Change window:
- Operator:
- Reviewer:
- Rollback owner:
- Database target:
- Namespace:
- Related docs:
  - `PROD-DB-FOUNDATION-INIT-20260718.md`
  - `PROD-DB-MODULE-SEQUENCING-20260718.md`
  - `PROD-DB-PSQL-CHECKLIST-20260718.md`

## Preconditions

- [ ] Production change window approved
- [ ] Runtime `DATABASE_URL` target confirmed
- [ ] Current database state verified
- [ ] No seed job or ingestion job will start during bootstrap
- [ ] Rollback owner on-call
- [ ] SQL artifacts regenerated from current baseline

## Artifact Snapshot

- SQL directory:
- Rollback SQL directory:
- Generator version or commit:
- Bootstrap script:
- Rollback script:

## Step Record

| Step | SQL or Script | Start Time | End Time | Result | Notes |
| --- | --- | --- | --- | --- | --- |
| 1 | `foundation-verify.sql` |  |  |  |  |
| 2 | `foundation-wave0.sql` |  |  |  |  |
| 3 | `foundation-wave1.sql` |  |  |  |  |
| 4 | `foundation-verify.sql` |  |  |  |  |
| 5 | `foundation-wave2-wave3.sql` |  |  |  |  |
| 6 | `foundation-verify.sql` |  |  |  |  |
| 7 | `remaining-wave0.sql` |  |  |  |  |
| 8 | `phase-a-master-data.sql` |  |  |  |  |
| 9 | `remaining-verify.sql` |  |  |  |  |
| 10 | `phase-b-regional-portal.sql` |  |  |  |  |
| 11 | `remaining-verify.sql` |  |  |  |  |
| 12 | `phase-c-member-domain.sql` |  |  |  |  |
| 13 | `remaining-verify.sql` |  |  |  |  |
| 14 | `phase-d-ops-audit.sql` |  |  |  |  |
| 15 | `remaining-verify.sql` |  |  |  |  |

## Verification Evidence

- Pre-bootstrap verification output:
- Foundation verification output:
- Remaining-module verification output:
- API startup log check:
- Error budget or monitoring check:

## Pause Point Decisions

### After Foundation

- Decision:
- Owner:
- Reason:

### After Phase A

- Decision:
- Owner:
- Reason:

### After Phase B

- Decision:
- Owner:
- Reason:

### After Phase C

- Decision:
- Owner:
- Reason:

## Rollback Decision

- Was rollback needed:
- Trigger point:
- Trigger reason:
- Rollback SQL or script used:
- Rollback result:

## Final Outcome

- Final status:
- Final table inventory checked:
- Business traffic reopened:
- Follow-up tasks:
