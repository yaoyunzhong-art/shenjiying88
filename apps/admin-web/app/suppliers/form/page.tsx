'use client'
/**
 * 供应商编辑/创建表单页 — Supplier Form Page (Next.js App Router Page)
 * 功能: 新建/编辑供应商信息，含字段验证、提交、错误处理
 * 角色视角: 👤采购管理 / 供应链
 */
'use client';

import React, { useState, useCallback } from 'react';

import {
  FormField,
  FormSubmitFeedback,
  PageShell,
  SubmitButton,
  StatusBadge,
  WorkspaceBreadcrumb,
} from '@m5/ui';

// ---- 常量与类型映射 ----

const SUPPLIER_CATEGORY_OPTIONS = [
  { value: 'raw_material', label: '原材料' },
  { value: 'packaging', label: '包装耗材' },
  { value: 'equipment', label: '设备' },
  { value: 'logistics', label: '物流配送' },
  { value: 'service', label: '服务' },
  { value: 'others', label: '其他' },
] as const;

const SUPPLIER_STATUS_OPTIONS = [
  { value: 'active', label: '合作中' },
  { value: 'paused', label: '暂停合作' },
  { value: 'pending_audit', label: '待审核' },
] as const;

// ---- 表单字段定义 ----

interface SupplierFormValues {
  name: string;
  code: string;
  category: string;
  status: string;
  contactPerson: string;
  contactPhone: string;
  email: string;
  address: string;
  creditRating: string;
}

const DEFAULT_VALUES: SupplierFormValues = {
  name: '',
  code: '',
  category: 'raw_material',
  status: 'pending_audit',
  contactPerson: '',
  contactPhone: '',
  email: '',
  address: '',
  creditRating: 'B',
};

interface FieldError {
  field: keyof SupplierFormValues;
  message: string;
}

// ---- 验证逻辑 ----

function validateForm(values: SupplierFormValues): FieldError[] {
  const errors: FieldError[] = [];

  if (!values.name.trim()) {
    errors.push({ field: 'name', message: '供应商名称不能为空' });
  } else if (values.name.trim().length < 2) {
    errors.push({ field: 'name', message: '供应商名称至少2个字符' });
  } else if (values.name.trim().length > 50) {
    errors.push({ field: 'name', message: '供应商名称不能超过50个字符' });
  }

  if (!values.code.trim()) {
    errors.push({ field: 'code', message: '供应商编码不能为空' });
  } else if (!/^[A-Za-z0-9_-]{3,20}$/.test(values.code.trim())) {
    errors.push({ field: 'code', message: '编码格式：3-20位字母、数字、下划线或连字符' });
  }

  if (!values.contactPerson.trim()) {
    errors.push({ field: 'contactPerson', message: '联系人不能为空' });
  }

  if (!values.contactPhone.trim()) {
    errors.push({ field: 'contactPhone', message: '联系电话不能为空' });
  } else if (!/^1\d{10}$/.test(values.contactPhone.trim()) && !/^\d{7,15}$/.test(values.contactPhone.trim())) {
    errors.push({ field: 'contactPhone', message: '请输入有效的联系电话（手机号或固话）' });
  }

  if (!values.email.trim()) {
    errors.push({ field: 'email', message: '邮箱不能为空' });
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email.trim())) {
    errors.push({ field: 'email', message: '邮箱格式不正确' });
  }

  if (!values.address.trim()) {
    errors.push({ field: 'address', message: '地址不能为空' });
  } else if (values.address.trim().length < 5) {
    errors.push({ field: 'address', message: '地址至少5个字符' });
  }

  return errors;
}

// ---- 表单页面组件 ----

