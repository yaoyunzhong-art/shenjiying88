import 'reflect-metadata';
/**
 * 生成洞察报告 DTO
 */
export declare class GenerateReportDto {
    type: 'revenue' | 'member' | 'attendance' | 'game' | 'kpi';
    storeId?: string;
    periodStart: string;
    periodEnd: string;
}
/**
 * 洞察报告查询 DTO
 */
export declare class InsightReportQueryDto {
    storeId?: string;
    type?: 'revenue' | 'member' | 'attendance' | 'game' | 'kpi';
    limit?: number;
}
/**
 * KPI 查询 DTO
 */
export declare class KPIQueryDto {
    storeId?: string;
    category?: 'revenue' | 'member' | 'attendance' | 'game' | 'operation';
}
/**
 * 异常查询 DTO
 */
export declare class AnomalyQueryDto {
    storeId?: string;
    metric?: string;
    status?: 'open' | 'acknowledged' | 'resolved';
    severity?: 'low' | 'medium' | 'high' | 'critical';
    limit?: number;
}
/**
 * 解决异常 DTO
 */
export declare class ResolveAnomalyDto {
    anomalyId: string;
}
/**
 * 生成趋势预测 DTO
 */
export declare class GenerateForecastDto {
    metric: string;
    period: string;
}
/**
 * 仪表盘查询 DTO
 */
export declare class DashboardQueryDto {
    storeId?: string;
}
//# sourceMappingURL=ai-insight.dto.d.ts.map