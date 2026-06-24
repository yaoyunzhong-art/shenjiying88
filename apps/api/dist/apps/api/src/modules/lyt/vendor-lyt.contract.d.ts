import type { LytMemberProfile, LytOrderPayload, LytOrderResult } from '@m5/domain';
export interface LytVendorMemberPayload {
    tenant_id?: string;
    brand_id?: string;
    store_id?: string;
    member_id: string;
    member_code?: string;
    mobile?: string;
    nick_name?: string;
    level_code?: string;
    level_name?: string;
    points?: number;
    growth_value?: number;
    status?: string;
    updated_at?: string;
    raw_version?: string;
}
export interface LytVendorOrderCreatePayload {
    store_id: string;
    member_id?: string;
    lines: Array<{
        sku_id: string;
        qty: number;
        unit_price: number;
    }>;
}
export interface LytVendorOrderPayload {
    tenant_id?: string;
    brand_id?: string;
    store_id?: string;
    order_id: string;
    order_no?: string;
    member_id?: string;
    amount: number;
    discount_amount?: number;
    payable_amount?: number;
    currency?: string;
    status: 'INIT' | 'PAYING' | 'SUCCESS' | 'FAILED' | 'CLOSED' | 'REFUNDED';
    paid_at?: string;
    updated_at?: string;
}
export interface LytVendorDiscountApplyPayload {
    coupon_code: string;
}
export interface LytVendorDiscountResultPayload {
    order_id: string;
    coupon_code: string;
}
export interface LytVendorGateEventRequestPayload {
    pass_code: string;
}
export interface LytVendorGateEventResultPayload {
    store_id: string;
    pass_result: 'ALLOWED' | 'DENIED';
}
export interface LytVendorDevicePayload {
    tenant_id?: string;
    brand_id?: string;
    store_id?: string;
    device_id: string;
    device_status: 'ONLINE' | 'OFFLINE' | 'MAINTENANCE' | 'DISABLED';
    device_type?: string;
    device_name?: string;
    last_heartbeat_at?: string;
    firmware_version?: string;
    updated_at?: string;
}
export declare const LYT_VENDOR_ERROR_CODE_MAP: {
    readonly AUTH_EXPIRED: "LYT_AUTH_EXPIRED";
    readonly INVALID_SIGNATURE: "LYT_SIGNATURE_INVALID";
    readonly RATE_LIMITED: "LYT_RATE_LIMITED";
    readonly RESOURCE_NOT_FOUND: "LYT_RESOURCE_NOT_FOUND";
    readonly TEMP_UNAVAILABLE: "LYT_UPSTREAM_UNAVAILABLE";
    readonly VALIDATION_FAILED: "LYT_VALIDATION_ERROR";
};
export declare function toVendorMemberPayload(profile: LytMemberProfile): LytVendorMemberPayload;
export declare function toLytMemberProfileFromVendor(payload: LytVendorMemberPayload): LytMemberProfile;
export declare function toVendorCreateOrderPayload(payload: LytOrderPayload): LytVendorOrderCreatePayload;
export declare function toLytOrderResultFromVendor(payload: LytVendorOrderPayload): LytOrderResult;
export declare function toVendorDiscountApplyPayload(couponCode: string): LytVendorDiscountApplyPayload;
export declare function toDiscountResultFromVendor(payload: LytVendorDiscountResultPayload): {
    orderId: string;
    couponCode: string;
};
export declare function toVendorGateEventRequestPayload(passCode: string): LytVendorGateEventRequestPayload;
export declare function toGateEventResultFromVendor(payload: LytVendorGateEventResultPayload): {
    accepted: boolean;
    storeId: string;
};
export declare function toDeviceStatusFromVendor(payload: LytVendorDevicePayload): {
    readonly deviceId: string;
    readonly status: "ONLINE" | "OFFLINE";
};
//# sourceMappingURL=vendor-lyt.contract.d.ts.map