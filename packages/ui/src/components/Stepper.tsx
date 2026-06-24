'use client';
import React from 'react';

export interface StepperStep {
  /** Step label (required) */
  label: string;
  /** Optional description shown below the label */
  description?: string;
  /** Step icon or index badge override */
  icon?: React.ReactNode;
  /** Mark step as completed; skips click-keyboard interaction when false */
  completed?: boolean;
  /** Mark step as having an error */
  error?: boolean;
  /** Disable interaction for this step */
  disabled?: boolean;
}

export interface StepperProps {
  /** Ordered steps */
  steps: StepperStep[];
  /** Current active step (0-indexed) */
  activeStep: number;
  /** Called when a step label is clicked (unless disabled or future-only) */
  onStepClick?: (stepIndex: number) => void;
  /** Orientation */
  orientation?: 'horizontal' | 'vertical';
  /** Visual variant */
  variant?: 'default' | 'dots' | 'progress';
  /** Size preset */
  size?: 'sm' | 'md' | 'lg';
  /** Test id */
  'data-testid'?: string;
  /** Extra class */
  className?: string;
  /** Inline styles */
  style?: React.CSSProperties;
}

const SIZE_MAP: Record<string, { circle: number; font: number; gap: number }> = {
  sm: { circle: 24, font: 12, gap: 6 },
  md: { circle: 32, font: 14, gap: 8 },
  lg: { circle: 40, font: 16, gap: 10 },
};

const COLOR_COMPLETED = '#22c55e';
const COLOR_ACTIVE = '#38bdf8';
const COLOR_ERROR = '#ef4444';
const COLOR_PENDING = 'rgba(148, 163, 184, 0.4)';
const COLOR_TEXT = '#e2e8f0';
const COLOR_TEXT_MUTED = '#94a3b8';

function stepIndicator(
  step: StepperStep,
  index: number,
  isActive: boolean,
  isCompleted: boolean,
  hasError: boolean,
  disabled: boolean,
  s: ReturnType<typeof getSize>,
) {
  let bg = COLOR_PENDING;
  let fg = COLOR_TEXT;
  if (hasError) {
    bg = COLOR_ERROR;
    fg = '#fff';
  } else if (isCompleted) {
    bg = COLOR_COMPLETED;
    fg = '#fff';
  } else if (isActive) {
    bg = COLOR_ACTIVE;
    fg = '#0f172a';
  }

  if (step.icon) {
    return (
      <div
        style={{
          width: s.circle,
          height: s.circle,
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: bg,
          color: fg,
          fontSize: s.font,
          fontWeight: 700,
          flexShrink: 0,
          opacity: disabled ? 0.45 : 1,
          transition: 'background 0.2s',
        }}
      >
        {step.icon}
      </div>
    );
  }

  if (isCompleted) {
    return (
      <div
        style={{
          width: s.circle,
          height: s.circle,
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: bg,
          color: fg,
          fontSize: s.font,
          fontWeight: 700,
          flexShrink: 0,
          opacity: disabled ? 0.45 : 1,
          transition: 'background 0.2s',
        }}
      >
        ✓
      </div>
    );
  }

  return (
    <div
      style={{
        width: s.circle,
        height: s.circle,
        borderRadius: '50%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: bg,
        color: fg,
        fontSize: s.font,
        fontWeight: 700,
        flexShrink: 0,
        border: !isActive && !hasError ? '2px solid rgba(148, 163, 184, 0.35)' : undefined,
        opacity: disabled ? 0.45 : 1,
        transition: 'background 0.2s',
      }}
    >
      {index + 1}
    </div>
  );
}

function getSize(size: StepperProps['size']): { circle: number; font: number; gap: number } {
  return SIZE_MAP[size ?? 'md']!;
}

/**
 * Stepper — multi-step progress indicator with horizontal/vertical layout,
 * dot / progress variants, and clickable step navigation.
 *
 * Common use-cases: onboarding wizards, checkout flows, multi-page forms.
 */
