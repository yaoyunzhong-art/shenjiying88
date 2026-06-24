"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RequestGovernanceService = void 0;
const node_crypto_1 = require("node:crypto");
const common_1 = require("@nestjs/common");
const trust_governance_service_1 = require("../../modules/foundation/trust-governance/trust-governance.service");
let RequestGovernanceService = class RequestGovernanceService {
    trustGovernanceService;
    constructor(trustGovernanceService) {
        this.trustGovernanceService = trustGovernanceService;
    }
    ensureRequestContext(req) {
        if (req.governanceContext?.requestId) {
            return req.governanceContext;
        }
        req.governanceContext = {
            requestId: req.header('x-request-id')?.trim() || (0, node_crypto_1.randomUUID)(),
            startedAt: Date.now()
        };
        return req.governanceContext;
    }
    async evaluateRateLimit(req, metadata) {
        const context = this.ensureRequestContext(req);
        const scopeBy = metadata.scopeBy?.length
            ? metadata.scopeBy
            : ['route', 'tenant', 'actor', 'ip'];
        const path = this.resolvePath(req);
        const routeKey = `${req.method}:${path}`;
        const scopeEntries = scopeBy
            .map((scope) => this.resolveScopeValue(scope, req, routeKey))
            .filter((value) => Boolean(value));
        const scopeKey = [metadata.prefix ?? 'http', ...scopeEntries].join('|');
        const decision = await this.trustGovernanceService.evaluateRateLimit({
            scopeKey,
            limit: metadata.limit,
            windowSeconds: metadata.windowSeconds,
            blockSeconds: metadata.blockSeconds
        });
        const appliedDecision = {
            applied: true,
            scopeKey: decision.scopeKey,
            allowed: decision.allowed,
            limit: decision.limit,
            remaining: decision.remaining,
            retryAfterSeconds: decision.retryAfterSeconds,
            state: decision.state
        };
        context.rateLimit = appliedDecision;
        return appliedDecision;
    }
    applyRateLimitHeaders(res, decision) {
        res.setHeader('X-RateLimit-Limit', String(decision.limit));
        res.setHeader('X-RateLimit-Remaining', String(Math.max(decision.remaining, 0)));
        res.setHeader('X-RateLimit-Scope', decision.scopeKey);
        if (decision.retryAfterSeconds > 0) {
            res.setHeader('Retry-After', String(decision.retryAfterSeconds));
        }
    }
    recordRequestSuccess(req, res) {
        this.recordAudit(req, res.statusCode, 'http.request.completed');
    }
    recordRequestFailure(req, statusCode, message, errorName = 'UnhandledException') {
        const eventType = statusCode === 429
            ? 'http.request.rate-limited'
            : statusCode === 401 || statusCode === 403
                ? 'http.request.denied'
                : 'http.request.failed';
        this.recordAudit(req, statusCode, eventType, {
            errorName,
            errorMessage: message
        });
    }
    recordAudit(req, statusCode, eventType, extraDetails = {}) {
        const context = this.ensureRequestContext(req);
        const durationMs = Math.max(Date.now() - context.startedAt, 0);
        this.trustGovernanceService.recordAudit(eventType, {
            requestId: context.requestId,
            method: req.method,
            path: this.resolvePath(req),
            originalUrl: req.originalUrl ?? req.url,
            statusCode,
            durationMs,
            ip: this.resolveIp(req),
            userAgent: req.header('user-agent') ?? undefined,
            tenantContext: req.tenantContext,
            actorId: req.actorContext?.actorId,
            actorType: req.actorContext?.actorType,
            rateLimit: context.rateLimit,
            ...extraDetails
        }, {
            tenantId: req.tenantContext?.tenantId,
            actorId: req.actorContext?.actorId,
            source: 'http',
            riskLevel: statusCode >= 500 ? 'high' : statusCode >= 400 ? 'medium' : 'low'
        });
    }
    resolvePath(req) {
        if (req.route?.path) {
            return `${req.baseUrl ?? ''}${req.route.path}`;
        }
        return (req.originalUrl ?? req.url).split('?')[0];
    }
    resolveIp(req) {
        const forwarded = req.header('x-forwarded-for')?.split(',')[0]?.trim();
        return forwarded || req.ip || req.socket?.remoteAddress || undefined;
    }
    resolveScopeValue(scope, req, routeKey) {
        switch (scope) {
            case 'tenant':
                return `tenant:${req.tenantContext?.tenantId ?? 'public'}`;
            case 'actor':
                return `actor:${req.actorContext?.actorId ?? 'anonymous'}`;
            case 'ip':
                return `ip:${this.resolveIp(req) ?? 'unknown'}`;
            case 'route':
                return `route:${routeKey}`;
            default:
                return undefined;
        }
    }
};
exports.RequestGovernanceService = RequestGovernanceService;
exports.RequestGovernanceService = RequestGovernanceService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [trust_governance_service_1.TrustGovernanceService])
], RequestGovernanceService);
//# sourceMappingURL=request-governance.service.js.map