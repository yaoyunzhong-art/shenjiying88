import { describe, it, before } from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import { render, screen, cleanup } from '@testing-library/react';

let NotificationsPage;

describe('React render test with before', () => {
  before(async () => {
    const mod = await import('./page.tsx');
    NotificationsPage = mod.default;
  });

  it('renders without crashing', () => {
    const { container } = render(React.createElement(NotificationsPage));
    assert.ok(container);
    cleanup();
  });
});
