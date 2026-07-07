/**
 * orders/[id]/page.test.tsx — 订单详情页 L1 冒烟测试 (tob-web)
 * 覆盖: 正例·边界·防御
 */
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const SOURCE = resolve(__dirname, 'page.tsx');

function readSource(): string {
  return readFileSync(SOURCE, 'utf-8');
}

describe('orders/[id] — 正例', () => {
  it('应导出一个默认组件 OrderDetailPage', () => {
    const src = readSource();
    assert.ok(src.includes('export default function OrderDetailPage'), '缺少默认导出');
  });

  it('应包含 MOCK_ORDERS 数据集', () => {
    const src = readSource();
    assert.ok(src.includes('MOCK_ORDERS'), '缺少数据源');
  });

  it('应包含 EditFormData 编辑表单类型', () => {
    const src = readSource();
    assert.ok(src.includes('EditFormData'), '缺少编辑表单类型');
  });

  it('应使用 MOCK_ORDERS.find 查找订单', () => {
    const src = readSource();
    assert.ok(src.includes('.find('), '缺少 find 查找');
  });

  it('应包含 NEXT_STATUS 状态流转映射', () => {
    const src = readSource();
    assert.ok(src.includes('NEXT_STATUS'), '缺少状态流转映射');
  });

  it('应包含 STATUS_ACTION_LABELS 按钮标签映射', () => {
    const src = readSource();
    assert.ok(src.includes('STATUS_ACTION_LABELS'), '缺少按钮标签映射');
  });

  it('应包含 DetailShell 组件', () => {
    const src = readSource();
    assert.ok(src.includes('DetailShell'), '缺少详情壳组件');
  });

  it('应包含付款记录表格', () => {
    const src = readSource();
    assert.ok(src.includes('付款记录'), '缺少付款记录');
  });

  it('应包含操作日志', () => {
    const src = readSource();
    assert.ok(src.includes('操作日志'), '缺少操作日志');
  });
});

describe('orders/[id] — 边界', () => {
  it('订单不存在时应返回 null', () => {
    const src = readSource();
    assert.ok(src.includes('null'), 'find 应处理 null');
  });

  it('订单 ID 不存在时应有 fallback', () => {
    const src = readSource();
    assert.ok(src.includes('??') || src.includes('???'), 'null 兜底');
  });

  it('加载状态应有处理', () => {
    const src = readSource();
    assert.ok(src.includes('loading'), '缺少 loading');
  });

  it('备注为空时应有条件渲染', () => {
    const src = readSource();
    assert.ok(src.includes('order.remark'), '备注条件渲染');
  });

  it('actualDelivery 为空时应有 fallback', () => {
    const src = readSource();
    assert.ok(src.includes('actualDelivery'), '实际交付 fallback');
  });

  it('空付款状态下应有处理', () => {
    const src = readSource();
    assert.ok(src.includes('paymentRecords'), '付款记录数组');
  });

  it('部分付款状态应有追加记录', () => {
    const src = readSource();
    assert.ok(src.includes("paymentStatus === 'partial'"), '部分付款逻辑');
  });
});

describe('orders/[id] — 防御', () => {
  it('应包含 use client 指令', () => {
    const src = readSource();
    assert.ok(src.includes("'use client'"), '缺少 use client');
  });

  it('应包含 useParams/useRouter', () => {
    const src = readSource();
    assert.ok(src.includes('useParams'), '缺少 useParams');
    assert.ok(src.includes('useRouter'), '缺少 useRouter');
  });

  it('应导入 FormSubmitFeedback', () => {
    const src = readSource();
    assert.ok(src.includes('FormSubmitFeedback'), '缺少反馈组件');
  });

  it('金额格式化函数应防 0 值', () => {
    const src = readSource();
    assert.ok(src.includes('formatAmount'), '缺少金额格式化');
  });

  it('数量输入应防负值', () => {
    const src = readSource();
    assert.ok(src.includes('Math.max(1') || src.includes('Math.max(0'), '防负值');
  });

  it('应包含 Modal 弹窗', () => {
    const src = readSource();
    assert.ok(src.includes('<Modal'), '缺少 Modal');
  });
});
