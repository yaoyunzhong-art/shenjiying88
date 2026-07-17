-- Rollback phase B

-- Drop foreign keys first, then tables

-- Drop constraints for RegionalConfig

ALTER TABLE IF EXISTS "RegionalConfig" DROP CONSTRAINT IF EXISTS "RegionalConfig_marketProfileId_fkey";

-- Drop constraints for RegionalConfigOverride

ALTER TABLE IF EXISTS "RegionalConfigOverride" DROP CONSTRAINT IF EXISTS "RegionalConfigOverride_marketProfileId_fkey";
ALTER TABLE IF EXISTS "RegionalConfigOverride" DROP CONSTRAINT IF EXISTS "RegionalConfigOverride_regionalConfigId_fkey";
ALTER TABLE IF EXISTS "RegionalConfigOverride" DROP CONSTRAINT IF EXISTS "RegionalConfigOverride_tenantId_fkey";
ALTER TABLE IF EXISTS "RegionalConfigOverride" DROP CONSTRAINT IF EXISTS "RegionalConfigOverride_brandId_fkey";
ALTER TABLE IF EXISTS "RegionalConfigOverride" DROP CONSTRAINT IF EXISTS "RegionalConfigOverride_storeId_fkey";

-- Drop constraints for PortalSite

ALTER TABLE IF EXISTS "PortalSite" DROP CONSTRAINT IF EXISTS "PortalSite_marketProfileId_fkey";
ALTER TABLE IF EXISTS "PortalSite" DROP CONSTRAINT IF EXISTS "PortalSite_tenantId_fkey";
ALTER TABLE IF EXISTS "PortalSite" DROP CONSTRAINT IF EXISTS "PortalSite_brandId_fkey";
ALTER TABLE IF EXISTS "PortalSite" DROP CONSTRAINT IF EXISTS "PortalSite_storeId_fkey";

-- Drop constraints for EmailChannelConfig

ALTER TABLE IF EXISTS "EmailChannelConfig" DROP CONSTRAINT IF EXISTS "EmailChannelConfig_marketProfileId_fkey";

-- Drop constraints for SocialChannelConfig

ALTER TABLE IF EXISTS "SocialChannelConfig" DROP CONSTRAINT IF EXISTS "SocialChannelConfig_marketProfileId_fkey";

-- Drop constraints for TaxPolicyConfig

ALTER TABLE IF EXISTS "TaxPolicyConfig" DROP CONSTRAINT IF EXISTS "TaxPolicyConfig_marketProfileId_fkey";

-- Drop tables

DROP TABLE IF EXISTS "TaxPolicyConfig";
DROP TABLE IF EXISTS "SocialChannelConfig";
DROP TABLE IF EXISTS "EmailChannelConfig";
DROP TABLE IF EXISTS "PortalSite";
DROP TABLE IF EXISTS "RegionalConfigOverride";
DROP TABLE IF EXISTS "RegionalConfig";
