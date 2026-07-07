import React from 'react';
interface DetailSection {
    title: string;
    content: React.ReactNode;
}
export interface DetailShellAction {
    key: string;
    label: string;
    variant?: 'primary' | 'secondary' | 'danger';
    loading?: boolean;
    disabled?: boolean;
    onClick?: () => void | Promise<void>;
    href?: string;
}
interface DetailShellProps {
    title: string;
    backHref?: string;
    backLabel?: string;
    subtitle?: string;
    sections?: DetailSection[];
    children?: React.ReactNode;
    breadcrumbs?: Array<{
        label: string;
        href?: string;
    }>;
    backLink?: {
        label: string;
        href: string;
    };
    actions?: DetailShellAction[];
    loading?: boolean;
    error?: string;
    onBack?: () => void;
}
export declare function DetailShell({ title, backHref, backLabel, sections, subtitle, children, breadcrumbs, backLink, actions, loading, error, onBack, }: DetailShellProps): React.JSX.Element;
export {};
