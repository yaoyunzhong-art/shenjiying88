/**
 * governance-linked-overview.test.ts — Governance Linked Overview L1 结构测试
 *
 * 覆盖:
 * - 文件存在 & 导入结构
 * - 两个导出组件: GovernanceLinkedOverview / GovernanceLinkedSection
 * - Props 类型定义完整性
 * - Palette / Style 常量
 * - 渲染逻辑模式
 */
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const SOURCE = resolve(__dirname, 'governance-linked-overview.tsx');

function readSource(): string {
  return readFileSync(SOURCE, 'utf-8');
}

describe('GovernanceLinkedOverview — 正例', () => {
  it('文件存在', () => {
    const src = readSource();
    assert.ok(src.length > 0, '文件内容为空');
  });

  it('标记 use client', () => {
    const src = readSource();
    assert.ok(src.includes("'use client'"), '缺少 use client 指令');
  });

  it('导出 GovernanceLinkedOverview 函数', () => {
    const src = readSource();
    assert.ok(src.includes('export function GovernanceLinkedOverview'), '缺少导出');
  });

  it('导出 GovernanceLinkedSection 函数', () => {
    const src = readSource();
    assert.ok(src.includes('export function GovernanceLinkedSection'), '缺少导出');
  });

  it('导出 GovernanceLinkedSectionProps 接口', () => {
    const src = readSource();
    assert.ok(src.includes('export interface GovernanceLinkedSectionProps'), '缺少接口导出');
  });
});

describe('GovernanceLinkedOverview — 导入', () => {
  it('从 next/navigation 导入路由 API', () => {
    const src = readSource();
    assert.ok(src.includes('usePathname'), '缺少 usePathname');
    assert.ok(src.includes('useRouter'), '缺少 useRouter');
    assert.ok(src.includes('useSearchParams'), '缺少 useSearchParams');
  });

  it('从 @m5/ui 导入面板组件与工具', () => {
    const src = readSource();
    assert.ok(src.includes('FoundationAlertLinkedOverviewSurface'), '缺少 Surface');
    assert.ok(src.includes('createFoundationAlertLinkedOverviewStats'), '缺少 Stats 工具');
    assert.ok(src.includes('FoundationAlertLinkedOverviewPanelRenderArgs'), '缺少 RenderArgs');
  });

  it('从 market-bootstrap 导入 GovernanceReadModel', () => {
    const src = readSource();
    assert.ok(src.includes('StorefrontGovernanceReadModel'), '缺少 ReadModel');
  });

  it('导入 GovernanceActionPanel 子组件', () => {
    const src = readSource();
    assert.ok(src.includes("GovernanceActionPanel"), '缺少 ActionPanel 导入');
  });
});

describe('GovernanceLinkedOverview — Props 与渲染', () => {
  it('Props 包含 cnGovernance', () => {
    const src = readSource();
    assert.ok(src.includes('cnGovernance: StorefrontGovernanceReadModel'), '缺少 cnGovernance');
  });

  it('Props 包含 usGovernance', () => {
    const src = readSource();
    assert.ok(src.includes('usGovernance: StorefrontGovernanceReadModel'), '缺少 usGovernance');
  });

  it('渲染中国门店治理区段', () => {
    const src = readSource();
    assert.ok(src.includes('中国门店治理'), '缺少中国门店治理');
  });

  it('渲染美国门店治理区段', () => {
    const src = readSource();
    assert.ok(src.includes('美国门店治理'), '缺少美国门店治理');
  });

  it('中国区段 focusQueryKey = cnAlert', () => {
    const src = readSource();
    assert.ok(src.includes("focusQueryKey=\"cnAlert\""), '缺少 cnAlert');
  });

  it('美国区段 focusQueryKey = usAlert', () => {
    const src = readSource();
    assert.ok(src.includes("focusQueryKey=\"usAlert\""), '缺少 usAlert');
  });

  it('中国区段使用 cn-mainland market', () => {
    const src = readSource();
    assert.ok(src.includes("marketCode=\"cn-mainland\""), '缺少 cn-mainland');
  });

  it('美国区段使用 us-default market', () => {
    const src = readSource();
    assert.ok(src.includes("marketCode=\"us-default\""), '缺少 us-default');
  });
});

