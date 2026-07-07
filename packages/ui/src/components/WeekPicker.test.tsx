/**
 * WeekPicker component unit tests
 *
 * Tests rendering, week selection, year navigation, disabled states,
 * label/error/help display, and accessibility.
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { WeekPicker } from './WeekPicker';

// ---- Helpers ----

function extractText(html: string): string {
  return html.replace(/<[^>]+>/g, '').trim();
}

function htmlContains(html: string, text: string): boolean {
  return extractText(html).includes(text);
}

function getAttr(html: string, attr: string): string | null {
  const re = new RegExp(`${attr}="([^"]*)"`);
  const m = html.match(re);
  return m ? m[1] : null;
}

// ---- Tests ----

describe('WeekPicker', () => {
  it('renders with placeholder when no value is provided', () => {
    const html = renderToStaticMarkup(React.createElement(WeekPicker, {}));
    assert.ok(htmlContains(html, '选择周'));
  });

  it('renders label when provided', () => {
    const html = renderToStaticMarkup(
      React.createElement(WeekPicker, { label: '统计周' })
    );
    assert.ok(htmlContains(html, '统计周'));
  });

  it('shows required indicator when required', () => {
    const html = renderToStaticMarkup(
      React.createElement(WeekPicker, { label: '统计周', required: true })
    );
    assert.ok(html.includes('*'));
  });

  it('displays current week value correctly', () => {
    const html = renderToStaticMarkup(
      React.createElement(WeekPicker, { value: '2026-W28' })
    );
    assert.ok(htmlContains(html, '第28周'));
  });

  it('renders week range text for given value', () => {
    const html = renderToStaticMarkup(
      React.createElement(WeekPicker, { value: '2026-W28' })
    );
    // Week 28 of 2026 should show a date range
    assert.ok(html.includes('月') && html.includes('日'));
    assert.ok(html.includes('-'));
  });

  it('displays error message', () => {
    const html = renderToStaticMarkup(
      React.createElement(WeekPicker, { error: '请选择周' })
    );
    assert.ok(htmlContains(html, '请选择周'));
  });

  it('displays help text', () => {
    const html = renderToStaticMarkup(
      React.createElement(WeekPicker, { helpText: '选择统计周次' })
    );
    assert.ok(htmlContains(html, '选择统计周次'));
  });

  it('renders as disabled', () => {
    const html = renderToStaticMarkup(
      React.createElement(WeekPicker, { disabled: true })
    );
    const htmlLower = html.toLowerCase();
    assert.ok(htmlLower.includes('cursor:not-allowed') || htmlLower.includes('not-allowed'));
  });

  it('dropdown is hidden by default', () => {
    const html = renderToStaticMarkup(React.createElement(WeekPicker, {}));
    // Dropdown should have display:none or display: none
    assert.ok(html.includes('display: none') || html.includes('display:none'));
  });

  it('renders year navigation buttons', () => {
    const html = renderToStaticMarkup(React.createElement(WeekPicker, {}));
    assert.ok(html.includes('◀') || html.includes('aria-label="上一年"'));
    assert.ok(html.includes('▶') || html.includes('aria-label="下一年"'));
  });

  it('sets aria-expanded to false by default', () => {
    const html = renderToStaticMarkup(React.createElement(WeekPicker, {}));
    const expanded = getAttr(html, 'aria-expanded');
    assert.equal(expanded, 'false');
  });

  it('renders custom week prefix and suffix', () => {
    const html = renderToStaticMarkup(
      React.createElement(WeekPicker, {
        value: '2026-W28',
        weekPrefix: 'Week ',
        weekSuffix: '',
      })
    );
    assert.ok(htmlContains(html, 'Week 28'));
  });

  it('accepts min/max constraints', () => {
    const html = renderToStaticMarkup(
      React.createElement(WeekPicker, {
        value: '2026-W28',
        min: '2026-W01',
        max: '2026-W52',
      })
    );
    assert.ok(htmlContains(html, '第28周'));
  });

  it('handles edge: very early year', () => {
    const html = renderToStaticMarkup(
      React.createElement(WeekPicker, {
        value: '2020-W01',
        startYear: 2020,
        endYear: 2020,
      })
    );
    assert.ok(htmlContains(html, '第1周'));
  });

  it('handles edge: week 53 boundary', () => {
    // 2026 has 53 ISO weeks
    const html = renderToStaticMarkup(
      React.createElement(WeekPicker, {
        value: '2026-W53',
      })
    );
    assert.ok(htmlContains(html, '第53周'));
  });
});
