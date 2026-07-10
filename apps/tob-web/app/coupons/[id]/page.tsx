/**
 * coupons/[id]/page.tsx — ToB 优惠券详情页
 * 角色视角: 👔运营经理 / 📊品牌专员
 * 功能: 优惠券详情查看、状态流转、编辑导航、删除操作
 * 类型: B-详情页 (含编辑/删除/状态流转)
 */
'use client';

import React, { useState, useCallback, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';

import {
  DetailShell,
  InfoRow,
  StatusBadge,
  Button,
  DetailActionBar,
  DetailClosureBar,
  DescriptionList,
  useToast,
  ConfirmDialog,
  Timeline,
  type DetailShellAction,
  type DetailActionBarAction,
  type DetailClosureLink,
  type DescriptionItem,
} from '@m5/ui';

import {
  MOCK_COUPONS,
  TYPE_LABELS,
  STATUS_LABELS,
  type Coupon,
  type CouponStatus,
} from '../coupons-data';

// ─── 状态流转映射 ──────────────────────────────────────

const STATUS_TRANSITIONS: Record<CouponStatus, CouponStatus[]> = {
  active: ['disabled'],
  expired: ['active'],
  disabled: ['active'],
};

// ─── 构建操作日志 ──────────────────────────────────────

function buildCouponTimeline(coupon: Coupon): Array<{
  key: string;
  heading: string;
  subtitle: string;
  content: string;
}> {
  const entries: Array<{ key: string; heading: string; subtitle: string; content: string }> = [
    {
      key: `${coupon.id}-create`,
      heading: '创建',
      subtitle: coupon.createdBy,
      content: `创建优惠券「${coupon.name}」`,
    },
  ];
  if (coupon.status === 'active') {
    entries.push({
      key: `${coupon.id}-publish`,
      heading: '发布',
      subtitle: coupon.createdBy,
      content: `发布上线，有效期至 ${coupon.validTo}`,
    });
  }
  if (coupon.usedCount > 0) {
    entries.push({
      key: `${coupon.id}-redeem`,
      heading: '核销',
      subtitle: '系统',
      content: `累计核销 ${coupon.usedCount} 张（${Math.round((coupon.usedCount / coupon.totalIssued) * 100)}%）`,
    });
  }
  if (coupon.status === 'expired') {
    entries.push({
      key: `${coupon.id}-expire`,
      heading: '过期',
      subtitle: '系统',
      content: '优惠券已超过截止日期，自动失效',
    });
  }
  if (coupon.status === 'disabled') {
    entries.push({
      key: `${coupon.id}-disable`,
      heading: '停用',
      subtitle: '系统管理员',
      content: '优惠券被管理员手动停用',
    });
  }
  return entries;
}

// ─── 查找函数 ─────────────────────────────────────────

function getCouponById(id: string): Coupon | undefined {
  return MOCK_COUPONS.find((c) => c.id === id);
}

// ─── 主页面 ────────────────────────────────────────────

export default function CouponDetailPage() {
  const params = useParams();
  const router = useRouter();
  const toast = useToast();

  const id = params.id as string;
  const coupon = getCouponById(id);

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleStatusChange = useCallback(
    (newStatus: CouponStatus) => {
      toast.success(`优惠券状态已变更为「${STATUS_LABELS[newStatus]}」`);
    },
    [toast],
  );

  const handleDelete = useCallback(() => {
    setIsDeleting(true);
    setTimeout(() => {
      setIsDeleting(false);
      setShowDeleteConfirm(false);
      toast.success('优惠券已成功删除');
      router.push('/coupons');
    }, 800);
  }, [router, toast]);

  const handleEdit = useCallback(() => {
    toast.info('跳转编辑页面');
    router.push(`/coupons/${id}/edit`);
  }, [id, router, toast]);

  // ── 未找到优惠券 ──
  if (!coupon) {
    return (
      <DetailShell title="优惠券不存在" subtitle="请检查优惠券 ID">
        <p style={{ color: '#94a3b8', textAlign: 'center', padding: 40 }}>
          未找到 ID 为「{id}」的优惠券
        </p>
        <DetailClosureBar
          links={[
            { key: 'back', title: '返回优惠券列表', subtitle: '查看所有优惠券', href: '/coupons' },
          ]}
        />
      </DetailShell>
    );
  }

  // ── 基本信息 ──

  const statusInfo = {
    label: STATUS_LABELS[coupon.status],
    variant: (coupon.status === 'active' ? 'success' : coupon.status === 'expired' ? 'default' : 'warning') as 'success' | 'default' | 'warning',
  };

  const basicInfoItems: DescriptionItem[] = [
    { label: '优惠券名称', value: coupon.name },
    { label: '优惠券 ID', value: coupon.id },
    { label: '类型', value: TYPE_LABELS[coupon.type] },
    { label: '面值', value: coupon.value },
    { label: '使用门槛', value: coupon.minAmount },
    { label: '最高抵扣', value: coupon.maxAmount || '无限制' },
    { label: '所属品牌', value: coupon.brandCode },
    { label: '适用市场', value: coupon.marketCode },
    {
      label: '状态',
      value: <StatusBadge variant={statusInfo.variant} label={statusInfo.label} />,
    },
    { label: '创建人', value: coupon.createdBy },
  ];

  // ── 时间信息 ──

  const timeItems: DescriptionItem[] = [
    { label: '生效日期', value: coupon.validFrom },
    { label: '截止日期', value: coupon.validTo },
  ];

  // ── 核销数据 ──

  const redeemRate = Math.round((coupon.usedCount / coupon.totalIssued) * 100);
  const redeemItems: DescriptionItem[] = [
    { label: '总发放', value: coupon.totalIssued.toLocaleString() },
    { label: '已核销', value: coupon.usedCount.toLocaleString() },
    {
      label: '核销率',
      value: (
        <span style={{ color: redeemRate > 60 ? '#4ade80' : redeemRate > 20 ? '#facc15' : '#f87171', fontWeight: 600 }}>
          {redeemRate}%
        </span>
      ),
    },
  ];

  // ── 操作日志 ──

  const timelineItems = buildCouponTimeline(coupon);

  // ── 操作 & 导航 ──

  const detailActions: DetailShellAction[] = [
    { key: 'edit', label: '编辑', onClick: handleEdit, variant: 'primary' },
    { key: 'delete', label: '删除', onClick: () => setShowDeleteConfirm(true), variant: 'danger' },
  ];

  const actionBarActions: DetailActionBarAction[] = (
    STATUS_TRANSITIONS[coupon.status] ?? []
  ).map((nextStatus) => ({
    key: `transition-${nextStatus}`,
    label: nextStatus === 'active' ? '激活' : '停用',
    onClick: () => handleStatusChange(nextStatus),
    variant: nextStatus === 'disabled' ? 'danger' : 'primary',
  }));

  const closureLinks: DetailClosureLink[] = [
    { key: 'back-to-coupons', title: '返回优惠券列表', subtitle: '查看所有品牌级优惠券', href: '/coupons' },
  ];

  return (
    <>
      <DetailShell
        title={coupon.name}
        subtitle={TYPE_LABELS[coupon.type]}
        actions={detailActions}
        breadcrumbs={[
          { label: '首页', href: '/dashboard' },
          { label: '优惠券管理', href: '/coupons' },
          { label: coupon.name },
        ]}
      >
        {/* 基本信息 */}
        <div style={{ borderRadius: 12, padding: 24, background: 'rgba(15,23,42,0.5)', border: '1px solid rgba(148,163,184,0.14)', marginBottom: 16 }}>
          <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16, color: '#e2e8f0' }}>基本信息</h3>
          <DescriptionList items={basicInfoItems} columns={2} />
        </div>

        {/* 有效期 */}
        <div style={{ borderRadius: 12, padding: 24, background: 'rgba(15,23,42,0.5)', border: '1px solid rgba(148,163,184,0.14)', marginBottom: 16 }}>
          <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16, color: '#e2e8f0' }}>有效期</h3>
          <DescriptionList items={timeItems} columns={2} />
        </div>

        {/* 核销统计 */}
        <div style={{ borderRadius: 12, padding: 24, background: 'rgba(15,23,42,0.5)', border: '1px solid rgba(148,163,184,0.14)', marginBottom: 16 }}>
          <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16, color: '#e2e8f0' }}>核销统计</h3>
          <DescriptionList items={redeemItems} columns={3} />
        </div>

        {/* 操作日志 */}
        <div style={{ borderRadius: 12, padding: 24, background: 'rgba(15,23,42,0.5)', border: '1px solid rgba(148,163,184,0.14)', marginBottom: 16 }}>
          <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16, color: '#e2e8f0' }}>操作日志</h3>
          <Timeline items={timelineItems} />
        </div>
      </DetailShell>

      <DetailActionBar actions={actionBarActions} heading="状态流转" />

      <DetailClosureBar links={closureLinks} heading="导航" caption="返回列表或继续管理优惠券" />

      <ConfirmDialog
        open={showDeleteConfirm}
        title="删除优惠券"
        message={`确认删除优惠券「${coupon.name}」？此操作不可撤销。`}
        confirmLabel={isDeleting ? '删除中...' : '确认删除'}
        cancelLabel="取消"
        variant="danger"
        loading={isDeleting}
        onConfirm={handleDelete}
        onCancel={() => setShowDeleteConfirm(false)}
      />
    </>
  );
}
