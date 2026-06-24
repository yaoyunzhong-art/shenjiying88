import { ApiClient, getDefaultApiBaseUrl, type LytStoreCapabilityAccessItem, type LytStoreCapabilityAccessViewResponse } from '@m5/sdk';

export const readinessMeta: Record<
  LytStoreCapabilityAccessItem['readiness'],
  { label: string; variant: 'success' | 'warning' | 'danger' | 'default' | 'pending' }
> = {
  ready: { label: '已就绪', variant: 'success' },
  'inherited-ready': { label: '继承就绪', variant: 'warning' },
  stale: { label: '连接过期', variant: 'danger' },
  'pending-configuration': { label: '待配置', variant: 'pending' },
  'not-enabled': { label: '未启用', variant: 'default' }
};

export const accessMeta: Record<
  LytStoreCapabilityAccessItem['access'],
  { label: string; variant: 'success' | 'warning' | 'danger' | 'default' }
> = {
  enabled: { label: '已开放', variant: 'success' },
  degraded: { label: '降级开放', variant: 'warning' },
  blocked: { label: '阻塞', variant: 'danger' },
  hidden: { label: '隐藏', variant: 'default' }
};

export function buildFallbackCapabilityAccessView(storeId: string): LytStoreCapabilityAccessViewResponse {
  return {
    storeId,
    storeCode: `STORE-${storeId.replace(/\D/g, '').padStart(3, '0') || '001'}`,
    storeName: `门店 ${storeId}`,
    connectionStatus: storeId === 's5' ? 'pending-configuration' : 'configured',
    resolutionLevel: storeId === 's3' ? 'tenant' : 'store',
    healthStatus: storeId === 's2' ? 'stale' : storeId === 's5' ? 'pending-configuration' : 'healthy',
    accessByCapability: [
      {
        capability: 'member',
        readiness: storeId === 's5' ? 'pending-configuration' : 'ready',
        access: storeId === 's5' ? 'blocked' : 'enabled',
        reason: storeId === 's5' ? '会员能力尚未完成真实连接配置，前端应阻塞相关操作入口' : '会员能力已具备稳定接入条件'
      },
      {
        capability: 'payment',
        readiness: storeId === 's2' ? 'stale' : storeId === 's3' ? 'inherited-ready' : 'ready',
        access: storeId === 's2' || storeId === 's3' ? 'degraded' : 'enabled',
        reason:
          storeId === 's2'
            ? '支付连接健康状态 stale，建议降级显示并优先巡检'
            : storeId === 's3'
              ? '支付能力来自租户继承连接，建议逐店核验 vendorStoreId'
              : '支付能力已具备稳定接入条件'
      },
      {
        capability: 'device',
        readiness: storeId === 's1' ? 'ready' : 'not-enabled',
        access: storeId === 's1' ? 'enabled' : 'hidden',
        reason: storeId === 's1' ? '设备能力已接入，可正常开放' : '当前门店未启用设备能力，应隐藏入口'
      },
      {
        capability: 'gate',
        readiness: storeId === 's4' ? 'inherited-ready' : 'not-enabled',
        access: storeId === 's4' ? 'degraded' : 'hidden',
        reason: storeId === 's4' ? '门禁能力来自品牌/租户继承连接，建议保留降级提示' : '当前门店未启用门禁能力，应隐藏入口'
      }
    ],
    recommendedNextActions:
      storeId === 's5'
        ? ['优先补齐 endpoint、credential 与 vendorStoreId，尽快退出 pending-configuration 状态']
        : ['当前能力访问视图来自演示 fallback，可继续接真实 store capability access view']
  };
}

interface CapabilityEntrypointDefinition {
  label: string;
  description: string;
  href: (storeId: string) => string;
}

const capabilityEntrypointCatalog: Record<string, CapabilityEntrypointDefinition> = {
  member: {
    label: '会员中心',
    description: '面向门店会员档案、标签分群与生命周期运营。',
    href: (storeId) => `/members?storeId=${storeId}`
  },
  payment: {
    label: '支付运营',
    description: '查看支付链路、异常回执与支付相关治理动作。',
    href: (storeId) => `/operations?storeId=${storeId}&focus=payment`
  },
  order: {
    label: '订单治理',
    description: '聚合订单状态、补单与关闭类治理入口。',
    href: (storeId) => `/operations?storeId=${storeId}&focus=order`
  },
  device: {
    label: '设备运营',
    description: '设备接入、状态巡检与设备侧异常处理。',
    href: (storeId) => `/operations?storeId=${storeId}&focus=device`
  },
  gate: {
    label: '门禁联动',
    description: '门禁、核销与门店入场联动能力入口。',
    href: (storeId) => `/operations?storeId=${storeId}&focus=gate`
  },
  coin: {
    label: '投币治理',
    description: '投币设备、代币规则与对账治理入口。',
    href: (storeId) => `/operations?storeId=${storeId}&focus=coin`
  },
  inventory: {
    label: '库存商品',
    description: '库存、商品上下架与补货调拨入口。',
    href: (storeId) => `/products?storeId=${storeId}&focus=inventory`
  },
  shelf: {
    label: '货架运营',
    description: '货架陈列、补货计划与货架状态运营入口。',
    href: (storeId) => `/products?storeId=${storeId}&focus=shelf`
  }
};

