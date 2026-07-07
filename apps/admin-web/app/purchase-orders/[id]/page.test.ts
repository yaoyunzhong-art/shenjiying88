/**
 * purchase-orders/[id]/page.test.tsx — 采购单详情页 L1 冒烟测试
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

describe('purchase-orders/[id]/page — 正例', () => {
  it('应导出默认组件 PurchaseOrderDetailPage', () => {
    const src = readSource();
    assert.ok(
      src.includes('export default function PurchaseOrderDetailPage'),
      '缺少默认导出',
    );
  });

  it('应包含 DetailShell / FormField / InfoRow', () => {
    const src = readSource();
    assert.ok(src.includes('DetailShell'), '缺少 DetailShell');
    assert.ok(src.includes('FormField'), '缺少 FormField');
    assert.ok(src.includes('InfoRow'), '缺少 InfoRow');
  });

  it('应包含 StatusBadge / SubmitButton / useFormSubmit', () => {
    const src = readSource();
    assert.ok(src.includes('StatusBadge'), '缺少 StatusBadge');
    assert.ok(src.includes('SubmitButton'), '缺少 SubmitButton');
    assert.ok(src.includes('useFormSubmit'), '缺少 useFormSubmit');
  });

  it('应包含 tabs: basic / logistics', () => {
    const src = readSource();
    assert.ok(src.includes("key: 'basic'"), '缺少 basic tab');
    assert.ok(src.includes("key: 'logistics'"), '缺少 logistics tab');
  });

  it('应包含保存 / 状态流转 / 删除操作按钮', () => {
    const src = readSource();
    assert.ok(src.includes('保存修改'), '缺少保存按钮');
    assert.ok(src.includes('STATUS_TRANSITION'), '缺少状态流转定义');
    assert.ok(src.includes('删除采购单'), '缺少删除按钮');
  });

  it('应包含完整状态流转映射 STATUS_TRANSITIONS', () => {
    const src = readSource();
    const statuses = [
      'draft',
      'pending_approval',
      'approved',
      'shipped',
      'partial_received',
      'received',
      'cancelled',
    ];
    for (const s of statuses) {
      assert.ok(src.includes(s), `缺少状态定义: ${s}`);
    }
  });

  it('应包含紧急程度展示', () => {
    const src = readSource();
    assert.ok(
      src.includes('urgencyInfo') || src.includes('PURCHASE_ORDER_URGENCY_MAP'),
      '缺少紧急程度处理',
    );
  });

  it('应包含 DetailClosureBar 回链', () => {
    const src = readSource();
    assert.ok(src.includes('DetailClosureBar'), '缺少 DetailClosureBar');
    assert.ok(src.includes('back-list'), '缺少返回列表链接');
    assert.ok(src.includes('related-suppliers'), '缺少供应商链接');
  });
});

describe('purchase-orders/[id]/page — 边界', () => {
  it('未找到采购单时应显示 404 提示', () => {
    const src = readSource();
    assert.ok(src.includes('该采购单不存在或已被删除'), '缺少 404 文案');
  });

  it('已收货状态无后续流转按钮', () => {
    const src = readSource();
    assert.ok(src.includes("received: []"), 'received 应无可流转状态');
    assert.ok(src.includes("cancelled: []"), 'cancelled 应无可流转状态');
  });
});

describe('purchase-orders/[id]/page — 防御', () => {
  it('应包含 use client 指令', () => {
    const src = readSource();
    assert.ok(
      src.includes("'use client'") || src.includes('"use client"'),
      '缺少 use client',
    );
  });

  it('应使用 use 解构 params', () => {
    const src = readSource();
    assert.ok(
      src.includes('use(params)') || src.includes('use('),
      '应使用 use() 解构 params',
    );
  });

  it('状态流转前应有 confirm 确认', () => {
    const src = readSource();
    assert.ok(src.includes('confirm('), '缺少 confirm 确认对话框');
  });

  it('删除操作应有 confirm 确认', () => {
    const src = readSource();
    const hasDeleteConfirm = src.includes('确认删除此采购单？');
    assert.ok(hasDeleteConfirm, '缺少删除确认');
  });

  it('取消操作应有专属提示文案', () => {
    const src = readSource();
    assert.ok(src.includes('确认取消此采购单'), '缺少取消确认文案');
  });
});
