/**
 * 设备新增表单页 — Device Add Form Page (Next.js App Router Page)
 * 功能: 新建设备，含设备名称/类型/IP/门店/固件版本/序列号
 * 角色视角: 👤运维管理员
 */
'use client';

import React, { useState, useCallback } from 'react';

import {
  FormField,
  FormSubmitFeedback,
  PageShell,
  SubmitButton,
  WorkspaceBreadcrumb,
} from '@m5/ui';

import type { DeviceType } from '../device-types';

// ---- 类型 ----

interface DeviceFormValues {
  name: string;
  type: DeviceType | '';
  ip: string;
  storeId: string;
  firmwareVersion: string;
  serialNumber: string;
  remark: string;
}

interface FieldError {
  field: keyof DeviceFormValues;
  message: string;
}

const DEFAULT_VALUES: DeviceFormValues = {
  name: '',
  type: '',
  ip: '',
  storeId: '',
  firmwareVersion: '',
  serialNumber: '',
  remark: '',
};

// ---- 常量映射 ----

const DEVICE_TYPE_LABELS: Record<DeviceType, string> = {
  POS: '收银机',
  printer: '打印机',
  scanner: '扫描枪',
  tablet: '平板',
  kiosk: '自助机',
  scale: '电子秤',
};

const DEVICE_TYPES: DeviceType[] = ['POS', 'printer', 'scanner', 'tablet', 'kiosk', 'scale'];

// ---- 模拟门店选项 ----

const STORE_OPTIONS = [
  { value: 'S001', label: '旗舰店-解放路' },
  { value: 'S002', label: '门店-科技路' },
  { value: 'S003', label: '门店-西湖路' },
  { value: 'S004', label: '旗舰店-天河路' },
];

// ---- 验证 ----

export const IP_REGEX = /^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/;

function isValidIP(ip: string): boolean {
  if (!IP_REGEX.test(ip)) return false;
  return ip.split('.').every((octet) => {
    const n = parseInt(octet, 10);
    return n >= 0 && n <= 255;
  });
}
const SKU_REGEX = /^[A-Z0-9-]+$/;

export function validateDeviceForm(values: DeviceFormValues): FieldError[] {
  const errors: FieldError[] = [];

  if (!values.name.trim()) {
    errors.push({ field: 'name', message: '请填写设备名称' });
  } else if (values.name.trim().length < 2) {
    errors.push({ field: 'name', message: '设备名称至少 2 个字符' });
  } else if (values.name.trim().length > 50) {
    errors.push({ field: 'name', message: '设备名称不能超过 50 个字符' });
  }

  if (!values.type) {
    errors.push({ field: 'type', message: '请选择设备类型' });
  }

  if (!values.ip.trim()) {
    errors.push({ field: 'ip', message: '请填写 IP 地址' });
  } else if (!isValidIP(values.ip.trim())) {
    errors.push({ field: 'ip', message: 'IP 地址格式不正确' });
  }

  if (!values.storeId.trim()) {
    errors.push({ field: 'storeId', message: '请选择所属门店' });
  }

  if (values.firmwareVersion.trim() && values.firmwareVersion.trim().length > 20) {
    errors.push({ field: 'firmwareVersion', message: '固件版本不能超过 20 个字符' });
  }

  if (!values.serialNumber.trim()) {
    errors.push({ field: 'serialNumber', message: '请填写序列号' });
  } else if (!SKU_REGEX.test(values.serialNumber.trim())) {
    errors.push({ field: 'serialNumber', message: '序列号须为大写字母、数字和连字符' });
  }

  return errors;
}

// ---- 页面 ----

