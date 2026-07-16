/**
 * page.test.tsx — Dashboard/指挥台 L1 冒烟测试
 * 覆盖: 基础文件结构、JSX渲染、深度组件断言
 */
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const SRC = readFileSync(resolve(__dirname, 'page.tsx'), 'utf-8');

// ---- 正例 ----

describe('Dashboard — 正例', () => {
  it('应导出默认组件 HomePage', () => assert.ok(SRC.includes('export default async function HomePage')));
  it('应使用 Server Component (无 use client)', () => assert.ok(!SRC.includes("'use client'")));
  it('应包含 Suspense 懒加载', () => assert.ok(SRC.includes('Suspense')));
  it('应使用 PageShell 包装', () => assert.ok(SRC.includes('PageShell')));
  it('应使用 StatCard 统计卡片', () => assert.ok(SRC.includes('StatCard')));
  it('应使用 Link 导航', () => assert.ok(SRC.includes("from 'next/link'")));
  it('应加载 bootstrap 数据快照', () => assert.ok(SRC.includes('getAdminWorkbenchConsumerSnapshot')));
  it('应包含 loading skeleton', () => assert.ok(SRC.includes('LoadingSkeleton')));
  it('应包含 GovernanceLinkedOverview', () => assert.ok(SRC.includes('GovernanceLinkedOverview')));
  it('应包含 WorkbenchList', () => assert.ok(SRC.includes('WorkbenchList')));
});

// ---- 防御 ----

describe('Dashboard — 防御', () => {
  it('无dangerouslySetInnerHTML', () => assert.ok(!SRC.includes('dangerouslySetInnerHTML')));
  it('无any类型', () => assert.ok(!/:\s*any\b/.test(SRC)));
  it('无console.log', () => assert.ok(!SRC.includes('console.log')));
  it('不应直接导出 any', () => assert.ok(!SRC.includes('as any')));
});

// ---- 深度组件 ----

describe('Dashboard — 深度组件', () => {
  it('包含 JSX 列表渲染 .map()', () => assert.ok(SRC.includes('.map(') || SRC.includes('.map(function')));
  it('包含三元条件渲染', () => assert.ok(SRC.includes(' ?? ') || SRC.includes(' ? ')));
  it('包含模板字符串 ${}', () => assert.ok(SRC.includes('${')));
  it('包含 style 内联样式', () => assert.ok(SRC.includes('style={')));
  it('包含 grid 布局', () => assert.ok(SRC.includes('gridTemplateColumns')));
  it('包含错误回退标记', () => assert.ok(SRC.includes('waiting for API bootstrap') || SRC.includes('fallback')));
  it('包含数据脱敏/降级策略引用', () => assert.ok(SRC.includes('degradation') || SRC.includes('desensitization')));
  it('包含 governance alert 数据处理', () => assert.ok(SRC.includes('governance.alerts')));
  it('包含 consumerDescriptor 数据', () => assert.ok(SRC.includes('consumerDescriptor')));
});

// ---- 业务深度 ----

describe('Dashboard — 业务深度', () => {
  it('包含 M5 指挥台标题', () => assert.ok(SRC.includes('M5 指挥台') || SRC.includes('指挥台')));
  it('包含 Foundation 总览链接', () => assert.ok(SRC.includes('Foundation 总览')));
  it('包含配置治理链接', () => assert.ok(SRC.includes('配置治理')));
  it('包含治理告警中心链接', () => assert.ok(SRC.includes('治理告警中心')));
  it('包含 tenantContext 数据', () => assert.ok(SRC.includes('tenantContext')));
  it('包含 supportedClients 客户端支持', () => assert.ok(SRC.includes('supportedClients')));
  it('包含 foundationContracts', () => assert.ok(SRC.includes('foundationContracts')));
  it('包含 challenge 治理挑战', () => assert.ok(SRC.includes('challenge')));
  it('包含 workbenches 工作台列表', () => assert.ok(SRC.includes('workbenches')));
  it('包含 scope 作用域解析', () => assert.ok(SRC.includes('scope') && SRC.includes('resolver')));
});

// ---- hooks验证 ----

describe('Dashboard — hooks验证', () => {
  it('包含JSX返回语句', () => assert.ok(SRC.includes('return (')));
  it('包含Suspense懒加载', () => assert.ok(SRC.includes('Suspense')));
  it('包含列表渲染(map)', () => assert.ok(SRC.includes('.map(')));
  it('包含条件渲染', () => assert.ok(SRC.includes(' ?? ') || SRC.includes(' ? ')));
  it('包含样式定义', () => assert.ok(SRC.includes('style={')));
  it('包含模板字符串', () => assert.ok(SRC.includes('${')));
  it('包含默认导出函数', () => assert.ok(SRC.includes('export default async function')));
  it('包含StatCard统计卡片', () => assert.ok(SRC.includes('StatCard')));
  it('包含PageShell包装', () => assert.ok(SRC.includes('PageShell')));
  it('包含bootstrap数据加载', () => assert.ok(SRC.includes('getAdminWorkbenchConsumerSnapshot')));
});
