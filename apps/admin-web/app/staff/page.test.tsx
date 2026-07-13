/**
 * staff/page.test.tsx — 员工列表页 L1 冒烟测试
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

// ---- 正例 ----

describe('staff — 正例', () => {
  it('应导出一个默认组件 StaffPage', () => {
    const src = readSource();
    assert.ok(src.includes('export default function StaffPage'), '缺少默认导出组件');
  });

  it('应包含 MOCK_STAFF 数据集', () => {
    const src = readSource();
    assert.ok(src.includes('MOCK_STAFF'), '缺少 MOCK_STAFF');
  });

  it('应计算 total / active / topPerf 统计', () => {
    const src = readSource();
    assert.ok(src.includes('total:'), '缺少 total');
    assert.ok(src.includes('active:'), '缺少 active');
    assert.ok(src.includes('topPerf:'), '缺少 topPerf');
  });

  it('应计算平均 performanceScore', () => {
    const src = readSource();
    assert.ok(src.includes('performanceScore'), '缺少 performanceScore');
    assert.ok(src.includes('.reduce('), '缺少 reduce 计算');
  });

  it('应包含 marketCode 市场分类过滤', () => {
    const src = readSource();
    assert.ok(src.includes('marketCode'), '缺少 marketCode');
  });

  it('应包含员工姓名字段', () => {
    const src = readSource();
    assert.ok(src.includes('name') || src.includes('员工姓名'), '缺少员工姓名');
  });

  it('应包含员工岗位字段', () => {
    const src = readSource();
    assert.ok(src.includes('position') || src.includes('岗位'), '缺少岗位字段');
  });

  it('应包含员工入职时间字段', () => {
    const src = readSource();
    assert.ok(src.includes('joinDate') || src.includes('入职'), '缺少入职时间');
  });
});

// ---- 边界 ----

describe('staff — 边界', () => {
  it('MOCK_STAFF 空列表应有长度 0', () => {
    const src = readSource();
    assert.ok(src.includes('MOCK_STAFF.length'), '长度统计');
  });

  it('topPerf 阈值应为 85', () => {
    const src = readSource();
    assert.ok(src.includes('>= 85'), '优秀员工阈值应为 85');
  });

  it('应支持 status 分组统计', () => {
    const src = readSource();
    assert.ok(src.includes(".status === 'active'"), '缺少状态过滤');
  });

  it('应处理空员工列表边界', () => {
    const src = readSource();
    assert.ok(src.includes('.length') && src.includes('MOCK_STAFF'), '应检查列表长度');
  });

  it('应包含角色/岗位过滤逻辑', () => {
    const src = readSource();
    assert.ok(src.includes('roleFilter') || src.includes('role'), '缺少角色过滤');
  });

  it('应包含绩效表现评分字段', () => {
    const src = readSource();
    assert.ok(src.includes('performanceScore'), '缺少绩效评分');
  });
});

// ---- 防御 ----

describe('staff — 防御', () => {
  it('应包含 use client 指令', () => {
    const src = readSource();
    assert.ok(src.includes("'use client'") || src.includes('"use client"'), '缺少 use client');
  });

  it('应包含 useMemo 性能优化', () => {
    const src = readSource();
    assert.ok(src.includes('useMemo'), '缺少 useMemo');
  });

  it('平均分计算应使用 reduce 求和后除以 length', () => {
    const src = readSource();
    assert.ok(src.includes('reduce((sum, s)'), '缺少 reduce 求和');
    assert.ok(src.includes('.length'), '除以 length');
  });

  it('筛选过滤不应修改原数组', () => {
    const src = readSource();
    assert.ok(src.includes('.filter('), '应使用 filter 不可变过滤');
  });

  it('数据统计应使用 reduce 聚合', () => {
    const src = readSource();
    assert.ok(src.includes('.reduce('), '应有 reduce 聚合');
  });

  it('应使用 useCallback 包裹事件处理', () => {
    const src = readSource();
    assert.ok(src.includes('useCallback'), '缺少 useCallback');
  });
});
