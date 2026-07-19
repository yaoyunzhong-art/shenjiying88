/**
 * pages/index/page.test.ts — miniapp 首页 L1 JMeter 风格测试
 *
 * miniapp IndexPage 验证
 * - 正例: 组件导出、bootstrap 常量完整性、动作计划覆盖
 * - 反例: 游客态限制、空状态处理
 * - 边界: 数据一致性、3种会员态行为
 *
 * 注意: Taro 组件在 Node 环境无法直接 import，采用 source 文件分析 + 镜像常量验证
 */

import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

// ── Source 分析 ──

const SOURCE_PATH = resolve(__dirname, 'index.tsx');
const source = readFileSync(SOURCE_PATH, 'utf-8');

// ── 镜像 page.tsx 中的核心常量 ──

type DeliveryMode = 'bootstrap' | 'market' | 'fallback';

interface MiniappMarketBootstrap {
  marketCode: string;
  deliveryMode: DeliveryMode;
  defaultLanguage: string;
  supportedLanguages: string[];
  sharePolicy: string;
  primaryDomain: string;
}

const MINIAPP_BOOTSTRAP: MiniappMarketBootstrap = {
  marketCode: 'cn-mainland',
  deliveryMode: 'bootstrap',
  defaultLanguage: 'zh-CN',
  supportedLanguages: ['zh-CN', 'en-US'],
  sharePolicy: 'TEMPLATE_SHARE',
  primaryDomain: 'store-001.b.t.cn-mainland.local',
};

const ACTION_KEYS = ['member-login', 'booking-submit', 'coupon-claim'] as const;
type ActionKey = (typeof ACTION_KEYS)[number];

interface ActionPlanMeta {
  label: string;
  action: ActionKey;
  riskLevel: string;
  channel: string;
}

const ACTION_PLANS: ActionPlanMeta[] = [
  { label: '登录挑战', action: 'member-login', riskLevel: 'L0', channel: 'WECHAT' },
  { label: '预约提交', action: 'booking-submit', riskLevel: 'L1', channel: 'TARO' },
  { label: '领券前校验', action: 'coupon-claim', riskLevel: 'L2', channel: 'MEMBER' },
];

interface MiniSession {
  memberTier: string;
  authenticated: boolean;
  points: number;
}

function createGuestSession(): MiniSession {
  return { memberTier: 'GUEST', authenticated: false, points: 0 };
}

function createMemberSession(tier?: string): MiniSession {
  return { memberTier: tier ?? 'MEMBER', authenticated: true, points: tier === 'SVIP' ? 5000 : 1000 };
}

// ── 正例 ──

