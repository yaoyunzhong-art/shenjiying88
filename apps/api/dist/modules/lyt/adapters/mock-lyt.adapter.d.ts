import type { LytMemberProfile, LytOrderPayload, LytOrderResult } from '@m5/domain';
import type { ILytAdapter } from '../interfaces/lyt-adapter.interface';
export declare class MockLytAdapter implements ILytAdapter {
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
        status: "ONLINE";
    }>;
}
//# sourceMappingURL=mock-lyt.adapter.d.ts.map