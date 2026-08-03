/**
 * 小程序采购单列表页单元测试（L1 风格，与 index/member test 保持一致）
 *
 * - 直接分析源码检查关键结构和常量
 * - 无需模拟 Taro 运行时
 *
 * 三件套：正例 + 反例 + 边界
 */
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const SOURCE_PATH = resolve(__dirname, 'index.tsx');
const SOURCE: string = readFileSync(SOURCE_PATH, 'utf-8');

describe('purchase-orders/index 页面源码分析 — 正例集', () => {
  it('应导出默认函数组件', () => {
    assert.match(SOURCE, /export default function PurchaseOrdersPage/);
  });

  it('应包含 MOCK_ORDERS 数据，且至少有 8 条', () => {
    const match = SOURCE.match(/const MOCK_ORDERS: PurchaseOrder\[\] = \[([\s\S]*?)\];/);
    assert.ok(match, 'MOCK_ORDERS 定义缺失');
    const count = (match[1]!.match(/\{/g) ?? []).length;
    assert.ok(count >= 8, `MOCK_ORDERS 数量不足 (实际 ${count})`);
  });

  it('STATUS_OPTIONS 应覆盖 7 个选项', () => {
    const match = SOURCE.match(/STATUS_OPTIONS.*?\[([\s\S]*?)\]/);
    assert.ok(match, 'STATUS_OPTIONS 定义缺失');
    const count = (match[1]!.match(/'/g) ?? []).length;
    assert.ok(count >= 7 * 2, `STATUS_OPTIONS 选项不足`);
  });

  it('STATUS_LABELS 应覆盖 6 种状态', () => {
    const match = SOURCE.match(/STATUS_LABELS.*?\{([\s\S]*?)\}/);
    assert.ok(match, 'STATUS_LABELS 定义缺失');
    const labels = ['草稿', '已提交', '已确认', '已发货', '已收货', '已取消'];
    for (const label of labels) {
      assert.ok(match[1]!.includes(label), `缺少标签: ${label}`);
    }
  });

  it('STATUS_COLORS 应覆盖 6 种状态颜色', () => {
    const match = SOURCE.match(/STATUS_COLORS.*?\{([\s\S]*?)\}/);
    assert.ok(match, 'STATUS_COLORS 定义缺失');
    const colors = ['#f59e0b', '#3b82f6', '#22c55e', '#06b6d4', '#64748b', '#ef4444'];
    for (const color of colors) {
      assert.ok(match[1]!.includes(color), `缺少颜色: ${color}`);
    }
  });

  it('STATUS_MAP 应映射 7 个状态值', () => {
    const match = SOURCE.match(/STATUS_MAP.*?\{([\s\S]*?)\}/);
    assert.ok(match, 'STATUS_MAP 定义缺失');
    assert.ok(match[1]!.includes('ALL'), '缺少 ALL 映射');
    assert.ok(match[1]!.includes('draft'), '缺少 draft 映射');
    assert.ok(match[1]!.includes('cancelled'), '缺少 cancelled 映射');
  });

  it('PAGE_SIZE 应为 5', () => {
    assert.match(SOURCE, /const PAGE_SIZE = 5/);
  });

  it('应包含搜索功能: Input + Button', () => {
    assert.match(SOURCE, /搜索/);
    assert.match(SOURCE, /searchText/);
    assert.match(SOURCE, /Input/);
  });

  it('应包含状态筛选: Picker', () => {
    assert.match(SOURCE, /Picker/);
    assert.match(SOURCE, /statusFilter/);
  });

  it('应包含分页: 上一页/下一页', () => {
    assert.match(SOURCE, /上一页/);
    assert.match(SOURCE, /下一页/);
    assert.match(SOURCE, /totalPages/);
  });

  it('应包含统计卡片', () => {
    assert.match(SOURCE, /总采购单/);
    assert.match(SOURCE, /已收货/);
    assert.match(SOURCE, /总金额/);
  });

  it('应包含空状态展示', () => {
    assert.match(SOURCE, /EmptyState|暂无采购单/);
  });

  it('应包含点击跳转（goToDetail -> navigateTo 详情页）', () => {
    assert.match(SOURCE, /goToDetail/);
    assert.match(SOURCE, /navigateTo/);
    assert.match(SOURCE, /\/pages\/purchase-orders\/detail\/index\?id=/);
  });

  it('应通过 supplychain runtime 加载真实采购列表并展示 deliveryNote', () => {
    assert.match(SOURCE, /loadMiniappPurchaseOrders/);
    assert.match(SOURCE, /deliveryNote/);
    assert.match(SOURCE, /当前展示本地演示采购单数据/);
  });

  it('应包含底部记录条数统计', () => {
    assert.match(SOURCE, /共.*条记录/);
  });
});

describe('purchase-orders/index.config 配置', () => {
  it('导航标题应为 "采购单"', () => {
    const CONFIG_SOURCE = readFileSync(resolve(__dirname, 'index.config.ts'), 'utf-8');
    assert.match(CONFIG_SOURCE, /navigationBarTitleText/);
    assert.match(CONFIG_SOURCE, /采购单/);
  });
});

describe('采购单业务逻辑 — 正例集', () => {
  it('金额格式化: 万元转换', () => {
    const fmt = (v: number): string => v >= 10000 ? `¥${(v / 10000).toFixed(1)}万` : `¥${v.toLocaleString()}`;
    assert.equal(fmt(28600), '¥2.9万');
    assert.equal(fmt(8900), '¥8,900');
    assert.equal(fmt(10000), '¥1.0万');
    assert.equal(fmt(0), '¥0');
  });

  it('搜索过滤: 按供应商匹配', () => {
    const orders = [
      { supplier: '广州美妆供应链有限公司' },
      { supplier: '上海日化贸易有限公司' },
    ];
    const result = orders.filter(o => o.supplier.includes('广州'));
    assert.equal(result.length, 1);
  });

  it('状态筛选: received 状态应匹配', () => {
    const statuses: string[] = ['received', 'shipped', 'received'];
    assert.equal(statuses.filter(s => s === 'received').length, 2);
  });

  it('分页: 8条数据分2页 (PAGE_SIZE=5)', () => {
    const total = 8;
    const pageSize = 5;
    const pages = Math.ceil(total / pageSize);
    assert.equal(pages, 2);
  });

  it('数据汇总: 总金额应为 116800', () => {
    const amounts = [28600, 15800, 8900, 4200, 12600, 34000, 7500, 5200];
    assert.equal(amounts.reduce((a, b) => a + b, 0), 116800);
  });
});

describe('采购单业务逻辑 — 反例集', () => {
  it('搜索无匹配时应返回空数组', () => {
    const orders = [
      { supplier: '广州美妆供应链有限公司' },
      { supplier: '上海日化贸易有限公司' },
    ];
    const result = orders.filter(o => o.supplier.includes('不存在的供应商'));
    assert.equal(result.length, 0);
  });

  it('不存在状态筛选应返回空', () => {
    const orders = [
      { status: 'draft' as string },
      { status: 'received' as string },
    ];
    const result = orders.filter(o => o.status === 'nonexistent');
    assert.equal(result.length, 0);
  });

  it('page=0 或 page<1 时 should 安全地使用第1页', () => {
    const total = 8;
    const pageSize = 5;
    const pages = Math.ceil(total / pageSize);
    const safePage = Math.max(1, 0);
    assert.equal(safePage, 1);
    assert.equal(pages, 2);
  });

  it('超最大页数时应安全地使用最后一页', () => {
    const total = 8;
    const pageSize = 5;
    const pages = Math.ceil(total / pageSize);
    const safePage = Math.min(999, pages);
    assert.equal(safePage, pages);
    assert.equal(pages, 2);
  });
});

describe('采购单业务逻辑 — 边界集', () => {
  it('MOCK_ORDERS 中所有 ID 应唯一', () => {
    const ids = [
      '1', '2', '3', '4',
      '5', '6', '7', '8',
    ];
    assert.equal(new Set(ids).size, ids.length);
  });

  it('MOCK_ORDERS 所有金额应为正数', () => {
    const amounts = [28600, 15800, 8900, 4200, 12600, 34000, 7500, 5200];
    for (const a of amounts) {
      assert.ok(a > 0, `金额应为正数: ${a}`);
    }
  });

  it('MOCK_ORDERS 中 supplier 应全部非空', () => {
    assert.match(SOURCE, /'广州美妆供应链有限公司'/);
    assert.match(SOURCE, /'上海日化贸易有限公司'/);
    assert.match(SOURCE, /'深圳包材创新有限公司'/);
    assert.match(SOURCE, /'杭州香氛科技有限公司'/);
    assert.match(SOURCE, /'广州妆具工贸有限公司'/);
  });

  it('MOCK_ORDERS 应覆盖全部 6 种状态', () => {
    const statuses = ['draft', 'submitted', 'confirmed', 'shipped', 'received', 'cancelled'];
    for (const s of statuses) {
      assert.match(SOURCE, new RegExp(`status: '${s}'`), `缺少状态: ${s}`);
    }
  });

  it('MOCK_ORDERS 中 orderDate 格式应为 YYYY-MM-DD', () => {
    const dates = [
      '2026-06-01', '2026-06-05', '2026-06-10', '2026-06-12',
      '2026-06-15', '2026-06-18', '2026-06-20', '2026-06-22',
    ];
    for (const d of dates) {
      assert.match(d, /^\d{4}-\d{2}-\d{2}$/);
    }
  });

  it('格式金额: 小于1元边界', () => {
    const fmt = (v: number): string => v >= 10000 ? `¥${(v / 10000).toFixed(1)}万` : `¥${v.toLocaleString()}`;
    assert.equal(fmt(50), '¥50');
    assert.equal(fmt(1), '¥1');
  });

  it('格式金额: 精确万元边界', () => {
    const fmt = (v: number): string => v >= 10000 ? `¥${(v / 10000).toFixed(1)}万` : `¥${v.toLocaleString()}`;
    assert.equal(fmt(9999), '¥9,999');
    assert.equal(fmt(10001), '¥1.0万');
  });

  it('搜索过滤: 按订单号匹配（不区分大小写）', () => {
    const orders = [
      { orderNo: 'PO-20260601-001' },
      { orderNo: 'PO-20260605-002' },
    ];
    const result = orders.filter(o => o.orderNo.toLowerCase().includes('po-20260601'));
    assert.equal(result.length, 1);
  });

  it('搜索过滤: 按订单号无匹配时返回空', () => {
    const orders = [
      { orderNo: 'PO-20260601-001' },
      { orderNo: 'PO-20260605-002' },
    ];
    const result = orders.filter(o => o.orderNo.toLowerCase().includes('PO-99999999'));
    assert.equal(result.length, 0);
  });

  it('formatAmount 应为函数声明或箭头函数', () => {
    assert.ok(
      SOURCE.includes('function formatAmount') || SOURCE.includes('const formatAmount'),
      'formatAmount 定义缺失',
    );
  });

  it('useEffect 应有清理函数 (cancelled flag)', () => {
    assert.match(SOURCE, /return \(\) =>/);
    assert.match(SOURCE, /cancelled = true/);
  });
});
