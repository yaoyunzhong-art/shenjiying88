import React from 'react';
type Severity = 'info' | 'warning' | 'error' | 'success';
interface StatusBadgeProps {
    label: string;
    variant?: Severity | 'neutral' | 'default' | 'pending' | 'danger';
    size?: 'sm' | 'md';
    dot?: boolean;
}
export declare function StatusBadge({ label, variant, size, dot }: StatusBadgeProps): React.JSX.Element;
interface StatusBadgeGroupProps {
    items?: {
        label: string;
        variant?: Severity | 'neutral' | 'default' | 'pending' | 'danger';
    }[];
    children?: React.ReactNode;
    size?: 'sm' | 'md';
}
export declare function StatusBadgeGroup({ items, children, size }: StatusBadgeGroupProps): React.JSX.Element | null;
export {};
