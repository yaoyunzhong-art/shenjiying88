/**
 * 新建门店 — Store Create Form Page (Next.js App Router Page)
 * 角色视角: 👤运营管理员 / 📊市场管理
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

interface StoreFormData {
  name: string;
  code: string;
  marketCode: string;
  address: string;
  contactPhone: string;
  contactEmail: string;
  floorArea: string;
  description: string;
  status: string;
  riskLevel: string;
  city: string;
  brandCount: string;
  notes: string;
}

// ---- 常量 ----

const MARKET_OPTIONS = [
  { label: '中国大陆 (cn-mainland)', value: 'cn-mainland' },
  { label: '美国 (us-default)', value: 'us-default' },
  { label: '英国 (uk-default)', value: 'uk-default' },
  { label: '日本 (jp-default)', value: 'jp-default' },
  { label: '东南亚 (sea-default)', value: 'sea-default' },
];

const STATUS_OPTIONS = [
  { label: '待激活', value: 'pending' },
  { label: '运营中', value: 'active' },
  { label: '已停用', value: 'inactive' },
  { label: '已暂停', value: 'suspended' },
];

const RISK_LEVEL_OPTIONS = [
  { label: '低风险', value: 'low' },
  { label: '中风险', value: 'medium' },
  { label: '高风险', value: 'high' },
];

const PROVINCE_CITY_OPTIONS = [
  { label: '北京市', value: '北京市' },
  { label: '上海市', value: '上海市' },
  { label: '广州市', value: '广州市' },
  { label: '深圳市', value: '深圳市' },
  { label: '杭州市', value: '杭州市' },
  { label: '南京市', value: '南京市' },
  { label: '成都市', value: '成都市' },
  { label: '武汉市', value: '武汉市' },
  { label: '重庆市', value: '重庆市' },
  { label: '西安市', value: '西安市' },
  { label: '苏州市', value: '苏州市' },
];

// ---- 字段定义 ----

const FIELDS: FormPageField<Record<string, unknown>>[] = [
  {
    key: 'name',
    label: '门店名称',
    required: true,
    type: 'text',
    placeholder: '例如：朝阳大悦城旗舰店',
    rules: [
      { validate: (v) => (typeof v === 'string' && v.length < 2 ? '门店名称至少 2 个字符' : null) },
      { validate: (v) => (typeof v === 'string' && v.length > 50 ? '门店名称不超过 50 个字符' : null) },
    ],
  },
  {
    key: 'code',
    label: '门店编码',
    required: true,
    type: 'text',
    placeholder: '例如：STORE-016',
    helper: '系统唯一标识，创建后不可修改',
    rules: [
      { validate: (v) => (typeof v === 'string' && !/^STORE-\d{3,6}$/.test(v) ? '编码格式需为 STORE-XXX（3~6 位数字）' : null) },
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
    key: 'city',
    label: '所在城市',
    required: true,
    type: 'select',
    options: PROVINCE_CITY_OPTIONS,
  },
  {
    key: 'address',
    label: '门店地址',
    required: true,
    type: 'text',
    placeholder: '例如：北京市朝阳区朝阳北路101号',
    rules: [
      { validate: (v) => (typeof v === 'string' && v.length < 5 ? '地址至少 5 个字符' : null) },
    ],
  },
  {
    key: 'contactPhone',
    label: '联系电话',
    required: true,
    type: 'text',
    placeholder: '例如：+86-10-8888-1111',
    rules: [
      { validate: (v) => (typeof v === 'string' && v.length < 7 ? '联系电话至少 7 个字符' : null) },
    ],
  },
  {
    key: 'contactEmail',
    label: '联系邮箱',
    type: 'email',
    placeholder: 'store@example.com',
    rules: [
      { validate: (v) => (v && typeof v === 'string' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) ? '请输入有效的邮箱地址' : null) },
    ],
  },
  {
    key: 'floorArea',
    label: '建筑面积 (m²)',
    type: 'text',
    placeholder: '例如：8500',
    rules: [
      { validate: (v) => (v && typeof v === 'string' && !/^\d+$/.test(v) ? '建筑面积必须为数字' : null) },
      { validate: (v) => (v && typeof v === 'string' && Number(v) > 100000 ? '建筑面积不超过 100,000 m²' : null) },
    ],
  },
  {
    key: 'status',
    label: '初始状态',
    required: true,
    type: 'select',
    options: STATUS_OPTIONS,
  },
  {
    key: 'riskLevel',
    label: '风险等级',
    required: true,
    type: 'select',
    options: RISK_LEVEL_OPTIONS,
  },
  {
    key: 'description',
    label: '门店简介',
    type: 'textarea',
    placeholder: '简要描述门店定位、商圈环境和特色…',
    rules: [
      { validate: (v) => (typeof v === 'string' && v.length > 500 ? '简介不超过 500 个字符' : null) },
    ],
  },
  {
    key: 'brandCount',
    label: '入驻品牌数量',
    type: 'text',
    placeholder: '例如：5',
    rules: [
      { validate: (v) => (v && typeof v === 'string' && !/^\d+$/.test(v) ? '品牌数量必须为数字' : null) },
    ],
  },
  {
    key: 'notes',
    label: '备注',
    type: 'textarea',
    placeholder: '其他需要记录的信息…',
  },
];

// ---- 页面组件 ----

export default function StoreNewPage() {
  const router = useRouter();
  const { success } = useToast();

  const meta = useMemo(() => ({
    title: '新建门店',
    description: '创建一个新的门店，填写门店基本信息与运营配置',
  }), []);

  const handleSubmit = async (values: Record<string, unknown>): Promise<FormPageSubmitResult<Record<string, unknown>> | null> => {
    // 模拟 API 延迟
    await new Promise((resolve) => setTimeout(resolve, 1200));

    // 后端模拟校验：门店编码冲突
    if (values.code === 'STORE-999') {
      throw new Error('该门店编码已被占用，请重新输入');
    }

    return {
      data: values,
      message: '门店创建成功',
    };
  };

  const handleSuccess = (_result: FormPageSubmitResult<Record<string, unknown>>) => {
    success('门店创建成功');
    router.push('/stores');
  };

  return (
    <FormPageScaffold
      fields={FIELDS}
      meta={meta}
      onSubmit={handleSubmit}
      onSuccess={handleSuccess}
      backUrl="/stores"
      submitLabel="创建门店"
      submitVariant="primary"
    />
  );
}
