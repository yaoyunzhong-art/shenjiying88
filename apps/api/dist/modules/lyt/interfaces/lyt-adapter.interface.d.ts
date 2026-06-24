import type { LytMemberProfile, LytOrderPayload, LytOrderResult } from '@m5/domain';
export interface ILytAdapter {
    getMember(memberId: string): Promise<LytMemberProfile>;
    createOrder(payload: LytOrderPayload): Promise<LytOrderResult>;
    applyDiscount(orderId: string, couponCode: string): Promise<{
        orderId: string;
        couponCode: string;
    }>;
    syncGateEvent(storeId: string, passCode: string): Promise<{
        accepted: boolean;
        storeId: string;
    }>;
    getDeviceStatus(deviceId: string): Promise<{
        deviceId: string;
        status: 'ONLINE' | 'OFFLINE';
    }>;
}
//# sourceMappingURL=lyt-adapter.interface.d.ts.map