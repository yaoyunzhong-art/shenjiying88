/**
 * campaigns/new/page.tsx — 营销活动创建/编辑表单页 (ToB)
 *
 * 功能:
 * - 表单验证（必填字段、数字范围、日期逻辑校验）
 * - 提交模拟 + 错误处理
 * - 预览摘要
 * - 完整 .test.tsx 测试覆盖
 */
'use client';

import React, { useState, useCallback, useMemo } from 'react';
import { PageShell, Badge } from '@m5/ui';
import {
  CAMPAIGN_STATUS_MAP,
  CAMPAIGN_TYPE_MAP,
  CAMPAIGN_CHANNEL_MAP,
  CAMPAIGN_TYPES,
  CAMPAIGN_CHANNELS,
  formatCurrency,
  type CampaignItem,
} from '../../campaigns-data';
import {
  validateCampaignForm,
  isFormValid,
  submitCampaignForm,
  type CampaignFormValues,
  type CampaignFormErrors,
  type SubmitStatus,
} from './lib';

// ── 常量 ──

const MIN_BUDGET = 1000;
const MAX_BUDGET = 10_000_000;

// ── Mock 提交 ──


// ── 表单组件 ──

const INITIAL_VALUES: CampaignFormValues = {
  name: '',
  type: '',
  channel: '',
  budget: '',
  startDate: '',
  endDate: '',
  description: '',
};

