import React from 'react';
export type TagVariant = 'default' | 'primary' | 'success' | 'warning' | 'error' | 'info' | 'purple';
export interface TagProps {
    /** Display text */
    children: React.ReactNode;
    /** Color variant */
    variant?: TagVariant;
    /** Size */
    size?: 'sm' | 'md';
    /** Whether the tag can be closed */
    closable?: boolean;
    /** Callback when close icon is clicked */
    onClose?: () => void;
    /** Whether the tag has a border */
    bordered?: boolean;
    /** Optional className for the wrapper */
    className?: string;
}
export declare function Tag({ children, variant, size, closable, onClose, bordered, className, }: TagProps): React.JSX.Element;
/** Horizontal wrapper with gaps for a group of tags */
export declare function TagGroup({ children, gap, }: {
    children: React.ReactNode;
    gap?: number;
}): React.JSX.Element;
