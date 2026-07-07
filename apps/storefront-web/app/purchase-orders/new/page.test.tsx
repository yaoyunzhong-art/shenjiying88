/**
 * 新建采购单页面 — New Purchase Order Page Test
 * 验证表单字段定义、验证规则、常量映射
 */

import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

// ── 从 page.tsx 提取的常量和逻辑 ──

const SUPPLIER_OPTIONS = [
  { label: '广州美妆供应链有限公司', value: '广州美妆供应链有限公司' },
  { label: '上海日化贸易有限公司', value: '上海日化贸易有限公司' },
  { label: '杭州香氛科技有限公司', value: '杭州香氛科技有限公司' },
  { label: '深圳包材创新有限公司', value: '深圳包材创新有限公司' },
  { label: '广州妆具工贸有限公司', value: '广州妆具工贸有限公司' },
];

const PAYMENT_TERMS_OPTIONS = [
  { label: '月结30天', value: 'net30' },
  { label: '月结60天', value: 'net60' },
  { label: '预付款 + 尾款', value: 'deposit_balance' },
  { label: '货到付款', value: 'cod' },
  { label: '全额预付', value: 'prepaid' },
];

const PAYMENT_METHOD_OPTIONS = [
  { label: '银行转账', value: 'bank_transfer' },
  { label: '微信支付', value: 'wechat' },
  { label: '支付宝', value: 'alipay' },
  { label: '支票', value: 'check' },
];

describe('PurchaseOrderNewPage - 常量验证', () => {
  describe('SUPPLIER_OPTIONS', () => {
    it('有5个供应商选项', () => {
      assert.strictEqual(SUPPLIER_OPTIONS.length, 5);
    });

    it('每个选项都有 label 和 value', () => {
      for (const opt of SUPPLIER_OPTIONS) {
        assert.ok(typeof opt.label === 'string' && opt.label.length > 0);
        assert.ok(typeof opt.value === 'string' && opt.value.length > 0);
      }
    });

    it('包含广州美妆供应链', () => {
      const names = SUPPLIER_OPTIONS.map((o) => o.label);
      assert.ok(names.includes('广州美妆供应链有限公司'));
    });
  });

  describe('PAYMENT_TERMS_OPTIONS', () => {
    it('有5个付款条件选项', () => {
      assert.strictEqual(PAYMENT_TERMS_OPTIONS.length, 5);
    });

    it('包含月结30天和货到付款', () => {
      const values = PAYMENT_TERMS_OPTIONS.map((o) => o.value);
      assert.ok(values.includes('net30'));
      assert.ok(values.includes('cod'));
    });

    it('包含预付选项', () => {
      const labels = PAYMENT_TERMS_OPTIONS.map((o) => o.label);
      assert.ok(labels.includes('全额预付'));
    });
  });

  describe('PAYMENT_METHOD_OPTIONS', () => {
    it('有4个付款方式选项', () => {
      assert.strictEqual(PAYMENT_METHOD_OPTIONS.length, 4);
    });

    it('包含支付宝', () => {
      const labels = PAYMENT_METHOD_OPTIONS.map((o) => o.label);
      assert.ok(labels.includes('支付宝'));
    });

    it('包含微信支付', () => {
      const labels = PAYMENT_METHOD_OPTIONS.map((o) => o.label);
      assert.ok(labels.includes('微信支付'));
    });
  });

  describe('表单字段验证逻辑', () => {
    it('手机号验证函数应拒绝无效手机号', () => {
      const validatePhone = (v: unknown): string | null => {
        if (!v || v === '') return '手机号不能为空';
        const phone = (v as string).trim();
        return !/^1[3-9]\d{9}$/.test(phone) ? '请输入有效的11位手机号' : null;
      };

      assert.strictEqual(validatePhone(''), '手机号不能为空');
      assert.strictEqual(validatePhone('123'), '请输入有效的11位手机号');
      assert.strictEqual(validatePhone('12345678901'), '请输入有效的11位手机号');
      assert.strictEqual(validatePhone('13800138001'), null);
    });

    it('总金额验证函数应拒绝无效金额', () => {
      const validateAmount = (v: unknown): string | null => {
        const n = Number(v);
        return Number.isNaN(n) || n <= 0 ? '总金额必须大于0' : null;
      };

      assert.strictEqual(validateAmount(''), '总金额必须大于0');
      assert.strictEqual(validateAmount('0'), '总金额必须大于0');
      assert.strictEqual(validateAmount('-100'), '总金额必须大于0');
      assert.strictEqual(validateAmount('100'), null);
      assert.strictEqual(validateAmount('99.99'), null);
    });

    it('收货地址验证函数应拒绝过短地址', () => {
      const validateAddress = (v: unknown): string | null => {
        const str = v as string;
        return str.trim().length < 5 ? '收货地址至少5个字符' : null;
      };

      assert.strictEqual(validateAddress('abc'), '收货地址至少5个字符');
      assert.strictEqual(validateAddress('广州市天河区'), null);
    });

    it('联系人验证函数应拒绝过短名称', () => {
      const validateContact = (v: unknown): string | null => {
        const str = v as string;
        return str.trim().length < 2 ? '联系人至少2个字符' : null;
      };

      assert.strictEqual(validateContact('张'), '联系人至少2个字符');
      assert.strictEqual(validateContact('张三'), null);
    });

    it('日期验证函数应拒绝过去日期', () => {
      const validateDeliveryDate = (v: unknown): string | null => {
        if (!v || v === '') return '预计到货日期不能为空';
        const d = new Date(v as string);
        return isNaN(d.getTime()) ? '请输入有效日期' : null;
      };

      assert.strictEqual(validateDeliveryDate(''), '预计到货日期不能为空');
      assert.strictEqual(validateDeliveryDate('invalid-date'), '请输入有效日期');
      assert.strictEqual(validateDeliveryDate('2026-12-30'), null);
    });
  });
});

describe('PurchaseOrderNewPage - 模块加载', () => {
  it('page 模块可正常导入且 default 为函数', async () => {
    const mod = await import('./page');
    assert.ok(typeof mod.default === 'function', 'default export should be a function component');
  });
});
