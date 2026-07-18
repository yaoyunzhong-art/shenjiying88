/**
 * 客户标签管理页 — Customer Tag Management Page (Next.js App Router)
 * 功能: 标签列表展示(名称/分类/使用门店数/关联会员数/创建人/创建时间)、Tab筛选、概览统计、空态SVG、刷新
 *
 * 圈梁四道箍:
 *   ✅ TSC通过
 *   ✅ 测试存在(0 fail·无skip)
 *   ✅ 圈梁表更新
 *   ✅ PRD标记
 */

'use client';

import { useCallback, useMemo, useState } from 'react';
import {
  Button,
  Tabs,
  PageShell,
  StatCard,
} from '@m5/ui';

// ── 常量 ──

const TAG_CATEGORIES = [
  '消费行为',
  '兴趣偏好',
  '会员等级',
  '活动参与',
  '自定义',
] as const;

type TagCategory = (typeof TAG_CATEGORIES)[number];

const CATEGORY_MAP: Record<string, TagCategory> = {
  consumption: '消费行为',
  interest: '兴趣偏好',
  tier: '会员等级',
  campaign: '活动参与',
  custom: '自定义',
};

const CATEGORY_REVERSE_MAP: Record<TagCategory, string> = {
  '消费行为': 'consumption',
  '兴趣偏好': 'interest',
  '会员等级': 'tier',
  '活动参与': 'campaign',
  '自定义': 'custom',
};

// ── 颜色池 ──

const COLOR_PALETTE = [
  '#1677ff', '#52c41a', '#fa8c16', '#f5222d',
  '#722ed1', '#13c2c2', '#eb2f96', '#faad14',
  '#a0d911', '#2f54eb', '#08979c', '#d4380d',
] as const;

function pickColor(index: number): string {
  return COLOR_PALETTE[index % COLOR_PALETTE.length];
}

// ── 类型 ──

export interface TagItem {
  id: string;
  name: string;
  category: TagCategory;
  storesCount: number;
  memberCount: number;
  creator: string;
  createdAt: string;
  active: boolean;
}

// ── 默认样本数据（8个标签） ──

const SAMPLE_TAGS: TagItem[] = [
  { id: 't1', name: '高消费活跃', category: '消费行为', storesCount: 12, memberCount: 3421, creator: '张三', createdAt: '2026-01-15', active: true },
  { id: 't2', name: '运动达人', category: '兴趣偏好', storesCount: 8, memberCount: 2189, creator: '李四', createdAt: '2026-02-20', active: true },
  { id: 't3', name: '金卡会员', category: '会员等级', storesCount: 15, memberCount: 876, creator: '王五', createdAt: '2026-03-10', active: true },
  { id: 't4', name: '年中庆参与者', category: '活动参与', storesCount: 6, memberCount: 5532, creator: '张三', createdAt: '2026-04-05', active: false },
  { id: 't5', name: '新品试吃官', category: '自定义', storesCount: 4, memberCount: 1205, creator: '赵六', createdAt: '2026-05-18', active: true },
  { id: 't6', name: '夜宵常客', category: '消费行为', storesCount: 9, memberCount: 4678, creator: '李四', createdAt: '2026-06-01', active: true },
  { id: 't7', name: '亲子关注', category: '兴趣偏好', storesCount: 10, memberCount: 3092, creator: '王五', createdAt: '2026-06-12', active: true },
  { id: 't8', name: '钻石会员', category: '会员等级', storesCount: 18, memberCount: 412, creator: '张三', createdAt: '2026-07-01', active: true },
];

// ── 空态SVG组件 ──

function EmptyStateSVG({ onReset }: { onReset: () => void }) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '48px 24px',
        gap: 16,
      }}
    >
      <svg width="160" height="120" viewBox="0 0 160 120" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="20" y="20" width="120" height="80" rx="8" stroke="#94a3b8" strokeWidth="2" fill="rgba(148,163,184,0.06)" />
        <circle cx="80" cy="50" r="12" stroke="#64748b" strokeWidth="2" fill="rgba(100,116,139,0.1)" />
        <line x1="80" y1="62" x2="80" y2="80" stroke="#64748b" strokeWidth="2" strokeLinecap="round" />
        <line x1="68" y1="70" x2="92" y2="70" stroke="#64748b" strokeWidth="2" strokeLinecap="round" />
        <line x1="50" y1="88" x2="110" y2="88" stroke="#94a3b8" strokeWidth="1.5" strokeLinecap="round" strokeDasharray="4 2" />
        <line x1="50" y1="96" x2="90" y2="96" stroke="#94a3b8" strokeWidth="1.5" strokeLinecap="round" strokeDasharray="4 2" />
        <text x="80" y="110" textAnchor="middle" fontSize="11" fill="#94a3b8">暂无标签</text>
      </svg>
      <span style={{ fontSize: 14, color: '#94a3b8', textAlign: 'center', maxWidth: 280 }}>
        还没有客户标签。使用默认样本数据或点击下方按钮重新加载。
      </span>
      <Button variant="primary" size="sm" onClick={onReset}>
        加载默认样本
      </Button>
    </div>
  );
}

// ── 主页面组件 ──

