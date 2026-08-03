-- Read-only verify for local finance minimal apply

select current_database(), current_schema(), current_user;

select exists (
  select 1
  from information_schema.tables
  where table_schema = 'public'
    and table_name = '_prisma_migrations'
) as has_prisma_migrations;

select count(*) as public_table_count
from information_schema.tables
where table_schema = 'public';

select table_name
from information_schema.tables
where table_schema = 'public'
  and table_name in (
    'finance_report',
    'finance_report_export',
    'invoice_v2',
    'finance_ledger',
    'finance_account',
    'finance_settlement'
  )
order by table_name;

select indexname
from pg_indexes
where schemaname = 'public'
  and tablename in (
    'finance_report',
    'finance_report_export',
    'invoice_v2',
    'finance_ledger',
    'finance_account',
    'finance_settlement'
  )
order by tablename, indexname;

select conname, conrelid::regclass::text as table_name
from pg_constraint
where conname = 'finance_report_export_reportId_fkey';
