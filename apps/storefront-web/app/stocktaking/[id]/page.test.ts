/**
 * stocktaking/[id]/page.test.tsx — 盘点详情页 L1 冒烟测试
 * 角色视角: 👔店长 / 🔧仓管
 * 覆盖: 正例·反例·边界
 */
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const SOURCE = resolve(__dirname, 'page.tsx');

function readSource(path: string): string {
  return readFileSync(path, 'utf-8');
}

/* ===================================================================
   正例 — 页面应导出的基本结构
   =================================================================== */
describe('stocktaking/[id] — 正例', () => {
  it('应导出默认函数组件 StocktakingDetailPage', () => {
    const src = readSource(SOURCE);
    assert.ok(src.includes('export default function StocktakingDetailPage'), '缺少默认导出');
  });

  it('应引用 useParams 获取路由参数 id', () => {
    const src = readSource(SOURCE);
    assert.ok(src.includes("params = useParams()"), '缺少 useParams');
    assert.ok(src.includes("params.id"), '缺少 params.id 引用');
  });

  it('应引用 useRouter 实现导航跳转', () => {
    const src = readSource(SOURCE);
    assert.ok(src.includes("useRouter"), '缺少 useRouter');
    assert.ok(src.includes("router.push"), '缺少 router.push');
  });

  it('应包含完整的状态定义 StocktakingStatus', () => {
    const src = readSource(SOURCE);
    assert.ok(src.includes("type StocktakingStatus"), '缺少 StocktakingStatus 类型');
    assert.ok(src.includes("'draft'"), '缺少 draft 状态');
    assert.ok(src.includes("'in_progress'"), '缺少 in_progress 状态');
    assert.ok(src.includes("'completed'"), '缺少 completed 状态');
    assert.ok(src.includes("'cancelled'"), '缺少 cancelled 状态');
  });

  it('应包含 StocktakingItem 商品明细接口', () => {
    const src = readSource(SOURCE);
    assert.ok(src.includes('interface StocktakingItem'), '缺少 StocktakingItem 接口');
    assert.ok(src.includes('sku'), '缺少 sku');
    assert.ok(src.includes('expectedQty'), '缺少 expectedQty');
    assert.ok(src.includes('actualQty'), '缺少 actualQty');
    assert.ok(src.includes('diff'), '缺少 diff');
    assert.ok(src.includes('remark'), '缺少 remark');
  });

  it('应包含 StocktakingDetail 盘点单详情接口', () => {
    const src = readSource(SOURCE);
    assert.ok(src.includes('interface StocktakingDetail'), '缺少 StocktakingDetail 接口');
    assert.ok(src.includes('batchNo'), '缺少 batchNo');
    assert.ok(src.includes('storeName'), '缺少 storeName');
    assert.ok(src.includes('initiator'), '缺少 initiator');
    assert.ok(src.includes('totalItems'), '缺少 totalItems');
    assert.ok(src.includes('checkedItems'), '缺少 checkedItems');
    assert.ok(src.includes('discrepancyCount'), '缺少 discrepancyCount');
    assert.ok(src.includes('items: StocktakingItem[]'), '缺少 items 数组');
  });

  it('应包含 STATUS_LABELS 状态中文映射', () => {
    const src = readSource(SOURCE);
    assert.ok(src.includes('草稿'), '缺少「草稿」');
    assert.ok(src.includes('盘点中'), '缺少「盘点中」');
    assert.ok(src.includes('已完成'), '缺少「已完成」');
    assert.ok(src.includes('已取消'), '缺少「已取消」');
  });

  it('应包含 STATUS_FLOW 状态流转定义', () => {
    const src = readSource(SOURCE);
    assert.ok(src.includes('STATUS_FLOW'), '缺少 STATUS_FLOW');
    assert.ok(src.includes("draft: ['in_progress', 'cancelled']"), 'draft 流转配置有误');
    assert.ok(src.includes("in_progress: ['completed', 'cancelled']"), 'in_progress 流转配置有误');
    assert.ok(src.includes('completed: []'), 'completed 应无可流转状态');
    assert.ok(src.includes('cancelled: []'), 'cancelled 应无可流转状态');
  });

  it('应包含 MOCK_DETAILS 模拟数据集', () => {
    const src = readSource(SOURCE);
    assert.ok(src.includes('MOCK_DETAILS'), '缺少 MOCK_DETAILS');
    assert.ok(src.includes("'st-001'"), '缺少 st-001 模拟数据');
    assert.ok(src.includes("'st-002'"), '缺少 st-002 模拟数据');
    assert.ok(src.includes("'st-003'"), '缺少 st-003 模拟数据');
  });

  it('应导入 @m5/ui 的组件', () => {
    const src = readSource(SOURCE);
    assert.ok(src.includes("from '@m5/ui'"), '缺少 @m5/ui 导入');
    assert.ok(src.includes('PageShell'), '缺少 PageShell');
    assert.ok(src.includes('StatusBadge'), '缺少 StatusBadge');
    assert.ok(src.includes('DataTable'), '缺少 DataTable');
    assert.ok(src.includes('DetailActionBar'), '缺少 DetailActionBar');
    assert.ok(src.includes('ConfirmActionDialog'), '缺少 ConfirmActionDialog');
  });

  it('应定义 ITEM_COLUMNS 表格列', () => {
    const src = readSource(SOURCE);
    assert.ok(src.includes('ITEM_COLUMNS'), '缺少 ITEM_COLUMNS');
    assert.ok(src.includes("key: 'sku'"), '缺少 sku 列');
    assert.ok(src.includes("key: 'diff'"), '缺少 diff 列');
    assert.ok(src.includes("key: 'remark'"), '缺少 remark 列');
  });

  it('应处理详情中差异数据着色（正数绿/负数红）', () => {
    const src = readSource(SOURCE);
    assert.ok(src.includes("'#059669'"), '缺少正差异绿色');
    assert.ok(src.includes("'#dc2626'"), '缺少负差异红色');
  });

  it('应实现 useMemo 计算 stats 统计信息', () => {
    const src = readSource(SOURCE);
    assert.ok(src.includes('useMemo'), '缺少 useMemo');
    assert.ok(src.includes('totalDiff'), '缺少 totalDiff 计算');
    assert.ok(src.includes('hasError'), '缺少 hasError 计算');
  });
});

