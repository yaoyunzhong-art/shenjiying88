'use client';

import { SearchFilterInput, useSearchFilter, EmptyState, StatusBadge } from '@m5/ui';
import Link from 'next/link';
import type { RoleWorkbenchContract } from '@m5/types';
import { normalizeWorkbenchRoleKey } from '../bootstrap';

interface PadModuleListItem {
  key: string;
  label: string;
  description: string;
  href: string;
  channel: string;
  marketCodes: string[];
}

/**
 * PadModuleList — admin-web Pad 端模块列表客户端组件。
 * 从角色工作台数据中抽取并格式化 Pad 相关模块，支持按名称 / 描述 / 渠道搜索过滤。
 */
export function PadModuleList({ workbenches }: { workbenches: RoleWorkbenchContract[] }) {
  // 从 workbenches 中提取所有导航模块作为可搜索项
  const padModules: PadModuleListItem[] = workbenches.flatMap((wb) =>
    wb.navItems.map((item) => ({
      key: `${wb.role}-${item.key}`,
      label: item.label,
      description: item.description,
      href: `/pad/${normalizeWorkbenchRoleKey(wb.role)}`,
      channel: wb.channel,
      marketCodes: wb.marketCodes
    }))
  );

  const searchResult = useSearchFilter(padModules, ['label', 'description', 'channel']) as { searchTerm: string; setSearchTerm: (v: string) => void; filteredItems: typeof padModules; matchedCount: number; totalCount: number };
  const { searchTerm, setSearchTerm, filteredItems, matchedCount, totalCount } = searchResult;

  if (padModules.length === 0) {
    return (
      <EmptyState
        title="暂无 Pad 模块"
        description="当前没有可用的 Pad 端功能模块，请联系管理员配置工作台。"
      />
    );
  }

  return (
    <div>
      {/* 搜索框 */}
      <div style={{ marginTop: 8 }}>
        <SearchFilterInput
          value={searchTerm}
          onChange={setSearchTerm}
          placeholder="搜索 Pad 模块（名称、描述、渠道）..."
        />
      </div>

      {/* 搜索结果提示 */}
      {searchTerm.trim().length > 0 ? (
        <div style={{ marginTop: 14, fontSize: 13, color: '#93c5fd', display: 'flex', gap: 8, alignItems: 'center' }}>
          <span>搜索 &quot;{searchTerm}&quot;</span>
          <StatusBadge label={`${matchedCount} / ${totalCount}`} variant="info" size="sm" />
          <span>个模块</span>
        </div>
      ) : (
        <div style={{ marginTop: 14, fontSize: 13, color: '#cbd5e1' }}>
          共 {totalCount} 个 Pad 端功能模块
        </div>
      )}

      {/* 无匹配结果 */}
      {filteredItems.length === 0 ? (
        <div style={{ marginTop: 16 }}>
          <EmptyState
            title="无匹配模块"
            description={`没有匹配 "${searchTerm}" 的 Pad 模块，请尝试其他关键词如“接待”“收银”“门店”。`}
          />
        </div>
      ) : (
        /* Pad 模块网格列表 */
        <div style={{ marginTop: 16, display: 'grid', gap: 12, gridTemplateColumns: 'repeat(2, minmax(0, 1fr))' }}>
          {filteredItems.map((mod) => (
            <Link
              key={mod.key}
              href={mod.href}
              style={{
                display: 'block',
                borderRadius: 16,
                padding: 18,
                background: 'rgba(15, 23, 42, 0.38)',
                border: '1px solid rgba(148, 163, 184, 0.18)',
                textDecoration: 'none',
                transition: 'border-color 0.15s ease'
              }}
            >
              <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 10 }}>
                <StatusBadge label={mod.channel} variant="warning" size="sm" />
                {mod.marketCodes.map((mkt) => (
                  <StatusBadge key={mkt} label={mkt} variant="default" size="sm" />
                ))}
              </div>
              <div style={{ fontSize: 17, fontWeight: 700, color: '#f8fafc' }}>{mod.label}</div>
              <div style={{ marginTop: 8, fontSize: 14, color: '#cbd5e1' }}>{mod.description}</div>
              <div style={{ marginTop: 12, fontSize: 13, color: '#93c5fd' }}>进入模块 →</div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
