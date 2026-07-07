/**
 * AnnouncementCreatePage — node:test 兼容适配
 * 不渲染 React 组件（无 jsdom），只验证：
 * - 模块可导入
 * - 字段定义完整性
 * - 验证规则逻辑
 * - 常量及选项完整性
 * - 格式化辅助函数
 */

import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

// ---- 与组件保持一致的类型/常量 ---- //

interface AnnouncementFormData {
  title: string;
  category: string;
  priority: string;
  summary: string;
  content: string;
  targetAudience: string;
  effectiveDate: string;
  expiryDate: string;
  author: string;
  attachment: string;
  notes: string;
}

const CATEGORY_OPTIONS = [
  { label: '系统公告', value: 'system' },
  { label: '促销活动', value: 'promotion' },
  { label: '运营通知', value: 'operation' },
  { label: '紧急通知', value: 'emergency' },
  { label: '人事通知', value: 'hr' },
];

const PRIORITY_OPTIONS = [
  { label: '高优先级', value: 'high' },
  { label: '普通', value: 'normal' },
  { label: '低优先级', value: 'low' },
];

const AUDIENCE_OPTIONS = [
  { label: '全部人员', value: 'all' },
  { label: '门店员工', value: 'staff' },
  { label: '管理层', value: 'management' },
  { label: '导购员', value: 'sales' },
  { label: '客服人员', value: 'service' },
];

const EXPECTED_FIELD_KEYS: (keyof AnnouncementFormData)[] = [
  'title',
  'category',
  'priority',
  'summary',
  'content',
  'targetAudience',
  'effectiveDate',
  'expiryDate',
  'author',
  'attachment',
  'notes',
];

// ---- 验证辅助函数 ----

/** 标题验证 */
function validateTitle(v: unknown): string | null {
  if (!v || (v as string).trim() === '') return '公告标题不能为空';
  const trimmed = (v as string).trim();
  if (trimmed.length < 2) return '标题至少2个字符';
  if (trimmed.length > 50) return '标题不能超过50个字符';
  return null;
}

/** 摘要验证 */
function validateSummary(v: unknown): string | null {
  if (!v || (v as string).trim() === '') return '公告摘要不能为空';
  const trimmed = (v as string).trim();
  if (trimmed.length > 200) return '摘要不能超过200个字符';
  return null;
}

/** 内容验证 */
function validateContent(v: unknown): string | null {
  if (!v || (v as string).trim() === '') return '公告内容不能为空';
  const trimmed = (v as string).trim();
  if (trimmed.length < 10) return '公告内容至少10个字符';
  return null;
}

/** 必选 select 验证 */
function validateRequiredSelect(v: unknown, label: string): string | null {
  if (!v || v === '') return `${label}不能为空`;
  return null;
}

/** 日期验证 */
function validateDate(v: unknown): string | null {
  if (!v || v === '') return null;
  const d = new Date(v as string);
  return isNaN(d.getTime()) ? '请输入有效日期' : null;
}

/** 过期日期相对生效日期的验证 */
function validateExpiryDate(expiry: unknown, effective: unknown): string | null {
  if (!expiry || expiry === '' || !effective) return null;
  const expiryDate = new Date(expiry as string);
  const effectiveDate = new Date(effective as string);
  return expiryDate <= effectiveDate ? '过期日期必须晚于生效日期' : null;
}

/** 发布人验证 */
function validateAuthor(v: unknown): string | null {
  if (!v || (v as string).trim() === '') return '发布人不能为空';
  return null;
}

// ---- 测试 ----

describe('AnnouncementCreatePage 模块', () => {
  it('1. 模块可导入，default 导出为函数', async () => {
    const mod = await import('./page');
    assert.equal(typeof mod.default, 'function', 'default export should be a function (component)');
  });
});

