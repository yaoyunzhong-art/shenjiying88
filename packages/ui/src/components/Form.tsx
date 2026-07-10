'use client';

import React, { createContext, useContext, useCallback, useState, type FormEvent, type ReactNode, type CSSProperties } from 'react';
import { FormField } from './FormField';
import { SubmitButton } from './SubmitButton';
import { FormSubmitFeedback } from './FormSubmitFeedback';
import type { LegacyFormSubmitState } from './FormSubmitFeedback';

// ---- Types ----

type FormLayout = 'vertical' | 'horizontal' | 'inline';

type ValidationRule = {
  required?: boolean;
  min?: number;
  max?: number;
  minLength?: number;
  maxLength?: number;
  pattern?: RegExp;
  patternMessage?: string;
  validator?: (value: string) => string | undefined;
};

type FieldErrors = Record<string, string | undefined>;

interface FormContextValue {
  layout: FormLayout;
  errors: FieldErrors;
  setFieldError: (name: string, error?: string) => void;
  registerValidation: (name: string, rules: ValidationRule) => void;
  disabled: boolean;
  size: 'sm' | 'md' | 'lg';
}

const FormContext = createContext<FormContextValue>({
  layout: 'vertical',
  errors: {},
  setFieldError: () => {},
  registerValidation: () => {},
  disabled: false,
  size: 'md',
});

export function useFormContext() {
  return useContext(FormContext);
}

export interface FormProps {
  /** 子元素 */
  children: ReactNode;
  /** 布局模式 */
  layout?: FormLayout;
  /** 初始值 */
  initialValues?: Record<string, string>;
  /** 验证规则 */
  validationRules?: Record<string, ValidationRule>;
  /** 提交回调 */
  onSubmit?: (values: Record<string, string>) => Promise<void> | void;
  /** 是否禁用 */
  disabled?: boolean;
  /** 尺寸 */
  size?: 'sm' | 'md' | 'lg';
  /** 自定义样式 */
  style?: CSSProperties;
  /** 类名 */
  className?: string;
  /** 提交成功文案 */
  successMessage?: string;
  /** 提交失败时是否允许重试 */
  allowRetry?: boolean;
}

