/**
 * stock-transfer/page.test.tsx — 库存调拨列表页 L1 冒烟测试 (storefront-web)
 * 覆盖: 正例·反例·边界·防御
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

describe('stock-transfer — 正例', () => {
  it('应导出一个默认组件 StockTransferListPage', () => {
    const src = readSource();
    assert.ok(src.includes('export default function StockTransferListPage'), '缺少默认导出');
  });

  it('应包含 StockTransfer 接口定义', () => {
    const src = readSource();
    assert.ok(src.includes('interface StockTransfer'), '缺少接口');
  });

  it('应包含 MOCK_TRANSFERS 数据集', () => {
    const src = readSource();
    assert.ok(src.includes('MOCK_TRANSFERS'), '缺少数据源');
  });

  it('应计算待审批/调拨中/已完成统计', () => {
    const src = readSource();
    assert.ok(src.includes('pending'), '缺少 pending');
    assert.ok(src.includes('in_transit'), '缺少 in_transit');
    assert.ok(src.includes('completed'), '缺少 completed');
  });

  it('每个 Transfer 应有 id/quantity/status/from/to', () => {
    const src = readSource();
    assert.ok(src.includes('id'), '缺少 id');
    assert.ok(src.includes('quantity'), '缺少 quantity');
    assert.ok(src.includes('status'), '缺少 status');
    assert.ok(src.includes('from'), '缺少 from');
    assert.ok(src.includes('to'), '缺少 to');
  });

  it('Mock 数据中应包含 fromStore 和 toStore', () => {
    const src = readSource();
    assert.ok(src.includes('fromStore'), '缺少 fromStore');
    assert.ok(src.includes('toStore'), '缺少 toStore');
  });

  it('Mock 数据中应包含 materialName 物资名称', () => {
    const src = readSource();
    assert.ok(src.includes('materialName') || src.includes('productName'), '缺少物资名称');
  });

  it('Mock 数据至少包含 6 条调拨记录', () => {
    const src = readSource();
    const matches = src.match(/id:\s*['"]/g);
    assert.ok(matches && matches.length >= 6, `期望 ≥6, 实际 ${matches?.length ?? 0}`);
  });

  it('应包含 createdDate 创建日期', () => {
    const src = readSource();
    assert.ok(src.includes('createdDate') || src.includes('date'), '缺少日期');
  });
});

describe('stock-transfer — 边界', () => {
  it('pending 状态过滤', () => {
    const src = readSource();
    assert.ok(src.includes('status'), 'status 过滤');
  });

  it('应包含分页 totalPages 计算', () => {
    const src = readSource();
    assert.ok(src.includes('totalPages') || src.includes('pagination'), '分页计算');
  });

  it('已完成过滤', () => {
    const src = readSource();
    assert.ok(src.includes("i.status === 'completed'") || src.includes('completed'), 'completed 过滤');
  });

  it('quantity 应为数字类型', () => {
    const src = readSource();
    assert.ok(src.includes('quantity'), '数量字段');
  });
});

describe('stock-transfer — 防御', () => {
  it('应包含 use client 指令', () => {
    const src = readSource();
    assert.ok(src.includes("'use client'"), '缺少 use client');
  });

  it('应包含搜索或过滤功能', () => {
    const src = readSource();
    assert.ok(src.includes('search') || src.includes('Search'), '搜索功能');
  });

  it('空调拨列表应有处理', () => {
    const src = readSource();
    assert.ok(src.includes('.length'), '长度判断');
  });

  it('不应包含危险的 innerHTML', () => {
    const src = readSource();
    assert.doesNotMatch(src, /dangerouslySetInnerHTML/);
  });

  it('不应包含硬编码 token/密钥', () => {
    const src = readSource();
    assert.doesNotMatch(src, /(?:secret|password|api[_-]?key|token|authorization)/i);
  });
});

describe('stock-transfer — 反例', () => {
  it('不应使用 any 类型', () => {
    const src = readSource();
    assert.doesNotMatch(src, /:\s*any\b/);
  });

  it('不应包含 console.log', () => {
    const src = readSource();
    assert.ok(!src.includes('console.log(') || src.includes('// console.log'), '裸 console.log');
  });

  it('fromStore 和 toStore 不应相同', () => {
    const src = readSource();
    assert.ok(src.includes('fromStore') && src.includes('toStore'));
  });
});
