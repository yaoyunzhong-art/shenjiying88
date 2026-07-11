'use client';

import React, { useState, useCallback } from 'react';

import {
  FormField,
  FormSubmitFeedback,
  SubmitButton,
} from '@m5/ui';

import type { MemberLevelConfig } from '../../members-data';

// ---- 表单数据类型 ----

export interface LevelFormData {
  key: string;
  name: string;
  minPoints: number;
  maxPoints: number;
  discountRate: number;
  annualFee: number;
  benefits: string;
  status: 'active' | 'inactive' | 'hidden';
  renewalCondition: string;
  upgradeCondition: string;
  downgradeCondition: string;
  notes: string;
}

export interface LevelFormErrors {
  key?: string;
  name?: string;
  minPoints?: string;
  maxPoints?: string;
  discountRate?: string;
  annualFee?: string;
}

const LEVEL_STATUS_OPTIONS = [
  { value: 'active', label: '启用' },
  { value: 'inactive', label: '停用' },
  { value: 'hidden', label: '仅内部可见' },
];

// ---- 默认表单数据 ----

export function createDefaultLevelFormData(): LevelFormData {
  return {
    key: '',
    name: '',
    minPoints: 0,
    maxPoints: 999,
    discountRate: 100,
    annualFee: 0,
    benefits: '',
    status: 'active',
    renewalCondition: '',
    upgradeCondition: '',
    downgradeCondition: '',
    notes: '',
  };
}

export function createLevelFormDataFromConfig(config: MemberLevelConfig): LevelFormData {
  return {
    key: config.key,
    name: config.name,
    minPoints: config.minPoints,
    maxPoints: config.maxPoints,
    discountRate: config.discountRate,
    annualFee: config.annualFee,
    benefits: config.benefits.join(', '),
    status: config.status,
    renewalCondition: `年度消费满 ¥${(config.minPoints * 20).toLocaleString()} 自动续费`,
    upgradeCondition: `累计积分达到 ${config.minPoints.toLocaleString()} 分`,
    downgradeCondition: `连续 6 个月消费不足 ¥${Math.max(config.minPoints * 10, 1000).toLocaleString()}`,
    notes: '',
  };
}

// ---- 验证 ----

export function validateLevelForm(data: LevelFormData): LevelFormErrors {
  const errors: LevelFormErrors = {};

  if (!data.key.trim()) {
    errors.key = '等级标识不能为空';
  } else if (!/^[a-z_]{2,20}$/.test(data.key.trim())) {
    errors.key = '标识格式：2-20位小写字母和下划线';
  }

  if (!data.name.trim()) {
    errors.name = '等级名称不能为空';
  } else if (data.name.trim().length > 20) {
    errors.name = '等级名称不能超过20个字符';
  }

  if (data.minPoints < 0) {
    errors.minPoints = '最低积分不能为负';
  }

  if (data.maxPoints < data.minPoints) {
    errors.maxPoints = '最高积分必须大于最低积分';
  }

  if (data.discountRate < 0 || data.discountRate > 100) {
    errors.discountRate = '折扣率范围为0-100';
  }

  if (data.annualFee < 0) {
    errors.annualFee = '年费不能为负数';
  }

  return errors;
}

// ---- 等级表单组件 ----

