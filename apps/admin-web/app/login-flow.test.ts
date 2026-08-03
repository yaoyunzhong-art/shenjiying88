import assert from 'node:assert/strict';
import test, { describe } from 'node:test';

/**
 * admin-web Login Page — L1 冒烟测试 (JMeter 风格: 正例 + 反例 + 边界)
 *
 * 由于 LoginPage 是 'use client' React 组件，这里通过 mockLoginApi 逻辑测试
 * 认证流程的核心契约：用户名/密码校验、错误处理、角色返回。
 */

// ---- 复用 login/page.tsx 中的 mockLoginApi 逻辑 ----

interface LoginResult {
  token: string;
  role: string;
  permissions: string[];
}

async function simulateLogin(username: string, password: string): Promise<LoginResult> {
  // 模拟网络延迟
  await new Promise((resolve) => setTimeout(resolve, 10));

  if (!username.trim()) {
    throw new Error('请输入用户名');
  }

  if (password.length < 6) {
    throw new Error('密码长度至少 6 位');
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

// ---- 正例 ----

test('login flow: correct credentials return token role and permissions', async () => {
  const result = await simulateLogin('admin', 'admin123');

  assert.equal(result.token, 'mock-jwt-token');
  assert.equal(result.role, 'super_admin');
  assert.ok(Array.isArray(result.permissions));
  assert.ok(result.permissions.includes('dashboard:read'));
  assert.ok(result.permissions.includes('foundation.governance.read'));
  assert.ok(result.permissions.includes('workbench.read'));
  assert.ok(result.permissions.includes('store:read'));
});

test('login flow: whitespace-only username is rejected as empty', async () => {
  // '   ' should be treated as empty
  await assert.rejects(
    () => simulateLogin('   ', 'admin123'),
    /请输入用户名/
  );
});

// ---- 反例 ----

test('login flow: empty username is rejected', async () => {
  await assert.rejects(
    () => simulateLogin('   ', 'admin123'),
    /请输入用户名/
  );
});

test('login flow: short password is rejected', async () => {
  await assert.rejects(
    () => simulateLogin('admin', '12345'),
    /密码长度至少 6 位/
  );
});

test('login flow: wrong password is rejected', async () => {
  await assert.rejects(
    () => simulateLogin('admin', 'wrongpass'),
    /用户名或密码错误/
  );
});

test('login flow: wrong username is rejected', async () => {
  await assert.rejects(
    () => simulateLogin('nonexistent', 'admin123'),
    /用户名或密码错误/
  );
});

// ---- 边界 ----

test('login flow: password exactly 6 chars is accepted', async () => {
  // 6 个字符但凭据错误 — 验证不因长度报错
  await assert.rejects(
    () => simulateLogin('admin', '123456'),
    /用户名或密码错误/
  );
});

test('login flow: password exactly 5 chars is rejected for length', async () => {
  await assert.rejects(
    () => simulateLogin('admin', '12345'),
    /密码长度至少 6 位/
  );
});

test('login flow: empty string username is rejected', async () => {
  await assert.rejects(
    () => simulateLogin('', 'admin123'),
    /请输入用户名/
  );
});

test('login flow: null-like username is rejected', async () => {
  await assert.rejects(
    () => simulateLogin('', 'admin123'),
    /请输入用户名/
  );
});

test('login flow: very long password still validates credentials', async () => {
  const longPassword = 'a'.repeat(256);
  await assert.rejects(
    () => simulateLogin('admin', longPassword),
    /用户名或密码错误/
  );
});

describe('login-flow — L2 边界与逻辑细化', () => {
  // ---- 正例扩展 ----
  test('login flow: 正确凭据返回带 role 和 token', async () => {
    const result = await simulateLogin('admin', 'admin123');
    assert.equal(result.token, 'mock-jwt-token');
    assert.equal(result.role, 'super_admin');
    assert.ok(result.permissions.includes('identity-access:write'));
    assert.ok(result.permissions.includes('foundation.governance.read'));
    assert.ok(result.permissions.includes('settings:read'));
    assert.ok(result.permissions.includes('workbench.read'));
    assert.ok(result.permissions.includes('store:read'));
    assert.ok(typeof result.token === 'string', 'token 应为字符串');
    assert.ok(result.token.length > 0, 'token 不为空');
  });

  test('login flow: 密码长度等于 6 时通过长度校验', async () => {
    await assert.rejects(
      () => simulateLogin('admin', '123456'),
      /用户名或密码错误/
    );
  });

  test('login flow: 全角空格用户名应被 trim 视为空', async () => {
    await assert.rejects(
      () => simulateLogin('　　', 'admin123'),
      /请输入用户名/
    );
  });

  // ---- 反例扩展 ----
  test('login flow: tab 空白用户名应被拒绝', async () => {
    await assert.rejects(
      () => simulateLogin('\t\t', 'admin123'),
      /请输入用户名/
    );
  });

  test('login flow: newline 换行用户名应被拒绝', async () => {
    await assert.rejects(
      () => simulateLogin('\n', 'admin123'),
      /请输入用户名/
    );
  });

  test('login flow: null 字符用户名触发错误判断', async () => {
    await assert.rejects(
      () => simulateLogin('\0', 'admin123'),
      /用户名或密码错误/
    );
  });

  test('login flow: 正确用户名+空密码时序验证', async () => {
    await assert.rejects(
      () => simulateLogin('admin', ''),
      /密码长度至少 6 位/
    );
  });

  test('login flow: 特殊字符密码不干扰错误判断', async () => {
    await assert.rejects(
      () => simulateLogin('admin', '!@#$%^'),
      /用户名或密码错误/
    );
  });

  test('login flow: Unicode 用户名不干扰空校验', async () => {
    await assert.rejects(
      () => simulateLogin('管理员', 'admin123'),
      /用户名或密码错误/
    );
  });

  test('login flow: 数字用户名作为合法输入', async () => {
    await assert.rejects(
      () => simulateLogin('123456', 'admin123'),
      /用户名或密码错误/
    );
  });

  test('login flow: 超长用户名 999 字符', async () => {
    const longUsername = 'a'.repeat(999);
    await assert.rejects(
      () => simulateLogin(longUsername, 'admin123'),
      /用户名或密码错误/
    );
  });

  test('login flow: 密码长度正好为 6 边界', async () => {
    await assert.rejects(
      () => simulateLogin('admin', 'abcdef'),
      /用户名或密码错误/
    );
  });

  test('login flow: 模拟网络延迟不无限阻塞', async () => {
    const start = Date.now();
    await assert.rejects(
      () => simulateLogin('nonexistent', 'admin123'),
      /用户名或密码错误/
    );
    const elapsed = Date.now() - start;
    assert.ok(elapsed < 2000, '请求应在 2s 内完成');
  });
});
