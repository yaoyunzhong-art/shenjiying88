/**
 * 运动蚂蚁忘记密码页面
 * BigAnts Forgot Password
 */

'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import SEOMeta from '../components/seo/SEOMeta';
import Header from '../components/Header';
import Footer from '../components/Footer';
import FloatingContact from '../components/FloatingContact';
import { BigAntsColors, BigAntsRadius, BigAntsShadows, BigAntsSpacing, BigAntsTransitions, BigAntsFonts } from '../lib/bigants-design';

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [step, setStep] = useState<'verify' | 'reset'>('verify');
  const [formData, setFormData] = useState({
    phone: '',
    verificationCode: '',
    password: '',
    confirmPassword: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [countdown, setCountdown] = useState(0);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSendCode = () => {
    if (!formData.phone) {
      setError('请输入手机号');
      return;
    }
    if (!/^1[3-9]\d{9}$/.test(formData.phone)) {
      setError('请输入正确的手机号');
      return;
    }
    setCountdown(60);
    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!formData.phone) {
      setError('请输入手机号');
      return;
    }
    if (!formData.verificationCode) {
      setError('请输入验证码');
      return;
    }

    setIsSubmitting(true);
    try {
      // 模拟验证请求
      await new Promise(resolve => setTimeout(resolve, 1000));
      setStep('reset');
    } catch (err) {
      setError('验证失败，请检查验证码');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!formData.password) {
      setError('请输入新密码');
      return;
    }
    if (formData.password.length < 6) {
      setError('密码长度不能少于6位');
      return;
    }
    if (formData.password !== formData.confirmPassword) {
      setError('两次输入的密码不一致');
      return;
    }

    setIsSubmitting(true);
    try {
      // 模拟重置密码请求
      await new Promise(resolve => setTimeout(resolve, 1000));
      // 跳转到登录页
      router.push('/sports-ants/login');
    } catch (err) {
      setError('密码重置失败，请稍后重试');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <SEOMeta
        title="忘记密码 - 运动蚂蚁"
        description="重置您的运动蚂蚁账户密码"
      />

      <div style={{ minHeight: '100vh', background: '#F8FAFC' }}>
        <Header />

        <div
          style={{
            maxWidth: '420px',
            margin: '0 auto',
            padding: `${BigAntsSpacing['4xl']} ${BigAntsSpacing.lg}`,
          }}
        >
          {/* Page Title */}
          <div style={{ textAlign: 'center', marginBottom: BigAntsSpacing['2xl'] }}>
            <h1
              style={{
                fontFamily: BigAntsFonts.display,
                fontSize: '28px',
                fontWeight: 700,
                color: '#1A1A2E',
                marginBottom: BigAntsSpacing.sm,
              }}
            >
              {step === 'verify' ? '验证身份' : '设置新密码'}
            </h1>
            <p
              style={{
                fontFamily: BigAntsFonts.chinese,
                fontSize: '14px',
                color: '#666666',
              }}
            >
              {step === 'verify' ? '请输入注册时绑定的手机号' : '请设置您的新密码'}
            </p>
          </div>

          {/* Form */}
          <div
            style={{
              padding: BigAntsSpacing['2xl'],
              background: '#FFFFFF',
              borderRadius: BigAntsRadius.xl,
              boxShadow: BigAntsShadows.lg,
            }}
          >
            {step === 'verify' ? (
              <form onSubmit={handleVerify}>
                {/* Error Message */}
                {error && (
                  <div
                    style={{
                      padding: '12px 16px',
                      background: '#FF475720',
                      border: '1px solid #FF4757',
                      borderRadius: BigAntsRadius.md,
                      marginBottom: BigAntsSpacing.lg,
                      fontFamily: BigAntsFonts.chinese,
                      fontSize: '14px',
                      color: '#FF4757',
                    }}
                  >
                    {error}
                  </div>
                )}

                {/* Phone */}
                <div style={{ marginBottom: BigAntsSpacing.lg }}>
                  <label
                    style={{
                      display: 'block',
                      fontFamily: BigAntsFonts.chinese,
                      fontSize: '14px',
                      fontWeight: 600,
                      color: '#1A1A2E',
                      marginBottom: '8px',
                    }}
                  >
                    手机号
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="请输入手机号"
                    maxLength={11}
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      border: '1px solid #E2E8F0',
                      borderRadius: BigAntsRadius.md,
                      fontFamily: BigAntsFonts.chinese,
                      fontSize: '14px',
                      outline: 'none',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>

                {/* Verification Code */}
                <div style={{ marginBottom: BigAntsSpacing.xl }}>
                  <label
                    style={{
                      display: 'block',
                      fontFamily: BigAntsFonts.chinese,
                      fontSize: '14px',
                      fontWeight: 600,
                      color: '#1A1A2E',
                      marginBottom: '8px',
                    }}
                  >
                    验证码
                  </label>
                  <div style={{ display: 'flex', gap: BigAntsSpacing.sm }}>
                    <input
                      type="text"
                      name="verificationCode"
                      value={formData.verificationCode}
                      onChange={handleChange}
                      placeholder="请输入验证码"
                      maxLength={6}
                      style={{
                        flex: 1,
                        padding: '12px 16px',
                        border: '1px solid #E2E8F0',
                        borderRadius: BigAntsRadius.md,
                        fontFamily: BigAntsFonts.chinese,
                        fontSize: '14px',
                        outline: 'none',
                        boxSizing: 'border-box',
                      }}
                    />
                    <button
                      type="button"
                      onClick={handleSendCode}
                      disabled={countdown > 0}
                      style={{
                        padding: '12px 16px',
                        background: countdown > 0 ? '#F1F5F9' : BigAntsColors.primary,
                        color: countdown > 0 ? '#999999' : '#FFFFFF',
                        fontFamily: BigAntsFonts.chinese,
                        fontSize: '14px',
                        fontWeight: 600,
                        borderRadius: BigAntsRadius.md,
                        border: 'none',
                        cursor: countdown > 0 ? 'not-allowed' : 'pointer',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {countdown > 0 ? `${countdown}s后重发` : '获取验证码'}
                    </button>
                  </div>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={isSubmitting}
                  style={{
                    width: '100%',
                    padding: '14px',
                    background: isSubmitting ? '#A0A0A0' : BigAntsColors.primary,
                    color: '#FFFFFF',
                    fontFamily: BigAntsFonts.chinese,
                    fontSize: '16px',
                    fontWeight: 600,
                    borderRadius: BigAntsRadius.md,
                    border: 'none',
                    cursor: isSubmitting ? 'not-allowed' : 'pointer',
                  }}
                >
                  {isSubmitting ? '验证中...' : '下一步'}
                </button>
              </form>
            ) : (
              <form onSubmit={handleReset}>
                {/* Success Message */}
                <div
                  style={{
                    padding: '12px 16px',
                    background: '#07C16020',
                    border: '1px solid #07C160',
                    borderRadius: BigAntsRadius.md,
                    marginBottom: BigAntsSpacing.lg,
                    fontFamily: BigAntsFonts.chinese,
                    fontSize: '14px',
                    color: '#07C160',
                  }}
                >
                  验证成功，请设置您的新密码
                </div>

                {/* Error Message */}
                {error && (
                  <div
                    style={{
                      padding: '12px 16px',
                      background: '#FF475720',
                      border: '1px solid #FF4757',
                      borderRadius: BigAntsRadius.md,
                      marginBottom: BigAntsSpacing.lg,
                      fontFamily: BigAntsFonts.chinese,
                      fontSize: '14px',
                      color: '#FF4757',
                    }}
                  >
                    {error}
                  </div>
                )}

                {/* New Password */}
                <div style={{ marginBottom: BigAntsSpacing.lg }}>
                  <label
                    style={{
                      display: 'block',
                      fontFamily: BigAntsFonts.chinese,
                      fontSize: '14px',
                      fontWeight: 600,
                      color: '#1A1A2E',
                      marginBottom: '8px',
                    }}
                  >
                    新密码
                  </label>
                  <input
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="请输入新密码（至少6位）"
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      border: '1px solid #E2E8F0',
                      borderRadius: BigAntsRadius.md,
                      fontFamily: BigAntsFonts.chinese,
                      fontSize: '14px',
                      outline: 'none',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>

                {/* Confirm Password */}
                <div style={{ marginBottom: BigAntsSpacing.xl }}>
                  <label
                    style={{
                      display: 'block',
                      fontFamily: BigAntsFonts.chinese,
                      fontSize: '14px',
                      fontWeight: 600,
                      color: '#1A1A2E',
                      marginBottom: '8px',
                    }}
                  >
                    确认新密码
                  </label>
                  <input
                    type="password"
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    placeholder="请再次输入新密码"
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      border: '1px solid #E2E8F0',
                      borderRadius: BigAntsRadius.md,
                      fontFamily: BigAntsFonts.chinese,
                      fontSize: '14px',
                      outline: 'none',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={isSubmitting}
                  style={{
                    width: '100%',
                    padding: '14px',
                    background: isSubmitting ? '#A0A0A0' : BigAntsColors.primary,
                    color: '#FFFFFF',
                    fontFamily: BigAntsFonts.chinese,
                    fontSize: '16px',
                    fontWeight: 600,
                    borderRadius: BigAntsRadius.md,
                    border: 'none',
                    cursor: isSubmitting ? 'not-allowed' : 'pointer',
                  }}
                >
                  {isSubmitting ? '提交中...' : '确认重置'}
                </button>
              </form>
            )}

            {/* Back to Login */}
            <div style={{ marginTop: BigAntsSpacing.lg, textAlign: 'center' }}>
              <Link
                href="/sports-ants/login"
                style={{
                  fontFamily: BigAntsFonts.chinese,
                  fontSize: '14px',
                  color: BigAntsColors.primary,
                  textDecoration: 'none',
                }}
              >
                返回登录
              </Link>
            </div>
          </div>
        </div>

        <FloatingContact />
        <Footer />
      </div>
    </>
  );
}
