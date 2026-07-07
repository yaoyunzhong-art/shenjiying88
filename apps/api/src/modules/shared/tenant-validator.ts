import { ForbiddenException } from '@nestjs/common'

/**
 * Phase-34: tenantId 必填校验工具
 *
 * 任何业务 service / controller 接受 tenantId 时必须先调此函数
 * - 空字符串 / null / undefined → ForbiddenException
 * - 校验失败时记录到 audit (调用方负责)
 */
export function assertTenantId(tenantId: string | undefined | null): asserts tenantId is string {
  if (!tenantId || typeof tenantId !== 'string' || tenantId.trim() === '') {
    throw new ForbiddenException({
      error: 'missing_tenant_id',
      message: 'tenantId is required and must be a non-empty string'
    })
  }
}

/**
 * 跨租户检测 (单一比较点)
 * 返回 true 表示跨租户, false 表示同租户或主实体不存在
 */
export function isCrossTenant(
  entityTenantId: string | undefined | null,
  requestTenantId: string
): boolean {
  if (!entityTenantId) return false // 实体无 tenantId (例如 orphan), 不算跨租户
  return entityTenantId !== requestTenantId
}