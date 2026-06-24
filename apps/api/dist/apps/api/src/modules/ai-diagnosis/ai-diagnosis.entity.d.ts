/**
 * AI 诊断：单次规则引擎执行的诊断结果
 * 用于记录"为什么这个 case 被这个规则命中/未命中"
 */
export interface DiagnosisEntity {
    /** 诊断唯一标识 */
    diagnosisId: string;
    /** 关联的规则引擎 ID */
    engineId: string;
    /** 关联的场景 ID（来自 simulator） */
    scenarioId: string;
    /** 诊断状态 */
    status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED';
    /** 命中的规则 ID 列表 */
    matchedRuleIds: string[];
    /** 命中的条件 ID 列表（按权重降序） */
    matchedConditionIds: string[];
    /** 命中的动作 ID 列表 */
    triggeredActionIds: string[];
    /** 风险等级（low/medium/high/critical） */
    riskLevel: 'low' | 'medium' | 'high' | 'critical';
    /** 诊断建议（人类可读） */
    recommendation: string;
    /** 诊断用的 prompt 摘要 */
    promptSummary: string;
    /** 评估耗时（毫秒） */
    evaluationDurationMs: number;
    /** 输入 payload（脱敏后） */
    inputSnapshot: Record<string, unknown>;
    /** 输出 payload（脱敏后） */
    outputSnapshot: Record<string, unknown>;
    /** 创建时间 */
    createdAt: string;
    /** 完成时间（可选） */
    completedAt?: string;
    /** 关联租户 ID */
    tenantId: string;
    /** 关联发起人 */
    requestedBy: string;
}
/**
 * 诊断集合：批量诊断结果，用于 A/B 评估规则变化
 */
export interface DiagnosisBatch {
    /** 批量诊断唯一标识 */
    batchId: string;
    /** 关联的规则引擎 ID */
    engineId: string;
    /** 诊断总数 */
    totalDiagnoses: number;
    /** 命中的诊断数 */
    matchedDiagnoses: number;
    /** 命中率 */
    matchRate: number;
    /** 风险等级分布 */
    riskDistribution: {
        low: number;
        medium: number;
        high: number;
        critical: number;
    };
    /** 平均评估耗时（毫秒） */
    avgEvaluationDurationMs: number;
    /** 诊断列表 */
    diagnoses: DiagnosisEntity[];
    /** 创建时间 */
    createdAt: string;
    /** 触发者 */
    triggeredBy: string;
    /** 关联租户 ID */
    tenantId: string;
}
//# sourceMappingURL=ai-diagnosis.entity.d.ts.map