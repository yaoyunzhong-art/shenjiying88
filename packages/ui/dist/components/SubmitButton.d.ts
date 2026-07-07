import React from 'react';
export type SubmitButtonVariant = 'primary' | 'secondary' | 'danger' | 'brand';
export interface SubmitButtonProps {
    /** Whether the button is in a submitting/loading state */
    loading?: boolean;
    /** Label shown when not loading */
    label?: string;
    /** Label shown when loading (default: "提交中...") */
    loadingLabel?: string;
    /** Whether the button is disabled */
    disabled?: boolean;
    /** Visual variant */
    variant?: SubmitButtonVariant;
    /** Click handler (ignored when loading) */
    onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
    /** HTML button type */
    type?: 'submit' | 'button' | 'reset';
    /** Additional inline styles */
    style?: React.CSSProperties;
    /** Additional className */
    className?: string;
    /** Children content (overrides label/loading when provided) */
    children?: React.ReactNode;
}
export declare const SubmitButton: React.ForwardRefExoticComponent<SubmitButtonProps & React.RefAttributes<HTMLButtonElement>>;
