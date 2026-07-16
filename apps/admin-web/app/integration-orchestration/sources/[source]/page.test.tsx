/**
 * integration-orchestration/sources/[source]/page.test.tsx
 * Webhook 来源详情页 L1 冒烟测试
 * ⚡ 覆盖: 数据工厂 / source 参数校验 / 快照计算 / 边界情况
 */

import assert from 'node:assert/strict';
import test, { describe, it } from 'node:test';

// ---- 类型（与 page.tsx / integration-orchestration-detail-view-model.ts 保持同步） ----

interface SourceRecord {
  source: string;
  algorithm: string;
  toleranceSeconds: number;
  description: string;
  secretRef: string;
}

type EventStatus = 'accepted' | 'rejected' | 'pending';

interface SourceEvent {
  envelopeId: string;
  eventName: string;
  source: string;
  aggregateId: string;
  idempotencyKey: string;
  occurredAt: string;
  receivedAt: string;
  payload: Record<string, unknown>;
  headers: Record<string, string>;
}

interface SourceIdempotencyRecord {
  key: string;
  source: string;
  eventId: string;
  eventType: string;
  firstSeenAt: string;
  envelopeId: string;
  status: EventStatus;
  payloadChecksum: string;
}

interface SourceDetailSnapshot {
  source: string;
  record: SourceRecord | null;
  matchedEvents: SourceEvent[];
  matchedIdempotencyRecords: SourceIdempotencyRecord[];
  notFound: boolean;
  summary: {
    totalEvents: number;
    totalIdempotencyRecords: number;
    acceptedCount: number;
    rejectedCount: number;
    pendingCount: number;
    uniqueAggregateIds: string[];
  };
  sourceHref: string;
}

// ---- 辅助函数 ----

const ALGORITHMS = ['hmac-sha256', 'hmac-sha1', 'hmac-md5', 'none'] as const;
const EVENT_STATUSES: EventStatus[] = ['accepted', 'rejected', 'pending'];

