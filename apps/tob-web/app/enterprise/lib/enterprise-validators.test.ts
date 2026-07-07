/**
 * enterprise-validators.test.ts — L1 合约测试
 *
 * 集中校验 pure-function 合约：文案、规则、空值、边界。
 * 任何对 email/mobile/passwordMin/required/matches 的调整都会被本测试钉死。
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { required, email, passwordMin, mobileCN, matches } from './enterprise-validators';

describe('[enterprise-validators] required', () => {
  it('空字符串 → 报错', () => {
    assert.equal(required('企业名称')(''), '请输入企业名称');
  });

  it('纯空格 → 报错', () => {
    assert.equal(required('企业名称')('   '), '请输入企业名称');
  });

  it('有内容 → undefined', () => {
    assert.equal(required('企业名称')('神机营')!, undefined);
  });

  it('文案使用传入的 label', () => {
    assert.equal(required('手机号')(''), '请输入手机号');
    assert.equal(required('密码')(''), '请输入密码');
  });
});

describe('[enterprise-validators] email', () => {
  it('空字符串 → 请输入邮箱地址', () => {
    assert.equal(email(''), '请输入邮箱地址');
  });

  it('纯空格 → 请输入邮箱地址', () => {
    assert.equal(email('   '), '请输入邮箱地址');
  });

  it('不含 @ → 请输入有效的邮箱地址', () => {
    assert.equal(email('foo'), '请输入有效的邮箱地址');
    assert.equal(email('foo.bar'), '请输入有效的邮箱地址');
  });

  it('含 @ → undefined 通过', () => {
    assert.equal(email('a@b'), undefined);
    assert.equal(email('admin@company.com'), undefined);
  });

  it('email 文案与原 register/login 完全一致', () => {
    // 钉死文案，避免两页文案未来漂移
    assert.equal(email(''), '请输入邮箱地址');
    assert.equal(email('not-an-email'), '请输入有效的邮箱地址');
  });
});

describe('[enterprise-validators] passwordMin', () => {
  it('n=6 短密码报错', () => {
    assert.equal(passwordMin(6)('12345')!, '密码长度至少6位');
  });

  it('n=6 等长通过', () => {
    assert.equal(passwordMin(6)('123456'), undefined);
  });

  it('n=8 短密码报错（register 实际用法）', () => {
    assert.equal(passwordMin(8)('1234567')!, '密码长度至少8位');
  });

  it('n=8 等长通过', () => {
    assert.equal(passwordMin(8)('12345678'), undefined);
  });

  it('空串报错', () => {
    assert.equal(passwordMin(8)('')!, '密码长度至少8位');
  });

  it('文案使用传入的 n', () => {
    assert.equal(passwordMin(6)('')!, '密码长度至少6位');
    assert.equal(passwordMin(20)('x')!, '密码长度至少20位');
  });
});

describe('[enterprise-validators] mobileCN', () => {
  it('空 → 请输入手机号', () => {
    assert.equal(mobileCN(''), '请输入手机号');
  });

  it('纯空格 → 请输入手机号', () => {
    assert.equal(mobileCN('   '), '请输入手机号');
  });

  it('不以 1 开头 → 请输入有效的手机号', () => {
    assert.equal(mobileCN('23800138000'), '请输入有效的手机号');
  });

  it('1 开头但第二位不在 3-9 → 报错', () => {
    assert.equal(mobileCN('12345678901'), '请输入有效的手机号');
    assert.equal(mobileCN('10000000000'), '请输入有效的手机号');
  });

  it('长度不够 → 报错', () => {
    assert.equal(mobileCN('1380013800'), '请输入有效的手机号');
  });

  it('合法 11 位手机号 → undefined', () => {
    assert.equal(mobileCN('13800138000'), undefined);
    assert.equal(mobileCN('19912345678'), undefined);
  });

  it('原 register/page.tsx:82 正则的合法样本集全通过', () => {
    const valid = ['13800138000', '15912345678', '17712345678', '18812345678', '19912345678'];
    for (const v of valid) {
      assert.equal(mobileCN(v), undefined, `${v} 应通过`);
    }
  });
});

describe('[enterprise-validators] matches', () => {
  it('all 缺失 → undefined（防呆）', () => {
    assert.equal(matches('password', '密码')('x'), undefined);
  });

  it('与目标字段相等 → 通过', () => {
    assert.equal(matches('password', '密码')('foo', { password: 'foo' }), undefined);
  });

  it('与目标字段不等 → 报错', () => {
    assert.equal(
      matches('password', '密码')('foo', { password: 'bar' }),
      '两次输入的密码不一致',
    );
  });

  it('文案使用传入的 label', () => {
    assert.equal(
      matches('email', '邮箱')('a', { email: 'b' }),
      '两次输入的邮箱不一致',
    );
  });
});

describe('[enterprise-validators] 合约回归 — 与原 register/login 行为一致', () => {
  it('register 6 字段全部通过的 happy path', () => {
    const all = {
      email: 'admin@company.com',
      password: 'Password1',
      confirmPassword: 'Password1',
      companyName: '深圳市某某科技有限公司',
      contactPerson: '张三',
      mobile: '13800138000',
    };
    const rules = {
      email,
      password: passwordMin(8),
      confirmPassword: matches('password', '密码'),
      companyName: required('企业名称'),
      contactPerson: required('联系人姓名'),
      mobile: mobileCN,
    };
    for (const [k, rule] of Object.entries(rules)) {
      assert.equal(rule(all[k as keyof typeof all], all), undefined, `${k} 应通过`);
    }
  });

  it('login 2 字段全部通过的 happy path', () => {
    const all = { email: 'a@b.com', password: '123456' };
    const rules = { email, password: passwordMin(6) };
    for (const [k, rule] of Object.entries(rules)) {
      assert.equal(rule(all[k as keyof typeof all], all), undefined, `${k} 应通过`);
    }
  });

  it('register confirmPassword 不一致仍报错', () => {
    const all = {
      email: 'admin@company.com',
      password: 'Password1',
      confirmPassword: 'Password2',
    };
    assert.equal(
      matches('password', '密码')('Password2', all),
      '两次输入的密码不一致',
    );
  });
});
