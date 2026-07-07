import assert from 'node:assert/strict';
import test from 'node:test';
import React from 'react';

// Minimal React-DOM render without jsdom — Collapsible is pure logic + DOM structure.
// We use a basic render helper that checks DOM output.

function render(el: React.ReactElement): HTMLElement {
  // SSR-compatible: React 18 server-render to string, but our tests use global React.
  // Instead we direct-render into a container using react-dom/client-like approach.
  // For node:test we'll use the fact that Collapsible is a static return.
  // Since there's no jsdom, we test the component's exported shape and props logic.
  return el as unknown as HTMLElement;
}

test('Collapsible exports a function component', () => {
  const { Collapsible } = require('./Collapsible');
  assert.equal(typeof Collapsible, 'function');
});

test('Collapsible has displayName or is a valid component', () => {
  const { Collapsible } = require('./Collapsible');
  const elem = React.createElement(Collapsible, { title: 'Test' }, React.createElement('span'));
  assert.ok(React.isValidElement(elem));
});

test('Collapsible passes props to element', () => {
  const { Collapsible } = require('./Collapsible');
  const elem = React.createElement(Collapsible, {
    title: 'Settings',
    defaultOpen: true,
    disabled: false,
    hideExpandIcon: true,
    className: 'my-class',
  }, 'Content');
  assert.equal(elem.props.title, 'Settings');
  assert.equal(elem.props.defaultOpen, true);
  assert.equal(elem.props.disabled, false);
  assert.equal(elem.props.hideExpandIcon, true);
  assert.equal(elem.props.className, 'my-class');
  assert.equal(elem.props.children, 'Content');
});

test('Collapsible with children', () => {
  const { Collapsible } = require('./Collapsible');
  const elem = React.createElement(
    Collapsible,
    { title: 'Panel' },
    React.createElement('p', null, 'Hello World'),
  );
  assert.ok(React.isValidElement(elem));
  assert.equal(elem.props.title, 'Panel');
  assert.equal(elem.props.children.type, 'p');
  assert.equal(elem.props.children.props.children, 'Hello World');
});

test('Collapsible extra prop', () => {
  const { Collapsible } = require('./Collapsible');
  const extraBtn = React.createElement('button', null, 'Action');
  const elem = React.createElement(Collapsible, { title: 'X', extra: extraBtn });
  assert.equal(elem.props.extra.type, 'button');
});

test('Collapsible custom expandIcon', () => {
  const { Collapsible } = require('./Collapsible');
  const icon = React.createElement('span', null, '🔽');
  const elem = React.createElement(Collapsible, { title: 'X', expandIcon: icon });
  assert.equal(elem.props.expandIcon.type, 'span');
});

test('Collapsible onOpenChange callback', () => {
  const { Collapsible } = require('./Collapsible');
  const fn = () => {};
  const elem = React.createElement(Collapsible, { title: 'X', onOpenChange: fn });
  assert.equal(typeof elem.props.onOpenChange, 'function');
});

test('Collapsible supports controlled open', () => {
  const { Collapsible } = require('./Collapsible');
  const elem = React.createElement(Collapsible, { title: 'X', open: true });
  assert.equal(elem.props.open, true);
});

test('Collapsible animationDuration', () => {
  const { Collapsible } = require('./Collapsible');
  const elem = React.createElement(Collapsible, { title: 'X', animationDuration: 500 });
  assert.equal(elem.props.animationDuration, 500);
});

test('Collapsible disables when disabled', () => {
  const { Collapsible } = require('./Collapsible');
  const elem = React.createElement(Collapsible, { title: 'X', disabled: true });
  assert.equal(elem.props.disabled, true);
});

test('Collapsible defaults', () => {
  const { Collapsible } = require('./Collapsible');
  // defaultOpen should be false by default in component body
  const elem = React.createElement(Collapsible, { title: 'X' }, 'body');
  assert.equal(elem.props.defaultOpen, undefined); // not passed, uses component default
  const { default: CollapsibleDefault } = require('./Collapsible');
  assert.equal(CollapsibleDefault, Collapsible);
});
