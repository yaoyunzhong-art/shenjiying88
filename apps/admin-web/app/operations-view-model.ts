import { ApiClient, getDefaultApiBaseUrl } from '@m5/sdk';
import type {
  RuntimeGovernanceOperationsBatchSummary,
  RuntimeGovernanceOperationsOverview,
  RuntimeGovernanceOverviewFilter,
  RuntimeGovernanceReceipt,
} from '@m5/types';
import type {
  RuntimeOperationReceiptRecord,
  RuntimeOperationRecord,
} from '@m5/ui';
import {
  createRuntimeOperationMockRecords,
  runtimeOperationDetailDemoPresets,
} from '@m5/ui';
import { adminRuntimeOperationsPreset } from './operations-data';
import {
  buildAdminRuntimeBatchReplayRequest,
  canReplayAdminRuntimeReceipt,
} from './runtime-governance';

export interface FoundationRuntimeGovernanceOverview {
  summary?: RuntimeGovernanceOperationsOverview['summary'];
  totalSummary?: RuntimeGovernanceOperationsOverview['totalSummary'];
  batchSummary?: RuntimeGovernanceOperationsBatchSummary;
  appliedFilter?: RuntimeGovernanceOperationsOverview['appliedFilter'];
  receipts?: RuntimeGovernanceReceipt[];
  stalledReceipts?: RuntimeGovernanceOperationsOverview['stalledReceipts'];
}

export interface FoundationOverviewWithRuntimeModule {
  generatedAt: string;
  summary: {
    runtimeGovernanceBacklog: number;
    stalledRuntimeCallbacks: number;
    highRiskRuntimeBacklog: number;
    runtimeBlockedActions: number;
  };
  modules?: {
    runtimeGovernance?: FoundationRuntimeGovernanceOverview;
  };
}

export interface AdminRuntimeOperationsSnapshot {
  deliveryMode: 'api' | 'fallback';
  generatedAt: string;
  operations: RuntimeOperationRecord[];
  receipts: RuntimeGovernanceReceipt[];
  stalledReceipts: Array<{
    receiptCode: string;
    escalationAction: string;
    summary: string;
  }>;
  batchSummary: RuntimeGovernanceOperationsBatchSummary;
  summary: {
    backlog: number;
    stalledCallbacks: number;
    highRiskBacklog: number;
    blockedActions: number;
  };
}

export type AdminRuntimeOperationsFocus = 'all' | 'batch-replay' | 'governance-audit';

export interface AdminRuntimeOperationDetailSnapshot {
  deliveryMode: 'api' | 'fallback';
  operation: RuntimeOperationRecord | null;
  receipts: RuntimeOperationReceiptRecord[];
  memberOperationsContext: MemberOperationsRuntimeContext | null;
}

export interface MemberOperationsRuntimeContext {
  memberId: string;
  executionId: string;
  taskId?: string;
  actionCode?: string;
  executionLane?: string;
  targetType?: string;
  targetId?: string;
  sourceOrderId?: string;
  sourcePaymentId?: string;
}

function createAdminRuntimeClient() {
  return new ApiClient({
    baseUrl: getDefaultApiBaseUrl(),
    tenantId: 'tenant-demo',
    brandId: 'brand-demo',
    storeId: 'store-001',
    marketCode: 'cn-mainland',
  });
}

function getFallbackOperations() {
  return createRuntimeOperationMockRecords({
    count: 24,
    idPrefix: 'admin-runtime',
    typeOrder: adminRuntimeOperationsPreset.typeOrder,
    statusOrder: adminRuntimeOperationsPreset.statusOrder,
    targetPrefix: 'runtime-scope',
  });
}

