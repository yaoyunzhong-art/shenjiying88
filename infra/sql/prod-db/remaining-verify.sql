-- Remaining module verification

select table_name
from information_schema.tables
where table_schema = 'public'
  and table_name in (
    'MarketProfile',
    'Tenant',
    'Brand',
    'Store',
    'PortalSite',
    'MemberProfile',
    'AuditLog',
    'marketing_push_decision_log',
    'inspection_task'
  )
order by table_name;

select count(*) as market_profile_count from "MarketProfile";

select count(*) as tenant_count from "Tenant";

select count(*) as member_profile_count from "MemberProfile";

select count(*) as audit_log_count from "AuditLog";
