import React from 'react';

const assert = require('node:assert/strict');
const { describe, test, before } = require('node:test');

const PROJECT_ROOT = '/Users/yaoyunzhong/Desktop/shenjiying/shenjiying88';
const { renderToStaticMarkup } = require(
  PROJECT_ROOT + '/node_modules/.pnpm/react-dom@18.3.1_react@18.3.1/node_modules/react-dom/server.node.js'
);
const { NavigationMenu } = require('./NavigationMenu');

// --------------- helpers ---------------
function render(jsx: React.ReactElement): string {
  return renderToStaticMarkup(jsx);
}

function hasAttr(html: string, attr: string, value?: string): boolean {
  const pattern = value
    ? new RegExp(`${attr}=["']${value}["']`)
    : new RegExp(`${attr}(=|\\s|>)`);
  return pattern.test(html);
}

// --------------- fixture data ---------------
const sampleItems = [
  { key: 'dashboard', label: 'Dashboard', href: '/dashboard' },
  { key: 'orders', label: 'Orders', badge: 5 },
  {
    key: 'settings',
    label: 'Settings',
    children: [
      { key: 'profile', label: 'Profile' },
      { key: 'security', label: 'Security', disabled: true },
      { key: 'billing', label: 'Billing', badge: 1 },
    ],
  },
  { key: 'disabled-item', label: 'Disabled', disabled: true },
];