export default function DeviceFormPage() {
  const [values, setValues] = useState<DeviceFormValues>(DEFAULT_VALUES);
  const [fieldErrors, setFieldErrors] = useState<FieldError[]>([]);
  const [submitState, setSubmitState] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');

  const getFieldError = useCallback(
    (field: keyof DeviceFormValues): string | undefined =>
      fieldErrors.find((e) => e.field === field)?.message,
    [fieldErrors],
  );

  const setValue = useCallback(
    (field: keyof DeviceFormValues) =>
      (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        setValues((prev) => ({ ...prev, [field]: e.target.value }));
        setFieldErrors((prev) => prev.filter((e) => e.field !== field));
      },
    [],
  );

  const isSubmitting = submitState === 'submitting';

  const onSubmit = useCallback(async () => {
    const errors = validateDeviceForm(values);
    setFieldErrors(errors);
    if (errors.length > 0) return;
    if (isSubmitting) return;
    setSubmitState('submitting');
    try {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      setSubmitState('success');
    } catch {
      setSubmitState('error');
    }
  }, [values, isSubmitting]);

  const resetSubmit = useCallback(() => setSubmitState('idle'), []);

  return (
    <PageShell
      title="新建设备"
      subtitle="添加新设备到门店 — 填写设备信息后提交审核"
      breadcrumb={
        <WorkspaceBreadcrumb
          workspaceLabel="设备管理"
          workspaceHref="/devices"
          detailLabel="新建设备"
        />
      }
    >
      <div style={{ maxWidth: 720, margin: '0 auto' }}>
        {submitState === 'success' && (
          <FormSubmitFeedback success="设备已提交 — 等待运维审核。" onDismissSuccess={resetSubmit} />
        )}
        {submitState === 'error' && (
          <FormSubmitFeedback error="提交失败，请重试" onRetry={onSubmit} onDismissError={resetSubmit} />
        )}

        {submitState !== 'success' && (
          <form
            onSubmit={(e) => { e.preventDefault(); onSubmit(); }}
            style={{ display: 'flex', flexDirection: 'column', gap: 24 }}
          >
            {/* 基本信息 */}
            <section>
              <h3 style={{ fontSize: 16, fontWeight: 600, color: '#e2e8f0', marginBottom: 16 }}>
                基本信息
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div data-field="name">
                  <FormField label="设备名称 *" error={getFieldError('name')}>
                    <input
                      type="text"
                      value={values.name}
                      onChange={setValue('name')}
                      placeholder="例：POS-主收银-A01"
                      disabled={isSubmitting}
                      style={inputStyle(getFieldError('name'))}
                    />
                  </FormField>
                </div>
                <div data-field="type">
                  <FormField label="设备类型 *" error={getFieldError('type')}>
                    <select
                      value={values.type}
                      onChange={setValue('type')}
                      disabled={isSubmitting}
                      style={inputStyle(getFieldError('type'))}
                    >
                      <option value="">请选择</option>
                      {DEVICE_TYPES.map((t) => (
                        <option key={t} value={t}>{DEVICE_TYPE_LABELS[t]}</option>
                      ))}
                    </select>
                  </FormField>
                </div>
                <div data-field="ip">
                  <FormField label="IP 地址 *" error={getFieldError('ip')}>
                    <input
                      type="text"
                      value={values.ip}
                      onChange={setValue('ip')}
                      placeholder="例：192.168.1.101"
                      disabled={isSubmitting}
                      style={inputStyle(getFieldError('ip'))}
                    />
                  </FormField>
                </div>
                <div data-field="storeId">
                  <FormField label="所属门店 *" error={getFieldError('storeId')}>
                    <select
                      value={values.storeId}
                      onChange={setValue('storeId')}
                      disabled={isSubmitting}
                      style={inputStyle(getFieldError('storeId'))}
                    >
                      <option value="">请选择</option>
                      {STORE_OPTIONS.map((s) => (
                        <option key={s.value} value={s.value}>{s.label}</option>
                      ))}
                    </select>
                  </FormField>
                </div>
                <div data-field="serialNumber">
                  <FormField label="序列号 *" error={getFieldError('serialNumber')}>
                    <input
                      type="text"
                      value={values.serialNumber}
                      onChange={setValue('serialNumber')}
                      placeholder="例：POS-XJ-2025001"
                      disabled={isSubmitting}
                      style={inputStyle(getFieldError('serialNumber'))}
                    />
                  </FormField>
                </div>
                <div data-field="firmwareVersion">
                  <FormField label="固件版本" error={getFieldError('firmwareVersion')}>
                    <input
                      type="text"
                      value={values.firmwareVersion}
                      onChange={setValue('firmwareVersion')}
                      placeholder="例：v3.2.1"
                      disabled={isSubmitting}
                      style={inputStyle(getFieldError('firmwareVersion'))}
                    />
                  </FormField>
                </div>
              </div>
            </section>

            {/* 备注 */}
            <section>
              <div data-field="remark">
                <FormField label="备注">
                  <textarea
                    value={values.remark}
                    onChange={setValue('remark')}
                    placeholder="设备位置、用途说明等"
                    disabled={isSubmitting}
                    rows={3}
                    style={{ ...inputStyle(), resize: 'vertical', fontFamily: 'inherit' }}
                  />
                </FormField>
              </div>
            </section>

            {/* 按钮 */}
            <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', paddingTop: 8, borderTop: '1px solid #334155' }}>
              <SubmitButton variant="secondary" onClick={() => window.history.back()} disabled={isSubmitting}>
                取消
              </SubmitButton>
              <SubmitButton variant="primary" loading={isSubmitting} type="submit">
                {isSubmitting ? '提交中…' : '提交设备'}
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
    border: error ? '1px solid #ef4444' : '1px solid #334155',
    borderRadius: 6,
    outline: 'none',
    boxSizing: 'border-box',
    minHeight: 40,
  };
}
