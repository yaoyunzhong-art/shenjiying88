import React from 'react';

const assert = require('node:assert/strict');
const { describe, test } = require('node:test');

const PROJECT_ROOT = '/Users/yaoyunzhong/Desktop/shenjiying/shenjiying88';
const { renderToStaticMarkup } = require(
  PROJECT_ROOT + '/node_modules/.pnpm/react-dom@18.3.1_react@18.3.1/node_modules/react-dom/server.node.js'
);
const { ProcurementManagerDashboard } = require('./ProcurementManagerDashboard');

// ---- 测试数据 ----

const MOCK_SUMMARY = {
  activeOrders: 18,
  monthlyTotalAmount: 586000,
  monthlyTrend: 7.2,
  monthlyArrivedOrders: 23,
  avgArrivalDays: 4.5,
  onTimeRate: 92,
  pendingApprovalCount: 5,
  anomalyCount: 2,
};

const MOCK_ORDERS = [
  { id: 'po-1', orderNo: 'PO-2026-0628-001', supplier: '上海食材供应有限公司', amount: 15200, status: 'pending_approval' as const, orderedAt: '2026-06-28', expectedArrival: '2026-07-02', arrivalRate: 0, buyer: '张三' },
  { id: 'po-2', orderNo: 'PO-2026-0627-015', supplier: '广州清洁用品厂', amount: 8800, status: 'shipped' as const, orderedAt: '2026-06-27', expectedArrival: '2026-06-30', arrivalRate: 0, buyer: '李四' },
  { id: 'po-3', orderNo: 'PO-2026-0625-008', supplier: '深圳包装集团', amount: 24500, status: 'partial_received' as const, orderedAt: '2026-06-25', expectedArrival: '2026-06-28', arrivalRate: 60, buyer: '王五' },
  { id: 'po-4', orderNo: 'PO-2026-0620-003', supplier: '北京厨房设备', amount: 68000, status: 'completed' as const, orderedAt: '2026-06-20', expectedArrival: '2026-06-25', arrivalRate: 100, buyer: '张三' },
  { id: 'po-5', orderNo: 'PO-2026-0619-012', supplier: '成都水产供应商', amount: 9500, status: 'cancelled' as const, orderedAt: '2026-06-19', expectedArrival: '2026-06-23', arrivalRate: 0, buyer: '李四' },
];

const MOCK_SUPPLIERS = [
  { id: 's-1', name: '上海食材供应有限公司', tier: 'platinum' as const, monthlyAmount: 128000, onTimeRate: 98, returnRate: 0.5, activeContracts: 3, lastPurchaseDate: '2026-06-28', status: 'active' as const },
  { id: 's-2', name: '广州清洁用品厂', tier: 'gold' as const, monthlyAmount: 35600, onTimeRate: 92, returnRate: 2.1, activeContracts: 2, lastPurchaseDate: '2026-06-27', status: 'active' as const },
  { id: 's-3', name: '新供应商(入驻中)', tier: 'bronze' as const, monthlyAmount: 0, onTimeRate: 0, returnRate: 0, activeContracts: 1, lastPurchaseDate: '-', status: 'onboarding' as const },
  { id: 's-4', name: '深圳包装集团', tier: 'silver' as const, monthlyAmount: 78600, onTimeRate: 85, returnRate: 3.5, activeContracts: 2, lastPurchaseDate: '2026-06-25', status: 'active' as const },
];

// ---- 测试 ----

