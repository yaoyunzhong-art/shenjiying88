import { Controller, Post, Get, Body, Param, UsePipes, ValidationPipe } from '@nestjs/common'
import { AiRuleEngineService } from './ai-rule-engine.service'
import {
  MemberLevelInputDto,
  DeviceAnomalyInputDto,
  EvaluateRequestDto,
  BatchEvaluateRequestDto,
  RiskScoreInputDto,
  SimulatorRunInputDto
} from './ai-rule-engine.dto'
import type {
  MemberLevelInput,
  MemberLevelOutput,
  DeviceAnomalyInput,
  DeviceAnomalyOutput,
  BatchEvaluateRequest,
  BatchEvaluateResponse,
  RiskScoreInput,
  RiskScoreOutput,
  SimulatorRunInput,
  SimulatorResult,
  SimulatorSummary,
  RuleSimulator
} from './ai-rule-engine.entity'

interface EvaluateRequest {
  type: 'member-level' | 'device-anomaly'
  data: MemberLevelInput | DeviceAnomalyInput
}

interface EvaluateResponse {
  type: string
  result: MemberLevelOutput | DeviceAnomalyOutput
  timestamp: string
}

@Controller('ai-rule-engine')
@UsePipes(new ValidationPipe({ whitelist: true, transform: true }))
export class AiRuleEngineController {
  constructor(private readonly aiRuleEngineService: AiRuleEngineService) {}

  @Post('evaluate')
  evaluate(@Body() body: EvaluateRequestDto): EvaluateResponse {
    const { type, data } = body

    if (type === 'member-level') {
      const result = this.aiRuleEngineService.evaluateMemberLevel(
        data as unknown as MemberLevelInput
      )
      return {
        type: 'member-level',
        result,
        timestamp: new Date().toISOString()
      }
    }

    if (type === 'device-anomaly') {
      const result = this.aiRuleEngineService.detectDeviceAnomaly(
        data as unknown as DeviceAnomalyInput
      )
      return {
        type: 'device-anomaly',
        result,
        timestamp: new Date().toISOString()
      }
    }

    throw new Error(
      `Unsupported evaluation type: ${type}. Supported: member-level, device-anomaly`
    )
  }

  @Post('evaluate/member-level')
  evaluateMemberLevel(@Body() input: MemberLevelInputDto): EvaluateResponse {
    const result = this.aiRuleEngineService.evaluateMemberLevel(input)
    return {
      type: 'member-level',
      result,
      timestamp: new Date().toISOString()
    }
  }

  @Post('evaluate/device-anomaly')
  detectDeviceAnomaly(@Body() input: DeviceAnomalyInputDto): EvaluateResponse {
    const result = this.aiRuleEngineService.detectDeviceAnomaly(input)
    return {
      type: 'device-anomaly',
      result,
      timestamp: new Date().toISOString()
    }
  }

  /** 批量评估：一次请求评估多个成员和设备 */
  @Post('evaluate/batch')
  evaluateBatch(@Body() request: BatchEvaluateRequestDto): BatchEvaluateResponse {
    // DTO 在运行时经 ValidationPipe 保证结构与 BatchEvaluateRequest 一致
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return this.aiRuleEngineService.batchEvaluate(request as any as BatchEvaluateRequest)
  }

  /** 风险评分：综合评估业务风险 */
  @Post('evaluate/risk-score')
  evaluateRiskScore(@Body() input: RiskScoreInputDto): { type: string; result: RiskScoreOutput; timestamp: string } {
    const result = this.aiRuleEngineService.evaluateRiskScore(input)
    return {
      type: 'risk-score',
      result,
      timestamp: new Date().toISOString()
    }
  }

  /** 获取所有规则引擎状态 */
  @Get('engines')
  getEngines() {
    return this.aiRuleEngineService.getEngineStatus()
  }

  /** 获取所有模拟器 */
  @Get('simulators')
  listSimulators(): RuleSimulator[] {
    return this.aiRuleEngineService.listSimulators()
  }

  /** 获取指定模拟器 */
  @Get('simulators/:id')
  getSimulator(@Param('id') id: string): RuleSimulator | undefined {
    return this.aiRuleEngineService.getSimulator(id)
  }

  /** 单次模拟运行 */
  @Post('simulators/run')
  runSimulator(@Body() input: SimulatorRunInputDto): SimulatorResult {
    return this.aiRuleEngineService.runSimulator(input as unknown as SimulatorRunInput)
  }

  /** 批量模拟运行 */
  @Post('simulators/run-batch')
  runSimulatorBatch(@Body() input: SimulatorRunInputDto & { rounds?: number }): SimulatorSummary {
    return this.aiRuleEngineService.runSimulatorBatch(
      input as unknown as SimulatorRunInput & { rounds?: number }
    )
  }
}
