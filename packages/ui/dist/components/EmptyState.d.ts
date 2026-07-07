import React from 'react';
interface EmptyStateProps {
    title?: string;
    description?: string;
    action?: React.ReactNode;
    icon?: React.ReactNode;
    variant?: 'default' | 'compact';
}
export declare function EmptyState({ title, description, action, icon, variant }: EmptyStateProps): React.JSX.Element;
export {};
