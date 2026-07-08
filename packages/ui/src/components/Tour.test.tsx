import assert from 'node:assert/strict';
import test from 'node:test';
import React from 'react';
const { Tour } = require('./Tour');

const PROJECT_ROOT = '/Users/yaoyunzhong/Desktop/shenjiying/shenjiying88';
const { renderToStaticMarkup } = require(
  PROJECT_ROOT + '/node_modules/.pnpm/react-dom@18.3.1_react@18.3.1/node_modules/react-dom/server.node.js'
);

const defaultSteps: React.ComponentProps<typeof Tour>['steps'] = [
  { targetSelector: '#step-1', title: '第一步', description: '这是第一步的描述' },
  { targetSelector: '#step-2', title: '第二步', description: '这是第二步的描述' },
  { targetSelector: '#step-3', title: '第三步', description: '最后一步' },
];

function renderTour(props: Record<string, unknown> = {}) {
  const merged = { open: true, steps: defaultSteps, onClose: () => {}, ...props };
  return renderToStaticMarkup(React.createElement(Tour, merged));
}

test('Tour: renders nothing when closed', () => {
  assert.equal(renderTour({ open: false }), '');
});

test('Tour: renders first step title when open', () => {
  const html = renderTour();
  assert.ok(html.includes('第一步'));
  assert.ok(html.includes('这是第一步的描述'));
});

test('Tour: shows progress indicator', () => {
  const html = renderTour();
  assert.ok(html.includes('1 / 3'));
});

test('Tour: shows next and skip buttons on first step', () => {
  const html = renderTour();
  assert.ok(html.includes('下一步'));
  assert.ok(html.includes('跳过'));
});

test('Tour: shows "完成" on last step', () => {
  const html = renderTour({ initialStep: 2 });
  assert.ok(html.includes('完成'));
  assert.ok(!html.includes('下一步'));
});

test('Tour: does not show progress text when showProgress is false', () => {
  const html = renderTour({ showProgress: false });
  assert.ok(!html.includes('1 / 3'));
});

test('Tour: does not show action buttons when showActions is false', () => {
  const html = renderTour({ showActions: false });
  assert.ok(!html.includes('下一步'));
  assert.ok(!html.includes('完成'));
  assert.ok(!html.includes('跳过'));
  assert.ok(!html.includes('上一步'));
});

test('Tour: renders with center style when no target element', () => {
  const steps = [{ targetSelector: '#none', title: 'Center', description: 'Desc' }];
  const html = renderTour({ steps });
  assert.ok(html.includes('Center'));
});

test('Tour: uses doneText on last step', () => {
  const steps = [
    { targetSelector: '#s1', title: 'Step1', description: 'D1' },
    { targetSelector: '#s2', title: 'Step2', description: 'D2', doneText: '搞定' },
  ];
  const html = renderTour({ steps, initialStep: 1 });
  assert.ok(html.includes('搞定'));
});

test('Tour: uses nextText on non-last step', () => {
  const steps = [
    { targetSelector: '#s1', title: 'Step1', description: 'D1', nextText: '继续' },
    { targetSelector: '#s2', title: 'Step2', description: 'D2' },
  ];
  const html = renderTour({ steps, initialStep: 0 });
  assert.ok(html.includes('继续'));
});

test('Tour: 2-step tour shows correct progress', () => {
  const steps = [
    { targetSelector: '#s1', title: 'A', description: 'DA' },
    { targetSelector: '#s2', title: 'B', description: 'DB' },
  ];
  assert.ok(renderTour({ steps, initialStep: 0 }).includes('1 / 2'));
  assert.ok(renderTour({ steps, initialStep: 1 }).includes('2 / 2'));
});

test('Tour: renders mask overlay', () => {
  const html = renderTour();
  assert.ok(html.includes('rgba(0,0,0,0.5)'));
  assert.ok(html.includes('z-index:9999'));
});

test('Tour: renders stepper progress on single step', () => {
  const steps = [{ targetSelector: '#s1', title: 'Only', description: 'Just one step' }];
  const html = renderTour({ steps });
  assert.ok(html.includes('1 / 1'));
  // single step = last step, shows "完成"
  assert.ok(html.includes('完成'));
  // no prev button (isFirst=true)
  assert.ok(!html.includes('上一步'));
  // no skip by default on last
  assert.ok(!html.includes('跳过'));
});
