'use client';

import React, { useCallback, useMemo, useState } from 'react';
import { SearchFilterInput } from './SearchFilterInput';
import { StatusBadge } from './StatusBadge';
import { DataTable } from './DataTable';
import type { DataTableColumn } from './DataTable';
import { QuickStats } from './QuickStats';
import type { QuickStatItem } from './QuickStats';

// ---- 类型定义 ----

/** 当日接待统计 */
export interface DailyReceptionStats {
  /** 接待总数 */
  totalReceptions: number;
  /** 新增线索 */
  newLeads: number;
  /** 转化数 */
  conversions: number;
  /** 转化率 (0-100) */
  conversionRate: number;
  /** 平均响应时间 (分钟) */
  avgResponseMin: number;
}

/** 待跟进客户 */
export interface FollowUpClient {
  id: string;
  name: string;
  phone: string;
  /** 会员等级 */
  tier: 'VIP' | 'GOLD' | 'SILVER' | 'REGULAR';
  /** 最近到店时间 */
  lastVisit: string;
  /** 待跟进原因 */
  reason: string;
  /** 紧急程度 */
  priority: 'high' | 'medium' | 'low';
}

/** 推荐话术 */
export interface SalesScript {
  id: string;
  scenario: string;
  text: string;
  tags: string[];
}

/** 会员快速查询结果 */
export interface MemberQuickLookup {
  id: string;
  name: string;
  phone: string;
  tier: 'VIP' | 'GOLD' | 'SILVER' | 'REGULAR';
  points: number;
  totalSpent: number;
  visitCount: number;
  tags: string[];
}

// ---- 组件 Props ----

export interface SalesClerkToolProps {
  /** 当日接待统计 */
  stats: DailyReceptionStats;
  /** 待跟进客户列表 */
  followUpClients: FollowUpClient[];
  /** 推荐话术列表 */
  scripts: SalesScript[];
  /** 导购员姓名 */
  clerkName?: string;
  /** 门店名称 */
  storeName?: string;
  /** 会员查询回调 */
  onMemberSearch?: (query: string) => Promise<MemberQuickLookup[]>;
  /** 客户跟进回调 */
  onFollowUp?: (clientId: string) => void;
  /** 话术复制回调 */
  onScriptCopy?: (scriptId: string) => void;
}

// ---- 常量 ----

const TIER_LABELS: Record<FollowUpClient['tier'], string> = {
  VIP: 'VIP会员',
  GOLD: '金卡会员',
  SILVER: '银卡会员',
  REGULAR: '普通会员',
};

const TIER_VARIANTS: Record<FollowUpClient['tier'], 'success' | 'warning' | 'info' | 'neutral'> = {
  VIP: 'success',
  GOLD: 'warning',
  SILVER: 'info',
  REGULAR: 'neutral',
};

const PRIORITY_LABELS: Record<FollowUpClient['priority'], string> = {
  high: '高',
  medium: '中',
  low: '低',
};

const PRIORITY_VARIANTS: Record<FollowUpClient['priority'], 'error' | 'warning' | 'info'> = {
  high: 'error',
  medium: 'warning',
  low: 'info',
};

// ---- 子组件 ----

