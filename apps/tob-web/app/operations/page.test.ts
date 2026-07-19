/**
 * operations/page.test.ts — 运维操作中心列表页 全量测试
 *
 * 覆盖: 正例(组件导出/数据导出/页面结构) · 边界(类型覆盖/Mock字段) · 防御(属性安全/空值)
 */
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { dirname } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PAGE_SRC = resolve(__dirname, 'page.tsx');
const DETAIL_PAGE_SRC = resolve(__dirname, '[id]', 'page.tsx');

function readPage(): string {
  return readFileSync(PAGE_SRC, 'utf-8');
}

function readDetailPage(): string {
  return readFileSync(DETAIL_PAGE_SRC, 'utf-8');
}

// ——— 正例: 页面导出结构 ———
describe('operations — 正例: 页面导出', () => {
  it('page.tsx 应导出默认组件 OperationsListPage', () => {
    const src = readPage();
    assert.ok(src.includes('export default function OperationsListPage'), '缺少默认导出组件');
  });

  it('page.tsx 应包含 \'use client\' 指令', () => {
    const src = readPage();
    assert.ok(src.includes("'use client'") || src.includes('"use client"'), '缺少 use client');
  });

  it('page.tsx 应从 @m5/ui 导入 RuntimeOperationDemoListPage', () => {
    const src = readPage();
    assert.ok(src.includes('RuntimeOperationDemoListPage'), '缺少 RuntimeOperationDemoListPage');
  });

  it('page.tsx 应从 @m5/ui 导入 runtimeOperationListDemoPresets', () => {
    const src = readPage();
    assert.ok(src.includes('runtimeOperationListDemoPresets'), '缺少 runtimeOperationListDemoPresets');
  });

  it('page.tsx 使用 runtimeOperationListDemoPresets.tob 作为 preset', () => {
    const src = readPage();
    assert.ok(src.includes('runtimeOperationListDemoPresets.tob'), '缺少 .tob preset');
  });

  it('page.tsx 传递 title="运维操作中心"', () => {
    const src = readPage();
    assert.ok(src.includes('title="运维操作中心"'), '缺少 title');
  });

  it('page.tsx 传递 description 文本属性', () => {
    const src = readPage();
    assert.ok(src.includes('description'), '缺少 description');
  });

  it('page.tsx 传递 count={50}', () => {
    const src = readPage();
    assert.ok(src.includes('count={50}'), '缺少 count={50}');
  });

  it('page.tsx 传递 detailHrefBase="/operations"', () => {
    const src = readPage();
    assert.ok(src.includes('detailHrefBase="/operations"'), '缺少 detailHrefBase');
  });

  it('page.tsx 使用 preset={tobPreset} 传递', () => {
    const src = readPage();
    assert.ok(src.includes('preset={tobPreset}'), '缺少 preset prop');
  });
});

// ——— 正例: 详情页路由结构 ———
describe('operations — 正例: 详情页路由', () => {
  it('[id]/page.tsx 应导出默认组件 OperationDetailPage', () => {
    const src = readDetailPage();
    assert.ok(src.includes('export default function OperationDetailPage'), '缺少默认导出');
  });

  it('[id]/page.tsx 应包含 \'use client\'', () => {
    const src = readDetailPage();
    assert.ok(src.includes("'use client'") || src.includes('"use client"'), '缺少 use client');
  });

  it('[id]/page.tsx 使用 useParams 读取路由 id', () => {
    const src = readDetailPage();
    assert.ok(src.includes('useParams'), '缺少 useParams');
    assert.ok(src.includes('params.id'), '缺少 params.id');
  });

  it('[id]/page.tsx 导入 RuntimeOperationPresetDetailRoute', () => {
    const src = readDetailPage();
    assert.ok(src.includes('RuntimeOperationPresetDetailRoute'), '缺少 RuntimeOperationPresetDetailRoute');
  });

  it('[id]/page.tsx 导入 runtimeOperationDetailDemoPresets', () => {
    const src = readDetailPage();
    assert.ok(src.includes('runtimeOperationDetailDemoPresets'), '缺少 runtimeOperationDetailDemoPresets');
  });

  it('[id]/page.tsx 设置 backHref="/operations"', () => {
    const src = readDetailPage();
    assert.ok(src.includes('backHref="/operations"'), '缺少 backHref');
  });

  it('[id]/page.tsx 使用 .tob 作为 detailPreset', () => {
    const src = readDetailPage();
    assert.ok(src.includes('.tob'), '缺少 .tob preset');
  });

  it('[id]/page.tsx 包含 notFoundTitle / notFoundMessage 兜底', () => {
    const src = readDetailPage();
    assert.ok(src.includes('notFoundTitle'), '缺少 notFoundTitle');
    assert.ok(src.includes('notFoundMessage'), '缺少 notFoundMessage');
  });
});

