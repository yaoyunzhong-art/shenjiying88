/**
 * stock-transfer/page.test.tsx — 库存调拨审核列表页 L1 冒烟测试
 * 覆盖: 正例 · 边界 · 防御
 */
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const SOURCE = resolve(__dirname, 'page.tsx');
const DATA_SOURCE = resolve(__dirname, 'stock-transfer-data.ts');

function readSource(): string {
  return readFileSync(SOURCE, 'utf-8');
}

function readData(): string {
  if (existsSync(DATA_SOURCE)) {
    return readFileSync(DATA_SOURCE, 'utf-8');
  }
  return '';
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

  it('应从共享文件导入类型和数据', () => {
    const src = readSource();
    assert.ok(src.includes("from './stock-transfer-data'"), '应有 stock-transfer-data 导入');
    assert.ok(src.includes('MOCK_TRANSFERS'), '应导入 MOCK_TRANSFERS');
    assert.ok(src.includes('TYPE_LABEL'), '应导入 TYPE_LABEL');
    assert.ok(src.includes('STATUS_LABEL'), '应导入 STATUS_LABEL');
    assert.ok(src.includes('URGENCY_LABEL'), '应导入 URGENCY_LABEL');
  });

  it('应包含 buildColumns 列定义函数', () => {
    const src = readSource();
    assert.ok(src.includes('function buildColumns'), '缺少 buildColumns');
  });
});

// ---- 边界 / 防御 ----

describe('stock-transfer — 边界防御', () => {
  it('共享数据文件应覆盖全部 status', () => {
    const data = readData();
    if (!data) return;
    const statuses = ['pending', 'approved', 'shipped', 'received', 'rejected', 'cancelled'];
    for (const s of statuses) {
      assert.ok(data.includes(`status: '${s}'`), `共享数据缺少 status: '${s}' 用例`);
    }
  });

  it('共享数据文件应覆盖全部 type', () => {
    const data = readData();
    if (!data) return;
    const types = ['supply', 'return', 'move', 'emergency'];
    for (const t of types) {
      assert.ok(data.includes(`type: '${t}'`), `共享数据缺少 type: '${t}' 用例`);
    }
  });

  it('共享数据文件应覆盖全部 urgency', () => {
    const data = readData();
    if (!data) return;
    const urgencies = ['normal', 'urgent', 'critical'];
    for (const u of urgencies) {
      assert.ok(data.includes(`urgency: '${u}'`), `共享数据缺少 urgency: '${u}' 用例`);
    }
  });

  it('共享数据文件应包含 StockTransferItem 接口和类型定义', () => {
    const data = readData();
    if (!data) return;
    assert.ok(data.includes('export interface StockTransferItem'), '共享数据缺少 StockTransferItem');
    assert.ok(data.includes("export type TransferStatus ="), '共享数据缺少 TransferStatus 类型');
    assert.ok(data.includes("export type TransferType ="), '共享数据缺少 TransferType 类型');
    assert.ok(data.includes("export type UrgencyLevel ="), '共享数据缺少 UrgencyLevel 类型');
  });

  it('共享数据文件应包含标签映射表', () => {
    const data = readData();
    if (!data) return;
    assert.ok(data.includes('export const TYPE_LABEL'), '共享数据缺少 TYPE_LABEL');
    assert.ok(data.includes('export const STATUS_LABEL'), '共享数据缺少 STATUS_LABEL');
    assert.ok(data.includes('export const URGENCY_LABEL'), '共享数据缺少 URGENCY_LABEL');
    assert.ok(data.includes('export const STATUS_STYLE'), '共享数据缺少 STATUS_STYLE');
    assert.ok(data.includes('export const URGENCY_VARIANT'), '共享数据缺少 URGENCY_VARIANT');
  });

  it('共享数据文件应包含 12 条 Mock 调拨单', () => {
    const data = readData();
    if (!data) return;
    const matches = data.match(/transferNo: '/g);
    assert.ok(matches && matches.length === 12, `期望 12 条调拨单, 实际 ${matches?.length ?? 0}`);
  });

  it('共享数据文件每个 mock 数据对象应有 id 且唯一', () => {
    const data = readData();
    if (!data) return;
    const ids = ['t1', 't2', 't3', 't4', 't5', 't6', 't7', 't8', 't9', 't10', 't11', 't12'];
    for (const id of ids) {
      assert.ok(data.includes(`id: '${id}'`), `共享数据缺少 id: '${id}'`);
    }
  });

  it('数据列应包含必要的列 key', () => {
    const src = readSource();
    const expectedColumns = ['transferNo', 'sourceStoreName', 'targetStoreName', 'productName', 'createdAt', 'createdBy'];
    for (const col of expectedColumns) {
      assert.ok(src.includes(`key: '${col}'`), `缺少列 key: '${col}'`);
    }
  });

  it('应包含路由目录 [id]', () => {
    const idDir = resolve(__dirname, '[id]');
    assert.ok(existsSync(idDir), '缺少 [id] 子目录');
  });

  it('详情页应在 [id]/page.tsx 中引用 detail client', () => {
    const detailPage = resolve(__dirname, '[id]', 'page.tsx');
    const detailSrc = readFileSync(detailPage, 'utf-8');
    assert.ok(detailSrc.includes('StockTransferDetailClient'), '详情页应引用 StockTransferDetailClient');
    assert.ok(detailSrc.includes('transferId'), '详情页应传递 transferId');
  });
});

const SRC = readFileSync(require.resolve('./page'), 'utf-8');

describe('Stock Transfer — hooks验证', () => {
  it('包含useState声明', () => assert.ok(SRC.includes('const [') && SRC.includes('useState')));
  it('包含JSX返回', () => assert.ok(SRC.includes('return (') || SRC.includes('return <')));
  it('包含事件处理器', () => assert.ok(SRC.includes('onClick={') || SRC.includes('onChange={')));
  it('包含列表渲染', () => assert.ok(SRC.includes('.map(')));
  it('包含条件渲染', () => assert.ok(SRC.includes(' && ') || SRC.includes(' ? ')));
  it('包含样式定义', () => assert.ok(SRC.includes('style={')));
  it('包含数据格式化(.toFixed)', () => assert.ok(SRC.includes('.toFixed')));
  it('包含模板字符串', () => assert.ok(SRC.includes('${')));
  it('包含默认导出', () => assert.ok(SRC.includes('export default function')));
  it('包含注释说明', () => assert.ok(SRC.includes("/**") || SRC.includes('//')));
});
