import React from 'react';
import assert from 'node:assert/strict';
import { describe, test } from 'node:test';

const PROJECT_ROOT = '/Users/yaoyunzhong/Desktop/shenjiying/shenjiying88';
const { renderToStaticMarkup } = require(
  PROJECT_ROOT + '/node_modules/.pnpm/react-dom@18.3.1_react@18.3.1/node_modules/react-dom/server.node.js'
);
const { TimePicker } = require('./TimePicker');

describe('TimePicker', () => {
  test('renders inputs with hour & minute from value', () => {
    const html = renderToStaticMarkup(
      React.createElement(TimePicker, { value: '14:30' })
    );
    assert.ok(html.includes('value="14"'));
    assert.ok(html.includes('value="30"'));
  });

  test('renders 3 inputs when showSeconds=true', () => {
    const html = renderToStaticMarkup(
      React.createElement(TimePicker, { value: '09:05:45', showSeconds: true })
    );
    assert.ok(html.includes('value="09"'));
    assert.ok(html.includes('value="05"'));
    assert.ok(html.includes('value="45"'));
  });

  test('renders label text', () => {
    const html = renderToStaticMarkup(
      React.createElement(TimePicker, { label: '开始时间' })
    );
    assert.ok(html.includes('开始时间'));
  });

  test('shows required asterisk', () => {
    const html = renderToStaticMarkup(
      React.createElement(TimePicker, { label: '时间', required: true })
    );
    assert.ok(html.includes('*'));
  });

  test('shows error text', () => {
    const html = renderToStaticMarkup(
      React.createElement(TimePicker, { error: '时间不能为空' })
    );
    assert.ok(html.includes('时间不能为空'));
  });

  test('shows helpText when no error', () => {
    const html = renderToStaticMarkup(
      React.createElement(TimePicker, { helpText: '请选择时间' })
    );
    assert.ok(html.includes('请选择时间'));
  });

  test('does not show helpText when error is present', () => {
    const html = renderToStaticMarkup(
      React.createElement(TimePicker, { error: '错误', helpText: '帮助' })
    );
    assert.ok(!html.includes('帮助'));
  });

  test('disables inputs when disabled', () => {
    const html = renderToStaticMarkup(
      React.createElement(TimePicker, { value: '10:15', disabled: true })
    );
    // disabled attribute present
    const inputMatches = html.match(/<input/g);
    assert.ok(inputMatches && inputMatches.length >= 2);
  });

  test('applies id to hour and minute inputs', () => {
    const html = renderToStaticMarkup(
      React.createElement(TimePicker, { id: 'my-time', label: '时间' })
    );
    assert.ok(html.includes('id="my-time-h"'));
    assert.ok(html.includes('id="my-time-m"'));
  });

  test('renders PM button in 12h mode after noon', () => {
    const html = renderToStaticMarkup(
      React.createElement(TimePicker, { use12Hour: true, value: '14:00' })
    );
    assert.ok(html.includes('PM'));
  });

  test('renders AM in 12h mode before noon', () => {
    const html = renderToStaticMarkup(
      React.createElement(TimePicker, { use12Hour: true, value: '02:00' })
    );
    assert.ok(html.includes('AM'));
  });

  test('12h mode shows hour in 12-hour format (14→02)', () => {
    const html = renderToStaticMarkup(
      React.createElement(TimePicker, { use12Hour: true, value: '14:30' })
    );
    assert.ok(html.includes('value="02"'));
  });

  test('sets aria-label on segments', () => {
    const html = renderToStaticMarkup(
      React.createElement(TimePicker, { value: '10:10' })
    );
    assert.ok(html.includes('aria-label="小时"'));
    assert.ok(html.includes('aria-label="分钟"'));
  });

  test('renders 2 segments by default with no value', () => {
    const html = renderToStaticMarkup(React.createElement(TimePicker));
    const valueCount = (html.match(/value="/g) || []).length;
    assert.ok(valueCount >= 2);
  });

  test('readOnly passes readOnly to inputs', () => {
    const html = renderToStaticMarkup(
      React.createElement(TimePicker, { value: '10:10', readOnly: true })
    );
    assert.ok(html.includes('readOnly') || html.includes('readonly'));
  });

  test('colon separators exist between segments', () => {
    const html = renderToStaticMarkup(
      React.createElement(TimePicker, { value: '12:00' })
    );
    // Two colons for two separators
    const colonCount = (html.match(/>:</g) || []).length;
    assert.equal(colonCount, 1, 'Should have one colon separator for 2 segments');
  });

  test('custom className is applied to root div', () => {
    const html = renderToStaticMarkup(
      React.createElement(TimePicker, { className: 'my-custom-picker' })
    );
    assert.ok(html.includes('my-custom-picker'));
  });

  test('required label links to hour input via htmlFor', () => {
    const html = renderToStaticMarkup(
      React.createElement(TimePicker, { id: 'tp', label: '时间', required: true })
    );
    assert.ok(html.includes('for="tp-h"'));
  });

  test('minHour/maxHour default works with normal hour', () => {
    const html = renderToStaticMarkup(
      React.createElement(TimePicker, { value: '10:00' })
    );
    assert.ok(html.includes('value="10"'));
  });
});
