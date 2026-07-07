/**
 * 新建供应商页面测试 — New Supplier Page Tests
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

// ---- 表单验证规则测试 ----

/**
 * 验证供应商名称规则
 */
function validateName(v: unknown): string | null {
  if (!v || v === '') return '供应商名称不能为空';
  if (typeof v === 'string' && v.trim().length < 2) return '供应商名称至少2个字符';
  if (typeof v === 'string' && v.length > 100) return '供应商名称不超过100个字符';
  return null;
}

/**
 * 验证品类
 */
function validateCategory(v: unknown): string | null {
  if (!v || v === '') return '请选择供应品类';
  return null;
}

/**
 * 验证联系人
 */
function validateContactPerson(v: unknown): string | null {
  if (!v || v === '') return '联系人不能为空';
  if (typeof v === 'string' && v.trim().length < 2) return '联系人至少2个字符';
  return null;
}

/**
 * 验证手机号
 */
function validatePhone(v: unknown): string | null {
  if (!v || v === '') return '手机号不能为空';
  const phone = (v as string).trim();
  if (!/^1[3-9]\d{9}$/.test(phone)) return '请输入有效的11位手机号';
  return null;
}

/**
 * 验证邮箱
 */
function validateEmail(v: unknown): string | null {
  if (!v || v === '') return '邮箱不能为空';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test((v as string).trim())) return '请输入有效的邮箱地址';
  return null;
}

/**
 * 验证地址
 */
function validateAddress(v: unknown): string | null {
  if (!v || v === '') return '地址不能为空';
  if (typeof v === 'string' && v.trim().length < 5) return '地址至少5个字符';
  return null;
}

/**
 * 验证营业执照号（18位统一社会信用代码）
 */
function validateBusinessLicense(v: unknown): string | null {
  if (!v || v === '') return '营业执照号不能为空';
  const license = (v as string).trim();
  if (!/^[A-Z0-9]{18}$/.test(license)) return '请输入18位统一社会信用代码';
  return null;
}

/**
 * 验证纳税人识别号（可选）
 */
function validateTaxId(v: unknown): string | null {
  if (!v || v === '') return null;
  if (!/^[A-Z0-9]{15,20}$/.test((v as string).trim())) return '纳税人识别号格式不正确';
  return null;
}

/**
 * 验证开户银行
 */
function validateBankName(v: unknown): string | null {
  if (!v || v === '') return '开户银行不能为空';
  return null;
}

/**
 * 验证银行账号
 */
function validateBankAccount(v: unknown): string | null {
  if (!v || v === '') return '银行账号不能为空';
  const acct = (v as string).replace(/\s/g, '');
  if (!/^\d{8,30}$/.test(acct)) return '请输入有效的银行账号';
  return null;
}

/**
 * 验证付款条件
 */
function validatePaymentTerms(v: unknown): string | null {
  if (!v || v === '') return '请选择付款条件';
  return null;
}

/**
 * 验证交货周期
 */
function validateDeliveryDays(v: unknown): string | null {
  const n = Number(v);
  if (Number.isNaN(n) || n <= 0) return '交货周期必须大于0';
  if (n > 365) return '交货周期不能超过365天';
  return null;
}

/**
 * 验证授信额度（可选）
 */
function validateCreditLimit(v: unknown): string | null {
  if (!v || v === '') return null;
  const n = Number(v);
  if (Number.isNaN(n) || n < 0) return '授信额度不能为负数';
  if (n > 99999999) return '授信额度不能超过99,999,999';
  return null;
}

/**
 * 验证备注（可选）
 */
function validateNotes(v: unknown): string | null {
  if (v && typeof v === 'string' && v.length > 1000) return '备注不超过1000个字符';
  return null;
}

// ---- 测试套件 ----

