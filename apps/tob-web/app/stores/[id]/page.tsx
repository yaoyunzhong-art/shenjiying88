/**
 * stores/[id]/page.tsx — 门店详情页 (ToB 门店管理)
 * 角色视角: 👔企业运营经理 / 📊区域督导
 * 功能: 门店详情查看、编辑导航、状态流转
 * 类型: B-详情页 (含编辑/删除/状态流转)
 */
'use client';

import React, { useState, useCallback } from 'react';
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
  type DetailShellAction,
  type DetailActionBarAction,
  type DetailClosureLink,
  type DescriptionItem,
} from '@m5/ui';

import { MOCK_STORES, STORE_STATUS_MAP, formatCurrency, type StoreItem, type StoreStatus } from '../../stores-data';

// ─── 状态流转映射 ──────────────────────────────────────

const STATUS_TRANSITIONS: Record<StoreStatus, StoreStatus[]> = {
  active: ['maintenance', 'inactive'],
  inactive: ['active'],
  maintenance: ['active', 'inactive'],
};

// ─── 门店查找函数 ─────────────────────────────────────

function getStoreById(id: string): StoreItem | undefined {
  return MOCK_STORES.find((s) => s.id === id);
}

// ─── 主页面 ────────────────────────────────────────────

export default function StoreDetailPage() {
  const params = useParams();
  const router = useRouter();
  const toast = useToast();

  const id = params.id as string;
  const store = getStoreById(id);

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleStatusChange = useCallback(
    (newStatus: StoreStatus) => {
      toast.success(`门店状态已变更为「${STORE_STATUS_MAP[newStatus].label}」`);
    },
    [toast],
  );

  const handleDelete = useCallback(() => {
    setIsDeleting(true);
    setTimeout(() => {
      setIsDeleting(false);
      setShowDeleteConfirm(false);
      toast.success('门店已成功删除');
      router.push('/stores');
    }, 800);
  }, [router, toast]);

  const handleEdit = useCallback(() => {
    toast.info('跳转编辑页面');
    router.push(`/stores/${id}/edit`);
  }, [id, router, toast]);

  // ── 未找到门店 ──

  if (!store) {
    return (
      <DetailShell title="门店不存在" subtitle="请检查门店 ID">
        <p style={{ color: '#94a3b8', textAlign: 'center', padding: 40 }}>
          未找到 ID 为「{id}」的门店
        </p>
        <DetailClosureBar
          links={[
            { key: 'back', title: '返回门店列表', subtitle: '查看所有门店', href: '/stores' },
          ]}
        />
      </DetailShell>
    );
  }

  // ── 基本信息 ──

  const statusInfo = STORE_STATUS_MAP[store.status];

  const basicInfoItems: DescriptionItem[] = [
    { label: '门店名称', value: store.storeName },
    { label: '门店编码', value: store.storeCode },
    { label: '所属区域', value: store.region },
    { label: '所在城市', value: store.city },
    { label: '详细地址', value: store.address },
    { label: '门店状态', value: <StatusBadge variant={statusInfo.variant} label={statusInfo.label} /> },
    { label: '创建时间', value: store.createdAt },
    { label: '最近巡检', value: store.lastInspection },
  ];

  // ── 联系人信息 ──

  const contactItems: DescriptionItem[] = [
    { label: '店长姓名', value: store.managerName },
    { label: '店长电话', value: store.managerMobile },
    { label: '员工人数', value: `${store.employeeCount} 人` },
  ];

  // ── 经营数据 ──

  const financeItems: DescriptionItem[] = [
    { label: '月营收', value: formatCurrency(store.monthlyRevenue) },
    { label: '日客流', value: `${store.dailyTraffic.toLocaleString()} 人` },
    {
      label: '营收状态',
      value: store.monthlyRevenue > 0
        ? <span style={{ color: '#4ade80' }}>正常</span>
        : <span style={{ color: '#f87171' }}>异常</span>,
    },
  ];

  // ── 操作 & 导航 ──

  const detailActions: DetailShellAction[] = [
    { key: 'edit', label: '编辑门店', onClick: handleEdit, variant: 'primary' },
    { key: 'delete', label: '删除门店', onClick: () => setShowDeleteConfirm(true), variant: 'danger' },
  ];

  const actionBarActions: DetailActionBarAction[] = (
    STATUS_TRANSITIONS[store.status] ?? []
  ).map((nextStatus) => ({
    key: `transition-${nextStatus}`,
    label: `变更为「${STORE_STATUS_MAP[nextStatus].label}」`,
    onClick: () => handleStatusChange(nextStatus),
    variant: nextStatus === 'inactive' ? 'danger' : 'default',
  }));

  const closureLinks: DetailClosureLink[] = [
    { key: 'back-to-stores', title: '返回门店列表', subtitle: '查看所有门店', href: '/stores' },
    { key: 'view-reports', title: '查看门店报表', subtitle: '经营数据分析', href: '/reports' },
  ];

  return (
    <>
      <DetailShell
        title={store.storeName}
        subtitle={`编码: ${store.storeCode} | ${store.city} · ${store.region}`}
        actions={detailActions}
        breadcrumbs={[
          { label: '首页', href: '/dashboard' },
          { label: '门店管理', href: '/stores' },
          { label: store.storeName },
        ]}
      >
        {/* 基本信息 */}
        <div style={{ borderRadius: 12, padding: 24, background: 'rgba(15,23,42,0.5)', border: '1px solid rgba(148,163,184,0.14)', marginBottom: 16 }}>
          <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16, color: '#e2e8f0' }}>基本信息</h3>
          <DescriptionList items={basicInfoItems} columns={3} />
        </div>

        {/* 联系人信息 */}
        <div style={{ borderRadius: 12, padding: 24, background: 'rgba(15,23,42,0.5)', border: '1px solid rgba(148,163,184,0.14)', marginBottom: 16 }}>
          <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16, color: '#e2e8f0' }}>联系人信息</h3>
          <DescriptionList items={contactItems} columns={3} />
        </div>

        {/* 经营数据 */}
        <div style={{ borderRadius: 12, padding: 24, background: 'rgba(15,23,42,0.5)', border: '1px solid rgba(148,163,184,0.14)', marginBottom: 16 }}>
          <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16, color: '#e2e8f0' }}>经营数据</h3>
          <DescriptionList items={financeItems} columns={3} />
        </div>
      </DetailShell>

      <DetailActionBar actions={actionBarActions} />

      <DetailClosureBar links={closureLinks} />

      <ConfirmDialog
        open={showDeleteConfirm}
        onCancel={() => setShowDeleteConfirm(false)}
        onConfirm={handleDelete}
        title="确认删除门店"
        message={`确定要删除「${store.storeName}」吗？删除后无法恢复。`}
        confirmLabel="确认删除"
        cancelLabel="取消"
        loading={isDeleting}
        variant="danger"
      />
    </>
  );
}

