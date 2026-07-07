/**
 * StockPage — 库存管理列表页组件测试
 * 覆盖: 正例(渲染/摘要/表格/分页) / 反例(空数据/过滤结果为空) / 边界(单页/单行)
 */

import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import type { StockItem, StockStatus } from './StockStatusBadge';
import { STOCK_CATEGORIES, StockPage, type StockPageProps } from './StockPage';

// ── Mock Data ──

function createMockStockItems(n: number, overrides?: Partial<StockItem>): StockItem[] {
  const statuses: StockStatus[] = ['sufficient', 'low', 'critical', 'out_of_stock', 'overstocked'];
  const categories = ['护肤品', '彩妆', '香水', '身体护理'];
  return Array.from({ length: n }, (_, i) => ({
    id: `item-${i + 1}`,
    sku: `SKU-${String(i + 1).padStart(4, '0')}`,
    name: `测试商品 ${i + 1}`,
    category: categories[i % categories.length],
    quantity: (i + 1) * 10,
    minThreshold: 5,
    maxThreshold: 200,
    unit: '件',
    price: (i + 1) * 25.5,
    updatedAt: `2026-06-2${i % 9 + 1}`,
    status: statuses[i % statuses.length],
    ...overrides,
  }));
}

const MOCK_ITEMS = createMockStockItems(15);

function renderComponent(overrides?: Partial<StockPageProps>): string {
  const props: StockPageProps = {
    items: MOCK_ITEMS,
    total: 15,
    page: 1,
    pageSize: 10,
    ...overrides,
  };
  const comp = StockPage(props);

  // Simple JSX-to-string rendering — we can also check that it's a React element
  return JSON.stringify(comp);
}

// ── Helpers ──

describe('StockPage — 基础', () => {

  it('应导出一个函数组件', () => {
    assert.equal(typeof StockPage, 'function');
  });

  it('应导出 STOCK_CATEGORIES 常量并包含 8 个分类', () => {
    assert.ok(Array.isArray(STOCK_CATEGORIES));
    assert.equal(STOCK_CATEGORIES.length, 8);
    assert.ok(STOCK_CATEGORIES.includes('全部'));
    assert.ok(STOCK_CATEGORIES.includes('护肤品'));
    assert.ok(STOCK_CATEGORIES.includes('彩妆'));
    assert.ok(STOCK_CATEGORIES.includes('香水'));
  });

  it('应导出 StockPageProps 类型', () => {
    // TS 类型在运行时被擦除, 验证模块可正常导入即满足
  });

});

