import React from 'react';
import { type ToastOptions } from './Toast';
export type DetailActionBarIcon = 'copy' | 'export' | 'share' | 'print' | 'download' | 'link';
export interface DetailActionBarAction {
    /** Stable key used for React keys and test selectors. */
    key: string;
    /** Button label. */
    label: string;
    /** Click handler — may be async. */
    onClick: () => void | Promise<void>;
    /** Optional icon name; 'custom' is allowed for callers that inject their own. */
    icon?: DetailActionBarIcon;
    /** Visual variant — defaults to 'default'. */
    variant?: 'default' | 'primary' | 'danger';
    /** Optional description (used as aria-label and tooltip). */
    description?: string;
    /** Disabled state. */
    disabled?: boolean;
    /**
     * Optional toast feedback. When the click resolves successfully, the
     * success message (or default `已复制`/`已导出`/etc.) is shown; when it
     * rejects, the error message is shown.
     */
    successToast?: ToastOptions & {
        message?: string;
    };
    errorToast?: ToastOptions & {
        message?: string;
    };
}
export interface DetailActionBarProps {
    /** List of actions rendered as buttons in order. */
    actions: DetailActionBarAction[];
    /** Optional section heading. */
    heading?: string;
    /** Optional caption describing the bar. */
    caption?: string;
    /** Test id for the wrapper. */
    'data-testid'?: string;
    /**
     * When false, the bar does not render a toast container or surface
     * success/error feedback. Default is true. SSR callers can opt out so
     * the bar renders in static HTML without needing the ToastContainer.
     */
    showToast?: boolean;
}
/**
 * DetailActionBar renders the standard "收口动作" footer for every detail
 * page in the admin workbench.
 *
 * Unlike DetailClosureBar (which renders deep-link cards), this bar renders
 * actionable buttons (copy link, export JSON, share, print, etc.). Each
 * caller provides its own `onClick` handlers, so the bar stays a thin
 * presentation component.
 *
 * The bar is SSR-friendly: it renders buttons with attached onClick
 * handlers without executing any side effects during render. Each button
 * tracks its own busy state and is disabled while a handler is in flight.
 *
 * When `showToast` is true (default), successful actions show a success
 * toast and failed actions show an error toast using the shared
 * useToast hook.
 */
export declare function DetailActionBar({ actions, heading, caption, 'data-testid': testId, showToast }: DetailActionBarProps): React.JSX.Element | null;
export default DetailActionBar;
