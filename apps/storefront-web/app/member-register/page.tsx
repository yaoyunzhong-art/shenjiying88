/**
 * 会员注册 — Member Registration Page (Next.js App Router Page)
 * 角色视角: 👤 前台顾客 / 🛒 导购员协助
 * 功能: 表单验证、短信验证码、提交、注册统计、条款同意
 */
'use client';

import React, { useState, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  FormField,
  SubmitButton,
  FormSubmitFeedback,
  PageShell,
  StatusBadge,
} from '@m5/ui';
import { memberAuthService } from '../../lib/member-auth-service';

// ============================================================
// 类型定义
// ============================================================

interface RegistrationStats {
  todayCount: number;
  weekCount: number;
  monthCount: number;
  totalCount: number;
  avgCompletionTime: number;
}

interface PromotionBanner {
  id: string;
  title: string;
  desc: string;
  icon: string;
  color: string;
}

interface RegistrationRecord {
  id: string;
  mobile: string;
  nickname: string;
  time: string;
  source: string;
  verified: boolean;
}

// ============================================================
// Mock 数据
// ============================================================

const MOCK_STATS: RegistrationStats = {
  todayCount: 12,
  weekCount: 76,
  monthCount: 312,
  totalCount: 5862,
  avgCompletionTime: 28,
};

const MOCK_PROMOTIONS: PromotionBanner[] = [
  { id: 'P1', title: '新会员礼包', desc: '注册即送 200 积分 + 游戏币 20 枚', icon: '🎁', color: '#f59e0b' },
  { id: 'P2', title: '首充双倍', desc: '首次充值享双倍金额，最高 200 元', icon: '💎', color: '#8b5cf6' },
  { id: 'P3', title: '好友邀请', desc: '邀请好友注册各得 100 积分', icon: '🤝', color: '#3b82f6' },
];

const MOCK_RECORDS: RegistrationRecord[] = [
  { id: 'R001', mobile: '138****0011', nickname: '小明', time: '10:23', source: '微信小程序', verified: true },
  { id: 'R002', mobile: '139****0022', nickname: '阿花', time: '09:45', source: '门店扫码', verified: false },
  { id: 'R003', mobile: '136****0033', nickname: '大伟', time: '08:30', source: '活动推荐', verified: true },
  { id: 'R004', mobile: '137****0044', nickname: '丽丽', time: '昨天 21:12', source: '朋友邀请', verified: true },
  { id: 'R005', mobile: '150****0055', nickname: '小龙', time: '昨天 19:00', source: '广告引流', verified: false },
  { id: 'R006', mobile: '151****0066', nickname: '花姐', time: '昨天 16:45', source: '门店扫码', verified: true },
];

// ============================================================
// 子组件: 注册统计面板
// ============================================================

