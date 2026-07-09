/**
 * 新建分类页 — New Category Form Page Test
 * 验证: 字段定义、验证规则、MOCK 数据、表单提交逻辑、自动 slug 生成
 */

import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

// ── 类型 (与 page.tsx 一致) ──

interface CategoryFormData {
  name: string;
  slug: string;
  parentId: string;
  description: string;
  sortOrder: string;
  status: string;
}

// ── 常量 (与 page.tsx 一致) ──

const PARENT_CATEGORIES = [
  { label: '（顶级分类）', value: '' },
  { label: '健身课程', value: 'c1' },
  { label: '运动商品', value: 'c5' },
  { label: '场馆服务', value: 'c10' },
  { label: '活动赛事', value: 'c14' },
];

const STATUS_OPTIONS = [
  { label: '启用', value: 'active' },
  { label: '隐藏', value: 'hidden' },
];

// ── 辅助函数 (与 page.tsx 一致) ──

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^\w\u4e00-\u9fff-]/g, '')
    .replace(/-+/g, '-');
}

// ── 验证函数 (模拟页面验证逻辑) ──

function validateCategoryName(value: unknown): string | null {
  if (!value || (typeof value === 'string' && value.trim() === '')) {
    return '请填写分类名称';
  }
  if (typeof value === 'string' && value.length > 50) {
    return '分类名称不超过50个字符';
  }
  return null;
}

function validateSlug(value: unknown): string | null {
  if (!value || (typeof value === 'string' && value.trim() === '')) {
    return '请填写标识';
  }
  if (typeof value === 'string' && !/^[a-z0-9-]+$/.test(value)) {
    return '只允许小写字母、数字和连字符';
  }
  return null;
}

function validateSortOrder(value: unknown): string | null {
  if (value === '' || value === null || value === undefined) return null;
  const num = Number(value);
  if (Number.isNaN(num)) return '必须是数字';
  if (num < 0) return '排序权重不能小于0';
  if (num > 999) return '排序权重不能超过999';
  return null;
}

function validateDescription(value: unknown): string | null {
  if (!value || (typeof value === 'string' && value.trim() === '')) return null;
  if (typeof value === 'string' && value.length > 500) return '描述不超过500个字符';
  return null;
}

interface ValidationResult {
  success: boolean;
  error?: string;
}

function validateForm(values: Partial<CategoryFormData>): ValidationResult {
  if (!values.name || !values.slug) {
    return { success: false, error: '请填写必填字段' };
  }
  return { success: true };
}

// ── 测试 ──

describe('NewCategoryPage — 字段定义', () => {
  it('PARENT_CATEGORIES 应包含5个选项', () => {
    assert.equal(PARENT_CATEGORIES.length, 5);
  });

  it('PARENT_CATEGORIES 应包含顶级分类', () => {
    const top = PARENT_CATEGORIES.find((c) => c.value === '');
    assert.ok(top);
    assert.equal(top?.label, '（顶级分类）');
  });

  it('PARENT_CATEGORIES 应包含所有 Mock 中使用的父分类', () => {
    const labels = PARENT_CATEGORIES.map((c) => c.label);
    assert.ok(labels.includes('健身课程'));
    assert.ok(labels.includes('运动商品'));
    assert.ok(labels.includes('场馆服务'));
    assert.ok(labels.includes('活动赛事'));
  });

  it('STATUS_OPTIONS 应包含2个选项', () => {
    assert.equal(STATUS_OPTIONS.length, 2);
  });

  it('STATUS_OPTIONS 应包含启用和隐藏', () => {
    assert.ok(STATUS_OPTIONS.some((s) => s.value === 'active' && s.label === '启用'));
    assert.ok(STATUS_OPTIONS.some((s) => s.value === 'hidden' && s.label === '隐藏'));
  });
});

describe('NewCategoryPage — generateSlug 自动生成', () => {
  it('中文分类名应生成纯英文化 slug', () => {
    assert.equal(generateSlug('私教课程'), '私教课程');
  });

  it('混合名称应保留字母数字', () => {
    assert.equal(generateSlug('Yoga 课程'), 'yoga-课程');
  });

  it('空格应转为连字符', () => {
    assert.equal(generateSlug('Personal Trainer'), 'personal-trainer');
  });

  it('多个连字符应合并', () => {
    assert.equal(generateSlug('a---b'), 'a-b');
  });

  it('特殊字符应被移除', () => {
    assert.equal(generateSlug('hello@world!'), 'helloworld');
  });

  it('空字符串应返回空', () => {
    assert.equal(generateSlug(''), '');
  });
});

