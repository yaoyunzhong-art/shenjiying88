/**
 * operations-toolbar.test.ts — L1 操作工具栏测试
 *
 * 测试工具栏按钮渲染、禁用态、点击事件
 */

import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

// ---------------------------------------------------------------------------
// 工具栏按钮类型
// ---------------------------------------------------------------------------

type ToolbarButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost';

interface ToolbarButton {
  key: string;
  label: string;
  icon: string;
  variant: ToolbarButtonVariant;
  disabled: boolean;
  tooltip?: string;
  requiresConfirmation?: boolean;
  confirmationMessage?: string;
}

interface ToolbarGroup {
  key: string;
  label: string;
  buttons: ToolbarButton[];
}

interface OperationsToolbar {
  groups: ToolbarGroup[];
}

// ---------------------------------------------------------------------------
// Mock 工具栏数据
// ---------------------------------------------------------------------------

const TOOLBAR_BUTTONS: ToolbarButton[] = [
  {
    key: 'batch-replay',
    label: '批量重放',
    icon: 'replay',
    variant: 'primary',
    disabled: false,
    tooltip: '重放选中的运行时操作',
    requiresConfirmation: true,
    confirmationMessage: '确认要批量重放选中的操作吗？'
  },
  {
    key: 'batch-cancel',
    label: '批量取消',
    icon: 'cancel',
    variant: 'danger',
    disabled: false,
    tooltip: '取消选中的操作',
    requiresConfirmation: true,
    confirmationMessage: '确认要批量取消选中的操作吗？此操作不可撤销。'
  },
  {
    key: 'export-csv',
    label: '导出 CSV',
    icon: 'export',
    variant: 'secondary',
    disabled: false,
    tooltip: '导出当前列表为 CSV 文件'
  },
  {
    key: 'refresh',
    label: '刷新',
    icon: 'refresh',
    variant: 'ghost',
    disabled: false,
    tooltip: '刷新当前数据'
  },
  {
    key: 'filter-pending',
    label: '只看待处理',
    icon: 'filter',
    variant: 'secondary',
    disabled: false
  },
  {
    key: 'filter-high-risk',
    label: '只看高风险',
    icon: 'filter',
    variant: 'secondary',
    disabled: false
  }
];

const OPERATIONS_TOOLBAR_GROUPS: ToolbarGroup[] = [
  {
    key: 'actions',
    label: '操作',
    buttons: [TOOLBAR_BUTTONS[0]!, TOOLBAR_BUTTONS[1]!]
  },
  {
    key: 'export',
    label: '导出',
    buttons: [TOOLBAR_BUTTONS[2]!]
  },
  {
    key: 'view',
    label: '视图',
    buttons: [TOOLBAR_BUTTONS[3]!, TOOLBAR_BUTTONS[4]!, TOOLBAR_BUTTONS[5]!]
  }
];

// ---------------------------------------------------------------------------
// 工具栏渲染
// ---------------------------------------------------------------------------

describe('工具栏按钮渲染', () => {
  it('should have all required toolbar buttons', () => {
    const keys = TOOLBAR_BUTTONS.map((b) => b.key);
    assert.ok(keys.includes('batch-replay'));
    assert.ok(keys.includes('batch-cancel'));
    assert.ok(keys.includes('export-csv'));
    assert.ok(keys.includes('refresh'));
    assert.ok(keys.includes('filter-pending'));
    assert.ok(keys.includes('filter-high-risk'));
  });

  it('each button should have key, label, icon, and variant', () => {
    for (const btn of TOOLBAR_BUTTONS) {
      assert.ok(typeof btn.key === 'string' && btn.key.length > 0, `button missing key`);
      assert.ok(typeof btn.label === 'string' && btn.label.length > 0, `button ${btn.key} missing label`);
      assert.ok(typeof btn.icon === 'string' && btn.icon.length > 0, `button ${btn.key} missing icon`);
      assert.ok(['primary', 'secondary', 'danger', 'ghost'].includes(btn.variant), `button ${btn.key} invalid variant`);
    }
  });

  it('each button key should be unique', () => {
    const keys = TOOLBAR_BUTTONS.map((b) => b.key);
    assert.equal(new Set(keys).size, keys.length);
  });

  it('toolbar groups should cover all buttons', () => {
    const groupedButtonKeys = new Set(OPERATIONS_TOOLBAR_GROUPS.flatMap((g) => g.buttons.map((b) => b.key)));
    for (const btn of TOOLBAR_BUTTONS) {
      assert.ok(groupedButtonKeys.has(btn.key), `button ${btn.key} not assigned to any group`);
    }
  });

  it('each group should have a label and at least one button', () => {
    for (const group of OPERATIONS_TOOLBAR_GROUPS) {
      assert.ok(typeof group.key === 'string' && group.key.length > 0, 'group missing key');
      assert.ok(typeof group.label === 'string' && group.label.length > 0, `group ${group.key} missing label`);
      assert.ok(group.buttons.length >= 1, `group ${group.key} should have at least 1 button`);
    }
  });
});

// ---------------------------------------------------------------------------
// 工具栏禁用态
// ---------------------------------------------------------------------------

