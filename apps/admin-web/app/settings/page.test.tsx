import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const SRC = readFileSync(resolve(import.meta.dirname, 'page.tsx'), 'utf-8');

describe('SettingsPage — 正例', () => {
  it('应导出默认组件', () => assert.ok(SRC.includes('export default function SettingsPage')));
  it('应包含 "use client"', () => assert.ok(SRC.includes("'use client'")));
  it('应包含useState/useEffect/useCallback等hook', () => {
    assert.ok(SRC.includes('useState') || SRC.includes('useEffect') || SRC.includes('useCallback'));
  });
});

describe('SettingsPage — 防御', () => {
  it('无dangerouslySetInnerHTML', () => assert.ok(!SRC.includes('dangerouslySetInnerHTML')));
  it('无any类型', () => assert.ok(!/:\s*any\b/.test(SRC)));
  it('不直接导出any', () => assert.ok(!SRC.includes('as any')));
});

describe('SettingsPage — 配置模块', () => {
  it('应包含 MODULES 定义', () => assert.ok(SRC.includes('const MODULES')));
  it('应包含配置模块数量', () => assert.ok(SRC.match(/MODULES\.length/)));
  it('应使用 Link 导航', () => assert.ok(SRC.includes('from \'next/link\'')));
  it('应渲染统计卡片', () => assert.ok(SRC.includes('statsRow')));
  it('应包含状态映射', () => assert.ok(SRC.includes('STATUS_LABEL') && SRC.includes('STATUS_COLOR')));
});

describe('SettingsPage — 状态覆盖', () => {
  it('应处理 configured 状态', () => assert.ok(SRC.includes("'configured'")));
  it('应处理 partial 状态', () => assert.ok(SRC.includes("'partial'")));
  it('应处理 pending 状态', () => assert.ok(SRC.includes("'pending'")));
});
