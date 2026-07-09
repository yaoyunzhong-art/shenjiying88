/**
 * 新建分类 — Category Create Form Page (Next.js App Router Page)
 * 功能: 表单验证、提交、错误处理
 */
'use client';

import React, { useMemo } from 'react';
import { useRouter } from 'next/navigation';

import {
  FormPageScaffold,
  useToast,
  type FormPageField,
  type FormPageSubmitResult,
} from '@m5/ui';

// ---- 类型 ----

interface CategoryFormData {
  name: string;
  slug: string;
  parentId: string;
  description: string;
  sortOrder: string;
  status: string;
}

// ---- 常量 ----

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

// ---- 辅助函数 ----

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^\w\u4e00-\u9fff-]/g, '')
    .replace(/-+/g, '-');
}

/** 根据 name 变化自动补填 slug (如果还没有 slug) */
function autoFillSlug(name: string, currentSlug: string): Record<string, unknown> {
  if (name && !currentSlug) {
    return { slug: generateSlug(name) };
  }
  return {};
}

// ---- 字段定义 ----

const FIELDS: FormPageField<Record<string, unknown>>[] = [
  {
    key: 'name',
    label: '分类名称',
    type: 'text',
    required: true,
    placeholder: '请输入分类名称，如「私教课程」',
    rules: [
      {
        validate: (v: unknown) => {
          if (!v || (typeof v === 'string' && v.trim() === '')) return '请填写分类名称';
          return typeof v === 'string' && v.length > 50 ? '分类名称不超过50个字符' : null;
        },
      },
    ],
  },
  {
    key: 'slug',
    label: '标识（Slug）',
    type: 'text',
    required: true,
    placeholder: '自动生成，可手动修改，如 personal-trainer',
    rules: [
      {
        validate: (v: unknown) => {
          if (!v || (typeof v === 'string' && v.trim() === '')) return '请填写标识';
          return typeof v === 'string' && !/^[a-z0-9-]+$/.test(v)
            ? '只允许小写字母、数字和连字符'
            : null;
        },
      },
    ],
  },
  {
    key: 'parentId',
    label: '上级分类',
    type: 'select',
    placeholder: '请选择上级分类（不选则为顶级分类）',
    options: PARENT_CATEGORIES,
  },
  {
    key: 'description',
    label: '分类描述',
    type: 'textarea',
    placeholder: '简要描述该分类的用途和范围',
    rules: [
      {
        validate: (v: unknown) => {
          if (!v || (typeof v === 'string' && v.trim() === '')) return null;
          return typeof v === 'string' && v.length > 500 ? '描述不超过500个字符' : null;
        },
      },
    ],
  },
  {
    key: 'sortOrder',
    label: '排序权重',
    type: 'number',
    placeholder: '数字越小越靠前',
    initialValue: 99,
    rules: [
      {
        validate: (v: unknown) => {
          if (v === '' || v === null || v === undefined) return null;
          const num = Number(v);
          if (Number.isNaN(num)) return '必须是数字';
          if (num < 0) return '排序权重不能小于0';
          if (num > 999) return '排序权重不能超过999';
          return null;
        },
      },
    ],
  },
  {
    key: 'status',
    label: '状态',
    type: 'select',
    required: true,
    placeholder: '请选择初始状态',
    options: STATUS_OPTIONS,
    initialValue: 'active',
  },
];

// ---- 页面 ----

export default function NewCategoryPage() {
  const router = useRouter();
  const { success: toastSuccess } = useToast();

  const handleFieldChange = useMemo(() => {
    return (key: string, value: unknown) => {
      if (key === 'name' && typeof value === 'string') {
        return autoFillSlug(value, '');
      }
      return {};
    };
  }, []);

  const handleSubmit = async (
    values: Record<string, unknown>,
  ): Promise<FormPageSubmitResult | null> => {
    const data = values as unknown as CategoryFormData;

    // 模拟提交
    await new Promise((resolve) => setTimeout(resolve, 800));

    // 模拟验证
    if (!data.name || !data.slug) {
      return {
        data: values,
        message: '请填写必填字段',
        error: true,
      };
    }

    const parentName = PARENT_CATEGORIES.find((c) => c.value === data.parentId)?.label ?? null;

    toastSuccess(`分类「${data.name}」${parentName ? `（隶属于 ${parentName}）` : ''} 已创建`);

    router.push('/categories');
    return {
      data: values,
    };
  };
  return (
    <FormPageScaffold
      meta={{
        title: '新建分类',
        description: '添加一个新的商品/服务分类',
      }}
      fields={FIELDS}
      onSubmit={handleSubmit}
      cancelHref="/categories"
      submitLabel="创建分类"
      onChange={handleFieldChange}
    />
  );
}
