'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { PageShell, StatusBadge } from '@m5/ui';
import { storeService, type Store } from '../../lib/store-service';

export default function StoresPage() {
  const router = useRouter();
  const [stores, setStores] = useState<Store[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [keyword, setKeyword] = useState('');
  const [page, setPage] = useState(1);
  const pageSize = 10;

  useEffect(() => {
    // 检查登录状态
    const token = localStorage.getItem('enterprise_access_token');
    if (!token) {
      router.push('/enterprise/login');
      return;
    }
    fetchStores();
  }, [router, page, keyword]);

  async function fetchStores() {
    setLoading(true);
    try {
      const result = await storeService.listStores({
        page,
        pageSize,
        keyword: keyword || undefined,
      });

      if (result.success && result.data) {
        setStores(result.data.stores);
        setTotal(result.data.total);
      }
    } finally {
      setLoading(false);
    }
  }

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    setPage(1);
    fetchStores();
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

  return (
    <PageShell
      title="门店管理"
      subtitle={`共 ${total} 家门店`}
      actions={
        <Link
          href="/stores/new"
          style={{
            padding: '10px 20px',
            borderRadius: 8,
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            border: 'none',
            color: '#fff',
            fontSize: 14,
            fontWeight: 500,
            cursor: 'pointer',
            textDecoration: 'none',
          }}
        >
          + 添加门店
        </Link>
      }
    >
      {/* 搜索栏 */}
      <div style={{ marginBottom: 24 }}>
        <form onSubmit={handleSearch} style={{ display: 'flex', gap: 12 }}>
          <input
            type="text"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            placeholder="搜索门店名称、编号或地址..."
            style={{
              flex: 1,
              padding: '10px 14px',
              borderRadius: 8,
              background: 'rgba(15, 23, 42, 0.6)',
              border: '1px solid rgba(148, 163, 184, 0.2)',
              color: '#f8fafc',
              fontSize: 14,
              outline: 'none',
            }}
          />
          <button
            type="submit"
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
            搜索
          </button>
        </form>
      </div>

      {/* 门店列表 */}
      <div style={{ background: 'rgba(15, 23, 42, 0.5)', border: '1px solid rgba(148, 163, 184, 0.12)', borderRadius: 12, overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: 48, textAlign: 'center', color: '#94a3b8' }}>加载中...</div>
        ) : stores.length === 0 ? (
          <div style={{ padding: 48, textAlign: 'center', color: '#94a3b8' }}>暂无门店数据</div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: 'rgba(15, 23, 42, 0.8)', borderBottom: '1px solid rgba(148, 163, 184, 0.12)' }}>
                <th style={{ padding: '14px 16px', textAlign: 'left', fontSize: 13, fontWeight: 500, color: '#94a3b8' }}>门店编号</th>
                <th style={{ padding: '14px 16px', textAlign: 'left', fontSize: 13, fontWeight: 500, color: '#94a3b8' }}>门店名称</th>
                <th style={{ padding: '14px 16px', textAlign: 'left', fontSize: 13, fontWeight: 500, color: '#94a3b8' }}>地区/城市</th>
                <th style={{ padding: '14px 16px', textAlign: 'left', fontSize: 13, fontWeight: 500, color: '#94a3b8' }}>店长</th>
                <th style={{ padding: '14px 16px', textAlign: 'center', fontSize: 13, fontWeight: 500, color: '#94a3b8' }}>员工数</th>
                <th style={{ padding: '14px 16px', textAlign: 'center', fontSize: 13, fontWeight: 500, color: '#94a3b8' }}>状态</th>
                <th style={{ padding: '14px 16px', textAlign: 'right', fontSize: 13, fontWeight: 500, color: '#94a3b8' }}>操作</th>
              </tr>
            </thead>
            <tbody>
              {stores.map((store, index) => (
                <tr
                  key={store.id}
                  style={{
                    borderBottom: index < stores.length - 1 ? '1px solid rgba(148, 163, 184, 0.08)' : 'none',
                    transition: 'background 0.15s',
                  }}
                >
                  <td style={{ padding: '16px', fontSize: 13, color: '#94a3b8', fontFamily: 'monospace' }}>{store.storeCode}</td>
                  <td style={{ padding: '16px' }}>
                    <div style={{ fontSize: 14, color: '#f8fafc', fontWeight: 500 }}>{store.storeName}</div>
                    <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>{store.address}</div>
                  </td>
                  <td style={{ padding: '16px', fontSize: 13, color: '#cbd5e1' }}>{store.region} / {store.city}</td>
                  <td style={{ padding: '16px', fontSize: 13, color: '#cbd5e1' }}>
                    <div>{store.managerName}</div>
                    <div style={{ color: '#64748b', fontSize: 12 }}>{store.managerMobile}</div>
                  </td>
                  <td style={{ padding: '16px', textAlign: 'center', fontSize: 13, color: '#cbd5e1' }}>{store.employeeCount}</td>
                  <td style={{ padding: '16px', textAlign: 'center' }}>
                    <StatusBadge label={getStatusLabel(store.status)} variant={getStatusVariant(store.status)} size="sm" />
                  </td>
                  <td style={{ padding: '16px', textAlign: 'right' }}>
                    <Link
                      href={`/stores/${store.id}`}
                      style={{ fontSize: 13, color: '#667eea', textDecoration: 'none' }}
                    >
                      查看详情
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* 分页 */}
      {total > pageSize && (
        <div style={{ marginTop: 20, display: 'flex', justifyContent: 'center', gap: 8 }}>
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            style={{
              padding: '8px 16px',
              borderRadius: 6,
              background: page === 1 ? 'rgba(148, 163, 184, 0.1)' : 'rgba(102, 126, 234, 0.2)',
              border: '1px solid rgba(148, 163, 184, 0.2)',
              color: page === 1 ? '#64748b' : '#a5b4fc',
              fontSize: 13,
              cursor: page === 1 ? 'not-allowed' : 'pointer',
            }}
          >
            上一页
          </button>
          <span style={{ padding: '8px 16px', fontSize: 13, color: '#94a3b8' }}>
            第 {page} / {Math.ceil(total / pageSize)} 页
          </span>
          <button
            onClick={() => setPage((p) => p + 1)}
            disabled={page >= Math.ceil(total / pageSize)}
            style={{
              padding: '8px 16px',
              borderRadius: 6,
              background: page >= Math.ceil(total / pageSize) ? 'rgba(148, 163, 184, 0.1)' : 'rgba(102, 126, 234, 0.2)',
              border: '1px solid rgba(148, 163, 184, 0.2)',
              color: page >= Math.ceil(total / pageSize) ? '#64748b' : '#a5b4fc',
              fontSize: 13,
              cursor: page >= Math.ceil(total / pageSize) ? 'not-allowed' : 'pointer',
            }}
          >
            下一页
          </button>
        </div>
      )}
    </PageShell>
  );
}
