'use client';

import React from 'react';

import {
  FormPageScaffold,
  type FormPageField,
  type FormPageSubmitResult,
} from '@m5/ui';

// ---- 类型 ----

interface NewCouponFormData {
  name: string;
  type: 'discount' | 'cash' | 'free_shipping' | 'voucher';
  value: string;
  minAmount: string;
  maxAmount: string;
  totalIssued: number;
  validFrom: string;
  validTo: string;
  storeName: string;
  description: string;
  usageLimit: number;
}

// ---- 字段定义 ----

const COUPON_TYPES = [
  { label: '打折券', value: 'discount' as const },
  { label: '代金券', value: 'cash' as const },
  { label: '免运费', value: 'free_shipping' as const },
  { label: '礼品券', value: 'voucher' as const },
];

const FIELDS: FormPageField<Record<string, unknown>>[] = [
  {
    key: 'name',
    label: '优惠券名称',
    required: true,
    placeholder: '例如：新客首单8折',
    helper: '建议控制在20字以内，便于顾客理解',
    rules: [
      {
        validate: (v) =>
          typeof v === 'string' && v.length < 2 ? '优惠券名称至少2个字符' : null,
      },
      {
        validate: (v) =>
          typeof v === 'string' && v.length > 50 ? '优惠券名称不超过50个字符' : null,
      },
    ],
  },
  {
    key: 'type',
    label: '优惠券类型',
    required: true,
    type: 'select',
    options: COUPON_TYPES,
  },
  {
    key: 'value',
    label: '面值',
    required: true,
    placeholder: '例如：8折 / ¥50 / 免运费',
    helper: '按实际优惠填写，如 8折、¥50、免运费',
  },
  {
    key: 'minAmount',
    label: '使用门槛',
    required: true,
    placeholder: '例如：满200元，不设门槛填 满0元可用',
  },
  {
    key: 'maxAmount',
    label: '最高抵扣限额',
    placeholder: '折扣/代金券最高抵扣金额，无限制留空',
    helper: '可选，不填则无上限',
  },
  {
    key: 'totalIssued',
    label: '发放总量',
    required: true,
    type: 'number',
    initialValue: 100,
    helper: '总发行数量，0 表示不限量',
    rules: [
      {
        validate: (v) =>
          typeof v === 'number' && v < 0 ? '发放总量不能为负数' : null,
      },
    ],
  },
  {
    key: 'usageLimit',
    label: '每人限用次数',
    type: 'number',
    initialValue: 1,
    helper: '每位顾客最多可使用次数，0 表示不限',
    rules: [
      {
        validate: (v) =>
          typeof v === 'number' && v < 0 ? '限用次数不能为负数' : null,
      },
    ],
  },
  {
    key: 'validFrom',
    label: '生效日期',
    required: true,
    type: 'date',
    helper: '优惠券开始生效的日期',
  },
  {
    key: 'validTo',
    label: '截止日期',
    required: true,
    type: 'date',
    helper: '优惠券过期日期',
  },
  {
    key: 'storeName',
    label: '适用门店',
    required: true,
    placeholder: '输入门店名称，如 Demo Store 旗舰店',
  },
  {
    key: 'description',
    label: '优惠券说明',
    type: 'textarea',
    placeholder: '输入优惠券的详细说明和使用规则...',
    helper: '将会展示给顾客，建议内容完整、清晰',
    rules: [
      {
        validate: (v) =>
          typeof v === 'string' && v.length > 500 ? '优惠券说明不超过500个字符' : null,
      },
    ],
  },
];

// ---- Mock 提交模拟 ----

function mockSubmitCoupon(
  data: Record<string, unknown>,
): Promise<FormPageSubmitResult<Record<string, unknown>>> {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      // 模拟随机失败（10% 概率）
      if (Math.random() < 0.1) {
        reject(new Error('服务端繁忙，请稍后重试'));
        return;
      }
      resolve({
        data,
        message: `优惠券「${data.name}」创建成功！`,
      });
    }, 800);
  });
}

// ---- 页面 ----

export default function NewCouponPage() {
  return (
    <FormPageScaffold
      meta={{
        title: '新建优惠券',
        description: '创建一个新的优惠券活动，填写基本信息和优惠规则。',
      }}
      fields={FIELDS}
      onSubmit={async (data: Record<string, unknown>) => {
        const result = await mockSubmitCoupon(data);
        return result;
      }}
      backUrl="/coupons"
      submitLabel="创建优惠券"
      submitVariant="brand"
    />
  );
}
