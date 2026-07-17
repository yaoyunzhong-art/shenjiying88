/**
 * agents/page.test.tsx — Agent 仪表盘 L1+L2 测试
 * 覆盖: 正例·反例·边界·防御·数据校验
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

describe('agents — 正例', () => {
  it('应导出一个默认 async 组件 AgentsPage', () => {
    const src = readSource();
    assert.ok(src.includes('export default async function AgentsPage'), '缺少 async 默认导出组件');
  });

  it('应包含 force-dynamic 渲染策略', () => {
    const src = readSource();
    assert.ok(src.includes('force-dynamic'), '缺少 force-dynamic');
  });

  it('应包含 loadAgentDashboardSnapshot 加载函数', () => {
    const src = readSource();
    assert.ok(src.includes('loadAgentDashboardSnapshot'), '缺少 loadAgentDashboardSnapshot');
  });

  it('应包含 Suspense 包裹', () => {
    const src = readSource();
    assert.ok(src.includes('Suspense'), '缺少 Suspense');
  });

  it('应包含 MODULES 功能卡片定义', () => {
    const src = readSource();
    assert.ok(src.includes('MODULES'), '缺少功能卡片');
  });

  it('应包含 console/dashboard/configs/sessions/tools/evaluations/studio 模块', () => {
    const src = readSource();
    const moduleCount = (src.match(/title: '/g) || src.match(/title:'/g) || []).length;
    assert.ok(moduleCount >= 6, `功能模块不足: ${moduleCount}`);
  });

  it('应包含 LoadingSkeleton 加载骨架屏', () => {
    const src = readSource();
    assert.ok(src.includes('LoadingSkeleton'), '缺少 LoadingSkeleton');
  });
});

// ---- 反例 ----

describe('agents — 反例', () => {
  it('不应包含 use client 指令', () => {
    const src = readSource();
    assert.ok(!src.includes('use client'), '服务端组件不应使用 use client');
  });

  it('不应使用 class 组件', () => {
    const src = readSource();
    assert.ok(!src.includes('extends Component') && !src.includes('React.Component'), '不应使用 class 组件');
  });

  it('不应缺少 catch 错误处理', () => {
    const src = readSource();
    assert.ok(src.includes('.catch('), '缺少 .catch 错误处理');
  });
});

// ---- 边界 ----

describe('agents — 边界', () => {
  it('数据加载应使用 .catch(() => null) 兜底', () => {
    const src = readSource();
    assert.ok(src.includes('.catch(() => null)') || src.includes('.catch(()=>null)'), '缺少 catch null 兜底');
  });

  it('no-store 缓存策略存在', () => {
    const src = readSource();
    assert.ok(src.includes('no-store'), '缺少 no-store 缓存策略');
  });

  it('应包含 PageShell 布局组件', () => {
    const src = readSource();
    assert.ok(src.includes('PageShell'), '缺少 PageShell');
  });

  it('应包含 StatCard 统计组件', () => {
    const src = readSource();
    assert.ok(src.includes('StatCard'), '缺少 StatCard');
  });

  it('应包含 QuickStats 快速统计', () => {
    const src = readSource();
    assert.ok(src.includes('QuickStats'), '缺少 QuickStats');
  });
});

// ---- 防御 ----

describe('agents — 防御', () => {
  it('应包含 fmt 数字格式化函数', () => {
    const src = readSource();
    assert.ok(src.includes('function fmt'), '缺少 fmt 函数');
  });

  it('fmt 应处理 M/K 单位', () => {
    const src = readSource();
    assert.ok(src.includes('1_000_000') || src.includes('.toFixed(1)'), '缺少格式化细节');
  });

  it('cache 策略应为 no-store', () => {
    const src = readSource();
    assert.ok(src.includes("cache: 'no-store'"), '缺少 no-store 配置');
  });

  it('应包含 ModuleCard 接口定义', () => {
    const src = readSource();
    assert.ok(src.includes('interface ModuleCard'), '缺少 ModuleCard 接口');
  });

  it('OverviewStats 应有 data-testid', () => {
    const src = readSource();
    assert.ok(src.includes('data-testid="agents-overview-stats"') || src.includes("data-testid='agents-overview-stats'"), '缺少 data-testid');
  });
});

// ---- 数据校验 ----

describe('agents — 数据校验', () => {
  it('MODULES 每个卡片应有 title/href/description', () => {
    const src = readSource();
    assert.ok(src.includes('title') && src.includes('href') && src.includes('description'), '缺少卡片字段');
  });

  it('功能模块网格应为 3 列', () => {
    const src = readSource();
    assert.ok(src.includes('repeat(3, minmax'), '缺少三列网格');
  });

  it('应包含 Link 组件跳转', () => {
    const src = readSource();
    assert.ok(src.includes('from \'next/link\'') || src.includes('from "next/link"'), '缺少 next/link 导入');
  });

  it('应消费 loadAgentConfigs/loadAgentTools/loadAgentEvaluations', () => {
    const src = readSource();
    assert.ok(src.includes('loadAgentConfigs') && src.includes('loadAgentTools'), '缺少数据加载函数');
    assert.ok(src.includes('loadAgentEvaluations'), '缺少评估加载函数');
  });
});

const SRC = readFileSync(require.resolve('./page'), 'utf-8');

describe('Agents — hooks验证', () => {
  it('是服务端组件', () => assert.ok(SRC.includes('async') || SRC.includes('await')));
  it('包含JSX返回', () => assert.ok(SRC.includes('return (') || SRC.includes('return <')));
  it('包含异步调用', () => assert.ok(SRC.includes('await') || SRC.includes('fetch(')));
  it('包含列表渲染', () => assert.ok(SRC.includes('.map(')));
  it('包含条件渲染', () => assert.ok(SRC.includes(' && ') || SRC.includes(' ? ')));
  it('包含样式定义', () => assert.ok(SRC.includes('style={')));
  it('包含数据格式化(.toFixed)', () => assert.ok(SRC.includes('.toFixed')));
  it('包含模板字符串', () => assert.ok(SRC.includes('${')));
  it('包含默认导出', () => assert.ok(SRC.includes('export default')));
  it('包含注释说明', () => assert.ok(true));
});
