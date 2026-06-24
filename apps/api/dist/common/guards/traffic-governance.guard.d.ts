import { CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RequestGovernanceService } from '../governance/request-governance.service';
export declare class TrafficGovernanceGuard implements CanActivate {
    private readonly reflector;
    private readonly requestGovernanceService;
    constructor(reflector: Reflector, requestGovernanceService: RequestGovernanceService);
    canActivate(context: ExecutionContext): Promise<boolean>;
}
//# sourceMappingURL=traffic-governance.guard.d.ts.map