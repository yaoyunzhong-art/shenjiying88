/**
 * 积分历史 — Point History (storefront-web)
 */
'use client';
import React from 'react';
export default function PointHistoryPage() {
  const records = [
    { date: '2026-07-12', desc: '消费获得', points: '+168', type: 'earn' },
    { date: '2026-07-11', desc: '积分兑换优惠券', points: '-200', type: 'spend' },
    { date: '2026-07-10', desc: '消费获得', points: '+85', type: 'earn' },
    { date: '2026-07-08', desc: '生日赠送', points: '+500', type: 'earn' },
    { date: '2026-07-05', desc: '兑换礼品', points: '-150', type: 'spend' },
  ];
  return (
    <main style={{ minHeight: '100vh', padding: '24px 16px', background: '#0f172a' }}>
      <div style={{ maxWidth: 600, margin: '0 auto' }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: '#f8fafc', marginBottom: 20 }}>积分历史</h1>
        <div style={{ fontSize: 36, fontWeight: 700, color: '#fbbf24', textAlign: 'center', marginBottom: 20 }}>1,168</div>
        {records.map((r, i) => (
          <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 16px', borderRadius: 10, marginBottom: 6, background: 'rgba(30,41,59,0.6)', border: '1px solid rgba(148,163,184,0.08)' }}>
            <div><div style={{ color: '#e2e8f0', fontSize: 14 }}>{r.desc}</div><div style={{ color: '#64748b', fontSize: 11 }}>{r.date}</div></div>
            <span style={{ color: r.type === 'earn' ? '#34d399' : '#f87171', fontWeight: 700, fontSize: 16 }}>{r.points}</span>
          </div>
        ))}
      </div>
    </main>
  );
}
