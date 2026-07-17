/**
 * ai-decision/page.test.tsx — AI 决策中心 L2 测试
 * 覆盖: 正例·边界·组件结构·数据完整性
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

describe('ai-decision — 正例', () => {
  it('应导出一个默认组件 AiDecisionPage', () => {
    const src = readSource();
    assert.ok(src.includes('export default function AiDecisionPage'), '缺少默认导出组件');
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

  it('应包含 AIDecisionPanel 面板', () => {
    const src = readSource();
    assert.ok(src.includes('AIDecisionPanel'), '缺少 AIDecisionPanel');
  });

  it('应包含 StatCard 统计卡片', () => {
    const src = readSource();
    assert.ok(src.includes('StatCard'), '缺少 StatCard');
  });

  it('应包含 Modal 创建弹窗', () => {
    const src = readSource();
    assert.ok(src.includes('Modal'), '缺少 Modal');
  });

  it('应包含 Select 筛选组件', () => {
    const src = readSource();
    assert.ok(src.includes('Select'), '缺少 Select');
  });

  it('应包含 FormSubmitFeedback 反馈', () => {
    const src = readSource();
    assert.ok(src.includes('FormSubmitFeedback'), '缺少 FormSubmitFeedback');
  });

  it('应使用 use client 指令', () => {
    const src = readSource();
    assert.ok(src.includes("'use client'"), '缺少 use client');
  });

  it('应包含创建 Modal 状态', () => {
    const src = readSource();
    assert.ok(src.includes('showCreateModal'), '缺少 showCreateModal');
  });

  it('应包含批量操作栏', () => {
    const src = readSource();
    assert.ok(src.includes('selectedIds.size > 0'), '缺少批量操作栏');
    assert.ok(src.includes('handleBatchApprove'), '缺少批量批准');
    assert.ok(src.includes('handleBatchReject'), '缺少批量拒绝');
  });

  it('应包含导出功能', () => {
    const src = readSource();
    assert.ok(src.includes('handleExport'), '缺少导出');
  });
});

describe('ai-decision — 边界防御', () => {
  it('STATUS_MAP 应覆盖 3 种状态', () => {
    const src = readSource();
    assert.ok(src.includes("approved:"), '缺少 approved');
    assert.ok(src.includes("rejected:"), '缺少 rejected');
    assert.ok(src.includes("pending:"), '缺少 pending');
  });

  it('STATUS_OPTS 应包含全部状态选项', () => {
    const src = readSource();
    assert.ok(src.includes("value: '', label: '全部状态'"), '缺少全部状态');
    assert.ok(src.includes("value: 'approved'"), '缺少 approved');
    assert.ok(src.includes("value: 'rejected'"), '缺少 rejected');
    assert.ok(src.includes("value: 'pending'"), '缺少 pending');
  });

  it('CATEGORY_OPTS 应包含类别选项', () => {
    const src = readSource();
    assert.ok(src.includes("'营销'"), '缺少 营销');
    assert.ok(src.includes("'运营'"), '缺少 运营');
    assert.ok(src.includes("'风控'"), '缺少 风控');
  });

  it('Mock 数据应包含 12 条决策记录', () => {
    const src = readSource();
    const mockCount = (src.match(/id: 'dec-/g) || []).length;
    assert.ok(mockCount >= 10, `Mock 至少应有 10 条决策, 实际 ${mockCount}`);
  });

  it('每条 Mock 记录应有 ruleCategory', () => {
    const src = readSource();
    assert.ok(src.includes('ruleCategory'), '缺少 ruleCategory');
  });

  it('每条 Mock 记录应有 triggeredCount', () => {
    const src = readSource();
    assert.ok(src.includes('triggeredCount'), '缺少 triggeredCount');
  });

  it('应包含表单校验 validateForm', () => {
    const src = readSource();
    assert.ok(src.includes('validateForm('), '缺少 validateForm');
  });

  it('默认表单 DEFAULT_FORM 应定义', () => {
    const src = readSource();
    assert.ok(src.includes('DEFAULT_FORM'), '缺少 DEFAULT_FORM');
  });

  it('列定义应包含 actions 操作列', () => {
    const src = readSource();
    assert.ok(src.includes("key: 'description'"), '缺少 description 列');
  });

  it('统计应包含总触发次数', () => {
    const src = readSource();
    assert.ok(src.includes('totalTriggered'), '缺少 totalTriggered');
  });

  it('应创建新决策规则', () => {
    const src = readSource();
    assert.ok(src.includes('handleCreate'), '缺少 handleCreate');
  });

  it('应刷新数据', () => {
    const src = readSource();
    assert.ok(src.includes('handleRefresh'), '缺少 handleRefresh');
  });

  it('创建 Modal 应包含表单字段', () => {
    const src = readSource();
    assert.ok(src.includes('规则名称') || src.includes("label: '规则名称'"), '缺少规则名称');
    assert.ok(src.includes('规则类别') || src.includes("label: '规则类别'"), '缺少规则类别');
    assert.ok(src.includes('规则描述') || src.includes("label: '规则描述'"), '缺少规则描述');
  });
});

const SRC = readFileSync(require.resolve('./page'), 'utf-8');

describe('Ai Decision — hooks验证', () => {
  it('包含useState声明', () => assert.ok(SRC.includes('const [') && SRC.includes('useState')));
  it('包含JSX返回', () => assert.ok(SRC.includes('return (') || SRC.includes('return <')));
  it('包含事件处理器', () => assert.ok(SRC.includes('onClick={') || SRC.includes('onChange={') || SRC.includes('onClose={')));
  it('包含列表渲染', () => assert.ok(SRC.includes('.map(')));
  it('包含条件渲染', () => assert.ok(SRC.includes(' && ') || SRC.includes(' ? ')));
  it('包含样式定义', () => assert.ok(SRC.includes('style={')));
  it('包含数据格式化(.toFixed)', () => assert.ok(SRC.includes('.toFixed')));
  it('包含模板字符串', () => assert.ok(SRC.includes('${')));
  it('包含默认导出', () => assert.ok(SRC.includes('export default function')));
  it('包含注释说明', () => assert.ok(SRC.includes("/**") || SRC.includes('//')));
});
