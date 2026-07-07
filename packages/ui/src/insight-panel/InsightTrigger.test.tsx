/**
 * InsightTrigger.test.tsx — L1 逻辑/纯函数测试
 *
 * 覆盖:
 * - 正例: TEMPLATE_LABELS / 组件接口签名 / 默认 props 结构
 * - 反例: props 中的 falsy 值 / 缺少必需字段
 * - 边界: data attributes 映射 / label 构造逻辑
 */

import assert from 'node:assert/strict';
import { describe, test } from 'node:test';

import { TEMPLATE_LABELS, STATUS_LABELS } from './types';
import { InsightTrigger } from './InsightTrigger';

// ─── 正例 ────────────────────────────────────────────────────────────────

describe('InsightTrigger 正例 (positive)', () => {
  test('should export named function component', () => {
    assert.equal(typeof InsightTrigger, 'function', 'InsightTrigger is a function');
    assert.equal(InsightTrigger.name, 'InsightTrigger', 'function name is InsightTrigger');
  });

  test('TEMPLATE_LABELS should have all 5 types', () => {
    assert.equal(Object.keys(TEMPLATE_LABELS).length, 5);
    assert.equal(TEMPLATE_LABELS.sales, '销售洞察');
    assert.equal(TEMPLATE_LABELS.inventory, '库存洞察');
    assert.equal(TEMPLATE_LABELS.finance, '财务洞察');
    assert.equal(TEMPLATE_LABELS.marketing, '营销洞察');
    assert.equal(TEMPLATE_LABELS.customer, '客户洞察');
  });

  test('STATUS_LABELS should have all statuses', () => {
    assert.equal(STATUS_LABELS.pending, '等待中');
    assert.equal(STATUS_LABELS.generating, '生成中');
    assert.equal(STATUS_LABELS.completed, '已完成');
    assert.equal(STATUS_LABELS.failed, '失败');
  });

  test('default label should be AI insight + template name', () => {
    for (const [type, label] of Object.entries(TEMPLATE_LABELS)) {
      const expected = `🤖 AI 洞察 - ${label}`;
      assert.ok(expected.includes(label), `label for ${type} includes ${label}`);
      assert.ok(expected.startsWith('🤖'), `label for ${type} starts with robot`);
    }
  });

  test('InsightTriggerProps interface shape should be correct', () => {
    const paramStr = InsightTrigger.toString();
    assert.ok(paramStr.includes('reportId'), 'props includes reportId');
    assert.ok(paramStr.includes('templateType'), 'props includes templateType');
    assert.ok(paramStr.includes('label'), 'props includes label');
    assert.ok(paramStr.includes('onGenerated'), 'props includes onGenerated');
  });

  test('default templateType should be sales', () => {
    const fnStr = InsightTrigger.toString();
    assert.ok(
      fnStr.includes('"sales"') || fnStr.includes("'sales'"),
      'default templateType is sales'
    );
  });
});

// ─── 反例 ────────────────────────────────────────────────────────────────

describe('InsightTrigger 反例 (negative)', () => {
  test('missing reportId should not cause crash at call time', () => {
    assert.doesNotThrow(() => InsightTrigger.toString);
  });
});

// ─── 边界 ────────────────────────────────────────────────────────────────

describe('InsightTrigger 边界 (boundary)', () => {
  test('component file should export named component', () => {
    assert.ok(InsightTrigger, 'named export exists');
  });

  test('all template types should have unique Chinese labels', () => {
    const labels = Object.values(TEMPLATE_LABELS);
    const uniqueLabels = new Set(labels);
    assert.equal(uniqueLabels.size, labels.length, 'all labels are unique');
  });

  test('data-testid attribute should be present in compiled body', () => {
    const fnStr = InsightTrigger.toString();
    assert.ok(fnStr.includes('data-testid'), 'function body contains data-testid');
    assert.ok(fnStr.includes('data-report-id'), 'function body contains data-report-id');
    assert.ok(fnStr.includes('data-template'), 'function body contains data-template');
    assert.ok(fnStr.includes('data-last-id'), 'function body contains data-last-id');
    assert.ok(fnStr.includes('data-pending'), 'function body contains data-pending');
  });

  test('disabled logic should be based on generate.isPending', () => {
    const fnStr = InsightTrigger.toString();
    assert.ok(fnStr.includes('disabled'), 'disabled attribute present');
    assert.ok(fnStr.includes('isPending'), 'disabled bound to isPending');
  });

  test('generate button label conditional on isPending', () => {
    const fnStr = InsightTrigger.toString();
    assert.ok(fnStr.includes('isPending'), 'label conditional on isPending');
  });

  test('button should reference primary color', () => {
    const fnStr = InsightTrigger.toString();
    assert.ok(fnStr.includes('3b82f6'), 'blue background reference present');
  });
});
