import { IsArray, IsBoolean, IsIn, IsObject, IsOptional, IsString } from 'class-validator'

/**
 * Identity Access 模块 DTO 类型定义
 *
 * identity-access 是认证/授权/租户隔离的统一入口模块。
 * 绝大多数路由通过 @Param / @TenantContext / @CurrentActor 等参数装饰器绑定路由参数，
 * 少数需要在请求体中显式传递的载荷由此文件定义。
 */

// ── Authorization Request DTOs ──

/**
 * 授权判定请求体
 */
export class AuthorizeActionDto {
  @IsString()
  action!: string

  @IsOptional()
  @IsString()
  tenantId?: string

  @IsOptional()
  @IsString()
  brandId?: string

  @IsOptional()
  @IsString()
  storeId?: string
}

/**
 * 租户作用域校验请求体
 */
export class ValidateTenantScopeDto {
  @IsString()
  tenantId!: string

  @IsOptional()
  @IsString()
  brandId?: string

  @IsOptional()
  @IsString()
  storeId?: string
}

/**
 * 角色校验请求体
 */
export class ValidateRoleDto {
  @IsArray()
  @IsString({ each: true })
  roles!: string[]
}

/**
 * 权限校验请求体
 */
export class ValidatePermissionDto {
  @IsArray()
  @IsString({ each: true })
  permissions!: string[]
}

// ── Response DTOs ──

/**
 * 授权判定结果响应
 */
export class AuthorizationDecisionResponseDto {
  @IsIn(['allowed', 'denied'])
  status!: 'allowed' | 'denied'

  @IsString()
  action!: string

  @IsOptional()
  @IsString()
  tenantId?: string

  @IsOptional()
  @IsString()
  brandId?: string

  @IsOptional()
  @IsString()
  storeId?: string

  @IsBoolean()
  permissionMatched!: boolean

  @IsBoolean()
  tenantScopeMatched!: boolean
}

/**
 * 解析后的 Actor 上下文响应（去类型化，纯运行时校验）
 */
export class ResolvedActorContextResponseDto {
  @IsBoolean()
  authenticated!: boolean

  @IsOptional()
  @IsObject()
  actor?: Record<string, unknown>

  @IsOptional()
  @IsObject()
  tenantContext?: Record<string, unknown>

  @IsOptional()
  @IsString()
  effectiveTenantId?: string

  @IsOptional()
  @IsString()
  effectiveBrandId?: string

  @IsOptional()
  @IsString()
  effectiveStoreId?: string

  @IsOptional()
  @IsString()
  effectiveMarketCode?: string

  @IsArray()
  @IsString({ each: true })
  roles!: string[]

  @IsArray()
  @IsString({ each: true })
  permissions!: string[]
}

/**
 * 模块描述符响应
 */
export class IdentityAccessDescriptorResponseDto {
  @IsString()
  key!: string

  @IsString()
  name!: string

  @IsString()
  purpose!: string

  @IsArray()
  @IsString({ each: true })
  inboundContracts!: string[]

  @IsArray()
  @IsString({ each: true })
  outboundContracts!: string[]
}

/**
 * 认证状态检查响应
 */
export class AuthenticationStatusResponseDto {
  @IsBoolean()
  authenticated!: boolean

  @IsOptional()
  @IsString()
  actorId?: string

  @IsOptional()
  @IsString()
  actorType?: string

  @IsArray()
  @IsString({ each: true })
  roles!: string[]

  @IsArray()
  @IsString({ each: true })
  permissions!: string[]
}