export interface CapabilityEntrypointCard {
  key: string;
  capability: string;
  label: string;
  description: string;
  href: string;
  access: LytStoreCapabilityAccessItem['access'];
  readiness: LytStoreCapabilityAccessItem['readiness'];
  reason: string;
  actionLabel: string;
  hint: string;
  isNavigable: boolean;
  visibility: 'visible' | 'hidden';
}

export interface GatedCapabilityActionItem {
  key: string;
  capability: string;
  label: string;
  href: string;
  access: CapabilityEntrypointCard['access'];
  readiness: CapabilityEntrypointCard['readiness'];
  isDisabled: boolean;
  hint: string;
  visibility: CapabilityEntrypointCard['visibility'];
}

export interface ScopedCapabilityActionOverrides {
  key?: string;
  label?: string;
  href?: string;
  hint?: string;
}

export interface StoreCapabilityAccessSnapshot {
  deliveryMode: 'api' | 'fallback';
  capabilityAccess: LytStoreCapabilityAccessViewResponse;
}

export interface CapabilityTenantContext {
  tenantId?: string;
  brandId?: string;
  storeId?: string;
  marketCode?: string;
}

export const storeScopedWorkbenchRoles = ['STORE_MANAGER', 'GUIDE', 'CASHIER'] as const;

export function isStoreScopedWorkbenchRole(role: string): boolean {
  return storeScopedWorkbenchRoles.includes(role.toUpperCase() as (typeof storeScopedWorkbenchRoles)[number]);
}

export function createCapabilityAccessClient(context?: CapabilityTenantContext) {
  return new ApiClient({
    baseUrl: getDefaultApiBaseUrl(),
    tenantId: context?.tenantId ?? 'tenant-demo',
    brandId: context?.brandId ?? 'brand-demo',
    storeId: context?.storeId ?? 'store-001',
    marketCode: context?.marketCode ?? 'cn-mainland'
  });
}

export async function loadStoreCapabilityAccessSnapshot(
  storeId: string,
  context?: CapabilityTenantContext
): Promise<StoreCapabilityAccessSnapshot> {
  try {
    const capabilityAccess = await createCapabilityAccessClient({
      ...context,
      storeId: context?.storeId ?? storeId
    }).getLytStoreCapabilityAccessView(storeId, { cache: 'no-store' });

    return {
      deliveryMode: 'api',
      capabilityAccess
    };
  } catch {
    return {
      deliveryMode: 'fallback',
      capabilityAccess: buildFallbackCapabilityAccessView(storeId)
    };
  }
}

export function buildCapabilityEntrypoints(
  storeId: string,
  view: Pick<LytStoreCapabilityAccessViewResponse, 'accessByCapability'>
): CapabilityEntrypointCard[] {
  return view.accessByCapability.map((item) => {
    const definition = capabilityEntrypointCatalog[item.capability] ?? {
      label: `${item.capability} 入口`,
      description: '该能力已接入 capability access 视图，待后续补齐专属前端路由。',
      href: (nextStoreId: string) => `/stores/${nextStoreId}/capability-access`
    };

    const isNavigable = item.access === 'enabled' || item.access === 'degraded';
    const visibility = item.access === 'hidden' ? 'hidden' : 'visible';

    return {
      key: `${item.capability}-entry`,
      capability: item.capability,
      label: definition.label,
      description: definition.description,
      href: definition.href(storeId),
      access: item.access,
      readiness: item.readiness,
      reason: item.reason,
      actionLabel:
        item.access === 'enabled' ? '进入入口' : item.access === 'degraded' ? '降级进入' : '等待治理完成',
      hint:
        item.access === 'enabled'
          ? '能力已开放，可直接进入对应工作台入口。'
          : item.access === 'degraded'
            ? '能力允许降级进入，但应保留健康检查或继承链提示。'
            : item.access === 'blocked'
              ? '能力应阻塞入口，待完成连接配置后再开放。'
              : '能力未启用，入口应对门店角色隐藏。',
      isNavigable,
      visibility
    };
  });
}

export function filterCapabilityEntrypoints(
  entrypoints: CapabilityEntrypointCard[],
  capabilities: readonly string[]
): CapabilityEntrypointCard[] {
  if (!capabilities.length) {
    return entrypoints;
  }

  const capabilitySet = new Set(capabilities);
  return entrypoints.filter((item) => capabilitySet.has(item.capability));
}

export function buildCapabilityActionItems(
  entrypoints: CapabilityEntrypointCard[]
): GatedCapabilityActionItem[] {
  return entrypoints.map((item) => ({
    key: `${item.key}-action`,
    capability: item.capability,
    label:
      item.access === 'enabled'
        ? `进入${item.label}`
        : item.access === 'degraded'
          ? `降级进入${item.label}`
          : `等待${item.label}`,
    href: item.href,
    access: item.access,
    readiness: item.readiness,
    isDisabled: item.access === 'blocked',
    hint:
      item.access === 'enabled'
        ? '入口已开放，可直接执行。'
        : item.access === 'degraded'
          ? '入口允许使用，但应保留风险提示。'
          : item.access === 'blocked'
            ? '入口被阻塞，需先完成治理配置。'
            : '入口保持隐藏，不在门店角色下展示。',
    visibility: item.visibility
  }));
}

export function deriveScopedCapabilityActionItem(
  action: GatedCapabilityActionItem,
  overrides: ScopedCapabilityActionOverrides = {}
): GatedCapabilityActionItem {
  return {
    ...action,
    key: overrides.key ?? action.key,
    label: overrides.label ?? action.label,
    href: overrides.href ?? action.href,
    hint: overrides.hint ?? action.hint
  };
}
