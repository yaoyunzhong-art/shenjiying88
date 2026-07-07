/**
 * 产品编辑页 — Product Edit Page (Next.js App Router Page)
 * 功能: 编辑产品/课程/活动/服务信息，提交保存，支持返回
 * 角色视角: 👔店长 / 🛒前台
 */
'use client';

import React from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  FormPageScaffold,
  type FormPageField,
  type FormPageSubmitResult,
} from '@m5/ui';

// ── 类型 ──

type OfferingCategory = 'class' | 'event' | 'product' | 'service';
type OfferingStatus = 'published' | 'draft' | 'archived';

interface StoreOffering {
  id: string;
  name: string;
  category: OfferingCategory;
  storeName: string;
  description: string;
  price?: string;
  scheduleHint?: string;
  status: OfferingStatus;
  createdAt: string;
}

const CATEGORY_LABELS: Record<OfferingCategory, string> = {
  class: '课程',
  event: '活动',
  product: '商品',
  service: '服务',
};

const STATUS_LABELS: Record<OfferingStatus, string> = {
  published: '已发布',
  draft: '草稿',
  archived: '已归档',
};

// ── Mock 数据 ──

const MOCK_OFFERINGS: StoreOffering[] = [
  { id: 'o1', name: '瑜伽初级课', category: 'class', storeName: 'Demo Store 旗舰店', description: '适合入门学习者，每周二四开课', price: '¥199/节', scheduleHint: '周二 18:30 / 周四 19:00', status: 'published', createdAt: '2026-06-10' },
  { id: 'o2', name: 'HIIT 高强度间歇训练', category: 'class', storeName: 'Demo Store 旗舰店', description: '快速燃脂，适合有一定基础的学员', price: '¥149/节', scheduleHint: '周三 07:00', status: 'published', createdAt: '2026-06-08' },
  { id: 'o3', name: '夏日游泳挑战赛', category: 'event', storeName: 'Demo Store 社区店', description: '门店内部游泳比赛', price: '¥50 报名费', scheduleHint: '2026-07-15 09:00', status: 'published', createdAt: '2026-06-12' },
  { id: 'o4', name: '蛋白粉（乳清）', category: 'product', storeName: 'Demo Store 旗舰店', description: '进口乳清蛋白粉', price: '¥299', status: 'published', createdAt: '2026-06-01' },
  { id: 'o5', name: '运动毛巾套装', category: 'product', storeName: 'Demo Store 社区店', description: '速干材质，门店 logo 定制款', price: '¥89', status: 'draft', createdAt: '2026-06-11' },
  { id: 'o6', name: '私教一对一', category: 'service', storeName: 'Demo Store 旗舰店', description: '定制训练计划，营养指导', price: '¥499/节', scheduleHint: '需预约', status: 'published', createdAt: '2026-05-20' },
  { id: 'o7', name: '体测评估服务', category: 'service', storeName: 'Demo Store 旗舰店', description: 'InBody 体测 + 专业解读报告', price: '¥99/次', scheduleHint: '随到随测', status: 'published', createdAt: '2026-05-15' },
  { id: 'o8', name: '青少年篮球训练营', category: 'class', storeName: 'Demo Store 社区店', description: '暑期集中训练，8-16岁', price: '¥2,999/期', scheduleHint: '7月每周一三五 14:00', status: 'draft', createdAt: '2026-06-13' },
  { id: 'o12', name: '康复理疗服务', category: 'service', storeName: 'Demo Store 社区店', description: '运动损伤的康复理疗方案', price: '¥399/次', scheduleHint: '需预约评估', status: 'archived', createdAt: '2026-04-01' },
];

function getOfferingById(id: string): StoreOffering | undefined {
  return MOCK_OFFERINGS.find((o) => o.id === id);
}

// ── 数据 store（模拟持久化） ──

/** 全局运行时 mock store，使编辑在会话内持久 */
const runtimeStore = new Map<string, StoreOffering>();

