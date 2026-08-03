/**
 * config-inheritance.test.ts — 配置继承链 & 策略评估 纯函数测试
 *
 * 与 domain-deep.test.ts 互补，重点覆盖:
 * - 配置继承链降级逻辑
 * - 访问策略条件评估
 * - 组织层级关系推算
 * - 限流配额计算
 * - 数据掩码/脱敏策略
 *
 * 全纯函数式，不依赖 NestJS DI、不 import 生产模块。
 */

import { describe, it } from 'node:test';
import assert from 'node:assert';

// ========================================================================
// 1. 类型定义（完全 inline）
// ========================================================================

interface FoundationScope {
  scopeType: string;
  scopeId: string;
  tenantId?: string;
  brandId?: string;
  storeId?: string;
}

interface ConfigEntry {
  id: string;
  namespace: string;
  key: string;
  value: unknown;
  scope: FoundationScope;
  version: number;
  tags?: string[];
}

interface AccessPolicy {
  id: string;
  effect: 'ALLOW' | 'DENY';
  subjects: Array<{ subjectType: string; subjectId: string }>;
  actions: string[];
  resources: string[];
  conditions?: PolicyCondition[];
}

interface PolicyCondition {
  field: string;
  operator: 'EQ' | 'NOT_EQ' | 'IN' | 'NOT_IN' | 'GTE' | 'LTE' | 'EXISTS';
  value?: unknown;
}

interface IdentityAccount {
  id: string;
  roleKeys: string[];
  tenantScope?: { tenantId: string; brandId?: string; storeId?: string };
}

interface OrganizationMembership {
  identityId: string;
  organizationNodeId: string;
  isPrimary: boolean;
}

interface QuotaLedger {
  policyId: string;
  subjectKey: string;
  consumed: number;
  remaining: number;
  resetAt: string;
}

interface RateLimitPolicy {
  id: string;
  limit: number;
  burstLimit?: number;
  period: string;
}

interface PiiPolicy {
  fieldName: string;
  piiLevel: 'PUBLIC' | 'INTERNAL' | 'SENSITIVE' | 'RESTRICTED';
  maskingStrategy: string;
}

interface EdgeNode {
  id: string;
  status: 'ONLINE' | 'OFFLINE' | 'DEGRADED' | 'MAINTENANCE';
  capabilities: string[];
  lastSeenAt?: string;
}

// ========================================================================
// 2. Mock 数据工厂
// ========================================================================

function makeScope(overrides?: Partial<FoundationScope>): FoundationScope {
  return { scopeType: 'TENANT', scopeId: 'T001', ...overrides };
}

function makeConfigEntry(overrides?: Partial<ConfigEntry>): ConfigEntry {
  return {
    id: 'cfg-001',
    namespace: 'payment',
    key: 'max_order_amount',
    value: 99999,
    scope: makeScope(),
    version: 1,
    ...overrides,
  };
}

function makePolicy(overrides?: Partial<AccessPolicy>): AccessPolicy {
  return {
    id: 'policy-001',
    effect: 'ALLOW',
    subjects: [{ subjectType: 'ROLE', subjectId: 'store-manager' }],
    actions: ['order:write'],
    resources: ['order:*'],
    ...overrides,
  };
}

function makeQuotaLedger(overrides?: Partial<QuotaLedger>): QuotaLedger {
  return {
    policyId: 'rl-001',
    subjectKey: 'tenant-demo',
    consumed: 100,
    remaining: 900,
    resetAt: '2026-07-23T00:00:00Z',
    ...overrides,
  };
}

function makeRateLimitPolicy(overrides?: Partial<RateLimitPolicy>): RateLimitPolicy {
  return {
    id: 'rl-001',
    limit: 1000,
    burstLimit: 2000,
    period: 'MINUTE',
    ...overrides,
  };
}

