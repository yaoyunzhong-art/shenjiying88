/*!
 * stock/inbound/[id]/page.test.tsx - L1 smoke test (storefront-web)
 * Adapted for InboundReceivingPage
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

describe('InboundReceivingPage - 正例', () => {
  it('exports default InboundReceivingPage', () => {
    const src = readSource();
    assert.ok(src.includes('export default function InboundReceivingPage'), 'missing export');
  });
  it('has use client', () => {
    const src = readSource();
    assert.ok(src.includes("'use client'"), 'missing use client');
  });
  it('uses useRouter', () => {
    const src = readSource();
    assert.ok(src.includes('useRouter'), 'missing useRouter');
  });
  it('imports ConfirmDialog', () => {
    const src = readSource();
    assert.ok(src.includes('ConfirmDialog'), 'missing ConfirmDialog');
  });
  it('imports DescriptionItem', () => {
    const src = readSource();
    assert.ok(src.includes('DescriptionItem'), 'missing DescriptionItem');
  });
  it('imports DescriptionList', () => {
    const src = readSource();
    assert.ok(src.includes('DescriptionList'), 'missing DescriptionList');
  });
  it('imports DetailActionBar', () => {
    const src = readSource();
    assert.ok(src.includes('DetailActionBar'), 'missing DetailActionBar');
  });
  it('imports DetailActionBarAction', () => {
    const src = readSource();
    assert.ok(src.includes('DetailActionBarAction'), 'missing DetailActionBarAction');
  });
  it('imports DetailClosureBar', () => {
    const src = readSource();
    assert.ok(src.includes('DetailClosureBar'), 'missing DetailClosureBar');
  });
  it('imports DetailClosureLink', () => {
    const src = readSource();
    assert.ok(src.includes('DetailClosureLink'), 'missing DetailClosureLink');
  });
  it('imports DetailShell', () => {
    const src = readSource();
    assert.ok(src.includes('DetailShell'), 'missing DetailShell');
  });
  it('imports DetailShellAction', () => {
    const src = readSource();
    assert.ok(src.includes('DetailShellAction'), 'missing DetailShellAction');
  });
  it('imports StatusBadge', () => {
    const src = readSource();
    assert.ok(src.includes('StatusBadge'), 'missing StatusBadge');
  });
  it('uses useToast', () => {
    const src = readSource();
    assert.ok(src.includes('useToast'), 'missing useToast');
  });
  it('uses Input', () => {
    const src = readSource();
    assert.ok(src.includes('Input'), 'missing Input');
  });
  it('uses DetailShell', () => {
    const src = readSource();
    assert.ok(src.includes('DetailShell'), 'missing DetailShell');
  });
  it('uses StatusBadge', () => {
    const src = readSource();
    assert.ok(src.includes('StatusBadge'), 'missing StatusBadge');
  });
  it('defines InboundItem interface/type', () => {
    const src = readSource();
    assert.ok(src.includes('interface InboundItem') || src.includes('type InboundItem'), 'missing InboundItem');
  });
  it('defines InboundDetail interface/type', () => {
    const src = readSource();
    assert.ok(src.includes('interface InboundDetail') || src.includes('type InboundDetail'), 'missing InboundDetail');
  });
});

describe('InboundReceivingPage - 反例', () => {
  it('no dangerousSetInnerHTML', () => {
    const src = readSource();
    assert.doesNotMatch(src, /dangerouslySetInnerHTML/);
  });
  it('no any type', () => {
    const src = readSource();
    assert.doesNotMatch(src, /:\s*any\b/);
  });
  it('no secret leak', () => {
    const src = readSource();
    assert.doesNotMatch(src, /(?:secret|password|api[_-]?key)/i);
  });
  it('no raw console.log', () => {
    const src = readSource();
    assert.ok(!src.includes('console.log(') || src.includes('// console.log'), 'bare console.log');
  });
});

describe('InboundReceivingPage - 边界', () => {
  it('has conditional rendering', () => {
    const src = readSource();
    assert.ok(src.includes('?'), 'missing conditional');
  });
  it('uses .map() iteration', () => {
    const src = readSource();
    assert.ok(src.includes('.map('), 'missing .map');
  });
});

describe('InboundReceivingPage - 数据完整性', () => {
  it('includes context "上架中..."', () => {
    const src = readSource();
    assert.ok(src.includes('上架中'), 'missing 上架中');
  });
  it('includes context "不合格..."', () => {
    const src = readSource();
    assert.ok(src.includes('不合格'), 'missing 不合格');
  });
  it('includes context "云南咖啡基地..."', () => {
    const src = readSource();
    assert.ok(src.includes('云南咖啡基地'), 'missing 云南咖啡基地');
  });
  it('includes context "供应商..."', () => {
    const src = readSource();
    assert.ok(src.includes('供应商'), 'missing 供应商');
  });
  it('includes context "入库单号..."', () => {
    const src = readSource();
    assert.ok(src.includes('入库单号'), 'missing 入库单号');
  });
  it('includes context "入库单已取消..."', () => {
    const src = readSource();
    assert.ok(src.includes('入库单已取消'), 'missing 入库单已取消');
  });
  it('includes context "入库操作..."', () => {
    const src = readSource();
    assert.ok(src.includes('入库操作'), 'missing 入库操作');
  });
  it('includes context "关联采购单..."', () => {
    const src = readSource();
    assert.ok(src.includes('关联采购单'), 'missing 关联采购单');
  });
  it('includes context "创建时间..."', () => {
    const src = readSource();
    assert.ok(src.includes('创建时间'), 'missing 创建时间');
  });
  it('includes context "取消..."', () => {
    const src = readSource();
    assert.ok(src.includes('取消'), 'missing 取消');
  });
  it('has constant router', () => {
    const src = readSource();
    assert.ok(src.includes('router'), 'missing router');
  });
  it('has constant toast', () => {
    const src = readSource();
    assert.ok(src.includes('toast'), 'missing toast');
  });
  it('has constant status', () => {
    const src = readSource();
    assert.ok(src.includes('status'), 'missing status');
  });
  it('has constant confirmAndProceed', () => {
    const src = readSource();
    assert.ok(src.includes('confirmAndProceed'), 'missing confirmAndProceed');
  });
  it('has constant handleItemQtyChange', () => {
    const src = readSource();
    assert.ok(src.includes('handleItemQtyChange'), 'missing handleItemQtyChange');
  });
});