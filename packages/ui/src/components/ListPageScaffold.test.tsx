import React from 'react';

const assert = require('node:assert/strict');
const { describe, test } = require('node:test');

const PROJECT_ROOT = '/Users/yaoyunzhong/Desktop/shenjiying/shenjiying88';
const { renderToStaticMarkup } = require(
  PROJECT_ROOT + '/node_modules/.pnpm/react-dom@18.3.1_react@18.3.1/node_modules/react-dom/server.node.js'
);
const { useListPageSectionState, listPageStatCardStyle } = require('./ListPageScaffold');

interface TestItem {
  id: number;
  name: string;
  category: string;
  status: string;
  score: number;
}

const sampleItems: TestItem[] = [
  { id: 1, name: '张三', category: 'VIP', status: '活跃', score: 95 },
  { id: 2, name: '李四', category: '普通', status: '离线', score: 82 },
  { id: 3, name: '王五', category: 'VIP', status: '活跃', score: 78 },
  { id: 4, name: '赵六', category: '普通', status: '活跃', score: 88 },
  { id: 5, name: '钱七', category: 'VIP', status: '离线', score: 91 },
];

const defaultFacets = [
  { key: 'category', getValue: (item: TestItem) => item.category },
  { key: 'status', getValue: (item: TestItem) => item.status },
];

