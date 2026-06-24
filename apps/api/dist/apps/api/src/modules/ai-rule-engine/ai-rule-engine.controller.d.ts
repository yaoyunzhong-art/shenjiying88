import { AiRuleEngineService } from './ai-rule-engine.service';
import { MemberLevelInputDto, DeviceAnomalyInputDto, EvaluateRequestDto, BatchEvaluateRequestDto, RiskScoreInputDto, SimulatorRunInputDto } from './ai-rule-engine.dto';
import type { MemberLevelOutput, DeviceAnomalyOutput, BatchEvaluateResponse, RiskScoreOutput, SimulatorResult, SimulatorSummary, RuleSimulator } from './ai-rule-engine.entity';
interface EvaluateResponse {
    type: string;
    result: MemberLevelOutput | DeviceAnomalyOutput;
    timestamp: string;
}
export declare class AiRuleEngineController {
    private readonly aiRuleEngineService;
    constructor(aiRuleEngineService: AiRuleEngineService);
    evaluate(body: EvaluateRequestDto): EvaluateResponse;
    evaluateMemberLevel(input: MemberLevelInputDto): EvaluateResponse;
    detectDeviceAnomaly(input: DeviceAnomalyInputDto): EvaluateResponse;
    /** 批量评估：一次请求评估多个成员和设备 */
    evaluateBatch(request: BatchEvaluateRequestDto): BatchEvaluateResponse;
    /** 风险评分：综合评估业务风险 */
    evaluateRiskScore(input: RiskScoreInputDto): {
        type: string;
        result: RiskScoreOutput;
        timestamp: string;
    };
    /** 获取所有规则引擎状态 */
    getEngines(): import("./ai-rule-engine.entity").EngineStatus[];
    /** 获取所有模拟器 */
    listSimulators(): RuleSimulator[];
    /** 获取指定模拟器 */
    getSimulator(id: string): RuleSimulator | undefined;
    /** 单次模拟运行 */
    runSimulator(input: SimulatorRunInputDto): SimulatorResult;
    /** 批量模拟运行 */
    runSimulatorBatch(input: SimulatorRunInputDto & {
        rounds?: number;
    }): SimulatorSummary;
}
export {};
//# sourceMappingURL=ai-rule-engine.controller.d.ts.map