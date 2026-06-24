import { Injectable } from '@nestjs/common'
import { PrismaService } from '../../prisma/prisma.service'
import type { RequestTenantContext } from '../tenant/tenant.types'
import type { LytResolvedConnection } from './lyt.entity'

@Injectable()
export class LytConnectionManager {
  constructor(private readonly prisma: PrismaService) {}

  private readonly fallbackCapabilities = ['member', 'payment', 'order', 'device', 'gate']

  private readonly configuredDefaultCapabilities = ['member', 'payment', 'order']

  async listScopedStores(tenantContext?: Pick<RequestTenantContext, 'tenantId' | 'brandId'>) {
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
    })
  }

  private createResolutionChain(storeId: string, brandId: string | undefined, tenantId: string) {
    return [
      `store:${storeId}`,
      ...(brandId ? [`brand:${brandId}`] : []),
      `tenant:${tenantId}`
    ]
  }

  private computeHealthStatus(updatedAt?: Date): LytResolvedConnection['healthStatus'] {
    if (!updatedAt) {
      return 'pending-configuration'
    }

    const diffMs = Date.now() - updatedAt.getTime()
    const staleThresholdMs = 7 * 24 * 60 * 60 * 1000
    return diffMs > staleThresholdMs ? 'stale' : 'healthy'
  }

  private async findConnectionByResolution(
    tenantId: string,
    resolutionKey: string
  ): Promise<{
    vendor?: string
    vendorTenantId?: string | null
    vendorBrandId?: string | null
    vendorStoreId?: string | null
    endpoint: string
    authMode: string
    credential: string | null
    credentialRef?: string | null
    capabilities?: string[] | null
    updatedAt: Date
  } | null> {
    return this.prisma.lytConnection.findFirst({
      where: {
        tenantId,
        storeId: resolutionKey
      },
      orderBy: {
        updatedAt: 'desc'
      }
    }) as Promise<{
      vendor?: string
      vendorTenantId?: string | null
      vendorBrandId?: string | null
      vendorStoreId?: string | null
      endpoint: string
      authMode: string
      credential: string | null
      credentialRef?: string | null
      capabilities?: string[] | null
      updatedAt: Date
    } | null>
  }

  async getConnectionForStore(
    storeId: string,
    tenantContext?: Pick<RequestTenantContext, 'tenantId' | 'brandId'>
  ): Promise<LytResolvedConnection> {
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
    })

    const resolvedTenantId = store?.tenantId ?? tenantContext?.tenantId ?? 'tenant-demo'
    const resolvedBrandId = store?.brandId ?? tenantContext?.brandId
    const resolutionChain = this.createResolutionChain(storeId, resolvedBrandId, resolvedTenantId)
    const resolutionCandidates: Array<{
      level: NonNullable<LytResolvedConnection['resolutionLevel']>
      key: string
    }> = [
      { level: 'store', key: storeId },
      ...(resolvedBrandId ? [{ level: 'brand' as const, key: `brand:${resolvedBrandId}` }] : []),
      { level: 'tenant', key: `tenant:${resolvedTenantId}` }
    ]

    for (const candidate of resolutionCandidates) {
      const connection = await this.findConnectionByResolution(resolvedTenantId, candidate.key)
      if (!connection) {
        continue
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
        capabilities:
          connection.capabilities && connection.capabilities.length > 0
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
      }
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
    }
  }
}
