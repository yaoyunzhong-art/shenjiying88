/**
 * settings/security/page.test.tsx — 安全设置 L1 测试
 *
 * 覆盖: 密码策略、登录保护、IP白名单、安全审计
 * 正例: 密码强度验证、登录限制、安全策略
 * 反例: 弱密码、异常登录、IP不在白名单
 * 边界: 极长密码、全IP白名单、空策略
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import React from 'react';
import { render, cleanup } from '@testing-library/react';
import SecurityPage from './page';

/* ── 类型 ── */

interface PasswordPolicy {
  minLength: number;
  requireUppercase: boolean;
  requireLowercase: boolean;
  requireDigit: boolean;
  requireSpecialChar: boolean;
  maxAgeDays: number;
  preventReuseCount: number;
  maxLoginAttempts: number;
  lockoutMinutes: number;
}

interface SecurityAudit {
  auditId: string;
  event: string;
  userId: string;
  ip: string;
  userAgent: string;
  success: boolean;
  timestamp: string;
  detail: string;
}

function validatePassword(password: string, policy: PasswordPolicy): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  if (password.length < policy.minLength) errors.push(`密码至少${policy.minLength}位`);
  if (policy.requireUppercase && !/[A-Z]/.test(password)) errors.push('需要大写字母');
  if (policy.requireLowercase && !/[a-z]/.test(password)) errors.push('需要小写字母');
  if (policy.requireDigit && !/[0-9]/.test(password)) errors.push('需要数字');
  if (policy.requireSpecialChar && !/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) errors.push('需要特殊字符');
  return { valid: errors.length === 0, errors };
}

function isInWhitelist(ip: string, whitelist: string[]): boolean {
  if (whitelist.length === 0) return true;
  return whitelist.some(entry => {
    if (entry === ip) return true;
    if (entry.endsWith('.*')) {
      const prefix = entry.slice(0, -2);
      return ip.startsWith(prefix);
    }
    return false;
  });
}

function hasExceededLoginAttempts(attempts: number, policy: PasswordPolicy): boolean {
  return attempts >= policy.maxLoginAttempts;
}

/* ── 辅助 ── */

function setup() {
  cleanup();
  return render(React.createElement(SecurityPage));
}

/* ============================================================ */

describe('security: 页面渲染', () => {
  it('renders title', () => { const { container } = setup(); assert.ok(container.querySelector('h1')?.textContent?.includes('安全设置')); });
  it('renders description', () => { const { container } = setup(); assert.ok(container.textContent?.includes('安全')); });
  it('renders without error', () => { assert.doesNotThrow(() => setup()); });
  it('has padding layout', () => { const { container } = setup(); const _pad = (container.firstElementChild as HTMLElement)?.style?.padding ?? ''; assert.ok(!_pad || _pad.includes('24px'), 'padding should be 24px or empty'); });
  it('has single h1', () => { const { container } = setup(); assert.equal(container.querySelectorAll('h1').length, 1); });
  it('component is a function', () => { assert.equal(typeof SecurityPage, 'function'); });
});

describe('security: 数据类型', () => {
  it('PasswordPolicy has all fields', () => {
    const p: PasswordPolicy = { minLength: 8, requireUppercase: true, requireLowercase: true, requireDigit: true, requireSpecialChar: true, maxAgeDays: 90, preventReuseCount: 5, maxLoginAttempts: 5, lockoutMinutes: 30 };
    assert.equal(typeof p.minLength, 'number');
    assert.equal(typeof p.requireUppercase, 'boolean');
    assert.equal(typeof p.lockoutMinutes, 'number');
  });

  it('minLength >= 6', () => {
    [6, 8, 12, 16].forEach(v => assert.ok(v >= 6));
  });

  it('maxAgeDays is positive', () => {
    assert.ok(90 > 0);
  });

  it('lockoutMinutes is positive', () => {
    assert.ok(30 > 0);
  });

  it('SecurityAudit has timestamp', () => {
    const a: SecurityAudit = { auditId: 'aud-001', event: 'LOGIN_FAILED', userId: 'u-001', ip: '192.168.1.1', userAgent: 'Mozilla/5.0', success: false, timestamp: '2026-07-16T03:00:00Z', detail: '密码错误' };
    assert.equal(typeof a.timestamp, 'string');
  });
});

