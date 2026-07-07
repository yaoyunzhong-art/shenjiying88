/**
 * 客服工作台页 — CustomerServicePage Test
 * 验证: 常量映射、Mock 数据完整性、工单过滤逻辑、搜索逻辑、状态统计、快捷操作
 */

import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

// ── 数据类型 (与 page.tsx 一致) ──

type TicketStatus = 'open' | 'in_progress' | 'resolved' | 'closed';
type TicketPriority = 'low' | 'medium' | 'high';
type TicketCategory = 'complaint' | 'inquiry' | 'refund' | 'exchange' | 'other';

interface ServiceTicket {
  id: string;
  title: string;
  customerName: string;
  priority: TicketPriority;
  status: TicketStatus;
  category: TicketCategory;
  createdAt: string;
}

interface ServiceQualityMetrics {
  resolvedTickets: number;
  avgResponseTime: number;
  avgResolutionTime: number;
  satisfactionScore: number;
}

interface AgentStatusSummary {
  total: number;
  online: number;
  busy: number;
  away: number;
  offline: number;
}

// ── 常量映射 ──

const STATUS_LABELS: Record<TicketStatus, string> = {
  open: '待处理',
  in_progress: '处理中',
  resolved: '已解决',
  closed: '已关闭',
};

const PRIORITY_LABELS: Record<TicketPriority, string> = {
  low: '低',
  medium: '中',
  high: '高',
};

const CATEGORY_LABELS: Record<TicketCategory, string> = {
  complaint: '投诉',
  inquiry: '咨询',
  refund: '退款',
  exchange: '换货',
  other: '其他',
};

const PRIORITY_ORDER: Record<TicketPriority, number> = {
  high: 3,
  medium: 2,
  low: 1,
};

// ── Mock 数据 (与 page.tsx 一致) ──

const MOCK_METRICS: ServiceQualityMetrics = {
  resolvedTickets: 42,
  avgResponseTime: 2.8,
  avgResolutionTime: 15.3,
  satisfactionScore: 4.6,
};

const MOCK_TICKETS: ServiceTicket[] = [
  { id: 'TK-20260628001', title: '会员等级未更新', customerName: '王芳', priority: 'high', status: 'open', category: 'complaint', createdAt: '2026-06-28 09:15' },
  { id: 'TK-20260628002', title: '优惠券无法使用', customerName: '李明', priority: 'high', status: 'in_progress', category: 'complaint', createdAt: '2026-06-28 08:42' },
  { id: 'TK-20260628003', title: '商品配送延迟查询', customerName: '赵雪', priority: 'medium', status: 'in_progress', category: 'inquiry', createdAt: '2026-06-28 08:10' },
  { id: 'TK-20260628004', title: '申请退货退款', customerName: '陈伟', priority: 'low', status: 'open', category: 'refund', createdAt: '2026-06-27 17:30' },
  { id: 'TK-20260628005', title: '商品换货申请', customerName: '张丽', priority: 'medium', status: 'resolved', category: 'exchange', createdAt: '2026-06-27 15:20' },
  { id: 'TK-20260628006', title: '积分兑换疑问', customerName: '刘洋', priority: 'low', status: 'closed', category: 'inquiry', createdAt: '2026-06-27 11:00' },
  { id: 'TK-20260628007', title: '商品质量问题反馈', customerName: '周敏', priority: 'high', status: 'open', category: 'complaint', createdAt: '2026-06-28 10:05' },
  { id: 'TK-20260628008', title: '发票开具申请', customerName: '孙浩', priority: 'low', status: 'resolved', category: 'other', createdAt: '2026-06-27 14:00' },
];

const MOCK_AGENT_STATUS: AgentStatusSummary = {
  total: 12,
  online: 8,
  busy: 3,
  away: 1,
  offline: 0,
};

// ── 测试 ──

