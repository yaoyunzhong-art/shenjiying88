/**
 * purchase-orders/new/page.test.ts — 新增采购订单页测试
 *
 * 覆盖:
 *   L1 正例 — 组件导出、组件委托
 *   L3 安全 — 无危险代码
 */

import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const SRC = readFileSync(resolve(__dirname, 'page.tsx'), 'utf-8');

describe('NewPurchaseOrderPage — L1 正例', () => {
  it('应导出一个默认函数组件 NewPurchaseOrderPage', () => {
    assert.ok(SRC.includes('export default function NewPurchaseOrderPage'));
  });

  it('应从 PurchaseOrderForm 组件委托渲染', () => {
    assert.ok(SRC.includes('PurchaseOrderForm'));
  });

  it('应导入 PurchaseOrderForm 组件', () => {
    assert.ok(SRC.includes("import { PurchaseOrderForm }"));
  });

  it('页面应渲染 PurchaseOrderForm', () => {
    assert.ok(SRC.includes('<PurchaseOrderForm'));
  });

  it('页面应非常简洁，仅 2-3 个有用行', () => {
    const contentLines = SRC.split('\n').filter(l => l.trim() && !l.trim().startsWith('/'));
    assert.ok(contentLines.length <= 10, `预期 ≤ 10 有效行，实际 ${contentLines.length}`);
  });
});

describe('NewPurchaseOrderPage — L3 安全', () => {
  it('不应使用 dangerouslySetInnerHTML', () => {
    assert.ok(!SRC.includes('dangerouslySetInnerHTML'));
  });

  it('不应使用 eval', () => {
    assert.ok(!SRC.includes('eval('));
  });

  it('不应包含 as any', () => {
    assert.ok(!SRC.includes('as any'));
  });
});
