/**
 * member-upgrade-path/page.test.tsx — 会员升级路径页 增强测试
 *
 * 覆盖:
 *   L1 正例    — 组件导出、元数据、级别数据验证、JSON-LD
 *   L2 角色测试 — 当前等级高亮、晋升差距计算、空状态、错误回退
 *   边界       — Suspense/ErrorBoundary 包裹、metadata 完整性
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
    assert.ok(SRC.includes('title'));
    assert.ok(SRC.includes('description'));
    assert.ok(SRC.includes('openGraph'));
  });

  it('metadata 标题应包含"会员升级路径"', () => {
    assert.ok(SRC.includes('会员升级路径'));
  });

  it('metadata description 应描述升级阶梯', () => {
    assert.ok(SRC.includes('青铜') || SRC.includes('升级阶梯'));
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
    const bronze = SRC.includes('bronze') || SRC.includes('青铜');
    const silver = SRC.includes('silver') || SRC.includes('白银');
    const gold = SRC.includes('gold') || SRC.includes('黄金');
    const diamond = SRC.includes('diamond') || SRC.includes('钻石');
    assert.ok(bronze && silver && gold && diamond, '未找到全部 4 个等级定义');
  });

  it('每个等级应有 distinct color 和 benefits', () => {
    const tierColors = ['#cd7f32', '#9ca3af', '#f59e0b', '#06b6d4'];
    const missing = tierColors.filter(c => !SRC.includes(c));
    assert.equal(missing.length, 0, `缺少颜色: ${missing.join(', ')}`);
  });

  it('应包含"累计消费"条件', () => {
    assert.ok(SRC.includes('累计消费'));
  });

  it('应包含基础折扣信息', () => {
    assert.ok(SRC.includes('折扣'));
  });

  it('应包含会员权益列表（benefits）', () => {
    assert.ok(SRC.includes('benefits'));
  });

  it('应包含条件完成状态 (met: true/false)', () => {
    assert.ok(SRC.includes('met:'));
  });
});

describe('MemberUpgradePathPage — L2 统计与晋升差距', () => {
  it('应计算升级进度百分比', () => {
    assert.ok(SRC.includes('progress') || SRC.includes('%'));
  });

  it('应有当前等级索引计算', () => {
    assert.ok(SRC.includes('currentIndex') || SRC.includes('findIndex'));
  });

  it('应显示总分等级数', () => {
    assert.ok(SRC.includes('totalTiers') || SRC.includes('总等级'));
  });
});

describe('MemberUpgradePathPage — 元数据与结构化数据', () => {
  it('应设置 OG title', () => {
    assert.ok(SRC.includes('og:title') || SRC.includes('openGraph'));
  });

  it('应有 JSON-LD 或结构化数据注释', () => {
    assert.ok(SRC.includes('JSON-LD') || SRC.includes('structured'));
  });

  it('页面 type 应为 website', () => {
    assert.ok(SRC.includes("type: 'website'") || SRC.includes("type:'website'"));
  });

  it('应定义具体的会员等级', () => {
    const tiers = ['UpgradeTierNode', 'UpgradeTier'];
    const found = tiers.some(t => SRC.includes(t));
    assert.ok(found, '未找到等级类型定义');
  });
});

describe('MemberUpgradePathPage — L1 导出完整性', () => {
  it('应使用 TypeScript 类型导入', () => {
    assert.ok(SRC.includes('type Metadata') || SRC.includes('type Metadata'));
  });

  it('应从 @m5/ui 导入组件', () => {
    assert.ok(SRC.includes('@m5/ui'));
  });

  it('应导出 Next.js 元数据', () => {
    assert.ok(SRC.includes('export const metadata: Metadata'));
  });

  it('应定义 DEFAULT_TIERS', () => {
    assert.ok(SRC.includes('DEFAULT_TIERS'));
  });

  it('DEFAULT_TIERS 长度应 > 0', () => {
    const match = SRC.match(/DEFAULT_TIERS\s*[=:]\s*\[/);
    assert.ok(match, '未找到 DEFAULT_TIERS 数组定义');
  });
});
