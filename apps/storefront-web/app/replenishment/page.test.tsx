/**
 * 补货申请列表页 — 单元测试
 * 使用 node:test + renderToStaticMarkup (SSR) 模式
 */
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import type { ReplenishmentOrder } from './page';
import { ReplenishmentListClient } from './replenishment-client';

// --- 4 mock orders ---
const sampleOrders: ReplenishmentOrder[] = [
  {
    id: 'rp-001', orderNo: 'BC-20260709-001', storeName: '朝阳旗舰店',
    applicant: '张三', itemCount: 15, totalEstimatedQty: 320, urgent: true,
    status: 'pending_approval', reason: '库存预警',
    createdAt: '2026-07-09 08:30',
  },
  {
    id: 'rp-002', orderNo: 'BC-20260709-002', storeName: '朝阳旗舰店',
    applicant: '李四', itemCount: 8, totalEstimatedQty: 150, urgent: false,
    status: 'draft', reason: '下周活动备货',
    createdAt: '2026-07-09 09:00',
  },
  {
    id: 'rp-003', orderNo: 'BC-20260708-001', storeName: '海淀分店',
    applicant: '王五', itemCount: 22, totalEstimatedQty: 480, urgent: true,
    status: 'approved', reason: '周末活动大促备货',
    createdAt: '2026-07-08 14:00', approvedAt: '2026-07-08 16:30',
  },
  {
    id: 'rp-004', orderNo: 'BC-20260708-002', storeName: '西单体验店',
    applicant: '赵六', itemCount: 5, totalEstimatedQty: 60, urgent: false,
    status: 'completed', reason: '常规补货',
    createdAt: '2026-07-08 10:00',
  },
];

function render(ui: React.ReactElement): string {
  return renderToStaticMarkup(ui);
}

describe('ReplenishmentListClient', () => {
  it('渲染统计卡片', () => {
    const html = render(<ReplenishmentListClient orders={sampleOrders} />);
    assert.ok(html.includes('补货申请'), '应包含页面标题');
    assert.ok(html.includes('全部申请'), '应显示全部申请标签');
    assert.ok(html.includes('待审批'), '应显示待审批标签');
    assert.ok(html.includes('已完成'), '应显示已完成标签');
    assert.ok(html.includes('4'), '应显示总数为 4');
  });

  it('渲染数据表格行', () => {
    const html = render(<ReplenishmentListClient orders={sampleOrders} />);
    assert.ok(html.includes('BC-20260709-001'));
    assert.ok(html.includes('BC-20260709-002'));
    assert.ok(html.includes('BC-20260708-001'));
    assert.ok(html.includes('BC-20260708-002'));
  });

  it('显示紧急标签', () => {
    const html = render(<ReplenishmentListClient orders={sampleOrders} />);
    assert.ok(html.includes('紧急'), '应渲染紧急状态徽标');
  });

  it('显示状态标签', () => {
    const html = render(<ReplenishmentListClient orders={sampleOrders} />);
    assert.ok(html.includes('待审批'));
    assert.ok(html.includes('草稿'));
    assert.ok(html.includes('已审批'));
    assert.ok(html.includes('已完成'));
  });

  it('显示新建补货申请按钮', () => {
    const html = render(<ReplenishmentListClient orders={sampleOrders} />);
    assert.ok(html.includes('+ 新建补货申请'));
  });

  it('显示分页信息', () => {
    const html = render(<ReplenishmentListClient orders={sampleOrders} />);
    assert.ok(html.includes('共 4 条记录'));
  });
});
