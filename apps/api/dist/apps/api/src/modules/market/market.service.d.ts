import { type MarketProfile, type RegionalConfigOverride } from '@m5/domain';
import type { MarketBootstrapResponse } from '@m5/types';
import { FoundationService } from '../foundation/foundation.service';
import type { RequestTenantContext } from '../tenant/tenant.types';
export declare class MarketService {
    private readonly foundationService;
    constructor(foundationService: FoundationService);
    private readonly marketProfiles;
    getBootstrap(): MarketBootstrapResponse;
    getByMarketCode(marketCode?: string): MarketProfile;
    getOverrides(context: RequestTenantContext): RegionalConfigOverride[];
    getMergedProfile(context: RequestTenantContext): MarketProfile;
}
//# sourceMappingURL=market.service.d.ts.map