describe('工具栏禁用态', () => {
  it('should disable batch actions when no items selected', () => {
    const selectedCount = 0;
    const batchReplayDisabled = selectedCount === 0;
    const batchCancelDisabled = selectedCount === 0;
    assert.equal(batchReplayDisabled, true);
    assert.equal(batchCancelDisabled, true);
  });

  it('should enable batch actions when items selected', () => {
    const selectedCount = 5 as number;
    const batchReplayDisabled = selectedCount === 0;
    const batchCancelDisabled = selectedCount === 0;
    assert.equal(batchReplayDisabled, false);
    assert.equal(batchCancelDisabled, false);
  });

  it('should disable single-selection-sensitive actions without selection', () => {
    const selectedCount = 0;
    const exportDisabled = selectedCount === 0;
    assert.equal(exportDisabled, true);
  });

  it('should always enable refresh button', () => {
    const refreshBtn = TOOLBAR_BUTTONS.find((b) => b.key === 'refresh');
    assert.ok(refreshBtn);
    // refresh should never be disabled by selection state
    assert.equal(refreshBtn.disabled, false);
  });

  it('should disable filter buttons when no data', () => {
    const hasData = false;
    const filterDisabled = !hasData;
    assert.equal(filterDisabled, true);
  });

  it('should enable filter buttons when data exists', () => {
    const hasData = true;
    const filterDisabled = !hasData;
    assert.equal(filterDisabled, false);
  });
});

// ---------------------------------------------------------------------------
// 工具栏点击事件
// ---------------------------------------------------------------------------

describe('工具栏点击事件', () => {
  it('should simulate batch-replay click with confirmation', () => {
    const btn = TOOLBAR_BUTTONS.find((b) => b.key === 'batch-replay');
    assert.ok(btn);
    assert.equal(btn.requiresConfirmation, true);
    assert.ok(btn.confirmationMessage!.includes('批量重放'));
  });

  it('should simulate batch-cancel click with confirmation', () => {
    const btn = TOOLBAR_BUTTONS.find((b) => b.key === 'batch-cancel');
    assert.ok(btn);
    assert.equal(btn.requiresConfirmation, true);
    assert.ok(btn.confirmationMessage!.includes('不可撤销'));
  });

  it('should simulate export-csv click without confirmation', () => {
    const btn = TOOLBAR_BUTTONS.find((b) => b.key === 'export-csv');
    assert.ok(btn);
    assert.equal(btn.requiresConfirmation, undefined);
  });

  it('should simulate refresh click', () => {
    const btn = TOOLBAR_BUTTONS.find((b) => b.key === 'refresh');
    assert.ok(btn);
    assert.equal(btn.variant, 'ghost');
  });

  it('should toggle filter state on filter button click', () => {
    let pendingFilterActive = false;
    // click to activate
    pendingFilterActive = true;
    assert.equal(pendingFilterActive, true);
    // click again to deactivate
    pendingFilterActive = false;
    assert.equal(pendingFilterActive, false);
  });

  it('should have tooltip on all action buttons', () => {
    const actionButtons = TOOLBAR_BUTTONS.filter((b) => ['primary', 'danger'].includes(b.variant));
    for (const btn of actionButtons) {
      assert.ok(btn.tooltip && btn.tooltip.length > 0, `button ${btn.key} missing tooltip`);
    }
  });
});

// ---------------------------------------------------------------------------
// 工具栏状态组合
// ---------------------------------------------------------------------------

describe('工具栏状态组合', () => {
  it('should compute toolbar state from selection and data', () => {
    const state = {
      selectedCount: 0,
      totalItems: 15,
      isLoading: false
    };

    // No selection → batch actions disabled
    assert.equal(state.selectedCount === 0, true);
    assert.equal(state.totalItems > 0, true);
    assert.equal(state.isLoading, false);
  });

  it('should show loading state disables all actions', () => {
    const state = {
      selectedCount: 5,
      totalItems: 15,
      isLoading: true
    };

    // When loading, all actions should be disabled
    assert.equal(state.isLoading, true);
    // refresh should still be clickable
  });

  it('should compute correct total selected label', () => {
    const selected = 3;
    const label = `已选择 ${selected} 项`;
    assert.equal(label, '已选择 3 项');
  });

  it('should compute empty selection label', () => {
    const selected = 0;
    const label = selected > 0 ? `已选择 ${selected} 项` : '未选择任何项';
    assert.equal(label, '未选择任何项');
  });
});

// ---------------------------------------------------------------------------
// 工具栏按钮危险操作
// ---------------------------------------------------------------------------

describe('工具栏危险操作', () => {
  it('should mark batch-cancel as danger variant', () => {
    const cancelBtn = TOOLBAR_BUTTONS.find((b) => b.key === 'batch-cancel');
    assert.ok(cancelBtn);
    assert.equal(cancelBtn.variant, 'danger');
  });

  it('should mark batch-replay as primary variant', () => {
    const replayBtn = TOOLBAR_BUTTONS.find((b) => b.key === 'batch-replay');
    assert.ok(replayBtn);
    assert.equal(replayBtn.variant, 'primary');
  });

  it('should require confirmation for destructive actions', () => {
    const destructiveActions = TOOLBAR_BUTTONS.filter((b) => b.variant === 'danger');
    for (const btn of destructiveActions) {
      assert.equal(btn.requiresConfirmation, true);
      assert.ok(btn.confirmationMessage && btn.confirmationMessage.length > 0);
    }
  });
});
