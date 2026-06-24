import type { RequestTenantContext } from '../tenant/tenant.types';
import { type CurrentActorValue } from '../foundation/identity-access/identity-access.decorator';
import { HealthQueryDto } from './health.dto';
import { HealthService } from './health.service';
export declare class HealthController {
    private readonly healthService;
    constructor(healthService: HealthService);
    getHealth(): Promise<{
        alive: boolean;
        timestamp: string;
    }>;
    getPing(): Promise<{
        alive: boolean;
        timestamp: string;
    }>;
    getReadiness(tenantContext: RequestTenantContext | undefined, actorContext: CurrentActorValue, query: HealthQueryDto): Promise<import("./health.entity").HealthCheckResult>;
}
//# sourceMappingURL=health.controller.d.ts.map