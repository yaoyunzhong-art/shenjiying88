import React from 'react';
/** 热力图单元格 */
export interface HeatmapCell {
    /** 行标签（如设备ID / 会员等级） */
    rowLabel: string;
    /** 列标签（如时间段 / 指标名称） */
    colLabel: string;
    /** 数值 */
    value: number;
    /** 自定义颜色覆盖 */
    color?: string;
}
/** 热力图颜色方案 */
export type HeatmapColorScheme = 'red' | 'blue' | 'green' | 'amber' | 'purple' | 'cool';
/** 热力图组件 Props */
export interface HeatmapChartProps {
    /** 数据矩阵 */
    data: HeatmapCell[];
    /** 行标签列表 */
    rowLabels?: string[];
    /** 列标签列表 */
    colLabels?: string[];
    /** 图表宽度 */
    width?: number;
    /** 图表高度 */
    height?: number;
    /** 标题 */
    title?: string;
    /** 颜色方案 */
    colorScheme?: HeatmapColorScheme;
    /** 是否显示数值标签 */
    showValues?: boolean;
    /** 是否显示图例 */
    showLegend?: boolean;
    /** 自定义类名 */
    className?: string;
    /** 空状态文案 */
    emptyText?: string;
    /** 单元格点击回调 */
    onCellClick?: (cell: HeatmapCell) => void;
}
/**
 * HeatmapChart — 热力图数据可视化组件。
 *
 * 以矩阵色块方式展示二维数据分布密度，适用于：
 * - 设备状态热力图（设备 x 时间段）
 * - 会员等级分布（等级 x 地区/门店）
 * - 告警热度分布（告警类型 x 时间窗）
 * - 销售热力分布（商品 x 时段）
 *
 * 使用纯 SVG 实现，零外部依赖，支持动画。
 *
 * @example
 * // 设备状态热力图
 * <HeatmapChart
 *   title="设备状态热力图"
 *   data={[
 *     { rowLabel: '设备A', colLabel: '00-04', value: 85 },
 *     { rowLabel: '设备A', colLabel: '04-08', value: 72 },
 *     { rowLabel: '设备B', colLabel: '00-04', value: 45 },
 *   ]}
 *   rowLabels={['设备A', '设备B', '设备C']}
 *   colLabels={['00-04', '04-08', '08-12', '12-16', '16-20', '20-24']}
 *   colorScheme="red"
 *   showValues
 * />
 *
 * @example
 * // 会员等级分布
 * <HeatmapChart
 *   title="会员等级门店分布"
 *   data={[{ rowLabel: '黄金', colLabel: '门店A', value: 230 }]}
 *   rowLabels={['黄金', '白银', '青铜']}
 *   colLabels={['门店A', '门店B', '门店C']}
 *   colorScheme="amber"
 * />
 */
export declare function HeatmapChart({ data, rowLabels, colLabels, width, height, title, colorScheme, showValues, showLegend, className, emptyText, onCellClick, }: HeatmapChartProps): React.JSX.Element;
