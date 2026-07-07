/**
 * use-enterprise-form-fields.test.ts — L1 合约测试
 *
 * 集中守护 3 个纯函数 helper（clearFieldError / setFieldValue / runFieldValidation）。
 * hook 自身依赖 React useState，不在无 @testing-library/react 的项目下写 e2e 测试；
 * 但核心契约（全量等价 delete key 策略、不可变更新、规则按字段返回错/通过），
 * 全部锁定在纯函数层。
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  clearFieldError,
  setFieldValue,
  runFieldValidation,
} from './use-enterprise-form-fields';
import { email, passwordMin, required, mobileCN, matches } from './enterprise-validators';

describe('[use-enterprise-form-fields] clearFieldError — delete key 策略', () => {
  it('字段无错时原样返回（不创建新对象）', () => {
    const prev = { email: 'bad' };
    const result = clearFieldError(prev, 'password');
    assert.equal(result, prev); // 引用相等，证明 no-op
  });

  it('字段有错时返回新对象且 key 已被删除', () => {
    const prev = { email: 'bad', password: 'short' };
    const result = clearFieldError(prev, 'email');
    assert.notEqual(result, prev);
    assert.deepEqual(Object.keys(result), ['password']);
    assert.equal(result.password, 'short');
  });

  it('全清空 → 返回空对象（不是 undefined）', () => {
    const prev = { email: 'bad' };
    const result = clearFieldError(prev, 'email');
    assert.deepEqual(result, {});
  });

  it('delete key 策略让 Object.keys 行为可预测', () => {
    // 这正是这次重构要钉死的语义：原 register 工厂和 login handler 用不同方式清错
    const prev = { email: 'x', password: 'y' };
    const afterEmail = clearFieldError(prev, 'email');
    const afterPassword = clearFieldError(afterEmail, 'password');
    assert.equal(Object.keys(afterPassword).length, 0);
  });
});

describe('[use-enterprise-form-fields] setFieldValue — 不可变更新', () => {
  it('新对象与原对象引用不同', () => {
    const prev = { email: 'a' };
    const next = setFieldValue(prev, 'email', 'b');
    assert.notEqual(next, prev);
  });

  it('只更新目标字段，其他字段保持引用', () => {
    const prev = { email: 'a', password: 'b' };
    const next = setFieldValue(prev, 'email', 'new');
    assert.equal(next.email, 'new');
    assert.equal(next.password, 'b');
  });

  it('可一次加新字段', () => {
    const prev = { email: 'a' };
    // setFieldValue 不限制 key 必须在 T 中
    const next = setFieldValue(prev, 'mobile', '13800138000');
    assert.equal(next.mobile, '13800138000');
  });
});

describe('[use-enterprise-form-fields] runFieldValidation — 规则按字段返回错/通过', () => {
  it('全空 + 全部规则 → 收集全部错误', () => {
    const values = { email: '', password: '', confirmPassword: '' };
    const rules = {
      email,
      password: passwordMin(8),
      confirmPassword: matches('password', '密码'),
    };
    const result = runFieldValidation(values, rules);
    assert.equal(result.email, '请输入邮箱地址');
    assert.equal(result.password, '密码长度至少8位');
    // matches 在 password 空时不会报错（空=空）
    assert.equal(result.confirmPassword, undefined);
  });

  it('全合法 + 全部规则 → 返回空对象', () => {
    const values = { email: 'a@b.com', password: '12345678', confirmPassword: '12345678' };
    const rules = {
      email,
      password: passwordMin(8),
      confirmPassword: matches('password', '密码'),
    };
    assert.deepEqual(runFieldValidation(values, rules), {});
  });

  it('不传某字段的规则 → 跳过校验', () => {
    const values = { email: '', password: '12345678' };
    const rules = { password: passwordMin(8) };
    const result = runFieldValidation(values, rules);
    assert.equal(result.email, undefined);
    assert.equal(result.password, undefined);
  });

  it('register 6 字段 happy path → 空 errors', () => {
    const values = {
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
    assert.deepEqual(runFieldValidation(values, rules), {});
  });

  it('register 6 字段 sad path → 收集 6 个错误', () => {
    const values = {
      email: 'no-at',
      password: '123',
      confirmPassword: '456',
      companyName: '   ',
      contactPerson: '',
      mobile: '12345',
    };
    const rules = {
      email,
      password: passwordMin(8),
      confirmPassword: matches('password', '密码'),
      companyName: required('企业名称'),
      contactPerson: required('联系人姓名'),
      mobile: mobileCN,
    };
    const result = runFieldValidation(values, rules);
    assert.equal(result.email, '请输入有效的邮箱地址');
    assert.equal(result.password, '密码长度至少8位');
    assert.equal(result.confirmPassword, '两次输入的密码不一致');
    assert.equal(result.companyName, '请输入企业名称');
    assert.equal(result.contactPerson, '请输入联系人姓名');
    assert.equal(result.mobile, '请输入有效的手机号');
    assert.equal(Object.keys(result).length, 6);
  });

  it('login 2 字段 happy path → 空 errors', () => {
    const values = { email: 'a@b.com', password: '123456' };
    const rules = { email, password: passwordMin(6) };
    assert.deepEqual(runFieldValidation(values, rules), {});
  });
});
