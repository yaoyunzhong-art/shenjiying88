'use client';

import React, { useState } from 'react';
import { FormSubmitFeedback, useFormSubmit } from './FormSubmitFeedback';
import { SubmitButton, type SubmitButtonVariant } from './SubmitButton';
import { PageShell } from './PageShell';

// ==================== 类型定义 ====================

/** 字段验证规则 */
export interface FormPageFieldRule {
  /** 验证函数，返回错误信息或 null */
  validate: (value: unknown) => string | null;
}

/** 表单字段定义 */
export interface FormPageField<T = Record<string, unknown>> {
  /** 字段 key */
  key: keyof T & string;
  /** 标签 */
  label: string;
  /** 是否必填 */
  required?: boolean;
  /** 占位符 */
  placeholder?: string;
  /** 帮助文本 */
  helper?: string;
  /** 初始值 */
  initialValue?: T[keyof T & string];
  /** 输入类型 */
  type?: 'text' | 'email' | 'number' | 'password' | 'textarea' | 'select' | 'date';
  /** Select 选项 */
  options?: { label: string; value: string }[];
  /** 验证规则 */
  rules?: FormPageFieldRule[];
}

/** 表单页标题 & 描述区域 */
export interface FormPageScaffoldMeta {
  title: string;
  description?: string;
  /** 删除按钮配置 */
  deleteAction?: {
    label: string;
    onDelete: () => void | Promise<void>;
    confirmText?: string;
  };
}

/** 向服务端提交的数据转换 */
export interface FormPageSubmitResult<T = Record<string, unknown>> {
  data: T;
  message?: string;
}

export interface FormPageScaffoldProps<T extends Record<string, unknown> = Record<string, unknown>> {
  /** 页面元信息 */
  meta: FormPageScaffoldMeta;
  /** 字段定义 */
  fields: FormPageField<T>[];
  /** 提交处理（返回 null 表示失败） */
  onSubmit: (data: T) => Promise<FormPageSubmitResult<T> | null>;
  /** 表单变化回调 */
  onChange?: (key: keyof T & string, value: unknown) => void;
  /** 自定义顶层操作按钮 */
  topActions?: React.ReactNode;
  /** 提交按钮文案 */
  submitLabel?: string;
  /** 提交按钮变体 */
  submitVariant?: SubmitButtonVariant;
  /** 返回路径 */
  backUrl?: string;
  /** 页面最大宽度 */
  maxWidth?: number;
  /** 自定义样式 */
  className?: string;
  /** 自定义底部 */
  footer?: React.ReactNode;
  /** 自定义成功回调 */
  onSuccess?: (result: FormPageSubmitResult<T>) => void;
  /** 是否禁用所有字段 */
  disabled?: boolean;
}

// ==================== 验证工具 ====================

/** 运行字段级验证，返回错误映射 */
export function validateFormFields<T extends Record<string, unknown>>(
  fields: FormPageField<T>[],
  values: Record<string, unknown>,
): Record<string, string> {
  const errors: Record<string, string> = {};

  for (const field of fields) {
    const val = values[field.key];

    // 必填检查
    if (field.required) {
      if (val === undefined || val === null || val === '') {
        errors[field.key] = `${field.label} 不能为空`;
        continue;
      }
      if (Array.isArray(val) && val.length === 0) {
        errors[field.key] = `${field.label} 不能为空`;
        continue;
      }
    }

    // 自定义规则
    if (field.rules && val !== undefined && val !== null && val !== '') {
      for (const rule of field.rules) {
        const ruleError = rule.validate(val);
        if (ruleError) {
          errors[field.key] = ruleError;
          break;
        }
      }
    }
  }

  return errors;
}

// ==================== 内联 Input 渲染 ====================

