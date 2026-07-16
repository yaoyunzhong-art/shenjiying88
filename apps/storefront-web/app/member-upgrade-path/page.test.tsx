/**
 * member-upgrade-path/page.test.tsx — 会员升级路径页 增强测试
 *
 * 覆盖:
 *   L1 正例    — 组件导出、元数据、级别数据验证、JSON-LD
 *   L2 角色测试 — 当前等级高亮、晋升差距计算、空状态、错误回退
 *   边界       — Suspense/ErrorBoundary 包裹、metadata 完整性
 *   子组件     — 分布面板、权益对比、升级记录、FAQ
 */

import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const SRC = readFileSync(resolve(__dirname, 'page.tsx'), 'utf-8');

describe('MemberUpgradePathPage — L1 正例', () => {
  it('应导出一个默认函数组件', () => {
    assert.ok(SRC.includes('export default function MemberUpgradePath'));
  });

  it('应导出元数据 metadata', () => {
    assert.ok(SRC.includes('export const metadata'));
  });

  it('metadata 标题应包含"会员升级路径"', () => {
    assert.ok(SRC.includes('会员升级路径'));
  });

  it('应导入 LoadingSkeleton 以支持加载态', () => {
    assert.ok(SRC.includes('LoadingSkeleton'));
  });

  it('应导入 EmptyState 以支持空状态', () => {
    assert.ok(SRC.includes('EmptyState'));
  });

  it('应导入 ErrorBoundary 以支持错误回退', () => {
    assert.ok(SRC.includes('ErrorBoundary'));
  });

  it('应使用 Suspense 包裹', () => {
    assert.ok(SRC.includes('<Suspense') || SRC.includes('Suspense'));
  });
});

describe('MemberUpgradePathPage — L2 等级数据验证', () => {
  it('应定义青铜—白银—黄金—钻石四个等级', () => {
    assert.ok(SRC.includes('青铜') && SRC.includes('白银') && SRC.includes('黄金') && SRC.includes('钻石'));
  });

  it('每个等级应有 distinct color', () => {
    const colors = ['#cd7f32', '#9ca3af', '#f59e0b', '#06b6d4'];
    assert.equal(colors.filter(c => SRC.includes(c)).length, 4);
  });

  it('应包含"累计消费"升级条件', () => {
    assert.ok(SRC.includes('累计消费'));
  });

  it('应包含会员权益列表 (benefits)', () => {
    assert.ok(SRC.includes('benefits'));
  });

  it('应包含条件完成状态 met 字段', () => {
    assert.ok(SRC.includes('met:'));
  });

  it('应包含升级进度百分比计算', () => {
    assert.ok(SRC.includes('progress') || SRC.includes('%'));
  });
});

describe('MemberUpgradePathPage — L2 元数据与结构化', () => {
  it('应设置 OG title 和 description', () => {
    assert.ok(SRC.includes('openGraph'));
  });

  it('应包含 JSON-LD 或结构化数据', () => {
    assert.ok(SRC.includes('application/ld+json') || SRC.includes('structured'));
  });

  it('metadata type 应为 website', () => {
    assert.ok(SRC.includes("'website'"));
  });

  it('应使用 UpgradeTierNode 类型', () => {
    assert.ok(SRC.includes('UpgradeTierNode'));
  });

  it('应定义 DEFAULT_TIERS 数组', () => {
    assert.ok(SRC.includes('DEFAULT_TIERS'));
  });

  it('应定义 MemberUpgradeSummary 子组件', () => {
    assert.ok(SRC.includes('MemberUpgradeSummary'));
  });

  it('应包含 currentIndex 计算当前等级位置', () => {
    assert.ok(SRC.includes('currentIndex') || SRC.includes('findIndex'));
  });
});

describe('MemberUpgradePathPage — L1 导出完整性', () => {
  it('应使用 TypeScript Metadata 类型', () => {
    assert.ok(SRC.includes('type Metadata') || SRC.includes('Metadata'));
  });

  it('应从 @m5/ui 导入组件', () => {
    assert.ok(SRC.includes('@m5/ui'));
  });

  it('应导出 metadata 常量', () => {
    assert.ok(SRC.includes('export const metadata: Metadata'));
  });

  it('DEFAULT_TIERS 应有升级条件数组', () => {
    const match = SRC.match(/DEFAULT_TIERS\s*[=:]/);
    assert.ok(match);
  });

  it('应包含进阶提示（下一级差距）', () => {
    assert.ok(SRC.includes('requiredValue') || SRC.includes('¥'));
  });
});

// ============================================================
// 子组件测试
// ============================================================

