'use client';
import React, { useState, useCallback, useRef, useEffect, useId } from 'react';

export interface SliderProps {
  /** Current value (single) or [min, max] range */
  value?: number | [number, number];
  /** Default value for uncontrolled single mode */
  defaultValue?: number;
  /** Default value for uncontrolled range mode */
  defaultRangeValue?: [number, number];
  /** Minimum value, default 0 */
  min?: number;
  /** Maximum value, default 100 */
  max?: number;
  /** Step increment, default 1 */
  step?: number;
  /** Whether slider represents a range [min, max] */
  range?: boolean;
  /** Show current value tooltip above thumb */
  showValue?: boolean;
  /** Format value display, receives value or [value1, value2] */
  formatValue?: (value: number | [number, number]) => string;
  /** Show tick marks at step intervals */
  showTicks?: boolean;
  /** Array of specific tick positions (overrides step-based ticks) */
  ticks?: number[];
  /** Tick label formatter, receives tick value */
  formatTick?: (value: number) => string;
  /** Whether the slider is disabled */
  disabled?: boolean;
  /** Visual variant */
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info';
  /** Track height in px, default 4 */
  trackHeight?: number;
  /** Thumb size in px, default 16 */
  thumbSize?: number;
  /** Called on value change (single) */
  onChange?: (value: number) => void;
  /** Called on range value change */
  onRangeChange?: (value: [number, number]) => void;
  /** Called when change is committed (mouse up / key up) */
  onChangeCommitted?: (value: number | [number, number]) => void;
  /** ARIA label for single slider */
  'aria-label'?: string;
  /** ARIA labels for range slider [lower, upper] */
  'aria-labels'?: [string, string];
  /** Test id */
  'data-testid'?: string;
  /** Extra class */
  className?: string;
  /** Inline style override */
  style?: React.CSSProperties;
  /** Show the track as an input field next to slider */
  showInput?: boolean;
  /** Orientation */
  orientation?: 'horizontal' | 'vertical';
  /** Vertical height in px (only applies when vertical) */
  verticalHeight?: number;
}

const VARIANT_COLORS: Record<string, string> = {
  default: '#3b82f6',
  success: '#22c55e',
  warning: '#f59e0b',
  danger: '#ef4444',
  info: '#818cf8',
};

const VARIANT_TRACK_BG: Record<string, string> = {
  default: 'rgba(59, 130, 246, 0.15)',
  success: 'rgba(34, 197, 94, 0.15)',
  warning: 'rgba(245, 158, 11, 0.15)',
  danger: 'rgba(239, 68, 68, 0.15)',
  info: 'rgba(129, 140, 248, 0.15)',
};

function clamp(v: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, v));
}

function snapToStep(v: number, min: number, step: number) {
  return Math.round((v - min) / step) * step + min;
}

/**
 * Slider — reusable range input for selecting a single value or range.
 *
 * Supports controlled/uncontrolled, range mode, ticks, value display tooltips,
 * input field integration, and vertical orientation.
 */
