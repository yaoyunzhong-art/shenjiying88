import React from 'react';
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
/**
 * Slider — reusable range input for selecting a single value or range.
 *
 * Supports controlled/uncontrolled, range mode, ticks, value display tooltips,
 * input field integration, and vertical orientation.
 */
export declare function Slider({ value: valueProp, defaultValue, defaultRangeValue, min, max, step, range, showValue, formatValue, showTicks, ticks: ticksProp, formatTick, disabled, variant, trackHeight, thumbSize, onChange, onRangeChange, onChangeCommitted, 'aria-label': ariaLabel, 'aria-labels': ariaLabels, 'data-testid': dataTestId, className, style, showInput, orientation, verticalHeight, }: SliderProps): React.JSX.Element;
export default Slider;
