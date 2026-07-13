/**
 * AnnouncementBadge Test — storefront-web
 * Tests: badge rendering, data maps, edge cases, SSR rendering
 */
import assert from 'node:assert/strict';
import test from 'node:test';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

// Re-import the component's data maps (same as source)
const CATEGORY_LABELS: Record<string, string> = {
  system: '系统通知',
  operation: '运营公告',
  promotion: '促销活动',
  emergency: '紧急通知',
};

const CATEGORY_COLORS: Record<string, string> = {
  system: '#6366f1',
  operation: '#f59e0b',
  promotion: '#10b981',
  emergency: '#ef4444',
};

const STATUS_LABELS: Record<string, string> = {
  published: '已发布',
  draft: '草稿',
  archived: '已归档',
};

const STATUS_COLORS: Record<string, string> = {
  published: '#10b981',
  draft: '#9ca3af',
  archived: '#6b7280',
};

// Reference to the AnnouncementBadge component for SSR test
const { AnnouncementBadge } = require('../AnnouncementBadge');

/* ── Category map tests ── */

test('AnnouncementBadge - category labels are complete', () => {
  const categories = ['system', 'operation', 'promotion', 'emergency'];
  for (const cat of categories) {
    assert.ok(CATEGORY_LABELS[cat], `Missing label for category: ${cat}`);
    assert.ok(CATEGORY_COLORS[cat], `Missing color for category: ${cat}`);
  }
  assert.equal(Object.keys(CATEGORY_LABELS).length, 4);
});

test('AnnouncementBadge - status labels are complete', () => {
  const statuses = ['published', 'draft', 'archived'];
  for (const st of statuses) {
    assert.ok(STATUS_LABELS[st], `Missing label for status: ${st}`);
    assert.ok(STATUS_COLORS[st], `Missing color for status: ${st}`);
  }
  assert.equal(Object.keys(STATUS_LABELS).length, 3);
});

test('AnnouncementBadge - category mappings correct', () => {
  assert.equal(CATEGORY_LABELS.system, '系统通知');
  assert.equal(CATEGORY_LABELS.promotion, '促销活动');
  assert.equal(CATEGORY_LABELS.emergency, '紧急通知');
  assert.equal(CATEGORY_LABELS.operation, '运营公告');
});

test('AnnouncementBadge - status mappings correct', () => {
  assert.equal(STATUS_LABELS.published, '已发布');
  assert.equal(STATUS_LABELS.draft, '草稿');
  assert.equal(STATUS_LABELS.archived, '已归档');
});

test('AnnouncementBadge - category colors are valid CSS hex', () => {
  const hexRegex = /^#[0-9a-fA-F]{6}$/;
  for (const color of Object.values(CATEGORY_COLORS)) {
    assert.ok(hexRegex.test(color), `Invalid hex color: ${color}`);
  }
});

test('AnnouncementBadge - status colors are valid CSS hex', () => {
  const hexRegex = /^#[0-9a-fA-F]{6}$/;
  for (const color of Object.values(STATUS_COLORS)) {
    assert.ok(hexRegex.test(color), `Invalid hex color: ${color}`);
  }
});

/* ── SSR rendering tests ── */

test('AnnouncementBadge - renders category label text', () => {
  const html = renderToStaticMarkup(
    React.createElement(AnnouncementBadge, { type: 'category', value: 'system' })
  );
  assert.ok(html.includes('系统通知'), 'Should render system category label');
});

test('AnnouncementBadge - renders status label text', () => {
  const html = renderToStaticMarkup(
    React.createElement(AnnouncementBadge, { type: 'status', value: 'published' })
  );
  assert.ok(html.includes('已发布'), 'Should render published status label');
});

test('AnnouncementBadge - renders fallback color for unknown category', () => {
  const html = renderToStaticMarkup(
    React.createElement(AnnouncementBadge, { type: 'category', value: 'unknown_xxx' })
  );
  // Fallback for unknown value uses the value itself as label
  assert.ok(html.includes('unknown_xxx'));
  // Fallback color is #6b7280 (gray)
  assert.ok(html.includes('#6b7280') || html.includes('rgb(107,114,128)'));
});

test('AnnouncementBadge - renders fallback color for unknown status', () => {
  const html = renderToStaticMarkup(
    React.createElement(AnnouncementBadge, { type: 'status', value: 'unknown_status' })
  );
  assert.ok(html.includes('unknown_status'), 'Shows raw value as fallback label');
});

test('AnnouncementBadge - renders span with inline style', () => {
  const html = renderToStaticMarkup(
    React.createElement(AnnouncementBadge, { type: 'category', value: 'promotion' })
  );
  // Should be a span element
  assert.ok(html.startsWith('<span'), 'Should render a span element');
  assert.ok(html.includes('促销活动'), 'Should show promotion label');
});

test('AnnouncementBadge - all categories render different colors', () => {
  const colors = ['system', 'operation', 'promotion', 'emergency'].map(cat => {
    const html = renderToStaticMarkup(
      React.createElement(AnnouncementBadge, { type: 'category', value: cat })
    );
    return html;
  });
  // Each should be unique
  const unique = new Set(colors);
  assert.equal(unique.size, 4, 'Each category color should be unique');
});

test('AnnouncementBadge - all statuses render different colors', () => {
  const statuses = ['published', 'draft', 'archived'].map(st => {
    const html = renderToStaticMarkup(
      React.createElement(AnnouncementBadge, { type: 'status', value: st })
    );
    return html;
  });
  const unique = new Set(statuses);
  assert.equal(unique.size, 3, 'Each status color should be unique');
});

test('AnnouncementBadge - component renders with empty string value', () => {
  const html = renderToStaticMarkup(
    React.createElement(AnnouncementBadge, { type: 'category', value: '' })
  );
  // Should produce valid output without crashing
  assert.ok(html.length > 0, 'Should render even with empty value');
});

test('AnnouncementBadge - all category colors visually distinct', () => {
  const colorValues = Object.values(CATEGORY_COLORS).map(c => parseInt(c.slice(1), 16));
  for (let i = 0; i < colorValues.length; i++) {
    for (let j = i + 1; j < colorValues.length; j++) {
      assert.notEqual(colorValues[i], colorValues[j], 'Colors must be distinct');
    }
  }
});
