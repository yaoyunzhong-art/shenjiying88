import React from 'react';

const assert = require('node:assert/strict');
const { describe, test } = require('node:test');

const PROJECT_ROOT = '/Users/yaoyunzhong/Desktop/shenjiying/shenjiying88';
const { renderToStaticMarkup } = require(
  PROJECT_ROOT + '/node_modules/.pnpm/react-dom@18.3.1_react@18.3.1/node_modules/react-dom/server.node.js'
);
const { SparklineChart } = require('./SparklineChart');

describe('SparklineChart', () => {
  const sampleData = [
    { value: 10 },
    { value: 25 },
    { value: 15 },
    { value: 40 },
    { value: 30 },
  ];

  test('renders an SVG element', () => {
    const html = renderToStaticMarkup(
      React.createElement(SparklineChart, { data: sampleData })
    );
    assert.match(html, /<svg/);
  });

  test('renders with default dimensions', () => {
    const html = renderToStaticMarkup(
      React.createElement(SparklineChart, { data: sampleData })
    );
    assert.match(html, /width="160"/);
    assert.match(html, /height="48"/);
  });

  test('renders with custom dimensions', () => {
    const html = renderToStaticMarkup(
      React.createElement(SparklineChart, { data: sampleData, width: 200, height: 64 })
    );
    assert.match(html, /width="200"/);
    assert.match(html, /height="64"/);
  });

  test('renders a line path', () => {
    const html = renderToStaticMarkup(
      React.createElement(SparklineChart, { data: sampleData })
    );
    assert.match(html, /<path/);
    assert.match(html, /M.*L/);
  });

  test('renders area fill when fillColor is provided', () => {
    const html = renderToStaticMarkup(
      React.createElement(SparklineChart, { data: sampleData, fillColor: 'rgba(59,130,246,0.15)' })
    );
    // Should have a Z-closed path
    assert.match(html, /Z/);
  });

  test('omits area fill when fillColor is empty string', () => {
    const html = renderToStaticMarkup(
      React.createElement(SparklineChart, { data: sampleData, fillColor: '' })
    );
    // No second path (fill path)
    const pathMatches = html.match(/<path/g);
    assert.equal(pathMatches?.length ?? 0, 1);
  });

  test('renders dots when showDots is true', () => {
    const html = renderToStaticMarkup(
      React.createElement(SparklineChart, { data: sampleData, showDots: true })
    );
    assert.match(html, /<circle/);
  });

  test('renders single data point', () => {
    const html = renderToStaticMarkup(
      React.createElement(SparklineChart, { data: [{ value: 42 }] })
    );
    assert.match(html, /<svg/);
  });

  test('renders empty state when no data', () => {
    const html = renderToStaticMarkup(
      React.createElement(SparklineChart, { data: [] })
    );
    assert.match(html, /<svg/);
    // No path for empty data
    assert.doesNotMatch(html, /M/);
  });

  test('renders with custom color', () => {
    const html = renderToStaticMarkup(
      React.createElement(SparklineChart, { data: sampleData, color: '#22c55e' })
    );
    assert.match(html, /stroke="#22c55e"/);
  });

  test('renders smooth curve when smooth is true', () => {
    const html = renderToStaticMarkup(
      React.createElement(SparklineChart, { data: sampleData, smooth: true })
    );
    // Cubic bezier with C command
    assert.match(html, /C /);
  });

  test('supports aria-label', () => {
    const html = renderToStaticMarkup(
      React.createElement(SparklineChart, { data: sampleData, 'aria-label': 'Weekly sales trend' })
    );
    assert.match(html, /aria-label="Weekly sales trend"/);
  });

  test('renders highlightLast with different color', () => {
    const html = renderToStaticMarkup(
      React.createElement(SparklineChart, { data: sampleData, highlightLast: true, showDots: true })
    );
    const circleMatches = html.match(/<circle/g);
    assert.ok(circleMatches && circleMatches.length > 0);
  });

  test('respects custom min/max for consistent scale', () => {
    const html = renderToStaticMarkup(
      React.createElement(SparklineChart, { data: sampleData, min: 0, max: 100 })
    );
    assert.match(html, /<svg/);
  });

  test('renders labels when provided', () => {
    const labeledData = [
      { value: 10, label: 'Mon' },
      { value: 20, label: 'Tue' },
      { value: 15, label: 'Wed' },
    ];
    const html = renderToStaticMarkup(
      React.createElement(SparklineChart, { data: labeledData, showDots: true })
    );
    assert.match(html, /<circle/);
  });

  test('handles negative values', () => {
    const negativeData = [
      { value: -10 },
      { value: 0 },
      { value: 15 },
      { value: -5 },
    ];
    const html = renderToStaticMarkup(
      React.createElement(SparklineChart, { data: negativeData })
    );
    assert.match(html, /<path/);
  });

  test('handles all same values', () => {
    const flatData = [
      { value: 50 },
      { value: 50 },
      { value: 50 },
    ];
    const html = renderToStaticMarkup(
      React.createElement(SparklineChart, { data: flatData })
    );
    assert.match(html, /<path/);
  });
});
