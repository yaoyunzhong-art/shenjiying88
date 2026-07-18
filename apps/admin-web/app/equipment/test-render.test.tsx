import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import React from 'react';
import m5ui from '@m5/ui';

describe('test-m5ui', () => {
  it('components are functions', () => {
    assert.strictEqual(typeof m5ui.PageShell, 'function');
    assert.strictEqual(typeof m5ui.StatusBadge, 'function');
    assert.strictEqual(typeof m5ui.Tabs, 'function');
    assert.strictEqual(typeof m5ui.DataTable, 'function');
    assert.strictEqual(typeof m5ui.Pagination, 'function');
    assert.strictEqual(typeof m5ui.usePagination, 'function');
    assert.strictEqual(typeof m5ui.useSortedItems, 'function');
    assert.strictEqual(typeof m5ui.SearchFilterInput, 'function');
    assert.strictEqual(typeof m5ui.EmptyState, 'function');
  });
});
