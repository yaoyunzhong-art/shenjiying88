import 'reflect-metadata';
/**
 * 设备指标数据
 */
export declare class DeviceMetricsDto {
    cpuUsage: number;
    memoryUsage: number;
    diskUsage: number;
    networkLatencyMs: number;
    errorRate: number;
    uptimeHours: number;
}
/**
 * 成员等级评估输入 DTO
 */
export declare class MemberLevelInputDto {
    memberId: string;
    totalPoints: number;
    totalSpend: number;
    visitCount: number;
    tenantId: string;
}
/**
 * 设备异常检测输入 DTO
 */
export declare class DeviceAnomalyInputDto {
    deviceId: string;
    storeId: string;
    metrics: DeviceMetricsDto;
    tenantId: string;
}
/**
 * AI 规则引擎评估请求 DTO
 */
export declare class EvaluateRequestDto {
    type: 'member-level' | 'device-anomaly';
    data: Record<string, unknown>;
}
/**
 * 批量评估单项请求
 */
export declare class BatchEvaluateItemDto {
    type: 'member-level' | 'device-anomaly';
    data: Record<string, unknown>;
}
/**
 * 批量评估请求 DTO
 */
export declare class BatchEvaluateRequestDto {
    items: BatchEvaluateItemDto[];
}
/**
 * 风险评分指标 DTO（所有字段可选）
 */
export declare class RiskMetricsDto {
    refundCount?: number;
    abnormalPaymentCount?: number;
    deviceAnomalyCount?: number;
    complaintCount?: number;
    voidRefundAmount?: number;
    activeDays?: number;
    recentTransactionAmount?: number;
}
/**
 * 风险评分输入 DTO
 */
export declare class RiskScoreInputDto {
    subjectId: string;
    subjectType: 'member' | 'device' | 'store';
    metrics: RiskMetricsDto;
    tenantId: string;
}
/**
 * 条件覆盖项 DTO
 */
export declare class ConditionOverrideDto {
    conditionId: string;
    value: unknown;
}
/**
 * 模拟运行输入 DTO
 */
export declare class SimulatorRunInputDto {
    simulatorId: string;
    conditionOverrides?: ConditionOverrideDto[];
    dataType: 'member-level' | 'device-anomaly' | 'risk-score';
    data: Record<string, unknown>;
    verbose?: boolean;
}
//# sourceMappingURL=ai-rule-engine.dto.d.ts.map