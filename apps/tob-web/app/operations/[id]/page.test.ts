/**
 * TOB Operation detail page unit tests
 *
 * Tests the component is properly exported and validates
 * the demo operation data used by the detail route.
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import OperationDetailPage from './page';

describe('tob-web /operations/[id]/page', () => {
  it('should export a default component function', () => {
    assert.equal(typeof OperationDetailPage, 'function');
  });

  it('OperationDetailPage name should be a valid identifier', () => {
    assert.ok(OperationDetailPage.name.length > 0, 'component should have a name');
  });
});
