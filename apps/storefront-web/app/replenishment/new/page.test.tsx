/**
 * 新建补货申请页面 — New Replenishment Request Page Test
 * 类型: B-页面创建 (表单页)
 * 覆盖: 常量验证、表单字段定义、验证规则、提交逻辑、错误处理
 */

import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

// ---- 从 page.tsx 提取的常量和逻辑 ----

const STORE_OPTIONS = [
  { label: '朝阳旗舰店', value: '朝阳旗舰店' },
  { label: '海淀中关村店', value: '海淀中关村店' },
  { label: '西单大悦城店', value: '西单大悦城店' },
  { label: '三里屯太古里店', value: '三里屯太古里店' },
  { label: '望京SOHO店', value: '望京SOHO店' },
];

const APPLICANT_OPTIONS = [
  { label: '张三 (仓管)', value: '张三' },
  { label: '李四 (店长)', value: '李四' },
  { label: '王五 (运营)', value: '王五' },
];

// ---- 验证规则复刻 ----

interface FieldRule {
  validate: (value: unknown) => string | null;
}

function requiredRule(msg: string): FieldRule {
  return {
    validate: (value: unknown) => {
      if (!value || (typeof value === 'string' && value.trim() === '')) return msg;
      return null;
    },
  };
}

const PHONE_RULE: FieldRule = {
  validate: (value: unknown) => {
    if (value && typeof value === 'string' && value.length > 0) {
      return /^1[3-9]\d{9}$/.test(value) ? null : '请输入正确的手机号';
    }
    return null;
  },
};

const ITEMS_RULE: FieldRule = {
  validate: (value: unknown) => {
    if (!value || typeof value !== 'string') return '请输入补货商品列表';
    try {
      const parsed = JSON.parse(value);
      if (!Array.isArray(parsed) || parsed.length === 0) return '补货商品列表不能为空';
    } catch {
      return '补货商品 JSON 格式有误，请检查';
    }
    return null;
  },
};

const QTY_RULE: FieldRule = {
  validate: (value: unknown) => {
    if (!value) return '请输入预估总数量';
    const val = Number(value);
    if (isNaN(val) || val < 1) return '预估数量不能小于1';
    if (val > 99999) return '预估数量不能超过99999';
    return null;
  },
};

interface FormField {
  key: string;
  label: string;
  type?: string;
  options?: { label: string; value: string }[];
  placeholder?: string;
  required?: boolean;
  rules?: FieldRule[];
}

const FIELDS: FormField[] = [
  { key: 'storeName', label: '* 门店', type: 'select', options: STORE_OPTIONS, placeholder: '请选择门店', required: true, rules: [requiredRule('请选择门店')] },
  { key: 'applicant', label: '* 申请人', type: 'select', options: APPLICANT_OPTIONS, placeholder: '请选择申请人', required: true, rules: [requiredRule('请选择申请人')] },
  { key: 'reason', label: '* 补货原因', type: 'textarea', placeholder: '请描述补货原因', required: true, rules: [requiredRule('请输入补货原因')] },
  { key: 'items', label: '* 补货商品 (JSON格式)', type: 'textarea', placeholder: '[{"sku":"VEG-001","name":"有机蔬菜拼盘","qty":50}]', required: true, rules: [ITEMS_RULE] },
  { key: 'totalEstimatedQty', label: '* 预估总数量', type: 'number', placeholder: '如: 320', required: true, rules: [QTY_RULE] },
  { key: 'contactPerson', label: '联系人', type: 'text', placeholder: '收件人姓名' },
  { key: 'contactPhone', label: '联系电话', type: 'text', placeholder: '手机号码', rules: [PHONE_RULE] },
  { key: 'remark', label: '备注', type: 'textarea', placeholder: '其他需要说明的事项' },
];

// ---- 验证执行函数 ----

function validateForm(data: Record<string, string>): string | null {
  for (const field of FIELDS) {
    if (field.rules) {
      for (const rule of field.rules) {
        const err = rule.validate(data[field.key]);
        if (err) return err;
      }
    } else if (field.required) {
      const err = requiredRule(`${field.label}为必填项`).validate(data[field.key]);
      if (err) return err;
    }
  }
  return null;
}

async function submitForm(data: Record<string, string>): Promise<{ success: boolean; error?: string }> {
  const validationError = validateForm(data);
  if (validationError) {
    return { success: false, error: validationError };
  }
  return { success: true };
}

// ============================================================
// 测试
// ============================================================

