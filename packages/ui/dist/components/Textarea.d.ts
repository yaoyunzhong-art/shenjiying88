import React, { type TextareaHTMLAttributes } from 'react';
export type TextareaSize = 'sm' | 'md' | 'lg';
export interface TextareaProps extends Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, 'size'> {
    /** Visual size */
    size?: TextareaSize;
    /** Label text rendered above the textarea */
    label?: string;
    /** Helper / hint text below the textarea */
    helperText?: string;
    /** Error message — when set, displays error styling */
    error?: string;
    /** Whether the textarea is in a loading state */
    loading?: boolean;
    /** Show a clear button when value is non-empty */
    allowClear?: boolean;
    /** Called when the clear button is clicked */
    onClear?: () => void;
    /** Show character count (when maxLength is set) */
    showCount?: boolean;
    /** Make the textarea fill its container width */
    block?: boolean;
    /** Rows of the textarea */
    rows?: number;
    /** Min height in px (auto-grow) */
    minHeight?: number;
    /** Max height in px (auto-grow) */
    maxHeight?: number;
    /** Test id */
    'data-testid'?: string;
    /** aria-label fallback when no label */
    'aria-label'?: string;
}
/**
 * Textarea — accessible, controlled/uncontrolled multi-line text input.
 *
 * Supports labels, helper text, error state, loading state,
 * clear button, character count, three sizes, and auto-grow.
 */
export declare const Textarea: React.NamedExoticComponent<TextareaProps>;
export default Textarea;
