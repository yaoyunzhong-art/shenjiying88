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
  const w = window as unknown as Record<string, unknown> & { __m5_biz_client?: ReturnType<typeof createBusinessClient> };
  if (!w.__m5_biz_client) {
    w.__m5_biz_client = createBusinessClient();
  }
  return w.__m5_biz_client;
}

export const biz = makeBizClient();

/** 获取或创建 SDK 客户端（惰性单件） */
export function getBizClient() {
  return makeBizClient();
}
