import React from 'react';
export type CheckboxSize = 'sm' | 'md' | 'lg';
export interface CheckboxProps {
    /** Controlled checked state */
    checked?: boolean;
    /** Default unchecked (uncontrolled) */
    defaultChecked?: boolean;
    /** Called when checked state changes */
    onChange?: (checked: boolean) => void;
    /** Disabled state */
    disabled?: boolean;
    /** Indeterminate state (dash instead of check) */
    indeterminate?: boolean;
    /** Visual size */
    size?: CheckboxSize;
    /** Label text */
    label?: string;
    /** Label position */
    labelPosition?: 'left' | 'right';
    /** Error state */
    error?: string;
    /** Value sent with form */
    value?: string;
    /** Form name */
    name?: string;
    /** Whether the checkbox is required */
    required?: boolean;
    /** ARIA label fallback */
    'aria-label'?: string;
    /** Test id */
    'data-testid'?: string;
    /** Extra class */
    className?: string;
    /** Inline style */
    style?: React.CSSProperties;
}
/**
 * Checkbox — binary / indeterminate selection control.
 *
 * Supports controlled/uncontrolled usage, indeterminate state,
 * three sizes, labels, error state, and full keyboard/ARIA support.
 */
export declare function Checkbox({ checked, defaultChecked, onChange, disabled, indeterminate, size, label, labelPosition, error, value, name, required, 'aria-label': ariaLabel, 'data-testid': dataTestId, className, style, }: CheckboxProps): React.JSX.Element;
export default Checkbox;
