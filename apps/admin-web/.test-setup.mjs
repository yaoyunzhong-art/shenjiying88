// Test setup (ESM): happy-dom environment + module mocks
// Loaded via `node --import ./.test-setup.mjs` before tests

import { Window } from 'happy-dom';
import React from 'react';

const window = new Window({ url: 'http://localhost' });
const document = window.document;

// Some page components use 'use client' with automatic JSX transform but
// the test environment needs React in scope for @testing-library/react renders
// Polyfill React.use() for pages using React 19's use() hook
if (!React.use) {
  React.use = (p) => p; // Return as-is; if test passes plain object, destructuring works
}
globalThis.React = React;

Object.assign(globalThis, {
  window,
  document,
  HTMLElement: window.HTMLElement,
  HTMLInputElement: window.HTMLInputElement,
  HTMLTextAreaElement: window.HTMLTextAreaElement,
  HTMLSelectElement: window.HTMLSelectElement,
  HTMLButtonElement: window.HTMLButtonElement,
  Node: window.Node,
  Element: window.Element,
  self: window,
});

// next/navigation mock via ESM hook
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const Module = require('module');

const navPath = Module._resolveFilename('next/navigation', {
  id: '<preload>',
  filename: '<preload>',
  paths: Module._nodeModulePaths(process.cwd()),
});

// Also mock next/link — renders as a plain span
const linkPath = Module._resolveFilename('next/link', {
  id: '<preload>',
  filename: '<preload>',
  paths: Module._nodeModulePaths(process.cwd()),
});

const MockNextLink = ({ children, href, ...props }) => {
  return React.createElement('a', { ...props, 'data-href': href, href }, children);
};

require.cache[linkPath] = {
  id: linkPath,
  filename: linkPath,
  loaded: true,
  exports: { default: MockNextLink, __esModule: true },
};

const mockNavModule = {
  __esModule: true,
  ReadonlyURLSearchParams: class {},
  RedirectType: { push: 'push', replace: 'replace' },
  notFound: () => {},
  redirect: (url) => { throw new Error('redirect: ' + url); },
  permanentRedirect: (url) => { throw new Error('permanentRedirect: ' + url); },
  useParams: () => ({}),
  usePathname: () => '/',
  useRouter: () => ({ push: () => {}, back: () => {}, replace: () => {}, prefetch: () => {} }),
  useSearchParams: () => new URLSearchParams(),
  useSelectedLayoutSegment: () => null,
  useSelectedLayoutSegments: () => [],
  forbidden: () => { throw new Error('forbidden'); },
  unauthorized: () => { throw new Error('unauthorized'); },
};

require.cache[navPath] = {
  id: navPath,
  filename: navPath,
  loaded: true,
  exports: mockNavModule,
};

// Mock next/image
const imagePath = Module._resolveFilename('next/image', {
  id: '<preload>',
  filename: '<preload>',
  paths: Module._nodeModulePaths(process.cwd()),
});

const MockNextImage = ({ src, alt, ...props }) => {
  return React.createElement('img', { ...props, src, alt });
};

require.cache[imagePath] = {
  id: imagePath,
  filename: imagePath,
  loaded: true,
  exports: { default: MockNextImage },
};

// Mock @m5/ui components for rendering tests
// CJS __export pattern doesn't interop well with static ESM named imports through tsx
const uiPath = Module._resolveFilename('@m5/ui', {
  id: '<preload>',
  filename: '<preload>',
  paths: Module._nodeModulePaths(process.cwd()),
});

function makeMockComponent(displayName) {
  const C = (props) => {
    const { children, ...rest } = props;
    return React.createElement('div', { 'data-mock': displayName }, children);
  };
  C.displayName = displayName;
  return C;
}

function makeMockHook(fn) {
  return fn;
}

