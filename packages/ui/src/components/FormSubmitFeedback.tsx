'use client';
import React, { useState, useCallback } from 'react';

export interface LegacyFormSubmitState<T = unknown> {
  isSubmitting: boolean;
  errorMessage?: string;
  successMessage?: string;
  hasSubmitted?: boolean;
  result?: T;
}

interface FormSubmitFeedbackProps<T = unknown> {
  children?: React.ReactNode;
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

export function FormSubmitFeedback<T = unknown>({
  state,
  submitting,
  error,
  success,
  onRetry,
  onDismissError,
  onDismissSuccess,
  renderSuccess,
  renderError,
}: FormSubmitFeedbackProps<T>) {
  const resolvedSubmitting = submitting ?? state?.isSubmitting ?? false;
  const resolvedError = error ?? state?.errorMessage ?? undefined;
  const resolvedSuccess = success ?? state?.successMessage ?? undefined;

  if (resolvedSubmitting) {
    return (
      <div
        style={{
          padding: '10px 16px',
          borderRadius: 8,
          background: 'rgba(59,130,246,0.10)',
          color: '#93c5fd',
          fontSize: 13,
          display: 'flex',
          alignItems: 'center',
          gap: 8,
        }}
      >
        <div
          style={{
            width: 14,
            height: 14,
            borderRadius: '50%',
            border: '2px solid rgba(96,165,250,0.3)',
            borderTopColor: '#60a5fa',
            animation: 'spin 0.6s linear infinite',
          }}
        />
        Submitting...
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  // Both success and error can be rendered together (success first)
  const hasContent = !!resolvedSuccess || !!resolvedError;
  if (!hasContent) return null;

  return (
    <>
      {resolvedSuccess && (
        renderSuccess ? (
          renderSuccess(resolvedSuccess)
        ) : (
          <div
            style={{
              padding: '10px 16px',
              borderRadius: 8,
              background: 'rgba(34,197,94,0.10)',
              color: '#86efac',
              fontSize: 13,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 8,
            }}
          >
            <span>✓ {resolvedSuccess}</span>
            {onDismissSuccess && (
              <button
                type="button"
                onClick={onDismissSuccess}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#86efac',
                  cursor: 'pointer',
                  fontSize: 16,
                  padding: 0,
                  lineHeight: 1,
                }}
              >
                ×
              </button>
            )}
          </div>
        )
      )}
      {resolvedError && (
        renderError ? (
          renderError(resolvedError)
        ) : (
          <div
            style={{
              padding: '10px 16px',
              borderRadius: 8,
              background: 'rgba(239,68,68,0.10)',
              color: '#fca5a5',
              fontSize: 13,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 8,
            }}
          >
            <span>⚠ {resolvedError}</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              {onRetry ? (
                <button
                  type="button"
                  onClick={() => void onRetry()}
                  style={{
                    background: 'none',
                    border: '1px solid rgba(252, 165, 165, 0.35)',
                    color: '#fca5a5',
                    cursor: 'pointer',
                    fontSize: 12,
                    padding: '4px 8px',
                    borderRadius: 999,
                  }}
                >
                  重试
                </button>
              ) : null}
              {onDismissError && (
                <button
                  type="button"
                  onClick={onDismissError}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#fca5a5',
                    cursor: 'pointer',
                    fontSize: 16,
                    padding: 0,
                    lineHeight: 1,
                  }}
                >
                  ×
                </button>
              )}
            </div>
          </div>
        )
      )}
    </>
  );
}

interface UseFormSubmitOptions<T> {
  onSubmit: () => Promise<T>;
  successMessage?: string | ((result: T) => string);
  defaultErrorMessage?: string;
}

export function useFormSubmit<T = void>({
  onSubmit,
  successMessage,
  defaultErrorMessage,
}: UseFormSubmitOptions<T>) {
  const [state, setState] = useState<LegacyFormSubmitState<T>>({ isSubmitting: false });

  const submit = useCallback(async (): Promise<T | undefined> => {
    setState({ isSubmitting: true });
    try {
      const result = await onSubmit();
      const resolvedSuccessMessage =
        typeof successMessage === 'function'
          ? successMessage(result)
          : (successMessage ?? 'Saved successfully');
      setState({
        isSubmitting: false,
        result,
        successMessage: resolvedSuccessMessage,
      });
      return result;
    } catch (e) {
      setState({
        isSubmitting: false,
        errorMessage: e instanceof Error ? e.message : (defaultErrorMessage ?? 'An error occurred'),
      });
      return undefined;
    }
  }, [defaultErrorMessage, onSubmit, successMessage]);

  const clearError = useCallback(() => {
    setState((s) => ({ ...s, errorMessage: undefined }));
  }, []);

  const clearSuccess = useCallback(() => {
    setState((s) => ({ ...s, successMessage: undefined }));
  }, []);

  const reset = useCallback(() => {
    setState({ isSubmitting: false });
  }, []);

  return {
    state,
    submit,
    reset,
    clearError,
    clearSuccess,
    submitting: state.isSubmitting,
    error: state.errorMessage,
    success: state.successMessage,
  };
}