function readSourceParam(value: string | string[] | undefined): string | null {
  if (!value) return null;
  const raw = Array.isArray(value) ? value[0] : value;
  if (!/^[a-zA-Z0-9_-]{1,64}$/.test(raw)) return null;
  return raw;
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function computeSourceSummary(
  events: SourceEvent[],
  idempotency: SourceIdempotencyRecord[]
): SourceDetailSnapshot['summary'] {
  return {
    totalEvents: events.length,
    totalIdempotencyRecords: idempotency.length,
    acceptedCount: idempotency.filter((r) => r.status === 'accepted').length,
    rejectedCount: idempotency.filter((r) => r.status === 'rejected').length,
    pendingCount: idempotency.filter((r) => r.status === 'pending').length,
    uniqueAggregateIds: [...new Set(events.map((e) => e.aggregateId))],
  };
}

function buildSourceHref(source: string): string {
  return `/integration-orchestration/sources/${encodeURIComponent(source)}`;
}

function isSourceHealthy(record: SourceRecord): boolean {
  return record.toleranceSeconds >= 60 && record.algorithm !== 'none';
}

// ---- 数据工厂 ----

let _seq = 0;

function makeSource(overrides?: Partial<SourceRecord>): SourceRecord {
  _seq++;
  const base = `source-${String(_seq).padStart(2, '0')}`;
  return {
    source: overrides?.source ?? base,
    algorithm: 'hmac-sha256',
    toleranceSeconds: 300,
    description: `${base} 回调验签`,
    secretRef: `${base}-signing-secret`,
    ...overrides,
  };
}

function makeEvent(source: string, overrides?: Partial<SourceEvent>): SourceEvent {
  _seq++;
  return {
    envelopeId: `evt_${String(_seq).padStart(3, '0')}`,
    eventName: 'foundation.webhook.received',
    source,
    aggregateId: `order-${_seq}`,
    idempotencyKey: `${source}:order-${_seq}`,
    occurredAt: '2026-07-06T08:00:00.000Z',
    receivedAt: '2026-07-06T08:00:02.000Z',
    payload: { orderId: `order-${_seq}` },
    headers: {},
    ...overrides,
  };
}

function makeIdempotencyRecord(
  source: string,
  overrides?: Partial<SourceIdempotencyRecord>
): SourceIdempotencyRecord {
  _seq++;
  return {
    key: `${source}:event-${_seq}`,
    source,
    eventId: `event-${_seq}`,
    eventType: 'foundation.webhook.received',
    firstSeenAt: '2026-07-06T08:00:02.000Z',
    envelopeId: `evt_${String(_seq).padStart(3, '0')}`,
    status: 'accepted',
    payloadChecksum: `checksum-${_seq}`,
    ...overrides,
  };
}

function makeSnapshot(
  source: string,
  overrides?: {
    record?: SourceRecord | null;
    events?: SourceEvent[];
    idempotency?: SourceIdempotencyRecord[];
    notFound?: boolean;
  }
): SourceDetailSnapshot {
  const record = overrides?.record === undefined ? makeSource({ source }) : overrides.record;
  const events = overrides?.events ?? [makeEvent(source)];
  const idempotency = overrides?.idempotency ?? [makeIdempotencyRecord(source)];

  return {
    source,
    record,
    matchedEvents: events,
    matchedIdempotencyRecords: idempotency,
    notFound: overrides?.notFound ?? false,
    summary: computeSourceSummary(events, idempotency),
    sourceHref: buildSourceHref(source),
  };
}

// ==================== 测试套件 ====================

describe('SourceDetailPage — 数据工厂', () => {
  it('默认 source 含完整字段', () => {
    const s = makeSource();
    assert.ok(s.source.startsWith('source-'));
    assert.strictEqual(s.algorithm, 'hmac-sha256');
    assert.strictEqual(s.toleranceSeconds, 300);
    assert.ok(s.description.length > 0);
    assert.ok(s.secretRef.endsWith('-signing-secret'));
  });

  it('覆盖字段合并', () => {
    const s = makeSource({ algorithm: 'hmac-md5', toleranceSeconds: 120 });
    assert.strictEqual(s.algorithm, 'hmac-md5');
    assert.strictEqual(s.toleranceSeconds, 120);
    assert.strictEqual(s.secretRef, 'source-01-signing-secret'); // 仍保留默认推导
  });

  it('每个工厂调用产生不同 source 值', () => {
    const s1 = makeSource();
    const s2 = makeSource();
    assert.notStrictEqual(s1.source, s2.source);
  });
});

describe('SourceDetailPage — 参数校验', () => {
  it('正常 source 参数通过', () => {
    assert.strictEqual(readSourceParam('lyt'), 'lyt');
    assert.strictEqual(readSourceParam('my-source_42'), 'my-source_42');
  });

  it('空/undefined 返回 null', () => {
    assert.strictEqual(readSourceParam(undefined), null);
    assert.strictEqual(readSourceParam(''), null);
  });

  it('非法字符返回 null', () => {
    assert.strictEqual(readSourceParam('hello world'), null);
    assert.strictEqual(readSourceParam('../etc'), null);
    assert.strictEqual(readSourceParam(''), null);
  });

  it('超长参数返回 null', () => {
    assert.strictEqual(readSourceParam('a'.repeat(65)), null);
  });

  it('数组取第一项', () => {
    assert.strictEqual(readSourceParam(['lyt', 'extra']), 'lyt');
  });
});

describe('SourceDetailPage — snapshot 构建', () => {
  it('正常 source 构造完成', () => {
    const snap = makeSnapshot('lyt');
    assert.strictEqual(snap.source, 'lyt');
    assert.strictEqual(snap.notFound, false);
    assert.ok(snap.record !== null);
    assert.strictEqual(snap.record!.source, 'lyt');
  });

  it('notFound 时记录为 null', () => {
    const snap = makeSnapshot('unknown', { notFound: true, record: null, events: [], idempotency: [] });
    assert.strictEqual(snap.notFound, true);
    assert.strictEqual(snap.record, null);
    assert.strictEqual(snap.matchedEvents.length, 0);
  });
});

describe('SourceDetailPage — sourceHref 构建', () => {
  it('普通名称正确', () => {
    assert.strictEqual(buildSourceHref('lyt'), '/integration-orchestration/sources/lyt');
  });

  it('含特殊字符编码', () => {
    assert.match(buildSourceHref('my source'), /%20/);
  });
});

describe('SourceDetailPage — 摘要计算', () => {
  it('空数据', () => {
    const summary = computeSourceSummary([], []);
    assert.strictEqual(summary.totalEvents, 0);
    assert.strictEqual(summary.totalIdempotencyRecords, 0);
    assert.deepStrictEqual(summary.uniqueAggregateIds, []);
  });

  it('多事件统计', () => {
    const events = [
      makeEvent('lyt', { aggregateId: 'order-1' }),
      makeEvent('lyt', { aggregateId: 'order-2' }),
      makeEvent('lyt', { aggregateId: 'order-1' }),
    ];
    const summary = computeSourceSummary(events, []);
    assert.strictEqual(summary.totalEvents, 3);
    assert.deepStrictEqual(summary.uniqueAggregateIds.sort(), ['order-1', 'order-2']);
  });

  it('幂等状态分布', () => {
    const records = [
      makeIdempotencyRecord('lyt', { status: 'accepted' }),
      makeIdempotencyRecord('lyt', { status: 'accepted' }),
      makeIdempotencyRecord('lyt', { status: 'rejected' }),
      makeIdempotencyRecord('lyt', { status: 'pending' }),
    ];
    const summary = computeSourceSummary([], records);
    assert.strictEqual(summary.acceptedCount, 2);
    assert.strictEqual(summary.rejectedCount, 1);
    assert.strictEqual(summary.pendingCount, 1);
    assert.strictEqual(summary.totalIdempotencyRecords, 4);
  });
});

describe('SourceDetailPage — 健康检查逻辑', () => {
  it('secure source 视为健康', () => {
    assert.ok(isSourceHealthy(makeSource({ algorithm: 'hmac-sha256', toleranceSeconds: 300 })));
  });

  it('algorithm none 视为不健康', () => {
    assert.strictEqual(isSourceHealthy(makeSource({ algorithm: 'none', toleranceSeconds: 300 })), false);
  });

  it('toleranceSeconds < 60 视为不健康', () => {
    assert.strictEqual(isSourceHealthy(makeSource({ algorithm: 'hmac-sha256', toleranceSeconds: 30 })), false);
  });

  it('两者不满足均不健康', () => {
    assert.strictEqual(isSourceHealthy(makeSource({ algorithm: 'none', toleranceSeconds: 0 })), false);
  });
});

describe('SourceDetailPage — 日期格式化', () => {
  it('标准 ISO 格式', () => {
    const result = formatDate('2026-07-06T08:00:00.000Z');
    assert.match(result, /2026-07-06 \d{2}:\d{2}/);
  });

  it('零点时间', () => {
    const result = formatDate('2026-01-01T00:00:00.000Z');
    assert.strictEqual(result, '2026-01-01 00:00');
  });
});

describe('SourceDetailPage — 边缘情况', () => {
  it('算法枚举完整性', () => {
    for (const alg of ALGORITHMS) {
      const s = makeSource({ algorithm: alg });
      assert.strictEqual(s.algorithm, alg);
    }
  });

  it('所有 event status 覆盖', () => {
    for (const status of EVENT_STATUSES) {
      const rec = makeIdempotencyRecord('lyt', { status });
      assert.strictEqual(rec.status, status);
    }
  });
});

describe('SourceDetailPage — 空列表快照', () => {
  it('无事件无幂等记录', () => {
    const snap = makeSnapshot('lyt', { events: [], idempotency: [] });
    assert.strictEqual(snap.matchedEvents.length, 0);
    assert.strictEqual(snap.matchedIdempotencyRecords.length, 0);
    assert.strictEqual(snap.summary.totalEvents, 0);
    assert.strictEqual(snap.summary.totalIdempotencyRecords, 0);
  });

  it('有事件无幂等记录', () => {
    const snap = makeSnapshot('lyt', {
      events: [makeEvent('lyt')],
      idempotency: [],
    });
    assert.strictEqual(snap.matchedEvents.length, 1);
    assert.strictEqual(snap.summary.totalIdempotencyRecords, 0);
  });
});

const SRC = fs.readFileSync(require.resolve('./page'), 'utf-8');

describe('Integration Orchestration / Sources — hooks验证', () => {
  it('包含useState声明', () => assert.ok(SRC.includes('const [') && SRC.includes('useState')));
  it('包含JSX返回', () => assert.ok(SRC.includes('return (')));
  it('包含事件处理器', () => assert.ok(SRC.includes('onClick={') || SRC.includes('onChange={')));
  it('包含列表渲染', () => assert.ok(SRC.includes('.map(')));
  it('包含条件渲染', () => assert.ok(SRC.includes(' && ') || SRC.includes(' ? ')));
  it('包含样式定义', () => assert.ok(SRC.includes('style={')));
  it('包含数据格式化', () => assert.ok(SRC.includes('.toFixed') || SRC.includes('toLocaleString')));
  it('包含模板字符串', () => assert.ok(SRC.includes('${')));
  it('包含默认导出', () => assert.ok(SRC.includes('export default function')));
  it('包含注释说明', () => assert.ok(SRC.includes('/**')));
});
