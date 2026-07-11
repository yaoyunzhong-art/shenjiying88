import { Global, Module } from '@nestjs/common';
import { TenantController } from './tenant.controller';
import { TenantQuotaController } from './tenant-quota.controller';
import { TenantService } from './tenant.service';
import { TenantQuotaService } from './tenant-quota.service';
import { TenantLifecycleService } from './tenant-lifecycle.service';

@Global()
@Module({
  controllers: [TenantController, TenantQuotaController],
  providers: [TenantService, TenantQuotaService, TenantLifecycleService],
  exports: [TenantService, TenantQuotaService, TenantLifecycleService]
})
export class TenantModule {}
