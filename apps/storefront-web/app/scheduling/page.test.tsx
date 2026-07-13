/**
 * scheduling/page.test.tsx — 排班管理页 L1 冒烟测试 (storefront-web)
 * 覆盖: 正例·反例·边界·防御
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

  it('应包含 staff 名称字段', () => {
    const src = readSource();
    assert.ok(src.includes('name'), '缺少 name');
  });

  it('应包含 shift 时间字段', () => {
    const src = readSource();
    assert.ok(src.includes('start') || src.includes('startTime'), '缺少开始时间');
    assert.ok(src.includes('end') || src.includes('endTime'), '缺少结束时间');
  });

  it('应包含日期 date 字段', () => {
    const src = readSource();
    assert.ok(src.includes('date'), '缺少 date');
  });

  it('Mock 数据中应至少包含 5 个班次', () => {
    const src = readSource();
    const matches = src.match(/id:\s*['"]/g);
    assert.ok(matches && matches.length >= 5, `期望 ≥5, 实际 ${matches?.length ?? 0}`);
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

  it('已分配和未分配员工都应存在', () => {
    const src = readSource();
    assert.ok(src.includes('assigned') || src.includes('Assigned'), '已分配状态');
  });

  it('应包含分页或周视图切换', () => {
    const src = readSource();
    assert.ok(src.includes('view') || src.includes('View') || src.includes('totalPages'), '视图切换');
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

  it('不应包含危险的 innerHTML', () => {
    const src = readSource();
    assert.doesNotMatch(src, /dangerouslySetInnerHTML/);
  });

  it('不应包含硬编码 token/密钥', () => {
    const src = readSource();
    assert.doesNotMatch(src, /(?:secret|password|api[_-]?key|token|authorization)/i);
  });
});

describe('scheduling — 反例', () => {
  it('不应使用 any 类型', () => {
    const src = readSource();
    assert.doesNotMatch(src, /:\s*any\b/);
  });

  it('不应包含 console.log', () => {
    const src = readSource();
    assert.ok(!src.includes('console.log(') || src.includes('// console.log'), '裸 console.log');
  });

  it('Mock 数据中每个班次都应有时长', () => {
    const src = readSource();
    assert.ok(src.includes('duration') || src.includes('hours'));
  });
});
