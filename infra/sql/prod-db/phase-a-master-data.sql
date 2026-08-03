-- Phase A

-- Market, tenant, brand, store, and user master data

-- MarketProfile

CREATE TABLE "MarketProfile" (
    "id" TEXT NOT NULL,
    "marketCode" TEXT NOT NULL,
    "marketName" TEXT NOT NULL,
    "countryCode" TEXT NOT NULL,
    "defaultLanguage" TEXT NOT NULL,
    "supportedLanguages" TEXT[],
    "timezone" TEXT NOT NULL,
    "currencyCode" TEXT NOT NULL,
    "currencySymbol" TEXT NOT NULL,
    "taxMode" TEXT NOT NULL,
    "taxLabel" TEXT NOT NULL,
    "taxRate" DECIMAL(5,2),
    "networkRegion" TEXT NOT NULL,
    "apiBaseUrl" TEXT NOT NULL,
    "cdnBaseUrl" TEXT NOT NULL,
    "callbackBaseUrl" TEXT,
    "emailProvider" TEXT NOT NULL,
    "emailFromName" TEXT NOT NULL,
    "emailFromAddress" TEXT NOT NULL,
    "emailReplyTo" TEXT,
    "socialDefaults" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MarketProfile_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "MarketProfile_marketCode_key" ON "MarketProfile"("marketCode");

-- Tenant

CREATE TABLE "Tenant" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "defaultMarketProfileId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Tenant_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Tenant_code_key" ON "Tenant"("code");

-- Brand

CREATE TABLE "Brand" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "defaultMarketProfileId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Brand_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Brand_tenantId_code_key" ON "Brand"("tenantId", "code");

-- Store

CREATE TABLE "Store" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "brandId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "defaultMarketProfileId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Store_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Store_brandId_code_key" ON "Store"("brandId", "code");

-- User

CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "mobile" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "User_mobile_key" ON "User"("mobile");

-- Phase A foreign keys

ALTER TABLE "Tenant" ADD CONSTRAINT "Tenant_defaultMarketProfileId_fkey" FOREIGN KEY ("defaultMarketProfileId") REFERENCES "MarketProfile"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Brand" ADD CONSTRAINT "Brand_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Brand" ADD CONSTRAINT "Brand_defaultMarketProfileId_fkey" FOREIGN KEY ("defaultMarketProfileId") REFERENCES "MarketProfile"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Store" ADD CONSTRAINT "Store_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Store" ADD CONSTRAINT "Store_brandId_fkey" FOREIGN KEY ("brandId") REFERENCES "Brand"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Store" ADD CONSTRAINT "Store_defaultMarketProfileId_fkey" FOREIGN KEY ("defaultMarketProfileId") REFERENCES "MarketProfile"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "User" ADD CONSTRAINT "User_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
