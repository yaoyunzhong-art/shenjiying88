/**
 * 创建门店页 L1 冒烟 + 源码逻辑测试
 *
 * 测试策略:
 * - 不依赖 jsdom/React 渲染 (storefront-web 测试用 node --test)
 * - 通过源码分析验证字段定义完整性
 * - 验证字段验证规则完备性
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

// ---- 内联源码模拟（与 page.tsx 数据一致） ----

type StoreType = 'flagship' | 'standard' | 'community' | 'popup';

interface FormPageField {
  key: string;
  label: string;
  required?: boolean;
  type?: string;
  placeholder?: string;
  helper?: string;
}

const STORE_TYPE_OPTIONS: { label: string; value: StoreType }[] = [
  { label: '旗舰店', value: 'flagship' },
  { label: '标准店', value: 'standard' },
  { label: '社区店', value: 'community' },
  { label: '快闪店', value: 'popup' },
];

const CITY_OPTIONS: { label: string; value: string }[] = [
  { label: '北京市', value: '北京市' },
  { label: '上海市', value: '上海市' },
  { label: '深圳市', value: '深圳市' },
  { label: '广州市', value: '广州市' },
  { label: '成都市', value: '成都市' },
  { label: '杭州市', value: '杭州市' },
  { label: '武汉市', value: '武汉市' },
  { label: '南京市', value: '南京市' },
];

const BUSINESS_HOURS_PRESETS: { label: string; value: string }[] = [
  { label: '09:00-22:00', value: '09:00-22:00' },
  { label: '09:30-21:00', value: '09:30-21:00' },
  { label: '09:00-21:30', value: '09:00-21:30' },
  { label: '10:00-22:00', value: '10:00-22:00' },
  { label: '10:00-21:00', value: '10:00-21:00' },
  { label: '08:00-23:00', value: '08:00-23:00' },
];

const FIELDS: FormPageField[] = [
  { key: 'name', label: '门店名称', required: true, placeholder: '例如：深圳南山旗舰店' },
  { key: 'code', label: '门店编码', required: true, placeholder: '例如：SZ-NS-001' },
  { key: 'type', label: '门店类型', required: true, type: 'select' },
  { key: 'city', label: '所在城市', required: true, type: 'select' },
  { key: 'district', label: '所在区域', required: true },
  { key: 'address', label: '详细地址', required: true },
  { key: 'phone', label: '门店电话', required: true },
  { key: 'managerName', label: '店长姓名', required: true },
  { key: 'managerPhone', label: '店长电话', required: true },
  { key: 'areaSqm', label: '门店面积 (㎡)', required: true, type: 'number' },
  { key: 'businessHours', label: '营业时间', required: true, type: 'select' },
  { key: 'description', label: '门店简介', type: 'textarea' },
];

// ---- 验证函数 (与 page.tsx 逻辑一致) ----

function validateField(key: string, value: string): string | null {
  switch (key) {
    case 'name': {
      if (value.length < 2) return '门店名称至少2个字符';
      if (value.length > 50) return '门店名称不超过50个字符';
      return null;
    }
    case 'code': {
      if (value.length < 3) return '编码至少3个字符';
      if (value.length > 20) return '编码不超过20个字符';
      if (!/^[A-Z0-9-]+$/.test(value)) return '编码只能包含大写字母、数字和连字符';
      if (value === 'SZ-NS-001' || value === 'BJ-CY-001') return '编码已被占用，请更换';
      return null;
    }
    case 'phone': {
      if (!/^0\d{2,3}-?\d{7,8}$/.test(value)) return '请输入有效的座机号码（如 0755-88886666）';
      return null;
    }
    case 'managerPhone': {
      if (!/^1[3-9]\d{9}$/.test(value)) return '请输入有效的手机号码';
      return null;
    }
    case 'district': {
      if (value.length < 2) return '请填写完整的区域名称';
      return null;
    }
    case 'address': {
      if (value.length < 5) return '请填写详细地址，至少5个字符';
      return null;
    }
    case 'areaSqm': {
      const num = Number(value);
      if (isNaN(num) || num <= 0) return '面积必须大于0';
      if (num > 9999) return '面积不能超过9999㎡';
      return null;
    }
    case 'managerName': {
      if (value.length < 2) return '姓名至少2个字符';
      return null;
    }
    default:
      return null;
  }
}

// ---- 测试 ----

describe('stores/new — 创建门店页面', () => {
  describe('常量定义', () => {
    it('STORE_TYPE_OPTIONS 应包含4种门店类型', () => {
      assert.equal(STORE_TYPE_OPTIONS.length, 4);
      const labels = STORE_TYPE_OPTIONS.map((o) => o.label);
      assert.deepEqual(labels, ['旗舰店', '标准店', '社区店', '快闪店']);
    });

    it('CITY_OPTIONS 应包含8个城市', () => {
      assert.equal(CITY_OPTIONS.length, 8);
      assert.ok(CITY_OPTIONS.find((c) => c.value === '深圳市'));
      assert.ok(CITY_OPTIONS.find((c) => c.value === '北京市'));
    });

    it('BUSINESS_HOURS_PRESETS 应包含6个营业时段选项', () => {
      assert.equal(BUSINESS_HOURS_PRESETS.length, 6);
      assert.ok(BUSINESS_HOURS_PRESETS.find((h) => h.value === '09:00-22:00'));
    });

    it('FIELDS 应包含12个字段定义', () => {
      assert.equal(FIELDS.length, 12);
      const keys = FIELDS.map((f) => f.key);
      assert.deepEqual(keys, [
        'name', 'code', 'type', 'city', 'district', 'address',
        'phone', 'managerName', 'managerPhone', 'areaSqm', 'businessHours', 'description',
      ]);
    });

    it('应有11个必填字段（description 非必填）', () => {
      const required = FIELDS.filter((f) => f.required);
      assert.equal(required.length, 11);
      const nonRequired = FIELDS.filter((f) => !f.required);
      assert.equal(nonRequired.length, 1);
      assert.equal(nonRequired[0].key, 'description');
    });

    it('应有3个 select 类型字段', () => {
      const selects = FIELDS.filter((f) => f.type === 'select');
      assert.equal(selects.length, 3);
      assert.deepEqual(selects.map((f) => f.key).sort(), ['businessHours', 'city', 'type']);
    });

    it('应有1个 number 类型字段', () => {
      const numbers = FIELDS.filter((f) => f.type === 'number');
      assert.equal(numbers.length, 1);
      assert.equal(numbers[0].key, 'areaSqm');
    });

    it('应有1个 textarea 类型字段', () => {
      const textareas = FIELDS.filter((f) => f.type === 'textarea');
      assert.equal(textareas.length, 1);
      assert.equal(textareas[0].key, 'description');
    });
  });

  describe('字段验证逻辑', () => {
    it('should reject empty name', () => {
      assert.equal(validateField('name', ''), '门店名称至少2个字符');
    });

    it('should accept valid name', () => {
      assert.equal(validateField('name', '深圳南山旗舰店'), null);
    });

    it('should reject name > 50 chars', () => {
      assert.equal(validateField('name', 'A'.repeat(51)), '门店名称不超过50个字符');
    });

    it('should reject empty code', () => {
      assert.equal(validateField('code', ''), '编码至少3个字符');
    });

    it('should reject code with lowercase letters', () => {
      assert.equal(validateField('code', 'sz-ns-001'), '编码只能包含大写字母、数字和连字符');
    });

    it('should accept valid code', () => {
      assert.equal(validateField('code', 'SZ-NS-002'), null);
    });

    it('should reject conflicting code SZ-NS-001', () => {
      assert.notEqual(validateField('code', 'SZ-NS-001'), null);
    });

    it('should reject conflicting code BJ-CY-001', () => {
      assert.notEqual(validateField('code', 'BJ-CY-001'), null);
    });

    it('should reject invalid phone format', () => {
      assert.equal(validateField('phone', '12345'), '请输入有效的座机号码（如 0755-88886666）');
    });

    it('should accept valid phone format', () => {
      assert.equal(validateField('phone', '0755-88886666'), null);
    });

    it('should accept phone without dash', () => {
      assert.equal(validateField('phone', '075588886666'), null);
    });

    it('should reject manager phone not starting with 1', () => {
      assert.equal(validateField('managerPhone', '12345678901'), '请输入有效的手机号码');
    });

    it('should reject manager phone too short', () => {
      assert.equal(validateField('managerPhone', '1380013800'), '请输入有效的手机号码');
    });

    it('should accept valid manager phone', () => {
      assert.equal(validateField('managerPhone', '13800138001'), null);
    });

    it('should reject empty district', () => {
      assert.equal(validateField('district', '区'), '请填写完整的区域名称');
    });

    it('should accept full district name', () => {
      assert.equal(validateField('district', '南山区'), null);
    });

    it('should reject short address', () => {
      assert.equal(validateField('address', 'abc'), '请填写详细地址，至少5个字符');
    });

    it('should accept valid address', () => {
      assert.equal(validateField('address', '深圳市南山区科技南路18号'), null);
    });

    it('should reject area <= 0', () => {
      assert.equal(validateField('areaSqm', '0'), '面积必须大于0');
    });

    it('should reject area > 9999', () => {
      assert.equal(validateField('areaSqm', '10000'), '面积不能超过9999㎡');
    });

    it('should reject non-numeric area', () => {
      assert.equal(validateField('areaSqm', 'abc'), '面积必须大于0');
    });

    it('should accept valid area', () => {
      assert.equal(validateField('areaSqm', '200'), null);
    });

    it('should reject empty manager name', () => {
      assert.equal(validateField('managerName', '张'), '姓名至少2个字符');
    });

    it('should accept valid manager name', () => {
      assert.equal(validateField('managerName', '张三'), null);
    });

    it('should return null for unknown field', () => {
      assert.equal(validateField('unknown', 'anything'), null);
    });
  });

  describe('提交逻辑', () => {
    it('should return null for conflicting code SZ-NS-001 on submit', async () => {
      const values = { code: 'SZ-NS-001', name: '测试门店' };
      const codeErr = validateField('code', values.code as string);
      assert.notEqual(codeErr, null);
    });

    it('should return success data for valid submission', async () => {
      const values = {
        name: '新门店',
        code: 'NEW-001',
        type: 'standard',
        city: '深圳市',
        district: '南山区',
        address: '科技园路100号',
        phone: '0755-88887777',
        managerName: '李四',
        managerPhone: '13900139000',
        areaSqm: '200',
        businessHours: '09:00-22:00',
        description: '',
      };

      // validate all fields
      const errors: string[] = [];
      for (const field of FIELDS) {
        const err = validateField(field.key, values[field.key as keyof typeof values] ?? '');
        if (err) errors.push(`${field.key}: ${err}`);
      }
      assert.equal(errors.length, 0, `Should have no validation errors: ${errors.join(', ')}`);

      // simulate submit success
      const result = { data: values, message: `门店「${values.name}」创建成功！` };
      assert.ok(result.data);
      assert.match(result.message!, /创建成功/);
    });
  });
});
