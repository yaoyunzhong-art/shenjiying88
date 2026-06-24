/**
 * metrics.dto.ts — 可观测性模块 DTO
 *
 * 为监控面板、告警规则 CRUD 等提供请求/响应结构。
 */
import type { AlertRule } from './metrics.entity';
export interface MetricsListResponse {
    metrics: string[];
    count: number;
}
export interface HealthzResponse {
    status: 'ok' | 'degraded' | 'down';
    metrics: number;
    uptimeSeconds: number;
}
export interface CreateAlertRuleRequest {
    name: string;
    metricName: string;
    operator: '>' | '<' | '>=' | '<=' | '==';
    threshold: number;
    duration: string;
    severity: 'info' | 'warning' | 'critical';
    description?: string;
}
export interface UpdateAlertRuleRequest {
    name?: string;
    operator?: '>' | '<' | '>=' | '<=' | '==';
    threshold?: number;
    duration?: string;
    severity?: 'info' | 'warning' | 'critical';
    description?: string;
}
export interface AlertRuleResponse extends AlertRule {
    id: string;
    enabled: boolean;
    createdAt: string;
    updatedAt: string;
}
//# sourceMappingURL=metrics.dto.d.ts.map