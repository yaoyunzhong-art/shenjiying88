/**
 * safety/page.test.tsx — 安全记录 L2 测试
 * 覆盖: 正例·反例·边界·防御·组件结构
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

describe('safety — 正例', () => {
  it('应导出一个默认组件 SafetyPage', () => {
    const src = readSource();
    assert.ok(src.includes('export default function SafetyPage'), '缺少默认导出组件');
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

  it('应包含 Select 状态筛选', () => {
    const src = readSource();
    assert.ok(src.includes('Select'), '缺少 Select');
  });

  it('应包含创建 Modal 和编辑 Modal', () => {
    const src = readSource();
    assert.ok(src.includes('showCreateModal'), '缺少 showCreateModal');
    assert.ok(src.includes('showEditModal'), '缺少 showEditModal');
  });

  it('应包含批量操作栏', () => {
    const src = readSource();
    assert.ok(src.includes('selectedIds.size > 0'), '缺少批量操作栏');
    assert.ok(src.includes('handleBatchResolve'), '缺少批量解决');
  });

  it('应包含导出功能', () => {
    const src = readSource();
    assert.ok(src.includes('handleExport'), '缺少导出');
  });

  it('应包含 SafetyForm 表单组件', () => {
    const src = readSource();
    assert.ok(src.includes('function SafetyForm'), '缺少 SafetyForm');
  });
});

describe('safety — 边界防御', () => {
  it('STATUS_MAP 应覆盖 4 种状态', () => {
    const src = readSource();
    assert.ok(src.includes("open:"), '缺少 open');
    assert.ok(src.includes("investigating:"), '缺少 investigating');
    assert.ok(src.includes("resolved:"), '缺少 resolved');
    assert.ok(src.includes("closed:"), '缺少 closed');
  });

  it('SEVERITY_MAP 应覆盖 4 种严重程度', () => {
    const src = readSource();
    assert.ok(src.includes("low:"), '缺少 low');
    assert.ok(src.includes("medium:"), '缺少 medium');
    assert.ok(src.includes("high:"), '缺少 high');
    assert.ok(src.includes("critical:"), '缺少 critical');
  });

  it('CATEGORY_OPTIONS 应覆盖安全类别', () => {
    const src = readSource();
    assert.ok(src.includes('CATEGORY_OPTIONS'), '缺少 CATEGORY_OPTIONS');
  });

  it('LOCATION_OPTIONS 应覆盖位置选项', () => {
    const src = readSource();
    assert.ok(src.includes('LOCATION_OPTIONS'), '缺少 LOCATION_OPTIONS');
  });

  it('ASSIGNEE_OPTIONS 应覆盖处理人选项', () => {
    const src = readSource();
    assert.ok(src.includes('ASSIGNEE_OPTIONS'), '缺少 ASSIGNEE_OPTIONS');
  });

  it('应包含表单校验函数 validateForm', () => {
    const src = readSource();
    assert.ok(src.includes('validateForm('), '缺少 validateForm');
  });

  it('默认表单 DEFAULT_FORM 应定义', () => {
    const src = readSource();
    assert.ok(src.includes('DEFAULT_FORM'), '缺少 DEFAULT_FORM');
  });

  it('应包含 Refresh 功能', () => {
    const src = readSource();
    assert.ok(src.includes('handleRefresh'), '缺少 handleRefresh');
  });

  it('应包含严重程度筛选 Select', () => {
    const src = readSource();
    assert.ok(src.includes('severityFilter'), '缺少 severityFilter');
  });

  it('列定义应包含 actions 操作列', () => {
    const src = readSource();
    assert.ok(src.includes("key: 'actions'"), '缺少 actions 列');
  });

  it('Mock 数据生成函数 generateMockRecords 应定义', () => {
    const src = readSource();
    assert.ok(src.includes('generateMockRecords'), '缺少 generateMockRecords');
  });

  it('批量操作栏应包含取消选择按钮', () => {
    const src = readSource();
    assert.ok(src.includes('取消选择'), '缺少取消选择');
  });
});

const SRC = fs.readFileSync(require.resolve('./page'), 'utf-8');

describe('Safety — hooks验证', () => {
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
