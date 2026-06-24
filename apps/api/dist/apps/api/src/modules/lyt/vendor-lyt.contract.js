"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LYT_VENDOR_ERROR_CODE_MAP = void 0;
exports.toVendorMemberPayload = toVendorMemberPayload;
exports.toLytMemberProfileFromVendor = toLytMemberProfileFromVendor;
exports.toVendorCreateOrderPayload = toVendorCreateOrderPayload;
exports.toLytOrderResultFromVendor = toLytOrderResultFromVendor;
exports.toVendorDiscountApplyPayload = toVendorDiscountApplyPayload;
exports.toDiscountResultFromVendor = toDiscountResultFromVendor;
exports.toVendorGateEventRequestPayload = toVendorGateEventRequestPayload;
exports.toGateEventResultFromVendor = toGateEventResultFromVendor;
exports.toDeviceStatusFromVendor = toDeviceStatusFromVendor;
exports.LYT_VENDOR_ERROR_CODE_MAP = {
    AUTH_EXPIRED: 'LYT_AUTH_EXPIRED',
    INVALID_SIGNATURE: 'LYT_SIGNATURE_INVALID',
    RATE_LIMITED: 'LYT_RATE_LIMITED',
    RESOURCE_NOT_FOUND: 'LYT_RESOURCE_NOT_FOUND',
    TEMP_UNAVAILABLE: 'LYT_UPSTREAM_UNAVAILABLE',
    VALIDATION_FAILED: 'LYT_VALIDATION_ERROR'
};
function toVendorMemberPayload(profile) {
    return {
        member_id: profile.memberId,
        mobile: profile.mobile,
        nick_name: profile.nickname,
        level_name: profile.levelName
    };
}
function toLytMemberProfileFromVendor(payload) {
    return {
        memberId: payload.member_id,
        mobile: payload.mobile,
        nickname: payload.nick_name ?? payload.member_code ?? payload.member_id,
        levelName: payload.level_name ?? payload.level_code
    };
}
function toVendorCreateOrderPayload(payload) {
    return {
        store_id: payload.storeId,
        member_id: payload.memberId,
        lines: payload.items.map((item) => ({
            sku_id: item.skuId,
            qty: item.quantity,
            unit_price: item.price
        }))
    };
}
function mapVendorOrderStatus(status) {
    switch (status) {
        case 'SUCCESS':
            return 'PAID';
        case 'FAILED':
        case 'CLOSED':
        case 'REFUNDED':
            return 'FAILED';
        case 'INIT':
        case 'PAYING':
        default:
            return 'CREATED';
    }
}
function toLytOrderResultFromVendor(payload) {
    return {
        orderId: payload.order_id,
        totalAmount: payload.payable_amount ?? payload.amount,
        status: mapVendorOrderStatus(payload.status)
    };
}
function toVendorDiscountApplyPayload(couponCode) {
    return {
        coupon_code: couponCode
    };
}
function toDiscountResultFromVendor(payload) {
    return {
        orderId: payload.order_id,
        couponCode: payload.coupon_code
    };
}
function toVendorGateEventRequestPayload(passCode) {
    return {
        pass_code: passCode
    };
}
function toGateEventResultFromVendor(payload) {
    return {
        accepted: payload.pass_result === 'ALLOWED',
        storeId: payload.store_id
    };
}
function toDeviceStatusFromVendor(payload) {
    return {
        deviceId: payload.device_id,
        status: payload.device_status === 'ONLINE' ? 'ONLINE' : 'OFFLINE'
    };
}
//# sourceMappingURL=vendor-lyt.contract.js.map