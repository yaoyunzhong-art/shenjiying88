/**
 * governance-action-panel.test.ts — Governance Action Panel L1 结构测试
 *
 * 覆盖:
 * - 文件存在 & use client
 * - 所有导入模块完整性
 * - Props 接口类型定义
 * - 组件函数签名
 * - Palette 颜色常量
 * - 核心 Hooks 调用模式
 * - 渲染条件逻辑
 */
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const SOURCE = resolve(__dirname, 'governance-action-panel.tsx');

function readSource(): string {
  return readFileSync(SOURCE, 'utf-8');
}

describe('GovernanceActionPanel — 正例', () => {
  it('文件存在且非空', () => {
    const src = readSource();
    assert.ok(src.length > 0, '文件内容为空');
  });

  it('标记 use client', () => {
    const src = readSource();
    assert.ok(src.includes("'use client'"), '缺少 use client 指令');
  });

  it('导出 GovernanceActionPanel 函数组件', () => {
    const src = readSource();
    assert.ok(src.includes('export function GovernanceActionPanel('), '缺少导出函数');
  });

  it('导出 StorefrontGovernanceActionPanelProps 接口', () => {
    const src = readSource();
    assert.ok(src.includes('interface StorefrontGovernanceActionPanelProps'), '缺少 Props 接口');
  });
});

describe('GovernanceActionPanel — Props 类型', () => {
  const src = readSource();

  it('包含 marketCode: string', () => {
    assert.ok(src.includes('marketCode: string'));
  });

  it('包含 tenantCode: string', () => {
    assert.ok(src.includes('tenantCode: string'));
  });

  it('包含 brandCode: string', () => {
    assert.ok(src.includes('brandCode: string'));
  });

  it('包含 storeCode: string', () => {
    assert.ok(src.includes('storeCode: string'));
  });

  it('包含 initialGovernance: StorefrontGovernanceReadModel', () => {
    assert.ok(src.includes('initialGovernance: StorefrontGovernanceReadModel'));
  });

  it('包含可选参数: focusAlertCode', () => {
    assert.ok(src.includes('focusAlertCode?: string'));
  });

  it('包含可选参数: focusContext', () => {
    assert.ok(src.includes('focusContext?: string'));
  });

  it('包含可选参数: timelineQueryKey', () => {
    assert.ok(src.includes('timelineQueryKey?: string'));
  });

  it('包含可选参数: ownerQueryKey', () => {
    assert.ok(src.includes('ownerQueryKey?: string'));
  });

  it('包含可选参数: sourceQueryKey', () => {
    assert.ok(src.includes('sourceQueryKey?: string'));
  });

  it('包含 onFocusChange 回调', () => {
    assert.ok(src.includes('onFocusChange?: (code: string, context: string) => void'));
  });
});

describe('GovernanceActionPanel — 导入', () => {
  const src = readSource();

  it('从 next/navigation 导入路由 API', () => {
    assert.ok(src.includes('usePathname'));
    assert.ok(src.includes('useRouter'));
    assert.ok(src.includes('useSearchParams'));
  });

  it('从 react 导入 useState/useTransition/useCallback/useMemo', () => {
    assert.ok(src.includes('useCallback'));
    assert.ok(src.includes('useMemo'));
    assert.ok(src.includes('useState'));
    assert.ok(src.includes('useTransition'));
  });

  it('从 @m5/sdk 导入 clientAccess', () => {
    assert.ok(src.includes('createWebFoundationAlertPanelClientAccess'));
  });

  it('从 @m5/ui 导入 FoundationAlert 面板组件', () => {
    assert.ok(src.includes('FoundationAlertPanelOwnerSummaryReadout'));
    assert.ok(src.includes('FoundationAlertPanelSelectedAlertReadout'));
    assert.ok(src.includes('FoundationAlertPanelSummaryDigestReadout'));
    assert.ok(src.includes('FoundationAlertPanelSourceSummaryReadout'));
    assert.ok(src.includes('FoundationAlertPanelTimelineReadout'));
  });

  it('从 @m5/ui 导入 Navigation bindings', () => {
    assert.ok(src.includes('createFoundationAlertNextNavigationBindings'));
  });

  it('从 @m5/ui 导入样式函数', () => {
    assert.ok(src.includes('createFoundationAlertPanelActionButtonStyle'));
    assert.ok(src.includes('createFoundationAlertPanelFeedbackStyle'));
    assert.ok(src.includes('createFoundationAlertPanelFilterButtonStyle'));
    assert.ok(src.includes('createFoundationAlertPanelFilterChipStyle'));
    assert.ok(src.includes('createFoundationAlertPanelSectionStyle'));
    assert.ok(src.includes('createFoundationAlertPanelSelectionButtonStyle'));
    assert.ok(src.includes('createFoundationAlertPanelSummaryCardStyle'));
    assert.ok(src.includes('createFoundationAlertPanelShortcutCardStyle'));
  });

  it('从 @m5/ui 导入 Hooks', () => {
    assert.ok(src.includes('useFoundationAlertFocusSync'));
    assert.ok(src.includes('useFoundationAlertDrilldownQuery'));
    assert.ok(src.includes('useFoundationAlertGovernanceState'));
    assert.ok(src.includes('useFoundationAlertMutationController'));
    assert.ok(src.includes('useFoundationAlertTimelineQueryState'));
    assert.ok(src.includes('useFoundationAlertViewLinkController'));
  });

  it('从 @m5/types 导入工具方法', () => {
    assert.ok(src.includes('buildFoundationAlertOptimisticReadState'));
    assert.ok(src.includes('buildFoundationAlertPanelDerivedState'));
    assert.ok(src.includes('buildFoundationAlertQuickSwitchItems'));
    assert.ok(src.includes('buildFoundationAlertTimelineFilterReadState'));
    assert.ok(src.includes('filterFoundationAlertTimeline'));
    assert.ok(src.includes('isFoundationAlertTimelineFilterStateEqual'));
    assert.ok(src.includes('summarizeFoundationAlertTimelineFilters'));
  });

  it('从 market-bootstrap 导入 readModel 类型', () => {
    assert.ok(src.includes('loadStorefrontGovernanceReadModel'));
    assert.ok(src.includes('type StorefrontGovernanceReadModel'));
  });
});