/* ===================================================================
   状态流转
   =================================================================== */
describe('stocktaking/[id] — 状态流转', () => {
  it('应包含 handleStatusChange 函数', () => {
    const src = readSource(SOURCE);
    assert.ok(src.includes('handleStatusChange'), '缺少 handleStatusChange');
  });

  it('流转为 completed 时应设置 completedAt', () => {
    const src = readSource(SOURCE);
    assert.ok(src.includes("if (newStatus === 'completed')"), '缺少 completed 特殊处理');
    assert.ok(src.includes('completedAt'), '缺少 completedAt 赋值');
  });

  it('应包含 handleDelete 删除处理函数', () => {
    const src = readSource(SOURCE);
    assert.ok(src.includes('handleDelete'), '缺少 handleDelete');
    assert.ok(src.includes('已删除'), '删除消息提示');
    assert.ok(src.includes("'/stocktaking'"), '删除后跳转回列表');
  });

  it('应包含 handleEdit 编辑跳转函数', () => {
    const src = readSource(SOURCE);
    assert.ok(src.includes('handleEdit'), '缺少 handleEdit');
    assert.ok(src.includes('/edit'), '编辑路由跳转');
  });

  it('应通过 confirmAction 状态控制 ConfirmActionDialog', () => {
    const src = readSource(SOURCE);
    assert.ok(src.includes('confirmAction'), '缺少 confirmAction 状态');
    assert.ok(src.includes('ConfirmActionDialog'), '应渲染 ConfirmActionDialog');
    assert.ok(src.includes('open={confirmAction !== null}'), '弹窗可见性控制');
  });
});

/* ===================================================================
   边界场景
   =================================================================== */
describe('stocktaking/[id] — 边界场景', () => {
  it('应处理未知 ID 回退到「未找到」UI', () => {
    const src = readSource(SOURCE);
    assert.ok(src.includes('盘点单未找到'), '缺少未找到提示');
    assert.ok(src.includes("'/stocktaking'"), '回退链接');
  });

  it('completed 状态不应有可流转项', () => {
    const src = readSource(SOURCE);
    assert.ok(src.includes("completed: []"), '完成后不可流转');
  });

  it('cancelled 状态不应有可流转项', () => {
    const src = readSource(SOURCE);
    assert.ok(src.includes("cancelled: []"), '取消后不可流转');
  });

  it('应渲染 statusMessage 状态消息提示', () => {
    const src = readSource(SOURCE);
    assert.ok(src.includes('statusMessage'), '缺少 statusMessage 状态');
    assert.ok(src.includes('已更新'), '状态更新消息');
  });
});

/* ===================================================================
   防御性
   =================================================================== */
describe('stocktaking/[id] — 防御性', () => {
  it('params.id 应安全处理非字符串类型', () => {
    const src = readSource(SOURCE);
    assert.ok(src.includes("typeof params.id === 'string'"), '缺少类型保护');
  });

  it('formatDate 应处理空值', () => {
    const src = readSource(SOURCE);
    assert.ok(src.includes("if (!dateStr) return '-'"), '缺少空值保护');
  });

  it('null detail 应返回兜底 UI', () => {
    const src = readSource(SOURCE);
    assert.ok(src.includes('if (!detail)'), '缺少 null 守卫');
  });

  it('confirmAction null 时应关闭弹窗', () => {
    const src = readSource(SOURCE);
    assert.ok(src.includes('setConfirmAction(null)'), '弹窗关闭逻辑');
  });

  it('删除操作应显示 danger variant 按钮', () => {
    const src = readSource(SOURCE);
    assert.ok(src.includes("variant: 'danger'"), '危险操作标记');
  });
});

/* ===================================================================
   页面结构验证
   =================================================================== */
describe('stocktaking/[id] — 页面结构', () => {
  it('应渲染信息网格（9 项基础信息）', () => {
    const src = readSource(SOURCE);
    assert.ok(src.includes('门店名称'), '缺少门店名称');
    assert.ok(src.includes('盘点人'), '缺少盘点人');
    assert.ok(src.includes('盘点日期'), '缺少盘点日期');
    assert.ok(src.includes('完成时间'), '缺少完成时间');
    assert.ok(src.includes('盘点总数'), '缺少盘点总数');
    assert.ok(src.includes('已盘数量'), '缺少已盘数量');
    assert.ok(src.includes('差异数量'), '缺少差异数量');
    assert.ok(src.includes('差异总值'), '缺少差异总值');
    assert.ok(src.includes('差异商品'), '缺少差异商品');
  });

  it('应包含「盘点商品明细」标题', () => {
    const src = readSource(SOURCE);
    assert.ok(src.includes('盘点商品明细'), '缺少明细标题');
  });

  it('应通过 data-testid="status-message" 标识状态消息', () => {
    const src = readSource(SOURCE);
    assert.ok(src.includes('data-testid="status-message"'), '缺少测试标识');
  });

  it('应展示差异数值的着色逻辑', () => {
    const src = readSource(SOURCE);
    assert.ok(src.includes('isPositive'), '缺少正负判断');
  });
});
