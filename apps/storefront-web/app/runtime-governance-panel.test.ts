/**
 * L1+L2 runtime-governance-panel.test.ts
 * 正例: 渲染RuntimeGovernancePanel组件、检查关键文本、属性传递、React.createElement
 * 反例: 无硬编码市场代码、无空渲染、评估未抛出错误
 * 边界: 所有传递的props不为空、渲染输出的HTML结构完整、多属性组合
 */
import assert from 'node:assert/strict';
import test from 'node:test';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { RuntimeGovernancePanel } from './components/runtime-governance-panel';

test('storefront runtime panel: renders shared runtime receipt read model', () => {
  const markup = renderToStaticMarkup(
    React.createElement(RuntimeGovernancePanel, {
      marketCode: 'cn-mainland',
      tenantCode: 'tenant-demo',
      brandCode: 'brand-demo',
      storeCode: 'store-001'
    })
  );

  assert.match(markup, /真实 Runtime 闭环/);
  assert.match(markup, /最近 Receipt/);
  assert.match(markup, /store-001/);
});

test('正例: 渲染结果包含div元素', () => {
  const markup = renderToStaticMarkup(
    React.createElement(RuntimeGovernancePanel, {
      marketCode: 'cn-mainland',
      tenantCode: 'tenant-demo',
      brandCode: 'brand-demo',
      storeCode: 'store-001'
    })
  );
  assert.ok(markup.length > 50, 'markup should be substantial');
  assert.ok(markup.includes('div') || markup.includes('span') || markup.includes('section'));
});

test('正例: 所有传参props传递成功', () => {
  const markup = renderToStaticMarkup(
    React.createElement(RuntimeGovernancePanel, {
      marketCode: 'cn-hongkong',
      tenantCode: 'tenant-prod',
      brandCode: 'brand-arcade',
      storeCode: 'store-099'
    })
  );
  assert.match(markup, /store-099/);
  assert.match(markup, /cn-hongkong/);
  assert.match(markup, /tenant-prod/);
  assert.match(markup, /brand-arcade/);
});

test('正例: 不需要额外的错误处理即可渲染', () => {
  assert.doesNotThrow(() => {
    renderToStaticMarkup(
      React.createElement(RuntimeGovernancePanel, {
        marketCode: 'cn-mainland',
        tenantCode: 'tenant-demo',
        brandCode: 'brand-demo',
        storeCode: 'store-001'
      })
    );
  });
});

test('反例: 不渲染空字符串', () => {
  const markup = renderToStaticMarkup(
    React.createElement(RuntimeGovernancePanel, {
      marketCode: 'cn-mainland',
      tenantCode: 'tenant-demo',
      brandCode: 'brand-demo',
      storeCode: 'store-001'
    })
  );
  assert.ok(markup.trim().length > 0, 'should not render empty markup');
});

test('反例: storeCode不能为空', () => {
  assert.throws(() => {
    renderToStaticMarkup(
      React.createElement(RuntimeGovernancePanel, {
        marketCode: 'cn-mainland',
        tenantCode: 'tenant-demo',
        brandCode: 'brand-demo',
        storeCode: ''
      })
    );
  }, /storeCode|empty|required|Error/, 'should throw when storeCode is empty');
});

test('边界: 不同storeCode渲染不同内容', () => {
  const markup1 = renderToStaticMarkup(
    React.createElement(RuntimeGovernancePanel, {
      marketCode: 'cn-mainland',
      tenantCode: 'tenant-demo',
      brandCode: 'brand-demo',
      storeCode: 'store-001'
    })
  );
  const markup2 = renderToStaticMarkup(
    React.createElement(RuntimeGovernancePanel, {
      marketCode: 'cn-mainland',
      tenantCode: 'tenant-demo',
      brandCode: 'brand-demo',
      storeCode: 'store-999'
    })
  );
  assert.ok(markup1.includes('store-001'), 'first markup should contain store-001');
  assert.ok(markup2.includes('store-999'), 'second markup should contain store-999');
  assert.notEqual(markup1, markup2, 'different storeCode should produce different markup');
});

test('边界: 渲染开销在合理范围内', () => {
  const start = performance.now();
  for (let i = 0; i < 10; i++) {
    renderToStaticMarkup(
      React.createElement(RuntimeGovernancePanel, {
        marketCode: 'cn-mainland',
        tenantCode: 'tenant-demo',
        brandCode: 'brand-demo',
        storeCode: `store-${String(i).padStart(3, '0')}`
      })
    );
  }
  const elapsed = performance.now() - start;
  assert.ok(elapsed < 500, `10 renders should complete within 500ms (took ${elapsed.toFixed(0)}ms)`);
});
