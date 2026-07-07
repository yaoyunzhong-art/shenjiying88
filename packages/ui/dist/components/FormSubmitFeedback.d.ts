import React from 'react';
export interface LegacyFormSubmitState<T = unknown> {
    isSubmitting: boolean;
    errorMessage?: string;
    successMessage?: string;
    hasSubmitted?: boolean;
    result?: T;
}
interface FormSubmitFeedbackProps<T = unknown> {
    state?: LegacyFormSubmitState<T>;
    submitting?: boolean;
    error?: string;
    success?: string;
    onRetry?: () => void | Promise<void | T | undefined>;
    onDismissError?: () => void;
    onDismissSuccess?: () => void;
    renderSuccess?: (message: string) => React.ReactNode;
    renderError?: (message: string) => React.ReactNode;
}
export declare function FormSubmitFeedback<T = unknown>({ state, submitting, error, success, onRetry, onDismissError, onDismissSuccess, renderSuccess, renderError, }: FormSubmitFeedbackProps<T>): React.JSX.Element | null;
interface UseFormSubmitOptions<T> {
    onSubmit: () => Promise<T>;
    successMessage?: string | ((result: T) => string);
    defaultErrorMessage?: string;
}
export declare function useFormSubmit<T = void>({ onSubmit, successMessage, defaultErrorMessage, }: UseFormSubmitOptions<T>): {
    state: LegacyFormSubmitState<T>;
    submit: () => Promise<T | undefined>;
    reset: () => void;
    clearError: () => void;
    clearSuccess: () => void;
    submitting: boolean;
    error: string | undefined;
    success: string | undefined;
};
export {};
