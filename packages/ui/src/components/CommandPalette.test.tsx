import React from 'react';

const assert = require('node:assert/strict');
const { describe, test, beforeEach, afterEach } = require('node:test');

const PROJECT_ROOT = '/Users/yaoyunzhong/Desktop/shenjiying/shenjiying88';
const { renderToStaticMarkup } = require(
  PROJECT_ROOT + '/node_modules/.pnpm/react-dom@18.3.1_react@18.3.1/node_modules/react-dom/server.node.js',
);
const { renderToString } = require(
  PROJECT_ROOT + '/node_modules/.pnpm/react-dom@18.3.1_react@18.3.1/node_modules/react-dom/server.node.js',
);

const { CommandPalette } = require('./CommandPalette');

// ---- helpers ----

function makeCommands() {
  return [
    { id: 'new-store', label: 'New Store', description: 'Create a new store', shortcut: '⌘N', group: 'Stores' },
    { id: 'edit-store', label: 'Edit Store', description: 'Modify store details', shortcut: '⌘E', group: 'Stores' },
    { id: 'delete-store', label: 'Delete Store', shortcut: '⌘⌫', group: 'Stores' },
    { id: 'member-list', label: 'Member List', description: 'View all members', group: 'Members' },
    { id: 'settings', label: 'Settings', description: 'Open system settings', shortcut: '⌘,' },
    { id: 'disabled-cmd', label: 'Disabled Command', description: 'Should not be selectable', disabled: true },
  ];
}

// ---- Tests ----