export default function CampaignNewPage() {
  const [values, setValues] = useState<CampaignFormValues>(INITIAL_VALUES);
  const [errors, setErrors] = useState<CampaignFormErrors>({});
  const [status, setStatus] = useState<SubmitStatus>('idle');
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  // 更新字段
  const handleChange = useCallback(
    (field: keyof CampaignFormValues, value: string) => {
      setValues((prev) => ({ ...prev, [field]: value }));
      // 实时校验已 touch 的字段
      if (touched[field]) {
        setErrors((prev) => {
          const next = { ...prev };
          delete next[field as keyof CampaignFormErrors];
          const allErrors = validateCampaignForm({ ...values, [field]: value });
          if (allErrors[field as keyof CampaignFormErrors]) {
            next[field as keyof CampaignFormErrors] = allErrors[field as keyof CampaignFormErrors];
          }
          return next;
        });
      }
    },
    [values, touched],
  );

  // 标记 touch
  const handleBlur = useCallback(
    (field: keyof CampaignFormValues) => {
      setTouched((prev) => ({ ...prev, [field]: true }));
      const allErrors = validateCampaignForm(values);
      setErrors((prev) => {
        if (allErrors[field as keyof CampaignFormErrors]) {
          return { ...prev, [field]: allErrors[field as keyof CampaignFormErrors] };
        }
        const next = { ...prev };
        delete next[field as keyof CampaignFormErrors];
        return next;
      });
    },
    [values],
  );

  // 提交
  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      // 全量校验
      const allErrors = validateCampaignForm(values);
      setErrors(allErrors);
      // 标记全部 touch
      setTouched({ name: true, type: true, channel: true, budget: true, startDate: true, endDate: true });

      if (!isFormValid(allErrors)) return;

      setStatus('submitting');
      setSubmitError(null);

      try {
        const result = await submitCampaignForm(values);
        if (result.ok) {
          setStatus('success');
        } else {
          setStatus('error');
          setSubmitError(result.error ?? '提交失败');
        }
      } catch (err) {
        if (err instanceof DOMException && err.name === 'AbortError') {
          // 被取消，不做处理
          return;
        }
        setStatus('error');
        setSubmitError(err instanceof Error ? err.message : '未知错误');
      }
    },
    [values],
  );

  // 重置
  const handleReset = useCallback(() => {
    setValues(INITIAL_VALUES);
    setErrors({});
    setStatus('idle');
    setSubmitError(null);
    setTouched({});
  }, []);

  // 预览数据
  const preview = useMemo(() => {
    const typeLabel = values.type ? (CAMPAIGN_TYPE_MAP as Record<string, { label: string; color: string } | undefined>)[values.type]?.label : '-';
    const channelLabel = values.channel ? (CAMPAIGN_CHANNEL_MAP as Record<string, { label: string; color: string } | undefined>)[values.channel]?.label : '-';
    const budgetDisplay = values.budget ? formatCurrency(Number(values.budget)) : '-';
    return { typeLabel, channelLabel, budgetDisplay };
  }, [values]);

  // ── 样式常量 ──
  const inputBase: React.CSSProperties = {
    width: '100%',
    padding: '8px 12px',
    borderRadius: 8,
    border: '1px solid rgba(148,163,184,0.25)',
    background: 'rgba(30,41,59,0.9)',
    color: '#e2e8f0',
    fontSize: 14,
    outline: 'none',
    transition: 'border-color 0.15s',
    boxSizing: 'border-box',
  };

  const labelStyle: React.CSSProperties = {
    fontSize: 13,
    fontWeight: 500,
    color: '#cbd5e1',
    marginBottom: 4,
    display: 'block',
  };

  const errorStyle: React.CSSProperties = {
    fontSize: 12,
    color: '#f87171',
    marginTop: 2,
  };

  const fieldGroupStyle: React.CSSProperties = {
    marginBottom: 18,
  };

  return (
    <main style={{ maxWidth: 800, margin: '0 auto', padding: 32 }}>
      <PageShell title={status === 'success' ? '活动已创建' : '创建活动'} subtitle="填写活动信息并提交">
        {/* 成功状态 */}
        {status === 'success' ? (
          <div
            data-testid="form-success"
            style={{
              borderRadius: 16,
              padding: 40,
              background: 'rgba(15,23,42,0.38)',
              border: '1px solid rgba(74,222,128,0.3)',
              textAlign: 'center',
            }}
          >
            <div style={{ fontSize: 48, marginBottom: 12 }}>✅</div>
            <div style={{ fontSize: 20, fontWeight: 700, color: '#4ade80', marginBottom: 8 }}>
              活动创建成功！
            </div>
            <div style={{ fontSize: 14, color: '#94a3b8', marginBottom: 24 }}>
              活动「{values.name}」已提交，等待审核。
            </div>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
              <button
                onClick={handleReset}
                data-testid="form-create-another"
                style={{
                  padding: '10px 24px',
                  borderRadius: 10,
                  border: '1px solid rgba(59,130,246,0.4)',
                  background: 'rgba(59,130,246,0.15)',
                  color: '#60a5fa',
                  fontSize: 14,
                  cursor: 'pointer',
                }}
              >
                继续创建
              </button>
              <a
                href="/campaigns"
                data-testid="form-back-to-list"
                style={{
                  padding: '10px 24px',
                  borderRadius: 10,
                  border: '1px solid rgba(148,163,184,0.25)',
                  color: '#94a3b8',
                  fontSize: 14,
                  textDecoration: 'none',
                  display: 'inline-block',
                }}
              >
                返回列表
              </a>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} data-testid="campaign-form" noValidate>
            <div
              style={{
                borderRadius: 16,
                padding: 24,
                background: 'rgba(15,23,42,0.38)',
                border: '1px solid rgba(148,163,184,0.18)',
              }}
            >
              {/* 活动名称 */}
              <div style={fieldGroupStyle}>
                <label htmlFor="campaign-name" style={labelStyle}>
                  活动名称 <span style={{ color: '#f87171' }}>*</span>
                </label>
                <input
                  id="campaign-name"
                  data-testid="form-field-name"
                  type="text"
                  placeholder="例如：618限时抢购"
                  value={values.name}
                  onChange={(e) => handleChange('name', e.target.value)}
                  onBlur={() => handleBlur('name')}
                  style={{
                    ...inputBase,
                    borderColor: touched.name && errors.name ? 'rgba(248,113,113,0.5)' : 'rgba(148,163,184,0.25)',
                  }}
                />
                {touched.name && errors.name && (
                  <div data-testid="form-error-name" style={errorStyle}>
                    {errors.name}
                  </div>
                )}
              </div>

              {/* 活动类型 + 渠道 */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div style={fieldGroupStyle}>
                  <label htmlFor="campaign-type" style={labelStyle}>
                    活动类型 <span style={{ color: '#f87171' }}>*</span>
                  </label>
                  <select
                    id="campaign-type"
                    data-testid="form-field-type"
                    value={values.type}
                    onChange={(e) => handleChange('type', e.target.value)}
                    onBlur={() => handleBlur('type')}
                    style={{
                      ...inputBase,
                      borderColor: touched.type && errors.type ? 'rgba(248,113,113,0.5)' : 'rgba(148,163,184,0.25)',
                    }}
                  >
                    <option value="">请选择</option>
                    {CAMPAIGN_TYPES.map((t) => (
                      <option key={t} value={t}>
                        {CAMPAIGN_TYPE_MAP[t].label}
                      </option>
                    ))}
                  </select>
                  {touched.type && errors.type && (
                    <div data-testid="form-error-type" style={errorStyle}>
                      {errors.type}
                    </div>
                  )}
                </div>

                <div style={fieldGroupStyle}>
                  <label htmlFor="campaign-channel" style={labelStyle}>
                    渠道 <span style={{ color: '#f87171' }}>*</span>
                  </label>
                  <select
                    id="campaign-channel"
                    data-testid="form-field-channel"
                    value={values.channel}
                    onChange={(e) => handleChange('channel', e.target.value)}
                    onBlur={() => handleBlur('channel')}
                    style={{
                      ...inputBase,
                      borderColor: touched.channel && errors.channel ? 'rgba(248,113,113,0.5)' : 'rgba(148,163,184,0.25)',
                    }}
                  >
                    <option value="">请选择</option>
                    {CAMPAIGN_CHANNELS.map((ch) => (
                      <option key={ch} value={ch}>
                        {CAMPAIGN_CHANNEL_MAP[ch].label}
                      </option>
                    ))}
                  </select>
                  {touched.channel && errors.channel && (
                    <div data-testid="form-error-channel" style={errorStyle}>
                      {errors.channel}
                    </div>
                  )}
                </div>
              </div>

              {/* 预算 */}
              <div style={fieldGroupStyle}>
                <label htmlFor="campaign-budget" style={labelStyle}>
                  预算金额 (元) <span style={{ color: '#f87171' }}>*</span>
                </label>
                <input
                  id="campaign-budget"
                  data-testid="form-field-budget"
                  type="number"
                  placeholder={`${MIN_BUDGET} - ${MAX_BUDGET}`}
                  value={values.budget}
                  onChange={(e) => handleChange('budget', e.target.value)}
                  onBlur={() => handleBlur('budget')}
                  min={MIN_BUDGET}
                  max={MAX_BUDGET}
                  style={{
                    ...inputBase,
                    borderColor: touched.budget && errors.budget ? 'rgba(248,113,113,0.5)' : 'rgba(148,163,184,0.25)',
                  }}
                />
                {touched.budget && errors.budget && (
                  <div data-testid="form-error-budget" style={errorStyle}>
                    {errors.budget}
                  </div>
                )}
              </div>

              {/* 日期 */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div style={fieldGroupStyle}>
                  <label htmlFor="campaign-start-date" style={labelStyle}>
                    开始日期 <span style={{ color: '#f87171' }}>*</span>
                  </label>
                  <input
                    id="campaign-start-date"
                    data-testid="form-field-startDate"
                    type="date"
                    value={values.startDate}
                    onChange={(e) => handleChange('startDate', e.target.value)}
                    onBlur={() => handleBlur('startDate')}
                    style={{
                      ...inputBase,
                      borderColor: touched.startDate && errors.startDate ? 'rgba(248,113,113,0.5)' : 'rgba(148,163,184,0.25)',
                    }}
                  />
                  {touched.startDate && errors.startDate && (
                    <div data-testid="form-error-startDate" style={errorStyle}>
                      {errors.startDate}
                    </div>
                  )}
                </div>

                <div style={fieldGroupStyle}>
                  <label htmlFor="campaign-end-date" style={labelStyle}>
                    结束日期 <span style={{ color: '#f87171' }}>*</span>
                  </label>
                  <input
                    id="campaign-end-date"
                    data-testid="form-field-endDate"
                    type="date"
                    value={values.endDate}
                    onChange={(e) => handleChange('endDate', e.target.value)}
                    onBlur={() => handleBlur('endDate')}
                    style={{
                      ...inputBase,
                      borderColor: touched.endDate && errors.endDate ? 'rgba(248,113,113,0.5)' : 'rgba(148,163,184,0.25)',
                    }}
                  />
                  {touched.endDate && errors.endDate && (
                    <div data-testid="form-error-endDate" style={errorStyle}>
                      {errors.endDate}
                    </div>
                  )}
                </div>
              </div>

              {/* 描述 */}
              <div style={fieldGroupStyle}>
                <label htmlFor="campaign-desc" style={labelStyle}>
                  活动描述
                </label>
                <textarea
                  id="campaign-desc"
                  data-testid="form-field-description"
                  placeholder="可选，描述活动目标和执行细节..."
                  value={values.description}
                  onChange={(e) => handleChange('description', e.target.value)}
                  rows={3}
                  style={{
                    ...inputBase,
                    resize: 'vertical',
                    minHeight: 60,
                  }}
                />
              </div>
            </div>

            {/* 预览摘要 */}
            <div
              data-testid="form-preview"
              style={{
                marginTop: 16,
                borderRadius: 12,
                padding: 16,
                background: 'rgba(15,23,42,0.25)',
                border: '1px solid rgba(148,163,184,0.12)',
              }}
            >
              <div style={{ fontSize: 13, fontWeight: 600, color: '#cbd5e1', marginBottom: 10 }}>
                活动预览摘要
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 8, fontSize: 13 }}>
                <div>
                  <span style={{ color: '#94a3b8' }}>名称：</span>
                  <span style={{ color: '#e2e8f0' }}>{values.name || '-'}</span>
                </div>
                <div>
                  <span style={{ color: '#94a3b8' }}>类型：</span>
                  <Badge size="sm">{preview.typeLabel}</Badge>
                </div>
                <div>
                  <span style={{ color: '#94a3b8' }}>渠道：</span>
                  <Badge size="sm">{preview.channelLabel}</Badge>
                </div>
                <div>
                  <span style={{ color: '#94a3b8' }}>预算：</span>
                  <span style={{ color: '#e2e8f0' }}>{preview.budgetDisplay}</span>
                </div>
              </div>
              <div style={{ marginTop: 6 }}>
                <span style={{ color: '#94a3b8', fontSize: 13 }}>时间：</span>
                <span style={{ color: '#e2e8f0', fontSize: 13 }}>
                  {values.startDate || '?'} ~ {values.endDate || '?'}
                </span>
              </div>
            </div>

            {/* 全局错误 */}
            {status === 'error' && submitError && (
              <div
                data-testid="form-submit-error"
                style={{
                  marginTop: 12,
                  borderRadius: 10,
                  padding: '10px 14px',
                  background: 'rgba(248,113,113,0.12)',
                  border: '1px solid rgba(248,113,113,0.3)',
                  color: '#f87171',
                  fontSize: 13,
                }}
              >
                ❌ {submitError}
              </div>
            )}

            {/* 操作按钮 */}
            <div style={{ marginTop: 20, display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
              <button
                type="button"
                onClick={handleReset}
                data-testid="form-reset"
                style={{
                  padding: '10px 20px',
                  borderRadius: 10,
                  border: '1px solid rgba(148,163,184,0.25)',
                  background: 'transparent',
                  color: '#94a3b8',
                  fontSize: 14,
                  cursor: 'pointer',
                }}
              >
                重置
              </button>
              <button
                type="submit"
                data-testid="form-submit"
                disabled={status === 'submitting'}
                style={{
                  padding: '10px 28px',
                  borderRadius: 10,
                  border: '1px solid rgba(59,130,246,0.4)',
                  background: status === 'submitting' ? 'rgba(59,130,246,0.08)' : 'rgba(59,130,246,0.2)',
                  color: status === 'submitting' ? '#64748b' : '#60a5fa',
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: status === 'submitting' ? 'not-allowed' : 'pointer',
                }}
              >
                {status === 'submitting' ? '提交中…' : '提交创建'}
              </button>
            </div>
          </form>
        )}
      </PageShell>
    </main>
  );
}
