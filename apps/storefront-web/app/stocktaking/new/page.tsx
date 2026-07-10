/**
 * 新建盘点单 — Stocktaking Create Form Page (Next.js App Router Page)
 * 角色视角: 👔店长 / 🔧仓管
 * 功能: 选择门店、盘点区域、商品范围，填写盘点说明，提交后进入盘点状态
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

// ---- 常量 ----

const STORE_OPTIONS = [
  { label: '朝阳旗舰店', value: 'cy-flagship' },
  { label: '海淀分店', value: 'hd-branch' },
  { label: '西单体验店', value: 'xd-experience' },
  { label: '望京分店', value: 'wj-branch' },
  { label: '通州万达店', value: 'tz-wanda' },
];

const ZONE_OPTIONS = [
  { label: '全店盘点', value: 'all' },
  { label: '护肤区', value: 'skincare' },
  { label: '彩妆区', value: 'cosmetics' },
  { label: '香水区', value: 'fragrance' },
  { label: '日化区', value: 'daily' },
  { label: '仓库', value: 'warehouse' },
];

const PRIORITY_OPTIONS = [
  { label: '常规盘点', value: 'normal' },
  { label: '重点盘点', value: 'important' },
  { label: '紧急盘点', value: 'urgent' },
];

const SCOPE_OPTIONS = [
  { label: '全品类', value: 'all' },
  { label: '仅高价值商品', value: 'high_value' },
  { label: '仅临期商品', value: 'near_expiry' },
  { label: '仅库存差异商品', value: 'discrepancy_only' },
  { label: '指定分类', value: 'custom_category' },
];

// ---- 字段定义 ----

const FIELDS: FormPageField<Record<string, unknown>>[] = [
  {
    key: 'storeId',
    label: '盘点门店',
    required: true,
    type: 'select',
    options: STORE_OPTIONS,
    placeholder: '请选择需要盘点的门店',
    rules: [
      {
        validate: (v) => (!v || v === '' ? '请选择盘点门店' : null),
      },
    ],
  },
  {
    key: 'zone',
    label: '盘点区域',
    required: true,
    type: 'select',
    options: ZONE_OPTIONS,
    placeholder: '请选择盘点区域',
    rules: [
      {
        validate: (v) => (!v || v === '' ? '请选择盘点区域' : null),
      },
    ],
  },
  {
    key: 'scope',
    label: '盘点范围',
    required: true,
    type: 'select',
    options: SCOPE_OPTIONS,
    placeholder: '请选择盘点范围',
    rules: [
      {
        validate: (v) => (!v || v === '' ? '请选择盘点范围' : null),
      },
    ],
  },
  {
    key: 'priority',
    label: '盘点优先级',
    required: true,
    type: 'select',
    options: PRIORITY_OPTIONS,
    placeholder: '请选择优先级',
    helper: '紧急盘点将立即通知相关人员进行操作',
    rules: [
      {
        validate: (v) => (!v || v === '' ? '请选择盘点优先级' : null),
      },
    ],
  },
  {
    key: 'initiatorName',
    label: '盘点负责人',
    required: true,
    placeholder: '例如：张三',
    helper: '实际执行盘点的员工姓名',
    rules: [
      {
        validate: (v) => {
          if (!v || v === '') return '盘点负责人不能为空';
          return typeof v === 'string' && v.trim().length < 2
            ? '负责人姓名至少2个字符'
            : null;
        },
      },
      {
        validate: (v) =>
          typeof v === 'string' && v.trim().length > 20
            ? '负责人姓名不超过20个字符'
            : null,
      },
    ],
  },
  {
    key: 'phone',
    label: '联系方式',
    required: true,
    placeholder: '例如：13800138001',
    helper: '盘点期间的紧急联系方式',
    rules: [
      {
        validate: (v) => {
          if (!v || v === '') return '联系方式不能为空';
          const phone = (v as string).trim();
          return !/^1[3-9]\d{9}$/.test(phone) ? '请输入有效的11位手机号' : null;
        },
      },
    ],
  },
  {
    key: 'plannedDate',
    label: '计划盘点日期',
    required: true,
    type: 'date',
    placeholder: '请选择日期',
    helper: '建议在工作日进行盘点',
    rules: [
      {
        validate: (v) => {
          if (!v || v === '') return '请选择计划盘点日期';
          const d = new Date(v as string);
          return isNaN(d.getTime()) ? '日期格式无效' : null;
        },
      },
    ],
  },
  {
    key: 'estimatedDuration',
    label: '预计耗时 (小时)',
    required: true,
    type: 'number',
    placeholder: '例如：4',
    helper: '根据盘点范围和商品数量估算',
    rules: [
      {
        validate: (v) => {
          const n = Number(v);
          return Number.isNaN(n) || n <= 0 ? '预计耗时必须大于0' : null;
        },
      },
      {
        validate: (v) => {
          const n = Number(v);
          return !Number.isNaN(n) && n > 48 ? '预计耗时不能超过48小时' : null;
        },
      },
    ],
  },
  {
    key: 'remarks',
    label: '盘点说明',
    required: false,
    placeholder: '填写盘点原因、特殊注意事项、或其他备注信息',
    rules: [
      {
        validate: (v) =>
          v && typeof v === 'string' && v.length > 500
            ? '盘点说明不超过500个字符'
            : null,
      },
    ],
  },
];

// ---- 组件 ----

export default function NewStocktakingPage(): React.ReactElement {
  const router = useRouter();
  const toast = useToast();

  const handleSubmit = async (
    data: Record<string, unknown>,
  ): Promise<FormPageSubmitResult | null> => {
    // 模拟提交延迟
    await new Promise((r) => setTimeout(r, 600));

    // 模拟随机网络异常（用于测试错误处理）
    if (Math.random() < 0.03) {
      throw new Error('网络异常，盘点单创建失败，请稍后重试');
    }

    // 根据门店和日期生成批次号
    const storeMap: Record<string, string> = {
      'cy-flagship': 'CY',
      'hd-branch': 'HD',
      'xd-experience': 'XD',
      'wj-branch': 'WJ',
      'tz-wanda': 'TZ',
    };
    const storeCode = storeMap[(data.storeId as string)] ?? 'XX';
    const dateStr = (data.plannedDate as string).replace(/-/g, '');
    const seq = Math.floor(Math.random() * 99) + 1;
    const batchNo = `PD-${dateStr}-${storeCode}-${String(seq).padStart(2, '0')}`;

    toast.success(`盘点单 ${batchNo} 创建成功`);
    router.push('/stocktaking');
    return { data, message: `盘点单 ${batchNo} 创建成功，待盘点` };
  };

  return (
    <FormPageScaffold
      meta={{
        title: '新建盘点单',
        description:
          '创建新的库存盘点任务，选择门店、区域和范围，设置盘点人员和计划日期，提交后即可开始实盘操作。',
      }}
      fields={FIELDS}
      onSubmit={handleSubmit}
      backUrl="/stocktaking"
      submitLabel="创建盘点单"
      submitVariant="brand"
    />
  );
}
