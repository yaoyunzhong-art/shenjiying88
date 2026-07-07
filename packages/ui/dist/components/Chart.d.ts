import React from 'react';
export interface ChartDataPoint {
    label: string;
    value: number;
    color?: string;
}
export type ChartType = 'bar' | 'line' | 'donut';
export interface ChartProps {
    /** 图表类型 */
    type: ChartType;
    /** 数据点 */
    data: ChartDataPoint[];
    /** 图表宽度 */
    width?: number;
    /** 图表高度 */
    height?: number;
    /** 标题 */
    title?: string;
    /** 是否显示数值标签 */
    showValues?: boolean;
    /** 自定义颜色调色板 */
    palette?: string[];
    /** 自定义类名 */
    className?: string;
    /** 空状态文案 */
    emptyText?: string;
}
/**
 * Chart — 通用数据可视化组件。
 *
 * 支持三种图表类型：
 * - `bar`: 柱状图，适合对比分类数据
 * - `line`: 折线图，适合展示趋势变化
 * - `donut`: 环形图，适合展示占比分布
 *
 * 使用纯 SVG 实现，零外部依赖，支持动画。
 *
 * @example
 * // 柱状图
 * <Chart
 *   type="bar"
 *   data={[
 *     { label: 'Q1', value: 120 },
 *     { label: 'Q2', value: 200 },
 *   ]}
 *   title="季度营收"
 *   showValues
 * />
 *
 * @example
 * // 环形图
 * <Chart
 *   type="donut"
 *   data={[
 *     { label: '黄金', value: 450 },
 *     { label: '白银', value: 320 },
 *     { label: '青铜', value: 180 },
 *   ]}
 *   title="会员等级分布"
 * />
 */
export declare function Chart({ type, data, width, height, title, showValues, palette, className, emptyText, }: ChartProps): React.JSX.Element;