describe('新建供应商页面 - 表单验证', () => {
  describe('供应商名称', () => {
    it('空值应报错', () => {
      assert.equal(validateName(''), '供应商名称不能为空');
      assert.equal(validateName(undefined), '供应商名称不能为空');
      assert.equal(validateName(null), '供应商名称不能为空');
    });

    it('少于2字符应报错', () => {
      assert.equal(validateName('广'), '供应商名称至少2个字符');
    });

    it('超过100字符应报错', () => {
      assert.equal(validateName('广'.repeat(101)), '供应商名称不超过100个字符');
    });

    it('合法名称应通过', () => {
      assert.equal(validateName('广州美妆供应链有限公司'), null);
      assert.equal(validateName('上海日化贸易'), null);
    });
  });

  describe('供应品类', () => {
    it('空值应报错', () => {
      assert.equal(validateCategory(''), '请选择供应品类');
      assert.equal(validateCategory(undefined), '请选择供应品类');
    });

    it('合法值应通过', () => {
      assert.equal(validateCategory('skincare'), null);
      assert.equal(validateCategory('cosmetics'), null);
    });
  });

  describe('联系人', () => {
    it('空值应报错', () => {
      assert.equal(validateContactPerson(''), '联系人不能为空');
    });

    it('少于2字符应报错', () => {
      assert.equal(validateContactPerson('李'), '联系人至少2个字符');
    });

    it('合法联系人应通过', () => {
      assert.equal(validateContactPerson('李明'), null);
      assert.equal(validateContactPerson('张三丰'), null);
    });
  });

  describe('联系手机号', () => {
    it('空值应报错', () => {
      assert.equal(validatePhone(''), '手机号不能为空');
    });

    it('无效手机号应报错', () => {
      assert.equal(validatePhone('12345678901'), '请输入有效的11位手机号');
      assert.equal(validatePhone('1380013800'), '请输入有效的11位手机号');
      assert.equal(validatePhone('23800138001'), '请输入有效的11位手机号');
    });

    it('合法手机号应通过', () => {
      assert.equal(validatePhone('13800138001'), null);
      assert.equal(validatePhone('15912345678'), null);
      assert.equal(validatePhone('19987654321'), null);
    });
  });

  describe('联系邮箱', () => {
    it('空值应报错', () => {
      assert.equal(validateEmail(''), '邮箱不能为空');
    });

    it('无效邮箱应报错', () => {
      assert.equal(validateEmail('not-an-email'), '请输入有效的邮箱地址');
      assert.equal(validateEmail('@example.com'), '请输入有效的邮箱地址');
    });

    it('合法邮箱应通过', () => {
      assert.equal(validateEmail('contact@example.com'), null);
      assert.equal(validateEmail('li.ming@supplier.cn'), null);
    });
  });

  describe('公司地址', () => {
    it('空值应报错', () => {
      assert.equal(validateAddress(''), '地址不能为空');
    });

    it('少于5字符应报错', () => {
      assert.equal(validateAddress('广州'), '地址至少5个字符');
    });

    it('合法地址应通过', () => {
      assert.equal(validateAddress('广州市白云区白云大道北123号'), null);
    });
  });

  describe('营业执照号', () => {
    it('空值应报错', () => {
      assert.equal(validateBusinessLicense(''), '营业执照号不能为空');
    });

    it('非18位应报错', () => {
      assert.equal(validateBusinessLicense('123'), '请输入18位统一社会信用代码');
      assert.equal(validateBusinessLicense('1234567890123456789'), '请输入18位统一社会信用代码');
    });

    it('含小写字母应报错', () => {
      assert.equal(validateBusinessLicense('abc1234567890defgh'), '请输入18位统一社会信用代码');
    });

    it('合法18位统一社会信用代码应通过', () => {
      assert.equal(validateBusinessLicense('91440101MA5CKP6X7Q'), null);
      assert.equal(validateBusinessLicense('91310000MA1FL1234X'), null);
    });
  });

  describe('纳税人识别号（可选）', () => {
    it('空值应通过', () => {
      assert.equal(validateTaxId(''), null);
    });

    it('格式不正确应报错', () => {
      assert.equal(validateTaxId('abc'), '纳税人识别号格式不正确');
    });

    it('合法格式应通过', () => {
      assert.equal(validateTaxId('91440101MA5CKP6X7Q'), null);
    });
  });

  describe('开户银行', () => {
    it('空值应报错', () => {
      assert.equal(validateBankName(''), '开户银行不能为空');
    });

    it('合法值应通过', () => {
      assert.equal(validateBankName('中国工商银行广州白云支行'), null);
    });
  });

  describe('银行账号', () => {
    it('空值应报错', () => {
      assert.equal(validateBankAccount(''), '银行账号不能为空');
    });

    it('含非数字字符应报错', () => {
      assert.equal(validateBankAccount('36020001ABC'), '请输入有效的银行账号');
    });

    it('位数不足应报错', () => {
      assert.equal(validateBankAccount('1234567'), '请输入有效的银行账号');
    });

    it('合法账号应通过', () => {
      assert.equal(validateBankAccount('3602000101234567890'), null);
    });

    it('带空格应清洗后通过验证', () => {
      assert.equal(validateBankAccount('3602 0001 0123 4567 890'), null);
    });
  });

  describe('付款条件', () => {
    it('空值应报错', () => {
      assert.equal(validatePaymentTerms(''), '请选择付款条件');
    });

    it('合法值应通过', () => {
      assert.equal(validatePaymentTerms('net30'), null);
      assert.equal(validatePaymentTerms('prepaid'), null);
    });
  });

  describe('交货周期', () => {
    it('空值/0/负数应报错', () => {
      assert.equal(validateDeliveryDays(''), '交货周期必须大于0');
      assert.equal(validateDeliveryDays('0'), '交货周期必须大于0');
      assert.equal(validateDeliveryDays('-1'), '交货周期必须大于0');
    });

    it('超过365天应报错', () => {
      assert.equal(validateDeliveryDays('366'), '交货周期不能超过365天');
    });

    it('合法值应通过', () => {
      assert.equal(validateDeliveryDays('7'), null);
      assert.equal(validateDeliveryDays('30'), null);
      assert.equal(validateDeliveryDays('90'), null);
    });
  });

  describe('授信额度（可选）', () => {
    it('空值应通过', () => {
      assert.equal(validateCreditLimit(''), null);
    });

    it('负数应报错', () => {
      assert.equal(validateCreditLimit('-1000'), '授信额度不能为负数');
    });

    it('超过上限应报错', () => {
      assert.equal(validateCreditLimit('100000000'), '授信额度不能超过99,999,999');
    });

    it('合法值应通过', () => {
      assert.equal(validateCreditLimit('100000'), null);
      assert.equal(validateCreditLimit('5000000'), null);
    });
  });

  describe('备注（可选）', () => {
    it('空值应通过', () => {
      assert.equal(validateNotes(''), null);
    });

    it('超过1000字符应报错', () => {
      assert.equal(validateNotes('x'.repeat(1001)), '备注不超过1000个字符');
    });

    it('合法值应通过', () => {
      assert.equal(validateNotes('长期合作供应商，信誉良好'), null);
    });
  });
});

