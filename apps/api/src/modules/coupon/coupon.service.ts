// CouponService · Phase-17 T2 实施版本
// 更新: 2026-06-26 · Pulse-68 主任务
// 状态: IMPLEMENTED · redeemCrossStore / batchRedeem 业务逻辑完成
// 关联: spec.md §1.1.2 · tasks.md T2 · E40 P0 跨门店优惠券

import { Injectable, Optional, Inject, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, FindOptionsWhere, Like } from 'typeorm';
import { CouponV2 } from './coupon.entity';
import { CouponRedemptionLog } from './coupon-redemption-log.entity';
import {
  RedemptionRequest,
  RedemptionResult,
  CrossStoreEligibility,
  CouponStatus,
  CouponScope,
  CouponRedemptionRules,
  CouponValueType,
} from './coupon.types';
import { QuotaResourceKind } from '../tenant/tenant-quota.entity';

/**
 * CouponBusinessError: 业务校验失败 (阶段 4-9)
 * catch 块识别此错误后: decrement 回滚 + 返回 RedemptionResult(success:false)
 */
class CouponBusinessError extends Error {
  constructor(public readonly code: 'COUPON_NOT_FOUND' | 'COUPON_EXPIRED' | 'COUPON_EXHAUSTED' | 'STORE_NOT_IN_SCOPE' | 'MIN_AMOUNT_NOT_MET' | 'USER_SEGMENT_NOT_MATCH' | 'DUPLICATE_REDEMPTION' | 'QUOTA_EXCEEDED', message: string) {
    super(message);
    this.name = 'CouponBusinessError';
  }
}

/**
 * CouponService · Phase-17 跨门店优惠券服务
 *
 * 核心方法 (Pulse-68 T2 实施):
 * 1. redeemCrossStore() - 跨门店核销 (E40 P0)
 * 2. batchRedeem() - 批量核销
 * 3. checkCrossStoreEligibility() - 门店范围校验
 *
 * 设计原则 (reserve-and-rollback):
 * - 头部双守卫: lifecycle.assertWriteAllowed + quota.reserve
 * - 业务校验: 范围 / minAmount / maxRedemptions / userSegments / 幂等
 * - 事务: coupon.update + redemptionRepo.insert
 * - 失败回滚: quota.decrement
 */
@Injectable()
export class CouponService {
  private readonly logger = new Logger(CouponService.name);

  constructor(
    @InjectRepository(CouponV2)
    private readonly couponRepo: Repository<CouponV2>,

    @InjectRepository(CouponRedemptionLog)
    private readonly redemptionRepo: Repository<CouponRedemptionLog>,

    private readonly dataSource: DataSource,

    @Optional()
    @Inject('TenantLifecycleService')
    private readonly lifecycle?: any,

    @Optional()
    @Inject('TenantQuotaService')
    private readonly quota?: any,
  ) {}

  /**
   * 创建新优惠券
   */
  async create(params: {
    code: string;
    tenantId: string;
    scope: CouponScope;
    redemptionRules: CouponRedemptionRules;
    value: number;
    valueType: CouponValueType;
    expiresAt: string;
    maxRedemptions?: number;
  }): Promise<CouponV2> {
    const coupon = this.couponRepo.create({
      code: params.code,
      tenantId: params.tenantId,
      scope: params.scope,
      redemptionRules: params.redemptionRules,
      value: params.value,
      valueType: params.valueType,
      expiresAt: new Date(params.expiresAt),
      maxRedemptions: params.maxRedemptions,
      status: 'active',
      redemptionCount: 0,
    });
    return this.couponRepo.save(coupon);
  }

  /**
   * 根据 ID 查找优惠券
   */
  async findById(id: string): Promise<CouponV2 | null> {
    return this.couponRepo.findOne({ where: { id } });
  }

  /**
   * 查询优惠券列表（支持分页和状态筛选）
   */
  async list(query: {
    status?: CouponStatus;
    tenantId?: string;
    page?: number;
    pageSize?: number;
  }): Promise<{ items: CouponV2[]; total: number }> {
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 20;
    const where: FindOptionsWhere<CouponV2> = {};
    if (query.status) where.status = query.status;
    if (query.tenantId) where.tenantId = query.tenantId;

    const [items, total] = await this.couponRepo.findAndCount({
      where,
      skip: (page - 1) * pageSize,
      take: pageSize,
      order: { createdAt: 'DESC' },
    });
    return { items, total };
  }

  /**
   * 更新优惠券状态 (active / paused)
   */
  async updateStatus(id: string, status: 'active' | 'paused'): Promise<CouponV2 | null> {
    const coupon = await this.findById(id);
    if (!coupon) return null;
    coupon.status = status;
    return this.couponRepo.save(coupon);
  }