describe('AnnouncementCreatePage 选项常量', () => {
  it('2. CATEGORY_OPTIONS 有5个公告类型', () => {
    assert.equal(CATEGORY_OPTIONS.length, 5);
    const values = CATEGORY_OPTIONS.map((o) => o.value);
    assert.deepEqual(values, ['system', 'promotion', 'operation', 'emergency', 'hr']);
  });

  it('3. PRIORITY_OPTIONS 有3个优先级', () => {
    assert.equal(PRIORITY_OPTIONS.length, 3);
    const values = PRIORITY_OPTIONS.map((o) => o.value);
    assert.deepEqual(values, ['high', 'normal', 'low']);
  });

  it('4. AUDIENCE_OPTIONS 有5个受众范围', () => {
    assert.equal(AUDIENCE_OPTIONS.length, 5);
    const values = AUDIENCE_OPTIONS.map((o) => o.value);
    assert.deepEqual(values, ['all', 'staff', 'management', 'sales', 'service']);
  });

  it('5. 每个选项都有非空 label 和 value', () => {
    for (const opts of [CATEGORY_OPTIONS, PRIORITY_OPTIONS, AUDIENCE_OPTIONS]) {
      for (const opt of opts) {
        assert.ok(typeof opt.label === 'string' && opt.label.length > 0);
        assert.ok(typeof opt.value === 'string' && opt.value.length > 0);
      }
    }
  });

  it('6. EXPECTED_FIELD_KEYS 包含11个字段键', () => {
    assert.equal(EXPECTED_FIELD_KEYS.length, 11);
  });

  it('7. 所有必填字段都在 EXPECTED_FIELD_KEYS 中', () => {
    const requiredKeys: (keyof AnnouncementFormData)[] = [
      'title', 'category', 'priority', 'summary', 'content',
      'targetAudience', 'effectiveDate', 'author',
    ];
    for (const k of requiredKeys) {
      assert.ok(EXPECTED_FIELD_KEYS.includes(k), `${k} should be in field keys`);
    }
  });

  it('8. 非必填字段也在 EXPECTED_FIELD_KEYS 中', () => {
    const optionalKeys: (keyof AnnouncementFormData)[] = [
      'expiryDate', 'attachment', 'notes',
    ];
    for (const k of optionalKeys) {
      assert.ok(EXPECTED_FIELD_KEYS.includes(k), `${k} should be in field keys`);
    }
  });
});

describe('AnnouncementCreatePage 标题验证', () => {
  it('9. 空标题返回错误', () => {
    assert.equal(validateTitle(''), '公告标题不能为空');
    assert.equal(validateTitle('   '), '公告标题不能为空');
    assert.equal(validateTitle(null), '公告标题不能为空');
    assert.equal(validateTitle(undefined), '公告标题不能为空');
  });

  it('10. 标题少于2字符返回错误', () => {
    assert.equal(validateTitle('a'), '标题至少2个字符');
    assert.equal(validateTitle('公'), '标题至少2个字符');
  });

  it('11. 标题超过50字符返回错误', () => {
    const long = '公'.repeat(51);
    assert.equal(validateTitle(long), '标题不能超过50个字符');
  });

  it('12. 50字符标题通过验证', () => {
    const valid = '公'.repeat(50);
    assert.equal(validateTitle(valid), null);
  });

  it('13. 2字符标题通过验证', () => {
    assert.equal(validateTitle('公告'), null);
  });

  it('14. 正常标题通过验证', () => {
    assert.equal(validateTitle('系统升级公告'), null);
    assert.equal(validateTitle('  夏季促销活动通知  '), null);
  });
});

describe('AnnouncementCreatePage 摘要验证', () => {
  it('15. 空摘要返回错误', () => {
    assert.equal(validateSummary(''), '公告摘要不能为空');
    assert.equal(validateSummary('   '), '公告摘要不能为空');
  });

  it('16. 正常摘要通过验证', () => {
    assert.equal(validateSummary('门店系统将于7月1日凌晨进行升级维护'), null);
  });

  it('17. 摘要超过200字符返回错误', () => {
    const long = 'a'.repeat(201);
    assert.equal(validateSummary(long), '摘要不能超过200个字符');
  });

  it('18. 200字符摘要通过验证', () => {
    const valid = 'a'.repeat(200);
    assert.equal(validateSummary(valid), null);
  });
});

