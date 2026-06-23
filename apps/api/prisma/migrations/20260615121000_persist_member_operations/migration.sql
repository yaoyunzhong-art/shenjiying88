-- CreateTable
CREATE TABLE "MemberOperationsTask" (
    "taskId" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "brandId" TEXT,
    "storeId" TEXT,
    "marketCode" TEXT,
    "memberId" TEXT NOT NULL,
    "actionCode" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "channel" TEXT NOT NULL,
    "priority" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "executionLane" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "sourceOrderId" TEXT,
    "sourcePaymentId" TEXT,
    "executionSummary" TEXT,
    "executionTargetId" TEXT,
    "executedAt" TIMESTAMP(3),
    "dedupeKey" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL,
    "scheduledAt" TIMESTAMP(3) NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MemberOperationsTask_pkey" PRIMARY KEY ("taskId")
);

-- CreateTable
CREATE TABLE "MemberOperationsExecutionReceipt" (
    "executionId" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "brandId" TEXT,
    "storeId" TEXT,
    "marketCode" TEXT,
    "memberId" TEXT NOT NULL,
    "taskId" TEXT NOT NULL,
    "actionCode" TEXT NOT NULL,
    "targetType" TEXT NOT NULL,
    "targetId" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "runtimeReceiptCode" TEXT,
    "runtimeState" TEXT,
    "runtimeReplayable" BOOLEAN,
    "executedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MemberOperationsExecutionReceipt_pkey" PRIMARY KEY ("executionId")
);

-- CreateIndex
CREATE UNIQUE INDEX "MemberOperationsTask_dedupeKey_key"
ON "MemberOperationsTask"("dedupeKey");

-- CreateIndex
CREATE INDEX "MemberOperationsTask_tenantId_memberId_createdAt_idx"
ON "MemberOperationsTask"("tenantId", "memberId", "createdAt");

-- CreateIndex
CREATE INDEX "MemberOperationsTask_tenantId_sourceOrderId_idx"
ON "MemberOperationsTask"("tenantId", "sourceOrderId");

-- CreateIndex
CREATE INDEX "MemberOperationsExecutionReceipt_tenantId_memberId_executedAt_idx"
ON "MemberOperationsExecutionReceipt"("tenantId", "memberId", "executedAt");

-- CreateIndex
CREATE INDEX "MemberOperationsExecutionReceipt_tenantId_taskId_idx"
ON "MemberOperationsExecutionReceipt"("tenantId", "taskId");

-- CreateIndex
CREATE INDEX "MemberOperationsExecutionReceipt_runtimeReceiptCode_idx"
ON "MemberOperationsExecutionReceipt"("runtimeReceiptCode");
