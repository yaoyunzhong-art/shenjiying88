/**
 * 门店编辑表单页 — Store Edit Form Page (Next.js App Router Page)
 * 功能: 编辑门店信息，含字段验证、提交、错误处理
 * 角色视角: 👤运营管理员 / 📊市场管理
 */
'use client';

import React, { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';

import {
  FormField,
  FormSubmitFeedback,
  PageShell,
  SubmitButton,
  StatusBadge,
  WorkspaceBreadcrumb,
} from '@m5/ui';

// ---- 常量 ----

const MARKET_OPTIONS = [
  { value: 'cn-mainland', label: '中国大陆 (cn-mainland)' },
  { value: 'us-default', label: '美国 (us-default)' },
  { value: 'uk-default', label: '英国 (uk-default)' },
  { value: 'jp-default', label: '日本 (jp-default)' },
  { value: 'sea-default', label: '东南亚 (sea-default)' },
] as const;

const STATUS_OPTIONS = [
  { value: 'active', label: '运营中' },
  { value: 'pending', label: '待激活' },
  { value: 'inactive', label: '已停用' },
  { value: 'suspended', label: '已暂停' },
] as const;

const RISK_LEVEL_OPTIONS = [
  { value: 'low', label: '低风险' },
  { value: 'medium', label: '中风险' },
  { value: 'high', label: '高风险' },
] as const;

const CITY_OPTIONS = [
  { value: '北京市', label: '北京市' },
  { value: '上海市', label: '上海市' },
  { value: '广州市', label: '广州市' },
  { value: '深圳市', label: '深圳市' },
  { value: '杭州市', label: '杭州市' },
  { value: '南京市', label: '南京市' },
  { value: '成都市', label: '成都市' },
  { value: '武汉市', label: '武汉市' },
  { value: '重庆市', label: '重庆市' },
  { value: '西安市', label: '西安市' },
  { value: '苏州市', label: '苏州市' },
  { value: 'San Francisco', label: 'San Francisco' },
  { value: 'New York', label: 'New York' },
  { value: 'London', label: 'London' },
] as const;

// ---- 表单字段定义 ----

interface StoreFormValues {
  name: string;
  code: string;
  marketCode: string;
  city: string;
  address: string;
  contactPhone: string;
  contactEmail: string;
  floorArea: string;
  status: string;
  riskLevel: string;
  brandCount: string;
  description: string;
  notes: string;
}

const DEFAULT_VALUES: StoreFormValues = {
  name: '',
  code: '',
  marketCode: 'cn-mainland',
  city: '北京市',
  address: '',
  contactPhone: '',
  contactEmail: '',
  floorArea: '',
  status: 'pending',
  riskLevel: 'low',
  brandCount: '',
  description: '',
  notes: '',
};

interface FieldError {
  field: keyof StoreFormValues;
  message: string;
}

// ---- 验证逻辑 ----

function validateForm(values: StoreFormValues): FieldError[] {
  const errors: FieldError[] = [];

  if (!values.name.trim()) {
    errors.push({ field: 'name', message: '门店名称不能为空' });
  } else if (values.name.trim().length < 2) {
    errors.push({ field: 'name', message: '门店名称至少 2 个字符' });
  } else if (values.name.trim().length > 50) {
    errors.push({ field: 'name', message: '门店名称不能超过 50 个字符' });
  }

  if (!values.code.trim()) {
    errors.push({ field: 'code', message: '门店编码不能为空' });
  } else if (!/^STORE-\d{3,6}$/.test(values.code.trim())) {
    errors.push({ field: 'code', message: '编码格式需为 STORE-XXX（3~6 位数字）' });
  }

  if (!values.address.trim()) {
    errors.push({ field: 'address', message: '门店地址不能为空' });
  } else if (values.address.trim().length < 5) {
    errors.push({ field: 'address', message: '地址至少 5 个字符' });
  }

  if (!values.contactPhone.trim()) {
    errors.push({ field: 'contactPhone', message: '联系电话不能为空' });
  } else if (!/^\+?\d{7,15}$/.test(values.contactPhone.replace(/[\s-]/g, ''))) {
    errors.push({ field: 'contactPhone', message: '请输入有效的联系电话（7~15 位数字）' });
  }

  if (values.contactEmail.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.contactEmail.trim())) {
    errors.push({ field: 'contactEmail', message: '请输入有效的邮箱地址' });
  }

  if (values.floorArea.trim()) {
    if (!/^\d+$/.test(values.floorArea.trim())) {
      errors.push({ field: 'floorArea', message: '建筑面积必须为数字' });
    } else if (Number(values.floorArea) > 100000) {
      errors.push({ field: 'floorArea', message: '建筑面积不超过 100,000 m²' });
    }
  }

  if (values.brandCount.trim() && !/^\d+$/.test(values.brandCount.trim())) {
    errors.push({ field: 'brandCount', message: '品牌数量必须为数字' });
  }

  if (values.description.trim().length > 500) {
    errors.push({ field: 'description', message: '门店简介不超过 500 个字符' });
  }

  return errors;
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

// ---- 表单页面组件 ----

export default function StoreEditFormPage() {
  const router = useRouter();
  const [values, setValues] = useState<StoreFormValues>(DEFAULT_VALUES);
  const [fieldErrors, setFieldErrors] = useState<FieldError[]>([]);
  const [submitState, setSubmitState] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');

  const getFieldError = useCallback(
    (field: keyof StoreFormValues): string | undefined =>
      fieldErrors.find((e) => e.field === field)?.message,
    [fieldErrors],
  );

  const handleSubmit = useCallback(async () => {
    if (submitState === 'submitting') return;
    setSubmitState('submitting');
    try {
      await new Promise((resolve) => setTimeout(resolve, 1200));
      // Mock duplicate code check
      if (values.code === 'STORE-999') {
        throw new Error('门店编码 STORE-999 已被占用，请使用其他编码');
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
    (field: keyof StoreFormValues) =>
      (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        setValues((prev) => ({ ...prev, [field]: e.target.value }));
        setFieldErrors((prev) => prev.filter((err) => err.field !== field));
      },
    [],
  );

  const onSubmit = useCallback(async () => {
    const errors = validateForm(values);
    setFieldErrors(errors);
    if (errors.length > 0) {
      const firstErrorField = document.querySelector<HTMLElement>(
        `[data-field="${errors[0]!.field}"]`,
      );
      if (firstErrorField) firstErrorField.focus();
      return;
    }
    await handleSubmit();
  }, [values, handleSubmit]);

  const handleSuccessRedirect = useCallback(() => {
    router.push('/stores');
  }, [router]);

  const isSubmitting = submitState === 'submitting';

  return (
    <PageShell
      title="编辑门店"
      subtitle="修改门店基本信息、运营配置与风险等级"
      breadcrumb={
        <WorkspaceBreadcrumb
          workspaceLabel="门店管理"
          workspaceHref="/stores"
          detailLabel="编辑门店"
        />
      }
    >
      <div style={{ maxWidth: 720, margin: '0 auto' }}>
        {/* 成功反馈 */}
        {submitState === 'success' && (
          <FormSubmitFeedback
            success="门店信息已更新 — 所有修改已成功保存。"
            onDismissSuccess={resetSubmit}
          >
            <div style={{ marginTop: 12, display: 'flex', gap: 8 }}>
              <SubmitButton variant="primary" onClick={handleSuccessRedirect}>
                返回门店列表
              </SubmitButton>
            </div>
          </FormSubmitFeedback>
        )}

        {/* 失败反馈 */}
        {submitState === 'error' && (
          <FormSubmitFeedback
            error="保存失败"
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
                  <FormField label="门店名称 *" error={getFieldError('name')}>
                    <input
                      type="text"
                      value={values.name}
                      onChange={setValue('name')}
                      placeholder="例：朝阳大悦城旗舰店"
                      disabled={isSubmitting}
                      style={inputStyle(getFieldError('name'))}
                    />
                  </FormField>
                </div>
                <div data-field="code">
                  <FormField label="门店编码 *" error={getFieldError('code')} helper="创建后不可修改">
                    <input
                      type="text"
                      value={values.code}
                      onChange={setValue('code')}
                      placeholder="例：STORE-016"
                      disabled={isSubmitting}
                      style={inputStyle(getFieldError('code'))}
                    />
                  </FormField>
                </div>
                <div data-field="marketCode">
                  <FormField label="所属市场 *">
                    <select
                      value={values.marketCode}
                      onChange={setValue('marketCode')}
                      disabled={isSubmitting}
                      style={{ ...inputStyle(), minHeight: 40 }}
                    >
                      {MARKET_OPTIONS.map((o) => (
                        <option key={o.value} value={o.value}>{o.label}</option>
                      ))}
                    </select>
                  </FormField>
                </div>
                <div data-field="city">
                  <FormField label="所在城市 *">
                    <select
                      value={values.city}
                      onChange={setValue('city')}
                      disabled={isSubmitting}
                      style={{ ...inputStyle(), minHeight: 40 }}
                    >
                      {CITY_OPTIONS.map((o) => (
                        <option key={o.value} value={o.value}>{o.label}</option>
                      ))}
                    </select>
                  </FormField>
                </div>
              </div>
            </section>

            {/* 联系方式 */}
            <section>
              <h3 style={{ fontSize: 16, fontWeight: 600, color: '#e2e8f0', marginBottom: 16 }}>
                联系方式
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div data-field="contactPhone" style={{ gridColumn: '1 / -1' }}>
                  <FormField label="联系电话 *" error={getFieldError('contactPhone')}>
                    <input
                      type="text"
                      value={values.contactPhone}
                      onChange={setValue('contactPhone')}
                      placeholder="例：+86-10-8888-1111"
                      disabled={isSubmitting}
                      style={inputStyle(getFieldError('contactPhone'))}
                    />
                  </FormField>
                </div>
                <div data-field="contactEmail" style={{ gridColumn: '1 / -1' }}>
                  <FormField label="联系邮箱" error={getFieldError('contactEmail')}>
                    <input
                      type="email"
                      value={values.contactEmail}
                      onChange={setValue('contactEmail')}
                      placeholder="例：store@example.com"
                      disabled={isSubmitting}
                      style={inputStyle(getFieldError('contactEmail'))}
                    />
                  </FormField>
                </div>
                <div data-field="address" style={{ gridColumn: '1 / -1' }}>
                  <FormField label="门店地址 *" error={getFieldError('address')}>
                    <textarea
                      value={values.address}
                      onChange={setValue('address')}
                      placeholder="例：北京市朝阳区朝阳北路101号"
                      disabled={isSubmitting}
                      rows={2}
                      style={{ ...inputStyle(getFieldError('address')), resize: 'vertical', fontFamily: 'inherit' }}
                    />
                  </FormField>
                </div>
              </div>
            </section>

            {/* 运营配置 */}
            <section>
              <h3 style={{ fontSize: 16, fontWeight: 600, color: '#e2e8f0', marginBottom: 16 }}>
                运营配置
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div data-field="status">
                  <FormField label="状态 *">
                    <select
                      value={values.status}
                      onChange={setValue('status')}
                      disabled={isSubmitting}
                      style={{ ...inputStyle(), minHeight: 40 }}
                    >
                      {STATUS_OPTIONS.map((o) => (
                        <option key={o.value} value={o.value}>{o.label}</option>
                      ))}
                    </select>
                  </FormField>
                </div>
                <div data-field="riskLevel">
                  <FormField label="风险等级 *">
                    <select
                      value={values.riskLevel}
                      onChange={setValue('riskLevel')}
                      disabled={isSubmitting}
                      style={{ ...inputStyle(), minHeight: 40 }}
                    >
                      {RISK_LEVEL_OPTIONS.map((o) => (
                        <option key={o.value} value={o.value}>{o.label}</option>
                      ))}
                    </select>
                  </FormField>
                </div>
                <div data-field="floorArea">
                  <FormField label="建筑面积 (m²)" error={getFieldError('floorArea')}>
                    <input
                      type="text"
                      value={values.floorArea}
                      onChange={setValue('floorArea')}
                      placeholder="例：8500"
                      disabled={isSubmitting}
                      style={inputStyle(getFieldError('floorArea'))}
                    />
                  </FormField>
                </div>
                <div data-field="brandCount">
                  <FormField label="入驻品牌数量" error={getFieldError('brandCount')}>
                    <input
                      type="text"
                      value={values.brandCount}
                      onChange={setValue('brandCount')}
                      placeholder="例：5"
                      disabled={isSubmitting}
                      style={inputStyle(getFieldError('brandCount'))}
                    />
                  </FormField>
                </div>
              </div>
            </section>

            {/* 附加信息 */}
            <section>
              <h3 style={{ fontSize: 16, fontWeight: 600, color: '#e2e8f0', marginBottom: 16 }}>
                附加信息
              </h3>
              <div data-field="description" style={{ marginBottom: 16 }}>
                <FormField label="门店简介" error={getFieldError('description')} helper="最多 500 个字符">
                  <textarea
                    value={values.description}
                    onChange={setValue('description')}
                    placeholder="简要描述门店定位、商圈环境和特色…"
                    disabled={isSubmitting}
                    rows={3}
                    style={{ ...inputStyle(getFieldError('description')), resize: 'vertical', fontFamily: 'inherit' }}
                  />
                </FormField>
              </div>
              <div data-field="notes">
                <FormField label="备注">
                  <textarea
                    value={values.notes}
                    onChange={setValue('notes')}
                    placeholder="其他需要记录的信息…"
                    disabled={isSubmitting}
                    rows={2}
                    style={{ ...inputStyle(), resize: 'vertical', fontFamily: 'inherit' }}
                  />
                </FormField>
              </div>
            </section>

            {/* 提交按钮 */}
            <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', paddingTop: 8, borderTop: '1px solid #334155' }}>
              <SubmitButton
                variant="secondary"
                onClick={() => router.push('/stores')}
                disabled={isSubmitting}
              >
                取消
              </SubmitButton>
              <SubmitButton
                variant="primary"
                loading={isSubmitting}
                type="submit"
              >
                {isSubmitting ? '保存中…' : '保存修改'}
              </SubmitButton>
            </div>
          </form>
        )}
      </div>
    </PageShell>
  );
}
