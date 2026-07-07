/**
 * 新建分类 — Category Create Form Page (Next.js App Router)
 * 角色视角: 👤运营管理员
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

interface CategoryFormData {
  name: string;
  code: string;
  parentName: string;
  sortOrder: number;
  description: string;
}

const PARENT_OPTIONS = [
  { label: '— 无（一级分类）', value: '' },
  { label: '美妆护肤', value: '美妆护肤' },
  { label: '个人护理', value: '个人护理' },
  { label: '家居清洁', value: '家居清洁' },
  { label: '食品饮料', value: '食品饮料' },
];

export default function NewCategoryPage() {
  const router = useRouter();
  const toast = useToast();

  const fields = useMemo<FormPageField[]>(() => {
    return [
      {
        key: 'name',
        label: '分类名称',
        type: 'text',
        required: true,
        placeholder: '输入分类名称，如"面部护理"',
        validators: [
          { rule: 'required', message: '请输入分类名称' },
          { rule: 'maxLength', value: 20, message: '分类名称最多 20 字' },
        ],
      },
      {
        key: 'code',
        label: '分类编码',
        type: 'text',
        required: true,
        placeholder: '输入唯一编码，如 FACE_CARE',
        validators: [
          { rule: 'required', message: '请输入分类编码' },
          { rule: 'pattern', value: /^[A-Z_]+$/, message: '编码仅支持大写字母和下划线' },
          { rule: 'maxLength', value: 30, message: '编码最多 30 字符' },
        ],
      },
      {
        key: 'parentName',
        label: '上级分类',
        type: 'select',
        options: PARENT_OPTIONS,
        defaultValue: '',
        placeholder: '选择上级分类（可选）',
      },
      {
        key: 'sortOrder',
        label: '排序权重',
        type: 'number',
        defaultValue: 0,
        placeholder: '数值越小越靠前',
        validators: [
          { rule: 'min', value: 0, message: '排序权重不能小于 0' },
          { rule: 'max', value: 999, message: '排序权重不能超过 999' },
        ],
      },
      {
        key: 'description',
        label: '备注说明',
        type: 'textarea',
        placeholder: '可选填写分类描述或备注',
        validators: [
          { rule: 'maxLength', value: 200, message: '备注最多 200 字' },
        ],
      },
    ];
  }, []);

  const handleSubmit = async (data: Record<string, unknown>): Promise<FormPageSubmitResult<Record<string, unknown>>> => {
    try {
      await new Promise(resolve => setTimeout(resolve, 600));
      toast.success('分类创建成功');
      router.push('/categories');
      return { data };
    } catch (err) {
      return {
        data
      };
    }
  };

  return (
    <FormPageScaffold
      meta={{
        title: '新建分类',
      }}
      fields={fields}
      onSubmit={handleSubmit}
      submitLabel="创建分类"
      backUrl="/categories"
      cancelHref="/categories"
    />
  );
}
