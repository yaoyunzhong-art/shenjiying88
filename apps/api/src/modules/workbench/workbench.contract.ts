import type { RoleWorkbench, WorkbenchNavItem } from '@m5/domain'
import type { RoleWorkbenchContract, TenantContextContract, WorkbenchNavItemContract } from '@m5/types'
import type { RequestTenantContext } from '../tenant/tenant.types'

export function toWorkbenchNavItemContract(item: WorkbenchNavItem): WorkbenchNavItemContract {
  return {
    key: item.key,
    label: item.label,
    href: item.href,
    description: item.description
  }
}

export function toRoleWorkbenchContract(workbench: RoleWorkbench): RoleWorkbenchContract {
  return {
    role: workbench.role,
    channel: workbench.channel,
    title: workbench.title,
    description: workbench.description,
    marketCodes: workbench.marketCodes ?? [],
    navItems: workbench.navItems.map(toWorkbenchNavItemContract)
  }
}

export function toTenantContextContract(context: RequestTenantContext): TenantContextContract {
  return {
    tenantId: context.tenantId,
    ...(context.brandId ? { brandId: context.brandId } : {}),
    ...(context.storeId ? { storeId: context.storeId } : {}),
    ...(context.marketCode ? { marketCode: context.marketCode } : {})
  }
}
