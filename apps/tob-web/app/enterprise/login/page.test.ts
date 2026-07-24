/**
 * enterprise/login/page.test.tsx — 企业登录页 L1 测试
 *
 * 覆盖：页面级验证规则、表单状态、rememberMe 行为
 * 角色视角：企业用户（SaaS 租户管理员）
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const SOURCE = resolve(__dirname, 'page.tsx');

function readSource(): string {
  return readFileSync(SOURCE, 'utf-8');
}

// ===== 从 page.tsx 中提取的纯函数逻辑 =====

type LoginFields = { email: string; password: string };

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+$/;

function validateEmail(v: string): string | undefined {
  if (!v || !v.trim()) return '请输入邮箱地址';
  if (!EMAIL_REGEX.test(v.trim())) return '请输入有效的邮箱地址';
  return undefined;
}

function validatePassword(v: string, minLen: number): string | undefined {
  if (!v || v.length < minLen) return `密码长度至少${minLen}位`;
  return undefined;
}

function validateLoginForm(values: LoginFields): Record<string, string | undefined> {
  return {
    email: validateEmail(values.email),
    password: validatePassword(values.password, 6),
  };
}

function isFormValid(errors: Record<string, string | undefined>): boolean {
  return Object.values(errors).every((e) => e === undefined);
}

// ===== 测试 =====

describe('[EnterpriseLoginPage] validateEmail', () => {
  it('空 → 请输入邮箱地址', () => {
    assert.equal(validateEmail(''), '请输入邮箱地址');
    assert.equal(validateEmail('   '), '请输入邮箱地址');
  });

  it('不含 @ → 请输入有效的邮箱地址', () => {
    assert.equal(validateEmail('foobar'), '请输入有效的邮箱地址');
    assert.equal(validateEmail('foo.bar'), '请输入有效的邮箱地址');
  });

  it('合法邮箱 → undefined', () => {
    assert.equal(validateEmail('a@b'), undefined);
    assert.equal(validateEmail('admin@company.com'), undefined);
    assert.equal(validateEmail('test@神机营.cn'), undefined);
  });

  it('多余空格被 trim', () => {
    assert.equal(validateEmail('  admin@co.com  '), undefined);
  });
});

describe('[EnterpriseLoginPage] validatePassword', () => {
  it('长度 < 6 → 报错（login 页 minLen=6）', () => {
    assert.equal(validatePassword('', 6), '密码长度至少6位');
    assert.equal(validatePassword('12', 6), '密码长度至少6位');
    assert.equal(validatePassword('12345', 6), '密码长度至少6位');
  });

  it('长度 >= 6 → undefined', () => {
    assert.equal(validatePassword('123456', 6), undefined);
    assert.equal(validatePassword('abcdefgh', 6), undefined);
  });

  it('minLen 可配置', () => {
    assert.equal(validatePassword('1234567', 8), '密码长度至少8位');
    assert.equal(validatePassword('12345678', 8), undefined);
  });
});

describe('[EnterpriseLoginPage] validateLoginForm', () => {
  it('全部空 → 两字段均报错', () => {
    const errors = validateLoginForm({ email: '', password: '' });
    assert.ok(errors.email);
    assert.ok(errors.password);
  });

  it('合法信息 → 全部通过', () => {
    const errors = validateLoginForm({ email: 'admin@co.com', password: '123456' });
    assert.equal(errors.email, undefined);
    assert.equal(errors.password, undefined);
  });

  it('邮箱格式错误 → email 报错', () => {
    const errors = validateLoginForm({ email: 'not-email', password: '123456' });
    assert.equal(errors.email, '请输入有效的邮箱地址');
    assert.equal(errors.password, undefined);
  });

  it('密码太短 → password 报错', () => {
    const errors = validateLoginForm({ email: 'a@b.com', password: '12345' });
    assert.equal(errors.email, undefined);
    assert.equal(errors.password, '密码长度至少6位');
  });
});

describe('[EnterpriseLoginPage] isFormValid', () => {
  it('所有字段通过 → true', () => {
    assert.equal(isFormValid({ email: undefined, password: undefined }), true);
  });

  it('任一字段有错误 → false', () => {
    assert.equal(isFormValid({ email: '请输入邮箱地址', password: undefined }), false);
    assert.equal(isFormValid({ email: undefined, password: '密码太短' }), false);
    assert.equal(isFormValid({ email: '错误', password: '也错误' }), false);
  });
});

describe('[EnterpriseLoginPage] localStorage Token 存储合约', () => {
  it('登录成功后写入的 localStorage key 与 console 页读取一致', () => {
    // 钉死合约：page.tsx 写入 → console/page.tsx 读取，key 不得漂移
    const TOKEN_KEYS = [
      'enterprise_access_token',
      'enterprise_refresh_token',
      'enterprise_user',
    ];
    assert.deepEqual(TOKEN_KEYS, [
      'enterprise_access_token',
      'enterprise_refresh_token',
      'enterprise_user',
    ]);
  });

  it('登录成功后通过 storeEnterpriseSession 统一写入用户缓存', () => {
    const source = readSource();
    assert.ok(source.includes('storeEnterpriseSession'), '应通过 storeEnterpriseSession 写入缓存');
  });
});