function makePiiPolicy(overrides?: Partial<PiiPolicy>): PiiPolicy {
  return {
    fieldName: 'phone',
    piiLevel: 'RESTRICTED',
    maskingStrategy: 'mask_middle_4',
    ...overrides,
  };
}

// ========================================================================
// 3. 纯业务函数（内联）
// ========================================================================

// --- 配置继承链降级 ---
function resolveInheritedConfig(
  key: string,
  entries: ConfigEntry[],
  namespaceChain: string[],
): { value: unknown; resolvedNamespace: string | null } {
  for (const ns of namespaceChain) {
    const entry = entries.find((e) => e.namespace === ns && e.key === key);
    if (entry) return { value: entry.value, resolvedNamespace: ns };
  }
  return { value: undefined, resolvedNamespace: null };
}

// --- 策略条件评估 ---
function evaluateCondition(
  condition: PolicyCondition,
  context: Record<string, unknown>,
): boolean {
  const fieldValue = context[condition.field];
  switch (condition.operator) {
    case 'EQ':
      return fieldValue === condition.value;
    case 'NOT_EQ':
      return fieldValue !== condition.value;
    case 'IN':
      return Array.isArray(condition.value) && condition.value.includes(fieldValue);
    case 'NOT_IN':
      return Array.isArray(condition.value) && !condition.value.includes(fieldValue);
    case 'GTE':
      return typeof fieldValue === 'number' && typeof condition.value === 'number'
        && fieldValue >= condition.value;
    case 'LTE':
      return typeof fieldValue === 'number' && typeof condition.value === 'number'
        && fieldValue <= condition.value;
    case 'EXISTS':
      return fieldValue !== undefined && fieldValue !== null;
    default:
      return false;
  }
}

// --- 政策评估（ALLOW 除非 DENY） ---
function evaluatePolicy(
  policy: AccessPolicy,
  action: string,
  resource: string,
  context: Record<string, unknown>,
): boolean {
  // Action check
  const actionMatch = policy.actions.some((a) => {
    if (a.endsWith(':*')) {
      const prefix = a.slice(0, -2);
      return action.startsWith(prefix);
    }
    return a === action;
  });
  if (!actionMatch) return false;

  // Resource check
  const resourceMatch = policy.resources.some((r) => {
    if (r === '*') return true;
    if (r.endsWith(':*')) {
      const prefix = r.slice(0, -2);
      return resource.startsWith(prefix);
    }
    return r === resource;
  });
  if (!resourceMatch) return false;

  // Conditions
  if (policy.conditions) {
    for (const cond of policy.conditions) {
      if (!evaluateCondition(cond, context)) return policy.effect === 'ALLOW' ? false : true;
    }
  }

  return policy.effect === 'ALLOW';
}

// --- 组织层级推算 ---
function deriveOrganizationChain(
  nodeId: string,
  memberships: OrganizationMembership[],
  parentMap: Map<string, string | null>,
): string[] {
  const chain: string[] = [nodeId];
  let current: string | null = nodeId;
  while ((current = parentMap.get(current) ?? null) !== null) {
    chain.push(current);
    if (current === 'ROOT') break;
  }
  return chain;
}

// --- 脱敏规则 ---
function maskValue(
  value: string,
  strategy: string,
): string {
  switch (strategy) {
    case 'mask_middle_4':
      if (value.length <= 7) return `${value.slice(0, 3)}****${value.slice(-2)}`;
      return `${value.slice(0, 3)}****${value.slice(-4)}`;
    case 'mask_all':
      return '*'.repeat(value.length);
    case 'mask_email':
      {
        const [local, domain] = value.split('@');
        if (!domain) return maskValue(value, 'mask_all');
        return `${local!.slice(0, 1)}***@${domain}`;
      }
    case 'mask_phone':
      return value.length >= 11
        ? `${value.slice(0, 3)}****${value.slice(-4)}`
        : maskValue(value, 'mask_middle_4');
    default:
      return value;
  }
}