export function Stepper({
  steps,
  activeStep,
  onStepClick,
  orientation = 'horizontal',
  variant = 'default',
  size = 'md',
  'data-testid': dataTestId,
  className,
  style,
}: StepperProps) {
  const s = getSize(size);

  if (variant === 'dots') {
    return (
      <div
        data-testid={dataTestId}
        className={className}
        role="navigation"
        aria-label="Stepper"
        style={{
          display: 'flex',
          flexDirection: orientation === 'vertical' ? 'column' : 'row',
          alignItems: 'center',
          gap: s.gap,
          ...style,
        }}
      >
        {steps.map((step, i) => {
          const isActive = i === activeStep;
          const isCompleted = step.completed ?? i < activeStep;
          const hasError = step.error ?? false;
          const disabled = step.disabled ?? false;

          return (
            <button
              key={i}
              type="button"
              data-testid={dataTestId ? `${dataTestId}-dot-${i}` : undefined}
              data-active={isActive ? 'true' : undefined}
              data-completed={isCompleted ? 'true' : undefined}
              disabled={disabled}
              aria-current={isActive ? 'step' : undefined}
              aria-label={`Step ${i + 1}: ${step.label}${isCompleted ? ' (completed)' : ''}${hasError ? ' (error)' : ''}`}
              onClick={() => {
                if (!disabled && onStepClick) onStepClick(i);
              }}
              style={{
                width: s.circle * 0.5,
                height: s.circle * 0.5,
                borderRadius: '50%',
                border: 'none',
                padding: 0,
                cursor: disabled ? 'not-allowed' : 'pointer',
                background: hasError
                  ? COLOR_ERROR
                  : isCompleted
                    ? COLOR_COMPLETED
                    : isActive
                      ? COLOR_ACTIVE
                      : COLOR_PENDING,
                opacity: disabled ? 0.45 : 1,
                transition: 'background 0.2s',
              }}
            />
          );
        })}
      </div>
    );
  }

  if (variant === 'progress') {
    const pct = steps.length > 0 ? Math.round(((activeStep + 1) / steps.length) * 100) : 0;
    return (
      <div
        data-testid={dataTestId}
        className={className}
        role="navigation"
        aria-label="Stepper"
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: s.gap,
          width: '100%',
          ...style,
        }}
      >
        <div
          data-testid={dataTestId ? `${dataTestId}-progress-track` : undefined}
          style={{
            width: '100%',
            height: s.circle * 0.25,
            borderRadius: s.circle * 0.125,
            background: 'rgba(148, 163, 184, 0.15)',
            overflow: 'hidden',
          }}
        >
          <div
            data-testid={dataTestId ? `${dataTestId}-progress-fill` : undefined}
            style={{
              height: '100%',
              width: `${pct}%`,
              borderRadius: s.circle * 0.125,
              background: COLOR_ACTIVE,
              transition: 'width 0.3s ease',
            }}
          />
        </div>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            fontSize: s.font,
            color: COLOR_TEXT_MUTED,
          }}
        >
          <span data-testid={dataTestId ? `${dataTestId}-progress-label` : undefined}>
            {steps[activeStep]?.label ?? ''}
          </span>
          <span>
            {activeStep + 1} / {steps.length}
          </span>
        </div>
      </div>
    );
  }

  // default variant
  const isVertical = orientation === 'vertical';

  return (
    <div
      data-testid={dataTestId}
      className={className}
      role="navigation"
      aria-label="Stepper"
      style={{
        display: 'flex',
        flexDirection: isVertical ? 'column' : 'row',
        alignItems: isVertical ? 'flex-start' : 'center',
        gap: 0,
        ...style,
      }}
    >
      {steps.map((step, i) => {
        const isActive = i === activeStep;
        const isCompleted = step.completed ?? i < activeStep;
        const hasError = step.error ?? false;
        const disabled = step.disabled ?? false;
        const isLast = i === steps.length - 1;

        return (
          <React.Fragment key={i}>
            {/* Step node */}
            <div
              style={{
                display: 'flex',
                flexDirection: isVertical ? 'row' : 'column',
                alignItems: 'center',
                gap: s.gap,
                flex: isVertical ? undefined : '0 0 auto',
              }}
            >
              <button
                type="button"
                data-testid={dataTestId ? `${dataTestId}-step-${i}` : undefined}
                data-active={isActive ? 'true' : undefined}
                data-completed={isCompleted ? 'true' : undefined}
                data-error={hasError ? 'true' : undefined}
                disabled={disabled}
                aria-current={isActive ? 'step' : undefined}
                aria-label={`Step ${i + 1}: ${step.label}${isCompleted ? ' (completed)' : ''}${hasError ? ' (error)' : ''}`}
                onClick={() => {
                  if (!disabled && onStepClick) onStepClick(i);
                }}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: 'none',
                  border: 'none',
                  padding: 0,
                  cursor: disabled ? 'not-allowed' : 'pointer',
                  lineHeight: 1,
                }}
              >
                {stepIndicator(step, i, isActive, isCompleted, hasError, disabled, s)}
              </button>

              {/* Label + description */}
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: isVertical ? 'flex-start' : 'center',
                  minWidth: 0,
                  textAlign: isVertical ? 'left' : 'center',
                }}
              >
                <span
                  data-testid={dataTestId ? `${dataTestId}-label-${i}` : undefined}
                  style={{
                    fontSize: s.font,
                    fontWeight: isActive ? 700 : 500,
                    color: hasError
                      ? COLOR_ERROR
                      : isActive
                        ? COLOR_ACTIVE
                        : isCompleted
                          ? COLOR_COMPLETED
                          : COLOR_TEXT_MUTED,
                    lineHeight: 1.3,
                    transition: 'color 0.2s',
                  }}
                >
                  {step.label}
                </span>
                {step.description ? (
                  <span
                    data-testid={dataTestId ? `${dataTestId}-desc-${i}` : undefined}
                    style={{
                      fontSize: s.font * 0.85,
                      color: COLOR_TEXT_MUTED,
                      marginTop: 2,
                      lineHeight: 1.3,
                    }}
                  >
                    {step.description}
                  </span>
                ) : null}
              </div>
            </div>

            {/* Connector line */}
            {!isLast ? (
              <div
                data-testid={dataTestId ? `${dataTestId}-connector-${i}` : undefined}
                style={{
                  flex: isVertical ? `0 0 ${s.circle + s.gap * 2}px` : '1 1 0',
                  [isVertical ? 'height' : 'width']: isVertical ? undefined : '100%',
                  [isVertical ? 'width' : 'height']: 2,
                  minWidth: isVertical ? 2 : s.circle,
                  minHeight: isVertical ? s.circle : 2,
                  margin: isVertical ? `0 0 0 ${s.circle / 2 - 1}px` : undefined,
                  background:
                    i < activeStep ? COLOR_COMPLETED : 'rgba(148, 163, 184, 0.2)',
                  transition: 'background 0.3s',
                }}
              />
            ) : null}
          </React.Fragment>
        );
      })}
    </div>
  );
}
