/**
 * service-comprehensive.test.ts — 服务层综合测试
 *
 * 覆盖领域中的完整业务流程:
 * - 配置继承链 (config inheritance chain)
 * - Portal Domain 构建 (portal domain construction)
 * - Foundation Scope 验证 (foundation scope verification)
 * - 通知分发流程 (notification dispatch)
 *
 * 纯函数方式，不依赖 NestJS DI、不 import 生产模块。
 * ≥15 cases: 正例≥8 + 反例≥4 + 边界≥3
 */

import { describe, it } from 'node:test';
import assert from 'node:assert';

// ========================================================================
// 1. 类型定义（完全 inline）
// ========================================================================

type ScopeType = 'TENANT' | 'BRAND' | 'STORE';
type PortalAudience = 'TOC' | 'TOB';
type PortalChannel = 'WEB' | 'H5' | 'MINIAPP' | 'APP';
type PortalStatus = 'ACTIVE' | 'INACTIVE' | 'DRAFT' | 'ARCHIVED';
type NotificationChannel = 'IN_APP' | 'EMAIL' | 'SMS' | 'WEBHOOK';
type NotificationPriority = 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';
type NotificationStatus = 'PENDING' | 'SENT' | 'FAILED' | 'READ';
type EventType =
  | 'order.created'
  | 'order.paid'
  | 'order.refunded'
  | 'inventory.low'
  | 'alert.triggered'
  | 'member.upgraded'
  | 'audit.completed';

interface FoundationScope {
  scopeType: ScopeType;
  scopeId: string;
  tenantId?: string;
  brandId?: string;
  storeId?: string;
  marketCode?: string;
  portalCode?: string;
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

interface PortalDomain {
  id: string;
  code: string;
  name: string;
  audience: PortalAudience;
  channel: PortalChannel;
  domain: string;
  status: PortalStatus;
  scope: FoundationScope;
  features: string[];
  customDomain?: string;
  sslEnabled: boolean;
  theme?: string;
  createdAt: string;
}

interface NotificationMessage {
  id: string;
  eventType: EventType;
  title: string;
  body: string;
  priority: NotificationPriority;
  recipients: string[];
  channels: NotificationChannel[];
  scope: FoundationScope;
  status: NotificationStatus;
  createdAt: string;
}

interface NotificationTemplate {
  id: string;
  eventType: EventType;
  titleTemplate: string;
  bodyTemplate: string;
  priority: NotificationPriority;
  channels: NotificationChannel[];
  variables: string[];
}

// ========================================================================
// 2. Mock 数据工厂
// ========================================================================

function makeScope(overrides?: Partial<FoundationScope>): FoundationScope {
  return {
    scopeType: 'TENANT',
    scopeId: 'T001',
    tenantId: 'T001',
    ...overrides,
  };
}

function makeConfigEntry(overrides?: Partial<ConfigEntry>): ConfigEntry {
  return {
    id: 'cfg-001',
    namespace: 'platform',
    key: 'max_order_amount',
    value: 100000,
    scope: makeScope(),
    version: 1,
    ...overrides,
  };
}

function makePortalDomain(overrides?: Partial<PortalDomain>): PortalDomain {
  return {
    id: 'portal-001',
    code: 'cn-shanghai-p1',
    name: '上海旗舰店门户',
    audience: 'TOC',
    channel: 'H5',
    domain: 'https://cn-shanghai-p1.example.com',
    status: 'ACTIVE',
    scope: makeScope({ scopeType: 'STORE', storeId: 'ST001' }),
    features: ['online-order', 'loyalty', 'booking'],
    sslEnabled: true,
    createdAt: '2026-07-01T00:00:00Z',
    ...overrides,
  };
}

function makeNotificationMessage(overrides?: Partial<NotificationMessage>): NotificationMessage {
  return {
    id: 'notif-001',
    eventType: 'order.created',
    title: '新订单通知',
    body: '订单 #{orderId} 已创建',
    priority: 'NORMAL',
    recipients: ['admin@example.com'],
    channels: ['IN_APP'],
    scope: makeScope(),
    status: 'PENDING',
    createdAt: '2026-07-24T00:00:00Z',
    ...overrides,
  };
}

function makeNotificationTemplate(overrides?: Partial<NotificationTemplate>): NotificationTemplate {
  return {
    id: 'tmpl-001',
    eventType: 'order.created',
    titleTemplate: '新订单 #{orderId}',
    bodyTemplate: '客户 #{customerName} 提交了订单 #{orderId}，金额 #{amount} 元',
    priority: 'NORMAL',
    channels: ['IN_APP', 'EMAIL'],
    variables: ['orderId', 'customerName', 'amount'],
    ...overrides,
  };
}

// ========================================================================
// 3. 纯业务函数（内联）
// ========================================================================

// ── 配置继承链 (config inheritance chain) ──

/**
 * 解析配置继承链
 * namespaceChain 优先级从高到低: [store, brand, tenant, platform]
 */
function resolveConfigByChain(
  key: string,
  entries: ConfigEntry[],
  chain: string[],
): { value: unknown; namespace: string | null } {
  for (const ns of chain) {
    const entry = entries.find((e) => e.namespace === ns && e.key === key);
    if (entry) return { value: entry.value, namespace: ns };
  }
  return { value: null, namespace: null };
}

/**
 * 合并多层配置为单层对象
 */
function mergeConfigLayer(entries: ConfigEntry[], namespaces: string[]): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const ns of namespaces) {
    for (const entry of entries) {
      if (entry.namespace === ns && !(entry.key in result)) {
        result[entry.key] = entry.value;
      }
    }
  }
  return result;
}

