/**
 * 运动蚂蚁账户注册页面
 * BigAnts Account Registration
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

export default function RegisterPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    companyName: '',
    contactName: '',
    phone: '',
    password: '',
    confirmPassword: '',
    verificationCode: '',
    agreeTerms: false,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [countdown, setCountdown] = useState(0);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!formData.companyName) {
      setError('请输入公司名称');
      return;
    }
    if (!formData.contactName) {
      setError('请输入联系人姓名');
      return;
    }
    if (!formData.phone) {
      setError('请输入手机号');
      return;
    }
    if (!formData.password) {
      setError('请输入密码');
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
    if (!formData.verificationCode) {
      setError('请输入验证码');
      return;
    }
    if (!formData.agreeTerms) {
      setError('请同意用户协议和隐私政策');
      return;
    }

    setIsSubmitting(true);

    try {
      // 模拟注册请求
      await new Promise(resolve => setTimeout(resolve, 1500));

      // 注册成功后跳转到控制台
      router.push('/sports-ants/console');
    } catch (err) {
      setError('注册失败，请稍后重试');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <SEOMeta
        title="注册账户 - 运动蚂蚁"
        description="注册运动蚂蚁企业账户，开启数字运动事业"
      />

      <div style={{ minHeight: '100vh', background: '#F8FAFC' }}>
        <Header />

        <div
          style={{
            maxWidth: '480px',
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
              创建企业账户
            </h1>
            <p
              style={{
                fontFamily: BigAntsFonts.chinese,
                fontSize: '14px',
                color: '#666666',
              }}
            >
              已有账户？{' '}
              <Link
                href="/sports-ants/login"
                style={{
                  color: BigAntsColors.primary,
                  textDecoration: 'none',
                  fontWeight: 600,
                }}
              >
                立即登录
              </Link>
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
            <form onSubmit={handleSubmit}>
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

              {/* Company Name */}
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
                  公司名称 <span style={{ color: '#FF4757' }}>*</span>
                </label>
                <input
                  type="text"
                  name="companyName"
                  value={formData.companyName}
                  onChange={handleChange}
                  placeholder="请输入公司名称"
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    border: '1px solid #E2E8F0',
                    borderRadius: BigAntsRadius.md,
                    fontFamily: BigAntsFonts.chinese,
                    fontSize: '14px',
                    outline: 'none',
                    boxSizing: 'border-box',
                    transition: `border-color ${BigAntsTransitions.fast}`,
                  }}
                  onFocus={(e) => e.target.style.borderColor = BigAntsColors.primary}
                  onBlur={(e) => e.target.style.borderColor = '#E2E8F0'}
                />
              </div>

              {/* Contact Name */}
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
                  联系人姓名 <span style={{ color: '#FF4757' }}>*</span>
                </label>
                <input
                  type="text"
                  name="contactName"
                  value={formData.contactName}
                  onChange={handleChange}
                  placeholder="请输入联系人姓名"
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    border: '1px solid #E2E8F0',
                    borderRadius: BigAntsRadius.md,
                    fontFamily: BigAntsFonts.chinese,
                    fontSize: '14px',
                    outline: 'none',
                    boxSizing: 'border-box',
                    transition: `border-color ${BigAntsTransitions.fast}`,
                  }}
                  onFocus={(e) => e.target.style.borderColor = BigAntsColors.primary}
                  onBlur={(e) => e.target.style.borderColor = '#E2E8F0'}
                />
              </div>

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
                  手机号 <span style={{ color: '#FF4757' }}>*</span>
                </label>
                <div style={{ display: 'flex', gap: BigAntsSpacing.sm }}>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="请输入手机号"
                    maxLength={11}
                    style={{
                      flex: 1,
                      padding: '12px 16px',
                      border: '1px solid #E2E8F0',
                      borderRadius: BigAntsRadius.md,
                      fontFamily: BigAntsFonts.chinese,
                      fontSize: '14px',
                      outline: 'none',
                      boxSizing: 'border-box',
                      transition: `border-color ${BigAntsTransitions.fast}`,
                    }}
                    onFocus={(e) => e.target.style.borderColor = BigAntsColors.primary}
                    onBlur={(e) => e.target.style.borderColor = '#E2E8F0'}
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

              {/* Verification Code */}
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
                  验证码 <span style={{ color: '#FF4757' }}>*</span>
                </label>
                <input
                  type="text"
                  name="verificationCode"
                  value={formData.verificationCode}
                  onChange={handleChange}
                  placeholder="请输入验证码"
                  maxLength={6}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    border: '1px solid #E2E8F0',
                    borderRadius: BigAntsRadius.md,
                    fontFamily: BigAntsFonts.chinese,
                    fontSize: '14px',
                    outline: 'none',
                    boxSizing: 'border-box',
                    transition: `border-color ${BigAntsTransitions.fast}`,
                  }}
                  onFocus={(e) => e.target.style.borderColor = BigAntsColors.primary}
                  onBlur={(e) => e.target.style.borderColor = '#E2E8F0'}
                />
              </div>

              {/* Password */}
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
                  密码 <span style={{ color: '#FF4757' }}>*</span>
                </label>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="请输入密码（至少6位）"
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    border: '1px solid #E2E8F0',
                    borderRadius: BigAntsRadius.md,
                    fontFamily: BigAntsFonts.chinese,
                    fontSize: '14px',
                    outline: 'none',
                    boxSizing: 'border-box',
                    transition: `border-color ${BigAntsTransitions.fast}`,
                  }}
                  onFocus={(e) => e.target.style.borderColor = BigAntsColors.primary}
                  onBlur={(e) => e.target.style.borderColor = '#E2E8F0'}
                />
              </div>

              {/* Confirm Password */}
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
                  确认密码 <span style={{ color: '#FF4757' }}>*</span>
                </label>
                <input
                  type="password"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  placeholder="请再次输入密码"
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    border: '1px solid #E2E8F0',
                    borderRadius: BigAntsRadius.md,
                    fontFamily: BigAntsFonts.chinese,
                    fontSize: '14px',
                    outline: 'none',
                    boxSizing: 'border-box',
                    transition: `border-color ${BigAntsTransitions.fast}`,
                  }}
                  onFocus={(e) => e.target.style.borderColor = BigAntsColors.primary}
                  onBlur={(e) => e.target.style.borderColor = '#E2E8F0'}
                />
              </div>

              {/* Terms */}
              <div style={{ marginBottom: BigAntsSpacing.xl }}>
                <label
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    cursor: 'pointer',
                  }}
                >
                  <input
                    type="checkbox"
                    name="agreeTerms"
                    checked={formData.agreeTerms}
                    onChange={handleChange}
                    style={{
                      width: '18px',
                      height: '18px',
                      accentColor: BigAntsColors.primary,
                    }}
                  />
                  <span style={{ fontFamily: BigAntsFonts.chinese, fontSize: '14px', color: '#666666' }}>
                    我已阅读并同意{' '}
                    <Link href="/sports-ants/terms" style={{ color: BigAntsColors.primary, textDecoration: 'none' }}>
                      《用户协议》
                    </Link>
                    {' '}和{' '}
                    <Link href="/sports-ants/privacy" style={{ color: BigAntsColors.primary, textDecoration: 'none' }}>
                      《隐私政策》
                    </Link>
                  </span>
                </label>
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
                  transition: `all ${BigAntsTransitions.fast}`,
                }}
                onMouseEnter={(e) => {
                  if (!isSubmitting) e.currentTarget.style.transform = 'translateY(-2px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
              >
                {isSubmitting ? '注册中...' : '立即注册'}
              </button>
            </form>
          </div>

          {/* Footer Note */}
          <p
            style={{
              marginTop: BigAntsSpacing.lg,
              fontFamily: BigAntsFonts.chinese,
              fontSize: '12px',
              color: '#999999',
              textAlign: 'center',
            }}
          >
            注册即表示您同意我们的服务条款和隐私政策
          </p>
        </div>

        <FloatingContact />
        <Footer />
      </div>
    </>
  );
}
