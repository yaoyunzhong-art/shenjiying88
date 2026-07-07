'use client';

import React, { useMemo, useState, useCallback } from 'react';

import {
  PageShell,
  MemberRFMAnalysisPanel,
  Tabs,
  Card,
  StatCard,
  FilterBar,
  LoadingSkeleton,
  EmptyState,
  type RFMRecord,
} from '@m5/ui';


// ── Mock Data ──────────────────────────────────────────────────────────────

const MOCK_RFM_DATA: RFMRecord[] = [
  { id: 'M001', name: '张三', recency: 5, frequency: 5, monetary: 5, avatarColor: '#06b6d4' },
  { id: 'M002', name: '李四', recency: 4, frequency: 5, monetary: 4, avatarColor: '#22c55e' },
  { id: 'M003', name: '王五', recency: 3, frequency: 4, monetary: 3, avatarColor: '#eab308' },
  { id: 'M004', name: '赵六', recency: 2, frequency: 3, monetary: 5, avatarColor: '#f97316' },
  { id: 'M005', name: '孙七', recency: 5, frequency: 2, monetary: 2, avatarColor: '#ef4444' },
  { id: 'M006', name: '周八', recency: 1, frequency: 1, monetary: 1, avatarColor: '#8b5cf6' },
  { id: 'M007', name: '吴九', recency: 4, frequency: 4, monetary: 5, avatarColor: '#ec4899' },
  { id: 'M008', name: '郑十', recency: 3, frequency: 3, monetary: 3, avatarColor: '#14b8a6' },
  { id: 'M009', name: '陈十一', recency: 5, frequency: 5, monetary: 4, avatarColor: '#6366f1' },
  { id: 'M010', name: '林十二', recency: 2, frequency: 2, monetary: 2, avatarColor: '#f43f5e' },
  { id: 'M011', name: '黄十三', recency: 4, frequency: 3, monetary: 5, avatarColor: '#0ea5e9' },
  { id: 'M012', name: '何十四', recency: 1, frequency: 1, monetary: 3, avatarColor: '#84cc16' },
];

type AnalysisTab = 'overview' | 'segment' | 'detail';

// ── Helpers ────────────────────────────────────────────────────────────────

function average(arr: number[]): number {
  if (arr.length === 0) return 0;
  return arr.reduce((s, v) => s + v, 0) / arr.length;
}

function computeSegmentScore(r: number, f: number, m: number): string {
  const total = r + f + m;
  if (total >= 13) return '高价值';
  if (total >= 10) return '重要发展';
  if (total >= 7) return '一般价值';
  return '流失预警';
}

// ── Page Component ─────────────────────────────────────────────────────────

