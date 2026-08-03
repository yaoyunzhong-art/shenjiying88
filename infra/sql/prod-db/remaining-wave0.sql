-- Remaining module wave 0

-- Shared enums required by portal and regional configuration tables

CREATE TYPE "PortalScopeType" AS ENUM ('TENANT', 'BRAND', 'STORE');

CREATE TYPE "PortalAudience" AS ENUM ('TOC', 'TOB');

CREATE TYPE "PortalChannel" AS ENUM ('WEB', 'H5', 'MINIAPP', 'APP', 'PC', 'PAD');

CREATE TYPE "ConfigInheritanceMode" AS ENUM ('PLATFORM_DEFAULT', 'TENANT_DEFAULT', 'BRAND_OVERRIDE', 'STORE_OVERRIDE');
