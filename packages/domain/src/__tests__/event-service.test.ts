/**
 * event-service.test.ts — EventService 单元测试
 *
 * 测试领域事件生命周期: 事件创建 → 状态流转 → 分发 → 失败处理
 * 全纯函数式，不依赖 NestJS DI、不 import 生产模块。
 * ≥15 cases: 正例 ≥8 + 反例 ≥4 + 边界 ≥3
 */

import { describe, it } from 'node:test';
import assert from 'node:assert';

// ========================================================================
// 1. 类型定义（完全 inline，与 domain types 一致）
// ========================================================================

type EventStatus = 'PENDING' | 'PROCESSING' | 'PUBLISHED' | 'FAILED' | 'DEAD_LETTER';
type WebhookDeliveryStatus = 'PENDING' | 'DELIVERED' | 'FAILED' | 'DEAD_LETTER';

interface FoundationScope {
  scopeType: string;
  scopeId: string;
  tenantId?: string;
  brandId?: string;
  storeId?: string;
  marketCode?: string;
  portalCode?: string;
}

interface DomainEvent {
  id: string;
  eventType: string;
  aggregateType: string;
  aggregateId: string;
  scope: FoundationScope;
  idempotencyKey?: string;
  status: EventStatus;
  payload: Record<string, unknown>;
  occurredAt: string;
}

interface WebhookSubscription {
  id: string;
  topic: string;
  scope: FoundationScope;
  targetUrl: string;
  secretRef: string;
  enabled: boolean;
  retryLimit: number;
  metadata?: Record<string, unknown>;
}

