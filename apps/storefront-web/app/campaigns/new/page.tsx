/**
 * 营销活动新建页 — New Campaign Page (Next.js App Router Page)
 * 功能: 创建新的营销活动，支持渠道/目标人群/预算/时间等字段填写，提交后跳转详情页
 * 角色视角: 📢营销 / 👔店长
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

interface NewCampaignFormData {
  name: string;
  channel: string;
  targetAudience: string;
  description: string;
  startAt: string;
  endAt: string;
  budget: number;
  expectedConversions: number;
}

// ---- 字段定义 ----

const CAMPAIGN_CHANNELS = [
  { label: '小程序', value: '小程序' },
  { label: 'H5', value: 'H5' },
  { label: 'App推送', value: 'App推送' },
  { label: '短信', value: '短信' },
  { label: '企微', value: '企微' },
  { label: '全渠道', value: '全渠道' },
];

const TARGET_AUDIENCES = [
  { label: '全部会员', value: '全部会员' },
  { label: '黄金会员', value: '黄金会员' },
  { label: '白银会员', value: '白银会员' },
  { label: '青铜会员', value: '青铜会员' },
  { label: '新客', value: '新客' },
  { label: '沉睡会员（30天未到店）', value: '沉睡会员' },
];

const FIELDS: FormPageField[] = [
  // type: NewCampaignFormData
  {
    key: 'name',
    label: '活动名称',
    required: true,
    placeholder: '例如：618年中大促',
    helper: '建议控制在15字以内，便于识别和管理',
    rules: [
      {
        validate: (v: unknown) =>
          typeof v === 'string' && v.length < 2 ? '活动名称至少2个字符' : null,
      },
      {
        validate: (v: unknown) =>
          typeof v === 'string' && v.length > 30 ? '活动名称不超过30个字符' : null,
      },
    ],
  },
  {
    key: 'channel',
    label: '投放渠道',
    required: true,
    type: 'select',
    options: CAMPAIGN_CHANNELS,
    helper: '选择活动的主要投放渠道',
  },
  {
    key: 'targetAudience',
    label: '目标人群',
    required: true,
    type: 'select',
    options: TARGET_AUDIENCES,
    helper: '选择活动目标受众群体',
  },
  {
    key: 'description',
    label: '活动描述',
    type: 'textarea',
    required: true,
    placeholder: '详细描述营销活动的内容、目标和执行方案',
    rules: [
      {
        validate: (v: unknown) =>
          typeof v === 'string' && v.length > 800 ? '活动描述不超过800个字符' : null,
      },
    ],
  },
  {
    key: 'startAt',
    label: '开始日期',
    required: true,
    type: 'date',
    helper: '活动开始投放的日期',
  },
  {
    key: 'endAt',
    label: '结束日期',
    required: true,
    type: 'date',
    helper: '活动截止日期，必须晚于开始日期',
  },
  {
    key: 'budget',
    label: '预算 (¥)',
    type: 'number',
    required: true,
    initialValue: 10000,
    placeholder: '例如 10000',
    helper: '营销活动的总预算金额（元）',
    rules: [
      {
        validate: (v: unknown) =>
          typeof v === 'number' && v < 0 ? '预算不能为负数' : null,
      },
      {
        validate: (v: unknown) =>
          typeof v === 'number' && v > 1000000 ? '预算不超过100万元' : null,
      },
    ],
  },
  {
    key: 'expectedConversions',
    label: '预期转化数',
    type: 'number',
    required: true,
    initialValue: 200,
    placeholder: '例如 200',
    helper: '预期带来的转化/订单数',
    rules: [
      {
        validate: (v: unknown) =>
          typeof v === 'number' && v < 0 ? '预期转化数不能为负数' : null,
      },
    ],
  },
];

// ---- Mock 提交模拟 ----

function mockSubmitCampaign(
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
        message: `营销活动「${data.name}」创建成功！`,
      });
    }, 800);
  });
}

// ---- 页面 ----

export default function NewCampaignPage() {
  const router = useRouter();

  return (
    <FormPageScaffold
      meta={{
        title: '新建营销活动',
        description: '创建一个新的营销活动，配置投放渠道、目标人群、预算等参数。',
      }}
      fields={FIELDS}
      onSubmit={async (data: Record<string, unknown>) => {
        const result = await mockSubmitCampaign(data);
        return result;
      }}
      onSuccess={() => {
        router.push('/campaigns');
      }}
      backUrl="/campaigns"
      submitLabel="创建活动"
      submitVariant="brand"
    />
  );
}
