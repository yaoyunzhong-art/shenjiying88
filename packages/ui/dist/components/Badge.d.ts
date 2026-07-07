import React from 'react';
export type BadgeVariant = 'default' | 'primary' | 'success' | 'warning' | 'error' | 'info' | 'purple';
export type BadgePlacement = 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
export type BadgeSize = 'sm' | 'md' | 'lg';
export interface BadgeProps {
    /** The content to display inside the badge (number, text, dot indicator) */
    children?: React.ReactNode;
    /** Color variant */
    variant?: BadgeVariant;
    /** Size */
    size?: BadgeSize;
    /** Placement relative to the wrapping element */
    placement?: BadgePlacement;
    /** Whether to show as a dot (no children displayed) */
    dot?: boolean;
    /** Max count to display (e.g. 99+), only for numeric children */
    overflowCount?: number;
    /** Whether the badge is visible */
    visible?: boolean;
    /** Offset adjustment from default position, e.g. { x: 2, y: -2 } */
    offset?: {
        x?: number;
        y?: number;
    };
    /** Show badge as standalone (not overlapping) */
    standalone?: boolean;
    /** Optional className for the wrapper */
    className?: string;
    /** Test id */
    'data-testid'?: string;
}
/**
 * Badge — a numeric indicator, status dot, or content badge typically
 * overlaid on another UI element.
 *
 * - `dot`: renders a small colored circle without content
 * - `overflowCount`: clamps displayed number, e.g. overflowCount=99 renders "99+"
 * - `standalone`: renders as a normal inline element without absolute positioning
 */
export declare function Badge({ children, variant, size, placement, dot, overflowCount, visible, offset, standalone, className, 'data-testid': dataTestId, }: BadgeProps): React.JSX.Element | null;
