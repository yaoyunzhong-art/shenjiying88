import React from 'react';
interface FormFieldProps {
    label: string;
    htmlFor?: string;
    error?: string;
    required?: boolean;
    hint?: string;
    helper?: string;
    disabled?: boolean;
    compact?: boolean;
    children: React.ReactNode;
}
export declare function FormField({ label, htmlFor, error, required, hint, helper, disabled, compact, children, }: FormFieldProps): React.JSX.Element;
export {};
