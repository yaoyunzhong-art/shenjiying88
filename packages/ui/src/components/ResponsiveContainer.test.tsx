import assert from 'node:assert/strict';
import test from 'node:test';

test('ResponsiveContainer exports', () => {
  const mod = require('./ResponsiveContainer');
  assert.equal(typeof mod.ResponsiveContainer, 'function');
  assert.equal(typeof mod.useResponsive, 'function');
  assert.equal(typeof mod.resolveBreakpoint, 'function');
  assert.equal(typeof mod.BREAKPOINTS, 'object');
});

test('ResponsiveContainer default export is same as named export', () => {
  const mod = require('./ResponsiveContainer');
  assert.equal(mod.default, mod.ResponsiveContainer);
});

test('resolveBreakpoint — xs (< 640)', () => {
  const { resolveBreakpoint } = require('./ResponsiveContainer');
  assert.equal(resolveBreakpoint(0), 'xs');
  assert.equal(resolveBreakpoint(320), 'xs');
  assert.equal(resolveBreakpoint(479), 'xs');
  assert.equal(resolveBreakpoint(480), 'xs'); // xs: 0-639
  assert.equal(resolveBreakpoint(639), 'xs');
});

test('resolveBreakpoint — sm (640-767)', () => {
  const { resolveBreakpoint } = require('./ResponsiveContainer');
  assert.equal(resolveBreakpoint(640), 'sm');
  assert.equal(resolveBreakpoint(700), 'sm');
  assert.equal(resolveBreakpoint(767), 'sm');
});

test('resolveBreakpoint — md (768-1023)', () => {
  const { resolveBreakpoint } = require('./ResponsiveContainer');
  assert.equal(resolveBreakpoint(768), 'md');
  assert.equal(resolveBreakpoint(900), 'md');
  assert.equal(resolveBreakpoint(1023), 'md');
});

test('resolveBreakpoint — lg (1024-1279)', () => {
  const { resolveBreakpoint } = require('./ResponsiveContainer');
  assert.equal(resolveBreakpoint(1024), 'lg');
  assert.equal(resolveBreakpoint(1200), 'lg');
  assert.equal(resolveBreakpoint(1279), 'lg');
});

test('resolveBreakpoint — xl (1280-1535)', () => {
  const { resolveBreakpoint } = require('./ResponsiveContainer');
  assert.equal(resolveBreakpoint(1280), 'xl');
  assert.equal(resolveBreakpoint(1440), 'xl');
  assert.equal(resolveBreakpoint(1535), 'xl');
});

test('resolveBreakpoint — 2xl (>= 1536)', () => {
  const { resolveBreakpoint } = require('./ResponsiveContainer');
  assert.equal(resolveBreakpoint(1536), '2xl');
  assert.equal(resolveBreakpoint(1920), '2xl');
  assert.equal(resolveBreakpoint(2560), '2xl');
  assert.equal(resolveBreakpoint(99999), '2xl');
});

test('BREAKPOINTS defines expected keys', () => {
  const { BREAKPOINTS } = require('./ResponsiveContainer');
  assert.equal(BREAKPOINTS.xs, 480);
  assert.equal(BREAKPOINTS.sm, 640);
  assert.equal(BREAKPOINTS.md, 768);
  assert.equal(BREAKPOINTS.lg, 1024);
  assert.equal(BREAKPOINTS.xl, 1280);
  assert.equal(BREAKPOINTS['2xl'], 1536);
});

test('BREAKPOINTS values are ordered ascending', () => {
  const { BREAKPOINTS } = require('./ResponsiveContainer');
  const keys = Object.keys(BREAKPOINTS) as (keyof typeof BREAKPOINTS)[];
  for (let i = 1; i < keys.length; i++) {
    assert.ok(
      BREAKPOINTS[keys[i]] > BREAKPOINTS[keys[i - 1]],
      `${keys[i]} should be larger than ${keys[i - 1]}`,
    );
  }
});

test('useResponsive is a function (React hook)', () => {
  const { useResponsive } = require('./ResponsiveContainer');
  assert.equal(typeof useResponsive, 'function');
});

test('ResponsiveContainer is a function (React component)', () => {
  const { ResponsiveContainer } = require('./ResponsiveContainer');
  assert.equal(typeof ResponsiveContainer, 'function');
});

test('ResponsiveContainer static props are accessible via type system', () => {
  const { BREAKPOINTS: bp } = require('./ResponsiveContainer');

  // Verify the component accepts known props by checking its source
  const src = require('fs').readFileSync(
    require('path').join(__dirname, 'ResponsiveContainer.tsx'),
    'utf-8',
  );

  // Should export the expected interface
  assert.ok(src.includes('ResponsiveContainerProps'));
  assert.ok(src.includes('asChild'));
  assert.ok(src.includes('observeResize'));
  assert.ok(src.includes('debounceMs'));
  assert.ok(src.includes('breakpoints:'));

  // Context hook is exported
  assert.ok(src.includes('useResponsive'));
  assert.ok(src.includes('ResponsiveContext'));
});
