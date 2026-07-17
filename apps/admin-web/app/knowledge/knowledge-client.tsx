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

interface KnowledgeSnapshot {
  categories: KnowledgeCategory[];
  recentDocuments: RecentDocument[];
  totalDocuments: number;
  totalViews: number;
}

export default function KnowledgeClient({ data }: { data: KnowledgeSnapshot }) {
  const [activeTab, setActiveTab] = useState<'categories' | 'recent'>('categories');

  return (
    <div style={{ display: 'grid', gap: 24 }}>
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
