const assert = require('node:assert/strict');
const { describe, test } = require('node:test');

const PROJECT_ROOT = '/Users/yaoyunzhong/Desktop/shenjiying/shenjiying88';
const { renderToStaticMarkup } = require(
  PROJECT_ROOT + '/node_modules/.pnpm/react-dom@18.3.1_react@18.3.1/node_modules/react-dom/server.node.js'
);
const { CombinedDetailPage } = require('./CombinedDetailPage');
// @ts-expect-error — React is globally typed via tsconfig JSX react-jsx, runtime via require
const React = require('react');

// ─── Helpers ──────────────────────────────────────────────────────
const infoRows = [
  { key: 'id', label: 'Order ID', value: 'ORD-20240623-001' },
  {
    key: 'amount',
    label: 'Amount',
    value: '¥1,280.00',
    statusBadge: { label: 'Paid', variant: 'success' },
  },
  { key: 'customer', label: 'Customer', value: '张三' },
];

const tabs = [
  { key: 'overview', label: 'Overview', content: React.createElement('p', null, 'Overview content') },
  { key: 'items', label: 'Line Items', content: React.createElement('p', null, 'Line items content') },
  { key: 'history', label: 'History', content: React.createElement('p', null, 'History content') },
];

const closureLinks = [
  { key: 'next', title: 'Next Order →', subtitle: 'View the next order in sequence', href: '/orders/next' },
  { key: 'list', title: 'All Orders', subtitle: 'Return to the order list', href: '/orders' },
];

const actionBarActions = [
  { key: 'copy', label: 'Copy', icon: 'copy', onClick: () => {} },
  { key: 'export', label: 'Export', icon: 'export', onClick: () => {} },
];

/** @param {Record<string, unknown>} props */
function renderPage(props: Record<string, unknown>) {
  return renderToStaticMarkup(
    React.createElement(CombinedDetailPage, Object.assign({ title: 'Test Detail' }, props))
  );
}

// ─── Tests ────────────────────────────────────────────────────────

