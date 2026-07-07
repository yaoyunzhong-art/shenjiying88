import React from 'react';
/** 指标变化趋势 */
export type TrendDirection = 'up' | 'down' | 'flat';
/** 高亮指标项 */
export interface HighlightMetric {
    /** 指标名称 */
    label: string;
    /** 当前值 */
    value: string | number;
    /** 变化趋势 */
    trend?: TrendDirection;
    /** 变化百分比 */
    changePercent?: number;
    /** 指标单位 */
    unit?: string;
    /** 是否为正（绿）/负（红） */
    isPositive?: boolean;
}
/** 关键洞察 */
export interface InsightItem {
    /** 洞察类型: positive / negative / info */
    type: 'positive' | 'negative' | 'info';
    /** 洞察文本 */
    text: string;
}
/** AI 摘要卡片 Props */
export interface AISummaryCardProps {
    /** 摘要标题 */
    title?: string;
    /** AI 生成的摘要描述文本 */
    summary: string;
    /** 高亮指标列表（1-3 个最佳） */
    metrics?: HighlightMetric[];
    /** 关键洞察列表 */
    insights?: InsightItem[];
    /** 是否显示加载状态 */
    loading?: boolean;
    /** 加载失败时的错误文本 */
    error?: string;
    /** 数据刷新时间（ISO 字符串） */
    updatedAt?: string;
    /** 自定义类名 */
    className?: string;
    /** 点击 AI 分析区域回调 */
    onAIAnalyze?: () => void;
    /** 是否正在 AI 分析中 */
    analyzing?: boolean;
}
/**
 * AISummaryCard — AI 智能摘要卡片。
 *
 * 在详情页 / 仪表盘顶部展示 AI 自动生成的业务摘要，
 * 包含关键指标高亮显示和智能洞察，帮助运营人员快速掌握核心信息。
 *
 * 特性：
 * - AI 生成的摘要文本
 * - 1-3 个高亮指标（含趋势变化）
 * - 关键洞察列表（正面/负面/提示）
 * - 加载态 / 错误态 / 空状态
 * - AI 重新分析按钮
 * - 更新时间提示
 *
 * @example
 * // 基础用法
 * <AISummaryCard
 *   title="门店运营摘要"
 *   summary="今日门店订单量环比增长 12%，关键指标全部达标。其中线上订单增长显著，但退单率略有上升。"
 *   metrics={[
 *     { label: '订单量', value: 1280, trend: 'up', changePercent: 12, isPositive: true, unit: '单' },
 *     { label: '退单率', value: 3.2, trend: 'down', changePercent: -0.5, isPositive: false, unit: '%' },
 *   ]}
 *   insights={[
 *     { type: 'positive', text: '线上订单增长 25%，建议扩充晚班运力' },
 *     { type: 'negative', text: '商品 A 库存不足，建议及时补货' },
 *   ]}
 *   updatedAt={new Date().toISOString()}
 * />
 *
 * @example
 * // 加载状态
 * <AISummaryCard loading summary="" title="加载中..." />
 *
 * @example
 * // 错误状态
 * <AISummaryCard
 *   error="AI 分析服务暂时不可用，请稍后重试"
 *   summary=""
 * />
 */
export declare function AISummaryCard({ title, summary, metrics, insights, loading, error, updatedAt, className, onAIAnalyze, analyzing, }: AISummaryCardProps): React.JSX.Element;
export default AISummaryCard;
