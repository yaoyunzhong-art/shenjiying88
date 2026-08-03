import { describe, it, afterEach } from 'node:test';
import assert from 'node:assert';
import { render, cleanup } from '@testing-library/react';

// Use global __testRequire to load page module as CJS
const Page = globalThis.__testRequire('./app/coupon-templates/page.tsx').default;
const React = globalThis.__testReact;

describe('coupon-templates - require render test', () => {
  afterEach(() => cleanup());

  it('R1. render loads as function', () => {
    assert.equal(typeof Page, 'function', 'Page should be function via __testRequire');
  });

  it('R2. renders without error', () => {
    const { container } = render(React.createElement(Page));
    assert.ok(container);
  });
});
