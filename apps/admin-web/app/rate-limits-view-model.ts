import {
  type QuotaLedgerRecord,
  type RateLimitPeriod,
  type RateLimitPolicyRecord,
  type RateLimitScopeType,
  type RateLimitWorkspace,
  type RateLimitWorkspaceQuery,
  buildRateLimitsHref
} from '@m5/types';
import { ApiClient, buildActorHeaders, getDefaultApiBaseUrl } from '@m5/sdk';

export interface RateLimitSnapshotDelivery {
  deliveryMode: 'api' | 'fallback';
  generatedAt: string;
  query: RateLimitWorkspaceQuery;
  workspace: RateLimitWorkspace;
}

const FALLBACK_TENANT_ID = 'tenant-demo';
const RATE_LIMIT_WORKSPACE_ACTOR = {
  actorId: 'admin-rate-limit-workspace',
  actorType: 'employee-user',
  actorName: 'Admin Rate Limit Workspace',
  roles: ['TENANT_ADMIN', 'OPERATIONS'],
  permissions: ['foundation.governance.read'],
  authenticated: true
} as const;

function createClient(): ApiClient {
  return new ApiClient({
    baseUrl: getDefaultApiBaseUrl(),
    tenantId: FALLBACK_TENANT_ID,
    brandId: 'brand-demo',
    storeId: 'store-001',
    marketCode: 'cn-mainland',
    headers: buildActorHeaders({
      ...RATE_LIMIT_WORKSPACE_ACTOR,
      tenantId: FALLBACK_TENANT_ID,
      brandId: 'brand-demo',
      storeId: 'store-001'
    })
  });
}

function emptyWorkspace(): RateLimitWorkspace {
  return {
    generatedAt: new Date().toISOString(),
    totals: {
      policies: 0,
      activePolicies: 0,
      ledgers: 0,
      blockedLedgers: 0,
      highConsumptionLedgers: 0
    },
    policies: [],
    ledgers: [],
    byPeriod: {},
    byScope: {}
  };
}

export async function loadRateLimitWorkspace(
  query: RateLimitWorkspaceQuery = {},
  init: RequestInit = {}
): Promise<RateLimitSnapshotDelivery> {
  const normalized: RateLimitWorkspaceQuery = {
    tenantId: query.tenantId ?? FALLBACK_TENANT_ID,
    policyCode: query.policyCode,
    subjectKey: query.subjectKey,
    status: query.status
  };
  const client = createClient();
  try {
    const workspace = await client.getRateLimitWorkspace(normalized, init);
    return {
      deliveryMode: 'api',
      generatedAt: workspace.generatedAt,
      query: normalized,
      workspace
    };
  } catch {
    return {
      deliveryMode: 'fallback',
      generatedAt: new Date().toISOString(),
      query: normalized,
      workspace: emptyWorkspace()
    };
  }
}

export const RATE_LIMIT_PERIOD_LABEL: Record<string, string> = {
  MINUTE: '分钟',
  HOUR: '小时',
  DAY: '日',
  WEEK: '周',
  MONTH: '月'
};

export const RATE_LIMIT_SCOPE_LABEL: Record<string, string> = {
  PLATFORM: '平台',
  TENANT: '租户',
  BRAND: '品牌',
  STORE: '门店',
  INTEGRATION: '集成'
};

export const RATE_LIMIT_ALGORITHM_LABEL: Record<string, string> = {
  FIXED_WINDOW: '固定窗口',
  SLIDING_WINDOW: '滑动窗口',
  TOKEN_BUCKET: '令牌桶'
};

export function isPolicyActive(policy: RateLimitPolicyRecord): boolean {
  return (policy.limit ?? 0) > 0;
}

export function isLedgerBlocked(ledger: QuotaLedgerRecord, now: number = Date.now()): boolean {
  const blockedUntilRaw = ledger.metadata?.blockedUntil;
  if (typeof blockedUntilRaw === 'string') {
    const blockedUntil = Date.parse(blockedUntilRaw);
    if (Number.isFinite(blockedUntil) && blockedUntil > now) {
      return true;
    }
  }
  return false;
}

export function ledgerConsumptionRatio(ledger: QuotaLedgerRecord): number {
  const limit = ledger.policy.limit;
  if (!limit || limit <= 0) {
    return 0;
  }
  return Math.min(1, ledger.consumed / limit);
}

export function summarizePolicy(policy: RateLimitPolicyRecord): string {
  const tenant = policy.tenantId ? ` · 租户 ${policy.tenantId}` : '';
  const algorithm = policy.algorithm ? ` · ${RATE_LIMIT_ALGORITHM_LABEL[policy.algorithm] ?? policy.algorithm}` : '';
  return `${policy.code} · ${RATE_LIMIT_SCOPE_LABEL[policy.scopeType as string] ?? policy.scopeType}${tenant} · ${policy.limit} / ${RATE_LIMIT_PERIOD_LABEL[policy.period as string] ?? policy.period}${algorithm}`;
}

export function summarizeLedger(ledger: QuotaLedgerRecord): string {
  const blocked = isLedgerBlocked(ledger) ? ' · 已封禁' : '';
  return `${ledger.policy.code} · 主题 ${ledger.subjectKey} · 已用 ${ledger.consumed} / ${ledger.policy.limit}${blocked}`;
}

export type { RateLimitPeriod, RateLimitScopeType };
export { buildRateLimitsHref };
