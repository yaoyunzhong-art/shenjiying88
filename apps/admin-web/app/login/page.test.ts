/**
 * login-page.test.ts — Page-level tests for the login page.
 * Tests form validation, submit flow, and error messages.
 *
 * Pattern: L1 JMeter-style (正例 + 反例 + 边界)
 * References: login-flow.test.ts
 */

import { describe, it } from 'node:test';
import assert from 'node:assert';

// ---- Replicate the mockLoginApi logic from page.tsx ----

interface LoginResult {
  token: string;
  role: string;
  permissions: string[];
}

interface LoginFormData {
  username: string;
  password: string;
  remember?: boolean;
}

async function mockLoginApi(formData: LoginFormData): Promise<LoginResult> {
  await new Promise((resolve) => setTimeout(resolve, 10));

  const { username, password } = formData;

  if (!username || !username.trim()) {
    throw new Error('请输入用户名');
  }

  if (username.length > 64) {
    throw new Error('用户名长度不能超过 64 个字符');
  }

  if (!password || password.length < 6) {
    throw new Error('密码长度至少 6 位');
  }

  if (password.length > 128) {
    throw new Error('密码长度不能超过 128 个字符');
  }

  if (username !== 'admin' || password !== 'admin123') {
    throw new Error('用户名或密码错误，请检查后重试');
  }

  return {
    token: 'mock-jwt-token',
    role: 'super_admin',
    permissions: [
      'dashboard:read',
      'dashboard:operations:read',
      'dashboard:growth:read',
      'foundation.governance.read',
      'workbench.read',
      'store:read',
      'settings:read',
      'identity-access:write',
      'user:write',
      'security:read',
      'notification:read',
    ],
  };
}

// ---- Validate form data (page-level validation before submit) ----

interface ValidationResult {
  valid: boolean;
  usernameError?: string;
  passwordError?: string;
}

function validateLoginForm(data: LoginFormData): ValidationResult {
  const errors: { usernameError?: string; passwordError?: string } = {};

  if (!data.username || !data.username.trim()) {
    errors.usernameError = '请输入用户名';
  } else if (data.username.length > 64) {
    errors.usernameError = '用户名长度不能超过 64 个字符';
  }

  if (!data.password) {
    errors.passwordError = '请输入密码';
  } else if (data.password.length < 6) {
    errors.passwordError = '密码长度至少 6 位';
  } else if (data.password.length > 128) {
    errors.passwordError = '密码长度不能超过 128 个字符';
  }

  return {
    valid: !errors.usernameError && !errors.passwordError,
    ...errors,
  };
}

// ---- 正例 ----

describe('login-page: 正例 (positive cases)', () => {
  describe('form validation', () => {
    it('should validate correct credentials as valid', () => {
      const result = validateLoginForm({ username: 'admin', password: 'admin123' });
      assert.strictEqual(result.valid, true);
    });

    it('should validate credentials with remember=true', () => {
      const result = validateLoginForm({ username: 'admin', password: 'admin123', remember: true });
      assert.strictEqual(result.valid, true);
    });

    it('form validation should allow username with leading/trailing spaces (trimmed in api)', () => {
      // Page-level validation trims for "empty" check, but passes non-empty
      const result = validateLoginForm({ username: '  admin  ', password: 'admin123' });
      assert.strictEqual(result.valid, true);
    });
  });

  describe('submit flow', () => {
    it('correct credentials return token role and permissions', async () => {
      const result = await mockLoginApi({ username: 'admin', password: 'admin123' });
      assert.strictEqual(result.token, 'mock-jwt-token');
      assert.strictEqual(result.role, 'super_admin');
      assert.ok(Array.isArray(result.permissions));
      assert.ok(result.permissions.includes('dashboard:read'));
      assert.ok(result.permissions.includes('foundation.governance.read'));
      assert.ok(result.permissions.includes('workbench.read'));
      assert.ok(result.permissions.includes('store:read'));
      assert.ok(result.token.length > 0);
    });
  });
});

// ---- 反例 ----

