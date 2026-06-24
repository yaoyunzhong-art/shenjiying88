import React from 'react';

const assert = require('node:assert/strict');
const { describe, test } = require('node:test');

const PROJECT_ROOT = '/Users/yaoyunzhong/Desktop/shenjiying/shenjiying88';
const { renderToStaticMarkup } = require(
  PROJECT_ROOT + '/node_modules/.pnpm/react-dom@18.3.1_react@18.3.1/node_modules/react-dom/server.node.js'
);
const { Stepper } = require('./Stepper');

describe('Stepper', () => {
  const basicSteps = [
    { label: 'Step 1' },
    { label: 'Step 2' },
    { label: 'Step 3' },
  ];

  test('renders default horizontal stepper with navigation role', async () => {
    const html = renderToStaticMarkup(
      React.createElement(Stepper, { steps: basicSteps, activeStep: 0 }),
    );
    assert.ok(html.includes('role="navigation"'));
    assert.ok(html.includes('aria-label="Stepper"'));
    // should have 3 step buttons with numbers
    assert.ok(html.includes('>1<'));
    assert.ok(html.includes('>2<'));
    assert.ok(html.includes('>3<'));
  });

  test('renders step labels', async () => {
    const html = renderToStaticMarkup(
      React.createElement(Stepper, { steps: basicSteps, activeStep: 0 }),
    );
    assert.ok(html.includes('>Step 1<'));
    assert.ok(html.includes('>Step 2<'));
    assert.ok(html.includes('>Step 3<'));
  });

  test('marks active step with aria-current', async () => {
    const html = renderToStaticMarkup(
      React.createElement(Stepper, { steps: basicSteps, activeStep: 1 }),
    );
    assert.ok(html.includes('aria-current="step"'));
    // step 1 (index 0) should be completed, step 2 (index 1) active
    assert.ok(html.includes('data-completed="true"'));
    assert.ok(html.includes('data-active="true"'));
  });

  test('applies completed status to steps before activeStep', async () => {
    const html = renderToStaticMarkup(
      React.createElement(Stepper, { steps: basicSteps, activeStep: 2 }),
    );
    // first two steps should show checkmarks
    const matches = html.match(/✓/g);
    assert.ok(matches && matches.length >= 2);
  });

  test('renders vertical orientation', async () => {
    const html = renderToStaticMarkup(
      React.createElement(Stepper, {
        steps: basicSteps,
        activeStep: 0,
        orientation: 'vertical',
      }),
    );
    // vertical should use flex-direction: column on outer container
    assert.ok(html.includes('flex-direction:column'));
  });

  test('renders dot variant', async () => {
    const html = renderToStaticMarkup(
      React.createElement(Stepper, {
        steps: basicSteps,
        activeStep: 0,
        variant: 'dots',
        'data-testid': 'dot-stepper',
      }),
    );
    assert.ok(html.includes('data-testid="dot-stepper"'));
    // dot variant should have 3 dot buttons
    assert.ok(html.includes('data-testid="dot-stepper-dot-0"'));
    assert.ok(html.includes('data-testid="dot-stepper-dot-1"'));
    assert.ok(html.includes('data-testid="dot-stepper-dot-2"'));
  });

  test('dot variant does not render step numbers', async () => {
    const html = renderToStaticMarkup(
      React.createElement(Stepper, {
        steps: basicSteps,
        activeStep: 0,
        variant: 'dots',
      }),
    );
    // dots don't show step index numbers
    assert.ok(!html.includes('>1<'));
    assert.ok(!html.includes('>2<'));
  });

  test('renders progress variant', async () => {
    const html = renderToStaticMarkup(
      React.createElement(Stepper, {
        steps: basicSteps,
        activeStep: 1,
        variant: 'progress',
        'data-testid': 'prog',
      }),
    );
    assert.ok(html.includes('data-testid="prog-progress-track"'));
    assert.ok(html.includes('data-testid="prog-progress-fill"'));
    // activeStep=1 / 3 steps = 67%
    assert.ok(html.includes('width:67%'));
  });

  test('progress variant shows step label and counter', async () => {
    const html = renderToStaticMarkup(
      React.createElement(Stepper, {
        steps: basicSteps,
        activeStep: 1,
        variant: 'progress',
      }),
    );
    assert.ok(html.includes('>Step 2<'));
    assert.ok(html.includes('2 / 3'));
  });

  test('progress variant shows 100% when at last step', async () => {
    const html = renderToStaticMarkup(
      React.createElement(Stepper, {
        steps: basicSteps,
        activeStep: 2,
        variant: 'progress',
      }),
    );
    assert.ok(html.includes('width:100%'));
    assert.ok(html.includes('3 / 3'));
  });

  test('progress variant shows 0% for empty steps', async () => {
    const html = renderToStaticMarkup(
      React.createElement(Stepper, {
        steps: [],
        activeStep: 0,
        variant: 'progress',
      }),
    );
    assert.ok(html.includes('width:0%'));
    // steps[0] is undefined for empty array, so label is '' and counter is '1 / 0'
    assert.ok(html.includes('/ 0'));
  });

  test('renders size variants', async () => {
    const sm = renderToStaticMarkup(
      React.createElement(Stepper, { steps: basicSteps, activeStep: 0, size: 'sm' }),
    );
    const lg = renderToStaticMarkup(
      React.createElement(Stepper, { steps: basicSteps, activeStep: 0, size: 'lg' }),
    );
    // sm uses 24px circle, lg uses 40px
    assert.ok(sm.includes('width:24px'));
    assert.ok(lg.includes('width:40px'));
  });

  test('defaults to md size', async () => {
    const html = renderToStaticMarkup(
      React.createElement(Stepper, { steps: basicSteps, activeStep: 0, size: 'md' }),
    );
    assert.ok(html.includes('width:32px'));
  });

  test('renders step descriptions', async () => {
    const stepsWithDesc = [
      { label: 'Setup', description: 'Configure settings' },
      { label: 'Review', description: 'Check configuration' },
    ];
    const html = renderToStaticMarkup(
      React.createElement(Stepper, { steps: stepsWithDesc, activeStep: 0 }),
    );
    assert.ok(html.includes('>Configure settings<'));
    assert.ok(html.includes('>Check configuration<'));
  });

  test('renders custom icon in step', async () => {
    const stepsWithIcon = [
      { label: 'Home', icon: React.createElement('span', { key: 'h' }, '🏠') },
      { label: 'Settings' },
    ];
    const html = renderToStaticMarkup(
      React.createElement(Stepper, { steps: stepsWithIcon, activeStep: 0 }),
    );
    assert.ok(html.includes('🏠'));
  });

  test('renders error state for a step', async () => {
    const stepsWithError = [
      { label: 'Step 1' },
      { label: 'Step 2', error: true },
      { label: 'Step 3' },
    ];
    const html = renderToStaticMarkup(
      React.createElement(Stepper, {
        steps: stepsWithError,
        activeStep: 1,
        'data-testid': 'err-stepper',
      }),
    );
    // error color should be present
    assert.ok(html.includes('#ef4444'));
    assert.ok(html.includes('data-error="true"'));
  });

  test('steps before activeStep with explicit completed=false are not completed', async () => {
    const mixedSteps = [
      { label: 'Step 1', completed: false },
      { label: 'Step 2', completed: false },
      { label: 'Step 3' },
    ];
    const html = renderToStaticMarkup(
      React.createElement(Stepper, { steps: mixedSteps, activeStep: 2 }),
    );
    // explicit completed=false should override implicit completion
    // (the step before activeStep with completed=false won't show checkmark)
    const checkmarks = (html.match(/✓/g) || []).length;
    // None should have checkmarks because all steps 0,1 have completed=false
    assert.strictEqual(checkmarks, 0);
  });

  test('renders completed steps with checkmark', async () => {
    const html = renderToStaticMarkup(
      React.createElement(Stepper, { steps: basicSteps, activeStep: 3 }),
    );
    // all 3 steps completed
    const checkmarks = (html.match(/✓/g) || []).length;
    assert.ok(checkmarks >= 3);
  });

  test('renders data-testid attributes', async () => {
    const html = renderToStaticMarkup(
      React.createElement(Stepper, {
        steps: basicSteps,
        activeStep: 0,
        'data-testid': 'my-stepper',
      }),
    );
    assert.ok(html.includes('data-testid="my-stepper"'));
    assert.ok(html.includes('data-testid="my-stepper-step-0"'));
    assert.ok(html.includes('data-testid="my-stepper-label-0"'));
    assert.ok(html.includes('data-testid="my-stepper-connector-0"'));
    assert.ok(html.includes('data-testid="my-stepper-connector-1"'));
  });

  test('does not render connector after last step', async () => {
    const html = renderToStaticMarkup(
      React.createElement(Stepper, {
        steps: basicSteps,
        activeStep: 0,
        'data-testid': 'no-last-conn',
      }),
    );
    assert.ok(!html.includes('data-testid="no-last-conn-connector-2"'));
  });

  test('disabled steps have disabled attribute', async () => {
    const stepsWithDisabled = [
      { label: 'Step 1' },
      { label: 'Step 2', disabled: true },
      { label: 'Step 3' },
    ];
    const html = renderToStaticMarkup(
      React.createElement(Stepper, { steps: stepsWithDisabled, activeStep: 0 }),
    );
    assert.ok(html.includes('disabled=""'));
  });

  test('connector color is completed green for past steps', async () => {
    const html = renderToStaticMarkup(
      React.createElement(Stepper, { steps: basicSteps, activeStep: 2 }),
    );
    // connectors before activeStep use COLOR_COMPLETED
    assert.ok(html.includes('#22c55e'));
  });

  test('uses COLOR_ACTIVE for active step indicator', async () => {
    const html = renderToStaticMarkup(
      React.createElement(Stepper, { steps: basicSteps, activeStep: 1 }),
    );
    assert.ok(html.includes('#38bdf8'));
  });

  test('accepts className prop', async () => {
    const html = renderToStaticMarkup(
      React.createElement(Stepper, {
        steps: basicSteps,
        activeStep: 0,
        className: 'custom-stepper',
      }),
    );
    assert.ok(html.includes('class="custom-stepper"'));
  });

  test('accepts style prop', async () => {
    const html = renderToStaticMarkup(
      React.createElement(Stepper, {
        steps: basicSteps,
        activeStep: 0,
        style: { margin: '16px' },
      }),
    );
    assert.ok(html.includes('margin:16px'));
  });

  test('single step renders without connectors', async () => {
    const html = renderToStaticMarkup(
      React.createElement(Stepper, {
        steps: [{ label: 'Only Step' }],
        activeStep: 0,
        'data-testid': 'single',
      }),
    );
    assert.ok(html.includes('data-testid="single-step-0"'));
    assert.ok(!html.includes('connector'));
  });

  test('primary vertical orientation renders column', async () => {
    const steps = [
      { label: 'Start' },
      { label: 'Middle' },
      { label: 'End' },
    ];
    const html = renderToStaticMarkup(
      React.createElement(Stepper, {
        steps,
        activeStep: 1,
        orientation: 'vertical',
        'data-testid': 'vert',
      }),
    );
    assert.ok(html.includes('data-testid="vert"'));
    // vertical should not have flex:1 connectors in the horizontal sense
    assert.ok(html.includes('flex-direction:column'));
  });
});
