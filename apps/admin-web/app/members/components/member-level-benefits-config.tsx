/**
 * 会员等级权益配置对话框组件
 * 用于在等级管理页面中配置会员卡等级对应的权益内容
 * 支持：权益类型选择、折扣率配置、积分倍率设置、权益描述编辑
 */
'use client';

import React, { useState, useCallback, useMemo } from 'react';

import {
  Dialog,
  FormField,
  FormSubmitFeedback,
  SubmitButton,
} from '@m5/ui';

// ---- 权益类型定义 ----

export interface BenefitConfig {
  type: BenefitType;
  enabled: boolean;
  value: string;
  description: string;
}

export type BenefitType =
  | 'discount'
  | 'points_multiplier'
  | 'free_shipping'
  | 'exclusive_access'
  | 'birthday_gift'
  | 'priority_service'
  | 'extended_return'
  | 'vip_customer_service'
  | 'free_wrapping'
  | 'early_access';

export interface LevelBenefitsFormData {
  tierKey: string;
  tierName: string;
  discountRate: number;
  pointsMultiplier: number;
  annualFee: number;
  freeShippingThreshold: number;
  birthdayGiftPoints: number;
  exclusiveAccessTiers: string[];
  priorityServiceLevel: 'basic' | 'standard' | 'premium';
  benefits: BenefitConfig[];
  notes: string;
}

export interface LevelBenefitsErrors {
  tierKey?: string;
  tierName?: string;
  discountRate?: string;
  pointsMultiplier?: string;
  annualFee?: string;
  freeShippingThreshold?: string;
  birthdayGiftPoints?: string;
}

// ---- 权益类型元数据 ----

export const BENEFIT_TYPE_META: Record<BenefitType, { label: string; description: string; defaultEnabled: boolean }> = {
  discount: { label: '折扣优惠', description: '按等级享受不同的商品折扣率', defaultEnabled: true },
  points_multiplier: { label: '积分倍率', description: '消费时获得额外倍数的积分', defaultEnabled: true },
  free_shipping: { label: '免运费', description: '达到指定金额后享受免运费', defaultEnabled: false },
  exclusive_access: { label: '专属活动', description: '优先参与限时抢购和会员专享活动', defaultEnabled: false },
  birthday_gift: { label: '生日礼包', description: '会员生日当月赠送积分或礼品', defaultEnabled: true },
  priority_service: { label: '优先服务', description: '专柜优先接待和快速退换货', defaultEnabled: false },
  extended_return: { label: '延长退换', description: '延长退换货期限比普通会员更长', defaultEnabled: false },
  vip_customer_service: { label: 'VIP客服', description: '配备专属客服经理一对一服务', defaultEnabled: false },
  free_wrapping: { label: '免费包装', description: '线上及线下购物享受免费礼品包装', defaultEnabled: false },
  early_access: { label: '新品优先', description: '新品上架优先选购权', defaultEnabled: false },
};

export const ALL_BENEFIT_TYPES: BenefitType[] = [
  'discount',
  'points_multiplier',
  'free_shipping',
  'exclusive_access',
  'birthday_gift',
  'priority_service',
  'extended_return',
  'vip_customer_service',
  'free_wrapping',
  'early_access',
];

export const PRIORITY_SERVICE_OPTIONS = [
  { value: 'basic', label: '基础服务' },
  { value: 'standard', label: '标准服务' },
  { value: 'premium', label: '尊享服务' },
] as const;

// ---- 默认表单数据 ----

export function createDefaultBenefitsForm(tierKey = '', tierName = ''): LevelBenefitsFormData {
  return {
    tierKey,
    tierName,
    discountRate: 100,
    pointsMultiplier: 1.0,
    annualFee: 0,
    freeShippingThreshold: 0,
    birthdayGiftPoints: 0,
    exclusiveAccessTiers: [],
    priorityServiceLevel: 'basic',
    benefits: ALL_BENEFIT_TYPES.map((type) => ({
      type,
      enabled: BENEFIT_TYPE_META[type].defaultEnabled,
      value: '',
      description: BENEFIT_TYPE_META[type].description,
    })),
    notes: '',
  };
}

// ---- 验证 ----