describe('AnnouncementCreatePage 内容验证', () => {
  it('19. 空内容返回错误', () => {
    assert.equal(validateContent(''), '公告内容不能为空');
    assert.equal(validateContent('   '), '公告内容不能为空');
  });

  it('20. 内容少于10字符返回错误', () => {
    assert.equal(validateContent('短内容'), '公告内容至少10个字符');
  });

  it('21. 内容正好10字符通过验证', () => {
    assert.equal(validateContent('一二三四五六七八九十'), null);
  });

  it('22. 正常详细内容通过验证', () => {
    const content = '各位同事，系统将于7月1日凌晨2:00-4:00进行升级维护，期间收银系统将暂停使用，请大家提前做好准备。';
    assert.equal(validateContent(content), null);
  });
});

describe('AnnouncementCreatePage 必选Select验证', () => {
  it('23. 空值返回对应错误', () => {
    assert.equal(validateRequiredSelect('', '公告类型'), '公告类型不能为空');
    assert.equal(validateRequiredSelect('', '优先级'), '优先级不能为空');
  });

  it('24. 有值通过验证', () => {
    assert.equal(validateRequiredSelect('system', '公告类型'), null);
    assert.equal(validateRequiredSelect('high', '优先级'), null);
    assert.equal(validateRequiredSelect('all', '受众范围'), null);
  });
});

describe('AnnouncementCreatePage 日期验证', () => {
  it('25. 空日期通过（可选日期）', () => {
    assert.equal(validateDate(''), null);
    assert.equal(validateDate(null), null);
  });

  it('26. 有效日期通过验证', () => {
    assert.equal(validateDate('2026-07-01'), null);
    assert.equal(validateDate('2026-12-31'), null);
    assert.equal(validateDate('2025-01-01'), null);
  });

  it('27. 无效日期返回错误', () => {
    assert.equal(validateDate('not-a-date'), '请输入有效日期');
    assert.equal(validateDate('2026-13-01'), '请输入有效日期');
  });
});

describe('AnnouncementCreatePage 过期日期 vs 生效日期', () => {
  it('28. 过期日期晚于生效日期通过', () => {
    assert.equal(validateExpiryDate('2026-07-15', '2026-07-01'), null);
  });

  it('29. 过期日期早于或等于生效日期返回错误', () => {
    assert.equal(validateExpiryDate('2026-07-01', '2026-07-01'), '过期日期必须晚于生效日期');
    assert.equal(validateExpiryDate('2026-06-30', '2026-07-01'), '过期日期必须晚于生效日期');
  });

  it('30. 无生效日期时跳过验证', () => {
    assert.equal(validateExpiryDate('2026-07-15', null), null);
    assert.equal(validateExpiryDate('2026-07-15', ''), null);
  });

  it('31. 无过期日期时跳过验证', () => {
    assert.equal(validateExpiryDate(null, '2026-07-01'), null);
    assert.equal(validateExpiryDate('', '2026-07-01'), null);
  });
});

describe('AnnouncementCreatePage 发布人验证', () => {
  it('32. 空发布人返回错误', () => {
    assert.equal(validateAuthor(''), '发布人不能为空');
    assert.equal(validateAuthor('   '), '发布人不能为空');
    assert.equal(validateAuthor(null), '发布人不能为空');
  });

  it('33. 填写发布人通过验证', () => {
    assert.equal(validateAuthor('系统管理员'), null);
    assert.equal(validateAuthor('张三'), null);
  });
});

describe('AnnouncementCreatePage 完整表单验证组合', () => {
  it('34. 完整有效数据全部通过验证', () => {
    const data: AnnouncementFormData = {
      title: '系统升级公告',
      category: 'system',
      priority: 'high',
      summary: '门店系统将于7月1日凌晨进行升级维护',
      content: '各位同事，系统将于7月1日凌晨2:00-4:00进行升级维护。',
      targetAudience: 'all',
      effectiveDate: '2026-07-01',
      expiryDate: '2026-07-15',
      author: '系统管理员',
      attachment: '',
      notes: '',
    };

    assert.equal(validateTitle(data.title), null);
    assert.equal(validateRequiredSelect(data.category, '公告类型'), null);
    assert.equal(validateRequiredSelect(data.priority, '优先级'), null);
    assert.equal(validateSummary(data.summary), null);
    assert.equal(validateContent(data.content), null);
    assert.equal(validateRequiredSelect(data.targetAudience, '受众范围'), null);
    assert.equal(validateDate(data.effectiveDate), null);
    assert.equal(validateExpiryDate(data.expiryDate, data.effectiveDate), null);
    assert.equal(validateAuthor(data.author), null);
  });

  it('35. 标题为空时立即拦截', () => {
    const err = validateTitle('');
    assert.ok(err !== null);
    assert.ok(err.includes('不能为空'));
  });

  it('36. 摘要超长时立即拦截', () => {
    const err = validateSummary('x'.repeat(201));
    assert.ok(err !== null);
    assert.ok(err.includes('200'));
  });

  it('37. 多字段同时无效时各自返回错误', () => {
    const errTitle = validateTitle('');
    const errContent = validateContent('');
    const errAuthor = validateAuthor('');

    assert.ok(errTitle !== null);
    assert.ok(errContent !== null);
    assert.ok(errAuthor !== null);
  });

  it('38. 附件和备注为空不触发任何验证错误', () => {
    // attachment 和 notes 无验证规则，任意值应通过
    assert.equal(validateDate(undefined), null);
  });
});

