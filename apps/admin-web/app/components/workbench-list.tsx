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
export function WorkbenchList({ workbenches }: { workbenches: RoleWorkbenchContract[] }) {
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
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