export function Slider({
  value: valueProp,
  defaultValue,
  defaultRangeValue,
  min = 0,
  max = 100,
  step = 1,
  range = false,
  showValue = true,
  formatValue,
  showTicks = false,
  ticks: ticksProp,
  formatTick,
  disabled = false,
  variant = 'default',
  trackHeight = 4,
  thumbSize = 16,
  onChange,
  onRangeChange,
  onChangeCommitted,
  'aria-label': ariaLabel,
  'aria-labels': ariaLabels,
  'data-testid': dataTestId,
  className,
  style,
  showInput = false,
  orientation = 'horizontal',
  verticalHeight = 200,
}: SliderProps) {
  const isControlledSingle = valueProp !== undefined && !Array.isArray(valueProp);
  const isControlledRange = valueProp !== undefined && Array.isArray(valueProp);

  const [internalSingle, setInternalSingle] = useState<number>(
    clamp(defaultValue ?? min, min, max),
  );
  const [internalRange, setInternalRange] = useState<[number, number]>(
    defaultRangeValue
      ? [clamp(defaultRangeValue[0], min, max), clamp(defaultRangeValue[1], min, max)]
      : [min, max],
  );

  const singleVal = isControlledSingle ? (valueProp as number) : internalSingle;
  const rangeVal: [number, number] = isControlledRange
    ? (valueProp as [number, number])
    : internalRange;

  const trackRef = useRef<HTMLDivElement>(null);
  const [dragging, setDragging] = useState<'lower' | 'upper' | 'single' | null>(null);
  const idBase = useId();
  const isVertical = orientation === 'vertical';

  const color = VARIANT_COLORS[variant] ?? VARIANT_COLORS.default;
  const trackBg = VARIANT_TRACK_BG[variant] ?? VARIANT_TRACK_BG.default;

  const getRatio = useCallback(
    (v: number) => (max - min > 0 ? (v - min) / (max - min) : 0),
    [min, max],
  );

  const getValueFromPosition = useCallback(
    (clientPos: number) => {
      const el = trackRef.current;
      if (!el) return min;
      const rect = el.getBoundingClientRect();
      const size = isVertical ? rect.height : rect.width;
      const offset = isVertical ? rect.bottom - clientPos : clientPos - rect.left;
      const ratio = clamp(offset / size, 0, 1);
      return snapToStep(min + ratio * (max - min), min, step);
    },
    [min, max, step, isVertical],
  );

  const commitValue = useCallback(
    (val: number | [number, number]) => {
      onChangeCommitted?.(val);
    },
    [onChangeCommitted],
  );

  const setSingle = useCallback(
    (v: number, commit = false) => {
      const clamped = clamp(v, min, max);
      if (!isControlledSingle) setInternalSingle(clamped);
      onChange?.(clamped);
      if (commit) commitValue(clamped);
    },
    [isControlledSingle, onChange, commitValue, min, max],
  );

  const setRange = useCallback(
    (vals: [number, number], commit = false) => {
      const lower = clamp(vals[0], min, vals[1]);
      const upper = clamp(vals[1], lower, max);
      if (!isControlledRange) setInternalRange([lower, upper]);
      onRangeChange?.([lower, upper]);
      if (commit) commitValue([lower, upper]);
    },
    [isControlledRange, onRangeChange, commitValue, min, max],
  );

  // Mouse / touch handlers
  const handleStart = useCallback(
    (thumb: 'lower' | 'upper' | 'single') => (e: React.MouseEvent | React.TouchEvent) => {
      if (disabled) return;
      e.preventDefault();
      setDragging(thumb);
    },
    [disabled],
  );

  useEffect(() => {
    if (!dragging) return;

    const onMove = (e: MouseEvent | TouchEvent) => {
      const pos = 'touches' in e ? e.touches[0]?.[isVertical ? 'clientY' : 'clientX'] : e[isVertical ? 'clientY' : 'clientX'];
      if (pos === undefined) return;
      const val = getValueFromPosition(pos);

      if (dragging === 'single') {
        setSingle(val);
      } else if (dragging === 'lower') {
        setRange([val, rangeVal[1]]);
      } else if (dragging === 'upper') {
        setRange([rangeVal[0], val]);
      }
    };

    const onEnd = () => {
      if (dragging === 'single') {
        setSingle(singleVal, true);
      } else {
        setRange(rangeVal, true);
      }
      setDragging(null);
    };

    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onEnd);
    window.addEventListener('touchmove', onMove, { passive: false });
    window.addEventListener('touchend', onEnd);

    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onEnd);
      window.removeEventListener('touchmove', onMove);
      window.removeEventListener('touchend', onEnd);
    };
  }, [dragging, getValueFromPosition, singleVal, rangeVal, setSingle, setRange, isVertical]);

  // Keyboard handlers
  const handleKeySingle = useCallback(
    (e: React.KeyboardEvent) => {
      if (disabled) return;
      let val = singleVal as number;
      const bigStep = step * 10;
      if (e.key === 'ArrowRight' || e.key === 'ArrowUp') {
        e.preventDefault();
        val = clamp(singleVal + step, min, max);
      } else if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') {
        e.preventDefault();
        val = clamp(singleVal - step, min, max);
      } else if (e.key === 'PageUp') {
        e.preventDefault();
        val = clamp(singleVal + bigStep, min, max);
      } else if (e.key === 'PageDown') {
        e.preventDefault();
        val = clamp(singleVal - bigStep, min, max);
      } else if (e.key === 'Home') {
        e.preventDefault();
        val = min;
      } else if (e.key === 'End') {
        e.preventDefault();
        val = max;
      }
      if (val !== singleVal) {
        setSingle(val, e.type === 'keyup');
      }
    },
    [disabled, singleVal, min, max, step, setSingle],
  );

  const makeRangeKeyHandler = useCallback(
    (which: 'lower' | 'upper') => (e: React.KeyboardEvent) => {
      if (disabled) return;
      const vals: [number, number] = [...rangeVal];
      const idx = which === 'lower' ? 0 : 1;
      const bigStep = step * 10;
      let changed = false;

      if (e.key === 'ArrowRight' || e.key === 'ArrowUp') {
        e.preventDefault();
        vals[idx] = clamp(vals[idx] + step, min, max);
        changed = true;
      } else if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') {
        e.preventDefault();
        vals[idx] = clamp(vals[idx] - step, min, max);
        changed = true;
      } else if (e.key === 'PageUp') {
        e.preventDefault();
        vals[idx] = clamp(vals[idx] + bigStep, min, max);
        changed = true;
      } else if (e.key === 'PageDown') {
        e.preventDefault();
        vals[idx] = clamp(vals[idx] - bigStep, min, max);
        changed = true;
      } else if (e.key === 'Home') {
        e.preventDefault();
        vals[idx] = min;
        changed = true;
      } else if (e.key === 'End') {
        e.preventDefault();
        vals[idx] = max;
        changed = true;
      }
      if (changed) {
        setRange(vals, e.type === 'keyup');
      }
    },
    [disabled, rangeVal, min, max, step, setRange],
  );

  // Tick marks
  const resolveTicks = useCallback((): number[] => {
    if (ticksProp) return ticksProp;
    const arr: number[] = [];
    for (let v = min; v <= max; v += step) arr.push(v);
    return arr;
  }, [min, max, step, ticksProp]);

  const tickValues = showTicks || ticksProp ? resolveTicks() : [];

  // Display value
  const displayValue = range
    ? (formatValue ? formatValue(rangeVal) : `${rangeVal[0]} – ${rangeVal[1]}`)
    : (formatValue ? formatValue(singleVal as number) : `${singleVal}`);

  // Thumb position
  const thumbStyle = (v: number): React.CSSProperties => {
    const ratio = getRatio(v);
    const half = thumbSize / 2;
    if (isVertical) {
      return {
        position: 'absolute',
        left: `calc(50% - ${half}px)`,
        bottom: `calc(${ratio * 100}% - ${half}px)`,
        width: thumbSize,
        height: thumbSize,
      };
    }
    return {
      position: 'absolute',
      top: `calc(50% - ${half}px)`,
      left: `calc(${ratio * 100}% - ${half}px)`,
      width: thumbSize,
      height: thumbSize,
    };
  };

  // Filled track style
  const filledTrackStyle = (): React.CSSProperties => {
    if (range) {
      const lo = getRatio(rangeVal[0]);
      const hi = getRatio(rangeVal[1]);
      if (isVertical) {
        return {
          position: 'absolute',
          left: 0,
          bottom: `${lo * 100}%`,
          width: '100%',
          height: `${(hi - lo) * 100}%`,
          background: color,
          borderRadius: trackHeight / 2,
        };
      }
      return {
        position: 'absolute',
        top: 0,
        left: `${lo * 100}%`,
        width: `${(hi - lo) * 100}%`,
        height: '100%',
        background: color,
        borderRadius: trackHeight / 2,
      };
    }
    const ratio = getRatio(singleVal as number);
    if (isVertical) {
      return {
        position: 'absolute',
        left: 0,
        bottom: 0,
        width: '100%',
        height: `${ratio * 100}%`,
        background: color,
        borderRadius: trackHeight / 2,
      };
    }
    return {
      position: 'absolute',
      top: 0,
      left: 0,
      width: `${ratio * 100}%`,
      height: '100%',
      background: color,
      borderRadius: trackHeight / 2,
    };
  };

  const renderThumb = (
    which: 'lower' | 'upper' | 'single',
    value: number,
    idx: number,
  ) => {
    const isRangePart = range && which !== 'single';
    const ariaLabelVal = isRangePart
      ? ariaLabels?.[which === 'lower' ? 0 : 1] ?? (which === 'lower' ? 'Lower value' : 'Upper value')
      : ariaLabel ?? 'Slider value';

    return (
      <div
        key={which}
        data-testid={dataTestId ? `${dataTestId}-thumb-${which}` : undefined}
        role="slider"
        tabIndex={disabled ? -1 : 0}
        aria-label={ariaLabelVal}
        aria-valuenow={value}
        aria-valuemin={min}
        aria-valuemax={max}
        aria-disabled={disabled}
        aria-orientation={orientation}
        onMouseDown={
          !disabled ? handleStart(isRangePart ? which : 'single') : undefined
        }
        onTouchStart={
          !disabled ? handleStart(isRangePart ? which : 'single') : undefined
        }
        onKeyDown={
          isRangePart
            ? makeRangeKeyHandler(which as 'lower' | 'upper')
            : handleKeySingle
        }
        style={{
          ...thumbStyle(value),
          cursor: disabled ? 'not-allowed' : dragging ? 'grabbing' : 'grab',
          borderRadius: '50%',
          background: disabled ? '#d1d5db' : color,
          border: `2px solid ${disabled ? '#9ca3af' : '#ffffff'}`,
          boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
          zIndex: 2,
          transition: dragging ? 'none' : 'box-shadow 0.15s ease',
          outline: 'none',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      />
    );
  };

  const containerSize: React.CSSProperties = isVertical
    ? { height: verticalHeight, width: thumbSize + 8, position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center' }
    : { width: '100%', position: 'relative' };

  return (
    <div
      data-testid={dataTestId}
      className={className}
      style={{
        display: 'flex',
        flexDirection: isVertical ? 'row' : 'column',
        gap: 8,
        opacity: disabled ? 0.5 : 1,
        ...style,
      }}
    >
      {/* Header: label + value / input */}
      {showValue || showInput ? (
        <div
          data-testid={dataTestId ? `${dataTestId}-header` : undefined}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 8,
          }}
        >
          {showValue && !showInput ? (
            <span
              data-testid={dataTestId ? `${dataTestId}-value` : undefined}
              style={{ fontSize: 13, fontWeight: 600, color, minWidth: 40 }}
            >
              {displayValue}
            </span>
          ) : null}
          {showInput ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              {range ? (
                <>
                  <input
                    data-testid={dataTestId ? `${dataTestId}-input-lower` : undefined}
                    type="number"
                    value={rangeVal[0]}
                    min={min}
                    max={rangeVal[1]}
                    step={step}
                    disabled={disabled}
                    onChange={(e) => {
                      const v = Number(e.target.value);
                      if (!isNaN(v)) setRange([v, rangeVal[1]]);
                    }}
                    onBlur={() => commitValue(rangeVal)}
                    style={{
                      width: 60,
                      fontSize: 13,
                      padding: '2px 6px',
                      border: `1px solid #d1d5db`,
                      borderRadius: 4,
                    }}
                  />
                  <span style={{ fontSize: 13, color: '#6b7280' }}>–</span>
                  <input
                    data-testid={dataTestId ? `${dataTestId}-input-upper` : undefined}
                    type="number"
                    value={rangeVal[1]}
                    min={rangeVal[0]}
                    max={max}
                    step={step}
                    disabled={disabled}
                    onChange={(e) => {
                      const v = Number(e.target.value);
                      if (!isNaN(v)) setRange([rangeVal[0], v]);
                    }}
                    onBlur={() => commitValue(rangeVal)}
                    style={{
                      width: 60,
                      fontSize: 13,
                      padding: '2px 6px',
                      border: `1px solid #d1d5db`,
                      borderRadius: 4,
                    }}
                  />
                </>
              ) : (
                <input
                  data-testid={dataTestId ? `${dataTestId}-input` : undefined}
                  type="number"
                  value={singleVal}
                  min={min}
                  max={max}
                  step={step}
                  disabled={disabled}
                  onChange={(e) => {
                    const v = Number(e.target.value);
                    if (!isNaN(v)) setSingle(v);
                  }}
                  onBlur={() => commitValue(singleVal as number)}
                  style={{
                    width: 60,
                    fontSize: 13,
                    padding: '2px 6px',
                    border: `1px solid #d1d5db`,
                    borderRadius: 4,
                  }}
                />
              )}
            </div>
          ) : null}
        </div>
      ) : null}

      {/* Track + Thumbs */}
      <div style={containerSize} ref={trackRef}>
        {/* Clickable track area */}
        <div
          data-testid={dataTestId ? `${dataTestId}-track` : undefined}
          style={{
            position: 'relative',
            width: isVertical ? trackHeight : '100%',
            height: isVertical ? verticalHeight - (thumbSize + 2) : trackHeight,
            background: trackBg,
            borderRadius: trackHeight / 2,
            cursor: disabled ? 'not-allowed' : 'pointer',
            flexGrow: isVertical ? 1 : undefined,
            marginTop: isVertical ? thumbSize / 2 + 1 : undefined,
            marginBottom: isVertical ? thumbSize / 2 + 1 : undefined,
          }}
          onClick={(e) => {
            if (disabled) return;
            const pos = isVertical ? e.clientY : e.clientX;
            const val = getValueFromPosition(pos);
            if (range) {
              // Closer to lower or upper?
              const distLow = Math.abs(val - rangeVal[0]);
              const distHigh = Math.abs(val - rangeVal[1]);
              if (distLow <= distHigh) setRange([val, rangeVal[1]], true);
              else setRange([rangeVal[0], val], true);
            } else {
              setSingle(val, true);
            }
          }}
        >
          {/* Filled track */}
          <div
            data-testid={dataTestId ? `${dataTestId}-fill` : undefined}
            style={filledTrackStyle()}
          />

          {/* Tick marks */}
          {tickValues.map((tv) => {
            const ratio = getRatio(tv);
            const tickStyle: React.CSSProperties = isVertical
              ? {
                  position: 'absolute',
                  left: '100%',
                  bottom: `calc(${ratio * 100}% - 1px)`,
                  width: 8,
                  height: 2,
                  background: '#d1d5db',
                  marginLeft: 4,
                }
              : {
                  position: 'absolute',
                  top: '100%',
                  left: `calc(${ratio * 100}% - 1px)`,
                  width: 2,
                  height: 6,
                  background: '#d1d5db',
                  marginTop: 4,
                };
            return (
              <div key={tv} style={tickStyle}>
                {formatTick ? (
                  <span
                    style={{
                      position: 'absolute',
                      [isVertical ? 'left' : 'top']: '100%',
                      [isVertical ? 'marginLeft' : 'marginTop']: 2,
                      fontSize: 10,
                      color: '#9ca3af',
                      whiteSpace: 'nowrap',
                      transform: isVertical ? undefined : 'translateX(-50%)',
                      left: isVertical ? 12 : undefined,
                    }}
                  >
                    {formatTick(tv)}
                  </span>
                ) : null}
              </div>
            );
          })}

          {/* Thumbs */}
          {range
            ? [
                renderThumb('lower', rangeVal[0], 0),
                renderThumb('upper', rangeVal[1], 1),
              ]
            : renderThumb('single', singleVal as number, 0)}
        </div>
      </div>
    </div>
  );
}

export default Slider;
