import type { RequestTenantContext } from '../tenant/tenant.types';
import { MarketService } from './market.service';
export declare class MarketController {
    private readonly marketService;
    constructor(marketService: MarketService);
    getBootstrap(): import("@m5/types").MarketBootstrapResponse;
    getScopedMarket(scopeType: string, scopeCode: string, tenantContext: RequestTenantContext): {
        scopeType: string;
        scopeCode: string;
        marketProfile: import("@m5/domain").MarketProfile;
        overrides: import("@m5/domain").RegionalConfigOverride[];
    };
    getScopedPortalMarket(scopeType: string, scopeCode: string, tenantContext: RequestTenantContext): {
        scopeType: string;
        scopeCode: string;
        marketCode: string;
        locale: import("@m5/domain").LocalePolicy;
        timezone: import("@m5/domain").TimezonePolicy;
        tax: import("@m5/domain").TaxPolicy;
        network: import("@m5/domain").NetworkPolicy;
        email: import("@m5/domain").EmailPolicy;
        social: import("@m5/domain").SocialPolicy;
    };
}
//# sourceMappingURL=market.controller.d.ts.map