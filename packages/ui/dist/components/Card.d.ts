import React from 'react';
interface CardProps {
    /** Card title (optional header) */
    title?: string;
    /** Subtitle shown below the title */
    subtitle?: string;
    /** Additional header actions rendered to the right of the title */
    headerActions?: React.ReactNode;
    /** Card body content */
    children?: React.ReactNode;
    /** Visual variant */
    variant?: 'default' | 'elevated' | 'outlined' | 'ghost';
    /** Extra padding override */
    padding?: number | string;
    /** Custom style overrides */
    style?: React.CSSProperties;
    /** Footer content */
    footer?: React.ReactNode;
    /** Test id */
    'data-testid'?: string;
}
/**
 * Card — a reusable glassmorphism card container used across all M5 apps.
 *
 * Encapsulates the common `rgba(15,23,42,…)` + border pattern repeated in 20+ files.
 * Supports optional title header, variant selection, and footer slot.
 */
export declare function Card({ title, subtitle, headerActions, children, variant, padding, style, footer, 'data-testid': dataTestId, }: CardProps): React.JSX.Element;
export {};
