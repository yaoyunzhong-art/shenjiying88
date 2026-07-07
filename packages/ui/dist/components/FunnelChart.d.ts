import React from 'react';
export interface FunnelStage {
    label: string;
    value: number;
    color?: string;
    /** Optional sub-label shown below value */
    subLabel?: string;
}
export interface FunnelChartProps {
    /** Ordered funnel stages (top → bottom) */
    stages: FunnelStage[];
    /** Chart title */
    title?: string;
    /** Bar height in px */
    barHeight?: number;
    /** Show conversion rate between stages */
    showConversion?: boolean;
    /** Show value labels */
    showValues?: boolean;
    /** Show percentage of first stage */
    showPercentage?: boolean;
    /** Empty state text */
    emptyText?: string;
    /** Loading state */
    loading?: boolean;
    /** Custom class name */
    className?: string;
    /** Test id */
    'data-testid'?: string;
}
/**
 * FunnelChart — a conversion funnel visualization for AI decision
 * dashboards, showing stage-by-stage drop-off with optional
 * conversion rate labels.
 */
export declare function FunnelChart({ stages: rawStages, title, barHeight, showConversion, showValues, showPercentage, emptyText, loading, className, 'data-testid': dataTestId, }: FunnelChartProps): React.JSX.Element;
export default FunnelChart;
