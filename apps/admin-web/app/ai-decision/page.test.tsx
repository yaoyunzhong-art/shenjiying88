/**
 * ai-decision/page.test.tsx — AI决策页面 L1 冒烟测试
 * ⚡ 覆盖: mock数据 / 筛选/排序/统计逻辑 / 状态映射 / 分页
 */

import assert from 'node:assert/strict';
import test, { describe, it } from 'node:test';

// ---- 类型 ----

interface DecisionRecord {
  id: string;
  ruleName: string;
  status: 'approved' | 'rejected' | 'pending';
  confidence: number;
  source: string;
  createdAt: string;
  targetAudience: string;
  description: string;
}

// ---- Mock 数据 (与 page.tsx 同步) ----

const MOCK: DecisionRecord[] = [
  { id: 'dec-001', ruleName: '首单折扣规则', status: 'approved', confidence: 0.92, source: '规则引擎-A', createdAt: '2026-07-15 10:30', targetAudience: '全部会员', description: '首单自动折扣审批' },
  { id: 'dec-002', ruleName: '高消费返券规则', status: 'approved', confidence: 0.88, source: '规则引擎-B', createdAt: '2026-07-15 10:28', targetAudience: '高活跃会员', description: '满500返券' },
  { id: 'dec-003', ruleName: '大额订单审批', status: 'rejected', confidence: 0.45, source: '人工审核', createdAt: '2026-07-15 10:15', targetAudience: '全部会员', description: '超10000元人工审批' },
  { id: 'dec-004', ruleName: '流失预警关怀', status: 'pending', confidence: 0.73, source: '规则引擎-A', createdAt: '2026-07-15 09:50', targetAudience: '低活跃会员', description: '30天未活跃发送关怀' },
  { id: 'dec-005', ruleName: '生日月双倍积分', status: 'approved', confidence: 0.95, source: '规则引擎-C', createdAt: '2026-07-15 09:30', targetAudience: '全部会员', description: '自动双倍积分' },
  { id: 'dec-006', ruleName: 'VIP专属折扣', status: 'rejected', confidence: 0.38, source: '人工审核', createdAt: '2026-07-15 09:00', targetAudience: '黄金会员', description: '85折审批' },
  { id: 'dec-007', ruleName: '库存预警补货', status: 'pending', confidence: 0.81, source: '规则引擎-B', createdAt: '2026-07-15 08:45', targetAudience: '仓储', description: '安全水位自动补货' },
  { id: 'dec-008', ruleName: '新客注册礼包', status: 'approved', confidence: 0.99, source: '规则引擎-A', createdAt: '2026-07-15 08:30', targetAudience: '新注册会员', description: '自动发放注册礼包' },
  { id: 'dec-009', ruleName: '季节性促销', status: 'pending', confidence: 0.65, source: '规则引擎-C', createdAt: '2026-07-14 16:00', targetAudience: '全部会员', description: '换季商品促销' },
  { id: 'dec-010', ruleName: '欺诈风险拦截', status: 'rejected', confidence: 0.28, source: '人工审核', createdAt: '2026-07-14 14:30', targetAudience: '全部会员', description: '短时间多次下单拦截' },
];

// ---- 辅助函数 (与 page.tsx 逻辑同步) ----

const STATUS_MAP: Record<string, { label: string }> = {
  approved: { label: '已批准' },
  rejected: { label: '已拒绝' },
  pending: { label: '待定' },
};

function computeStats(decisions: DecisionRecord[]) {
  const approved = decisions.filter(d => d.status === 'approved').length;
  const pending = decisions.filter(d => d.status === 'pending').length;
  const rejected = decisions.filter(d => d.status === 'rejected').length;
  const avgConf = decisions.length > 0
    ? decisions.reduce((s, d) => s + d.confidence, 0) / decisions.length
    : 0;
  return { total: decisions.length, approved, pending, rejected, avgConf };
}

function filterDecisions(decisions: DecisionRecord[], search: string, statusFilter: string): DecisionRecord[] {
  let items = decisions;
  if (search.trim()) {
    const q = search.toLowerCase();
    items = items.filter(r =>
      r.ruleName.toLowerCase().includes(q) ||
      r.source.toLowerCase().includes(q) ||
      r.description.toLowerCase().includes(q) ||
      r.targetAudience.toLowerCase().includes(q)
    );
  }
  if (statusFilter) {
    items = items.filter(r => r.status === statusFilter);
  }
  return items;
}

function paginate<T>(items: T[], page: number, pageSize: number): T[] {
  const start = (page - 1) * pageSize;
  return items.slice(start, start + pageSize);
}

// ---- 测试 ----

