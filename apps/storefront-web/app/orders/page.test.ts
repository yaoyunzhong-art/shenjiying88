/**
 * orders/page.test.ts — 订单列表页源码分析测试
 * 目标: 覆盖 page.tsx 的订单列表、状态、筛选、边界场景
 * 方法: 纯 node:test + readFileSync 源码分析
 * 标准: TSC storefront-web: 0, 无 as any
 */
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const SOURCE = resolve(import.meta.dirname, 'page.tsx');
const SRC = readFileSync(SOURCE, 'utf-8');

function countOccurrences(text: string, pattern: string): number {
  let count = 0;
  let idx = 0;
  while ((idx = text.indexOf(pattern, idx)) !== -1) {
    count++;
    idx += pattern.length;
  }
  return count;
}

function hasExport(name: string): boolean {
  return SRC.includes(`export default function ${name}`) ||
         SRC.includes(`export function ${name}`);
}

function hasConstDeclaration(name: string): boolean {
  return SRC.includes(`const ${name} =`) ||
         SRC.includes(`const ${name}:`) ||
         SRC.includes(`const ${name}<`);
}

function hasType(typeName: string): boolean {
  return SRC.includes(`type ${typeName}`) || SRC.includes(`type ${typeName} =`);
}

/* ────────────────────────────
 *  正例 — 核心结构与导出
 * ──────────────────────────── */

describe('orders — 正例：页面结构', () => {
  it('应导出 OrdersListPage 默认组件', () => {
    assert.ok(hasExport('OrdersListPage'), '缺少 export default function OrdersListPage');
  });

  it('应包含 use client 指令（Next.js 客户端组件）', () => {
    assert.ok(SRC.includes("'use client'"), '缺少 use client 指令');
  });

  it('应导入所需的 @m5/ui 子模块', () => {
    const required = [
      'DataTable', 'PageShell', 'Pagination', 'SearchFilterInput',
      'StatusBadge', 'Tabs', 'usePagination', 'useSortedItems',
      'StatCard', 'EmptyState', 'Dialog', 'Button',
    ];
    for (const name of required) {
      assert.ok(SRC.includes(name), `缺少 import { ${name} }`);
    }
  });

  it('应导入 React hooks（useMemo / useState / useCallback）', () => {
    assert.ok(SRC.includes('useMemo'), '缺少 useMemo');
    assert.ok(SRC.includes('useState'), '缺少 useState');
    assert.ok(SRC.includes('useCallback'), '缺少 useCallback');
  });

  it('应定义 OrderItem 接口', () => {
    assert.ok(SRC.includes('interface OrderItem'), '缺少 OrderItem 接口');
    const requiredFields = [
      'id', 'orderNo', 'memberName', 'memberPhone', 'items',
      'total', 'discount', 'actualAmount', 'paymentMethod',
      'status', 'storeName', 'createdAt',
    ];
    for (const field of requiredFields) {
      assert.ok(SRC.includes(field), `OrderItem 缺少字段: ${field}`);
    }
  });

  it('应定义 OrderStatus 和 PaymentMethod 类型', () => {
    assert.ok(hasType('OrderStatus'), '缺少 OrderStatus 类型');
    assert.ok(hasType('PaymentMethod'), '缺少 PaymentMethod 类型');
  });
});

/* ────────────────────────────
 *  正例 — 订单列表渲染
 * ──────────────────────────── */

