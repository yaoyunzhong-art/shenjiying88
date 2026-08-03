-- Phase D

-- Operations, audit, and mapped business activity tables

-- MemberOperationsTask

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

CREATE UNIQUE INDEX "MemberOperationsTask_dedupeKey_key" ON "MemberOperationsTask"("dedupeKey");
CREATE INDEX "MemberOperationsTask_tenantId_memberId_createdAt_idx" ON "MemberOperationsTask"("tenantId", "memberId", "createdAt");
CREATE INDEX "MemberOperationsTask_tenantId_sourceOrderId_idx" ON "MemberOperationsTask"("tenantId", "sourceOrderId");

-- MemberOperationsExecutionReceipt

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

CREATE INDEX "MemberOperationsExecutionReceipt_tenantId_memberId_executed_idx" ON "MemberOperationsExecutionReceipt"("tenantId", "memberId", "executedAt");
CREATE INDEX "MemberOperationsExecutionReceipt_tenantId_taskId_idx" ON "MemberOperationsExecutionReceipt"("tenantId", "taskId");
CREATE INDEX "MemberOperationsExecutionReceipt_runtimeReceiptCode_idx" ON "MemberOperationsExecutionReceipt"("runtimeReceiptCode");

-- AuditLog

CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "brandId" TEXT,
    "storeId" TEXT,
    "scopeType" "FoundationScopeType" NOT NULL DEFAULT 'TENANT',
    "action" TEXT NOT NULL,
    "operatorId" TEXT NOT NULL,
    "operatorType" "IdentitySubjectType" NOT NULL DEFAULT 'TENANT_USER',
    "resourceType" TEXT,
    "resourceId" TEXT,
    "sourceChannel" TEXT,
    "requestId" TEXT,
    "ipAddress" TEXT,
    "purpose" TEXT,
    "payload" JSONB,
    "beforeValue" JSONB,
    "afterValue" JSONB,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "AuditLog_tenantId_createdAt_idx" ON "AuditLog"("tenantId", "createdAt");
CREATE INDEX "AuditLog_tenantId_action_createdAt_idx" ON "AuditLog"("tenantId", "action", "createdAt");

-- LytConnection

CREATE TABLE "LytConnection" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "storeId" TEXT NOT NULL,
    "endpoint" TEXT NOT NULL,
    "authMode" TEXT NOT NULL,
    "credential" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LytConnection_pkey" PRIMARY KEY ("id")
);

-- marketing_push_decision_log

CREATE TABLE "marketing_push_decision_log" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "member_id" TEXT,
    "push_type" TEXT NOT NULL,
    "channel" TEXT,
    "content" TEXT,
    "decision" TEXT NOT NULL,
    "reason" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "sent_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "marketing_push_decision_log_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "marketing_push_decision_log_tenant_id_push_type_created_at_idx" ON "marketing_push_decision_log"("tenant_id", "push_type", "created_at");
CREATE INDEX "marketing_push_decision_log_tenant_id_member_id_created_at_idx" ON "marketing_push_decision_log"("tenant_id", "member_id", "created_at");
CREATE INDEX "marketing_push_decision_log_tenant_id_decision_status_idx" ON "marketing_push_decision_log"("tenant_id", "decision", "status");

-- inspection_task

CREATE TABLE "inspection_task" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "storeId" TEXT,
    "equipmentId" TEXT NOT NULL,
    "equipmentName" TEXT NOT NULL,
    "assigneeId" TEXT NOT NULL,
    "assigneeName" TEXT NOT NULL,
    "scheduledAt" TIMESTAMP(3) NOT NULL,
    "remindedAt" TIMESTAMP(3),
    "result" TEXT,
    "note" TEXT,
    "inspectorId" TEXT,
    "inspectorName" TEXT,
    "status" TEXT NOT NULL DEFAULT 'scheduled',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "inspection_task_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "inspection_task_tenantId_status_idx" ON "inspection_task"("tenantId", "status");
CREATE INDEX "inspection_task_tenantId_scheduledAt_idx" ON "inspection_task"("tenantId", "scheduledAt");