export default function SupplierFormPage() {
  const [values, setValues] = useState<SupplierFormValues>(DEFAULT_VALUES);
  const [fieldErrors, setFieldErrors] = useState<FieldError[]>([]);
  const [submitState, setSubmitState] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');

  const getFieldError = useCallback(
    (field: keyof SupplierFormValues): string | undefined =>
      fieldErrors.find((e) => e.field === field)?.message,
    [fieldErrors],
  );

  const handleSubmit = useCallback(async () => {
    if (submitState === 'submitting') return;
    setSubmitState('submitting');
    try {
      await new Promise((resolve) => setTimeout(resolve, 1200));
      // Mock duplicate code check
      if (values.code === 'SUP-001') {
        throw new Error('供应商编码 SUP-001 已存在，请使用其他编码');
      }
      setSubmitState('success');
    } catch {
      setSubmitState('error');
    }
  }, [values.code, submitState]);

  const resetSubmit = useCallback(() => {
    setSubmitState('idle');
  }, []);

  const setValue = useCallback(
    (field: keyof SupplierFormValues) =>
      (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        setValues((prev) => ({ ...prev, [field]: e.target.value }));
        // 清除该字段错误
        setFieldErrors((prev) => prev.filter((e) => e.field !== field));
      },
    [],
  );

  const onSubmit = useCallback(async () => {
    const errors = validateForm(values);
    setFieldErrors(errors);
    if (errors.length > 0) {
      // 聚焦到第一个错误字段
      const field = errors[0]!.field;
      const firstErrorField = document.querySelector<HTMLElement>(
        `[data-field="${field}"]`,
      );
      if (firstErrorField) {
        firstErrorField.focus();
      }
      return;
    }
    await handleSubmit();
  }, [values, handleSubmit]);

  const isSubmitting = submitState === 'submitting';

  return (
    <PageShell
      title="创建供应商"
      subtitle="填写供应商信息，提交后进入审核流程"
      breadcrumb={
        <WorkspaceBreadcrumb
          workspaceLabel="供应商管理"
          workspaceHref="/suppliers"
          detailLabel="创建供应商"
        />
      }
    >
      <div style={{ maxWidth: 720, margin: '0 auto' }}>
        {/* 成功反馈 */}
        {submitState === 'success' && (
          <FormSubmitFeedback
            success="供应商已提交 — 供应商信息已成功提交，等待审核。"
            onDismissSuccess={resetSubmit}
          />
        )}

        {/* 失败反馈 */}
        {submitState === 'error' && (
          <FormSubmitFeedback
            error="提交失败"
            onRetry={onSubmit}
            onDismissError={resetSubmit}
          />
        )}

        {/* 表单主体 */}
        {submitState !== 'success' && (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              onSubmit();
            }}
            style={{ display: 'flex', flexDirection: 'column', gap: 24 }}
          >
            {/* 基本信息 */}
            <section>
              <h3 style={{ fontSize: 16, fontWeight: 600, color: '#e2e8f0', marginBottom: 16 }}>
                基本信息
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div data-field="name">
                  <FormField label="供应商名称 *" error={getFieldError('name')}>
                    <input
                      type="text"
                      value={values.name}
                      onChange={setValue('name')}
                      placeholder="例：绿源食品有限公司"
                      disabled={isSubmitting}
                      style={inputStyle(getFieldError('name'))}
                    />
                  </FormField>
                </div>
                <div data-field="code">
                  <FormField label="供应商编码 *" error={getFieldError('code')}>
                    <input
                      type="text"
                      value={values.code}
                      onChange={setValue('code')}
                      placeholder="例：SUP-XXX"
                      disabled={isSubmitting}
                      style={inputStyle(getFieldError('code'))}
                    />
                  </FormField>
                </div>
                <div data-field="category">
                  <FormField label="品类 *">
                    <select
                      value={values.category}
                      onChange={setValue('category')}
                      disabled={isSubmitting}
                      style={{ ...inputStyle(), minHeight: 40 }}
                    >
                      {SUPPLIER_CATEGORY_OPTIONS.map((o) => (
                        <option key={o.value} value={o.value}>{o.label}</option>
                      ))}
                    </select>
                  </FormField>
                </div>
                <div data-field="status">
                  <FormField label="状态 *">
                    <select
                      value={values.status}
                      onChange={setValue('status')}
                      disabled={isSubmitting}
                      style={{ ...inputStyle(), minHeight: 40 }}
                    >
                      {SUPPLIER_STATUS_OPTIONS.map((o) => (
                        <option key={o.value} value={o.value}>{o.label}</option>
                      ))}
                    </select>
                  </FormField>
                </div>
              </div>
            </section>

            {/* 联系信息 */}
            <section>
              <h3 style={{ fontSize: 16, fontWeight: 600, color: '#e2e8f0', marginBottom: 16 }}>
                联系信息
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div data-field="contactPerson">
                  <FormField label="联系人 *" error={getFieldError('contactPerson')}>
                    <input
                      type="text"
                      value={values.contactPerson}
                      onChange={setValue('contactPerson')}
                      placeholder="例：王建国"
                      disabled={isSubmitting}
                      style={inputStyle(getFieldError('contactPerson'))}
                    />
                  </FormField>
                </div>
                <div data-field="contactPhone">
                  <FormField label="联系电话 *" error={getFieldError('contactPhone')}>
                    <input
                      type="text"
                      value={values.contactPhone}
                      onChange={setValue('contactPhone')}
                      placeholder="例：13800010001"
                      disabled={isSubmitting}
                      style={inputStyle(getFieldError('contactPhone'))}
                    />
                  </FormField>
                </div>
                <div data-field="email" style={{ gridColumn: '1 / -1' }}>
                  <FormField label="邮箱 *" error={getFieldError('email')}>
                    <input
                      type="email"
                      value={values.email}
                      onChange={setValue('email')}
                      placeholder="例：contact@company.com"
                      disabled={isSubmitting}
                      style={inputStyle(getFieldError('email'))}
                    />
                  </FormField>
                </div>
              </div>
            </section>

            {/* 其他信息 */}
            <section>
              <h3 style={{ fontSize: 16, fontWeight: 600, color: '#e2e8f0', marginBottom: 16 }}>
                其他信息
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div data-field="creditRating">
                  <FormField label="信用评级">
                    <select
                      value={values.creditRating}
                      onChange={setValue('creditRating')}
                      disabled={isSubmitting}
                      style={{ ...inputStyle(), minHeight: 40 }}
                    >
                      <option value="AAA">AAA</option>
                      <option value="AA">AA</option>
                      <option value="A">A</option>
                      <option value="B">B</option>
                      <option value="C">C</option>
                    </select>
                  </FormField>
                </div>
                <div /> {/* 空占位 */}
                <div data-field="address" style={{ gridColumn: '1 / -1' }}>
                  <FormField label="地址 *" error={getFieldError('address')}>
                    <textarea
                      value={values.address}
                      onChange={setValue('address')}
                      placeholder="例：北京市大兴区生物医药基地"
                      disabled={isSubmitting}
                      rows={3}
                      style={{ ...inputStyle(getFieldError('address')), resize: 'vertical', fontFamily: 'inherit' }}
                    />
                  </FormField>
                </div>
              </div>
            </section>

            {/* 提交按钮 */}
            <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', paddingTop: 8, borderTop: '1px solid #334155' }}>
              <SubmitButton
                variant="secondary"
                onClick={() => window.history.back()}
                disabled={isSubmitting}
              >
                取消
              </SubmitButton>
              <SubmitButton
                variant="primary"
                loading={isSubmitting}
                type="submit"
              >
                {isSubmitting ? '提交中…' : '提交审核'}
              </SubmitButton>
            </div>
          </form>
        )}
      </div>
    </PageShell>
  );
}

// ---- 样式助手 ----

function inputStyle(error?: string): React.CSSProperties {
  return {
    width: '100%',
    padding: '8px 12px',
    fontSize: 14,
    color: '#e2e8f0',
    background: '#1e293b',
    border: `1px solid ${error ? '#ef4444' : '#334155'}`,
    borderRadius: 6,
    outline: 'none',
    boxSizing: 'border-box',
  };
}
