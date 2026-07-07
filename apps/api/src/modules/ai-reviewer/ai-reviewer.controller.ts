import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  Query,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common'
import { AIReviewerService } from './ai-reviewer.service'
import {
  ReviewRequestDto,
  RegisterRuleDto,
  ReviewConfigDto,
  type ReviewResponse,
} from './ai-reviewer.dto'
import type { ReviewRule, ReviewStats } from './ai-reviewer.entity'

@Controller('ai-reviewer')
@UsePipes(new ValidationPipe({ whitelist: true, transform: true }))
export class AIReviewerController {
  constructor(private readonly aiReviewerService: AIReviewerService) {}

  /** 审查单个文件 */
  @Post('review')
  review(@Body() body: ReviewRequestDto): ReviewResponse {
    const sessionId = `review-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
    const findings = this.aiReviewerService.reviewFiles(body.files)
    const summary = this.aiReviewerService.summarize(findings)
    const verdict = this.aiReviewerService.ciVerdict(findings)

    return {
      sessionId,
      totalFiles: body.files.length,
      totalFindings: findings.length,
      summary,
      verdict,
      findings: findings.map((f) => ({
        file: f.file,
        line: f.line,
        ruleId: f.ruleId,
        ruleName: f.ruleName,
        severity: f.severity,
        snippet: f.snippet,
        message: f.message,
      })),
      createdAt: new Date().toISOString(),
    }
  }

  /** 列出所有规则 */
  @Get('rules')
  listRules(): ReviewRule[] {
    return this.aiReviewerService.listRules()
  }

  /** 注册自定义规则 */
  @Post('rules')
  registerRule(@Body() body: RegisterRuleDto): { ruleId: string; message: string } {
    const rule: ReviewRule = {
      ruleId: body.ruleId,
      ruleName: body.ruleName,
      description: body.description,
      severity: body.severity,
      pattern: new RegExp(body.pattern),
      reference: body.reference,
    }
    this.aiReviewerService.registerRule(rule)
    return {
      ruleId: body.ruleId,
      message: `Rule '${body.ruleId}' registered successfully`,
    }
  }

  /** 获取审查统计 */
  @Get('stats')
  getStats(): ReviewStats {
    const findings = this.aiReviewerService.listRules().map((rule) => ({
      severity: rule.severity,
      ruleId: rule.ruleId,
    }))
    const summary = this.aiReviewerService.summarize(
      findings.map((f) => ({
        ruleId: f.ruleId,
        ruleName: '',
        severity: f.severity,
        file: '',
        snippet: '',
        message: '',
        suggestion: '',
        reference: '',
      }))
    )

    return {
      totalSessions: 0,
      totalFiles: 0,
      totalFindings: 0,
      findingsBySeverity: summary,
      findingsByRule: {},
      topRules: [],
      passRate: 1,
      lastSessionAt: null,
    }
  }

  /** 获取指定规则的详情 */
  @Get('rules/:ruleId')
  getRule(@Param('ruleId') ruleId: string): ReviewRule | { error: string } {
    const rules = this.aiReviewerService.listRules()
    const rule = rules.find((r) => r.ruleId === ruleId)
    if (!rule) {
      return { error: `Rule '${ruleId}' not found` }
    }
    return rule
  }

  /** CI 验证端点 */
  @Post('ci-verify')
  ciVerify(@Body() body: ReviewRequestDto): {
    pass: boolean
    errorCount: number
    warnCount: number
    findings: number
  } {
    const findings = this.aiReviewerService.reviewFiles(body.files)
    const verdict = this.aiReviewerService.ciVerdict(findings)
    return {
      pass: verdict.pass,
      errorCount: verdict.errorCount,
      warnCount: verdict.warnCount,
      findings: findings.length,
    }
  }
}
