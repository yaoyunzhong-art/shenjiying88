const assert = require('node:assert/strict');
const { describe, test } = require('node:test');
const React = require('react');

const PROJECT_ROOT = '/Users/yaoyunzhong/Desktop/shenjiying/shenjiying88';
const { renderToStaticMarkup } = require(
  PROJECT_ROOT + '/node_modules/.pnpm/react-dom@18.3.1_react@18.3.1/node_modules/react-dom/server.node.js'
);

const { ViewModelProvider } = require('./ViewModelProvider');

describe('ViewModelProvider', () => {
  test('renders children with initial tenantId and userId', () => {
    const html = renderToStaticMarkup(
      React.createElement(ViewModelProvider, {
        initialTenantId: 'tenant-001',
        initialUserId: 'user-001',
        children: React.createElement('div', null, '内容')
      })
    );
    assert.match(html, /内容/);
    assert.match(html, /data-tenant-id="tenant-001"/);
    assert.match(html, /data-user-id="user-001"/);
  });

  test('renders with empty tenantId and userId', () => {
    const html = renderToStaticMarkup(
      React.createElement(ViewModelProvider, {
        initialTenantId: '',
        initialUserId: '',
        children: React.createElement('div', null, 'empty')
      })
    );
    assert.match(html, /empty/);
    assert.match(html, /data-tenant-id=""/);
    assert.match(html, /data-user-id=""/);
  });

  test('renders with complex children structure', () => {
    const html = renderToStaticMarkup(
      React.createElement(ViewModelProvider, {
        initialTenantId: 'tenant-002',
        initialUserId: 'user-002',
        children: React.createElement('section', null,
          React.createElement('h1', null, 'Dashboard'),
          React.createElement('p', null, 'Welcome to the dashboard')
        )
      })
    );
    assert.match(html, /Dashboard/);
    assert.match(html, /Welcome to the dashboard/);
    assert.match(html, /data-tenant-id="tenant-002"/);
  });

  test('renders with component references as children', () => {
    function ChildComponent({ text }: { text: string }) {
      return React.createElement('span', null, `Hello ${text}`);
    }
    const html = renderToStaticMarkup(
      React.createElement(ViewModelProvider, {
        initialTenantId: 'tenant-003',
        initialUserId: 'user-003',
        children: React.createElement(ChildComponent, { text: 'World' })
      })
    );
    assert.match(html, /Hello World/);
  });

  test('provider span has display contents style', () => {
    const html = renderToStaticMarkup(
      React.createElement(ViewModelProvider, {
        initialTenantId: 'tenant-004',
        initialUserId: 'user-004',
        children: React.createElement('div', null, 'test')
      })
    );
    assert.match(html, /display:contents/);
  });
});
