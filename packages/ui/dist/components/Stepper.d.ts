import React from 'react';
export interface StepperStep {
    /** Step label (required) */
    label: string;
    /** Optional description shown below the label */
    description?: string;
    /** Step icon or index badge override */
    icon?: React.ReactNode;
    /** Mark step as completed; skips click-keyboard interaction when false */
    completed?: boolean;
    /** Mark step as having an error */
    error?: boolean;
    /** Disable interaction for this step */
    disabled?: boolean;
}
export interface StepperProps {
    /** Ordered steps */
    steps: StepperStep[];
    /** Current active step (0-indexed) */
    activeStep: number;
    /** Called when a step label is clicked (unless disabled or future-only) */
    onStepClick?: (stepIndex: number) => void;
    /** Orientation */
    orientation?: 'horizontal' | 'vertical';
    /** Visual variant */
    variant?: 'default' | 'dots' | 'progress';
    /** Size preset */
    size?: 'sm' | 'md' | 'lg';
    /** Test id */
    'data-testid'?: string;
    /** Extra class */
    className?: string;
    /** Inline styles */
    style?: React.CSSProperties;
}
/**
 * Stepper — multi-step progress indicator with horizontal/vertical layout,
 * dot / progress variants, and clickable step navigation.
 *
 * Common use-cases: onboarding wizards, checkout flows, multi-page forms.
 */
export declare function Stepper({ steps, activeStep, onStepClick, orientation, variant, size, 'data-testid': dataTestId, className, style, }: StepperProps): React.JSX.Element;
