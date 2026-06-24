'use client';

import Link from 'next/link';
import React, { Suspense, useState, useMemo, useEffect } from 'react';
import { PageShell, StatCard, StatusBadge, LoadingSkeleton, SearchFilterInput } from '@m5/ui';
import { StoreShowcaseClient } from './components/store-showcase-client';
import { loadStorefrontHomeSnapshot } from './storefront-home-view-model';

export default function StorefrontDashboard() {
  const [searchTerm, setSearchTerm] = useState('');
  const [snapshot, setSnapshot] = useState<Awaited<ReturnType<typeof loadStorefrontHomeSnapshot>>>({
    deliveryMode: 'fallback',
    stats: [],
    alerts: [],
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let disposed = false;

    async function hydrateHome() {
      try {
        const nextSnapshot = await loadStorefrontHomeSnapshot();
        if (!disposed) {
          setSnapshot(nextSnapshot);
        }
      } finally {
        if (!disposed) {
          setIsLoading(false);
        }
      }
    }

    void hydrateHome();

    return () => {
      disposed = true;
    };
  }, []);

  const filteredAlerts = useMemo(() => {
    if (!searchTerm.trim()) return snapshot.alerts;
    const lower = searchTerm.toLowerCase();
    return snapshot.alerts.filter(
      (a) =>
        a.title.toLowerCase().includes(lower) ||
        a.severity.toLowerCase().includes(lower) ||
        a.status.toLowerCase().includes(lower)
    );
  }, [searchTerm, snapshot.alerts]);
  return (
    <PageShell
      title="Storefront Dashboard"
      description={`Foundation alert & runtime operation overview · 当前数据源：${
        snapshot.deliveryMode === 'api' ? 'foundation overview' : 'fallback'
      }`}
      actions={
        <Link
          href="/alerts"
          style={{
            padding: '8px 16px', fontSize: 13, borderRadius: 8,
            border: '1px solid rgba(99,102,241,0.4)', background: 'rgba(99,102,241,0.12)',
            color: '#a5b4fc', textDecoration: 'none', fontWeight: 500,
          }}
        >
          View All Alerts &rarr;
        </Link>
      }
    >
      {isLoading ? (
        <div
          style={{
            marginBottom: 16,
            borderRadius: 12,
            padding: '12px 14px',
            border: '1px solid rgba(148,163,184,0.18)',
            background: 'rgba(15,23,42,0.35)',
            color: '#cbd5e1',
            fontSize: 13,
          }}
        >
          正在同步真实 Foundation 概览...
        </div>
      ) : null}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 16, marginBottom: 24 }}>
        {snapshot.stats.map((s) => (
          <StatCard key={s.label} label={s.label} value={s.value} variant={s.variant} />
        ))}
      </div>

      <div style={{ background: 'rgba(15,23,42,0.5)', border: '1px solid rgba(148,163,184,0.12)', borderRadius: 12, padding: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600, color: '#e2e8f0' }}>Recent Alerts</h3>
          <SearchFilterInput
            value={searchTerm}
            onChange={setSearchTerm}
            placeholder="搜索告警..."
          />
        </div>
        {filteredAlerts.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 32, color: '#64748b', fontSize: 14 }}>
            {searchTerm.trim() ? `未找到匹配 "${searchTerm}" 的告警` : '暂无告警'}
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {filteredAlerts.map((a) => (
              <div key={a.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', borderRadius: 8, background: 'rgba(30,41,59,0.5)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <StatusBadge
                    label={a.severity === 'error' ? 'Error' : 'Warning'}
                    variant={a.severity === 'error' ? 'error' : 'warning'}
                    size="sm"
                  />
                  <Link href={`/alerts/${a.id}`} style={{ color: '#e2e8f0', textDecoration: 'none', fontWeight: 500, fontSize: 14 }}>
                    {a.title}
                  </Link>
                </div>
                <span style={{ color: '#64748b', fontSize: 12 }}>{a.time}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 门店产品服务展示 */}
      <Suspense fallback={<LoadingSkeleton variant="card" rows={4} label="加载门店产品服务展示..." />}>
        <StoreShowcaseClient storeName="Demo Store 旗舰店" />
      </Suspense>
    </PageShell>
  );
}