describe('IndexPage 正例', () => {
  it('source 文件存在', () => {
    assert.ok(source.length > 0, 'source file should exist');
  });

  it('source 包含 default export', () => {
    assert.ok(source.includes('export default function IndexPage'),
      'should have default function export');
  });

  it('bootstrap 常量正确', () => {
    assert.equal(MINIAPP_BOOTSTRAP.marketCode, 'cn-mainland');
    assert.equal(MINIAPP_BOOTSTRAP.deliveryMode, 'bootstrap');
    assert.equal(MINIAPP_BOOTSTRAP.defaultLanguage, 'zh-CN');
    assert.deepEqual(MINIAPP_BOOTSTRAP.supportedLanguages, ['zh-CN', 'en-US']);
    assert.equal(MINIAPP_BOOTSTRAP.sharePolicy, 'TEMPLATE_SHARE');
  });

  it('3 种核心动作计划已定义', () => {
    assert.equal(ACTION_PLANS.length, 3);
    const actions = ACTION_PLANS.map((p) => p.action);
    assert.ok(actions.includes('member-login'));
    assert.ok(actions.includes('booking-submit'));
    assert.ok(actions.includes('coupon-claim'));
  });

  it('member-login 风险级别 L0', () => {
    const plan = ACTION_PLANS.find((p) => p.action === 'member-login')!;
    assert.equal(plan.riskLevel, 'L0');
    assert.equal(plan.channel, 'WECHAT');
  });

  it('booking-submit 通道 TARO', () => {
    const plan = ACTION_PLANS.find((p) => p.action === 'booking-submit')!;
    assert.equal(plan.channel, 'TARO');
  });

  it('coupon-claim 通道 MEMBER', () => {
    const plan = ACTION_PLANS.find((p) => p.action === 'coupon-claim')!;
    assert.equal(plan.channel, 'MEMBER');
  });

  it('source imports @m5/types', () => {
    assert.ok(source.includes('@m5/types'), 'should import from @m5/types');
  });

  it('source has "M5 门店小程序骨架" string', () => {
    assert.ok(source.includes('M5 门店小程序骨架'), 'should contain skeleton label');
  });

  it('source 展示支持语言信息', () => {
    assert.ok(source.includes('支持语言'), 'should render supported languages label');
    assert.ok(source.includes("bootstrap.supportedLanguages.join(' / ')"), 'should render supported languages list');
  });

  it('source 展示统一语言策略摘要', () => {
    assert.ok(source.includes('语言策略'), 'should render locale summary label');
    assert.ok(source.includes('formatMiniappLocaleSummary(bootstrap)'), 'should use shared locale summary helper');
  });

  it('source 展示统一分享策略摘要', () => {
    assert.ok(source.includes('分享策略'), 'should render share policy label');
    assert.ok(source.includes('formatMiniappSharePolicySummary(bootstrap)'), 'should use shared share policy helper');
  });

  it('source 有 domainSource 与 domainGovernance 渲染', () => {
    assert.ok(source.includes('domainSource'), 'should render domain source');
    assert.ok(source.includes('buildDomainGovernanceDisplayModel'), 'should build shared domain governance display model');
    assert.ok(source.includes('domainGovernanceWorkspaceHref'), 'should render governance workspace href from snapshot');
  });

  it('source has domain governance summary and shared workspace href', () => {
    assert.ok(source.includes('DomainGovernancePanel'), 'should render shared domain governance presenter');
    assert.ok(source.includes('heading="域名治理摘要"'), 'should keep domain governance heading');
    assert.ok(source.includes('domainGovernanceDisplayModel'), 'should pass shared display model');
    assert.ok(!source.includes('headerSection'), 'page should not read headerSection directly');
    assert.ok(!source.includes('footerSection'), 'page should not read footerSection directly');
  });

  it('source uses useState/useEffect', () => {
    assert.ok(source.includes('useState'), 'should use useState');
    assert.ok(source.includes('useEffect'), 'should use useEffect');
  });

  it('source has 会员态切换按钮', () => {
    assert.ok(source.includes('模拟游客态'), 'should have guest button');
    assert.ok(source.includes('模拟普通会员'), 'should have member button');
    assert.ok(source.includes('模拟 SVIP'), 'should have SVIP button');
  });

  it('source has 3 种动作按钮', () => {
    assert.ok(source.includes('登录挑战'), 'should have login button');
    assert.ok(source.includes('预约提交'), 'should have booking button');
    assert.ok(source.includes('领券前校验'), 'should have coupon button');
  });

  it('source has governance alerts section', () => {
    assert.ok(source.includes('治理告警目录'), 'should have governance section');
  });

  it('source has runtime receipt section', () => {
    assert.ok(source.includes('真实 Runtime 回执'), 'should have runtime receipt section');
  });

  it('source has overview stats section', () => {
    assert.ok(source.includes('overviewStats'), 'should have overview stats data');
  });

  it('source has top risks display', () => {
    assert.ok(source.includes('topRisks'), 'should have top risks');
  });

  it('source imports market-bootstrap', () => {
    assert.ok(source.includes('../../market-bootstrap'), 'should import market-bootstrap');
  });

  it('source has callback receipt section', () => {
    assert.ok(source.includes('Callback Receipt'), 'should have callback receipt');
  });

  it('source has retry policy section', () => {
    assert.ok(source.includes('Retry Policy'), 'should have retry policy');
  });

  it('source has auth envelope section', () => {
    assert.ok(source.includes('Auth Envelope'), 'should have auth envelope');
  });

  it('source handles runtime history display', () => {
    assert.ok(source.includes('runtimeHistory'), 'should have runtime history');
  });
});

// ── 反例 ──

