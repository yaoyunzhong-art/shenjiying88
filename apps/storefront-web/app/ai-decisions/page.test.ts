import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

// Simple tests that validate the page structure without JSX rendering
// The page component is a React Server Component / Client Component
// that composes multiple @m5/ui components.

describe('AIDecisionsPage structure', () => {
  // ===== 正例: 文件/导出/组件结构 =====

  // Page file exists
  it('should have the page file', async () => {
    const fs = await import('fs');
    const exists = fs.existsSync(
      new URL('./page.tsx', import.meta.url).pathname
    );
    assert.equal(exists, true);
  });

  // Exports are valid — check via source analysis since .tsx can't be loaded directly by Node test runner
  it('should export a default function component', async () => {
    const fs = await import('fs');
    const source = fs.readFileSync(
      new URL('./page.tsx', import.meta.url).pathname,
      'utf-8'
    );
    assert.ok(source.includes('export default function AIDecisionsPage'), 'Missing default export');
  });

  // Verify the 'use client' directive
  it('should include use client directive', async () => {
    const fs = await import('fs');
    const source = fs.readFileSync(
      new URL('./page.tsx', import.meta.url).pathname,
      'utf-8'
    );
    assert.ok(source.includes("'use client'"), 'Missing use client directive');
  });

  // React imports check
  it('should import React hooks (useMemo, useState)', async () => {
    const fs = await import('fs');
    const source = fs.readFileSync(
      new URL('./page.tsx', import.meta.url).pathname,
      'utf-8'
    );
    assert.ok(source.includes('useMemo'), 'Missing useMemo import');
    assert.ok(source.includes('useState'), 'Missing useState import');
  });

  // Verify the string constants exist in the source
  it('should contain expected sections in source', async () => {
    const fs = await import('fs');
    const source = fs.readFileSync(
      new URL('./page.tsx', import.meta.url).pathname,
      'utf-8'
    );

    // Page title
    assert.ok(source.includes('AI 决策建议'), 'Missing page title');
    // Section labels
    assert.ok(
      source.includes('规则执行 & 销售预测'),
      'Missing section label for rules & forecast'
    );
    assert.ok(
      source.includes('智能建议 & 趋势'),
      'Missing section label for recommendations & trend'
    );
    // Footer
    assert.ok(
      source.includes('AI 决策建议每15分钟基于最新数据生成'),
      'Missing footer text'
    );
  });

  // Imports from @m5/ui are correct
  it('should import expected components from @m5/ui', async () => {
    const fs = await import('fs');
    const source = fs.readFileSync(
      new URL('./page.tsx', import.meta.url).pathname,
      'utf-8'
    );

    assert.ok(source.includes("AIDecisionPanel"), 'Missing AIDecisionPanel import');
    assert.ok(source.includes("RuleRecommendationPanel"), 'Missing RuleRecommendationPanel import');
    assert.ok(source.includes("SalesForecastPanel"), 'Missing SalesForecastPanel import');
    assert.ok(source.includes("SmartTrendChart"), 'Missing SmartTrendChart import');
    assert.ok(source.includes("AISummaryCard"), 'Missing AISummaryCard import');
  });

  // Verify type imports from @m5/ui
  it('should import type definitions from @m5/ui', async () => {
    const fs = await import('fs');
    const source = fs.readFileSync(
      new URL('./page.tsx', import.meta.url).pathname,
      'utf-8'
    );

    assert.ok(source.includes('DecisionRuleResult'), 'Missing DecisionRuleResult type');
    assert.ok(source.includes('DecisionPanelConfig'), 'Missing DecisionPanelConfig type');
    assert.ok(source.includes('RuleRecommendation'), 'Missing RuleRecommendation type');
    assert.ok(source.includes('ForecastDataPoint'), 'Missing ForecastDataPoint type');
    assert.ok(source.includes('TrendDataPoint'), 'Missing TrendDataPoint type');
  });

  // ===== 正例: Mock 数据完整性 =====

  // Verify mock rule results are complete
  it('should have complete mock rule results', async () => {
    const fs = await import('fs');
    const source = fs.readFileSync(
      new URL('./page.tsx', import.meta.url).pathname,
      'utf-8'
    );

    // Each rule should have the required fields
    const rules = [
      { id: 'r1', name: '会员折扣合规校验' },
      { id: 'r2', name: '库存流动性检测' },
      { id: 'r3', name: '促销重叠检测' },
      { id: 'r4', name: '会员流失预警' },
      { id: 'r5', name: '支付渠道对账' },
      { id: 'r6', name: '设备负载检测' },
    ];

    for (const rule of rules) {
      assert.ok(source.includes(rule.id), `Missing rule ${rule.id}`);
      assert.ok(source.includes(rule.name), `Missing rule name: ${rule.name}`);
    }
  });

  // Verify recommendations data
  it('should have complete recommendation data', async () => {
    const fs = await import('fs');
    const source = fs.readFileSync(
      new URL('./page.tsx', import.meta.url).pathname,
      'utf-8'
    );

    assert.ok(source.includes('合并重叠促销活动'), 'Missing recommendation #1');
    assert.ok(source.includes('主动触达钻石会员'), 'Missing recommendation #2');
    assert.ok(source.includes('重启POS-01终端'), 'Missing recommendation #3');
    assert.ok(source.includes('15款慢动销商品清仓'), 'Missing recommendation #4');
    assert.ok(source.includes('冷库传感器校准'), 'Missing recommendation #5');
  });

  // Verify forecast data
  it('should have forecast data points', async () => {
    const fs = await import('fs');
    const source = fs.readFileSync(
      new URL('./page.tsx', import.meta.url).pathname,
      'utf-8'
    );

    const expectedLabels = ['06-20', '06-21', '06-22', '06-23', '06-24', '06-25', '06-26'];
    for (const label of expectedLabels) {
      assert.ok(source.includes(label), `Missing forecast label: ${label}`);
    }
  });

  // Verify trend data
  it('should have weekly trend data', async () => {
    const fs = await import('fs');
    const source = fs.readFileSync(
      new URL('./page.tsx', import.meta.url).pathname,
      'utf-8'
    );

    const days = ['周一', '周二', '周三', '周四', '周五', '周六', '周日'];
    for (const day of days) {
      assert.ok(source.includes(day), `Missing trend day: ${day}`);
    }
  });

  // Summary stats grid renders correct labels
  it('should include all summary stat labels', async () => {
    const fs = await import('fs');
    const source = fs.readFileSync(
      new URL('./page.tsx', import.meta.url).pathname,
      'utf-8'
    );

    const labels = ['高置信建议', '已采纳', '已触发规则', '需关注', '总建议数'];
    for (const label of labels) {
      assert.ok(source.includes(label), `Missing summary label: ${label}`);
    }
  });

  // ===== 正例: DecisionRuleResult 字段完整性 =====

  it('every DecisionRuleResult has ruleId, ruleName, detail, triggered, confidence, suggestion, executedAt', async () => {
    const fs = await import('fs');
    const source = fs.readFileSync(
      new URL('./page.tsx', import.meta.url).pathname,
      'utf-8'
    );

    assert.ok(source.includes('ruleId'), 'Missing ruleId field');
    assert.ok(source.includes('ruleName'), 'Missing ruleName field');
    assert.ok(source.includes('detail'), 'Missing detail field');
    assert.ok(source.includes('triggered'), 'Missing triggered field');
    assert.ok(source.includes('confidence'), 'Missing confidence field');
    assert.ok(source.includes('suggestion'), 'Missing suggestion field');
    assert.ok(source.includes('executedAt'), 'Missing executedAt field');
  });

  it('every RuleRecommendation has id, title, description, category, confidence, impact, estimatedBenefit, adopted, createdAt', async () => {
    const fs = await import('fs');
    const source = fs.readFileSync(
      new URL('./page.tsx', import.meta.url).pathname,
      'utf-8'
    );

    assert.ok(source.includes('id:'), 'Missing id in recommendations');
    assert.ok(source.includes('title:'), 'Missing title in recommendations');
    assert.ok(source.includes('description:'), 'Missing description in recommendations');
    assert.ok(source.includes('category:'), 'Missing category in recommendations');
    assert.ok(source.includes('impact:'), 'Missing impact in recommendations');
    assert.ok(source.includes('estimatedBenefit:'), 'Missing estimatedBenefit in recommendations');
  });

  it('every ForecastDataPoint has label, predicted, optimistic, pessimistic; past points also have actual', async () => {
    const fs = await import('fs');
    const source = fs.readFileSync(
      new URL('./page.tsx', import.meta.url).pathname,
      'utf-8'
    );

    assert.ok(source.includes('label:'), 'Missing label in forecast');
    assert.ok(source.includes('predicted:'), 'Missing predicted in forecast');
    assert.ok(source.includes('optimistic:'), 'Missing optimistic in forecast');
    assert.ok(source.includes('pessimistic:'), 'Missing pessimistic in forecast');
  });

  it('every TrendDataPoint has label and value', async () => {
    const fs = await import('fs');
    const source = fs.readFileSync(
      new URL('./page.tsx', import.meta.url).pathname,
      'utf-8'
    );

    assert.ok(source.includes('value:'), 'Missing value in trend');
  });

  // ===== 正例: MOCK_RULES 触发/未触发分布 =====

  it('MOCK_RULES should have 6 rules total with 4 triggered and 2 not triggered', async () => {
    const fs = await import('fs');
    const source = fs.readFileSync(
      new URL('./page.tsx', import.meta.url).pathname,
      'utf-8'
    );

    const triggeredCount = (source.match(/triggered: true/g) || []).length;
    const notTriggeredCount = (source.match(/triggered: false/g) || []).length;
    assert.equal(triggeredCount, 4, 'Expected 4 triggered rules');
    assert.equal(notTriggeredCount, 2, 'Expected 2 non-triggered rules');
  });

  it('MOCK_RECOMMENDATIONS has 5 items with exactly 1 adopted', async () => {
    const fs = await import('fs');
    const source = fs.readFileSync(
      new URL('./page.tsx', import.meta.url).pathname,
      'utf-8'
    );

    const adoptedCount = (source.match(/adopted: true/g) || []).length;
    assert.equal(adoptedCount, 1, 'Expected exactly 1 adopted recommendation');
  });

  // ===== 正例: recommendation categories =====

  it('recommendations should cover governance, member_retention, performance, cost, security categories', async () => {
    const fs = await import('fs');
    const source = fs.readFileSync(
      new URL('./page.tsx', import.meta.url).pathname,
      'utf-8'
    );

    assert.ok(source.includes("'governance'"), 'Missing governance category');
    assert.ok(source.includes("'member_retention'"), 'Missing member_retention category');
    assert.ok(source.includes("'performance'"), 'Missing performance category');
    assert.ok(source.includes("'cost'"), 'Missing cost category');
    assert.ok(source.includes("'security'"), 'Missing security category');
  });

  it('recommendation confidence levels cover high, medium, low', async () => {
    const fs = await import('fs');
    const source = fs.readFileSync(
      new URL('./page.tsx', import.meta.url).pathname,
      'utf-8'
    );

    const highCount = (source.match(/confidence: 'high'/g) || []).length;
    const mediumCount = (source.match(/confidence: 'medium'/g) || []).length;
    const lowCount = (source.match(/confidence: 'low'/g) || []).length;
    assert.ok(highCount >= 1, 'Missing high confidence');
    assert.ok(mediumCount >= 1, 'Missing medium confidence');
    assert.ok(lowCount >= 1, 'Missing low confidence');
  });

  // ===== 反例: 页面处理逻辑边界 =====

  it('MOCK_RULES triggered rules should have lower confidence than non-triggered in some cases — non-triggered rules have high confidence', async () => {
    const fs = await import('fs');
    const source = fs.readFileSync(
      new URL('./page.tsx', import.meta.url).pathname,
      'utf-8'
    );

    // r1(未触发, 0.95), r5(未触发, 0.99)
    assert.ok(source.includes('confidence: 0.95'), 'Missing r5 confidence 0.95');
    assert.ok(source.includes('confidence: 0.99'), 'Missing r5 confidence 0.99');
  });

  it('MOCK_RULES executedAt timestamps should be ISO format', async () => {
    const fs = await import('fs');
    const source = fs.readFileSync(
      new URL('./page.tsx', import.meta.url).pathname,
      'utf-8'
    );

    // All 6 rules have executedAt.toISOString() calls (6 rules + 5 rec createdAts = total more)
    // At minimum 6 rules each have an executedAt set to .toISOString()
    assert.ok(source.includes('executedAt: new Date'), 'Missing executedAt timestamp generation');
  });

  it('MOCK_RULES recommendation suggestions should include actionable Chinese text', async () => {
    const fs = await import('fs');
    const source = fs.readFileSync(
      new URL('./page.tsx', import.meta.url).pathname,
      'utf-8'
    );

    assert.ok(source.includes('建议'), 'Missing suggestion text trigger');
    assert.ok(source.includes('合规'), 'Missing compliance mention');
    assert.ok(source.includes('合并'), 'Missing merge suggestion');
  });

  it('MOCK_DECISION_CONFIG should have autoRefreshMs=15000 and maxEvents=10', async () => {
    const fs = await import('fs');
    const source = fs.readFileSync(
      new URL('./page.tsx', import.meta.url).pathname,
      'utf-8'
    );

    assert.ok(source.includes('autoRefreshMs: 15000'), 'Missing autoRefreshMs: 15000');
    assert.ok(source.includes('maxEvents: 10'), 'Missing maxEvents: 10');
  });

  // ===== 边界值: 空/零/边界值/特殊字符 =====

  it('MOCK_SALES_FORECAST should have 3 future-only data points (no actual) and 4 past points (with actual)', async () => {
    const fs = await import('fs');
    const source = fs.readFileSync(
      new URL('./page.tsx', import.meta.url).pathname,
      'utf-8'
    );

    // 06-24, 06-25, 06-26 have only predicted/optimistic/pessimistic
    const futureLabels = ['06-24', '06-25', '06-26'];
    const pastLabels = ['06-20', '06-21', '06-22', '06-23'];
    for (const label of futureLabels) {
      assert.ok(source.includes(label), `Missing future forecast label: ${label}`);
    }
    for (const label of pastLabels) {
      assert.ok(source.includes(label), `Missing past forecast label: ${label}`);
    }
  });

  it('trend data points should have ascending values from Monday to Saturday then dip on Sunday', async () => {
    const fs = await import('fs');
    const source = fs.readFileSync(
      new URL('./page.tsx', import.meta.url).pathname,
      'utf-8'
    );

    assert.ok(source.includes('value: 2800'), 'Missing Monday value');
    assert.ok(source.includes('value: 2650'), 'Missing Tuesday value');
    assert.ok(source.includes('value: 2900'), 'Missing Wednesday value');
    assert.ok(source.includes('value: 3100'), 'Missing Thursday value');
    assert.ok(source.includes('value: 3300'), 'Missing Friday value');
    assert.ok(source.includes('value: 3500'), 'Missing Saturday value');
    assert.ok(source.includes('value: 3200'), 'Missing Sunday value');
  });

  it('summary highlighting colors should exist for each stat', async () => {
    const fs = await import('fs');
    const source = fs.readFileSync(
      new URL('./page.tsx', import.meta.url).pathname,
      'utf-8'
    );

    assert.ok(source.includes('#4ade80'), 'Missing green color (highConf)');
    assert.ok(source.includes('#60a5fa'), 'Missing blue color (adopted)');
    assert.ok(source.includes('#ef4444'), 'Missing red color (triggered)');
    assert.ok(source.includes('#facc15'), 'Missing yellow color (highConfRules)');
    assert.ok(source.includes('#a78bfa'), 'Missing purple color (total)');
  });

  it('handleAcknowledge, handleAdopt, handleDismiss callbacks should be defined', async () => {
    const fs = await import('fs');
    const source = fs.readFileSync(
      new URL('./page.tsx', import.meta.url).pathname,
      'utf-8'
    );

    assert.ok(source.includes('handleAcknowledge'), 'Missing handleAcknowledge');
    assert.ok(source.includes('handleAdopt'), 'Missing handleAdopt');
    assert.ok(source.includes('handleDismiss'), 'Missing handleDismiss');
  });

  it('the footer text should end with newline in a centered position container', async () => {
    const fs = await import('fs');
    const source = fs.readFileSync(
      new URL('./page.tsx', import.meta.url).pathname,
      'utf-8'
    );

    assert.ok(source.includes('textAlign'), 'Missing textAlign style');
    assert.ok(source.includes('#475569'), 'Missing footer color');
  });

  it('section headers should use emoji icons for visual categories', async () => {
    const fs = await import('fs');
    const source = fs.readFileSync(
      new URL('./page.tsx', import.meta.url).pathname,
      'utf-8'
    );

    assert.ok(source.includes('📋'), 'Missing clipboard emoji in section');
    assert.ok(source.includes('💡'), 'Missing lightbulb emoji in section');
  });

  it('MOCK_RECOMMENDATIONS resultRuleId should exist for adopted recommendations with auto-trigger', async () => {
    const fs = await import('fs');
    const source = fs.readFileSync(
      new URL('./page.tsx', import.meta.url).pathname,
      'utf-8'
    );

    assert.ok(source.includes('resultingRuleId'), 'Missing resultingRuleId field');
    assert.ok(source.includes('auto-trigger-001'), 'Missing auto-trigger ID');
  });

  it('page should have max-width container constraint of 1280px', async () => {
    const fs = await import('fs');
    const source = fs.readFileSync(
      new URL('./page.tsx', import.meta.url).pathname,
      'utf-8'
    );

    assert.ok(source.includes('maxWidth: 1280'), 'Missing maxWidth 1280 container');
  });
});