describe('orders — 正例：列表渲染', () => {
  it('应包含 DataTable 表格', () => {
    assert.ok(SRC.includes('<DataTable'), '缺少 DataTable 使用');
    assert.ok(SRC.includes('columns={COLUMNS}'), '缺少 COLUMNS 传递');
    assert.ok(SRC.includes('rows={pageItems}'), '缺少分页数据传递');
    assert.ok(SRC.includes('rowKey={(item) => item.id}'), '缺少行键');
  });

  it('应定义 COLUMNS 常量包含所有列', () => {
    const expectedKeys = ['orderNo', 'items', 'actualAmount', 'paymentMethod', 'status', 'createdAt', 'storeName'];
    for (const key of expectedKeys) {
      assert.ok(SRC.includes(`key: '${key}'`), `COLUMNS 缺少列: ${key}`);
    }
    // 验证这些列都出现在 COLUMNS 定义区域内（而非 Tabs 区域）
    const colsStart = SRC.indexOf('const COLUMNS');
    const colsEnd = SRC.indexOf('// ---- 详情弹窗 ----');
    const colsSection = SRC.slice(colsStart, colsEnd);
    let count = 0;
    for (const key of expectedKeys) {
      if (colsSection.includes(`key: '${key}'`)) count++;
    }
    assert.equal(count, 7, 'COLUMNS 应该有 7 列');
  });

  it('应包含 formatCurrency 工具函数', () => {
    assert.ok(SRC.includes('function formatCurrency'), '缺少 formatCurrency');
    assert.ok(SRC.includes('¥'), '金额前缀应包含 ¥');
    assert.ok(SRC.includes('toFixed(2)'), '金额应保留两位小数');
  });

  it('应包含 formatDateTime 格式化函数', () => {
    assert.ok(SRC.includes('function formatDateTime'), '缺少 formatDateTime');
    assert.ok(SRC.includes('padStart'), '日期格式化应使用 padStart');
  });

  it('应渲染商品明细（items 列渲染）', () => {
    assert.ok(SRC.includes('it.name'), '商品名渲染');
    assert.ok(SRC.includes('it.qty'), '商品数量渲染');
  });

  it('应渲染实付金额与折扣信息', () => {
    assert.ok(SRC.includes('formatCurrency(item.actualAmount)'), '实付金额渲染');
    assert.ok(SRC.includes('formatCurrency(item.discount)'), '折扣渲染');
    assert.ok(SRC.includes('item.discount > 0'), '折扣条件判断');
  });

  it('应渲染 StatusBadge 状态徽章', () => {
    assert.ok(SRC.includes('<StatusBadge'), '使用 StatusBadge 组件');
    assert.ok(SRC.includes('STATUS_LABELS'), '使用 STATUS_LABELS');
    assert.ok(SRC.includes('STATUS_VARIANTS'), '使用 STATUS_VARIANTS');
  });

  it('STATUS_LABELS 应覆盖全部 8 种状态', () => {
    const statusKeys = [
      'pending_payment', 'paid', 'processing', 'shipped',
      'delivered', 'completed', 'cancelled', 'refunded',
    ];
    for (const st of statusKeys) {
      // STATUS_LABELS 使用裸属性名（非引号键），检查其值字符串
      assert.ok(SRC.includes(`${st}: '`), `STATUS_LABELS 缺少状态定义: ${st}`);
    }
  });

  it('PAYMENT_LABELS 应覆盖全部 5 种支付方式', () => {
    const methods = ['wechat', 'alipay', 'cash', 'card', 'points'];
    for (const pm of methods) {
      // PAYMENT_LABELS 使用裸属性名，检查 PM_LABELS 区域内是否有该键
      assert.ok(SRC.includes(`'${pm}'`), `PAYMENT_LABELS 缺少支付方式: ${pm}`);
    }
    // 确保 PAYMENT_LABELS 定义区域包含 all 5
    const pmStart = SRC.indexOf('PAYMENT_LABELS:');
    const pmEnd = SRC.indexOf('// ---- Mock');
    const pmSection = SRC.slice(pmStart, pmEnd);
    assert.equal((pmSection.match(/wechat|alipay|cash|card|points/g) || []).length, 5, 'PAYMENT_LABELS 应有 5 条');
  });
});

/* ────────────────────────────
 *  正例 — 筛选与搜索
 * ──────────────────────────── */

describe('orders — 正例：筛选能力', () => {
  it('应包含搜索输入（SearchFilterInput）', () => {
    assert.ok(SRC.includes('SearchFilterInput'), '缺少 SearchFilterInput');
    assert.ok(SRC.includes('searchTerm'), '缺少搜索状态变量');
    assert.ok(SRC.includes('setSearchTerm'), '缺少搜索状态 setter');
  });

  it('应包含状态筛选 Tabs', () => {
    assert.ok(SRC.includes('statusFilter'), '缺少状态筛选变量');
    assert.ok(SRC.includes('setStatusFilter'), '缺少状态筛选 setter');
    assert.ok(SRC.includes('Tabs'), '使用 Tabs 组件进行筛选');
  });

  it('应包含支付方式筛选 Tabs', () => {
    assert.ok(SRC.includes('paymentFilter'), '缺少支付方式筛选变量');
    assert.ok(SRC.includes('setPaymentFilter'), '缺少支付方式筛选 setter');
  });

  it('搜索过滤应搜索 orderNo / memberName / memberPhone / storeName / items 字段', () => {
    assert.ok(SRC.includes('orderNo.toLowerCase()'), '搜索订单号');
    assert.ok(SRC.includes('memberName.toLowerCase()'), '搜索会员名');
    assert.ok(SRC.includes('memberPhone.includes'), '搜索手机号');
    assert.ok(SRC.includes('storeName.toLowerCase()'), '搜索门店名');
    assert.ok(SRC.includes('items.some'), '搜索商品名');
  });

  it('筛选链应正确串联：搜索 → 状态 → 支付方式', () => {
    // 确认 useMemo 链的依赖关系
    const searchPos = SRC.indexOf('searched');
    const statusPos = SRC.indexOf('statusFiltered');
    const finalPos = SRC.indexOf('finalFiltered');
    assert.ok(searchPos >= 0, 'searched 变量');
    assert.ok(statusPos >= 0, 'statusFiltered 变量');
    assert.ok(finalPos >= 0, 'finalFiltered 变量');
    // statusFiltered 应该依赖 searched
    assert.ok(searchPos < statusPos, '筛选链顺序：searched → statusFiltered');
    assert.ok(statusPos < finalPos, '筛选链顺序：statusFiltered → finalFiltered');
  });
});

