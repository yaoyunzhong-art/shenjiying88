'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FormField, useFormSubmit, FormSubmitFeedback, SubmitButton } from '@m5/ui';
import { enterpriseAuthService, type EnterpriseRegisterResponse } from '../../../lib/enterprise-auth-service';
import { useEnterpriseFormFields } from '../lib/use-enterprise-form-fields';
import {
  email as emailValidator,
  passwordMin,
  mobileCN,
  required,
  matches,
} from '../lib/enterprise-validators';
import { EnterpriseAuthPage } from '../components/EnterpriseAuthPage';
import { enterpriseInputStyle } from '../components/enterprise-input-style';

type RegisterFields = {
  email: string;
  password: string;
  confirmPassword: string;
  companyName: string;
  contactPerson: string;
  mobile: string;
};

export default function EnterpriseRegisterPage() {
  const router = useRouter();
  const { values, fieldErrors, handleChange, validate } =
    useEnterpriseFormFields<RegisterFields>({
      email: '',
      password: '',
      confirmPassword: '',
      companyName: '',
      contactPerson: '',
      mobile: '',
    });

  const { state, submit } = useFormSubmit<EnterpriseRegisterResponse>({
    onSubmit: async () => {
      const result = await enterpriseAuthService.register({
        email: values.email,
        password: values.password,
        confirmPassword: values.confirmPassword,
        companyName: values.companyName,
        contactPerson: values.contactPerson,
        mobile: values.mobile,
      });

      if (result.success && result.data) {
        // 注册成功，跳转到登录页
        router.push('/enterprise/login?registered=true');
      }

      if (!result.success) {
        throw new Error(result.error?.message ?? '注册失败');
      }

      return result;
    },
    successMessage: () => '注册成功，即将跳转到登录页...',
    defaultErrorMessage: '注册失败，请稍后重试',
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const ok = validate({
      email: emailValidator,
      password: passwordMin(8),
      confirmPassword: matches('password', '密码'),
      companyName: required('企业名称'),
      contactPerson: required('联系人姓名'),
      mobile: mobileCN,
    });

    if (!ok) return;
    submit();
  }

  return (
    <EnterpriseAuthPage
      title="企业用户注册"
      subtitle="创建您的神机营 SaaS 企业账号"
      variant="top-aligned"
      cardMaxWidth={520}
      footerPosition="inline"
      headerExtra={
        <Link href="/enterprise/login" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, marginBottom: 24, color: '#94a3b8', textDecoration: 'none', fontSize: 14 }}>
          <span>←</span> 返回登录
        </Link>
      }
    >
      {/* 注册表单 */}
      <form onSubmit={handleSubmit} style={{ display: 'grid', gap: 18 }}>
        <FormField
          label="企业邮箱"
          error={fieldErrors.email}
          required
          disabled={state.isSubmitting}
        >
          <input
            type="email"
            value={values.email}
            onChange={handleChange('email')}
            disabled={state.isSubmitting}
            placeholder="admin@company.com"
            style={enterpriseInputStyle}
            autoComplete="email"
          />
        </FormField>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <FormField
            label="密码"
            error={fieldErrors.password}
            required
            disabled={state.isSubmitting}
          >
            <input
              type="password"
              value={values.password}
              onChange={handleChange('password')}
              disabled={state.isSubmitting}
              placeholder="8-20位"
              style={enterpriseInputStyle}
              autoComplete="new-password"
            />
          </FormField>

          <FormField
            label="确认密码"
            error={fieldErrors.confirmPassword}
            required
            disabled={state.isSubmitting}
          >
            <input
              type="password"
              value={values.confirmPassword}
              onChange={handleChange('confirmPassword')}
              disabled={state.isSubmitting}
              placeholder="再次输入"
              style={enterpriseInputStyle}
              autoComplete="new-password"
            />
          </FormField>
        </div>

        <FormField
          label="企业名称"
          error={fieldErrors.companyName}
          required
          disabled={state.isSubmitting}
          helper="请输入公司全称"
        >
          <input
            type="text"
            value={values.companyName}
            onChange={handleChange('companyName')}
            disabled={state.isSubmitting}
            placeholder="深圳市某某科技有限公司"
            style={enterpriseInputStyle}
          />
        </FormField>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <FormField
            label="联系人"
            error={fieldErrors.contactPerson}
            required
            disabled={state.isSubmitting}
          >
            <input
              type="text"
              value={values.contactPerson}
              onChange={handleChange('contactPerson')}
              disabled={state.isSubmitting}
              placeholder="张三"
              style={enterpriseInputStyle}
            />
          </FormField>

          <FormField
            label="手机号"
            error={fieldErrors.mobile}
            required
            disabled={state.isSubmitting}
          >
            <input
              type="tel"
              value={values.mobile}
              onChange={handleChange('mobile')}
              disabled={state.isSubmitting}
              placeholder="13800138000"
              style={enterpriseInputStyle}
              autoComplete="tel"
            />
          </FormField>
        </div>

        {/* 服务条款 */}
        <label style={{ display: 'flex', alignItems: 'flex-start', gap: 10, fontSize: 13, color: '#94a3b8', cursor: state.isSubmitting ? 'not-allowed' : 'pointer', marginTop: 8 }}>
          <input
            type="checkbox"
            disabled={state.isSubmitting}
            style={{ marginTop: 3, accentColor: '#667eea' }}
          />
          <span>
            我已阅读并同意<a href="#" style={{ color: '#667eea', textDecoration: 'none' }}>《服务条款》</a>和<a href="#" style={{ color: '#667eea', textDecoration: 'none' }}>《隐私政策》</a>
          </span>
        </label>

        <SubmitButton
          loading={state.isSubmitting}
          label="立即注册"
          loadingLabel="注册中..."
          variant="primary"
          style={{ marginTop: 8 }}
        />
      </form>

      <div style={{ marginTop: 20 }}>
        <FormSubmitFeedback state={state} onRetry={() => submit()} />
      </div>

      <div style={{ textAlign: 'center', marginTop: 20 }}>
        <span style={{ fontSize: 14, color: '#94a3b8' }}>已有账号？</span>
        <Link href="/enterprise/login" style={{ marginLeft: 8, fontSize: 14, color: '#667eea', textDecoration: 'none', fontWeight: 500 }}>
          立即登录
        </Link>
      </div>
    </EnterpriseAuthPage>
  );
}
