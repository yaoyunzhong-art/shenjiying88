/**
 * Sprint 3 Phase 2 - License 续费管理 Controller
 *
 * RESTful API:
 * - POST   /license-renewal/records                   创建续费记录
 * - GET    /license-renewal/records                   查询续费记录列表
 * - GET    /license-renewal/records/:id               获取续费记录详情
 * - PATCH  /license-renewal/records/:id/status        更新续费状态
 * - POST   /license-renewal/notifications             创建续费通知
 * - GET    /license-renewal/notifications             查询续费通知列表
 * - GET    /license-renewal/stats                     续费统计
 */

import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
  Logger,
  UseGuards,

import { TenantGuard } from '../agent/tenant.guard'

} from '@nestjs/common'
import { LicenseRenewalService } from './license-renewal.service'
import type {
  CreateRenewalRecordDto,
  UpdateRenewalStatusDto,
  RenewalRecordQueryDto,
  RenewalRecordResponseDto,
  RenewalRecordListResponseDto,
  CreateNotificationDto,
  NotificationResponseDto,
  NotificationListResponseDto,
  RenewalStatsResponseDto,
} from './license-renewal.dto'

@UseGuards(TenantGuard)
@Controller('license-renewal')
export class LicenseRenewalController {
  private readonly logger = new Logger(LicenseRenewalController.name)

  constructor(private readonly service: LicenseRenewalService) {}

  // ============ 续费记录 ============

  /** POST /license-renewal/records */
  @Post('records')
  @HttpCode(HttpStatus.CREATED)
  async createRecord(@Body() dto: CreateRenewalRecordDto): Promise<RenewalRecordResponseDto> {
    this.logger.log(`POST /license-renewal/records licenseId=${dto.licenseId}`)
    return this.service.createRecord(dto)
  }

  /** GET /license-renewal/records */
  @Get('records')
  async listRecords(@Query() queryDto: RenewalRecordQueryDto): Promise<RenewalRecordListResponseDto> {
    this.logger.log(`GET /license-renewal/records page=${queryDto.page ?? 1}`)
    return this.service.listRecords(queryDto)
  }

  /** GET /license-renewal/records/:id */
  @Get('records/:id')
  async getRecord(@Param('id') id: string): Promise<RenewalRecordResponseDto> {
    this.logger.log(`GET /license-renewal/records/${id}`)
    return this.service.getRecord(id)
  }

  /** PATCH /license-renewal/records/:id/status */
  @Patch('records/:id/status')
  @HttpCode(HttpStatus.OK)
  async updateStatus(
    @Param('id') id: string,
    @Body() dto: UpdateRenewalStatusDto,
  ): Promise<RenewalRecordResponseDto> {
    this.logger.log(`PATCH /license-renewal/records/${id}/status → ${dto.status}`)
    return this.service.updateStatus(id, dto)
  }

  // ============ 续费通知 ============

  /** POST /license-renewal/notifications */
  @Post('notifications')
  @HttpCode(HttpStatus.CREATED)
  async createNotification(@Body() dto: CreateNotificationDto): Promise<NotificationResponseDto> {
    this.logger.log(`POST /license-renewal/notifications type=${dto.type}`)
    return this.service.createNotification(dto)
  }

  /** GET /license-renewal/notifications */
  @Get('notifications')
  async listNotifications(
    @Query('licenseId') licenseId?: string,
    @Query('tenantId') tenantId?: string,
  ): Promise<NotificationListResponseDto> {
    this.logger.log('GET /license-renewal/notifications')
    return this.service.listNotifications(licenseId, tenantId)
  }

  // ============ 统计 ============

  /** GET /license-renewal/stats */
  @Get('stats')
  async getStats(@Query('tenantId') tenantId?: string): Promise<RenewalStatsResponseDto> {
    this.logger.log('GET /license-renewal/stats')
    return this.service.getStats(tenantId)
  }
}
