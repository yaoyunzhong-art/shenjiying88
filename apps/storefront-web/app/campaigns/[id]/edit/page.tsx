'use client';
/* eslint-disable react-hooks/rules-of-hooks */


import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';

import {
  PageShell,
  FormField,
  Input,
  Select,
  SubmitButton,
  FormSubmitFeedback,
  useToast,
} from '@m5/ui';

// ---- 类型 ----

type CampaignStatus = 'active' | 'scheduled' | 'ended' | 'paused' | 'draft';
type CampaignChannel = '小程序' | 'H5' | 'App推送' | '短信' | '企微' | '全渠道';

const CHANNEL_OPTIONS: { label: string; value: CampaignChannel }[] = [
  { label: '全渠道', value: '全渠道' },
  { label: '小程序', value: '小程序' },
  { label: 'H5 页面', value: 'H5' },
  { label: 'App 推送', value: 'App推送' },
  { label: '短信', value: '短信' },
  { label: '企业微信', value: '企微' },
];

const STATUS_OPTIONS: { label: string; value: CampaignStatus }[] = [
  { label: '投放中', value: 'active' },
  { label: '已排期', value: 'scheduled' },
  { label: '已结束', value: 'ended' },
  { label: '已暂停', value: 'paused' },
  { label: '草稿', value: 'draft' },
];

const TARGET_OPTIONS: { label: string; value: string }[] = [
  { label: '全部会员', value: '全部会员' },
  { label: '新注册会员', value: '新注册会员' },
  { label: '银卡及以上会员', value: '银卡及以上会员' },
  { label: '钻石/黄金会员', value: '钻石/黄金会员' },
  { label: '社交活跃用户', value: '社交活跃用户' },
  { label: '企微社群成员', value: '企微社群成员' },
  { label: '沉睡会员', value: '沉睡会员' },
  { label: '高潜客户', value: '高潜客户' },
];

interface CampaignFormData {
  name: string;
  channel: CampaignChannel;
  status: CampaignStatus;
  budget: string;
  startAt: string;
  endAt: string;
  targetAudience: string;
  description: string;
}

interface CampaignFormErrors {
  name?: string;
  channel?: string;
  status?: string;
  budget?: string;
  startAt?: string;
  endAt?: string;
  targetAudience?: string;
  description?: string;
}

// ---- Mock 数据 ----

interface CampaignDetail {
  id: string;
  name: string;
  channel: CampaignChannel;
  status: CampaignStatus;
  budget: number;
  spent: number;
  roi: number;
  conversions: number;
  startAt: string;
  endAt: string;
  targetAudience: string;
  description: string;
}

const MOCK_DATA: Record<string, CampaignDetail> = {
  'cmp-001': { id: 'cmp-001', name: '618 年中大促', channel: '全渠道', status: 'active', budget: 500000, spent: 324000, roi: 3.85, conversions: 12850, startAt: '2026-06-01', endAt: '2026-06-30', targetAudience: '全部会员', description: '618 年中大促全场折扣 + 满减活动，覆盖线上线下全渠道，预计触达 50 万会员。' },
  'cmp-002': { id: 'cmp-002', name: '新会员专享礼包', channel: '小程序', status: 'active', budget: 80000, spent: 45200, roi: 5.2, conversions: 3400, startAt: '2026-06-10', endAt: '2026-07-10', targetAudience: '新注册会员', description: '新人首单立减 20 元 + 赠品。' },
  'cmp-004': { id: 'cmp-004', name: '会员积分双倍', channel: 'App推送', status: 'active', budget: 30000, spent: 18200, roi: 8.1, conversions: 5200, startAt: '2026-06-15', endAt: '2026-07-15', targetAudience: '银卡及以上会员', description: '积分双倍活动期间消费翻倍积分。' },
  'cmp-007': { id: 'cmp-007', name: '拼团裂变活动', channel: '全渠道', status: 'active', budget: 100000, spent: 67100, roi: 4.6, conversions: 8900, startAt: '2026-06-08', endAt: '2026-06-28', targetAudience: '社交活跃用户', description: '三人成团享 7 折优惠。' },
  'cmp-011': { id: 'cmp-011', name: '社群签到有礼', channel: '企微', status: 'active', budget: 15000, spent: 8900, roi: 6.8, conversions: 4200, startAt: '2026-06-01', endAt: '2026-07-01', targetAudience: '企微社群成员', description: '每日签到领积分。' },
};

