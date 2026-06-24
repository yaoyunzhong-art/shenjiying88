/**
 * store-events unit tests — storefront-web
 *
 * 覆盖: 门店活动数据完整性 / 活动状态 / 报名逻辑 / 时间冲突 / 空状态 / 错误状态
 * L1 JMeter 风格: 正例 + 反例 + 边界
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

type EventType = 'promotion' | 'workshop' | 'tasting' | 'holiday' | 'member_day' | 'launch';
type EventStatus = 'upcoming' | 'ongoing' | 'ended' | 'cancelled';
type EventAudience = 'all' | 'members_only' | 'vip_only' | 'invited';

interface StoreEvent {
  eventId: string;
  title: string;
  description: string;
  type: EventType;
  status: EventStatus;
  audience: EventAudience;
  storeCode: string;
  storeName: string;
  startTime: string;
  endTime: string;
  maxParticipants: number;
  currentParticipants: number;
  requireRegistration: boolean;
  pointsReward: number;
  tags: string[];
  coverImageUrl: string;
  createdAt: string;
}

const EVENT_TYPES: EventType[] = ['promotion', 'workshop', 'tasting', 'holiday', 'member_day', 'launch'];
const EVENT_STATUSES: EventStatus[] = ['upcoming', 'ongoing', 'ended', 'cancelled'];
const EVENT_AUDIENCES: EventAudience[] = ['all', 'members_only', 'vip_only', 'invited'];

const MOCK_STORE_EVENTS: StoreEvent[] = [
  {
    eventId: 'evt-001', title: '夏日清凉特卖会', description: '全场饮品8折',
    type: 'promotion', status: 'ongoing', audience: 'all',
    storeCode: 'store-001', storeName: 'Demo Store 旗舰店',
    startTime: '2026-06-20T10:00:00Z', endTime: '2026-07-20T22:00:00Z',
    maxParticipants: 500, currentParticipants: 234, requireRegistration: false, pointsReward: 0,
    tags: ['夏日'], coverImageUrl: '', createdAt: '2026-06-15T08:00:00Z',
  },
  {
    eventId: 'evt-002', title: '手工面包烘焙工坊', description: '学做面包',
    type: 'workshop', status: 'upcoming', audience: 'members_only',
    storeCode: 'store-001', storeName: 'Demo Store 旗舰店',
    startTime: '2026-07-01T14:00:00Z', endTime: '2026-07-01T17:00:00Z',
    maxParticipants: 20, currentParticipants: 15, requireRegistration: true, pointsReward: 50,
    tags: ['烘焙'], coverImageUrl: '', createdAt: '2026-06-10T10:00:00Z',
  },
  {
    eventId: 'evt-003', title: '进口咖啡品鉴会', description: '品鉴精品咖啡',
    type: 'tasting', status: 'upcoming', audience: 'vip_only',
    storeCode: 'store-002', storeName: 'Demo Store 社区店',
    startTime: '2026-07-05T15:00:00Z', endTime: '2026-07-05T17:30:00Z',
    maxParticipants: 15, currentParticipants: 12, requireRegistration: true, pointsReward: 100,
    tags: ['咖啡'], coverImageUrl: '', createdAt: '2026-06-12T09:00:00Z',
  },
  {
    eventId: 'evt-004', title: '端午会员日', description: '粽子DIY',
    type: 'member_day', status: 'ended', audience: 'members_only',
    storeCode: 'store-001', storeName: 'Demo Store 旗舰店',
    startTime: '2026-05-31T10:00:00Z', endTime: '2026-05-31T22:00:00Z',
    maxParticipants: 200, currentParticipants: 198, requireRegistration: true, pointsReward: 200,
    tags: ['端午'], coverImageUrl: '', createdAt: '2026-05-20T08:00:00Z',
  },
  {
    eventId: 'evt-005', title: '智能手环发布会', description: '新品发布',
    type: 'launch', status: 'upcoming', audience: 'all',
    storeCode: 'store-001', storeName: 'Demo Store 旗舰店',
    startTime: '2026-07-10T10:00:00Z', endTime: '2026-07-10T12:00:00Z',
    maxParticipants: 100, currentParticipants: 45, requireRegistration: false, pointsReward: 0,
    tags: ['新品'], coverImageUrl: '', createdAt: '2026-06-18T14:00:00Z',
  },
  {
    eventId: 'evt-006', title: '七夕礼盒特惠', description: '限时优惠',
    type: 'holiday', status: 'upcoming', audience: 'all',
    storeCode: 'store-002', storeName: 'Demo Store 社区店',
    startTime: '2026-08-01T00:00:00Z', endTime: '2026-08-07T23:59:00Z',
    maxParticipants: 300, currentParticipants: 0, requireRegistration: false, pointsReward: 0,
    tags: ['七夕'], coverImageUrl: '', createdAt: '2026-06-22T10:00:00Z',
  },
  {
    eventId: 'evt-007', title: '春茶品鉴分享会', description: '龙井品鉴',
    type: 'tasting', status: 'cancelled', audience: 'invited',
    storeCode: 'store-001', storeName: 'Demo Store 旗舰店',
    startTime: '2026-06-15T14:00:00Z', endTime: '2026-06-15T16:00:00Z',
    maxParticipants: 20, currentParticipants: 8, requireRegistration: true, pointsReward: 80,
    tags: ['茶'], coverImageUrl: '', createdAt: '2026-06-01T08:00:00Z',
  },
  {
    eventId: 'evt-008', title: '国庆黄金周大促', description: '满299减50',
    type: 'holiday', status: 'upcoming', audience: 'all',
    storeCode: 'store-001', storeName: 'Demo Store 旗舰店',
    startTime: '2026-09-30T10:00:00Z', endTime: '2026-10-07T22:00:00Z',
    maxParticipants: 1000, currentParticipants: 0, requireRegistration: false, pointsReward: 0,
    tags: ['国庆'], coverImageUrl: '', createdAt: '2026-06-20T10:00:00Z',
  },
];

// ── Utility functions (inlined from view-model/helpers) ──

function hasTimeConflict(a: { startTime: string; endTime: string }, b: { startTime: string; endTime: string }): boolean {
  const aStart = new Date(a.startTime).getTime();
  const aEnd = new Date(a.endTime).getTime();
  const bStart = new Date(b.startTime).getTime();
  const bEnd = new Date(b.endTime).getTime();
  return aStart < bEnd && bStart < aEnd;
}

function isEventFull(event: StoreEvent): boolean {
  return event.currentParticipants >= event.maxParticipants;
}

function canRegister(event: StoreEvent): boolean {
  if (event.status !== 'upcoming' && event.status !== 'ongoing') return false;
  if (!event.requireRegistration) return false;
  return event.currentParticipants < event.maxParticipants;
}

function filterEventsByDate(events: StoreEvent[], from: string, to: string): StoreEvent[] {
  const ft = new Date(from).getTime();
  const tt = new Date(to).getTime();
  return events.filter(e => {
    const eStart = new Date(e.startTime).getTime();
    const eEnd = new Date(e.endTime).getTime();
    return eStart <= tt && eEnd >= ft;
  });
}

function sortEventsByTime(events: StoreEvent[]): StoreEvent[] {
  return [...events].sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
}

function getEventsByStatus(events: StoreEvent[], status: EventStatus): StoreEvent[] {
  return events.filter(e => e.status === status);
}

function getEventsByType(events: StoreEvent[], type: EventType): StoreEvent[] {
  return events.filter(e => e.type === type);
}

// ===== 正例 =====

describe('store-events: 正例 — 数据完整性', () => {
  it('应当包含至少 8 个模拟活动', () => {
    assert.ok(MOCK_STORE_EVENTS.length >= 8);
  });

  it('每个活动必须有合法的 type / status / audience', () => {
    for (const e of MOCK_STORE_EVENTS) {
      assert.ok(EVENT_TYPES.includes(e.type), `event ${e.eventId} invalid type`);
      assert.ok(EVENT_STATUSES.includes(e.status), `event ${e.eventId} invalid status`);
      assert.ok(EVENT_AUDIENCES.includes(e.audience), `event ${e.eventId} invalid audience`);
    }
  });

  it('每个活动的时间范围必须合法 (start <= end)', () => {
    for (const e of MOCK_STORE_EVENTS) {
      const start = new Date(e.startTime).getTime();
      const end = new Date(e.endTime).getTime();
      assert.ok(start <= end, `event ${e.eventId}: start > end`);
    }
  });

  it('currentParticipants 不得大于 maxParticipants', () => {
    for (const e of MOCK_STORE_EVENTS) {
      assert.ok(e.currentParticipants <= e.maxParticipants, `event ${e.eventId}: participants overflow`);
    }
  });

  it('按 status 分组后计数之和应等于总数', () => {
    const sum = EVENT_STATUSES.reduce((a, s) => a + MOCK_STORE_EVENTS.filter(e => e.status === s).length, 0);
    assert.equal(sum, MOCK_STORE_EVENTS.length);
  });

  it('按 type 分组后计数之和应等于总数', () => {
    const sum = EVENT_TYPES.reduce((a, t) => a + MOCK_STORE_EVENTS.filter(e => e.type === t).length, 0);
    assert.equal(sum, MOCK_STORE_EVENTS.length);
  });
});

describe('store-events: 正例 — 报名逻辑', () => {
  it('upcoming + requireRegistration + 有名额 → 可报名', () => {
    const registerable = MOCK_STORE_EVENTS.filter(e => e.status === 'upcoming' && e.requireRegistration && e.currentParticipants < e.maxParticipants);
    for (const e of registerable) {
      assert.equal(canRegister(e), true);
    }
  });

  it('不要求注册的活动 shouldRegister = false', () => {
    const notReq = MOCK_STORE_EVENTS.filter(e => !e.requireRegistration);
    for (const e of notReq) {
      assert.equal(canRegister(e), false);
    }
  });
});

describe('store-events: 正例 — 时间过滤', () => {
  it('日期过滤应当在 7 月范围内正确返回', () => {
    const july = filterEventsByDate(MOCK_STORE_EVENTS, '2026-07-01', '2026-07-31');
    const jul1 = new Date('2026-07-01').getTime();
    const jul31 = new Date('2026-07-31').getTime();
    for (const e of july) {
      const eStart = new Date(e.startTime).getTime();
      const eEnd = new Date(e.endTime).getTime();
      assert.ok(eStart <= jul31 && eEnd >= jul1, `event ${e.eventId} outside July`);
    }
  });

  it('排序后 startTime 必须递增', () => {
    const sorted = sortEventsByTime(MOCK_STORE_EVENTS);
    for (let i = 1; i < sorted.length; i++) {
      const prev = new Date(sorted[i - 1]!.startTime).getTime();
      const curr = new Date(sorted[i]!.startTime).getTime();
      assert.ok(curr >= prev);
    }
  });

  it('排序不应修改原始数组', () => {
    const original = [...MOCK_STORE_EVENTS];
    sortEventsByTime(MOCK_STORE_EVENTS);
    assert.deepEqual(MOCK_STORE_EVENTS, original);
  });
});

describe('store-events: 正例 — 时间冲突检测', () => {
  it('重叠时段应返回 true', () => {
    // evt-001: 06-20 ~ 07-20, evt-002: 07-01 ~ 07-01 → 重叠
    assert.equal(hasTimeConflict(MOCK_STORE_EVENTS[0]!, MOCK_STORE_EVENTS[1]!), true);
  });

  it('不重叠时段应返回 false', () => {
    // evt-005: 07-10 ~ 07-10, evt-006: 08-01 ~ 08-07 → 不重叠
    assert.equal(hasTimeConflict(MOCK_STORE_EVENTS[4]!, MOCK_STORE_EVENTS[5]!), false);
  });

  it('一个活动完全包含另一个应返回 true', () => {
    assert.equal(hasTimeConflict(
      { startTime: '2026-07-01T00:00:00Z', endTime: '2026-07-31T23:59:00Z' },
      { startTime: '2026-07-10T00:00:00Z', endTime: '2026-07-15T00:00:00Z' },
    ), true);
  });
});

// ===== 反例 =====

describe('store-events: 反例 — 无效状态处理', () => {
  it('cancelled 活动不可报名', () => {
    const cancelled = getEventsByStatus(MOCK_STORE_EVENTS, 'cancelled');
    for (const e of cancelled) {
      assert.equal(canRegister(e), false, `cancelled event ${e.eventId} should not be registerable`);
    }
  });

  it('ended 活动不可报名', () => {
    const ended = getEventsByStatus(MOCK_STORE_EVENTS, 'ended');
    for (const e of ended) {
      assert.equal(canRegister(e), false, `ended event ${e.eventId} should not be registerable`);
    }
  });

  it('已满活动不可报名', () => {
    const full = MOCK_STORE_EVENTS.filter(e => isEventFull(e));
    for (const e of full) {
      assert.equal(canRegister(e), false, `full event ${e.eventId} should not be registerable`);
    }
  });
});

describe('store-events: 反例 — 空列表', () => {
  it('空活动列表应当不包含任何项目', () => {
    const empty: StoreEvent[] = [];
    assert.equal(empty.length, 0);
  });

  it('空列表的日期过滤应返回空', () => {
    const result = filterEventsByDate([], '2026-01-01', '2026-12-31');
    assert.equal(result.length, 0);
  });

  it('空列表的排序应返回空', () => {
    const result = sortEventsByTime([]);
    assert.equal(result.length, 0);
  });
});

// ===== 边界 =====

describe('store-events: 边界 — 紧邻时间', () => {
  it('紧邻不重叠 (一个结束 = 另一个开始) 应返回 false', () => {
    assert.equal(hasTimeConflict(
      { startTime: '2026-07-01T10:00:00Z', endTime: '2026-07-01T12:00:00Z' },
      { startTime: '2026-07-01T12:00:00Z', endTime: '2026-07-01T14:00:00Z' },
    ), false);
  });

  it('完全相同的时间段应返回 true', () => {
    assert.equal(hasTimeConflict(
      { startTime: '2026-07-01T10:00:00Z', endTime: '2026-07-01T12:00:00Z' },
      { startTime: '2026-07-01T10:00:00Z', endTime: '2026-07-01T12:00:00Z' },
    ), true);
  });
});

describe('store-events: 边界 — 报名人数边界', () => {
  it('活动刚好满 (current = max) → isEventFull = true, canRegister = false', () => {
    const fullEvent: StoreEvent = {
      eventId: 'edge-full', title: '满员测试', description: '',
      type: 'workshop', status: 'upcoming', audience: 'all',
      storeCode: 'store-001', storeName: '边缘门店',
      startTime: '2026-08-01T10:00:00Z', endTime: '2026-08-01T12:00:00Z',
      maxParticipants: 30, currentParticipants: 30, requireRegistration: true, pointsReward: 0,
      tags: [], coverImageUrl: '', createdAt: '2026-07-01T00:00:00Z',
    };
    assert.equal(isEventFull(fullEvent), true);
    assert.equal(canRegister(fullEvent), false);
  });

  it('活动空 (current = 0) → isEventFull = false, 若报名开放则可注册', () => {
    const emptyEvent: StoreEvent = {
      eventId: 'edge-empty', title: '空场测试', description: '',
      type: 'tasting', status: 'upcoming', audience: 'all',
      storeCode: 'store-001', storeName: '边缘门店',
      startTime: '2026-08-10T14:00:00Z', endTime: '2026-08-10T16:00:00Z',
      maxParticipants: 20, currentParticipants: 0, requireRegistration: true, pointsReward: 10,
      tags: [], coverImageUrl: '', createdAt: '2026-07-15T00:00:00Z',
    };
    assert.equal(isEventFull(emptyEvent), false);
    assert.equal(canRegister(emptyEvent), true);
  });

  it('活动人数为负数不应影响检测逻辑', () => {
    const negEvent: StoreEvent = {
      eventId: 'edge-neg', title: '负数测试', description: '',
      type: 'promotion', status: 'upcoming', audience: 'all',
      storeCode: 'store-001', storeName: '边缘门店',
      startTime: '2026-08-01T10:00:00Z', endTime: '2026-08-01T12:00:00Z',
      maxParticipants: 50, currentParticipants: -5, requireRegistration: true, pointsReward: 0,
      tags: [], coverImageUrl: '', createdAt: '2026-07-01T00:00:00Z',
    };
    assert.equal(isEventFull(negEvent), false);
    assert.equal(canRegister(negEvent), true);
  });
});
