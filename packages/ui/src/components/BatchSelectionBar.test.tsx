import React from 'react';

const assert = require('node:assert/strict');
const { describe, test } = require('node:test');

const PROJECT_ROOT = '/Users/yaoyunzhong/Desktop/shenjiying/shenjiying88';
const { renderToStaticMarkup } = require(
  PROJECT_ROOT + '/node_modules/.pnpm/react-dom@18.3.1_react@18.3.1/node_modules/react-dom/server.node.js'
);
const { BatchSelectionBar } = require('./BatchSelectionBar');

describe('BatchSelectionBar', () => {
  const noop = () => {};

  // ---------- empty state ----------
  test('renders nothing when selectedCount is 0', () => {
    const html = renderToStaticMarkup(
      React.createElement(BatchSelectionBar, {
        selectedCount: 0,
        actions: [{ key: 'delete', label: 'Delete' }],
        onAction: noop,
        onClearSelection: noop,
      })
    );
    assert.doesNotMatch(html, /batch-selection-bar/);
  });

  // ---------- basic rendering ----------
  test('renders count label with default itemLabel', () => {
    const html = renderToStaticMarkup(
      React.createElement(BatchSelectionBar, {
        selectedCount: 3,
        actions: [{ key: 'delete', label: 'Delete' }],
        onAction: noop,
        onClearSelection: noop,
      })
    );
    assert.match(html, /3 items selected/);
    assert.match(html, /batch-selection-bar/);
    assert.match(html, /batch-selection-count/);
  });

  test('renders custom itemLabel in count', () => {
    const html = renderToStaticMarkup(
      React.createElement(BatchSelectionBar, {
        selectedCount: 5,
        itemLabel: 'orders',
        actions: [{ key: 'export', label: 'Export' }],
        onAction: noop,
        onClearSelection: noop,
      })
    );
    assert.match(html, /5 orders selected/);
  });

  test('renders "All N selected" when selectedCount equals totalCount', () => {
    const html = renderToStaticMarkup(
      React.createElement(BatchSelectionBar, {
        selectedCount: 10,
        totalCount: 10,
        itemLabel: 'users',
        actions: [{ key: 'delete', label: 'Delete' }],
        onAction: noop,
        onClearSelection: noop,
      })
    );
    assert.match(html, /All 10 users selected/);
  });

  test('does NOT show "All" when selectedCount lt totalCount', () => {
    const html = renderToStaticMarkup(
      React.createElement(BatchSelectionBar, {
        selectedCount: 3,
        totalCount: 20,
        itemLabel: 'users',
        actions: [{ key: 'delete', label: 'Delete' }],
        onAction: noop,
        onClearSelection: noop,
      })
    );
    assert.doesNotMatch(html, /All/);
    assert.match(html, /3 users selected/);
  });

  // ---------- clear selection button ----------
  test('renders "Clear selection" button', () => {
    const html = renderToStaticMarkup(
      React.createElement(BatchSelectionBar, {
        selectedCount: 2,
        actions: [{ key: 'archive', label: 'Archive' }],
        onAction: noop,
        onClearSelection: noop,
      })
    );
    assert.match(html, /Clear selection/);
    assert.match(html, /batch-selection-clear/);
  });

  // ---------- action buttons ----------
  test('renders action buttons with correct test ids', () => {
    const html = renderToStaticMarkup(
      React.createElement(BatchSelectionBar, {
        selectedCount: 1,
        actions: [
          { key: 'delete', label: 'Delete', variant: 'danger' },
          { key: 'export', label: 'Export CSV', variant: 'primary' },
        ],
        onAction: noop,
        onClearSelection: noop,
      })
    );
    assert.match(html, /batch-action-delete/);
    assert.match(html, /batch-action-export/);
    assert.match(html, /Delete/);
    assert.match(html, /Export CSV/);
  });

  // ---------- disabled action ----------
  test('renders disabled button with lower opacity', () => {
    const html = renderToStaticMarkup(
      React.createElement(BatchSelectionBar, {
        selectedCount: 1,
        actions: [
          { key: 'merge', label: 'Merge', disabled: true },
        ],
        onAction: noop,
        onClearSelection: noop,
      })
    );
    assert.match(html, /batch-action-merge/);
    assert.match(html, /Merge/);
    // disabled attribute should be present
    assert.match(html, /disabled=""/);
  });

  // ---------- requireConfirm adds ellipsis ----------
  test('appends "..." to label when requireConfirm is true', () => {
    const html = renderToStaticMarkup(
      React.createElement(BatchSelectionBar, {
        selectedCount: 1,
        actions: [
          { key: 'delete', label: 'Delete', requireConfirm: true, variant: 'danger' },
        ],
        onAction: noop,
        onClearSelection: noop,
      })
    );
    assert.match(html, /Delete\.\.\./);
  });

  // ---------- variant styles ----------
  test('renders danger variant with red background', () => {
    const html = renderToStaticMarkup(
      React.createElement(BatchSelectionBar, {
        selectedCount: 1,
        actions: [
          { key: 'delete', label: 'Delete', variant: 'danger' },
          { key: 'save', label: 'Save', variant: 'default' },
        ],
        onAction: noop,
        onClearSelection: noop,
      })
    );
    // Check that danger variant has red background inline style
    assert.match(html, /#dc2626/);
  });

  // ---------- aria attributes ----------
  test('renders with toolbar role and aria-label', () => {
    const html = renderToStaticMarkup(
      React.createElement(BatchSelectionBar, {
        selectedCount: 1,
        actions: [{ key: 'tag', label: 'Tag' }],
        onAction: noop,
        onClearSelection: noop,
      })
    );
    assert.match(html, /role="toolbar"/);
    assert.match(html, /aria-label="Batch selection actions"/);
  });

  // ---------- custom data-testid ----------
  test('respects custom data-testid', () => {
    const html = renderToStaticMarkup(
      React.createElement(BatchSelectionBar, {
        selectedCount: 1,
        actions: [{ key: 'x', label: 'X' }],
        onAction: noop,
        onClearSelection: noop,
        'data-testid': 'my-custom-bar',
      })
    );
    assert.match(html, /data-testid="my-custom-bar"/);
  });

  // ---------- icon rendering ----------
  test('renders icon inside action button', () => {
    const html = renderToStaticMarkup(
      React.createElement(BatchSelectionBar, {
        selectedCount: 1,
        actions: [
          {
            key: 'export',
            label: 'Export',
            icon: React.createElement('span', { 'data-testid': 'icon-export' }, '📤'),
          },
        ],
        onAction: noop,
        onClearSelection: noop,
      })
    );
    assert.match(html, /📤/);
    assert.match(html, /Export/);
  });

  // ---------- description / tooltip ----------
  test('sets title and aria-label when description is provided', () => {
    const html = renderToStaticMarkup(
      React.createElement(BatchSelectionBar, {
        selectedCount: 1,
        actions: [
          {
            key: 'bulk-delete',
            label: 'Delete',
            description: 'Permanently delete selected items',
          },
        ],
        onAction: noop,
        onClearSelection: noop,
      })
    );
    assert.match(html, /title="Permanently delete selected items"/);
    assert.match(html, /aria-label="Permanently delete selected items"/);
  });
});