describe('新建供应商页面 - 边界情况', () => {
  it('全量字段合法提交应通过', () => {
    const validData = {
      name: '广州美妆供应链有限公司',
      category: 'skincare',
      contactPerson: '李明',
      contactPhone: '13800138001',
      email: 'contact@example.com',
      address: '广州市白云区白云大道北123号',
      businessLicense: '91440101MA5CKP6X7Q',
      taxId: '',
      bankName: '中国工商银行广州白云支行',
      bankAccount: '3602000101234567890',
      paymentTerms: 'net30',
      deliveryDays: '7',
      creditLimit: '500000',
      notes: '长期合作供应商',
    };

    assert.equal(validateName(validData.name), null);
    assert.equal(validateCategory(validData.category), null);
    assert.equal(validateContactPerson(validData.contactPerson), null);
    assert.equal(validatePhone(validData.contactPhone), null);
    assert.equal(validateEmail(validData.email), null);
    assert.equal(validateAddress(validData.address), null);
    assert.equal(validateBusinessLicense(validData.businessLicense), null);
    assert.equal(validateTaxId(validData.taxId), null);
    assert.equal(validateBankName(validData.bankName), null);
    assert.equal(validateBankAccount(validData.bankAccount), null);
    assert.equal(validatePaymentTerms(validData.paymentTerms), null);
    assert.equal(validateDeliveryDays(validData.deliveryDays), null);
    assert.equal(validateCreditLimit(validData.creditLimit), null);
    assert.equal(validateNotes(validData.notes), null);
  });

  it('全部必填字段缺失时均应报错', () => {
    assert.notEqual(validateName(''), null);
    assert.notEqual(validateCategory(''), null);
    assert.notEqual(validateContactPerson(''), null);
    assert.notEqual(validatePhone(''), null);
    assert.notEqual(validateEmail(''), null);
    assert.notEqual(validateAddress(''), null);
    assert.notEqual(validateBusinessLicense(''), null);
    assert.notEqual(validateBankName(''), null);
    assert.notEqual(validateBankAccount(''), null);
    assert.notEqual(validatePaymentTerms(''), null);
    assert.notEqual(validateDeliveryDays(''), null);
  });
});
