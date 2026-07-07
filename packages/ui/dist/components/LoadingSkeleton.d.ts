import React from 'react';
interface LoadingSkeletonProps {
    lines?: number;
    rows?: number;
    label?: string;
    variant?: 'default' | 'card' | 'table';
}
export declare function LoadingSkeleton({ lines, rows, label, variant, }: LoadingSkeletonProps): React.JSX.Element;
export {};
