'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, useParams } from 'next/navigation';
import { PageShell, StatusBadge } from '@m5/ui';
import { storeService, type Store } from '../../../lib/store-service';

export default function StoreDetailPage() {
  const router = useRouter();
  const params = useParams();
  const storeId = params.id as string;

  const [store, setStore] = useState<Store | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 检查登录状态
    const token = localStorage.getItem('enterprise_access_token');
    if (!token) {
      router.push('/enterprise/login');
      return;
    }
    fetchStore();
  }, [router, storeId]);

  async function fetchStore() {
    setLoading(true);
    try {
      const result = await storeService.getStore(storeId);
      if (result.success && result.data) {
        setStore(result.data);
      }
    } finally {
      setLoading(false);
    }
  }

  function getStatusVariant(status: Store['status']): 'success' | 'warning' | 'error' {
    switch (status) {
      case 'active':
        return 'success';
      case 'inactive':
        return 'warning';
      case 'suspended':
        return 'error';
      default:
        return 'warning';
    }
  }

  function getStatusLabel(status: Store['status']): string {
    switch (status) {
      case 'active':
        return '营业中';
      case 'inactive':
        return '休息中';
      case 'suspended':
        return '已停业';
      default:
        return status;
    }
  }

  if (loading) {
    return (
      <main style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', background: '#0f172a' }}>
        <div style={{ color: '#94a3b8', fontSize: 14 }}>加载中...</div>
      </main>
    );
  }

  if (!store) {
    return (
      <main style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', background: '#0f172a' }}>
        <div style={{ color: '#94a3b8', fontSize: 14 }}>门店不存在</div>
      </main>
    );
  }

  return (
    <PageShell
      title={store.storeName}
      subtitle={`门店编号: ${store.storeCode}`}
      actions={
        <div style={{ display: 'flex', gap: 12 }}>
          <Link
            href="/stores"
            style={{
              padding: '10px 20px',
              borderRadius: 8,
              background: 'rgba(148, 163, 184, 0.1)',
              border: '1px solid rgba(148, 163, 184, 0.2)',
              color: '#94a3b8',
              fontSize: 14,
              textDecoration: 'none',
            }}
          >
            返回列表
          </Link>
          <button
            style={{
              padding: '10px 20px',
              borderRadius: 8,
              background: 'rgba(102, 126, 234, 0.2)',
              border: '1px solid rgba(102, 126, 234, 0.4)',
              color: '#a5b4fc',
              fontSize: 14,
              cursor: 'pointer',
            }}
          >
            编辑门店
          </button>
        </div>
      }
    >
      {/* 门店状态 */}
      <div style={{ marginBottom: 24, display: 'flex', alignItems: 'center', gap: 16 }}>
        <StatusBadge label={getStatusLabel(store.status)} variant={getStatusVariant(store.status)} size="md" />
        <span style={{ fontSize: 13, color: '#94a3b8' }}>
          创建于 {new Date(store.createdAt).toLocaleDateString('zh-CN')}
        </span>
      </div>

      {/* 基本信息 */}
      <div style={{ background: 'rgba(15, 23, 42, 0.5)', border: '1px solid rgba(148, 163, 184, 0.12)', borderRadius: 12, padding: 24, marginBottom: 24 }}>
        <h2 style={{ fontSize: 16, fontWeight: 600, color: '#f8fafc', margin: '0 0 20px' }}>基本信息</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 20 }}>
          <div>
            <div style={{ fontSize: 13, color: '#94a3b8', marginBottom: 4 }}>门店编号</div>
            <div style={{ fontSize: 14, color: '#f8fafc', fontFamily: 'monospace' }}>{store.storeCode}</div>
          </div>
          <div>
            <div style={{ fontSize: 13, color: '#94a3b8', marginBottom: 4 }}>门店名称</div>
            <div style={{ fontSize: 14, color: '#f8fafc' }}>{store.storeName}</div>
          </div>
          <div>
            <div style={{ fontSize: 13, color: '#94a3b8', marginBottom: 4 }}>所属地区</div>
            <div style={{ fontSize: 14, color: '#f8fafc' }}>{store.region || '-'}</div>
          </div>
          <div>
            <div style={{ fontSize: 13, color: '#94a3b8', marginBottom: 4 }}>城市</div>
            <div style={{ fontSize: 14, color: '#f8fafc' }}>{store.city || '-'}</div>
          </div>
          <div style={{ gridColumn: '1 / -1' }}>
            <div style={{ fontSize: 13, color: '#94a3b8', marginBottom: 4 }}>详细地址</div>
            <div style={{ fontSize: 14, color: '#f8fafc' }}>{store.address || '-'}</div>
          </div>
        </div>
      </div>

      {/* 联系人信息 */}
      <div style={{ background: 'rgba(15, 23, 42, 0.5)', border: '1px solid rgba(148, 163, 184, 0.12)', borderRadius: 12, padding: 24, marginBottom: 24 }}>
        <h2 style={{ fontSize: 16, fontWeight: 600, color: '#f8fafc', margin: '0 0 20px' }}>联系人信息</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 20 }}>
          <div>
            <div style={{ fontSize: 13, color: '#94a3b8', marginBottom: 4 }}>店长姓名</div>
            <div style={{ fontSize: 14, color: '#f8fafc' }}>{store.managerName || '-'}</div>
          </div>
          <div>
            <div style={{ fontSize: 13, color: '#94a3b8', marginBottom: 4 }}>联系电话</div>
            <div style={{ fontSize: 14, color: '#f8fafc' }}>{store.managerMobile || '-'}</div>
          </div>
        </div>
      </div>

      {/* 运营数据 */}
      <div style={{ background: 'rgba(15, 23, 42, 0.5)', border: '1px solid rgba(148, 163, 184, 0.12)', borderRadius: 12, padding: 24 }}>
        <h2 style={{ fontSize: 16, fontWeight: 600, color: '#f8fafc', margin: '0 0 20px' }}>运营数据</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20 }}>
          <div style={{ textAlign: 'center', padding: 20, background: 'rgba(102, 126, 234, 0.1)', borderRadius: 8 }}>
            <div style={{ fontSize: 32, fontWeight: 700, color: '#a5b4fc', marginBottom: 4 }}>{store.employeeCount}</div>
            <div style={{ fontSize: 13, color: '#94a3b8' }}>员工总数</div>
          </div>
          <div style={{ textAlign: 'center', padding: 20, background: 'rgba(34, 197, 94, 0.1)', borderRadius: 8 }}>
            <div style={{ fontSize: 32, fontWeight: 700, color: '#86efac', marginBottom: 4 }}>0</div>
            <div style={{ fontSize: 13, color: '#94a3b8' }}>今日订单</div>
          </div>
          <div style={{ textAlign: 'center', padding: 20, background: 'rgba(249, 115, 22, 0.1)', borderRadius: 8 }}>
            <div style={{ fontSize: 32, fontWeight: 700, color: '#fdba74', marginBottom: 4 }}>¥0</div>
            <div style={{ fontSize: 13, color: '#94a3b8' }}>今日营收</div>
          </div>
        </div>
      </div>
    </PageShell>
  );
}
