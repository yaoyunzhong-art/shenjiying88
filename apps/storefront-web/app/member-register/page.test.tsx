/**
 * member-register/page.test.ts — 会员注册页面冒烟测试
 * 覆盖: 正例·边界·防御·子组件·模块加载
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
    assert.ok(src.includes('/^1[3-9]'), '缺少手机号正则');
  });

  it('验证码必须为 6 位', () => {
    const src = readSource();
    assert.ok(src.includes('code.length !== 6'), '缺少验证码长度校验');
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

  it('应包含表单提交状态管理（submitting 状态）', () => {
    const src = readSource();
    assert.ok(src.includes('submitting') || src.includes('setSubmitting'), '缺少 submitting 状态');
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

// ---- 子组件: 注册统计 ----

describe('member-register — 统计面板', () => {
  it('应包含注册统计面板 (RegistrationStatsPanel)', () => {
    const src = readSource();
    assert.ok(src.includes('RegistrationStatsPanel'), '缺少统计面板');
    assert.ok(src.includes('注册统计'), '应包含统计标题');
  });

  it('统计面板包含今日/本周/本月/累计 4 项指标', () => {
    const src = readSource();
    assert.ok(src.includes('今日注册'), '缺少今日注册');
    assert.ok(src.includes('本周注册'), '缺少本周注册');
    assert.ok(src.includes('本月注册'), '缺少本月注册');
    assert.ok(src.includes('累计注册'), '缺少累计注册');
  });

  it('统计面板展示具体统计数值', () => {
    const src = readSource();
    assert.ok(src.includes('todayCount'), '缺少 todayCount 字段');
    assert.ok(src.includes('weekCount'), '缺少 weekCount 字段');
    assert.ok(src.includes('monthCount'), '缺少 monthCount 字段');
    assert.ok(src.includes('totalCount'), '缺少 totalCount 字段');
  });
});

// ---- 子组件: 新会员权益 ----

describe('member-register — 权益面板', () => {
  it('应包含新会员权益展示 (PromotionBannerRow)', () => {
    const src = readSource();
    assert.ok(src.includes('PromotionBannerRow'), '缺少权益面板');
    assert.ok(src.includes('新会员福利'), '应包含权益标题');
  });

  it('权益面板包含 3 项优惠', () => {
    const src = readSource();
    assert.ok(src.includes('新会员礼包'), '缺少新会员礼包');
    assert.ok(src.includes('首充双倍'), '缺少首充双倍');
    assert.ok(src.includes('好友邀请'), '缺少好友邀请');
  });
});

// ---- 子组件: 注册流程 ----

describe('member-register — 注册流程', () => {
  it('应包含注册流程步骤 (RegistrationSteps)', () => {
    const src = readSource();
    assert.ok(src.includes('RegistrationSteps'), '缺少流程步骤');
    assert.ok(src.includes('注册流程'), '应包含流程标题');
  });

  it('注册流程包含 4 个步骤', () => {
    const src = readSource();
    assert.ok(src.includes('填写手机号'), '缺少步骤1');
    assert.ok(src.includes('验证身份'), '缺少步骤2');
    assert.ok(src.includes('完善资料'), '缺少步骤3');
    assert.ok(src.includes('注册成功'), '缺少步骤4');
  });
});

// ---- 子组件: 最近注册 ----

describe('member-register — 注册记录', () => {
  it('应包含最近注册记录表格 (RecentRegistrationTable)', () => {
    const src = readSource();
    assert.ok(src.includes('RecentRegistrationTable'), '缺少注册记录表格');
    assert.ok(src.includes('最近注册'), '应包含表格标题');
  });

  it('注册记录表格包含表头: 手机号/昵称/时间/来源/验证', () => {
    const src = readSource();
    assert.ok(src.includes('手机号'), '缺少手机号列');
    assert.ok(src.includes('昵称'), '缺少昵称列');
    assert.ok(src.includes('时间'), '缺少时间列');
    assert.ok(src.includes('来源'), '缺少来源列');
    assert.ok(src.includes('验证'), '缺少验证列');
  });
});

// ---- 模块加载 ----

describe('member-register — 模块加载', () => {
  it('page 模块可正常导入且 default 为函数组件', async () => {
    const mod = await import('./page');
    assert.ok(typeof mod.default === 'function', 'default export should be a function component');
  });
});