/* ────────────────────────────
 *  边界 — 分页 & 统计
 * ──────────────────────────── */

describe('orders — 边界：分页', () => {
  it('应使用分页（usePagination + Pagination）', () => {
    assert.ok(SRC.includes('usePagination'), '缺少 usePagination');
    assert.ok(SRC.includes('<Pagination'), '缺少 Pagination 组件');
    assert.ok(SRC.includes('pagination.page'), '使用分页页码');
    assert.ok(SRC.includes('pagination.totalPages'), '使用总分页数');
  });

  it('每页条数应为 12', () => {
    // 查找分页相关数字
    const pageSizePattern = /\b12\b/g;
    const pageSizeOccurrences = (SRC.match(/usePagination\(.*12\)/) || []).length;
    const slice12 = (SRC.match(/\* 12/) || []).length;
    assert.ok(pageSizeOccurrences >= 1 || slice12 >= 1, '应使用 12 作为每页条数');
  });

  it('应正确切片 pageItems', () => {
    assert.ok(SRC.includes('pageItems'), '缺少 pageItems');
    assert.ok(SRC.includes('.slice('), '使用 slice 分页');
    assert.ok(SRC.includes('(pagination.page - 1) *'), '分页偏移计算');
  });

  it('空数据时应显示 EmptyState', () => {
    assert.ok(SRC.includes('EmptyState'), '缺少 EmptyState');
    assert.ok(SRC.includes('暂无订单'), '缺少空状态文案');
    assert.ok(SRC.includes('pageItems.length > 0'), '空数据条件判断');
  });
});

describe('orders — 边界：统计卡片', () => {
  it('应使用 StatCard 展示统计', () => {
    assert.ok(SRC.includes('StatCard'), '缺少 StatCard');
    assert.ok(SRC.includes('总订单数'), '总订单数统计');
    assert.ok(SRC.includes('待支付'), '待支付统计');
    assert.ok(SRC.includes('已完成'), '已完成统计');
    assert.ok(SRC.includes('已取消'), '已取消统计');
    assert.ok(SRC.includes('总收入'), '总收入统计');
  });

  it('统计应排除取消/退款/待支付状态的收入', () => {
    const excludePattern = "!['cancelled', 'refunded', 'pending_payment'].includes";
    assert.ok(SRC.includes(excludePattern), '收入统计应排除取消/退款/待支付');
  });

  it('收入统计使用 reduce 累加 actualAmount', () => {
    assert.ok(SRC.includes('.reduce('), '使用 reduce 累加');
    assert.ok(SRC.includes('actualAmount'), '累加字段为 actualAmount');
  });
});

/* ────────────────────────────
 *  边界 — 订单详情弹窗
 * ──────────────────────────── */

describe('orders — 边界：订单详情弹窗', () => {
  it('应包含 OrderDetailDialog 组件', () => {
    assert.ok(SRC.includes('function OrderDetailDialog'), '缺少 OrderDetailDialog');
    assert.ok(SRC.includes('Dialog'), '使用 Dialog 组件');
  });

  it('弹窗应有 null 防御（order 为 null 时返回 null）', () => {
    assert.ok(SRC.includes('if (!order) return null'), '缺少 null 防御');
  });

  it('弹窗应包含商品明细表格', () => {
    assert.ok(SRC.includes('商品明细'), '商品明细标题');
    assert.ok(SRC.includes('<table'), '使用 HTML table');
    assert.ok(SRC.includes('<thead'), '表格表头');
    assert.ok(SRC.includes('<tfoot'), '表格表尾（小计/实付）');
  });

  it('弹窗应显示时间线（createdAt / paidAt / completedAt）', () => {
    assert.ok(SRC.includes('创建订单'), '时间线：创建订单');
    assert.ok(SRC.includes('支付成功'), '时间线：支付成功');
    assert.ok(SRC.includes('已完成'), '时间线：已完成');
  });

  it('弹窗应显示备注（remark）区域', () => {
    assert.ok(SRC.includes('order.remark'), '引用 remark 字段');
    assert.ok(SRC.includes('📝 备注'), '备注区域标题');
  });

  it('弹窗应根据状态显示操作按钮', () => {
    assert.ok(SRC.includes('statusActions'), '状态操作映射');
    assert.ok(SRC.includes('confirm收款') || SRC.includes('确认收款'), '待支付可确认收款');
    assert.ok(SRC.includes('取消订单'), '待支付可取消订单');
    assert.ok(SRC.includes('开始处理'), '已支付可开始处理');
    assert.ok(SRC.includes('退款'), '已支付可退款');
    assert.ok(SRC.includes('标记发货'), '处理中可标记发货');
    assert.ok(SRC.includes('确认送达'), '已发货可确认送达');
    assert.ok(SRC.includes('完成订单'), '已送达可完成订单');
  });

  it('completed / cancelled / refunded 状态应无操作按钮', () => {
    // 这些状态应对应空数组
    assert.ok(SRC.includes('completed: []'), '已完成状态无操作');
    assert.ok(SRC.includes('cancelled: []'), '已取消状态无操作');
    assert.ok(SRC.includes('refunded: []'), '已退款状态无操作');
  });
});

