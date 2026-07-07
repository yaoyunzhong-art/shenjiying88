import React from 'react';
/** 季节性因子 */
export interface SeasonalFactor {
    label: string;
    index: number;
    description?: string;
}
/** 单品预测 */
export interface ForecastItem {
    sku: string;
    name: string;
    /** 预测销量 */
    forecastQty: number;
    /** 实际销量（可选，用于回测） */
    actualQty?: number;
    /** 置信区间下限 */
    forecastLower: number;
    /** 置信区间上限 */
    forecastUpper: number;
    /** 建议补货量 */
    suggestedReorder: number;
    /** 当前库存 */
    currentStock: number;
    /** 覆盖天数 */
    stockCoverDays: number;
    /** 季节性影响 */
    seasonalFactor?: number;
    /** 趋势方向 */
    trend: 'up' | 'down' | 'stable';
}
/** 仓库级汇总 */
export interface ForecastSummary {
    totalForecastQty: number;
    totalActualQty?: number;
    avgAccuracy?: number;
    totalSuggestedReorder: number;
    highDemandSkuCount: number;
    lowStockSkuCount: number;
    peakSeasonLabel?: string;
    predictionHorizon: string;
}
/** 面板属性 */
export interface AIDemandForecastPanelProps {
    title?: string;
    /** 门店/仓库名称 */
    locationLabel?: string;
    /** 预测列表 */
    forecasts: ForecastItem[];
    /** 季节性因子列表 */
    seasonalFactors?: SeasonalFactor[];
    /** 汇总 */
    summary?: ForecastSummary;
    /** 加载中 */
    loading?: boolean;
    /** 错误 */
    error?: string;
    /** 空状态 */
    emptyText?: string;
    /** 自定义类名 */
    className?: string;
}
export declare const AIDemandForecastPanel: React.FC<AIDemandForecastPanelProps>;
export default AIDemandForecastPanel;
