/**
 * 运营管理 — Operations (storefront-web)
 */
'use client';
import React from 'react';
export default function OperationsPage() {
  return (
    <main style={{ minHeight: '100vh', padding: '24px 16px', background: '#0f172a' }}>
      <div style={{ maxWidth: 600, margin: '0 auto' }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: '#f8fafc', marginBottom: 20 }}>运营管理</h1>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          {[
            { icon: '📊', label: '运营日报', desc: '查看今日运营数据' },
            { icon: '🎯', label: '目标管理', desc: '门店KPI追踪' },
            { icon: '📋', label: '检查清单', desc: '每日巡检事项' },
            { icon: '📈', label: '数据洞察', desc: '趋势分析' },
          ].map((item, i) => (
            <div key={i} style={{ padding: '20px 16px', borderRadius: 14, background: 'rgba(30,41,59,0.8)', border: '1px solid rgba(148,163,184,0.12)', textAlign: 'center', cursor: 'pointer' }}>
              <div style={{ fontSize: 28, marginBottom: 8 }}>{item.icon}</div>
              <div style={{ color: '#f8fafc', fontWeight: 600, fontSize: 15 }}>{item.label}</div>
              <div style={{ color: '#64748b', fontSize: 12, marginTop: 4 }}>{item.desc}</div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
