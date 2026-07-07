/**
 * purchase-orders/detail 页面单元测试（L1 风格）
 *
 * - 直接分析源码检查关键结构和常量
 * - 无需模拟 Taro 运行时
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
    // 统计 items 数组中的对象数量
    const itemsSection = src.match(/items:\s*\[([\s\S]*?)\],/);
    assert.ok(itemsSection, 'items 数组缺失');
    const objCount = (itemsSection[1]!.match(/\{/g) ?? []).length;
    assert.ok(objCount >= 2, `商品项不足 (实际 ${objCount})`);
  });

  it('应定义 OrderStatus 类型且包含 6 种状态', () => {
    const src = getSource();
    const statusMatch = src.match(/type OrderStatus = '([^']+)' \| '([^']+)' \| '([^']+)' \| '([^']+)' \| '([^']+)' \| '([^']+)'/);
    assert.ok(statusMatch, 'OrderStatus 类型缺失');
    assert.equal(statusMatch[1], 'draft');
    assert.equal(statusMatch[6], 'cancelled');
  });

  it('STATUS_LABELS 应有全部 6 个状态标签', () => {
    const src = getSource();
    // draft/submitted/confirmed/shipped/received/cancelled all present
    const draft = src.match(/draft:\s*'草稿'/);
    const submitted = src.match(/submitted:\s*'已提交'/);
    const confirmed = src.match(/confirmed:\s*'已确认'/);
    const shipped = src.match(/shipped:\s*'已发货'/);
    const received = src.match(/received:\s*'已收货'/);
    const cancelled = src.match(/cancelled:\s*'已取消'/);
    assert.ok(draft, '草稿状态标签缺失');
    assert.ok(submitted, '已提交状态标签缺失');
    assert.ok(confirmed, '已确认状态标签缺失');
    assert.ok(shipped, '已发货状态标签缺失');
    assert.ok(received, '已收货状态标签缺失');
    assert.ok(cancelled, '已取消状态标签缺失');
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
    assert.ok(showModalCount >= 2, `showModal 调用不足 (${showModalCount})`); // 状态变更 + 删除
  });

  it('状态变更成功应有 showToast 提示', () => {
    const src = getSource();
    assert.ok(src.includes("showToast({ title: '状态更新成功'"), '状态更新成功提示缺失');
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
});
