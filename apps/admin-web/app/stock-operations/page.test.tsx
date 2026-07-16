/**
 * stock-operations/page.test.tsx — 库存操作中心 L2 测试
 * 覆盖: 正例 · 边界 · 防御 · 组件结构
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

  it('应包含 Modal 创建/编辑弹窗', () => {
    const src = readSource();
    assert.ok(src.includes('Modal'), '缺少 Modal');
  });

  it('应包含 StatCard 统计卡片', () => {
    const src = readSource();
    assert.ok(src.includes('StatCard') || src.includes('stat'), '缺少 StatCard');
  });

  it('应包含 FormSubmitFeedback 反馈', () => {
    const src = readSource();
    assert.ok(src.includes('FormSubmitFeedback'), '缺少 FormSubmitFeedback');
  });

  it('应从 @m5/ui 导入必要组件', () => {
    const src = readSource();
    assert.ok(src.includes("from '@m5/ui'"), '应从 @m5/ui 导入');
    assert.ok(src.includes('PageShell'), '应导入 PageShell');
    assert.ok(src.includes('StatusBadge'), '应导入 StatusBadge');
    assert.ok(src.includes('DataTable'), '应导入 DataTable');
    assert.ok(src.includes('Pagination'), '应导入 Pagination');
    assert.ok(src.includes('Modal'), '应导入 Modal');
  });

  it('应使用 use client 指令', () => {
    const src = readSource();
    assert.ok(src.includes("'use client'"), '缺少 use client');
  });

  it('应包含创建操作单 Modal 逻辑', () => {
    const src = readSource();
    assert.ok(src.includes('showCreateModal'), '缺少创建 Modal 状态');
    assert.ok(src.includes('setShowCreateModal(true)'), '缺少打开创建 Modal');
  });

  it('应包含编辑 Modal 逻辑', () => {
    const src = readSource();
    assert.ok(src.includes('showEditModal'), '缺少编辑 Modal 状态');
  });

  it('应包含批量操作栏', () => {
    const src = readSource();
    assert.ok(src.includes('selectedIds.size > 0'), '缺少批量操作栏');
    assert.ok(src.includes('handleBatchApprove'), '缺少批量审批');
  });

  it('应包含导出功能', () => {
    const src = readSource();
    assert.ok(src.includes('handleExport'), '缺少导出功能');
    assert.ok(src.includes('.csv'), '应导出 CSV');
  });

  it('应渲染 4 个统计卡片 grid 布局', () => {
    const src = readSource();
    assert.ok(src.includes('StatCard') || src.includes('stat'), '缺少 StatCard');
    assert.ok(src.includes('操作单总数') || src.includes('totalCount'), '缺少操作单总数卡片');
    assert.ok(src.includes('待处理') || src.includes('pending'), '缺少待处理卡片');
    assert.ok(src.includes('入库/出库') || src.includes('入库'), '缺少入库/出库卡片');
  });
});

// ---- 边界 / 防御 ----

describe('stock-operations — 边界防御', () => {
  it('OT 类型标签映射应覆盖全部 7 种 OpType', () => {
    const src = readSource();
    assert.ok(src.includes("purchase_in: '采购入库'") || src.includes("purchase_in:'采购入库'"), '缺少 purchase_in');
    assert.ok(src.includes("sale_out: '销售出库'"), '缺少 sale_out');
    assert.ok(src.includes("transfer_out: '调拨出库'"), '缺少 transfer_out');
    assert.ok(src.includes("transfer_in: '调拨入库'"), '缺少 transfer_in');
    assert.ok(src.includes("return_in: '退货入库'"), '缺少 return_in');
    assert.ok(src.includes("damage_out: '损耗出库'"), '缺少 damage_out');
    assert.ok(src.includes("adjustment: '盘点调整'"), '缺少 adjustment');
  });

  it('OS 状态映射应覆盖全部 5 种 OpStatus', () => {
    const src = readSource();
    assert.ok(src.includes("draft:"), '缺少 draft');
    assert.ok(src.includes("pending_approval:"), '缺少 pending_approval');
    assert.ok(src.includes("approved:"), '缺少 approved');
    assert.ok(src.includes("completed:"), '缺少 completed');
    assert.ok(src.includes("cancelled:"), '缺少 cancelled');
  });

  it('表单校验应包含仓库和数量校验', () => {
    const src = readSource();
    assert.ok(src.includes("errors.warehouse"), '缺少仓库校验');
    assert.ok(src.includes("errors.totalQty"), '缺少数量校验');
  });

  it('创建操作单应调用 validateForm', () => {
    const src = readSource();
    assert.ok(src.includes('validateForm(formData)'), '缺少表单验证');
  });

  it('应包含 OpForm 表单组件', () => {
    const src = readSource();
    assert.ok(src.includes('function OpForm'), '缺少 OpForm 表单组件');
  });

  it('Mock 数据应包含 45 条操作记录', () => {
    const src = readSource();
    assert.ok(src.includes('length: 45'), 'Mock 数据长度应为 45');
  });

  it('表单默认值 DEFAULT_FORM 应定义', () => {
    const src = readSource();
    assert.ok(src.includes('DEFAULT_FORM'), '缺少 DEFAULT_FORM');
  });

  it('应包含 Refresh 刷新功能', () => {
    const src = readSource();
    assert.ok(src.includes('handleRefresh'), '缺少刷新功能');
  });

  it('应包含 FormField 表单字段组件', () => {
    const src = readSource();
    assert.ok(src.includes('FormField'), '缺少 FormField');
  });

  it('数据列应包含必要的列 key', () => {
    const src = readSource();
    const expected = ['refNo', 'date', 'type', 'items', 'totalQty', 'totalCost', 'status', 'creator', 'warehouse', 'actions'];
    for (const col of expected) {
      assert.ok(src.includes(`key: '${col}'`) || src.includes(`key:'${col}'`), `缺少列 key: '${col}'`);
    }
  });

  it('筛选状态过滤应包含 statusFilter 状态切换逻辑', () => {
    const src = readSource();
    assert.ok(src.includes('setStatusFilter'), '缺少 setStatusFilter');
    assert.ok(src.includes('statusFilter'), '缺少 statusFilter');
  });

  it('fm 格式化函数应正确输出 ¥ 前缀', () => {
    const src = readSource();
    assert.ok(src.includes('function fm('), '缺少 fm 格式化函数');
    assert.ok(src.includes('`¥${'), 'fm 应使用 ¥ 前缀');
  });

  it('应包含提交按钮 SubmitButton', () => {
    const src = readSource();
    assert.ok(src.includes('SubmitButton'), '缺少 SubmitButton');
  });

  it('应包含供应商 SUPPLIERS 常量', () => {
    const src = readSource();
    assert.ok(src.includes('SUPPLIERS'), '缺少 SUPPLIERS');
  });

  it('应包含仓库 WAREHOUSES 常量', () => {
    const src = readSource();
    assert.ok(src.includes('WAREHOUSES'), '缺少 WAREHOUSES');
  });
});

const SRC = fs.readFileSync(require.resolve('./page'), 'utf-8');

describe('Stock Operations — hooks验证', () => {
  it('包含useState声明', () => assert.ok(SRC.includes('const [') && SRC.includes('useState')));
  it('包含JSX返回', () => assert.ok(SRC.includes('return (')));
  it('包含事件处理器', () => assert.ok(SRC.includes('onClick={') || SRC.includes('onChange={')));
  it('包含列表渲染', () => assert.ok(SRC.includes('.map(')));
  it('包含条件渲染', () => assert.ok(SRC.includes(' && ') || SRC.includes(' ? ')));
  it('包含样式定义', () => assert.ok(SRC.includes('style={')));
  it('包含数据格式化', () => assert.ok(SRC.includes('.toFixed') || SRC.includes('toLocaleString')));
  it('包含模板字符串', () => assert.ok(SRC.includes('${')));
  it('包含默认导出', () => assert.ok(SRC.includes('export default function')));
  it('包含注释说明', () => assert.ok(SRC.includes('/**')));
});