describe('GovernanceLinkedSection — Props 定义', () => {
  it('包含 title: string', () => {
    const src = readSource();
    assert.ok(src.includes('title: string'), '缺少 title');
  });

  it('包含 description: string', () => {
    const src = readSource();
    assert.ok(src.includes('description: string'));
  });

  it('包含 governance: StorefrontGovernanceReadModel', () => {
    const src = readSource();
    assert.ok(src.includes('governance: StorefrontGovernanceReadModel'));
  });

  it('包含 focusQueryKey 可选参数', () => {
    const src = readSource();
    assert.ok(src.includes('focusQueryKey?: string'), '缺少可选 focusQueryKey');
  });

  it('包含 marketCode / tenantCode / brandCode / storeCode', () => {
    const src = readSource();
    assert.ok(src.includes('marketCode: string'));
    assert.ok(src.includes('tenantCode: string'));
    assert.ok(src.includes('brandCode: string'));
    assert.ok(src.includes('storeCode: string'));
  });
});

describe('GovernanceLinkedSection — 逻辑', () => {
  it('useMemo 获取 overviewStats', () => {
    const src = readSource();
    assert.ok(src.includes('const overviewStats = useMemo'), '缺少 overviewStats');
  });

  it('buildTopRiskMetaLines 构建责任人行', () => {
    const src = readSource();
    assert.ok(src.includes('buildTopRiskMetaLines'), '缺少 buildTopRiskMetaLines');
    assert.ok(src.includes('actorId'), '缺少 actorId');
    assert.ok(src.includes('责任人'), '缺少责任人标识');
  });

  it('renderPanel 渲染 GovernanceActionPanel', () => {
    const src = readSource();
    assert.ok(src.includes('renderPanel'), '缺少 renderPanel');
    assert.ok(src.includes('<GovernanceActionPanel'), '缺少 GovernanceActionPanel 渲染');
  });

  it('renderPanel 透传 focus 参数', () => {
    const src = readSource();
    assert.ok(src.includes('focusAlertCode'), '缺少 focusAlertCode');
    assert.ok(src.includes('focusContext'), '缺少 focusContext');
    assert.ok(src.includes('onFocusChange'), '缺少 onFocusChange');
  });
});

describe('GovernanceLinkedOverview — Palette', () => {
  it('linkedOverviewPalette 包含 accentText', () => {
    const src = readSource();
    assert.ok(src.includes('accentText'), '缺少 accentText');
    assert.ok(src.includes('#93c5fd'), '缺少 blue-300 色值');
  });

  it('linkedOverviewPalette 包含 focusBannerBackground', () => {
    const src = readSource();
    assert.ok(src.includes('focusBannerBackground'), '缺少 focusBannerBackground');
  });

  it('linkedOverviewPalette 包含 actionButtonBorder', () => {
    const src = readSource();
    assert.ok(src.includes('actionButtonBorder'), '缺少 actionButtonBorder');
  });

  it('linkedOverviewPalette 包含 riskCardBorder', () => {
    const src = readSource();
    assert.ok(src.includes('riskCardBorder'), '缺少 riskCardBorder');
  });

  it('linkedOverviewPalette 包含 catalogActiveBorder', () => {
    const src = readSource();
    assert.ok(src.includes('catalogActiveBorder'), '缺少 catalogActiveBorder');
  });
});

describe('GovernanceLinkedOverview — Styles', () => {
  it('sectionStyle 包含 borderRadius: 16', () => {
    const src = readSource();
    assert.ok(src.includes('borderRadius: 16'), '缺少 borderRadius');
  });

  it('sectionStyle 包含内边距', () => {
    const src = readSource();
    assert.ok(src.includes('padding: 18'), '缺少 padding');
  });

  it('titleTextStyle fontSize 16 fontWeight 700', () => {
    const src = readSource();
    assert.ok(src.includes('fontSize: 16'), '缺少 fontSize');
    assert.ok(src.includes('fontWeight: 700'), '缺少 fontWeight');
  });

  it('descriptionTextStyle 包含 marginTop', () => {
    const src = readSource();
    assert.ok(src.includes('marginTop: 6'), '缺少 marginTop');
  });
});
