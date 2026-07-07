import React from 'react';
interface PageShellProps {
    title: string;
    description?: string;
    subtitle?: string;
    actions?: React.ReactNode;
    children: React.ReactNode;
}
export declare function PageShell({ title, description, subtitle, actions, children }: PageShellProps): React.JSX.Element;
export {};
