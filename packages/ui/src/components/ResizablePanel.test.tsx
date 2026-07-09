import React from 'react';

const assert = require('node:assert/strict');
const { describe, test } = require('node:test');
const { renderToStaticMarkup } = require('react-dom/server');
const { ResizablePanel } = require('./ResizablePanel');

describe('ResizablePanel', () => {
  test('renders left and right panels', () => {
    const html = renderToStaticMarkup(
      React.createElement(ResizablePanel, {
        left: React.createElement('div', { 'data-testid': 'left' }, '左'),
        right: React.createElement('div', { 'data-testid': 'right' }, '右'),
      })
    );
    assert.ok(html.includes('左'));
    assert.ok(html.includes('右'));
    assert.ok(html.includes('separator'));
  });

  test('horizontal direction by default', () => {
    const html = renderToStaticMarkup(
      React.createElement(ResizablePanel, {
        left: React.createElement('div', null, 'L'),
        right: React.createElement('div', null, 'R'),
      })
    );
    assert.ok(html.includes('flex-direction:row'));
  });

  test('vertical direction', () => {
    const html = renderToStaticMarkup(
      React.createElement(ResizablePanel, {
        direction: 'vertical',
        left: React.createElement('div', null, 'L'),
        right: React.createElement('div', null, 'R'),
      })
    );
    assert.ok(html.includes('flex-direction:column'));
  });

  test('uses default ratio 0.5', () => {
    const html = renderToStaticMarkup(
      React.createElement(ResizablePanel, {
        left: React.createElement('div', null, 'L'),
        right: React.createElement('div', null, 'R'),
      })
    );
    // Should have calc(50% for left panel)
    assert.ok(html.includes('calc(50%'));
  });

  test('applies custom defaultRatio', () => {
    const html = renderToStaticMarkup(
      React.createElement(ResizablePanel, {
        defaultRatio: 0.3,
        left: React.createElement('div', null, 'L'),
        right: React.createElement('div', null, 'R'),
      })
    );
    assert.ok(html.includes('calc(30%'));
  });

  test('clamps ratio to minRatio', () => {
    const html = renderToStaticMarkup(
      React.createElement(ResizablePanel, {
        defaultRatio: 0.05,
        minRatio: 0.1,
        maxRatio: 0.9,
        left: React.createElement('div', null, 'L'),
        right: React.createElement('div', null, 'R'),
      })
    );
    // Initial ratio uses defaultRatio which is 0.05, clamped to minRatio=0.1
    assert.ok(html.includes('calc(10%'));
    // Right panel gets remaining 90%
    assert.ok(html.includes('calc(90%'));
  });

  test('separator has role and aria attributes', () => {
    const html = renderToStaticMarkup(
      React.createElement(ResizablePanel, {
        left: React.createElement('div', null, 'L'),
        right: React.createElement('div', null, 'R'),
      })
    );
    assert.ok(html.includes('role="separator"'));
    assert.ok(html.includes('aria-orientation="horizontal"'));
    assert.ok(html.includes('aria-label'));
    assert.ok(html.includes('aria-valuenow'));
    assert.ok(html.includes('aria-valuemin'));
    assert.ok(html.includes('aria-valuemax'));
  });

  test('custom className', () => {
    const html = renderToStaticMarkup(
      React.createElement(ResizablePanel, {
        className: 'my-panel',
        left: React.createElement('div', null, 'L'),
        right: React.createElement('div', null, 'R'),
      })
    );
    assert.ok(html.includes('my-panel'));
  });

  test('custom handleSize', () => {
    const html = renderToStaticMarkup(
      React.createElement(ResizablePanel, {
        handleSize: 8,
        left: React.createElement('div', null, 'L'),
        right: React.createElement('div', null, 'R'),
      })
    );
    // Handle width should be 8
    assert.ok(html.includes('width:8'));
  });

  test('custom handle label', () => {
    const html = renderToStaticMarkup(
      React.createElement(ResizablePanel, {
        handleLabel: '拉伸面板',
        left: React.createElement('div', null, 'L'),
        right: React.createElement('div', null, 'R'),
      })
    );
    assert.ok(html.includes('拉伸面板'));
  });

  test('vertical handle orientation', () => {
    const html = renderToStaticMarkup(
      React.createElement(ResizablePanel, {
        direction: 'vertical',
        left: React.createElement('div', null, 'L'),
        right: React.createElement('div', null, 'R'),
      })
    );
    assert.ok(html.includes('aria-orientation="vertical"'));
  });

  test('right panel has calc with remaining ratio', () => {
    const html = renderToStaticMarkup(
      React.createElement(ResizablePanel, {
        defaultRatio: 0.3,
        left: React.createElement('div', null, 'L'),
        right: React.createElement('div', null, 'R'),
      })
    );
    // Should have calc(70% - ...) for right panel
    assert.ok(html.includes('calc(70%'));
  });
});
