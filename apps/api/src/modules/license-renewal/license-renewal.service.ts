/**
 * Sprint 3 Phase 2 - License 续费管理 Service
 *
 * 功能:
 * - 创建/查询/更新续费记录
 * - 续费通知管理
 * - 续费统计
 *
 * 使用内联类型代替 TypeORM entity 导入, 确保 tsx 测试兼容
 */

import { Injectable, NotFoundException, Logger } from '@nestjs/common'
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

// ─── 内部记录类型 (替代 TypeORM entity, 避免 tsx 装饰器兼容问题) ───

interface InternalRecord {
  id: string
  licenseId: string
  tenantId: string
  packageId?: string
  packageName?: string
  previousExpireAt?: Date
  newExpireAt?: Date
  price: number
  status: 'pending' | 'success' | 'failed'
  errorMessage?: string
  paymentId?: string
  paidAt?: Date
  createdAt: Date
  updatedAt: Date
}

interface InternalNotification {
  id: string
  licenseId: string
  tenantId: string
  type: string
  reminderDays?: number
  sentAt: Date
  createdAt: Date
}

@Injectable()
export class LicenseRenewalService {
  private readonly logger = new Logger(LicenseRenewalService.name)

  // In-memory storage for testing / pre-DI scenarios
  private records: InternalRecord[] = []
  private notifications: InternalNotification[] = []
  private recordSeq = 10
  private notifSeq = 10

  constructor() {
    this.seedInMemory()
  }

  private nextRecordId(): string {
    return `renewal-${++this.recordSeq}`
  }

  private nextNotifId(): string {
    return `notif-${++this.notifSeq}`
  }

  private seedInMemory() {
    const now = new Date()
    const d = (days: number) => new Date(now.getTime() + days * 24 * 3600 * 1000)

    this.records = [
      {
        id: 'renewal-seed-1',
        licenseId: 'lic-seed-paid',
        tenantId: 'tenant-A',
        packageId: 'pkg-enterprise',
        packageName: '企业版',
        previousExpireAt: d(-15),
        newExpireAt: d(350),
        price: 2999,
        status: 'success',
        paymentId: 'pay-seed-1',
        paidAt: d(-15),
        createdAt: d(-15),
        updatedAt: d(-15),
      },
      {
        id: 'renewal-seed-2',
        licenseId: 'lic-seed-trial',
        tenantId: 'tenant-B',
        price: 0,
        status: 'pending',
        createdAt: d(-1),
        updatedAt: d(-1),
      },
    ]

    this.notifications = [
      {
        id: 'notif-seed-1',
        licenseId: 'lic-seed-paid',
        tenantId: 'tenant-A',
        type: 'reminder',
        reminderDays: 7,
        sentAt: d(-10),
        createdAt: d(-10),
      },
      {
        id: 'notif-seed-2',
        licenseId: 'lic-seed-trial',
        tenantId: 'tenant-B',
        type: 'reminder',
        reminderDays: 3,
        sentAt: d(-2),
        createdAt: d(-2),
      },
    ]
  }

  /**
   * 创建续费记录
   */
  async createRecord(dto: CreateRenewalRecordDto): Promise<RenewalRecordResponseDto> {
    this.logger.log(`Creating renewal record for license ${dto.licenseId}`)

    const record: InternalRecord = {
      id: this.nextRecordId(),
      licenseId: dto.licenseId,
      tenantId: dto.tenantId,
      packageId: dto.packageId,
      packageName: dto.packageName,
      previousExpireAt: dto.previousExpireAt ? new Date(dto.previousExpireAt) : undefined,
      newExpireAt: dto.newExpireAt ? new Date(dto.newExpireAt) : undefined,
      price: dto.price,
      status: dto.status ?? 'pending',
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    this.records.push(record)
    return this.toRecordResponse(record)
  }

  /**
   * 查询续费记录列表
   */
  async listRecords(queryDto: RenewalRecordQueryDto): Promise<RenewalRecordListResponseDto> {
    const { page = 1, pageSize = 10, licenseId, tenantId, status, startDate, endDate } = queryDto

    let filtered = [...this.records]

    if (licenseId) filtered = filtered.filter((r) => r.licenseId === licenseId)
    if (tenantId) filtered = filtered.filter((r) => r.tenantId === tenantId)
    if (status) filtered = filtered.filter((r) => r.status === status)
    if (startDate) {
      const start = new Date(startDate)
      filtered = filtered.filter((r) => r.createdAt >= start)
    }
    if (endDate) {
      const end = new Date(endDate)
      filtered = filtered.filter((r) => r.createdAt <= end)
    }

    // Sort by newest first
    filtered.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())

    const total = filtered.length
    const start = (page - 1) * pageSize
    const paged = filtered.slice(start, start + pageSize)

    return {
      data: paged.map((r) => this.toRecordResponse(r)),
      total,
      page,
      pageSize,
    }
  }

