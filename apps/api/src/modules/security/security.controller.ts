import { Controller, Get, Post, Put, Delete, Param, Body, Query, UsePipes, ValidationPipe, HttpException, HttpStatus, DefaultValuePipe, ParseIntPipe, UseGuards } from '@nestjs/common'
import { SecurityScannerService } from './security-scanner.service'
import { WAFService, type WAFRule } from './waf.service'
import type {
  SecurityVulnerability,
  SecurityScanTarget,
  SecurityReport,
  WAFDecision,
} from './security.entity'
import {
  ScanRequestDto,
  BatchScanRequestDto,
  SensitiveDataCheckDto,
  JWTWeakSecretCheckDto,
  IDORCheckDto,
  CreateWAFRuleDto,
  UpdateWAFRuleDto,
  EvaluateRequestDto,
} from './security.dto'
import { TenantGuard } from '../agent/tenant.guard'

@Controller('security')
@UsePipes(new ValidationPipe({ whitelist: true, transform: true }))
@UseGuards(TenantGuard)
export class SecurityController {
  constructor(
    private readonly scannerService: SecurityScannerService,
    private readonly wafService: WAFService,
  ) {}

  // ── 安全扫描端点 ─────────────────────────────────────────────────

  /** 对单个目标执行安全扫描 */
  @Post('scan')
  async scan(@Body() request: ScanRequestDto): Promise<SecurityVulnerability[]> {
    const target: SecurityScanTarget = {
      endpoint: request.target.endpoint,
      method: request.target.method,
      parameters: request.target.parameters,
    }
    return this.scannerService.scan(target)
  }

  /** 批量扫描多个目标 */
  @Post('scan/batch')
  async batchScan(@Body() request: BatchScanRequestDto): Promise<
    Array<{ target: string; vulnerabilities: SecurityVulnerability[] }>
  > {
    const targets: SecurityScanTarget[] = request.targets.map((t) => ({
      endpoint: t.endpoint,
      method: t.method,
      parameters: t.parameters,
    }))
    const results = await this.scannerService.scanMultiple(targets)
    return Array.from(results.entries()).map(([target, vulns]) => ({
      target: target.endpoint,
      vulnerabilities: vulns,
    }))
  }

  /** 检测敏感数据暴露 */
  @Post('detect/sensitive-data')
  async detectSensitiveData(
    @Body() request: SensitiveDataCheckDto,
  ): Promise<{ endpoint: string; exposedFields: string[] }> {
    const exposed = await this.scannerService.detectSensitiveDataExposure(
      request.endpoint,
      request.response,
    )
    return { endpoint: request.endpoint, exposedFields: exposed }
  }

  /** 检测 JWT 弱密钥 */
  @Post('detect/jwt-weak-secret')
  async detectJWTWeakSecret(
    @Body() request: JWTWeakSecretCheckDto,
  ): Promise<{ weak: boolean }> {
    const result = await this.scannerService.detectJWTWeakSecret(
      request.token,
      request.secrets,
    )
    return { weak: result }
  }

  /** 检测 IDOR 漏洞 */
  @Post('detect/idor')
  async detectIDOR(
    @Body() request: IDORCheckDto,
  ): Promise<SecurityVulnerability | null> {
    return this.scannerService.detectIDOR(
      request.endpoint,
      request.resourceId,
      request.attackerId,
    )
  }

  /** 检测缺少速率限制 */
  @Post('detect/missing-rate-limit')
  async detectMissingRateLimit(
    @Body() body: { endpoint: string; count?: number },
  ): Promise<{ endpoint: string; missingRateLimit: boolean }> {
    const missing = await this.scannerService.detectMissingRateLimit(
      body.endpoint,
      body.count ?? 100,
    )
    return { endpoint: body.endpoint, missingRateLimit: missing }
  }

  /** 生成漏洞报告 */
  @Post('report')
  generateReport(
    @Body() body: { vulnerabilities: SecurityVulnerability[] },
  ): string {
    return this.scannerService.generateReport(body.vulnerabilities)
  }

  /** 导出 JSON 格式报告 */
  @Post('report/json')
  exportJSONReport(
    @Body() body: { vulnerabilities: SecurityVulnerability[] },
  ): SecurityReport {
    const json = this.scannerService.exportJSON(body.vulnerabilities)
    return JSON.parse(json)
  }

  // ── WAF 规则管理端点 ───────────────────────────────────────────

  /** 获取所有 WAF 规则 */
  @Get('waf/rules')
  listWAFRules(): WAFRule[] {
    return this.wafService.listRules()
  }

  /** 创建 WAF 规则 */
  @Post('waf/rules')
  createWAFRule(@Body() request: CreateWAFRuleDto): WAFRule {
    return this.wafService.addRule(request)
  }

  /** 更新 WAF 规则 */
  @Put('waf/rules/:id')
  updateWAFRule(
    @Param('id') id: string,
    @Body() request: UpdateWAFRuleDto,
  ): WAFRule {
    try {
      return this.wafService.updateRule(id, request)
    } catch (err) {
      throw new HttpException(
        `WAF rule ${id} not found`,
        HttpStatus.NOT_FOUND,
      )
    }
  }

  /** 删除 WAF 规则 */
  @Delete('waf/rules/:id')
  deleteWAFRule(@Param('id') id: string): { deleted: boolean } {
    try {
      this.wafService.deleteRule(id)
      return { deleted: true }
    } catch (err) {
      throw new HttpException(
        `WAF rule ${id} not found`,
        HttpStatus.NOT_FOUND,
      )
    }
  }

  // ── WAF 请求评估端点 ──────────────────────────────────────────

  /** 评估一个请求是否被 WAF 阻止 */
  @Post('waf/evaluate')
  evaluateWAF(@Body() request: EvaluateRequestDto): WAFDecision {
    return this.wafService.evaluate(request)
  }

  /** 获取 WAF 阻止日志 */
  @Get('waf/logs')
  getWAFLogs(
    @Query('limit', new DefaultValuePipe(100), new ParseIntPipe({ optional: true }))
    limit?: number,
  ): WAFDecision[] {
    return this.wafService.getBlockedLogs(limit ?? 100)
  }
}
