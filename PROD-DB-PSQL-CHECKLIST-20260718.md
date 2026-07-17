# Production DB PSQL Checklist

## Preconditions

- Confirm the production change window is approved
- Confirm the operator, reviewer, and rollback owner are assigned
- Confirm the target connection is the runtime `DATABASE_URL` for `m5platform`
- Confirm the database is still empty or matches the expected pre-wave state
- Confirm no business seed job or ingestion task will start during schema bootstrap

## Regenerate Artifacts

Run locally before the production window:

```bash
node scripts/generate-foundation-sql.mjs
```

Dry-run the full bootstrap plan:

```bash
bash scripts/run-prod-db-bootstrap.sh
```

Dry-run the rollback draft:

```bash
bash scripts/rollback-prod-db-bootstrap-draft.sh
```

Review these files in order:

```bash
ls infra/sql/prod-db
ls infra/sql/prod-db/rollback
```

## Safe Execution Order

### Step 1

Read-only verify current state:

```bash
psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f infra/sql/prod-db/foundation-verify.sql
```

Expected:

- current database is `m5platform`
- no unexpected user tables exist in `public`

### Step 2

Apply foundation shared enums:

```bash
psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f infra/sql/prod-db/foundation-wave0.sql
```

### Step 3

Apply foundation independent tables:

```bash
psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f infra/sql/prod-db/foundation-wave1.sql
psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f infra/sql/prod-db/foundation-verify.sql
```

Stop if:

- any `CREATE TYPE`, `CREATE TABLE`, or `CREATE INDEX` fails
- verification shows unexpected extra objects

### Step 4

Apply foundation dependent tables and foreign keys:

```bash
psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f infra/sql/prod-db/foundation-wave2-wave3.sql
psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f infra/sql/prod-db/foundation-verify.sql
```

### Step 5

Apply remaining shared enums:

```bash
psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f infra/sql/prod-db/remaining-wave0.sql
```

### Step 6

Apply master data phase:

```bash
psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f infra/sql/prod-db/phase-a-master-data.sql
psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f infra/sql/prod-db/remaining-verify.sql
```

### Step 7

Apply regional and portal phase:

```bash
psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f infra/sql/prod-db/phase-b-regional-portal.sql
psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f infra/sql/prod-db/remaining-verify.sql
```

### Step 8

Apply member domain phase:

```bash
psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f infra/sql/prod-db/phase-c-member-domain.sql
psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f infra/sql/prod-db/remaining-verify.sql
```

### Step 9

Apply operations and audit phase:

```bash
psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f infra/sql/prod-db/phase-d-ops-audit.sql
psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f infra/sql/prod-db/remaining-verify.sql
```

## Post-apply Checks

- Check API startup logs for relation or enum mismatch
- Confirm no unexpected write failures appear in NestJS boot logs
- Keep application traffic constrained until smoke checks are clean
- Record final table inventory after the last phase

## Immediate Stop Conditions

- `psql` returns a non-zero exit code
- an enum already exists with incompatible definition
- a table exists unexpectedly with mismatched shape
- a foreign key fails because parent objects are missing
- application startup begins failing after a phase

## Rollback Rule

- If failure happens before business data is inserted, drop only objects created in the failed phase
- If a failure occurs after a foreign key attach, remove the failing constraints before dropping dependent tables
- Never mix rollback with additional forward changes in the same terminal session

## Automation Entry Points

- Forward dry-run or execution: `scripts/run-prod-db-bootstrap.sh`
- Rollback dry-run or execution: `scripts/rollback-prod-db-bootstrap-draft.sh`
- SQL generation: `scripts/generate-foundation-sql.mjs`

## Rollback SQL Artifacts

- `infra/sql/prod-db/rollback/rollback-foundation-wave2-wave3.sql`
- `infra/sql/prod-db/rollback/rollback-foundation-wave1.sql`
- `infra/sql/prod-db/rollback/rollback-foundation-wave0.sql`
- `infra/sql/prod-db/rollback/rollback-phase-d.sql`
- `infra/sql/prod-db/rollback/rollback-phase-c.sql`
- `infra/sql/prod-db/rollback/rollback-phase-b.sql`
- `infra/sql/prod-db/rollback/rollback-phase-a.sql`
- `infra/sql/prod-db/rollback/rollback-remaining-wave0.sql`
- `infra/sql/prod-db/rollback/rollback-all.sql`

## Execution Record Template

- Record every phase using `PROD-DB-EXECUTION-RECORD-TEMPLATE-20260718.md`
