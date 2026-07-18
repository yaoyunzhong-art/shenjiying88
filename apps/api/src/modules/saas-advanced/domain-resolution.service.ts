import { Injectable, Logger, OnModuleInit, Optional } from '@nestjs/common'
import { PrismaService } from '../../prisma/prisma.service'
import type { RequestTenantContext } from '../tenant/tenant.types'
import type { DomainMapping } from './custom-domain.entity'

interface DomainResolutionContext {
  tenantId: string
  brandId?: string
  storeId?: string
}

function normalizeHost(host: string): string {
  return host.toLowerCase().trim().split(',')[0].split(':')[0]
}

@Injectable()
export class DomainResolutionService implements OnModuleInit {
  private readonly logger = new Logger(DomainResolutionService.name)
  private readonly hostIndex = new Map<string, DomainResolutionContext>()

  constructor(@Optional() private readonly prisma?: PrismaService) {}

  async onModuleInit(): Promise<void> {
    if (!this.canUsePersistence()) return
    try {
      const rows = await this.customDomains().findMany({
        where: {
          status: {
            in: ['ACTIVE', 'ACTIVE_SSL'],
          },
        },
        select: {
          domain: true,
          tenantId: true,
          brandId: true,
          storeId: true,
        },
      })

      for (const row of rows) {
        this.hostIndex.set(row.domain, {
          tenantId: row.tenantId,
          brandId: row.brandId ?? undefined,
          storeId: row.storeId ?? undefined,
        })
      }
    } catch (error) {
      this.logger.warn(`load custom domains skipped: ${(error as Error).message}`)
    }
  }

  resolveHost(host: string): RequestTenantContext | null {
    const normalized = normalizeHost(host)
    const resolved = this.hostIndex.get(normalized)
    if (!resolved) return null
    return {
      tenantId: resolved.tenantId,
      brandId: resolved.brandId,
      storeId: resolved.storeId,
    }
  }

  upsertFromMapping(mapping: DomainMapping): void {
    const normalized = normalizeHost(mapping.domain)
    if (mapping.status === 'active' || mapping.status === 'active_ssl') {
      this.hostIndex.set(normalized, {
        tenantId: mapping.tenantId,
        brandId: mapping.brandId,
        storeId: mapping.storeId,
      })
      return
    }
    this.hostIndex.delete(normalized)
  }

  removeHost(host: string): void {
    this.hostIndex.delete(normalizeHost(host))
  }

  countHosts(): number {
    return this.hostIndex.size
  }

  private canUsePersistence(): boolean {
    return Boolean(this.prisma) && process.env.NODE_ENV !== 'test'
  }

  private customDomains(): DomainResolutionDelegate {
    return (this.prisma as unknown as { customDomain: DomainResolutionDelegate }).customDomain
  }
}

type DomainResolutionDelegate = {
  findMany(args: {
    where: {
      status: {
        in: string[]
      }
    }
    select: {
      domain: true
      tenantId: true
      brandId: true
      storeId: true
    }
  }): Promise<Array<{
    domain: string
    tenantId: string
    brandId: string | null
    storeId: string | null
  }>>
}
