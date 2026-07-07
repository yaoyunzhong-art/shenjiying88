import React from 'react';
export interface TrendDataPoint {
    label: string;
    value: number;
    /** Optional baseline / target */
    target?: number;
    /** Highlight color override */
    color?: string;
}
export interface SmartTrendChartProps {
    /** Time-series data points */
    data: TrendDataPoint[];
    /** Chart title */
    title?: string;
    /** Y-axis label */
    yAxisLabel?: string;
    /** Bar color (default theme) */
    barColor?: string;
    /** Target line color */
    targetColor?: string;
    /** Height in px */
    height?: number;
    /** Show data values on bars */
    showValues?: boolean;
    /** Show target line overlay */
    showTarget?: boolean;
    /** Loading state */
    loading?: boolean;
    /** Empty state text */
    emptyText?: string;
    /** Optional className */
    className?: string;
    /** Test id */
    'data-testid'?: string;
}
/**
 * SmartTrendChart — a simple bar/trend visualization for AI decision
 * dashboards, showing KPI values over time with optional target overlay.
 */
export declare function SmartTrendChart({ data, title, yAxisLabel, barColor, targetColor, height, showValues, showTarget, loading, emptyText, className, 'data-testid': dataTestId, }: SmartTrendChartProps): React.JSX.Element;
export default SmartTrendChart;
