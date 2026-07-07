import React from 'react';
export type ErrorBoundarySeverity = 'block' | 'inline' | 'toast';
export interface ErrorBoundaryFallbackArgs {
    error: Error;
    resetError: () => void;
}
export interface ErrorBoundaryProps {
    /** Accessible name for the error region */
    name?: string;
    /** Visual severity */
    severity?: ErrorBoundarySeverity;
    /** Custom fallback renderer; receives error + reset callback */
    fallback?: (args: ErrorBoundaryFallbackArgs) => React.ReactNode;
    /** Text for the reset/retry button (block / inline modes) */
    retryLabel?: string;
    /** Extra text shown below the error message (block mode) */
    description?: string;
    /** Called when the boundary catches an error */
    onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
    /** Called just before resetError is invoked */
    onReset?: () => void;
    /** Test id */
    'data-testid'?: string;
    /** Extra class */
    className?: string;
    /** Inline style override */
    style?: React.CSSProperties;
    children?: React.ReactNode;
}
interface ErrorBoundaryState {
    error: Error | null;
}
/**
 * ErrorBoundary — catch rendering errors in children with configurable fallback.
 *
 * Supports three visual severities:
 *  - `block`: full-width card with message + optional description + retry button.
 *  - `inline`: compact one-liner with retry button, suitable for rows / cells.
 *  - `toast`: renders nothing (log-only); consumer listens via `onError` to show a toast elsewhere.
 *
 * When a `fallback` renderer is provided it takes precedence over the built-in views.
 * The `resetError` callback resets internal state and calls `onReset`.
 */
export declare class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
    constructor(props: ErrorBoundaryProps);
    static getDerivedStateFromError(error: Error): ErrorBoundaryState;
    componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void;
    resetError: () => void;
    render(): string | number | boolean | React.JSX.Element | Iterable<React.ReactNode> | null | undefined;
}
export {};