function FieldInput({
  field,
  value,
  onChange,
  disabled,
}: {
  field: FormPageField;
  value: unknown;
  onChange: (v: unknown) => void;
  disabled: boolean;
}) {
  const baseStyle: React.CSSProperties = {
    width: '100%',
    padding: '10px 14px',
    borderRadius: 10,
    border: '1px solid rgba(148, 163, 184, 0.22)',
    background: 'rgba(15, 23, 42, 0.40)',
    color: '#e2e8f0',
    fontSize: 14,
    transition: 'border-color 0.2s',
    outline: 'none',
    boxSizing: 'border-box',
  };

  if (field.type === 'textarea') {
    return (
      <textarea
        value={(value as string) ?? ''}
        onChange={(e) => onChange(e.target.value)}
        placeholder={field.placeholder}
        disabled={disabled}
        rows={4}
        style={{ ...baseStyle, resize: 'vertical', minHeight: 96 }}
      />
    );
  }

  if (field.type === 'select' && field.options) {
    return (
      <select
        value={(value as string) ?? ''}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        style={baseStyle}
      >
        <option value="">-- 请选择 --</option>
        {field.options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    );
  }

  return (
    <input
      type={field.type ?? 'text'}
      value={(value as string) ?? ''}
      onChange={(e) => onChange(field.type === 'number' ? Number(e.target.value) : e.target.value)}
      placeholder={field.placeholder}
      disabled={disabled}
      style={baseStyle}
    />
  );
}

// ==================== 主组件 ====================

/**
 * FormPageScaffold — 表单页面骨架组件。
 *
 * 整合表单字段渲染、客户端验证、提交反馈、错误处理，
 * 提供标准化的表单页布局。与 FormField、SubmitButton、
 * FormSubmitFeedback 协同工作。
 *
 * @example
 * // 创建资源表单
 * <FormPageScaffold
 *   meta={{ title: '新建商品', description: '添加一个新的商品条目' }}
 *   fields={[
 *     { key: 'name', label: '商品名称', required: true },
 *     { key: 'price', label: '价格', type: 'number', required: true,
 *       rules: [{ validate: (v) => Number(v) > 0 ? null : '价格必须大于0' }] },
 *     { key: 'category', label: '分类', type: 'select',
 *       options: [{ label: '电子', value: 'electronics' }, { label: '服装', value: 'clothing' }] },
 *   ]}
 *   onSubmit={async (data) => {
 *     await api.createProduct(data);
 *     return { data, message: '商品创建成功' };
 *   }}
 *   backUrl="/products"
 * />
 *
 * @example
 * // 编辑模式（含删除按钮）
 * <FormPageScaffold
 *   meta={{
 *     title: '编辑商品',
 *     deleteAction: {
 *       label: '删除商品',
 *       onDelete: () => api.deleteProduct(id),
 *       confirmText: '确定要删除吗？',
 *     },
 *   }}
 *   fields={[...]}
 *   onSubmit={async (data) => {
 *     await api.updateProduct(id, data);
 *     return { data, message: '保存成功' };
 *   }}
 * />
 */
export function FormPageScaffold<T extends Record<string, unknown> = Record<string, unknown>>({
  meta,
  fields,
  onSubmit,
  onChange,
  topActions,
  submitLabel = '保存',
  submitVariant = 'brand',
  backUrl,
  maxWidth = 720,
  className,
  footer,
  onSuccess,
  disabled = false,
}: FormPageScaffoldProps<T>) {
  // ---- 初始化表单值 ----
  const [values, setValues] = useState<Record<string, unknown>>(() => {
    const init: Record<string, unknown> = {};
    for (const f of fields) {
      init[f.key] = f.initialValue ?? '';
    }
    return init;
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [_submitted, setSubmitted] = useState(false);

  // ---- 使用 useFormSubmit ----
  const { state, submit, clearError, clearSuccess } = useFormSubmit<FormPageSubmitResult<T>>({
    onSubmit: async () => {
      // 先验证
      const validationErrors = validateFormFields(fields, values);
      if (Object.keys(validationErrors).length > 0) {
        setErrors(validationErrors);
        throw new Error('请修正表单中的错误后重新提交');
      }

      const result = await onSubmit(values as T);
      if (!result) {
        throw new Error('提交失败，请稍后重试');
      }
      setErrors({});
      setSubmitted(true);
      onSuccess?.(result);
      return result;
    },
    successMessage: (result) => result.message ?? '保存成功',
    defaultErrorMessage: '提交失败，请稍后重试',
  });

  // ---- 字段值变更 ----
  const handleFieldChange = (key: string, value: unknown) => {
    setValues((prev) => ({ ...prev, [key]: value }));
    onChange?.(key as keyof T & string, value);
    // 变更时清除对应字段错误
    if (errors[key]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[key];
        return next;
      });
    }
  };

  // ---- 表单提交 ----
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    void submit();
  };

  // ---- 构建 field 到 label 的快速映射 ----
  const fieldLabelMap: Record<string, string> = {};
  for (const f of fields) {
    fieldLabelMap[f.key] = f.label;
  }

  return (
    <PageShell
      title={meta.title}
      description={meta.description}
      actions={topActions}
    >
      {/* 返回链接 */}
      {backUrl && (
        <div style={{ marginBottom: 12 }}>
          <a
            href={backUrl}
            style={{
              fontSize: 13,
              color: '#94a3b8',
              textDecoration: 'none',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 4,
            }}
          >
            ← 返回
          </a>
        </div>
      )}
      <form
        onSubmit={handleSubmit}
        className={className}
        style={{ maxWidth, margin: '0 auto' }}
        noValidate
      >
        {/* 字段列表 */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {fields.map((field) => (
            <div
              key={field.key}
              style={{
                marginBottom: 16,
                opacity: disabled ? 0.6 : 1,
                pointerEvents: disabled ? 'none' : 'auto',
              }}
            >
              <label
                htmlFor={`form-field-${field.key}`}
                style={{
                  display: 'block',
                  fontSize: 13,
                  fontWeight: 500,
                  color: disabled ? '#64748b' : '#cbd5e1',
                  marginBottom: 6,
                }}
              >
                {field.label}
                {field.required && (
                  <span style={{ color: '#ef4444', marginLeft: 2 }}>*</span>
                )}
              </label>

              <FieldInput
                field={field as unknown as FormPageField<Record<string, unknown>>}
                value={values[field.key]}
                onChange={(v) => handleFieldChange(field.key, v)}
                disabled={disabled}
              />

              {field.helper && !errors[field.key] && (
                <p style={{ fontSize: 12, color: '#64748b', margin: '4px 0 0' }}>
                  {field.helper}
                </p>
              )}

              {errors[field.key] && (
                <p style={{ fontSize: 12, color: '#fca5a5', margin: '4px 0 0' }}>
                  {errors[field.key]}
                </p>
              )}
            </div>
          ))}
        </div>

        {/* 提交反馈 */}
        <FormSubmitFeedback
          state={state}
          onRetry={() => {
            clearError();
            clearSuccess();
            void submit();
          }}
          onDismissError={clearError}
          onDismissSuccess={clearSuccess}
        />

        {/* 操作区 */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 12,
            marginTop: 24,
            paddingTop: 20,
            borderTop: '1px solid rgba(148, 163, 184, 0.10)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <SubmitButton
              loading={state.isSubmitting}
              label={submitLabel}
              variant={submitVariant}
              type="submit"
            />

            {backUrl && (
              <a
                href={backUrl}
                style={{
                  padding: '10px 14px',
                  borderRadius: 10,
                  color: '#94a3b8',
                  fontSize: 14,
                  fontWeight: 500,
                  textDecoration: 'none',
                  border: '1px solid transparent',
                  transition: 'all 0.15s',
                }}
              >
                取消
              </a>
            )}
          </div>

          {/* 删除按钮 */}
          {meta.deleteAction && (
            <DeleteButton
              label={meta.deleteAction.label}
              confirmText={meta.deleteAction.confirmText ?? `确定要${meta.deleteAction.label}吗？`}
              onDelete={meta.deleteAction.onDelete}
              disabled={disabled || state.isSubmitting}
            />
          )}
        </div>

        {/* 自定义底部 */}
        {footer}
      </form>
    </PageShell>
  );
}

// ==================== 删除确认按钮 ====================

function DeleteButton({
  label,
  confirmText,
  onDelete,
  disabled,
}: {
  label: string;
  confirmText: string;
  onDelete: () => void | Promise<void>;
  disabled: boolean;
}) {
  const [showConfirm, setShowConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);

  if (!showConfirm) {
    return (
      <button
        type="button"
        disabled={disabled}
        onClick={() => setShowConfirm(true)}
        style={{
          background: 'none',
          border: '1px solid rgba(248, 113, 113, 0.20)',
          color: '#fca5a5',
          borderRadius: 10,
          padding: '10px 16px',
          fontSize: 13,
          fontWeight: 500,
          cursor: disabled ? 'not-allowed' : 'pointer',
          transition: 'all 0.15s',
          opacity: disabled ? 0.5 : 1,
        }}
      >
        {label}
      </button>
    );
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <span style={{ fontSize: 12, color: '#f87171' }}>{confirmText}</span>
      <button
        type="button"
        disabled={deleting}
        onClick={async () => {
          setDeleting(true);
          try {
            await onDelete();
          } catch {
            // 删除失败保持确认状态
            setDeleting(false);
          }
        }}
        style={{
          background: '#dc2626',
          border: '1px solid rgba(248, 113, 113, 0.20)',
          color: '#fff',
          borderRadius: 10,
          padding: '8px 16px',
          fontSize: 13,
          fontWeight: 600,
          cursor: deleting ? 'wait' : 'pointer',
          opacity: deleting ? 0.7 : 1,
        }}
      >
        {deleting ? '删除中...' : '确认'}
      </button>
      <button
        type="button"
        disabled={deleting}
        onClick={() => setShowConfirm(false)}
        style={{
          background: 'none',
          border: '1px solid rgba(148, 163, 184, 0.16)',
          color: '#94a3b8',
          borderRadius: 10,
          padding: '8px 16px',
          fontSize: 13,
          cursor: deleting ? 'not-allowed' : 'pointer',
        }}
      >
        取消
      </button>
    </div>
  );
}