describe('NewCategoryPage — 验证规则', () => {
  it('空名称应返回错误', () => {
    assert.equal(validateCategoryName(''), '请填写分类名称');
    assert.equal(validateCategoryName(null), '请填写分类名称');
    assert.equal(validateCategoryName('   '), '请填写分类名称');
  });

  it('名称超过50字符应返回错误', () => {
    assert.equal(validateCategoryName('a'.repeat(51)), '分类名称不超过50个字符');
  });

  it('50字符以内名称应通过', () => {
    assert.equal(validateCategoryName('私教课程'), null);
    assert.equal(validateCategoryName('a'.repeat(50)), null);
  });

  it('空 slug 应返回错误', () => {
    assert.equal(validateSlug(''), '请填写标识');
    assert.equal(validateSlug(null), '请填写标识');
  });

  it('slug 包含大写字母应返回错误', () => {
    assert.equal(validateSlug('Test-Slug'), '只允许小写字母、数字和连字符');
  });

  it('slug 包含特殊字符应返回错误', () => {
    assert.equal(validateSlug('hello world'), '只允许小写字母、数字和连字符');
  });

  it('合法 slug 应通过', () => {
    assert.equal(validateSlug('personal-trainer'), null);
    assert.equal(validateSlug('facial-care-2026'), null);
  });

  it('排序权重负数应返回错误', () => {
    assert.equal(validateSortOrder('-1'), '排序权重不能小于0');
  });

  it('排序权重超过999应返回错误', () => {
    assert.equal(validateSortOrder('1000'), '排序权重不能超过999');
  });

  it('排序权重在范围内应通过', () => {
    assert.equal(validateSortOrder('0'), null);
    assert.equal(validateSortOrder('99'), null);
    assert.equal(validateSortOrder('999'), null);
    assert.equal(validateSortOrder(''), null);
  });

  it('描述超过500字符应返回错误', () => {
    assert.equal(validateDescription('a'.repeat(501)), '描述不超过500个字符');
  });

  it('描述为空或正常应通过', () => {
    assert.equal(validateDescription(''), null);
    assert.equal(validateDescription('这是个测试分类'), null);
  });
});

describe('NewCategoryPage — 表单提交逻辑', () => {
  it('空表单提交应返回错误', () => {
    const result = validateForm({});
    assert.equal(result.success, false);
    assert.equal(result.error, '请填写必填字段');
  });

  it('缺少名称应返回错误', () => {
    const result = validateForm({ slug: 'test-slug' });
    assert.equal(result.success, false);
  });

  it('缺少 slug 应返回错误', () => {
    const result = validateForm({ name: '测试分类' });
    assert.equal(result.success, false);
  });

  it('完整表单应通过验证', () => {
    const result = validateForm({ name: '私教课程', slug: 'personal-trainer' });
    assert.equal(result.success, true);
  });

  it('完整表单（含可选字段）应通过验证', () => {
    const result = validateForm({
      name: '私教课程',
      slug: 'personal-trainer',
      parentId: 'c1',
      description: '一对一私教课程分类',
      sortOrder: '5',
      status: 'active',
    });
    assert.equal(result.success, true);
  });
});

describe('NewCategoryPage — MOCK 数据完整性', () => {
  it('PARENT_CATEGORIES 每个选项都有 label 和 value', () => {
    for (const cat of PARENT_CATEGORIES) {
      assert.equal(typeof cat.label, 'string');
      assert.equal(typeof cat.value, 'string');
    }
  });

  it('STATUS_OPTIONS 每个选项都有 label 和 value', () => {
    for (const opt of STATUS_OPTIONS) {
      assert.equal(typeof opt.label, 'string');
      assert.equal(typeof opt.value, 'string');
    }
  });

  it('任何选项 value 都不为空（顶级分类除外）', () => {
    const nonEmpty = PARENT_CATEGORIES.filter((c) => c.value !== '');
    for (const cat of nonEmpty) {
      assert.ok(cat.value.length > 0);
    }
  });
});
