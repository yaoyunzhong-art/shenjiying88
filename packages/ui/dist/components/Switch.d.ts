import React from 'react';
export type SwitchSize = 'sm' | 'md' | 'lg';
export interface SwitchProps {
    /** Controlled checked state */
    checked?: boolean;
    /** Default unchecked (uncontrolled) */
    defaultChecked?: boolean;
    /** Called on toggle with new checked value */
    onChange?: (checked: boolean) => void;
    /** Disabled state */
    disabled?: boolean;
    /** Visual size */
    size?: SwitchSize;
    /** Accessible label rendered next to the switch */
    label?: string;
    /** Label position relative to the switch */
    labelPosition?: 'left' | 'right';
    /** Color when checked */
    checkedColor?: string;
    /** Color when unchecked */
    uncheckedColor?: string;
    /** Thumb color */
    thumbColor?: string;
    /** ARIA label for the switch input (falls back to `label` when set) */
    'aria-label'?: string;
    /** Test id */
    'data-testid'?: string;
    /** Extra class */
    className?: string;
    /** Inline style override */
    style?: React.CSSProperties;
}
/**
 * Switch — toggle control for binary settings.
 *
 * Supports controlled / uncontrolled usage, three sizes, custom colors,
 * labels on either side, disabled state, and full ARIA support.
 */
export declare function Switch({ checked, defaultChecked, onChange, disabled, size, label, labelPosition, checkedColor, uncheckedColor, thumbColor, 'aria-label': ariaLabel, 'data-testid': dataTestId, className, style, }: SwitchProps): React.JSX.Element;
