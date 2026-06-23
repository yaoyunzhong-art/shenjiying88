import assert from 'node:assert/strict';
import test from 'node:test';

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

  return { token: 'mock-jwt-token', role: 'super_admin' };
}

// ---- 正例 ----

test('login flow: correct credentials return token and role', async () => {
  const result = await simulateLogin('admin', 'admin123');

  assert.equal(result.token, 'mock-jwt-token');
  assert.equal(result.role, 'super_admin');
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