function getStoreValue(id: string): StoreOffering | undefined {
  const original = getOfferingById(id);
  if (!original) return undefined;
  if (runtimeStore.has(id)) return runtimeStore.get(id);
  runtimeStore.set(id, { ...original });
  return runtimeStore.get(id);
}

function updateStoreValue(id: string, patch: Partial<StoreOffering>): StoreOffering {
  const existing = getStoreValue(id) ?? getOfferingById(id);
  if (!existing) throw new Error(`Offering ${id} not found`);
  const updated = { ...existing, ...patch };
  runtimeStore.set(id, updated);
  return updated;
}

// ── 页面 ──

export default function ProductEditPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const offering = getStoreValue(params.id);

  if (!offering) {
    return (
      <div style={{ textAlign: 'center', padding: 64, color: '#64748b' }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>🔍</div>
        <h2 style={{ fontSize: 20, fontWeight: 600, color: '#e2e8f0', marginBottom: 8 }}>
          产品未找到
        </h2>
        <p style={{ fontSize: 14, marginBottom: 24 }}>
          未找到 ID 为 &ldquo;{params.id}&rdquo; 的产品，可能已被删除。
        </p>
        <button
          onClick={() => router.push('/products')}
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
          返回产品列表
        </button>
      </div>
    );
  }

  const fields: FormPageField[] = [
    {
      key: 'name',
      label: '名称',
      required: true,
      placeholder: '产品 / 课程 / 活动名称',
      initialValue: offering.name,
    },
    {
      key: 'category',
      label: '分类',
      type: 'select',
      required: true,
      initialValue: offering.category,
      options: [
        { label: '课程', value: 'class' },
        { label: '活动', value: 'event' },
        { label: '商品', value: 'product' },
        { label: '服务', value: 'service' },
      ],
    },
    {
      key: 'description',
      label: '描述',
      type: 'textarea',
      required: true,
      placeholder: '详细描述产品/服务内容',
      initialValue: offering.description,
    },
    {
      key: 'price',
      label: '价格',
      placeholder: '例如 ¥199/节',
      initialValue: offering.price ?? '',
      helper: '输入带货币符号的价格文本，如 ¥199/节',
    },
    {
      key: 'scheduleHint',
      label: '时间安排',
      placeholder: '例如 周二 18:30 / 周四 19:00',
      initialValue: offering.scheduleHint ?? '',
      helper: '课程/活动的时间安排提示',
    },
    {
      key: 'storeName',
      label: '所属门店',
      placeholder: '门店名称',
      initialValue: offering.storeName,
    },
    {
      key: 'status',
      label: '状态',
      type: 'select',
      required: true,
      initialValue: offering.status,
      options: [
        { label: STATUS_LABELS.published, value: 'published' },
        { label: STATUS_LABELS.draft, value: 'draft' },
        { label: STATUS_LABELS.archived, value: 'archived' },
      ],
    },
  ];

  const handleSubmit = async (data: Record<string, unknown>): Promise<FormPageSubmitResult | null> => {
    try {
      updateStoreValue(params.id, data as Partial<StoreOffering>);
      return { data, message: `产品「${data.name}」更新成功` };
    } catch {
      return null;
    }
  };

  const handleSuccess = () => {
    router.push(`/products/${params.id}`);
  };

  const handleDelete = async () => {
    runtimeStore.delete(params.id);
    router.push('/products');
  };

  const categoryLabel = CATEGORY_LABELS[offering.category];

  return (
    <FormPageScaffold
      meta={{
        title: `编辑产品: ${offering.name}`,
        description: `${categoryLabel} · ${offering.storeName} · ID: ${offering.id}`,
        deleteAction: {
          label: '删除产品',
          onDelete: handleDelete,
          confirmText: `确定要删除「${offering.name}」吗？此操作不可撤销。`,
        },
      }}
      fields={fields}
      onSubmit={handleSubmit}
      onSuccess={handleSuccess}
      backUrl={`/products/${params.id}`}
      submitLabel="保存修改"
    />
  );
}