describe('GovernanceActionPanel — Palette', () => {
  const src = readSource();

  it('palette 包含 sectionBackground', () => {
    assert.ok(src.includes('sectionBackground'));
    assert.ok(src.includes('rgba(15, 23, 42, 0.48)'));
  });

  it('palette 包含 accentText', () => {
    assert.ok(src.includes('accentText'));
    assert.ok(src.includes('#93c5fd'));
  });

  it('palette 包含 detailCardBorder / timelineCardBorder / summaryCardBorder', () => {
    assert.ok(src.includes('detailCardBorder'));
    assert.ok(src.includes('timelineCardBorder'));
    assert.ok(src.includes('summaryCardBorder'));
  });

  it('palette 包含 selectedQuickBorder / selectedQuickBackground', () => {
    assert.ok(src.includes('selectedQuickBorder'));
    assert.ok(src.includes('selectedQuickBackground'));
  });

  it('palette 包含 selectedButton 相关颜色', () => {
    assert.ok(src.includes('selectedButtonBorder'));
    assert.ok(src.includes('selectedButtonBackground'));
  });
});

describe('GovernanceActionPanel — 组件内部逻辑', () => {
  const src = readSource();

  it('使用 createFoundationAlertNextNavigationBindings', () => {
    assert.ok(src.includes('createFoundationAlertNextNavigationBindings'));
    assert.ok(src.includes('navigationBindings'));
  });

  it('使用 useTransition / useState 管理状态', () => {
    assert.ok(src.includes('isPending'));
    assert.ok(src.includes('startTransition'));
    assert.ok(src.includes('mutation'));
    assert.ok(src.includes('actionError'));
    assert.ok(src.includes('filterState'));
  });

  it('包含 filterState 初始值', () => {
    assert.ok(src.includes("action: 'ALL'"));
    assert.ok(src.includes("owner: 'ALL'"));
    assert.ok(src.includes("source: 'ALL'"));
  });

  it('渲染 summary section', () => {
    assert.ok(src.includes('<FoundationAlertPanelSummaryDigestReadout'));
  });

  it('渲染 timeline section', () => {
    assert.ok(src.includes('<FoundationAlertPanelTimelineReadout'));
  });

  it('渲染 owner summary', () => {
    assert.ok(src.includes('<FoundationAlertPanelOwnerSummaryReadout'));
  });

  it('渲染 source summary', () => {
    assert.ok(src.includes('<FoundationAlertPanelSourceSummaryReadout'));
  });

  it('渲染 selectedAlert 条件分支', () => {
    assert.ok(src.includes('<FoundationAlertPanelSelectedAlertReadout'));
  });

  it('渲染 quickSwitchAlerts', () => {
    assert.ok(src.includes('quickSwitchAlerts.map'), '缺少 quickSwitchAlerts.map 渲染');
  });

  it('条件渲染 activeMutation 信息', () => {
    assert.ok(src.includes('最近 mutation'));
    assert.ok(src.includes('activeMutation'));
  });

  it('条件渲染 actionError', () => {
    assert.ok(src.includes('actionError'));
    assert.ok(src.includes('#fca5a5'));
  });
});
