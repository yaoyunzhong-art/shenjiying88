/**
 * 新建会员等级 — Membership Tier Create Form Page (Next.js App Router Page)
 * 角色视角: 👤运营管理员 / 📊会员管理
 * 功能: 表单验证、提交、错误处理、UI反馈
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

interface TierFormData {
  name: string;
  key: string;
  level: number;
  minPoints: number;
  maxPoints: number;
  discountRate: number;
  color: string;
  icon: string;
  benefits: string;
  annualFee: number;
  renewalCondition: string;
  upgradeCondition: string;
  downgradeCondition: string;
  status: string;
}

// ---- 常量 ----

const COLOR_OPTIONS = [
  { label: '钻石蓝 (#3b82f6)', value: '#3b82f6' },
  { label: '金色 (#f59e0b)', value: '#f59e0b' },
  { label: '银色 (#9ca3af)', value: '#9ca3af' },
  { label: '青铜 (#d97706)', value: '#d97706' },
  { label: '铂金 (#a78bfa)', value: '#a78bfa' },
  { label: '红色 (#ef4444)', value: '#ef4444' },
  { label: '绿色 (#22c55e)', value: '#22c55e' },
  { label: '紫色 (#8b5cf6)', value: '#8b5cf6' },
  { label: '粉色 (#ec4899)', value: '#ec4899' },
  { label: '青色 (#06b6d4)', value: '#06b6d4' },
];

const STATUS_OPTIONS = [
  { label: '启用', value: 'active' },
  { label: '停用', value: 'inactive' },
  { label: '仅内部可见', value: 'hidden' },
];

const ICON_OPTIONS = [
  { label: '👑 皇冠', value: 'crown' },
  { label: '⭐ 星星', value: 'star' },
  { label: '💎 钻石', value: 'diamond' },
  { label: '🏆 奖杯', value: 'trophy' },
  { label: '🛡️ 盾牌', value: 'shield' },
  { label: '🎯 靶心', value: 'target' },
  { label: '🚀 火箭', value: 'rocket' },
  { label: '💫 闪光', value: 'sparkle' },
  { label: '🌟 亮星', value: 'glowing-star' },
  { label: '🔥 火焰', value: 'flame' },
];

const BENEFIT_PRESETS = [
  { label: '全场 8 折优惠', value: '全场商品8折优惠' },
  { label: '双倍积分', value: '消费享双倍积分' },
  { label: '生日礼包', value: '生日当月赠送礼包' },
  { label: '免运费', value: '免配送费' },
  { label: '专属客服', value: '专属客服通道' },
  { label: '优先发货', value: '订单优先发货' },
  { label: '新品预览', value: '新品上线预览权' },
  { label: '免费升级', value: '免费升级配送' },
  { label: '专属活动', value: '会员专属活动邀请' },
  { label: '无理由退换', value: '365天无理由退换' },
];

// ---- 字段定义 ----

const FIELDS: FormPageField<Record<string, unknown>>[] = [
  {
    key: 'name',
    label: '等级名称',
    required: true,
    type: 'text',
    placeholder: '例如：钻石会员',
    rules: [
      { validate: (v) => (typeof v === 'string' && v.length < 2 ? '等级名称至少 2 个字符' : null) },
      { validate: (v) => (typeof v === 'string' && v.length > 20 ? '等级名称不超过 20 个字符' : null) },
    ],
  },
  {
    key: 'key',
    label: '等级标识',
    required: true,
    type: 'text',
    placeholder: '例如：diamond（英文小写，用作 key）',
    helper: '系统唯一标识，创建后不可修改',
    rules: [
      { validate: (v) => (typeof v === 'string' && !/^[a-z][a-z0-9_-]{1,31}$/.test(v) ? '标识需为英文小写字母开头，2~32 字符' : null) },
    ],
  },
  {
    key: 'level',
    label: '等级序号',
    required: true,
    type: 'number',
    placeholder: '例如：1（数字越大等级越高）',
    helper: '1 = 最高等级，影响排序',
    rules: [
      { validate: (v) => (typeof v !== 'number' || v < 1 || v > 99 ? '等级序号范围为 1~99' : null) },
    ],
  },
  {
    key: 'minPoints',
    label: '最低积分门槛',
    required: true,
    type: 'number',
    placeholder: '例如：1000',
    helper: '会员累计积分达到此数值可晋升',
    rules: [
      { validate: (v) => (typeof v !== 'number' || v < 0 || v > 999999 ? '积分范围为 0~999999' : null) },
    ],
  },
  {
    key: 'maxPoints',
    label: '最高积分上限',
    required: true,
    type: 'number',
    placeholder: '例如：5000',
    helper: '会员积分超过此值可晋升下一等级',
    rules: [
      { validate: (v) => (typeof v !== 'number' || v < 0 || v > 999999 ? '积分范围为 0~999999' : null) },
    ],
  },
  {
    key: 'discountRate',
    label: '折扣率 (%)',
    required: true,
    type: 'number',
    initialValue: 100,
    placeholder: '例如：85（表示 85 折）',
    helper: '0~100 之间的整数，数值越小折扣越大',
    rules: [
      { validate: (v) => (typeof v !== 'number' || v < 0 || v > 100 ? '折扣率范围为 0~100' : null) },
    ],
  },
  {
    key: 'color',
    label: '等级颜色',
    required: true,
    type: 'select',
    options: COLOR_OPTIONS,
    placeholder: '选择等级标识色',
    helper: '显示在会员卡片和列表中的标签色',
  },
  {
    key: 'icon',
    label: '等级图标',
    required: true,
    type: 'select',
    options: ICON_OPTIONS,
    placeholder: '选择代表图标',
  },
  {
    key: 'benefits',
    label: '等级权益',
    required: true,
    type: 'select',
    options: BENEFIT_PRESETS,
    placeholder: '选择该等级会员享有的权益',
    helper: '可多选，影响会员俱乐部的特权展示',
  },
  {
    key: 'annualFee',
    label: '年费 (元)',
    required: false,
    type: 'number',
    initialValue: 0,
    placeholder: '例如：0（免费）',
    helper: '0 表示免费等级',
    rules: [
      { validate: (v) => (v === undefined || v === '' || (typeof v === 'number' && v >= 0 && v <= 999999) ? null : '年费范围为 0~999999') },
    ],
  },
  {
    key: 'renewalCondition',
    label: '续费条件',
    required: false,
    type: 'text',
    placeholder: '例如：年度消费满 3000 元自动续费',
  },
  {
    key: 'upgradeCondition',
    label: '升级条件',
    required: false,
    type: 'textarea',
    placeholder: '描述升级到该等级的条件',
    helper: '将显示在会员中心升级引导中',
  },
  {
    key: 'downgradeCondition',
    label: '降级条件',
    required: false,
    type: 'textarea',
    placeholder: '描述降级的触发条件',
  },
  {
    key: 'status',
    label: '状态',
    required: true,
    type: 'select',
    initialValue: 'active',
    options: STATUS_OPTIONS,
    placeholder: '选择启用状态',
    helper: '停用的等级不可被新会员选择',
  },
];

// ---- 页面组件 ----

export default function NewMemberTierPage() {
  const router = useRouter();
  const toast = useToast();

  const handleSubmit = async (data: Record<string, unknown>): Promise<FormPageSubmitResult> => {
    // 模拟 API 请求
    await new Promise((resolve) => setTimeout(resolve, 800));

    // 校验积分区间
    const minPts = data.minPoints as number;
    const maxPts = data.maxPoints as number;
    if (minPts >= maxPts) {
      return { data: {}, error: true, message: '请修正：最低积分必须小于最高积分' };
    }

    toast.success(`会员等级「${data.name}」创建成功！`);
    return { data: {}, message: '创建成功' };
  };

  return (
    <FormPageScaffold
      meta={{ title: '新建会员等级', description: '创建一个新的会员等级，配置积分门槛、折扣率、权益等信息' }}
      fields={FIELDS}
      onSubmit={handleSubmit}
      submitLabel="创建等级"
      backUrl="/members/tiers"
      maxWidth={720}
    />
  );
}
