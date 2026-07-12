/**
 * stock-operations/page.test.tsx — 库存操作中心 L1 冒烟测试
 * 覆盖: 正例 · 边界 · 防御
 */
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const SOURCE = resolve(__dirname, 'page.tsx');

function readSource(): string {
  return readFileSync(SOURCE, 'utf-8');
}

// ---- 正例 ----

describe('stock-operations — 正例', () => {
  it('应导出一个默认组件 StockOperationsPage', () => {
    const src = readSource();
    assert.ok(src.includes('export default function StockOperationsPage'), '缺少默认导出组件');
  });

  it('应包含 PageShell 页面外壳', () => {
    const src = readSource();
    assert.ok(src.includes('PageShell'), '缺少 PageShell');
  });

  it('应包含 DataTable 数据表', () => {
    const src = readSource();
    assert.ok(src.includes('DataTable'), '缺少 DataTable');
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

  it('应包含 buildColumns 列定义函数', () => {
    const src = readSource();
    assert.ok(src.includes('buildColumns'), '缺少 buildColumns');
  });

  it('应包含 usePagination / useSearchFilter / useSortedItems 三个 hook', () => {
    const src = readSource();
    assert.ok(src.includes('usePagination('), '缺少 usePagination');
    assert.ok(src.includes('useSearchFilter('), '缺少 useSearchFilter');
    assert.ok(src.includes('useSortedItems('), '缺少 useSortedItems');
  });

  it('应从 @m5/ui 导入必要组件', () => {
    const src = readSource();
    assert.ok(src.includes("from '@m5/ui'"), '应从 @m5/ui 导入');
    assert.ok(src.includes('PageShell'), '应导入 PageShell');
    assert.ok(src.includes('StatusBadge'), '应导入 StatusBadge');
    assert.ok(src.includes('Tabs'), '应导入 Tabs');
    assert.ok(src.includes('SearchFilterInput'), '应导入 SearchFilterInput');
    assert.ok(src.includes('DataTable'), '应导入 DataTable');
    assert.ok(src.includes('Pagination'), '应导入 Pagination');
  });

  it('应使用 use client 指令', () => {
    const src = readSource();
    assert.ok(src.includes("'use client'"), '缺少 use client');
  });

  it('应包含 StatusBadge 用于类型和状态展示', () => {
    const src = readSource();
    assert.ok(src.includes('StatusBadge'), '缺少 StatusBadge');
  });

  it('应渲染 4 个统计卡片 grid 布局', () => {
    const src = readSource();
    const cardBlocks = src.match(/<div style=\{card\}>/g);
    // Each stat card uses <div style={card}> — there are 4 cards in the grid
    assert.ok(cardBlocks && cardBlocks.length === 4, `期望 4 个统计卡片, 实际 ${cardBlocks?.length ?? 0}`);
  });
});

// ---- 边界 / 防御 ----

describe('stock-operations — 边界防御', () => {
  it('OT 类型标签映射应覆盖全部 7 种 OpType', () => {
    const src = readSource();
    assert.ok(src.includes("purchase_in:'采购入库'"), '缺少 purchase_in');
    assert.ok(src.includes("sale_out:'销售出库'"), '缺少 sale_out');
    assert.ok(src.includes("transfer_out:'调拨出库'"), '缺少 transfer_out');
    assert.ok(src.includes("transfer_in:'调拨入库'"), '缺少 transfer_in');
    assert.ok(src.includes("return_in:'退货入库'"), '缺少 return_in');
    assert.ok(src.includes("damage_out:'损耗出库'"), '缺少 damage_out');
    assert.ok(src.includes("adjustment:'盘点调整'"), '缺少 adjustment');
  });

  it('OTV 类型颜色映射应覆盖全部 7 种 OpType', () => {
    const src = readSource();
    const expected = ['purchase_in','sale_out','transfer_out','transfer_in','return_in','damage_out','adjustment'];
    for (const t of expected) {
      assert.ok(src.includes(`${t}:`), `OTV 缺少类型 '${t}'`);
    }
  });

  it('OS 状态映射应覆盖全部 5 种 OpStatus', () => {
    const src = readSource();
    assert.ok(src.includes("draft:{l:'草稿'"), '缺少 dradt');
    assert.ok(src.includes("pending_approval:{l:'待审批'"), '缺少 pending_approval');
    assert.ok(src.includes("approved:{l:'已审批'"), '缺少 approved');
    assert.ok(src.includes("completed:{l:'已完成'"), '缺少 completed');
    assert.ok(src.includes("cancelled:{l:'已取消'"), '缺少 cancelled');
  });

  it('Mock 数据应包含 45 条操作记录', () => {
    const src = readSource();
    const matches = src.match(/id: `STK-OP-/g);
    // ops array has `Array.from({length:45}, ...)`, so the template literal
    // `STK-OP-${String(i+1).padStart(3,'0')}` will appear 45 times conceptually,
    // but the source only has one occurrence. Instead check the length literal.
    assert.ok(src.includes('length:45'), 'Mock 数据长度应为 45');
  });

  it('Mock 数据应覆盖 3 种创建人和 3 个仓库', () => {
    const src = readSource();
    assert.ok(src.includes("'张三'"), '缺少创建人 张三');
    assert.ok(src.includes("'李四'"), '缺少创建人 李四');
    assert.ok(src.includes("'王五'"), '缺少创建人 王五');
    assert.ok(src.includes("'主仓库'"), '缺少仓库 主仓库');
    assert.ok(src.includes("'备用仓'"), '缺少仓库 备用仓');
    assert.ok(src.includes("'前厅'"), '缺少仓库 前厅');
  });

  it('Mock 类型分布应包含全部 7 种类型的随机选择', () => {
    const src = readSource();
    const typesArr = `['purchase_in','purchase_in','purchase_in','sale_out','sale_out','transfer_out','transfer_in','return_in','damage_out','adjustment']`;
    assert.ok(src.includes(typesArr), 'Mock 类型分布期望覆盖 7 种类型');
  });

  it('Mock 状态分布应包含全部 5 种状态', () => {
    const src = readSource();
    const statusesArr = `['completed','completed','completed','completed','completed','completed','approved','pending_approval','draft','cancelled']`;
    assert.ok(src.includes(statusesArr), 'Mock 状态分布应覆盖 5 种状态');
  });

  it('数据列应包含必要的列 key', () => {
    const src = readSource();
    const expected = ['refNo', 'date', 'type', 'items', 'totalQty', 'totalCost', 'status', 'creator', 'warehouse'];
    for (const col of expected) {
      assert.ok(src.includes(`key:'${col}'`) || src.includes(`key: '${col}'`), `缺少列 key: '${col}'`);
    }
  });

  it('Tabs 筛选应覆盖全部 5 种 OpStatus', () => {
    const src = readSource();
    assert.ok(src.includes("'completed'"), 'Tabs 缺少 completed');
    assert.ok(src.includes("'pending_approval'"), 'Tabs 缺少 pending_approval');
    assert.ok(src.includes("'approved'"), 'Tabs 缺少 approved');
    assert.ok(src.includes("'draft'"), 'Tabs 缺少 draft');
    assert.ok(src.includes("'cancelled'"), 'Tabs 缺少 cancelled');
  });

  it('fm 格式化函数应正确输出 ¥ 前缀', () => {
    const src = readSource();
    assert.ok(src.includes('function fm('), '缺少 fm 格式化函数');
    assert.ok(src.includes("`¥${"), 'fm 应使用 ¥ 前缀');
  });

  it('排序应按照日期降序（最新的在前）', () => {
    const src = readSource();
    assert.ok(src.includes('.sort((a,b)=>'), '缺少排序逻辑');
    assert.ok(src.includes('localeCompare(a.date'), '排序应使用 localeCompare 且倒序');
  });

  it('筛选状态过滤应包含 statusFilter 状态切换逻辑', () => {
    const src = readSource();
    assert.ok(src.includes('setStatusFilter'), '缺少 setStatusFilter');
    assert.ok(src.includes('statusFilter==='), '缺少 statusFilter 比较');
    assert.ok(src.includes('o.status===statusFilter'), '缺少 o.status===statusFilter 过滤');
  });
});
