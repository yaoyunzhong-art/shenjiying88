'use client';

import React, { useState } from 'react';

import {
  FormPageScaffold,
  PageShell,
  type FormPageField,
  type FormPageSubmitResult,
} from '@m5/ui';

// ---- 类型 ----

type OfferingCategory = 'class' | 'event' | 'product' | 'service';

interface NewProductFormData {
  name: string;
  category: OfferingCategory;
  price: string;
  costPrice: string;
  storeName: string;
  description: string;
  scheduleHint: string;
  tags: string;
}

const CATEGORY_OPTIONS = [
  { label: '课程', value: 'class' as const },
  { label: '活动', value: 'event' as const },
  { label: '商品', value: 'product' as const },
  { label: '服务', value: 'service' as const },
];

// ---- 字段定义 ----

const FIELDS: FormPageField<Record<string, unknown>>[] = [
  {
    key: 'name',
    label: '作品/产品名称',
    required: true,
    placeholder: '例如：花艺体验课 - 春日花篮',
    helper: '建议控制在30字以内，包含品类关键词有利于搜索',
    rules: [
      {
        validate: (v) =>
          typeof v === 'string' && v.length < 2 ? '名称至少2个字符' : null,
      },
      {
        validate: (v) =>
          typeof v === 'string' && v.length > 60 ? '名称不超过60个字符' : null,
      },
    ],
  },
  {
    key: 'category',
    label: '品类',
    required: true,
    type: 'select',
    options: CATEGORY_OPTIONS,
    helper: '选择正确的分类有助于在门店前端正确展示',
  },
  {
    key: 'price',
    label: '售价 (元)',
    required: true,
    placeholder: '0.00',
    type: 'number',
    rules: [
      {
        validate: (v) => {
          const n = Number(v);
          return Number.isNaN(n) || n < 0 ? '售价不能为负数' : null;
        },
      },
      {
        validate: (v) => {
          const n = Number(v);
          return !Number.isNaN(n) && n > 999999 ? '售价不能超过 999,999' : null;
        },
      },
    ],
  },
  {
    key: 'costPrice',
    label: '成本价 (元)',
    placeholder: '0.00',
    type: 'number',
    helper: '仅内部可见，用于利润分析',
    rules: [
      {
        validate: (v) => {
          if (v === '' || v == null) return null;
          const n = Number(v);
          return Number.isNaN(n) || n < 0 ? '成本价不能为负数' : null;
        },
      },
    ],
  },
  {
    key: 'storeName',
    label: '所属门店',
    required: true,
    placeholder: '例如：花艺旗舰店（北京朝阳）',
    helper: '输入门店名称或从下拉列表中选择',
    rules: [
      {
        validate: (v) =>
          typeof v === 'string' && v.length < 1 ? '请选择所属门店' : null,
      },
    ],
  },
  {
    key: 'description',
    label: '描述 / 详情',
    type: 'textarea',
    placeholder: '请输入产品描述、规格、使用说明等详细信息…',
    helper: '建议包含卖点、规格参数、使用场景，300字以内',
    rules: [
      {
        validate: (v) =>
          typeof v === 'string' && v.length > 500
            ? '描述不超过500个字符'
            : null,
      },
    ],
  },
  {
    key: 'scheduleHint',
    label: '时间 / 排期提示',
    placeholder: '例如：每周六下午2点开课',
    helper: '课程或活动类产品填写，商品/服务可留空',
  },
  {
    key: 'tags',
    label: '标签',
    placeholder: '用逗号分隔，例如：热门推荐, 新品, 限时优惠',
    helper: '门店前台可用于筛选和推荐',
    rules: [
      {
        validate: (v) =>
          typeof v === 'string' && v.length > 200
            ? '标签总长度不超过200个字符'
            : null,
      },
    ],
  },
];

// ---- 页面 ----

import { useTriState } from '../../_components/useTriState';
import { TriStateRenderer } from '../../_components/TriStateRenderer';

export default function NewProductPage() {
  const { loading, error, wrapLoad } = useTriState();
  const [submitError, setSubmitError] = useState<string | null>(null);

  const handleSubmit = React.useCallback(
    async (formData: Record<string, unknown>): Promise<FormPageSubmitResult> => {
      setSubmitError(null);
      // Simulate API call with error handling
      const result = await wrapLoad(
        (async () => {
          await new Promise((r) => setTimeout(r, 600));
          const typedData = formData as unknown as NewProductFormData;

          if (!typedData.name || !typedData.category || !typedData.storeName) {
            return { data: formData, message: '请填写所有必填项' };
          }

          return {
            data: typedData as unknown as Record<string, unknown>,
            message: `「${typedData.name}」创建成功！`,
          };
        })(),
      );

      if (!result) {
        setSubmitError('提交失败，请稍后重试');
        return { data: formData, message: '提交失败，请稍后重试' };
      }

      return result;
    },
    [],
  );

  return (
    <PageShell
      title="新增作品/产品"
    >
      <TriStateRenderer
        loading={loading}
        empty={false}
        error={submitError}
        onRetry={() => setSubmitError(null)}
      >
      <FormPageScaffold
        meta={{ title: '新增作品/产品' }}
        fields={FIELDS}
        onSubmit={handleSubmit}
      />
      </TriStateRenderer>
    </PageShell>
  );
}