// ---- 验证 ----

function validate(data: CampaignFormData): CampaignFormErrors {
  const e: CampaignFormErrors = {};

  if (!data.name.trim()) {
    e.name = '活动名称不能为空';
  } else if (data.name.trim().length < 2) {
    e.name = '名称至少 2 个字符';
  } else if (data.name.trim().length > 50) {
    e.name = '名称不能超过 50 个字符';
  }

  if (!data.channel) {
    e.channel = '请选择渠道';
  }
  if (!data.status) {
    e.status = '请选择状态';
  }
  if (!data.targetAudience) {
    e.targetAudience = '请选择目标人群';
  }

  if (!data.budget) {
    e.budget = '请输入预算金额';
  } else if (isNaN(Number(data.budget)) || Number(data.budget) <= 0) {
    e.budget = '请输入有效的正数金额';
  } else if (Number(data.budget) > 999999999) {
    e.budget = '预算不能超过 9.99 亿';
  }

  if (!data.startAt) {
    e.startAt = '请选择开始日期';
  }
  if (!data.endAt) {
    e.endAt = '请选择结束日期';
  }
  if (data.startAt && data.endAt && data.startAt > data.endAt) {
    e.endAt = '结束日期不能早于开始日期';
  }

  if (data.description.length > 500) {
    e.description = '描述不能超过 500 个字符';
  }

  return e;
}

function toFormData(c: CampaignDetail): CampaignFormData {
  return {
    name: c.name,
    channel: c.channel,
    status: c.status,
    budget: String(c.budget),
    startAt: c.startAt,
    endAt: c.endAt,
    targetAudience: c.targetAudience,
    description: c.description,
  };
}