/**
 * 判断两个 scope 是否存在继承关系
 */
function isScopeAncestor(ancestor: FoundationScope, child: FoundationScope): boolean {
  const check = (a: string | undefined, c: string | undefined): boolean => {
    if (!a) return true; // ancestor 无该字段视为通配
    return a === c;
  };

  return (
    check(ancestor.tenantId, child.tenantId) &&
    check(ancestor.brandId, child.brandId) &&
    check(ancestor.storeId, child.storeId)
  );
}

// ── Portal Domain 构建 ──

/**
 * 根据 scope 和 audience 构建 portal domain 基础配置
 */
function buildPortalDomainForScope(
  scope: FoundationScope,
  audience: PortalAudience,
  channel: PortalChannel,
  overrides?: Partial<PortalDomain>,
): PortalDomain {
  const code = `${scope.scopeType.toLowerCase()}-${scope.scopeId}`;
  return {
    id: `portal-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    code,
    name: `${scope.scopeType} ${scope.scopeId} Portal`,
    audience,
    channel,
    domain: `https://${code}.example.com`,
    status: 'DRAFT',
    scope,
    features: [],
    sslEnabled: true,
    createdAt: new Date().toISOString(),
    ...overrides,
  };
}

/**
 * 校验 portal domain 配置是否完整
 */
function validatePortalDomain(domain: Partial<PortalDomain>): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  if (!domain.code) errors.push('Portal code is required');
  if (!domain.audience) errors.push('Portal audience is required');
  if (!domain.channel) errors.push('Portal channel is required');
  if (!domain.domain) errors.push('Portal domain is required');
  if (!domain.scope?.scopeType || !domain.scope?.scopeId) {
    errors.push('Portal scope must have scopeType and scopeId');
  }
  return { valid: errors.length === 0, errors };
}

/**
 * 激活 Portal Domain
 */
function activatePortalDomain(domain: PortalDomain): PortalDomain {
  if (domain.status === 'ARCHIVED') {
    throw new Error(`Cannot activate archived portal: ${domain.id}`);
  }
  return { ...domain, status: 'ACTIVE' as PortalStatus };
}

/**
 * 禁用 Portal Domain
 */
function deactivatePortalDomain(domain: PortalDomain): PortalDomain {
  if (domain.status === 'ARCHIVED') {
    throw new Error('Cannot deactivate archived portal');
  }
  return { ...domain, status: 'INACTIVE' as PortalStatus };
}

// ── Foundation Scope 验证 ──

/**
 * 验证 foundation scope 的完整性
 */
