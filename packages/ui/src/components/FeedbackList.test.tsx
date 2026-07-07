/**
 * FeedbackList component unit tests
 *
 * Uses renderToStaticMarkup (SSR) to match the project's test convention.
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { FeedbackList, type FeedbackEntry } from './FeedbackList';

function makeEntry(overrides: Partial<FeedbackEntry> = {}): FeedbackEntry {
  return {
    id: 'fb-1',
    userId: 'u-1',
    userName: '张三',
    rating: 4,
    content: '服务态度很好，环境舒适',
    category: 'service',
    createdAt: '2024-01-15 10:30',
    resolved: false,
    ...overrides,
  };
}

function render(entries: FeedbackEntry[], props: Partial<Parameters<typeof FeedbackList>[0]> = {}) {
  return renderToStaticMarkup(<FeedbackList entries={entries} {...props} />);
}

describe('FeedbackList', () => {
  it('renders empty state when entries is empty', () => {
    const html = render([]);
    assert.ok(html.includes('暂无反馈数据'));
    assert.ok(html.includes('feedback-list-empty'));
  });

  it('renders custom empty text', () => {
    const html = render([], { emptyText: '暂无反馈' });
    assert.ok(html.includes('暂无反馈'));
  });

  it('renders feedback entries', () => {
    const entries = [makeEntry(), makeEntry({ id: 'fb-2', userName: '李四', rating: 5 })];
    const html = render(entries);
    assert.ok(html.includes('feedback-entry-fb-1'));
    assert.ok(html.includes('feedback-entry-fb-2'));
    assert.ok(html.includes('张三'));
    assert.ok(html.includes('李四'));
  });

  it('displays entry content and category', () => {
    const entries = [makeEntry({ content: '非常满意', category: 'product' })];
    const html = render(entries);
    assert.ok(html.includes('非常满意'));
    assert.ok(html.includes('产品'));
  });

  it('shows resolved badge when entry is resolved', () => {
    const entries = [makeEntry({ resolved: true })];
    const html = render(entries);
    assert.ok(html.includes('已处理'));
  });

  it('shows reply when present', () => {
    const entries = [makeEntry({ reply: '感谢您的反馈！' })];
    const html = render(entries);
    assert.ok(html.includes('感谢您的反馈！'));
  });

  it('renders data-testid attributes on each entry', () => {
    const entries = [makeEntry()];
    const html = render(entries);
    assert.ok(html.includes('feedback-entry-fb-1'));
  });

  it('respects maxItems limit', () => {
    const entries = [
      makeEntry({ id: 'fb-1' }),
      makeEntry({ id: 'fb-2' }),
      makeEntry({ id: 'fb-3' }),
    ];
    const html = render(entries, { maxItems: 2 });
    assert.ok(html.includes('feedback-entry-fb-1'));
    assert.ok(html.includes('feedback-entry-fb-2'));
    assert.ok(!html.includes('feedback-entry-fb-3'));
  });

  it('renders category labels correctly', () => {
    const entries = [
      makeEntry({ id: 'fb-1', category: 'service' }),
      makeEntry({ id: 'fb-2', category: 'product' }),
      makeEntry({ id: 'fb-3', category: 'experience' }),
      makeEntry({ id: 'fb-4', category: 'other' }),
    ];
    const html = render(entries);
    assert.ok(html.includes('服务'));
    assert.ok(html.includes('产品'));
    assert.ok(html.includes('体验'));
    assert.ok(html.includes('其他'));
  });
});
