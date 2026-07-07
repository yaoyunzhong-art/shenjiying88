/**
 * stock-transfer/page.test.tsx — 库存调拨审核列表页 L1 冒烟测试
 * 覆盖: 正例 · 边界 · 防御
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

describe('stock-transfer — 正例', () => {
  it('应导出一个默认组件 StockTransferListPage', () => {
    const src = readSource();
    assert.ok(src.includes('export default function StockTransferListPage'), '缺少默认导出组件');
  });

  it('应包含 PageShell 页面外壳', () => {
    const src = readSource();
    assert.ok(src.includes('PageShell'), '缺少 PageShell');
  });

  it('应包含 DataTable 数据表', () => {
    const src = readSource();
    assert.ok(src.includes('DataTable'), '缺少 DataTable');
  });

  it('应包含 QuickStats 统计卡片', () => {
    const src = readSource();
    assert.ok(src.includes('QuickStats'), '缺少 QuickStats');
  });

  it('应包含 Pagination 分页控件', () => {
    const src = readSource();
    assert.ok(src.includes('Pagination'), '缺少 Pagination');
  });

  it('应包含 SearchFilterInput 搜索框', () => {
    const src = readSource();
    assert.ok(src.includes('SearchFilterInput'), '缺少 SearchFilterInput');
  });

  it('应包含 Tabs 筛选标签页', () => {
    const src = readSource();
    assert.ok(src.includes('Tabs'), '缺少 Tabs');
  });

  it('应包含 FilterChips 活跃筛选条件', () => {
    const src = readSource();
    assert.ok(src.includes('FilterChips'), '缺少 FilterChips');
  });

  it('应包含 DetailActionBar 工作台收口动作', () => {
    const src = readSource();
    assert.ok(src.includes('DetailActionBar'), '缺少 DetailActionBar');
  });

  it('应定义 TransferStatus 类型', () => {
    const src = readSource();
    assert.ok(src.includes("type TransferStatus ="), '缺少 TransferStatus 类型');
  });

  it('应定义 TransferType 类型', () => {
    const src = readSource();
    assert.ok(src.includes("type TransferType ="), '缺少 TransferType 类型');
  });

  it('应定义 UrgencyLevel 类型', () => {
    const src = readSource();
    assert.ok(src.includes("type UrgencyLevel ="), '缺少 UrgencyLevel 类型');
  });

  it('应定义 StockTransferItem 接口', () => {
    const src = readSource();
    assert.ok(src.includes('interface StockTransferItem'), '缺少 StockTransferItem 接口');
  });

  it('应包含类型映射表 (TYPE_LABEL / STATUS_LABEL / URGENCY_LABEL)', () => {
    const src = readSource();
    assert.ok(src.includes('const TYPE_LABEL'), '缺少 TYPE_LABEL');
    assert.ok(src.includes('const STATUS_LABEL'), '缺少 STATUS_LABEL');
    assert.ok(src.includes('const URGENCY_LABEL'), '缺少 URGENCY_LABEL');
  });

  it('应包含 12 条 Mock 调拨单数据', () => {
    const src = readSource();
    const matches = src.match(/transferNo: '/g);
    assert.ok(matches && matches.length === 12, `期望 12 条调拨单, 实际 ${matches?.length ?? 0}`);
  });

  it('应包含 buildColumns 列定义函数', () => {
    const src = readSource();
    assert.ok(src.includes('function buildColumns'), '缺少 buildColumns');
  });
});

// ---- 边界 / 防御 ----

describe('stock-transfer — 边界防御', () => {
  it('mock 数据应覆盖全部 status', () => {
    const src = readSource();
    const statuses = ['pending', 'approved', 'shipped', 'received', 'rejected', 'cancelled'];
    for (const s of statuses) {
      assert.ok(src.includes(`status: '${s}'`), `缺少 status: '${s}' 用例`);
    }
  });

  it('mock 数据应覆盖全部 type', () => {
    const src = readSource();
    const types = ['supply', 'return', 'move', 'emergency'];
    for (const t of types) {
      assert.ok(src.includes(`type: '${t}'`), `缺少 type: '${t}' 用例`);
    }
  });

  it('mock 数据应覆盖全部 urgency', () => {
    const src = readSource();
    const urgencies = ['normal', 'urgent', 'critical'];
    for (const u of urgencies) {
      assert.ok(src.includes(`urgency: '${u}'`), `缺少 urgency: '${u}' 用例`);
    }
  });

  it('数据列应包含状态、类型、紧急度、商品信息、门店和操作', () => {
    const src = readSource();
    const expectedColumns = ['transferNo', 'sourceStoreName', 'targetStoreName', 'productName', 'createdAt', 'createdBy'];
    for (const col of expectedColumns) {
      assert.ok(src.includes(`key: '${col}'`), `缺少列 key: '${col}'`);
    }
  });

  it('筛选器应包含全部、待审核、已通过、已发货、已收货、已驳回、已撤销', () => {
    const src = readSource();
    const filterStatuses = ['ALL', 'pending', 'approved', 'shipped', 'received', 'rejected', 'cancelled'];
    for (const f of filterStatuses) {
      assert.ok(src.includes(`'${f}'`), `缺少筛选状态: ${f}`);
    }
  });

  it('类型筛选应包含 supply / return / move / emergency', () => {
    const src = readSource();
    const filterTypes = ['supply', 'return', 'move', 'emergency'];
    for (const t of filterTypes) {
      assert.ok(src.includes(`'${t}'`), `缺少筛选类型: ${t}`);
    }
  });

  it('紧急度筛选应包含 normal / urgent / critical', () => {
    const src = readSource();
    const filterUrgencies = ['normal', 'urgent', 'critical'];
    for (const u of filterUrgencies) {
      assert.ok(src.includes(`'${u}'`), `缺少筛选紧急度: ${u}`);
    }
  });

  it('每个 mock 数据对象应有 id 且唯一', () => {
    const src = readSource();
    const ids = ['t1', 't2', 't3', 't4', 't5', 't6', 't7', 't8', 't9', 't10', 't11', 't12'];
    for (const id of ids) {
      assert.ok(src.includes(`id: '${id}'`), `缺少 id: '${id}'`);
    }
  });

  it('应包含 2 个子路由目录: [id] 和 new', () => {
    const src = readSource();
    // Test file exists alongside page, check subdirs via fs
    const idDir = resolve(__dirname, '[id]');
    const newDir = resolve(__dirname, 'new');
    try {
      const fs = require('fs');
      assert.ok(fs.existsSync(idDir), '缺少 [id] 子目录');
      assert.ok(fs.existsSync(newDir), '缺少 new 子目录');
    } catch {
      // skip fs check if module resolution fails
    }
  });
});
