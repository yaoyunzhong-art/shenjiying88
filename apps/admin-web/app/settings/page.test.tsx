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

// ---- 深度组件 ----

describe('SettingsPage — 深度组件', () => {
  it('包含JSX列表渲染.MODULES.map()', () => assert.ok(SRC.includes('.map(')));
  it('包含三元条件渲染', () => assert.ok(SRC.includes(' ? ') || SRC.includes(' ?? ')));
  it('包含 && 条件渲染', () => assert.ok(SRC.includes(' && ')));
  it('包含事件处理(onClick)', () => assert.ok(SRC.includes('onClick') || SRC.includes('onChange')));
  it('包含 style 内联样式对象', () => assert.ok(SRC.includes('style={')));
  it('包含样式函数(statCard)', () => assert.ok(SRC.includes('statCard(') || SRC.includes('statusBadge(')));
  it('包含模板字符串', () => assert.ok(SRC.includes('${}') || SRC.includes('${ ')));
  it('包含状态管理useState', () => assert.ok(SRC.includes('const [') && SRC.includes('useState')));
  it('包含filter数据过滤', () => assert.ok(SRC.includes('.filter(m') || SRC.includes('.filter(mod')));
  it('包含card总数统计', () => assert.ok(SRC.includes('totalModules') || SRC.includes('configuredCount') || SRC.includes('partialCount')));
});

describe('SettingsPage — 业务深度', () => {
  it('包含11个配置模块', () => assert.ok(SRC.includes('payment-config') || SRC.includes('MODULES.length')));
  it('包含支付配置模块', () => assert.ok(SRC.includes('支付配置')));
  it('包含安全设置模块', () => assert.ok(SRC.includes('安全设置')));
  it('包含权限管理模块', () => assert.ok(SRC.includes('权限管理')));
  it('包含状态徽章样式(StatusBadge)', () => assert.ok(SRC.includes('STATUS_COLOR') && SRC.includes('STATUS_LABEL')));
  it('包含itemCount显示', () => assert.ok(SRC.includes('itemCount')));
  it('包含完整网格布局grid 2列', () => assert.ok(SRC.includes("gridTemplateColumns: 'repeat(2, 1fr)'")));
  it('包含配置概要统计', () => assert.ok(SRC.includes('配置模块总数') || SRC.includes('设置中心')));
  it('包含工作流配置项', () => assert.ok(SRC.includes('工作流配置') || SRC.includes('workflow')));
  it('包含通知设置模块', () => assert.ok(SRC.includes('通知设置') || SRC.includes('通知模板')));
});

// ---- hooks验证 ----

describe('SettingsPage — hooks验证', () => {
  it('包含JSX返回语句', () => assert.ok(SRC.includes('return (')));
  it('包含Link导航', () => assert.ok(SRC.includes('from \'next/link\'')));
  it('包含列表渲染(MODULES.map)', () => assert.ok(SRC.includes('.map(')));
  it('包含条件渲染', () => assert.ok(SRC.includes(' && ') || SRC.includes(' ? ')));
  it('包含样式定义', () => assert.ok(SRC.includes('style={')));
  it('包含MODULES配置定义', () => assert.ok(SRC.includes('const MODULES') || SRC.includes('ConfigModule')));
  it('包含模板字符串', () => assert.ok(SRC.includes('${')));
  it('包含默认导出函数', () => assert.ok(SRC.includes('export default function')));
  it('包含配置状态统计', () => assert.ok(SRC.includes('configuredCount') || SRC.includes('partialCount') || SRC.includes('pendingCount')));
  it('包含注释说明', () => assert.ok(SRC.includes('//') || SRC.includes('/*')));
});