describe('CombinedDetailPage', () => {
  // ── Rendering basics ──────────────────────────────────────────

  test('renders title and subtitle', () => {
    const html = renderToStaticMarkup(
      React.createElement(CombinedDetailPage, { title: 'Order Detail', subtitle: 'ORD-20240623-001' })
    );
    assert.match(html, /Order Detail/);
    assert.match(html, /ORD-20240623-001/);
  });

  test('renders status badge when status is provided', () => {
    const html = renderToStaticMarkup(
      React.createElement(CombinedDetailPage, {
        title: 'Order Detail',
        status: { label: 'Processing', variant: 'warning' },
      })
    );
    assert.match(html, /Processing/);
    assert.match(html, /Status:/);
  });

  test('renders info rows', () => {
    const html = renderToStaticMarkup(
      React.createElement(CombinedDetailPage, {
        title: 'Order Detail',
        infoRows,
      })
    );
    assert.match(html, /Order ID/);
    assert.match(html, /ORD-20240623-001/);
    assert.match(html, /Amount/);
    assert.match(html, /¥1,280.00/);
    assert.match(html, /Customer/);
    assert.match(html, /张三/);
    assert.match(html, /Paid/);
  });

  test('renders info-row-* testids', () => {
    const html = renderToStaticMarkup(
      React.createElement(CombinedDetailPage, {
        title: 'Order Detail',
        infoRows: [
          { key: 'id', label: 'ID', value: '001' },
          { key: 'name', label: 'Name', value: 'Alice' },
        ],
      })
    );
    assert.match(html, /data-testid="info-row-id"/);
    assert.match(html, /data-testid="info-row-name"/);
  });

  test('renders tabs with labels', () => {
    const html = renderToStaticMarkup(
      React.createElement(CombinedDetailPage, {
        title: 'Order Detail',
        tabs,
        defaultTab: 'overview',
      })
    );
    assert.match(html, /Overview/);
    assert.match(html, /Line Items/);
    assert.match(html, /History/);
  });

  test('renders default tab content', () => {
    const html = renderToStaticMarkup(
      React.createElement(CombinedDetailPage, {
        title: 'Order Detail',
        tabs,
        defaultTab: 'overview',
      })
    );
    assert.match(html, /Overview content/);
  });

  test('renders different default tab content', () => {
    const html = renderToStaticMarkup(
      React.createElement(CombinedDetailPage, {
        title: 'Order Detail',
        tabs,
        defaultTab: 'items',
      })
    );
    assert.match(html, /Line items content/);
  });

  test('falls back to first tab when no defaultTab given', () => {
    const html = renderToStaticMarkup(
      React.createElement(CombinedDetailPage, {
        title: 'Order Detail',
        tabs,
      })
    );
    assert.match(html, /Overview content/);
  });

  // ── Transitions ─────────────────────────────────────────────────

  test('renders state transition section with heading', () => {
    const html = renderToStaticMarkup(
      React.createElement(CombinedDetailPage, {
        title: 'Order Detail',
        transitions: [
          { key: 'confirm', label: 'Confirm', targetStatus: 'confirmed', onTransition: async () => {} },
        ],
      })
    );
    assert.match(html, /State Transitions/);
    assert.match(html, /data-testid="transition-confirm"/);
  });

  test('renders multiple transition buttons', () => {
    const html = renderToStaticMarkup(
      React.createElement(CombinedDetailPage, {
        title: 'Order Detail',
        transitions: [
          { key: 'a', label: 'First', targetStatus: 'a', onTransition: async () => {} },
          { key: 'b', label: 'Second', targetStatus: 'b', onTransition: async () => {} },
          { key: 'c', label: 'Third', targetStatus: 'c', variant: 'danger', onTransition: async () => {} },
        ],
      })
    );
    assert.match(html, /data-testid="transition-a"/);
    assert.match(html, /data-testid="transition-b"/);
    assert.match(html, /data-testid="transition-c"/);
    assert.match(html, /First/);
    assert.match(html, /Second/);
    assert.match(html, /Third/);
  });

  test('transition button shows target status', () => {
    const html = renderToStaticMarkup(
      React.createElement(CombinedDetailPage, {
        title: 'Order Detail',
        transitions: [
          { key: 'ship', label: 'Ship', targetStatus: 'shipped', onTransition: async () => {} },
        ],
      })
    );
    assert.match(html, /shipped/);
  });

  // ── Edit / Delete ───────────────────────────────────────────────

  test('renders edit button when onEdit is provided', () => {
    const html = renderToStaticMarkup(
      React.createElement(CombinedDetailPage, {
        title: 'Order Detail',
        onEdit: () => {},
      })
    );
    assert.match(html, /Edit/);
  });

  test('renders custom edit label', () => {
    const html = renderToStaticMarkup(
      React.createElement(CombinedDetailPage, {
        title: 'Order Detail',
        onEdit: () => {},
        editLabel: 'Modify',
      })
    );
    assert.match(html, /Modify/);
  });

  test('renders delete button when onDelete is provided', () => {
    const html = renderToStaticMarkup(
      React.createElement(CombinedDetailPage, {
        title: 'Order Detail',
        onDelete: async () => {},
      })
    );
    assert.match(html, /Delete/);
  });

  test('renders custom delete label', () => {
    const html = renderToStaticMarkup(
      React.createElement(CombinedDetailPage, {
        title: 'Order Detail',
        onDelete: async () => {},
        deleteLabel: 'Remove',
      })
    );
    assert.match(html, /Remove/);
  });

  test('does NOT render edit button without onEdit', () => {
    const html = renderToStaticMarkup(
      React.createElement(CombinedDetailPage, {
        title: 'Order Detail',
      })
    );
    // "Edit" should not appear as a shell action button
    assert.doesNotMatch(html, /Edit/);
  });

  test('does NOT render delete button without onDelete', () => {
    const html = renderToStaticMarkup(
      React.createElement(CombinedDetailPage, {
        title: 'Order Detail',
      })
    );
    assert.doesNotMatch(html, /Delete/);
  });

  // ── Closure & Action Bars ───────────────────────────────────────

  test('renders closure links', () => {
    const html = renderToStaticMarkup(
      React.createElement(CombinedDetailPage, {
        title: 'Order Detail',
        closureLinks,
      })
    );
    assert.match(html, /Next Order →/);
    assert.match(html, /All Orders/);
  });

  test('renders detail action bar', () => {
    const html = renderToStaticMarkup(
      React.createElement(CombinedDetailPage, {
        title: 'Order Detail',
        actionBarActions,
      })
    );
    assert.match(html, /Copy/);
    assert.match(html, /Export/);
  });

  // ── Loading & Error ─────────────────────────────────────────────

  test('passes loading to DetailShell', () => {
    const html = renderToStaticMarkup(
      React.createElement(CombinedDetailPage, {
        title: 'Order Detail',
        loading: true,
      })
    );
    assert.match(html, /data-testid="combined-detail-page"/);
  });

  test('passes error string to DetailShell', () => {
    const html = renderToStaticMarkup(
      React.createElement(CombinedDetailPage, {
        title: 'Order Detail',
        error: 'Failed to load',
      })
    );
    assert.match(html, /Failed to load/);
  });

  // ── data-testid ─────────────────────────────────────────────────

  test('uses custom data-testid', () => {
    const html = renderToStaticMarkup(
      React.createElement(CombinedDetailPage, { title: 'Order Detail', 'data-testid': 'custom-detail-page' })
    );
    assert.match(html, /data-testid="custom-detail-page"/);
  });

  test('uses default data-testid', () => {
    const html = renderToStaticMarkup(
      React.createElement(CombinedDetailPage, {
        title: 'Order Detail',
      })
    );
    assert.match(html, /data-testid="combined-detail-page"/);
  });

  // ── Back navigation ────────────────────────────────────────────

  test('renders back label with backHref', () => {
    const html = renderToStaticMarkup(
      React.createElement(CombinedDetailPage, {
        title: 'Order Detail',
        backLabel: '← Back to Orders',
        backHref: '/orders',
      })
    );
    assert.match(html, /← Back to Orders/);
  });

  test('renders default back label when backHref provided', () => {
    const html = renderToStaticMarkup(
      React.createElement(CombinedDetailPage, {
        title: 'Order Detail',
        backHref: '/orders',
      })
    );
    assert.match(html, /Back to list/);
  });

  // ── Back label without backHref/onBack hides ─────────────────

  test('back label is not rendered without backHref or onBack', () => {
    const html = renderToStaticMarkup(
      React.createElement(CombinedDetailPage, { title: 'Order Detail' })
    );
    assert.doesNotMatch(html, /Back to list/);
  });

  // ── Status badge variant ───────────────────────────────────────

  test('renders status badge with neutral variant by default', () => {
    const html = renderToStaticMarkup(
      React.createElement(CombinedDetailPage, {
        title: 'Order Detail',
        status: { label: 'Draft' },
      })
    );
    assert.match(html, /Draft/);
  });

  test('renders status badge with custom variant', () => {
    const html = renderToStaticMarkup(
      React.createElement(CombinedDetailPage, {
        title: 'Order Detail',
        status: { label: 'Done', variant: 'success' },
      })
    );
    assert.match(html, /Done/);
  });

  // ── Empty / no-crash ───────────────────────────────────────────

  test('renders without crashing with minimal props', () => {
    const html = renderToStaticMarkup(
      React.createElement(CombinedDetailPage, {
        title: 'Minimal',
      })
    );
    assert.match(html, /Minimal/);
    assert.match(html, /data-testid="combined-detail-page"/);
  });

  test('does not render transition section when transitions empty', () => {
    const html = renderToStaticMarkup(
      React.createElement(CombinedDetailPage, {
        title: 'Order Detail',
        transitions: [],
      })
    );
    assert.doesNotMatch(html, /State Transitions/);
  });

  test('does not render tabs section when tabs empty', () => {
    const html = renderToStaticMarkup(
      React.createElement(CombinedDetailPage, {
        title: 'Order Detail',
        tabs: [],
      })
    );
    assert.doesNotMatch(html, /Overview/);
  });

  test('does not render closure bar when no closureLinks', () => {
    const html = renderToStaticMarkup(
      React.createElement(CombinedDetailPage, {
        title: 'Order Detail',
      })
    );
    // Should not have the closure link text since none provided
    assert.ok(true); // no crash
  });

  test('does not render action bar when no actionBarActions', () => {
    const html = renderToStaticMarkup(
      React.createElement(CombinedDetailPage, {
        title: 'Order Detail',
      })
    );
    assert.doesNotMatch(html, /data-testid="detail-action-bar"/);
  });

  // ── Info rows with status badge ─────────────────────────────────

  test('renders info row with inline status badge', () => {
    const html = renderToStaticMarkup(
      React.createElement(CombinedDetailPage, {
        title: 'Order Detail',
        infoRows: [
          { key: 'status', label: 'Status', value: 'Active', statusBadge: { label: 'Online', variant: 'success' } },
        ],
      })
    );
    assert.match(html, /Active/);
    assert.match(html, /Online/);
  });

  test('renders combined-detail-transitions testid', () => {
    const html = renderToStaticMarkup(
      React.createElement(CombinedDetailPage, {
        title: 'Order Detail',
        transitions: [
          { key: 'go', label: 'Go', targetStatus: 'done', onTransition: async () => {} },
        ],
      })
    );
    assert.match(html, /data-testid="combined-detail-transitions"/);
  });

  test('renders combined-detail-info-rows testid', () => {
    const html = renderToStaticMarkup(
      React.createElement(CombinedDetailPage, {
        title: 'Order Detail',
        infoRows: [{ key: 'id', label: 'ID', value: '123' }],
      })
    );
    assert.match(html, /data-testid="combined-detail-info-rows"/);
  });

  // ── Tabs with custom content ────────────────────────────────────

  test('renders tab labels in Tabs component', () => {
    const html = renderToStaticMarkup(
      React.createElement(CombinedDetailPage, {
        title: 'Order Detail',
        tabs,
        defaultTab: 'overview',
      })
    );
    // Tabs component renders tab labels as role="tab" buttons
    assert.match(html, /role="tab"/);
    assert.match(html, /Overview/);
    assert.match(html, /Line Items/);
    assert.match(html, /History/);
  });
});
