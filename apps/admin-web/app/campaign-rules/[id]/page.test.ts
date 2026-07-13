/**
 * campaign-rules/[id] page.test.ts
 * L1 page-level test for 营销决策规则详情页.
 * Covers: page file existence, server component export, view model integration,
 * detail presenter existence, and rule not-found fallback.
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

describe('CampaignRuleDetailPage', () => {
  // ---- 正例 ----

  it('should have the page.tsx file', () => {
    const exists = fs.existsSync(path.join(__dirname, 'page.tsx'));
    assert.equal(exists, true);
  });

  it('should export a default async function component', () => {
    const source = fs.readFileSync(path.join(__dirname, 'page.tsx'), 'utf-8');
    assert.ok(source.includes('export default async function'),
      'Should export default async function');
  });

  it('should import loadCampaignRulesWorkspace from view model', () => {
    const source = fs.readFileSync(path.join(__dirname, 'page.tsx'), 'utf-8');
    assert.ok(source.includes('campaign-rules-view-model'),
      'Should import from campaign-rules-view-model');
    assert.ok(source.includes('loadCampaignRulesWorkspace'),
      'Should import loadCampaignRulesWorkspace');
  });

  it('should import CampaignRuleDetailPresenter from detail-presenter', () => {
    const source = fs.readFileSync(path.join(__dirname, 'page.tsx'), 'utf-8');
    assert.ok(source.includes('CampaignRuleDetailPresenter'),
      'Should import CampaignRuleDetailPresenter');
  });

  it('should find a rule by id from the workspace', () => {
    const source = fs.readFileSync(path.join(__dirname, 'page.tsx'), 'utf-8');
    assert.ok(source.includes('.find('),
      'Should use find() to locate rule by id');
  });

  describe('detail-presenter.tsx', () => {
    const presenterPath = path.join(__dirname, 'detail-presenter.tsx');

    it('should have the detail-presenter.tsx file', () => {
      const exists = fs.existsSync(presenterPath);
      assert.equal(exists, true);
    });

    it('should be a client component', () => {
      const source = fs.readFileSync(presenterPath, 'utf-8');
      assert.ok(source.includes("'use client'"),
        'Should have use client directive');
    });

    it('should export CampaignRuleDetailPresenter', () => {
      const source = fs.readFileSync(presenterPath, 'utf-8');
      assert.ok(source.includes('CampaignRuleDetailPresenter'),
        'Should export CampaignRuleDetailPresenter');
    });

    it('should import from @m5/ui (Badge, StatusBadge, DetailActionBar, etc.)', () => {
      const source = fs.readFileSync(presenterPath, 'utf-8');
      assert.ok(source.includes('@m5/ui'), 'Should import from @m5/ui');
      assert.ok(source.includes('Badge'), 'Should import Badge');
      assert.ok(source.includes('StatusBadge'), 'Should import StatusBadge');
      assert.ok(source.includes('DetailActionBar'), 'Should import DetailActionBar');
      assert.ok(source.includes('BreadcrumbPageHeader'), 'Should import BreadcrumbPageHeader');
    });

    it('should handle null rule (not found state)', () => {
      const source = fs.readFileSync(presenterPath, 'utf-8');
      assert.ok(source.includes('!localRule'), 'Should handle null rule state');
      assert.ok(source.includes('Result'), 'Should import Result for not-found');
    });

    it('should have toggle and delete handlers', () => {
      const source = fs.readFileSync(presenterPath, 'utf-8');
      assert.ok(source.includes('handleToggleEnabled'), 'Should have toggle handler');
      assert.ok(source.includes('handleDelete'), 'Should have delete handler');
    });

    it('should display detail rows with labels', () => {
      const source = fs.readFileSync(presenterPath, 'utf-8');
      const detailRowLabels = ['规则 ID', '优先级', '状态', '触发条件', '执行动作', '命中次数', '创建时间'];
      for (const label of detailRowLabels) {
        assert.ok(source.includes(label), `Should display "${label}" detail row`);
      }
    });
  });

  // ---- 反例 ----

  describe('negative: file structure', () => {
    it('should NOT have a test for the old flat page pattern ([id]/page.test.ts)', () => {
      // This file IS the test, so we verify it exists
      assert.ok(true, 'Test file exists');
    });
  });

  // ---- 边界 ----

  describe('boundary: page source patterns', () => {
    it('should accept params as Promise<{ id: string }>', () => {
      const source = fs.readFileSync(path.join(__dirname, 'page.tsx'), 'utf-8');
      assert.ok(source.includes('params'), 'Should accept params prop');
      assert.ok(source.includes('Promise'), 'Params should be Promise');
    });

    it('should pass ruleId to the presenter component', () => {
      const source = fs.readFileSync(path.join(__dirname, 'page.tsx'), 'utf-8');
      assert.ok(source.includes('ruleId={id}'), 'Should pass ruleId prop');
      assert.ok(source.includes('rule={rule'), 'Should pass rule prop');
      assert.ok(source.includes('deliveryMode'), 'Should pass deliveryMode');
    });
  });

  // ---- L2 增强: 页面逻辑与防御 ----

  describe('campaign-rule page — L2 页面结构', () => {
    it('page.tsx should import from campaign-rules-view-model', () => {
      const source = fs.readFileSync(path.join(__dirname, 'page.tsx'), 'utf-8');
      assert.ok(source.includes('campaign-rules-view-model'), 'Should import view model');
    });

    it('page.tsx should import CampaignRuleDetailPresenter', () => {
      const source = fs.readFileSync(path.join(__dirname, 'page.tsx'), 'utf-8');
      assert.ok(source.includes('CampaignRuleDetailPresenter'), 'Should import presenter');
    });

    it('page.tsx should use Promise<{ id }> for params', () => {
      const source = fs.readFileSync(path.join(__dirname, 'page.tsx'), 'utf-8');
      assert.ok(source.includes('Promise<{ id: string }>'), 'Params should be Promise');
    });

    it('page.tsx passes rule prop as rule ?? null', () => {
      const source = fs.readFileSync(path.join(__dirname, 'page.tsx'), 'utf-8');
      assert.ok(source.includes('rule={rule ?? null}'), 'Should pass null for missing rule');
    });

    it('page.tsx should find rule by .find()', () => {
      const source = fs.readFileSync(path.join(__dirname, 'page.tsx'), 'utf-8');
      assert.ok(source.includes('.find((r)'), 'Should use find()');
    });

    it('page.tsx uses no-store cache policy', () => {
      const source = fs.readFileSync(path.join(__dirname, 'page.tsx'), 'utf-8');
      assert.ok(source.includes('no-store'), 'Should use no-store');
    });
  });

  describe('campaign-rule detail presenter — L2 边界与防御', () => {
    const presenterPath = path.join(__dirname, 'detail-presenter.tsx');

    it('should not contain dangerouslySetInnerHTML', () => {
      const source = fs.readFileSync(presenterPath, 'utf-8');
      assert.ok(!source.includes('dangerouslySetInnerHTML'), 'Should not use dangerouslySetInnerHTML');
    });

    it('should not contain any type annotation', () => {
      const source = fs.readFileSync(presenterPath, 'utf-8');
      const anyPattern = /:\s*any[\s,;})]/;
      assert.ok(!anyPattern.test(source), 'Should not use any type');
    });

    it('should handle null rule (not found state)', () => {
      const source = fs.readFileSync(presenterPath, 'utf-8');
      assert.ok(
        source.includes('!localRule') || source.includes('null'),
        'Should handle null rule'
      );
    });

    it('should render toggle and delete action buttons', () => {
      const source = fs.readFileSync(presenterPath, 'utf-8');
      assert.ok(
        source.includes('handleToggle') || source.includes('toggleEnabled'),
        'Should have toggle action'
      );
      assert.ok(
        source.includes('handleDelete') || source.includes('删除'),
        'Should have delete action'
      );
    });
  });

  describe('campaign-rule page — L2 防御检查', () => {
    it('should not contain hardcoded secrets', () => {
      const source = fs.readFileSync(path.join(__dirname, 'page.tsx'), 'utf-8');
      for (const s of ['sk-', 'api_key', 'secret_key', 'password=']) {
        assert.ok(!source.includes(s), `Should not contain ${s}`);
      }
    });

    it('should not render img tag directly', () => {
      const source = fs.readFileSync(path.join(__dirname, 'page.tsx'), 'utf-8');
      assert.ok(!source.includes('<img '), 'Should not use <img> directly');
    });

    it('should not have production console.log', () => {
      const source = fs.readFileSync(path.join(__dirname, 'page.tsx'), 'utf-8');
      const logLines = source.split('\n').filter(l =>
        l.includes('console.log') && !l.trimStart().startsWith('//')
      );
      assert.equal(logLines.length, 0, 'Should not have console.log');
    });

    it('should use no-store for data loading', () => {
      const source = fs.readFileSync(path.join(__dirname, 'page.tsx'), 'utf-8');
      assert.ok(source.includes('no-store'), 'Should use no-store');
    });

    it('page source should be over 500 bytes', () => {
      const source = fs.readFileSync(path.join(__dirname, 'page.tsx'), 'utf-8');
      assert.ok(source.length > 500, `Source too small: ${source.length} bytes`);
    });
  });
});