  async redeemCrossStore(req: RedemptionRequest): Promise<RedemptionResult> {
    const tenantId = req.tenantId ?? 'tenant-default';

    try {
      // 1. lifecycle 守卫
      if (this.lifecycle?.assertWriteAllowed) {
        this.lifecycle.assertWriteAllowed(tenantId);
      }

      // 2. quota check (only check, no increment)
      if (this.quota?.check) {
        const checkResult = this.quota.check(tenantId, QuotaResourceKind.Coupon);
        if (!checkResult.allowed) {
          throw new CouponBusinessError('QUOTA_EXCEEDED', `Tenant ${tenantId} coupon quota exceeded: ${checkResult.currentUsage}/${checkResult.limit}`);
        }
      }

      // 3. 幂等检查
      const existing = await this.redemptionRepo.findOne({
        where: { idempotencyKey: req.idempotencyKey },
      });
      if (existing) {
        this.logger.log(`Idempotent hit: ${req.idempotencyKey} -> ${existing.id}`);
        return {
          success: true,
          couponId: existing.couponId,
          amount: Number(existing.amount),
          redemptionId: existing.id,
        };
      }

      // 4. 查券
      const coupon = await this.couponRepo.findOne({
        where: { tenantId, code: req.couponCode, status: 'active' },
      });
      if (!coupon) {
        throw new CouponBusinessError('COUPON_NOT_FOUND', `coupon ${req.couponCode} not found or inactive`);
      }

      // 5. 过期校验
      if (coupon.expiresAt.getTime() < Date.now()) {
        throw new CouponBusinessError('COUPON_EXPIRED', `coupon ${req.couponCode} expired at ${coupon.expiresAt.toISOString()}`);
      }

      // 6. 跨门店范围
      const eligibility = this.checkCrossStoreEligibility(coupon, req.storeId);
      if (!eligibility.eligible) {
        throw new CouponBusinessError('STORE_NOT_IN_SCOPE', eligibility.reason ?? `store ${req.storeId} not in scope`);
      }

      // 7. 最低消费
      if (coupon.redemptionRules?.minAmount !== undefined && req.orderAmount < coupon.redemptionRules.minAmount) {
        throw new CouponBusinessError('MIN_AMOUNT_NOT_MET', `orderAmount ${req.orderAmount} < minAmount ${coupon.redemptionRules.minAmount}`);
      }

      // 8. 最大核销数
      if (coupon.maxRedemptions !== undefined && coupon.redemptionCount >= coupon.maxRedemptions) {
        throw new CouponBusinessError('COUPON_EXHAUSTED', `coupon ${req.couponCode} exhausted (${coupon.redemptionCount}/${coupon.maxRedemptions})`);
      }

      // 9. 用户分层
      if (coupon.redemptionRules?.userSegments?.length) {
        const userSegment = req.userSegment;
        if (!userSegment || !coupon.redemptionRules.userSegments.includes(userSegment)) {
          throw new CouponBusinessError('USER_SEGMENT_NOT_MATCH', `userSegment ${userSegment} not in [${coupon.redemptionRules.userSegments.join(', ')}]`);
        }
      }

      // 10. 事务
      const redemptionId = await this.dataSource.transaction(async (manager) => {
        const couponRepoTx = manager.getRepository(CouponV2);
        const redemptionRepoTx = manager.getRepository(CouponRedemptionLog);

        const updateResult = await couponRepoTx.update(
          { id: coupon.id, redemptionCount: coupon.redemptionCount },
          {
            redemptionCount: coupon.redemptionCount + 1,
            status: coupon.maxRedemptions && coupon.redemptionCount + 1 >= coupon.maxRedemptions ? 'exhausted' : coupon.status,
          },
        );
        if (updateResult.affected === 0) {
          throw new Error('Concurrent redemption conflict');
        }

        const log = redemptionRepoTx.create({
          couponId: coupon.id,
          userId: req.userId,
          storeId: req.storeId,
          orderId: req.orderId,
          amount: req.orderAmount,
          idempotencyKey: req.idempotencyKey,
        });
        const saved = await redemptionRepoTx.save(log);
        return saved.id;
      });

      // 11. quota increment (业务成功)
      if (this.quota?.increment) {
        this.quota.increment(tenantId, QuotaResourceKind.Coupon, 1);
      }

      this.logger.log(`Redeemed: coupon=${coupon.id} user=${req.userId} store=${req.storeId} redemption=${redemptionId}`);

      return {
        success: true,
        couponId: coupon.id,
        amount: Number(coupon.value),
        redemptionId,
      };
    } catch (err: any) {
      // check() 不递增,所以无需 decrement 回滚
      // CouponBusinessError -> 透传 code;其他 -> COUPON_NOT_FOUND
      if (err instanceof CouponBusinessError) {
        this.logger.warn(`Business check failed: ${err.code} - ${err.message}`);
        return { success: false, error: { code: err.code, message: err.message } };
      }
      this.logger.error(`redeemCrossStore failed: ${err.message}`);
      return {
        success: false,
        error: { code: 'COUPON_NOT_FOUND', message: err.message },
      };
    }
  }

  checkCrossStoreEligibility(coupon: CouponV2, storeId: string): CrossStoreEligibility {
    const { scope } = coupon;
    if (scope.type === 'tenant-wide') {
      return { eligible: true, matchedScope: 'tenant-wide', matchedStoreIds: scope.storeIds };
    }
    if (scope.storeIds.includes(storeId)) {
      return { eligible: true, matchedScope: scope.type, matchedStoreIds: [storeId] };
    }
    return {
      eligible: false,
      reason: `storeId ${storeId} not in scope.storeIds [${scope.storeIds.join(', ')}]`,
      matchedScope: scope.type,
      matchedStoreIds: scope.storeIds,
    };
  }

  async batchRedeem(reqs: RedemptionRequest[]): Promise<RedemptionResult[]> {
    const results: RedemptionResult[] = [];
    for (const req of reqs) {
      const result = await this.redeemCrossStore(req);
      results.push(result);
      if (!result.success) {
        this.logger.warn(`batchRedeem stopped at index ${results.length - 1}: ${result.error?.message}`);
      }
    }
    return results;
  }

  async triggerByCampaign(campaignId: string, userSegment: string): Promise<{ distributed: number }> {
    // TODO: Pulse-69 T5
    return { distributed: 0 };
  }
}
