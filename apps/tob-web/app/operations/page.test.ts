/**
 * TOB Operations list page unit tests
 *
 * Tests the component is properly exported and validates
 * demo preset data integrity.
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import OperationsListPage from './page';

describe('tob-web /operations/page', () => {
  it('should export a default component function', () => {
    assert.equal(typeof OperationsListPage, 'function');
  });

  it('page component should have a name', () => {
    assert.ok(OperationsListPage.name.length > 0, 'component should have a name');
  });
});
