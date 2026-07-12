/**
 * 门店评分 — Store Ratings (storefront-web)
 * 角色: 顾客
 * 功能: 门店评分查看
 */
'use client';

import React from 'react';

export default function StoreRatingsPage() {
  return (
    <main style={{ minHeight: '100vh', padding: '24px 16px', background: '#0f172a' }}>
      <div style={{ maxWidth: 600, margin: '0 auto' }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: '#f8fafc', marginBottom: 20 }}>门店评分</h1>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {[
            { name: '环境', score: 4.8 },
            { name: '服务', score: 4.6 },
            { name: '设备', score: 4.7 },
            { name: '性价比', score: 4.5 },
            { name: '综合', score: 4.7 },
          ].map(item => (
            <div key={item.name} style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              padding: '16px 20px', borderRadius: 14,
              background: 'rgba(30,41,59,0.8)', border: '1px solid rgba(148,163,184,0.12)',
            }}>
              <span style={{ color: '#e2e8f0', fontSize: 15 }}>{item.name}</span>
              <span style={{ color: '#fbbf24', fontSize: 20, fontWeight: 700 }}>⭐ {item.score}</span>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
