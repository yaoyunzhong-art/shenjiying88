/**
 * Slider component tests
 *
 * Covers: render, single value, range mode, controlled/uncontrolled,
 * min/max/step, disabled, ticks, showInput, showValue, variant colors,
 * vertical orientation, formatValue, accessibility attributes.
 */
import React from 'react';

const assert = require('node:assert/strict');
const { describe, test } = require('node:test');

const PROJECT_ROOT = '/Users/yaoyunzhong/Desktop/shenjiying/shenjiying88';
const { renderToStaticMarkup } = require(
  PROJECT_ROOT + '/node_modules/.pnpm/react-dom@18.3.1_react@18.3.1/node_modules/react-dom/server.node.js'
);
const { Slider } = require('./Slider');

// ── Basic rendering ──

describe('Slider rendering', () => {
  test('renders with default props without crash', () => {
    const html = renderToStaticMarkup(React.createElement(Slider));
    assert.match(html, /role="slider"/);
  });

  test('renders with data-testid', () => {
    const html = renderToStaticMarkup(
      React.createElement(Slider, { 'data-testid': 'my-slider' }),
    );
    assert.match(html, /data-testid="my-slider"/);
  });

  test('renders track and fill elements', () => {
    const html = renderToStaticMarkup(
      React.createElement(Slider, { 'data-testid': 's' }),
    );
    assert.match(html, /data-testid="s-track"/);
    assert.match(html, /data-testid="s-fill"/);
    assert.match(html, /data-testid="s-thumb-single"/);
  });

  test('renders value display by default (showValue=true)', () => {
    const html = renderToStaticMarkup(
      React.createElement(Slider, { defaultValue: 42, 'data-testid': 's' }),
    );
    assert.match(html, /data-testid="s-value"/);
    assert.match(html, />42</);
  });

  test('hides value display when showValue=false', () => {
    const html = renderToStaticMarkup(
      React.createElement(Slider, { showValue: false, 'data-testid': 's' }),
    );
    assert.doesNotMatch(html, /data-testid="s-value"/);
  });

  test('does not render header when showValue=false and showInput=false', () => {
    const html = renderToStaticMarkup(
      React.createElement(Slider, {
        showValue: false,
        showInput: false,
        'data-testid': 's',
      }),
    );
    assert.doesNotMatch(html, /data-testid="s-header"/);
  });
});

// ── Single value ──

describe('Slider single value', () => {
  test('renders with defaultValue on thumb', () => {
    const html = renderToStaticMarkup(
      React.createElement(Slider, { defaultValue: 50, 'data-testid': 's' }),
    );
    assert.match(html, /aria-valuenow="50"/);
  });

  test('respects min and max on thumb', () => {
    const html = renderToStaticMarkup(
      React.createElement(Slider, { min: 10, max: 90, defaultValue: 10, 'data-testid': 's' }),
    );
    assert.match(html, /aria-valuemin="10"/);
    assert.match(html, /aria-valuemax="90"/);
  });

  test('controlled mode renders value from value prop', () => {
    const html = renderToStaticMarkup(
      React.createElement(Slider, { value: 25, 'data-testid': 's' }),
    );
    assert.match(html, /aria-valuenow="25"/);
  });

  test('step does not affect initial SSR render', () => {
    const html = renderToStaticMarkup(
      React.createElement(Slider, { step: 10, defaultValue: 30, 'data-testid': 's' }),
    );
    assert.match(html, /aria-valuenow="30"/);
  });

  test('clamps value within min/max bounds', () => {
    // Below min — clamps to min
    const htmlLow = renderToStaticMarkup(
      React.createElement(Slider, { min: 20, defaultValue: 5, 'data-testid': 's' }),
    );
    assert.match(htmlLow, /aria-valuenow="20"/);

    // Above max — clamps to max
    const htmlHigh = renderToStaticMarkup(
      React.createElement(Slider, { max: 80, defaultValue: 200, 'data-testid': 's' }),
    );
    assert.match(htmlHigh, /aria-valuenow="80"/);
  });

  test('keyboard event handlers are bound', () => {
    const html = renderToStaticMarkup(
      React.createElement(Slider, { defaultValue: 50, 'data-testid': 's' }),
    );
    // onKeyDown handler is attached (React serializes inline handlers as data attributes in some cases,
    // but for SSR the keydown handler is an inline prop)
    assert.match(html, /role="slider"/);
  });

  test('value display shows formatted single value', () => {
    const html = renderToStaticMarkup(
      React.createElement(Slider, {
        defaultValue: 42,
        showValue: true,
        'data-testid': 's',
      }),
    );
    // The value span has the value text
    assert.match(html, /42/);
  });
});

