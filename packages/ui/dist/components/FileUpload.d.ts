import React from 'react';
export interface UploadedFile {
    /** Unique id assigned on upload */
    id: string;
    /** Original file name */
    name: string;
    /** Size in bytes */
    size: number;
    /** MIME type */
    type: string;
    /** Upload progress 0–100; -1 means failed */
    progress: number;
    /** Error message when progress === -1 */
    error?: string;
    /** Preview URL for images */
    preview?: string;
}
export interface FileUploadProps {
    /** Accepted MIME types (e.g. "image/*,.pdf") */
    accept?: string;
    /** Maximum number of files allowed (default 1) */
    maxFiles?: number;
    /** Maximum individual file size in bytes (default 10 MB) */
    maxSize?: number;
    /** Whether to allow multiple file selection (default false) */
    multiple?: boolean;
    /** Show image previews for image/* types (default true) */
    showPreview?: boolean;
    /** Callback when files are added; return false to reject */
    onFilesAdded?: (files: File[]) => boolean | void;
    /** Callback when a file is removed by user */
    onFileRemoved?: (file: UploadedFile) => void;
    /** Controlled file list (if you want external control) */
    files?: UploadedFile[];
    /** Disabled state */
    disabled?: boolean;
    /** Custom placeholder text */
    placeholder?: string;
    /** Test id */
    'data-testid'?: string;
    /** Visual variant */
    variant?: 'default' | 'compact';
}
/**
 * FileUpload — drag-and-drop / click-to-browse file upload component.
 *
 * Supports single or multiple file selection, drag-and-drop, image previews,
 * progress simulation, file removal, and size/type validation.
 */
export declare function FileUpload({ accept, maxFiles, maxSize, multiple, showPreview, onFilesAdded, onFileRemoved, files: controlledFiles, disabled, placeholder, 'data-testid': dataTestId, variant, }: FileUploadProps): React.JSX.Element;
