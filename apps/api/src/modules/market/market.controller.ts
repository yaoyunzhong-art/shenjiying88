import { Controller, Get, Param } from '@nestjs/common';
import { TenantContext } from '../tenant/tenant.decorator';
import type { RequestTenantContext } from '../tenant/tenant.types';
import { MarketService } from './market.service';

@Controller('markets')
export class MarketController {
  constructor(private readonly marketService: MarketService) {}

  @Get('bootstrap')
  getBootstrap() {
    return this.marketService.getBootstrap();
  }

  @Get(':scopeType/:scopeCode')
  getScopedMarket(
    @Param('scopeType') scopeType: string,
    @Param('scopeCode') scopeCode: string,
    @TenantContext() tenantContext: RequestTenantContext
  ) {
    return {
      scopeType,
      scopeCode,
      marketProfile: this.marketService.getMergedProfile(tenantContext),
      overrides: this.marketService.getOverrides(tenantContext)
    };
  }

  @Get(':scopeType/:scopeCode/portal')
  getScopedPortalMarket(
    @Param('scopeType') scopeType: string,
    @Param('scopeCode') scopeCode: string,
    @TenantContext() tenantContext: RequestTenantContext
  ) {
    const marketProfile = this.marketService.getMergedProfile(tenantContext);

    return {
      scopeType,
      scopeCode,
      marketCode: marketProfile.marketCode,
      locale: marketProfile.locale,
      timezone: marketProfile.timezone,
      tax: marketProfile.tax,
      network: marketProfile.network,
      email: marketProfile.email,
      social: marketProfile.social
    };
  }
}
