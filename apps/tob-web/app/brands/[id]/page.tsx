/**
 * brands/[id]/page.tsx — 品牌详情页 (ToB Next.js App Router)
 * 角色视角: 👔 租户管理员 / 🏢 品牌经理
 * 功能: 品牌详情查看、编辑入口、状态流转（审核/暂停/归档/启用）、删除
 * 类型: B-详情页 (含编辑/删除/状态流转)
 */
'use client';

import React, { useState, useCallback, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  DetailShell,
  StatusBadge,
  DetailActionBar,
  DetailClosureBar,
  DescriptionList,
  EmptyState,
  ConfirmDialog,
  type DetailActionBarAction,
  type DetailClosureLink,
  type DescriptionItem,
} from '@m5/ui';
import {
  MOCK_BRANDS,
  BRAND_STATUS_MAP,
  BRAND_CATEGORY_MAP,
  formatRevenue,
  type BrandItem,
  type BrandStatus,
} from '../brands-data';

/* ── 状态流转映射 ── */

const NEXT_STATUS_MAP: Record<BrandStatus, { label: string; target: BrandStatus; variant?: 'default' | 'primary' | 'danger' }[]> = {
  active: [
    { label: '暂停', target: 'suspended', variant: 'default' },
    { label: '归档', target: 'archived', variant: 'default' },
  ],
  pending_review: [
    { label: '审核通过', target: 'active', variant: 'primary' },
    { label: '驳回暂停', target: 'suspended', variant: 'danger' },
  ],
  suspended: [
    { label: '重新启用', target: 'active', variant: 'primary' },
    { label: '归档', target: 'archived', variant: 'default' },
  ],
  archived: [
    { label: '恢复启用', target: 'active', variant: 'primary' },
  ],
};

/* ── 组件 ── */

export default function BrandDetailPage() {
  const params = useParams();
  const router = useRouter();
  const brandId = params?.id as string;

  const [brandsDb, setBrandsDb] = useState<Record<string, BrandItem>>(
    () => Object.fromEntries(MOCK_BRANDS.map((b) => [b.id, b])),
  );
  const brand = brandsDb[brandId];
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [isDeleted, setIsDeleted] = useState(false);

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  }, []);

  /** 状态流转 */
  const handleTransition = useCallback(
    (target: BrandStatus) => {
      if (!brand) return;
      setBrandsDb((prev) => {
        const item = prev[brandId];
        if (!item) return prev;
        return {
          ...prev,
          [brandId]: {
            ...item,
            status: target,
            registeredAt: item.registeredAt,
          },
        };
      });
      showToast(`品牌状态已变更为: ${BRAND_STATUS_MAP[target].label}`);
    },
    [brand, brandId, showToast],
  );

  /** 编辑 */
  const handleEdit = useCallback(() => {
    showToast('✏️ 编辑入口已触发（跳转编辑页待实现）');
  }, [showToast]);

  /** 删除 */
  const handleDelete = useCallback(() => {
    setBrandsDb((prev) => {
      const next = { ...prev };
      delete next[brandId];
      return next;
    });
    setIsDeleted(true);
    showToast('品牌已删除');
    setTimeout(() => router.push('/brands'), 2000);
  }, [brandId, router, showToast]);

  if (isDeleted) {
    return (
      <DetailShell title="品牌详情">
        <EmptyState title="已删除" description="该品牌已成功删除，即将返回列表" />
      </DetailShell>
    );
  }

  if (!brand) {
    return (
      <DetailShell title="品牌详情">
        <EmptyState title="未找到品牌" description={`ID 为 "${brandId}" 的品牌不存在`} />
      </DetailShell>
    );
  }

  const closureLinks: DetailClosureLink[] = [
    { key: 'back-to-brands', title: '品牌列表', subtitle: '返回品牌管理页', href: '/brands' },
  ];

  const statusActions: DetailActionBarAction[] = useMemo(() => {
    const transitions = NEXT_STATUS_MAP[brand.status] ?? [];
    return transitions.map((t) => ({
      key: `transition-${t.target}`,
      label: `${t.label} → ${BRAND_STATUS_MAP[t.target].label}`,
      variant: t.variant ?? 'default',
      onClick: () => handleTransition(t.target),
    }));
  }, [brand.status, handleTransition]);

  const actionItems: DetailActionBarAction[] = [
    { key: 'edit', label: '✏️ 编辑', variant: 'default', onClick: handleEdit },
    ...statusActions,
    { key: 'delete', label: '🗑️ 删除', variant: 'danger', onClick: () => setShowDeleteConfirm(true) },
  ];

  const infoFields: DescriptionItem[] = [
    { label: '品牌名称', value: brand.brandName },
    { label: '租户编码', value: brand.tenantCode },
    { label: '状态', value: <StatusBadge variant={BRAND_STATUS_MAP[brand.status].variant} label={BRAND_STATUS_MAP[brand.status].label} /> },
    { label: '分类', value: BRAND_CATEGORY_MAP[brand.category].label },
    { label: '注册时间', value: brand.registeredAt },
    { label: '联系邮箱', value: brand.contactEmail },
    { label: '联系电话', value: brand.contactPhone },
    { label: '门店数', value: `${brand.storeCount} 家` },
    { label: '员工数', value: `${brand.employeeCount} 人` },
    { label: '年营收', value: formatRevenue(brand.annualRevenue) },
    {
      label: '覆盖市场',
      value: brand.marketCodes.length > 0 ? brand.marketCodes.join('、') : '暂无',
    },
  ];

  return (
    <>
      {toast && (
        <div
          style={{
            position: 'fixed', top: 24, right: 24, zIndex: 9999,
            padding: '12px 24px', borderRadius: 12,
            background: '#22c55e', color: '#fff', fontWeight: 600,
            fontSize: 14, boxShadow: '0 4px 16px rgba(0,0,0,0.3)',
          }}
        >
          {toast}
        </div>
      )}

      <DetailShell
        title={`品牌详情 — ${brand.brandName}`}
        subtitle={`${brand.tenantCode} | ${BRAND_CATEGORY_MAP[brand.category].label} | ${brand.storeCount} 家门店`}
      >
        <DescriptionList items={infoFields} columns={2} />

        <DetailActionBar actions={actionItems} />

        <DetailClosureBar links={closureLinks} />
      </DetailShell>

      <ConfirmDialog
        open={showDeleteConfirm}
        title="确认删除"
        message={`确定要删除品牌 "${brand.brandName}" 吗？此操作不可撤销。`}
        confirmLabel="确认删除"
        cancelLabel="取消"
        variant="danger"
        onConfirm={() => { setShowDeleteConfirm(false); handleDelete(); }}
        onCancel={() => setShowDeleteConfirm(false)}
      />
    </>
  );
}
