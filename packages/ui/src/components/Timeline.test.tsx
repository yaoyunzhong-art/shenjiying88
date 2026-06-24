import React from 'react';

const assert = require('node:assert/strict');
const { describe, test } = require('node:test');

const { Timeline } = require('./Timeline');

const { createElement, Fragment } = React;

describe('Timeline', () => {
  test('renders empty state when no items', () => {
    const el = Timeline({ items: [], 'data-testid': 'tl' });
    assert.ok(el != null);
    assert.equal(el.props['data-testid'], 'tl');

    assert.ok(el.props.children != null);
    assert.equal(typeof el.props.children, 'string');
    assert.ok((el.props.children as string).includes('No timeline events'));
  });

  test('renders a single timeline item', () => {
    const items = [
      { key: 'a', heading: 'Order placed', subtitle: '2024-01-01' },
    ];
    const el = Timeline({ items, 'data-testid': 'tl' });
    assert.ok(el != null);

    const children = el.props.children as React.ReactElement[];
    assert.ok(Array.isArray(children));
    assert.equal(children.length, 1);

    const item = children[0]!;
    assert.equal(item.props['data-testid'], 'timeline-item-a');
  });

  test('renders multiple timeline items in order', () => {
    const items = [
      { key: 'a', heading: 'First' },
      { key: 'b', heading: 'Second' },
      { key: 'c', heading: 'Third' },
    ];
    const el = Timeline({ items, 'data-testid': 'tl' });
    const children = el.props.children as React.ReactElement[];
    assert.equal(children.length, 3);
    assert.equal(children[0]!.props['data-testid'], 'timeline-item-a');
    assert.equal(children[1]!.props['data-testid'], 'timeline-item-b');
    assert.equal(children[2]!.props['data-testid'], 'timeline-item-c');
  });

  test('highlights last item correctly (no connecting line)', () => {
    const items = [
      { key: 'a', heading: 'First' },
      { key: 'b', heading: 'Last' },
    ];
    const el = Timeline({ items, 'data-testid': 'tl' });
    const children = el.props.children as React.ReactElement[];

    // First item should have a connecting line div in its dot column
    const firstItem = children[0]!;
    const firstDotColumn = firstItem.props.children[0]!;
    // React preserves falsy children in the array; filter to real elements
    const firstDots = firstDotColumn.props.children.filter((c: unknown) => c != null && c !== false);
    assert.equal(firstDots.length, 2); // dot + line
    // Verify the second child is indeed a connecting line (div with borderLeft)
    assert.ok(firstDots[1]!.props.style.borderLeft != null);

    // Last item should only have dot (the falsy value from !isLast becomes false in React)
    const lastItem = children[1]!;
    const lastDotColumn = lastItem.props.children[0]!;
    const lastDots = lastDotColumn.props.children.filter((c: unknown) => c != null && c !== false);
    assert.equal(lastDots.length, 1); // only dot
  });

  test('applies variant styles correctly', () => {
    const items = [
      { key: 'a', heading: 'Success', variant: 'success' },
      { key: 'b', heading: 'Error', variant: 'error' },
      { key: 'c', heading: 'Warning', variant: 'warning' },
      { key: 'd', heading: 'Info', variant: 'info' },
      { key: 'e', heading: 'Default', variant: 'default' },
    ];

    const el = Timeline({ items, 'data-testid': 'tl' });
    const children = el.props.children as React.ReactElement[];

    children.forEach((child, idx) => {
      const dotColumn = child.props.children[0]!;
      const dot = dotColumn.props.children[0]!;
      assert.equal(dot.props['data-testid'], `timeline-dot-${items[idx]!.key}`);
      // Each variant should have a non-transparent backgroundColor
      assert.ok(
        dot.props.style.backgroundColor !== 'transparent',
        `variant ${items[idx]!.variant} should have non-transparent dot`,
      );
    });
  });

  test('renders pending items with dashed border and dimmed text', () => {
    const items = [
      { key: 'a', heading: 'Done', variant: 'success' as const },
      { key: 'b', heading: 'Coming soon', pending: true },
    ];

    const el = Timeline({ items, 'data-testid': 'tl' });
    const children = el.props.children as React.ReactElement[];

    // Pending item
    const pendingItem = children[1]!;
    const pendingDotColumn = pendingItem.props.children[0]!;
    const pendingDot = pendingDotColumn.props.children[0]!;

    assert.equal(pendingDot.props.style.backgroundColor, 'transparent');
    assert.ok(pendingDot.props.style.border.includes('dashed'), 'pending dot should be dashed');

    // Heading should be dimmed
    const pendingContent = pendingItem.props.children[1]!;
    const pendingHeading = pendingContent.props.children[0]!;
    assert.equal(pendingHeading.props.style.opacity, 0.6);
  });

  test('renders content and subtitle', () => {
    const items = [
      {
        key: 'a',
        heading: 'Payment received',
        subtitle: '2024-06-15 14:30',
        content: 'Customer paid ¥299 via WeChat',
      },
    ];

    const el = Timeline({ items, 'data-testid': 'tl' });
    const children = el.props.children as React.ReactElement[];
    const contentColumn = children[0]!.props.children[1]!;

    // Heading
    assert.equal(contentColumn.props.children[0]!.props['data-testid'], 'timeline-heading-a');
    assert.equal(contentColumn.props.children[0]!.props.children, 'Payment received');

    // Subtitle
    assert.equal(contentColumn.props.children[1]!.props['data-testid'], 'timeline-subtitle-a');
    assert.equal(contentColumn.props.children[1]!.props.children, '2024-06-15 14:30');

    // Content
    assert.equal(contentColumn.props.children[2]!.props['data-testid'], 'timeline-content-a');
    assert.equal(contentColumn.props.children[2]!.props.children, 'Customer paid ¥299 via WeChat');
  });

  test('handles items without optional fields gracefully', () => {
    const items = [
      { key: 'minimal', heading: 'Just a heading' },
    ];

    const el = Timeline({ items, 'data-testid': 'tl' });
    assert.ok(el != null);

    const children = el.props.children as React.ReactElement[];
    assert.equal(children.length, 1);
    const contentColumn = children[0]!.props.children[1]!;

    // Only heading should be rendered
    assert.equal(contentColumn.props.children[0]!.props.children, 'Just a heading');
  });

  test('renders all items when count is large', () => {
    const items = Array.from({ length: 20 }, (_, i) => ({
      key: `item-${i}`,
      heading: `Event ${i + 1}`,
    }));

    const el = Timeline({ items, 'data-testid': 'tl' });
    const children = el.props.children as React.ReactElement[];
    assert.equal(children.length, 20);
  });
});
