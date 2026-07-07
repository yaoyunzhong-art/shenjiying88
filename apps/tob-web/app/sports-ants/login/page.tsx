/**
 * 运动蚂蚁管理员登录页面
 * BigAnts Admin Login
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

export default function LoginPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    phone: '',
    password: '',
    rememberMe: false,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!formData.phone) {
      setError('请输入手机号');
      return;
    }
    if (!formData.password) {
      setError('请输入密码');
      return;
    }

    setIsSubmitting(true);

    try {
      // 模拟登录请求
      await new Promise(resolve => setTimeout(resolve, 1500));

      // 登录成功后跳转到控制台
      router.push('/sports-ants/console');
    } catch (err) {
      setError('登录失败，请检查账号密码');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <SEOMeta
        title="管理员登录 - 运动蚂蚁"
        description="运动蚂蚁企业管理员登录"
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
              管理员登录
            </h1>
            <p
              style={{
                fontFamily: BigAntsFonts.chinese,
                fontSize: '14px',
                color: '#666666',
              }}
            >
              没有账户？{' '}
              <Link
                href="/sports-ants/register"
                style={{
                  color: BigAntsColors.primary,
                  textDecoration: 'none',
                  fontWeight: 600,
                }}
              >
                立即注册
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
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    fontFamily: BigAntsFonts.chinese,
                    fontSize: '14px',
                    fontWeight: 600,
                    color: '#1A1A2E',
                    marginBottom: '8px',
                  }}
                >
                  <span>密码</span>
                  <Link
                    href="/sports-ants/forgot-password"
                    style={{
                      fontFamily: BigAntsFonts.chinese,
                      fontSize: '14px',
                      fontWeight: 500,
                      color: BigAntsColors.primary,
                      textDecoration: 'none',
                    }}
                  >
                    忘记密码？
                  </Link>
                </label>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="请输入密码"
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

              {/* Remember Me */}
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
                    name="rememberMe"
                    checked={formData.rememberMe}
                    onChange={handleChange}
                    style={{
                      width: '18px',
                      height: '18px',
                      accentColor: BigAntsColors.primary,
                    }}
                  />
                  <span style={{ fontFamily: BigAntsFonts.chinese, fontSize: '14px', color: '#666666' }}>
                    记住我
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
                {isSubmitting ? '登录中...' : '登录'}
              </button>
            </form>

            {/* Divider */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: BigAntsSpacing.md,
                margin: `${BigAntsSpacing.xl} 0`,
              }}
            >
              <div style={{ flex: 1, height: '1px', background: '#E2E8F0' }} />
              <span
                style={{
                  fontFamily: BigAntsFonts.chinese,
                  fontSize: '12px',
                  color: '#999999',
                }}
              >
                或
              </span>
              <div style={{ flex: 1, height: '1px', background: '#E2E8F0' }} />
            </div>

            {/* Register Link */}
            <Link
              href="/sports-ants/register"
              style={{
                display: 'block',
                width: '100%',
                padding: '14px',
                background: '#F1F5F9',
                color: '#1A1A2E',
                fontFamily: BigAntsFonts.chinese,
                fontSize: '16px',
                fontWeight: 600,
                borderRadius: BigAntsRadius.md,
                textAlign: 'center',
                textDecoration: 'none',
              }}
            >
              立即注册
            </Link>
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
            登录即表示您同意我们的{' '}
            <Link href="/sports-ants/terms" style={{ color: BigAntsColors.primary, textDecoration: 'none' }}>
              服务条款
            </Link>
            {' '}和{' '}
            <Link href="/sports-ants/privacy" style={{ color: BigAntsColors.primary, textDecoration: 'none' }}>
              隐私政策
            </Link>
          </p>
        </div>

        <FloatingContact />
        <Footer />
      </div>
    </>
  );
}
