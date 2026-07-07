import React from 'react';
export interface ImageItem {
    /** Image source URL */
    src: string;
    /** Alt text */
    alt?: string;
    /** Thumbnail URL (defaults to src) */
    thumb?: string;
    /** Optional caption */
    caption?: string;
}
export interface ImagePreviewProps {
    /** Array of images to display */
    images: ImageItem[];
    /** Initial image index to show */
    initialIndex?: number;
    /** Thumbnail size in pixels */
    thumbSize?: number;
    /** Gap between thumbnails in px */
    thumbGap?: number;
    /** Width of the preview lightbox */
    previewWidth?: number;
    /** Max height of preview lightbox */
    previewMaxHeight?: number;
    /** Whether to show navigation arrows */
    showArrows?: boolean;
    /** Whether to show thumbnail strip */
    showThumbnails?: boolean;
    /** Whether to show image counter "1 / 5" */
    showCounter?: boolean;
    /** Whether to close lightbox on backdrop click */
    closeOnBackdrop?: boolean;
    /** Whether to close lightbox on Escape key */
    closeOnEscape?: boolean;
    /** Called when lightbox opens */
    onOpen?: (index: number) => void;
    /** Called when lightbox closes */
    onClose?: () => void;
    /** Called when image changes */
    onChange?: (index: number) => void;
    /** Custom class name */
    className?: string;
    /** Custom styles */
    style?: React.CSSProperties;
    /** Render mode: 'grid' shows a thumbnail grid, 'strip' shows horizontal scroll strip, 'single' shows one thumbnail */
    mode?: 'grid' | 'strip' | 'single';
    /** Columns in grid mode */
    gridCols?: number;
    /** Image fit mode in lightbox */
    fit?: 'contain' | 'cover';
    /** Image border radius in px */
    borderRadius?: number;
    /** Placeholder shown while image loads */
    placeholder?: React.ReactNode;
    /** Error fallback when image fails to load */
    errorFallback?: React.ReactNode;
}
export declare function ImagePreview({ images, initialIndex, thumbSize, thumbGap, previewWidth, previewMaxHeight, showArrows, showThumbnails, showCounter, closeOnBackdrop, closeOnEscape, onOpen, onClose, onChange, className, style, mode, gridCols, fit, borderRadius, placeholder, errorFallback, }: ImagePreviewProps): React.JSX.Element;
