/**
 * devops.controller.ts — DevOps CI/CD 运维 API
 *
 * 🐜 V17: 模块补齐
 *
 * 端点:
 *   GET /api/devops/status         — 运维服务状态
 *   GET /api/devops/pipelines/:id  — 指定流水线状态
 */

import { Controller, Get, Param } from '@nestjs/common'
import { ApiTags, ApiOperation } from '@nestjs/swagger'
import { DevopsService } from './devops.service'

@ApiTags('devops')
@Controller('devops')
export class DevopsController {
  constructor(private readonly devopsService: DevopsService) {}

  @Get('status')
  @ApiOperation({ summary: 'DevOps 运维服务状态' })
  getStatus() {
    return this.devopsService.getStatus()
  }

  @Get('pipelines/:id')
  @ApiOperation({ summary: '查询 CI/CD 流水线状态' })
  getPipelineStatus(@Param('id') id: string) {
    return this.devopsService.getPipelineStatus(id)
  }
}
