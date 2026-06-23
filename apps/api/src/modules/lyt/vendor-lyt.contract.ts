import type { LytMemberProfile, LytOrderPayload, LytOrderResult } from '@m5/domain'

export interface LytVendorMemberPayload {
  tenant_id?: string
  brand_id?: string
  store_id?: string
  member_id: string
  member_code?: string
  mobile?: string
  nick_name?: string
  level_code?: string
  level_name?: string
  points?: number
  growth_value?: number
  status?: string
  updated_at?: string
  raw_version?: string
}

export interface LytVendorOrderCreatePayload {
  store_id: string
  member_id?: string
  lines: Array<{
    sku_id: string
    qty: number
    unit_price: number
  }>
}

export interface LytVendorOrderPayload {
  tenant_id?: string
  brand_id?: string
  store_id?: string
  order_id: string
  order_no?: string
  member_id?: string
  amount: number
  discount_amount?: number
  payable_amount?: number
  currency?: string
  status: 'INIT' | 'PAYING' | 'SUCCESS' | 'FAILED' | 'CLOSED' | 'REFUNDED'
  paid_at?: string
  updated_at?: string
}

export interface LytVendorDiscountApplyPayload {
  coupon_code: string
}

export interface LytVendorDiscountResultPayload {
  order_id: string
  coupon_code: string
}

export interface LytVendorGateEventRequestPayload {
  pass_code: string
}

export interface LytVendorGateEventResultPayload {
  store_id: string
  pass_result: 'ALLOWED' | 'DENIED'
}

export interface LytVendorDevicePayload {
  tenant_id?: string
  brand_id?: string
  store_id?: string
  device_id: string
  device_status: 'ONLINE' | 'OFFLINE' | 'MAINTENANCE' | 'DISABLED'
  device_type?: string
  device_name?: string
  last_heartbeat_at?: string
  firmware_version?: string
  updated_at?: string
}

export const LYT_VENDOR_ERROR_CODE_MAP = {
  AUTH_EXPIRED: 'LYT_AUTH_EXPIRED',
  INVALID_SIGNATURE: 'LYT_SIGNATURE_INVALID',
  RATE_LIMITED: 'LYT_RATE_LIMITED',
  RESOURCE_NOT_FOUND: 'LYT_RESOURCE_NOT_FOUND',
  TEMP_UNAVAILABLE: 'LYT_UPSTREAM_UNAVAILABLE',
  VALIDATION_FAILED: 'LYT_VALIDATION_ERROR'
} as const

export function toVendorMemberPayload(profile: LytMemberProfile): LytVendorMemberPayload {
  return {
    member_id: profile.memberId,
    mobile: profile.mobile,
    nick_name: profile.nickname,
    level_name: profile.levelName
  }
}

export function toLytMemberProfileFromVendor(payload: LytVendorMemberPayload): LytMemberProfile {
  return {
    memberId: payload.member_id,
    mobile: payload.mobile,
    nickname: payload.nick_name ?? payload.member_code ?? payload.member_id,
    levelName: payload.level_name ?? payload.level_code
  }
}

export function toVendorCreateOrderPayload(payload: LytOrderPayload): LytVendorOrderCreatePayload {
  return {
    store_id: payload.storeId,
    member_id: payload.memberId,
    lines: payload.items.map((item) => ({
      sku_id: item.skuId,
      qty: item.quantity,
      unit_price: item.price
    }))
  }
}

function mapVendorOrderStatus(status: LytVendorOrderPayload['status']): LytOrderResult['status'] {
  switch (status) {
    case 'SUCCESS':
      return 'PAID'
    case 'FAILED':
    case 'CLOSED':
    case 'REFUNDED':
      return 'FAILED'
    case 'INIT':
    case 'PAYING':
    default:
      return 'CREATED'
  }
}

export function toLytOrderResultFromVendor(payload: LytVendorOrderPayload): LytOrderResult {
  return {
    orderId: payload.order_id,
    totalAmount: payload.payable_amount ?? payload.amount,
    status: mapVendorOrderStatus(payload.status)
  }
}

export function toVendorDiscountApplyPayload(couponCode: string): LytVendorDiscountApplyPayload {
  return {
    coupon_code: couponCode
  }
}

export function toDiscountResultFromVendor(payload: LytVendorDiscountResultPayload) {
  return {
    orderId: payload.order_id,
    couponCode: payload.coupon_code
  }
}

export function toVendorGateEventRequestPayload(passCode: string): LytVendorGateEventRequestPayload {
  return {
    pass_code: passCode
  }
}

export function toGateEventResultFromVendor(payload: LytVendorGateEventResultPayload) {
  return {
    accepted: payload.pass_result === 'ALLOWED',
    storeId: payload.store_id
  }
}

export function toDeviceStatusFromVendor(payload: LytVendorDevicePayload) {
  return {
    deviceId: payload.device_id,
    status: payload.device_status === 'ONLINE' ? 'ONLINE' : 'OFFLINE'
  } as const
}