export default function RFMAnalysisPage() {
  const [activeTab, setActiveTab] = useState<AnalysisTab>('overview');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSearch = useCallback((query: string) => {
    setSearchQuery(query);
  }, []);

  const filteredData = useMemo(() => {
    if (!searchQuery.trim()) return MOCK_RFM_DATA;
    const q = searchQuery.trim().toLowerCase();
    return MOCK_RFM_DATA.filter(
      (d) => d.name.toLowerCase().includes(q) || d.id.toLowerCase().includes(q),
    );
  }, [searchQuery]);

  const stats = useMemo(() => {
    const recencyAvg = Math.round(average(MOCK_RFM_DATA.map((d) => d.recency)) * 10) / 10;
    const frequencyAvg = Math.round(average(MOCK_RFM_DATA.map((d) => d.frequency)) * 10) / 10;
    const monetaryAvg = Math.round(average(MOCK_RFM_DATA.map((d) => d.monetary)) * 10) / 10;
    const highValueCount = MOCK_RFM_DATA.filter(
      (d) => computeSegmentScore(d.recency, d.frequency, d.monetary) === '高价值',
    ).length;
    return { recencyAvg, frequencyAvg, monetaryAvg, highValueCount };
  }, []);

  const tabs: { value: AnalysisTab; label: string }[] = [
    { value: 'overview', label: '概览' },
    { value: 'segment', label: '分层分布' },
    { value: 'detail', label: '明细列表' },
  ];

  if (loading) {
    return (
      <PageShell title="RFM 会员分析" description="基于最近消费、频率、金额的会员价值分析">
        <LoadingSkeleton lines={8} />
      </PageShell>
    );
  }

  return (
    <PageShell
      title="RFM 会员分析"
      description="基于最近消费、频率、金额的会员价值分析"
      data-testid="rfm-analysis-page"
    >
      {/* ── 统计卡片 ── */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <StatCard label="平均 Recency" value={String(stats.recencyAvg)} />
        <StatCard label="平均 Frequency" value={String(stats.frequencyAvg)} />
        <StatCard label="平均 Monetary" value={String(stats.monetaryAvg)} />
        <StatCard label="高价值会员" value={String(stats.highValueCount)} variant="success" />
      </div>

      {/* ── Tab 切换 ── */}
      <Tabs
        items={tabs.map((t) => ({ key: t.value, label: t.label }))}
        activeKey={activeTab}
        onChange={(v) => setActiveTab(v as AnalysisTab)}
      />

      <div className="mt-4">
        {/* ── 概览: RFM 面板 ── */}
        {activeTab === 'overview' && (
          <>
            <div className="mb-3">
              <input
                type="text"
                placeholder="搜索会员姓名或编号…"
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                className="w-full max-w-sm px-3 py-2 text-sm rounded-lg border border-gray-200 bg-transparent placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
              />
            </div>
            <div className="mt-4">
              <MemberRFMAnalysisPanel
                data={filteredData}
                mode="all"
                title="RFM 会员分布"
                height={400}
              />
            </div>
          </>
        )}

        {/* ── 分层分布 ── */}
        {activeTab === 'segment' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {['高价值', '重要发展', '重要保持', '重要挽留', '一般价值', '一般发展', '一般保持', '流失预警'].map(
              (segment) => {
                const membersInSegment = MOCK_RFM_DATA.filter(
                  (d) => computeSegmentScore(d.recency, d.frequency, d.monetary) === segment,
                );
                return (
                  <Card key={segment} className="p-4">
                    <h3 className="font-semibold text-lg mb-2">{segment}</h3>
                    <p className="text-sm text-gray-500 mb-3">
                      {membersInSegment.length} 人
                    </p>
                    {membersInSegment.length === 0 ? (
                      <p className="text-xs text-gray-400">暂无会员</p>
                    ) : (
                      <ul className="space-y-1">
                        {membersInSegment.map((m) => (
                          <li key={m.id} className="text-sm flex justify-between">
                            <span>{m.name}</span>
                            <span className="text-gray-400">
                              R{m.recency}/F{m.frequency}/M{m.monetary}
                            </span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </Card>
                );
              },
            )}
          </div>
        )}

        {/* ── 明细列表 ── */}
        {activeTab === 'detail' && (
          <div className="space-y-2">
            {filteredData.length === 0 ? (
              <EmptyState title="没有匹配的会员数据" />
            ) : (
              filteredData.map((record) => (
                <Card key={record.id} className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold"
                      style={{ backgroundColor: record.avatarColor || '#94a3b8' }}
                    >
                      {record.name.charAt(0)}
                    </div>
                    <div>
                      <p className="font-medium">{record.name}</p>
                      <p className="text-xs text-gray-400">{record.id}</p>
                    </div>
                  </div>
                  <div className="flex gap-6 text-sm">
                    <span>
                      R: <strong className={record.recency >= 4 ? 'text-green-500' : record.recency >= 3 ? 'text-yellow-500' : 'text-red-500'}>{record.recency}</strong>
                    </span>
                    <span>
                      F: <strong className={record.frequency >= 4 ? 'text-green-500' : record.frequency >= 3 ? 'text-yellow-500' : 'text-red-500'}>{record.frequency}</strong>
                    </span>
                    <span>
                      M: <strong className={record.monetary >= 4 ? 'text-green-500' : record.monetary >= 3 ? 'text-yellow-500' : 'text-red-500'}>{record.monetary}</strong>
                    </span>
                  </div>
                  <span className="text-xs px-2 py-1 rounded bg-blue-100 text-blue-700">
                    {computeSegmentScore(record.recency, record.frequency, record.monetary)}
                  </span>
                </Card>
              ))
            )}
          </div>
        )}
      </div>
    </PageShell>
  );
}
