/**
 * 会员等级分布页面测试 — Member Tier Distribution Page Test
 * 兼容项目 node --import tsx --test 运行方式
 * 使用 renderToStaticMarkup 进行无头渲染（真实 @m5/ui 组件）
 */
import React from 'react';

const assert = require('node:assert/strict');
const { describe, test } = require('node:test');

const PROJECT_ROOT = '/Users/yaoyunzhong/Desktop/shenjiying/shenjiying88';
const { renderToStaticMarkup } = require(
  PROJECT_ROOT + '/node_modules/.pnpm/react-dom@18.3.1_react@18.3.1/node_modules/react-dom/server.node.js'
);

// ==================== 辅助函数 ====================

function render(Page: React.ComponentType<any>): string {
  return renderToStaticMarkup(React.createElement(Page));
}

function hasText(html: string, text: string): boolean {
  return html.includes(text);
}

function countText(html: string, text: string): number {
  let count = 0;
  let pos = 0;
  while (true) {
    const idx = html.indexOf(text, pos);
    if (idx === -1) break;
    count++;
    pos = idx + text.length;
  }
  return count;
}

// ==================== 测试用例 ====================

describe('MemberTierDistributionPage', () => {
  const MemberTierDistributionPage: React.ComponentType = require('./page').default;
  let html: string;

  test('setup - render component', () => {
    html = render(MemberTierDistributionPage);
    assert.ok(html.length > 0, '组件应正常渲染');
  });

  describe('PageShell 渲染', () => {
    test('should render page title and subtitle', () => {
      assert.ok(hasText(html, '会员等级分布'), '应显示页面标题');
      assert.ok(hasText(html, '可视化分析会员结构'), '应显示子标题');
    });
  });

  describe('KPI Summary Cards', () => {
    test('should render 4 KPI summary card containers', () => {
      // KpiSummaryCard 组件 data-testid="kpi-summary-card"
      const cardCount = countText(html, 'kpi-summary-card');
      assert.equal(cardCount, 4, '应渲染4个KPI卡片容器');
    });

    test('should have correct KPI titles', () => {
      assert.ok(hasText(html, '总会员数'), '应显示总会员数');
      assert.ok(hasText(html, '高价值会员'), '应显示高价值会员');
      assert.ok(hasText(html, '黄金会员'), '应显示黄金会员');
      assert.ok(hasText(html, '本月新增'), '应显示本月新增');
    });

    test('should calculate totalMembers correctly (86+215+378+425+182=1286)', () => {
      assert.ok(hasText(html, '1,286'), '总会员数应为 1,286');
    });

    test('should calculate highValueMembers correctly (86+215=301)', () => {
      assert.ok(hasText(html, '301'), '高价值会员数应为 301');
    });
  });

  describe('图标组件', () => {
    test('should render SVG circles from DonutChart', () => {
      // DonutChart 使用 SVG circle 元素渲染
      assert.ok(hasText(html, '<circle'), '应包含 SVG circle 元素');
    });

    test('should render SparklineChart SVG', () => {
      // SparklineChart 渲染为 SVG
      assert.ok(hasText(html, 'Sparkline chart'), '应包含 SparklineChart SVG');
    });
  });

  describe('等级分析表格', () => {
    test('should render tier analysis table with all 5 tiers', () => {
      assert.ok(hasText(html, '钻石会员'), '应显示钻石会员');
      assert.ok(hasText(html, '铂金会员'), '应显示铂金会员');
      assert.ok(hasText(html, '黄金会员'), '应显示黄金会员');
      assert.ok(hasText(html, '银卡会员'), '应显示银卡会员');
      assert.ok(hasText(html, '普通会员'), '应显示普通会员');
    });

    test('should display correct tier tags', () => {
      assert.ok(hasText(html, '高价值'), '应显示高价值标签');
      assert.ok(hasText(html, '中价值'), '应显示中价值标签');
      assert.ok(hasText(html, '待提升'), '应显示待提升标签');
    });

    test('should calculate correct percentage values', () => {
      // 钻石会员 86/1286 ≈ 6.7%
      assert.ok(hasText(html, '6.7%'), '钻石会员占比约 6.7%');
      // 银卡会员 425/1286 ≈ 33.0%
      assert.ok(hasText(html, '33.0%'), '银卡会员占比约 33.0%');
    });

    test('should display growth indicators', () => {
      assert.ok(hasText(html, '↑'), '应有增长指示符');
      assert.ok(hasText(html, '↓'), '应有关联下降指示符');
    });
  });

  describe('Card 容器', () => {
    test('should render all 5 Card titles', () => {
      const cards = [
        '等级分布（饼图）',
        '等级分布（柱状图）',
        '等级占比（水平柱状）',
        '高价值会员增长趋势',
        '等级构成分析',
      ];
      for (const name of cards) {
        assert.ok(hasText(html, name), `应包含Card标题: ${name}`);
      }
    });
  });

  describe('布局样式', () => {
    test('should have grid layout classes', () => {
      const gridCount = countText(html, 'grid');
      assert.ok(gridCount >= 3, `应有至少3个grid引用, 实际找到 ${gridCount} 个`);
    });
  });
});
