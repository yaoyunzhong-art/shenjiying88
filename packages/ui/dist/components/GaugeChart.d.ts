import React from 'react';
/** 仪表盘颜色段定义 */
export interface GaugeSegment {
    /** 段起始值 (0-100) */
    from: number;
    /** 段结束值 (0-100) */
    to: number;
    /** 段颜色 */
    color: string;
    /** 段标签 */
    label?: string;
}
export interface GaugeChartProps {
    /** 当前值 (0-100) */
    value: number;
    /** 最小值，默认 0 */
    min?: number;
    /** 最大值，默认 100 */
    max?: number;
    /** 仪表盘标签 */
    label?: string;
    /** 底部显示的值后缀，如 % */
    suffix?: string;
    /** 颜色段定义 */
    segments?: GaugeSegment[];
    /** 仪表盘直径 (px)，默认 160 */
    size?: number;
    /** (兼容别名) 宽度，映射到 size */
    width?: number;
    /** (兼容别名) 高度，不影响渲染 */
    height?: number;
    /** 弧线宽度 (px)，默认 18 */
    arcWidth?: number;
    /** 是否显示刻度标签 */
    showTicks?: boolean;
    /** 自定义类名 */
    className?: string;
    /** 自定义样式 */
    style?: React.CSSProperties;
}
export declare function GaugeChart({ value, min, max, label, suffix, segments, size: _size, width: _width, height, arcWidth, showTicks, className, style, }: GaugeChartProps): React.JSX.Element;
export default GaugeChart;
