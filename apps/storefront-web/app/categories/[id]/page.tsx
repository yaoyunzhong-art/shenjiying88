'use client';

import { useParams } from 'next/navigation';
import React, { useMemo, useState } from 'react';

import {
  DetailShell,
  InfoRow,
  QuickStats,
  StatusBadge,
  type DetailShellAction,
} from '@m5/ui';

// ---- 类型 ----

interface ProductCategoryDetail {
  id: string;
  name: string;
  slug: string;
  parentName: string | null;
  parentId: string | null;
  status: 'active' | 'hidden' | 'archived';
  sortOrder: number;
  productCount: number;
  productCountUnlisted: number;
  description: string;
  imageUrl: string | null;
  createdAt: string;
  updatedAt: string;
}

const STATUS_LABELS: Record<string, string> = {
  active: '已上架',
  hidden: '已隐藏',
  archived: '已归档',
};

// ---- Mock 数据 ----

const MOCK_CATEGORIES: Record<string, ProductCategoryDetail> = {
  'cat-1': {
    id: 'cat-1',
    name: '面部护理',
    slug: 'facial-care',
    parentName: null,
    parentId: null,
    status: 'active',
    sortOrder: 1,
    productCount: 48,
    productCountUnlisted: 3,
    description: '涵盖洁面、爽肤、精华、面霜、面膜等面部护理产品。',
    imageUrl: null,
    createdAt: '2025-01-15T09:00:00Z',
    updatedAt: '2026-06-28T14:30:00Z',
  },
  'cat-2': {
    id: 'cat-2',
    name: '洗面奶',
    slug: 'facial-cleanser',
    parentName: '面部护理',
    parentId: 'cat-1',
    status: 'active',
    sortOrder: 1,
    productCount: 12,
    productCountUnlisted: 1,
    description: '包括泡沫、啫喱、乳液等各类洗面产品。',
    imageUrl: null,
    createdAt: '2025-02-10T10:00:00Z',
    updatedAt: '2026-06-20T09:15:00Z',
  },
  'cat-3': {
    id: 'cat-3',
    name: '身体护理',
    slug: 'body-care',
    parentName: null,
    parentId: null,
    status: 'active',
    sortOrder: 2,
    productCount: 36,
    productCountUnlisted: 0,
    description: '沐浴露、身体乳、护手霜、防晒等身体护理系列。',
    imageUrl: null,
    createdAt: '2025-01-15T09:00:00Z',
    updatedAt: '2026-06-25T11:00:00Z',
  },
  'cat-4': {
    id: 'cat-4',
    name: '洗发护发',
    slug: 'hair-care',
    parentName: null,
    parentId: null,
    status: 'hidden',
    sortOrder: 3,
    productCount: 22,
    productCountUnlisted: 5,
    description: '洗发水、护发素、发膜、造型产品等。',
    imageUrl: null,
    createdAt: '2025-03-01T09:00:00Z',
    updatedAt: '2026-06-27T16:45:00Z',
  },
  'cat-5': {
    id: 'cat-5',
    name: '旧版春季系列',
    slug: 'spring-old',
    parentName: null,
    parentId: null,
    status: 'archived',
    sortOrder: 99,
    productCount: 8,
    productCountUnlisted: 8,
    description: '2025年春季限定旧版系列，已归档。',
    imageUrl: null,
    createdAt: '2025-03-15T09:00:00Z',
    updatedAt: '2026-05-30T10:00:00Z',
  },
};

// ---- 页面 ----