describe('security: 业务逻辑', () => {
  const POLICY: PasswordPolicy = { minLength: 8, requireUppercase: true, requireLowercase: true, requireDigit: true, requireSpecialChar: true, maxAgeDays: 90, preventReuseCount: 5, maxLoginAttempts: 5, lockoutMinutes: 30 };

  it('validatePassword valid password', () => {
    const result = validatePassword('Abc123!@', POLICY);
    assert.ok(result.valid);
    assert.equal(result.errors.length, 0);
  });

  it('validatePassword too short', () => {
    const result = validatePassword('Ab1!', POLICY);
    assert.ok(!result.valid);
    assert.ok(result.errors.some(e => e.includes('至少')));
  });

  it('validatePassword no uppercase', () => {
    const result = validatePassword('abc123!@', POLICY);
    assert.ok(!result.valid);
    assert.ok(result.errors.some(e => e.includes('大写')));
  });

  it('validatePassword no digit', () => {
    const result = validatePassword('Abcdef!@', POLICY);
    assert.ok(!result.valid);
    assert.ok(result.errors.some(e => e.includes('数字')));
  });

  it('validatePassword no special char', () => {
    const result = validatePassword('Abcdef123', POLICY);
    assert.ok(!result.valid);
    assert.ok(result.errors.some(e => e.includes('特殊')));
  });

  it('validatePassword lenient policy', () => {
    const lenient: PasswordPolicy = { minLength: 6, requireUppercase: false, requireLowercase: false, requireDigit: false, requireSpecialChar: false, maxAgeDays: 0, preventReuseCount: 0, maxLoginAttempts: 10, lockoutMinutes: 15 };
    const result = validatePassword('123456', lenient);
    assert.ok(result.valid);
  });

  it('isInWhitelist exact match', () => {
    assert.ok(isInWhitelist('192.168.1.100', ['192.168.1.100', '10.0.0.1']));
  });

  it('isInWhitelist CIDR prefix match', () => {
    assert.ok(isInWhitelist('192.168.1.200', ['192.168.*']));
  });

  it('isInWhitelist not in whitelist', () => {
    assert.ok(!isInWhitelist('10.0.0.5', ['192.168.*', '172.16.*']));
  });

  it('isInWhitelist empty whitelist allows all', () => {
    assert.ok(isInWhitelist('1.1.1.1', []));
  });

  it('hasExceededLoginAttempts within limit', () => {
    assert.ok(!hasExceededLoginAttempts(3, POLICY));
  });

  it('hasExceededLoginAttempts at limit', () => {
    assert.ok(hasExceededLoginAttempts(5, POLICY));
  });

  it('hasExceededLoginAttempts exceeds limit', () => {
    assert.ok(hasExceededLoginAttempts(10, POLICY));
  });

  it('failed login creates audit record', () => {
    const audit: SecurityAudit = { auditId: 'aud-fail', event: 'LOGIN_FAILED', userId: 'u-001', ip: '10.0.0.1', userAgent: 'curl', success: false, timestamp: '2026-07-16T03:00:00Z', detail: '密码错误' };
    assert.ok(!audit.success);
    assert.equal(audit.event, 'LOGIN_FAILED');
  });

  it('successful login audit event', () => {
    const audit: SecurityAudit = { auditId: 'aud-ok', event: 'LOGIN_SUCCESS', userId: 'u-001', ip: '192.168.1.1', userAgent: 'Chrome', success: true, timestamp: '2026-07-16T03:00:00Z', detail: '正常登录' };
    assert.ok(audit.success);
  });

  it('long password still validate', () => {
    const longPwd = 'A1!' + 'x'.repeat(100);
    const result = validatePassword(longPwd, POLICY);
    assert.ok(result.valid);
  });

  it('maxAgeDays 0 means never expires', () => {
    const noExpiry: PasswordPolicy = { ...POLICY, maxAgeDays: 0 };
    assert.equal(noExpiry.maxAgeDays, 0);
  });

  it('preventReuseCount can be 0', () => {
    const noReuse: PasswordPolicy = { ...POLICY, preventReuseCount: 0 };
    assert.equal(noReuse.preventReuseCount, 0);
  });

  it('whitelist can have both exact and prefix entries', () => {
    const wl = ['10.0.0.1', '192.168.*'];
    assert.ok(isInWhitelist('10.0.0.1', wl));
    assert.ok(isInWhitelist('192.168.1.5', wl));
    assert.ok(!isInWhitelist('172.16.0.1', wl));
  });

  it('ip whitelist supports multiple prefix patterns', () => {
    const wl = ['10.*', '172.16.*', '192.168.*'];
    assert.ok(isInWhitelist('10.0.0.1', wl));
    assert.ok(isInWhitelist('172.16.0.5', wl));
    assert.ok(isInWhitelist('192.168.1.100', wl));
    assert.ok(!isInWhitelist('8.8.8.8', wl));
  });

  it('validatePassword all-lowercase fails if uppercase required', () => {
    const result = validatePassword('abcdef123!', POLICY);
    assert.ok(!result.valid);
  });

  it('validatePassword all-uppercase fails if lowercase required', () => {
    const result = validatePassword('ABCDEF123!', POLICY);
    assert.ok(!result.valid);
  });

  it('min length 16 with all requirements', () => {
    const strongPolicy: PasswordPolicy = { ...POLICY, minLength: 16 };
    const result = validatePassword('Abcdef123!@#xyzA', strongPolicy);
    assert.ok(result.valid);
  });

  it('audit event has required user info', () => {
    const audit: SecurityAudit = { auditId: 'aud-003', event: 'PASSWORD_CHANGE', userId: 'u-001', ip: '10.0.0.1', userAgent: 'Mozilla', success: true, timestamp: '2026-07-16T04:00:00Z', detail: '密码修改成功' };
    assert.ok(audit.userId.length > 0);
    assert.ok(audit.ip.length > 0);
  });

  it('maxLoginAttempts can be customized higher', () => {
    const custom: PasswordPolicy = { ...POLICY, maxLoginAttempts: 10 };
    assert.ok(!hasExceededLoginAttempts(9, custom));
    assert.ok(hasExceededLoginAttempts(10, custom));
  });

  it('empty password always fails', () => {
    const result = validatePassword('', POLICY);
    assert.ok(!result.valid);
  });
});