export function LevelDetailForm({
  initialData,
  onSubmit,
  isSubmitting,
  onCancel,
}: {
  initialData: LevelFormData;
  onSubmit: (data: LevelFormData) => Promise<void>;
  isSubmitting: boolean;
  onCancel: () => void;
}) {
  const [formData, setFormData] = useState<LevelFormData>(initialData);
  const [errors, setErrors] = useState<LevelFormErrors>({});
  const [submitFeedback, setSubmitFeedback] = useState<{
    isSubmitting: boolean;
    errorMessage?: string;
    successMessage?: string;
  }>({ isSubmitting: false });

  const getFieldError = (field: keyof LevelFormErrors): string | undefined => errors[field];

  const handleFieldChange = useCallback(
    (field: keyof LevelFormData, value: string | number) => {
      setFormData((prev) => ({ ...prev, [field]: value }));
      if (errors[field as keyof LevelFormErrors]) {
        setErrors((prev) => {
          const next = { ...prev };
          delete next[field as keyof LevelFormErrors];
          return next;
        });
      }
    },
    [errors]
  );

  const handleSubmit = useCallback(async () => {
    const validationErrors = validateLevelForm(formData);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setSubmitFeedback({ isSubmitting: true });
    try {
      await onSubmit(formData);
      setSubmitFeedback({ isSubmitting: false, successMessage: '等级配置已保存' });
    } catch (error) {
      setSubmitFeedback({
        isSubmitting: false,
        errorMessage: error instanceof Error ? error.message : '保存失败',
      });
    }
  }, [formData, onSubmit]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* 反馈 */}
      {submitFeedback.errorMessage || submitFeedback.successMessage ? (
        <FormSubmitFeedback state={submitFeedback} />
      ) : null}

      {/* 基础信息 */}
      <section>
        <h4 style={{ margin: '0 0 16px', fontSize: 14, fontWeight: 600, color: '#e2e8f0' }}>
          基础信息
        </h4>
        <div style={{ display: 'grid', gap: 16, gridTemplateColumns: '1fr 1fr' }}>
          <div data-field="key">
            <FormField label="等级标识" required error={getFieldError('key')} helper="唯一标识，不可重复">
              <input
                type="text"
                value={formData.key}
                onChange={(e) => handleFieldChange('key', e.target.value)}
                disabled={isSubmitting}
                style={inputStyle(!!errors.key)}
                placeholder="例如: diamond_vip"
              />
            </FormField>
          </div>
          <div data-field="name">
            <FormField label="等级名称" required error={getFieldError('name')}>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => handleFieldChange('name', e.target.value)}
                disabled={isSubmitting}
                style={inputStyle(!!errors.name)}
                placeholder="例如: 钻石会员"
              />
            </FormField>
          </div>
        </div>
      </section>

      {/* 积分区间 */}
      <section>
        <h4 style={{ margin: '0 0 16px', fontSize: 14, fontWeight: 600, color: '#e2e8f0' }}>
          积分区间
        </h4>
        <div style={{ display: 'grid', gap: 16, gridTemplateColumns: '1fr 1fr' }}>
          <div data-field="minPoints">
            <FormField label="最低积分" error={getFieldError('minPoints')}>
              <input
                type="number"
                min={0}
                value={formData.minPoints}
                onChange={(e) => handleFieldChange('minPoints', Number(e.target.value))}
                disabled={isSubmitting}
                style={inputStyle(!!errors.minPoints)}
              />
            </FormField>
          </div>
          <div data-field="maxPoints">
            <FormField label="最高积分" error={getFieldError('maxPoints')}>
              <input
                type="number"
                min={0}
                value={formData.maxPoints}
                onChange={(e) => handleFieldChange('maxPoints', Number(e.target.value))}
                disabled={isSubmitting}
                style={inputStyle(!!errors.maxPoints)}
              />
            </FormField>
          </div>
        </div>
      </section>

      {/* 折扣与费用 */}
      <section>
        <h4 style={{ margin: '0 0 16px', fontSize: 14, fontWeight: 600, color: '#e2e8f0' }}>
          折扣与费用
        </h4>
        <div style={{ display: 'grid', gap: 16, gridTemplateColumns: '1fr 1fr 1fr' }}>
          <div data-field="discountRate">
            <FormField label="折扣率 (%)" error={getFieldError('discountRate')} helper="0=免费 100=无折扣">
              <input
                type="number"
                min={0}
                max={100}
                value={formData.discountRate}
                onChange={(e) => handleFieldChange('discountRate', Number(e.target.value))}
                disabled={isSubmitting}
                style={inputStyle(!!errors.discountRate)}
              />
            </FormField>
          </div>
          <div data-field="annualFee">
            <FormField label="年费 (元)" error={getFieldError('annualFee')}>
              <input
                type="number"
                min={0}
                value={formData.annualFee}
                onChange={(e) => handleFieldChange('annualFee', Number(e.target.value))}
                disabled={isSubmitting}
                style={inputStyle(!!errors.annualFee)}
              />
            </FormField>
          </div>
          <div>
            <FormField label="状态">
              <select
                value={formData.status}
                onChange={(e) => handleFieldChange('status', e.target.value)}
                disabled={isSubmitting}
                style={{ ...inputStyle(false), minHeight: 40 }}
              >
                {LEVEL_STATUS_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </FormField>
          </div>
        </div>
      </section>

      {/* 权益配置 */}
      <section>
        <h4 style={{ margin: '0 0 16px', fontSize: 14, fontWeight: 600, color: '#e2e8f0' }}>
          权益配置
        </h4>
        <div>
          <FormField label="权益列表" helper="多个权益用逗号分隔，例如：全场8折, 双倍积分, 生日礼包">
            <input
              type="text"
              value={formData.benefits}
              onChange={(e) => handleFieldChange('benefits', e.target.value)}
              disabled={isSubmitting}
              style={inputStyle(false)}
              placeholder="全场8折, 双倍积分, 生日礼包"
            />
          </FormField>
        </div>
        <div style={{ display: 'grid', gap: 12, gridTemplateColumns: '1fr', marginTop: 12 }}>
          <FormField label="升级条件">
            <input
              type="text"
              value={formData.upgradeCondition}
              onChange={(e) => handleFieldChange('upgradeCondition', e.target.value)}
              disabled={isSubmitting}
              style={inputStyle(false)}
              placeholder="累计积分达到 5000 分"
            />
          </FormField>
          <FormField label="降级条件">
            <input
              type="text"
              value={formData.downgradeCondition}
              onChange={(e) => handleFieldChange('downgradeCondition', e.target.value)}
              disabled={isSubmitting}
              style={inputStyle(false)}
              placeholder="连续 6 个月消费不足"
            />
          </FormField>
          <FormField label="续费条件">
            <input
              type="text"
              value={formData.renewalCondition}
              onChange={(e) => handleFieldChange('renewalCondition', e.target.value)}
              disabled={isSubmitting}
              style={inputStyle(false)}
              placeholder="年度消费满 ¥10000 自动续费"
            />
          </FormField>
        </div>
      </section>

      {/* 备注 */}
      <section>
        <h4 style={{ margin: '0 0 8px', fontSize: 14, fontWeight: 600, color: '#e2e8f0' }}>
          备注
        </h4>
        <textarea
          value={formData.notes}
          onChange={(e) => handleFieldChange('notes', e.target.value)}
          disabled={isSubmitting}
          placeholder="内部备注（选填）"
          style={{ ...inputStyle(false), minHeight: 60, resize: 'vertical', fontFamily: 'inherit' }}
        />
      </section>

      {/* 提交按钮组 */}
      <div
        style={{
          display: 'flex',
          gap: 12,
          justifyContent: 'flex-end',
          paddingTop: 12,
          borderTop: '1px solid rgba(148, 163, 184, 0.15)',
        }}
      >
        <SubmitButton variant="secondary" onClick={onCancel} disabled={isSubmitting}>
          取消
        </SubmitButton>
        <SubmitButton
          loading={isSubmitting}
          onClick={() => void handleSubmit()}
          variant="primary"
        >
          {isSubmitting ? '保存中...' : '保存等级'}
        </SubmitButton>
      </div>
    </div>
  );
}

// ---- 样式 ----

function inputStyle(hasError: boolean): React.CSSProperties {
  return {
    width: '100%',
    padding: '8px 12px',
    borderRadius: 8,
    border: `1px solid ${hasError ? '#ef4444' : 'rgba(148,163,184,0.2)'}`,
    background: 'rgba(30,41,59,0.8)',
    color: '#e2e8f0',
    fontSize: 13,
    outline: 'none',
    boxSizing: 'border-box',
    fontFamily: 'inherit',
  };
}
