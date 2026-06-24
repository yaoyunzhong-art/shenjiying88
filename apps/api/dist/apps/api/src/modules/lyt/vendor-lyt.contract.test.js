"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const strict_1 = __importDefault(require("node:assert/strict"));
const node_test_1 = __importDefault(require("node:test"));
const vendor_lyt_contract_1 = require("./vendor-lyt.contract");
(0, node_test_1.default)('toLytMemberProfileFromVendor maps vendor member payload into standard profile', () => {
    const result = (0, vendor_lyt_contract_1.toLytMemberProfileFromVendor)({
        member_id: 'member-001',
        mobile: '13800000000',
        nick_name: '会员A',
        level_code: 'SVIP'
    });
    strict_1.default.deepEqual(result, {
        memberId: 'member-001',
        mobile: '13800000000',
        nickname: '会员A',
        levelName: 'SVIP'
    });
});
(0, node_test_1.default)('toVendorCreateOrderPayload maps standard order payload into vendor lines', () => {
    const payload = {
        storeId: 'store-1',
        memberId: 'member-1',
        items: [{ skuId: 'sku-1', quantity: 2, price: 39 }]
    };
    strict_1.default.deepEqual((0, vendor_lyt_contract_1.toVendorCreateOrderPayload)(payload), {
        store_id: 'store-1',
        member_id: 'member-1',
        lines: [{ sku_id: 'sku-1', qty: 2, unit_price: 39 }]
    });
});
(0, node_test_1.default)('toLytOrderResultFromVendor maps vendor status and payable amount', () => {
    const result = (0, vendor_lyt_contract_1.toLytOrderResultFromVendor)({
        order_id: 'order-1',
        amount: 100,
        payable_amount: 88,
        status: 'SUCCESS'
    });
    strict_1.default.deepEqual(result, {
        orderId: 'order-1',
        totalAmount: 88,
        status: 'PAID'
    });
});
(0, node_test_1.default)('vendor discount and gate helpers map to standard shapes', () => {
    strict_1.default.deepEqual((0, vendor_lyt_contract_1.toVendorDiscountApplyPayload)('CPN-1'), { coupon_code: 'CPN-1' });
    strict_1.default.deepEqual((0, vendor_lyt_contract_1.toDiscountResultFromVendor)({ order_id: 'order-1', coupon_code: 'CPN-1' }), {
        orderId: 'order-1',
        couponCode: 'CPN-1'
    });
    strict_1.default.deepEqual((0, vendor_lyt_contract_1.toVendorGateEventRequestPayload)('PASS-1'), { pass_code: 'PASS-1' });
    strict_1.default.deepEqual((0, vendor_lyt_contract_1.toGateEventResultFromVendor)({ store_id: 'store-1', pass_result: 'ALLOWED' }), {
        accepted: true,
        storeId: 'store-1'
    });
});
(0, node_test_1.default)('toDeviceStatusFromVendor normalizes maintenance status into offline', () => {
    strict_1.default.deepEqual((0, vendor_lyt_contract_1.toDeviceStatusFromVendor)({
        device_id: 'device-1',
        device_status: 'MAINTENANCE'
    }), {
        deviceId: 'device-1',
        status: 'OFFLINE'
    });
});
(0, node_test_1.default)('LYT_VENDOR_ERROR_CODE_MAP exposes normalized vendor code mapping', () => {
    strict_1.default.equal(vendor_lyt_contract_1.LYT_VENDOR_ERROR_CODE_MAP.VALIDATION_FAILED, 'LYT_VALIDATION_ERROR');
    strict_1.default.equal(vendor_lyt_contract_1.LYT_VENDOR_ERROR_CODE_MAP.TEMP_UNAVAILABLE, 'LYT_UPSTREAM_UNAVAILABLE');
});
//# sourceMappingURL=vendor-lyt.contract.test.js.map