'use client';

/**
 * 🎨 ListToolbar — 统一列表工具栏
 * 搜索 + 筛选 + 排序 + 导出 + 批量切换，一键集成
 */
import React from 'react';
import type { CSSProperties } from 'react';

interface ListToolbarProps {
  /** 搜索结果数 */
  matchedCount: number;
  /** 搜索输入框 */
  searchInput?: React.ReactNode;
  /** 筛选 Chip 组 */
  filterChips?: React.ReactNode;
  /** 排序控件 */
  sortControl?: React.ReactNode;
  /** 导出按钮 */
  exportButton?: React.ReactNode;
  /** 批量操作切换（支持 ReactNode 或配置对象） */
  batchToggle?: React.ReactNode | { active: boolean; onClear: () => void };
  /** 左侧额外内容 */
  leftExtra?: React.ReactNode;
  /** 右侧额外内容 */
  rightExtra?: React.ReactNode;
  style?: CSSProperties;
}

export default function ListToolbar({
  matchedCount,
  searchInput,
  filterChips,
  sortControl,
  exportButton,
  batchToggle,
  leftExtra,
  rightExtra,
  style,
}: ListToolbarProps) {
  return (
    <div style={{ display: 'grid', gap: 10, ...style }}>
      {/* 第一行: 搜索 + 右侧操作 */}
      {(searchInput || exportButton || batchToggle || rightExtra) && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: 200 }}>{searchInput}</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {sortControl}
            {exportButton}
            {batchToggle as React.ReactNode}
            {rightExtra}
          </div>
        </div>
      )}

      {/* 第二行: 筛选 + 左侧额外 + 匹配计数 */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          {filterChips}
          {leftExtra}
        </div>
        <span style={{ fontSize: 12, color: '#64748b', whiteSpace: 'nowrap' }}>
          匹配 <strong style={{ color: '#93c5fd' }}>{matchedCount}</strong> 条
        </span>
      </div>
    </div>
  );
}