// --- 配额消耗检查 ---
function canConsumeQuota(
  ledger: QuotaLedger,
  policy: RateLimitPolicy,
  requestedAmount: number,
): { allowed: boolean; reason?: string } {
  if (requestedAmount <= 0) {
    return { allowed: false, reason: '请求量必须大于 0' };
  }
  if (ledger.remaining < requestedAmount) {
    return {
      allowed: false,
      reason: `剩余配额不足: 需要 ${requestedAmount}, 剩余 ${ledger.remaining}`,
    };
  }
  return { allowed: true };
}

// --- 边缘节点能力匹配 ---
function hasCapability(node: EdgeNode, requiredCapability: string): boolean {
  return node.capabilities.includes(requiredCapability);
}

// ========================================================================
// 4. 测试
// ========================================================================

describe('配置继承链 (Config Inheritance Chain)', () => {
  const entries: ConfigEntry[] = [
    makeConfigEntry({ namespace: 'platform', key: 'max_order_amount', value: 100000 }),
    makeConfigEntry({ namespace: 'platform', key: 'theme', value: 'light' }),
    makeConfigEntry({ namespace: 'tenant', key: 'max_order_amount', value: 50000 }),
    makeConfigEntry({ namespace: 'tenant', key: 'locale', value: 'zh-CN' }),
    makeConfigEntry({ namespace: 'brand', key: 'max_order_amount', value: 75000 }),
    makeConfigEntry({ namespace: 'brand', key: 'feature_x', value: true }),
    makeConfigEntry({ namespace: 'store', key: 'feature_x', value: false }),
  ];

  it('Store → Brand → Tenant → Platform 正常降级取 store 值', () => {
    const result = resolveInheritedConfig('feature_x', entries, [
      'store', 'brand', 'tenant', 'platform',
    ]);
    assert.strictEqual(result.value, false);
    assert.strictEqual(result.resolvedNamespace, 'store');
  });

  it('store 无值降级到 brand', () => {
    const result = resolveInheritedConfig('max_order_amount', entries, [
      'store', 'brand', 'tenant', 'platform',
    ]);
    assert.strictEqual(result.value, 75000);
    assert.strictEqual(result.resolvedNamespace, 'brand');
  });

  it('brand 无值降级到 tenant', () => {
    const result = resolveInheritedConfig('locale', entries, [
      'store', 'brand', 'tenant', 'platform',
    ]);
    assert.strictEqual(result.value, 'zh-CN');
    assert.strictEqual(result.resolvedNamespace, 'tenant');
  });

  it('tenant 无值降级到 platform', () => {
    const result = resolveInheritedConfig('theme', entries, [
      'store', 'brand', 'tenant', 'platform',
    ]);
    assert.strictEqual(result.value, 'light');
    assert.strictEqual(result.resolvedNamespace, 'platform');
  });

  it('所有 namespace 都无值返回 undefined', () => {
    const result = resolveInheritedConfig('nonexistent_key', entries, [
      'store', 'brand', 'tenant', 'platform',
    ]);
    assert.strictEqual(result.value, undefined);
    assert.strictEqual(result.resolvedNamespace, null);
  });

  it('空 namespaceChain 返回 undefined', () => {
    const result = resolveInheritedConfig('max_order_amount', entries, []);
    assert.strictEqual(result.value, undefined);
    assert.strictEqual(result.resolvedNamespace, null);
  });

  it('仅检查 Store 级别，直接命中', () => {
    const result = resolveInheritedConfig('feature_x', entries, ['store']);
    assert.strictEqual(result.value, false);
    assert.strictEqual(result.resolvedNamespace, 'store');
  });
});

