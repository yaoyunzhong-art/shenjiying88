/**
 * staff-performance/page.test.tsx — 员工绩效看板 L1 冒烟测试
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

describe('staff-performance/page — 正例', () => {
  it('应导出一个默认组件 StaffPerformancePage', () => {
    const src = readSource();
    assert.ok(src.includes('export default function StaffPerformancePage'), '应导出默认函数组件');
  });

  it('应导出 StaffPerformanceRecord 类型', () => {
    const src = readSource();
    assert.ok(src.includes('export interface StaffPerformanceRecord'), '应导出 StaffPerformanceRecord 接口');
  });

  it('应导入 StaffPerformanceClient', () => {
    const src = readSource();
    assert.ok(src.includes('import { StaffPerformanceClient }'), '应导入客户端组件');
  });

  it('应包含 Mock 数据定义', () => {
    const src = readSource();
    assert.ok(src.includes('MOCK_RECORDS'), '应定义 Mock 数据');
  });

  it('Mock 数据应包含至少 5 条记录', () => {
    const src = readSource();
    const matches = src.match(/id:\s+'sp-/g);
    assert.ok(matches && matches.length >= 5, `Mock 数据 >= 5 条, 实际: ${matches?.length ?? 0}`);
  });

  it('应包含所有绩效等级 (A/B/C/D)', () => {
    const src = readSource();
    assert.ok(src.includes("grade: 'A'"), '应包含 A 级');
    assert.ok(src.includes("grade: 'B'"), '应包含 B 级');
    assert.ok(src.includes("grade: 'C'"), '应包含 C 级');
    assert.ok(src.includes("grade: 'D'"), '应包含 D 级');
  });
});

describe('staff-performance/client — 正例', () => {
  const CLIENT_SOURCE = resolve(__dirname, 'staff-performance-client.tsx');

  it('客户端文件应存在', () => {
    const src = readFileSync(CLIENT_SOURCE, 'utf-8');
    assert.ok(src.length > 0, '文件不应为空');
  });

  it('应使用 useSearchFilter', () => {
    const src = readFileSync(CLIENT_SOURCE, 'utf-8');
    assert.ok(src.includes('useSearchFilter'), '应使用搜索过滤 hook');
  });

  it('应使用 usePagination', () => {
    const src = readFileSync(CLIENT_SOURCE, 'utf-8');
    assert.ok(src.includes('usePagination'), '应使用分页 hook');
  });

  it('应定义绩效等级配置', () => {
    const src = readFileSync(CLIENT_SOURCE, 'utf-8');
    assert.ok(src.includes('GRADE_CONFIG'), '应定义等级配置');
    assert.ok(src.includes('优秀'), '等级配置应包含"优秀"');
    assert.ok(src.includes('待改进'), '等级配置应包含"待改进"');
  });

  it('应定义筛选 Tabs', () => {
    const src = readFileSync(CLIENT_SOURCE, 'utf-8');
    assert.ok(src.includes('FILTER_TABS'), '应定义筛选标签');
    assert.ok(src.includes('below_target'), '应包含"未达标"筛选');
  });

  it('应导出 StaffPerformanceClient', () => {
    const src = readFileSync(CLIENT_SOURCE, 'utf-8');
    assert.ok(src.includes('export function StaffPerformanceClient'), '应导出客户端组件');
  });
});

describe('staff-performance — 防御', () => {
  it('不应包含硬编码的敏感信息', () => {
    const src = readSource();
    // 不应出现真实电话号码或密码
    assert.ok(!src.match(/1[3-9]\d{9}/), '不应包含手机号');
    assert.ok(!src.includes('password'), '不应包含密码字段');
  });

  it('不支持在 page 层使用 useState/useEffect', () => {
    const src = readSource();
    assert.ok(!src.includes('useState'), 'page.tsx 不应使用 useState');
    assert.ok(!src.includes('useEffect'), 'page.tsx 不应使用 useEffect');
  });

  it('客户端文件应使用 "use client" 指令', () => {
    const clientSrc = readFileSync(resolve(__dirname, 'staff-performance-client.tsx'), 'utf-8');
    assert.ok(clientSrc.includes("'use client'"), '客户端组件应有 use client 指令');
  });
});
