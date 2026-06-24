import assert from 'node:assert/strict'
import test from 'node:test'
import type { LytOrderPayload } from '@m5/domain'
import {
  LYT_VENDOR_ERROR_CODE_MAP,
  toDeviceStatusFromVendor,
  toDiscountResultFromVendor,
  toGateEventResultFromVendor,
  toLytMemberProfileFromVendor,
  toLytOrderResultFromVendor,
  toVendorCreateOrderPayload,
  toVendorDiscountApplyPayload,
  toVendorGateEventRequestPayload
} from './vendor-lyt.contract'

test('toLytMemberProfileFromVendor maps vendor member payload into standard profile', () => {
  const result = toLytMemberProfileFromVendor({
    member_id: 'member-001',
    mobile: '13800000000',
    nick_name: '会员A',
    level_code: 'SVIP'
  })

  assert.deepEqual(result, {
    memberId: 'member-001',
    mobile: '13800000000',
    nickname: '会员A',
    levelName: 'SVIP'
  })
})

test('toVendorCreateOrderPayload maps standard order payload into vendor lines', () => {
  const payload: LytOrderPayload = {
    storeId: 'store-1',
    memberId: 'member-1',
    items: [{ skuId: 'sku-1', quantity: 2, price: 39 }]
  }

  assert.deepEqual(toVendorCreateOrderPayload(payload), {
    store_id: 'store-1',
    member_id: 'member-1',
    lines: [{ sku_id: 'sku-1', qty: 2, unit_price: 39 }]
  })
})

test('toLytOrderResultFromVendor maps vendor status and payable amount', () => {
  const result = toLytOrderResultFromVendor({
    order_id: 'order-1',
    amount: 100,
    payable_amount: 88,
    status: 'SUCCESS'
  })

  assert.deepEqual(result, {
    orderId: 'order-1',
    totalAmount: 88,
    status: 'PAID'
  })
})

test('vendor discount and gate helpers map to standard shapes', () => {
  assert.deepEqual(toVendorDiscountApplyPayload('CPN-1'), { coupon_code: 'CPN-1' })
  assert.deepEqual(toDiscountResultFromVendor({ order_id: 'order-1', coupon_code: 'CPN-1' }), {
    orderId: 'order-1',
    couponCode: 'CPN-1'
  })
  assert.deepEqual(toVendorGateEventRequestPayload('PASS-1'), { pass_code: 'PASS-1' })
  assert.deepEqual(toGateEventResultFromVendor({ store_id: 'store-1', pass_result: 'ALLOWED' }), {
    accepted: true,
    storeId: 'store-1'
  })
})

test('toDeviceStatusFromVendor normalizes maintenance status into offline', () => {
  assert.deepEqual(
    toDeviceStatusFromVendor({
      device_id: 'device-1',
      device_status: 'MAINTENANCE'
    }),
    {
      deviceId: 'device-1',
      status: 'OFFLINE'
    }
  )
})

test('LYT_VENDOR_ERROR_CODE_MAP exposes normalized vendor code mapping', () => {
  assert.equal(LYT_VENDOR_ERROR_CODE_MAP.VALIDATION_FAILED, 'LYT_VALIDATION_ERROR')
  assert.equal(LYT_VENDOR_ERROR_CODE_MAP.TEMP_UNAVAILABLE, 'LYT_UPSTREAM_UNAVAILABLE')
})
