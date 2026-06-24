/**
 * FoundationConsumerSections 单元测试
 * 覆盖 GovernanceQuickViewSection 和 FoundationConsumerWiringSection
 */

import React from 'react';

const assert = require('node:assert/strict');
const { describe, it } = require('node:test');

const PROJECT_ROOT = '/Users/yaoyunzhong/Desktop/shenjiying/shenjiying88';
const { renderToStaticMarkup } = require(
  PROJECT_ROOT + '/node_modules/.pnpm/react-dom@18.3.1_react@18.3.1/node_modules/react-dom/server.node.js'
);

const {
  GovernanceQuickViewSection,
  FoundationConsumerWiringSection,
} = require('./FoundationConsumerSections');

// ---- 辅助函数 ----

function render(el: React.ReactElement): string {
  return renderToStaticMarkup(el);
}

function contains(haystack: string, ...needles: string[]): boolean {
  return needles.every((n) => haystack.includes(n));
}

// ---- GovernanceQuickViewSection ----

describe('GovernanceQuickViewSection', () => {
  it('renders with default title and summary', () => {
    const html = render(
      <GovernanceQuickViewSection summaryLine="总告警数：42" />
    );
    assert.ok(contains(html, '治理告警快速视图', '总告警数：42'));
  });

  it('renders custom title via title prop', () => {
    const html = render(
      <GovernanceQuickViewSection
        title="自定义标题"
        summaryLine="摘要信息"
      />
    );
    assert.ok(contains(html, '自定义标题', '摘要信息'));
  });

  it('renders triageLine when provided', () => {
    const html = render(
      <GovernanceQuickViewSection
        summaryLine="总告警数：10"
        triageLine="需要关注：3 条高危"
      />
    );
    assert.ok(contains(html, '总告警数：10', '需要关注：3 条高危'));
  });

  it('does not render triageLine when undefined', () => {
    const html = render(
      <GovernanceQuickViewSection summaryLine="仅摘要" />
    );
    assert.ok(!html.includes('undefined'));
    // summaryLine 应该存在
    assert.ok(html.includes('仅摘要'));
  });

  it('renders children content', () => {
    const html = render(
      <GovernanceQuickViewSection summaryLine="摘要">
        <div data-testid="child">子内容</div>
      </GovernanceQuickViewSection>
    );
    assert.ok(contains(html, '子内容', 'child'));
  });

  it('applies custom color props', () => {
    const html = render(
      <GovernanceQuickViewSection
        titleColor="#ff0000"
        primaryTextColor="#00ff00"
        secondaryTextColor="#0000ff"
        summaryLine="彩色摘要"
        triageLine="彩色分诊"
      />
    );
    assert.ok(contains(html, '彩色摘要', '彩色分诊'));
    assert.ok(html.includes('#ff0000'));
    assert.ok(html.includes('#00ff00'));
    assert.ok(html.includes('#0000ff'));
  });

  it('applies custom panelStyle', () => {
    const html = render(
      <GovernanceQuickViewSection
        summaryLine="样式面板"
        panelStyle={{ borderRadius: 8, marginTop: 10 }}
      />
    );
    assert.ok(contains(html, '样式面板'));
  });

  it('renders without children', () => {
    const html = render(
      <GovernanceQuickViewSection summaryLine="无子元素" />
    );
    assert.ok(html.includes('无子元素'));
  });

  it('renders with empty triageLine', () => {
    const html = render(
      <GovernanceQuickViewSection
        summaryLine="摘要"
        triageLine=""
      />
    );
    assert.ok(html.includes('摘要'));
  });
});

// ---- FoundationConsumerWiringSection ----

describe('FoundationConsumerWiringSection', () => {
  it('renders with default title and responsibility', () => {
    const html = render(
      <FoundationConsumerWiringSection responsibility="本服务负责处理会员等级计算" />
    );
    assert.ok(contains(html, '底座接线说明', '本服务负责处理会员等级计算'));
  });

  it('renders custom title', () => {
    const html = render(
      <FoundationConsumerWiringSection
        title="自定义接线标题"
        responsibility="职责描述"
      />
    );
    assert.ok(contains(html, '自定义接线标题', '职责描述'));
  });

  it('renders sequenceLine when provided', () => {
    const html = render(
      <FoundationConsumerWiringSection
        responsibility="职责"
        sequenceLine="序列：step1 → step2 → step3"
      />
    );
    assert.ok(contains(html, '职责', '序列：step1 → step2 → step3'));
  });

  it('renders highRiskLine when provided', () => {
    const html = render(
      <FoundationConsumerWiringSection
        responsibility="职责"
        highRiskLine="高风险：涉及资金操作"
      />
    );
    assert.ok(contains(html, '职责', '高风险：涉及资金操作'));
  });

  it('renders touchpointsLine when provided', () => {
    const html = render(
      <FoundationConsumerWiringSection
        responsibility="职责"
        touchpointsLine="触点：会员服务 / 积分服务 / 通知服务"
      />
    );
    assert.ok(contains(html, '职责', '触点：会员服务 / 积分服务 / 通知服务'));
  });

  it('does not render undefined lines when not provided', () => {
    const html = render(
      <FoundationConsumerWiringSection responsibility="仅职责" />
    );
    assert.ok(html.includes('仅职责'));
    assert.ok(!html.includes('undefined'));
  });

  it('renders all optional lines together', () => {
    const html = render(
      <FoundationConsumerWiringSection
        responsibility="核心职责"
        sequenceLine="序列 A"
        highRiskLine="高风险 B"
        touchpointsLine="触点 C"
      />
    );
    assert.ok(
      contains(html, '核心职责', '序列 A', '高风险 B', '触点 C')
    );
  });

  it('applies custom color props', () => {
    const html = render(
      <FoundationConsumerWiringSection
        titleColor="#ffcc00"
        primaryTextColor="#aabbcc"
        secondaryTextColor="#ddeeff"
        responsibility="彩色职责"
        sequenceLine="彩色序列"
      />
    );
    assert.ok(contains(html, '彩色职责', '彩色序列'));
    assert.ok(html.includes('#ffcc00'));
    assert.ok(html.includes('#aabbcc'));
    assert.ok(html.includes('#ddeeff'));
  });

  it('applies custom panelStyle', () => {
    const html = render(
      <FoundationConsumerWiringSection
        responsibility="样式职责"
        panelStyle={{ padding: 24, borderWidth: 2 }}
      />
    );
    assert.ok(html.includes('样式职责'));
  });

  it('renders with partial optional lines (only sequenceLine)', () => {
    const html = render(
      <FoundationConsumerWiringSection
        responsibility="职责 R"
        sequenceLine="序列 S"
      />
    );
    assert.ok(contains(html, '职责 R', '序列 S'));
    assert.ok(!html.includes('undefined'));
  });
});