const fallbackLinkedRuntimeOperationDetail = {
  operation: {
    id: 'ADMIN-RUNTIME-001',
    type: 'runtime-replay',
    targetId: 'member-001 · assign-vip-concierge',
    status: 'running',
    createdAt: '2026-06-15T10:00:00.000Z',
    finishedAt: undefined,
  } satisfies RuntimeOperationRecord,
  receipts: [
    {
      code: 'member-operations-context',
      message:
        '会员 member-001 / 执行回执 ops-exec-001 / 动作 assign-vip-concierge / 目标 crm-follow-up:crm-001 / 订单 order-001 / 支付 payment-001',
      status: 'ok',
      timestamp: '2026-06-15T10:00:00.000Z',
    },
    {
      code: 'runtime-governance.action.submitted',
      message: '高风险 replay 已提交治理运行时',
      status: 'ok',
      timestamp: '2026-06-15T10:00:00.000Z',
    },
    {
      code: 'runtime-governance.approval.pending',
      message: '当前 replay 需要审批放行后继续执行',
      status: 'ok',
      timestamp: '2026-06-15T10:00:05.000Z',
    },
  ] satisfies RuntimeOperationReceiptRecord[],
  memberOperationsContext: {
    memberId: 'member-001',
    executionId: 'ops-exec-001',
    taskId: 'ops-task-001',
    actionCode: 'assign-vip-concierge',
    executionLane: 'member-crm',
    targetType: 'crm-follow-up',
    targetId: 'crm-001',
    sourceOrderId: 'order-001',
    sourcePaymentId: 'payment-001',
  } satisfies MemberOperationsRuntimeContext,
};

function mapRuntimeStateToStatus(receipt: RuntimeGovernanceReceipt): RuntimeOperationRecord['status'] {
  if (receipt.state === 'callback-recorded') {
    return 'completed';
  }

  if (receipt.state === 'blocked') {
    return 'failed';
  }

  if (receipt.state === 'replay-scheduled') {
    return 'running';
  }

  if (receipt.state === 'challenge-issued') {
    return 'pending';
  }

  if (receipt.callback.callbackStatus === 'callback-recorded') {
    return 'completed';
  }

  if (receipt.callback.callbackStatus === 'callback-blocked') {
    return 'failed';
  }

  return receipt.sync.ready ? 'running' : 'pending';
}

function findFinishedAt(receipt: RuntimeGovernanceReceipt): string | undefined {
  if (receipt.state !== 'callback-recorded' && receipt.callback.callbackStatus !== 'callback-recorded') {
    return undefined;
  }

  const latestAcceptedEvent = [...receipt.events]
    .reverse()
    .find((event) => event.status === 'accepted');

  return latestAcceptedEvent?.occurredAt ?? receipt.generatedAt;
}

function extractMemberOperationsRuntimeContext(
  receipt: RuntimeGovernanceReceipt
): MemberOperationsRuntimeContext | null {
  const requestMatch = receipt.requestEndpoint.match(
    /\/members\/persistent\/([^/]+)\/operations-receipts\/([^/]+)\/runtime$/
  );
  if (!requestMatch) {
    return null;
  }

  const payload = parseRuntimePayloadSummary(receipt.payloadSummary);

  return {
    memberId: requestMatch[1] ?? '',
    executionId: requestMatch[2] ?? '',
    taskId: typeof payload?.taskId === 'string' ? payload.taskId : undefined,
    actionCode: typeof payload?.actionCode === 'string' ? payload.actionCode : undefined,
    executionLane: typeof payload?.executionLane === 'string' ? payload.executionLane : undefined,
    targetType: typeof payload?.targetType === 'string' ? payload.targetType : undefined,
    targetId: typeof payload?.targetId === 'string' ? payload.targetId : undefined,
    sourceOrderId: typeof payload?.sourceOrderId === 'string' ? payload.sourceOrderId : undefined,
    sourcePaymentId: typeof payload?.sourcePaymentId === 'string' ? payload.sourcePaymentId : undefined,
  };
}

function parseRuntimePayloadSummary(payloadSummary: string): Record<string, unknown> | undefined {
  try {
    const parsed = JSON.parse(payloadSummary);
    return parsed && typeof parsed === 'object' ? (parsed as Record<string, unknown>) : undefined;
  } catch {
    return undefined;
  }
}

function buildTargetId(receipt: RuntimeGovernanceReceipt): string {
  const memberOperationsContext = extractMemberOperationsRuntimeContext(receipt);
  if (memberOperationsContext) {
    const semanticTail =
      memberOperationsContext.actionCode ??
      memberOperationsContext.targetType ??
      memberOperationsContext.executionLane ??
      'member-operations';
    return `${memberOperationsContext.memberId} · ${semanticTail}`;
  }
  const scopeKey = receipt.rateLimit.scopeKey;
  const scopeTail = typeof scopeKey === 'string' ? scopeKey.split(':').slice(-1)[0] : null;
  return scopeTail ?? receipt.sync.handlerName;
}