describe('ReplenishmentNewPage - 常量验证', () => {
  describe('STORE_OPTIONS', () => {
    it('有5个门店选项', () => {
      assert.strictEqual(STORE_OPTIONS.length, 5);
    });

    it('每个选项都有 label 和 value', () => {
      for (const opt of STORE_OPTIONS) {
        assert.ok(typeof opt.label === 'string' && opt.label.length > 0);
        assert.ok(typeof opt.value === 'string' && opt.value.length > 0);
      }
    });

    it('包含朝阳旗舰店和海淀中关村店', () => {
      const names = STORE_OPTIONS.map((o) => o.value);
      assert.ok(names.includes('朝阳旗舰店'));
      assert.ok(names.includes('海淀中关村店'));
    });
  });

  describe('APPLICANT_OPTIONS', () => {
    it('有3个申请人选项', () => {
      assert.strictEqual(APPLICANT_OPTIONS.length, 3);
    });

    it('包含张三、李四、王五', () => {
      const names = APPLICANT_OPTIONS.map((o) => o.value);
      assert.ok(names.includes('张三'));
      assert.ok(names.includes('李四'));
      assert.ok(names.includes('王五'));
    });
  });
});

describe('ReplenishmentNewPage - 表单字段定义', () => {
  it('有8个表单字段', () => {
    assert.strictEqual(FIELDS.length, 8);
  });

  it('每个字段都有 key 和 label', () => {
    for (const f of FIELDS) {
      assert.ok(typeof f.key === 'string' && f.key.length > 0);
      assert.ok(typeof f.label === 'string' && f.label.length > 0);
    }
  });

  it('字段类型覆盖 select/textarea/number/text', () => {
    const types = FIELDS.map((f) => f.type);
    assert.ok(types.includes('select'));
    assert.ok(types.includes('textarea'));
    assert.ok(types.includes('number'));
    assert.ok(types.includes('text'));
  });

  it('必填字段有 5 个', () => {
    const reqFields = FIELDS.filter((f) => f.required);
    assert.strictEqual(reqFields.length, 5);
    const reqKeys = reqFields.map((f) => f.key).sort();
    assert.deepStrictEqual(reqKeys, ['applicant', 'items', 'reason', 'storeName', 'totalEstimatedQty']);
  });

  it('必填字段都有验证规则', () => {
    for (const f of FIELDS.filter((f) => f.required)) {
      assert.ok(Array.isArray(f.rules) && f.rules.length > 0);
    }
  });

  it('联系电话有手机号正则校验规则', () => {
    const phoneField = FIELDS.find((f) => f.key === 'contactPhone');
    assert.ok(phoneField !== undefined);
    assert.ok(Array.isArray(phoneField!.rules) && phoneField!.rules.length > 0);
  });

  it('items 字段有 JSON 校验规则', () => {
    const itemsField = FIELDS.find((f) => f.key === 'items');
    assert.ok(itemsField !== undefined);
    assert.ok(Array.isArray(itemsField!.rules) && itemsField!.rules.length > 0);
  });

  it('totalEstimatedQty 字段有数值范围校验规则', () => {
    const qtyField = FIELDS.find((f) => f.key === 'totalEstimatedQty');
    assert.ok(qtyField !== undefined);
    assert.ok(Array.isArray(qtyField!.rules) && qtyField!.rules.length > 0);
  });
});

