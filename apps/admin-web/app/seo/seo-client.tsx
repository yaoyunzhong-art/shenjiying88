'use client';

import { useCallback, useMemo, useState, useTransition } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';

import type { SeoModuleLink, SeoSnapshotDelivery } from './seo-data';

function healthColor(score: number) {
  if (score >= 80) return '#16a34a';
  if (score >= 60) return '#f59e0b';
  return '#ef4444';
}

export default function SeoClient({
  snapshot,
}: {
  snapshot: SeoSnapshotDelivery;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isRefreshing, startRefresh] = useTransition();
  const [keyword, setKeyword] = useState('');
  const [selectedModuleId, setSelectedModuleId] = useState(snapshot.modules[0]?.id ?? '');

  const refreshSnapshot = useCallback(() => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('tenantId', snapshot.tenantId);
    startRefresh(() => {
      router.replace(`${pathname}?${params.toString()}`);
      router.refresh();
    });
  }, [pathname, router, searchParams, snapshot.tenantId, startRefresh]);

  const filteredModules = useMemo(() => {
    return snapshot.modules.filter((item) => {
      return !keyword || item.title.includes(keyword) || item.summary.includes(keyword) || item.owner.includes(keyword);
    });
  }, [keyword, snapshot.modules]);

  const selectedModule: SeoModuleLink | null =
    filteredModules.find((item) => item.id === selectedModuleId) ??
    snapshot.modules.find((item) => item.id === selectedModuleId) ??
    filteredModules[0] ??
    snapshot.modules[0] ??
    null;

  return (
    <div style={{ display: 'grid', gap: 16, color: '#0f172a' }}>
      <div style={{ borderRadius: 16, border: '1px solid #e2e8f0', background: '#fff', padding: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, alignItems: 'center' }}>
          <div>
            <h1 style={{ margin: 0, fontSize: 28 }}>SEO 工作台</h1>
            <p style={{ margin: '6px 0 0', color: '#64748b' }}>
              tenant {snapshot.tenantId} / 最后更新时间 {snapshot.stats.lastUpdated}
            </p>
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                borderRadius: 999,
                padding: '6px 12px',
                color: '#fff',
                background: healthColor(snapshot.stats.healthScore),
              }}
            >
              健康度 {snapshot.stats.healthScore}
            </span>
            <button
              type="button"
              onClick={refreshSnapshot}
              style={{
                padding: '10px 14px',
                borderRadius: 10,
                border: 'none',
                background: '#2563eb',
                color: '#fff',
                cursor: 'pointer',
              }}
            >
              {isRefreshing ? '刷新中...' : '刷新快照'}
            </button>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gap: 16, gridTemplateColumns: 'repeat(6, minmax(0, 1fr))' }}>
        {[
          { label: '元数据', value: String(snapshot.stats.totalMetadata) },
          { label: 'Sitemap', value: String(snapshot.stats.totalSitemaps) },
          { label: 'GEO 标签', value: String(snapshot.stats.totalGeos) },
          { label: '已优化页', value: String(snapshot.stats.pagesOptimized) },
          { label: '待优化页', value: String(snapshot.stats.pagesPending) },
          { label: '健康分', value: String(snapshot.stats.healthScore) },
        ].map((item) => (
          <div key={item.label} style={{ borderRadius: 16, border: '1px solid #e2e8f0', background: '#fff', padding: 16 }}>
            <div style={{ color: '#64748b', fontSize: 13 }}>{item.label}</div>
            <div style={{ marginTop: 8, fontSize: 24, fontWeight: 700 }}>{item.value}</div>
          </div>
        ))}
      </div>

      <div style={{ borderRadius: 16, border: '1px solid #e2e8f0', background: '#fff', padding: 16 }}>
        <input
          value={keyword}
          onChange={(event) => setKeyword(event.target.value)}
          placeholder="搜索模块 / 摘要 / 负责人"
          style={{ width: '100%', padding: '10px 12px', borderRadius: 10, border: '1px solid #cbd5e1' }}
        />
        <div style={{ display: 'grid', gap: 16, gridTemplateColumns: '1fr 1fr', marginTop: 16 }}>
          <div style={{ display: 'grid', gap: 12 }}>
            {filteredModules.map((module) => (
              <div
                key={module.id}
                style={{ borderRadius: 14, border: '1px solid #e2e8f0', padding: 14, background: '#f8fafc' }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
                  <div>
                    <div style={{ fontSize: 17, fontWeight: 700 }}>{module.title}</div>
                    <div style={{ marginTop: 4, color: '#64748b', fontSize: 13 }}>{module.owner}</div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSelectedModuleId(module.id)}
                    style={{
                      padding: '8px 12px',
                      borderRadius: 8,
                      border: '1px solid #cbd5e1',
                      background: '#fff',
                      cursor: 'pointer',
                    }}
                  >
                    选中
                  </button>
                </div>
                <p style={{ margin: '10px 0 0', color: '#475569' }}>{module.summary}</p>
              </div>
            ))}
          </div>

          <div style={{ borderRadius: 16, background: '#0f172a', color: '#e2e8f0', padding: 16 }}>
            <h2 style={{ marginTop: 0, color: '#f8fafc' }}>模块详情</h2>
            {selectedModule ? (
              <>
                <div style={{ fontSize: 20, fontWeight: 700 }}>{selectedModule.title}</div>
                <div style={{ marginTop: 8, color: '#94a3b8' }}>{selectedModule.summary}</div>
                <div style={{ marginTop: 12, color: '#94a3b8', fontSize: 13 }}>负责人: {selectedModule.owner}</div>
                <a href={selectedModule.href} style={{ display: 'inline-block', marginTop: 16, color: '#38bdf8', textDecoration: 'none' }}>
                  打开模块页面
                </a>
              </>
            ) : (
              <div>暂无模块。</div>
            )}
            <div style={{ marginTop: 24 }}>
              <h3 style={{ margin: 0, color: '#f8fafc' }}>优化建议</h3>
              <ul style={{ margin: '12px 0 0', paddingLeft: 18, color: '#cbd5e1' }}>
                {snapshot.suggestions.map((item) => (
                  <li key={item} style={{ marginTop: 8 }}>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
