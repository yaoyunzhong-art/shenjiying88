/**
 * 促销活动新建页 — New Promotion Page (Next.js App Router Page)
 * 功能: 创建新的促销活动，支持类型/预算/时间等字段填写，提交后跳转详情页
 * 角色视角: 👔店长 / 📊运营
 */
'use client';

import React from 'react';
import { useRouter } from 'next/navigation';

import {
  FormPageScaffold,
  type FormPageField,
  type FormPageSubmitResult,
} from '@m5/ui';

// ---- 类型 ----

interface NewPromotionFormData {
  title: string;
  type: 'discount' | 'coupon' | 'gift' | 'flash-sale';
  description: string;
  startDate: string;
  endDate: string;
  budget: number;
  usageLimit: number;
  storeName: string;
}

// ---- 字段定义 ----

const PROMOTION_TYPES = [
  { label: '折扣', value: 'discount' as const },
  { label: '优惠券', value: 'coupon' as const },
  { label: '赠品', value: 'gift' as const },
  { label: '秒杀', value: 'flash-sale' as const },
];

const FIELDS: FormPageField[] = [
  {
    key: 'title',
    label: '活动标题',
    required: true,
    placeholder: '例如：夏日清凉大促',
    helper: '建议控制在20字以内，便于识别',
    rules: [
      {
        validate: (v: unknown) =>
          typeof v === 'string' && v.length < 2 ? '活动标题至少2个字符' : null,
      },
      {
        validate: (v: unknown) =>
          typeof v === 'string' && v.length > 50 ? '活动标题不超过50个字符' : null,
      },
    ],
  },
  {
    key: 'type',
    label: '活动类型',
    required: true,
    type: 'select',
    options: PROMOTION_TYPES,
  },
  {
    key: 'description',
    label: '活动描述',
    type: 'textarea',
    required: true,
    placeholder: '详细描述活动内容和规则，将展示给顾客',
    rules: [
      {
        validate: (v: unknown) =>
          typeof v === 'string' && v.length > 500 ? '活动描述不超过500个字符' : null,
      },
    ],
  },
  {
    key: 'startDate',
    label: '开始日期',
    required: true,
    type: 'date',
    helper: '活动开始日期',
  },
  {
    key: 'endDate',
    label: '结束日期',
    required: true,
    type: 'date',
    helper: '活动结束日期，必须晚于开始日期',
  },
  {
    key: 'budget',
    label: '预算 (¥)',
    type: 'number',
    required: true,
    initialValue: 50000,
    placeholder: '例如 50000',
    helper: '活动预算金额（元）',
    rules: [
      {
        validate: (v: unknown) =>
          typeof v === 'number' && v < 0 ? '预算不能为负数' : null,
      },
    ],
  },
  {
    key: 'usageLimit',
    label: '使用上限',
    type: 'number',
    required: true,
    initialValue: 500,
    placeholder: '例如 500',
    helper: '优惠可被使用的最大次数，0 表示不限',
    rules: [
      {
        validate: (v: unknown) =>
          typeof v === 'number' && v < 0 ? '使用上限不能为负数' : null,
      },
    ],
  },
  {
    key: 'storeName',
    label: '所属门店',
    required: true,
    placeholder: '输入门店名称',
  },
];

// ---- Mock 提交模拟 ----

function mockSubmitPromotion(
  data: Record<string, unknown>,
): Promise<FormPageSubmitResult> {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      // 模拟随机失败（10% 概率）
      if (Math.random() < 0.1) {
        reject(new Error('服务端繁忙，请稍后重试'));
        return;
      }
      resolve({
        data,
        message: `促销活动「${data.title}」创建成功！`,
      });
    }, 800);
  });
}

// ---- 页面 ----

export default function NewPromotionPage() {
  const router = useRouter();

  return (
    <FormPageScaffold
      meta={{
        title: '新建促销活动',
        description: '创建一个新的促销活动，填写基本信息和预算规则。',
      }}
      fields={FIELDS}
      onSubmit={async (data: Record<string, unknown>) => {
        const result = await mockSubmitPromotion(data);
        return result;
      }}
      onSuccess={() => {
        router.push('/promotions');
      }}
      backUrl="/promotions"
      submitLabel="创建活动"
      submitVariant="brand"
    />
  );
}
