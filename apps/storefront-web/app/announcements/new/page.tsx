/**
 * 新建公告 — Announcement Create Form Page (Next.js App Router Page)
 * 角色视角: 👔店长 / 📢运营
 * 功能: 表单验证、提交、错误处理
 */
'use client';

import React from 'react';
import { useRouter } from 'next/navigation';

import {
  FormPageScaffold,
  useToast,
  type FormPageField,
  type FormPageSubmitResult,
} from '@m5/ui';

// ---- 类型 ----

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

// ---- 常量 ----

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

// ---- 字段定义 ----

const FIELDS: FormPageField<Record<string, unknown>>[] = [
  {
    key: 'title',
    label: '公告标题',
    required: true,
    type: 'text',
    placeholder: '请输入公告标题（2-50个字符）',
    rules: [
      {
        validate: (v) => {
          if (!v || (v as string).trim() === '') return '公告标题不能为空';
          const trimmed = (v as string).trim();
          if (trimmed.length < 2) return '标题至少2个字符';
          if (trimmed.length > 50) return '标题不能超过50个字符';
          return null;
        },
      },
    ],
  },
  {
    key: 'category',
    label: '公告类型',
    required: true,
    type: 'select',
    options: CATEGORY_OPTIONS,
    rules: [
      {
        validate: (v) => (!v || v === '' ? '请选择公告类型' : null),
      },
    ],
  },
  {
    key: 'priority',
    label: '优先级',
    required: true,
    type: 'select',
    options: PRIORITY_OPTIONS,
    initialValue: 'normal',
    rules: [
      {
        validate: (v) => (!v || v === '' ? '请选择优先级' : null),
      },
    ],
  },
  {
    key: 'summary',
    label: '公告摘要',
    required: true,
    type: 'text',
    placeholder: '请输入公告摘要（不超过200个字符）',
    rules: [
      {
        validate: (v) => {
          if (!v || (v as string).trim() === '') return '公告摘要不能为空';
          const trimmed = (v as string).trim();
          if (trimmed.length > 200) return '摘要不能超过200个字符';
          return null;
        },
      },
    ],
  },
  {
    key: 'content',
    label: '公告内容',
    required: true,
    type: 'textarea',
    placeholder: '请输入详细的公告内容',
    rules: [
      {
        validate: (v) => {
          if (!v || (v as string).trim() === '') return '公告内容不能为空';
          const trimmed = (v as string).trim();
          if (trimmed.length < 10) return '公告内容至少10个字符';
          return null;
        },
      },
    ],
  },
  {
    key: 'targetAudience',
    label: '受众范围',
    required: true,
    type: 'select',
    options: AUDIENCE_OPTIONS,
    initialValue: 'all',
    rules: [
      {
        validate: (v) => (!v || v === '' ? '请选择受众范围' : null),
      },
    ],
  },
  {
    key: 'effectiveDate',
    label: '生效日期',
    required: true,
    type: 'date',
    placeholder: '请选择生效日期',
    rules: [
      {
        validate: (v) => {
          if (!v || v === '') return '生效日期不能为空';
          const d = new Date(v as string);
          return isNaN(d.getTime()) ? '请输入有效日期' : null;
        },
      },
    ],
  },
  {
    key: 'expiryDate',
    label: '过期日期',
    required: false,
    type: 'date',
    placeholder: '过期日期（可选）',
    rules: [
      {
        validate: (v) => {
          if (!v || v === '') return null;
          const d = new Date(v as string);
          return isNaN(d.getTime()) ? '请输入有效日期' : null;
        },
      },
      {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        validate: (v: unknown, values?: Record<string, any>) => {
          if (!v || v === '' || !values?.effectiveDate) return null;
          const expiry = new Date(v as string);
          const effective = new Date(values.effectiveDate as string);
          return expiry <= effective ? '过期日期必须晚于生效日期' : null;
        },
      },
    ],
  },
  {
    key: 'author',
    label: '发布人',
    required: true,
    type: 'text',
    placeholder: '请输入发布人姓名',
    rules: [
      {
        validate: (v) => {
          if (!v || (v as string).trim() === '') return '发布人不能为空';
          return null;
        },
      },
    ],
  },
  {
    key: 'attachment',
    label: '附件链接',
    required: false,
    type: 'text',
    placeholder: '附件 URL（可选）',
  },
  {
    key: 'notes',
    label: '备注',
    required: false,
    type: 'textarea',
    placeholder: '备注信息（仅内部可见）',
  },
];

// ---- 页面组件 ----

export default function AnnouncementCreatePage(): React.ReactElement {
  const router = useRouter();
  const { success: toastSuccess, error: toastError } = useToast();

  const handleSubmit = async (
    values: Record<string, unknown>,
  ): Promise<FormPageSubmitResult | null> => {
    // 模拟网络延迟
    await new Promise((resolve) => setTimeout(resolve, 800));

    toastSuccess(`公告「${(values.title as string)?.trim() || ''}」已成功发布`);

    // 延迟跳转回列表页
    setTimeout(() => {
      router.push('/announcements');
    }, 1200);

    return {
      data: values as Record<string, unknown>,
      message: '公告创建成功',
    };
  };

  return (
    <FormPageScaffold
      meta={{ title: '新建公告', description: '创建新的门店公告，支持多种类型和优先级设置' }}
      fields={FIELDS}
      onSubmit={handleSubmit}
      submitLabel="发布公告"
      backUrl="/announcements"
    />
  );
}