export default function CampaignEditPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const id = params.id;

  const source = useMemo<CampaignDetail | null>(() => MOCK_DATA[id] ?? null, [id]);

  const [form, setForm] = useState<CampaignFormData>(
    source ? toFormData(source) : {
      name: '',
      channel: '' as CampaignChannel,
      status: 'draft',
      budget: '',
      startAt: '',
      endAt: '',
      targetAudience: '',
      description: '',
    }
  );
  const [errors, setErrors] = useState<CampaignFormErrors>({});
  const [submitState, setSubmitState] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
  const [submitError, setSubmitError] = useState<string>('');
  const toast = useToast();

  const isNew = !source;

  useEffect(() => {
    if (!source && !isNew) return; // handled below by not-found block
  }, [source, isNew]);

  const handleChange = useCallback(<K extends keyof CampaignFormData>(
    key: K, value: CampaignFormData[K]
  ) => {
    setForm(prev => { const next = { ...prev }; next[key] = value; return next; });
    if (errors[key]) {
      setErrors(prev => {
        const next = { ...prev };
        delete next[key];
        return next;
      });
    }
    if (submitState === 'error') setSubmitState('idle');
  }, [errors, submitState]);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    const v = validate(form);
    setErrors(v);
    if (Object.keys(v).length > 0) return;

    setSubmitState('submitting');
    setSubmitError('');

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1200));
      setSubmitState('success');
      toast.success(isNew ? '活动创建成功' : '活动更新成功');
      setTimeout(() => router.push(`/campaigns/${id}`), 800);
    } catch {
      setSubmitState('error');
      setSubmitError('提交失败，请稍后重试');
    }
  }, [form, id, isNew, router, toast]);

  if (!source && !isNew) {
    return (
      <main style={{ maxWidth: 720, margin: '0 auto', padding: 48, textAlign: 'center' }}>
        <PageShell title="活动不存在" description="未找到该营销活动">
          <div style={{ fontSize: 16, color: '#94a3b8', marginTop: 24 }}>
            活动 ID &quot;{id}&quot; 不存在或已被删除。
          </div>
          <button
            onClick={() => router.push('/campaigns')}
            style={{
              marginTop: 24, padding: '10px 24px', border: 'none', borderRadius: 8,
              background: 'rgba(59,130,246,0.15)', color: '#93c5fd', cursor: 'pointer', fontSize: 14,
            }}
          >
            ← 返回活动列表
          </button>
        </PageShell>
      </main>
    );
  }

  const handleInputChange = useCallback(<K extends keyof CampaignFormData>(
    key: K,
  ) => {
    return (e: React.ChangeEvent<HTMLInputElement>) => {
      handleChange(key, e.target.value as CampaignFormData[K]);
    };
  }, [handleChange]);

  const inputStyle: React.CSSProperties = {
    width: '100%',
    background: 'transparent',
    border: 'none',
    outline: 'none',
    color: '#e2e8f0',
    fontSize: 14,
    padding: '8px 0',
  };

  return (
    <PageShell
      title={isNew ? '创建活动' : `编辑活动 - ${source?.name}`}
      description={isNew ? '填写表单创建新的营销活动' : '修改现有活动的参数和配置'}
    >
      <div style={{ maxWidth: 640, margin: '0 auto' }}>
        <form onSubmit={handleSubmit} noValidate>
          {/* 基本信息区 */}
          <div style={{
            borderRadius: 12, border: '1px solid rgba(148,163,184,0.12)',
            overflow: 'hidden', marginBottom: 20,
          }}>
            <div style={{
              padding: '10px 16px', fontSize: 12, color: '#94a3b8',
              borderBottom: '1px solid rgba(148,163,184,0.08)', fontWeight: 600,
              letterSpacing: 0.5, textTransform: 'uppercase',
            }}>
              基本信息
            </div>

            <div style={{ padding: '0 16px' }}>
              <div style={{ padding: '12px 0', borderBottom: '1px solid rgba(148,163,184,0.08)' }}>
              <FormField
                label="活动名称"
                error={errors.name}
                required
              >
                <Input
                  value={form.name}
                  onChange={handleInputChange('name')}
                  placeholder="例如：618 年中大促"
                  style={inputStyle}
                />
              </FormField>
            </div>
            </div>

            <div style={{ padding: '0 16px' }}>
              <div style={{ padding: '12px 0', borderBottom: '1px solid rgba(148,163,184,0.08)' }}>
              <FormField
                label="投放渠道"
                error={errors.channel}
                required
              >
                <Select
                  value={form.channel}
                  onChange={v => handleChange('channel', v as CampaignChannel)}
                  options={CHANNEL_OPTIONS}
                  placeholder="请选择渠道"
                />
              </FormField>
            </div>
            </div>

            <div style={{ padding: '0 16px' }}>
              <div style={{ padding: '12px 0', borderBottom: '1px solid rgba(148,163,184,0.08)' }}>
              <FormField
                label="状态"
                error={errors.status}
                required
              >
                <Select
                  value={form.status}
                  onChange={v => handleChange('status', v as CampaignStatus)}
                  options={STATUS_OPTIONS}
                />
              </FormField>
            </div>
            </div>

            <div style={{ padding: '0 16px' }}>
              <div style={{ padding: '12px 0', borderBottom: '1px solid rgba(148,163,184,0.08)' }}>
              <FormField
                label="目标人群"
                error={errors.targetAudience}
                required
              >
                <Select
                  value={form.targetAudience}
                  onChange={v => handleChange('targetAudience', v)}
                  options={TARGET_OPTIONS}
                  placeholder="选择目标人群"
                />
              </FormField>
            </div>
            </div>
          </div>

          {/* 预算与时间区 */}
          <div style={{
            borderRadius: 12, border: '1px solid rgba(148,163,184,0.12)',
            overflow: 'hidden', marginBottom: 20,
          }}>
            <div style={{
              padding: '10px 16px', fontSize: 12, color: '#94a3b8',
              borderBottom: '1px solid rgba(148,163,184,0.08)', fontWeight: 600,
              letterSpacing: 0.5, textTransform: 'uppercase',
            }}>
              预算与排期
            </div>

            <div style={{ padding: '0 16px' }}>
              <div style={{ padding: '12px 0', borderBottom: '1px solid rgba(148,163,184,0.08)' }}>
              <FormField
                label="预算金额 (元)"
                error={errors.budget}
                required
              >
                <Input
                  type="number"
                  min={0}
                  value={form.budget}
                  onChange={handleInputChange('budget')}
                  placeholder="例如：100000"
                  style={inputStyle}
                />
              </FormField>
            </div>
            </div>

            <div style={{ padding: '0 16px' }}>
              <div style={{ padding: '12px 0', borderBottom: '1px solid rgba(148,163,184,0.08)' }}>
              <FormField
                label="开始日期"
                error={errors.startAt}
                required
              >
                <Input
                  type="date"
                  value={form.startAt}
                  onChange={handleInputChange('startAt')}
                  style={inputStyle}
                />
              </FormField>
            </div>
            </div>

            <div style={{ padding: '0 16px' }}>
              <div style={{ padding: '12px 0', borderBottom: '1px solid rgba(148,163,184,0.08)' }}>
              <FormField
                label="结束日期"
                error={errors.endAt}
                required
              >
                <Input
                  type="date"
                  value={form.endAt}
                  onChange={handleInputChange('endAt')}
                  style={inputStyle}
                />
              </FormField>
            </div>
            </div>
          </div>

          {/* 描述区 */}
          <div style={{
            borderRadius: 12, border: '1px solid rgba(148,163,184,0.12)',
            overflow: 'hidden', marginBottom: 20,
          }}>
            <div style={{
              padding: '10px 16px', fontSize: 12, color: '#94a3b8',
              borderBottom: '1px solid rgba(148,163,184,0.08)', fontWeight: 600,
              letterSpacing: 0.5, textTransform: 'uppercase',
            }}>
              活动描述
            </div>

            <div style={{ padding: '0 16px' }}>
              <div style={{ padding: '12px 0' }}>
              <FormField
                label="描述"
                error={errors.description}
              >
                <textarea
                  value={form.description}
                  onChange={e => handleChange('description', e.target.value)}
                  placeholder="请输入活动描述..."
                  rows={4}
                  maxLength={500}
                  style={{
                    ...inputStyle, resize: 'vertical', minHeight: 80,
                    fontFamily: 'inherit', lineHeight: 1.6,
                  }}
                />
                <div style={{ fontSize: 11, color: '#64748b', textAlign: 'right', marginTop: 4 }}>
                  {form.description.length}/500
                </div>
              </FormField>
            </div>
            </div>
          </div>

          {/* 提交反馈 */}
          {submitState === 'error' && (
            <div style={{ marginBottom: 16 }}>
              <FormSubmitFeedback error={submitError} />
            </div>
          )}
          {submitState === 'success' && (
            <div style={{ marginBottom: 16 }}>
              <FormSubmitFeedback
                success={isNew ? '活动创建成功！即将跳转...' : '活动更新成功！即将跳转...'}
              />
            </div>
          )}

          <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
            <button
              type="button"
              onClick={() => router.push(`/campaigns/${id}`)}
              style={{
                padding: '10px 24px', border: '1px solid rgba(148,163,184,0.25)',
                borderRadius: 8, background: 'transparent', color: '#94a3b8',
                cursor: 'pointer', fontSize: 14,
              }}
              disabled={submitState === 'submitting'}
            >
              取消
            </button>
            <SubmitButton
              loading={submitState === 'submitting'}
              disabled={submitState === 'submitting'}
              variant="primary"
            >
              {isNew ? '创建活动' : '保存修改'}
            </SubmitButton>
          </div>
        </form>
      </div>
    </PageShell>
  );
}
