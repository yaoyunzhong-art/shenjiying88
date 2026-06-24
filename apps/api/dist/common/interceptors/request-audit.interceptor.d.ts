import { CallHandler, ExecutionContext, NestInterceptor } from '@nestjs/common';
import { Observable } from 'rxjs';
import { RequestGovernanceService } from '../governance/request-governance.service';
export declare class RequestAuditInterceptor implements NestInterceptor {
    private readonly requestGovernanceService;
    constructor(requestGovernanceService: RequestGovernanceService);
    intercept(context: ExecutionContext, next: CallHandler): Observable<unknown>;
}
//# sourceMappingURL=request-audit.interceptor.d.ts.map