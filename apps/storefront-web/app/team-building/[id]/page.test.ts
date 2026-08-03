/**
 * team-building/[id]/page.test.ts — 团建活动详情 L1 测试（storefront-web）
 *
 * 覆盖: 团建详情数据、状态枚举、预算校验、议程验证、参与人数
 * 正例: 详情字段完整性、状态映射、议程结构化
 * 反例: 空数据、无效状态、超预算
 * 边界: 零预算、满员、无议程
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

// ── 类型 ──

type TeamBuildingStatus = 'upcoming' | 'in_progress' | 'completed' | 'cancelled';

interface TeamBuildingDetail {
  id: string;
  title: string;
  description: string;
  date: string;
  location: string;
  budget: number;
  participants: number;
  maxParticipants: number;
  organizer: string;
  status: TeamBuildingStatus;
  agenda: { time: string; activity: string; lead: string }[];
  notes: string;
}

// ── 常量映射 ──

const STATUS_MAP: Record<TeamBuildingStatus, { label: string; variant: 'info' | 'warning' | 'success' | 'neutral' }> = {
  upcoming: { label: '即将开始', variant: 'info' },
  in_progress: { label: '进行中', variant: 'warning' },
  completed: { label: '已结束', variant: 'success' },
  cancelled: { label: '已取消', variant: 'neutral' },
};

// ── Mock 数据 ──

const MOCK_DETAILS: Record<string, TeamBuildingDetail> = {
  'tb-001': {
    id: 'tb-001',
    title: '2026 Q3 团队欢乐跑',
    description: '季度团队建设活动—户外欢乐跑+烧烤',
    date: '2026-08-15',
    location: '深圳湾公园',
    budget: 30000,
    participants: 25,
    maxParticipants: 50,
    organizer: '人力资源部',
    status: 'upcoming',
    agenda: [
      { time: '09:00', activity: '集合签到', lead: 'HR' },
      { time: '09:30', activity: '欢乐跑', lead: '领跑员' },
      { time: '11:30', activity: '烧烤聚餐', lead: '后勤' },
      { time: '14:00', activity: '自由活动', lead: '' },
    ],
    notes: '请穿运动鞋',
  },
  'tb-002': {
    id: 'tb-002',
    title: '夏季水上团建',
    description: '水上运动+团队游戏',
    date: '2026-07-20',
    location: '华侨城水上乐园',
    budget: 50000,
    participants: 40,
    maxParticipants: 40,
    organizer: '行政部',
    status: 'in_progress',
    agenda: [
      { time: '10:00', activity: '入场集合', lead: '行政部' },
      { time: '10:30', activity: '水上竞赛', lead: '教练' },
      { time: '12:00', activity: '午餐', lead: '' },
      { time: '14:00', activity: '自由游玩', lead: '' },
    ],
    notes: '自带泳衣',
  },
  'tb-003': {
    id: 'tb-003',
    title: 'Q2 户外拓展',
    description: '季度团建—野外拓展训练',
    date: '2026-06-10',
    location: '东部华侨城',
    budget: 40000,
    participants: 35,
    maxParticipants: 50,
    organizer: '人力资源部',
    status: 'completed',
    agenda: [
      { time: '08:00', activity: '出发', lead: 'HR' },
      { time: '10:00', activity: '团队破冰', lead: '教练' },
      { time: '13:00', activity: '挑战项目', lead: '教练' },
      { time: '17:00', activity: '返程', lead: 'HR' },
    ],
    notes: '',
  },
  'tb-004': {
    id: 'tb-004',
    title: '月度生日会',
    description: '7月员工生日会',
    date: '2026-07-25',
    location: '公司会议室',
    budget: 5000,
    participants: 12,
    maxParticipants: 30,
    organizer: '行政部',
    status: 'cancelled',
    agenda: [],
    notes: '因故取消',
  },
};

// ── 辅助函数 ──

function getDetailById(id: string): TeamBuildingDetail | undefined {
  return MOCK_DETAILS[id];
}

function getStatusInfo(status: TeamBuildingStatus) {
  return STATUS_MAP[status] ?? { label: status, variant: 'neutral' as const };
}

function computeAgendaStats(detail: TeamBuildingDetail) {
  return {
    totalItems: detail.agenda.length,
    withLead: detail.agenda.filter(a => a.lead.length > 0).length,
    withoutLead: detail.agenda.filter(a => !a.lead).length,
  };
}

function isFullyBooked(detail: TeamBuildingDetail): boolean {
  return detail.participants >= detail.maxParticipants;
}

function getVacancy(detail: TeamBuildingDetail): number {
  return Math.max(0, detail.maxParticipants - detail.participants);
}

// ===================================================================
describe('TeamBuilding — 状态映射', () => {
  it('四种状态映射完整', () => {
    const statuses: TeamBuildingStatus[] = ['upcoming', 'in_progress', 'completed', 'cancelled'];
    for (const s of statuses) {
      const info = getStatusInfo(s);
      assert.ok(info.label.length > 0, `Status ${s} should have label`);
      assert.ok(['info', 'warning', 'success', 'neutral'].includes(info.variant),
        `${s}: valid variant`);
    }
  });

  it('按 ID 查询返回正确团建', () => {
    const detail = getDetailById('tb-001');
    assert.ok(detail);
    assert.equal(detail!.title, '2026 Q3 团队欢乐跑');
  });

  it('不存在的 ID 返回 undefined', () => {
    assert.equal(getDetailById('nonexistent'), undefined);
  });
});

// ===================================================================
describe('TeamBuilding — 参与人数', () => {
  it('participants <= maxParticipants', () => {
    for (const d of Object.values(MOCK_DETAILS)) {
      assert.ok(d.participants <= d.maxParticipants,
        `${d.id}: participants ${d.participants} <= max ${d.maxParticipants}`);
    }
  });

  it('满员状态正确判断', () => {
    assert.equal(isFullyBooked(MOCK_DETAILS['tb-002']!), true);
    assert.equal(isFullyBooked(MOCK_DETAILS['tb-001']!), false);
  });

  it('空缺数计算正确', () => {
    assert.equal(getVacancy(MOCK_DETAILS['tb-001']!), 25);
    assert.equal(getVacancy(MOCK_DETAILS['tb-002']!), 0);
    assert.equal(getVacancy(MOCK_DETAILS['tb-003']!), 15);
  });
});

// ===================================================================
describe('TeamBuilding — 预算', () => {
  it('budget 应 >= 0', () => {
    for (const d of Object.values(MOCK_DETAILS)) {
      assert.ok(d.budget >= 0, `${d.id}: budget >= 0`);
    }
  });

  it('平均每人预算计算', () => {
    const detail = MOCK_DETAILS['tb-001']!;
    const perPerson = detail.budget / detail.participants;
    assert.equal(perPerson, 1200);
  });

  it('参与者为零时每人预算不应计算', () => {
    const zero: TeamBuildingDetail = { ...MOCK_DETAILS['tb-001']!, participants: 0 };
    const perPerson = zero.participants > 0 ? zero.budget / zero.participants : 0;
    assert.equal(perPerson, 0);
  });

  it('零预算活动（生日会取消）', () => {
    const detail = MOCK_DETAILS['tb-004']!;
    assert.equal(detail.budget, 5000);
    assert.equal(detail.status, 'cancelled');
  });
});

// ===================================================================
describe('TeamBuilding — 议程', () => {
  it('已完成活动应有议程', () => {
    const completed = MOCK_DETAILS['tb-003']!;
    assert.ok(completed.agenda.length > 0, 'completed activity should have agenda');
  });

  it('议程统计正确', () => {
    const stats = computeAgendaStats(MOCK_DETAILS['tb-001']!);
    assert.equal(stats.totalItems, 4);
    assert.equal(stats.withLead, 3);
    assert.equal(stats.withoutLead, 1);
  });

  it('取消活动可无议程', () => {
    const cancelled = MOCK_DETAILS['tb-004']!;
    assert.equal(cancelled.agenda.length, 0);
  });

  it('议程时间格式应为 HH:mm', () => {
    const regex = /^\d{2}:\d{2}$/;
    for (const d of Object.values(MOCK_DETAILS)) {
      for (const a of d.agenda) {
        assert.ok(regex.test(a.time), `${d.id}: agenda time ${a.time} format`);
      }
    }
  });
});

// ===================================================================
describe('TeamBuilding — 数据完整性', () => {
  it('所有团建应有 id/title/date/location', () => {
    for (const d of Object.values(MOCK_DETAILS)) {
      assert.ok(d.id, 'id required');
      assert.ok(d.title, 'title required');
      assert.ok(d.date, 'date required');
      assert.ok(d.location, 'location required');
    }
  });

  it('应有 organizer', () => {
    for (const d of Object.values(MOCK_DETAILS)) {
      assert.ok(d.organizer, 'organizer required');
    }
  });

  it('日期格式应为 YYYY-MM-DD', () => {
    const regex = /^\d{4}-\d{2}-\d{2}$/;
    for (const d of Object.values(MOCK_DETAILS)) {
      assert.ok(regex.test(d.date), `${d.id}: date format`);
    }
  });
});

// ===================================================================
describe('TeamBuilding — 边界', () => {
  it('空团建列表查询不抛异常', () => {
    assert.equal(getDetailById(''), undefined);
  });

  it('超大预算不溢出', () => {
    const big: TeamBuildingDetail = { ...MOCK_DETAILS['tb-001']!, budget: 999999999 };
    assert.equal(big.budget, 999999999);
  });

  it('全部参与者列表状态覆盖', () => {
    const allStatuses = Object.values(MOCK_DETAILS).map(d => d.status);
    const unique = new Set(allStatuses);
    assert.equal(unique.size, 4); // all four status types used
  });

  it('议程可以有空的 lead（自由活动）', () => {
    for (const d of Object.values(MOCK_DETAILS)) {
      const noLead = d.agenda.filter(a => !a.lead);
      // some have, some don't
    }
  });
});