export default function CategoryDetailPage() {
  const params = useParams();
  const categoryId = params?.id as string;
  const category = useMemo(() => MOCK_CATEGORIES[categoryId], [categoryId]);

  const [showConfirm, setShowConfirm] = useState(false);
  const [confirmAction, setConfirmAction] = useState<'archive' | 'activate' | 'hide' | 'delete'>('archive');

  if (!category) {
    return (
      <DetailShell title="分类不存在" subtitle="">
        <div style={{ textAlign: 'center', padding: 48, color: '#64748b', fontSize: 14 }}>
          未找到该分类（ID: {categoryId}），可能已被删除
        </div>
      </DetailShell>
    );
  }

  const listedCount = category.productCount - category.productCountUnlisted;

  // 状态流转操作
  const actions: DetailShellAction[] = [];
  if (category.status === 'active') {
    actions.push({
      key: 'hide',
      label: '隐藏分类',
      onClick: () => { setConfirmAction('hide'); setShowConfirm(true); },
    });
    actions.push({
      key: 'archive',
      label: '归档',
      onClick: () => { setConfirmAction('archive'); setShowConfirm(true); },
    });
  } else if (category.status === 'hidden') {
    actions.push({
      key: 'activate',
      label: '重新上架',
      onClick: () => { setConfirmAction('activate'); setShowConfirm(true); },
    });
    actions.push({
      key: 'archive',
      label: '归档',
      onClick: () => { setConfirmAction('archive'); setShowConfirm(true); },
    });
  } else if (category.status === 'archived') {
    actions.push({
      key: 'activate',
      label: '恢复上架',
      onClick: () => { setConfirmAction('activate'); setShowConfirm(true); },
    });
  }
  actions.push({
    key: 'delete',
    label: '删除',
    onClick: () => { setConfirmAction('delete'); setShowConfirm(true); },
  });

  const confirmTitle =
    confirmAction === 'archive'
      ? '确认归档此分类？'
      : confirmAction === 'activate'
        ? '确认上架此分类？'
        : confirmAction === 'hide'
          ? '确认隐藏此分类？'
          : '确认删除此分类？';

  const confirmMessage =
    confirmAction === 'archive'
      ? `归档后分类 "${category.name}" 将从前台隐藏，${category.productCount} 件关联商品不受影响。`
      : confirmAction === 'activate'
        ? `上架后分类 "${category.name}" 将在前台恢复显示。`
        : confirmAction === 'hide'
          ? `隐藏后分类 "${category.name}" 将在前台不可见，关联商品不会消失。`
          : `删除操作不可撤销，分类 "${category.name}" 将永久移除，${category.productCount} 件关联商品将变为未分类状态。`;

  const confirmBtnLabel =
    confirmAction === 'archive'
      ? '归档'
      : confirmAction === 'activate'
        ? '上架'
        : confirmAction === 'hide'
          ? '隐藏'
          : '删除';

  return (
    <DetailShell
      title={category.name}
      subtitle={`Slug: ${category.slug}`}
      actions={actions}
    >
      {/* 关键指标 */}
      <QuickStats
        items={[
          { label: '总商品数', value: String(category.productCount) },
          { label: '已上架', value: String(listedCount), valueColor: '#4ade80' },
          { label: '未上架', value: String(category.productCountUnlisted), valueColor: '#facc15' },
          { label: '排序权重', value: String(category.sortOrder) },
        ]}
      />

      {/* 基本信息 */}
      <div
        style={{
          background: 'rgba(15, 23, 42, 0.4)',
          borderRadius: 12,
          border: '1px solid rgba(148, 163, 184, 0.1)',
          padding: 20,
          marginTop: 24,
        }}
      >
        <h3
          style={{
            fontSize: 15,
            fontWeight: 600,
            color: '#e2e8f0',
            margin: '0 0 16px',
          }}
        >
          基本信息
        </h3>
        <InfoRow label="分类 ID" value={category.id} />
        <InfoRow label="名称" value={category.name} />
        <InfoRow label="Slug" value={category.slug} />
        <InfoRow
          label="状态"
          value={
            <StatusBadge
              label={STATUS_LABELS[category.status] ?? category.status}
              variant={
                category.status === 'active'
                  ? 'success'
                  : category.status === 'hidden'
                    ? 'warning'
                    : 'default'
              }
            />
          }
        />
        <InfoRow label="上级分类" value={category.parentName ?? '—（顶级分类）'} />
        <InfoRow label="排序权重" value={String(category.sortOrder)} />
        <InfoRow label="分类描述" value={category.description} />
        <InfoRow
          label="创建时间"
          value={new Date(category.createdAt).toLocaleString('zh-CN')}
        />
        <InfoRow
          label="更新时间"
          value={new Date(category.updatedAt).toLocaleString('zh-CN')}
        />
      </div>

      {/* 确认对话框 */}
      {showConfirm && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 999,
          }}
          onClick={() => setShowConfirm(false)}
        >
          <div
            style={{
              background: '#1e293b',
              borderRadius: 16,
              padding: 24,
              maxWidth: 420,
              width: '90%',
              border: '1px solid rgba(148,163,184,0.14)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ margin: '0 0 8px', fontSize: 18, color: '#e2e8f0' }}>
              {confirmTitle}
            </h3>
            <p
              style={{
                fontSize: 14,
                color: '#94a3b8',
                lineHeight: 1.5,
              }}
            >
              {confirmMessage}
            </p>
            <div
              style={{
                display: 'flex',
                gap: 8,
                justifyContent: 'flex-end',
                marginTop: 20,
              }}
            >
              <button
                onClick={() => setShowConfirm(false)}
                style={{
                  padding: '8px 16px',
                  borderRadius: 8,
                  border: '1px solid rgba(148,163,184,0.2)',
                  background: 'transparent',
                  color: '#94a3b8',
                  cursor: 'pointer',
                  fontSize: 14,
                }}
              >
                取消
              </button>
              <button
                onClick={() => setShowConfirm(false)}
                style={{
                  padding: '8px 16px',
                  borderRadius: 8,
                  border: 'none',
                  background: confirmAction === 'delete' ? '#ef4444' : '#3b82f6',
                  color: '#fff',
                  cursor: 'pointer',
                  fontSize: 14,
                  fontWeight: 600,
                }}
              >
                {confirmBtnLabel}
              </button>
            </div>
          </div>
        </div>
      )}
    </DetailShell>
  );
}
