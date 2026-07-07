import React from 'react';
export interface QuickStatItem {
    /** 展示标签 */
    label: string;
    /** 主数值/文字 */
    value: string | number;
    /** 辅助说明文字 */
    helper?: string;
    /** 主值颜色覆盖 */
    valueColor?: string;
}
export interface QuickStatsProps {
    /** 统计数据项 */
    items: QuickStatItem[];
    /** 列数 (默认 4) */
    columns?: number;
    /** 间距 (默认 14) */
    gap?: number;
    /** 卡片内边距 (默认 18) */
    padding?: number;
}
/**
 * QuickStats — 快速统计概览行
 *
 * 用于列表页顶部，展示关键指标卡片。
 * 替代重复的手写 stat 卡片模板代码。
 *
 * @example
 * <QuickStats
 *   items={[
 *     { label: '总数', value: 15, helper: '5 个区域' },
 *     { label: '运营中', value: 8, valueColor: '#4ade80', helper: '53% 激活率' },
 *   ]}
 *   columns={4}
 * />
 */
export declare function QuickStats({ items, columns, gap, padding, }: QuickStatsProps): React.JSX.Element | null;