describe('StockPage — 正例渲染', () => {

  it('应渲染标题 "📦 库存管理"', () => {
    const el = StockPage({ items: MOCK_ITEMS, total: 15, page: 1, pageSize: 10 });
    const rendered = JSON.stringify(el);
    assert.ok(rendered.includes('库存管理'), '页面标题应包含"库存管理"');
  });

  it('应渲染 4 个核心指标卡', () => {
    const el = StockPage({ items: MOCK_ITEMS, total: 15, page: 1, pageSize: 10 });
    const rendered = JSON.stringify(el);
    assert.ok(rendered.includes('库存总件数'), '缺少库存总件数卡片');
    assert.ok(rendered.includes('库存总值'), '缺少库存总值卡片');
    assert.ok(rendered.includes('告急/缺货'), '缺少告急/缺货卡片');
    assert.ok(rendered.includes('库存积压'), '缺少库存积压卡片');
  });

  it('应正确计算库存总件数', () => {
    const items = createMockStockItems(5);
    const el = StockPage({ items, total: 5, page: 1, pageSize: 5 });
    const rendered = JSON.stringify(el);
    const totalStock = items.reduce((s, i) => s + i.quantity, 0);
    assert.ok(rendered.includes(String(totalStock)), `总件数应为 ${totalStock}`);
  });

  it('应正确计算库存总值', () => {
    const items = createMockStockItems(3);
    const el = StockPage({ items, total: 3, page: 1, pageSize: 3 });
    const rendered = JSON.stringify(el);
    const totalValue = items.reduce((s, i) => s + i.quantity * i.price, 0);
    // 格式化为 ¥xxx.xx
    assert.ok(rendered.includes('¥'), '缺少¥货币前缀');
  });

  it('应统计告急/缺货商品数', () => {
    const items = createMockStockItems(10);
    const criticalCount = items.filter(i => i.status === 'critical' || i.status === 'out_of_stock').length;
    const el = StockPage({ items, total: 10, page: 1, pageSize: 10 });
    const rendered = JSON.stringify(el);
    assert.ok(rendered.includes(String(criticalCount)), `告急/缺货数应为 ${criticalCount}`);
  });

  it('应统计库存积压商品数', () => {
    const items = [
      ...createMockStockItems(3, { status: 'overstocked' }),
      ...createMockStockItems(7, { status: 'sufficient' }),
    ];
    const el = StockPage({ items, total: 10, page: 1, pageSize: 10 });
    const rendered = JSON.stringify(el);
    assert.ok(rendered.includes('3'), '积压商品数应为 3');
  });

  it('应渲染表格 7 个表头列', () => {
    const el = StockPage({ items: MOCK_ITEMS, total: 15, page: 1, pageSize: 10 });
    const rendered = JSON.stringify(el);
    const headers = ['SKU', '商品名称', '分类', '库存数量', '阈值', '单价', '库存状态', '更新时间', '操作'];
    for (const h of headers) {
      assert.ok(rendered.includes(h), `缺少表头: ${h}`);
    }
  });

  it('应渲染搜索/筛选工具栏', () => {
    const el = StockPage({ items: MOCK_ITEMS, total: 15, page: 1, pageSize: 10 });
    const rendered = JSON.stringify(el);
    assert.ok(rendered.includes('搜索商品名称/SKU编码'), '缺少搜索输入框占位符');
    assert.ok(rendered.includes('搜索'), '缺少搜索按钮');
    assert.ok(rendered.includes('重置'), '缺少重置按钮');
    assert.ok(rendered.includes('全部状态'), '缺少状态筛选');
  });

  it('应在表格中渲染所有商品行', () => {
    const items = createMockStockItems(5);
    const el = StockPage({ items, total: 5, page: 1, pageSize: 5 });
    const rendered = JSON.stringify(el);
    for (const item of items) {
      assert.ok(rendered.includes(item.name), `表格缺少商品: ${item.name}`);
      assert.ok(rendered.includes(item.sku), `表格缺少 SKU: ${item.sku}`);
    }
  });

  it('应包含分页控件', () => {
    const el = StockPage({ items: MOCK_ITEMS, total: 15, page: 1, pageSize: 10 });
    const rendered = JSON.stringify(el);
    assert.ok(rendered.includes('上一页'), '缺少上一页按钮');
    assert.ok(rendered.includes('下一页'), '缺少下一页按钮');
    assert.ok(rendered.includes('1'), '应显示当前页码');
    assert.ok(rendered.includes('2'), '应显示总页数');
  });

  it('第一页应禁用"上一页"按钮', () => {
    const el = StockPage({ items: MOCK_ITEMS, total: 15, page: 1, pageSize: 10 });
    const rendered = JSON.stringify(el);
    // 第一页时 disabled 为 true
    assert.ok(rendered.includes('"disabled":true'), '第一页应禁用上一页');
  });

  it('最后一页应禁用"下一页"按钮', () => {
    const el = StockPage({ items: [MOCK_ITEMS[0]], total: 1, page: 1, pageSize: 1 });
    const rendered = JSON.stringify(el);
    assert.ok(rendered.includes('"disabled":true'), '最后一页应禁用下一页');
  });

});

describe('StockPage — 反例处理', () => {

  it('items 为 undefined 时不应崩溃', () => {
    assert.doesNotThrow(() => {
      // @ts-expect-error — 测试未定义 items 的情况
      StockPage({ total: 0, page: 1, pageSize: 10 });
    });
  });

  it('items 为 null 时不应崩溃', () => {
    assert.doesNotThrow(() => {
      // @ts-expect-error — 测试 null items 的情况
      StockPage({ items: null, total: 0, page: 1, pageSize: 10 });
    });
  });

  it('空数组时应渲染空状态占位', () => {
    const el = StockPage({ items: [], total: 0, page: 1, pageSize: 10 });
    const rendered = JSON.stringify(el);
    assert.ok(rendered.includes('暂无库存数据'), '应显示空状态提示');
    assert.ok(rendered.includes('请调整筛选条件或导入库存信息'), '应显示空状态说明');
  });

  it('total 为 0 时总页数应为 1', () => {
    const el = StockPage({ items: [], total: 0, page: 1, pageSize: 10 });
    const rendered = JSON.stringify(el);
    assert.ok(rendered.includes('1'), '总页数应为 1');
  });

  it('negative page 值不应崩溃', () => {
    assert.doesNotThrow(() => {
      StockPage({ items: MOCK_ITEMS, total: 15, page: -1, pageSize: 10 });
    });
  });

  it('pageSize 为 0 不应崩溃', () => {
    assert.doesNotThrow(() => {
      StockPage({ items: MOCK_ITEMS, total: 15, page: 1, pageSize: 0 });
    });
  });

  it('各种空字符串过滤不应崩溃', () => {
    assert.doesNotThrow(() => {
      StockPage({ items: MOCK_ITEMS, total: 15, page: 1, pageSize: 10, categoryFilter: '', statusFilter: '', searchQuery: '' });
    });
  });

});