const mockUiModule = {
  __esModule: true,
  PageShell: ({ title, subtitle, children }) => {
    return React.createElement('div', { 'data-mock': 'PageShell' },
      React.createElement('h1', null, title),
      subtitle ? React.createElement('p', { 'data-testid': 'page-subtitle' }, subtitle) : null,
      children,
    );
  },
  StatusBadge: ({ label, variant, size, dot }) => {
    return React.createElement('span', {
      'data-testid': 'StatusBadge',
      'data-label': label,
      'data-variant': variant,
      'data-size': size,
      'data-dot': dot ? 'true' : 'false',
      style: {},
    }, label);
  },
  Tabs: ({ items, activeKey, onChange, variant, size }) => {
    return React.createElement('div', { 'data-mock': 'Tabs' },
      ...(items || []).map((item) =>
        React.createElement('button', {
          key: item.key,
          'data-tab-key': item.key,
          'data-active': item.key === activeKey ? 'true' : 'false',
          onClick: () => onChange?.(item.key),
        }, `${item.label}${item.count != null ? ` (${item.count})` : ''}`)
      )
    );
  },
  SearchFilterInput: ({ value, onChange, placeholder, width }) => {
    return React.createElement('input', {
      'data-mock': 'SearchFilterInput',
      type: 'text',
      value,
      placeholder: placeholder || '',
      onChange: (e) => onChange?.(e.target.value),
      style: width ? { width } : {},
    });
  },
  DataTable: ({ columns, items, rowKey, title, striped, compact }) => {
    return React.createElement('div', { 'data-mock': 'DataTable' },
      title ? React.createElement('div', { 'data-testid': 'table-title' }, title) : null,
      React.createElement('table', { 'data-testid': 'data-table' },
        React.createElement('thead', null,
          React.createElement('tr', null,
            ...(columns || []).map((col) =>
              React.createElement('th', { key: col.key, 'data-column': col.key }, col.title || col.header || col.key)
            )
          )
        ),
        React.createElement('tbody', null,
          ...(items || []).map((item, idx) =>
            React.createElement('tr', { key: rowKey ? rowKey(item) : idx },
              ...(columns || []).map((col) =>
                React.createElement('td', { key: col.key },
                  col.render ? col.render(item, idx) : String(item[col.dataKey] ?? '')
                )
              )
            )
          )
        )
      )
    );
  },
  Pagination: ({ page, total, onPageChange, pageSize }) => {
    return React.createElement('div', { 'data-mock': 'Pagination' },
      `Page ${page} of ${Math.ceil(total / (pageSize || 10))} (${total} items)`
    );
  },
  EmptyState: ({ title, description }) => {
    return React.createElement('div', { 'data-mock': 'EmptyState' },
      title ? React.createElement('h3', null, title) : null,
      description ? React.createElement('p', null, description) : null,
    );
  },
  usePagination: (totalOrOptions, pageSizeArg, initialPageArg = 1) => {
    let options;
    if (typeof totalOrOptions === 'object') {
      options = totalOrOptions;
    } else {
      options = {};
    }
    const [page, setPage] = React.useState(options.initialPage ?? 1);
    const [pageSize, setPageSize] = React.useState(options.initialPageSize ?? 10);
    return {
      page,
      pageSize,
      totalPages: 1,
      setPage,
      setPageSize,
      total: 0,
      resetPage: () => setPage(1),
      paginate: (items) => items,
    };
  },
  useSortedItems: (items, _columns, sortConfig) => {
    if (!items) return [];
    if (!sortConfig) return items;
    const sorted = [...items];
    sorted.sort((a, b) => {
      const aVal = a[sortConfig.key];
      const bVal = b[sortConfig.key];
      if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
    return sorted;
  },
  useSearchFilter: (initialValue) => {
    const [value, setValue] = React.useState(initialValue ?? '');
    return { value, debouncedValue: value, setValue };
  },
  StatCard: makeMockComponent('StatCard'),
  // DataTableSortConfig type export not needed at runtime
};

require.cache[uiPath] = {
  id: uiPath,
  filename: uiPath,
  loaded: true,
  exports: mockUiModule,
};

console.log('[test-setup] happy-dom initialized (ESM), next/navigation + next/link + next/image + @m5/ui mocked');
