import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { LytMemberProfile, LytOrderPayload, LytOrderResult } from '@m5/domain';
import type { ILytAdapter } from '../interfaces/lyt-adapter.interface';
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
} from '../vendor-lyt.contract';
import { resolveLytHttpAdapterConfig } from '../lyt-adapter.config';
import { HttpLytAdapterBase } from './http-lyt.adapter.base';

@Injectable()
export class SandboxLytAdapter extends HttpLytAdapterBase implements ILytAdapter {
  constructor(configService: ConfigService) {
    const config = resolveLytHttpAdapterConfig('sandbox', configService);
    super({
      adapterName: 'SandboxLytAdapter',
      adapterMode: 'sandbox',
      baseUrl: config.baseUrl,
      signingSecret: config.signingSecret,
      timeoutMs: config.timeoutMs,
      maxRetries: config.maxRetries,
      errorCodeMap: LYT_VENDOR_ERROR_CODE_MAP
    });
  }

  async getMember(memberId: string): Promise<LytMemberProfile> {
    const payload = await this.request<Parameters<typeof toLytMemberProfileFromVendor>[0]>(`/members/${memberId}`);
    return toLytMemberProfileFromVendor(payload);
  }

  async createOrder(payload: LytOrderPayload): Promise<LytOrderResult> {
    const result = await this.request<Parameters<typeof toLytOrderResultFromVendor>[0]>('/orders', {
      method: 'POST',
      body: JSON.stringify(toVendorCreateOrderPayload(payload))
    });
    return toLytOrderResultFromVendor(result);
  }

  async applyDiscount(orderId: string, couponCode: string) {
    const result = await this.request<Parameters<typeof toDiscountResultFromVendor>[0]>(`/orders/${orderId}/discounts`, {
      method: 'POST',
      body: JSON.stringify(toVendorDiscountApplyPayload(couponCode))
    });
    return toDiscountResultFromVendor(result);
  }

  async syncGateEvent(storeId: string, passCode: string) {
    const result = await this.request<Parameters<typeof toGateEventResultFromVendor>[0]>(`/stores/${storeId}/gate-events`, {
      method: 'POST',
      body: JSON.stringify(toVendorGateEventRequestPayload(passCode))
    });
    return toGateEventResultFromVendor(result);
  }

  async getDeviceStatus(deviceId: string) {
    const payload = await this.request<Parameters<typeof toDeviceStatusFromVendor>[0]>(`/devices/${deviceId}/status`);
    return toDeviceStatusFromVendor(payload);
  }
}
