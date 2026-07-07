'use client';

import React, { useEffect, useState } from 'react';
import { PageShell } from '@m5/ui';
import {
  MOCK_LEVELS,
  MOCK_PROGRESS,
  formatTime,
  type MemberLevel,
  type MemberProgress,
  type PointsSummary,
  type PointsRecord,
  type CrossStoreActivity,
} from './member-center-data';
import {
  loadMemberProgress,
  loadPointsSummary,
  loadPointsRecords,
  loadCrossStoreActivity,
} from './member-center-service';

const TYPE_COLORS: Record<string, string> = {
  earn: '#22c55e',
  redeem: '#ef4444',
  expire: '#94a3b8',
  adjust: '#3b82f6',
};

const TYPE_LABELS: Record<string, string> = {
  earn: '获得',
  redeem: '兑换',
  expire: '过期',
  adjust: '调整',
};

export default function MemberCenterPage() {
  const [progress, setProgress] = useState<MemberProgress>(MOCK_PROGRESS);
  const [points, setPoints] = useState<PointsSummary | null>(null);
  const [records, setRecords] = useState<PointsRecord[]>([]);
  const [crossStore, setCrossStore] = useState<CrossStoreActivity[]>([]);

  useEffect(() => {
    const memberId = 'M10001';
    loadMemberProgress(memberId).then(p => p && setProgress(p));
    loadPointsSummary(memberId).then(setPoints);
    loadPointsRecords(memberId, 10).then(setRecords);
    loadCrossStoreActivity(memberId).then(setCrossStore);
  }, []);

  const currentLevel = MOCK_LEVELS.find(l => l.level === progress.level) as MemberLevel;
  const nextLevel = MOCK_LEVELS.find(l => l.level === progress.level + 1);
  const pointsToNext = progress.nextLevelTarget - progress.growthValue;

  return (
    <PageShell title="会员中心" description="查看会员等级、成长值、积分和跨店活动">
      {/* Hero Section */}
      <div style={{
        background: 'rgba(30,41,59,0.9)',
        border: '1px solid rgba(148,163,184,0.12)',
        borderRadius: 12,
        padding: 24,
        marginBottom: 24,
        display: 'flex',
        alignItems: 'center',
        gap: 24,
      }}>
        {/* Avatar placeholder */}
        <div style={{
          width: 80,
          height: 80,
          borderRadius: '50%',
          background: 'linear-gradient(135deg, #3b82f6, #60a5fa)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 32,
          color: '#fff',
          fontWeight: 700,
        }}>
          会员
        </div>

        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
            <span style={{ fontSize: 18, fontWeight: 600, color: '#f8fafc' }}>
              会员ID: {progress.memberId}
            </span>
            <span style={{
              padding: '4px 12px',
              fontSize: 12,
              fontWeight: 700,
              borderRadius: 4,
              background: 'linear-gradient(135deg, #eab308, #fbbf24)',
              color: '#0f172a',
            }}>
              {currentLevel.name}
            </span>
          </div>

          {/* Growth Progress */}
          <div style={{ marginBottom: 6 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
              <span style={{ fontSize: 13, color: '#94a3b8' }}>成长值</span>
              <span style={{ fontSize: 13, color: '#e2e8f0' }}>
                {progress.growthValue} / {progress.nextLevelTarget}
              </span>
            </div>
            <div style={{ height: 10, background: 'rgba(148,163,184,0.15)', borderRadius: 5, overflow: 'hidden' }}>
              <div style={{
                width: `${progress.progressPercent * 100}%`,
                height: '100%',
                background: 'linear-gradient(90deg, #eab308, #fbbf24)',
                borderRadius: 5,
                transition: 'width 0.3s ease',
              }} />
            </div>
          </div>

          <p style={{ fontSize: 14, color: '#94a3b8', margin: 0 }}>
            再获 {pointsToNext} 成长值升级
          </p>
        </div>
      </div>

      {/* Level Privileges Card */}
      <div style={{
        background: 'rgba(30,41,59,0.9)',
        border: '1px solid rgba(148,163,184,0.12)',
        borderRadius: 12,
        padding: 24,
        marginBottom: 24,
      }}>
        <h2 style={{ fontSize: 16, fontWeight: 600, color: '#f8fafc', margin: '0 0 16px' }}>
          等级特权
        </h2>
        <div style={{ marginBottom: 16 }}>
          <p style={{ fontSize: 14, color: '#e2e8f0', fontWeight: 500, margin: '0 0 8px' }}>
            当前等级: {currentLevel.name}
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {currentLevel.privileges.map((p, i) => (
              <span key={i} style={{
                padding: '4px 10px',
                fontSize: 12,
                borderRadius: 4,
                background: 'rgba(59,130,246,0.15)',
                color: '#60a5fa',
                border: '1px solid rgba(59,130,246,0.2)',
              }}>
                {p}
              </span>
            ))}
          </div>
        </div>
        {nextLevel && (
          <div style={{ paddingTop: 12, borderTop: '1px solid rgba(148,163,184,0.1)' }}>
            <p style={{ fontSize: 14, color: '#94a3b8', margin: '0 0 8px' }}>
              升级到 {nextLevel.name} 可获得
            </p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {nextLevel.privileges
                .filter(p => !currentLevel.privileges.includes(p))
                .map((p, i) => (
                  <span key={i} style={{
                    padding: '4px 10px',
                    fontSize: 12,
                    borderRadius: 4,
                    background: 'rgba(234,179,8,0.1)',
                    color: '#fbbf24',
                    border: '1px solid rgba(234,179,8,0.2)',
                  }}>
                    {p}
                  </span>
                ))}
            </div>
          </div>
        )}
      </div>

      {/* Points Summary Card */}
      <div style={{
        background: 'rgba(30,41,59,0.9)',
        border: '1px solid rgba(148,163,184,0.12)',
        borderRadius: 12,
        padding: 24,
        marginBottom: 24,
      }}>
        <h2 style={{ fontSize: 16, fontWeight: 600, color: '#f8fafc', margin: '0 0 16px' }}>
          积分概览
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
          <div style={{ textAlign: 'center' }}>
            <p style={{ fontSize: 24, fontWeight: 700, color: '#f8fafc', margin: '0 0 4px' }}>
              {points?.total ?? 0}
            </p>
            <p style={{ fontSize: 12, color: '#94a3b8', margin: 0 }}>总积分</p>
          </div>
          <div style={{ textAlign: 'center' }}>
            <p style={{ fontSize: 24, fontWeight: 700, color: '#22c55e', margin: '0 0 4px' }}>
              {points?.available ?? 0}
            </p>
            <p style={{ fontSize: 12, color: '#94a3b8', margin: 0 }}>可用积分</p>
          </div>
          <div style={{ textAlign: 'center' }}>
            <p style={{ fontSize: 24, fontWeight: 700, color: '#94a3b8', margin: '0 0 4px' }}>
              {points?.frozen ?? 0}
            </p>
            <p style={{ fontSize: 12, color: '#94a3b8', margin: 0 }}>冻结积分</p>
          </div>
          <div style={{ textAlign: 'center' }}>
            <p style={{ fontSize: 24, fontWeight: 700, color: '#eab308', margin: '0 0 4px' }}>
              {points?.expiredSoon ?? 0}
            </p>
            <p style={{ fontSize: 12, color: '#94a3b8', margin: 0 }}>即将过期</p>
          </div>
        </div>
      </div>

      {/* Points Records */}
      <div style={{
        background: 'rgba(30,41,59,0.9)',
        border: '1px solid rgba(148,163,184,0.12)',
        borderRadius: 12,
        padding: 24,
        marginBottom: 24,
      }}>
        <h2 style={{ fontSize: 16, fontWeight: 600, color: '#f8fafc', margin: '0 0 16px' }}>
          积分记录
        </h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {records.map(record => (
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
                background: TYPE_COLORS[record.type],
                color: record.type === 'earn' ? '#0f172a' : '#ffffff',
              }}>
                {TYPE_LABELS[record.type]}
              </span>
              <span style={{
                fontSize: 14,
                fontWeight: 600,
                color: record.amount > 0 ? '#22c55e' : '#ef4444',
              }}>
                {record.amount > 0 ? '+' : ''}{record.amount}
              </span>
              <span style={{ flex: 1, fontSize: 14, color: '#e2e8f0' }}>{record.reason}</span>
              <span style={{ fontSize: 12, color: '#64748b' }}>余额: {record.balance}</span>
              <span style={{ fontSize: 12, color: '#64748b' }}>{formatTime(record.createdAt)}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Cross-Store Activity */}
      <div style={{
        background: 'rgba(30,41,59,0.9)',
        border: '1px solid rgba(148,163,184,0.12)',
        borderRadius: 12,
        padding: 24,
      }}>
        <h2 style={{ fontSize: 16, fontWeight: 600, color: '#f8fafc', margin: '0 0 16px' }}>
          跨店活动
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
          {crossStore.map(store => (
            <div key={store.storeId} style={{
              padding: 16,
              background: 'rgba(15,23,42,0.6)',
              borderRadius: 8,
              border: '1px solid rgba(148,163,184,0.1)',
            }}>
              <p style={{ fontSize: 14, color: '#e2e8f0', fontWeight: 500, margin: '0 0 8px' }}>
                {store.storeName}
              </p>
              <p style={{ fontSize: 12, color: '#94a3b8', margin: '0 0 4px' }}>
                访问次数: {store.visitCount}
              </p>
              <p style={{ fontSize: 12, color: '#94a3b8', margin: '0 0 4px' }}>
                最近访问: {formatTime(store.lastVisit)}
              </p>
              <p style={{ fontSize: 14, color: '#22c55e', fontWeight: 600, margin: 0 }}>
                获得积分: {store.pointsEarned}
              </p>
            </div>
          ))}
        </div>
      </div>
    </PageShell>
  );
}
