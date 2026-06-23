import {
  type ObservabilitySignalContract,
  type ObservabilityStatus,
  type ObservabilitySignalType,
  type RecoveryPlanContract,
  type RecoveryPlanStatus,
  type ResilienceOverview,
  type RetryPolicyContract,
  buildResilienceHref
} from '@m5/types';
import { ApiClient, getDefaultApiBaseUrl } from '@m5/sdk';

export interface ResilienceSnapshotDelivery {
  deliveryMode: 'api' | 'fallback';
  generatedAt: string;
  overview: ResilienceOverview;
}

const FALLBACK_TENANT_ID = 'tenant-demo';

function createClient(): ApiClient {
  return new ApiClient({
    baseUrl: getDefaultApiBaseUrl(),
    tenantId: FALLBACK_TENANT_ID,
    brandId: 'brand-demo',
    storeId: 'store-001',
    marketCode: 'cn-mainland'
  });
}

function emptyOverview(): ResilienceOverview {
  return {
    generatedAt: new Date().toISOString(),
    observability: {
      totalSignals: 0,
      degradedSignals: 0,
      byStatus: {},
      averageCoverage: 0,
      maxCollectionLagSeconds: 0,
      signals: []
    },
    retries: {
      totalPolicies: 0,
      byCapability: {},
      maxAttempts: 0,
      policies: []
    },
    recovery: {
      totalPlans: 0,
      attentionRequired: 0,
      staleDrills: 0,
      plans: []
    }
  };
}

export async function loadResilienceOperationsSnapshot(
  init: RequestInit = {}
): Promise<ResilienceSnapshotDelivery> {
  const client = createClient();
  try {
    const overview = await client.getResilienceOperationsOverview(init);
    return {
      deliveryMode: 'api',
      generatedAt: overview.generatedAt,
      overview
    };
  } catch {
    return {
      deliveryMode: 'fallback',
      generatedAt: new Date().toISOString(),
      overview: emptyOverview()
    };
  }
}

export const SIGNAL_TYPE_LABEL: Record<ObservabilitySignalType, string> = {
  metrics: '指标',
  logs: '日志',
  traces: '链路追踪'
};

export const SIGNAL_STATUS_LABEL: Record<ObservabilityStatus, string> = {
  healthy: '健康',
  warning: '告警',
  critical: '故障'
};

export const SIGNAL_STATUS_VARIANT: Record<ObservabilityStatus, 'success' | 'warning' | 'danger'> = {
  healthy: 'success',
  warning: 'warning',
  critical: 'danger'
};

export const RECOVERY_PLAN_STATUS_LABEL: Record<RecoveryPlanStatus, string> = {
  ready: '就绪',
  attention: '需关注'
};

export const RECOVERY_PLAN_STATUS_VARIANT: Record<RecoveryPlanStatus, 'success' | 'warning'> = {
  ready: 'success',
  attention: 'warning'
};

export function summarizeSignal(signal: ObservabilitySignalContract): string {
  return `${signal.signal} · 覆盖率 ${signal.coverage}% · 采集滞后 ${signal.collectionLagSeconds}s · Owner ${signal.owner}`;
}

export function summarizeRetryPolicy(policy: RetryPolicyContract): string {
  return `${policy.capability} · ${policy.maxAttempts} 次 · ${policy.backoff} · 升级 ${policy.escalationTarget}`;
}

export function summarizeRecoveryPlan(plan: RecoveryPlanContract): string {
  return `${plan.resource} · RTO ${plan.rtoMinutes}m · RPO ${plan.rpoMinutes}m · 依赖 ${plan.dependencies.length} 项`;
}

export function isDrillStale(plan: RecoveryPlanContract, now: number = Date.now()): boolean {
  const drillMs = Date.parse(plan.lastDrillAt);
  if (!Number.isFinite(drillMs)) {
    return true;
  }
  return drillMs + plan.staleAfterDays * 24 * 60 * 60 * 1000 < now;
}

export { buildResilienceHref };
