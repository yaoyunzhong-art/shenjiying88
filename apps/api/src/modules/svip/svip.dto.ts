/**
 * SVIP 会员管理 DTOs
 */

import { SVIPBenefitType, SVIPStatus } from './svip.entity';

// ── 请求 DTO ──

export class CreatePlanDto {
  /** 计划名称 */
  name!: string;

  /** 价格(元) */
  price!: number;

  /** 有效天数 */
  durationDays!: number;

  /** 包含的权益列表 */
  benefits!: string[];
}

export class SubscribeDto {
  /** 用户ID */
  userId!: string;

  /** 计划ID */
  planId!: string;
}

export class UseBenefitDto {
  /** 用户ID */
  userId!: string;

  /** 权益类型 */
  benefitType!: SVIPBenefitType;
}

export class RenewSubscriptionDto {
  /** 订阅ID */
  subscriptionId!: string;
}

export class CancelSubscriptionDto {
  /** 订阅ID */
  subscriptionId!: string;
}

// ── 查询 DTO ──

export class SubscriptionQueryDto {
  /** 用户ID */
  userId?: string;

  /** 状态过滤 */
  status?: SVIPStatus;

  /** 页码 */
  page?: number = 1;

  /** 每页条数 */
  pageSize?: number = 10;
}

export class PlanQueryDto {
  /** 计划名称（模糊搜索） */
  name?: string;

  /** 最低价格 */
  minPrice?: number;

  /** 最高价格 */
  maxPrice?: number;

  /** 页码 */
  page?: number = 1;

  /** 每页条数 */
  pageSize?: number = 10;
}

export class BenefitQueryDto {
  /** 订阅ID */
  subscriptionId!: string;

  /** 权益类型过滤 */
  type?: SVIPBenefitType;

  /** 是否已使用 */
  used?: boolean;
}

// ── 响应 DTO ──

export class PlanResponseDto {
  planId!: string;
  name!: string;
  price!: number;
  durationDays!: number;
  benefits!: string[];
  createdAt!: string;
}

export class SubscriptionResponseDto {
  subscriptionId!: string;
  userId!: string;
  planId!: string;
  status!: SVIPStatus;
  startAt!: string;
  expireAt!: string;
  autoRenew!: boolean;
  createdAt!: string;
}

export class BenefitResponseDto {
  benefitId!: string;
  subscriptionId!: string;
  type!: SVIPBenefitType;
  usedAt?: string;
  expiresAt?: string;
}

export class PlanListResponseDto {
  data!: PlanResponseDto[];
  total!: number;
  page!: number;
  pageSize!: number;
}

export class SubscriptionListResponseDto {
  data!: SubscriptionResponseDto[];
  total!: number;
  page!: number;
  pageSize!: number;
}

export class SvipStatsResponseDto {
  totalSubscriptions!: number;
  activeCount!: number;
  expiredCount!: number;
  cancelledCount!: number;
  totalRevenue!: number;
}