describe('CommandPalette', () => {
  // ---- render states ----

  test('renders nothing when closed', () => {
    const html = renderToStaticMarkup(
      React.createElement(CommandPalette, {
        commands: makeCommands(),
        open: false,
        onClose: () => {},
        onSelect: () => {},
      }),
    );
    assert.strictEqual(html, '');
  });

  test('renders all commands when open', () => {
    const html = renderToStaticMarkup(
      React.createElement(CommandPalette, {
        commands: makeCommands(),
        open: true,
        onClose: () => {},
        onSelect: () => {},
      }),
    );
    assert.ok(html.includes('New Store'));
    assert.ok(html.includes('Edit Store'));
    assert.ok(html.includes('Delete Store'));
    assert.ok(html.includes('Member List'));
    assert.ok(html.includes('Settings'));
  });

  test('shows group headers', () => {
    const html = renderToStaticMarkup(
      React.createElement(CommandPalette, {
        commands: makeCommands(),
        open: true,
        onClose: () => {},
        onSelect: () => {},
      }),
    );
    assert.ok(html.includes('Stores'));
    assert.ok(html.includes('Members'));
  });

  test('renders shortcuts', () => {
    const html = renderToStaticMarkup(
      React.createElement(CommandPalette, {
        commands: makeCommands(),
        open: true,
        onClose: () => {},
        onSelect: () => {},
      }),
    );
    assert.ok(html.includes('⌘N'));
    assert.ok(html.includes('⌘E'));
    assert.ok(html.includes('⌘,'));
  });

  test('renders with open state shows dialog role', () => {
    const html = renderToStaticMarkup(
      React.createElement(CommandPalette, {
        commands: makeCommands(),
        open: true,
        onClose: () => {},
        onSelect: () => {},
      }),
    );
    assert.ok(html.includes('role="dialog"'));
    assert.ok(html.includes('aria-modal="true"'));
    assert.ok(html.includes('aria-label="Command palette"'));
  });

  // ---- disabled items ----

  test('renders disabled command', () => {
    const html = renderToStaticMarkup(
      React.createElement(CommandPalette, {
        commands: makeCommands(),
        open: true,
        onClose: () => {},
        onSelect: () => {},
      }),
    );
    assert.ok(html.includes('Disabled Command'));
    assert.ok(html.includes('aria-disabled="true"'));
  });

  // ---- empty state ----

  test('shows empty message when no commands', () => {
    const html = renderToStaticMarkup(
      React.createElement(CommandPalette, {
        commands: [],
        open: true,
        onClose: () => {},
        onSelect: () => {},
        emptyMessage: 'No actions available',
      }),
    );
    assert.ok(html.includes('No actions available'));
  });

  test('shows default empty message for empty commands', () => {
    const html = renderToStaticMarkup(
      React.createElement(CommandPalette, {
        commands: [],
        open: true,
        onClose: () => {},
        onSelect: () => {},
      }),
    );
    assert.ok(html.includes('No matching commands.'));
  });

  // ---- custom placeholder ----

  test('uses custom placeholder', () => {
    const html = renderToStaticMarkup(
      React.createElement(CommandPalette, {
        commands: makeCommands(),
        open: true,
        onClose: () => {},
        onSelect: () => {},
        placeholder: 'Find anything…',
      }),
    );
    assert.ok(html.includes('Find anything…'));
  });

  test('uses default placeholder', () => {
    const html = renderToStaticMarkup(
      React.createElement(CommandPalette, {
        commands: makeCommands(),
        open: true,
        onClose: () => {},
        onSelect: () => {},
      }),
    );
    assert.ok(html.includes('Type a command or search'));
  });

  // ---- footer hints ----

  test('renders footer navigation hints', () => {
    const html = renderToStaticMarkup(
      React.createElement(CommandPalette, {
        commands: makeCommands(),
        open: true,
        onClose: () => {},
        onSelect: () => {},
      }),
    );
    assert.ok(html.includes('Navigate'));
    assert.ok(html.includes('Select'));
    assert.ok(html.includes('Close'));
  });

  // ---- className ----

  test('applies custom className to overlay', () => {
    const html = renderToStaticMarkup(
      React.createElement(CommandPalette, {
        commands: makeCommands(),
        open: true,
        onClose: () => {},
        onSelect: () => {},
        className: 'my-palette',
      }),
    );
    assert.ok(html.includes('my-palette'));
  });

  // ---- search input ----

  test('renders search input with aria-label', () => {
    const html = renderToStaticMarkup(
      React.createElement(CommandPalette, {
        commands: makeCommands(),
        open: true,
        onClose: () => {},
        onSelect: () => {},
      }),
    );
    assert.ok(html.includes('aria-label="Search commands"'));
    assert.ok(html.includes('type="text"'));
  });

  // ---- close button ----

  test('renders close button with aria-label', () => {
    const html = renderToStaticMarkup(
      React.createElement(CommandPalette, {
        commands: makeCommands(),
        open: true,
        onClose: () => {},
        onSelect: () => {},
      }),
    );
    assert.ok(html.includes('aria-label="Close"'));
  });

  // ---- icons ----

  test('renders command icons when provided', () => {
    const html = renderToStaticMarkup(
      React.createElement(CommandPalette, {
        commands: [
          { id: 'a', label: 'With Icon', icon: React.createElement('span', { 'data-testid': 'ico' }, '⭐') },
        ],
        open: true,
        onClose: () => {},
        onSelect: () => {},
      }),
    );
    assert.ok(html.includes('⭐'));
  });

  // ---- group ordering: ungrouped first ----

  test('renders ungrouped commands before grouped', () => {
    const commands = [
      { id: 'a', label: 'Ungrouped First' },
      { id: 'b', label: 'Grouped Item', group: 'Admin' },
    ];
    const html = renderToStaticMarkup(
      React.createElement(CommandPalette, {
        commands,
        open: true,
        onClose: () => {},
        onSelect: () => {},
      }),
    );
    const ugIdx = html.indexOf('Ungrouped First');
    const gIdx = html.indexOf('Grouped Item');
    assert.ok(ugIdx < gIdx, 'Ungrouped command should appear before grouped command');
  });

  // ---- maxHeight prop ----

  test('applies maxHeight to list container', () => {
    const html = renderToStaticMarkup(
      React.createElement(CommandPalette, {
        commands: makeCommands(),
        open: true,
        onClose: () => {},
        onSelect: () => {},
        maxHeight: 300,
      }),
    );
    // The style should contain max-height:300px
    assert.ok(html.includes('max-height:300px') || html.includes('maxHeight'));
  });

  // ---- description rendering ----

  test('renders command descriptions', () => {
    const html = renderToStaticMarkup(
      React.createElement(CommandPalette, {
        commands: makeCommands(),
        open: true,
        onClose: () => {},
        onSelect: () => {},
      }),
    );
    assert.ok(html.includes('Create a new store'));
    assert.ok(html.includes('Modify store details'));
    assert.ok(html.includes('View all members'));
    assert.ok(html.includes('Open system settings'));
  });

  // ---- shortcut rendering across commands ----

  test('renders shortcut ⌘⌫ for Delete Store', () => {
    const html = renderToStaticMarkup(
      React.createElement(CommandPalette, {
        commands: makeCommands(),
        open: true,
        onClose: () => {},
        onSelect: () => {},
      }),
    );
    assert.ok(html.includes('⌘⌫'));
  });

  // ---- type exports ----

  test('type exports exist', () => {
    assert.ok(typeof CommandPalette === 'function', 'CommandPalette should be a function');
  });

  // ---- role="option" on items ----

  test('renders list items with role option', () => {
    const html = renderToStaticMarkup(
      React.createElement(CommandPalette, {
        commands: makeCommands(),
        open: true,
        onClose: () => {},
        onSelect: () => {},
      }),
    );
    const optionCount = (html.match(/role="option"/g) || []).length;
    assert.strictEqual(optionCount, 6, 'Should have 6 option roles (one per command)');
  });

  // ---- search icon ----

  test('renders search icon SVG', () => {
    const html = renderToStaticMarkup(
      React.createElement(CommandPalette, {
        commands: makeCommands(),
        open: true,
        onClose: () => {},
        onSelect: () => {},
      }),
    );
    assert.ok(html.includes('viewBox="0 0 24 24"'));
  });
});
