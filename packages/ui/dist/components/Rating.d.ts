import React from 'react';
export interface RatingProps {
    /** Current rating value (0 to max). */
    value?: number;
    /** Maximum rating value (number of stars). */
    max?: number;
    /** Star size in pixels. */
    size?: number;
    /** Active star color. */
    activeColor?: string;
    /** Inactive star color. */
    inactiveColor?: string;
    /** Allow user to change the rating. When false, stars are read-only. */
    interactive?: boolean;
    /** Called when the user selects a rating. */
    onChange?: (value: number) => void;
    /** Show numeric label next to stars (e.g. "4.2"). */
    showValue?: boolean;
    /** Custom label format; receives current value. */
    formatLabel?: (value: number, max: number) => string;
    /** Tooltip / title per star index (1-based). */
    starLabels?: string[];
    /** Allow half-star precision. */
    half?: boolean;
    /** Accessible name for the rating group. */
    'aria-label'?: string;
    /** Test id. */
    'data-testid'?: string;
    /** Extra class name. */
    className?: string;
    /** Inline style overrides. */
    style?: React.CSSProperties;
}
/**
 * Rating — a reusable star-rating component supporting half-star precision,
 * interactive selection, and read-only display modes.
 *
 * Used across M5 apps for product reviews, member satisfaction scoring, and
 * service quality evaluation.
 */
export declare function Rating({ value, max, size, activeColor, inactiveColor, interactive, onChange, showValue, formatLabel, starLabels, half, 'aria-label': ariaLabel, 'data-testid': dataTestId, className, style, }: RatingProps): React.JSX.Element;
