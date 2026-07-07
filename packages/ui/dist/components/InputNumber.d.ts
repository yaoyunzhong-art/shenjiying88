import React from 'react';
export type InputNumberSize = 'sm' | 'md' | 'lg';
export interface InputNumberProps {
    /** Current value (controlled) */
    value?: number;
    /** Default value (uncontrolled) */
    defaultValue?: number;
    /** Called when value changes */
    onChange?: (value: number) => void;
    /** Minimum value */
    min?: number;
    /** Maximum value */
    max?: number;
    /** Step increment / decrement */
    step?: number;
    /** Decimal precision (0 = integer) */
    precision?: number;
    /** Visual size */
    size?: InputNumberSize;
    /** Whether the input is disabled */
    disabled?: boolean;
    /** Whether the input is read-only */
    readOnly?: boolean;
    /** Label text */
    label?: string;
    /** Helper text below the input */
    helperText?: string;
    /** Error message */
    error?: string;
    /** Placeholder text */
    placeholder?: string;
    /** Unit displayed after the number */
    unit?: string;
    /** Prefix text before the number */
    prefix?: string;
    /** Show stepper buttons */
    showStepper?: boolean;
    /** Allow empty value (displays placeholder) */
    allowEmpty?: boolean;
    /** Width in px (default: 160) */
    width?: number;
    /** Test id */
    'data-testid'?: string;
    /** Input name attribute */
    name?: string;
    /** Auto focus */
    autoFocus?: boolean;
    /** Required indicator */
    required?: boolean;
    /** aria-label */
    'aria-label'?: string;
}
/**
 * InputNumber — numeric input with optional stepper buttons.
 *
 * Supports min/max clamping, precision, unit/prefix display,
 * three sizes, and controlled / uncontrolled modes.
 */
export declare function InputNumber({ value: valueProp, defaultValue, onChange, min, max, step, precision, size, disabled, readOnly, label, helperText, error, placeholder, unit, prefix: prefixText, showStepper, allowEmpty, width, 'data-testid': dataTestId, name, autoFocus, required, 'aria-label': ariaLabel, }: InputNumberProps): React.JSX.Element;
export default InputNumber;