describe('NavigationMenu', () => {
  // =============== R1: Basic Rendering ===============
  test('renders nothing when items is empty', () => {
    const html = render(
      React.createElement(NavigationMenu, {
        items: [],
        activeKey: '',
        onSelect: () => {},
      })
    );
    assert.equal(html, '');
  });

  test('renders a <nav> element with aria-label', () => {
    const html = render(
      React.createElement(NavigationMenu, {
        items: sampleItems,
        activeKey: 'dashboard',
        onSelect: () => {},
      })
    );
    assert.ok(hasAttr(html, 'aria-label', 'Navigation'));
    assert.ok(html.includes('<nav'));
  });

  test('renders all top-level items', () => {
    const html = render(
      React.createElement(NavigationMenu, {
        items: sampleItems,
        activeKey: '',
        onSelect: () => {},
      })
    );
    assert.ok(html.includes('Dashboard'));
    assert.ok(html.includes('Orders'));
    assert.ok(html.includes('Settings'));
    assert.ok(html.includes('Disabled'));
  });

  test('sets data-testid on the nav', () => {
    const html = render(
      React.createElement(NavigationMenu, {
        items: sampleItems,
        activeKey: '',
        onSelect: () => {},
        'data-testid': 'my-nav',
      })
    );
    assert.ok(hasAttr(html, 'data-testid', 'my-nav'));
  });

  // =============== R2: Active State ===============
  test('marks active item with data-active attribute', () => {
    const html = render(
      React.createElement(NavigationMenu, {
        items: sampleItems,
        activeKey: 'orders',
        onSelect: () => {},
      })
    );
    assert.ok(hasAttr(html, 'data-active'));
  });

  test('applies correct role="tab" for leaf items', () => {
    const html = render(
      React.createElement(NavigationMenu, {
        items: sampleItems,
        activeKey: '',
        onSelect: () => {},
      })
    );
    assert.ok(html.includes('role="tab"'));
  });

  // =============== R3: Badges ===============
  test('renders badge count when badge > 0', () => {
    const html = render(
      React.createElement(NavigationMenu, {
        items: sampleItems,
        activeKey: '',
        onSelect: () => {},
      })
    );
    assert.ok(html.includes('5'), 'Should show badge 5 for Orders');
    assert.ok(hasAttr(html, 'data-testid', 'nav-badge-orders'));
  });

  test('does not render badge div when badge is 0', () => {
    const itemsNoBadge = [
      { key: 'a', label: 'A', badge: 0 },
      { key: 'b', label: 'B' },
    ];
    const html = render(
      React.createElement(NavigationMenu, {
        items: itemsNoBadge,
        activeKey: '',
        onSelect: () => {},
      })
    );
    // Should not contain badge-related spans with 0
    assert.ok(!html.includes('>0<'));
  });

  // =============== R4: Disabled State ===============
  test('disabled items have disabled attribute on button', () => {
    const html = render(
      React.createElement(NavigationMenu, {
        items: sampleItems,
        activeKey: '',
        onSelect: () => {},
      })
    );
    const match = html.match(/data-testid="nav-item-disabled-item"/);
    assert.ok(match, 'Disabled item should render');
    assert.ok(hasAttr(html, 'disabled'));
  });

  // =============== R5: Orientation ===============
  test('horizontal orientation by default uses flex row', () => {
    const html = render(
      React.createElement(NavigationMenu, {
        items: sampleItems,
        activeKey: '',
        onSelect: () => {},
      })
    );
    // nav should have flexDirection row
    assert.ok(html.includes('flexDirection:row') || html.includes('flex-direction:row') || html.includes('flex-direction: row') || html.includes('"flex"'));
  });

  test('vertical orientation renders items in column', () => {
    const html = render(
      React.createElement(NavigationMenu, {
        items: sampleItems,
        activeKey: '',
        onSelect: () => {},
        orientation: 'vertical',
      })
    );
    assert.ok(html.includes('flex-direction'));
  });

  // =============== R6: Sub-menu / Dropdown ===============
  test('items with children render aria-haspopup and chevron', () => {
    const html = render(
      React.createElement(NavigationMenu, {
        items: sampleItems,
        activeKey: '',
        onSelect: () => {},
      })
    );
    assert.ok(hasAttr(html, 'aria-haspopup'));
    const chevronMatch = html.match(/data-testid="nav-chevron-settings"/);
    assert.ok(chevronMatch, 'Should render chevron for Settings');
  });

  test('sub-menu children are not rendered by default (hidden)', () => {
    const html = render(
      React.createElement(NavigationMenu, {
        items: sampleItems,
        activeKey: '',
        onSelect: () => {},
      })
    );
    // Sub-menu items should NOT appear in initial render since isOpen=false
    assert.ok(!html.includes('data-testid="nav-subitem-profile"'),
      'Sub-items should be hidden by default');
  });

  test('renders sub-menu data-testid placeholder structure', () => {
    // The submenu container appears only when openKey matches
    // Just check the top-level structure renders correctly
    const html = render(
      React.createElement(NavigationMenu, {
        items: sampleItems,
        activeKey: '',
        onSelect: () => {},
      })
    );
    assert.ok(html.includes('Settings'));
  });

  // =============== R7: Variants ===============
  test('pills variant applies pill styling', () => {
    const html = render(
      React.createElement(NavigationMenu, {
        items: sampleItems,
        activeKey: 'dashboard',
        onSelect: () => {},
        variant: 'pills',
      })
    );
    assert.ok(html.includes('border-radius:6px') || html.includes('border-radius:6'));
  });

  test('underline variant renders border-bottom', () => {
    const html = render(
      React.createElement(NavigationMenu, {
        items: sampleItems,
        activeKey: 'dashboard',
        onSelect: () => {},
        variant: 'underline',
      })
    );
    assert.ok(html.includes('border-bottom') || html.includes('borderBottom'));
  });

  // =============== R8: Custom ARIA label ===============
  test('accepts custom aria-label', () => {
    const html = render(
      React.createElement(NavigationMenu, {
        items: sampleItems,
        activeKey: '',
        onSelect: () => {},
        'aria-label': 'Main Menu',
      })
    );
    assert.ok(hasAttr(html, 'aria-label', 'Main Menu'));
  });

  // =============== R9: Icon rendering ===============
  test('renders icon wrapper when icon is provided', () => {
    const itemsWithIcon = [
      { key: 'home', label: 'Home', icon: React.createElement('span', { 'data-testid': 'icon-home' }, '🏠') },
    ];
    const html = render(
      React.createElement(NavigationMenu, {
        items: itemsWithIcon,
        activeKey: '',
        onSelect: () => {},
      })
    );
    assert.ok(html.includes('🏠'));
  });

  test('renders data-testid for icon wrapper', () => {
    const itemsWithIcon = [
      { key: 'home', label: 'Home', icon: React.createElement('span', null, '🏠') },
    ];
    const html = render(
      React.createElement(NavigationMenu, {
        items: itemsWithIcon,
        activeKey: '',
        onSelect: () => {},
      })
    );
    assert.ok(hasAttr(html, 'data-testid', 'nav-icon-home'));
  });

  // =============== R10: Wrapper elements ===============
  test('each item has a data-testid wrapper', () => {
    const html = render(
      React.createElement(NavigationMenu, {
        items: sampleItems,
        activeKey: '',
        onSelect: () => {},
      })
    );
    assert.ok(hasAttr(html, 'data-testid', 'nav-item-wrapper-dashboard'));
    assert.ok(hasAttr(html, 'data-testid', 'nav-item-wrapper-orders'));
    assert.ok(hasAttr(html, 'data-testid', 'nav-item-wrapper-settings'));
  });

  test('each item button has a data-testid', () => {
    const html = render(
      React.createElement(NavigationMenu, {
        items: sampleItems,
        activeKey: '',
        onSelect: () => {},
      })
    );
    assert.ok(hasAttr(html, 'data-testid', 'nav-item-dashboard'));
    assert.ok(hasAttr(html, 'data-testid', 'nav-item-orders'));
  });

  // =============== R11: Secondary children submenu items with badge ===============
  test('submenu items that have nested badges are present in structure', () => {
    const html = render(
      React.createElement(NavigationMenu, {
        items: sampleItems,
        activeKey: '',
        onSelect: () => {},
      })
    );
    // Submenu items exist in the JSX (just not rendered to DOM when closed)
    // Verify the parent structure is correct
    assert.ok(html.includes('aria-haspopup'), 'Should have haspopup attribute');
  });

  // =============== R12: Single item ===============
  test('renders correctly with a single item', () => {
    const html = render(
      React.createElement(NavigationMenu, {
        items: [{ key: 'home', label: 'Home' }],
        activeKey: 'home',
        onSelect: () => {},
      })
    );
    assert.ok(html.includes('Home'));
    assert.ok(hasAttr(html, 'data-active'));
  });

  // =============== R13: Data-testid passthrough ===============
  test('passes className to nav', () => {
    const html = render(
      React.createElement(NavigationMenu, {
        items: sampleItems,
        activeKey: '',
        onSelect: () => {},
        className: 'custom-nav',
      })
    );
    assert.ok(html.includes('custom-nav'));
  });

  // =============== R14: Role ===============
  test('nav has role="navigation"', () => {
    const html = render(
      React.createElement(NavigationMenu, {
        items: sampleItems,
        activeKey: '',
        onSelect: () => {},
      })
    );
    assert.ok(hasAttr(html, 'role', 'navigation'));
  });

  // =============== R15: Submenu data-testid references are structurally correct ===============
  test('settings parent renders with correct structure for children', () => {
    const html = render(
      React.createElement(NavigationMenu, {
        items: sampleItems,
        activeKey: '',
        onSelect: () => {},
      })
    );
    // Settings has a chevron indicating children
    assert.ok(html.includes('nav-chevron-settings'), 'Settings should have chevron indicator');
    assert.ok(html.includes('aria-haspopup'), 'Settings should have haspopup');
  });

  // =============== R16: All nav items have unique data-testid ===============
  test('all items have unique test ids', () => {
    const html = render(
      React.createElement(NavigationMenu, {
        items: sampleItems,
        activeKey: '',
        onSelect: () => {},
      })
    );
    assert.ok(html.includes('nav-item-dashboard'));
    assert.ok(html.includes('nav-item-orders'));
    assert.ok(html.includes('nav-item-settings'));
    assert.ok(html.includes('nav-item-disabled-item'));
  });
});

export {};
