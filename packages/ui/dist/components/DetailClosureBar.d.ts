import React from 'react';
export interface DetailClosureLink {
    /** Stable key used for React keys and test selectors. */
    key: string;
    /** Card title. */
    title: string;
    /** Short caption under the title, e.g. an audit purpose or href purpose. */
    subtitle: string;
    /** Optional second-line caption for context (e.g. moduleKey). */
    context?: string;
    /** Href for the link card. */
    href: string;
    /** Visual variant — defaults to 'default'. */
    variant?: 'default' | 'warning' | 'danger';
    /** Optional aria-label override for screen readers. */
    ariaLabel?: string;
}
export interface DetailClosureBarProps {
    /** Links to render in the closure grid. */
    links: DetailClosureLink[];
    /** Optional section heading rendered above the cards. */
    heading?: string;
    /** Optional caption describing what this grid represents. */
    caption?: string;
    /** Test id for the wrapper. */
    'data-testid'?: string;
}
/**
 * DetailClosureBar renders the standard three-tier closure footer used by
 * every detail page in the admin workbench.
 *
 *   workspace → detail → action
 *
 * Each card represents a deep link (audit / foundation / workspace /
 * approvals / custom). The grid is responsive and adapts to the existing
 * deep-link card style used by the 7 detail-page batches.
 */
export declare function DetailClosureBar({ links, heading, caption, 'data-testid': testId }: DetailClosureBarProps): React.JSX.Element | null;
export default DetailClosureBar;
