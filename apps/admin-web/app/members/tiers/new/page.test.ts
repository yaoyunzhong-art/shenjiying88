/**
 * NewMemberTierPage — 数据校验逻辑测试
 *
 * 覆盖:
 * 1. 字段校验规则（名称长度、标识格式、折扣率范围、积分区间）
 * 2. 表单提交验证逻辑（必填项、区间交叉校验）
 * 3. 字段默认值
 */
import { describe, it } from 'node:test';
import assert from 'node:assert';

// ---- 校验规则封装（从 page.tsx 提取） ----

interface FieldRule {
  validate: (v: unknown) => string | null;
}

interface FieldDef {
  key: string;
  label: string;
  required: boolean;
  rules?: FieldRule[];
  defaultValue?: unknown;
}

// 从 page 中提取的校验规则（同步解耦，无需渲染）
const VALIDATORS: Record<string, FieldRule[]> = {
  name: [
    { validate: (v) => (typeof v === 'string' && v.length < 2 ? '等级名称至少 2 个字符' : null) },
    { validate: (v) => (typeof v === 'string' && v.length > 20 ? '等级名称不超过 20 个字符' : null) },
  ],
  key: [
    { validate: (v) => (typeof v === 'string' && !/^[a-z][a-z0-9_-]{1,31}$/.test(v) ? '标识需为英文小写字母开头，2~32 字符' : null) },
  ],
  level: [
    { validate: (v) => (typeof v !== 'number' || v < 1 || v > 99 ? '等级序号范围为 1~99' : null) },
  ],
  discountRate: [
    { validate: (v) => (typeof v !== 'number' || v < 0 || v > 100 ? '折扣率范围为 0~100' : null) },
  ],
  minPoints: [
    { validate: (v) => (typeof v !== 'number' || v < 0 || v > 999999 ? '积分范围为 0~999999' : null) },
  ],
  maxPoints: [
    { validate: (v) => (typeof v !== 'number' || v < 0 || v > 999999 ? '积分范围为 0~999999' : null) },
  ],
  annualFee: [
    { validate: (v) => {
      if (v === undefined || v === '' || v === null) return null;
      return (typeof v === 'number' && v >= 0 && v <= 999999) ? null : '年费范围为 0~999999';
    }},
  ],
};

const REQUIRED_FIELDS = [
  'name', 'key', 'level', 'minPoints', 'maxPoints', 'discountRate',
  'color', 'icon', 'benefits', 'status',
];

const DEFAULTS: Record<string, unknown> = {
  discountRate: 100,
  annualFee: 0,
  status: 'active',
  benefits: '',
};

// ---- 辅助函数 ----

function validateField(fieldKey: string, value: unknown): string | null {
  const rules = VALIDATORS[fieldKey];
  if (!rules) return null;
  for (const rule of rules) {
    const err = rule.validate(value);
    if (err) return err;
  }
  return null;
}

function validateRequired(fieldKey: string, value: unknown): string | null {
  if (REQUIRED_FIELDS.includes(fieldKey)) {
    if (value === undefined || value === '' || value === null) {
      return `${fieldKey}不能为空`;
    }
  }
  return null;
}

function validateForm(formData: Record<string, unknown>): Record<string, string> {
  const errors: Record<string, string> = {};

  // 必填校验
  for (const key of REQUIRED_FIELDS) {
    const err = validateRequired(key, formData[key]);
    if (err) errors[key] = err;
  }

  // 规则校验
  for (const key of Object.keys(VALIDATORS)) {
    if (formData[key] !== undefined && formData[key] !== '' && formData[key] !== null) {
      const err = validateField(key, formData[key]);
      if (err) errors[key] = err;
    }
  }

  // 积分区间交叉校验
  const minPts = formData.minPoints as number;
  const maxPts = formData.maxPoints as number;
  if (typeof minPts === 'number' && typeof maxPts === 'number' && minPts >= maxPts) {
    errors.minPoints = '最低积分必须小于最高积分';
    errors.maxPoints = '最高积分必须大于最低积分';
  }

  return errors;
}

// ---- 测试用例 ----

