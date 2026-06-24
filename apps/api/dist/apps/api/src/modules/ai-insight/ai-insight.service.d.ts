import { type InsightReport, type KPI, type Anomaly, type Trend, type DashboardSummary } from './ai-insight.entity';
/**
 * AI 经营洞察服务
 * KPI 看板 | 洞察报告 | 异常检测 | 趋势预测 | 仪表盘
 */
export declare class AiInsightService {
    /** KPI 指标池 */
    private kpis;
    /** 异常记录池 */
    private anomalies;
    /** 趋势记录池 */
    private trends;
    /** 报告池 */
    private reports;
    constructor();
    /**
     * 获取KPI列表，支持按分类筛选
     */
    getKPIs(tenantId: string, storeId?: string, category?: string): KPI[];
    /**
     * 获取单个KPI详情
     */
    getKPIDetail(kpiId: string): KPI | undefined;
    /**
     * 生成洞察报告
     * 模拟 AI 分析：聚合数据 + 计算趋势 + 检测异常
     */
    generateReport(tenantId: string, storeId: string | undefined, type: InsightReport['type'], periodStart: string, periodEnd: string): InsightReport;
    /**
     * 查询报告列表
     */
    getReports(tenantId: string, options?: {
        storeId?: string;
        type?: string;
        limit?: number;
    }): InsightReport[];
    /**
     * 执行异常检测
     * 基于 3-sigma 规则检测异常值
     */
    detectAnomalies(tenantId: string, storeId?: string, metric?: string): Anomaly[];
    /**
     * 确认异常
     */
    acknowledgeAnomaly(id: string): Anomaly | undefined;
    /**
     * 解决异常
     */
    resolveAnomaly(id: string): Anomaly | undefined;
    /**
     * 查询异常列表
     */
    getAnomalies(tenantId: string, options?: {
        storeId?: string;
        status?: string;
        severity?: string;
        limit?: number;
    }): Anomaly[];
    /**
     * 生成趋势预测
     * 使用简单移动平均 + 线性回归进行预测
     */
    generateForecast(tenantId: string, metric: string, period: string): Trend;
    /**
     * 获取趋势预测
     */
    getForecast(trendId: string): Trend | undefined;
    /**
     * 获取仪表盘摘要
     */
    getDashboardSummary(tenantId: string, storeId?: string): DashboardSummary;
    /**
     * 类型到分类映射
     */
    private typeToCategory;
    /**
     * 获取类型标签
     */
    private getTypeLabel;
    /**
     * 模拟上期值
     */
    private simulatePreviousValue;
    /**
     * 生成摘要文本
     */
    private generateSummary;
    /**
     * 简单线性回归
     * y = intercept + slope * x
     */
    private linearRegression;
    /**
     * 计算 R² 决定系数
     */
    private calculateRSquared;
    /**
     * 按分类求和
     */
    private sumByCategory;
    /**
     * 模拟同比变化百分比
     */
    private simulateYoyPercent;
    /**
     * 初始化模拟数据
     */
    private seedData;
}
//# sourceMappingURL=ai-insight.service.d.ts.map