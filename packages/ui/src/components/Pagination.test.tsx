import React from 'react';

const assert = require('node:assert/strict');
const { describe, test } = require('node:test');

const PROJECT_ROOT = '/Users/yaoyunzhong/Desktop/shenjiying/shenjiying88';
const { renderToStaticMarkup } = require(
  PROJECT_ROOT + '/node_modules/.pnpm/react-dom@18.3.1_react@18.3.1/node_modules/react-dom/server.node.js'
);
const { Pagination, usePagination } = require('./Pagination');

describe('Pagination', () => {
  test('renders total items text', () => {
    const html = renderToStaticMarkup(
      React.createElement(Pagination, { page: 1, total: 100, onPageChange: () => {}, totalPages: 10 }),
    );
    assert.match(html, /Total 100 items/);
  });

  test('renders page buttons', () => {
    const html = renderToStaticMarkup(
      React.createElement(Pagination, { page: 1, total: 30, onPageChange: () => {}, totalPages: 3 }),
    );
    assert.match(html, />1</);
    assert.match(html, />2</);
    assert.match(html, />3</);
  });

  test('highlights active page with color', () => {
    const html = renderToStaticMarkup(
      React.createElement(Pagination, { page: 2, total: 30, onPageChange: () => {}, totalPages: 3 }),
    );
    assert.match(html, /#93c5fd/);
  });

  test('previous button rendered', () => {
    const html = renderToStaticMarkup(
      React.createElement(Pagination, { page: 1, total: 100, onPageChange: () => {}, totalPages: 10 }),
    );
    assert.match(html, /‹/);
  });

  test('next button rendered', () => {
    const html = renderToStaticMarkup(
      React.createElement(Pagination, { page: 1, total: 100, onPageChange: () => {}, totalPages: 10 }),
    );
    assert.match(html, /›/);
  });

  test('renders page size selector when onPageSizeChange provided', () => {
    const html = renderToStaticMarkup(
      React.createElement(Pagination, {
        page: 1, total: 100, onPageChange: () => {},
        totalPages: 10, pageSize: 10, onPageSizeChange: () => {},
      }),
    );
    assert.match(html, /select/);
  });

  test('renders ellipsis for many pages', () => {
    const html = renderToStaticMarkup(
      React.createElement(Pagination, { page: 5, total: 200, onPageChange: () => {}, totalPages: 20 }),
    );
    assert.match(html, /…/);
  });

  test('renders small size', () => {
    const html = renderToStaticMarkup(
      React.createElement(Pagination, { page: 1, total: 30, onPageChange: () => {}, totalPages: 3, size: 'sm' }),
    );
    assert.match(html, /min-width:30px/);
  });

  test('computes totalPages from total and pageSize', () => {
    const html = renderToStaticMarkup(
      React.createElement(Pagination, { page: 1, total: 50, onPageChange: () => {}, pageSize: 10 }),
    );
    // With 50 items / 10 = 5 pages
    assert.match(html, />5</);
  });
});

describe('usePagination', () => {
  test('returns correct values for positional args', () => {
    function Tester() {
      const { page, totalPages, paginate } = usePagination(100, 10, 1);
      const items = Array.from({ length: 100 }, (_, i) => i + 1);
      const paged = paginate(items);
      return React.createElement('div', null,
        React.createElement('span', { 'data-testid': 'page' }, String(page)),
        React.createElement('span', { 'data-testid': 'totalPages' }, String(totalPages)),
        React.createElement('span', { 'data-testid': 'pagedLength' }, String(paged.length)),
      );
    }
    const html = renderToStaticMarkup(React.createElement(Tester));
    assert.match(html, /10/);
  });

  test('handles legacy config object', () => {
    function Tester() {
      const { page, pageSize, totalPages } = usePagination({
        initialPage: 3,
        initialPageSize: 20,
      });
      return React.createElement('div', null,
        React.createElement('span', { 'data-testid': 'page' }, String(page)),
        React.createElement('span', { 'data-testid': 'pageSize' }, String(pageSize)),
        React.createElement('span', { 'data-testid': 'totalPages' }, String(totalPages)),
      );
    }
    const html = renderToStaticMarkup(React.createElement(Tester));
    assert.match(html, />3</);
    assert.match(html, />20</);
  });
});