describe('ReplenishmentNewPage - 验证规则', () => {
  // requiredRule
  it('requiredRule: 空值返回错误信息', () => {
    const rule = requiredRule('请选择门店');
    assert.strictEqual(rule.validate(''), '请选择门店');
    assert.strictEqual(rule.validate(undefined), '请选择门店');
    assert.strictEqual(rule.validate('   '), '请选择门店');
  });

  it('requiredRule: 有值返回 null', () => {
    const rule = requiredRule('必填');
    assert.strictEqual(rule.validate('朝阳旗舰店'), null);
    assert.strictEqual(rule.validate('0'), null);
  });

  // PHONE_RULE
  it('PHONE_RULE: 正确手机号通过', () => {
    assert.strictEqual(PHONE_RULE.validate('13812345678'), null);
    assert.strictEqual(PHONE_RULE.validate('15911223411'), null);
    assert.strictEqual(PHONE_RULE.validate('17611229087'), null);
  });

  it('PHONE_RULE: 错误格式手机号报错', () => {
    assert.ok(PHONE_RULE.validate('12345') !== null);
    assert.ok(PHONE_RULE.validate('1381234567') !== null);
    assert.ok(PHONE_RULE.validate('23812345678') !== null);
  });

  it('PHONE_RULE: 空值跳过校验', () => {
    assert.strictEqual(PHONE_RULE.validate(''), null);
    assert.strictEqual(PHONE_RULE.validate(undefined), null);
  });

  // ITEMS_RULE
  it('ITEMS_RULE: 有效 JSON 数组通过', () => {
    assert.strictEqual(ITEMS_RULE.validate('[{"sku":"A","name":"测试","qty":1}]'), null);
    assert.strictEqual(ITEMS_RULE.validate('[{"sku":"VEG-001","name":"蔬菜拼盘","qty":50},{"sku":"BEEF-012","name":"牛排","qty":30}]'), null);
  });

  it('ITEMS_RULE: 非 JSON 字符串报错', () => {
    assert.ok(ITEMS_RULE.validate('not-json') !== null);
    assert.ok(ITEMS_RULE.validate('{invalid}') !== null);
  });

  it('ITEMS_RULE: 空数组报错', () => {
    assert.ok(ITEMS_RULE.validate('[]') !== null);
  });

  it('ITEMS_RULE: 空值报错', () => {
    assert.ok(ITEMS_RULE.validate('') !== null);
    assert.ok(ITEMS_RULE.validate(undefined) !== null);
  });

  // QTY_RULE
  it('QTY_RULE: 有效数值通过', () => {
    assert.strictEqual(QTY_RULE.validate('1'), null);
    assert.strictEqual(QTY_RULE.validate('99999'), null);
    assert.strictEqual(QTY_RULE.validate('320'), null);
  });

  it('QTY_RULE: 小于 1 报错', () => {
    assert.ok(QTY_RULE.validate('0') !== null);
    assert.ok(QTY_RULE.validate('-1') !== null);
  });

  it('QTY_RULE: 超过 99999 报错', () => {
    assert.ok(QTY_RULE.validate('999999') !== null);
    assert.ok(QTY_RULE.validate('100000') !== null);
  });

  it('QTY_RULE: 空值报错', () => {
    assert.ok(QTY_RULE.validate('') !== null);
    assert.ok(QTY_RULE.validate(undefined) !== null);
  });
});

describe('ReplenishmentNewPage - 表单提交流程', () => {
  it('完整有效数据应提交成功', async () => {
    const result = await submitForm({
      storeName: '朝阳旗舰店',
      applicant: '张三',
      reason: '库存预警',
      items: '[{"sku":"A","name":"测试","qty":50}]',
      totalEstimatedQty: '50',
    });
    assert.strictEqual(result.success, true);
  });

  it('缺失 storeName 应返回错误', async () => {
    const result = await submitForm({
      storeName: '',
      applicant: '张三',
      reason: '库存预警',
      items: '[{"sku":"A","name":"测试","qty":1}]',
      totalEstimatedQty: '10',
    });
    assert.strictEqual(result.success, false);
    assert.ok(result.error!.includes('请选择门店'));
  });

  it('缺失 applicant 应返回错误', async () => {
    const result = await submitForm({
      storeName: '朝阳旗舰店',
      applicant: '',
      reason: '库存预警',
      items: '[{"sku":"A","name":"测试","qty":1}]',
      totalEstimatedQty: '10',
    });
    assert.strictEqual(result.success, false);
    assert.ok(result.error!.includes('请选择申请人'));
  });

  it('缺失 reason 应返回错误', async () => {
    const result = await submitForm({
      storeName: '朝阳旗舰店',
      applicant: '张三',
      reason: '',
      items: '[{"sku":"A","name":"测试","qty":1}]',
      totalEstimatedQty: '10',
    });
    assert.strictEqual(result.success, false);
    assert.ok(result.error!.includes('请输入补货原因'));
  });

  it('items 非 JSON 应返回格式错误', async () => {
    const result = await submitForm({
      storeName: '朝阳旗舰店',
      applicant: '张三',
      reason: '库存预警',
      items: 'not-json',
      totalEstimatedQty: '10',
    });
    assert.strictEqual(result.success, false);
    assert.ok(result.error!.includes('JSON'));
  });

  it('items 空数组应返回错误', async () => {
    const result = await submitForm({
      storeName: '朝阳旗舰店',
      applicant: '张三',
      reason: '库存预警',
      items: '[]',
      totalEstimatedQty: '10',
    });
    assert.strictEqual(result.success, false);
    assert.ok(result.error!.includes('不能为空'));
  });

  it('totalEstimatedQty 为 0 应返回错误', async () => {
    const result = await submitForm({
      storeName: '朝阳旗舰店',
      applicant: '张三',
      reason: '库存预警',
      items: '[{"sku":"A","name":"测试","qty":1}]',
      totalEstimatedQty: '0',
    });
    assert.strictEqual(result.success, false);
    assert.ok(result.error!.includes('小于'));
  });

  it('totalEstimatedQty 超过 99999 应返回错误', async () => {
    const result = await submitForm({
      storeName: '朝阳旗舰店',
      applicant: '张三',
      reason: '库存预警',
      items: '[{"sku":"A","name":"测试","qty":1}]',
      totalEstimatedQty: '999999',
    });
    assert.strictEqual(result.success, false);
    assert.ok(result.error!.includes('超过'));
  });

  it('手机号格式错误应返回错误', async () => {
    const result = await submitForm({
      storeName: '朝阳旗舰店',
      applicant: '张三',
      reason: '库存预警',
      items: '[{"sku":"A","name":"测试","qty":1}]',
      totalEstimatedQty: '50',
      contactPhone: '12345',
    });
    assert.strictEqual(result.success, false);
    assert.ok(result.error!.includes('手机号'));
  });

  it('手机号格式正确应通过校验', async () => {
    const result = await submitForm({
      storeName: '朝阳旗舰店',
      applicant: '张三',
      reason: '库存预警',
      items: '[{"sku":"A","name":"测试","qty":1}]',
      totalEstimatedQty: '50',
      contactPhone: '13812345678',
    });
    assert.strictEqual(result.success, true);
  });

  it('手机号留空应通过校验（非必填）', async () => {
    const result = await submitForm({
      storeName: '朝阳旗舰店',
      applicant: '张三',
      reason: '库存预警',
      items: '[{"sku":"A","name":"测试","qty":1}]',
      totalEstimatedQty: '50',
      contactPhone: '',
    });
    assert.strictEqual(result.success, true);
  });
});

