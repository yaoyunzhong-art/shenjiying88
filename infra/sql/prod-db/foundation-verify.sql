-- Read-only verification before apply

select current_database(), current_schema(), current_user;

select table_schema, count(*) as table_count
from information_schema.tables
where table_schema not in ('pg_catalog', 'information_schema')
group by table_schema
order by table_schema;

select count(*) as public_table_count
from information_schema.tables
where table_schema = 'public';

-- Post-apply smoke checks

select count(*) as identity_account_count from "IdentityAccount";

select count(*) as config_entry_count from "ConfigEntry";

select count(*) as domain_event_count from "DomainEvent";

select count(*) as ai_model_config_count from "AiModelConfig";

select table_name
from information_schema.tables
where table_schema = 'public'
  and table_name in ('IdentityAccount', 'ConfigEntry', 'DomainEvent', 'AiModelConfig')
order by table_name;
