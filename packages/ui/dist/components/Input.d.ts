import React, { type InputHTMLAttributes } from 'react';
export type InputSize = 'sm' | 'md' | 'lg';
export type InputVariant = 'outline' | 'filled' | 'underline';
export interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size' | 'prefix'> {
    /** Visual size */
    size?: InputSize;
    /** Visual variant */
    variant?: InputVariant;
    /** Label text rendered above the input */
    label?: string;
    /** Helper / hint text below the input */
    helperText?: string;
    /** Error message — when set, displays error styling */
    error?: string;
    /** Whether the input is in a loading state */
    loading?: boolean;
    /** Icon / content before the input value */
    prefix?: React.ReactNode;
    /** Icon / content after the input value */
    suffix?: React.ReactNode;
    /** Show a clear button when value is non-empty */
    allowClear?: boolean;
    /** Called when the clear button is clicked */
    onClear?: () => void;
    /** Show character count (when maxLength is set) */
    showCount?: boolean;
    /** Make the input fill its container width */
    block?: boolean;
    /** Test id */
    'data-testid'?: string;
    /** aria-label fallback when no label */
    'aria-label'?: string;
}
/**
 * Input — accessible, controlled/uncontrolled text input.
 *
 * Supports labels, helper text, error state, prefix/suffix,
 * clear button, character count, loading state, three sizes
 * and three visual variants.
 */
export declare const Input: React.NamedExoticComponent<InputProps>;
export default Input;