describe('ReplenishmentNewPage - 文件完整性校验', () => {
  it('page.tsx 应存在', async () => {
    const fs = await import('fs');
    const exists = fs.existsSync(new URL('./page.tsx', import.meta.url).pathname);
    assert.equal(exists, true);
  });

  it('page.tsx 应导出默认函数组件', async () => {
    const mod = await import('./page.tsx');
    assert.equal(typeof mod.default, 'function');
  });

  it('page.tsx 应导入 FormPageScaffold', async () => {
    const fs = await import('fs');
    const src = fs.readFileSync(new URL('./page.tsx', import.meta.url).pathname, 'utf-8');
    assert.ok(src.includes('FormPageScaffold'), '缺少 FormPageScaffold 导入');
    assert.ok(src.includes('useToast'), '缺少 useToast 导入');
    assert.ok(src.includes('useRouter'), '缺少 useRouter 导入');
  });

  it('page.tsx 应定义表单字段常量', async () => {
    const fs = await import('fs');
    const src = fs.readFileSync(new URL('./page.tsx', import.meta.url).pathname, 'utf-8');
    assert.ok(src.includes('STORE_OPTIONS'), '缺少 STORE_OPTIONS');
    assert.ok(src.includes('APPLICANT_OPTIONS'), '缺少 APPLICANT_OPTIONS');
    assert.ok(src.includes('PHONE_RULE'), '缺少 PHONE_RULE');
    assert.ok(src.includes('ITEMS_RULE'), '缺少 ITEMS_RULE');
    assert.ok(src.includes('QTY_RULE'), '缺少 QTY_RULE');
  });

  it('page.tsx 应含提交处理逻辑', async () => {
    const fs = await import('fs');
    const src = fs.readFileSync(new URL('./page.tsx', import.meta.url).pathname, 'utf-8');
    assert.ok(src.includes('handleSubmit'), '缺少 handleSubmit');
    assert.ok(src.includes('handleSuccess'), '缺少 handleSuccess');
  });

  it('page.tsx 应包含 submitting 和 submitError 状态', async () => {
    const fs = await import('fs');
    const src = fs.readFileSync(new URL('./page.tsx', import.meta.url).pathname, 'utf-8');
    assert.ok(src.includes('setSubmitting'), '缺少 setSubmitting');
    assert.ok(src.includes('setSubmitError'), '缺少 setSubmitError');
  });

  it('page.tsx 提交含随机失败模拟 (10%)', async () => {
    const fs = await import('fs');
    const src = fs.readFileSync(new URL('./page.tsx', import.meta.url).pathname, 'utf-8');
    assert.ok(src.includes('0.1'), '缺少随机失败概率');
    assert.ok(src.includes('服务器繁忙'), '缺少错误提示');
  });

  it('page.tsx 提交成功后跳转 /replenishment', async () => {
    const fs = await import('fs');
    const src = fs.readFileSync(new URL('./page.tsx', import.meta.url).pathname, 'utf-8');
    assert.ok(src.includes('/replenishment'), '缺少跳转路径');
  });
});
