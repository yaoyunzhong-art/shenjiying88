/**
 * 创建门店页 — Store Create Page (Next.js App Router Page)
 * 功能: 门店创建表单，含字段验证、提交、成功引导
 * 类型: B-表单页 (含验证/提交/错误处理/成功引导)
 */
'use client';

import React, { useState, useCallback, useMemo, useEffect } from 'react';
import Link from 'next/link';

import {
  Card,
  Button,
  FormPageScaffold,
  type FormPageField,
} from '@m5/ui';

// ---- 类型 ----

type StoreType = 'flagship' | 'standard' | 'community' | 'popup';

interface NewStoreFormData {
  name: string;
  code: string;
  type: StoreType;
  city: string;
  district: string;
  address: string;
  phone: string;
  managerName: string;
  managerPhone: string;
  areaSqm: string;
  businessHours: string;
  description: string;
}

const STORE_TYPE_OPTIONS = [
  { label: '旗舰店', value: 'flagship' as const },
  { label: '标准店', value: 'standard' as const },
  { label: '社区店', value: 'community' as const },
  { label: '快闪店', value: 'popup' as const },
];

const CITY_OPTIONS = [
  { label: '北京市', value: '北京市' },
  { label: '上海市', value: '上海市' },
  { label: '深圳市', value: '深圳市' },
  { label: '广州市', value: '广州市' },
  { label: '成都市', value: '成都市' },
  { label: '杭州市', value: '杭州市' },
  { label: '武汉市', value: '武汉市' },
  { label: '南京市', value: '南京市' },
];

const BUSINESS_HOURS_PRESETS = [
  { label: '09:00-22:00', value: '09:00-22:00' },
  { label: '09:30-21:00', value: '09:30-21:00' },
  { label: '09:00-21:30', value: '09:00-21:30' },
  { label: '10:00-22:00', value: '10:00-22:00' },
  { label: '10:00-21:00', value: '10:00-21:00' },
  { label: '08:00-23:00', value: '08:00-23:00' },
];

// ---- 表单字段 ----

const FIELDS: FormPageField<Record<string, unknown>>[] = [
  {
    key: 'name',
    label: '门店名称',
    required: true,
    placeholder: '例如：深圳南山旗舰店',
    helper: '建议包含城市+商圈+门店类型，便于识别',
    rules: [
      { validate: (v) => (typeof v === 'string' && v.length < 2 ? '门店名称至少2个字符' : null) },
      { validate: (v) => (typeof v === 'string' && v.length > 50 ? '门店名称不超过50个字符' : null) },
    ],
  },
  {
    key: 'code',
    label: '门店编码',
    required: true,
    placeholder: '例如：SZ-NS-001',
    helper: '建议格式: 城市缩写-区域缩写-序号',
    rules: [
      { validate: (v) => (typeof v === 'string' && v.length < 3 ? '编码至少3个字符' : null) },
      { validate: (v) => (typeof v === 'string' && v.length > 20 ? '编码不超过20个字符' : null) },
      {
        validate: (v) =>
          typeof v === 'string' && !/^[A-Z0-9-]+$/.test(v)
            ? '编码只能包含大写字母、数字和连字符'
            : null,
      },
    ],
  },
  {
    key: 'type',
    label: '门店类型',
    required: true,
    type: 'select',
    placeholder: '请选择门店类型',
    options: STORE_TYPE_OPTIONS,
  },
  {
    key: 'city',
    label: '所在城市',
    required: true,
    type: 'select',
    placeholder: '请选择城市',
    options: CITY_OPTIONS,
  },
  {
    key: 'district',
    label: '所在区域',
    required: true,
    placeholder: '例如：南山区、朝阳区、浦东新区',
    rules: [
      { validate: (v) => (typeof v === 'string' && v.length < 2 ? '请填写完整的区域名称' : null) },
    ],
  },
  {
    key: 'address',
    label: '详细地址',
    required: true,
    placeholder: '街道/门牌号/商圈名',
    rules: [
      { validate: (v) => (typeof v === 'string' && v.length < 5 ? '请填写详细地址，至少5个字符' : null) },
    ],
  },
  {
    key: 'phone',
    label: '门店电话',
    required: true,
    placeholder: '例如：0755-88886666',
    rules: [
      {
        validate: (v) =>
          typeof v === 'string' && !/^0\d{2,3}-?\d{7,8}$/.test(v)
            ? '请输入有效的座机号码（如 0755-88886666）'
            : null,
      },
    ],
  },
  {
    key: 'managerName',
    label: '店长姓名',
    required: true,
    placeholder: '请输入店长姓名',
    rules: [
      { validate: (v) => (typeof v === 'string' && v.length < 2 ? '姓名至少2个字符' : null) },
    ],
  },
  {
    key: 'managerPhone',
    label: '店长电话',
    required: true,
    placeholder: '例如：13800138001',
    rules: [
      { validate: (v) => (typeof v === 'string' && !/^1[3-9]\d{9}$/.test(v) ? '请输入有效的手机号码' : null) },
    ],
  },
  {
    key: 'areaSqm',
    label: '门店面积 (㎡)',
    required: true,
    placeholder: '例如：200',
    type: 'number',
    rules: [
      { validate: (v) => (typeof v === 'string' && (isNaN(Number(v)) || Number(v) <= 0) ? '面积必须大于0' : null) },
      { validate: (v) => (typeof v === 'string' && Number(v) > 9999 ? '面积不能超过9999㎡' : null) },
    ],
  },
  {
    key: 'businessHours',
    label: '营业时间',
    required: true,
    type: 'select',
    placeholder: '请选择营业时段',
    options: BUSINESS_HOURS_PRESETS,
  },
  {
    key: 'description',
    label: '门店简介',
    type: 'textarea',
    placeholder: '描述门店的特色定位、周边商圈、目标客群等',
    helper: '非必填，建议50-200字',
  },
];

