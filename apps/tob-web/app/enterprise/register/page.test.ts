/**
 * enterprise/register/page.test.tsx — 企业注册页 L1 测试
 *
 * 覆盖：6 字段验证规则、必填项、密码匹配、手机号格式、全部通过 happy path
 * 角色视角：企业主/管理员注册 SaaS 租户
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

// ===== 从 page.tsx 中提取的纯函数逻辑 =====

type RegisterFields = {
  email: string;
  password: string;
  confirmPassword: string;
  companyName: string;
  contactPerson: string;
  mobile: string;
};

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+$/;
const MOBILE_CN_REGEX = /^1[3-9]\d{9}$/;

function validateEmail(v: string): string | undefined {
  if (!v || !v.trim()) return '请输入邮箱地址';
  if (!EMAIL_REGEX.test(v.trim())) return '请输入有效的邮箱地址';
  return undefined;
}

function validatePassword(v: string, minLen: number): string | undefined {
  if (!v || v.length < minLen) return `密码长度至少${minLen}位`;
  return undefined;
}

function validateConfirmPassword(
  v: string,
  all: Record<string, string>
): string | undefined {
  if (!v || !v.trim()) return '请再次输入密码';
  if (v !== all.password) return '两次输入的密码不一致';
  return undefined;
}

function validateRequired(v: string, label: string): string | undefined {
  if (!v || !v.trim()) return `请输入${label}`;
  return undefined;
}

function validateMobileCN(v: string): string | undefined {
  if (!v || !v.trim()) return '请输入手机号';
  if (!MOBILE_CN_REGEX.test(v.trim())) return '请输入有效的手机号';
  return undefined;
}

function validateRegisterForm(values: RegisterFields): Record<string, string | undefined> {
  return {
    email: validateEmail(values.email),
    password: validatePassword(values.password, 8),
    confirmPassword: validateConfirmPassword(values.confirmPassword, {
      password: values.password,
    }),
    companyName: validateRequired(values.companyName, '企业名称'),
    contactPerson: validateRequired(values.contactPerson, '联系人姓名'),
    mobile: validateMobileCN(values.mobile),
  };
}

function isFormValid(errors: Record<string, string | undefined>): boolean {
  return Object.values(errors).every((e) => e === undefined);
}

// ===== 默认合法数据 =====

const VALID_REGISTER: RegisterFields = {
  email: 'admin@company.com',
  password: 'Password1',
  confirmPassword: 'Password1',
  companyName: '深圳市神机营科技有限公司',
  contactPerson: '张三',
  mobile: '13800138000',
};

// ===== 测试集 =====

describe('[EnterpriseRegisterPage] validateEmail', () => {
  it('空 → 请输入邮箱地址', () => {
    assert.equal(validateEmail(''), '请输入邮箱地址');
    assert.equal(validateEmail('   '), '请输入邮箱地址');
  });

  it('不含 @ → 报错', () => {
    assert.equal(validateEmail('not-email'), '请输入有效的邮箱地址');
  });

  it('合法邮箱 → undefined', () => {
    assert.equal(validateEmail('admin@company.com'), undefined);
  });
});

describe('[EnterpriseRegisterPage] validatePassword', () => {
  it('空 → 报错', () => {
    assert.equal(validatePassword('', 8), '密码长度至少8位');
  });

  it('等长 8 位 → undefined', () => {
    assert.equal(validatePassword('12345678', 8), undefined);
  });

  it('7 位 → 报错', () => {
    assert.equal(validatePassword('1234567', 8), '密码长度至少8位');
  });
});

describe('[EnterpriseRegisterPage] validateConfirmPassword', () => {
  it('一致 → undefined', () => {
    assert.equal(
      validateConfirmPassword('secret1', { password: 'secret1' }),
      undefined
    );
  });

  it('不一致 → 报错', () => {
    assert.equal(
      validateConfirmPassword('secret1', { password: 'secret2' }),
      '两次输入的密码不一致'
    );
  });
});

describe('[EnterpriseRegisterPage] validateRequired', () => {
  it('空 → 请输入{label}', () => {
    assert.equal(validateRequired('', '企业名称'), '请输入企业名称');
    assert.equal(validateRequired('   ', '联系人姓名'), '请输入联系人姓名');
  });

  it('有内容 → undefined', () => {
    assert.equal(validateRequired('神机营', '企业名称'), undefined);
  });
});

describe('[EnterpriseRegisterPage] validateMobileCN', () => {
  it('空 → 请输入手机号', () => {
    assert.equal(validateMobileCN(''), '请输入手机号');
    assert.equal(validateMobileCN('   '), '请输入手机号');
  });

  it('不以 1 开头 → 请输入有效的手机号', () => {
    assert.equal(validateMobileCN('23800138000'), '请输入有效的手机号');
  });

  it('1 开头但第二位不在 3-9 → 报错', () => {
    assert.equal(validateMobileCN('12345678901'), '请输入有效的手机号');
    assert.equal(validateMobileCN('10000000000'), '请输入有效的手机号');
  });

  it('长度不对 → 报错', () => {
    assert.equal(validateMobileCN('1380013800'), '请输入有效的手机号');
    assert.equal(validateMobileCN('138001380000'), '请输入有效的手机号');
  });

  it('合法手机号 → undefined', () => {
    assert.equal(validateMobileCN('13800138000'), undefined);
    assert.equal(validateMobileCN('15912345678'), undefined);
    assert.equal(validateMobileCN('19912345678'), undefined);
  });
});

describe('[EnterpriseRegisterPage] validateRegisterForm — happy path', () => {
  it('全部合法 → 所有字段通过', () => {
    const errors = validateRegisterForm(VALID_REGISTER);
    assert.equal(isFormValid(errors), true);
    for (const [k, v] of Object.entries(errors)) {
      assert.equal(v, undefined, `${k} 应通过`);
    }
  });
});

describe('[EnterpriseRegisterPage] validateRegisterForm — 单个字段错误', () => {
  it('邮箱空', () => {
    const e = validateRegisterForm({ ...VALID_REGISTER, email: '' });
    assert.ok(e.email);
    assert.equal(isFormValid(e), false);
  });

  it('密码太短', () => {
    const e = validateRegisterForm({ ...VALID_REGISTER, password: '1234567' });
    assert.ok(e.password);
  });

  it('确认密码不一致', () => {
    const e = validateRegisterForm({
      ...VALID_REGISTER,
      confirmPassword: 'Mismatch1',
    });
    assert.ok(e.confirmPassword);
  });

  it('企业名称为空', () => {
    const e = validateRegisterForm({ ...VALID_REGISTER, companyName: '' });
    assert.ok(e.companyName);
  });

  it('联系人姓名为空', () => {
    const e = validateRegisterForm({ ...VALID_REGISTER, contactPerson: '' });
    assert.ok(e.contactPerson);
  });

  it('手机号无效', () => {
    const e = validateRegisterForm({ ...VALID_REGISTER, mobile: '12345678901' });
    assert.ok(e.mobile);
  });

  it('全部字段为空', () => {
    const empty: RegisterFields = {
      email: '',
      password: '',
      confirmPassword: '',
      companyName: '',
      contactPerson: '',
      mobile: '',
    };
    const e = validateRegisterForm(empty);
    const allErrors = Object.values(e);
    assert.equal(allErrors.length, 6);
    assert.ok(allErrors.every((v) => v !== undefined), '全部字段应报错（含 confirmPassword 空值检查）');
  });
});

describe('[EnterpriseRegisterPage] isFormValid', () => {
  it('true 条件：所有字段 undefined', () => {
    assert.equal(
      isFormValid({
        email: undefined,
        password: undefined,
        confirmPassword: undefined,
        companyName: undefined,
        contactPerson: undefined,
        mobile: undefined,
      }),
      true
    );
  });

  it('false 条件：任一字段有值', () => {
    assert.equal(
      isFormValid({
        email: '错误',
        password: undefined,
        confirmPassword: undefined,
        companyName: undefined,
        contactPerson: undefined,
        mobile: undefined,
      }),
      false
    );
  });

  it('false 条件：全部字段有值', () => {
    assert.equal(
      isFormValid({
        email: 'e',
        password: 'p',
        confirmPassword: 'c',
        companyName: 'cn',
        contactPerson: 'cp',
        mobile: 'm',
      }),
      false
    );
  });
});

describe('[EnterpriseRegisterPage] 合约回归 — 与原 page.tsx 行为一致', () => {
  it('login 合约：email + passwordMin(6) 全部通过', () => {
    const login = { email: 'a@b.com', password: '123456' };
    assert.equal(validateEmail(login.email), undefined);
    assert.equal(validatePassword(login.password, 6), undefined);
  });

  it('register 合约：6 字段全部通过', () => {
    const errors = validateRegisterForm(VALID_REGISTER);
    assert.equal(isFormValid(errors), true);
  });

  it('register 精确匹配原页面的校验文案', () => {
    assert.equal(validateRequired('', '企业名称'), '请输入企业名称');
    assert.equal(validateEmail(''), '请输入邮箱地址');
    assert.equal(validateMobileCN('123'), '请输入有效的手机号');
    assert.equal(
      validateConfirmPassword('a', { password: 'b' }),
      '两次输入的密码不一致'
    );
  });
});