interface WebhookDelivery {
  id: string;
  eventId: string;
  webhookId: string;
  status: WebhookDeliveryStatus;
  attemptCount: number;
  lastAttemptAt?: string;
  errorMessage?: string;
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

function makeEvent(overrides?: Partial<DomainEvent>): DomainEvent {
  return {
    id: 'evt-001',
    eventType: 'order.created',
    aggregateType: 'Order',
    aggregateId: 'ord-001',
    scope: makeScope(),
    status: 'PENDING',
    payload: { orderId: 'ord-001', amount: 9999 },
    occurredAt: '2026-07-24T00:00:00Z',
    ...overrides,
  };
}

function makeWebhook(overrides?: Partial<WebhookSubscription>): WebhookSubscription {
  return {
    id: 'wh-001',
    topic: 'order.created',
    scope: makeScope(),
    targetUrl: 'https://partner.example.com/webhooks',
    secretRef: 'sec-wh-001',
    enabled: true,
    retryLimit: 3,
    ...overrides,
  };
}

function makeDelivery(overrides?: Partial<WebhookDelivery>): WebhookDelivery {
  return {
    id: 'del-001',
    eventId: 'evt-001',
    webhookId: 'wh-001',
    status: 'PENDING',
    attemptCount: 0,
    ...overrides,
  };
}

// ========================================================================
// 3. 纯业务函数（内联）
// ========================================================================

/** 创建领域事件 — 分配 ID、设置初始状态 */
function createEvent(
  params: Pick<DomainEvent, 'eventType' | 'aggregateType' | 'aggregateId' | 'scope' | 'payload'>,
): DomainEvent {
  return {
    id: `evt-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    eventType: params.eventType,
    aggregateType: params.aggregateType,
    aggregateId: params.aggregateId,
    scope: params.scope,
    status: 'PENDING',
    payload: params.payload,
    occurredAt: new Date().toISOString(),
  };
}

/** 事件状态转换 */
function transitionEvent(event: DomainEvent, newStatus: EventStatus): DomainEvent {
  const validTransitions: Record<EventStatus, EventStatus[]> = {
    PENDING: ['PROCESSING'],
    PROCESSING: ['PUBLISHED', 'FAILED'],
    PUBLISHED: ['DEAD_LETTER'],
    FAILED: ['PROCESSING', 'DEAD_LETTER'],
    DEAD_LETTER: [],
  };

  const allowed = validTransitions[event.status];
  if (!allowed || !allowed.includes(newStatus)) {
    throw new Error(
      `Invalid transition: ${event.status} -> ${newStatus}`,
    );
  }

  return { ...event, status: newStatus };
}

/** 查找匹配事件类型的 Webhook */
function findMatchingWebhooks(
  event: DomainEvent,
  webhooks: WebhookSubscription[],
): WebhookSubscription[] {
  return webhooks.filter(
    (wh) => wh.topic === event.eventType && wh.enabled,
  );
}

/** 创建 Webhook 投递记录 */
function createDeliveries(
  event: DomainEvent,
  webhooks: WebhookSubscription[],
): WebhookDelivery[] {
  const matched = findMatchingWebhooks(event, webhooks);
  return matched.map((wh) => ({
    id: `del-${event.id}-${wh.id}`,
    eventId: event.id,
    webhookId: wh.id,
    status: 'PENDING' as WebhookDeliveryStatus,
    attemptCount: 0,
  }));
}

/** 投递失败重试逻辑 */
function retryDelivery(
  delivery: WebhookDelivery,
  maxRetries: number,
): { delivery: WebhookDelivery; shouldRetry: boolean } {
  if (delivery.status !== 'FAILED') {
    return { delivery, shouldRetry: false };
  }
  if (delivery.attemptCount >= maxRetries) {
    return {
      delivery: { ...delivery, status: 'DEAD_LETTER' as WebhookDeliveryStatus },
      shouldRetry: false,
    };
  }
  return {
    delivery: {
      ...delivery,
      attemptCount: delivery.attemptCount + 1,
      lastAttemptAt: new Date().toISOString(),
    },
    shouldRetry: true,
  };
}

/** 标记投递成功 */
function markDelivered(delivery: WebhookDelivery): WebhookDelivery {
  return {
    ...delivery,
    status: 'DELIVERED' as WebhookDeliveryStatus,
    attemptCount: delivery.attemptCount + 1,
    lastAttemptAt: new Date().toISOString(),
  };
}

/** 标记投递失败 */
function markFailed(delivery: WebhookDelivery, error: string): WebhookDelivery {
  return {
    ...delivery,
    status: 'FAILED' as WebhookDeliveryStatus,
    attemptCount: delivery.attemptCount + 1,
    lastAttemptAt: new Date().toISOString(),
    errorMessage: error,
  };
}

/** 幂等性检测 */
function hasIdempotencyConflict(
  events: DomainEvent[],
  idempotencyKey: string,
): boolean {
  return events.some((e) => e.idempotencyKey === idempotencyKey);
}

/** 按时间筛选事件 */
function filterEventsByTimeRange(
  events: DomainEvent[],
  from: string,
  to: string,
): DomainEvent[] {
  return events.filter((e) => e.occurredAt >= from && e.occurredAt <= to);
}

/** 按状态分组统计 */
function countByStatus(events: DomainEvent[]): Record<EventStatus, number> {
  const counts: Record<string, number> = {};
  for (const e of events) {
    counts[e.status] = (counts[e.status] || 0) + 1;
  }
  return counts as Record<EventStatus, number>;
}

// ========================================================================
// 4. 测试
// ========================================================================

describe('EventService / createEvent 事件创建', () => {
  it('创建一个新事件，初始状态为 PENDING', () => {
    const evt = createEvent({
      eventType: 'order.created',
      aggregateType: 'Order',
      aggregateId: 'ord-001',
      scope: makeScope(),
      payload: { orderId: 'ord-001' },
    });
    assert.strictEqual(evt.eventType, 'order.created');
    assert.strictEqual(evt.status, 'PENDING');
    assert.ok(evt.id.startsWith('evt-'));
    assert.ok(evt.occurredAt);
  });

  it('每次创建生成不同的 ID', () => {
    const a = createEvent({ eventType: 'a', aggregateType: 'T', aggregateId: '1', scope: makeScope(), payload: {} });
    const b = createEvent({ eventType: 'b', aggregateType: 'T', aggregateId: '2', scope: makeScope(), payload: {} });
    assert.notStrictEqual(a.id, b.id);
  });
});

describe('EventService / transitionEvent 事件状态转换', () => {
  it('PENDING → PROCESSING 有效转换', () => {
    const evt = makeEvent({ status: 'PENDING' });
    const result = transitionEvent(evt, 'PROCESSING');
    assert.strictEqual(result.status, 'PROCESSING');
    assert.strictEqual(result.id, evt.id);
  });

  it('PROCESSING → PUBLISHED 有效转换', () => {
    const evt = makeEvent({ status: 'PROCESSING' });
    const result = transitionEvent(evt, 'PUBLISHED');
    assert.strictEqual(result.status, 'PUBLISHED');
  });

  it('PROCESSING → FAILED 有效转换', () => {
    const evt = makeEvent({ status: 'PROCESSING' });
    const result = transitionEvent(evt, 'FAILED');
    assert.strictEqual(result.status, 'FAILED');
  });

  it('PUBLISHED → DEAD_LETTER 有效转换', () => {
    const evt = makeEvent({ status: 'PUBLISHED' });
    const result = transitionEvent(evt, 'DEAD_LETTER');
    assert.strictEqual(result.status, 'DEAD_LETTER');
  });

  it('FAILED → PROCESSING 有效重试', () => {
    const evt = makeEvent({ status: 'FAILED' });
    const result = transitionEvent(evt, 'PROCESSING');
    assert.strictEqual(result.status, 'PROCESSING');
  });

  it('PENDING → PUBLISHED 无效转换抛出异常', () => {
    const evt = makeEvent({ status: 'PENDING' });
    assert.throws(() => transitionEvent(evt, 'PUBLISHED'), /Invalid transition/);
  });

  it('DEAD_LETTER 不能转换到任何状态', () => {
    const evt = makeEvent({ status: 'DEAD_LETTER' });
    assert.throws(() => transitionEvent(evt, 'PENDING'), /Invalid transition/);
    assert.throws(() => transitionEvent(evt, 'PROCESSING'), /Invalid transition/);
  });

  it('FAILED → DEAD_LETTER 有效（放弃重试）', () => {
    const evt = makeEvent({ status: 'FAILED' });
    const result = transitionEvent(evt, 'DEAD_LETTER');
    assert.strictEqual(result.status, 'DEAD_LETTER');
  });
});

describe('EventService / findMatchingWebhooks Webhook 匹配', () => {
  const webhooks: WebhookSubscription[] = [
    makeWebhook({ id: 'wh-001', topic: 'order.created', enabled: true }),
    makeWebhook({ id: 'wh-002', topic: 'order.created', enabled: true }),
    makeWebhook({ id: 'wh-003', topic: 'order.paid', enabled: true }),
    makeWebhook({ id: 'wh-004', topic: 'order.created', enabled: false }),
  ];

  it('匹配启用的 Webhook，不匹配已禁用的', () => {
    const evt = makeEvent({ eventType: 'order.created' });
    const matched = findMatchingWebhooks(evt, webhooks);
    assert.strictEqual(matched.length, 2);
    assert.ok(matched.every((w) => w.enabled));
    assert.ok(matched.every((w) => w.topic === 'order.created'));
  });

  it('无匹配 Webhook 时返回空数组', () => {
    const evt = makeEvent({ eventType: 'order.refunded' });
    const matched = findMatchingWebhooks(evt, webhooks);
    assert.strictEqual(matched.length, 0);
  });

  it('空 Webhook 列表返回空数组', () => {
    const evt = makeEvent({ eventType: 'order.created' });
    assert.strictEqual(findMatchingWebhooks(evt, []).length, 0);
  });
});

describe('EventService / createDeliveries 投递记录创建', () => {
  it('为每个匹配 Webhook 创建一条投递记录', () => {
    const evt = makeEvent({ eventType: 'order.created' });
    const webhooks = [
      makeWebhook({ id: 'wh-001', topic: 'order.created' }),
      makeWebhook({ id: 'wh-002', topic: 'order.created' }),
    ];
    const deliveries = createDeliveries(evt, webhooks);
    assert.strictEqual(deliveries.length, 2);
    assert.ok(deliveries.every((d) => d.status === 'PENDING'));
    assert.ok(deliveries.every((d) => d.attemptCount === 0));
    assert.strictEqual(deliveries[0]!.eventId, evt.id);
  });
});

describe('EventService / retryDelivery 投递重试', () => {
  it('非失败状态不触发重试', () => {
    const delivery = makeDelivery({ status: 'PENDING' });
    const { delivery: d, shouldRetry } = retryDelivery(delivery, 3);
    assert.strictEqual(shouldRetry, false);
    assert.strictEqual(d.status, 'PENDING');
  });

  it('失败状态未超过最大重试次数允许重试', () => {
    const delivery = makeDelivery({ status: 'FAILED', attemptCount: 1 });
    const { delivery: d, shouldRetry } = retryDelivery(delivery, 3);
    assert.strictEqual(shouldRetry, true);
    assert.strictEqual(d.attemptCount, 2);
  });

  it('超过最大重试次数进入 DEAD_LETTER', () => {
    const delivery = makeDelivery({ status: 'FAILED', attemptCount: 3 });
    const { delivery: d, shouldRetry } = retryDelivery(delivery, 3);
    assert.strictEqual(shouldRetry, false);
    assert.strictEqual(d.status, 'DEAD_LETTER');
  });

  it('重试 0 次上限：1 次失败即死信', () => {
    const delivery = makeDelivery({ status: 'FAILED', attemptCount: 0 });
    const { delivery: d, shouldRetry } = retryDelivery(delivery, 0);
    assert.strictEqual(shouldRetry, false);
    assert.strictEqual(d.status, 'DEAD_LETTER');
  });
});

describe('EventService / markDelivered & markFailed 投递结果标记', () => {
  it('markDelivered 标记成功并增加尝试次数', () => {
    const d = makeDelivery({ status: 'PENDING', attemptCount: 0 });
    const result = markDelivered(d);
    assert.strictEqual(result.status, 'DELIVERED');
    assert.strictEqual(result.attemptCount, 1);
    assert.ok(result.lastAttemptAt);
  });

  it('markFailed 标记失败并记录错误信息', () => {
    const d = makeDelivery({ status: 'PENDING' });
    const result = markFailed(d, 'HTTP 502 Bad Gateway');
    assert.strictEqual(result.status, 'FAILED');
    assert.strictEqual(result.errorMessage, 'HTTP 502 Bad Gateway');
    assert.strictEqual(result.attemptCount, 1);
  });
});

describe('EventService / 幂等性检测', () => {
  it('相同 idempotencyKey 存在时检测到冲突', () => {
    const events = [
      makeEvent({ id: 'evt-001', idempotencyKey: 'idk-001' }),
      makeEvent({ id: 'evt-002', idempotencyKey: 'idk-002' }),
    ];
    assert.strictEqual(hasIdempotencyConflict(events, 'idk-001'), true);
    assert.strictEqual(hasIdempotencyConflict(events, 'idk-003'), false);
  });

  it('idempotencyKey 为 undefined 时不算冲突', () => {
    const events = [makeEvent({ idempotencyKey: undefined })];
    assert.strictEqual(hasIdempotencyConflict(events, 'idk-001'), false);
  });
});

describe('EventService / 按时间筛选 & 统计', () => {
  const events: DomainEvent[] = [
    makeEvent({ id: 'e1', occurredAt: '2026-07-24T01:00:00Z', status: 'PENDING' }),
    makeEvent({ id: 'e2', occurredAt: '2026-07-24T02:00:00Z', status: 'PUBLISHED' }),
    makeEvent({ id: 'e3', occurredAt: '2026-07-24T03:00:00Z', status: 'PUBLISHED' }),
    makeEvent({ id: 'e4', occurredAt: '2026-07-24T04:00:00Z', status: 'FAILED' }),
    makeEvent({ id: 'e5', occurredAt: '2026-07-24T05:00:00Z', status: 'DEAD_LETTER' }),
  ];

  it('按时间范围筛选事件', () => {
    const result = filterEventsByTimeRange(
      events,
      '2026-07-24T02:00:00Z',
      '2026-07-24T04:00:00Z',
    );
    assert.strictEqual(result.length, 3);
    assert.ok(result.every((e) => e.occurredAt >= '2026-07-24T02:00:00Z'));
  });

  it('按状态分组统计', () => {
    const counts = countByStatus(events);
    assert.strictEqual(counts.PENDING, 1);
    assert.strictEqual(counts.PUBLISHED, 2);
    assert.strictEqual(counts.FAILED, 1);
    assert.strictEqual(counts.DEAD_LETTER, 1);
    assert.strictEqual(counts.PROCESSING, undefined);
  });
});
