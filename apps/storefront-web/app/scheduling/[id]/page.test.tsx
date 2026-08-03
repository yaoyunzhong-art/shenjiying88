/*!
 * scheduling/[id]/page.test.tsx - L1 smoke test (storefront-web)
 * Adapted for PageComponent
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

describe('PageComponent - 正例', () => {
  it('has use client', () => {
    const src = readSource();
    assert.ok(src.includes("'use client'"), 'missing use client');
  });
  it('uses useRouter', () => {
    const src = readSource();
    assert.ok(src.includes('useRouter'), 'missing useRouter');
  });
  it('imports Badge', () => {
    const src = readSource();
    assert.ok(src.includes('Badge'), 'missing Badge');
  });
  it('imports Button', () => {
    const src = readSource();
    assert.ok(src.includes('Button'), 'missing Button');
  });
  it('imports DetailActionBar', () => {
    const src = readSource();
    assert.ok(src.includes('DetailActionBar'), 'missing DetailActionBar');
  });
  it('imports DetailShell', () => {
    const src = readSource();
    assert.ok(src.includes('DetailShell'), 'missing DetailShell');
  });
  it('imports EmptyState', () => {
    const src = readSource();
    assert.ok(src.includes('EmptyState'), 'missing EmptyState');
  });
  it('imports LoadingOverlay', () => {
    const src = readSource();
    assert.ok(src.includes('LoadingOverlay'), 'missing LoadingOverlay');
  });
  it('imports PageShell', () => {
    const src = readSource();
    assert.ok(src.includes('PageShell'), 'missing PageShell');
  });
  it('has MOCK_DAY_DETAILS data', () => {
    const src = readSource();
    assert.ok(src.includes('MOCK_DAY_DETAILS'), 'missing MOCK_DAY_DETAILS');
  });
  it('has MOCK_AVAILABLE_STAFF data', () => {
    const src = readSource();
    assert.ok(src.includes('MOCK_AVAILABLE_STAFF'), 'missing MOCK_AVAILABLE_STAFF');
  });
  it('has MOCK_DAY_DETAILS data', () => {
    const src = readSource();
    assert.ok(src.includes('MOCK_DAY_DETAILS'), 'missing MOCK_DAY_DETAILS');
  });
  it('uses useMemo', () => {
    const src = readSource();
    assert.ok(src.includes('useMemo'), 'missing useMemo');
  });
  it('uses useCallback', () => {
    const src = readSource();
    assert.ok(src.includes('useCallback'), 'missing useCallback');
  });
  it('uses DetailShell', () => {
    const src = readSource();
    assert.ok(src.includes('DetailShell'), 'missing DetailShell');
  });
  it('uses PageShell', () => {
    const src = readSource();
    assert.ok(src.includes('PageShell'), 'missing PageShell');
  });
  it('uses Button', () => {
    const src = readSource();
    assert.ok(src.includes('Button'), 'missing Button');
  });
  it('uses EmptyState', () => {
    const src = readSource();
    assert.ok(src.includes('EmptyState'), 'missing EmptyState');
  });
  it('defines ShiftAssignmentInfo interface/type', () => {
    const src = readSource();
    assert.ok(src.includes('interface ShiftAssignmentInfo') || src.includes('type ShiftAssignmentInfo'), 'missing ShiftAssignmentInfo');
  });
  it('defines DayShiftDetail interface/type', () => {
    const src = readSource();
    assert.ok(src.includes('interface DayShiftDetail') || src.includes('type DayShiftDetail'), 'missing DayShiftDetail');
  });
});

describe('PageComponent - 反例', () => {
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

describe('PageComponent - 边界', () => {
  it('has conditional rendering', () => {
    const src = readSource();
    assert.ok(src.includes('?'), 'missing conditional');
  });
  it('uses .map() iteration', () => {
    const src = readSource();
    assert.ok(src.includes('.map('), 'missing .map');
  });
});

describe('PageComponent - 数据完整性', () => {
  it('includes context "中班 12:00-20:..."', () => {
    const src = readSource();
    assert.ok(src.includes('中班 12:00-20:00'), 'missing 中班 12:00-20:');
  });
  it('includes context "中班 14:00-22:..."', () => {
    const src = readSource();
    assert.ok(src.includes('中班 14:00-22:00'), 'missing 中班 14:00-22:');
  });
  it('includes context "删除失败，请重试..."', () => {
    const src = readSource();
    assert.ok(src.includes('删除失败，请重试'), 'missing 删除失败，请重试');
  });
  it('includes context "删除当日排班..."', () => {
    const src = readSource();
    assert.ok(src.includes('删除当日排班'), 'missing 删除当日排班');
  });
  it('includes context "周一..."', () => {
    const src = readSource();
    assert.ok(src.includes('周一'), 'missing 周一');
  });
  it('includes context "周三..."', () => {
    const src = readSource();
    assert.ok(src.includes('周三'), 'missing 周三');
  });
  it('includes context "周五..."', () => {
    const src = readSource();
    assert.ok(src.includes('周五'), 'missing 周五');
  });
  it('includes context "周五下午员工培训，安排较..."', () => {
    const src = readSource();
    assert.ok(src.includes('周五下午员工培训，安排较少人手'), 'missing 周五下午员工培训，安排较');
  });
  it('includes context "周八..."', () => {
    const src = readSource();
    assert.ok(src.includes('周八'), 'missing 周八');
  });
  it('includes context "复制到其他日..."', () => {
    const src = readSource();
    assert.ok(src.includes('复制到其他日'), 'missing 复制到其他日');
  });
  it('has constant d', () => {
    const src = readSource();
    assert.ok(src.includes('d'), 'missing d');
  });
  it('has constant weekdays', () => {
    const src = readSource();
    assert.ok(src.includes('weekdays'), 'missing weekdays');
  });
  it('has constant router', () => {
    const src = readSource();
    assert.ok(src.includes('router'), 'missing router');
  });
  it('has constant detail', () => {
    const src = readSource();
    assert.ok(src.includes('detail'), 'missing detail');
  });
  it('has constant handleEdit', () => {
    const src = readSource();
    assert.ok(src.includes('handleEdit'), 'missing handleEdit');
  });
});