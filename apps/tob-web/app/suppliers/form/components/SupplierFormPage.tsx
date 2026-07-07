/**
 * SupplierFormPage.tsx — 供应商表单 (新增/编辑)
 * 角色视角: 👔品牌运营 / 💳采购经理
 * 功能: 表单验证、提交、错误处理、成功反馈
 */
'use client';

import React, { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  Input,
  Select,
  FormField,
  FormSubmitFeedback,
  Button,
  TextArea,
  TagInput,
} from '@m5/ui';

/* ── 类型 ── */

export interface SupplierFormValues {
  name: string;
  contactPerson: string;
  phone: string;
  email: string;
  category: string;
  address: string;
  tags: string[];
  remark: string;
}

export interface SupplierFormErrors {
  name?: string;
  contactPerson?: string;
  phone?: string;
  email?: string;
  category?: string;
  address?: string;
}

export interface SupplierFormPageProps {
  /** 编辑模式下传入初始值 */
  initialValues?: Partial<SupplierFormValues>;
  /** 供应商 ID (编辑模式) */
  supplierId?: string;
  /** 是否编辑模式 */
  isEdit?: boolean;
}

/* ── 分类选项 ── */
const CATEGORY_OPTIONS = [
  { value: 'raw_material', label: '原材料' },
  { value: 'packaging', label: '包材' },
  { value: 'finished_product', label: '成品' },
  { value: 'equipment', label: '设备' },
  { value: 'logistics', label: '物流服务' },
  { value: 'marketing', label: '营销物料' },
];

/* ── 验证 ── */

function validateForm(values: SupplierFormValues): SupplierFormErrors {
  const errors: SupplierFormErrors = {};

  if (!values.name.trim()) {
    errors.name = '请输入供应商名称';
  } else if (values.name.trim().length < 2) {
    errors.name = '供应商名称至少 2 个字符';
  }

  if (!values.contactPerson.trim()) {
    errors.contactPerson = '请输入联系人';
  }

  if (!values.phone.trim()) {
    errors.phone = '请输入联系电话';
  } else if (!/^1[3-9]\d{9}$/.test(values.phone.trim())) {
    errors.phone = '请输入正确的手机号码';
  }

  if (values.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email.trim())) {
    errors.email = '邮箱格式不正确';
  }

  if (!values.category) {
    errors.category = '请选择供应商类别';
  }

  if (!values.address.trim()) {
    errors.address = '请输入地址';
  }

  return errors;
}

/* ── 组件 ── */

