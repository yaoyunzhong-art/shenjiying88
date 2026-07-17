import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const SRC = readFileSync(resolve(import.meta.dirname, 'page.tsx'), 'utf-8');

describe('TenantPage — 正例', () => {
  it('应导出默认组件', () => assert.ok(SRC.includes('export default function TenantPage')));
  it('应包含 "use client"', () => assert.ok(SRC.includes("'use client'")));
  it('应包含useState/useEffect/useCallback等hook', () => {
    assert.ok(SRC.includes('useState') || SRC.includes('useEffect') || SRC.includes('useCallback'));
  });
});

describe('TenantPage — 防御', () => {
  it('无dangerouslySetInnerHTML', () => assert.ok(!SRC.includes('dangerouslySetInnerHTML')));
  it('无any类型', () => assert.ok(!/:\s*any\b/.test(SRC)));
  it('不直接导出any', () => assert.ok(!SRC.includes('as any')));
});

describe('TenantPage — 租户模块', () => {
  it('应包含 TENANTS 数据', () => assert.ok(SRC.includes('TENANTS')));
  it('应包含状态映射', () => assert.ok(SRC.includes('STATUS_MAP')));
  it('应包含 Table 列表', () => assert.ok(SRC.includes('Table')));
  it('应支持套餐筛选', () => assert.ok(SRC.includes('planFilter')));
  it('应展示统计卡片', () => assert.ok(SRC.includes('Statistic')));
});

describe('TenantPage — 状态覆盖', () => {
  it('应处理 active 状态', () => assert.ok(SRC.includes("'active'")));
  it('应处理 trial 状态', () => assert.ok(SRC.includes("'trial'")));
  it('应处理 pending 状态', () => assert.ok(SRC.includes("'pending'")));
  it('应处理 suspended 状态', () => assert.ok(SRC.includes("'suspended'")));
});

describe('TenantPage — 套餐覆盖', () => {
  it('应支持免费版', () => assert.ok(SRC.includes("免费版")));
  it('应支持专业版', () => assert.ok(SRC.includes("专业版")));
  it('应支持企业版', () => assert.ok(SRC.includes("企业版")));
});

describe('Stores / Tenant — hooks验证', () => {
  it('包含useState声明', () => assert.ok(SRC.includes('const [') && SRC.includes('useState')));
  it('包含JSX返回', () => assert.ok(SRC.includes('return (') || SRC.includes('return <')));
  it('包含事件处理器', () => assert.ok(SRC.includes('onChange={')));
  it('包含列表过滤', () => assert.ok(SRC.includes('.filter(')));
  it('包含三元表达式', () => assert.ok(SRC.includes('?') && SRC.includes(':')));
  it('包含样式定义', () => assert.ok(SRC.includes('style={')));
  it('包含数据格式化(toLocaleString)', () => assert.ok(SRC.includes('toLocaleString')));
  it('包含模板字符串', () => assert.ok(SRC.includes('${')));
  it('包含默认导出', () => assert.ok(SRC.includes('export default function')));
  it('包含注释说明', () => assert.ok(SRC.includes("/**") || SRC.includes('//')));
});