  /**
   * 获取续费记录详情
   */
  async getRecord(id: string): Promise<RenewalRecordResponseDto> {
    const record = this.records.find((r) => r.id === id)
    if (!record) throw new NotFoundException('续费记录不存在')
    return this.toRecordResponse(record)
  }

  /**
   * 更新续费状态
   */
  async updateStatus(id: string, dto: UpdateRenewalStatusDto): Promise<RenewalRecordResponseDto> {
    this.logger.log(`Updating renewal ${id} status to ${dto.status}`)

    const record = this.records.find((r) => r.id === id)
    if (!record) throw new NotFoundException('续费记录不存在')

    Object.assign(record, {
      status: dto.status,
      errorMessage: dto.errorMessage ?? record.errorMessage,
      paymentId: dto.paymentId ?? record.paymentId,
      paidAt: dto.paidAt ? new Date(dto.paidAt) : dto.status === 'success' ? new Date() : record.paidAt,
      updatedAt: new Date(),
    })

    return this.toRecordResponse(record)
  }

  /**
   * 创建续费通知
   */
  async createNotification(dto: CreateNotificationDto): Promise<NotificationResponseDto> {
    this.logger.log(`Creating ${dto.type} notification for license ${dto.licenseId}`)

    const notification: InternalNotification = {
      id: this.nextNotifId(),
      licenseId: dto.licenseId,
      tenantId: dto.tenantId,
      type: dto.type,
      reminderDays: dto.reminderDays,
      sentAt: new Date(dto.sentAt),
      createdAt: new Date(),
    }

    this.notifications.push(notification)
    return this.toNotificationResponse(notification)
  }

  /**
   * 查询续费通知列表
   */
  async listNotifications(licenseId?: string, tenantId?: string): Promise<NotificationListResponseDto> {
    let filtered = [...this.notifications]

    if (licenseId) filtered = filtered.filter((n) => n.licenseId === licenseId)
    if (tenantId) filtered = filtered.filter((n) => n.tenantId === tenantId)

    filtered.sort((a, b) => b.sentAt.getTime() - a.sentAt.getTime())

    return {
      data: filtered.map((n) => this.toNotificationResponse(n)),
      total: filtered.length,
    }
  }

  /**
   * 获取续费统计
   */
  async getStats(tenantId?: string): Promise<RenewalStatsResponseDto> {
    let filtered = [...this.records]
    if (tenantId) filtered = filtered.filter((r) => r.tenantId === tenantId)

    const totalRenewals = filtered.length
    const successCount = filtered.filter((r) => r.status === 'success').length
    const failedCount = filtered.filter((r) => r.status === 'failed').length
    const pendingCount = filtered.filter((r) => r.status === 'pending').length
    const totalRevenue = filtered
      .filter((r) => r.status === 'success')
      .reduce((sum, r) => sum + r.price, 0)

    return {
      totalRenewals,
      successCount,
      failedCount,
      pendingCount,
      successRate: totalRenewals > 0 ? Math.round((successCount / totalRenewals) * 10000) / 100 : 0,
      totalRevenue,
    }
  }

  /**
   * 转换为记录响应 DTO
   */
  private toRecordResponse(record: InternalRecord): RenewalRecordResponseDto {
    return {
      id: record.id,
      licenseId: record.licenseId,
      tenantId: record.tenantId,
      packageId: record.packageId,
      packageName: record.packageName,
      previousExpireAt: record.previousExpireAt?.toISOString(),
      newExpireAt: record.newExpireAt?.toISOString(),
      price: record.price,
      status: record.status,
      errorMessage: record.errorMessage,
      paymentId: record.paymentId,
      paidAt: record.paidAt?.toISOString(),
      createdAt: record.createdAt.toISOString(),
      updatedAt: record.updatedAt.toISOString(),
    }
  }

  /**
   * 转换为通知响应 DTO
   */
  private toNotificationResponse(notification: InternalNotification): NotificationResponseDto {
    return {
      id: notification.id,
      licenseId: notification.licenseId,
      tenantId: notification.tenantId,
      type: notification.type,
      reminderDays: notification.reminderDays,
      sentAt: notification.sentAt.toISOString(),
      createdAt: notification.createdAt.toISOString(),
    }
  }
}