describe('ProcurementManagerDashboard', () => {
  test('渲染采购经理工作台标题', () => {
    const html = renderToStaticMarkup(
      React.createElement(ProcurementManagerDashboard, {
        summary: MOCK_SUMMARY,
        orders: MOCK_ORDERS,
        suppliers: MOCK_SUPPLIERS,
      })
    );
    assert.ok(html.includes('采购经理工作台'), '应包含工作台标题');
    assert.ok(html.includes('采购管理'), '应包含采购管理描述');
  });

  test('渲染自定义用户名', () => {
    const html = renderToStaticMarkup(
      React.createElement(ProcurementManagerDashboard, {
        summary: MOCK_SUMMARY,
        orders: MOCK_ORDERS,
        suppliers: MOCK_SUPPLIERS,
        userName: '王采购',
      })
    );
    assert.ok(html.includes('王采购工作台'), '应显示自定义用户名');
  });

  test('显示汇总指标 QuickStats', () => {
    const html = renderToStaticMarkup(
      React.createElement(ProcurementManagerDashboard, {
        summary: MOCK_SUMMARY,
        orders: MOCK_ORDERS,
        suppliers: MOCK_SUPPLIERS,
      })
    );
    assert.ok(html.includes('进行中订单'), '应有进行中订单指标');
    assert.ok(html.includes('本月采购额'), '应有本月采购额指标');
    assert.ok(html.includes('平均到货'), '应有平均到货天数指标');
    assert.ok(html.includes('到货准时率'), '应有着准时率指标');
  });

  test('显示异常提醒', () => {
    const html = renderToStaticMarkup(
      React.createElement(ProcurementManagerDashboard, {
        summary: { ...MOCK_SUMMARY, anomalyCount: 2 },
        orders: MOCK_ORDERS,
        suppliers: MOCK_SUPPLIERS,
      })
    );
    assert.ok(html.includes('异常采购订单'), '应显示异常提醒');
    assert.ok(html.includes('2'), '应显示异常数量');
  });

  test('没有异常时不显示异常提醒', () => {
    const html = renderToStaticMarkup(
      React.createElement(ProcurementManagerDashboard, {
        summary: { ...MOCK_SUMMARY, anomalyCount: 0 },
        orders: MOCK_ORDERS,
        suppliers: MOCK_SUPPLIERS,
      })
    );
    assert.ok(!html.includes('异常采购订单'), '无异常时不显示异常提醒');
  });

  test('显示采购订单表格', () => {
    const html = renderToStaticMarkup(
      React.createElement(ProcurementManagerDashboard, {
        summary: MOCK_SUMMARY,
        orders: MOCK_ORDERS,
        suppliers: MOCK_SUPPLIERS,
      })
    );
    assert.ok(html.includes('采购订单'), '应有采购订单区域');
    assert.ok(html.includes('PO-2026-0628-001'), '应显示订单号');
    assert.ok(html.includes('上海食材供应有限公司'), '应显示供应商名');
    assert.ok(html.includes('¥15200.00'), '应格式化金额');
    assert.ok(html.includes('待审批'), '应显示审批状态标签');
    assert.ok(html.includes('已发货'), '应显示已发货标签');
    assert.ok(html.includes('部分到货'), '应显示部分到货标签');
    assert.ok(html.includes('已完成'), '应显示已完成标签');
    assert.ok(html.includes('已取消'), '应显示已取消标签');
  });

  test('显示供应商概况表格', () => {
    const html = renderToStaticMarkup(
      React.createElement(ProcurementManagerDashboard, {
        summary: MOCK_SUMMARY,
        orders: MOCK_ORDERS,
        suppliers: MOCK_SUPPLIERS,
      })
    );
    assert.ok(html.includes('供应商概况'), '应有供应商概况区域');
    assert.ok(html.includes('铂金'), '应显示铂金等级');
    assert.ok(html.includes('黄金'), '应显示黄金等级');
    assert.ok(html.includes('白银'), '应显示白银等级');
    assert.ok(html.includes('青铜'), '应显示青铜等级');
    assert.ok(html.includes('入驻中'), '应显示入驻中状态');
  });

  test('显示操作按钮', () => {
    const html = renderToStaticMarkup(
      React.createElement(ProcurementManagerDashboard, {
        summary: MOCK_SUMMARY,
        orders: MOCK_ORDERS,
        suppliers: MOCK_SUPPLIERS,
      })
    );
    assert.ok(html.includes('新建采购单'), '应有新建采购单按钮');
    assert.ok(html.includes('采购报表'), '应有采购报表按钮');
  });

  test('显示待审批数量', () => {
    const html = renderToStaticMarkup(
      React.createElement(ProcurementManagerDashboard, {
        summary: MOCK_SUMMARY,
        orders: MOCK_ORDERS,
        suppliers: MOCK_SUPPLIERS,
        pendingApprovals: 5,
      })
    );
    assert.ok(html.includes('待审批') && html.includes('5'), '应显示待审批数量');
  });

  test('采购单各种状态标签全覆盖', () => {
    const allStatusOrders = [
      { id: 'a', orderNo: 'PO-T1', supplier: 'S1', amount: 100, status: 'pending_approval' as const, orderedAt: '2026-06-28', expectedArrival: '2026-07-02', arrivalRate: 0, buyer: '赵' },
      { id: 'b', orderNo: 'PO-T2', supplier: 'S2', amount: 200, status: 'approved' as const, orderedAt: '2026-06-28', expectedArrival: '2026-07-03', arrivalRate: 0, buyer: '钱' },
      { id: 'c', orderNo: 'PO-T3', supplier: 'S3', amount: 300, status: 'shipped' as const, orderedAt: '2026-06-27', expectedArrival: '2026-07-01', arrivalRate: 0, buyer: '孙' },
      { id: 'd', orderNo: 'PO-T4', supplier: 'S4', amount: 400, status: 'partial_received' as const, orderedAt: '2026-06-26', expectedArrival: '2026-06-30', arrivalRate: 50, buyer: '李' },
      { id: 'e', orderNo: 'PO-T5', supplier: 'S5', amount: 500, status: 'completed' as const, orderedAt: '2026-06-25', expectedArrival: '2026-06-28', arrivalRate: 100, buyer: '周' },
      { id: 'f', orderNo: 'PO-T6', supplier: 'S6', amount: 600, status: 'cancelled' as const, orderedAt: '2026-06-24', expectedArrival: '2026-06-27', arrivalRate: 0, buyer: '吴' },
    ];
    const html = renderToStaticMarkup(
      React.createElement(ProcurementManagerDashboard, {
        summary: MOCK_SUMMARY,
        orders: allStatusOrders,
        suppliers: MOCK_SUPPLIERS,
      })
    );
    assert.ok(html.includes('待审批'), '待审批状态');
    assert.ok(html.includes('已批准'), '已批准状态');
    assert.ok(html.includes('已发货'), '已发货状态');
    assert.ok(html.includes('部分到货'), '部分到货状态');
    assert.ok(html.includes('已完成'), '已完成状态');
    assert.ok(html.includes('已取消'), '已取消状态');
  });

  test('供应商等级颜色渲染', () => {
    const html = renderToStaticMarkup(
      React.createElement(ProcurementManagerDashboard, {
        summary: MOCK_SUMMARY,
        orders: MOCK_ORDERS,
        suppliers: MOCK_SUPPLIERS,
      })
    );
    // 检查铂金色标
    assert.ok(html.includes('#a375e0'), '铂金色标');
    assert.ok(html.includes('#d4a017'), '金色标');
    assert.ok(html.includes('#cd7f32'), '青铜色标');
  });

  test('供应商暂停状态', () => {
    const supWithSuspended = [
      ...MOCK_SUPPLIERS,
      { id: 's-5', name: '暂停供应商', tier: 'silver' as const, monthlyAmount: 0, onTimeRate: 0, returnRate: 0, activeContracts: 0, lastPurchaseDate: '2026-06-01', status: 'suspended' as const },
    ];
    const html = renderToStaticMarkup(
      React.createElement(ProcurementManagerDashboard, {
        summary: MOCK_SUMMARY,
        orders: MOCK_ORDERS,
        suppliers: supWithSuspended,
      })
    );
    assert.ok(html.includes('暂停'), '应显示暂停');
  });

  test('数据为空时正常渲染', () => {
    const html = renderToStaticMarkup(
      React.createElement(ProcurementManagerDashboard, {
        summary: MOCK_SUMMARY,
        orders: [],
        suppliers: [],
      })
    );
    assert.ok(html.includes('采购经理工作台'), '空数据时也应渲染标题');
    assert.ok(html.includes('到货准时率'), '空数据时指标仍显示');
  });
});