// ---- 提交后成功引导组件 ----

/**
 * SuccessGuide — 门店创建成功后的下一步引导卡片 (内部组件，不导出)
 */
function SuccessGuide({ storeName, onReset }: { storeName: string; onReset: () => void }) {
  const links = useMemo(
    () => [
      { label: '查看门店列表', href: '/stores' },
      { label: '对比门店绩效', href: '/stores/compare' },
      { label: '继续创建门店', action: onReset },
    ],
    [onReset],
  );

  return (
    <Card className="mb-6 border border-green-200 bg-green-50 p-6">
      <div className="mb-4 text-center">
        <div className="text-3xl">✅</div>
        <h3 className="mt-2 text-lg font-semibold text-green-800">门店创建成功</h3>
        <p className="mt-1 text-sm text-green-600">{storeName}</p>
      </div>
      <div className="mt-4 flex flex-wrap justify-center gap-3">
        {links.map((link) =>
          'action' in link ? (
            <Button key={link.label} variant="outline" onClick={link.action}>
              {link.label}
            </Button>
          ) : (
            <Link key={link.label} href={link.href}>
              <Button variant="outline">{link.label}</Button>
            </Link>
          ),
        )}
      </div>
    </Card>
  );
}

// ---- 主页面 ----

import { useTriState } from '../../_components/useTriState';
import { TriStateRenderer } from '../../_components/TriStateRenderer';

export default function NewStorePage() {
  const [submitting, setSubmitting] = useState(false);
  const [successData, setSuccessData] = useState<{ storeName: string } | null>(null);
  const { loading: formLoading, error: formError, setError: setFormError, wrapLoad } = useTriState();

  const handleSubmit = useCallback(
    async (values: Record<string, unknown>): Promise<{ data: Record<string, unknown>; message?: string } | null> => {
      setFormError(null);
      setSubmitting(true);

      const result = await wrapLoad(
        (async () => {
          // 模拟 API 提交
          await new Promise((resolve) => setTimeout(resolve, 1200));
          const data = values as unknown as NewStoreFormData;

          // mock 冲突检测：编码冲突
          if (data.code === 'SZ-NS-001' || data.code === 'BJ-CY-001') {
            return null;
          }

          return { data: values, message: `门店「${data.name}」创建成功！` };
        })(),
      );

      if (result) {
        setSuccessData({ storeName: (values as unknown as NewStoreFormData).name });
      } else {
        setFormError('门店编码冲突，请修改后重试');
      }

      setSubmitting(false);
      return result;
    },
    [],
  );

  const handleReset = useCallback(() => {
    setSuccessData(null);
  }, []);

  return (
    <div className="mx-auto max-w-3xl">
      <TriStateRenderer
        loading={formLoading}
        empty={false}
        error={formError}
        onRetry={() => setFormError(null)}
      >
      {successData && (
        <SuccessGuide storeName={successData.storeName} onReset={handleReset} />
      )}

      <FormPageScaffold
        meta={{
          title: '创建门店',
          description: '填写门店基本信息，完成后点击创建',
        }}
        fields={FIELDS}
        onSubmit={handleSubmit}
        submitLabel={submitting ? '提交中…' : '创建门店'}
        backUrl="/stores"
      />
      </TriStateRenderer>
    </div>
  );
}
