/**
 * 配送追踪 — Delivery Tracking (storefront-web)
 * 增强: 模拟API加载(loading/error/empty三态) + 集成DeliveryTrackingClient
 */
'use client';

import React, { useState, useEffect } from 'react';
import { DeliveryTrackingClient } from './components/DeliveryTrackingClient';

/* ── Simulated API loading ── */
function simulateLoad(): Promise<boolean> {
  return new Promise((resolve) => {
    setTimeout(() => resolve(true), 500 + Math.random() * 500);
  });
}

/* ── Component ── */
export default function DeliveryTrackingPage() {
  const [ready, setReady] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    simulateLoad().then(() => {
      if (!cancelled) {
        setReady(true);
        setLoading(false);
      }
    }).catch((err) => {
      if (!cancelled) {
        setError(err?.message ?? '初始化失败');
        setLoading(false);
      }
    });
    return () => { cancelled = true; };
  }, []);

  /* ── Loading skeleton ── */
  if (loading) {
    return (
      <main style={{ minHeight: '100vh', padding: '24px 16px', background: '#0f172a' }}>
        <div style={{ maxWidth: 640, margin: '0 auto' }}>
          <div style={{ height: 28, width: 140, borderRadius: 8, background: 'rgba(148,163,184,0.12)', marginBottom: 8 }} />
          <div style={{ height: 14, width: 200, borderRadius: 6, background: 'rgba(148,163,184,0.06)', marginBottom: 20 }} />
          <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
            <div style={{ flex: 1, height: 36, borderRadius: 6, background: 'rgba(148,163,184,0.08)' }} />
            <div style={{ width: 80, height: 36, borderRadius: 6, background: 'rgba(148,163,184,0.08)' }} />
          </div>
          <div style={{ padding: '16px 20px', borderRadius: 14, background: 'rgba(30,41,59,0.8)', border: '1px solid rgba(148,163,184,0.12)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
              <div style={{ height: 16, width: '40%', borderRadius: 6, background: 'rgba(148,163,184,0.1)' }} />
              <div style={{ height: 16, width: 60, borderRadius: 6, background: 'rgba(148,163,184,0.08)' }} />
            </div>
            <div style={{ height: 14, width: '60%', borderRadius: 6, background: 'rgba(148,163,184,0.06)', marginBottom: 6 }} />
            <div style={{ display: 'flex', gap: 8 }}>
              {[1, 2, 3].map((i) => (
                <div key={i} style={{ width: 20, height: 20, borderRadius: '50%', background: 'rgba(148,163,184,0.08)' }} />
              ))}
            </div>
          </div>
        </div>
      </main>
    );
  }

  /* ── Error state ── */
  if (error) {
    return (
      <main style={{ minHeight: '100vh', padding: '24px 16px', background: '#0f172a' }}>
        <div style={{ maxWidth: 600, margin: '0 auto', textAlign: 'center', paddingTop: 80 }}>
          <div style={{ fontSize: 48, marginBottom: 16, opacity: 0.6 }}>🚚</div>
          <div style={{ color: '#f87171', fontSize: 18, fontWeight: 600, marginBottom: 8 }}>配送系统加载失败</div>
          <div style={{ color: '#64748b', fontSize: 14, marginBottom: 20 }}>{error}</div>
          <button
            onClick={() => window.location.reload()}
            style={{
              padding: '10px 24px',
              borderRadius: 10,
              border: 'none',
              background: '#3b82f6',
              color: '#fff',
              fontSize: 14,
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            重新加载
          </button>
        </div>
      </main>
    );
  }

  /* ── Ready: render DeliveryTrackingClient ── */
  if (!ready) return null;

  return (
    <main style={{ minHeight: '100vh', background: '#0f172a' }}>
      <DeliveryTrackingClient />
    </main>
  );
}
