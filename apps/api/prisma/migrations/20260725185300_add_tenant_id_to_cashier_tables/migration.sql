-- GO-B2: 跨租户数据隔离 — Cashier核心三表补tenantId
-- 54专家团G2安全+G7租户+G4数据 联合签发

-- Step 1: 添加可空列
ALTER TABLE "cashier_members" ADD COLUMN     "tenantId" TEXT;
ALTER TABLE "cashier_payments" ADD COLUMN     "tenantId" TEXT;
ALTER TABLE "cashier_transactions" ADD COLUMN     "tenantId" TEXT;

-- Step 2: 已有行设默认租户（店A = tenant_001）
UPDATE "cashier_members" SET "tenantId" = 'default' WHERE "tenantId" IS NULL;
UPDATE "cashier_payments" SET "tenantId" = 'default' WHERE "tenantId" IS NULL;
UPDATE "cashier_transactions" SET "tenantId" = 'default' WHERE "tenantId" IS NULL;

-- Step 3: 改为NOT NULL
ALTER TABLE "cashier_members" ALTER COLUMN "tenantId" SET NOT NULL;
ALTER TABLE "cashier_payments" ALTER COLUMN "tenantId" SET NOT NULL;
ALTER TABLE "cashier_transactions" ALTER COLUMN "tenantId" SET NOT NULL;

-- Step 4: 创建索引
CREATE INDEX "cashier_members_tenantId_idx" ON "cashier_members"("tenantId");
CREATE INDEX "cashier_payments_tenantId_idx" ON "cashier_payments"("tenantId");
CREATE INDEX "cashier_transactions_tenantId_idx" ON "cashier_transactions"("tenantId");
