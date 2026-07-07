/**
 * 门店编辑页 — Store Edit Page (Next.js App Router Page)
 * 角色视角: 👔区域经理 / 👨‍💼运营
 * 功能: 编辑门店基本信息、经营参数、状态调整
 * 类型: B-表单页 (含验证/提交/错误处理)
 */
'use client';

import React from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  FormPageScaffold,
  type FormPageField,
  type FormPageSubmitResult,
} from '@m5/ui';

// ---- 类型 ----

type StoreStatus = 'active' | 'inactive' | 'maintenance';
type StoreType = 'flagship' | 'standard' | 'community' | 'popup';

interface Store {
  id: string;
  name: string;
  code: string;
  type: StoreType;
  address: string;
  city: string;
  district: string;
  phone: string;
  managerName: string;
  managerPhone: string;
  status: StoreStatus;
  staffCount: number;
  areaSqm: number;
  monthlyRevenue: number;
  monthlyTarget: number;
  monthlyOrders: number;
  openingDate: string;
  businessHours: string;
  description: string;
  createdAt: string;
  updatedAt: string;
}

const STATUS_LABELS: Record<StoreStatus, string> = {
  active: '营业中',
  inactive: '已停业',
  maintenance: '维护中',
};

const TYPE_LABELS: Record<StoreType, string> = {
  flagship: '旗舰店',
  standard: '标准店',
  community: '社区店',
  popup: '快闪店',
};

// ---- Mock 数据 ----

const MOCK_STORES: Record<string, Store> = {
  's-001': {
    id: 's-001',
    name: '深圳南山旗舰店',
    code: 'SZ-NS-001',
    type: 'flagship',
    address: '深圳市南山区科技南路18号',
    city: '深圳市',
    district: '南山区',
    phone: '0755-88886666',
    managerName: '张伟强',
    managerPhone: '13800138001',
    status: 'active',
    staffCount: 18,
    areaSqm: 580,
    monthlyRevenue: 1850000,
    monthlyTarget: 2000000,
    monthlyOrders: 420,
    openingDate: '2021-03-15',
    businessHours: '09:00-22:00',
    description: '深圳南山旗舰店为品牌在华南地区最大的形象店',
    createdAt: '2021-03-01T08:00:00Z',
    updatedAt: '2026-06-28T14:30:00Z',
  },
  's-002': {
    id: 's-002',
    name: '北京朝阳标准店',
    code: 'BJ-CY-001',
    type: 'standard',
    address: '北京市朝阳区建国路88号',
    city: '北京市',
    district: '朝阳区',
    phone: '010-88889999',
    managerName: '刘建国',
    managerPhone: '13900139001',
    status: 'active',
    staffCount: 10,
    areaSqm: 320,
    monthlyRevenue: 980000,
    monthlyTarget: 1000000,
    monthlyOrders: 260,
    openingDate: '2022-06-01',
    businessHours: '10:00-21:30',
    description: '北京朝阳标准店位于CBD核心区域',
    createdAt: '2022-05-20T08:00:00Z',
    updatedAt: '2026-06-27T10:15:00Z',
  },
  's-003': {
    id: 's-003',
    name: '上海浦东社区店',
    code: 'SH-PD-001',
    type: 'community',
    address: '上海市浦东新区张杨路500号',
    city: '上海市',
    district: '浦东新区',
    phone: '021-66667777',
    managerName: '周明',
    managerPhone: '13700137001',
    status: 'maintenance',
    staffCount: 5,
    areaSqm: 150,
    monthlyRevenue: 350000,
    monthlyTarget: 400000,
    monthlyOrders: 95,
    openingDate: '2023-09-10',
    businessHours: '09:30-21:00',
    description: '上海浦东社区店服务于周边住宅小区居民',
    createdAt: '2023-09-01T08:00:00Z',
    updatedAt: '2026-06-26T09:00:00Z',
  },
};

/** 运行时 mock store，使编辑在会话内持久 */
const runtimeStore = new Map<string, Store>();

function getStoreValue(id: string): Store | undefined {
  if (runtimeStore.has(id)) return runtimeStore.get(id);
  const original = MOCK_STORES[id];
  if (!original) return undefined;
  const clone = { ...original };
  runtimeStore.set(id, clone);
  return clone;
}

function updateStoreValue(id: string, patch: Partial<Store>): Store {
  const existing = runtimeStore.get(id) ?? MOCK_STORES[id];
  if (!existing) throw new Error(`Store ${id} not found`);
  const updated = { ...existing, ...patch, updatedAt: new Date().toISOString() };
  runtimeStore.set(id, updated);
  return updated;
}

// ---- 页面 ----

