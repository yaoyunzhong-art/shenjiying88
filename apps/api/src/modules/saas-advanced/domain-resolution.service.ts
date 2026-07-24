import { Injectable, Logger, OnModuleInit, Optional } from '@nestjs/common'
import { PrismaService } from '../../prisma/prisma.service'
import type { RequestTenantContext } from '../tenant/tenant.types'
import type { DomainMapping } from './custom-domain.entity'

interface DomainResolutionContext {
  tenantId: string
  brandId?: string
  storeId?: string
}

interface PrimaryDomainScope {
  scopeType: 'TENANT' | 'BRAND' | 'STORE'
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
  private readonly primaryDomainIndex = new Map<string, string>()

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
          scopeType: true,
          tenantId: true,
          brandId: true,
          storeId: true,
          isPrimary: true,
        },
      })

      for (const row of rows) {
        this.hostIndex.set(normalizeHost(row.domain), {
          tenantId: row.tenantId,
          brandId: row.brandId ?? undefined,
          storeId: row.storeId ?? undefined,
        })
        if (row.isPrimary) {
          this.primaryDomainIndex.set(
            this.buildScopeKey({
              scopeType: row.scopeType as PrimaryDomainScope['scopeType'],
              tenantId: row.tenantId,
              brandId: row.brandId ?? undefined,
              storeId: row.storeId ?? undefined,
            }),
            normalizeHost(row.domain),
          )
        }
      }
    } catch (error) {
      if (this.shouldUsePersistenceFallback(error)) {
        this.logger.log(`load custom domains skipped: ${this.describePersistenceFallback(error)}`)
        return
      }
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
    const scopeKey = this.buildScopeKey({
      scopeType: mapping.scopeType,
      tenantId: mapping.tenantId,
      brandId: mapping.brandId,
      storeId: mapping.storeId,
    })
    if (mapping.status === 'active' || mapping.status === 'active_ssl') {
      this.hostIndex.set(normalized, {
        tenantId: mapping.tenantId,
        brandId: mapping.brandId,
        storeId: mapping.storeId,
      })
      if (mapping.isPrimary) {
        this.primaryDomainIndex.set(scopeKey, normalized)
      } else if (this.primaryDomainIndex.get(scopeKey) === normalized) {
        this.primaryDomainIndex.delete(scopeKey)
      }
      return
    }
    this.hostIndex.delete(normalized)
    if (this.primaryDomainIndex.get(scopeKey) === normalized) {
      this.primaryDomainIndex.delete(scopeKey)
    }
  }

  removeHost(host: string): void {
    const normalized = normalizeHost(host)
    this.hostIndex.delete(normalized)
    for (const [scopeKey, domain] of this.primaryDomainIndex.entries()) {
      if (domain === normalized || normalizeHost(domain) === normalized) {
        this.primaryDomainIndex.delete(scopeKey)
      }
    }
  }

  countHosts(): number {
    return this.hostIndex.size
  }

  findPrimaryDomain(scope: PrimaryDomainScope): string | null {
    return this.primaryDomainIndex.get(this.buildScopeKey(scope)) ?? null
  }

  private canUsePersistence(): boolean {
    return Boolean(this.prisma) && process.env.NODE_ENV !== 'test'
  }

  private customDomains(): DomainResolutionDelegate {
    return (this.prisma as unknown as { customDomain: DomainResolutionDelegate }).customDomain
  }

  private shouldUsePersistenceFallback(error: unknown): boolean {
    const code =
      typeof error === 'object' && error && 'code' in error
        ? (error as { code?: unknown }).code
        : undefined
    return code === 'P2021' || code === 'P1010' || code === 'P1001'
  }

  private describePersistenceFallback(error: unknown): string {
    const code =
      typeof error === 'object' && error && 'code' in error
        ? (error as { code?: unknown }).code
        : undefined
    const message =
      typeof error === 'object' && error && 'message' in error
        ? (error as { message?: unknown }).message
        : undefined

    if (typeof message === 'string' && message.trim().length > 0) {
      const tableMessage = message.match(/The table `[^`]+` does not exist in the current database\./)?.[0]
      if (tableMessage) return tableMessage
      return message.replace(/\s+/g, ' ').trim()
    }
    if (typeof code === 'string' && code.length > 0) {
      return `Prisma persistence unavailable (${code})`
    }
    return 'Prisma persistence unavailable'
  }

  private buildScopeKey(scope: PrimaryDomainScope): string {
    return [
      scope.scopeType,
      scope.tenantId,
      scope.brandId ?? '',
      scope.storeId ?? '',
    ].join(':')
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
      scopeType: true
      tenantId: true
      brandId: true
      storeId: true
      isPrimary: true
    }
  }): Promise<Array<{
    domain: string
    scopeType: string
    tenantId: string
    brandId: string | null
    storeId: string | null
    isPrimary: boolean
  }>>
}
