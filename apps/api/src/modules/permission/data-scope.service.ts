// data-scope.service.ts · 数据范围控制服务
// Phase-FP P0 · 2026-07-03

import { Injectable, Logger } from '@nestjs/common'
import {
  DataScope,
  DataScopeType,
  PermissionContext,
} from './permission.types'

@Injectable()
export class DataScopeService {
  private readonly logger = new Logger(DataScopeService.name)

  // 模拟用户-门店分配关系
  private readonly userStores = new Map<string, Set<string>>()
  private readonly userBrands = new Map<string, Set<string>>()

  constructor() {
    this.initMockData()
  }

  /**
   * 获取用户的数据范围
   */
  getDataScope(context: PermissionContext): DataScope {
    // 平台管理员 - 全平台
    if (context.roles.includes('PLATFORM_ADMIN')) {
      return {
        scopeType: DataScopeType.PLATFORM,
      }
    }

    // 企业管理员 - 整个租户
    if (context.roles.includes('TENANT_ADMIN')) {
      return {
        scopeType: DataScopeType.TENANT,
        allowedStoreIds: undefined, // 全部门店
        allowedBrandIds: undefined, // 全部品牌
      }
    }

    // 店长 - 本门店及下级门店
    if (context.roles.includes('STORE_MANAGER') && context.storeId) {
      const assignedStores = this.userStores.get(context.userId) || new Set([context.storeId])
      return {
        scopeType: DataScopeType.STORE,
        allowedStoreIds: Array.from(assignedStores),
        ownOnly: false,
      }
    }

    // 导购/收银 - 仅分配的门店
    if ((context.roles.includes('SALES_GUIDE') || context.roles.includes('CASHIER')) && context.storeId) {
      return {
        scopeType: DataScopeType.STORE,
        allowedStoreIds: [context.storeId],
        ownOnly: true,
      }
    }

    // 会员 - 仅自己的数据
    if (context.roles.includes('MEMBER')) {
      return {
        scopeType: DataScopeType.SELF,
        ownOnly: true,
      }
    }

    // 默认 - 仅租户内
    return {
      scopeType: DataScopeType.TENANT,
      ownOnly: false,
    }
  }

  /**
   * 根据数据范围过滤查询条件
   */
  applyDataScopeFilter(
    scope: DataScope,
    context: PermissionContext,
    query: Record<string, any>,
  ): Record<string, any> {
    const filteredQuery = { ...query }

    switch (scope.scopeType) {
      case DataScopeType.PLATFORM:
        // 不过滤 - 可见全部数据
        break

      case DataScopeType.TENANT:
        // 限制租户
        filteredQuery.tenantId = context.tenantId
        if (scope.allowedBrandIds && scope.allowedBrandIds.length > 0) {
          filteredQuery.brandId = { in: scope.allowedBrandIds }
        }
        break

      case DataScopeType.BRAND:
        // 限制租户和品牌
        filteredQuery.tenantId = context.tenantId
        if (scope.allowedBrandIds) {
          filteredQuery.brandId = { in: scope.allowedBrandIds }
        }
        if (scope.allowedStoreIds) {
          filteredQuery.storeId = { in: scope.allowedStoreIds }
        }
        break

      case DataScopeType.STORE:
        // 限制租户和门店
        filteredQuery.tenantId = context.tenantId
        if (scope.allowedStoreIds) {
          filteredQuery.storeId = { in: scope.allowedStoreIds }
        }
        break

      case DataScopeType.SELF:
        // 仅自己的数据
        filteredQuery.tenantId = context.tenantId
        filteredQuery.userId = context.userId
        break
    }

    return filteredQuery
  }

  /**
   * 检查用户是否有权访问指定资源
   */
  canAccessResource(
    context: PermissionContext,
    resourceTenantId: string,
    resourceBrandId?: string,
    resourceStoreId?: string,
  ): boolean {
    // 平台管理员可访问所有
    if (context.roles.includes('PLATFORM_ADMIN')) {
      return true
    }

    // 检查租户
    if (context.tenantId !== resourceTenantId) {
      return false
    }

    const scope = this.getDataScope(context)

    switch (scope.scopeType) {
      case DataScopeType.PLATFORM:
      case DataScopeType.TENANT:
        return true

      case DataScopeType.BRAND:
        if (resourceBrandId && scope.allowedBrandIds) {
          return scope.allowedBrandIds.includes(resourceBrandId)
        }
        return true

      case DataScopeType.STORE:
        if (resourceStoreId && scope.allowedStoreIds) {
          return scope.allowedStoreIds.includes(resourceStoreId)
        }
        return true

      case DataScopeType.SELF:
        // SELF范围只能访问自己的资源，这里需要调用方额外判断
        return true

      default:
        return false
    }
  }

  /**
   * 分配门店给用户
   */
  assignStores(userId: string, storeIds: string[]): void {
    this.userStores.set(userId, new Set(storeIds))
    this.logger.log(`Assigned stores [${storeIds.join(', ')}] to user ${userId}`)
  }

  /**
   * 分配品牌给用户
   */
  assignBrands(userId: string, brandIds: string[]): void {
    this.userBrands.set(userId, new Set(brandIds))
    this.logger.log(`Assigned brands [${brandIds.join(', ')}] to user ${userId}`)
  }

  // ─── 私有方法 ────────────────────────────────────────────────────────

  private initMockData(): void {
    // 模拟店长分配了多个门店
    this.userStores.set('store_manager_001', new Set(['store_001', 'store_002', 'store_003']))

    // 模拟导购只分配了一个门店
    this.userStores.set('sales_guide_001', new Set(['store_001']))

    this.logger.debug('Initialized mock user-store assignments')
  }
}
