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
exports.LytConnectionManager = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
let LytConnectionManager = class LytConnectionManager {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    fallbackCapabilities = ['member', 'payment', 'order', 'device', 'gate'];
    configuredDefaultCapabilities = ['member', 'payment', 'order'];
    async listScopedStores(tenantContext) {
        return this.prisma.store.findMany({
            where: {
                ...(tenantContext?.tenantId ? { tenantId: tenantContext.tenantId } : {}),
                ...(tenantContext?.brandId ? { brandId: tenantContext.brandId } : {})
            },
            select: {
                id: true,
                tenantId: true,
                brandId: true,
                code: true,
                name: true
            },
            orderBy: [{ tenantId: 'asc' }, { brandId: 'asc' }, { code: 'asc' }]
        });
    }
    createResolutionChain(storeId, brandId, tenantId) {
        return [
            `store:${storeId}`,
            ...(brandId ? [`brand:${brandId}`] : []),
            `tenant:${tenantId}`
        ];
    }
    computeHealthStatus(updatedAt) {
        if (!updatedAt) {
            return 'pending-configuration';
        }
        const diffMs = Date.now() - updatedAt.getTime();
        const staleThresholdMs = 7 * 24 * 60 * 60 * 1000;
        return diffMs > staleThresholdMs ? 'stale' : 'healthy';
    }
    async findConnectionByResolution(tenantId, resolutionKey) {
        return this.prisma.lytConnection.findFirst({
            where: {
                tenantId,
                storeId: resolutionKey
            },
            orderBy: {
                updatedAt: 'desc'
            }
        });
    }
    async getConnectionForStore(storeId, tenantContext) {
        const store = await this.prisma.store.findFirst({
            where: {
                id: storeId,
                ...(tenantContext?.tenantId ? { tenantId: tenantContext.tenantId } : {}),
                ...(tenantContext?.brandId ? { brandId: tenantContext.brandId } : {})
            },
            select: {
                id: true,
                tenantId: true,
                brandId: true
            }
        });
        const resolvedTenantId = store?.tenantId ?? tenantContext?.tenantId ?? 'tenant-demo';
        const resolvedBrandId = store?.brandId ?? tenantContext?.brandId;
        const resolutionChain = this.createResolutionChain(storeId, resolvedBrandId, resolvedTenantId);
        const resolutionCandidates = [
            { level: 'store', key: storeId },
            ...(resolvedBrandId ? [{ level: 'brand', key: `brand:${resolvedBrandId}` }] : []),
            { level: 'tenant', key: `tenant:${resolvedTenantId}` }
        ];
        for (const candidate of resolutionCandidates) {
            const connection = await this.findConnectionByResolution(resolvedTenantId, candidate.key);
            if (!connection) {
                continue;
            }
            return {
                vendor: connection.vendor ?? 'lyt',
                tenantId: resolvedTenantId,
                brandId: resolvedBrandId,
                storeId,
                vendorTenantId: connection.vendorTenantId ?? resolvedTenantId,
                vendorBrandId: connection.vendorBrandId ?? resolvedBrandId,
                vendorStoreId: connection.vendorStoreId ?? storeId,
                endpoint: connection.endpoint,
                authMode: connection.authMode,
                hasCredential: Boolean(connection.credential || connection.credentialRef),
                credentialRef: connection.credentialRef ?? undefined,
                capabilities: connection.capabilities && connection.capabilities.length > 0
                    ? [...connection.capabilities]
                    : [...this.configuredDefaultCapabilities],
                connectionStatus: 'configured',
                source: 'prisma',
                resolutionLevel: candidate.level,
                resolutionKey: candidate.key,
                resolutionChain,
                healthStatus: this.computeHealthStatus(connection.updatedAt),
                lastCheckedAt: new Date().toISOString(),
                updatedAt: connection.updatedAt.toISOString()
            };
        }
        return {
            vendor: 'lyt',
            tenantId: resolvedTenantId,
            brandId: resolvedBrandId,
            storeId,
            vendorTenantId: resolvedTenantId,
            vendorBrandId: resolvedBrandId,
            vendorStoreId: storeId,
            endpoint: `mock://lyt/${resolvedTenantId}/${storeId}`,
            authMode: 'mock-token',
            hasCredential: false,
            capabilities: [...this.fallbackCapabilities],
            connectionStatus: 'pending-configuration',
            source: 'fallback',
            resolutionLevel: 'fallback',
            resolutionKey: `mock:${resolvedTenantId}:${storeId}`,
            resolutionChain,
            healthStatus: 'pending-configuration',
            lastCheckedAt: new Date().toISOString()
        };
    }
};
exports.LytConnectionManager = LytConnectionManager;
exports.LytConnectionManager = LytConnectionManager = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], LytConnectionManager);
//# sourceMappingURL=lyt-connection.manager.js.map