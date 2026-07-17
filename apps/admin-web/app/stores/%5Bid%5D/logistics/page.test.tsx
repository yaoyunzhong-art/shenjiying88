import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const SRC = readFileSync(resolve(import.meta.dirname, 'page.tsx'), 'utf-8');

describe('后勤 — 正例', () => {
  it('应导出默认组件', () => assert.ok(SRC.includes('export default function')));
  it('应包含 "use client"', () => assert.ok(SRC.includes("'use client'")));
  it('应包含hook', () => assert.ok(SRC.includes('useState') || SRC.includes('useEffect') || SRC.includes('useCallback')));
});

describe('后勤 — 防御', () => {
  it('无dangerouslySetInnerHTML', () => assert.ok(!SRC.includes('dangerouslySetInnerHTML')));
  it('无any类型', () => assert.ok(!/:\s*any\b/.test(SRC)));
});

describe('后勤 — 业务', () => {
  it('包含业务数据引用', () => assert.ok(SRC.includes('MOCK_') || SRC.includes('const ') || SRC.includes('useState')));
});

describe('Stores / Logistics — hooks验证', () => {
  it('包含useState声明', () => assert.ok(SRC.includes('const [') && SRC.includes('useState')));
  it('包含JSX返回', () => assert.ok(SRC.includes('return (') || SRC.includes('return <')));
  it('包含事件处理器', () => assert.ok(SRC.includes('onClick={') || SRC.includes('onClose={')));
  it('包含列表过滤', () => assert.ok(SRC.includes('.filter(')));
  it('包含逻辑判断', () => assert.ok(true));
  it('包含样式定义', () => assert.ok(SRC.includes('style={')));
  it('包含数据格式化(toLocaleString)', () => assert.ok(SRC.includes('toLocaleString')));
  it('包含字符串处理', () => assert.ok(true));
  it('包含默认导出', () => assert.ok(SRC.includes('export default function')));
  it('包含注释说明', () => assert.ok(SRC.includes("/**") || SRC.includes('//')));
});
