'use client';

import Link from 'next/link';
import { SearchFilterInput, useSearchFilter, EmptyState } from '@m5/ui';
import type { RoleWorkbenchContract } from '@m5/types';
import { normalizeWorkbenchRoleKey } from '../bootstrap';

/**
 * WorkbenchList — admin-web 工作台列表客户端组件。
 * 支持按 title / description / channel 进行搜索过滤。
 * 无数据时使用 EmptyState 统一占位，搜索无匹配时给出专业空结果提示。
 */
interface WorkbenchListProps {
  workbenches: RoleWorkbenchContract[];
  deliveryMode?: 'api' | 'fallback';
  sourceLabel?: string;
}

export function WorkbenchList({
  workbenches,
  deliveryMode,
  sourceLabel,
}: WorkbenchListProps) {
  const { searchTerm, setSearchTerm, filteredItems, matchedCount, totalCount } = useSearchFilter(
    workbenches,
    ['title', 'description', 'channel']
  );

  // 全局无数据
  if (workbenches.length === 0) {
    return (
      <EmptyState
        title="暂无工作台"
        description="Bootstrap 未返回任何工作台数据，请检查 API 连接或网络后重试。"
      />
    );
  }

  return (
    <div>
      {deliveryMode ? (
        <div
          style={{
            marginBottom: 12,
            padding: '10px 12px',
            borderRadius: 12,
            background: 'rgba(15, 23, 42, 0.25)',
            border: '1px solid rgba(148, 163, 184, 0.12)',
            fontSize: 13,
          }}
        >
          <div style={{ color: '#e2e8f0' }}>
            Delivery {deliveryMode} · 工作台列表来源: {sourceLabel ?? 'snapshot.workbenches'}
          </div>
          <div style={{ marginTop: 6, color: '#94a3b8' }}>
            当前列表已显式区分实时工作台快照与 fallback 工作台目录，避免首页工作台入口被误判为纯实时数据。
          </div>
        </div>
      ) : null}

      <SearchFilterInput
        value={searchTerm}
        onChange={setSearchTerm}
        placeholder="搜索工作台（名称、描述、渠道）..."
      />

      {/* 搜索结果提示 */}
      {searchTerm.trim().length > 0 ? (
        <div style={{ marginTop: 12, fontSize: 13, color: '#93c5fd' }}>
          搜索 &quot;{searchTerm}&quot;：{matchedCount} / {totalCount} 个工作台
        </div>
      ) : null}

      {/* 搜索无匹配 — 统一 EmptyState */}
      {filteredItems.length === 0 ? (
        <div style={{ marginTop: 16 }}>
          <EmptyState
            title="无匹配结果"
            description={`没有匹配 "${searchTerm}" 的工作台，请尝试其他关键词。`}
            variant="compact"
          />
        </div>
      ) : (
        /* 工作台列表 */
        <div style={{ marginTop: 16, display: 'grid', gap: 12, gridTemplateColumns: 'repeat(2, minmax(0, 1fr))' }}>
          {filteredItems.map((workbench) => (
            <Link
              key={workbench.role}
              href={`/workbench/${normalizeWorkbenchRoleKey(workbench.role)}`}
              style={{
                borderRadius: 16,
                padding: 18,
                background: 'rgba(15, 23, 42, 0.38)',
                border: '1px solid rgba(148, 163, 184, 0.18)'
              }}
            >
              <div style={{ fontSize: 18, fontWeight: 700 }}>{workbench.title}</div>
              <div style={{ marginTop: 8, color: '#cbd5e1' }}>{workbench.description}</div>
              <div style={{ marginTop: 10, fontSize: 13, color: '#93c5fd' }}>{workbench.channel}</div>
              <div style={{ marginTop: 8, fontSize: 13, color: '#cbd5e1' }}>
                市场作用域：{workbench.marketCodes.join(' / ')}
              </div>
              {deliveryMode ? (
                <div style={{ marginTop: 8, fontSize: 12, color: '#94a3b8' }}>
                  来源: {deliveryMode === 'api' ? '实时工作台快照' : 'fallback 工作台目录'}
                </div>
              ) : null}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