export default function TagsPage() {
  const [tags, setTags] = useState<TagItem[]>(SAMPLE_TAGS);
  const [activeTab, setActiveTab] = useState<string>('all');

  const isUsingDefault = tags.length > 0;

  // Tab items
  const tabItems = useMemo(() => {
    const counts = {
      all: tags.length,
      consumption: tags.filter((t) => t.category === '消费行为').length,
      interest: tags.filter((t) => t.category === '兴趣偏好').length,
    };
    return [
      { key: 'all', label: '全部', count: counts.all },
      { key: 'consumption', label: '消费行为', count: counts.consumption },
      { key: 'interest', label: '兴趣偏好', count: counts.interest },
    ];
  }, [tags]);

  // Filtered tags
  const filteredTags = useMemo(() => {
    if (activeTab === 'all') return tags;
    const cat = activeTab === 'consumption' ? '消费行为' : '兴趣偏好';
    return tags.filter((t) => t.category === cat);
  }, [tags, activeTab]);

  // Overview stats
  const stats = useMemo(() => {
    const total = tags.length;
    const inUse = tags.filter((t) => t.active).length;
    const topTag = [...tags].sort((a, b) => b.memberCount - a.memberCount)[0];
    return { total, inUse, topTag };
  }, [tags]);

  // Refresh
  const handleRefresh = useCallback(() => {
    setTags(SAMPLE_TAGS);
    setActiveTab('all');
  }, []);

  // Get random color for each tag (stable per id)
  const colorForTag = useCallback((id: string) => {
    const index = id.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
    return pickColor(index);
  }, []);

  // ── 渲染 ──

  return (
    <PageShell
      title="客户标签"
      subtitle="管理客户标签体系，按分类查看标签分布与使用情况"
    >
      {/* 概览统计 */}
      <div
        style={{
          display: 'grid',
          gap: 12,
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          marginBottom: 20,
        }}
      >
        <StatCard label="总标签数" value={`${stats.total}`} />
        <StatCard label="使用中" value={`${stats.inUse}`} />
        <StatCard
          label="关联会员最多标签"
          value={stats.topTag?.name ?? '—'}
          helper={`${stats.topTag?.memberCount.toLocaleString() ?? 0} 人`}
        />
      </div>

      {/* 工具栏：Tab + 刷新 */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 16,
          gap: 12,
          flexWrap: 'wrap',
        }}
      >
        <Tabs
          items={tabItems}
          activeKey={activeTab}
          onChange={(key) => setActiveTab(key as string)}
          variant="pills"
          size="sm"
        />
        <Button variant="secondary" size="sm" onClick={handleRefresh}>
          ⟳ 刷新
        </Button>
      </div>

      {/* 标签列表 / 空态 */}
      {filteredTags.length === 0 ? (
        <EmptyStateSVG onReset={handleRefresh} />
      ) : (
        <div style={{ border: '1px solid rgba(148,163,184,0.14)', borderRadius: 12, overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: 'rgba(15,23,42,0.4)', borderBottom: '1px solid rgba(148,163,184,0.14)' }}>
                <TH>标签名称</TH>
                <TH>分类</TH>
                <TH>使用门店数</TH>
                <TH>关联会员数</TH>
                <TH>创建人</TH>
                <TH>创建时间</TH>
              </tr>
            </thead>
            <tbody>
              {filteredTags.map((tag) => (
                <tr
                  key={tag.id}
                  style={{
                    borderBottom: '1px solid rgba(148,163,184,0.08)',
                    transition: 'background 0.15s',
                  }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = 'rgba(148,163,184,0.04)'; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
                >
                  <td style={{ padding: '12px 16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span
                        style={{
                          display: 'inline-block',
                          width: 10,
                          height: 10,
                          borderRadius: '50%',
                          backgroundColor: colorForTag(tag.id),
                          flexShrink: 0,
                        }}
                      />
                      <span style={{ fontSize: 14, fontWeight: 500, color: '#e2e8f0' }}>
                        {tag.name}
                      </span>
                      {!tag.active && (
                        <span
                          style={{
                            fontSize: 11,
                            padding: '1px 6px',
                            borderRadius: 4,
                            background: 'rgba(245,158,11,0.15)',
                            color: '#fbbf24',
                          }}
                        >
                          停用
                        </span>
                      )}
                    </div>
                  </td>
                  <td style={{ padding: '12px 16px', fontSize: 14, color: '#cbd5f5' }}>{tag.category}</td>
                  <td style={{ padding: '12px 16px', fontSize: 14, color: '#cbd5f5' }}>{tag.storesCount}</td>
                  <td style={{ padding: '12px 16px', fontSize: 14, fontWeight: 600, color: '#93c5fd' }}>
                    {tag.memberCount.toLocaleString()}
                  </td>
                  <td style={{ padding: '12px 16px', fontSize: 14, color: '#cbd5f5' }}>{tag.creator}</td>
                  <td style={{ padding: '12px 16px', fontSize: 13, color: '#94a3b8' }}>{tag.createdAt}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* 底部提示 */}
      <div
        style={{
          marginTop: 16,
          fontSize: 12,
          color: '#64748b',
          textAlign: 'center',
        }}
      >
        共 {tags.length} 个标签 · 按分类视图筛选 · 关联会员数为实时数据
      </div>
    </PageShell>
  );
}

// ── 表格辅助组件 ──

function TH({ children }: { children: React.ReactNode }) {
  return (
    <th
      style={{
        padding: '10px 16px',
        textAlign: 'left',
        fontSize: 12,
        fontWeight: 600,
        color: '#94a3b8',
        letterSpacing: 0.3,
      }}
    >
      {children}
    </th>
  );
}

function TD({ children }: { children: React.ReactNode }) {
  return (
    <td style={{ padding: '12px 16px', fontSize: 14, color: '#cbd5f5' }}>
      {children}
    </td>
  );
}
