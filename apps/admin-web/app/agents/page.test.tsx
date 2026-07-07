/**
 * agents/page.test.tsx — Agent 仪表盘 L1 冒烟测试
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
});

// ---- 边界 ----

describe('agents — 边界', () => {
  it('数据加载应使用 .catch 处理错误', () => {
    const src = readSource();
    assert.ok(src.includes('.catch('), '缺少 .catch 错误处理');
  });

  it('no-store 缓存策略存在', () => {
    const src = readSource();
    assert.ok(src.includes('no-store'), '缺少 no-store 策略');
  });

  it('应包含 PageShell 布局组件', () => {
    const src = readSource();
    assert.ok(src.includes('PageShell'), '缺少 PageShell');
  });
});

// ---- 防御 ----

describe('agents — 防御', () => {
  it('应包含 fmt 数字格式化函数', () => {
    const src = readSource();
    assert.ok(src.includes('function fmt'), '缺少 fmt 函数');
  });

  it('数据加载应使用 .catch 避免未捕获异常', () => {
    const src = readSource();
    assert.ok(src.includes('.catch(() => null)'), '缺少 catch null 兜底');
  });

  it('cache 策略应为 no-store', () => {
    const src = readSource();
    assert.ok(src.includes("cache: 'no-store'"), '缺少 no-store 配置');
  });

  it('应包含 ModuleCard 接口定义', () => {
    const src = readSource();
    assert.ok(src.includes('interface ModuleCard'), '缺少 ModuleCard 接口');
  });
});