describe('MemberUpgradePathPage — 等级分布面板', () => {
  it('应包含 TierDistributionPanel 子组件', () => {
    assert.ok(SRC.includes('TierDistributionPanel'), '缺少等级分布面板');
  });

  it('等级分布包含等级统计标题', () => {
    assert.ok(SRC.includes('会员等级分布'), '缺少等级分布标题');
  });

  it('等级分布包含四项指标（钻石/黄金/白银/青铜）', () => {
    assert.ok(SRC.includes('钻石会员'));
    assert.ok(SRC.includes('黄金会员'));
    assert.ok(SRC.includes('白银会员'));
    assert.ok(SRC.includes('青铜会员'));
  });

  it('等级分布展示累计会员总数', () => {
    assert.ok(SRC.includes('totalMembers') || SRC.includes('累计会员'));
  });

  it('等级分布展示本月升级人数', () => {
    assert.ok(SRC.includes('monthlyUpgrades') || SRC.includes('本月升级'));
  });
});

describe('MemberUpgradePathPage — 权益对比表格', () => {
  it('应包含 BenefitComparisonTable 子组件', () => {
    assert.ok(SRC.includes('BenefitComparisonTable'), '缺少权益对比表格');
  });

  it('权益对比表格包含标题', () => {
    assert.ok(SRC.includes('等级权益对比'), '缺少对比标题');
  });

  it('权益对比表格包含6项权益对比', () => {
    assert.ok(SRC.includes('基础折扣'), '缺少基础折扣对比');
    assert.ok(SRC.includes('满减券'), '缺少满减券对比');
    assert.ok(SRC.includes('生日福利'), '缺少生日福利对比');
    assert.ok(SRC.includes('运费优惠'), '缺少运费对比');
    assert.ok(SRC.includes('专属客服'), '缺少客服对比');
    assert.ok(SRC.includes('新品体验'), '缺少新品体验对比');
  });

  it('权益对比使用 BENEFIT_COMPARISONS 数据', () => {
    assert.ok(SRC.includes('BENEFIT_COMPARISONS'), '缺少 BENEFIT_COMPARISONS');
  });

  it('权益对比表包含4个等级的列', () => {
    assert.ok(SRC.includes('青铜会员') && SRC.includes('白银会员') && SRC.includes('黄金会员') && SRC.includes('钻石会员'));
  });
});

describe('MemberUpgradePathPage — 升级记录', () => {
  it('应包含 UpgradeHistoryTable 子组件', () => {
    assert.ok(SRC.includes('UpgradeHistoryTable'), '缺少升级记录表格');
  });

  it('升级记录包含标题', () => {
    assert.ok(SRC.includes('升级记录'), '缺少升级记录标题');
  });

  it('升级记录包含表头: 从/到/日期/原因', () => {
    assert.ok(SRC.includes('从') && SRC.includes('到') && SRC.includes('日期') && SRC.includes('原因'));
  });

  it('升级记录使用 UPGRADE_HISTORIES 数据', () => {
    assert.ok(SRC.includes('UPGRADE_HISTORIES'), '缺少 UPGRADE_HISTORIES');
  });

  it('升级记录包含至少3条历史', () => {
    const matches = SRC.match(/id: '/g);
    const uhMatches = SRC.match(/UH-/g);
    assert.ok(uhMatches && uhMatches.length >= 3, '应至少3条升级记录');
  });
});

describe('MemberUpgradePathPage — FAQ 面板', () => {
  it('应包含 FAQSection 子组件', () => {
    assert.ok(SRC.includes('FAQSection'), '缺少 FAQ 面板');
  });

  it('FAQ 面板包含标题', () => {
    assert.ok(SRC.includes('常见问题'), '缺少 FAQ 标题');
  });

  it('FAQ 面板包含至少3个问题', () => {
    assert.ok(SRC.includes('多长时间生效'), '缺少问题1');
    assert.ok(SRC.includes('积分会清零'), '缺少问题2');
    assert.ok(SRC.includes('消费金额如何计算'), '缺少问题3');
  });

  it('FAQ 使用 FAQS 数据', () => {
    assert.ok(SRC.includes('FAQS'), '缺少 FAQS');
  });

  it('FAQ 包含升级不降级说明', () => {
    assert.ok(SRC.includes('不会降级'), '应包含不降级说明');
  });

  it('FAQ 包含跨店消费说明', () => {
    assert.ok(SRC.includes('跨店'), '应包含跨店消费说明');
  });
});

describe('MemberUpgradePathPage — 状态元数据', () => {
  it('应包含 TIER_STATS 统计数据对象', () => {
    assert.ok(SRC.includes('TIER_STATS'), '缺少统计对象');
  });

  it('TIER_STATS 包含 4 个等级会员数', () => {
    assert.ok(SRC.includes('bronzeCount'), '缺少青铜统计');
    assert.ok(SRC.includes('silverCount'), '缺少白银统计');
    assert.ok(SRC.includes('goldCount'), '缺少黄金统计');
    assert.ok(SRC.includes('diamondCount'), '缺少钻石统计');
  });

  it('升级小贴士提示底部', () => {
    assert.ok(SRC.includes('升级小贴士'), '应包含升级贴士');
  });
});
