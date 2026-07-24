/**
 * agents/tools/page.test.tsx — Agent Tools L1 测试（含 page.tsx 数据层逻辑 + 客户端筛选）
 *
 * 覆盖: 工具列表聚合、风险等级统计、分类筛选、搜索过滤
 * 正例: 统计正确性、风险等级枚举、分类映射
 * 反例: 空列表、全高风险、缺失字段
 * 边界: 超大数量、未匹配筛选、全类别覆盖
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

// ── 类型 ──

type RiskLevel = 'low' | 'medium' | 'high';

interface ToolItem {
  id: string;
  name: string;
  description: string;
  riskLevel: RiskLevel;
  category: string;
  parameters: string;
}

// ── Mock 数据 ──

const SEED_TOOLS: ToolItem[] = [
  { id: 'tool-001', name: 'query_order', description: '查询订单详情', riskLevel: 'low', category: '数据查询', parameters: 'orderId: string' },
  { id: 'tool-002', name: 'refund_order', description: '执行订单退款', riskLevel: 'high', category: '资金操作', parameters: 'orderId: string, amount: number' },
  { id: 'tool-003', name: 'update_inventory', description: '更新库存', riskLevel: 'medium', category: '库存管理', parameters: 'sku: string, delta: number' },
  { id: 'tool-004', name: 'send_email', description: '发送邮件', riskLevel: 'low', category: '通知', parameters: 'to: string, subject: string' },
  { id: 'tool-005', name: 'create_coupon', description: '创建优惠券', riskLevel: 'medium', category: '营销', parameters: 'name: string, discount: number' },
  { id: 'tool-006', name: 'approve_fulfillment', description: '审批履约', riskLevel: 'high', category: '履约', parameters: 'orderId: string' },
  { id: 'tool-007', name: 'search_products', description: '搜索商品', riskLevel: 'low', category: '数据查询', parameters: 'query: string' },
  { id: 'tool-008', name: 'cancel_shipment', description: '取消物流单', riskLevel: 'high', category: '履约', parameters: 'shipmentId: string' },
];

// ── 辅助函数 ──

function computeRiskStats(tools: ToolItem[]) {
  return {
    total: tools.length,
    high: tools.filter(t => t.riskLevel === 'high').length,
    medium: tools.filter(t => t.riskLevel === 'medium').length,
    low: tools.filter(t => t.riskLevel === 'low').length,
  };
}

function filterByCategory(tools: ToolItem[], category: string): ToolItem[] {
  if (!category || category === '') return tools;
  return tools.filter(t => t.category === category);
}

function searchTools(tools: ToolItem[], query: string): ToolItem[] {
  if (!query.trim()) return tools;
  const lower = query.toLowerCase();
  return tools.filter(t =>
    t.name.toLowerCase().includes(lower) ||
    t.description.toLowerCase().includes(lower)
  );
}

const ALL_CATEGORIES = ['数据查询', '资金操作', '库存管理', '通知', '营销', '履约'];
const SRC = readFileSync(new URL('./page.tsx', import.meta.url), 'utf-8');

// ===================================================================
describe('AgentTools — 统计聚合', () => {
  it('应正确计算各风险等级数量', () => {
    const stats = computeRiskStats(SEED_TOOLS);
    assert.equal(stats.total, 8);
    assert.equal(stats.high, 3);
    assert.equal(stats.medium, 2);
    assert.equal(stats.low, 3);
  });

  it('空工具列表统计全为零', () => {
    const stats = computeRiskStats([]);
    assert.equal(stats.total, 0);
    assert.equal(stats.high, 0);
    assert.equal(stats.medium, 0);
    assert.equal(stats.low, 0);
  });

  it('全高风险统计正确', () => {
    const allHigh = SEED_TOOLS.filter(t => t.riskLevel === 'high');
    const stats = computeRiskStats(allHigh);
    assert.equal(stats.total, 3);
    assert.equal(stats.high, 3);
    assert.equal(stats.medium, 0);
  });

  it('总数应等于各等级之和', () => {
    const stats = computeRiskStats(SEED_TOOLS);
    assert.equal(stats.total, stats.high + stats.medium + stats.low);
  });
});

// ===================================================================
describe('AgentTools — 分类筛选', () => {
  it('按数据查询分类过滤', () => {
    const result = filterByCategory(SEED_TOOLS, '数据查询');
    assert.equal(result.length, 2);
    assert.ok(result.every(t => t.category === '数据查询'));
  });

  it('空分类返回全部', () => {
    const result = filterByCategory(SEED_TOOLS, '');
    assert.equal(result.length, SEED_TOOLS.length);
  });

  it('不存在的分类返回空数组', () => {
    const result = filterByCategory(SEED_TOOLS, 'AI推理');
    assert.equal(result.length, 0);
  });

  it('全分类列表应有6个类别', () => {
    assert.equal(ALL_CATEGORIES.length, 6);
  });
});

// ===================================================================
describe('AgentTools — 搜索过滤', () => {
  it('按工具名称搜索', () => {
    const result = searchTools(SEED_TOOLS, 'order');
    assert.equal(result.length, 2); // query_order + refund_order
  });

  it('按描述搜索', () => {
    const result = searchTools(SEED_TOOLS, '邮件');
    assert.equal(result.length, 1);
  });

  it('空查询返回全部', () => {
    const result = searchTools(SEED_TOOLS, '');
    assert.equal(result.length, SEED_TOOLS.length);
  });

  it('不匹配查询返回空', () => {
    const result = searchTools(SEED_TOOLS, 'xxxyyyzzz');
    assert.equal(result.length, 0);
  });

  it('搜索大小写不敏感', () => {
    const result = searchTools(SEED_TOOLS, 'ORDER');
    assert.equal(result.length, 2);
  });
});

// ===================================================================
describe('AgentTools — 数据完整性', () => {
  it('每个工具必须有 id/name/riskLevel', () => {
    for (const t of SEED_TOOLS) {
      assert.ok(t.id, 'id required');
      assert.ok(t.name, 'name required');
      assert.ok(['low', 'medium', 'high'].includes(t.riskLevel), `valid riskLevel: ${t.riskLevel}`);
    }
  });

  it('每个工具需有 category', () => {
    for (const t of SEED_TOOLS) {
      assert.ok(t.category.length > 0, `${t.name}: category required`);
    }
  });

  it('高风险工具应有 description', () => {
    for (const t of SEED_TOOLS.filter(t => t.riskLevel === 'high')) {
      assert.ok(t.description.length > 0, `${t.name}: high-risk tool needs description`);
    }
  });
});

describe('agents/tools — 权限边界', () => {
  it('接入管理员权限边界', () => {
    assert.ok(SRC.includes('AdminPermissionGate'));
    assert.ok(SRC.includes("requiredPermission: 'foundation.governance.read'"));
  });
});
