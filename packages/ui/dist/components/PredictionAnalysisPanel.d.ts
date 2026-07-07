import React from 'react';
/** 预测置信区间 */
export interface ConfidenceInterval {
    lowerBound: number;
    upperBound: number;
    confidenceLevel: number;
}
/** 单个预测数据点 */
export interface PredictionPoint {
    label: string;
    predictedValue: number;
    actualValue?: number;
    confidenceInterval?: ConfidenceInterval;
    trend?: 'up' | 'down' | 'stable';
    anomalyScore?: number;
}
/** 预测分析摘要 */
export interface PredictionSummary {
    /** 最高置信度预测 */
    bestPrediction: string;
    /** 预测趋势 */
    overallTrend: 'up' | 'down' | 'stable';
    /** 变化百分比 */
    changePercent: number;
    /** 风险等级 */
    riskLevel: 'low' | 'medium' | 'high';
    /** AI 建议 */
    recommendation?: string;
}
/** 预测分析面板属性 */
export interface PredictionAnalysisPanelProps {
    /** 标题 */
    title?: string;
    /** 预测数据点列表 */
    predictions: PredictionPoint[];
    /** 预测摘要 */
    summary?: PredictionSummary;
    /** 加载状态 */
    loading?: boolean;
    /** 错误状态 */
    error?: string;
    /** 空状态文案 */
    emptyText?: string;
    /** 自定义类名 */
    className?: string;
    /** 指标单位 */
    unit?: string;
}
export declare const PredictionAnalysisPanel: React.FC<PredictionAnalysisPanelProps>;
export default PredictionAnalysisPanel;
