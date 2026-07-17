-- CreateTable
CREATE TABLE IF NOT EXISTS "ConfigInstance" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "encrypted" BOOLEAN NOT NULL DEFAULT false,
    "category" TEXT NOT NULL,
    "level" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "inherits" BOOLEAN NOT NULL DEFAULT false,
    "version" INTEGER NOT NULL DEFAULT 1,
    "updatedBy" TEXT NOT NULL,
    "fromSeed" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ConfigInstance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "ConfigAuditLog" (
    "id" TEXT NOT NULL,
    "configId" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "level" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "operator" TEXT NOT NULL,
    "operatorRole" TEXT NOT NULL,
    "previousValue" TEXT,
    "newValue" TEXT,
    "context" JSONB,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ConfigAuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "ConfigInstance_level_ownerId_key_key" ON "ConfigInstance"("level", "ownerId", "key");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "ConfigInstance_level_ownerId_idx" ON "ConfigInstance"("level", "ownerId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "ConfigInstance_key_idx" ON "ConfigInstance"("key");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "ConfigAuditLog_configId_idx" ON "ConfigAuditLog"("configId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "ConfigAuditLog_tenantId_timestamp_idx" ON "ConfigAuditLog"("tenantId", "timestamp");
