-- Phase B

-- Regional, portal, and market-scoped channel configuration

-- RegionalConfig

CREATE TABLE "RegionalConfig" (
    "id" TEXT NOT NULL,
    "marketProfileId" TEXT NOT NULL,
    "localePolicy" JSONB NOT NULL,
    "timezonePolicy" JSONB NOT NULL,
    "currencyPolicy" JSONB NOT NULL,
    "taxPolicy" JSONB NOT NULL,
    "networkPolicy" JSONB NOT NULL,
    "emailPolicy" JSONB NOT NULL,
    "socialPolicy" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RegionalConfig_pkey" PRIMARY KEY ("id")
);

-- RegionalConfigOverride

CREATE TABLE "RegionalConfigOverride" (
    "id" TEXT NOT NULL,
    "scopeType" "PortalScopeType" NOT NULL,
    "inheritanceMode" "ConfigInheritanceMode" NOT NULL,
    "marketProfileId" TEXT NOT NULL,
    "regionalConfigId" TEXT,
    "tenantId" TEXT,
    "brandId" TEXT,
    "storeId" TEXT,
    "localeOverride" JSONB,
    "timezoneOverride" JSONB,
    "currencyOverride" JSONB,
    "taxOverride" JSONB,
    "networkOverride" JSONB,
    "emailOverride" JSONB,
    "socialOverride" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RegionalConfigOverride_pkey" PRIMARY KEY ("id")
);

-- PortalSite

CREATE TABLE "PortalSite" (
    "id" TEXT NOT NULL,
    "scopeType" "PortalScopeType" NOT NULL,
    "audience" "PortalAudience" NOT NULL,
    "channel" "PortalChannel" NOT NULL,
    "tenantId" TEXT,
    "brandId" TEXT,
    "storeId" TEXT,
    "marketProfileId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "domain" TEXT,
    "pathPrefix" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "loginPath" TEXT,
    "ssoEnabled" BOOLEAN NOT NULL DEFAULT false,
    "heroTitle" TEXT,
    "heroSubtitle" TEXT,
    "solutionTags" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PortalSite_pkey" PRIMARY KEY ("id")
);

-- EmailChannelConfig

CREATE TABLE "EmailChannelConfig" (
    "id" TEXT NOT NULL,
    "marketProfileId" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "fromName" TEXT NOT NULL,
    "fromAddress" TEXT NOT NULL,
    "replyTo" TEXT,
    "purpose" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EmailChannelConfig_pkey" PRIMARY KEY ("id")
);

-- SocialChannelConfig

CREATE TABLE "SocialChannelConfig" (
    "id" TEXT NOT NULL,
    "marketProfileId" TEXT NOT NULL,
    "platform" TEXT NOT NULL,
    "handle" TEXT,
    "profileUrl" TEXT,
    "usage" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SocialChannelConfig_pkey" PRIMARY KEY ("id")
);

-- TaxPolicyConfig

CREATE TABLE "TaxPolicyConfig" (
    "id" TEXT NOT NULL,
    "marketProfileId" TEXT NOT NULL,
    "taxMode" TEXT NOT NULL,
    "taxLabel" TEXT NOT NULL,
    "taxRate" DECIMAL(5,2),
    "invoiceProvider" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TaxPolicyConfig_pkey" PRIMARY KEY ("id")
);

-- Phase B foreign keys

ALTER TABLE "RegionalConfig" ADD CONSTRAINT "RegionalConfig_marketProfileId_fkey" FOREIGN KEY ("marketProfileId") REFERENCES "MarketProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "RegionalConfigOverride" ADD CONSTRAINT "RegionalConfigOverride_marketProfileId_fkey" FOREIGN KEY ("marketProfileId") REFERENCES "MarketProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "RegionalConfigOverride" ADD CONSTRAINT "RegionalConfigOverride_regionalConfigId_fkey" FOREIGN KEY ("regionalConfigId") REFERENCES "RegionalConfig"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "RegionalConfigOverride" ADD CONSTRAINT "RegionalConfigOverride_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "RegionalConfigOverride" ADD CONSTRAINT "RegionalConfigOverride_brandId_fkey" FOREIGN KEY ("brandId") REFERENCES "Brand"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "RegionalConfigOverride" ADD CONSTRAINT "RegionalConfigOverride_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "Store"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "PortalSite" ADD CONSTRAINT "PortalSite_marketProfileId_fkey" FOREIGN KEY ("marketProfileId") REFERENCES "MarketProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "PortalSite" ADD CONSTRAINT "PortalSite_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "PortalSite" ADD CONSTRAINT "PortalSite_brandId_fkey" FOREIGN KEY ("brandId") REFERENCES "Brand"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "PortalSite" ADD CONSTRAINT "PortalSite_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "Store"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "EmailChannelConfig" ADD CONSTRAINT "EmailChannelConfig_marketProfileId_fkey" FOREIGN KEY ("marketProfileId") REFERENCES "MarketProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "SocialChannelConfig" ADD CONSTRAINT "SocialChannelConfig_marketProfileId_fkey" FOREIGN KEY ("marketProfileId") REFERENCES "MarketProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "TaxPolicyConfig" ADD CONSTRAINT "TaxPolicyConfig_marketProfileId_fkey" FOREIGN KEY ("marketProfileId") REFERENCES "MarketProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
