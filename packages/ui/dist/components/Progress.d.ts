import React from 'react';
export interface ProgressProps {
    /** Current value (0-100) */
    value: number;
    /** Maximum value, default 100 */
    max?: number;
    /** Visual variant */
    variant?: 'default' | 'success' | 'warning' | 'danger' | 'info';
    /** Show percentage label */
    showLabel?: boolean;
    /** Label format; receives computed percentage number */
    formatLabel?: (pct: number) => string;
    /** Height in px, default 8 */
    height?: number;
    /** Whether to animate the bar width transition */
    animated?: boolean;
    /** Whether to show an indeterminate loading animation (ignores value) */
    indeterminate?: boolean;
    /** ARIA label */
    'aria-label'?: string;
    /** Test id */
    'data-testid'?: string;
    /** Extra class */
    className?: string;
    /** Inline style override */
    style?: React.CSSProperties;
}
/**
 * Progress — a reusable progress bar with variants, labels, and indeterminate state.
 *
 * Used across M5 apps for loading indicators, step completion, and resource usage.
 */
export declare function Progress({ value, max, variant, showLabel, formatLabel, height, animated, indeterminate, 'aria-label': ariaLabel, 'data-testid': dataTestId, className, style, }: ProgressProps): React.JSX.Element;