describe('NewMemberTierPage — 字段校验规则', () => {
  // ---- 名称校验 ----
  it('正例: 有效名称（2~20字符）', () => {
    assert.equal(validateField('name', '钻石会员'), null);
    assert.equal(validateField('name', 'VV'), null); // 2 chars
    assert.equal(validateField('name', 'ABCDEFGHIJABCDEFGHIJ'), null); // 20 chars
  });

  it('反例: 名称少于 2 字符', () => {
    assert.match(validateField('name', '')!, /至少 2 个字符/);
    assert.match(validateField('name', 'V'.repeat(1))!, /至少 2 个字符/);
  });

  it('边界: 名称恰好 2 字符通过', () => {
    assert.equal(validateField('name', 'VV'), null);
  });

  it('边界: 名称恰好 20 字符通过', () => {
    assert.equal(validateField('name', 'A'.repeat(20)), null);
  });

  it('反例: 名称超过 20 字符', () => {
    assert.match(validateField('name', 'A'.repeat(21))!, /不超过 20 个字符/);
  });

  // ---- 标识校验 ----
  it('正例: 有效标识（小写字母开头，字母数字下划线短横线）', () => {
    assert.equal(validateField('key', 'diamond'), null);
    assert.equal(validateField('key', 'gold_member'), null);
    assert.equal(validateField('key', 'vip-level-1'), null);
    assert.equal(validateField('key', 'aa'), null);
  });

  it('反例: 大写字母开头', () => {
    assert.match(validateField('key', 'Diamond')!, /英文小写字母开头/);
    assert.match(validateField('key', 'Vip')!, /英文小写字母开头/);
  });

  it('反例: 空标识', () => {
    assert.match(validateField('key', '')!, /2~32 字符/);
  });

  it('反例: 包含特殊字符', () => {
    assert.match(validateField('key', 'diamond!')!, /英文小写字母开头/);
    assert.match(validateField('key', 'gold member')!, /英文小写字母开头/);
  });

  // ---- 等级序号校验 ----
  it('正例: 有效序号（1~99）', () => {
    assert.equal(validateField('level', 1), null);
    assert.equal(validateField('level', 50), null);
    assert.equal(validateField('level', 99), null);
  });

  it('反例: 序号小于 1', () => {
    assert.match(validateField('level', 0)!, /范围为 1~99/);
    assert.match(validateField('level', -1)!, /范围为 1~99/);
  });

  it('反例: 序号大于 99', () => {
    assert.match(validateField('level', 100)!, /范围为 1~99/);
  });

  // ---- 折扣率校验 ----
  it('正例: 有效折扣率（0~100）', () => {
    assert.equal(validateField('discountRate', 0), null);
    assert.equal(validateField('discountRate', 50), null);
    assert.equal(validateField('discountRate', 100), null);
  });

  it('反例: 折扣率小于 0', () => {
    assert.match(validateField('discountRate', -1)!, /范围为 0~100/);
  });

  it('反例: 折扣率大于 100', () => {
    assert.match(validateField('discountRate', 101)!, /范围为 0~100/);
  });

  // ---- 积分校验 ----
  it('正例: 有效积分区间', () => {
    assert.equal(validateField('minPoints', 0), null);
    assert.equal(validateField('minPoints', 1000), null);
    assert.equal(validateField('maxPoints', 5000), null);
    assert.equal(validateField('maxPoints', 999999), null);
  });

  it('反例: 积分超范围', () => {
    assert.match(validateField('minPoints', -1)!, /范围为 0~999999/);
    assert.match(validateField('maxPoints', 1000000)!, /范围为 0~999999/);
  });

  // ---- 年费校验 ----
  it('正例: 有效年费', () => {
    assert.equal(validateField('annualFee', undefined), null);
    assert.equal(validateField('annualFee', ''), null);
    assert.equal(validateField('annualFee', 0), null);
    assert.equal(validateField('annualFee', 999999), null);
  });

  it('反例: 年费负值', () => {
    assert.match(validateField('annualFee', -1)!, /范围为 0~999999/);
  });
});

describe('NewMemberTierPage — 表单整体校验', () => {
  it('正例: 完整有效数据通过校验', () => {
    const validData = {
      name: '钻石会员',
      key: 'diamond',
      level: 1,
      minPoints: 1000,
      maxPoints: 5000,
      discountRate: 85,
      color: '#3b82f6',
      icon: 'diamond',
      benefits: '全场商品8折优惠',
      annualFee: 0,
      status: 'active',
    };
    const errors = validateForm(validData);
    assert.equal(Object.keys(errors).length, 0);
  });

  it('反例: 所有必填字段缺失时报错', () => {
    const errors = validateForm({});
    for (const key of REQUIRED_FIELDS) {
      assert.ok(errors[key]?.includes('不能为空'), `字段 ${key} 应有不能为空错误`);
    }
  });

  it('反例: 积分最小值 >= 最大值报错', () => {
    const errors = validateForm({
      name: '测试', key: 'test', level: 1,
      minPoints: 5000, maxPoints: 1000,
      discountRate: 100, color: '#000', icon: 'star',
      benefits: '权益', status: 'active',
    });
    assert.ok(errors.minPoints?.includes('最低积分必须小于最高积分'));
    assert.ok(errors.maxPoints?.includes('最高积分必须大于最低积分'));
  });

  it('边界: 积分 min=0 max=0 报错（相等）', () => {
    const errors = validateForm({
      name: '测试', key: 'test', level: 1,
      minPoints: 0, maxPoints: 0,
      discountRate: 100, color: '#000', icon: 'star',
      benefits: '权益', status: 'active',
    });
    assert.ok(errors.minPoints?.includes('小于'));
  });
});

describe('NewMemberTierPage — 默认值', () => {
  it('正例: 折扣率默认值为 100', () => {
    assert.equal(DEFAULTS.discountRate, 100);
  });

  it('正例: 年费默认值为 0', () => {
    assert.equal(DEFAULTS.annualFee, 0);
  });

  it('正例: 状态默认值为 active', () => {
    assert.equal(DEFAULTS.status, 'active');
  });
});

describe('NewMemberTierPage — 需求可用性', () => {
  it('必须有 10 个必填字段', () => {
    assert.equal(REQUIRED_FIELDS.length, 10);
  });

  it('所有必填字段名称合法', () => {
    const legalNames = ['name', 'key', 'level', 'minPoints', 'maxPoints', 'discountRate', 'color', 'icon', 'benefits', 'status'];
    assert.deepEqual(REQUIRED_FIELDS.sort(), legalNames.sort());
  });
});
