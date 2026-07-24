/**
 * 新建品牌 — Brand Create Form Page (Next.js App Router Page)
 * 角色视角: 👤运营管理员 / 📊市场管理
 * 功能: 表单验证、提交、错误处理、品牌类型分类
 */
'use client';

import React, { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';

import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'New - 神机营' }


import {
  FormPageScaffold,
  useToast,
  type FormPageField,
  type FormPageSubmitResult,
} from '@m5/ui';

// ---- 类型 ----

interface BrandFormData {
  name: string;
  code: string;
  brandType: string;
  marketCode: string;
  tier: string;
  category: string;
  description: string;
  contactEmail: string;
  contactPhone: string;
  headquarterCity: string;
  headquarterProvince: string;
  website: string;
  notes: string;
  // 品牌类型扩展字段
  operationsEntity?: string;
  coBrandPartner?: string;
  coBrandRatio?: string;
  licensor?: string;
  licensePeriod?: string;
}

type BrandType = 'self-operated' | 'co-branded' | 'agency' | 'other';

// ---- 常量 ----

const BRAND_TYPE_OPTIONS: { label: string; value: BrandType; hint: string }[] = [
  { label: '自营', value: 'self-operated', hint: '品牌由运营方直接经营' },
  { label: '联名', value: 'co-branded', hint: '需填写联名方信息与分成比例' },
  { label: '代理', value: 'agency', hint: '需填写授权方与授权期限' },
  { label: '其他', value: 'other', hint: '无需额外信息' },
];

const BRAND_TYPE_STYLE: Record<BrandType, { bg: string; color: string }> = {
  'self-operated': { bg: '#e8f5e9', color: '#2e7d32' },
  'co-branded': { bg: '#e3f2fd', color: '#1565c0' },
  'agency': { bg: '#fff3e0', color: '#e65100' },
  'other': { bg: '#f3e5f5', color: '#6a1b9a' },
};

const MARKET_OPTIONS = [
  { label: '中国大陆 (cn-mainland)', value: 'cn-mainland' },
  { label: '美国 (us-default)', value: 'us-default' },
  { label: '英国 (uk-default)', value: 'uk-default' },
  { label: '日本 (jp-default)', value: 'jp-default' },
  { label: '东南亚 (sea-default)', value: 'sea-default' },
];

const TIER_OPTIONS = [
  { label: '旗舰', value: 'premium' },
  { label: '标准', value: 'standard' },
  { label: '基础', value: 'basic' },
];

const CATEGORY_OPTIONS = [
  { label: '综合商业', value: '综合商业' },
  { label: '零售租赁', value: '零售租赁' },
  { label: '生活方式', value: '生活方式' },
  { label: '体验空间', value: '体验空间' },
  { label: '数字互动', value: '数字互动' },
  { label: '有机产品', value: '有机产品' },
  { label: '可持续空间', value: '可持续空间' },
];

const PROVINCE_OPTIONS = [
  { label: '北京市', value: '北京市' },
  { label: '上海市', value: '上海市' },
  { label: '广东省', value: '广东省' },
  { label: '浙江省', value: '浙江省' },
  { label: '江苏省', value: '江苏省' },
  { label: '四川省', value: '四川省' },
  { label: '湖北省', value: '湖北省' },
  { label: '湖南省', value: '湖南省' },
  { label: '福建省', value: '福建省' },
  { label: '山东省', value: '山东省' },
];

// ---- 品牌类型扩展字段 ----

function getBrandTypeExtraFields(type: BrandType): FormPageField<Record<string, unknown>>[] {
  switch (type) {
    case 'self-operated':
      return [
        {
          key: 'operationsEntity',
          label: '运营主体',
          required: true,
          type: 'text',
          placeholder: '例如：M5 集团自营部',
          helper: '负责该品牌日常运营的实体部门',
          rules: [
            { validate: (v) => (typeof v === 'string' && v.length < 2 ? '运营主体至少 2 个字符' : null) },
          ],
        },
      ];
    case 'co-branded':
      return [
        {
          key: 'coBrandPartner',
          label: '联名方',
          required: true,
          type: 'text',
          placeholder: '例如：XX 联名品牌',
          helper: '合作联名的品牌方名称',
          rules: [
            { validate: (v) => (typeof v === 'string' && v.length < 2 ? '联名方至少 2 个字符' : null) },
          ],
        },
        {
          key: 'coBrandRatio',
          label: '联名比例',
          type: 'text',
          placeholder: '例如：50:50',
          helper: '双方分成比例（选填）',
        },
      ];
    case 'agency':
      return [
        {
          key: 'licensor',
          label: '授权方',
          required: true,
          type: 'text',
          placeholder: '例如：XX 品牌授权方',
          helper: '品牌授权的来源方',
          rules: [
            { validate: (v) => (typeof v === 'string' && v.length < 2 ? '授权方至少 2 个字符' : null) },
          ],
        },
        {
          key: 'licensePeriod',
          label: '授权期限',
          type: 'text',
          placeholder: '例如：2026-01-01 ~ 2027-12-31',
          helper: '品牌授权有效期（选填）',
        },
      ];
    default: // 'other'
      return [];
  }
}

// ---- 基础字段定义 ----