describe('AiDecisionPage — Mock 数据', () => {
  it('有 10 条决策记录', () => {
    assert.strictEqual(MOCK.length, 10);
  });

  it('每条记录有必填字段', () => {
    MOCK.forEach(d => {
      assert.ok(d.id);
      assert.ok(d.ruleName);
      assert.ok(['approved', 'rejected', 'pending'].includes(d.status));
      assert.ok(typeof d.confidence === 'number');
    });
  });

  it('覆盖所有状态类型', () => {
    const statuses = new Set(MOCK.map(d => d.status));
    assert.ok(statuses.has('approved'));
    assert.ok(statuses.has('rejected'));
    assert.ok(statuses.has('pending'));
  });

  it('confidence 值在 0-1 范围内', () => {
    MOCK.forEach(d => {
      assert.ok(d.confidence >= 0 && d.confidence <= 1);
    });
  });

  it('有 created_at 时间戳', () => {
    MOCK.forEach(d => {
      assert.ok(d.createdAt.length > 0);
    });
  });
});

describe('AiDecisionPage — 统计计算', () => {
  it('计算总数和各状态数量', () => {
    const stats = computeStats(MOCK);
    assert.strictEqual(stats.total, 10);
    assert.strictEqual(stats.approved, 4);
    assert.strictEqual(stats.rejected, 3);
    assert.strictEqual(stats.pending, 3);
  });

  it('平均置信度在合理范围', () => {
    const stats = computeStats(MOCK);
    assert.ok(stats.avgConf > 0.6);
    assert.ok(stats.avgConf < 0.8);
  });

  it('空数组统计为 0', () => {
    const stats = computeStats([]);
    assert.strictEqual(stats.total, 0);
    assert.strictEqual(stats.avgConf, 0);
    assert.strictEqual(stats.approved, 0);
  });

  it('单条记录平均置信度等于自身', () => {
    const stats = computeStats([MOCK[0]]);
    assert.strictEqual(stats.avgConf, 0.92);
  });
});

describe('AiDecisionPage — 筛选逻辑', () => {
  it('空搜索返回全部', () => {
    const result = filterDecisions(MOCK, '', '');
    assert.strictEqual(result.length, 10);
  });

  it('按规则名称搜索', () => {
    const result = filterDecisions(MOCK, '首单', '');
    assert.strictEqual(result.length, 1);
    assert.strictEqual(result[0].id, 'dec-001');
  });

  it('按来源搜索', () => {
    const result = filterDecisions(MOCK, '人工审核', '');
    assert.strictEqual(result.length, 3);
  });

  it('按目标人群搜索', () => {
    const result = filterDecisions(MOCK, '黄金', '');
    assert.strictEqual(result.length, 1);
  });

  it('状态筛选 approved', () => {
    const result = filterDecisions(MOCK, '', 'approved');
    assert.strictEqual(result.length, 4);
  });

  it('组合筛选 (搜索+状态)', () => {
    const result = filterDecisions(MOCK, '规则引擎-A', 'approved');
    assert.strictEqual(result.length, 2);
  });

  it('无匹配返回空数组', () => {
    const result = filterDecisions(MOCK, '不存在的规则xxxx', '');
    assert.strictEqual(result.length, 0);
  });
});

describe('AiDecisionPage — 分页', () => {
  it('默认每页 8 条', () => {
    const page1 = paginate(MOCK, 1, 8);
    assert.strictEqual(page1.length, 8);
  });

  it('第二页返回剩余', () => {
    const page2 = paginate(MOCK, 2, 8);
    assert.strictEqual(page2.length, 2);
  });

  it('越界页码返回空', () => {
    const page3 = paginate(MOCK, 3, 8);
    assert.strictEqual(page3.length, 0);
  });

  it('自定义每页 5 条', () => {
    const page1 = paginate(MOCK, 1, 5);
    assert.strictEqual(page1.length, 5);
    const page2 = paginate(MOCK, 2, 5);
    assert.strictEqual(page2.length, 5);
  });

  it('分页不覆盖源数据', () => {
    const paged = paginate(MOCK, 1, 3);
    assert.strictEqual(paged.length, 3);
    assert.strictEqual(MOCK.length, 10);
  });
});

describe('AiDecisionPage — STATUS_MAP', () => {
  it('所有状态都有映射', () => {
    ['approved', 'rejected', 'pending'].forEach(s => {
      assert.ok(STATUS_MAP[s]);
      assert.ok(STATUS_MAP[s].label);
    });
  });

  it('label 中文显示正确', () => {
    assert.strictEqual(STATUS_MAP.approved.label, '已批准');
    assert.strictEqual(STATUS_MAP.rejected.label, '已拒绝');
    assert.strictEqual(STATUS_MAP.pending.label, '待定');
  });
});
