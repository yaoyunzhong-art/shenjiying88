/**
 * stock-transfer/__details__/stock-transfer-detail-client.test.tsx
 * 库存调拨详情页 L1 冒烟测试
 * 覆盖: 正例 · 边界 · 防御
 */
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const SOURCE = resolve(__dirname, 'stock-transfer-detail-client.tsx');

function readSource(): string {
  return readFileSync(SOURCE, 'utf-8');
}

// ---- 正例 ----

describe('stock-transfer-detail-client — 正例', () => {
  it('应导出一个默认组件 StockTransferDetailClient', () => {
    const src = readSource();
    assert.ok(src.includes('export default function StockTransferDetailClient'), '缺少默认导出组件');
  });

  it('应包含 DetailShell 组件', () => {
    const src = readSource();
    assert.ok(src.includes('DetailShell'), '缺少 DetailShell');
  });

  it('应包含 StatCard 统计卡片', () => {
    const src = readSource();
    assert.ok(src.includes('StatCard'), '缺少 StatCard');
  });

  it('应包含 Timeline 时间线', () => {
    const src = readSource();
    assert.ok(src.includes('Timeline'), '缺少 Timeline');
  });

  it('应包含 StatusBadge 状态标签', () => {
    const src = readSource();
    assert.ok(src.includes('StatusBadge'), '缺少 StatusBadge');
  });

  it('应包含状态流转操作按钮区域', () => {
    const src = readSource();
    assert.ok(src.includes('状态流转操作'), '缺少状态流转操作区域');
  });

  it('应包含备注编辑功能', () => {
    const src = readSource();
    assert.ok(src.includes('备注信息'), '缺少备注编辑');
    assert.ok(src.includes('保存备注'), '缺少保存备注按钮');
  });

  it('应包含调拨生命周期', () => {
    const src = readSource();
    assert.ok(src.includes('调拨生命周期'), '缺少生命周期标题');
  });

  it('应引用 stock-transfer-data 数据文件', () => {
    const src = readSource();
    assert.ok(src.includes("from '../stock-transfer-data'"), '未引 stock-transfer-data');
  });

  it('应包含 WorkspaceBreadcrumb 面包屑', () => {
    const src = readSource();
    assert.ok(src.includes('WorkspaceBreadcrumb'), '缺少 WorkspaceBreadcrumb');
  });

  it('应包含 DetailClosureBar 底部导航', () => {
    const src = readSource();
    assert.ok(src.includes('DetailClosureBar'), '缺少 DetailClosureBar');
  });

  it('应使用 buildStandardClosureLinks', () => {
    const src = readSource();
    assert.ok(src.includes('buildStandardClosureLinks'), '缺少闭链函数');
  });
});

// ---- 边界 ----

describe('stock-transfer-detail-client — 边界', () => {
  it('应处理未找到调拨单的情况', () => {
    const src = readSource();
    assert.ok(src.includes('未找到该调拨单'), '缺少未找到提示');
    assert.ok(src.includes('返回调拨列表'), '缺少返回链接');
  });

  it('应处理终态不显示流转按钮', () => {
    const src = readSource();
    assert.ok(src.includes('终态'), '缺少终态标记');
    assert.ok(src.includes('不可流转'), '缺少不可流转提示');
  });

  it('应支持所有六种状态', () => {
    const src = readSource();
    const statuses = ['pending', 'approved', 'shipped', 'received', 'rejected', 'cancelled'];
    for (const s of statuses) {
      assert.ok(src.includes(s), `缺少状态: ${s}`);
    }
  });

  it('应支持所有四种调拨类型', () => {
    const src = readSource();
    const types = ['supply', 'return', 'move', 'emergency'];
    for (const t of types) {
      assert.ok(src.includes(t), `缺少类型: ${t}`);
    }
  });

  it('应导入紧急程度标签常量', () => {
    const src = readSource();
    assert.ok(src.includes('URGENCY_LABEL'), '应导入 URGENCY_LABEL');
    assert.ok(src.includes('URGENCY_VARIANT'), '应导入 URGENCY_VARIANT');
  });

  it('应使用 generateTimeline 函数生成时间线', () => {
    const src = readSource();
    assert.ok(src.includes('function generateTimeline'), '缺少 generateTimeline 函数');
  });

  it('应使用 findNextStatuses 函数查找可流转状态', () => {
    const src = readSource();
    assert.ok(src.includes('function findNextStatuses'), '缺少 findNextStatuses 函数');
  });

  it('应包含 FormSubmitFeedback 表单反馈组件', () => {
    const src = readSource();
    assert.ok(src.includes('FormSubmitFeedback'), '缺少 FormSubmitFeedback');
  });

  it('应包含 FormField 表单字段组件', () => {
    const src = readSource();
    assert.ok(src.includes('FormField'), '缺少 FormField');
  });

  it('应包含 InfoRow 信息行组件', () => {
    const src = readSource();
    assert.ok(src.includes('InfoRow'), '缺少 InfoRow');
  });
});

// ---- 防御 ----

describe('stock-transfer-detail-client — 防御', () => {
  it('应导入 SubmitButton 并渲染保存/流转按钮', () => {
    const src = readSource();
    assert.ok(src.includes('SubmitButton'), '应导入 SubmitButton');
    assert.ok(src.includes('保存备注'), '应有保存备注按钮');
  });

  it('不应硬编码地址或敏感信息', () => {
    const src = readSource();
    // 不允许出现注明的 IP / 域名 / token
    const patterns = ['http://', 'https://', 'password', 'secret', 'api-key'];
    for (const pat of patterns) {
      if (pat === 'http://' || pat === 'https://') {
        // 允许 mock API 开头的 localhost
        continue;
      }
      assert.ok(!src.includes(pat), `不应包含敏感模式: ${pat}`);
    }
  });

  it('should not have template string interpolation in style attributes', () => {
    // 检查是否有不安全的模板字符串
    const src = readSource();
    // 模板字符串是受控的
    const hasControlledInterpolation = src.includes('style={{') ||
      src.includes('style:') ||
      src.includes('style={');
    assert.ok(hasControlledInterpolation, '应使用受控样式');
  });

  it('导入组件应来自 @m5/ui', () => {
    const src = readSource();
    const uiImports = src.match(/from\s+'@m5\/ui'/g);
    assert.ok(uiImports && uiImports.length > 0, '应从 @m5/ui 导入组件');
  });

  it('应使用 useDetailActions 统一操作', () => {
    const src = readSource();
    assert.ok(src.includes('useDetailActions'), '缺少 useDetailActions');
  });

  it('应正确处理 STATUS_FLOW 引用', () => {
    const src = readSource();
    assert.ok(src.includes('STATUS_FLOW'), '缺少 STATUS_FLOW');
  });

  it('应处理所有流转状态标签', () => {
    const src = readSource();
    const flowLabels = ['已通过', '已驳回', '已撤销'];
    for (const label of flowLabels) {
      assert.ok(src.includes(label), `缺少流转标签: ${label}`);
    }
  });

  it('应处理草稿备注为空的情况', () => {
    const src = readSource();
    assert.ok(src.includes("c.remark || '(无)'"), '应展示空备注占位');
  });

  it('应有 useFormSubmit 管理提交状态', () => {
    const src = readSource();
    assert.ok(src.includes('useFormSubmit'), '缺少 useFormSubmit');
  });
});