// ——— 边界: 字段覆盖 ———
describe('operations — 边界: 字段覆盖', () => {
  it('详情页预设 MOCK 包含 tob 预设', () => {
    const src = readDetailPage();
    const match = src.match(/MOCK\s*=\s*runtimeOperationDetailDemoPresets\.tob/);
    assert.ok(match !== null, '缺少 MOCK = .tob');
  });

  it('列表页预设 PRESET 包含 tob 预设', () => {
    const src = readDetailPage();
    const match = src.match(/PRESET\s*=\s*runtimeOperationListDemoPresets\.tob/);
    assert.ok(match !== null, '缺少 PRESET = .tob');
  });

  it('列表页使用 RuntimeOperationDemoListPage 渲染', () => {
    const src = readPage();
    assert.ok(src.includes('<RuntimeOperationDemoListPage'), '缺少组件渲染');
  });

  it('列表页传递 title 为 运维操作中心', () => {
    const src = readPage();
    assert.ok(src.includes('运维操作中心'), '缺少中文标题');
  });

  it('列表页传递 description 包含 operation 关键词', () => {
    const src = readPage();
    assert.ok(src.includes('Runtime operations'), '缺少 Runtime operations 描述');
    assert.ok(src.includes('部署'), '缺少 部署 关键词');
  });

  it('详情页传递 backHref 指向 /operations', () => {
    const src = readDetailPage();
    assert.ok(src.includes('"/operations"'), '缺少 backHref 重定向');
  });

  it('详情页传递 operationId 动态参数', () => {
    const src = readDetailPage();
    assert.ok(src.includes('operationId={id}'), '缺少 operationId');
  });

  it('详情页传递 operations={MOCK} 数据源', () => {
    const src = readDetailPage();
    assert.ok(src.includes('operations={MOCK}'), '缺少 operations prop');
  });

  it('详情页传递 preset={PRESET}', () => {
    const src = readDetailPage();
    assert.ok(src.includes('preset={PRESET}'), '缺少 preset prop');
  });
});

// ——— 防御: 属性安全 ———
describe('operations — 防御: 属性安全', () => {
  it('列表页 count 为固定常量 50', () => {
    const src = readPage();
    const countMatch = src.match(/count\s*=\s*\{\s*\d+\s*\}/);
    assert.ok(countMatch !== null, '缺少 count 属性');
    assert.ok(countMatch[0]!.includes('50'), `count 应为 50，实际 ${countMatch[0]}`);
  });

  it('详情页 notFoundTitle 为 "Not Found"', () => {
    const src = readDetailPage();
    assert.ok(src.includes('notFoundTitle="Not Found"'), '缺少 notFoundTitle');
  });

  it('详情页 notFoundMessage 接收 operationId 参数', () => {
    const src = readDetailPage();
    assert.ok(src.includes('operationId'), '缺少 notFoundMessage 参数');
  });

  it('详情页使用 React 导入', () => {
    const src = readDetailPage();
    assert.ok(src.includes("import React from 'react'") || src.includes('import React,'), '缺少 React 导入');
  });

  it('详情页导入 next/navigation', () => {
    const src = readDetailPage();
    assert.ok(src.includes('next/navigation'), '缺少 next/navigation');
  });
});