export default function StoreEditPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const store = getStoreValue(params.id);

  if (!store) {
    return (
      <div style={{ textAlign: 'center', padding: 64, color: '#64748b' }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>🏪</div>
        <h2 style={{ fontSize: 20, fontWeight: 600, color: '#e2e8f0', marginBottom: 8 }}>
          门店未找到
        </h2>
        <p style={{ fontSize: 14, marginBottom: 24 }}>
          未找到 ID 为 &ldquo;{params.id}&rdquo; 的门店，可能已被删除。
        </p>
        <button
          onClick={() => router.push('/stores')}
          style={{
            padding: '8px 20px',
            borderRadius: 8,
            border: '1px solid rgba(99,102,241,0.4)',
            background: 'rgba(99,102,241,0.12)',
            color: '#a5b4fc',
            cursor: 'pointer',
            fontSize: 13,
          }}
        >
          返回门店列表
        </button>
      </div>
    );
  }

  const fields: FormPageField[] = [
    {
      key: 'name',
      label: '门店名称',
      required: true,
      placeholder: '门店名称',
      initialValue: store.name,
    },
    {
      key: 'code',
      label: '门店编码',
      required: true,
      placeholder: '如 SZ-NS-001',
      initialValue: store.code,
    },
    {
      key: 'type',
      label: '门店类型',
      type: 'select',
      required: true,
      initialValue: store.type,
      options: [
        { label: TYPE_LABELS.flagship, value: 'flagship' },
        { label: TYPE_LABELS.standard, value: 'standard' },
        { label: TYPE_LABELS.community, value: 'community' },
        { label: TYPE_LABELS.popup, value: 'popup' },
      ],
    },
    {
      key: 'city',
      label: '所在城市',
      required: true,
      placeholder: '如 深圳市',
      initialValue: store.city,
    },
    {
      key: 'district',
      label: '所在区域',
      required: true,
      placeholder: '如 南山区',
      initialValue: store.district,
    },
    {
      key: 'address',
      label: '详细地址',
      type: 'textarea',
      required: true,
      placeholder: '门店详细地址',
      initialValue: store.address,
    },
    {
      key: 'phone',
      label: '联系电话',
      placeholder: '如 0755-88886666',
      initialValue: store.phone,
    },
    {
      key: 'managerName',
      label: '店长姓名',
      required: true,
      placeholder: '店长姓名',
      initialValue: store.managerName,
    },
    {
      key: 'managerPhone',
      label: '店长电话',
      placeholder: '店长联系电话',
      initialValue: store.managerPhone,
    },
    {
      key: 'businessHours',
      label: '营业时间',
      placeholder: '如 09:00-22:00',
      initialValue: store.businessHours,
    },
    {
      key: 'areaSqm',
      label: '面积 (㎡)',
      type: 'number',
      placeholder: '门店面积（平方米）',
      initialValue: store.areaSqm,
    },
    {
      key: 'openingDate',
      label: '开业日期',
      type: 'date',
      placeholder: '如 2021-03-15',
      initialValue: store.openingDate,
    },
    {
      key: 'status',
      label: '门店状态',
      type: 'select',
      required: true,
      initialValue: store.status,
      options: [
        { label: STATUS_LABELS.active, value: 'active' },
        { label: STATUS_LABELS.inactive, value: 'inactive' },
        { label: STATUS_LABELS.maintenance, value: 'maintenance' },
      ],
    },
    {
      key: 'description',
      label: '门店简介',
      type: 'textarea',
      placeholder: '门店描述信息',
      initialValue: store.description,
      helper: '简要描述门店定位和特色',
    },
  ];

  const handleSubmit = async (data: Record<string, unknown>): Promise<FormPageSubmitResult | null> => {
    try {
      const rawArea = data.areaSqm;
      const parsedAreaSqm: number | undefined =
        rawArea === undefined || rawArea === null || rawArea === ''
          ? undefined
          : typeof rawArea === 'string'
            ? Number(rawArea)
            : (rawArea as number);
      const patch: Partial<Store> = {
        ...(data as unknown as Partial<Store>),
        areaSqm: parsedAreaSqm,
      };
      updateStoreValue(params.id, patch);
      return { data, message: `门店「${data.name}」更新成功` };
    } catch {
      return null;
    }
  };

  const handleSuccess = () => {
    router.push(`/stores/${params.id}`);
  };

  const handleDelete = async () => {
    runtimeStore.delete(params.id);
    router.push('/stores');
  };

  const typeLabel = TYPE_LABELS[store.type];

  return (
    <FormPageScaffold
      meta={{
        title: `编辑门店: ${store.name}`,
        description: `${typeLabel} · ${store.city}${store.district} · ID: ${store.id}`,
        deleteAction: {
          label: '删除门店',
          onDelete: handleDelete,
          confirmText: `确定要删除「${store.name}」吗？此操作不可撤销。`,
        },
      }}
      fields={fields}
      onSubmit={handleSubmit}
      onSuccess={handleSuccess}
      backUrl={`/stores/${params.id}`}
      submitLabel="保存修改"
    />
  );
}
