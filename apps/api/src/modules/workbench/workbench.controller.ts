import { Body, Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common'
import {
  CurrentActor,
  RequirePermissions,
  RequireRoles,
  RequireTenantScope,
  type CurrentActorValue
} from '../foundation/identity-access/identity-access.decorator'
import { TenantContext } from '../tenant/tenant.decorator'
import type { RequestTenantContext } from '../tenant/tenant.types'
import { WorkbenchService } from './workbench.service'
import {
  CapabilityCheckDto,
  NavItemQueryDto,
  WorkbenchActionReplayDto,
  WorkbenchApprovalExecuteDto,
  WorkbenchHandlerCallbackDto,
  WorkbenchHandlerSyncDto,
  WorkbenchQueryDto,
  WorkbenchRuntimeReplaySubmitDto,
  WorkbenchSecretRotationDto
} from './workbench.dto'
import { TenantGuard } from '../agent/tenant.guard';

const WORKBENCH_READ_ROLES = [
  'SUPER_ADMIN',
  'TENANT_ADMIN',
  'BRAND_MANAGER',
  'STORE_MANAGER',
  'GUIDE',
  'CASHIER',
  'OPERATIONS',
  'SECURITY_ADMIN'
] as const

const WORKBENCH_READ_PERMISSION = 'workbench.read'
const WORKBENCH_RUNTIME_READ_PERMISSION = 'foundation.runtime-governance.read'
const WORKBENCH_RUNTIME_WRITE_PERMISSION = 'foundation.runtime-governance.write'
const WORKBENCH_ACTION_ROLES = ['SUPER_ADMIN', 'TENANT_ADMIN', 'OPERATIONS', 'SECURITY_ADMIN'] as const
const WORKBENCH_SECRET_ROTATION_ROLES = ['SUPER_ADMIN', 'SECURITY_ADMIN'] as const

@Controller('workbenches')
@UseGuards(TenantGuard)
export class WorkbenchController {
  constructor(private readonly workbenchService: WorkbenchService) {}

  /**
   * 获取工作台引导数据（含完整 bootstrap 载荷）
   */
  @Get('bootstrap')
  @RequireTenantScope()
  @RequireRoles(...WORKBENCH_READ_ROLES)
  @RequirePermissions(WORKBENCH_READ_PERMISSION)
  getBootstrap(@TenantContext() tenantContext: RequestTenantContext) {
    return this.workbenchService.getBootstrap(tenantContext)
  }

  /**
   * 查询角色工作台列表（可按角色、渠道、初始化状态筛选）
   */
  @Get()
  @RequireTenantScope()
  @RequireRoles(...WORKBENCH_READ_ROLES)
  @RequirePermissions(WORKBENCH_READ_PERMISSION)
  getWorkbenches(@Query() query: WorkbenchQueryDto) {
    const workbenches = this.workbenchService.getRoleWorkbenches()
    let result = workbenches

    if (query.role) {
      result = result.filter(w => w.role === query.role)
    }
    if (query.channel) {
      result = result.filter(w => w.channel === query.channel)
    }
    if (query.initialized !== undefined) {
      // initialized flag 只是一个过滤器示例：当 false 时返回空数组模拟未初始化
      if (!query.initialized) result = []
    }

    return { workbenches: result, total: result.length }
  }

  /**
   * 获取导航项（可按角色、渠道、市场、能力筛选）
   */
  @Get('nav-items')
  @RequireTenantScope()
  @RequireRoles(...WORKBENCH_READ_ROLES)
  @RequirePermissions(WORKBENCH_READ_PERMISSION)
  getNavItems(@Query() query: NavItemQueryDto) {
    const workbenches = this.workbenchService.getRoleWorkbenches()
    let navItems = workbenches.flatMap(w =>
      w.navItems.map(item => ({ ...item, role: w.role, channel: w.channel, marketCodes: w.marketCodes }))
    )

    if (query.role) {
      navItems = navItems.filter(n => n.role === query.role)
    }
    if (query.channel) {
      navItems = navItems.filter(n => n.channel === query.channel)
    }
    if (query.marketCode) {
      navItems = navItems.filter(n => n.marketCodes?.includes(query.marketCode!))
    }
    if (query.capability) {
      navItems = navItems.filter(n => this.workbenchService.checkCapability(n.role, query.capability!))
    }

    return { navItems, total: navItems.length }
  }

  /**
   * 检查角色是否拥有指定能力
   */
  @Get('capability-check')
  @RequireTenantScope()
  @RequireRoles(...WORKBENCH_READ_ROLES)
  @RequirePermissions(WORKBENCH_READ_PERMISSION)
  checkCapability(@Query() query: CapabilityCheckDto) {
    const has = this.workbenchService.checkCapability(query.role, query.capability)
    return { role: query.role, capability: query.capability, has }
  }

  @Post('approvals/execute')
  @RequireTenantScope()
  @RequireRoles(...WORKBENCH_ACTION_ROLES)
  @RequirePermissions(WORKBENCH_RUNTIME_WRITE_PERMISSION)
  executeApproval(
    @Body() body: WorkbenchApprovalExecuteDto,
    @TenantContext() tenantContext: RequestTenantContext | undefined,
    @CurrentActor() actorContext: CurrentActorValue
  ) {
    return this.workbenchService.submitApprovalExecution(body, tenantContext, actorContext)
  }

  @Post('secrets/rotate')
  @RequireTenantScope()
  @RequireRoles(...WORKBENCH_SECRET_ROTATION_ROLES)
  @RequirePermissions(WORKBENCH_RUNTIME_WRITE_PERMISSION)
  rotateSecret(
    @Body() body: WorkbenchSecretRotationDto,
    @TenantContext() tenantContext: RequestTenantContext | undefined,
    @CurrentActor() actorContext: CurrentActorValue
  ) {
    return this.workbenchService.submitSecretRotation(body, tenantContext, actorContext)
  }

  @Post('actions/runtime-replay')
  @RequireTenantScope()
  @RequireRoles(...WORKBENCH_ACTION_ROLES)
  @RequirePermissions(WORKBENCH_RUNTIME_WRITE_PERMISSION)
  submitRuntimeReplay(
    @Body() body: WorkbenchRuntimeReplaySubmitDto,
    @TenantContext() tenantContext: RequestTenantContext | undefined,
    @CurrentActor() actorContext: CurrentActorValue
  ) {
    return this.workbenchService.submitRuntimeReplay(body, tenantContext, actorContext)
  }

  @Get('actions/:receiptCode')
  @RequireTenantScope()
  @RequireRoles(...WORKBENCH_ACTION_ROLES)
  @RequirePermissions(WORKBENCH_RUNTIME_READ_PERMISSION)
  getActionReceipt(@Param('receiptCode') receiptCode: string) {
    return this.workbenchService.getActionReceipt(receiptCode)
  }

  @Post('handlers/:handlerName/receipts/:receiptCode/sync')
  @RequireTenantScope()
  @RequireRoles(...WORKBENCH_ACTION_ROLES)
  @RequirePermissions(WORKBENCH_RUNTIME_WRITE_PERMISSION)
  syncHandlerReceipt(
    @Param('receiptCode') receiptCode: string,
    @Param('handlerName') handlerName: string,
    @Body() body: WorkbenchHandlerSyncDto,
    @TenantContext() tenantContext: RequestTenantContext | undefined,
    @CurrentActor() actorContext: CurrentActorValue
  ) {
    return this.workbenchService.syncHandlerReceipt(receiptCode, handlerName, body, tenantContext, actorContext)
  }

  @Post('handlers/:handlerName/receipts/:receiptCode/callback')
  @RequireTenantScope()
  @RequireRoles(...WORKBENCH_ACTION_ROLES)
  @RequirePermissions(WORKBENCH_RUNTIME_WRITE_PERMISSION)
  recordHandlerCallback(
    @Param('receiptCode') receiptCode: string,
    @Param('handlerName') handlerName: string,
    @Body() body: WorkbenchHandlerCallbackDto,
    @TenantContext() tenantContext: RequestTenantContext | undefined,
    @CurrentActor() actorContext: CurrentActorValue
  ) {
    return this.workbenchService.recordHandlerCallback(receiptCode, handlerName, body, tenantContext, actorContext)
  }

  @Post('actions/:receiptCode/replay')
  @RequireTenantScope()
  @RequireRoles(...WORKBENCH_ACTION_ROLES)
  @RequirePermissions(WORKBENCH_RUNTIME_WRITE_PERMISSION)
  replayActionReceipt(
    @Param('receiptCode') receiptCode: string,
    @Body() body: WorkbenchActionReplayDto,
    @TenantContext() tenantContext: RequestTenantContext | undefined,
    @CurrentActor() actorContext: CurrentActorValue
  ) {
    return this.workbenchService.replayActionReceipt(receiptCode, body, tenantContext, actorContext)
  }
}
