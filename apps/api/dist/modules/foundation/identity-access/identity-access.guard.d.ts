import { CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { IdentityAccessService } from './identity-access.service';
export declare class IdentityAccessGuard implements CanActivate {
    private readonly reflector;
    private readonly identityAccessService;
    constructor(reflector: Reflector, identityAccessService: IdentityAccessService);
    private resolveScopeRequirement;
    canActivate(context: ExecutionContext): boolean;
}
//# sourceMappingURL=identity-access.guard.d.ts.map