/**
 * H5积分页面 - Points Page (H5端)
 * Phase-FP T-FP-029 · 2026-07-03
 * 角色视角: 👤 会员
 * 功能: 查看积分、积分明细、积分兑换
 */

'use client';

import React, { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { pointsService, type PointRecord } from '../../../lib/points-service';
import {
  getMainContainerStyle,
  getCardStyle,
  getToggleChipStyle,
  getEmptyStateStyle,
  H5Header,
  H5NavBar,
  COLOR_TEXT_PRIMARY,
  COLOR_TEXT_SECONDARY,
  COLOR_TEXT_MUTED,
  COLOR_ACCENT,
} from '../h5-style';

export default function H5PointsPage() {
  const [loading, setLoading] = useState(true);
  const [records, setRecords] = useState<PointRecord[]>([]);
  const [totalPoints, setTotalPoints] = useState(0);
  const [filter, setFilter] = useState<'ALL' | 'earn' | 'spend'>('ALL');

  useEffect(() => {
    loadPoints();
  }, []);

  async function loadPoints() {
    setLoading(true);
    const result = await pointsService.getPointRecords();
    if (result.success && result.data) {
      setRecords(result.data.records);
      setTotalPoints(result.data.summary.total);
    }
    setLoading(false);
  }

  const filtered = useMemo(() => {
    if (filter === 'ALL') return records;
    return records.filter((r) => r.type === filter);
  }, [records, filter]);

  const stats = useMemo(() => ({
    total: totalPoints,
    earned: records.filter((r) => r.type === 'earn').reduce((sum, r) => sum + r.amount, 0),
    spent: records.filter((r) => r.type === 'spend').reduce((sum, r) => sum + Math.abs(r.amount), 0),
  }), [records, totalPoints]);

  return (
    <main style={getMainContainerStyle()}>
      {/* 积分卡片 */}
      <div
        style={{
          background: 'linear-gradient(135deg, rgba(245,158,11,0.2) 0%, rgba(217,119,6,0.1) 100%)',
          borderBottom: '1px solid rgba(245,158,11,0.2)',
          padding: 24,
          textAlign: 'center',
        }}
      >
        <div style={{ fontSize: 13, color: '#fbbf24', marginBottom: 8 }}>我的积分</div>
        <div style={{ fontSize: 48, fontWeight: 700, color: '#fbbf24', marginBottom: 8 }}>
          {stats.total.toLocaleString()}
        </div>
        <div style={{ fontSize: 12, color: COLOR_TEXT_SECONDARY }}>可兑换优惠券及礼品</div>

        {/* 收支统计 */}
        <div style={{ display: 'flex', gap: 24, marginTop: 20, justifyContent: 'center' }}>
          <div>
            <div style={{ fontSize: 18, fontWeight: 600, color: '#4ade80' }}>+{stats.earned}</div>
            <div style={{ fontSize: 11, color: COLOR_TEXT_MUTED, marginTop: 2 }}>累计获得</div>
          </div>
          <div style={{ width: 1, background: 'rgba(148,163,184,0.2)' }} />
          <div>
            <div style={{ fontSize: 18, fontWeight: 600, color: '#f87171' }}>-{stats.spent}</div>
            <div style={{ fontSize: 11, color: COLOR_TEXT_MUTED, marginTop: 2 }}>累计使用</div>
          </div>
        </div>
      </div>

      {/* 积分规则 */}
      <div style={{ padding: 16 }}>
        <div style={getCardStyle({ marginBottom: 16 })}>
          <h3 style={{ fontSize: 14, fontWeight: 600, color: COLOR_TEXT_PRIMARY, marginBottom: 12 }}>积分规则</h3>
          <div style={{ fontSize: 12, color: COLOR_TEXT_SECONDARY, lineHeight: 1.8 }}>
            <p style={{ marginBottom: 8 }}>• 消费1元 = 1积分</p>
            <p style={{ marginBottom: 8 }}>• 评价订单 = 50积分</p>
            <p style={{ marginBottom: 8 }}>• 每日签到 = 10-30积分</p>
            <p>• 100积分 = 1元优惠券</p>
          </div>
        </div>

        {/* 积分兑换 */}
        <div style={getCardStyle({ marginBottom: 16 })}>
          <h3 style={{ fontSize: 14, fontWeight: 600, color: COLOR_TEXT_PRIMARY, marginBottom: 12 }}>积分兑换</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            {[
              { points: 100, reward: '¥1优惠券', color: '#f59e0b' },
              { points: 500, reward: '¥5优惠券', color: '#3b82f6' },
              { points: 1000, reward: '免运费券', color: '#10b981' },
              { points: 2000, reward: '¥20优惠券', color: '#8b5cf6' },
            ].map((item) => (
              <button
                key={item.points}
                style={{
                  padding: 12,
                  borderRadius: 8,
                  background: `${item.color}10`,
                  border: `1px solid ${item.color}30`,
                  cursor: 'pointer',
                }}
              >
                <div style={{ fontSize: 16, fontWeight: 600, color: item.color }}>{item.points}积分</div>
                <div style={{ fontSize: 11, color: COLOR_TEXT_SECONDARY, marginTop: 4 }}>{item.reward}</div>
              </button>
            ))}
          </div>
        </div>

        {/* 积分明细 */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <h3 style={{ fontSize: 14, fontWeight: 600, color: COLOR_TEXT_PRIMARY }}>积分明细</h3>
            <div style={{ display: 'flex', gap: 8 }}>
              {[
                { key: 'ALL', label: '全部' },
                { key: 'earn', label: '获得' },
                { key: 'spend', label: '使用' },
              ].map((item) => (
                <button
                  key={item.key}
                  onClick={() => setFilter(item.key as 'ALL' | 'earn' | 'spend')}
                  style={getToggleChipStyle(filter === item.key)}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          <div style={getCardStyle({ padding: 0, marginBottom: 0 })}>
            {filtered.map((record, idx) => (
              <div
                key={record.id}
                style={{
                  padding: 14,
                  borderBottom: idx < filtered.length - 1 ? '1px solid rgba(148,163,184,0.08)' : 'none',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontSize: 14, color: '#e2e8f0', marginBottom: 2 }}>{record.description}</div>
                    <div style={{ fontSize: 11, color: COLOR_TEXT_MUTED }}>{record.createdAt}</div>
                  </div>
                  <div
                    style={{
                      fontSize: 16,
                      fontWeight: 600,
                      color: record.type === 'earn' ? '#4ade80' : '#f87171',
                    }}
                  >
                    {record.amount > 0 ? '+' : ''}{record.amount}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <H5NavBar activeKey="me" />
    </main>
  );
}
