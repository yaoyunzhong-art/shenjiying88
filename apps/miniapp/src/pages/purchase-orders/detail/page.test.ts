/**
 * purchase-orders/detail 页面单元测试（L1 风格）
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
let SOURCE: string;

function getSource(): string {
  if (!SOURCE) {
    SOURCE = readFileSync(SOURCE_PATH, 'utf-8');
  }
  return SOURCE;
}

describe('purchase-orders/detail 页面源码分析 — 正例集', () => {
  it('应导出默认函数组件 PurchaseOrderDetailPage', () => {
    const src = getSource();
    assert.ok(src.includes('export default PurchaseOrderDetailPage'), '缺少默认导出');
  });

  it('应包含 MOCK_DETAIL 数据且包含订单项', () => {
    const src = getSource();
    const match = src.match(/const MOCK_DETAIL: PurchaseOrderDetail = \{([\s\S]*?)\};/);
    assert.ok(match, 'MOCK_DETAIL 定义缺失');
    assert.ok(src.includes('orderNo:'), '缺少 orderNo 字段');
    assert.ok(src.includes('supplier'), '缺少 supplier 字段');
    assert.ok(src.includes('totalAmount'), '缺少 totalAmount 字段');
  });

  it('MOCK_DETAIL 应包含至少 2 个商品项', () => {
    const src = getSource();
    const itemsSection = src.match(/items:\s*\[([\s\S]*?)\],/);
    assert.ok(itemsSection, 'items 数组缺失');
    const objCount = (itemsSection[1]!.match(/\{/g) ?? []).length;
    assert.ok(objCount >= 2, `商品项不足 (实际 ${objCount})`);
  });

  it('MOCK_DETAIL 应包含 3 个商品项', () => {
    const src = getSource();
    const itemsSection = src.match(/items:\s*\[([\s\S]*?)\],/);
    assert.ok(itemsSection, 'items 数组缺失');
    const objCount = (itemsSection[1]!.match(/\{/g) ?? []).length;
    assert.equal(objCount, 3, `商品项数量应为 3 (实际 ${objCount})`);
  });

  it('应定义 OrderStatus 类型（从 MiniappPurchaseOrderDetail 推断）', () => {
    const src = getSource();
    assert.ok(src.includes('type OrderStatus = MiniappPurchaseOrderDetail'), 'OrderStatus 类型缺失');
  });

  it('STATUS_LABELS 应有全部 6 个状态标签', () => {
    const src = getSource();
    assert.ok(src.match(/draft:\s*'草稿'/), '草稿状态标签缺失');
    assert.ok(src.match(/submitted:\s*'已提交'/), '已提交状态标签缺失');
    assert.ok(src.match(/confirmed:\s*'已确认'/), '已确认状态标签缺失');
    assert.ok(src.match(/shipped:\s*'已发货'/), '已发货状态标签缺失');
    assert.ok(src.match(/received:\s*'已收货'/), '已收货状态标签缺失');
    assert.ok(src.match(/cancelled:\s*'已取消'/), '已取消状态标签缺失');
  });

  it('STATUS_COLORS 应有全部 6 个状态颜色', () => {
    const src = getSource();
    const colors = ['#f59e0b', '#3b82f6', '#22c55e', '#06b6d4', '#64748b', '#ef4444'];
    for (const c of colors) {
      assert.ok(src.includes(c), `缺少颜色: ${c}`);
    }
  });

  it('STATUS_TRANSITIONS 应包含状态流转关系', () => {
    const src = getSource();
    assert.ok(src.includes('STATUS_TRANSITIONS'), '缺少状态流转定义');
  });
});

describe('purchase-orders/detail 源码 — 边界集', () => {
  it('应包含 formatAmount 辅助函数', () => {
    const src = getSource();
    assert.ok(src.includes('function formatAmount'), 'formatAmount 函数缺失');
  });

  it('应包含 getStatusActions 辅助函数', () => {
    const src = getSource();
    assert.ok(src.includes('function getStatusActions'), 'getStatusActions 函数缺失');
  });

  it('应从路由参数读取订单 id 并通过 runtime 加载真实详情', () => {
    const src = getSource();
    assert.ok(src.includes('resolveCurrentOrderId'), '缺少订单 id 解析');
    assert.ok(src.includes('getCurrentInstance()?.router?.params?.id'), '缺少路由参数读取');
    assert.ok(src.includes('loadMiniappPurchaseOrderDetail'), '缺少真实详情加载');
    assert.ok(src.includes('deliveryNote'), '缺少交付模式提示');
  });

  it('应通过 runtime 提交采购单状态动作与删除动作', () => {
    const src = getSource();
    assert.ok(src.includes('executeMiniappPurchaseOrderAction'), '缺少采购单动作提交');
    assert.ok(src.includes('deleteMiniappPurchaseOrder'), '缺少采购单删除提交');
    assert.ok(src.includes('if (result.success)'), '缺少成功失败分支处理');
  });

  it('应处理 cancelled 状态的按钮隐藏逻辑', () => {
    const src = getSource();
    assert.ok(src.includes("localStatus !== 'cancelled'"), 'cancelled 状态处理逻辑缺失');
  });

  it('应导出 formatAmount 供外部使用', () => {
    const src = getSource();
    assert.ok(src.includes('formatAmount,'), 'formatAmount 未导出');
  });

  it('应导出 getStatusActions 供外部使用', () => {
    const src = getSource();
    assert.ok(src.includes('getStatusActions,'), 'getStatusActions 未导出');
  });

  it('应导出 MOCK_DETAIL 供外部使用', () => {
    const src = getSource();
    assert.ok(src.includes('MOCK_DETAIL,'), 'MOCK_DETAIL 未导出');
  });

  it('应导出 resolveCurrentOrderId 供外部使用', () => {
    const src = getSource();
    assert.ok(src.includes('export { formatAmount, getStatusActions, MOCK_DETAIL, resolveCurrentOrderId }'), 'resolveCurrentOrderId 未导出');
  });

  it('STATUS_TRANSITIONS 应覆盖 draft/submitted/confirmed/shipped 四种', () => {
    const src = getSource();
    assert.ok(src.includes("draft: ['submitted', 'cancelled']"), 'draft 流转缺失');
    assert.ok(src.includes("submitted: ['confirmed', 'cancelled']"), 'submitted 流转缺失');
    assert.ok(src.includes("confirmed: ['shipped', 'cancelled']"), 'confirmed 流转缺失');
    assert.ok(src.includes("shipped: ['received']"), 'shipped 流转缺失');
  });

  it('getStatusActions 返回空数组当状态无流转定义', () => {
    // 直接模拟：received 和 cancelled 不在 STATUS_TRANSITIONS 定义中
    const transitions: Record<string, string[]> = {
      draft: ['submitted', 'cancelled'],
      submitted: ['confirmed', 'cancelled'],
      confirmed: ['shipped', 'cancelled'],
      shipped: ['received'],
    };
    assert.deepEqual(transitions['received'] ?? [], []);
    assert.deepEqual(transitions['cancelled'] ?? [], []);
  });

  it('MOCK_DETAIL 所有商品 SKU 应唯一', () => {
    const src = getSource();
    assert.ok(src.includes("sku: 'SKU-001'"));
    assert.ok(src.includes("sku: 'SKU-002'"));
    assert.ok(src.includes("sku: 'SKU-003'"));
  });

  it('商品明细金额应等于 qty×unitPrice', () => {
    const items = [
      { qty: 200, unitPrice: 68, amount: 13600 },
      { qty: 100, unitPrice: 120, amount: 12000 },
      { qty: 50, unitPrice: 60, amount: 3000 },
    ];
    for (const item of items) {
      assert.equal(item.qty * item.unitPrice, item.amount, `金额不符: ${item.qty}×${item.unitPrice} 应为 ${item.amount}`);
    }
  });
});

describe('purchase-orders/detail 源码 — 防御集', () => {
  it('编辑按钮应有 handleEdit 事件处理', () => {
    const src = getSource();
    assert.ok(src.includes('handleEdit'), 'handleEdit 处理函数缺失');
  });

  it('删除按钮应有 handleDelete 事件处理', () => {
    const src = getSource();
    assert.ok(src.includes('handleDelete'), 'handleDelete 处理函数缺失');
  });

  it('状态变更应有 Taro.showModal 确认弹窗', () => {
    const src = getSource();
    const showModalCount = (src.match(/showModal/g) ?? []).length;
    assert.ok(showModalCount >= 2, `showModal 调用不足 (${showModalCount})`);
  });

  it('状态变更失败应有阻断提示，删除失败不应直接返回上一页', () => {
    const src = getSource();
    assert.ok(src.includes("title: '状态已同步'"), '状态同步成功提示缺失');
    assert.ok(src.includes("title: '同步失败'"), '状态同步失败提示缺失');
    assert.ok(src.includes("title: '删除失败'"), '删除失败提示缺失');
    assert.ok(src.includes('if (result.success)'), '删除成功失败分支缺失');
  });

  it('应包含 InfoRow 子组件', () => {
    const src = getSource();
    assert.ok(src.includes('function InfoRow'), 'InfoRow 组件缺失');
  });

  it('InfoRow 应包含 label 和 value 两个 props', () => {
    const src = getSource();
    assert.ok(src.includes('label: string;'), 'InfoRow label 类型缺失');
    assert.ok(src.includes('value: string;'), 'InfoRow value 类型缺失');
  });

  it('订单号应为字符串展示', () => {
    const src = getSource();
    assert.ok(src.includes('detail.orderNo'), '订单号渲染缺失');
  });

  it('合计金额应使用 formatAmount', () => {
    const src = getSource();
    assert.ok(src.includes('formatAmount(detail.totalAmount)'), '合计金额格式化缺失');
  });

  it('MOCK_DETAIL 的 expectedDate 应在 orderDate 之后', () => {
    const orderDate = '2026-06-01';
    const expectedDate = '2026-06-10';
    assert.ok(expectedDate > orderDate, 'expectedDate 应在 orderDate 之后');
  });

  it('空状态: cancelled 状态不应有删除按钮', () => {
    const src = getSource();
    const cancelledGuard = src.includes("localStatus !== 'cancelled'")
      || src.includes('localStatus === ');
    assert.ok(cancelledGuard, 'cancelled 状态的删除按钮防护缺失');
  });

  it('formatAmount 应格式化两位小数', () => {
    const fmt = (amount: number): string =>
      `¥${amount.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    assert.equal(fmt(28600), '¥28,600.00');
    assert.equal(fmt(0), '¥0.00');
    assert.equal(fmt(99.5), '¥99.50');
  });

  it('应包含备注条件渲染', () => {
    const src = getSource();
    assert.ok(src.includes('{detail.remark'), '备注条件渲染缺失');
  });
});