function validateFoundationScope(scope: FoundationScope): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!scope.scopeType) errors.push('scopeType is required');
  if (!scope.scopeId) errors.push('scopeId is required');

  switch (scope.scopeType) {
    case 'STORE':
      if (!scope.storeId) errors.push('STORE scope must have storeId');
      if (!scope.tenantId) errors.push('STORE scope must have tenantId');
      break;
    case 'BRAND':
      if (!scope.brandId) errors.push('BRAND scope must have brandId');
      break;
    case 'TENANT':
      if (!scope.tenantId) errors.push('TENANT scope must have tenantId');
      break;
    default:
      errors.push(`Unknown scopeType: ${scope.scopeType}`);
  }

  return { valid: errors.length === 0, errors };
}

/**
 * 从 scope 中提取有效的上下文信息
 */
function extractScopeContext(scope: FoundationScope): {
  effectiveTenantId: string | null;
  effectiveBrandId: string | null;
  effectiveStoreId: string | null;
  hierarchyLevel: number;
} {
  const effectiveTenantId = scope.tenantId ?? null;
  const effectiveBrandId = scope.brandId ?? null;
  const effectiveStoreId = scope.storeId ?? null;

  // 层级数字：0=TENANT, 1=BRAND, 2=STORE
  let hierarchyLevel = 0;
  if (scope.scopeType === 'BRAND') hierarchyLevel = 1;
  else if (scope.scopeType === 'STORE') hierarchyLevel = 2;

  return { effectiveTenantId, effectiveBrandId, effectiveStoreId, hierarchyLevel };
}

/**
 * 检查 scope 是否在某个层级可见
 */
function isScopeVisibleAtLevel(scope: FoundationScope, level: ScopeType): boolean {
  const context = extractScopeContext(scope);
  if (level === 'TENANT') return context.effectiveTenantId !== null;
  if (level === 'BRAND') return context.effectiveBrandId !== null;
  if (level === 'STORE') return context.effectiveStoreId !== null;
  return false;
}

// ── 通知分发流程 (Notification Dispatch) ──

/**
 * 根据模板渲染通知消息
 */
function renderNotificationFromTemplate(
  template: NotificationTemplate,
  variables: Record<string, string | number>,
): { title: string; body: string } {
  const render = (template: string): string => {
    return template.replace(/#\{(\w+)\}/g, (_match, key: string) => {
      const val = variables[key];
      return val !== undefined ? String(val) : `#{${key}}`;
    });
  };

  return {
    title: render(template.titleTemplate),
    body: render(template.bodyTemplate),
  };
}

/**
 * 根据事件类型查找匹配的通知模板
 */
function findMatchingTemplates(
  eventType: EventType,
  templates: NotificationTemplate[],
): NotificationTemplate[] {
  return templates.filter((t) => t.eventType === eventType);
}

/**
 * 创建通知消息
 */
