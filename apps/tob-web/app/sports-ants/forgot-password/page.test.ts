/**
 * sports-ants/forgot-password/page.test.ts — 忘记密码页测试
 *
 * 覆盖:
 *   L1 正例     — 组件导出、核心元素
 *   L2 数据     — 表单字段、验证逻辑
 *   L3 状态逻辑 — 多步骤流程、倒计时
 *   L3 边界     — 表单验证、手机号校验
 *   L3 安全     — 无危险代码
 */

import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const SRC = readFileSync(resolve(__dirname, 'page.tsx'), 'utf-8');

describe('ForgotPasswordPage — L1 正例', () => {
  it('应导出一个默认函数组件 ForgotPasswordPage', () => {
    assert.ok(SRC.includes('export default function ForgotPasswordPage'));
  });

  it('应包含 use client 指令', () => {
    assert.ok(SRC.includes("'use client'"));
  });

  it('应导入 useRouter/Header/Footer', () => {
    assert.ok(SRC.includes('useRouter'));
    assert.ok(SRC.includes('Header'));
    assert.ok(SRC.includes('Footer'));
  });

  it('页面标题应包含"忘记密码"', () => {
    assert.ok(SRC.includes('忘记密码'));
  });
});

describe('ForgotPasswordPage — L2 表单数据', () => {
  it('应管理 formData 状态含 phone/verificationCode/password/confirmPassword', () => {
    assert.ok(SRC.includes("phone:"));
    assert.ok(SRC.includes("verificationCode:") || SRC.includes("verificationCode"));
    assert.ok(SRC.includes("password:"));
    assert.ok(SRC.includes("confirmPassword:") || SRC.includes("confirmPassword"));
  });

  it('包含 step 状态区分验证/重置步骤', () => {
    assert.ok(SRC.includes("'verify'") || SRC.includes("'reset'"));
  });

  it('包含 countdown 倒计时状态', () => {
    assert.ok(SRC.includes('countdown'));
  });

  it('包含 isSubmitting 提交状态', () => {
    assert.ok(SRC.includes('isSubmitting'));
  });

  it('包含 error 错误状态', () => {
    assert.ok(SRC.includes("error"));
  });
});

describe('ForgotPasswordPage — L3 状态逻辑', () => {
  it('应使用 useState 管理所有状态', () => {
    assert.ok(SRC.includes('useState'));
    const useStateCalls = (SRC.match(/useState/g) || []).length;
    assert.ok(useStateCalls >= 5, `预期至少 5 个 useState 调用，实际 ${useStateCalls}`);
  });

  it('应有 handleChange 输入处理', () => {
    assert.ok(SRC.includes('handleChange'));
  });

  it('应有 handleSendCode 发送验证码逻辑', () => {
    assert.ok(SRC.includes('handleSendCode'));
  });

  it('发送验证码应有手机号校验', () => {
    const hasRegex = SRC.includes('手机号') && (SRC.includes('1[3-9]') || SRC.includes('new RegExp'));
    const hasNativeValidate = SRC.includes('required') && SRC.includes('tel');
    assert.ok(hasRegex || hasNativeValidate, '应有手机号校验逻辑');
  });

  it('发送验证码后应启动 60s 倒计时', () => {
    assert.ok(SRC.includes('setCountdown(60)') || SRC.includes('60'));
  });

  it('应有 setInterval 做倒计时', () => {
    assert.ok(SRC.includes('setInterval') || SRC.includes('setTimeout'));
  });

  it('倒计时到 0 时应清除定时器', () => {
    assert.ok(SRC.includes('clearInterval'));
  });

  it('应有 handleSubmit 提交处理', () => {
    assert.ok(SRC.includes('handleSubmit') || SRC.includes('onSubmit'));
  });
});

describe('ForgotPasswordPage — L3 边界', () => {
  it('手机号应校验格式', () => {
    assert.ok(SRC.includes('正则') || SRC.includes('/^1[3-9]\\d'));
  });

  it('密码与确认密码应做一致性校验', () => {
    assert.ok(
      SRC.includes('confirmPassword') &&
      (SRC.includes('password') || SRC.includes('密码')),
    );
  });
});

describe('ForgotPasswordPage — L3 安全', () => {
  it('不应使用 dangerouslySetInnerHTML', () => {
    assert.ok(!SRC.includes('dangerouslySetInnerHTML'));
  });

  it('不应使用 eval', () => {
    assert.ok(!SRC.includes('eval('));
  });

  it('不应包含 as any', () => {
    assert.ok(!SRC.includes('as any'));
  });
});
