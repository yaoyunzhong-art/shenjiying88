import React from 'react';
export interface BreadcrumbItem {
    /** Display label */
    label: string;
    /** Optional href — turns item into a link */
    href?: string;
    /** Optional click handler */
    onClick?: () => void;
}
export interface BreadcrumbProps {
    /** Ordered list of breadcrumb segments */
    items: BreadcrumbItem[];
    /** Custom separator (default '/') */
    separator?: React.ReactNode;
    /** Maximum items before collapsing to ellipsis */
    maxItems?: number;
    /** Test id for the nav wrapper */
    'data-testid'?: string;
}
export declare function Breadcrumb({ items, separator, maxItems, 'data-testid': testId, }: BreadcrumbProps): React.JSX.Element | null;
export default Breadcrumb;
