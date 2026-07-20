/**
 * gift-card.entity.ts — 礼品卡模块类型定义
 *
 * 业务字段:
 *   - cardId:        唯一卡号（UUID 或 13 位数字）
 *   - tenantId:      多租户隔离字段（RLS 风格）
 *   - templateId:    礼品卡模板 ID（如果使用模板）
 *   - denomination:  面额（单位: 分，避免浮点）
 *   - balance:       余额（单位: 分）
 *   - currency:      币种，默认 CNY
 *   - status:        卡状态
 *   - holderName:    持卡人姓名
 *   - holderPhone:   持卡人手机
 *   - purchasedAt:   购买时间
 *   - activatedAt:   激活时间
 *   - expiresAt:     过期时间
 *   - frozenAmount:  冻结金额
 *   - storeScope:    适用门店范围（空 = 全部门店）
 *   - sourceOrderId: 来源订单 ID（关联购买记录）
 *   - createdAt:     创建时间
 *   - updatedAt:     更新时间
 */

/** 卡状态 */
export type GiftCardStatus = 'pending' | 'active' | 'frozen' | 'expired' | 'redeemed' | 'cancelled'

/** 交易类型 */
export type TransactionType = 'purchase' | 'activation' | 'topup' | 'freeze' | 'unfreeze' | 'consume' | 'refund' | 'cancel'

/** 交易记录 */
export interface GiftCardTransaction {
  txId: string
  cardId: string
  tenantId?: string
  type: TransactionType
  amount: number        // 变动的金额（分），正数 = 减少 / 负数为增加余额
  beforeBalance: number
  afterBalance: number
  orderId?: string      // 关联订单
  operatorId?: string   // 操作人
  remark?: string
  createdAt: string
}

/** 礼品卡 */
export interface GiftCard {
  cardId: string
  tenantId?: string
  templateId: string
  denomination: number
  balance: number
  currency: string
  status: GiftCardStatus
  holderName: string
  holderPhone: string
  purchasedAt: string
  activatedAt?: string
  expiresAt: string
  frozenAmount: number
  storeScope: string[]
  sourceOrderId?: string
  totalConsumed: number   // 累计消费（分）
  createdAt: string
  updatedAt: string
}

/** 创建礼品卡请求 */
export interface GiftCardCreateRequest {
  templateId: string
  denomination: number
  holderName: string
  holderPhone: string
  expiresAt: string
  storeScope?: string[]
  sourceOrderId?: string
  tenantId?: string
}

/** 礼品卡充值请求 */
export interface GiftCardTopupRequest {
  cardId: string
  amount: number          // 充值金额（分）
  operatorId?: string
  remark?: string
}

/** 消费请求 */
export interface GiftCardConsumeRequest {
  cardId: string
  amount: number          // 消费金额（分）
  orderId?: string
  operatorId?: string
  remark?: string
}

/** 查询过滤 */
export interface GiftCardFilter {
  status?: GiftCardStatus
  holderName?: string
  holderPhone?: string
  tenantId?: string
}