function RegistrationStatsPanel({ stats }: { stats: RegistrationStats }) {
  const items = [
    { label: '今日注册', value: stats.todayCount, color: '#3b82f6' },
    { label: '本周注册', value: stats.weekCount, color: '#8b5cf6' },
    { label: '本月注册', value: stats.monthCount, color: '#f59e0b' },
    { label: '累计注册', value: stats.totalCount.toLocaleString(), color: '#34d399' },
  ];

  return (
    <div style={{
      marginBottom: 24,
    }}>
      <div style={{ fontSize: 14, fontWeight: 600, color: '#e2e8f0', marginBottom: 10 }}>
        📊 注册统计
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
        {items.map((item) => (
          <div key={item.label} style={{
            padding: '12px 8px',
            borderRadius: 10,
            background: 'rgba(30,41,59,0.6)',
            border: '1px solid rgba(148,163,184,0.08)',
            textAlign: 'center',
          }}>
            <div style={{ fontSize: 22, fontWeight: 700, color: item.color }}>
              {item.value}
            </div>
            <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>{item.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ============================================================
// 子组件: 新会员权益提醒
// ============================================================

function PromotionBannerRow({ promotions }: { promotions: PromotionBanner[] }) {
  return (
    <div style={{ marginBottom: 24 }}>
      <div style={{ fontSize: 14, fontWeight: 600, color: '#e2e8f0', marginBottom: 10 }}>
        🎉 新会员福利
      </div>
      <div style={{ display: 'grid', gap: 8 }}>
        {promotions.map((p) => (
          <div key={p.id} style={{
            padding: '12px 16px',
            borderRadius: 10,
            background: `${p.color}10`,
            border: `1px solid ${p.color}30`,
            display: 'flex',
            alignItems: 'center',
            gap: 12,
          }}>
            <span style={{ fontSize: 24 }}>{p.icon}</span>
            <div>
              <div style={{ fontSize: 14, fontWeight: 600, color: '#e2e8f0' }}>{p.title}</div>
              <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 2 }}>{p.desc}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ============================================================
// 子组件: 最新注册记录
// ============================================================

function RecentRegistrationTable({ records }: { records: RegistrationRecord[] }) {
  return (
    <div style={{
      marginBottom: 24,
      borderRadius: 12,
      border: '1px solid rgba(148,163,184,0.1)',
      background: 'rgba(15,23,42,0.3)',
      overflow: 'hidden',
    }}>
      <div style={{
        padding: '10px 14px',
        fontSize: 14,
        fontWeight: 600,
        color: '#e2e8f0',
        borderBottom: '1px solid rgba(148,163,184,0.08)',
      }}>
        📋 最近注册
      </div>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
        <thead>
          <tr style={{ borderBottom: '1px solid rgba(148,163,184,0.06)' }}>
            <th style={regThStyle}>手机号</th>
            <th style={regThStyle}>昵称</th>
            <th style={regThStyle}>时间</th>
            <th style={regThStyle}>来源</th>
            <th style={{ ...regThStyle, textAlign: 'center' }}>验证</th>
          </tr>
        </thead>
        <tbody>
          {records.map((r) => (
            <tr key={r.id} style={{ borderBottom: '1px solid rgba(148,163,184,0.04)' }}>
              <td style={regTdStyle}>{r.mobile}</td>
              <td style={{ ...regTdStyle, color: '#e2e8f0', fontWeight: 500 }}>{r.nickname}</td>
              <td style={regTdStyle}>{r.time}</td>
              <td style={regTdStyle}>{r.source}</td>
              <td style={{ ...regTdStyle, textAlign: 'center' }}>
                {r.verified ? (
                  <span style={{ color: '#34d399', fontSize: 11, fontWeight: 600 }}>✅ 已验证</span>
                ) : (
                  <span style={{ color: '#fbbf24', fontSize: 11, fontWeight: 600 }}>⏳ 待验证</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

const regThStyle: React.CSSProperties = {
  padding: '8px 10px',
  textAlign: 'left',
  fontWeight: 600,
  fontSize: 11,
  color: '#64748b',
  textTransform: 'uppercase',
  letterSpacing: 0.5,
};

const regTdStyle: React.CSSProperties = {
  padding: '8px 10px',
  color: '#94a3b8',
};

// ============================================================
// 子组件: 注册流程步骤提示
// ============================================================

function RegistrationSteps() {
  const steps = [
    { num: 1, label: '填写手机号', desc: '输入11位手机号接收验证码' },
    { num: 2, label: '验证身份', desc: '输入6位短信验证码' },
    { num: 3, label: '完善资料', desc: '填写昵称并同意条款' },
    { num: 4, label: '注册成功', desc: '领取新会员礼包' },
  ];

  return (
    <div style={{
      marginBottom: 24,
      padding: '14px 16px',
      borderRadius: 10,
      background: 'rgba(30,41,59,0.5)',
      border: '1px solid rgba(148,163,184,0.08)',
    }}>
      <div style={{ fontSize: 13, fontWeight: 600, color: '#94a3b8', marginBottom: 10 }}>
        注册流程
      </div>
      <div style={{ display: 'flex', gap: 8, justifyContent: 'space-between' }}>
        {steps.map((step) => (
          <div key={step.num} style={{ flex: 1, textAlign: 'center' }}>
            <div style={{
              width: 28,
              height: 28,
              borderRadius: '50%',
              background: step.num <= 3 ? '#3b82f6' : 'rgba(148,163,184,0.2)',
              color: '#fff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 13,
              fontWeight: 700,
              margin: '0 auto 6px',
            }}>
              {step.num}
            </div>
            <div style={{ fontSize: 11, color: '#e2e8f0', fontWeight: 500 }}>{step.label}</div>
            <div style={{ fontSize: 10, color: '#475569', marginTop: 2 }}>{step.desc}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ============================================================
// 主组件
// ============================================================

export default function MemberRegisterPage(): React.ReactElement {
  const router = useRouter();
  const [countdown, setCountdown] = useState(0);
  const [localError, setLocalError] = useState<string>();
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string>();
  const [submitSuccess, setSubmitSuccess] = useState<string>();

  const [formData, setFormData] = useState({
    mobile: '',
    code: '',
    nickname: '',
    agreeTerms: false,
  });

  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const validate = useCallback((): boolean => {
    const errors: Record<string, string> = {};

    if (!/^1[3-9]\d{9}$/.test(formData.mobile)) {
      errors.mobile = '请输入有效的11位手机号';
    }

    if (formData.code.length !== 6) {
      errors.code = '验证码必须为6位';
    }

    if (!formData.nickname || formData.nickname.trim() === '') {
      errors.nickname = '请输入昵称';
    }

    if (!formData.agreeTerms) {
      errors.agreeTerms = '请同意服务条款';
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  }, [formData]);

  const handleSubmit = useCallback(async (): Promise<Record<string, unknown> | undefined> => {
    if (!validate()) {
      setLocalError('请完善表单信息');
      return undefined;
    }
    setLocalError(undefined);

    await new Promise((r) => setTimeout(r, 800));

    if (Math.random() < 0.08) {
      throw new Error('注册服务暂时不可用，请稍后重试');
    }

    await memberAuthService.sendSmsCode(formData.mobile);

    router.push('/member-login?registered=true');
    return formData;
  }, [formData, validate, router]);

  const handleSendCode = useCallback(() => {
    if (!/^1[3-9]\d{9}$/.test(formData.mobile)) {
      setFieldErrors((prev) => ({ ...prev, mobile: '请先输入正确的手机号' }));
      return;
    }
    setCountdown(60);
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, [formData.mobile]);

  const handleFieldChange = useCallback(
    (field: string, value: string | boolean) => {
      setFormData((prev) => ({ ...prev, [field]: value }));
      setFieldErrors((prev) => {
        if (prev[field]) {
          const next = { ...prev };
          delete next[field];
          return next;
        }
        return prev;
      });
    },
    [],
  );

  return (
    <main style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: '#0f172a' }}>
      <div style={{ maxWidth: 860, margin: '0 auto', padding: '40px 16px', width: '100%' }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: '420px 1fr',
          gap: 32,
          alignItems: 'start',
        }}>
          {/* 左侧: 注册表单 */}
          <div>
            <h1 style={{ color: '#f1f5f9', fontSize: 24, fontWeight: 700, marginBottom: 8 }}>
              会员注册
            </h1>
            <p style={{ color: '#64748b', fontSize: 14, marginBottom: 24 }}>
              注册成为会员，享受积分和优惠
            </p>

            <FormSubmitFeedback submitting={submitting} error={submitError || localError} success={submitSuccess} />

            <form
              onSubmit={async (e) => {
                e.preventDefault();
                setLocalError(undefined);
                setSubmitError(undefined);
                setSubmitSuccess(undefined);
                const result = await handleSubmit();
                if (result) {
                  setSubmitSuccess('注册成功');
                }
              }}
              style={{ display: 'flex', flexDirection: 'column', gap: 16 }}
            >
              <FormField
                label="手机号"
                required
                error={fieldErrors.mobile}
              >
                <input
                  type="tel"
                  placeholder="请输入11位手机号"
                  maxLength={11}
                  value={formData.mobile}
                  onChange={(e) => handleFieldChange('mobile', e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: 8,
                    border: fieldErrors.mobile ? '1px solid #ef4444' : '1px solid #334155',
                    background: '#1e293b',
                    color: '#f1f5f9',
                    fontSize: 14,
                    outline: 'none',
                  }}
                />
              </FormField>

              <FormField
                label="验证码"
                required
                error={fieldErrors.code}
              >
                <div style={{ display: 'flex', gap: 8 }}>
                  <input
                    type="text"
                    placeholder="6位验证码"
                    maxLength={6}
                    value={formData.code}
                    onChange={(e) => handleFieldChange('code', e.target.value)}
                    style={{
                      flex: 1,
                      padding: '10px 12px',
                      borderRadius: 8,
                      border: fieldErrors.code ? '1px solid #ef4444' : '1px solid #334155',
                      background: '#1e293b',
                      color: '#f1f5f9',
                      fontSize: 14,
                      outline: 'none',
                    }}
                  />
                  <button
                    type="button"
                    disabled={countdown > 0}
                    onClick={handleSendCode}
                    style={{
                      padding: '10px 16px',
                      borderRadius: 8,
                      border: 'none',
                      background: countdown > 0 ? '#334155' : '#3b82f6',
                      color: countdown > 0 ? '#64748b' : '#fff',
                      fontSize: 13,
                      whiteSpace: 'nowrap',
                      cursor: countdown > 0 ? 'not-allowed' : 'pointer',
                    }}
                  >
                    {countdown > 0 ? `${countdown}s` : '获取验证码'}
                  </button>
                </div>
              </FormField>

              <FormField
                label="昵称"
                required
                error={fieldErrors.nickname}
              >
                <input
                  type="text"
                  placeholder="请输入您的昵称"
                  maxLength={20}
                  value={formData.nickname}
                  onChange={(e) => handleFieldChange('nickname', e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: 8,
                    border: fieldErrors.nickname ? '1px solid #ef4444' : '1px solid #334155',
                    background: '#1e293b',
                    color: '#f1f5f9',
                    fontSize: 14,
                    outline: 'none',
                  }}
                />
              </FormField>

              <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', color: '#cbd5e1', fontSize: 13 }}>
                <input
                  type="checkbox"
                  checked={formData.agreeTerms}
                  onChange={(e) => handleFieldChange('agreeTerms', e.target.checked)}
                  style={{ accentColor: '#3b82f6' }}
                />
                <span>
                  我已阅读并同意{' '}
                  <Link href="/terms" style={{ color: '#60a5fa', textDecoration: 'underline' }}>
                    服务条款
                  </Link>
                  {' '}和{' '}
                  <Link href="/privacy" style={{ color: '#60a5fa', textDecoration: 'underline' }}>
                    隐私政策
                  </Link>
                </span>
              </label>
              {fieldErrors.agreeTerms && (
                <p style={{ color: '#ef4444', fontSize: 12, margin: 0 }}>{fieldErrors.agreeTerms}</p>
              )}

              <SubmitButton
                loading={submitting}
                style={{
                  marginTop: 8,
                  padding: '12px 0',
                  borderRadius: 8,
                  border: 'none',
                  background: submitting ? '#334155' : '#3b82f6',
                  color: '#fff',
                  fontSize: 16,
                  fontWeight: 600,
                  cursor: submitting ? 'not-allowed' : 'pointer',
                  transition: 'background 0.2s',
                }}
              >
                注册会员
              </SubmitButton>
            </form>

            <p style={{ textAlign: 'center', marginTop: 24, color: '#64748b', fontSize: 13 }}>
              已有账号？{' '}
              <Link href="/member-login" style={{ color: '#60a5fa', textDecoration: 'underline' }}>
                立即登录
              </Link>
            </p>
          </div>

          {/* 右侧: 统计 + 权益 + 最近注册 */}
          <div>
            <RegistrationStatsPanel stats={MOCK_STATS} />
            <PromotionBannerRow promotions={MOCK_PROMOTIONS} />
            <RegistrationSteps />
            <RecentRegistrationTable records={MOCK_RECORDS} />
          </div>
        </div>
      </div>
    </main>
  );
}
