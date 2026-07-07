/**
 * Sprint 3 Phase 2 - 自动续费定时任务
 * 
 * 功能:
 * - 续费提醒任务 (到期前7天、3天、1天)
 * - 自动扣费任务 (到期当天)
 * - 续费失败处理
 * - 续费成功通知
 */

import { Injectable, Logger } from '@nestjs/common'
import { NotificationService } from '../notification/notification.service'

@Injectable()
export class LicenseRenewalJob {
  private readonly logger = new Logger(LicenseRenewalJob.name)

  constructor(
    private readonly notificationService: NotificationService,
  ) {}

  /**
   * 续费提醒任务 - 检查即将到期的 License，发送提醒通知
   * 被 CronJobService 或外部调度器定期调用
   */
  async renewalReminderJob(): Promise<void> {
    this.logger.log('Starting renewal reminder job...')

    try {
      // 实际生产环境: 从 License 仓库查询即将到期的 License
      // 通过 notificationService.sendRenewalReminderNotification() 发送提醒
      this.logger.log('Renewal reminder job completed (stub)')
    } catch (error) {
      this.logger.error('Renewal reminder job failed', (error as Error).stack)
    }
  }

  /**
   * 自动续费任务 - 检查当天到期的 License，执行自动续费
   * 被 CronJobService 或外部调度器定期调用
   */
  async autoRenewalJob(): Promise<void> {
    this.logger.log('Starting auto renewal job...')

    try {
      // 实际生产环境: 查询到期 License -> 调用支付 -> 续期
      this.logger.log('Auto renewal job completed (stub)')
    } catch (error) {
      this.logger.error('Auto renewal job failed', (error as Error).stack)
    }
  }
}
