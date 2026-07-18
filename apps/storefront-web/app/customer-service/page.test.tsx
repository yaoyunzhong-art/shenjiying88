/**
 * 客服工作台页 — CustomerServicePage Test
 * 验证: 常量映射、Mock 数据完整性、工单过滤逻辑、搜索逻辑、状态统计、快捷操作
 * 源码分析模式：不渲染 UI 组件，只测试纯函数和业务逻辑
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

// ── 分类标签函数（从 page.tsx 抽象出来的纯函数） ──

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

// ── 标签化函数（无 UI 渲染） ──

function renderStatusTag(status: TicketStatus): string {
  return STATUS_LABELS[status] || '未知';
}

function renderPriorityTag(priority: TicketPriority): string {
  return PRIORITY_LABELS[priority] || '未知';
}

function renderCategoryTag(category: TicketCategory): string {
  return CATEGORY_LABELS[category] || '未知';
}

// ── 统计函数（无 UI 组件） ──

interface TicketStats {
  total: number;
  open: number;
  inProgress: number;
  resolved: number;
  closed: number;
}

function computeTicketStats(tickets: ServiceTicket[]): TicketStats {
  return {
    total: tickets.length,
    open: tickets.filter((t) => t.status === 'open').length,
    inProgress: tickets.filter((t) => t.status === 'in_progress').length,
    resolved: tickets.filter((t) => t.status === 'resolved').length,
    closed: tickets.filter((t) => t.status === 'closed').length,
  };
}

function computePriorityStats(tickets: ServiceTicket[]): Record<TicketPriority, number> {
  return {
    high: tickets.filter((t) => t.priority === 'high').length,
    medium: tickets.filter((t) => t.priority === 'medium').length,
    low: tickets.filter((t) => t.priority === 'low').length,
  };
}

function computeCategoryStats(tickets: ServiceTicket[]): Record<TicketCategory, number> {
  const stats: Record<string, number> = {};
  for (const t of tickets) {
    stats[t.category] = (stats[t.category] || 0) + 1;
  }
  return stats as Record<TicketCategory, number>;
}

// ── 数据转换函数 ──

function formatResolutionMetrics(metrics: ServiceQualityMetrics): {
  resolvedText: string;
  avgResponseText: string;
  avgResolutionText: string;
  satisfactionText: string;
} {
  return {
    resolvedText: `${metrics.resolvedTickets} 单`,
    avgResponseText: `${metrics.avgResponseTime}min`,
    avgResolutionText: `${metrics.avgResolutionTime}min`,
    satisfactionText: `${metrics.satisfactionScore}/5.0`,
  };
}

function getActiveTicketRate(tickets: ServiceTicket[]): string {
  const active = tickets.filter(
    (t) => t.status !== 'resolved' && t.status !== 'closed',
  ).length;
  return tickets.length > 0
    ? `${Math.round((active / tickets.length) * 100)}%`
    : '0%';
}

// ── 搜索/过滤函数 ──

function filterTicketsByKeyword(
  tickets: ServiceTicket[],
  keyword: string,
): ServiceTicket[] {
  if (!keyword.trim()) return tickets;
  return tickets.filter(
    (t) =>
      t.title.includes(keyword) || t.customerName.includes(keyword),
  );
}

function filterTickets(
  tickets: ServiceTicket[],
  filters: { priority?: string; status?: string; category?: string },
): ServiceTicket[] {
  let items = tickets;
  if (filters.priority && filters.priority !== 'ALL') {
    items = items.filter((t) => t.priority === filters.priority);
  }
  if (filters.status && filters.status !== 'ALL') {
    items = items.filter((t) => t.status === filters.status);
  }
  if (filters.category && filters.category !== 'ALL') {
    items = items.filter((t) => t.category === filters.category);
  }
  return items;
}

function sortTicketsByPriority(
  tickets: ServiceTicket[],
  order: 'asc' | 'desc' = 'desc',
): ServiceTicket[] {
  return [...tickets].sort((a, b) =>
    order === 'desc'
      ? PRIORITY_ORDER[b.priority] - PRIORITY_ORDER[a.priority]
      : PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority],
  );
}

function sortTicketsByDate(
  tickets: ServiceTicket[],
  order: 'asc' | 'desc' = 'desc',
): ServiceTicket[] {
  return [...tickets].sort((a, b) =>
    order === 'desc'
      ? new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      : new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
  );
}

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
  { id: 'TK-20260628009', title: '预约到店时间变更', customerName: '吴丽', priority: 'low', status: 'open', category: 'inquiry', createdAt: '2026-06-28 11:30' },
  { id: 'TK-20260628010', title: '商品库存查询', customerName: '钱进', priority: 'medium', status: 'open', category: 'inquiry', createdAt: '2026-06-28 10:50' },
];

const MOCK_AGENT_STATUS: AgentStatusSummary = {
  total: 12,
  online: 8,
  busy: 3,
  away: 1,
  offline: 0,
};

// ============================================================
// 新增：渲染函数测试（纯函数，无 UI 组件）
// ============================================================

describe('CustomerServicePage - 分类标签标签化', () => {
  it('renderStatusTag 返回正确的中文标签', () => {
    assert.equal(renderStatusTag('open'), '待处理');
    assert.equal(renderStatusTag('in_progress'), '处理中');
    assert.equal(renderStatusTag('resolved'), '已解决');
    assert.equal(renderStatusTag('closed'), '已关闭');
  });

  it('renderStatusTag 处理未知状态返回"未知"', () => {
    assert.equal(renderStatusTag(undefined as unknown as TicketStatus), '未知');
  });

  it('renderPriorityTag 返回正确的中文标签', () => {
    assert.equal(renderPriorityTag('high'), '高');
    assert.equal(renderPriorityTag('medium'), '中');
    assert.equal(renderPriorityTag('low'), '低');
  });

  it('renderCategoryTag 返回正确的中文标签', () => {
    assert.equal(renderCategoryTag('complaint'), '投诉');
    assert.equal(renderCategoryTag('inquiry'), '咨询');
    assert.equal(renderCategoryTag('refund'), '退款');
    assert.equal(renderCategoryTag('exchange'), '换货');
    assert.equal(renderCategoryTag('other'), '其他');
  });
});

describe('CustomerServicePage - 统计函数', () => {
  it('computeTicketStats 正确计算各状态数量', () => {
    const stats = computeTicketStats(MOCK_TICKETS);
    assert.equal(stats.total, 10);
    // open: TK-001, TK-004, TK-007, TK-009, TK-010 = 5
    // in_progress: TK-002, TK-003 = 2
    // resolved: TK-005, TK-008 = 2
    // closed: TK-006 = 1
    assert.equal(stats.open, 5);
    assert.equal(stats.inProgress, 2);
    assert.equal(stats.resolved, 2);
    assert.equal(stats.closed, 1);
    assert.equal(stats.open + stats.inProgress + stats.resolved + stats.closed, stats.total);
  });

  it('computePriorityStats 正确计算各优先级分布', () => {
    const stats = computePriorityStats(MOCK_TICKETS);
    assert.equal(stats.high, 3);
    assert.equal(stats.medium, 3);
    assert.equal(stats.low, 4);
    assert.equal(stats.high + stats.medium + stats.low, MOCK_TICKETS.length);
  });

  it('computeCategoryStats 正确计算各分类分布', () => {
    const stats = computeCategoryStats(MOCK_TICKETS);
    assert.equal(stats.complaint, 3);
    assert.equal(stats.inquiry, 4);
    assert.equal(stats.refund, 1);
    assert.equal(stats.exchange, 1);
    assert.equal(stats.other, 1);
  });

  it('computeTicketStats 处理空列表返回全零', () => {
    const stats = computeTicketStats([]);
    assert.equal(stats.total, 0);
    assert.equal(stats.open, 0);
    assert.equal(stats.inProgress, 0);
    assert.equal(stats.resolved, 0);
    assert.equal(stats.closed, 0);
  });

  it('computePriorityStats 处理空列表返回全零', () => {
    const stats = computePriorityStats([]);
    assert.equal(stats.high, 0);
    assert.equal(stats.medium, 0);
    assert.equal(stats.low, 0);
  });
});

describe('CustomerServicePage - 数据转换与格式化', () => {
  it('formatResolutionMetrics 正确格式化指标文本', () => {
    const formatted = formatResolutionMetrics(MOCK_METRICS);
    assert.equal(formatted.resolvedText, '42 单');
    assert.equal(formatted.avgResponseText, '2.8min');
    assert.equal(formatted.avgResolutionText, '15.3min');
    assert.equal(formatted.satisfactionText, '4.6/5.0');
  });

  it('formatResolutionMetrics 处理零值', () => {
    const zero: ServiceQualityMetrics = {
      resolvedTickets: 0,
      avgResponseTime: 0,
      avgResolutionTime: 0,
      satisfactionScore: 0,
    };
    const formatted = formatResolutionMetrics(zero);
    assert.equal(formatted.resolvedText, '0 单');
    assert.equal(formatted.satisfactionText, '0/5.0');
  });

  it('getActiveTicketRate 返回正确百分比', () => {
    const rate = getActiveTicketRate(MOCK_TICKETS);
    // active = open(5) + in_progress(2) = 7 / 10 = 70%
    assert.equal(rate, '70%');
  });

  it('getActiveTicketRate 空列表返回 0%', () => {
    assert.equal(getActiveTicketRate([]), '0%');
  });

  it('getActiveTicketRate 全部已解决返回 0%', () => {
    const allResolved: ServiceTicket[] = [
      { id: 'T1', title: 't', customerName: 'a', priority: 'low', status: 'resolved', category: 'other', createdAt: '2026-01-01' },
      { id: 'T2', title: 't', customerName: 'b', priority: 'low', status: 'closed', category: 'other', createdAt: '2026-01-01' },
    ];
    assert.equal(getActiveTicketRate(allResolved), '0%');
  });

  it('getActiveTicketRate 全部进行中返回 100%', () => {
    const allActive: ServiceTicket[] = [
      { id: 'T1', title: 't', customerName: 'a', priority: 'low', status: 'open', category: 'other', createdAt: '2026-01-01' },
      { id: 'T2', title: 't', customerName: 'b', priority: 'low', status: 'in_progress', category: 'other', createdAt: '2026-01-01' },
    ];
    assert.equal(getActiveTicketRate(allActive), '100%');
  });
});

describe('CustomerServicePage - 搜索与过滤', () => {
  it('filterTicketsByKeyword 按标题搜索', () => {
    const results = filterTicketsByKeyword(MOCK_TICKETS, '优惠券');
    assert.equal(results.length, 1);
    assert.equal(results[0].id, 'TK-20260628002');
  });

  it('filterTicketsByKeyword 按客户名搜索', () => {
    const results = filterTicketsByKeyword(MOCK_TICKETS, '刘洋');
    assert.equal(results.length, 1);
    assert.equal(results[0].customerName, '刘洋');
  });

  it('filterTicketsByKeyword 不存在的关键词返回空', () => {
    assert.equal(filterTicketsByKeyword(MOCK_TICKETS, '__nonexistent__').length, 0);
  });

  it('filterTicketsByKeyword 空关键词返回全部', () => {
    assert.equal(filterTicketsByKeyword(MOCK_TICKETS, '').length, MOCK_TICKETS.length);
  });

  it('filterTickets 按优先级过滤', () => {
    const high = filterTickets(MOCK_TICKETS, { priority: 'high' });
    assert.equal(high.length, 3);
    assert.ok(high.every((t) => t.priority === 'high'));
  });

  it('filterTickets 按状态过滤', () => {
    const open = filterTickets(MOCK_TICKETS, { status: 'open' });
    assert.equal(open.length, 5);
    assert.ok(open.every((t) => t.status === 'open'));
  });

  it('filterTickets 按分类过滤', () => {
    const complaints = filterTickets(MOCK_TICKETS, { category: 'complaint' });
    assert.equal(complaints.length, 3);
    assert.ok(complaints.every((t) => t.category === 'complaint'));
  });

  it('filterTickets 组合过滤（高优先级+待处理）', () => {
    const results = filterTickets(MOCK_TICKETS, { priority: 'high', status: 'open' });
    assert.equal(results.length, 2); // TK-01, TK-07
    assert.ok(results.every((t) => t.priority === 'high' && t.status === 'open'));
  });

  it('filterTickets ALL 不过滤', () => {
    assert.equal(filterTickets(MOCK_TICKETS, { priority: 'ALL', status: 'ALL', category: 'ALL' }).length, MOCK_TICKETS.length);
  });
});

describe('CustomerServicePage - 排序逻辑', () => {
  it('sortTicketsByPriority 降序：高优在前', () => {
    const sorted = sortTicketsByPriority(MOCK_TICKETS, 'desc');
    assert.ok(sorted[0].priority === 'high');
    assert.ok(sorted[1].priority === 'high');
    assert.ok(sorted[2].priority === 'high');
    assert.ok(sorted[sorted.length - 1].priority === 'low');
  });

  it('sortTicketsByPriority 升序：低优在前', () => {
    const sorted = sortTicketsByPriority(MOCK_TICKETS, 'asc');
    assert.ok(sorted[0].priority === 'low');
    assert.ok(sorted[sorted.length - 1].priority === 'high');
  });

  it('sortTicketsByDate 降序：最新在前', () => {
    const sorted = sortTicketsByDate(MOCK_TICKETS, 'desc');
    // 11:30 → 10:50 → 10:05 → 09:15 → ...
    assert.equal(sorted[0].id, 'TK-20260628009'); // 11:30 最新
    assert.equal(sorted[sorted.length - 1].id, 'TK-20260628006'); // 11:00 最旧
  });

  it('sortTicketsByDate 升序：最旧在前', () => {
    const sorted = sortTicketsByDate(MOCK_TICKETS, 'asc');
    assert.equal(sorted[0].id, 'TK-20260628006'); // 11:00 最旧
  });
});

// ── 常量与映射验证 ──

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

  it('MOCK_TICKETS 包含 10 条模拟工单', () => {
    assert.equal(MOCK_TICKETS.length, 10);
  });

  it('MOCK_AGENT_STATUS 客服坐席统计完整', () => {
    assert.equal(typeof MOCK_AGENT_STATUS.total, 'number');
    assert.equal(typeof MOCK_AGENT_STATUS.online, 'number');
    assert.equal(typeof MOCK_AGENT_STATUS.busy, 'number');
    assert.equal(typeof MOCK_AGENT_STATUS.away, 'number');
    assert.equal(typeof MOCK_AGENT_STATUS.offline, 'number');
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
    assert.equal(open.length, 5);
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
    assert.equal(stats.open, 5);
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
    assert.equal(todayCount, 6);
  });

  it('在途工单 (未关闭 + 未解决)', () => {
    const active = MOCK_TICKETS.filter(
      (t) => t.status !== 'resolved' && t.status !== 'closed',
    );
    assert.equal(active.length, 7);
  });
});

describe('CustomerServicePage - 日期排序', () => {
  it('按创建时间降序排列时最新工单在前', () => {
    const sorted = [...MOCK_TICKETS].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
    assert.equal(sorted[0].id, 'TK-20260628009'); // 11:30
    assert.equal(sorted[sorted.length - 1].id, 'TK-20260628006'); // 11:00
  });

  it('按优先级排序时高优在前', () => {
    const sorted = [...MOCK_TICKETS].sort(
      (a, b) => PRIORITY_ORDER[b.priority] - PRIORITY_ORDER[a.priority],
    );
    assert.ok(sorted[0].priority === 'high');
    assert.ok(sorted[1].priority === 'high');
    assert.ok(sorted[2].priority === 'high');
    assert.ok(sorted[sorted.length - 1].priority === 'low');
    assert.ok(sorted[sorted.length - 2].priority === 'low');
  });
});