export function buildRuntimeOperationFromReceipt(receipt: RuntimeGovernanceReceipt): RuntimeOperationRecord {
  return {
    id: receipt.receiptCode,
    type: receipt.action,
    targetId: buildTargetId(receipt),
    status: mapRuntimeStateToStatus(receipt),
    createdAt: receipt.generatedAt,
    finishedAt: findFinishedAt(receipt),
  };
}

export function buildRuntimeOperationReceipts(
  receipt: RuntimeGovernanceReceipt
): RuntimeOperationReceiptRecord[] {
  const memberOperationsContext = extractMemberOperationsRuntimeContext(receipt);
  const eventReceipts = receipt.events.map((event) => ({
    code: event.eventType,
    message: event.summary,
    status: event.status === 'duplicate' ? 'error' : 'ok',
    timestamp: event.occurredAt,
  }));

  const callbackReceipt: RuntimeOperationReceiptRecord = {
    code: receipt.callback.lastEvent,
    message: receipt.callback.summary,
    status: receipt.callback.callbackStatus === 'callback-blocked' ? 'error' : 'ok',
    timestamp: findFinishedAt(receipt) ?? receipt.generatedAt,
  };

  const memberContextReceipt = memberOperationsContext
    ? [
        {
          code: 'member-operations-context',
          message: [
            `会员 ${memberOperationsContext.memberId}`,
            `执行回执 ${memberOperationsContext.executionId}`,
            memberOperationsContext.actionCode ? `动作 ${memberOperationsContext.actionCode}` : null,
            memberOperationsContext.targetType && memberOperationsContext.targetId
              ? `目标 ${memberOperationsContext.targetType}:${memberOperationsContext.targetId}`
              : null,
            memberOperationsContext.sourceOrderId ? `订单 ${memberOperationsContext.sourceOrderId}` : null,
            memberOperationsContext.sourcePaymentId ? `支付 ${memberOperationsContext.sourcePaymentId}` : null,
          ]
            .filter((value): value is string => Boolean(value))
            .join(' / '),
          status: 'ok',
          timestamp: receipt.generatedAt,
        } satisfies RuntimeOperationReceiptRecord,
      ]
    : [];

  return [...memberContextReceipt, ...eventReceipts, callbackReceipt];
}

function mapFocusToRuntimeFilter(focus: AdminRuntimeOperationsFocus): RuntimeGovernanceOverviewFilter | undefined {
  if (focus === 'all') {
    return undefined;
  }
  if (focus === 'batch-replay') {
    return {
      focus,
      replayable: true,
    };
  }
  return {
    focus,
  };
}

export async function loadAdminRuntimeOperations(
  focus: AdminRuntimeOperationsFocus = 'all'
): Promise<AdminRuntimeOperationsSnapshot> {
  try {
    const overview = await createAdminRuntimeClient().getFoundationOverview(
      {
        cache: 'no-store',
      },
      mapFocusToRuntimeFilter(focus)
    ) as FoundationOverviewWithRuntimeModule;

    const runtimeOverview = overview.modules?.runtimeGovernance;
    const receipts = runtimeOverview?.receipts ?? [];

    return {
      deliveryMode: 'api',
      generatedAt: overview.generatedAt,
      operations: receipts.map(buildRuntimeOperationFromReceipt),
      receipts,
      stalledReceipts: runtimeOverview?.stalledReceipts ?? [],
      batchSummary: runtimeOverview?.batchSummary ?? {
        filteredReceipts: receipts.length,
        replayableReceipts: receipts.filter((receipt) => receipt.ledger.replayable).length,
        governanceAuditReceipts: receipts.length,
        stalledReceipts: runtimeOverview?.stalledReceipts?.length ?? 0,
        blockedReceipts: receipts.filter((receipt) => receipt.state === 'blocked' || receipt.state === 'challenge-issued').length,
        highRiskReceipts: receipts.filter((receipt) => receipt.riskLevel === 'high').length,
      },
      summary: {
        backlog: Number(runtimeOverview?.summary?.backlog ?? overview.summary.runtimeGovernanceBacklog ?? 0),
        stalledCallbacks: Number(
          runtimeOverview?.summary?.stalledCallbacks ?? overview.summary.stalledRuntimeCallbacks ?? 0
        ),
        highRiskBacklog: Number(
          runtimeOverview?.summary?.highRiskBacklog ?? overview.summary.highRiskRuntimeBacklog ?? 0
        ),
        blockedActions: Number(
          runtimeOverview?.summary?.blockedActions ?? overview.summary.runtimeBlockedActions ?? 0
        ),
      },
    };
  } catch {
    return {
      deliveryMode: 'fallback',
      generatedAt: new Date().toISOString(),
      operations: getFallbackOperations(),
      receipts: [],
      stalledReceipts: [],
      batchSummary: {
        filteredReceipts: 0,
        replayableReceipts: 0,
        governanceAuditReceipts: 0,
        stalledReceipts: 0,
        blockedReceipts: 0,
        highRiskReceipts: 0,
      },
      summary: {
        backlog: 0,
        stalledCallbacks: 0,
        highRiskBacklog: 0,
        blockedActions: 0,
      },
    };
  }
}

