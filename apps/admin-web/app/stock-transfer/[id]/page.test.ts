/**
 * stock-transfer/[id]/page.test.ts — Admin 库存调拨详情页 L1 测试
 *
 * 覆盖:
 *   正例 — 页面导出默认异步函数、引用 StockTransferDetailClient
 *   边界 — 无 params.id 场景（由 StockTransferDetailClient 防御）
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

  test('页面声明 params 为 Promise<{ id: string }>', () => {
    assert.match(source, /params:\s*(Promise<|Promise<|Parameters<)/);
  });

  // ---- 边界 ----
  test('StockTransferDetailPage 不处理空 id，交由 Client 防御', () => {
    assert.ok(
      !source.includes('if (!id)') && !source.includes('if(!id)'),
      '页面本身不应做空 id 判断（由 Client 组件处理）'
    );
  });
});
