import 'reflect-metadata';
/**
 * Foundation 模块 DTO 类型定义
 *
 * Foundation 模块绝大多数端点读取参数通过 @Param/@TenantContext/@CurrentActor
 * 等装饰器绑定到路由参数或上下文；少数 POST 接口的请求体由在线类型标注。
 * 此文件集中导出请求/响应体 DTO 接口，便于跨模块引用和运行时校验。
 */
/**
 * 告警确认请求体
 */
export interface AlertAcknowledgeDto {
    note?: string;
}
/**
 * 告警静默请求体
 */
export interface AlertMuteDto {
    mutedUntil?: string;
    note?: string;
}
/**
 * 告警取消静默请求体
 */
export interface AlertUnmuteDto {
    note?: string;
}
/**
 * 不支持的告警码响应
 */
export interface UnsupportedAlertCodeResponseDto {
    generatedAt: string;
    code: string;
    availableAlertCodes: readonly string[];
}
/**
 * 模块详情响应
 */
export interface ModuleDetailResponseDto {
    generatedAt: string;
    moduleKey: string;
    health: {
        module: string;
        score: number;
        status: 'healthy' | 'warning' | 'critical';
        indicators: Record<string, number>;
    };
    detail: Record<string, unknown>;
    availableModuleKeys?: readonly string[];
}
/**
 * 消费者依赖响应（未找到时返回可选列表）
 */
export interface ConsumerDependencyResponseDto {
    consumer?: string;
    modulePath?: string;
    dependsOn?: string[];
    responsibility?: string;
    handoffContracts?: string[];
    recommendedSequence?: string[];
    governanceTouchpoints?: string[];
    highRiskEntrypoints?: string[];
    availableConsumers?: string[];
    [key: string]: unknown;
}
//# sourceMappingURL=foundation.dto.d.ts.map