describe('useListPageSectionState', () => {
  test('returns expected shape with all required fields', () => {
    const TestComponent = () => {
      const result = useListPageSectionState({
        items: sampleItems,
        searchFields: ['name'],
        facets: defaultFacets,
      });
      assert.strictEqual(typeof result.searchTerm, 'string');
      assert.strictEqual(typeof result.setSearchTerm, 'function');
      assert.ok(Array.isArray(result.searchFilteredItems));
      assert.ok(Array.isArray(result.facets));
      assert.ok(Array.isArray(result.filteredItems));
      assert.strictEqual(result.sortConfig, null);
      assert.strictEqual(typeof result.setSortConfig, 'function');
      assert.ok(Array.isArray(result.sortedItems));
      assert.ok(Array.isArray(result.pagedItems));
      assert.strictEqual(typeof result.pagination, 'object');
      assert.strictEqual(typeof result.totalPages, 'number');
      assert.strictEqual(typeof result.setFacetValue, 'function');
      return null;
    };
    renderToStaticMarkup(React.createElement(TestComponent));
  });

  test('initial searchTerm is empty string', () => {
    const TestComponent = () => {
      const result = useListPageSectionState({
        items: sampleItems,
        searchFields: ['name'],
        facets: defaultFacets,
      });
      assert.strictEqual(result.searchTerm, '');
      return null;
    };
    renderToStaticMarkup(React.createElement(TestComponent));
  });

  test('initial filteredItems equals all items when no search/filter', () => {
    const TestComponent = () => {
      const result = useListPageSectionState({
        items: sampleItems,
        searchFields: ['name'],
        facets: defaultFacets,
      });
      assert.strictEqual(result.filteredItems.length, sampleItems.length);
      return null;
    };
    renderToStaticMarkup(React.createElement(TestComponent));
  });

  test('facets are resolved with ALL as initial value', () => {
    const TestComponent = () => {
      const result = useListPageSectionState({
        items: sampleItems,
        searchFields: ['name'],
        facets: defaultFacets,
      });
      assert.strictEqual(result.facets.length, 2);
      result.facets.forEach((facet: (typeof result.facets)[number]) => {
        assert.strictEqual(facet.value, 'ALL');
        assert.ok(Array.isArray(facet.order));
        assert.strictEqual(facet.enabled, true);
        assert.ok(Array.isArray(facet.baseItems));
        assert.ok(Array.isArray(facet.filteredItems));
      });
      return null;
    };
    renderToStaticMarkup(React.createElement(TestComponent));
  });

  test('facet order is derived from items when not explicitly provided', () => {
    const TestComponent = () => {
      const result = useListPageSectionState({
        items: sampleItems,
        searchFields: ['name'],
        facets: [{ key: 'category', getValue: (item: TestItem) => item.category }],
      });
      const categoryFacet = result.facets[0];
      assert.ok(categoryFacet.order.includes('VIP'));
      assert.ok(categoryFacet.order.includes('普通'));
      return null;
    };
    renderToStaticMarkup(React.createElement(TestComponent));
  });

  test('facet order is respected when explicitly provided', () => {
    const TestComponent = () => {
      const result = useListPageSectionState({
        items: sampleItems,
        searchFields: ['name'],
        facets: [
          { key: 'category', order: ['普通', 'VIP'] as const, getValue: (item: TestItem) => item.category },
        ],
      });
      const categoryFacet = result.facets[0];
      assert.deepStrictEqual(categoryFacet.order, ['普通', 'VIP']);
      return null;
    };
    renderToStaticMarkup(React.createElement(TestComponent));
  });

  test('facet can be disabled', () => {
    const TestComponent = () => {
      const result = useListPageSectionState({
        items: sampleItems,
        searchFields: ['name'],
        facets: [
          { key: 'category', enabled: false, getValue: (item: TestItem) => item.category },
          { key: 'status', getValue: (item: TestItem) => item.status },
        ],
      });
      assert.strictEqual(result.facets[0].enabled, false);
      assert.strictEqual(result.facets[0].filteredItems.length, sampleItems.length);
      return null;
    };
    renderToStaticMarkup(React.createElement(TestComponent));
  });

  test('setFacetValue function exists', () => {
    const TestComponent = () => {
      const result = useListPageSectionState({
        items: sampleItems,
        searchFields: ['name'],
        facets: defaultFacets,
      });
      assert.strictEqual(typeof result.setFacetValue, 'function');
      return null;
    };
    renderToStaticMarkup(React.createElement(TestComponent));
  });

  test('totalPages is at least 1 even with no items', () => {
    const TestComponent = () => {
      const result = useListPageSectionState({
        items: [],
        searchFields: ['name'],
        facets: [],
      });
      assert.strictEqual(result.totalPages, 1);
      assert.deepStrictEqual(result.pagedItems, []);
      return null;
    };
    renderToStaticMarkup(React.createElement(TestComponent));
  });

  test('pagination defaults to pageSize 10', () => {
    const TestComponent = () => {
      const result = useListPageSectionState({
        items: sampleItems,
        searchFields: ['name'],
        facets: [],
      });
      assert.strictEqual(result.pagination.pageSize, 10);
      return null;
    };
    renderToStaticMarkup(React.createElement(TestComponent));
  });

  test('single item list returns totalPages 1', () => {
    const TestComponent = () => {
      const result = useListPageSectionState({
        items: [{ id: 1, name: '唯一', category: 'VIP', status: '活跃', score: 100 }],
        searchFields: ['name'],
        facets: [],
      });
      assert.strictEqual(result.totalPages, 1);
      assert.strictEqual(result.pagedItems.length, 1);
      return null;
    };
    renderToStaticMarkup(React.createElement(TestComponent));
  });

  test('custom defaultPageSize works', () => {
    const TestComponent = () => {
      const result = useListPageSectionState({
        items: sampleItems,
        searchFields: ['name'],
        facets: [],
        defaultPageSize: 3,
      });
      assert.strictEqual(result.pagination.pageSize, 3);
      // 5 items, pageSize 3 => page 1 has 3 items
      assert.strictEqual(result.pagedItems.length, 3);
      assert.strictEqual(result.totalPages, 2);
      return null;
    };
    renderToStaticMarkup(React.createElement(TestComponent));
  });

  test('custom pageSizeOptions changes pagination behavior', () => {
    const TestComponent = () => {
      const result = useListPageSectionState({
        items: sampleItems,
        searchFields: ['name'],
        facets: [],
        pageSizeOptions: [3, 6, 12],
      });
      // pageSizeOptions is used internally by usePagination; verify hook works
      assert.strictEqual(typeof result.pagination.pageSize, 'number');
      assert.strictEqual(typeof result.pagination.setPageSize, 'function');
      return null;
    };
    renderToStaticMarkup(React.createElement(TestComponent));
  });

  test('initial sortConfig is null', () => {
    const TestComponent = () => {
      const result = useListPageSectionState({
        items: sampleItems,
        searchFields: ['name'],
        facets: defaultFacets,
      });
      assert.strictEqual(result.sortConfig, null);
      return null;
    };
    renderToStaticMarkup(React.createElement(TestComponent));
  });

  test('sortedItems equals filteredItems when sortConfig is null', () => {
    const TestComponent = () => {
      const result = useListPageSectionState({
        items: sampleItems,
        searchFields: ['name'],
        facets: [],
      });
      assert.deepStrictEqual(result.sortedItems, result.filteredItems);
      return null;
    };
    renderToStaticMarkup(React.createElement(TestComponent));
  });

  test('pagedItems is a slice of sortedItems when defaultPageSize is small', () => {
    const TestComponent = () => {
      const result = useListPageSectionState({
        items: sampleItems,
        searchFields: ['name'],
        facets: [],
        defaultPageSize: 2,
      });
      assert.strictEqual(result.pagedItems.length, 2);
      assert.deepStrictEqual(result.pagedItems, result.sortedItems.slice(0, 2));
      return null;
    };
    renderToStaticMarkup(React.createElement(TestComponent));
  });

  test('searchFilteredItems holds unfaceted filtered items', () => {
    const TestComponent = () => {
      const result = useListPageSectionState({
        items: sampleItems,
        searchFields: ['name'],
        facets: [],
      });
      // No search term, no facets => searchFilteredItems = all items
      assert.strictEqual(result.searchFilteredItems.length, sampleItems.length);
      return null;
    };
    renderToStaticMarkup(React.createElement(TestComponent));
  });

  test('facet order defaults to unique values from items when no order provided', () => {
    const TestComponent = () => {
      const result = useListPageSectionState({
        items: sampleItems,
        searchFields: ['name'],
        facets: [{ key: 'status', getValue: (item: TestItem) => item.status }],
      });
      const statusFacet = result.facets[0];
      // Should contain unique statuses from items
      assert.ok(statusFacet.order.includes('活跃'));
      assert.ok(statusFacet.order.includes('离线'));
      // 'ALL' is not in the order array, it's the facet value
      return null;
    };
    renderToStaticMarkup(React.createElement(TestComponent));
  });
});

describe('listPageStatCardStyle', () => {
  test('is an object with style properties', () => {
    assert.strictEqual(typeof listPageStatCardStyle, 'object');
    assert.strictEqual(listPageStatCardStyle.borderRadius, 16);
    assert.strictEqual(listPageStatCardStyle.padding, 18);
    assert.ok(typeof listPageStatCardStyle.background === 'string');
    assert.ok(typeof listPageStatCardStyle.border === 'string');
  });

  test('border is semi-transparent white', () => {
    assert.match(listPageStatCardStyle.border as string, /rgba\(148,\s*163,\s*184/);
    assert.match(listPageStatCardStyle.border as string, /solid/);
  });

  test('background has dark glass effect', () => {
    assert.match(listPageStatCardStyle.background as string, /15,\s*23,\s*42/);
  });
});
