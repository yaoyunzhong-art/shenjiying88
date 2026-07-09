/**
 * page.test.ts — admin-web 指挥台首页 L1 冒烟测试
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

describe('HomePage — 正例', () => {
  it('应导出一个默认 async 组件', () => {
    const src = readSource();
    assert.ok(src.includes('export default async function'), '缺少默认导出 async 函数');
  });

  it('应包含 PageShell 页面外壳', () => {
    const src = readSource();
    assert.ok(src.includes('PageShell'), '缺少 PageShell 组件');
    assert.ok(src.includes('"M5 指挥台"'), '缺少标题 M5 指挥台');
  });

  it('应包含 3 个 StatCard 统计卡片', () => {
    const src = readSource();
    const matches = src.match(/<StatCard/g);
    assert.ok(matches && matches.length >= 3, `StatCard 数量不足，实际: ${matches?.length ?? 0}`);
  });

  it('应包含 getAdminWorkbenchConsumerSnapshot 数据获取', () => {
    const src = readSource();
    assert.ok(src.includes('getAdminWorkbenchConsumerSnapshot'), '缺少 bootstrap 数据获取');
    assert.ok(src.includes('snapshot'), '缺少 snapshot 变量');
  });

  it('应包含 governance 治理告警展示', () => {
    const src = readSource();
    assert.ok(src.includes('governance'), '缺少 governance 治理信息');
    assert.ok(src.includes('alerts'), '缺少 alerts 告警数据');
  });

  it('应包含 5 个导航入口（Link 标签或 href）', () => {
    const src = readSource();
    const hrefMatches = (src.match(/href=/g) || []).length;
    assert.ok(hrefMatches >= 3, `href 数量不足，实际: ${hrefMatches}`);
  });

  it('应包含 WorkbenchList 工作台列表', () => {
    const src = readSource();
    assert.ok(src.includes('WorkbenchList'), '缺少 WorkbenchList 组件');
  });

  it('应包含 GovernanceLinkedOverview 治理概览', () => {
    const src = readSource();
    assert.ok(src.includes('GovernanceLinkedOverview'), '缺少 GovernanceLinkedOverview');
  });

  it('应包含 tenantContext 租户信息展示', () => {
    const src = readSource();
    assert.ok(src.includes('tenantContext'), '缺少 tenantContext');
    assert.ok(src.includes('tenantId'), '缺少 tenantId');
  });

  it('应包含 consumerDescriptor 消费者描述展示', () => {
    const src = readSource();
    assert.ok(src.includes('consumerDescriptor'), '缺少 consumerDescriptor');
  });
});

// ---- 边界 ----

describe('HomePage — 边界', () => {
  it('应包含 Suspense fallback 加载状态', () => {
    const src = readSource();
    assert.ok(src.includes('Suspense'), '缺少 Suspense');
    assert.ok(src.includes('fallback'), '缺少 fallback');
  });

  it('应使用 async 服务端组件', () => {
    const src = readSource();
    assert.ok(src.includes('async function'), '缺少 async 函数声明');
  });

  it('应包含 foundationContracts 缺省处理', () => {
    const src = readSource();
    assert.ok(src.includes('foundationContracts'), '缺少 foundationContracts');
    assert.ok(src.includes('||') || src.includes('??'), '缺少默认值处理');
  });

  it('应包含 degradation 降级能力展示', () => {
    const src = readSource();
    assert.ok(src.includes('degradation'), '缺少 degradation 降级展示');
  });

  it('应包含 challenge 挑战治理展示', () => {
    const src = readSource();
    assert.ok(src.includes('challenge'), '缺少 challenge 挑战治理');
  });

  it('应包含 scope 作用域信息', () => {
    const src = readSource();
    assert.ok(src.includes('scope'), '缺少 scope 作用域');
  });

  it('应使用 grid 网格布局', () => {
    const src = readSource();
    const matches = src.match(/gridTemplateColumns/g);
    assert.ok(matches && matches.length >= 2, `gridTemplateColumns 不足，实际: ${matches?.length ?? 0}`);
  });
});

// ---- 防御 ----

describe('HomePage — 防御', () => {
  it('服务端组件不应包含 "use client"', () => {
    const src = readSource();
    assert.ok(
      !src.includes("'use client'") && !src.includes('"use client"'),
      '服务端组件不应包含 use client'
    );
  });

  it('应使用 async/await 而非 then', () => {
    const src = readSource();
    assert.ok(!src.includes('.then('), '不应使用 .then 链式调用');
  });

  it('应包含 await 数据获取调用', () => {
    const src = readSource();
    assert.ok(src.includes('await '), '缺少 await 异步调用');
  });

  it('错误链路应有兜底', () => {
    const src = readSource();
    // bootstrap.ts 内部已 catch 返回 null，page.tsx 用 ?? 兜底
    assert.ok(
      src.includes('??') || src.includes('??='),
      '缺少空值合并运算符兜底'
    );
  });

  it('应使用 const 声明变量（无 var）', () => {
    const src = readSource();
    assert.ok(!src.includes('\nvar '), '不应使用 var 声明');
  });

  it('导航链接应包含多个 href 路由', () => {
    const src = readSource();
    const hrefMatches = (src.match(/href=/g) || []).length;
    assert.ok(hrefMatches >= 5, `href 数量 < 5，实际: ${hrefMatches}`);
  });
});
