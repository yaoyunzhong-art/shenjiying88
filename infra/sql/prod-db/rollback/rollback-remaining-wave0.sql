-- Rollback remaining wave 0 enums

-- Drop only if no dependent objects remain

-- Drop enum types

DROP TYPE IF EXISTS "ConfigInheritanceMode";
DROP TYPE IF EXISTS "PortalChannel";
DROP TYPE IF EXISTS "PortalAudience";
DROP TYPE IF EXISTS "PortalScopeType";
