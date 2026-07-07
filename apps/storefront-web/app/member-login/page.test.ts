import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

describe('MemberLoginPage structure', () => {
  // Page file exists
  it('should have the page file', async () => {
    const fs = await import('fs');
    const exists = fs.existsSync(
      new URL('./page.tsx', import.meta.url).pathname
    );
    assert.equal(exists, true);
  });

  // Page exports a default function
  it('should export default function component', async () => {
    const mod = await import('./page.tsx');
    assert.equal(typeof mod.default, 'function');
  });

  // Verify source contains core imports
  it('should contain expected imports in page source', async () => {
    const fs = await import('fs');
    const source = fs.readFileSync(
      new URL('./page.tsx', import.meta.url).pathname,
      'utf-8'
    );

    assert.ok(source.includes("'use client'"), 'Missing use client directive');
    assert.ok(source.includes('FormField'), 'Missing FormField import');
    assert.ok(source.includes('useFormSubmit'), 'Missing useFormSubmit import');
    assert.ok(source.includes('FormSubmitFeedback'), 'Missing FormSubmitFeedback import');
    assert.ok(source.includes('SubmitButton'), 'Missing SubmitButton import');
    assert.ok(source.includes('@m5/ui'), 'Missing @m5/ui import');
    assert.ok(source.includes('memberAuthService'), 'Missing memberAuthService import');
    assert.ok(source.includes('next/link'), 'Missing next/link import');
    assert.ok(source.includes('next/navigation'), 'Missing next/navigation import');
  });

  // Verify UI text content
  it('should contain expected UI text', async () => {
    const fs = await import('fs');
    const source = fs.readFileSync(
      new URL('./page.tsx', import.meta.url).pathname,
      'utf-8'
    );

    assert.ok(source.includes('会员登录'), 'Missing title');
    assert.ok(source.includes('神机营 SaaS 会员服务'), 'Missing subtitle');
    assert.ok(source.includes('手机号'), 'Missing mobile label');
    assert.ok(source.includes('验证码'), 'Missing code label');
    assert.ok(source.includes('获取验证码'), 'Missing send code button');
    assert.ok(source.includes('立即注册'), 'Missing register link');
    assert.ok(source.includes('微信一键登录'), 'Missing wechat login');
    assert.ok(source.includes('还没有会员账号？'), 'Missing no-account prompt');
  });

  // Verify input handling
  it('should handle phone validation', async () => {
    const fs = await import('fs');
    const source = fs.readFileSync(
      new URL('./page.tsx', import.meta.url).pathname,
      'utf-8'
    );

    assert.ok(source.includes('1[3-9]\\d{9}'), 'Missing phone regex');
    assert.ok(source.includes('请输入有效的手机号'), 'Missing phone error message');
    assert.ok(source.includes('请输入6位验证码'), 'Missing code error message');
    assert.ok(source.includes('.replace(/'), 'Missing replace filter for input');
  });

  // Verify state management
  it('should manage login state correctly', async () => {
    const fs = await import('fs');
    const source = fs.readFileSync(
      new URL('./page.tsx', import.meta.url).pathname,
      'utf-8'
    );

    assert.ok(source.includes('useState'), 'Missing useState');
    assert.ok(source.includes('setMobile'), 'Missing setMobile');
    assert.ok(source.includes('setCode'), 'Missing setCode');
    assert.ok(source.includes('setCodeSent'), 'Missing setCodeSent');
    assert.ok(source.includes('setCountdown'), 'Missing setCountdown');
    assert.ok(source.includes('setFieldErrors'), 'Missing setFieldErrors');
  });

  // Verify countdown timer
  it('should implement countdown for SMS code', async () => {
    const fs = await import('fs');
    const source = fs.readFileSync(
      new URL('./page.tsx', import.meta.url).pathname,
      'utf-8'
    );

    assert.ok(source.includes('setInterval'), 'Missing setInterval for countdown');
    assert.ok(source.includes('clearInterval'), 'Missing clearInterval');
    assert.ok(source.includes('countdown > 0'), 'Missing countdown condition');
    assert.ok(source.includes('countdown'), 'Missing countdown variable');
  });

  // Verify form submit logic
  it('should handle form submission', async () => {
    const fs = await import('fs');
    const source = fs.readFileSync(
      new URL('./page.tsx', import.meta.url).pathname,
      'utf-8'
    );

    assert.ok(source.includes('handleSubmit'), 'Missing handleSubmit');
    assert.ok(source.includes('onSubmit'), 'Missing onSubmit');
    assert.ok(source.includes('isSubmitting'), 'Missing isSubmitting state');
    assert.ok(source.includes('submit()'), 'Missing submit call');
  });

  // Verify API integration
  it('should integrate with auth service', async () => {
    const fs = await import('fs');
    const source = fs.readFileSync(
      new URL('./page.tsx', import.meta.url).pathname,
      'utf-8'
    );

    assert.ok(source.includes('.login('), 'Missing login call');
    assert.ok(source.includes('memberAuthService'), 'Missing service usage');
    assert.ok(source.includes('sendSmsCode'), 'Missing sendSmsCode call');
    assert.ok(source.includes('localStorage'), 'Missing localStorage usage');
    assert.ok(source.includes('member_access_token'), 'Missing access token key');
    assert.ok(source.includes('member_refresh_token'), 'Missing refresh token key');
    assert.ok(source.includes('member_info'), 'Missing member info key');
  });

  // Verify redirect after login
  it('should redirect to member center after login', async () => {
    const fs = await import('fs');
    const source = fs.readFileSync(
      new URL('./page.tsx', import.meta.url).pathname,
      'utf-8'
    );

    assert.ok(source.includes('router.push'), 'Missing router push');
    assert.ok(source.includes('/member-center'), 'Missing redirect path');
  });

  // Verify error handling
  it('should handle login errors', async () => {
    const fs = await import('fs');
    const source = fs.readFileSync(
      new URL('./page.tsx', import.meta.url).pathname,
      'utf-8'
    );

    assert.ok(source.includes('throw new Error'), 'Missing error throw');
    assert.ok(source.includes('登录失败'), 'Missing error message');
    assert.ok(source.includes('defaultErrorMessage'), 'Missing default error');
  });

  // Verify wechat login section
  it('should have wechat login section', async () => {
    const fs = await import('fs');
    const source = fs.readFileSync(
      new URL('./page.tsx', import.meta.url).pathname,
      'utf-8'
    );

    assert.ok(source.includes('其他登录方式'), 'Missing other login prompt');
    assert.ok(source.includes('微信'), 'Missing wechat icon');
  });

  // Verify layout and styling
  it('should have proper layout and copyright', async () => {
    const fs = await import('fs');
    const source = fs.readFileSync(
      new URL('./page.tsx', import.meta.url).pathname,
      'utf-8'
    );

    assert.ok(source.includes('placeItems:'), 'Missing CSS grid center');
    assert.ok(source.includes('© 2024 神机营'), 'Missing copyright');
  });
});
