/*!
 * device-inspection/[id]/page.test.tsx - L1 smoke test (storefront-web)
 * Adapted for DeviceInspectionDetailPage
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

describe('DeviceInspectionDetailPage - 正例', () => {
  it('exports default DeviceInspectionDetailPage', () => {
    const src = readSource();
    assert.ok(src.includes('export default function DeviceInspectionDetailPage'), 'missing export');
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
  it('imports DataTable', () => {
    const src = readSource();
    assert.ok(src.includes('DataTable'), 'missing DataTable');
  });
  it('imports DataTableColumn', () => {
    const src = readSource();
    assert.ok(src.includes('DataTableColumn'), 'missing DataTableColumn');
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
  it('has MOCK_HISTORY data', () => {
    const src = readSource();
    assert.ok(src.includes('MOCK_HISTORY'), 'missing MOCK_HISTORY');
  });
  it('has MOCK_INSPECTION data', () => {
    const src = readSource();
    assert.ok(src.includes('MOCK_INSPECTION'), 'missing MOCK_INSPECTION');
  });
  it('has MOCK_INSPECTION data', () => {
    const src = readSource();
    assert.ok(src.includes('MOCK_INSPECTION'), 'missing MOCK_INSPECTION');
  });
  it('uses useCallback', () => {
    const src = readSource();
    assert.ok(src.includes('useCallback'), 'missing useCallback');
  });
  it('uses useToast', () => {
    const src = readSource();
    assert.ok(src.includes('useToast'), 'missing useToast');
  });
  it('uses DetailShell', () => {
    const src = readSource();
    assert.ok(src.includes('DetailShell'), 'missing DetailShell');
  });
  it('uses StatusBadge', () => {
    const src = readSource();
    assert.ok(src.includes('StatusBadge'), 'missing StatusBadge');
  });
  it('uses DataTable', () => {
    const src = readSource();
    assert.ok(src.includes('DataTable'), 'missing DataTable');
  });
  it('uses EmptyState', () => {
    const src = readSource();
    assert.ok(src.includes('EmptyState'), 'missing EmptyState');
  });
  it('defines InspectionItem interface/type', () => {
    const src = readSource();
    assert.ok(src.includes('interface InspectionItem') || src.includes('type InspectionItem'), 'missing InspectionItem');
  });
  it('defines DeviceInspection interface/type', () => {
    const src = readSource();
    assert.ok(src.includes('interface DeviceInspection') || src.includes('type DeviceInspection'), 'missing DeviceInspection');
  });
});

describe('DeviceInspectionDetailPage - 反例', () => {
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

describe('DeviceInspectionDetailPage - 边界', () => {
  it('has conditional rendering', () => {
    const src = readSource();
    assert.ok(src.includes('?'), 'missing conditional');
  });
  it('handles not-found state', () => {
    const src = readSource();
    assert.ok(src.includes('notFound') || src.includes('不存在'), 'missing not found');
  });
  it('uses .map() iteration', () => {
    const src = readSource();
    assert.ok(src.includes('.map('), 'missing .map');
  });
});

describe('DeviceInspectionDetailPage - 数据完整性', () => {
  it('includes context "1小时15分..."', () => {
    const src = readSource();
    assert.ok(src.includes('1小时15分'), 'missing 1小时15分');
  });
  it('includes context "B1层设备机房..."', () => {
    const src = readSource();
    assert.ok(src.includes('B1层设备机房'), 'missing B1层设备机房');
  });
  it('includes context "IT设备..."', () => {
    const src = readSource();
    assert.ok(src.includes('IT设备'), 'missing IT设备');
  });
  it('includes context "— 不适用..."', () => {
    const src = readSource();
    assert.ok(src.includes('— 不适用'), 'missing — 不适用');
  });
  it('includes context "✓ 通过..."', () => {
    const src = readSource();
    assert.ok(src.includes('✓ 通过'), 'missing ✓ 通过');
  });
  it('includes context "✗ 不通过..."', () => {
    const src = readSource();
    assert.ok(src.includes('✗ 不通过'), 'missing ✗ 不通过');
  });
  it('includes context "不通过..."', () => {
    const src = readSource();
    assert.ok(src.includes('不通过'), 'missing 不通过');
  });
  it('includes context "严重风险..."', () => {
    const src = readSource();
    assert.ok(src.includes('严重风险'), 'missing 严重风险');
  });
  it('includes context "中央空调主机系统 #3..."', () => {
    const src = readSource();
    assert.ok(src.includes('中央空调主机系统 #3'), 'missing 中央空调主机系统 #3');
  });
  it('includes context "中风险..."', () => {
    const src = readSource();
    assert.ok(src.includes('中风险'), 'missing 中风险');
  });
  it('has constant router', () => {
    const src = readSource();
    assert.ok(src.includes('router'), 'missing router');
  });
  it('has constant toast', () => {
    const src = readSource();
    assert.ok(src.includes('toast'), 'missing toast');
  });
  it('has constant handleTransition', () => {
    const src = readSource();
    assert.ok(src.includes('handleTransition'), 'missing handleTransition');
  });
  it('has constant handleConfirmTransition', () => {
    const src = readSource();
    assert.ok(src.includes('handleConfirmTransition'), 'missing handleConfirmTransition');
  });
  it('has constant handleEdit', () => {
    const src = readSource();
    assert.ok(src.includes('handleEdit'), 'missing handleEdit');
  });
});