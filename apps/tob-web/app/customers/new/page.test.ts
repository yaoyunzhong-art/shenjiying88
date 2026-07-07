/**
 * customers/new page unit test — tob-web
 *
 * 验证新建客户表单的字段配置、验证规则、提交逻辑
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import { validateFormFields } from '@m5/ui';
import type { FormPageField } from '@m5/ui';

interface NewCustomerForm {
  companyName: string;
  contactName: string;
  contactPhone: string;
  contactEmail: string;
  industry: string;
  tier: string;
  status: string;
  region: string;
  city: string;
}

const FIELDS: FormPageField<Record<string, unknown>>[] = [
  {
    key: 'companyName',
    label: '公司名称',
    type: 'text',
    required: true,
    rules: [
      {
        validate: (v) =>
          typeof v === 'string' && v.length < 2 ? '公司名称至少2个字符' : null,
      },
      {
        validate: (v) =>
          typeof v === 'string' && v.length > 80 ? '公司名称最多80个字符' : null,
      },
    ],
  },
  {
    key: 'contactName',
    label: '联系人姓名',
    type: 'text',
    required: true,
    rules: [
      {
        validate: (v) =>
          typeof v === 'string' && v.length < 2 ? '联系人姓名至少2个字符' : null,
      },
    ],
  },
  {
    key: 'contactPhone',
    label: '联系人手机号',
    type: 'text',
    required: true,
    rules: [
      {
        validate: (v) =>
          typeof v === 'string' && !/^1\d{10}$/.test(v) ? '请输入有效的11位手机号' : null,
      },
    ],
  },
  {
    key: 'contactEmail',
    label: '邮箱',
    type: 'text',
    required: false,
    rules: [
      {
        validate: (v) =>
          typeof v === 'string' && v.length > 0 && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)
            ? '请输入有效的邮箱地址'
            : null,
      },
    ],
  },
  {
    key: 'industry',
    label: '所属行业',
    type: 'select',
    required: true,
    options: [
      { value: 'retail', label: '零售' },
      { value: 'tech', label: '科技' },
      { value: 'finance', label: '金融' },
    ],
  },
  {
    key: 'tier',
    label: '客户等级',
    type: 'select',
    required: true,
    options: [
      { value: 'platinum', label: '铂金' },
      { value: 'gold', label: '黄金' },
    ],
  },
  {
    key: 'status',
    label: '初始状态',
    type: 'select',
    required: true,
    initialValue: 'pending',
    options: [
      { value: 'active', label: '合作中' },
      { value: 'suspended', label: '暂停' },
      { value: 'pending', label: '待审核' },
      { value: 'churned', label: '已流失' },
    ],
  },
  {
    key: 'region',
    label: '所属区域',
    type: 'select',
    required: true,
    options: [
      { value: '华北', label: '华北' },
      { value: '华东', label: '华东' },
    ],
  },
  {
    key: 'city',
    label: '所在城市',
    type: 'text',
    required: true,
  },
];

describe('NewCustomerPage — form field config', () => {
  it('should have 9 fields defined', () => {
    assert.equal(FIELDS.length, 9);
  });

  it('every field should have a unique key', () => {
    const keys = FIELDS.map((f) => f.key);
    assert.equal(new Set(keys).size, keys.length, 'duplicate keys found');
  });

  it('every required field should have required=true', () => {
    const requiredFieldKeys = ['companyName', 'contactName', 'contactPhone', 'industry', 'tier', 'status', 'region', 'city'];
    for (const key of requiredFieldKeys) {
      const f = FIELDS.find((ff) => ff.key === key)!;
      assert.ok(f, `field "${key}" not found`);
      assert.ok(f!.required, `field "${key}" should be required`);
    }
  });

  it('contactEmail should be optional', () => {
    const fe = FIELDS.find((f) => f.key === 'contactEmail')!;
    assert.equal(fe.required, false);
  });

  it('status should initialValue be pending', () => {
    const fs = FIELDS.find((f) => f.key === 'status')!;
    assert.equal(fs.initialValue, 'pending');
  });

  it('companyName should have min/max length validation', () => {
    const fn = FIELDS.find((f) => f.key === 'companyName')!;
    assert.ok(fn.rules && fn.rules.length >= 2, 'expected ≥2 validation rules');
    // first rule: minLength
    assert.equal(fn.rules![0]!.validate('X'), '公司名称至少2个字符');
    assert.equal(fn.rules![0]!.validate('AB'), null);
    // second rule: maxLength
    const long = '公'.repeat(81);
    assert.equal(fn.rules![1]!.validate(long), '公司名称最多80个字符');
    assert.equal(fn.rules![1]!.validate('公'.repeat(80)), null);
  });

  it('contactPhone validation should work correctly', () => {
    const fp = FIELDS.find((f) => f.key === 'contactPhone')!;
    const rule = fp.rules![0]!.validate;
    assert.equal(rule('13800138000'), null, 'valid phone should pass');
    assert.equal(rule('123'), '请输入有效的11位手机号', 'short phone should fail');
    assert.equal(rule('23800138000'), '请输入有效的11位手机号', 'invalid prefix should fail');
    assert.equal(rule(''), '请输入有效的11位手机号', 'empty string should still fail pattern');
  });

  it('contactEmail validation should work correctly', () => {
    const fe = FIELDS.find((f) => f.key === 'contactEmail')!;
    const rule = fe.rules![0]!.validate;
    assert.equal(rule('test@example.com'), null, 'valid email should pass');
    assert.equal(rule('not-an-email'), '请输入有效的邮箱地址', 'invalid email should fail');
    assert.equal(rule(''), null, 'empty should pass (optional)');
    assert.equal(rule('@domain.com'), '请输入有效的邮箱地址', 'missing local part should fail');
  });
});

describe('NewCustomerPage — validateFormFields integration', () => {
  it('should return errors for empty required fields', () => {
    const result = validateFormFields(FIELDS as FormPageField<Record<string, unknown>>[], {
      companyName: '',
      contactName: '',
      contactPhone: '',
      industry: '',
      tier: '',
      region: '',
      city: '',
      status: '',
      contactEmail: '',
    });
    const errorKeys = Object.keys(result);
    assert.ok(errorKeys.length >= 6, `expected ≥6 errors, got ${errorKeys.length}: ${errorKeys.join(', ')}`);
  });

  it('should pass with complete valid data', () => {
    const result = validateFormFields(FIELDS as FormPageField<Record<string, unknown>>[], {
      companyName: '测试科技有限公司',
      contactName: '张三',
      contactPhone: '13800138000',
      contactEmail: 'zhangsan@test.cn',
      industry: 'tech',
      tier: 'gold',
      status: 'pending',
      region: '华北',
      city: '北京',
    });
    assert.deepEqual(result, {}, `expected no errors, got ${JSON.stringify(result)}`);
  });

  it('should reject invalid phone number', () => {
    const result = validateFormFields(FIELDS as FormPageField<Record<string, unknown>>[], {
      companyName: '测试公司',
      contactName: '李四',
      contactPhone: '1234',
      industry: 'retail',
      tier: 'silver',
      status: 'active',
      region: '华东',
      city: '上海',
      contactEmail: '',
    });
    assert.ok('contactPhone' in result, 'expected contactPhone error for short number');
  });

  it('should reject invalid email format', () => {
    const result = validateFormFields(FIELDS as FormPageField<Record<string, unknown>>[], {
      companyName: '测试公司',
      contactName: '王五',
      contactPhone: '13900139000',
      contactEmail: 'not-email',
      industry: 'finance',
      tier: 'platinum',
      status: 'pending',
      region: '华南',
      city: '深圳',
    });
    assert.ok('contactEmail' in result, 'expected contactEmail error for invalid format');
  });

  it('should allow empty email (optional)', () => {
    const result = validateFormFields(FIELDS as FormPageField<Record<string, unknown>>[], {
      companyName: '测试公司',
      contactName: '赵六',
      contactPhone: '13700137000',
      contactEmail: '',
      industry: 'education',
      tier: 'standard',
      status: 'active',
      region: '华中',
      city: '武汉',
    });
    assert.ok(!('contactEmail' in result), 'optional email should be allowed empty');
  });

  it('should reject companyName shorter than 2 characters', () => {
    const result = validateFormFields(FIELDS as FormPageField<Record<string, unknown>>[], {
      companyName: 'X',
      contactName: '测试',
      contactPhone: '13600136000',
      industry: 'tech',
      tier: 'gold',
      status: 'active',
      region: '华北',
      city: '北京',
      contactEmail: '',
    });
    assert.ok('companyName' in result, 'expected companyName error for too-short name');
  });

  it('should reject companyName longer than 80 characters', () => {
    const result = validateFormFields(FIELDS as FormPageField<Record<string, unknown>>[], {
      companyName: '特'.repeat(81),
      contactName: '测试',
      contactPhone: '13600136000',
      industry: 'tech',
      tier: 'gold',
      status: 'active',
      region: '华北',
      city: '北京',
      contactEmail: '',
    });
    assert.ok('companyName' in result, 'expected companyName error for too-long name');
  });
});
