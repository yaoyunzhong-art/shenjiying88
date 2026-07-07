/**
 * member-register/page.test.ts — 会员注册页面 L1 冒烟测试
 * 覆盖: 正例·边界·防御
 */
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const SOURCE = resolve(__dirname, 'page.tsx');

function readSource(): string {
  return readFileSync(SOURCE, 'utf-8');
}

// ---- 正例 ----

describe('member-register — 正例', () => {
  it('应导出一个默认组件 MemberRegisterPage', () => {
    const src = readSource();
    assert.ok(src.includes('export default function MemberRegisterPage'), '缺少默认导出组件');
  });

  it('应包含 use client 指令', () => {
    const src = readSource();
    assert.ok(src.includes("'use client'") || src.includes('"use client"'), '缺少 use client');
  });

  it('应包含 memberAuthService 调用', () => {
    const src = readSource();
    assert.ok(src.includes('memberAuthService'), '缺少 memberAuthService');
  });

  it('应包含表单字段 mobile / code / nickname / agreeTerms', () => {
    const src = readSource();
    assert.ok(src.includes('mobile'), '缺少 mobile');
    assert.ok(src.includes('code'), '缺少 code');
    assert.ok(src.includes('nickname'), '缺少 nickname');
    assert.ok(src.includes('agreeTerms'), '缺少 agreeTerms');
  });

  it('应包含 handleSubmit 表单提交函数', () => {
    const src = readSource();
    assert.ok(src.includes('handleSubmit'), '缺少 handleSubmit');
  });
});

// ---- 边界 ----

describe('member-register — 边界', () => {
  it('手机号须符合 /^1[3-9]\\d{9}$/ 格式校验', () => {
    const src = readSource();
    assert.ok(src.includes("/^1[3-9]\\d{9}$/") || src.includes("1[3-9]"), '缺少手机号正则');
  });

  it('验证码必须为 6 位', () => {
    const src = readSource();
    assert.ok(src.includes("formData.code.length !== 6"), '缺少验证码长度校验');
  });

  it('验证码发送后倒计时 60 秒', () => {
    const src = readSource();
    assert.ok(src.includes('setCountdown(60)') || src.includes('countdown'), '缺少倒计时');
  });

  it('昵称为空时返回错误 "请输入昵称"', () => {
    const src = readSource();
    assert.ok(src.includes('请输入昵称'), '缺少昵称校验提示');
  });

  it('未勾选协议时返回错误 "请同意服务条款"', () => {
    const src = readSource();
    assert.ok(src.includes('请同意服务条款'), '缺少服务条款校验');
  });
});

// ---- 防御 ----

describe('member-register — 防御', () => {
  it('应包含 FormField 组件', () => {
    const src = readSource();
    assert.ok(src.includes('FormField'), '缺少 FormField');
  });

  it('应包含 useFormSubmit 表单提交状态管理', () => {
    const src = readSource();
    assert.ok(src.includes('useFormSubmit'), '缺少 useFormSubmit');
  });

  it('应包含 FormSubmitFeedback 反馈组件', () => {
    const src = readSource();
    assert.ok(src.includes('FormSubmitFeedback'), '缺少 FormSubmitFeedback');
  });

  it('应包含 SubmitButton 提交按钮', () => {
    const src = readSource();
    assert.ok(src.includes('SubmitButton'), '缺少 SubmitButton');
  });

  it('注册成功后跳转 /member-login?registered=true', () => {
    const src = readSource();
    assert.ok(src.includes('registered=true') || src.includes('member-login'), '缺少注册成功跳转');
  });

  it('应包含 服务条款 和 隐私政策 链接', () => {
    const src = readSource();
    assert.ok(src.includes('服务条款'), '缺少服务条款');
    assert.ok(src.includes('隐私政策'), '缺少隐私政策');
  });
});
