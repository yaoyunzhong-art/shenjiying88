import type { Response } from 'express';
import { TrustGovernanceService } from '../../modules/foundation/trust-governance/trust-governance.service';
import type { RequestGovernanceContext, RequestRateLimitDecision, TenantAwareRequest } from '../../modules/tenant/tenant.types';
import type { RateLimitMetadata } from './request-governance.decorator';
type AppliedRateLimitDecision = RequestRateLimitDecision & {
    applied: true;
    scopeKey: string;
    allowed: boolean;
    limit: number;
    remaining: number;
    retryAfterSeconds: number;
    state: Record<string, unknown>;
};
export declare class RequestGovernanceService {
    private readonly trustGovernanceService;
    constructor(trustGovernanceService: TrustGovernanceService);
    ensureRequestContext(req: TenantAwareRequest): RequestGovernanceContext;
    evaluateRateLimit(req: TenantAwareRequest, metadata: RateLimitMetadata): Promise<AppliedRateLimitDecision>;
    applyRateLimitHeaders(res: Response, decision: AppliedRateLimitDecision): void;
    recordRequestSuccess(req: TenantAwareRequest, res: Response): void;
    recordRequestFailure(req: TenantAwareRequest, statusCode: number, message: string, errorName?: string): void;
    private recordAudit;
    private resolvePath;
    private resolveIp;
    private resolveScopeValue;
}
export {};
//# sourceMappingURL=request-governance.service.d.ts.map