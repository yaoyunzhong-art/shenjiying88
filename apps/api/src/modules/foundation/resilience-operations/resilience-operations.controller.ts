import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common'
import { RequirePermissions, RequireRoles, RequireTenantScope } from '../identity-access/identity-access.decorator'
import {
  ObservabilityQueryDto,
  RecoveryPlanQueryDto,
  RetryPolicyQueryDto,
  StageEdgeReplayDto
} from './resilience-operations.dto'
import { ResilienceOperationsService } from './resilience-operations.service'

@Controller('foundation/resilience-operations')
@RequireTenantScope()
export class ResilienceOperationsController {
  constructor(private readonly resilienceOperationsService: ResilienceOperationsService) {}

  @Get('management-metadata')
  @RequireRoles('SUPER_ADMIN', 'TENANT_ADMIN', 'OPERATIONS', 'SECURITY_ADMIN')
  @RequirePermissions('foundation.governance.read')
  getManagementMetadata(): unknown {
    return this.resilienceOperationsService.getManagementMetadata()
  }

  @Get('overview')
  @RequireRoles('SUPER_ADMIN', 'TENANT_ADMIN', 'OPERATIONS', 'SECURITY_ADMIN')
  @RequirePermissions('foundation.governance.read')
  getOperationsOverview(): unknown {
    return this.resilienceOperationsService.getOperationsOverview()
  }

  @Get('observability')
  @RequireRoles('SUPER_ADMIN', 'TENANT_ADMIN', 'OPERATIONS', 'SECURITY_ADMIN')
  @RequirePermissions('foundation.governance.read')
  getObservabilitySignals(@Query() query: ObservabilityQueryDto): unknown {
    return this.resilienceOperationsService.getObservabilitySignals(query)
  }

  @Get('retry-policies')
  @RequireRoles('SUPER_ADMIN', 'TENANT_ADMIN', 'OPERATIONS', 'SECURITY_ADMIN')
  @RequirePermissions('foundation.governance.read')
  getRetryPolicies(@Query() query: RetryPolicyQueryDto): unknown {
    return this.resilienceOperationsService.listRetryPolicies(query)
  }

  @Get('recovery-plans')
  @RequireRoles('SUPER_ADMIN', 'TENANT_ADMIN', 'OPERATIONS', 'SECURITY_ADMIN')
  @RequirePermissions('foundation.governance.read')
  getRecoveryPlans(@Query() query: RecoveryPlanQueryDto): unknown {
    return this.resilienceOperationsService.listRecoveryPlans(query)
  }

  @Get('recovery-plans/:resource')
  @RequireRoles('SUPER_ADMIN', 'TENANT_ADMIN', 'OPERATIONS', 'SECURITY_ADMIN')
  @RequirePermissions('foundation.governance.read')
  getRecoveryPlan(@Param('resource') resource: string): unknown {
    return this.resilienceOperationsService.describeRecoveryPlan(resource)
  }

  @Post('edge-replay/stage')
  @RequireRoles('SUPER_ADMIN', 'TENANT_ADMIN', 'OPERATIONS')
  @RequirePermissions('foundation.operations.recovery.write')
  stageEdgeReplay(@Body() body: StageEdgeReplayDto): unknown {
    return this.resilienceOperationsService.stageEdgeReplay(body.storeId, body.operationCount)
  }
}
