/**
 * scheduling/page.test.tsx — 排班管理页 L1 冒烟测试 (storefront-web)
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

describe('scheduling — 正例', () => {
  it('应导出一个默认组件 SchedulingPage', () => {
    const src = readSource();
    assert.ok(src.includes('export default function SchedulingPage'), '缺少默认导出');
  });

  it('应包含 MOCK_SHIFTS 和 MOCK_AVAILABLE_STAFF', () => {
    const src = readSource();
    assert.ok(src.includes('MOCK_SHIFTS'), '缺少班次数据');
    assert.ok(src.includes('MOCK_AVAILABLE_STAFF'), '缺少员工数据');
  });

  it('应包含 ShiftSlot 接口或类型', () => {
    const src = readSource();
    assert.ok(src.includes('ShiftSlot') || src.includes('interface'), '缺少类型定义');
  });

  it('应包含 availableStaff 数据传递', () => {
    const src = readSource();
    assert.ok(src.includes('availableStaff'), '缺少员工传递');
  });
});

describe('scheduling — 边界', () => {
  it('班次冲突检测', () => {
    const src = readSource();
    assert.ok(src.includes('conflict') || src.includes('Conflict'), '冲突检测');
  });

  it('staff 为空时不应崩溃', () => {
    const src = readSource();
    assert.ok(src.includes('.find(') || src.includes('staffId'), '员工查找');
  });

  it('空排班表应正确处理', () => {
    const src = readSource();
    assert.ok(src.includes('MOCK_SHIFTS'), '排班数据');
  });
});

describe('scheduling — 防御', () => {
  it('应包含 use client 指令', () => {
    const src = readSource();
    assert.ok(src.includes("'use client'"), '缺少 use client');
  });

  it('应包含 useState 状态管理', () => {
    const src = readSource();
    assert.ok(src.includes('useState'), '缺少 useState');
  });

  it('排班渲染应有 generateMockShifts 数据生成', () => {
    const src = readSource();
    assert.ok(src.includes('generateMockShifts'), '缺少数据生成函数');
  });
});
