import React from 'react';
export interface FilterChip {
    key: string;
    label: string;
    /** 可选的计数值展示在 chip 内 */
    count?: number;
    /** 视觉色调，默认 neutral */
    tone?: 'neutral' | 'warning' | 'danger' | 'success';
}
export interface FilterChipsProps {
    /** 提示文案 */
    hint?: string;
    /** 活跃的过滤条件列表 */
    chips: FilterChip[];
    /** 清除单个过滤条件的回调 */
    onRemove: (key: string) => void;
    /** 清除全部过滤条件的回调 */
    onClearAll?: () => void;
    /** 组件尺寸 */
    size?: 'sm' | 'md';
    style?: React.CSSProperties;
}
/**
 * FilterChips — 活跃过滤条件展示组件
 *
 * 以标签形式展示当前已应用的过滤条件，支持单独移除或一键清除。
 * 适用于列表页中搭配 Tabs / SearchFilterInput 的视觉反馈层。
 *
 * @example
 * <FilterChips
 *   chips={[
 *     { key: 'status', label: '运营中', tone: 'success', count: 8 },
 *     { key: 'region', label: '亚太' },
 *   ]}
 *   onRemove={(key) => removeFilter(key)}
 *   onClearAll={clearAllFilters}
 * />
 */
export declare function FilterChips({ hint, chips, onRemove, onClearAll, size, style, }: FilterChipsProps): React.JSX.Element | null;
