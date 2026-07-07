import type { LytMemberProfile, LytOrderPayload, LytOrderResult } from '@m5/domain';

export interface ILytAdapter {
  readonly adapterName: string;
  readonly adapterMode: 'mock' | 'sandbox' | 'real';
  getMember(memberId: string): Promise<LytMemberProfile>;
  createOrder(payload: LytOrderPayload): Promise<LytOrderResult>;
  applyDiscount(orderId: string, couponCode: string): Promise<{ orderId: string; couponCode: string }>;
  syncGateEvent(storeId: string, passCode: string): Promise<{ accepted: boolean; storeId: string }>;
  getDeviceStatus(deviceId: string): Promise<{ deviceId: string; status: 'ONLINE' | 'OFFLINE' }>;
  /**
   * 会员升级 / 资料更新 (可选 — 真实底座才需要, mock 可不实现)
   * cashier-to-lyt 桥接在 member.tier-upgrade 事件触发
   */
  updateMember?(payload: {
    memberId: string
    tier?: string
    [k: string]: unknown
  }): Promise<{ status: 'UPDATED' | 'NOOP'; memberId: string }>;
}