describe('策略条件评估 (Policy Condition Evaluation)', () => {
  it('EQ 条件相等时返回 true', () => {
    const cond: PolicyCondition = { field: 'storeId', operator: 'EQ', value: 'S001' };
    assert.strictEqual(evaluateCondition(cond, { storeId: 'S001' }), true);
  });

  it('EQ 条件不相等时返回 false', () => {
    const cond: PolicyCondition = { field: 'storeId', operator: 'EQ', value: 'S001' };
    assert.strictEqual(evaluateCondition(cond, { storeId: 'S002' }), false);
  });

  it('IN 条件命中时返回 true', () => {
    const cond: PolicyCondition = { field: 'role', operator: 'IN', value: ['admin', 'manager'] };
    assert.strictEqual(evaluateCondition(cond, { role: 'admin' }), true);
  });

  it('IN 条件未命中时返回 false', () => {
    const cond: PolicyCondition = { field: 'role', operator: 'IN', value: ['admin'] };
    assert.strictEqual(evaluateCondition(cond, { role: 'viewer' }), false);
  });

  it('GTE 数值条件正确', () => {
    const cond: PolicyCondition = { field: 'amount', operator: 'GTE', value: 10000 };
    assert.strictEqual(evaluateCondition(cond, { amount: 10000 }), true);
    assert.strictEqual(evaluateCondition(cond, { amount: 9999 }), false);
    assert.strictEqual(evaluateCondition(cond, { amount: 15000 }), true);
  });

  it('LTE 数值条件正确', () => {
    const cond: PolicyCondition = { field: 'amount', operator: 'LTE', value: 50000 };
    assert.strictEqual(evaluateCondition(cond, { amount: 50000 }), true);
    assert.strictEqual(evaluateCondition(cond, { amount: 50001 }), false);
    assert.strictEqual(evaluateCondition(cond, { amount: 30000 }), true);
  });

  it('EXISTS 检查字段存在', () => {
    const cond: PolicyCondition = { field: 'memberId', operator: 'EXISTS' };
    assert.strictEqual(evaluateCondition(cond, { memberId: 'm001' }), true);
    assert.strictEqual(evaluateCondition(cond, {}), false);
    assert.strictEqual(evaluateCondition(cond, { memberId: null }), false);
  });

  it('NOT_IN 排除特定值', () => {
    const cond: PolicyCondition = { field: 'storeId', operator: 'NOT_IN', value: ['S001', 'S002'] };
    assert.strictEqual(evaluateCondition(cond, { storeId: 'S003' }), true);
    assert.strictEqual(evaluateCondition(cond, { storeId: 'S001' }), false);
  });
});

describe('策略评估 ALLOW/DENY (Policy Evaluation)', () => {
  it('ALLOW 策略匹配 action/resource 返回 true', () => {
    const policy = makePolicy({
      effect: 'ALLOW',
      actions: ['order:write', 'order:read'],
      resources: ['order:*'],
    });
    assert.strictEqual(evaluatePolicy(policy, 'order:write', 'order:001', {}), true);
    assert.strictEqual(evaluatePolicy(policy, 'order:read', 'order:002', {}), true);
  });

  it('ALLOW 策略不匹配 action 返回 false', () => {
    const policy = makePolicy({ actions: ['order:read'], resources: ['order:*'] });
    assert.strictEqual(evaluatePolicy(policy, 'order:delete', 'order:001', {}), false);
  });

  it('ALLOW 策略不匹配 resource 返回 false', () => {
    const policy = makePolicy({ actions: ['order:read'], resources: ['order:store-001'] });
    assert.strictEqual(evaluatePolicy(policy, 'order:read', 'order:store-002', {}), false);
  });

  it('ALLOW 策略带条件评估 — 条件不满足时拒绝', () => {
    const policy = makePolicy({
      actions: ['order:write'],
      resources: ['order:*'],
      conditions: [{ field: 'storeId', operator: 'EQ', value: 'S001' }],
    });
    assert.strictEqual(evaluatePolicy(policy, 'order:write', 'order:001', { storeId: 'S002' }), false);
    assert.strictEqual(evaluatePolicy(policy, 'order:write', 'order:001', { storeId: 'S001' }), true);
  });

  it('DENY 策略优先于匹配的 action', () => {
    const denyPolicy = makePolicy({
      effect: 'DENY', actions: ['order:delete'], resources: ['order:*'],
    });
    assert.strictEqual(evaluatePolicy(denyPolicy, 'order:delete', 'order:001', {}), false);
  });

  it('通配符 action 匹配前缀', () => {
    const policy = makePolicy({ actions: ['order:*'], resources: ['*'] });
    assert.strictEqual(evaluatePolicy(policy, 'order:write', 'any-resource', {}), true);
    assert.strictEqual(evaluatePolicy(policy, 'config:read', 'any-resource', {}), false);
  });
});

