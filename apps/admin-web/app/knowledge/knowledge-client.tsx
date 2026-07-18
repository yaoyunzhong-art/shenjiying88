/**
 * KnowledgeClient — 知识库客户端组件
 * 功能: 分类浏览、最近文档、文档搜索入口、阅读统计
 */

'use client';

import { useState } from 'react';
import { Card, Tabs, StatusBadge } from '@m5/ui';

interface KnowledgeCategory {
  id: string; name: string; icon: string; docCount: number; lastUpdated: string;
}

interface RecentDocument {
  id: string; title: string; category: string; author: string; updatedAt: string; summary: string;
}

interface KnowledgeTag {
  id: string;
  label: string;
}

interface KnowledgeSnapshot {
  categories: KnowledgeCategory[];
  recentDocuments: RecentDocument[];
  totalDocuments: number;
  totalViews: number;
  tags: KnowledgeTag[];
}

export default function KnowledgeClient({ data }: { data: KnowledgeSnapshot }) {
  const [activeTab, setActiveTab] = useState<'categories' | 'recent'>('categories');
  const [activeTag, setActiveTag] = useState<string | null>(null);

  return (
    <div style={{ display: 'grid', gap: 24 }}>
      {/* 知识分类标签筛选 */}
      {data.tags && data.tags.length > 0 && (
        <div
          data-testid="knowledge-tag-filter"
          style={{
            display: 'flex',
            gap: 8,
            flexWrap: 'wrap',
            padding: '12px 0',
            borderBottom: '1px solid #e2e8f0',
          }}
        >
          {data.tags.map((tag) => (
            <button
              key={tag.id}
              data-testid={`tag-${tag.id}`}
              data-active={activeTag === tag.id}
              onClick={() => setActiveTag(activeTag === tag.id ? null : tag.id)}
              style={{
                padding: '4px 16px',
                borderRadius: 9999,
                border: activeTag === tag.id ? '2px solid #3b82f6' : '1px solid #cbd5e1',
                background: activeTag === tag.id ? '#eff6ff' : '#ffffff',
                color: activeTag === tag.id ? '#2563eb' : '#475569',
                fontWeight: activeTag === tag.id ? 600 : 400,
                fontSize: 13,
                cursor: 'pointer',
              }}
            >
              {tag.label}
            </button>
          ))}
        </div>
      )}
      {/* 统计卡片 */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16 }}>
        <Card style={{ padding: 16 }}>
          <div style={{ fontSize: 12, color: '#94a3b8' }}>文档总数</div>
          <div style={{ fontSize: 28, fontWeight: 700, margin: '8px 0' }}>{data.totalDocuments}</div>
          <div style={{ fontSize: 12, color: '#64748b' }}>覆盖 6 个分类</div>
        </Card>
        <Card style={{ padding: 16 }}>
          <div style={{ fontSize: 12, color: '#94a3b8' }}>阅读量</div>
          <div style={{ fontSize: 28, fontWeight: 700, margin: '8px 0', color: '#22c55e' }}>{data.totalViews.toLocaleString()}</div>
          <div style={{ fontSize: 12, color: '#64748b' }}>累计阅读</div>
        </Card>
      </div>

      {/* Tab */}
      <Tabs
        items={[
          { key: 'categories', label: '📁 分类浏览', count: data.categories.length },
          { key: 'recent', label: '📋 最近更新', count: data.recentDocuments.length },
        ]}
        activeKey={activeTab}
        onChange={(key) => setActiveTab(key as typeof activeTab)}
        variant="pills"
      />

      {/* 分类 */}
      {activeTab === 'categories' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
          {data.categories.map(cat => (
            <Card key={cat.id} style={{ padding: 16, cursor: 'pointer' }}>
              <div style={{ fontSize: 28, marginBottom: 8 }}>{cat.icon}</div>
              <div style={{ fontWeight: 600, fontSize: 15, marginBottom: 4 }}>{cat.name}</div>
              <div style={{ fontSize: 12, color: '#94a3b8' }}>
                {cat.docCount} 篇文档 · 最后更新 {cat.lastUpdated}
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* 最近文档 */}
      {activeTab === 'recent' && (
        <div style={{ display: 'grid', gap: 12 }}>
          {data.recentDocuments.map(doc => (
            <Card key={doc.id} style={{ padding: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                <div style={{ fontWeight: 600, fontSize: 14, color: '#93c5fd' }}>{doc.title}</div>
                <StatusBadge label={doc.category} variant="default" size="sm" />
              </div>
              <div style={{ fontSize: 13, color: '#94a3b8', marginBottom: 6 }}>{doc.summary}</div>
              <div style={{ fontSize: 12, color: '#64748b' }}>
                {doc.author} · {doc.updatedAt}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
