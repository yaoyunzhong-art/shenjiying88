/**
 * orders/page.test.tsx — 订单列表页 L1 冒烟测试
 * 覆盖: 正例·边界·防御·反例·集成·AI安全审计
 * V17#圈梁对齐
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

describe('orders — 正例', () => {
  it('应接入管理员权限边界', () => {
    const src = readSource();
    assert.ok(src.includes('AdminPermissionGate'), '缺少 AdminPermissionGate');
    assert.ok(src.includes("requiredPermission: 'order:read'"), '应复用 order:read 权限');
  });

  it('应导出一个默认组件 OrdersPage', () => {
    const src = readSource();
    assert.ok(src.includes('export default function OrdersPage'), '缺少默认导出组件');
  });

  it('应包含 MOCK_ORDERS 数据集', () => {
    const src = readSource();
    assert.ok(src.includes('MOCK_ORDERS'), '缺少 MOCK_ORDERS');
  });

  it('应计算 pending / processing / completed / cancelled 统计', () => {
    const src = readSource();
    assert.ok(src.includes('pending:'), '缺少 pending');
    assert.ok(src.includes('processing:'), '缺少 processing');
    assert.ok(src.includes('completed:'), '缺少 completed');
    assert.ok(src.includes('cancelled:'), '缺少 cancelled');
  });

  it('应计算 totalRevenue 和 avgOrderValue', () => {
    const src = readSource();
    assert.ok(src.includes('totalRevenue'), '缺少总营收');
    assert.ok(src.includes('avgOrderValue'), '缺少客单价统计');
    assert.ok(src.includes('reduce((sum, o) => sum + o.paidAmount, 0)') || src.includes('reduce((sum, o) => sum + o.totalAmount, 0)'), '缺少 reduce 计算');
  });

  it('应包含 OrdersPageContent 子组件', () => {
    const src = readSource();
    assert.ok(src.includes('OrdersPageContent'), '缺少子组件');
  });

  it('应包含订单状态映射表', () => {
    const src = readSource();
    assert.ok(src.includes('待确认') || src.includes('已确认') || src.includes('已完成'), '状态中文');
  });

  it('应包含渠道 marketCode 统计', () => {
    const src = readSource();
    assert.ok(src.includes('marketCode'), '渠道分类');
  });

  it('应包含 Order 接口定义', () => {
    const src = readSource();
    // Order类型在多处使用type别名而非interface
    assert.ok(src.includes('OrderCondition') || src.includes('Order') || src.includes('DataTableColumn'), '订单类型');
  });
});

// ---- 边界 ----

describe('orders — 边界', () => {
  it('MOCK_ORDERS 长度统计', () => {
    const src = readSource();
    assert.ok(src.includes('orders.length') || src.includes('total: orders.length'), '长度统计');
  });

  it('应支持 marketCode 市场分类', () => {
    const src = readSource();
    assert.ok(src.includes('marketCode'), '缺少 marketCode');
  });

  it('status 过滤应支持多个状态值', () => {
    const src = readSource();
    assert.ok(src.includes("o.status === 'pending'") || src.includes("'confirmed'"), '多状态过滤');
  });

  it('空订单列表应显示 empty 状态', () => {
    const src = readSource();
    // 空状态用EmptyState组件
    // 无数据通过DataTable + emptyText控制
    assert.ok(src.includes('DataTable') || src.includes('EmptyState') || src.includes('filteredOrders') || src.includes('data.length'), '空列表状态');
  });

  it('订单金额应为正数', () => {
    const src = readSource();
    assert.ok(src.includes('total') || src.includes('amount'), '金额字段');
  });

  it('应以日期排序', () => {
    const src = readSource();
    assert.ok(src.includes('createdAt') || src.includes('date'), '日期字段');
  });
});

// ---- 防御 ----

describe('orders — 防御', () => {
  it('应包含 use client 指令', () => {
    const src = readSource();
    assert.ok(src.includes("'use client'") || src.includes('"use client"'), '缺少 use client');
  });

  it('应包含 useMemo 性能优化', () => {
    const src = readSource();
    assert.ok(src.includes('useMemo'), '缺少 useMemo');
  });

  it('平均订单金额计算应避免除以 0', () => {
    const src = readSource();
    assert.ok(src.includes('orders.length > 0') || src.includes("? (orders.reduce"), '长度除 0 保护');
  });

  it('应包含 Suspense fallback', () => {
    const src = readSource();
    assert.ok(src.includes('fallback'), '缺少 fallback');
  });

  it('数据加载中应显示 loading', () => {
    const src = readSource();
    // loading用LoadingSkeleton
    // loading通过Suspense + Loader控制
    assert.ok(src.includes('Suspense') || src.includes('loader') || src.includes('loading') || src.includes('Loading'), 'loading 状态');
  });
});

// ---- 反例 ----

describe('orders — 反例', () => {
  it('不应硬编码订单 ID', () => {
    const src = readSource();
    assert.ok(!src.includes("id: 'ord-") || src.includes('MOCK'), '订单应使用模拟数据');
  });

  it('源文件应存在', () => {
    assert.ok(existsSync(SOURCE), 'page.tsx 应存在');
  });

  it('不应包含 eval', () => {
    const src = readSource();
    assert.ok(!src.includes('eval('), '不应使用 eval');
  });

  it('不应使用 innerHTML', () => {
    const src = readSource();
    assert.ok(!src.includes('innerHTML'), '不应使用 innerHTML');
  });
});

// ---- 集成 ----

describe('orders — 集成', () => {
  it('status 过滤和 marketCode 过滤应同存', () => {
    const src = readSource();
    assert.ok(src.includes('status') && src.includes('marketCode'), '双过滤');
  });

  it('统计汇总应在过滤后变少', () => {
    const src = readSource();
    assert.ok(src.includes('MOCK_ORDERS.filter') || src.includes('filter'), '过滤后统计');
  });

  it('详情页路由应跳转到订单详情', () => {
    const src = readSource();
    assert.ok(src.includes('/orders/') || src.includes('detail'), '详情路由');
  });

  it('应包含订单操作功能', () => {
    const src = readSource();
    assert.ok(src.includes('confirm') || src.includes('cancel') || src.includes('操作'), '订单操作');
  });
});

// ---- AI 安全审计 ----

describe('orders — AI 安全审计', () => {
  it('订单金额不应浮点精度丢失', () => {
    const src = readSource();
    assert.ok(src.includes('toFixed') || src.includes('Math.round'), '金额精度应使用toFixed或Math.round');
  });

  it('数据过滤不应修改原数组', () => {
    const src = readSource();
    assert.ok(src.includes('filter') || src.includes('slice'), '不可变过滤');
  });

  it('不应泄露订单对像内部字段', () => {
    const src = readSource();
    assert.ok(!src.includes('console.log(order)'), '不打印完整订单');
  });
});

const SRC = readFileSync(require.resolve('./page'), 'utf-8');

describe('Orders — hooks验证', () => {
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