function createNotificationMessage(
  eventType: EventType,
  template: NotificationTemplate,
  variables: Record<string, string | number>,
  recipients: string[],
  scope: FoundationScope,
): NotificationMessage {
  const rendered = renderNotificationFromTemplate(template, variables);
  return {
    id: `notif-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    eventType,
    title: rendered.title,
    body: rendered.body,
    priority: template.priority,
    recipients,
    channels: template.channels,
    scope,
    status: 'PENDING',
    createdAt: new Date().toISOString(),
  };
}

/**
 * 按优先级排序通知（URGENT > HIGH > NORMAL > LOW）
 */
function sortNotificationsByPriority(messages: NotificationMessage[]): NotificationMessage[] {
  const priorityOrder: Record<NotificationPriority, number> = {
    URGENT: 0,
    HIGH: 1,
    NORMAL: 2,
    LOW: 3,
  };
  return [...messages].sort(
    (a, b) => priorityOrder[a.priority] - priorityOrder[b.priority],
  );
}

/**
 * 标记通知已发送
 */
function markNotificationSent(message: NotificationMessage): NotificationMessage {
  return { ...message, status: 'SENT' };
}

/**
 * 标记通知已读
 */
function markNotificationRead(message: NotificationMessage): NotificationMessage {
  if (message.status === 'FAILED') {
    throw new Error('Cannot mark a failed notification as read');
  }
  return { ...message, status: 'READ' };
}

/**
 * 按范围筛选通知
 */
function filterNotificationsByScope(
  messages: NotificationMessage[],
  scope: FoundationScope,
): NotificationMessage[] {
  return messages.filter((m) => {
    // scopeId 匹配即有权限看到
    return m.scope.scopeId === scope.scopeId;
  });
}

/**
 * 聚合通知按事件类型统计
 */
function aggregateNotificationsByEventType(
  messages: NotificationMessage[],
): Record<EventType, number> {
  const counts: Partial<Record<EventType, number>> = {};
  for (const m of messages) {
    counts[m.eventType] = (counts[m.eventType] ?? 0) + 1;
  }
  return counts as Record<EventType, number>;
}

// ========================================================================
// 4. 测试 — 配置继承链
// ========================================================================

describe('配置继承链 (Config Inheritance Chain)', () => {
  const entries: ConfigEntry[] = [
    makeConfigEntry({ namespace: 'platform', key: 'max_order_amount', value: 100000 }),
    makeConfigEntry({ namespace: 'platform', key: 'theme', value: 'light' }),
    makeConfigEntry({ namespace: 'tenant', key: 'max_order_amount', value: 50000 }),
    makeConfigEntry({ namespace: 'tenant', key: 'locale', value: 'zh-CN' }),
    makeConfigEntry({ namespace: 'brand', key: 'max_order_amount', value: 75000 }),
    makeConfigEntry({ namespace: 'brand', key: 'feature_x', value: true }),
    makeConfigEntry({ namespace: 'store', key: 'max_order_amount', value: 99999 }),
  ];

  it('高优先级 namespace 优先返回', () => {
    const chain = ['store', 'brand', 'tenant', 'platform'];
    const result = resolveConfigByChain('max_order_amount', entries, chain);
    assert.strictEqual(result.value, 99999);
    assert.strictEqual(result.namespace, 'store');
  });

  it('store 无值降级到 brand', () => {
    const chain = ['store', 'brand', 'tenant', 'platform'];
    const result = resolveConfigByChain('feature_x', entries, chain);
    assert.strictEqual(result.value, true);
    assert.strictEqual(result.namespace, 'brand');
  });

  it('所有 namespace 都缺失时返回 null', () => {
    const result = resolveConfigByChain('nonexistent_key', entries, ['store', 'brand']);
    assert.strictEqual(result.value, null);
    assert.strictEqual(result.namespace, null);
  });

  it('空 chain 返回 null', () => {
    const result = resolveConfigByChain('max_order_amount', entries, []);
    assert.strictEqual(result.value, null);
    assert.strictEqual(result.namespace, null);
  });

  it('mergeConfigLayer 正确合并多层配置', () => {
    const merged = mergeConfigLayer(entries, ['store', 'brand', 'tenant', 'platform']);
    // store 有 max_order_amount=99999, 其他 key 向低层查找
    assert.strictEqual(merged.max_order_amount, 99999);
    assert.strictEqual(merged.theme, 'light');
    assert.strictEqual(merged.locale, 'zh-CN');
    assert.strictEqual(merged.feature_x, true);
  });

  it('mergeConfigLayer 忽略缺失 namespace', () => {
    const result = mergeConfigLayer(entries, ['nonexistent']);
    assert.deepStrictEqual(result, {});
  });

  it('isScopeAncestor: tenant scope 是 store scope 的祖先', () => {
    const tenant = makeScope({ scopeType: 'TENANT', scopeId: 'T001', tenantId: 'T001' });
    const store = makeScope({ scopeType: 'STORE', scopeId: 'ST001', tenantId: 'T001', storeId: 'ST001' });
    assert.strictEqual(isScopeAncestor(tenant, store), true);
  });

  it('isScopeAncestor: 不同 tenant 不是祖先', () => {
    const tenantA = makeScope({ scopeType: 'TENANT', scopeId: 'T001', tenantId: 'T001' });
    const storeB = makeScope({ scopeType: 'STORE', scopeId: 'ST002', tenantId: 'T002', storeId: 'ST002' });
    assert.strictEqual(isScopeAncestor(tenantA, storeB), false);
  });
});

// ========================================================================
// 5. 测试 — Portal Domain 构建
// ========================================================================

describe('Portal Domain 构建与生命周期', () => {
  it('为 STORE 级别 scope 构建 portal domain', () => {
    const scope = makeScope({ scopeType: 'STORE', scopeId: 'ST001', storeId: 'ST001' });
    const portal = buildPortalDomainForScope(scope, 'TOC', 'H5');
    assert.strictEqual(portal.code, 'store-ST001');
    assert.strictEqual(portal.audience, 'TOC');
    assert.strictEqual(portal.channel, 'H5');
    assert.strictEqual(portal.status, 'DRAFT');
    assert.strictEqual(portal.sslEnabled, true);
  });

  it('为 TENANT 级别 scope 构建门户', () => {
    const scope = makeScope({ scopeType: 'TENANT', scopeId: 'T001' });
    const portal = buildPortalDomainForScope(scope, 'TOB', 'WEB', {
      name: '企业控制台',
      features: ['analytics', 'user-management'],
    });
    assert.strictEqual(portal.code, 'tenant-T001');
    assert.strictEqual(portal.name, '企业控制台');
    assert.ok(portal.features.includes('analytics'));
    assert.strictEqual(portal.audience, 'TOB');
  });

  it('validatePortalDomain: 完整 domain 通过校验', () => {
    const portal = makePortalDomain();
    const result = validatePortalDomain(portal);
    assert.strictEqual(result.valid, true);
    assert.strictEqual(result.errors.length, 0);
  });

  it('validatePortalDomain: 缺少 code 和 audience 时失败', () => {
    const result = validatePortalDomain({ domain: 'https://x.com' });
    assert.strictEqual(result.valid, false);
    assert.ok(result.errors.length >= 2);
    assert.ok(result.errors.some((e) => e.includes('code')));
    assert.ok(result.errors.some((e) => e.includes('audience')));
  });

  it('validatePortalDomain: 缺少 scope 时失败', () => {
    const result = validatePortalDomain({
      code: 'test', audience: 'TOC', channel: 'H5', domain: 'https://x.com',
      scope: {} as FoundationScope,
    });
    assert.strictEqual(result.valid, false);
    assert.ok(result.errors.some((e) => e.includes('scope')));
  });

  it('activatePortalDomain: DRAFT -> ACTIVE', () => {
    const portal = makePortalDomain({ status: 'DRAFT' });
    const activated = activatePortalDomain(portal);
    assert.strictEqual(activated.status, 'ACTIVE');
  });

  it('activatePortalDomain: 不能激活已归档的门户', () => {
    const portal = makePortalDomain({ status: 'ARCHIVED' });
    assert.throws(() => activatePortalDomain(portal), /Cannot activate archived/);
  });

  it('deactivatePortalDomain: ACTIVE -> INACTIVE', () => {
    const portal = makePortalDomain({ status: 'ACTIVE' });
    const deactivated = deactivatePortalDomain(portal);
    assert.strictEqual(deactivated.status, 'INACTIVE');
  });

  it('deactivatePortalDomain: 不能禁用在归档状态的门户', () => {
    const portal = makePortalDomain({ status: 'ARCHIVED' });
    assert.throws(() => deactivatePortalDomain(portal), /Cannot deactivate archived/);
  });
});

// ========================================================================
// 6. 测试 — Foundation Scope 验证
// ========================================================================

describe('Foundation Scope 验证', () => {
  it('validateFoundationScope: STORE scope 需要 storeId 和 tenantId', () => {
    const scope = makeScope({ scopeType: 'STORE', scopeId: 'ST001', storeId: 'ST001', tenantId: 'T001' });
    const result = validateFoundationScope(scope);
    assert.strictEqual(result.valid, true);
  });

  it('validateFoundationScope: STORE scope 缺少 storeId 时失败', () => {
    const scope = makeScope({ scopeType: 'STORE', scopeId: 'ST001', tenantId: 'T001', storeId: undefined });
    const result = validateFoundationScope(scope);
    assert.strictEqual(result.valid, false);
    assert.ok(result.errors.some((e) => e.includes('storeId')));
  });

  it('validateFoundationScope: TENANT scope 需要 tenantId', () => {
    const scope = makeScope({ scopeType: 'TENANT', scopeId: 'T001', tenantId: 'T001' });
    const result = validateFoundationScope(scope);
    assert.strictEqual(result.valid, true);
  });

  it('validateFoundationScope: 未知 scopeType 返回错误', () => {
    const scope = makeScope({ scopeType: 'UNKNOWN' as ScopeType, scopeId: 'X' });
    const result = validateFoundationScope(scope);
    assert.strictEqual(result.valid, false);
    assert.ok(result.errors.some((e) => e.includes('Unknown')));
  });

  it('extractScopeContext: STORE 层级返回正确上下文', () => {
    const scope = makeScope({
      scopeType: 'STORE', scopeId: 'ST001',
      tenantId: 'T001', brandId: 'B001', storeId: 'ST001',
    });
    const ctx = extractScopeContext(scope);
    assert.strictEqual(ctx.effectiveTenantId, 'T001');
    assert.strictEqual(ctx.effectiveBrandId, 'B001');
    assert.strictEqual(ctx.effectiveStoreId, 'ST001');
    assert.strictEqual(ctx.hierarchyLevel, 2);
  });

  it('extractScopeContext: TENANT 层级返回 0', () => {
    const scope = makeScope({ scopeType: 'TENANT', scopeId: 'T001', tenantId: 'T001' });
    const ctx = extractScopeContext(scope);
    assert.strictEqual(ctx.hierarchyLevel, 0);
    assert.strictEqual(ctx.effectiveStoreId, null);
  });

  it('isScopeVisibleAtLevel: STORE scope 在 STORE 级别可见', () => {
    const scope = makeScope({ scopeType: 'STORE', scopeId: 'ST001', storeId: 'ST001' });
    assert.strictEqual(isScopeVisibleAtLevel(scope, 'STORE'), true);
    assert.strictEqual(isScopeVisibleAtLevel(scope, 'BRAND'), false);
    assert.strictEqual(isScopeVisibleAtLevel(scope, 'TENANT'), true); // 总有 tenant
  });
});

// ========================================================================
// 7. 测试 — 通知分发流程
// ========================================================================

describe('通知分发 (Notification Dispatch)', () => {
  const template = makeNotificationTemplate();

  it('renderNotificationFromTemplate: 正确填充变量', () => {
    const result = renderNotificationFromTemplate(template, {
      orderId: 'ORD-001',
      customerName: '张三',
      amount: 2999,
    });
    assert.strictEqual(result.title, '新订单 ORD-001');
    assert.strictEqual(result.body, '客户 张三 提交了订单 ORD-001，金额 2999 元');
  });

  it('renderNotificationFromTemplate: 缺失变量保持占位符', () => {
    const result = renderNotificationFromTemplate(template, { orderId: 'ORD-001' });
    assert.strictEqual(result.title, '新订单 ORD-001');
    assert.strictEqual(result.body, '客户 #{customerName} 提交了订单 ORD-001，金额 #{amount} 元');
  });

  it('renderNotificationFromTemplate: 空变量对象', () => {
    const result = renderNotificationFromTemplate(template, {});
    assert.strictEqual(result.title, '新订单 #{orderId}');
    assert.strictEqual(result.body, '客户 #{customerName} 提交了订单 #{orderId}，金额 #{amount} 元');
  });

  it('findMatchingTemplates: 按事件类型匹配模板', () => {
    const templates = [
      makeNotificationTemplate({ id: 't1', eventType: 'order.created' }),
      makeNotificationTemplate({ id: 't2', eventType: 'order.paid' }),
      makeNotificationTemplate({ id: 't3', eventType: 'order.created' }),
    ];
    const matched = findMatchingTemplates('order.created', templates);
    assert.strictEqual(matched.length, 2);
    assert.ok(matched.every((t) => t.eventType === 'order.created'));
  });

  it('findMatchingTemplates: 无匹配时返回空数组', () => {
    const templates = [makeNotificationTemplate({ eventType: 'order.created' })];
    const matched = findMatchingTemplates('alert.triggered', templates);
    assert.strictEqual(matched.length, 0);
  });

  it('createNotificationMessage: 从模板创建通知消息', () => {
    const msg = createNotificationMessage(
      'order.created',
      template,
      { orderId: 'ORD-001', customerName: '李四', amount: 5000 },
      ['manager@example.com'],
      makeScope(),
    );
    assert.strictEqual(msg.eventType, 'order.created');
    assert.strictEqual(msg.status, 'PENDING');
    assert.strictEqual(msg.title, '新订单 ORD-001');
    assert.ok(msg.recipients.includes('manager@example.com'));
    assert.ok(msg.channels.includes('EMAIL'));
    assert.strictEqual(msg.priority, 'NORMAL');
  });

  it('sortNotificationsByPriority: URGENT 排在前面', () => {
    const low = makeNotificationMessage({ id: 'n1', priority: 'LOW' });
    const high = makeNotificationMessage({ id: 'n2', priority: 'HIGH' });
    const urgent = makeNotificationMessage({ id: 'n3', priority: 'URGENT' });
    const sorted = sortNotificationsByPriority([low, high, urgent]);
    assert.strictEqual(sorted[0]!.id, 'n3');
    assert.strictEqual(sorted[1]!.id, 'n2');
    assert.strictEqual(sorted[2]!.id, 'n1');
  });

  it('sortNotificationsByPriority: NORMAL 默认排序', () => {
    const a = makeNotificationMessage({ id: 'a', priority: 'NORMAL' });
    const b = makeNotificationMessage({ id: 'b', priority: 'LOW' });
    const sorted = sortNotificationsByPriority([a, b]);
    assert.strictEqual(sorted[0]!.id, 'a');
    assert.strictEqual(sorted[1]!.id, 'b');
  });

  it('markNotificationSent: PENDING -> SENT', () => {
    const msg = makeNotificationMessage({ status: 'PENDING' });
    const sent = markNotificationSent(msg);
    assert.strictEqual(sent.status, 'SENT');
  });

  it('markNotificationRead: SENT -> READ', () => {
    const msg = makeNotificationMessage({ status: 'SENT' });
    const read = markNotificationRead(msg);
    assert.strictEqual(read.status, 'READ');
  });

  it('markNotificationRead: FAILED 状态抛出异常', () => {
    const msg = makeNotificationMessage({ status: 'FAILED' });
    assert.throws(() => markNotificationRead(msg), /Cannot mark a failed notification as read/);
  });

  it('filterNotificationsByScope: 按 scopeId 筛选', () => {
    const msgs = [
      makeNotificationMessage({ id: 'm1', scope: makeScope({ scopeId: 'T001' }) }),
      makeNotificationMessage({ id: 'm2', scope: makeScope({ scopeId: 'B001' }) }),
      makeNotificationMessage({ id: 'm3', scope: makeScope({ scopeId: 'T001' }) }),
    ];
    const filtered = filterNotificationsByScope(msgs, makeScope({ scopeId: 'T001' }));
    assert.strictEqual(filtered.length, 2);
    assert.ok(filtered.every((m) => m.scope.scopeId === 'T001'));
  });

  it('aggregateNotificationsByEventType: 按事件类型统计', () => {
    const msgs = [
      makeNotificationMessage({ id: 'a', eventType: 'order.created' }),
      makeNotificationMessage({ id: 'b', eventType: 'order.paid' }),
      makeNotificationMessage({ id: 'c', eventType: 'order.created' }),
      makeNotificationMessage({ id: 'd', eventType: 'alert.triggered' }),
    ];
    const counts = aggregateNotificationsByEventType(msgs);
    assert.strictEqual(counts['order.created'], 2);
    assert.strictEqual(counts['order.paid'], 1);
    assert.strictEqual(counts['alert.triggered'], 1);
    assert.strictEqual(counts['order.refunded'], undefined);
  });
});