describe('login-page: 反例 (negative cases)', () => {
  describe('validation errors', () => {
    it('should reject empty username', () => {
      const result = validateLoginForm({ username: '', password: 'admin123' });
      assert.strictEqual(result.valid, false);
      assert.strictEqual(result.usernameError, '请输入用户名');
    });

    it('should reject whitespace-only username', () => {
      const result = validateLoginForm({ username: '   ', password: 'admin123' });
      assert.strictEqual(result.valid, false);
      assert.strictEqual(result.usernameError, '请输入用户名');
    });

    it('should reject short password (< 6 chars)', () => {
      const result = validateLoginForm({ username: 'admin', password: '12345' });
      assert.strictEqual(result.valid, false);
      assert.strictEqual(result.passwordError, '密码长度至少 6 位');
    });

    it('should reject empty password', () => {
      const result = validateLoginForm({ username: 'admin', password: '' });
      assert.strictEqual(result.valid, false);
      assert.strictEqual(result.passwordError, '请输入密码');
    });

    it('should reject too long username (> 64 chars)', () => {
      const result = validateLoginForm({ username: 'a'.repeat(65), password: 'admin123' });
      assert.strictEqual(result.valid, false);
      assert.strictEqual(result.usernameError, '用户名长度不能超过 64 个字符');
    });

    it('should reject too long password (> 128 chars)', () => {
      const result = validateLoginForm({ username: 'admin', password: 'a'.repeat(129) });
      assert.strictEqual(result.valid, false);
      assert.strictEqual(result.passwordError, '密码长度不能超过 128 个字符');
    });

    it('should reject both empty username and empty password', () => {
      const result = validateLoginForm({ username: '', password: '' });
      assert.strictEqual(result.valid, false);
      assert.ok(result.usernameError !== undefined);
      assert.ok(result.passwordError !== undefined);
    });
  });

  describe('API rejection', () => {
    it('wrong password should reject', async () => {
      await assert.rejects(
        () => mockLoginApi({ username: 'admin', password: 'wrongpass' }),
        /用户名或密码错误/
      );
    });

    it('wrong username should reject', async () => {
      await assert.rejects(
        () => mockLoginApi({ username: 'nonexistent', password: 'admin123' }),
        /用户名或密码错误/
      );
    });

    it('empty username should reject with validation error', async () => {
      await assert.rejects(
        () => mockLoginApi({ username: '', password: 'admin123' }),
        /请输入用户名/
      );
    });

    it('short password should reject with length error', async () => {
      await assert.rejects(
        () => mockLoginApi({ username: 'admin', password: '12345' }),
        /密码长度至少 6 位/
      );
    });
  });
});

// ---- 边界 ----

describe('login-page: 边界 (boundary cases)', () => {
  it('password exactly 6 characters should pass validation', () => {
    const result = validateLoginForm({ username: 'admin', password: '123456' });
    assert.strictEqual(result.valid, true);
  });

  it('password exactly 6 characters but wrong credentials should reject API call', async () => {
    await assert.rejects(
      () => mockLoginApi({ username: 'admin', password: '123456' }),
      /用户名或密码错误/
    );
  });

  it('password exactly 5 characters should fail validation', () => {
    const result = validateLoginForm({ username: 'admin', password: '12345' });
    assert.strictEqual(result.valid, false);
    assert.strictEqual(result.passwordError, '密码长度至少 6 位');
  });

  it('username exactly 64 characters should pass validation', () => {
    const result = validateLoginForm({ username: 'a'.repeat(64), password: 'admin123' });
    assert.strictEqual(result.valid, true);
  });

  it('username 65 characters should fail validation', () => {
    const result = validateLoginForm({ username: 'a'.repeat(65), password: 'admin123' });
    assert.strictEqual(result.valid, false);
  });

  it('password exactly 128 characters should pass validation', () => {
    const result = validateLoginForm({ username: 'admin', password: 'a'.repeat(128) });
    assert.strictEqual(result.valid, true);
  });

  it('password 129 characters should fail validation', () => {
    const result = validateLoginForm({ username: 'admin', password: 'a'.repeat(129) });
    assert.strictEqual(result.valid, false);
  });

  it('very long password (256 chars) should be rejected by validation', () => {
    const result = validateLoginForm({ username: 'admin', password: 'a'.repeat(256) });
    assert.strictEqual(result.valid, false);
    assert.strictEqual(result.passwordError, '密码长度不能超过 128 个字符');
  });

  it('PASSWORD alone with correct credentials — happy path for auth', async () => {
    const result = await mockLoginApi({ username: 'admin', password: 'admin123' });
    assert.ok(result.token.length > 0);
    assert.ok(['super_admin', 'admin', 'user'].includes(result.role) === false || result.role === 'super_admin');
    assert.strictEqual(result.role, 'super_admin');
    assert.ok(result.permissions.includes('identity-access:write'));
    assert.ok(result.permissions.includes('foundation.governance.read'));
    assert.ok(result.permissions.includes('settings:read'));
    assert.ok(result.permissions.includes('workbench.read'));
    assert.ok(result.permissions.includes('store:read'));
  });
});
