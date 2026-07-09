/**
 * 创建门店页 L1 冒烟 + 源码逻辑测试
 *
 * 测试策略:
 * - 不依赖 jsdom/React 渲染 (storefront-web 测试用 node --test)
 * - 通过源码分析验证字段定义完整性
 * - 验证字段验证规则完备性
 * - 验证 SuccessGuide 组件引导逻辑
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

// ---- SuccessGuide 引导链接测试 (镜像 page.tsx SuccessGuide 组件逻辑) ----

interface SuccessGuideLink {
  label: string;
  href?: string;
  action?: () => void;
}

function buildSuccessGuideLinks(onReset: () => void): SuccessGuideLink[] {
  return [
    { label: '查看门店列表', href: '/stores' },
    { label: '对比门店绩效', href: '/stores/compare' },
    { label: '继续创建门店', action: onReset },
  ];
}

function isActionLink(link: SuccessGuideLink): boolean {
  return 'action' in link && typeof link.action === 'function';
}

function isNavLink(link: SuccessGuideLink): boolean {
  return 'href' in link && typeof link.href === 'string';
}

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

/** 模拟提交逻辑，返回 { success, message } */
function submitForm(values: Record<string, string>): { success: boolean; message: string } {
  // 编码冲突检测
  if (values.code === 'SZ-NS-001' || values.code === 'BJ-CY-001') {
    return { success: false, message: '编码冲突，请更换' };
  }
  return { success: true, message: `门店「${values.name}」创建成功！` };
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

    it('should accept name = 50 chars boundary', () => {
      assert.equal(validateField('name', 'A'.repeat(50)), null);
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

    it('should reject code too short (< 3)', () => {
      assert.equal(validateField('code', 'AB'), '编码至少3个字符');
    });

    it('should reject code too long (> 20)', () => {
      assert.equal(validateField('code', 'A'.repeat(21)), '编码不超过20个字符');
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

    it('should accept area = 9999 boundary', () => {
      assert.equal(validateField('areaSqm', '9999'), null);
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
    it('should return success for valid submission', () => {
      const result = submitForm({
        name: '新门店', code: 'NEW-001',
      });
      assert.equal(result.success, true);
      assert.match(result.message, /创建成功/);
    });

    it('should return failure for conflicting code SZ-NS-001', () => {
      const result = submitForm({
        name: '冲突门店', code: 'SZ-NS-001',
      });
      assert.equal(result.success, false);
    });

    it('should return failure for conflicting code BJ-CY-001', () => {
      const result = submitForm({
        name: '冲突门店', code: 'BJ-CY-001',
      });
      assert.equal(result.success, false);
    });

    it('should return success for non-conflicting code', () => {
      const result = submitForm({
        name: '广州新店', code: 'GZ-TH-001',
      });
      assert.equal(result.success, true);
    });

    it('should return null for conflicting code SZ-NS-001 on submit', async () => {
      const values = { code: 'SZ-NS-001', name: '测试门店' };
      const codeErr = validateField('code', values.code);
      assert.notEqual(codeErr, null);
      const submitResult = submitForm(values);
      assert.equal(submitResult.success, false);
    });

    it('should return success data for valid submission with all fields', async () => {
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
        const val = values[field.key as keyof typeof values] ?? '';
        if (typeof val === 'string') {
          const err = validateField(field.key, val);
          if (err) errors.push(`${field.key}: ${err}`);
        }
      }
      assert.equal(errors.length, 0, `Should have no validation errors: ${errors.join(', ')}`);

      // simulate submit success
      const result = submitForm(values);
      assert.equal(result.success, true);
      assert.match(result.message!, /创建成功/);
    });
  });

  describe('SuccessGuide 引导组件逻辑', () => {
    it('should build 3 guide links', () => {
      const onReset = () => {};
      const links = buildSuccessGuideLinks(onReset);
      assert.equal(links.length, 3);
    });

    it('should have correct link labels', () => {
      const onReset = () => {};
      const links = buildSuccessGuideLinks(onReset);
      assert.deepEqual(links.map((l) => l.label), [
        '查看门店列表',
        '对比门店绩效',
        '继续创建门店',
      ]);
    });

    it('first two links should be nav links with href', () => {
      const onReset = () => {};
      const links = buildSuccessGuideLinks(onReset);
      assert.equal(isNavLink(links[0]), true);
      assert.equal(links[0].href, '/stores');
      assert.equal(isNavLink(links[1]), true);
      assert.equal(links[1].href, '/stores/compare');
    });

    it('third link should be action link (not nav)', () => {
      const onReset = () => {};
      const links = buildSuccessGuideLinks(onReset);
      assert.equal(isActionLink(links[2]), true);
      assert.equal(isNavLink(links[2]), false);
    });

    it('action link should call onReset when invoked', () => {
      let resetCalled = false;
      const onReset = () => { resetCalled = true; };
      const links = buildSuccessGuideLinks(onReset);
      (links[2].action as () => void)();
      assert.equal(resetCalled, true);
    });

    it('should not have any undefined labels', () => {
      const onReset = () => {};
      const links = buildSuccessGuideLinks(onReset);
      for (const link of links) {
        assert.ok(link.label.length > 0);
      }
    });

    it('nav links should not have action property', () => {
      const onReset = () => {};
      const links = buildSuccessGuideLinks(onReset);
      assert.equal('action' in links[0], false);
      assert.equal('action' in links[1], false);
    });

    it('action link should not have href property', () => {
      const onReset = () => {};
      const links = buildSuccessGuideLinks(onReset);
      assert.equal('href' in links[2], false);
    });
  });
});
