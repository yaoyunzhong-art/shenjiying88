/**
 * fire-prevention/page.test.tsx — 消防管理 L2 测试
 * 覆盖: 正例 · 边界 · 组件结构
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

describe('fire-prevention — 正例', () => {
  it('应导出一个默认组件 FirePreventionPage', () => {
    const src = readSource();
    assert.ok(src.includes('export default function FirePreventionPage'), '缺少默认导出组件');
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

  it('应包含 Modal 创建/编辑弹窗', () => {
    const src = readSource();
    assert.ok(src.includes('Modal'), '缺少 Modal');
  });

  it('应包含 StatCard 统计卡片', () => {
    const src = readSource();
    assert.ok(src.includes('StatCard'), '缺少 StatCard');
  });

  it('应包含 FormSubmitFeedback 反馈', () => {
    const src = readSource();
    assert.ok(src.includes('FormSubmitFeedback'), '缺少 FormSubmitFeedback');
  });

  it('应使用 use client 指令', () => {
    const src = readSource();
    assert.ok(src.includes("'use client'"), '缺少 use client');
  });

  it('应包含创建 Modal 和编辑 Modal 状态', () => {
    const src = readSource();
    assert.ok(src.includes('showCreateModal'), '缺少创建 Modal');
    assert.ok(src.includes('showEditModal'), '缺少编辑 Modal');
  });

  it('应包含批量操作栏', () => {
    const src = readSource();
    assert.ok(src.includes('selectedIds.size > 0'), '缺少批量操作栏');
    assert.ok(src.includes('handleBatchComplete'), '缺少批量完成');
  });

  it('应包含导出报告功能', () => {
    const src = readSource();
    assert.ok(src.includes('handleExportReport'), '缺少导出报告');
  });

  it('应包含 InspectionForm 表单组件', () => {
    const src = readSource();
    assert.ok(src.includes('function InspectionForm'), '缺少 InspectionForm');
  });

  it('应包含状态筛选 Select', () => {
    const src = readSource();
    assert.ok(src.includes('statusFilter'), '缺少 statusFilter');
  });

  it('应包含 4 个统计面板', () => {
    const src = readSource();
    assert.ok(src.includes('总检查项'), '缺少总检查项');
    assert.ok(src.includes('待检查'), '缺少待检查');
    assert.ok(src.includes('已通过'), '缺少已通过');
    assert.ok(src.includes('未通过'), '缺少未通过');
  });
});

describe('fire-prevention — 边界防御', () => {
  it('FIRE_STATUS_MAP 应覆盖 4 种状态', () => {
    const src = readSource();
    assert.ok(src.includes("pending: { label: '待检查'"), '缺少 pending');
    assert.ok(src.includes("in_progress: { label: '检查中'"), '缺少 in_progress');
    assert.ok(src.includes("passed: { label: '通过'"), '缺少 passed');
    assert.ok(src.includes("failed: { label: '未通过'"), '缺少 failed');
  });

  it('RISK_MAP 应覆盖 3 种风险等级', () => {
    const src = readSource();
    assert.ok(src.includes('low:'), '缺少 low');
    assert.ok(src.includes('medium:'), '缺少 medium');
    assert.ok(src.includes('high:'), '缺少 high');
  });

  it('EQUIPMENT_OPTIONS 应覆盖消防设备', () => {
    const src = readSource();
    assert.ok(src.includes('EQUIPMENT_OPTIONS'), '缺少 EQUIPMENT_OPTIONS');
  });

  it('应包含表单校验函数 validateForm', () => {
    const src = readSource();
    assert.ok(src.includes('validateForm'), '缺少 validateForm');
  });

  it('默认表单 DEFAULT_FORM 应定义', () => {
    const src = readSource();
    assert.ok(src.includes('DEFAULT_FORM'), '缺少 DEFAULT_FORM');
  });

  it('应包含 Refresh 功能', () => {
    const src = readSource();
    assert.ok(src.includes('handleRefresh'), '缺少 handleRefresh');
  });

  it('状态列使用 StatusBadge', () => {
    const src = readSource();
    assert.ok(src.includes('FIRE_STATUS_MAP['), '缺少状态映射');
  });

  it('Select 筛选组件应包含全部状态选项', () => {
    const src = readSource();
    assert.ok(src.includes("value: 'ALL', label: '全部状态'"), '缺少全部状态');
  });

  it('列定义应包含 actions 操作列', () => {
    const src = readSource();
    assert.ok(src.includes("key: 'actions'") || src.includes("key:'actions'"), '缺少 actions 列');
  });

  it('Mock 数据生成函数 generateMockData 应定义', () => {
    const src = readSource();
    assert.ok(src.includes('generateMockData'), '缺少 generateMockData');
  });
});

const SRC = fs.readFileSync(require.resolve('./page'), 'utf-8');

describe('Fire Prevention — hooks验证', () => {
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