describe('脱敏策略 (Masking Strategy)', () => {
  it('mask_middle_4 处理手机号', () => {
    assert.strictEqual(maskValue('13800138001', 'mask_middle_4'), '138****8001');
  });

  it('mask_phone 处理 11 位手机号', () => {
    assert.strictEqual(maskValue('13800138001', 'mask_phone'), '138****8001');
  });

  it('mask_phone 处理短号码', () => {
    assert.strictEqual(maskValue('12345', 'mask_phone'), '123****45');
  });

  it('mask_email 隐藏邮箱名', () => {
    assert.strictEqual(maskValue('zhangsan@example.com', 'mask_email'), 'z***@example.com');
  });

  it('mask_email 处理无域名邮箱', () => {
    assert.strictEqual(maskValue('zhangsan', 'mask_email'), '********');
  });

  it('mask_all 全掩', () => {
    assert.strictEqual(maskValue('secret123', 'mask_all'), '*********');
  });

  it('未知策略返回原值', () => {
    assert.strictEqual(maskValue('plain', 'unknown_strategy'), 'plain');
  });
});

describe('配额消耗检查 (Quota Consumption)', () => {
  const policy = makeRateLimitPolicy({ limit: 1000 });
  const ledger = makeQuotaLedger({ consumed: 100, remaining: 900 });

  it('配额充足时允许消耗', () => {
    assert.strictEqual(canConsumeQuota(ledger, policy, 100).allowed, true);
    assert.strictEqual(canConsumeQuota(ledger, policy, 900).allowed, true);
  });

  it('配额不足时拒绝', () => {
    const result = canConsumeQuota(ledger, policy, 901);
    assert.strictEqual(result.allowed, false);
    assert.ok(result.reason?.includes('不足'));
  });

  it('请求量 <= 0 时拒绝', () => {
    assert.strictEqual(canConsumeQuota(ledger, policy, 0).allowed, false);
    assert.strictEqual(canConsumeQuota(ledger, policy, -1).allowed, false);
  });

  it('剩余配额刚好满足时允许消耗', () => {
    assert.strictEqual(canConsumeQuota(ledger, policy, 900).allowed, true);
  });
});

describe('边缘节点能力匹配 (Edge Node Capability)', () => {
  const node: EdgeNode = {
    id: 'edge-001',
    status: 'ONLINE',
    capabilities: ['inventory-sync', 'order-sync', 'cache-flush'],
  };

  it('节点拥有所需能力返回 true', () => {
    assert.strictEqual(hasCapability(node, 'inventory-sync'), true);
    assert.strictEqual(hasCapability(node, 'order-sync'), true);
  });

  it('节点缺少能力返回 false', () => {
    assert.strictEqual(hasCapability(node, 'compute'), false);
    assert.strictEqual(hasCapability(node, 'ai-inference'), false);
  });

  it('空能力列表的节点不匹配任何能力', () => {
    const emptyNode: EdgeNode = { id: 'edge-002', status: 'ONLINE', capabilities: [] };
    assert.strictEqual(hasCapability(emptyNode, 'inventory-sync'), false);
  });
});