function MemberSearchPanel({
  onSearch,
}: {
  onSearch?: (query: string) => Promise<MemberQuickLookup[]>;
}) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<MemberQuickLookup[]>([]);
  const [searching, setSearching] = useState(false);
  const [searched, setSearched] = useState(false);

  const handleSearch = useCallback(async () => {
    if (!query.trim() || !onSearch) return;
    setSearching(true);
    setSearched(true);
    try {
      const data = await onSearch(query.trim());
      setResults(data);
    } finally {
      setSearching(false);
    }
  }, [query, onSearch]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') handleSearch();
    },
    [handleSearch],
  );

  return (
    <div style={{ marginBottom: 24 }}>
      <div style={{ fontSize: 16, fontWeight: 600, color: '#f8fafc', marginBottom: 8 }}>
        会员速查
      </div>
      <div style={{ display: 'flex', gap: 8 }}>
        <div style={{ flex: 1 }}>
          <SearchFilterInput
            value={query}
            onChange={setQuery}
            onKeyDown={handleKeyDown}
            placeholder="输入手机号或姓名查询会员…"
          />
        </div>
        <button
          onClick={handleSearch}
          disabled={searching || !query.trim()}
          style={{
            padding: '8px 20px',
            borderRadius: 10,
            border: 'none',
            background: searching || !query.trim() ? '#334155' : '#3b82f6',
            color: '#fff',
            fontWeight: 600,
            cursor: searching || !query.trim() ? 'not-allowed' : 'pointer',
            fontSize: 14,
          }}
        >
          {searching ? '查询中...' : '查询'}
        </button>
      </div>

      {searched && results.length === 0 && !searching && (
        <div style={{ marginTop: 12, padding: 16, borderRadius: 12, background: '#1e293b', color: '#94a3b8', fontSize: 14 }}>
          未找到匹配会员
        </div>
      )}

      {results.length > 0 && (
        <div style={{ marginTop: 12, display: 'grid', gap: 10 }}>
          {results.map((m) => (
            <div
              key={m.id}
              style={{
                borderRadius: 12,
                padding: 14,
                background: '#1e293b',
                border: '1px solid #334155',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                <span style={{ fontWeight: 700, color: '#f8fafc', fontSize: 15 }}>{m.name}</span>
                <StatusBadge label={TIER_LABELS[m.tier]} variant={TIER_VARIANTS[m.tier]} />
              </div>
              <div style={{ display: 'flex', gap: 20, fontSize: 13, color: '#94a3b8' }}>
                <span>📱 {m.phone}</span>
                <span>⭐ {m.points} 积分</span>
                <span>💰 ¥{m.totalSpent.toLocaleString()}</span>
                <span>🏪 {m.visitCount} 次到店</span>
              </div>
              {m.tags.length > 0 && (
                <div style={{ marginTop: 8, display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {m.tags.map((tag) => (
                    <span
                      key={tag}
                      style={{
                        fontSize: 12,
                        padding: '2px 8px',
                        borderRadius: 6,
                        background: '#0f172a',
                        color: '#93c5fd',
                      }}
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function FollowUpList({
  clients,
  onFollowUp,
}: {
  clients: FollowUpClient[];
  onFollowUp?: (clientId: string) => void;
}) {
  const columns: DataTableColumn<FollowUpClient>[] = useMemo(
    () => [
      { key: 'name', label: '客户', render: (row) => <span style={{ fontWeight: 600 }}>{row.name}</span> },
      {
        key: 'tier',
        label: '等级',
        render: (row) => <StatusBadge label={TIER_LABELS[row.tier]} variant={TIER_VARIANTS[row.tier]} />,
      },
      { key: 'lastVisit', label: '最近到店' },
      { key: 'reason', label: '跟进原因' },
      {
        key: 'priority',
        label: '优先级',
        render: (row) => <StatusBadge label={PRIORITY_LABELS[row.priority]} variant={PRIORITY_VARIANTS[row.priority]} />,
      },
      {
        key: 'action',
        label: '操作',
        render: (row) => (
          <button
            onClick={() => onFollowUp?.(row.id)}
            style={{
              padding: '4px 14px',
              borderRadius: 8,
              border: 'none',
              background: '#3b82f6',
              color: '#fff',
              cursor: 'pointer',
              fontSize: 13,
              fontWeight: 600,
            }}
          >
            跟进
          </button>
        ),
      },
    ],
    [onFollowUp],
  );

  if (clients.length === 0) {
    return (
      <div style={{ padding: 24, textAlign: 'center', color: '#64748b', fontSize: 14 }}>
        暂无待跟进客户 🎉
      </div>
    );
  }

  return <DataTable columns={columns} rows={clients} rowKey={(row) => row.id} />;
}

function ScriptCards({
  scripts,
  onCopy,
}: {
  scripts: SalesScript[];
  onCopy?: (scriptId: string) => void;
}) {
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleCopy = useCallback(
    (script: SalesScript) => {
      navigator.clipboard?.writeText(script.text).catch(() => {});
      setCopiedId(script.id);
      onCopy?.(script.id);
      setTimeout(() => setCopiedId(null), 2000);
    },
    [onCopy],
  );

  if (scripts.length === 0) {
    return (
      <div style={{ padding: 24, textAlign: 'center', color: '#64748b', fontSize: 14 }}>
        暂无可选话术
      </div>
    );
  }

  return (
    <div style={{ display: 'grid', gap: 10 }}>
      {scripts.map((script) => (
        <div
          key={script.id}
          style={{
            borderRadius: 12,
            padding: 14,
            background: '#1e293b',
            border: '1px solid #334155',
          }}
        >
          <div style={{ fontSize: 14, fontWeight: 600, color: '#f8fafc', marginBottom: 6 }}>
            {script.scenario}
          </div>
          <div style={{ fontSize: 13, color: '#cbd5e1', marginBottom: 10, lineHeight: 1.6 }}>
            {script.text}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {script.tags.map((tag) => (
                <span
                  key={tag}
                  style={{
                    fontSize: 11,
                    padding: '2px 8px',
                    borderRadius: 6,
                    background: '#0f172a',
                    color: '#93c5fd',
                  }}
                >
                  {tag}
                </span>
              ))}
            </div>
            <button
              onClick={() => handleCopy(script)}
              style={{
                padding: '4px 14px',
                borderRadius: 8,
                border: 'none',
                background: copiedId === script.id ? '#16a34a' : '#334155',
                color: '#fff',
                cursor: 'pointer',
                fontSize: 13,
                fontWeight: 600,
              }}
            >
              {copiedId === script.id ? '✓ 已复制' : '复制'}
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

// ---- 主组件 ----

export function SalesClerkTool({
  stats,
  followUpClients,
  scripts,
  clerkName,
  storeName,
  onMemberSearch,
  onFollowUp,
  onScriptCopy,
}: SalesClerkToolProps) {
  const [activeTab, setActiveTab] = useState<'search' | 'followup' | 'scripts'>('search');

  const statItems: QuickStatItem[] = useMemo(
    () => [
      { label: '今日接待', value: String(stats.totalReceptions), helper: '人次' },
      { label: '新增线索', value: String(stats.newLeads), helper: '条' },
      { label: '转化', value: String(stats.conversions), helper: '笔' },
      { label: '转化率', value: `${stats.conversionRate}%`, helper: '较昨日' },
      { label: '平均响应', value: `${stats.avgResponseMin}min`, helper: '分钟' },
    ],
    [stats],
  );

  const tabs = [
    { key: 'search' as const, label: '会员速查' },
    { key: 'followup' as const, label: `待跟进 (${followUpClients.length})` },
    { key: 'scripts' as const, label: `推荐话术 (${scripts.length})` },
  ];

  return (
    <div
      style={{
        borderRadius: 20,
        padding: 24,
        background: '#0f172a',
        border: '1px solid #1e293b',
      }}
    >
      {/* 头部信息 */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <div>
          <div style={{ fontSize: 20, fontWeight: 700, color: '#f8fafc' }}>
            导购工作台
          </div>
          <div style={{ fontSize: 13, color: '#64748b', marginTop: 4 }}>
            {[clerkName, storeName].filter(Boolean).join(' · ') || '客户接待与转化工具'}
          </div>
        </div>
        <StatusBadge label="● 在线" variant="success" />
      </div>

      {/* 统计卡片 */}
      <QuickStats items={statItems} />

      {/* Tab 切换 */}
      <div style={{ display: 'flex', gap: 4, marginTop: 20, marginBottom: 16 }}>
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            style={{
              padding: '8px 18px',
              borderRadius: 10,
              border: 'none',
              background: activeTab === tab.key ? '#1e293b' : 'transparent',
              color: activeTab === tab.key ? '#f8fafc' : '#64748b',
              fontWeight: activeTab === tab.key ? 600 : 400,
              cursor: 'pointer',
              fontSize: 14,
              transition: 'all 0.15s',
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab 内容 */}
      <div style={{ minHeight: 200 }}>
        {activeTab === 'search' && <MemberSearchPanel onSearch={onMemberSearch} />}
        {activeTab === 'followup' && <FollowUpList clients={followUpClients} onFollowUp={onFollowUp} />}
        {activeTab === 'scripts' && <ScriptCards scripts={scripts} onCopy={onScriptCopy} />}
      </div>
    </div>
  );
}
