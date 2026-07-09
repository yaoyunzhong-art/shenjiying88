/**
 * stores/[id]/page.tsx — 门店详情页 (ToB 门店管理)
 */
'use client';

import React, { useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  StatusBadge,
  Badge,
  StatCard,
  LoadingSkeleton,
  Button,
  DetailActionBar,
  DetailClosureBar,
} from '@m5/ui';

import {
  MOCK_STORES,
  STORE_STATUS_MAP,
  type StoreItem,
  formatCurrency,
} from '../../stores-data';

export default function StoreDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const [loading, setLoading] = useState(false);

  useMemo(() => {
    setLoading(true);
    const t = setTimeout(() => setLoading(false), 100);
    return () => clearTimeout(t);
  }, []);

  const store = useMemo(() => MOCK_STORES.find((s) => s.id === id), [id]);

  if (loading) {
    return (
      <div style={{ padding: '24px 32px' }}>
        <LoadingSkeleton rows={8} />
      </div>
    );
  }

  if (!store) {
    return (
      <div style={{ padding: '24px 32px', color: '#e2e8f0', textAlign: 'center', paddingTop: 80 }}>
        <h2 style={{ fontSize: 20, fontWeight: 600, marginBottom: 12 }}>
          门店未找到
        </h2>
        <p style={{ color: '#94a3b8', marginBottom: 24 }}>
          ID: {id} 对应的门店不存在或已被删除
        </p>
        <Button onClick={() => router.push('/stores')}>
          返回门店列表
        </Button>
      </div>
    );
  }

  const statusInfo = STORE_STATUS_MAP[store.status];

  const handleEdit = () => {
    // TODO: 跳转编辑页
  };

  const handleToggleStatus = () => {
    // TODO: 状态流转
  };

  const handleDelete = () => {
    // TODO: 删除确认
  };

  return (
    <div style={{ padding: '24px 32px', color: '#e2e8f0' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
        <Button
          variant="ghost"
          onClick={() => router.push('/stores')}
        >
          ← 返回
        </Button>
        <h1 style={{ fontSize: 24, fontWeight: 700, margin: 0 }}>
          {store.storeName}
        </h1>
        <StatusBadge variant={statusInfo.variant} label={statusInfo.label} />
      </div>

      {/* Action Bar */}
      <DetailActionBar
        actions={[
          { label: '编辑门店', onClick: handleEdit, variant: 'primary' },
          {
            label: store.status === 'active' ? '暂停营业' : '恢复营业',
            onClick: handleToggleStatus,
            variant: 'secondary',
          },
          { label: '删除门店', onClick: handleDelete, variant: 'danger' },
        ]}
      />

      {/* Stats */}
      <div style={{ display: 'flex', gap: 16, marginBottom: 24 }}>
        <StatCard
          label="月营收"
          value={store.status === 'active' ? formatCurrency(store.monthlyRevenue) : '--'}
        />
        <StatCard
          label="日客流"
          value={store.status === 'active' ? `${store.dailyTraffic}人` : '--'}
        />
        <StatCard
          label="员工数"
          value={`${store.employeeCount}人`}
        />
      </div>

      {/* Basic Info */}
      <div style={{
        background: 'rgba(15,23,42,0.6)',
        border: '1px solid rgba(148,163,184,0.15)',
        borderRadius: 12,
        padding: 24,
        marginBottom: 24,
      }}>
        <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16, color: '#94a3b8' }}>
          基本信息
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px 32px' }}>
          <InfoRow label="门店编号" value={store.storeCode} />
          <InfoRow label="区域" value={store.region} />
          <InfoRow label="城市" value={store.city} />
          <InfoRow label="详细地址" value={store.address} />
          <InfoRow label="店长姓名" value={store.managerName} />
          <InfoRow label="店长电话" value={store.managerMobile} />
          <InfoRow label="开业时间" value={store.createdAt} />
          <InfoRow label="最近巡检" value={store.lastInspection} />
        </div>
      </div>

      {/* Closure Bar */}
      <DetailClosureBar onBack={() => router.push('/stores')} />
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <span style={{ fontSize: 12, color: '#64748b', fontWeight: 500 }}>{label}</span>
      <span style={{ fontSize: 14, color: '#e2e8f0' }}>{value}</span>
    </div>
  );
}
