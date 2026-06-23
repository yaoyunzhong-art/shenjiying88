import React from 'react';

const assert = require('node:assert/strict');
const { describe, test } = require('node:test');

const PROJECT_ROOT = '/Users/yaoyunzhong/Desktop/shenjiying/shenjiying88';
const { renderToStaticMarkup } = require(
  PROJECT_ROOT + '/node_modules/.pnpm/react-dom@18.3.1_react@18.3.1/node_modules/react-dom/server.node.js'
);
const { WorkspaceBreadcrumb } = require('./WorkspaceBreadcrumb');

describe('WorkspaceBreadcrumb', () => {
  test('renders the canonical home > workspace > detail chain', () => {
    const html = renderToStaticMarkup(
      React.createElement(WorkspaceBreadcrumb, {
        workspaceLabel: '审计',
        workspaceHref: '/audit-trail',
        detailLabel: 'runtime.action.submitted'
      })
    );
    assert.match(html, /总览/);
    assert.match(html, /审计/);
    assert.match(html, /runtime\.action\.submitted/);
    assert.match(html, /aria-label="Breadcrumb"/);
    assert.match(html, /href="\/"/);
    assert.match(html, /href="\/audit-trail"/);
  });

  test('respects a custom home label and href', () => {
    const html = renderToStaticMarkup(
      React.createElement(WorkspaceBreadcrumb, {
        homeLabel: 'Backstage',
        homeHref: '/admin',
        workspaceLabel: 'Configuration',
        workspaceHref: '/configuration',
        detailLabel: 'Secret'
      })
    );
    assert.match(html, /Backstage/);
    assert.match(html, /href="\/admin"/);
  });

  test('inserts extra segments between workspace and detail when supplied', () => {
    const html = renderToStaticMarkup(
      React.createElement(WorkspaceBreadcrumb, {
        workspaceLabel: 'Configuration',
        workspaceHref: '/configuration',
        detailLabel: 'rotate-secret',
        extraSegments: [
          { label: 'Secret', href: '/configuration/secrets' }
        ]
      })
    );
    assert.match(html, /Configuration/);
    assert.match(html, /Secret/);
    assert.match(html, /rotate-secret/);
    assert.match(html, /href="\/configuration\/secrets"/);
  });

  test('omits intermediate label when set to empty string', () => {
    const html = renderToStaticMarkup(
      React.createElement(WorkspaceBreadcrumb, {
        workspaceLabel: 'Foundation',
        workspaceHref: '/foundation',
        detailLabel: 'trust-governance',
        intermediateLabel: ''
      })
    );
    assert.doesNotMatch(html, /详情/);
    assert.match(html, /Foundation/);
  });

  test('marks the final detail segment as the current page', () => {
    const html = renderToStaticMarkup(
      React.createElement(WorkspaceBreadcrumb, {
        workspaceLabel: 'Foundation',
        workspaceHref: '/foundation',
        detailLabel: 'trust-governance'
      })
    );
    assert.match(html, /aria-current="page"/);
    assert.match(html, /trust-governance/);
  });
});
