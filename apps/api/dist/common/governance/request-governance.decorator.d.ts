export interface RateLimitMetadata {
    limit: number;
    windowSeconds: number;
    blockSeconds?: number;
    prefix?: string;
    scopeBy?: Array<'tenant' | 'actor' | 'ip' | 'route'>;
}
export declare const RATE_LIMIT_METADATA_KEY = "trust-governance:rate-limit";
export declare const RequireRateLimit: (metadata: RateLimitMetadata) => import("@nestjs/common").CustomDecorator<string>;
//# sourceMappingURL=request-governance.decorator.d.ts.map