/**
 * 会员注册 — Member Registration Page (Next.js App Router Page)
 * 角色视角: 👤 前台顾客 / 🛒 导购员协助
 * 功能: 表单验证、短信验证码、提交
 */
'use client';

import React, { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  FormField,

  SubmitButton,
  FormSubmitFeedback,
} from '@m5/ui';
import { memberAuthService } from '../../lib/member-auth-service';

// ---- 组件 ----

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

    // 模拟提交延迟
    await new Promise((r) => setTimeout(r, 800));

    // 模拟随机失败（测试错误处理）
    if (Math.random() < 0.08) {
      throw new Error('注册服务暂时不可用，请稍后重试');
    }

    // 调用 authService（模拟）
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
      // 清除对应字段错误
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
      <div style={{ maxWidth: 420, margin: '0 auto', padding: '40px 16px', width: '100%' }}>
        <h1 style={{ color: '#f1f5f9', fontSize: 24, fontWeight: 700, marginBottom: 8, textAlign: 'center' }}>
          会员注册
        </h1>
        <p style={{ color: '#64748b', fontSize: 14, textAlign: 'center', marginBottom: 32 }}>
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
    </main>
  );
}