export function SupplierFormPage({
  initialValues,
  supplierId,
  isEdit = false,
}: SupplierFormPageProps) {
  const router = useRouter();

  const [values, setValues] = useState<SupplierFormValues>({
    name: initialValues?.name ?? '',
    contactPerson: initialValues?.contactPerson ?? '',
    phone: initialValues?.phone ?? '',
    email: initialValues?.email ?? '',
    category: initialValues?.category ?? '',
    address: initialValues?.address ?? '',
    tags: initialValues?.tags ?? [],
    remark: initialValues?.remark ?? '',
  });

  const [errors, setErrors] = useState<SupplierFormErrors>({});
  const [submitState, setSubmitState] = useState<{
    isSubmitting: boolean;
    errorMessage?: string;
    successMessage?: string;
  }>({ isSubmitting: false });

  /* ── 输入变更帮助函数 ── */
  const handleChange = useCallback(
    (field: keyof SupplierFormValues) =>
      (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement> | string) => {
        const value = typeof e === 'string' ? e : e.target.value;
        setValues((prev) => ({ ...prev, [field]: value }));
        // 清除字段错误
        setErrors((prev) => ({ ...prev, [field]: undefined }));
      },
    [],
  );

  const handleTagsChange = useCallback((tags: string[]) => {
    setValues((prev) => ({ ...prev, tags }));
  }, []);

  /* ── 提交 ── */
  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();

      // 1. 验证
      const validationErrors = validateForm(values);
      setErrors(validationErrors);
      if (Object.keys(validationErrors).length > 0) {
        return;
      }

      // 2. 提交
      setSubmitState({ isSubmitting: true });

      try {
        // 模拟 API 调用
        await new Promise((resolve, reject) => {
          setTimeout(() => {
            // 模拟 10% 失败率
            if (Math.random() < 0.1) {
              reject(new Error('网络异常，请稍后重试'));
            } else {
              resolve(undefined);
            }
          }, 1200);
        });

        setSubmitState({
          isSubmitting: false,
          successMessage: isEdit
            ? `供应商「${values.name}」更新成功！`
            : `供应商「${values.name}」创建成功！`,
        });

        // 2 秒后跳转回列表
        setTimeout(() => router.push('/suppliers'), 2000);
      } catch (err) {
        setSubmitState({
          isSubmitting: false,
          errorMessage:
            err instanceof Error ? err.message : '提交失败，请稍后重试',
        });
      }
    },
    [values, isEdit, router],
  );

  /* ── 重试 ── */
  const handleRetry = useCallback(() => {
    setSubmitState({ isSubmitting: false, errorMessage: undefined });
  }, []);

  /* ── 关闭错误 ── */
  const handleDismissError = useCallback(() => {
    setSubmitState((prev) => ({ ...prev, errorMessage: undefined }));
  }, []);

  return (
    <div style={{ maxWidth: 720, margin: '0 auto', padding: '32px 24px' }}>
      {/* 标题区域 */}
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: '#f1f5f9', margin: 0 }}>
          {isEdit ? `编辑供应商` : '新增供应商'}
        </h1>
        <p style={{ color: '#94a3b8', fontSize: 14, marginTop: 6 }}>
          {isEdit
            ? `修改供应商「${initialValues?.name ?? ''}」的基本信息`
            : '填写以下信息创建新的供应商档案'}
        </p>
      </div>

      {/* 提交反馈 */}
      <FormSubmitFeedback
        submitting={submitState.isSubmitting}
        error={submitState.errorMessage}
        success={submitState.successMessage}
        onRetry={handleRetry}
        onDismissError={handleDismissError}
      />

      {/* 表单 */}
      {!submitState.successMessage && (
        <form onSubmit={handleSubmit} noValidate>
          <div
            style={{
              background: '#1e293b',
              borderRadius: 16,
              padding: 28,
              border: '1px solid #334155',
              display: 'flex',
              flexDirection: 'column',
              gap: 20,
            }}
          >
            {/* 基本信息区域标题 */}
            <div style={{ fontSize: 15, fontWeight: 600, color: '#e2e8f0', paddingBottom: 8, borderBottom: '1px solid #334155' }}>
              基本信息
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '16px 24px',
              }}
            >
              <FormField label="供应商名称" required error={errors.name}>
                <Input
                  value={values.name}
                  onChange={handleChange('name')}
                  placeholder="例: 广州美妆供应链有限公司"
                  error={errors.name}
                />
              </FormField>

              <FormField label="供应商类别" required error={errors.category}>
                <Select
                  value={values.category}
                  onChange={(val) => {
                    setValues((prev) => ({ ...prev, category: val }));
                    setErrors((prev) => ({ ...prev, category: undefined }));
                  }}
                  options={CATEGORY_OPTIONS}
                  placeholder="请选择分类"
                />
              </FormField>

              <FormField label="联系人" required error={errors.contactPerson}>
                <Input
                  value={values.contactPerson}
                  onChange={handleChange('contactPerson')}
                  placeholder="姓名"
                  error={errors.contactPerson}
                />
              </FormField>

              <FormField label="联系电话" required error={errors.phone}>
                <Input
                  value={values.phone}
                  onChange={handleChange('phone')}
                  placeholder="手机号码"
                  maxLength={11}
                  error={errors.phone}
                />
              </FormField>

              <FormField label="邮箱" error={errors.email}>
                <Input
                  value={values.email}
                  onChange={handleChange('email')}
                  placeholder="example@company.com"
                  type="email"
                  error={errors.email}
                />
              </FormField>

              <FormField label="地址" required error={errors.address}>
                <Input
                  value={values.address}
                  onChange={handleChange('address')}
                  placeholder="详细地址"
                  error={errors.address}
                />
              </FormField>
            </div>

            {/* 补充信息 */}
            <div style={{ fontSize: 15, fontWeight: 600, color: '#e2e8f0', paddingBottom: 8, borderBottom: '1px solid #334155', marginTop: 8 }}>
              补充信息
            </div>

            <FormField label="标签">
              <TagInput
                value={values.tags}
                onChange={handleTagsChange}
                placeholder="输入标签后回车"
              />
            </FormField>

            <FormField label="备注">
              <TextArea
                value={values.remark}
                onChange={handleChange('remark')}
                placeholder="其他需要说明的信息…"
                rows={3}
              />
            </FormField>
          </div>

          {/* 操作按钮 */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'flex-end',
              gap: 12,
              marginTop: 24,
            }}
          >
            <Button
              variant="outline"
              type="button"
              onClick={() => router.push('/suppliers')}
            >
              取消
            </Button>
            <Button type="submit" loading={submitState.isSubmitting}>
              {isEdit ? '保存修改' : '创建供应商'}
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}
