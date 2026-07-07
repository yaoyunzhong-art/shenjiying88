/**
 * 促销活动编辑页 — Promotion Edit Page (Next.js App Router Page)
 * 功能: 编辑促销活动信息，支持状态/类型/预算/时间等字段修改，提交保存后返回详情页
 * 角色视角: 👔店长 / 📊运营
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

type PromotionType = 'discount' | 'coupon' | 'gift' | 'flash-sale';

interface Promotion {
  id: string;
  title: string;
  type: PromotionType;
  status: 'draft' | 'active' | 'paused' | 'ended';
  storeName: string;
  storeId: string;
  startDate: string;
  endDate: string;
  budget: number;
  usageCount: number;
  usageLimit: number;
  description: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

const TYPE_LABELS: Record<PromotionType, string> = {
  discount: '折扣',
  coupon: '优惠券',
  gift: '赠品',
  'flash-sale': '秒杀',
};

const STATUS_LABELS: { draft: string; active: string; paused: string; ended: string } = {
  draft: '草稿',
  active: '进行中',
  paused: '已暂停',
  ended: '已结束',
};

// ── Mock 数据 ──

const MOCK_PROMOTIONS: Promotion[] = [
  { id: 'promo-1', title: '夏日清凉大促', type: 'discount', status: 'active', storeName: '旗舰店', storeId: 'store-1', startDate: '2026-06-20', endDate: '2026-07-20', budget: 50000, usageCount: 187, usageLimit: 500, description: '全场商品8折起，覆盖夏季新品和经典热销款。', createdBy: '张店长', createdAt: '2026-06-15', updatedAt: '2026-06-19' },
  { id: 'promo-2', title: '会员专属折扣', type: 'discount', status: 'active', storeName: '旗舰店', storeId: 'store-1', startDate: '2026-06-01', endDate: '2026-08-31', budget: 120000, usageCount: 943, usageLimit: 2000, description: '钻石会员享7折，黄金会员享8折，银卡会员享9折。', createdBy: '张店长', createdAt: '2026-05-25', updatedAt: '2026-05-30' },
  { id: 'promo-3', title: '满减优惠券', type: 'coupon', status: 'active', storeName: '南山分店', storeId: 'store-2', startDate: '2026-06-15', endDate: '2026-07-15', budget: 30000, usageCount: 56, usageLimit: 300, description: '领券满300减50，满500减100。', createdBy: '李经理', createdAt: '2026-06-10', updatedAt: '2026-06-14' },
  { id: 'promo-4', title: '买一送一活动', type: 'gift', status: 'paused', storeName: '福田分店', storeId: 'store-3', startDate: '2026-06-10', endDate: '2026-07-10', budget: 20000, usageCount: 234, usageLimit: 500, description: '指定饮品买一送一。', createdBy: '王主管', createdAt: '2026-06-05', updatedAt: '2026-06-18' },
  { id: 'promo-5', title: '双倍积分活动', type: 'coupon', status: 'ended', storeName: '旗舰店', storeId: 'store-1', startDate: '2026-05-01', endDate: '2026-05-31', budget: 15000, usageCount: 567, usageLimit: 1000, description: '活动期间消费享双倍积分。', createdBy: '张店长', createdAt: '2026-04-25', updatedAt: '2026-06-01' },
  { id: 'promo-6', title: '新品首发特价', type: 'flash-sale', status: 'draft', storeName: '宝安店', storeId: 'store-4', startDate: '2026-07-01', endDate: '2026-07-03', budget: 80000, usageCount: 0, usageLimit: 300, description: '新品限量首发！前300名下单享5折特惠。', createdBy: '赵专员', createdAt: '2026-06-20', updatedAt: '2026-06-20' },
  { id: 'promo-7', title: '周年庆回馈', type: 'discount', status: 'draft', storeName: '社区店', storeId: 'store-5', startDate: '2026-07-10', endDate: '2026-07-20', budget: 60000, usageCount: 0, usageLimit: 800, description: '门店周年庆全场7折，会员额外9折。', createdBy: '陈店长', createdAt: '2026-06-22', updatedAt: '2026-06-22' },
];

// ── Runtime store（模拟持久化） ──

const runtimeStore = new Map<string, Promotion>();

function getStoreValue(id: string): Promotion | undefined {
  const original = MOCK_PROMOTIONS.find((p) => p.id === id);
  if (!original) return undefined;
  if (runtimeStore.has(id)) return { ...runtimeStore.get(id) as Promotion };
  runtimeStore.set(id, { ...original });
  return runtimeStore.get(id) as Promotion;
}

function updateStoreValue(id: string, patch: Partial<Promotion>): Promotion {
  const existing = getStoreValue(id);
  if (!existing) throw new Error(`Promotion ${id} not found`);
  const updated: Promotion = {
    ...existing,
    ...patch,
    updatedAt: new Date().toISOString().slice(0, 10),
  };
  runtimeStore.set(id, updated);
  return updated;
}

// ── 页面 ──

export default function PromotionEditPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const promotion = getStoreValue(params.id);

  if (!promotion) {
    return (
      <div style={{ textAlign: 'center', padding: 64, color: '#64748b' }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>🔍</div>
        <h2 style={{ fontSize: 20, fontWeight: 600, color: '#e2e8f0', marginBottom: 8 }}>
          活动未找到
        </h2>
        <p style={{ fontSize: 14, marginBottom: 24 }}>
          未找到 ID 为 &ldquo;{params.id}&rdquo; 的活动，可能已被删除。
        </p>
        <button
          onClick={() => router.push('/promotions')}
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
          返回活动列表
        </button>
      </div>
    );
  }

  const fields: FormPageField[] = [
    {
      key: 'title',
      label: '活动标题',
      required: true,
      placeholder: '促销活动名称',
      initialValue: promotion.title,
    },
    {
      key: 'type',
      label: '活动类型',
      type: 'select',
      required: true,
      initialValue: promotion.type as string,
      options: [
        { label: '折扣', value: 'discount' },
        { label: '优惠券', value: 'coupon' },
        { label: '赠品', value: 'gift' },
        { label: '秒杀', value: 'flash-sale' },
      ],
    },
    {
      key: 'description',
      label: '活动描述',
      type: 'textarea',
      required: true,
      placeholder: '详细描述活动内容和规则',
      initialValue: promotion.description,
    },
    {
      key: 'startDate',
      label: '开始日期',
      placeholder: 'YYYY-MM-DD',
      initialValue: promotion.startDate,
      helper: '活动开始日期，如 2026-07-01',
    },
    {
      key: 'endDate',
      label: '结束日期',
      placeholder: 'YYYY-MM-DD',
      initialValue: promotion.endDate,
      helper: '活动结束日期，如 2026-07-31',
    },
    {
      key: 'budget',
      label: '预算 (¥)',
      type: 'number',
      required: true,
      initialValue: String(promotion.budget),
      placeholder: '例如 50000',
      helper: '活动预算金额（元）',
    },
    {
      key: 'usageLimit',
      label: '使用上限',
      type: 'number',
      required: true,
      initialValue: String(promotion.usageLimit),
      placeholder: '例如 500',
      helper: '优惠可被使用的最大次数',
    },
    {
      key: 'storeName',
      label: '所属门店',
      placeholder: '门店名称',
      initialValue: promotion.storeName,
    },
    {
      key: 'status',
      label: '状态',
      type: 'select',
      required: true,
      initialValue: promotion.status as string,
      options: [
        { label: STATUS_LABELS.draft, value: 'draft' },
        { label: STATUS_LABELS.active, value: 'active' },
        { label: STATUS_LABELS.paused, value: 'paused' },
        { label: STATUS_LABELS.ended, value: 'ended' },
      ],
    },
  ];

  const handleSubmit = async (data: Record<string, unknown>): Promise<FormPageSubmitResult | null> => {
    try {
      // 转换数字字段
      const patch: Partial<Promotion> = {
        ...data as unknown as Partial<Promotion>,
        budget: Number(data.budget) || 0,
        usageLimit: Number(data.usageLimit) || 0,
      };
      updateStoreValue(params.id, patch);
      return { data: patch, message: `活动「${data.title}」更新成功` };
    } catch {
      return null;
    }
  };

  const handleSuccess = () => {
    router.push(`/promotions/${params.id}`);
  };

  const handleDelete = async () => {
    runtimeStore.delete(params.id);
    router.push('/promotions');
  };

  const typeLabel = TYPE_LABELS[promotion.type];

  return (
    <FormPageScaffold
      meta={{
        title: `编辑活动: ${promotion.title}`,
        description: `${typeLabel} · ${promotion.storeName} · ID: ${promotion.id}`,
        deleteAction: {
          label: '删除活动',
          onDelete: handleDelete,
          confirmText: `确定要删除活动「${promotion.title}」吗？此操作不可撤销。`,
        },
      }}
      fields={fields}
      onSubmit={handleSubmit}
      onSuccess={handleSuccess}
      backUrl={`/promotions/${params.id}`}
      submitLabel="保存修改"
    />
  );
}
