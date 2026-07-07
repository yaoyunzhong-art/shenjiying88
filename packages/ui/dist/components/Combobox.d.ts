import React from 'react';
export interface ComboboxOption {
    value: string;
    label: string;
    /** Optional description shown beneath the label */
    description?: string;
    /** Optional avatar/icon */
    icon?: React.ReactNode;
    /** Optional disabled state */
    disabled?: boolean;
    /** Optional group label */
    group?: string;
}
export interface ComboboxProps {
    /** Current value */
    value?: string;
    /** Options */
    options: ComboboxOption[];
    /** Value change callback */
    onChange?: (value: string) => void;
    /** Placeholder text */
    placeholder?: string;
    /** Label above the input */
    label?: string;
    /** Whether to allow custom (non-option) values */
    allowCustom?: boolean;
    /** Error message */
    error?: string;
    /** Help text */
    helpText?: string;
    /** Whether disabled */
    disabled?: boolean;
    /** Whether required */
    required?: boolean;
    /** Empty state message when no results */
    emptyMessage?: string;
    /** Loading state */
    loading?: boolean;
    /** Maximum visible options before scroll (default 8) */
    maxVisible?: number;
    /** Custom styles */
    style?: React.CSSProperties;
    /** Custom class name */
    className?: string;
    /** Test id */
    'data-testid'?: string;
}
export declare const Combobox: React.NamedExoticComponent<ComboboxProps>;
export default Combobox;
