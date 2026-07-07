import React from 'react';
export type SkeletonVariant = 'text' | 'circle' | 'rect' | 'button' | 'avatar' | 'thumbnail';
export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
    /** Visual shape variant */
    variant?: SkeletonVariant;
    /** Width override (defaults per variant) */
    width?: number | string;
    /** Height override (defaults per variant) */
    height?: number | string;
    /** Border radius override */
    borderRadius?: number | string;
    /** Animation speed: slow / normal / fast */
    speed?: 'slow' | 'normal' | 'fast';
}
export declare const Skeleton: React.ForwardRefExoticComponent<SkeletonProps & React.RefAttributes<HTMLDivElement>>;
export interface SkeletonTextProps {
    lines?: number;
    lastLineWidth?: number | string;
    lineHeight?: number;
    spacing?: number;
}
/**
 * Renders several text skeleton lines – last line shorter by default.
 */
export declare const SkeletonText: React.FC<SkeletonTextProps>;
export interface SkeletonCardProps {
    header?: boolean;
    thumbnail?: boolean;
    textLines?: number;
}
/**
 * Card-shaped skeleton placeholder with optional header / thumbnail / text.
 */
export declare const SkeletonCard: React.FC<SkeletonCardProps>;
export interface SkeletonTableProps {
    columns?: number;
    rows?: number;
    rowHeight?: number;
}
/**
 * Table-shaped skeleton placeholder.
 */
export declare const SkeletonTable: React.FC<SkeletonTableProps>;
