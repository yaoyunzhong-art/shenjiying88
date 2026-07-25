/**
 * SDK 单例入口 — admin-web 统一业务 API 客户端
 *
 * 用法:
 *   import { biz } from '@/lib/sdk';
 *   const orders = await biz.orders.list();
 */
import { buildActorHeaders, createBusinessClient } from '@m5/sdk';
import { getCachedAdminUser, getAdminAccessToken } from './admin-session';

const FALLBACK_SCOPE = {
  tenantId: 'tenant-demo',
  brandId: 'brand-demo',
  storeId: 'store-001',
  marketCode: 'cn-mainland',
} as const;

function resolveBusinessClientOptions() {
  const currentUser = getCachedAdminUser();
  const token = getAdminAccessToken() ?? undefined;

  return {
    ...FALLBACK_SCOPE,
    ...(currentUser?.tenantId ? { tenantId: currentUser.tenantId } : {}),
    ...(currentUser?.brandId ? { brandId: currentUser.brandId } : {}),
    ...(currentUser?.storeId ? { storeId: currentUser.storeId } : {}),
    ...(currentUser?.marketCode ? { marketCode: currentUser.marketCode } : {}),
    ...(token ? { token } : {}),
    ...(currentUser
      ? {
          headers: buildActorHeaders({
            actorId: currentUser.userId,
            actorType: 'employee-user',
            actorName: currentUser.username ?? currentUser.email ?? currentUser.userId,
            tenantId: currentUser.tenantId ?? FALLBACK_SCOPE.tenantId,
            brandId: currentUser.brandId ?? FALLBACK_SCOPE.brandId,
            storeId: currentUser.storeId ?? FALLBACK_SCOPE.storeId,
            roles: [currentUser.role],
            permissions: currentUser.permissions,
            authenticated: true,
          }),
        }
      : {}),
  };
}
function makeBizClient() {
  if (typeof window === 'undefined') return null;
  const w = window as unknown as Record<string, unknown> & {
    __m5_biz_client?: ReturnType<typeof createBusinessClient>;
  };
  if (!w.__m5_biz_client) {
    w.__m5_biz_client = createBusinessClient(resolveBusinessClientOptions());
  }

  return w.__m5_biz_client;
}

export const biz = makeBizClient();


/** 获取或创建 SDK 客户端（惰性单件） */
export function getBizClient() {
  return makeBizClient();
}
