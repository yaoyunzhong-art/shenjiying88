'use client';

import React, { useState, useEffect } from 'react';
import { PageShell } from '@m5/ui';
import { MOCK_BLINDBOX_PLANS, MOCK_DRAW_HISTORY, formatDrawTime, type BlindBoxPlan, type BlindBoxDrawRecord } from './blindbox-data';
import { loadBlindBoxPlan, loadPrizePool, loadDrawHistory, postDraw, type DrawType } from './blindbox-service';

const TIER_COLORS: Record<string, string> = {
  '一等奖': '#eab308',
  '二等奖': '#a78bfa',
  '三等奖': '#38bdf8',
  '四等奖': '#94a3b8',
};

const TIER_GRADIENTS: Record<string, string> = {
  '一等奖': 'linear-gradient(90deg, #eab308, #fbbf24)',
  '二等奖': 'linear-gradient(90deg, #a78bfa, #c4b5fd)',
  '三等奖': 'linear-gradient(90deg, #38bdf8, #7dd3fc)',
  '四等奖': 'linear-gradient(90deg, #94a3b8, #cbd5e1)',
};

export default function BlindBoxShowcasePage() {
  const defaultPlan = MOCK_BLINDBOX_PLANS[0]?.planId ?? 'plan-energy-box';
  const [selectedPlanId, setSelectedPlanId] = useState<string>(defaultPlan);
  const [plan, setPlan] = useState<BlindBoxPlan | null>(null);
  const [prizes, setPrizes] = useState<Array<{ prizeId: string; name: string; stock: number }>>([]);
  const [history, setHistory] = useState<BlindBoxDrawRecord[]>(MOCK_DRAW_HISTORY);
  const [isDrawing, setIsDrawing] = useState(false);
  const [lastResult, setLastResult] = useState<BlindBoxDrawRecord | null>(null);

  useEffect(() => {
    loadBlindBoxPlan(selectedPlanId).then(p => {
      if (p) setPlan(p);
      else setPlan(MOCK_BLINDBOX_PLANS.find(x => x.planId === selectedPlanId) ?? null);
    });
    loadPrizePool(selectedPlanId).then(setPrizes);
    loadDrawHistory(selectedPlanId, undefined, 10).then(setHistory);
  }, [selectedPlanId]);

  async function handleDraw(drawType: DrawType) {
    if (isDrawing) return;
    setIsDrawing(true);
    setLastResult(null);
    try {
      const result = await postDraw(selectedPlanId, drawType);
      if (result.success && result.prize) {
        setLastResult(result.prize);
        setHistory(prev => [result.prize!, ...prev.slice(0, 9)]);
        loadPrizePool(selectedPlanId).then(setPrizes);
      }
    } finally {
      setIsDrawing(false);
    }
  }

  return (
    <PageShell title="盲盒抽奖" description="能量主题盲盒抽奖活动">
      {/* Plan Selector */}
      <div style={{ marginBottom: 24 }}>
        <label style={{ display: 'block', fontSize: 14, color: '#94a3b8', marginBottom: 8 }}>选择盲盒</label>
        <select
          value={selectedPlanId}
          onChange={e => setSelectedPlanId(e.target.value)}
          style={{
            padding: '10px 16px',
            fontSize: 14,
            borderRadius: 8,
            border: '1px solid rgba(148,163,184,0.2)',
            background: 'rgba(30,41,59,0.9)',
            color: '#e2e8f0',
            minWidth: 200,
          }}
        >
          {MOCK_BLINDBOX_PLANS.map(p => (
            <option key={p.planId} value={p.planId}>{p.name}</option>
          ))}
        </select>
      </div>

      {/* Probability Display Section */}
      <div style={{ background: 'rgba(30,41,59,0.9)', border: '1px solid rgba(148,163,184,0.12)', borderRadius: 12, padding: 24, marginBottom: 24 }}>
        <h2 style={{ fontSize: 16, fontWeight: 600, color: '#f8fafc', margin: '0 0 20px' }}>概率公示</h2>
        {plan?.tiers.map(tier => (
          <div key={tier.name} style={{ marginBottom: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
              <span style={{ fontSize: 14, color: '#e2e8f0', fontWeight: 500 }}>{tier.name}</span>
              <span style={{ fontSize: 14, color: TIER_COLORS[tier.name], fontWeight: 600 }}>
                {(tier.probability * 100).toFixed(2)}%
              </span>
            </div>
            <div style={{ height: 8, background: 'rgba(148,163,184,0.15)', borderRadius: 4, overflow: 'hidden' }}>
              <div style={{
                width: `${tier.probability * 100}%`,
                height: '100%',
                background: TIER_GRADIENTS[tier.name] ?? '#94a3b8',
                borderRadius: 4,
                transition: 'width 0.3s ease',
              }} />
            </div>
          </div>
        ))}
        {plan && (
          <p style={{ fontSize: 12, color: '#64748b', margin: '16px 0 0' }}>
            保底 {plan.guaranteePity} 次必中三等奖及以上
          </p>
        )}
      </div>

      {/* Prize Pool Section */}
      <div style={{ background: 'rgba(30,41,59,0.9)', border: '1px solid rgba(148,163,184,0.12)', borderRadius: 12, padding: 24, marginBottom: 24 }}>
        <h2 style={{ fontSize: 16, fontWeight: 600, color: '#f8fafc', margin: '0 0 20px' }}>奖池</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 12 }}>
          {prizes.map(prize => (
            <div key={prize.prizeId} style={{
              padding: 12,
              background: 'rgba(15,23,42,0.6)',
              borderRadius: 8,
              border: '1px solid rgba(148,163,184,0.1)',
            }}>
              <p style={{ fontSize: 14, color: '#e2e8f0', margin: '0 0 4px', fontWeight: 500 }}>{prize.name}</p>
              <p style={{ fontSize: 12, color: prize.stock > 0 ? '#22c55e' : '#ef4444', margin: 0 }}>
                {prize.stock > 0 ? `剩余 ${prize.stock}` : '已兑完'}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Draw Section */}
      <div style={{ background: 'rgba(30,41,59,0.9)', border: '1px solid rgba(148,163,184,0.12)', borderRadius: 12, padding: 24, marginBottom: 24 }}>
        <h2 style={{ fontSize: 16, fontWeight: 600, color: '#f8fafc', margin: '0 0 20px' }}>抽奖</h2>
        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
          <button
            onClick={() => handleDraw('single')}
            disabled={isDrawing}
            style={{
              padding: '14px 40px',
              fontSize: 16,
              fontWeight: 600,
              borderRadius: 8,
              border: 'none',
              background: 'linear-gradient(135deg, #3b82f6, #60a5fa)',
              color: '#ffffff',
              cursor: isDrawing ? 'not-allowed' : 'pointer',
              opacity: isDrawing ? 0.6 : 1,
              transition: 'all 0.2s ease',
              boxShadow: '0 4px 12px rgba(59,130,246,0.3)',
            }}
          >
            单抽
          </button>
          <button
            onClick={() => handleDraw('batch10')}
            disabled={isDrawing}
            style={{
              padding: '14px 40px',
              fontSize: 16,
              fontWeight: 600,
              borderRadius: 8,
              border: 'none',
              background: 'linear-gradient(135deg, #8b5cf6, #a78bfa)',
              color: '#ffffff',
              cursor: isDrawing ? 'not-allowed' : 'pointer',
              opacity: isDrawing ? 0.6 : 1,
              transition: 'all 0.2s ease',
              boxShadow: '0 4px 12px rgba(139,92,246,0.3)',
            }}
          >
            十连
          </button>
        </div>
        {lastResult && (
          <div style={{
            marginTop: 20,
            padding: 16,
            background: 'rgba(15,23,42,0.8)',
            borderRadius: 8,
            border: `2px solid ${TIER_COLORS[lastResult.tier] ?? '#94a3b8'}`,
          }}>
            <p style={{ fontSize: 14, color: '#94a3b8', margin: '0 0 4px' }}>恭喜获得</p>
            <p style={{ fontSize: 18, fontWeight: 700, color: TIER_COLORS[lastResult.tier], margin: 0 }}>
              [{lastResult.tier}] {lastResult.prizeName}
            </p>
          </div>
        )}
      </div>

      {/* Draw History Section */}
      <div style={{ background: 'rgba(30,41,59,0.9)', border: '1px solid rgba(148,163,184,0.12)', borderRadius: 12, padding: 24 }}>
        <h2 style={{ fontSize: 16, fontWeight: 600, color: '#f8fafc', margin: '0 0 20px' }}>抽奖记录</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {history.map(record => (
            <div key={record.recordId} style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              padding: '10px 14px',
              background: 'rgba(15,23,42,0.6)',
              borderRadius: 8,
            }}>
              <span style={{
                padding: '4px 10px',
                fontSize: 12,
                fontWeight: 600,
                borderRadius: 4,
                background: TIER_COLORS[record.tier] ?? '#94a3b8',
                color: record.tier === '一等奖' || record.tier === '二等奖' ? '#0f172a' : '#ffffff',
              }}>
                {record.tier}
              </span>
              <span style={{ flex: 1, fontSize: 14, color: '#e2e8f0' }}>{record.prizeName}</span>
              <span style={{ fontSize: 12, color: '#64748b' }}>{formatDrawTime(record.createdAt)}</span>
            </div>
          ))}
        </div>
      </div>
    </PageShell>
  );
}
