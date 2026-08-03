// CouponCleanupService · P-48 联名券过期清理 cron
// 创建: 2026-07-19 · Pulse-70 联名券过期清理
// 关联: PRD-009 AC-48-04 · task-scheduler 模块

import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan, In } from 'typeorm';
import { CouponV2 } from './coupon.entity';

/**
 * CouponCleanupService
 *
 * 扫描过期优惠券并将其标记为 'expired' 状态。
 * 设计上不使用 @Cron 装饰器（api 无 ScheduleModule），
 * 直接暴露 scanExpiredCoupons 方法给外部 cron 调度器（task-scheduler 模块）调用。
 */
@Injectable()
export class CouponCleanupService {
  private readonly logger = new Logger(CouponCleanupService.name);

  constructor(
    @InjectRepository(CouponV2)
    private readonly couponRepo: Repository<CouponV2>,
  ) {}

  /**
   * 扫描指定租户下所有已过期但状态仍未标记为 expired 的优惠券，
   * 批量更新状态为 'expired'。
   *
   * @param tenantId - 租户 ID
   * @returns 清理（标记为 expired）的优惠券数量
   */
  async scanExpiredCoupons(tenantId: string): Promise<number> {
    const now = new Date();

    const expiredCoupons = await this.couponRepo.find({
      where: {
        tenantId,
        expiresAt: LessThan(now),
        status: In(['active', 'paused']),
      },
    });

    if (expiredCoupons.length === 0) {
      this.logger.log(`[${tenantId}] No expired coupons to clean up`);
      return 0;
    }

    const ids = expiredCoupons.map((c) => c.id);
    const updateResult = await this.couponRepo.update(
      { id: In(ids), tenantId },
      { status: 'expired' as const },
    );

    this.logger.log(
      `[${tenantId}] Cleaned up ${updateResult.affected ?? ids.length} expired coupons (${ids.length} matched)`,
    );

    return updateResult.affected ?? ids.length;
  }
}