const BASE_FIELDS: FormPageField<Record<string, unknown>>[] = [
  {
    key: 'name',
    label: '品牌名称',
    required: true,
    type: 'text',
    placeholder: '例如：M5 Premium 旗舰品牌',
    rules: [
      { validate: (v) => (typeof v === 'string' && v.length < 2 ? '品牌名称至少 2 个字符' : null) },
      { validate: (v) => (typeof v === 'string' && v.length > 50 ? '品牌名称不超过 50 个字符' : null) },
    ],
  },
  {
    key: 'code',
    label: '品牌编码',
    required: true,
    type: 'text',
    placeholder: '例如：BRAND-013',
    helper: '系统唯一标识，创建后不可修改',
    rules: [
      { validate: (v) => (typeof v === 'string' && !/^BRAND-\d{3,6}$/.test(v) ? '编码格式需为 BRAND-XXX（3~6 位数字）' : null) },
    ],
  },
  {
    key: 'marketCode',
    label: '所属市场',
    required: true,
    type: 'select',
    options: MARKET_OPTIONS,
    rules: [
      { validate: (v) => (!v || v === '' ? '请选择所属市场' : null) },
    ],
  },
  {
    key: 'tier',
    label: '品牌等级',
    required: true,
    type: 'select',
    options: TIER_OPTIONS,
    helper: '旗舰=最高等级，享受运营支持倾斜',
  },
  {
    key: 'category',
    label: '品牌类别',
    required: true,
    type: 'select',
    options: CATEGORY_OPTIONS,
  },
  {
    key: 'description',
    label: '品牌简介',
    type: 'textarea',
    placeholder: '简要描述品牌定位、核心价值和特色…',
    rules: [
      { validate: (v) => (typeof v === 'string' && v.length > 500 ? '简介不超过 500 个字符' : null) },
    ],
  },
  {
    key: 'contactEmail',
    label: '联系邮箱',
    type: 'email',
    placeholder: 'brand@example.com',
    rules: [
      { validate: (v) => (v && typeof v === 'string' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) ? '请输入有效的邮箱地址' : null) },
    ],
  },
  {
    key: 'contactPhone',
    label: '联系电话',
    type: 'text',
    placeholder: '021-6888-8888',
  },
  {
    key: 'headquarterProvince',
    label: '总部省份',
    type: 'select',
    options: PROVINCE_OPTIONS,
  },
  {
    key: 'headquarterCity',
    label: '总部城市',
    type: 'text',
    placeholder: '例如：上海',
  },
  {
    key: 'website',
    label: '品牌官网',
    type: 'text',
    placeholder: 'https://brand.example.com',
    rules: [
      { validate: (v) => (v && typeof v === 'string' && !/^https?:\/\/.+/.test(v) ? '请输入有效的网址（以 http:// 或 https:// 开头）' : null) },
    ],
  },
  {
    key: 'notes',
    label: '备注',
    type: 'textarea',
    placeholder: '其他需要记录的信息…',
  },
];

// ---- 品牌类型标签组件 ----

function BrandTypeTags({
  value,
  onChange,
}: {
  value: BrandType;
  onChange: (type: BrandType) => void;
}) {
  return (
    <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', flexWrap: 'wrap' }} data-testid="brand-type-tags">
      {BRAND_TYPE_OPTIONS.map((opt) => {
        const isActive = value === opt.value;
        const style = BRAND_TYPE_STYLE[opt.value];
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            data-testid={`brand-type-tag-${opt.value}`}
            data-active={isActive ? 'true' : 'false'}
            style={{
              padding: '8px 16px',
              borderRadius: '20px',
              border: isActive ? `2px solid ${style.color}` : '1px solid #ddd',
              backgroundColor: isActive ? style.bg : '#fff',
              color: isActive ? style.color : '#666',
              cursor: 'pointer',
              fontWeight: isActive ? 600 : 400,
              fontSize: '14px',
              transition: 'all 0.2s',
            }}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}

// ---- 页面组件 ----

export default function BrandNewPage() {
  const router = useRouter();
  const { success } = useToast();
  const [brandType, setBrandType] = useState<BrandType>('self-operated');

  const meta = useMemo(() => ({
    title: '新建品牌',
    description: '创建一个新的品牌，填写品牌基本信息与运营配置',
  }), []);

  const fields = useMemo<FormPageField<Record<string, unknown>>[]>(() => {
    const extra = getBrandTypeExtraFields(brandType);
    return [...BASE_FIELDS, ...extra];
  }, [brandType]);

  const handleSubmit = async (values: Record<string, unknown>): Promise<FormPageSubmitResult<Record<string, unknown>> | null> => {
    // 模拟 API 延迟
    await new Promise((resolve) => setTimeout(resolve, 1200));

    // 后端模拟校验：品牌编码冲突
    if (values.code === 'BRAND-999') {
      throw new Error('该品牌编码已被占用，请重新输入');
    }

    return {
      data: values,
      message: '品牌创建成功',
    };
  };

  const handleSuccess = (_result: FormPageSubmitResult<Record<string, unknown>>) => {
    success('品牌创建成功');
    router.push('/brands');
  };

  return (
    <div data-testid="brand-new-page">
      <BrandTypeTags value={brandType} onChange={setBrandType} />
      <FormPageScaffold
        fields={fields}
        meta={meta}
        onSubmit={handleSubmit}
        onSuccess={handleSuccess}
        backUrl="/brands"
        submitLabel="创建品牌"
        submitVariant="primary"
      />
    </div>
  );
}
