/**
 * tenants/[id]/page.tsx — 租户详情页 (ToB 多租户管理)
 * 角色视角: 👔 超级管理员
 * 功能: 租户详情查看、编辑、状态变更
 */
'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import {
  StatusBadge,
  Badge,
  DescriptionList,
  ConfirmDialog,
  useToast,
} from '@m5/ui';
import type { DescriptionItem } from '@m5/ui';
import {
  MOCK_TENANTS,
  TENANT_STATUS_MAP,
  PLAN_LABELS,
  PLAN_COLORS,
  formatNumber,
  type Tenant,
} from '../tenants-data';

function getTenantById(id: string): Tenant | undefined {
  return MOCK_TENANTS.find((t) => t.id === id);
}

export default function TenantDetailPage() {
  const params = useParams();
  const tenantId = params.id as string;
  const toast = useToast();

  const [tenant, setTenant] = useState<Tenant | null>(() => getTenantById(tenantId) ?? null);
  const [showSuspendDialog, setShowSuspendDialog] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  if (!tenant) {
    return (
      <div style={{ padding: 48, textAlign: 'center', color: '#94a3b8' }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>🏢</div>
        <div style={{ fontSize: 16, marginBottom: 16 }}>租户不存在</div>
        <Link
          href="/tenants"
          style={{
            padding: '10px 20px',
            borderRadius: 8,
            background: 'rgba(102, 126, 234, 0.2)',
            color: '#a5b4fc',
            textDecoration: 'none',
            fontSize: 14,
          }}
        >
          返回租户列表
        </Link>
      </div>
    );
  }

  function handleSuspend() {
    setIsLoading(true);
    setTimeout(() => {
      setTenant((prev) =>
        prev ? { ...prev, status: prev.status === 'suspended' ? 'active' : 'suspended' } : null
      );
      setIsLoading(false);
      setShowSuspendDialog(false);
      toast.success(`租户已${tenant!.status === 'suspended' ? '启用' : '停用'}`);
    }, 800);
  }

  const basicInfoItems: DescriptionItem[] = [
    { label: '租户编码', value: <code style={{ color: '#60a5fa' }}>{tenant.tenantCode}</code> },
    { label: '租户名称', value: tenant.tenantName },
    { label: '联系人', value: tenant.contactPerson },
    { label: '联系电话', value: tenant.contactPhone },
    { label: '电子邮箱', value: tenant.contactEmail },
    { label: '所属地区', value: `${tenant.region} · ${tenant.city}` },
    { label: '创建日期', value: tenant.createdAt },
    { label: '套餐类型', value: (
      <Badge
        variant="neutral"
        style={{ color: PLAN_COLORS[tenant.plan], borderColor: `${PLAN_COLORS[tenant.plan]}40` }}
      >
        {PLAN_LABELS[tenant.plan]}
      </Badge>
    )},
    {
      label: '状态',
      value: <StatusBadge variant={TENANT_STATUS_MAP[tenant.status].variant} label={TENANT_STATUS_MAP[tenant.status].label} />,
    },
  ];

  const businessInfoItems: DescriptionItem[] = [
    { label: '品牌数量', value: `${tenant.brandCount} 个` },
    { label: '门店数量', value: `${tenant.storeCount} 家` },
    { label: '会员数量', value: formatNumber(tenant.memberCount) },
  ];

  return (
    <div style={{ padding: '24px 32px', color: '#e2e8f0' }}>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <Link
          href="/tenants"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            color: '#94a3b8',
            textDecoration: 'none',
            fontSize: 14,
            marginBottom: 16,
          }}
        >
          ← 返回租户列表
        </Link>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1 style={{ fontSize: 24, fontWeight: 700, margin: '0 0 8px' }}>{tenant.tenantName}</h1>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <StatusBadge
                variant={TENANT_STATUS_MAP[tenant.status].variant}
                label={TENANT_STATUS_MAP[tenant.status].label}
              />
              <span style={{ fontSize: 13, color: '#64748b' }}>{tenant.tenantCode}</span>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 12 }}>
            <button
              style={{
                padding: '10px 20px',
                borderRadius: 8,
                background: 'rgba(148, 163, 184, 0.1)',
                border: '1px solid rgba(148, 163, 184, 0.2)',
                color: '#94a3b8',
                fontSize: 14,
                cursor: 'pointer',
              }}
            >
              编辑信息
            </button>
            <button
              onClick={() => setShowSuspendDialog(true)}
              style={{
                padding: '10px 20px',
                borderRadius: 8,
                background: tenant.status === 'suspended'
                  ? 'rgba(74, 222, 128, 0.15)'
                  : 'rgba(239, 68, 68, 0.15)',
                border: `1px solid ${tenant.status === 'suspended' ? 'rgba(74, 222, 128, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
                color: tenant.status === 'suspended' ? '#4ade80' : '#f87171',
                fontSize: 14,
                cursor: 'pointer',
              }}
            >
              {tenant.status === 'suspended' ? '启用租户' : '停用租户'}
            </button>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: 16,
          marginBottom: 24,
        }}
      >
        <div
          style={{
            padding: 20,
            borderRadius: 12,
            background: 'rgba(102, 126, 234, 0.1)',
            border: '1px solid rgba(102, 126, 234, 0.2)',
            textAlign: 'center',
          }}
        >
          <div style={{ fontSize: 32, fontWeight: 700, color: '#a5b4fc' }}>{tenant.brandCount}</div>
          <div style={{ fontSize: 13, color: '#94a3b8', marginTop: 4 }}>品牌数量</div>
        </div>
        <div
          style={{
            padding: 20,
            borderRadius: 12,
            background: 'rgba(34, 197, 94, 0.1)',
            border: '1px solid rgba(34, 197, 94, 0.2)',
            textAlign: 'center',
          }}
        >
          <div style={{ fontSize: 32, fontWeight: 700, color: '#86efac' }}>{tenant.storeCount}</div>
          <div style={{ fontSize: 13, color: '#94a3b8', marginTop: 4 }}>门店数量</div>
        </div>
        <div
          style={{
            padding: 20,
            borderRadius: 12,
            background: 'rgba(251, 191, 36, 0.1)',
            border: '1px solid rgba(251, 191, 36, 0.2)',
            textAlign: 'center',
          }}
        >
          <div style={{ fontSize: 32, fontWeight: 700, color: '#fbbf24' }}>
            {formatNumber(tenant.memberCount)}
          </div>
          <div style={{ fontSize: 13, color: '#94a3b8', marginTop: 4 }}>会员数量</div>
        </div>
      </div>

      {/* Basic Info */}
      <div
        style={{
          borderRadius: 12,
          background: 'rgba(15, 23, 42, 0.5)',
          border: '1px solid rgba(148, 163, 184, 0.12)',
          padding: 24,
          marginBottom: 24,
        }}
      >
        <h2 style={{ fontSize: 16, fontWeight: 600, color: '#f8fafc', margin: '0 0 20px' }}>
          基本信息
        </h2>
        <DescriptionList items={basicInfoItems} columns={3} />
      </div>

      {/* Business Info */}
      <div
        style={{
          borderRadius: 12,
          background: 'rgba(15, 23, 42, 0.5)',
          border: '1px solid rgba(148, 163, 184, 0.12)',
          padding: 24,
        }}
      >
        <h2 style={{ fontSize: 16, fontWeight: 600, color: '#f8fafc', margin: '0 0 20px' }}>
          业务数据
        </h2>
        <DescriptionList items={businessInfoItems} columns={3} />
      </div>

      {/* Suspend Dialog */}
      <ConfirmDialog
        open={showSuspendDialog}
        onCancel={() => setShowSuspendDialog(false)}
        onConfirm={handleSuspend}
        title={tenant.status === 'suspended' ? '确认启用租户' : '确认停用租户'}
        message={
          tenant.status === 'suspended'
            ? `确定要启用「${tenant.tenantName}」吗？启用后租户将恢复访问权限。`
            : `确定要停用「${tenant.tenantName}」吗？停用后租户下所有用户将被强制登出。`
        }
        confirmLabel={tenant.status === 'suspended' ? '确认启用' : '确认停用'}
        cancelLabel="取消"
        loading={isLoading}
        variant={tenant.status === 'suspended' ? 'default' : 'danger'}
      />
    </div>
  );
}
