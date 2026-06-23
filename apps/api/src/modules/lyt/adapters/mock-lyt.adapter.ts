import { Injectable } from '@nestjs/common';
import type { LytMemberProfile, LytOrderPayload, LytOrderResult } from '@m5/domain';
import type { ILytAdapter } from '../interfaces/lyt-adapter.interface';

@Injectable()
export class MockLytAdapter implements ILytAdapter {
  readonly adapterName = 'MockLytAdapter';
  readonly adapterMode = 'mock' as const;

  async getMember(memberId: string): Promise<LytMemberProfile> {
    return { memberId, nickname: 'Mock Member', levelName: 'SVIP Seed' };
  }

  async createOrder(payload: LytOrderPayload): Promise<LytOrderResult> {
    const totalAmount = payload.items.reduce((sum, item) => sum + item.quantity * item.price, 0);
    return { orderId: `mock-${Date.now()}`, totalAmount, status: 'CREATED' };
  }

  async applyDiscount(orderId: string, couponCode: string) {
    return { orderId, couponCode };
  }

  async syncGateEvent(storeId: string, passCode: string) {
    void passCode;
    return { accepted: true, storeId };
  }

  async getDeviceStatus(deviceId: string) {
    return { deviceId, status: 'ONLINE' as const };
  }
}