export function Form({
  children,
  layout = 'vertical',
  initialValues = {},
  validationRules = {},
  onSubmit,
  disabled = false,
  size = 'md',
  style,
  className,
  successMessage = '提交成功',
  allowRetry = true,
}: FormProps) {
  const [values, setValues] = useState<Record<string, string>>(initialValues);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [submitState, setSubmitState] = useState<LegacyFormSubmitState>({
    isSubmitting: false,
  });

  const registerValidation = useCallback((name: string, _rules: ValidationRule) => {
    // validation rules stored via closure in validateField
  }, []);

  const setFieldError = useCallback((name: string, error?: string) => {
    setErrors((prev) => ({ ...prev, [name]: error }));
  }, []);

  const validateField = useCallback(
    (name: string, value: string): string | undefined => {
      const rules = validationRules[name];
      if (!rules) return undefined;

      if (rules.required && !value.trim()) {
        return '此项为必填';
      }
      if (rules.minLength && value.length < rules.minLength) {
        return `最少 ${rules.minLength} 个字符`;
      }
      if (rules.maxLength && value.length > rules.maxLength) {
        return `最多 ${rules.maxLength} 个字符`;
      }
      if (rules.min && Number(value) < rules.min) {
        return `最小值 ${rules.min}`;
      }
      if (rules.max && Number(value) > rules.max) {
        return `最大值 ${rules.max}`;
      }
      if (rules.pattern && !rules.pattern.test(value)) {
        return rules.patternMessage || '格式不正确';
      }
      if (rules.validator) {
        return rules.validator(value);
      }
      return undefined;
    },
    [validationRules]
  );

  const validateAll = useCallback(
    (data: Record<string, string>): boolean => {
      const newErrors: FieldErrors = {};
      let valid = true;

      for (const name of Object.keys(validationRules)) {
        const error = validateField(name, data[name] ?? '');
        if (error) {
          newErrors[name] = error;
          valid = false;
        }
      }

      setErrors(newErrors);
      return valid;
    },
    [validationRules, validateField]
  );

  const handleSubmit = useCallback(
    async (e: FormEvent) => {
      e.preventDefault();
      if (disabled) return;

      // Gather current values from form
      const form = e.target as HTMLFormElement;
      const formData = new FormData(form);
      const data: Record<string, string> = {};
      formData.forEach((val, key) => {
        data[key] = typeof val === 'string' ? val : String(val);
      });

      if (!validateAll(data)) return;

      if (!onSubmit) return;

      setSubmitState({ isSubmitting: true });

      try {
        await onSubmit(data);
        setSubmitState({
          isSubmitting: false,
          hasSubmitted: true,
          successMessage,
        });
      } catch (err: unknown) {
        const message =
          err instanceof Error ? err.message : '提交失败，请重试';
        setSubmitState({
          isSubmitting: false,
          hasSubmitted: false,
          errorMessage: message,
        });
      }
    },
    [disabled, onSubmit, validateAll, successMessage]
  );

  const handleReset = useCallback(() => {
    setValues(initialValues);
    setErrors({});
    setSubmitState({ isSubmitting: false });
  }, [initialValues]);

  const ctx: FormContextValue = {
    layout,
    errors,
    setFieldError,
    registerValidation,
    disabled,
    size,
  };

  const layoutStyle: CSSProperties =
    layout === 'horizontal'
      ? { display: 'grid', gridTemplateColumns: '120px 1fr', gap: '8px 16px', alignItems: 'start' }
      : layout === 'inline'
        ? { display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'flex-end' }
        : {};

  return (
    <FormContext.Provider value={ctx}>
      <form
        onSubmit={handleSubmit}
        onReset={handleReset}
        style={{
          ...layoutStyle,
          ...style,
        }}
        className={className}
        noValidate
      >
        {children}

        {/* Submit feedback area */}
        {(submitState.isSubmitting || submitState.errorMessage || submitState.successMessage) && (
          <div style={layout === 'horizontal' ? { gridColumn: '1 / -1' } : undefined}>
            <FormSubmitFeedback
              state={submitState}
              onRetry={allowRetry ? () => handleReset() : undefined}
              onDismissError={() => setSubmitState((s) => ({ ...s, errorMessage: undefined }))}
              onDismissSuccess={() => setSubmitState((s) => ({ ...s, successMessage: undefined }))}
            />
          </div>
        )}
      </form>
    </FormContext.Provider>
  );
}

// ---- Form.Item ----

export interface FormItemProps {
  label: string;
  name: string;
  required?: boolean;
  hint?: string;
  rules?: ValidationRule;
  children: ReactNode;
  compact?: boolean;
}

Form.Item = function FormItem({
  label,
  name,
  required,
  hint,
  rules: _rules,
  children,
  compact,
}: FormItemProps) {
  const { errors, disabled, size } = useFormContext();

  const errorMsg = errors[name];

  const cloneChild = React.isValidElement(children)
    ? React.cloneElement(children as React.ReactElement<{ id?: string; name?: string; disabled?: boolean; 'data-size'?: string }>, {
        id: name,
        name,
        disabled: disabled || (children as React.ReactElement).props.disabled,
        'data-size': size,
      })
    : children;

  return (
    <FormField
      label={label}
      htmlFor={name}
      error={errorMsg}
      required={required}
      helper={hint}
      disabled={disabled}
      compact={compact}
    >
      {cloneChild}
    </FormField>
  );
};

// ---- Form.Submit ----

export interface FormSubmitProps {
  children?: ReactNode;
  block?: boolean;
}

Form.Submit = function FormSubmit({ children, block = true }: FormSubmitProps) {
  const { disabled, size, layout } = useFormContext();

  const sizeMap = { sm: 'sm', md: 'md', lg: 'lg' } as const;

  return (
    <div
      style={
        layout === 'horizontal'
          ? { gridColumn: '1 / -1', marginTop: 8 }
          : { marginTop: 8 }
      }
    >
      <SubmitButton
        type="submit"
        disabled={disabled}
        block={block}
      >
        {children ?? '提交'}
      </SubmitButton>
    </div>
  );
};
