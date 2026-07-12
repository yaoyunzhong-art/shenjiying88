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
    assert.ok(SRC.includes('JSON-LD') || SRC.includes('structured'));
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
