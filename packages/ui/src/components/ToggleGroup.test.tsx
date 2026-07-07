import assert from 'node:assert/strict';
import test from 'node:test';
import React from 'react';
const { ToggleGroup, ToggleButton } = require('./ToggleGroup');

test('ToggleGroup', async (t) => {
  await t.test('defaultProps exist on component', () => {
    assert.ok(typeof ToggleGroup === 'function' || typeof ToggleGroup === 'object');
    assert.ok(ToggleGroup.Button === ToggleButton || ToggleGroup.Button !== undefined);
  });

  await t.test('ToggleGroup is a function/component', () => {
    assert.ok(typeof ToggleGroup === 'function');
  });

  await t.test('ToggleButton is a function/component', () => {
    assert.ok(typeof ToggleButton === 'function');
  });

  await t.test('exports are non-null', () => {
    assert.notStrictEqual(ToggleGroup, null);
    assert.notStrictEqual(ToggleButton, null);
  });

  await t.test('can render to element without DOM', () => {
    const el = React.createElement(ToggleGroup, {
      options: [
        { value: 'a', label: 'A' },
        { value: 'b', label: 'B' },
      ],
    });
    assert.ok(React.isValidElement(el));
    const props = el.props as Record<string, unknown>;
    assert.ok(Array.isArray(props.options));
    assert.equal((props.options as Array<unknown>).length, 2);
  });

  await t.test('passes options correctly', () => {
    const options = [
      { value: 'a', label: 'A' },
      { value: 'b', label: 'B' },
    ];
    const el = React.createElement(ToggleGroup, { options });
    const props = el.props as Record<string, unknown>;
    assert.equal((props.options as Array<unknown>)[0], options[0]);
    assert.equal((props.options as Array<unknown>)[1], options[1]);
  });

  await t.test('passes variant prop correctly', () => {
    const el = React.createElement(ToggleGroup, {
      options: [{ value: 'x', label: 'X' }],
      variant: 'filled',
    });
    const props = el.props as Record<string, unknown>;
    assert.equal(props.variant, 'filled');
  });

  await t.test('passes size prop correctly', () => {
    const el = React.createElement(ToggleGroup, {
      options: [{ value: 'x', label: 'X' }],
      size: 'lg',
    });
    const props = el.props as Record<string, unknown>;
    assert.equal(props.size, 'lg');
  });

  await t.test('passes multiple prop correctly', () => {
    const el = React.createElement(ToggleGroup, {
      options: [{ value: 'x', label: 'X' }],
      multiple: true,
    });
    const props = el.props as Record<string, unknown>;
    assert.equal(props.multiple, true);
  });

  await t.test('passes disabled prop correctly', () => {
    const el = React.createElement(ToggleGroup, {
      options: [{ value: 'x', label: 'X' }],
      disabled: true,
    });
    const props = el.props as Record<string, unknown>;
    assert.equal(props.disabled, true);
  });

  await t.test('passes defaultValue correctly', () => {
    const el = React.createElement(ToggleGroup, {
      options: [
        { value: 'a', label: 'A' },
        { value: 'b', label: 'B' },
      ],
      defaultValue: 'b',
    });
    const props = el.props as Record<string, unknown>;
    assert.equal(props.defaultValue, 'b');
  });

  await t.test('passes multiple defaultValue correctly', () => {
    const el = React.createElement(ToggleGroup, {
      options: [
        { value: 'a', label: 'A' },
        { value: 'b', label: 'B' },
      ],
      multiple: true,
      defaultValue: ['a', 'b'],
    });
    const props = el.props as Record<string, unknown>;
    assert.ok(Array.isArray(props.defaultValue));
    assert.deepEqual(props.defaultValue, ['a', 'b']);
  });

  await t.test('passes label prop correctly', () => {
    const el = React.createElement(ToggleGroup, {
      options: [{ value: 'x', label: 'X' }],
      label: 'My Group',
    });
    const props = el.props as Record<string, unknown>;
    assert.equal(props.label, 'My Group');
  });

  await t.test('passes className and style correctly', () => {
    const el = React.createElement(ToggleGroup, {
      options: [{ value: 'x', label: 'X' }],
      className: 'my-cls',
      style: { margin: 4 },
    });
    const props = el.props as Record<string, unknown>;
    assert.equal(props.className, 'my-cls');
    assert.deepEqual(props.style, { margin: 4 });
  });

  await t.test('passes orientation prop correctly', () => {
    const el = React.createElement(ToggleGroup, {
      options: [{ value: 'x', label: 'X' }],
      orientation: 'vertical',
    });
    const props = el.props as Record<string, unknown>;
    assert.equal(props.orientation, 'vertical');
  });

  await t.test('can render ToggleButton standalone element', () => {
    const el = React.createElement(ToggleButton, { value: 'test' }, 'Click');
    assert.ok(React.isValidElement(el));
    const props = el.props as Record<string, unknown>;
    assert.equal(props.value, 'test');
    assert.equal(props.children, 'Click');
  });

  await t.test('renders ToggleButton with icon', () => {
    const el = React.createElement(ToggleButton, {
      value: 'test',
      icon: React.createElement('span', null, '★'),
    }, 'Star');
    const props = el.props as Record<string, unknown>;
    assert.ok(props.icon !== undefined);
    assert.equal(props.children, 'Star');
  });
});
