import { Controller, Get } from '@nestjs/common';
import { TenantContext } from '../tenant/tenant.decorator';
import type { RequestTenantContext } from '../tenant/tenant.types';
import { toBootstrapFoundationMetadata } from './bootstrap.contract';

@Controller('bootstrap')
export class BootstrapController {
  @Get('metadata')
  getBootstrapMetadata(@TenantContext() tenantContext: RequestTenantContext) {
    return {
      tenantContext,
      foundationDependencies: toBootstrapFoundationMetadata(undefined).foundationDependencies,
      phase: 'scaffold'
    };
  }

  @Get('health')
  getHealth() {
    return {
      status: 'ok',
      uptime: process.uptime(),
      phase: 'scaffold'
    };
  }
}
