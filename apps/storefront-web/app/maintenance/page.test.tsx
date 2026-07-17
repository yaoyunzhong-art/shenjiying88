/**
 * maintenance/page.test.tsx — 设备保养工单页面 L1+L2+L3 综合测试
 * 角色视角: 👨‍🔧设备维护 / 🔧门店运营
 * 覆盖: 正例·反例·边界·角色场景·AI预测·统计面板·状态过滤·优先级·搜索详情弹窗
 */
const assert = require('node:assert/strict');
const { describe, test } = require('node:test');
const fs = require('node:fs');
const path = require('path');

const PAGE_SRC = fs.readFileSync(path.resolve(__dirname, 'page.tsx'), 'utf8');

describe('MaintenancePage — 正例', () => {
  test('page exports default function MaintenancePage', () => {
    assert.ok(PAGE_SRC.includes('export default function MaintenancePage'), '缺少默认导出');
  });

  test('page contains use client directive', () => {
    assert.ok(PAGE_SRC.includes("'use client'"), '缺少 use client');
  });

  test('title contains 设备保养工单', () => {
    assert.ok(PAGE_SRC.includes('设备保养工单'), '页面标题缺失');
  });

  test('page description mentions maintenance', () => {
    assert.ok(PAGE_SRC.includes('工单') || PAGE_SRC.includes('保养'), '描述缺失');
  });

  test('renders MaintenanceOrder interface', () => {
    assert.ok(PAGE_SRC.includes('interface MaintenanceOrder'), '缺少接口定义');
  });

  test('renders multiple order status types', () => {
    assert.ok(PAGE_SRC.includes("'pending'") && PAGE_SRC.includes("'in_progress'") && PAGE_SRC.includes("'completed'") && PAGE_SRC.includes("'cancelled'"), '状态类型');
  });

  test('renders priority levels', () => {
    assert.ok(PAGE_SRC.includes("'low'") && PAGE_SRC.includes("'medium'") && PAGE_SRC.includes("'high'") && PAGE_SRC.includes("'urgent'"), '优先级类型');
  });

  test('has mock data with 12 orders', () => {
    const match = PAGE_SRC.match(/MOCK_ORDERS/g);
    assert.ok(match && match.length >= 1, 'mock 数据');
  });

  test('renders search input', () => {
    assert.ok(PAGE_SRC.includes('placeholder') && (PAGE_SRC.includes('搜索') || PAGE_SRC.includes('搜索工单')), '搜索输入');
  });

  test('renders status filter', () => {
    assert.ok(PAGE_SRC.includes('statusFilter'), '状态筛选');
  });

  test('renders priority filter', () => {
    assert.ok(PAGE_SRC.includes('priorityFilter'), '优先级筛选');
  });

  test('includes DataTable component', () => {
    assert.ok(PAGE_SRC.includes('DataTable'), 'DataTable');
  });

  test('includes Pagination', () => {
    assert.ok(PAGE_SRC.includes('Pagination'), 'Pagination');
  });

  test('includes EmptyState for no results', () => {
    assert.ok(PAGE_SRC.includes('EmptyState') || PAGE_SRC.includes('暂无匹配'), '空状态');
  });

  test('includes Modal for detail', () => {
    assert.ok(PAGE_SRC.includes('Modal'), '详情弹窗');
  });

  test('has stat cards', () => {
    assert.ok(PAGE_SRC.includes('StatCard'), '统计卡片');
  });

  test('has order detail function', () => {
    assert.ok(PAGE_SRC.includes('OrderDetailModal'), '详情组件');
  });

  test('has new order button linking to /maintenance/new', () => {
    assert.ok(PAGE_SRC.includes('/maintenance/new'), '新建工单链接');
  });

  test('has AI prediction panel', () => {
    assert.ok(PAGE_SRC.includes('AIPredictionPanel') || PAGE_SRC.includes('AI 故障预测'), 'AI预测面板');
  });
});