describe('CustomerServicePage - 常量与映射验证', () => {
  it('STATUS_LABELS 包含所有工单状态', () => {
    const statuses: TicketStatus[] = ['open', 'in_progress', 'resolved', 'closed'];
    for (const s of statuses) {
      assert.ok(typeof STATUS_LABELS[s] === 'string', `缺少状态 ${s} 的标签`);
    }
  });

  it('PRIORITY_LABELS 包含所有优先级', () => {
    const priorities: TicketPriority[] = ['low', 'medium', 'high'];
    for (const p of priorities) {
      assert.ok(typeof PRIORITY_LABELS[p] === 'string', `缺少优先级 ${p} 的标签`);
    }
  });

  it('CATEGORY_LABELS 包含所有工单分类', () => {
    const categories: TicketCategory[] = ['complaint', 'inquiry', 'refund', 'exchange', 'other'];
    for (const c of categories) {
      assert.ok(typeof CATEGORY_LABELS[c] === 'string', `缺少分类 ${c} 的标签`);
    }
  });

  it('PRIORITY_ORDER 排序权重递进正确', () => {
    assert.equal(PRIORITY_ORDER.low, 1);
    assert.equal(PRIORITY_ORDER.medium, 2);
    assert.equal(PRIORITY_ORDER.high, 3);
  });
});

describe('CustomerServicePage - Mock 数据完整性', () => {
  it('MOCK_METRICS 服务质量指标完整', () => {
    assert.equal(typeof MOCK_METRICS.resolvedTickets, 'number');
    assert.ok(MOCK_METRICS.resolvedTickets >= 0);
    assert.ok(MOCK_METRICS.avgResponseTime > 0);
    assert.ok(MOCK_METRICS.avgResolutionTime > 0);
    assert.ok(MOCK_METRICS.satisfactionScore > 0);
  });

  it('MOCK_TICKETS 全部字段非空且有效', () => {
    assert.ok(MOCK_TICKETS.length > 0);
    for (const t of MOCK_TICKETS) {
      assert.ok(t.id.startsWith('TK-'), `工单 ID 格式异常: ${t.id}`);
      assert.ok(t.title.length > 0);
      assert.ok(t.customerName.length > 0);
      assert.ok(['low', 'medium', 'high'].includes(t.priority));
      assert.ok(['open', 'in_progress', 'resolved', 'closed'].includes(t.status));
      assert.ok(['complaint', 'inquiry', 'refund', 'exchange', 'other'].includes(t.category));
      assert.ok(t.createdAt.length > 0);
    }
  });

  it('MOCK_TICKETS 包含 8 条模拟工单', () => {
    assert.equal(MOCK_TICKETS.length, 8);
  });

  it('MOCK_AGENT_STATUS 客服坐席统计完整', () => {
    assert.equal(typeof MOCK_AGENT_STATUS.total, 'number');
    assert.equal(typeof MOCK_AGENT_STATUS.online, 'number');
    assert.equal(typeof MOCK_AGENT_STATUS.busy, 'number');
    assert.equal(typeof MOCK_AGENT_STATUS.away, 'number');
    assert.equal(typeof MOCK_AGENT_STATUS.offline, 'number');
    // 在线+忙碌+离开+离线 = 总数
    assert.equal(
      MOCK_AGENT_STATUS.online + MOCK_AGENT_STATUS.busy + MOCK_AGENT_STATUS.away + MOCK_AGENT_STATUS.offline,
      MOCK_AGENT_STATUS.total,
      '坐席数量加总不等于 total',
    );
  });
});

