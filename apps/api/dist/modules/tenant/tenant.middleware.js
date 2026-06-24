"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TenantMiddleware = void 0;
const node_crypto_1 = require("node:crypto");
const common_1 = require("@nestjs/common");
const DEFAULT_ACTOR_TYPE = 'tenant-user';
function normalizeValue(value) {
    const normalized = value?.trim();
    return normalized ? normalized : undefined;
}
function parseListHeader(value) {
    return Array.from(new Set((value ?? '')
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean)));
}
function parseActorHeader(value) {
    const normalized = normalizeValue(value);
    if (!normalized) {
        return {};
    }
    if (normalized.startsWith('{')) {
        try {
            const parsed = JSON.parse(normalized);
            return {
                actorId: normalizeValue(parsed.actorId ?? parsed.id),
                actorType: parsed.actorType ?? parsed.type,
                actorName: normalizeValue(parsed.actorName ?? parsed.name),
                tenantId: normalizeValue(parsed.tenantId),
                brandId: normalizeValue(parsed.brandId),
                storeId: normalizeValue(parsed.storeId)
            };
        }
        catch {
            return {
                actorId: normalized
            };
        }
    }
    return {
        actorId: normalized
    };
}
function buildActorContext(req) {
    const actorFromHeader = parseActorHeader(req.header('x-actor'));
    const roles = parseListHeader(req.header('x-roles') ?? req.header('x-role'));
    const permissions = parseListHeader(req.header('x-permissions') ?? req.header('x-permission'));
    const actorId = normalizeValue(req.header('x-actor-id')) ?? actorFromHeader.actorId;
    if (!actorId && roles.length === 0 && permissions.length === 0) {
        return undefined;
    }
    return {
        actorId: actorId ?? 'header-actor',
        actorType: normalizeValue(req.header('x-actor-type')) ??
            actorFromHeader.actorType ??
            DEFAULT_ACTOR_TYPE,
        actorName: normalizeValue(req.header('x-actor-name')) ?? actorFromHeader.actorName,
        tenantId: normalizeValue(req.header('x-actor-tenant-id')) ?? actorFromHeader.tenantId,
        brandId: normalizeValue(req.header('x-actor-brand-id')) ?? actorFromHeader.brandId,
        storeId: normalizeValue(req.header('x-actor-store-id')) ?? actorFromHeader.storeId,
        roles,
        permissions,
        authenticated: Boolean(actorId),
        source: 'headers'
    };
}
let TenantMiddleware = class TenantMiddleware {
    use(req, _res, next) {
        req.tenantContext = {
            tenantId: normalizeValue(req.header('x-tenant-id')) ?? 'tenant-demo',
            brandId: normalizeValue(req.header('x-brand-id')),
            storeId: normalizeValue(req.header('x-store-id')),
            marketCode: normalizeValue(req.header('x-market-code')) ?? 'us-default'
        };
        req.actorContext = buildActorContext(req);
        req.governanceContext = {
            requestId: normalizeValue(req.header('x-request-id')) ?? (0, node_crypto_1.randomUUID)(),
            startedAt: Date.now()
        };
        next();
    }
};
exports.TenantMiddleware = TenantMiddleware;
exports.TenantMiddleware = TenantMiddleware = __decorate([
    (0, common_1.Injectable)()
], TenantMiddleware);
//# sourceMappingURL=tenant.middleware.js.map