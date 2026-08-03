/**
 * membership.dto.ts — 会员管理数据传输对象
 */
import type { MemberLevel } from './membership.service'

/**
 * 注册会员请求
 */
export interface RegisterMemberDto {
  phone: string
  name?: string
}

/**
 * 更新会员请求
 */
export interface UpdateMemberDto {
  name?: string
  level?: MemberLevel
}

/**
 * 查询会员列表
 */
export interface ListMembersQueryDto {
  phone?: string
  level?: MemberLevel
  search?: string
}

/**
 * 积分累计请求
 */
export interface EarnPointsDto {
  memberId: string
  amount: number   // 消费金额(分)
  orderId?: string
}

/**
 * 积分扣减请求
 */
export interface RedeemPointsDto {
  memberId: string
  points: number
  orderId?: string
}

/**
 * 管理员调整积分
 */
export interface AdjustPointsDto {
  memberId: string
  amount: number
  remark: string
}

/**
 * 充值请求
 */
export interface RechargeBalanceDto {
  memberId: string
  amount: number
  paymentMethod?: string
  orderId?: string
}

/**
 * 余额支付请求
 */
export interface PayWithBalanceDto {
  memberId: string
  amount: number
  orderId?: string
}