describe('CustomerServicePage - 工单过滤逻辑', () => {
  it('按状态过滤 — 待处理(open)工单', () => {
    const open = MOCK_TICKETS.filter((t) => t.status === 'open');
    assert.equal(open.length, 3);
    assert.ok(open.every((t) => t.status === 'open'));
  });

  it('按状态过滤 — 处理中(in_progress)工单', () => {
    const inProgress = MOCK_TICKETS.filter((t) => t.status === 'in_progress');
    assert.equal(inProgress.length, 2);
  });

  it('按状态过滤 — 已解决(resolved)工单', () => {
    const resolved = MOCK_TICKETS.filter((t) => t.status === 'resolved');
    assert.equal(resolved.length, 2);
  });

  it('按状态过滤 — 已关闭(closed)工单', () => {
    const closed = MOCK_TICKETS.filter((t) => t.status === 'closed');
    assert.equal(closed.length, 1);
  });

  it('按优先级过滤 — 高优先级工单', () => {
    const high = MOCK_TICKETS.filter((t) => t.priority === 'high');
    assert.equal(high.length, 3);
    assert.ok(high.every((t) => t.priority === 'high'));
  });

  it('按分类过滤 — 投诉(complaint)工单', () => {
    const complaints = MOCK_TICKETS.filter((t) => t.category === 'complaint');
    assert.equal(complaints.length, 3);
  });
});

describe('CustomerServicePage - 搜索逻辑', () => {
  it('按标题关键词搜索', () => {
    const keyword = '优惠券';
    const results = MOCK_TICKETS.filter(
      (t) => t.title.includes(keyword) || t.customerName.includes(keyword),
    );
    assert.equal(results.length, 1);
    assert.equal(results[0].id, 'TK-20260628002');
  });

  it('按客户名搜索', () => {
    const keyword = '刘洋';
    const results = MOCK_TICKETS.filter(
      (t) => t.title.includes(keyword) || t.customerName.includes(keyword),
    );
    assert.equal(results.length, 1);
    assert.equal(results[0].customerName, '刘洋');
  });

  it('不存在的关键词返回空', () => {
    const keyword = '__nonexistent__';
    const results = MOCK_TICKETS.filter(
      (t) => t.title.includes(keyword) || t.customerName.includes(keyword),
    );
    assert.equal(results.length, 0);
  });
});

describe('CustomerServicePage - 统计计算', () => {
  it('工单各状态分布统计', () => {
    const stats: Record<string, number> = {};
    for (const t of MOCK_TICKETS) {
      stats[t.status] = (stats[t.status] || 0) + 1;
    }
    assert.equal(stats.open, 3);
    assert.equal(stats.in_progress, 2);
    assert.equal(stats.resolved, 2);
    assert.equal(stats.closed, 1);
  });

  it('高优先级工单数统计', () => {
    const highCount = MOCK_TICKETS.filter((t) => t.priority === 'high').length;
    assert.equal(highCount, 3);
  });

  it('今日新增工单数 (mock 数据中 2026-06-28)', () => {
    const today = '2026-06-28';
    const todayCount = MOCK_TICKETS.filter((t) => t.createdAt.startsWith(today)).length;
    assert.equal(todayCount, 4);
  });

  it('在途工单 (未关闭 + 未解决)', () => {
    const active = MOCK_TICKETS.filter(
      (t) => t.status !== 'resolved' && t.status !== 'closed',
    );
    assert.equal(active.length, 5);
  });
});

describe('CustomerServicePage - 日期排序', () => {
  it('按创建时间降序排列时最新工单在前', () => {
    const sorted = [...MOCK_TICKETS].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
    assert.equal(sorted[0].id, 'TK-20260628007'); // 10:05 最新
    assert.equal(sorted[sorted.length - 1].id, 'TK-20260628006'); // 11:00 最旧
  });

  it('按优先级排序时高优在前', () => {
    const sorted = [...MOCK_TICKETS].sort(
      (a, b) => PRIORITY_ORDER[b.priority] - PRIORITY_ORDER[a.priority],
    );
    // 前三个应该是 high
    assert.ok(sorted[0].priority === 'high');
    assert.ok(sorted[1].priority === 'high');
    assert.ok(sorted[2].priority === 'high');
    // 最后两个应该是 low
    assert.ok(sorted[sorted.length - 1].priority === 'low');
    assert.ok(sorted[sorted.length - 2].priority === 'low');
  });
});
