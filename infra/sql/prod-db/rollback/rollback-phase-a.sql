-- Rollback phase A

-- Drop foreign keys first, then tables

-- Drop constraints for User

ALTER TABLE IF EXISTS "User" DROP CONSTRAINT IF EXISTS "User_tenantId_fkey";

-- Drop constraints for Store

ALTER TABLE IF EXISTS "Store" DROP CONSTRAINT IF EXISTS "Store_defaultMarketProfileId_fkey";
ALTER TABLE IF EXISTS "Store" DROP CONSTRAINT IF EXISTS "Store_brandId_fkey";
ALTER TABLE IF EXISTS "Store" DROP CONSTRAINT IF EXISTS "Store_tenantId_fkey";

-- Drop constraints for Brand

ALTER TABLE IF EXISTS "Brand" DROP CONSTRAINT IF EXISTS "Brand_defaultMarketProfileId_fkey";
ALTER TABLE IF EXISTS "Brand" DROP CONSTRAINT IF EXISTS "Brand_tenantId_fkey";

-- Drop constraints for Tenant

ALTER TABLE IF EXISTS "Tenant" DROP CONSTRAINT IF EXISTS "Tenant_defaultMarketProfileId_fkey";

-- Drop tables

DROP TABLE IF EXISTS "User";
DROP TABLE IF EXISTS "Store";
DROP TABLE IF EXISTS "Brand";
DROP TABLE IF EXISTS "Tenant";
DROP TABLE IF EXISTS "MarketProfile";