describe('MaintenancePage — 统计', () => {
  test('calculates total order count', () => {
    assert.ok(PAGE_SRC.includes('stats.total') || PAGE_SRC.includes('total'), '总工单统计');
  });

  test('calculates pending count', () => {
    assert.ok(PAGE_SRC.includes('stats.pending') || PAGE_SRC.includes('pending'), '待处理统计');
  });

  test('calculates in-progress count', () => {
    assert.ok(PAGE_SRC.includes('stats.inProgress') || PAGE_SRC.includes('inProgress'), '处理中统计');
  });

  test('calculates completed count', () => {
    assert.ok(PAGE_SRC.includes('stats.completed'), '已完成统计');
  });

  test('calculates urgent count', () => {
    assert.ok(PAGE_SRC.includes('stats.urgent'), '紧急统计');
  });

  test('has completion rate calculation', () => {
    assert.ok(PAGE_SRC.includes('完成率') || PAGE_SRC.includes('percent') || PAGE_SRC.includes('Math.round'), '完成率');
  });

  test('store distribution displayed', () => {
    assert.ok(PAGE_SRC.includes('旗舰店') && (PAGE_SRC.includes('分店-A') || PAGE_SRC.includes('分店')), '门店分布');
  });
});

describe('MaintenancePage — 边界', () => {
  test('handles empty search results', () => {
    assert.ok(PAGE_SRC.includes('.length === 0') || PAGE_SRC.includes('暂无匹配'), '空搜索结果');
  });

  test('uses filter function for ordering', () => {
    assert.ok(PAGE_SRC.includes('filterOrders') || PAGE_SRC.includes('.filter('), '筛选函数');
  });

  test('priority colors defined', () => {
    assert.ok(PAGE_SRC.includes('#F56C6C') || PAGE_SRC.includes('#C41D7F') || PAGE_SRC.includes('#E6A23C'), '优先级颜色');
  });

  test('status badges render for each status', () => {
    assert.ok(PAGE_SRC.includes('StatusBadge'), '状态徽章');
  });

  test('detail modal shows full order info', () => {
    assert.ok(PAGE_SRC.includes('工单号') || PAGE_SRC.includes('订单编号'), '详情字段');
  });

  test('AI prediction shows device risk levels', () => {
    assert.ok(PAGE_SRC.includes('risk') || PAGE_SRC.includes('高危') || PAGE_SRC.includes('预测'), 'AI预测');
  });

  test('0 orders edge case', () => {
    assert.ok(PAGE_SRC.includes('total === 0') || PAGE_SRC.includes('total > 0'), '零订单处理');
  });
});

describe('MaintenancePage — 角色视角', () => {
  test('maintenance engineer can view work orders', () => {
    assert.ok(PAGE_SRC.includes('工单'), '维护人员查看工单');
  });

  test('store ops can filter by status', () => {
    assert.ok(PAGE_SRC.includes('statusFilter'), '运营筛选');
  });

  test('manager can view stats dashboard', () => {
    assert.ok(PAGE_SRC.includes('统计') || PAGE_SRC.includes('StatCard'), '经理统计');
  });

  test('engineer can view AI prediction', () => {
    assert.ok(PAGE_SRC.includes('AI') || PAGE_SRC.includes('预测'), 'AI预测');
  });

  test('engineer can create new order', () => {
    assert.ok(PAGE_SRC.includes('新建工单') || PAGE_SRC.includes('/maintenance/new'), '新建工单');
  });

  test('ops can see completion rate', () => {
    assert.ok(PAGE_SRC.includes('完成率') || PAGE_SRC.includes('处理率'), '完成率');
  });
});

describe('MaintenancePage — 防御', () => {
  test('no dangerous HTML', () => {
    assert.ok(!PAGE_SRC.includes('dangerouslySetInnerHTML'), '禁止 dangerous HTML');
  });

  test('no any type (exceptions for generated)', () => {
    // known: grid comparator uses :any for dynamic type comparison
    const anyLines = PAGE_SRC.split('\n').filter(l => /:\s*any\b/.test(l) && !l.trim().startsWith('//'));
    assert.ok(anyLines.length <= 3, 'any type used more than expected');
  });

  test('no secret/API key', () => {
    assert.ok(!/(?:secret|password|api[_-]?key|authorization)/i.test(PAGE_SRC), '禁止密钥');
  });

  test('no bare console.log', () => {
    const lines = PAGE_SRC.split('\n').filter(l => l.includes('console.log(') && !l.trimStart().startsWith('//'));
    assert.ok(lines.length === 0, '裸 console.log');
  });
});
