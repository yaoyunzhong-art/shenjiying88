import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

// Simple tests that validate the page structure without JSX rendering
// The page component is a React Server Component / Client Component
// that composes multiple @m5/ui components.

describe('AIDecisionsPage structure', () => {
  // Page file exists
  it('should have the page file', async () => {
    const fs = await import('fs');
    const exists = fs.existsSync(
      new URL('./page.tsx', import.meta.url).pathname
    );
    assert.equal(exists, true);
  });

  // Exports are valid
  it('should export a default function component', async () => {
    const mod = await import('./page.tsx');
    assert.equal(typeof mod.default, 'function');
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

  // Verify mock data structures are complete
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

    // page.tsx 中的运营摘要标签列表
    const labels = ['高置信建议', '已采纳', '已触发规则', '需关注', '总建议数'];
    for (const label of labels) {
      assert.ok(source.includes(label), `Missing summary label: ${label}`);
    }
  });
});
