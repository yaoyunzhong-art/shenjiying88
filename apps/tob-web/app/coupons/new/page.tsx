/**
 * coupons/new/page.tsx — ToB 新建优惠券页面
 *
 * 使用 FormPageScaffold 构建包含验证的优惠券创建表单
 * 支持选择类型、设置面值、有效期、发放总量等
 */
'use client';

import React from 'react';

import {
  FormPageScaffold,
  type FormPageField,
  type FormPageSubmitResult,
} from '@m5/ui';

// ---- 字段定义 ----

const COUPON_TYPES = [
  { label: '打折券', value: 'discount' as const },
  { label: '代金券', value: 'cash' as const },
  { label: '免运费', value: 'free_shipping' as const },
  { label: '礼品券', value: 'voucher' as const },
];

const BRAND_OPTIONS = [
  { label: 'M5', value: 'M5' },
  { label: 'M5 PRO', value: 'M5-PRO' },
  { label: 'M5 LITE', value: 'M5-LITE' },
];

const MARKET_OPTIONS = [
  { label: '上海 (CN-SH)', value: 'CN-SH' },
  { label: '北京 (CN-BJ)', value: 'CN-BJ' },
  { label: '广东 (CN-GD)', value: 'CN-GD' },
  { label: '四川 (CN-SC)', value: 'CN-SC' },
  { label: '浙江 (CN-ZJ)', value: 'CN-ZJ' },
];

const FIELDS: FormPageField<Record<string, unknown>>[] = [
  {
    key: 'name',
    label: '优惠券名称',
    required: true,
    placeholder: '例如：新客首单8折',
    helper: '建议控制在20字以内',
    rules: [
      {
        validate: (v) =>
          typeof v === 'string' && v.length < 2 ? '名称至少2个字符' : null,
      },
      {
        validate: (v) =>
          typeof v === 'string' && v.length > 50 ? '名称不超过50个字符' : null,
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
    key: 'brandCode',
    label: '所属品牌',
    required: true,
    type: 'select',
    options: BRAND_OPTIONS,
  },
  {
    key: 'marketCode',
    label: '适用市场',
    required: true,
    type: 'select',
    options: MARKET_OPTIONS,
  },
  {
    key: 'value',
    label: '面值',
    required: true,
    placeholder: '例如：8折 / ¥50 / 免运费',
    helper: '按实际优惠填写',
  },
  {
    key: 'minAmount',
    label: '使用门槛',
    required: true,
    placeholder: '例如：满200元',
  },
  {
    key: 'maxAmount',
    label: '最高抵扣',
    placeholder: '可选，无限制留空',
    helper: '折扣/代金券最高抵扣金额',
  },
  {
    key: 'totalIssued',
    label: '发放总量',
    required: true,
    type: 'number',
    initialValue: 500,
    helper: '0 表示不限量',
    rules: [
      {
        validate: (v) =>
          typeof v === 'number' && v < 0 ? '总量不能为负数' : null,
      },
    ],
  },
  {
    key: 'usageLimit',
    label: '每人限用次数',
    type: 'number',
    initialValue: 1,
    helper: '0 表示不限次数',
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
  },
  {
    key: 'validTo',
    label: '截止日期',
    required: true,
    type: 'date',
  },
  {
    key: 'description',
    label: '使用说明',
    type: 'textarea',
    placeholder: '输入使用说明和规则...',
    helper: '展示给顾客的说明文字',
    rules: [
      {
        validate: (v) =>
          typeof v === 'string' && v.length > 500 ? '说明不超过500个字符' : null,
      },
    ],
  },
];

// ---- Mock 提交 ----

function mockSubmit(data: Record<string, unknown>): Promise<FormPageSubmitResult<Record<string, unknown>>> {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
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
        description: 'ToB 端创建品牌级优惠券活动，设定面值、有效期与发放规则。',
      }}
      fields={FIELDS}
      onSubmit={async (data: Record<string, unknown>) => {
        const result = await mockSubmit(data);
        return result;
      }}
      backUrl="/coupons"
      submitLabel="创建优惠券"
      submitVariant="brand"
    />
  );
}