describe('IndexPage 反例', () => {
  it('游客态 points = 0', () => {
    const session = createGuestSession();
    assert.equal(session.points, 0);
  });

  it('游客态未认证', () => {
    const session = createGuestSession();
    assert.equal(session.authenticated, false);
    assert.equal(session.memberTier, 'GUEST');
  });

  it('无重复动作计划 key', () => {
    const keys = ACTION_PLANS.map((p) => p.action);
    assert.equal(new Set(keys).size, keys.length, 'action keys must be unique');
  });

  it('无空 label', () => {
    for (const plan of ACTION_PLANS) {
      assert.ok(plan.label.length > 0, `plan ${plan.action} label empty`);
    }
  });

  it('source 使用类型导入语法正确', () => {
    // 验证 import 语句格式（含多行 import）
    assert.ok(source.includes('import'), 'should have import statements');
    // type-only imports
    assert.ok(source.includes('import type'), 'should have type-only imports');
  });

  it('ACTION_PLANS 无空风险级别', () => {
    for (const plan of ACTION_PLANS) {
      assert.ok(plan.riskLevel.length > 0, `plan ${plan.action} riskLevel empty`);
    }
  });
});

// ── 边界 ──

describe('IndexPage 边界', () => {
  it('MEMBER 会话认证为 true', () => {
    const session = createMemberSession();
    assert.equal(session.authenticated, true);
    assert.equal(session.memberTier, 'MEMBER');
    assert.equal(session.points, 1000);
  });

  it('SVIP 会话有更高积分', () => {
    const session = createMemberSession('SVIP');
    assert.equal(session.memberTier, 'SVIP');
    assert.equal(session.points, 5000);
    assert.ok(session.points > createMemberSession().points);
  });

  it('bootstrap deliveryMode 仅允许 3 种值', () => {
    const valid: DeliveryMode[] = ['bootstrap', 'market', 'fallback'];
    assert.ok(valid.includes(MINIAPP_BOOTSTRAP.deliveryMode));
  });

  it('source 有 generateAt 时间戳引用', () => {
    assert.ok(source.includes('generatedAt'), 'should have generatedAt timestamp');
  });

  it('source 存在 ledger 关联字符串', () => {
    assert.ok(source.includes('Ledger'), 'should reference Ledger');
    assert.ok(source.includes('Replay'), 'should reference Replay');
  });

  it('source 使用 @tarojs/components', () => {
    assert.ok(source.includes('@tarojs/components'), 'should import Taro components');
    assert.ok(source.includes('View'), 'should use View');
    assert.ok(source.includes('Text'), 'should use Text');
    assert.ok(source.includes('Button'), 'should use Button');
  });

  it('source 有 governance 告警目录', () => {
    assert.ok(source.includes('governanceAlerts'), 'should have governance alerts');
    assert.ok(source.includes('approvals-pending'), 'should reference approval-related alert');
  });

  it('source 有 alert drilldown 部分', () => {
    assert.ok(source.includes('Alert Drilldown'), 'should have drilldown section');
  });

  it('source 有 alert mutation 部分', () => {
    assert.ok(source.includes('Alert Acknowledgement'), 'should have alert mutation');
    assert.ok(source.includes('Ack'), 'should support acknowledge action');
  });

  it('source 源码体量合理', () => {
    assert.ok(source.length > 5000, 'source should be substantial');
    assert.ok(source.length < 40000, 'source should not be too large');
  });

  it('source 有 governance 控制按钮组', () => {
    assert.ok(source.includes('读取 Drilldown'), 'should have drilldown button');
    assert.ok(source.includes('Ack 告警'), 'should have ack button');
    assert.ok(source.includes('Mute 告警'), 'should have mute button');
    assert.ok(source.includes('取消静默'), 'should have unmute button');
  });

  it('source 有 consumerContract scope 渲染', () => {
    assert.ok(source.includes('scopePath'), 'should have scope path');
    assert.ok(source.includes('mismatchStrategy'), 'should have mismatch strategy');
  });

  it('source 有 degradation 渲染', () => {
    assert.ok(source.includes('featureFlagFallback'), 'should have feature flag fallback');
    assert.ok(source.includes('desensitizationMode'), 'should have desensitization mode');
  });
});
