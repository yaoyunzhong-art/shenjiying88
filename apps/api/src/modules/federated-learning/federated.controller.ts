/**
 * Phase 97 联邦学习 Controller (V10 Sprint 2 Day 26)
 */

import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  HttpCode,
  HttpStatus,
UseGuards,
} from '@nestjs/common'
import { FederatedLearningService } from './federated.service'
import type {
  CreateFederatedTaskDto,
  StartRoundDto,
  SubmitGradientDto,
} from './federated.dto'
import { TenantGuard } from '../agent/tenant.guard'

@Controller('federated')
@UseGuards(TenantGuard)
export class FederatedLearningController {
  constructor(private readonly service: FederatedLearningService) {}

  // ============ 任务管理 ============
  @Post('tasks')
  @HttpCode(HttpStatus.CREATED)
  async createTask(@Body() body: CreateFederatedTaskDto) {
    return this.service.createTask(body)
  }

  @Get('tasks')
  async listTasks() {
    const items = await this.service.listTasks()
    return { items, total: items.length }
  }

  @Get('tasks/:id')
  async getTask(@Param('id') id: string) {
    return this.service.getTask(id)
  }

  @Post('tasks/:id/activate')
  @HttpCode(HttpStatus.OK)
  async activateTask(@Param('id') id: string) {
    return this.service.activateTask(id)
  }

  // ============ 轮次管理 ============
  @Post('tasks/:taskId/rounds')
  @HttpCode(HttpStatus.CREATED)
  async startRound(@Param('taskId') taskId: string, @Body() body: StartRoundDto) {
    return this.service.startRound(taskId, body)
  }

  @Get('tasks/:taskId/rounds')
  async listRounds(@Param('taskId') taskId: string) {
    return { items: await this.service.listRounds(taskId) }
  }

  // ============ 客户端梯度提交 ============
  @Post('tasks/:taskId/submit')
  @HttpCode(HttpStatus.ACCEPTED)
  async submitGradient(@Param('taskId') taskId: string, @Body() body: SubmitGradientDto) {
    return this.service.submitGradient(taskId, body)
  }

  // ============ 聚合 ============
  @Post('rounds/:roundId/aggregate')
  @HttpCode(HttpStatus.OK)
  async aggregateRound(@Param('roundId') roundId: string) {
    return this.service.aggregateRound(roundId)
  }

  // ============ 隐私预算 ============
  @Get('tasks/:taskId/privacy')
  async getPrivacy(@Param('taskId') taskId: string) {
    return this.service.getPrivacyAccount(taskId)
  }
}