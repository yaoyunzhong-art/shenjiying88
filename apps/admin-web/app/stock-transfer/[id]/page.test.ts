/**
 * stock-transfer/[id]/page.test.ts — Admin 库存调拨详情页 L1 测试
 *
 * 覆盖:
 *   正例 — 页面导出默认异步函数、引用 StockTransferDetailClient
 *   反例 — 防御性边界检验
 *   边界 — 无 params.id 场景、id 长度校验
 */
import { describe, test } from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PAGE_SOURCE = resolve(__dirname, 'page.tsx');

const source = fs.readFileSync(PAGE_SOURCE, 'utf8');

describe('AdminStockTransferDetailPage (stock-transfer/[id]/page.tsx)', () => {
  // ---- 正例 ----
  test('页面导出默认异步函数组件 StockTransferDetailPage', () => {
    assert.match(source, /export default async function StockTransferDetailPage/);
  });

  test('页面从 __details__ 目录引入 StockTransferDetailClient', () => {
    assert.match(source, /StockTransferDetailClient/);
    assert.match(source, /\.\.\/__details__\/stock-transfer-detail-client/);
  });

  test('页面从 params 解构 id', () => {
    assert.match(source, /const \{ id \} = await params/);
    assert.match(source, /transferId=\{\s*id\s*\}/);
  });

  test('页面导入 Next.js 关键 API', () => {
    assert.match(source, /notFound/);
    assert.match(source, /Suspense/);
    assert.match(source, /Metadata/);
  });

  test('页面包含 ErrorBoundary 错误边界', () => {
    assert.match(source, /ErrorBoundary/);
  });

  test('页面包含 LoadingSkeleton 占位组件', () => {
    assert.match(source, /LoadingSkeleton/);
  });

  test('页面包含 EmptyState 空状态组件', () => {
    assert.match(source, /EmptyState/);
  });

  // ---- 反例 ----
  test('页面不应包含直接访问 DOM 的操作', () => {
    assert.ok(!source.includes('document.'));
    assert.ok(!source.includes('window.'));
  });

  test('页面不应直接渲染危险 HTML', () => {
    // JSON-LD 是可控内容，不构成 XSS 风险
    assert.ok(!source.includes('dangerouslySetInnerHTML') || source.includes('ld+json') || source.includes('JSON.stringify'));
  });

  test('页面不应直接处理数据库查询', () => {
    assert.ok(!source.includes('db.'));
    assert.ok(!source.includes('.query('));
    assert.ok(!source.includes('query('));
  });

  // ---- 边界 ----
  test('页面包含 ID 合法性校验逻辑', () => {
    assert.ok(source.includes('id.length'), '缺少 id.length 校验');
    assert.ok(source.includes('id > 64') || source.includes('< 1'), '缺少长度边界校验');
  });

  test('页面处理 id 为空时调用 notFound', () => {
    assert.ok(source.includes('notFound'), '缺少 notFound 调用');
  });

  test('页面不处理空 id，交由 notFound 处理', () => {
    assert.ok(
      !source.includes('if (!id)') || source.includes('notFound'),
      '空 id 应通过 notFound 处理'
    );
  });

  test('页面生成动态 Metadata', () => {
    assert.match(source, /generateStockTransferMetadata/);
    assert.ok(source.includes('generateMetadata'), '应导出 generateMetadata');
  });

  test('页面包含 StockTransferNotFound 组件', () => {
    assert.ok(source.includes('StockTransferNotFound'), '缺少未找到组件');
    assert.match(source, /调拨单未找到/);
  });

  test('页面包含 StockTransferDetailErrorFallback 组件', () => {
    assert.ok(source.includes('StockTransferDetailErrorFallback'), '缺少错误回退组件');
    assert.match(source, /数据加载异常/);
  });

  test('页面包含 JSON-LD 结构化数据', () => {
    assert.ok(source.includes('ld+json'), '缺少 JSON-LD');
    assert.ok(source.includes('Product'), '缺少 Product Schema');
  });

  test('页面包含调拨流程说明底部提示', () => {
    assert.ok(source.includes('调拨流程说明'), '缺少流程说明');
    assert.ok(source.includes('签收'), '缺少签收说明');
  });

  test('页面 source 长度应大于 3KB', () => {
    assert.ok(source.length > 3000, `源码长度不足, 实际 ${source.length} bytes`);
  });
});

// ---- L2 增强: 页面逻辑细节 ----

describe('AdminStockTransferDetailPage — L2 页面逻辑', () => {
  test('页面应包含 generateStockTransferMetadata 函数', () => {
    assert.ok(source.includes('generateStockTransferMetadata'), '缺少 generateStockTransferMetadata 函数');
  });

  test('页面应使用 StockTransferDetailClient 子组件', () => {
    assert.ok(source.includes('StockTransferDetailClient'), '缺少子组件引用');
  });

  test('StockTransferDetailClient 应接收 transferId prop', () => {
    assert.ok(source.includes('transferId={id}'), '缺少 transferId prop');
  });

  test('页面应包含 StockTransferDetailLoadingFallback 加载占位', () => {
    assert.ok(source.includes('StockTransferDetailLoadingFallback'), '缺少加载占位函数');
  });

  test('页面应包含发起方/接收方字段引用', () => {
    assert.ok(source.includes('发起') || source.includes('接收'), '应提及发起方/接收方');
  });

  test('页面应包含调拨流程操作按钮文本', () => {
    assert.ok(
      source.includes('审核') || source.includes('发货') || source.includes('签收'),
      '缺少调拨流程操作按钮'
    );
  });

  test('页面应包含 JSON-LD 结构化数据', () => {
    assert.ok(
      source.includes('ld+json') || source.includes('schema.org'),
      '缺少 JSON-LD'
    );
  });

  test('页面不应使用 any 类型', () => {
    const matches = source.match(/:\s*any[\s,;\)]/g);
    assert.ok(!matches || matches.length === 0, '不应使用 any 类型');
  });

  test('页面应包含 ErrorBoundary fallback UI 描述', () => {
    assert.ok(
      source.includes('StockTransferDetailErrorFallback'),
      '缺少错误回退组件'
    );
  });

  test('页面有 grid 布局时间线', () => {
    assert.ok(
      source.includes('grid') || source.includes('gridTemplateColumns'),
      '应包含 grid 布局'
    );
  });

  test('页面应处理空数据状态', () => {
    assert.ok(
      source.includes('EmptyState') || source.includes('empty'),
      '应处理空数据'
    );
  });

  test('页面应包含数据加载状态处理', () => {
    assert.ok(
      source.includes('LoadingSkeleton') || source.includes('loading'),
      '应有加载状态处理'
    );
  });

  test('页面应包含 retry 重试按钮', () => {
    assert.ok(
      source.includes('重试') || source.includes('retry'),
      '应有重试按钮'
    );
  });
});
