import assert from 'node:assert/strict';
import test from 'node:test';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { RuntimeGovernancePanel } from './components/runtime-governance-panel';

test('admin runtime panel: renders shared runtime receipt read model', () => {
  const markup = renderToStaticMarkup(
    React.createElement(RuntimeGovernancePanel, {
      tenantContext: {
        tenantId: 'tenant-demo',
        brandId: 'brand-demo',
        storeId: 'store-001',
        marketCode: 'cn-mainland'
      }
    })
  );

  assert.match(markup, /真实 Runtime 闭环/);
  assert.match(markup, /最近 Receipt/);
  assert.match(markup, /tenant-demo/);
});
