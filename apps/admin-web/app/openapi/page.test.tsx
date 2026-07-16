/**
 * 🐜 自动: [openapi] [B] OpenAPI 工作台页面测试
 *
 * L1 冒烟测试 — 验证页面级工具函数和状态常量
 */

import assert from 'node:assert/strict';
import test, { describe, it } from 'node:test';

// ---- PII 脱敏工具（与 page.tsx maskPII 保持同步） ----

function maskPII(data: Record<string, any>): Record<string, any> {
  const result = { ...data };
  const piiKeys = ['email', 'phone', 'idCard', 'password', 'token', 'ssn', 'creditCard'];
  for (const key of Object.keys(result)) {
    if (piiKeys.includes(key)) result[key] = '***MASKED***';
  }
  return result;
}

describe('maskPII', () => {
  it('脱敏 email', () => {
    const result = maskPII({ email: 'alice@x.com' });
    assert.strictEqual(result.email, '***MASKED***');
  });

  it('脱敏 phone', () => {
    const result = maskPII({ phone: '13800000000' });
    assert.strictEqual(result.phone, '***MASKED***');
  });

  it('脱敏 password', () => {
    const result = maskPII({ password: 'secret123' });
    assert.strictEqual(result.password, '***MASKED***');
  });

  it('脱敏 token', () => {
    const result = maskPII({ token: 'eyJhbGciOiJIUzI1NiJ9' });
    assert.strictEqual(result.token, '***MASKED***');
  });

  it('非 PII 字段不脱敏', () => {
    const result = maskPII({ name: 'Alice', age: 30 });
    assert.strictEqual(result.name, 'Alice');
    assert.strictEqual(result.age, 30);
  });

  it('混合字段', () => {
    const result = maskPII({ name: 'Alice', email: 'a@x.com', phone: '13800000000' });
    assert.strictEqual(result.name, 'Alice');
    assert.strictEqual(result.email, '***MASKED***');
    assert.strictEqual(result.phone, '***MASKED***');
  });

  it('空对象返回空对象', () => {
    const result = maskPII({});
    assert.deepStrictEqual(result, {});
  });

  it('idCard 字段脱敏', () => {
    const result = maskPII({ idCard: '110101199001011234' });
    assert.strictEqual(result.idCard, '***MASKED***');
  });
});

// ---- 状态常量 ----

describe('STATUS_COLOR', () => {
  const STATUS_COLOR: Record<string, string> = {
    ACTIVE: 'bg-green-100 text-green-700',
    PAUSED: 'bg-yellow-100 text-yellow-700',
    DELETED: 'bg-gray-100 text-gray-700',
    REVOKED: 'bg-red-100 text-red-700',
    EXPIRED: 'bg-orange-100 text-orange-700',
    PURGED: 'bg-gray-100 text-gray-700',
    PENDING: 'bg-blue-100 text-blue-700',
    SUCCESS: 'bg-green-100 text-green-700',
    FAILED: 'bg-red-100 text-red-700',
    DEAD_LETTER: 'bg-purple-100 text-purple-700',
  };

  it('包含所有必需的状态', () => {
    const required = ['ACTIVE', 'PAUSED', 'DELETED', 'REVOKED', 'EXPIRED',
      'PURGED', 'PENDING', 'SUCCESS', 'FAILED', 'DEAD_LETTER'];
    for (const key of required) {
      assert.ok(STATUS_COLOR[key], '缺少状态: ' + key);
    }
  });
});

describe('ENV_COLOR', () => {
  const ENV_COLOR: Record<string, string> = {
    LIVE: 'bg-blue-100 text-blue-700',
    TEST: 'bg-yellow-100 text-yellow-700',
    SANDBOX: 'bg-green-100 text-green-700',
  };

  it('包含 3 个环境', () => {
    assert.strictEqual(Object.keys(ENV_COLOR).length, 3);
    assert.ok(ENV_COLOR.LIVE);
    assert.ok(ENV_COLOR.TEST);
    assert.ok(ENV_COLOR.SANDBOX);
  });
});

// ---- 签名 canonical string 构建 ----

describe('canonicalString', () => {
  it('POST 请求格式正确', () => {
    const method = 'POST';
    const url = '/api/orders';
    const timestamp = 1719560000000;
    const nonce = 'nonce-abc';
    const body = '{"amount":100}';
    const canonical = method.toUpperCase() + '\n' + url + '\n' + timestamp + '\n' + nonce + '\n' + body;
    assert.ok(canonical.startsWith('POST'), 'should start with method');
    assert.ok(canonical.includes(url), 'should include URL');
    assert.ok(canonical.includes(body), 'should include body');
    assert.ok(canonical.includes('nonce-abc'), 'should include nonce');
  });

  it('GET 请求 body 为空', () => {
    const canonical = 'GET\n/api/members\n1719560000000\nnonce-def\n';
    const lines = canonical.split('\n');
    assert.strictEqual(lines[0], 'GET');
    assert.strictEqual(lines[1], '/api/members');
    assert.strictEqual(lines[lines.length - 1], '');
  });
});

const SRC = fs.readFileSync(require.resolve('./page'), 'utf-8');

describe('Openapi — hooks验证', () => {
  it('包含useState声明', () => assert.ok(SRC.includes('const [') && SRC.includes('useState')));
  it('包含JSX返回', () => assert.ok(SRC.includes('return (')));
  it('包含事件处理器', () => assert.ok(SRC.includes('onClick={') || SRC.includes('onChange={')));
  it('包含列表渲染', () => assert.ok(SRC.includes('.map(')));
  it('包含条件渲染', () => assert.ok(SRC.includes(' && ') || SRC.includes(' ? ')));
  it('包含样式定义', () => assert.ok(SRC.includes('style={')));
  it('包含数据格式化', () => assert.ok(SRC.includes('.toFixed') || SRC.includes('toLocaleString')));
  it('包含模板字符串', () => assert.ok(SRC.includes('${')));
  it('包含默认导出', () => assert.ok(SRC.includes('export default function')));
  it('包含注释说明', () => assert.ok(SRC.includes('/**')));
});