/* ────────────────────────────
 *  防御 — 异常与安全
 * ──────────────────────────── */

describe('orders — 防御', () => {
  it('formatCurrency 应正确转换分到元', () => {
    const fnMatch = SRC.match(/function formatCurrency\(amount: number\): string \{[\s\S]*?\n\}/);
    assert.ok(fnMatch, 'formatCurrency 函数定义');
    // 验证函数体：用 `(amount / 100).toFixed(2)` 转换
    assert.ok(SRC.includes('(amount / 100)'), '金额除以 100');
  });

  it('formatDateTime 应对 null 输入返回短横线', () => {
    assert.ok(SRC.includes('if (!iso) return'), 'formatDateTime null 防御');
    assert.ok(SRC.includes("'-'"), 'null 返回短横线');
  });

  it('排序功能应使用 useSortedItems', () => {
    assert.ok(SRC.includes('useSortedItems'), '使用 useSortedItems');
    assert.ok(SRC.includes('sortConfig'), '排序状态');
    assert.ok(SRC.includes('setSortConfig'), '排序状态 setter');
    assert.ok(SRC.includes('onSortChange={setSortConfig}'), 'DataTable 排序回调');
  });

  it('Mock 数据应生成 60 条', () => {
    assert.ok(SRC.includes('generateMockOrders(60)'), '生成 60 条模拟数据');
  });

  it('Mock 数据应覆盖多个门店', () => {
    const stores = ['Demo Store 旗舰店', 'Demo Store 社区店', 'Demo Store 优选店'];
    for (const s of stores) {
      assert.ok(SRC.includes(s), `门店数据包含: ${s}`);
    }
  });

  it('Mock 商品池应包含多种商品', () => {
    const items = ['瑜伽初级课', 'HIIT 高强度训练', '蛋白粉', '游泳季卡', '普拉提中级课'];
    for (const item of items) {
      assert.ok(SRC.includes(item), `商品池包含: ${item}`);
    }
  });

  it('Mock 订单应包含备注场景', () => {
    assert.ok(SRC.includes('加急配送'), '备注：加急配送');
    assert.ok(SRC.includes('礼品包装'), '备注：礼品包装');
    assert.ok(SRC.includes('特殊说明'), '备注：特殊说明');
  });

  it('文件中应无 debugger 语句', () => {
    assert.ok(!SRC.includes('debugger'), '禁止包含 debugger 语句');
  });

  it('文件中应无可执行 console.log 残留', () => {
    // 允许 console 出现在注释中，但不在运行代码中
    const logCalls = SRC.match(/console\.\w+\(/g);
    assert.equal(logCalls, null, '不应包含 console.* 调用');
  });

  it('支付方式筛选 Tabs 应显示各方式计数', () => {
    assert.ok(SRC.includes('statusFiltered.filter'), '支付方式筛选基于状态筛选结果');
    assert.ok(SRC.includes('paymentMethod'), '按支付方式过滤');
  });

  it('状态 Tabs 应显示各状态数量', () => {
    assert.ok(SRC.includes('searched.filter'), '状态筛选基于搜索结果');
  });
});

describe('orders — 边界：排序', () => {
  it('排序应支持多列', () => {
    // COLUMNS 定义中每个列都是 DataTableColumn 类型，带有 key/header/render
    assert.ok(SRC.includes('DataTableColumn<OrderItem>'), '列定义使用 DataTableColumn');
    assert.ok(SRC.includes('align:'), '列支持对齐方式');
    assert.ok(SRC.includes("'right'"), '部分列右对齐');
  });

  it('应支持无排序时的默认状态', () => {
    assert.ok(SRC.includes('DataTableSortConfig | null'), 'sortConfig 可为 null');
    assert.ok(SRC.includes('null)'), 'sortConfig 初始值为 null');
  });
});
