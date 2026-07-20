/**
 * Phase 98 CDN Cache Controller (V10 Sprint 2 Day 29)
 */

import {
  Controller, Get, Post, Patch, Delete, Param, Body, HttpCode, HttpStatus,
UseGuards,
} from '@nestjs/common'
import { CdnCacheService } from './cdn.service'
import type {
  CreateRuleDto, UpdateRuleDto, AddEdgeNodeDto, InvalidateDto, MatchRuleDto,
  RuleListResponse, NodeListResponse, MatchRuleResponse,
  InvalidationListResponse, EdgeNodeStatsResponse,
} from './cdn.dto'
import { TenantGuard } from '../agent/tenant.guard'

@Controller('cdn')
@UseGuards(TenantGuard)
export class CdnCacheController {
  /** @internal exposed as public for testing */
  constructor(readonly service: CdnCacheService) {}

  // ============ 规则管理 ============
  @Post('rules')
  @HttpCode(HttpStatus.CREATED)
  async createRule(@Body() body: CreateRuleDto) { return this.service.createRule(body) }

  @Get('rules')
  async listRules(): Promise<RuleListResponse> { return { items: await this.service.listRules() } }

  @Get('rules/:id')
  async getRule(@Param('id') id: string) { return this.service.getRule(id) }

  @Patch('rules/:id')
  async updateRule(@Param('id') id: string, @Body() body: UpdateRuleDto) {
    return this.service.updateRule(id, body)
  }

  @Delete('rules/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteRule(@Param('id') id: string) { await this.service.deleteRule(id) }

  // ============ 路由匹配 (网关/CDN 用) ============
  @Get('match')
  async match(@Body() body: MatchRuleDto): Promise<MatchRuleResponse> {
    const rule = await this.service.matchRule(body.url, body.method ?? 'GET')
    return {
      matched: rule != null,
      rule: rule ?? null,
      cacheControl: rule ? await this.service.getCacheControlForUrl(body.url, body.method ?? 'GET') : null,
    }
  }

  // ============ 边缘节点 ============
  @Post('nodes')
  @HttpCode(HttpStatus.CREATED)
  async addNode(@Body() body: AddEdgeNodeDto) { return this.service.addEdgeNode(body) }

  @Get('nodes')
  async listNodes(): Promise<NodeListResponse> { return { items: await this.service.listEdgeNodes() } }

  @Get('nodes/stats')
  async nodeStats(): Promise<EdgeNodeStatsResponse> { return this.service.getEdgeNodeStats() }

  @Delete('nodes/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async removeNode(@Param('id') id: string) { await this.service.removeEdgeNode(id) }

  // ============ 主动失效 ============
  @Post('invalidate')
  @HttpCode(HttpStatus.ACCEPTED)
  async invalidate(@Body() body: InvalidateDto) { return this.service.invalidate(body) }

  @Get('invalidate')
  async listInvalidations(): Promise<InvalidationListResponse> { return { items: await this.service.listInvalidations() } }
}
