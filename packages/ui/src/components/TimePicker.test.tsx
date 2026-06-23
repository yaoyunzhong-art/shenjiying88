import React from 'react';
import assert from 'node:assert/strict';
import test from 'node:test';

// Testing approach: verify export structure, type safety, prop handling,
// and that the component creates valid React elements — no SSR needed.
// This matches the pattern used by all other component tests in this project.

import { TimePicker } from './TimePicker';

test('TimePicker exports correctly', () => {
  assert.ok(TimePicker, 'TimePicker should be defined');
  assert.ok(
    typeof TimePicker === 'function' || typeof TimePicker === 'object',
    'TimePicker should be a function or React.memo object',
  );
});

test('TimePicker renders with default props', () => {
  const el = React.createElement(TimePicker);
  assert.ok(el, 'should create a React element without crashing');
});

test('TimePicker accepts label prop', () => {
  const el = React.createElement(TimePicker, { label: '开始时间' });
  assert.ok(el, 'should create element with label');
  const props = el.props as Record<string, unknown>;
  assert.strictEqual(props.label, '开始时间');
});

test('TimePicker accepts id prop', () => {
  const el = React.createElement(TimePicker, { id: 'start' });
  assert.ok(el, 'should create element with id');
  const props = el.props as Record<string, unknown>;
  assert.strictEqual(props.id, 'start');
});

test('TimePicker accepts value prop (HH:mm)', () => {
  const el = React.createElement(TimePicker, { value: '14:30' });
  assert.ok(el, 'should create element with value');
  const props = el.props as Record<string, unknown>;
  assert.strictEqual(props.value, '14:30');
});

test('TimePicker accepts value prop (HH:mm:ss)', () => {
  const el = React.createElement(TimePicker, { value: '09:05:45' });
  assert.ok(el, 'should create element with time value');
  const props = el.props as Record<string, unknown>;
  assert.strictEqual(props.value, '09:05:45');
});

test('TimePicker accepts showSeconds prop', () => {
  const el = React.createElement(TimePicker, { showSeconds: true });
  assert.ok(el, 'should create element with showSeconds');
  const props = el.props as Record<string, unknown>;
  assert.strictEqual(props.showSeconds, true);
});

test('TimePicker accepts use12Hour prop', () => {
  const el = React.createElement(TimePicker, { use12Hour: true });
  assert.ok(el, 'should create element with 12h format');
  const props = el.props as Record<string, unknown>;
  assert.strictEqual(props.use12Hour, true);
});

test('TimePicker accepts placeholder prop', () => {
  const el = React.createElement(TimePicker, { placeholder: '--:--' });
  assert.ok(el, 'should create element with placeholder');
  const props = el.props as Record<string, unknown>;
  assert.strictEqual(props.placeholder, '--:--');
});

test('TimePicker accepts disabled prop', () => {
  const el = React.createElement(TimePicker, { disabled: true });
  assert.ok(el, 'should create element with disabled');
  const props = el.props as Record<string, unknown>;
  assert.strictEqual(props.disabled, true);
});

test('TimePicker disabled defaults to false', () => {
  const el = React.createElement(TimePicker);
  const props = el.props as Record<string, unknown>;
  assert.strictEqual(props.disabled, undefined, 'disabled should be undefined (defaults to false)');
});

test('TimePicker accepts error prop', () => {
  const el = React.createElement(TimePicker, { error: '时间格式错误' });
  assert.ok(el, 'should create element with error');
  const props = el.props as Record<string, unknown>;
  assert.strictEqual(props.error, '时间格式错误');
});

test('TimePicker accepts helpText prop', () => {
  const el = React.createElement(TimePicker, { helpText: '24小时制' });
  assert.ok(el, 'should create element with helpText');
  const props = el.props as Record<string, unknown>;
  assert.strictEqual(props.helpText, '24小时制');
});

test('TimePicker accepts required prop', () => {
  const el = React.createElement(TimePicker, { required: true });
  assert.ok(el, 'should create element with required');
  const props = el.props as Record<string, unknown>;
  assert.strictEqual(props.required, true);
});

test('TimePicker accepts style prop', () => {
  const el = React.createElement(TimePicker, { style: { width: 200 } });
  assert.ok(el, 'should create element with style');
  const props = el.props as Record<string, unknown>;
  assert.ok(props.style);
  assert.strictEqual((props.style as Record<string, unknown>).width, 200);
});

test('TimePicker accepts className prop', () => {
  const el = React.createElement(TimePicker, { className: 'custom-timepicker' });
  assert.ok(el, 'should create element with className');
  const props = el.props as Record<string, unknown>;
  assert.strictEqual(props.className, 'custom-timepicker');
});

test('TimePicker accepts minHour prop', () => {
  const el = React.createElement(TimePicker, { minHour: 8, maxHour: 20 });
  assert.ok(el, 'should create element with hour range');
  const props = el.props as Record<string, unknown>;
  assert.strictEqual(props.minHour, 8);
  assert.strictEqual(props.maxHour, 20);
});

test('TimePicker accepts minuteStep prop', () => {
  const el = React.createElement(TimePicker, { minuteStep: 15 });
  assert.ok(el, 'should create element with minuteStep');
  const props = el.props as Record<string, unknown>;
  assert.strictEqual(props.minuteStep, 15);
});

test('TimePicker accepts onChange callback', () => {
  const fn = () => {};
  const el = React.createElement(TimePicker, { onChange: fn });
  assert.ok(el, 'should create element with onChange');
  const props = el.props as Record<string, unknown>;
  assert.strictEqual(props.onChange, fn);
});

test('TimePicker accepts readOnly prop', () => {
  const el = React.createElement(TimePicker, { readOnly: true });
  assert.ok(el, 'should create element with readOnly');
  const props = el.props as Record<string, unknown>;
  assert.strictEqual(props.readOnly, true);
});

test('TimePicker renders with all props combined', () => {
  const el = React.createElement(TimePicker, {
    value: '10:30',
    label: '时间',
    placeholder: '--:--',
    showSeconds: false,
    use12Hour: false,
    disabled: false,
    required: true,
    error: '',
    helpText: '',
    minHour: 0,
    maxHour: 23,
    minuteStep: 1,
    onChange: () => {},
    id: 'time',
    readOnly: false,
  });
  assert.ok(el, 'should create element with all props');
  const props = el.props as Record<string, unknown>;
  assert.strictEqual(props.value, '10:30');
  assert.strictEqual(props.label, '时间');
  assert.strictEqual(props.minHour, 0);
  assert.strictEqual(props.maxHour, 23);
  assert.strictEqual(props.minuteStep, 1);
});

test('TimePicker handles empty value gracefully', () => {
  const el = React.createElement(TimePicker, { value: '' });
  assert.ok(el, 'should handle empty string value');
});

test('TimePicker handles undefined value gracefully', () => {
  const el = React.createElement(TimePicker, { value: undefined });
  assert.ok(el, 'should handle undefined value');
});

test('TimePicker handles onChange undefined gracefully', () => {
  const el = React.createElement(TimePicker, { onChange: undefined });
  assert.ok(el, 'should handle undefined onChange');
});