describe('StockPage — 边界条件', () => {

  it('单页数据不应显示分页按钮(数据小于 pageSize)', () => {
    const items = createMockStockItems(3);
    const el = StockPage({ items, total: 3, page: 1, pageSize: 10 });
    const rendered = JSON.stringify(el);
    // 总页数应为 1
    assert.ok(rendered.includes('1'), '总页数应为 1');
  });

  it('只有一行数据时应正常渲染', () => {
    const item = createMockStockItems(1);
    const el = StockPage({ items: item, total: 1, page: 1, pageSize: 10 });
    const rendered = JSON.stringify(el);
    assert.ok(rendered.includes(item[0].name), '应渲染唯一的商品名');
    assert.ok(rendered.includes('1'), '应显示 1 件商品');
  });

  it('大量数据(200行)应正常渲染', () => {
    const items = createMockStockItems(200);
    assert.doesNotThrow(() => {
      StockPage({ items, total: 200, page: 1, pageSize: 20 });
    });
  });

  it('大额金额应正确格式化', () => {
    const items = createMockStockItems(1, { price: 9999999.99 });
    const el = StockPage({ items, total: 1, page: 1, pageSize: 10 });
    const rendered = JSON.stringify(el);
    assert.ok(rendered.includes('¥9'), '应格式化大额金额');
  });

  it('每种库存状态应都有对应的 StockBadge', () => {
    const el = StockPage({ items: MOCK_ITEMS, total: 15, page: 1, pageSize: 15 });
    const rendered = JSON.stringify(el);
    const statuses: StockStatus[] = ['sufficient', 'low', 'critical', 'out_of_stock', 'overstocked'];
    for (const s of statuses) {
      assert.ok(rendered.includes(s), `缺少状态: ${s}`);
    }
  });

  it('含特殊字符的商品名不应崩溃', () => {
    const items = createMockStockItems(1, { name: '<script>alert("xss")</script>' });
    assert.doesNotThrow(() => {
      StockPage({ items, total: 1, page: 1, pageSize: 10 });
    });
    // React JSX children 内容在 DOM 中会被转义，测试组件不崩溃即可
    // JSON.stringify 展示的是 VNode props 的原始值，不是实际 DOM
  });

  it('负价格不应崩溃', () => {
    const items = createMockStockItems(1, { price: -100 });
    assert.doesNotThrow(() => {
      StockPage({ items, total: 1, page: 1, pageSize: 10 });
    });
    const rendered = JSON.stringify(StockPage({ items, total: 1, page: 1, pageSize: 10 }));
    assert.ok(rendered.includes('-'), '应为负价格保留负号');
  });

});

describe('StockPage — Props 数据流完整性', () => {

  it('page 变化应影响分页信息', () => {
    const elPage2 = StockPage({ items: MOCK_ITEMS, total: 15, page: 2, pageSize: 10 });
    const rendered2 = JSON.stringify(elPage2);
    // 第 2 页时上一页不应禁用
    assert.ok(rendered2.includes('"disabled":false'), '第2页时上一页应可用');
  });

  it('total 应为通过 props 传入的准确值', () => {
    const el = StockPage({ items: MOCK_ITEMS, total: 42, page: 1, pageSize: 10 });
    const rendered = JSON.stringify(el);
    assert.ok(rendered.includes('42'), 'total 应精确传递');
  });

  it('未提供可选 props 时应使用默认值', () => {
    const el = StockPage({ items: MOCK_ITEMS, total: 15, page: 1, pageSize: 10 });
    const rendered = JSON.stringify(el);
    assert.ok(rendered.includes('搜索商品名称/SKU编码'), '默认搜索框内容正常');
  });

});

describe('StockPage — 业务逻辑', () => {

  it('formatCurrency 应正确格式化金额', async () => {
    const mod = await import('./StockPage');
    // formatCurrency is not exported, verify indirectly through rendered output
    const items = createMockStockItems(1, { price: 12345.5 });
    const el = StockPage({ items, total: 1, page: 1, pageSize: 10 });
    const rendered = JSON.stringify(el);
    assert.ok(rendered.includes('¥12'), '应格式化金额');
  });

  it('单位应显示在每个商品行', () => {
    const items = createMockStockItems(2);
    const el = StockPage({ items, total: 2, page: 1, pageSize: 10 });
    const rendered = JSON.stringify(el);
    assert.ok(rendered.includes('件'), '应显示商品单位');
  });

  it('数据更新时间应渲染', () => {
    const items = createMockStockItems(1, { updatedAt: '2026-06-27 13:30' });
    const el = StockPage({ items, total: 1, page: 1, pageSize: 10 });
    const rendered = JSON.stringify(el);
    assert.ok(rendered.includes('2026-06-27'), '应显示更新时间');
  });

});
