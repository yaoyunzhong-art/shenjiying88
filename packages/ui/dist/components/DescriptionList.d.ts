import React from 'react';
export interface DescriptionItem {
    label: string;
    value?: React.ReactNode;
    /** render prop when value needs special formatting */
    render?: () => React.ReactNode;
    /** span across multiple columns (1-4) */
    span?: number;
}
export interface DescriptionListProps {
    items: DescriptionItem[];
    /** columns count: 1 | 2 | 3 | 4 (default: 2) */
    columns?: 1 | 2 | 3 | 4;
    /** layout direction */
    layout?: 'horizontal' | 'vertical';
    /** size preset */
    size?: 'default' | 'compact';
    /** title above the list */
    title?: string;
    /** optional className for the wrapper */
    className?: string;
}
export declare function DescriptionList({ items, columns, layout, size, title, className, }: DescriptionListProps): React.JSX.Element;
