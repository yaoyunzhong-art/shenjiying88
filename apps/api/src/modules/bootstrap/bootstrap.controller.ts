import { Controller, Get, Post, Param, Body } from '@nestjs/common';
import { TenantContext } from '../tenant/tenant.decorator';
import type { RequestTenantContext } from '../tenant/tenant.types';
import { BootstrapService } from './bootstrap.service';

@Controller('bootstrap')
export class BootstrapController {
  constructor(private readonly svc: BootstrapService) {}

  @Get('health')
  getHealth() {
    return this.svc.getHealth();
  }

  @Get('metadata')
  getBootstrapMetadata(@TenantContext() tenantContext: RequestTenantContext) {
    return this.svc.getBootstrapMetadata(tenantContext);
  }

  @Get('modules')
  getModules() {
    return this.svc.getModuleStatuses();
  }

  @Get('modules/:module')
  getModule(@Param('module') module: string) {
    return this.svc.getModuleStatus(module);
  }

  @Post('modules/register')
  registerModule(@Body() body: { module: string; status?: string; details?: string }) {
    this.svc.registerModule(body.module, (body.status as 'ready' | 'pending' | 'error') ?? 'ready', body.details);
    return { ok: true };
  }

  @Post('mark-running')
  markRunning() {
    this.svc.markRunning();
    return { ok: true };
  }

  @Get('summary')
  getSummary() {
    return this.svc.getSummary();
  }
}
