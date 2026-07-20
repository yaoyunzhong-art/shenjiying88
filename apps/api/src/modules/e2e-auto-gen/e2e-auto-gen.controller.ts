/**
 * e2e-auto-gen.controller.ts - Phase-19 E2E Auto Gen Controller
 * 用途: E2E 自动生成模块的 REST 控制器
 * 关联: phase-19-intelligence/spec.md §Phase 2
 */
import { Controller, Post, Get, Body, Param, UsePipes, ValidationPipe, , UseGuards } from '@nestjs/common'
import { E2EAutoGenService } from './e2e-auto-gen.service'
import {
  GenerateRequestDto,
  ExecuteRequestDto,
  CreateConfigRequestDto,
  UpdateConfigRequestDto,
} from './e2e-auto-gen.dto'
import { TenantGuard } from '../agent/tenant.guard'

@Controller('e2e-auto-gen')
@UsePipes(new ValidationPipe({ whitelist: true, transform: true }))
@UseGuards(TenantGuard)
export class E2EAutoGenController {
  constructor(private readonly e2eAutoGenService: E2EAutoGenService) {}

  /**
   * 根据 OpenAPI spec 生成测试用例
   * POST /api/e2e-auto-gen/generate
   */
  @Post('generate')
  generate(@Body() body: GenerateRequestDto) {
    return this.e2eAutoGenService.generate(body)
  }

  /**
   * 执行已生成的测试用例
   * POST /api/e2e-auto-gen/execute
   */
  @Post('execute')
  execute(@Body() body: ExecuteRequestDto) {
    return this.e2eAutoGenService.execute(body)
  }

  /**
   * 获取任务状态
   * GET /api/e2e-auto-gen/tasks/:taskId
   */
  @Get('tasks/:taskId')
  getTask(@Param('taskId') taskId: string) {
    return this.e2eAutoGenService.getTask(taskId)
  }

  /**
   * 获取执行报告
   * GET /api/e2e-auto-gen/reports/:reportId
   */
  @Get('reports/:reportId')
  getReport(@Param('reportId') reportId: string) {
    return this.e2eAutoGenService.getReport(reportId)
  }

  /**
   * 获取所有配置
   * GET /api/e2e-auto-gen/configs
   */
  @Get('configs')
  listConfigs() {
    return this.e2eAutoGenService.listConfigs()
  }

  /**
   * 创建配置
   * POST /api/e2e-auto-gen/configs
   */
  @Post('configs')
  createConfig(@Body() body: CreateConfigRequestDto) {
    return (this.e2eAutoGenService as any).createConfig(body)
  }

  /**
   * 更新配置
   * POST /api/e2e-auto-gen/configs/:configId
   */
  @Post('configs/:configId')
  updateConfig(
    @Param('configId') configId: string,
    @Body() body: UpdateConfigRequestDto,
  ) {
    return this.e2eAutoGenService.updateConfig(configId, body)
  }

  /**
   * 健康检查
   * GET /api/e2e-auto-gen/health
   */
  @Get('health')
  health() {
    return {
      status: 'ok',
      module: 'e2e-auto-gen',
      timestamp: new Date().toISOString(),
    }
  }
}