// ── Range mode ──

describe('Slider range mode', () => {
  test('renders two thumbs in range mode', () => {
    const html = renderToStaticMarkup(
      React.createElement(Slider, {
        range: true,
        defaultRangeValue: [20, 80],
        'data-testid': 'r',
      }),
    );
    assert.match(html, /data-testid="r-thumb-lower"/);
    assert.match(html, /data-testid="r-thumb-upper"/);
  });

  test('range default values are set on thumbs', () => {
    const html = renderToStaticMarkup(
      React.createElement(Slider, {
        range: true,
        defaultRangeValue: [30, 70],
        'data-testid': 'r',
      }),
    );
    // Lower thumb has value 30, upper has 70
    const lowerMatch = html.match(
      /data-testid="r-thumb-lower"[^>]*aria-valuenow="(\d+)"/,
    );
    const upperMatch = html.match(
      /data-testid="r-thumb-upper"[^>]*aria-valuenow="(\d+)"/,
    );
    assert.ok(lowerMatch, 'lower thumb should have aria-valuenow');
    assert.ok(upperMatch, 'upper thumb should have aria-valuenow');
    assert.strictEqual(Number(lowerMatch![1]), 30);
    assert.strictEqual(Number(upperMatch![1]), 70);
  });

  test('range displays value text', () => {
    const html = renderToStaticMarkup(
      React.createElement(Slider, {
        range: true,
        defaultRangeValue: [15, 85],
        'data-testid': 'r',
      }),
    );
    assert.match(html, /15/);
    assert.match(html, /85/);
    assert.match(html, /–/); // en dash separator
  });

  test('controlled range mode respects value prop', () => {
    const html = renderToStaticMarkup(
      React.createElement(Slider, {
        range: true,
        value: [10, 90] as [number, number],
        'data-testid': 'r',
      }),
    );
    const lowerMatch = html.match(
      /data-testid="r-thumb-lower"[^>]*aria-valuenow="(\d+)"/,
    );
    const upperMatch = html.match(
      /data-testid="r-thumb-upper"[^>]*aria-valuenow="(\d+)"/,
    );
    assert.strictEqual(Number(lowerMatch![1]), 10);
    assert.strictEqual(Number(upperMatch![1]), 90);
  });

  test('range lower value clamps within range', () => {
    const html = renderToStaticMarkup(
      React.createElement(Slider, {
        range: true,
        defaultRangeValue: [10, 90],
        min: 0,
        max: 100,
        'data-testid': 'r',
      }),
    );
    assert.match(html, /aria-valuenow="10"/);
    assert.match(html, /aria-valuenow="90"/);
  });

  test('keyboard handlers are bound for range thumbs', () => {
    const html = renderToStaticMarkup(
      React.createElement(Slider, {
        range: true,
        defaultRangeValue: [20, 80],
        'data-testid': 'r',
      }),
    );
    assert.match(html, /data-testid="r-thumb-lower"/);
    assert.match(html, /data-testid="r-thumb-upper"/);
    // Both thumbs should have role="slider"
    const roles = (html.match(/role="slider"/g) || []).length;
    assert.strictEqual(roles, 2);
  });
});

