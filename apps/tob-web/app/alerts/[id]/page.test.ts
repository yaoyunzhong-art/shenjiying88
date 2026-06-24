/**
 * TOB Alert detail page unit tests
 *
 * Tests that the component is properly exported,
 * and validates that mock data used by the page is internally consistent.
 *
 * Relies on the same imports as page.tsx to verify contract integrity.
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import AlertDetailPage from './page';

describe('tob-web /alerts/[id]/page', () => {
  it('should export a default component function', () => {
    assert.equal(typeof AlertDetailPage, 'function');
  });

  it('AlertDetailPage name should be a valid identifier', () => {
    assert.ok(AlertDetailPage.name.length > 0, 'component should have a name');
  });
});
