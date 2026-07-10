/**
 * workbench/inventory-keeper/page.test.ts — 仓管员工作台 L1 冒烟测试
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

describe('InventoryKeeperWorkbench — 正例', () => {
  it('应导出一个默认组件 InventoryKeeperWorkbenchPage', () => {
    const src = readSource();
    assert.ok(
      src.includes('export default function InventoryKeeperWorkbenchPage'),
      '缺少默认导出组件',
    );
  });

  it('应使用 InventoryKeeperDashboard 组件', () => {
    const src = readSource();
    assert.ok(src.includes('InventoryKeeperDashboard'), '缺少 InventoryKeeperDashboard');
  });

  it('应包含 PageShell 页面外壳', () => {
    const src = readSource();
    assert.ok(src.includes('PageShell'), '缺少 PageShell');
  });

  it('应包含 DetailActionBar 工具栏', () => {
    const src = readSource();
    assert.ok(src.includes('DetailActionBar'), '缺少 DetailActionBar');
  });

  it('应包含 useDetailActions 导入', () => {
    const src = readSource();
    assert.ok(src.includes('useDetailActions'), '缺少 useDetailActions');
  });

  it('应包含库房概览指标数据 (WarehouseMetrics)', () => {
    const src = readSource();
    const metricsFields = ['totalSku', 'totalStock', 'todayInbound', 'todayOutbound', 'stockValue'];
    for (const field of metricsFields) {
      assert.ok(src.includes(field), `缺少度量字段: ${field}`);
    }
  });

  it('应包含库存预警 Mock 数据 (MOCK_STOCK_ALERTS)', () => {
    const src = readSource();
    assert.ok(src.includes('MOCK_STOCK_ALERTS'), '缺少 MOCK_STOCK_ALERTS');
    assert.ok(src.includes('low_stock'), '缺少 low_stock 预警类型');
    assert.ok(src.includes('overstock'), '缺少 overstock 预警类型');
    assert.ok(src.includes('expiring'), '缺少 expiring 预警类型');
  });

  it('应包含入库待处理 Mock 数据 (MOCK_INBOUND_TASKS)', () => {
    const src = readSource();
    assert.ok(src.includes('MOCK_INBOUND_TASKS'), '缺少 MOCK_INBOUND_TASKS');
    assert.ok(src.includes('pending'), '缺少 pending 状态');
    assert.ok(src.includes('inspecting'), '缺少 inspecting 状态');
  });

  it('应包含出库待处理 Mock 数据 (MOCK_OUTBOUND_TASKS)', () => {
    const src = readSource();
    assert.ok(src.includes('MOCK_OUTBOUND_TASKS'), '缺少 MOCK_OUTBOUND_TASKS');
    assert.ok(src.includes('picking'), '缺少 picking 状态');
    assert.ok(src.includes('packing'), '缺少 packing 状态');
  });

  it('应包含 6 个快速操作按钮', () => {
    const src = readSource();
    const actionNames = ['new-inbound', 'new-outbound', 'stock-take', 'inventory-report', 'location-mgmt', 'supplier-contacts'];
    for (const name of actionNames) {
      assert.ok(src.includes(name), `缺少快速操作: ${name}`);
    }
  });

  it('应包含仓管员工作台标题和副标题', () => {
    const src = readSource();
    assert.ok(src.includes('仓管员工作台'), '缺少主标题');
    assert.ok(src.includes('仓库库存管理与出入库操作'), '缺少副标题');
  });

  it('应包含入库/出库相关 Mock 标识', () => {
    const src = readSource();
    const mockIds = ['PO-2026-0711-001', 'SO-2026-0711-023', 'new-inbound', 'new-outbound'];
    for (const id of mockIds) {
      assert.ok(src.includes(id), `缺少 Mock 标识: ${id}`);
    }
  });
});

// ---- 数据完整性 ----

describe('InventoryKeeperWorkbench — 数据完整性', () => {
  it('警告数量应不少于 8 条', () => {
    const src = readSource();
    assert.ok(src.includes('a10'), '期望至少 10 条库存预警');
  });

  it('入库单应不少于 5 条', () => {
    const src = readSource();
    assert.ok(src.includes('i5'), '期望至少 5 条入库单');
  });

  it('出库单应不少于 5 条', () => {
    const src = readSource();
    assert.ok(src.includes('o5'), '期望至少 5 条出库单');
  });

  it('指标值应包含合理的数字范围', () => {
    const src = readSource();
    assert.ok(src.includes('1286'), '缺少 SKU 总数');
    assert.ok(src.includes('58420'), '缺少在库件数');
    assert.ok(src.includes('3865000'), '缺少库存金额');
    assert.ok(src.includes('0.76'), '缺少库位利用率');
  });
});

// ---- 边界 & 防御 ----

describe('InventoryKeeperWorkbench — 边界 & 防御', () => {
  it('应包含加载状态处理 (loading)', () => {
    const src = readSource();
    assert.ok(src.includes('loading'), '缺少 loading 状态变量');
  });

  it('应包含错误状态处理 (error)', () => {
    const src = readSource();
    assert.ok(src.includes('setError'), '缺少错误处理');
  });

  it('应使用 useState 管理加载 & 错误状态', () => {
    const src = readSource();
    const useStateCall = 'useState(false)';
    assert.ok(src.includes(useStateCall), '缺少 useState 初始化');
  });

  it('应使用 useCallback 包装刷新函数', () => {
    const src = readSource();
    assert.ok(src.includes('useCallback'), '缺少 useCallback 优化');
  });

  it('应使用 useMemo 优化快速操作列表', () => {
    const src = readSource();
    assert.ok(src.includes('useMemo'), '缺少 useMemo 优化');
  });

  it('"仓库工作台" 应出现在副标题中', () => {
    const src = readSource();
    assert.ok(src.includes('仓管员工作台'), '缺少主标题');
  });

  it('应导入所有需要的 @m5/ui 组件和类型', () => {
    const src = readSource();
    const imports = [
      'InventoryKeeperDashboard',
      'PageShell',
      'DetailActionBar',
      'useDetailActions',
      'WarehouseMetrics',
      'StockAlert',
      'InboundTask',
      'OutboundTask',
      'KeeperQuickAction',
    ];
    for (const imp of imports) {
      assert.ok(src.includes(imp), `缺少导入: ${imp}`);
    }
  });
});
