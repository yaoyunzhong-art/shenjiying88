'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { MemberTierDistribution } from '@m5/ui';
import type { MemberTier } from '@m5/ui';

// ─── 模拟数据 ──────────────────────────────────────────

const MOCK_TIERS: MemberTier[] = [
  { tier: '钻石会员', key: 'diamond', count: 128, growth: 0.12 },
  { tier: '黄金会员', key: 'gold', count: 450, growth: 0.05 },
  { tier: '白银会员', key: 'silver', count: 620, growth: -0.03 },
  { tier: '青铜会员', key: 'bronze', count: 890, growth: 0.01 },
  { tier: '铂金会员', key: 'platinum', count: 76, growth: 0.18 },
  { tier: '普通会员', key: 'regular', count: 2340, growth: -0.08 },
];

// ─── 页面组件 ─────────────────────────────────────────

export default function MemberTiersPage() {
  // 三态条件渲染
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => { setLoading(false) }, []);
  if (loading) return <div>加载中...</div>;
  if (error) return <div>数据获取失败: {error}</div>;
  if (!MOCK_TIERS || MOCK_TIERS.length === 0) return <div>暂无数据</div>;

  const [showTrends, setShowTrends] = useState(true);
  const [selectedTier, setSelectedTier] = useState<MemberTier | null>(null);

  // 筛选逻辑
  const filteredTiers = useMemo(() => {
    if (!selectedTier) return MOCK_TIERS;
    return MOCK_TIERS.filter((t) => t.key === selectedTier.key);
  }, [selectedTier]);

  const handleTierClick = (tier: MemberTier) => {
    setSelectedTier((prev) =>
      prev?.key === tier.key ? null : tier,
    );
  };

  return (
    <div style={{ padding: 24, background: '#0f172a', minHeight: '100vh' }}>
      {/* 页面标题 */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 24,
        }}
      >
        <div>
          <h1
            style={{
              fontSize: 20,
              fontWeight: 600,
              color: '#e2e8f0',
              margin: 0,
            }}
          >
            会员等级分布
          </h1>
          <p style={{ fontSize: 13, color: '#64748b', margin: '4px 0 0 0' }}>
            查看各等级会员的人数、占比和环比趋势
          </p>
        </div>

        {/* 趋势切换 */}
        <label
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            fontSize: 13,
            color: '#94a3b8',
            cursor: 'pointer',
          }}
        >
          <input
            type="checkbox"
            checked={showTrends}
            onChange={(e) => setShowTrends(e.target.checked)}
            style={{ accentColor: '#3b82f6' }}
          />
          显示趋势
        </label>
      </div>

      {/* 等级分布组件 */}
      <MemberTierDistribution
        tiers={filteredTiers}
        showTrends={showTrends}
        showTotal
        onTierClick={handleTierClick}
        width={520}
      />

      {/* 已选等级详情 */}
      {selectedTier && (
        <div
          style={{
            marginTop: 16,
            padding: 16,
            borderRadius: 12,
            background: 'rgba(59, 130, 246, 0.08)',
            border: '1px solid rgba(59, 130, 246, 0.2)',
          }}
        >
          <span style={{ fontSize: 13, fontWeight: 600, color: '#93c5fd' }}>
            📊 {selectedTier.tier} 等级详情
          </span>
          <div
            style={{
              display: 'flex',
              gap: 24,
              marginTop: 12,
              fontSize: 13,
              color: '#cbd5e1',
            }}
          >
            <div>
              人数：<strong>{selectedTier.count.toLocaleString()}</strong>
            </div>
            <div>
              占比：
              <strong>
                {(
                  (selectedTier.count /
                    MOCK_TIERS.reduce((s, t) => s + t.count, 0)) *
                  100
                ).toFixed(1)}
                %
              </strong>
            </div>
            {selectedTier.growth != null && (
              <div>
                环比：
                <strong style={{ color: selectedTier.growth >= 0 ? '#22c55e' : '#ef4444' }}>
                  {selectedTier.growth >= 0 ? '+' : ''}
                  {(selectedTier.growth * 100).toFixed(1)}%
                </strong>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 操作提示 */}
      <p
        style={{
          marginTop: 16,
          fontSize: 12,
          color: '#475569',
          textAlign: 'center',
        }}
      >
        点击等级卡片可查看详情，再次点击取消筛选
      </p>
    </div>
  );
}
