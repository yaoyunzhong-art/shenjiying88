import React from 'react';
export interface ScrollAreaProps {
    /** Content to render inside the scrollable area */
    children: React.ReactNode;
    /** Maximum height. If not set, grows with content. */
    maxHeight?: number | string;
    /** Fixed height. Overrides maxHeight. */
    height?: number | string;
    /** Max width. If not set, fills container. */
    maxWidth?: number | string;
    /** Scrollbar thumb color (CSS color), default #94a3b8 */
    thumbColor?: string;
    /** Scrollbar track color, default transparent */
    trackColor?: string;
    /** Scrollbar width in px, default 8 */
    scrollbarWidth?: number;
    /** Always show scrollbar (not only on hover/focus), default false */
    alwaysVisible?: boolean;
    /** Whether to show scroll shadow indicators at top/bottom edges */
    showShadowEdges?: boolean;
    /** ARIA label for the scrollable region */
    'aria-label'?: string;
    /** Test id */
    'data-testid'?: string;
    /** Extra class for the outer wrapper */
    className?: string;
    /** Inline style override for the outer wrapper */
    style?: React.CSSProperties;
    /** Callback when scroll position changes */
    onScroll?: (scrollTop: number, scrollHeight: number, clientHeight: number) => void;
    /** Scroll to bottom when content changes (e.g. chat) */
    autoScrollToBottom?: boolean;
}
/**
 * ScrollArea — a custom-scrollbar container for consistent cross-platform scrolling.
 *
 * Used in dashboards, modals, dropdowns, and any constrained-height containers
 * where native scrollbars are visually inconsistent.
 */
export declare function ScrollArea({ children, maxHeight, height, maxWidth, thumbColor, trackColor, scrollbarWidth, alwaysVisible, showShadowEdges, 'aria-label': ariaLabel, 'data-testid': dataTestId, className, style, onScroll, autoScrollToBottom, }: ScrollAreaProps): React.JSX.Element;
