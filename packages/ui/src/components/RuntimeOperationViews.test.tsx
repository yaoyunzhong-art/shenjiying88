import React from 'react';

const assert = require('node:assert/strict');
const { describe, test } = require('node:test');

const PROJECT_ROOT = '/Users/yaoyunzhong/Desktop/shenjiying/shenjiying88';
const { renderToStaticMarkup } = require(
  PROJECT_ROOT + '/node_modules/.pnpm/react-dom@18.3.1_react@18.3.1/node_modules/react-dom/server.node.js'
);
const {
  RuntimeOperationsListPageSection,
  runtimeOperationListDemoPresets,
} = require('./RuntimeOperationViews');

const sampleOperations = Array.from({ length: 6 }, (_, index) => ({
  id: `op-${String(index + 1).padStart(4, '0')}`,
  type: index % 2 === 0 ? 'deploy' : 'rollback',
  targetId: `service-${index + 1}`,
  status: index % 3 === 0 ? 'running' : 'completed',
  createdAt: `2026-06-14T0${index}:00:00.000Z`,
  finishedAt: index % 3 === 0 ? undefined : `2026-06-14T0${index}:30:00.000Z`,
}));

describe('RuntimeOperationsListPageSection', () => {
  test('preset defaultPageSize and pageSizeOptions drive initial pagination', () => {
    const html = renderToStaticMarkup(
      React.createElement(RuntimeOperationsListPageSection, {
        title: 'Storefront runtime',
        operations: sampleOperations,
        preset: {
          ...runtimeOperationListDemoPresets.storefront,
          defaultPageSize: 2,
          pageSizeOptions: [2, 4, 6],
        },
      })
    );

    assert.ok(html.includes('op-0001'));
    assert.ok(html.includes('op-0002'));
    assert.ok(!html.includes('op-0003'));
    assert.ok(html.includes('>2<'));
    assert.ok(html.includes('>4<'));
    assert.ok(html.includes('>6<'));
  });

  test('renders runtime status section title from preset labels', () => {
    const html = renderToStaticMarkup(
      React.createElement(RuntimeOperationsListPageSection, {
        title: 'ToB runtime',
        operations: sampleOperations,
        preset: runtimeOperationListDemoPresets.tob,
      })
    );

    assert.ok(html.includes('执行状态'));
    assert.ok(html.includes('操作类型'));
  });
});
