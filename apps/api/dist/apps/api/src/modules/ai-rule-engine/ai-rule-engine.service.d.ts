import { type MemberLevelInput, type MemberLevelOutput, type DeviceAnomalyInput, type DeviceAnomalyOutput, type BatchEvaluateRequest, type BatchEvaluateResponse, type EngineStatus, type RiskScoreInput, type RiskScoreOutput, type RuleSimulator, type SimulatorRunInput, type SimulatorResult, type SimulatorSummary } from './ai-rule-engine.entity';
export declare class AiRuleEngineService {
    private readonly memberLevelEngine;
    private readonly deviceAnomalyEngine;
    private readonly riskScoreEngine;
    /**
     * 评估成员等级
     */
    evaluateMemberLevel(input: MemberLevelInput): MemberLevelOutput;
    /**
     * 检测设备异常
     */
    detectDeviceAnomaly(input: DeviceAnomalyInput): DeviceAnomalyOutput;
    /**
     * 评估单个条件
     */
    private evaluateCondition;
    /**
     * 推断当前等级
     */
    private inferCurrentLevel;
    /**
     * 获取建议
     */
    private getRecommendation;
    /**
     * 批量评估：同时评估多个成员和设备
     */
    batchEvaluate(request: BatchEvaluateRequest): BatchEvaluateResponse;
    /**
     * 评估风险评分
     */
    evaluateRiskScore(input: RiskScoreInput): RiskScoreOutput;
    /**
     * 获取风险建议
     */
    private getRiskRecommendation;
    /**
     * 获取所有引擎状态
     */
    getEngineStatus(): EngineStatus[];
    /**
     * 确定异常类型
     */
    private determineAnomalyType;
    private readonly simulators;
    /**
     * 获取所有模拟器
     */
    listSimulators(): RuleSimulator[];
    /**
     * 获取单个模拟器
     */
    getSimulator(simulatorId: string): RuleSimulator | undefined;
    /**
     * 单次模拟运行：模拟一条规则评估
     */
    runSimulator(input: SimulatorRunInput): SimulatorResult;
    /**
     * 多轮模拟运行：批量模拟并生成聚合摘要
     */
    runSimulatorBatch(input: SimulatorRunInput & {
        rounds?: number;
    }): SimulatorSummary;
    /**
     * 数据变异：为模拟引入随机噪声，测试规则鲁棒性
     */
    private mutateData;
    /**
     * 计算百分位数
     */
    private percentile;
    /**
     * 应用条件值覆盖
     */
    private applyConditionOverrides;
}
//# sourceMappingURL=ai-rule-engine.service.d.ts.map