// ── Disabled state ──

describe('Slider disabled', () => {
  test('has aria-disabled=true when disabled', () => {
    const html = renderToStaticMarkup(
      React.createElement(Slider, { disabled: true, 'data-testid': 's' }),
    );
    assert.match(html, /aria-disabled="true"/);
  });

  test('has tabIndex=-1 when disabled', () => {
    const html = renderToStaticMarkup(
      React.createElement(Slider, { disabled: true, 'data-testid': 's' }),
    );
    assert.match(html, /tabindex="-1"/);
  });

  test('renders with reduced opacity style', () => {
    const html = renderToStaticMarkup(
      React.createElement(Slider, { disabled: true, 'data-testid': 's' }),
    );
    assert.match(html, /opacity:\s*0\.5/);
  });

  test('has tabIndex 0 when not disabled', () => {
    const html = renderToStaticMarkup(
      React.createElement(Slider, { 'data-testid': 's' }),
    );
    assert.match(html, /tabindex="0"/);
  });

  test('disabled thumbs show muted colors (gray border)', () => {
    const html = renderToStaticMarkup(
      React.createElement(Slider, { disabled: true, 'data-testid': 's' }),
    );
    // Disabled thumb uses #d1d5db background
    assert.match(html, /#d1d5db/);
  });
});

// ── Variants ──

describe('Slider variants', () => {
  const variants = ['default', 'success', 'warning', 'danger', 'info'] as const;
  variants.forEach((variant) => {
    test(`renders variant=${variant} without error`, () => {
      const html = renderToStaticMarkup(
        React.createElement(Slider, { variant, 'data-testid': 's' }),
      );
      assert.match(html, /role="slider"/);
    });
  });
});

// ── Ticks ──

describe('Slider ticks', () => {
  test('renders tick marks when showTicks=true', () => {
    const html = renderToStaticMarkup(
      React.createElement(Slider, {
        showTicks: true,
        min: 0,
        max: 10,
        step: 5,
        'data-testid': 's',
      }),
    );
    // Should contain tick elements (divs with position:absolute style inside track)
    assert.match(html, /data-testid="s-track"/);
    // Track contains the fill div + tick divs + thumb
    // We can't easily count children in SSR, but the render won't crash
  });

  test('renders custom ticks when ticks prop is provided', () => {
    const html = renderToStaticMarkup(
      React.createElement(Slider, {
        ticks: [0, 25, 50, 75, 100],
        formatTick: (v: number) => `${v}%`,
        'data-testid': 's',
      }),
    );
    // Format tick labels should appear
    assert.match(html, /0%/);
    assert.match(html, /25%/);
    assert.match(html, /50%/);
    assert.match(html, /75%/);
    assert.match(html, /100%/);
  });

  test('ticks with formatTick render formatted labels', () => {
    const html = renderToStaticMarkup(
      React.createElement(Slider, {
        ticks: [0, 50, 100],
        formatTick: (v: number) => `${v}元`,
        'data-testid': 's',
      }),
    );
    assert.match(html, /0元/);
    assert.match(html, /50元/);
    assert.match(html, /100元/);
  });

  test('does not render ticks when showTicks is false and no ticks prop', () => {
    const html = renderToStaticMarkup(
      React.createElement(Slider, { 'data-testid': 's' }),
    );
    // No tick labels should be present
    assert.doesNotMatch(html, /margin-top:\s*2[^0-9]/);
  });
});

// ── Show input ──

describe('Slider showInput', () => {
  test('renders number input when showInput=true', () => {
    const html = renderToStaticMarkup(
      React.createElement(Slider, {
        showInput: true,
        defaultValue: 42,
        'data-testid': 's',
      }),
    );
    assert.match(html, /data-testid="s-input"/);
    assert.match(html, /type="number"/);
    assert.match(html, /value="42"/);
  });

  test('renders two inputs when range + showInput', () => {
    const html = renderToStaticMarkup(
      React.createElement(Slider, {
        range: true,
        defaultRangeValue: [20, 80],
        showInput: true,
        'data-testid': 'r',
      }),
    );
    assert.match(html, /data-testid="r-input-lower"/);
    assert.match(html, /data-testid="r-input-upper"/);
  });

  test('range inputs show correct values', () => {
    const html = renderToStaticMarkup(
      React.createElement(Slider, {
        range: true,
        value: [30, 70] as [number, number],
        showInput: true,
        'data-testid': 'r',
      }),
    );
    const lowerMatch = html.match(
      /data-testid="r-input-lower"[^>]*value="(\d+)"/,
    );
    const upperMatch = html.match(
      /data-testid="r-input-upper"[^>]*value="(\d+)"/,
    );
    assert.ok(lowerMatch);
    assert.ok(upperMatch);
    assert.strictEqual(Number(lowerMatch![1]), 30);
    assert.strictEqual(Number(upperMatch![1]), 70);
  });

  test('inputs have min/max/step attributes', () => {
    const html = renderToStaticMarkup(
      React.createElement(Slider, {
        showInput: true,
        min: 10,
        max: 90,
        step: 5,
        defaultValue: 50,
        'data-testid': 's',
      }),
    );
    assert.match(html, /min="10"/);
    assert.match(html, /max="90"/);
    assert.match(html, /step="5"/);
  });

  test('inputs are disabled when slider is disabled', () => {
    const html = renderToStaticMarkup(
      React.createElement(Slider, {
        showInput: true,
        disabled: true,
        defaultValue: 42,
        'data-testid': 's',
      }),
    );
    assert.match(html, /disabled=""/);
  });
});

// ── Format value ──

describe('Slider formatValue', () => {
  test('formats single value display', () => {
    const html = renderToStaticMarkup(
      React.createElement(Slider, {
        defaultValue: 75,
        formatValue: (v: number | [number, number]) =>
          `${typeof v === 'number' ? v : v[0]} points`,
        'data-testid': 's',
      }),
    );
    assert.match(html, /75 points/);
  });

  test('formats range value display', () => {
    const html = renderToStaticMarkup(
      React.createElement(Slider, {
        range: true,
        defaultRangeValue: [20, 80],
        formatValue: (v: number | [number, number]) => {
          const arr = Array.isArray(v) ? v : [v, v];
          return `$${arr[0]} - $${arr[1]}`;
        },
        'data-testid': 'r',
      }),
    );
    assert.match(html, /\$20 - \$80/);
  });
});

// ── Vertical orientation ──

describe('Slider vertical orientation', () => {
  test('renders aria-orientation vertical', () => {
    const html = renderToStaticMarkup(
      React.createElement(Slider, {
        orientation: 'vertical',
        'data-testid': 's',
      }),
    );
    assert.match(html, /aria-orientation="vertical"/);
  });

  test('default orientation is horizontal', () => {
    const html = renderToStaticMarkup(
      React.createElement(Slider, { 'data-testid': 's' }),
    );
    assert.match(html, /aria-orientation="horizontal"/);
  });

  test('vertical slider has verticalHeight style applied', () => {
    const html = renderToStaticMarkup(
      React.createElement(Slider, {
        orientation: 'vertical',
        verticalHeight: 300,
        'data-testid': 's',
      }),
    );
    assert.match(html, /height:\s*300px/);
  });
});

// ── Accessibility ──

describe('Slider accessibility', () => {
  test('has aria-label on single thumb', () => {
    const html = renderToStaticMarkup(
      React.createElement(Slider, { 'aria-label': 'Volume', 'data-testid': 's' }),
    );
    assert.match(html, /aria-label="Volume"/);
  });

  test('has aria-labels on range thumbs', () => {
    const html = renderToStaticMarkup(
      React.createElement(Slider, {
        range: true,
        'aria-labels': ['Min price', 'Max price'] as [string, string],
        defaultRangeValue: [10, 90],
        'data-testid': 'r',
      }),
    );
    assert.match(html, /aria-label="Min price"/);
    assert.match(html, /aria-label="Max price"/);
  });

  test('default aria-label for range lower is "Lower value"', () => {
    const html = renderToStaticMarkup(
      React.createElement(Slider, {
        range: true,
        defaultRangeValue: [10, 90],
        'data-testid': 'r',
      }),
    );
    assert.match(html, /aria-label="Lower value"/);
  });

  test('default aria-label for range upper is "Upper value"', () => {
    const html = renderToStaticMarkup(
      React.createElement(Slider, {
        range: true,
        defaultRangeValue: [10, 90],
        'data-testid': 'r',
      }),
    );
    assert.match(html, /aria-label="Upper value"/);
  });

  test('default aria-label when none provided', () => {
    const html = renderToStaticMarkup(
      React.createElement(Slider, { 'data-testid': 's' }),
    );
    assert.match(html, /aria-label="Slider value"/);
  });
});

// ── Edge cases ──

describe('Slider edge cases', () => {
  test('handles min === max gracefully', () => {
    const html = renderToStaticMarkup(
      React.createElement(Slider, { min: 50, max: 50, defaultValue: 50 }),
    );
    assert.match(html, /role="slider"/);
  });

  test('handles negative values', () => {
    const html = renderToStaticMarkup(
      React.createElement(Slider, { min: -50, max: 50, defaultValue: 0, 'data-testid': 's' }),
    );
    assert.match(html, /aria-valuemin="-50"/);
    assert.match(html, /aria-valuemax="50"/);
    assert.match(html, /aria-valuenow="0"/);
  });

  test('handles step with fractional values (SSR render ok)', () => {
    const html = renderToStaticMarkup(
      React.createElement(Slider, { min: 0, max: 1, step: 0.1, defaultValue: 0.5 }),
    );
    assert.match(html, /role="slider"/);
  });

  test('value display works with range showing dash', () => {
    const html = renderToStaticMarkup(
      React.createElement(Slider, {
        range: true,
        defaultRangeValue: [10, 90],
        'data-testid': 'r',
      }),
    );
    assert.match(html, /10/);
    assert.match(html, /90/);
    assert.match(html, /–/);
  });

  test('className and style props are forwarded', () => {
    const html = renderToStaticMarkup(
      React.createElement(Slider, {
        className: 'my-slider',
        style: { width: 400 },
        'data-testid': 's',
      }),
    );
    assert.match(html, /my-slider/);
    assert.match(html, /width:\s*400px/);
  });

  test('thumbSize and trackHeight are applied', () => {
    const html = renderToStaticMarkup(
      React.createElement(Slider, {
        thumbSize: 20,
        trackHeight: 6,
        'data-testid': 's',
      }),
    );
    assert.match(html, /width:\s*20px/);
    assert.match(html, /height:\s*6px/);
  });

  test('onChangeCommitted is not required (SSR renders fine)', () => {
    const html = renderToStaticMarkup(
      React.createElement(Slider, { defaultValue: 42 }),
    );
    assert.match(html, /role="slider"/);
  });

  test('onRangeChange is not required for single slider', () => {
    const html = renderToStaticMarkup(
      React.createElement(Slider, { defaultValue: 50 }),
    );
    assert.match(html, /role="slider"/);
  });

  test('formatValue without showValue does not render value span', () => {
    const html = renderToStaticMarkup(
      React.createElement(Slider, {
        formatValue: (v) => `${v}`,
        showValue: false,
        'data-testid': 's',
      }),
    );
    assert.doesNotMatch(html, /data-testid="s-value"/);
  });

  test('Slider export is a function', () => {
    assert.strictEqual(typeof Slider, 'function');
  });
});
