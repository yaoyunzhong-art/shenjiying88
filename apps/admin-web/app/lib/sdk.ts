/**
 * SDK 单例入口 — admin-web 统一业务 API 客户端
 *
 * 用法:
 *   import { biz } from '@/lib/sdk';
 *   const orders = await biz.orders.list();
 */
import { createBusinessClient } from '@m5/sdk';

function makeBizClient() {
  if (typeof window === 'undefined') return null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const w = window as any;
  if (!w.__m5_biz_client) {
    w.__m5_biz_client = createBusinessClient();
  }
  return w.__m5_biz_client as ReturnType<typeof createBusinessClient>;
}

export const biz = makeBizClient();

/** 获取或创建 SDK 客户端（惰性单件） */
export function getBizClient() {
  return makeBizClient();
}