export function validateBenefitsForm(data: LevelBenefitsFormData): LevelBenefitsErrors {
  const errors: LevelBenefitsErrors = {};

  if (!data.tierKey.trim()) {
    errors.tierKey = '等级标识不能为空';
  } else if (!/^[a-z_]{2,20}$/.test(data.tierKey.trim())) {
    errors.tierKey = '标识格式：2-20位小写字母和下划线';
  }

  if (!data.tierName.trim()) {
    errors.tierName = '等级名称不能为空';
  }

  if (data.discountRate < 0 || data.discountRate > 100) {
    errors.discountRate = '折扣率范围为 0-100';
  }

  if (data.pointsMultiplier < 0.5 || data.pointsMultiplier > 10) {
    errors.pointsMultiplier = '积分倍率范围为 0.5-10';
  }

  if (data.annualFee < 0) {
    errors.annualFee = '年费不能为负数';
  }

  if (data.freeShippingThreshold < 0) {
    errors.freeShippingThreshold = '免运费门槛不能为负数';
  }

  if (data.birthdayGiftPoints < 0) {
    errors.birthdayGiftPoints = '生日积分不能为负数';
  }

  return errors;
}

// ---- 权益配置对话框组件 ----

export function BenefitsConfigDialog({
  open,
  onClose,
  onSave,
  initialData,
  isSubmitting,
}: {
  open: boolean;
  onClose: () => void;
  onSave: (data: LevelBenefitsFormData) => Promise<void>;
  initialData?: Partial<LevelBenefitsFormData>;
  isSubmitting: boolean;
}) {
  const [formData, setFormData] = useState<LevelBenefitsFormData>(() =>
    createDefaultBenefitsForm(initialData?.tierKey, initialData?.tierName)
  );
  const [errors, setErrors] = useState<LevelBenefitsErrors>({});
  const [submitFeedback, setSubmitFeedback] = useState<{
    isSubmitting: boolean;
    errorMessage?: string;
    successMessage?: string;
  }>({ isSubmitting: false });

  // 初始化
  React.useEffect(() => {
    if (open) {
      setFormData({
        ...createDefaultBenefitsForm(initialData?.tierKey, initialData?.tierName),
        ...initialData,
      });
      setErrors({});
      setSubmitFeedback({ isSubmitting: false });
    }
  }, [open, initialData]);

  const getFieldError = (field: keyof LevelBenefitsErrors): string | undefined =>
    errors[field];

  const handleFieldChange = useCallback(
    (field: keyof LevelBenefitsFormData, value: string | number | boolean | string[]) => {
      setFormData((prev) => ({ ...prev, [field]: value }));
      if (errors[field as keyof LevelBenefitsErrors]) {
        setErrors((prev) => {
          const next = { ...prev };
          delete next[field as keyof LevelBenefitsErrors];
          return next;
        });
      }
    },
    [errors]
  );

  const handleBenefitToggle = useCallback((type: BenefitType) => {
    setFormData((prev) => ({
      ...prev,
      benefits: prev.benefits.map((b) =>
        b.type === type ? { ...b, enabled: !b.enabled } : b
      ),
    }));
  }, []);

  const handleBenefitValueChange = useCallback((type: BenefitType, value: string) => {
    setFormData((prev) => ({
      ...prev,
      benefits: prev.benefits.map((b) =>
        b.type === type ? { ...b, value } : b
      ),
    }));
  }, []);

  const handleSave = useCallback(async () => {
    const validationErrors = validateBenefitsForm(formData);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setSubmitFeedback({ isSubmitting: true });
    try {
      await onSave(formData);
      setSubmitFeedback({ isSubmitting: false, successMessage: '权益配置已保存' });
    } catch (error) {
      setSubmitFeedback({
        isSubmitting: false,
        errorMessage: error instanceof Error ? error.message : '保存失败',
      });
    }
  }, [formData, onSave]);

  const enabledBenefits = useMemo(
    () => formData.benefits.filter((b) => b.enabled),
    [formData.benefits]
  );

  const disabledBenefits = useMemo(
    () => formData.benefits.filter((b) => !b.enabled),
    [formData.benefits]
  );

  return (
    <Dialog open={open} onClose={onClose} title="配置等级权益">
      <div style={{ display: 'grid', gap: 20, minWidth: 520, maxHeight: '80vh', overflow: 'auto' }}>
        {/* 反馈 */}
        {submitFeedback.errorMessage || submitFeedback.successMessage ? (
          <FormSubmitFeedback state={submitFeedback} />
        ) : null}

        {/* 基础配置 */}
        <section>
          <h4 style={{ fontSize: 14, fontWeight: 600, color: '#e2e8f0', margin: '0 0 12px' }}>
            基础配置
          </h4>
          <div style={{ display: 'grid', gap: 12, gridTemplateColumns: '1fr 1fr' }}>
            <div data-field="tierKey">
              <FormField label="等级标识" required error={getFieldError('tierKey')}>
                <input
                  type="text"
                  value={formData.tierKey}
                  onChange={(e) => handleFieldChange('tierKey', e.target.value)}
                  disabled={isSubmitting}
                  style={inputStyle(!!errors.tierKey)}
                  placeholder="例如: diamond_vip"
                />
              </FormField>
            </div>
            <div data-field="tierName">
              <FormField label="等级名称" required error={getFieldError('tierName')}>
                <input
                  type="text"
                  value={formData.tierName}
                  onChange={(e) => handleFieldChange('tierName', e.target.value)}
                  disabled={isSubmitting}
                  style={inputStyle(!!errors.tierName)}
                  placeholder="例如: 钻石会员"
                />
              </FormField>
            </div>
          </div>
          <div style={{ display: 'grid', gap: 12, gridTemplateColumns: '1fr 1fr 1fr', marginTop: 12 }}>
            <div data-field="discountRate">
              <FormField label="折扣率 (%)" error={getFieldError('discountRate')}>
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
            <div data-field="pointsMultiplier">
              <FormField label="积分倍率" error={getFieldError('pointsMultiplier')}>
                <input
                  type="number"
                  min={0.5}
                  max={10}
                  step={0.5}
                  value={formData.pointsMultiplier}
                  onChange={(e) => handleFieldChange('pointsMultiplier', Number(e.target.value))}
                  disabled={isSubmitting}
                  style={inputStyle(!!errors.pointsMultiplier)}
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
          </div>
        </section>

        {/* 权益选择 */}
        <section>
          <h4 style={{ fontSize: 14, fontWeight: 600, color: '#e2e8f0', margin: '0 0 12px' }}>
            权益配置
          </h4>

          {enabledBenefits.length > 0 && (
            <div style={{ marginBottom: 12 }}>
              <div style={{ fontSize: 12, color: '#86efac', marginBottom: 8 }}>已启用权益：</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {enabledBenefits.map((benefit) => (
                  <button
                    key={benefit.type}
                    type="button"
                    onClick={() => handleBenefitToggle(benefit.type)}
                    disabled={isSubmitting}
                    style={{
                      padding: '6px 12px',
                      fontSize: 12,
                      borderRadius: 8,
                      border: '1px solid rgba(74, 222, 128, 0.3)',
                      background: 'rgba(74, 222, 128, 0.12)',
                      color: '#86efac',
                      cursor: 'pointer',
                    }}
                  >
                    ✓ {BENEFIT_TYPE_META[benefit.type].label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {disabledBenefits.length > 0 && (
            <div>
              <div style={{ fontSize: 12, color: '#94a3b8', marginBottom: 8 }}>未启用权益：</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {disabledBenefits.map((benefit) => (
                  <button
                    key={benefit.type}
                    type="button"
                    onClick={() => handleBenefitToggle(benefit.type)}
                    disabled={isSubmitting}
                    style={{
                      padding: '6px 12px',
                      fontSize: 12,
                      borderRadius: 8,
                      border: '1px solid rgba(148, 163, 184, 0.15)',
                      background: 'transparent',
                      color: '#94a3b8',
                      cursor: 'pointer',
                    }}
                  >
                    + {BENEFIT_TYPE_META[benefit.type].label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* 详细配置 */}
          {enabledBenefits.length > 0 && (
            <div style={{ marginTop: 16, display: 'grid', gap: 16 }}>
              <div style={{ fontSize: 12, color: '#cbd5e1', marginBottom: 4 }}>
                权益详细配置（选填）
              </div>
              {enabledBenefits.map((benefit) => (
                <div
                  key={benefit.type}
                  style={{
                    padding: 12,
                    borderRadius: 8,
                    background: 'rgba(30, 41, 59, 0.5)',
                    border: '1px solid rgba(148, 163, 184, 0.1)',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                    <span style={{ fontSize: 13, fontWeight: 600, color: '#e2e8f0' }}>
                      {BENEFIT_TYPE_META[benefit.type].label}
                    </span>
                    <span style={{ fontSize: 11, color: '#94a3b8' }}>
                      {BENEFIT_TYPE_META[benefit.type].description}
                    </span>
                  </div>
                  <input
                    type="text"
                    value={benefit.value}
                    onChange={(e) => handleBenefitValueChange(benefit.type, e.target.value)}
                    placeholder={`配置${BENEFIT_TYPE_META[benefit.type].label}详情（选填）`}
                    disabled={isSubmitting}
                    style={{ ...inputStyle(false), fontSize: 12, padding: '6px 10px' }}
                  />
                </div>
              ))}
            </div>
          )}
        </section>

        {/* 备注 */}
        <section>
          <h4 style={{ fontSize: 14, fontWeight: 600, color: '#e2e8f0', margin: '0 0 8px' }}>
            备注
          </h4>
          <textarea
            value={formData.notes}
            onChange={(e) => handleFieldChange('notes', e.target.value)}
            disabled={isSubmitting}
            placeholder="附加说明（选填）"
            style={{ ...inputStyle(false), minHeight: 60, resize: 'vertical', fontFamily: 'inherit' }}
          />
        </section>
      </div>

      <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 20 }}>
        <button
          onClick={onClose}
          disabled={isSubmitting}
          style={{
            padding: '8px 20px',
            borderRadius: 8,
            border: '1px solid rgba(148,163,184,0.2)',
            background: 'rgba(148,163,184,0.1)',
            color: '#94a3b8',
            fontSize: 14,
            cursor: 'pointer',
          }}
        >
          取消
        </button>
        <SubmitButton
          loading={isSubmitting}
          onClick={() => void handleSave()}
          variant="primary"
        >
          {isSubmitting ? '保存中...' : '保存权益配置'}
        </SubmitButton>
      </div>
    </Dialog>
  );
}

// ---- 权益摘要组件 ----

export function BenefitsSummary({
  benefits,
  compact,
}: {
  benefits: BenefitConfig[];
  compact?: boolean;
}) {
  const activeBenefits = benefits.filter((b) => b.enabled);

  if (activeBenefits.length === 0) {
    return <span style={{ color: '#64748b', fontSize: 13 }}>暂未配置权益</span>;
  }

  if (compact) {
    return (
      <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
        {activeBenefits.slice(0, 4).map((b) => (
          <span
            key={b.type}
            style={{
              fontSize: 11,
              padding: '2px 6px',
              borderRadius: 4,
              background: 'rgba(147, 197, 253, 0.12)',
              color: '#93c5fd',
            }}
          >
            {BENEFIT_TYPE_META[b.type].label}
          </span>
        ))}
        {activeBenefits.length > 4 && (
          <span style={{ fontSize: 11, color: '#64748b' }}>
            +{activeBenefits.length - 4}
          </span>
        )}
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
      {activeBenefits.map((b) => (
        <div
          key={b.type}
          style={{
            padding: '8px 14px',
            borderRadius: 8,
            background: 'rgba(147, 197, 253, 0.12)',
            border: '1px solid rgba(96, 165, 250, 0.2)',
          }}
        >
          <div style={{ fontSize: 13, fontWeight: 600, color: '#93c5fd' }}>
            ✓ {BENEFIT_TYPE_META[b.type].label}
          </div>
          {b.value && (
            <div style={{ fontSize: 12, color: '#cbd5e1', marginTop: 4 }}>
              {b.value}
            </div>
          )}
          <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>
            {BENEFIT_TYPE_META[b.type].description}
          </div>
        </div>
      ))}
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