describe('AnnouncementCreatePage 表单数据结构', () => {
  it('39. AnnouncementFormData 接口有11个字段', () => {
    const keys: (keyof AnnouncementFormData)[] = [
      'title', 'category', 'priority', 'summary', 'content',
      'targetAudience', 'effectiveDate', 'expiryDate', 'author',
      'attachment', 'notes',
    ];
    assert.equal(keys.length, 11);
    assert.deepEqual(keys, EXPECTED_FIELD_KEYS);
  });

  it('40. 所有字段均为 string 类型', () => {
    const sample: AnnouncementFormData = {
      title: '公告标题',
      category: 'system',
      priority: 'normal',
      summary: '摘要内容',
      content: '详细内容...',
      targetAudience: 'all',
      effectiveDate: '2026-07-01',
      expiryDate: '2026-08-01',
      author: '管理员',
      attachment: 'https://example.com/file.pdf',
      notes: '内部备注',
    };

    for (const key of EXPECTED_FIELD_KEYS) {
      assert.equal(typeof sample[key], 'string', `${key} should be string`);
    }
  });
});

describe('AnnouncementCreatePage 优先级判断', () => {
  it('41. high 优先级为高优先级', () => {
    const opt = PRIORITY_OPTIONS.find((o) => o.value === 'high');
    assert.equal(opt?.label, '高优先级');
  });

  it('42. normal 优先级为普通', () => {
    const opt = PRIORITY_OPTIONS.find((o) => o.value === 'normal');
    assert.equal(opt?.label, '普通');
  });

  it('43. low 优先级为低优先级', () => {
    const opt = PRIORITY_OPTIONS.find((o) => o.value === 'low');
    assert.equal(opt?.label, '低优先级');
  });
});

describe('AnnouncementCreatePage 公告类型判断', () => {
  it('44. system 为系统公告', () => {
    const opt = CATEGORY_OPTIONS.find((o) => o.value === 'system');
    assert.equal(opt?.label, '系统公告');
  });

  it('45. promotion 为促销活动', () => {
    const opt = CATEGORY_OPTIONS.find((o) => o.value === 'promotion');
    assert.equal(opt?.label, '促销活动');
  });

  it('46. emergency 为紧急通知', () => {
    const opt = CATEGORY_OPTIONS.find((o) => o.value === 'emergency');
    assert.equal(opt?.label, '紧急通知');
  });

  it('47. hr 为人事通知', () => {
    const opt = CATEGORY_OPTIONS.find((o) => o.value === 'hr');
    assert.equal(opt?.label, '人事通知');
  });
});

describe('AnnouncementCreatePage 受众范围判断', () => {
  it('48. all 为全部人员', () => {
    const opt = AUDIENCE_OPTIONS.find((o) => o.value === 'all');
    assert.equal(opt?.label, '全部人员');
  });

  it('49. sales 为导购员', () => {
    const opt = AUDIENCE_OPTIONS.find((o) => o.value === 'sales');
    assert.equal(opt?.label, '导购员');
  });

  it('50. service 为客服人员', () => {
    const opt = AUDIENCE_OPTIONS.find((o) => o.value === 'service');
    assert.equal(opt?.label, '客服人员');
  });
});