export function getReplayableAdminRuntimeReceipts(
  snapshot: Pick<AdminRuntimeOperationsSnapshot, 'receipts'>
): RuntimeGovernanceReceipt[] {
  return snapshot.receipts.filter((receipt) => canReplayAdminRuntimeReceipt(receipt));
}

export function getGovernanceAuditAdminRuntimeReceipts(
  snapshot: Pick<AdminRuntimeOperationsSnapshot, 'receipts' | 'stalledReceipts'>
): RuntimeGovernanceReceipt[] {
  const stalledReceiptCodes = new Set(snapshot.stalledReceipts.map((item) => item.receiptCode));
  return snapshot.receipts.filter((receipt) => {
    if (stalledReceiptCodes.has(receipt.receiptCode)) {
      return true;
    }
    if (receipt.riskLevel === 'high') {
      return true;
    }
    if (receipt.state === 'blocked' || receipt.state === 'challenge-issued') {
      return true;
    }
    return receipt.callback.callbackStatus === 'callback-blocked';
  });
}

export function filterAdminRuntimeOperationsByFocus(
  snapshot: AdminRuntimeOperationsSnapshot,
  focus: AdminRuntimeOperationsFocus
): RuntimeOperationRecord[] {
  if (focus === 'all') {
    return snapshot.operations;
  }

  const targetReceipts =
    focus === 'batch-replay'
      ? getReplayableAdminRuntimeReceipts(snapshot)
      : getGovernanceAuditAdminRuntimeReceipts(snapshot);
  const targetIds = new Set(targetReceipts.map((receipt) => receipt.receiptCode));
  return snapshot.operations.filter((operation) => targetIds.has(operation.id));
}

export async function batchReplayAdminRuntimeReceipts(receipts: RuntimeGovernanceReceipt[]) {
  if (receipts.length === 0) {
    return {
      generatedAt: new Date().toISOString(),
      total: 0,
      items: []
    };
  }

  return createAdminRuntimeClient().batchReplayRuntimeGovernanceActions(
    buildAdminRuntimeBatchReplayRequest(receipts, `${Date.now()}`),
    { cache: 'no-store' }
  );
}

export async function loadAdminRuntimeOperationDetail(
  operationId: string
): Promise<AdminRuntimeOperationDetailSnapshot> {
  try {
    const receipt = await createAdminRuntimeClient().getRuntimeGovernanceReceipt(operationId, {
      cache: 'no-store',
    });

    return {
      deliveryMode: 'api',
      operation: buildRuntimeOperationFromReceipt(receipt),
      receipts: buildRuntimeOperationReceipts(receipt),
      memberOperationsContext: extractMemberOperationsRuntimeContext(receipt),
    };
  } catch {
    const fallback = runtimeOperationDetailDemoPresets.admin[operationId];
    return {
      deliveryMode: 'fallback',
      operation:
        operationId === fallbackLinkedRuntimeOperationDetail.operation.id
          ? fallbackLinkedRuntimeOperationDetail.operation
          : fallback?.op ?? null,
      receipts:
        operationId === fallbackLinkedRuntimeOperationDetail.operation.id
          ? fallbackLinkedRuntimeOperationDetail.receipts
          : fallback?.receipts ?? [],
      memberOperationsContext:
        operationId === fallbackLinkedRuntimeOperationDetail.operation.id
          ? fallbackLinkedRuntimeOperationDetail.memberOperationsContext
          : null,
    };
  }
}
