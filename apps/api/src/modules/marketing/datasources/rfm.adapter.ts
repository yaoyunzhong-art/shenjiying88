import { Injectable } from '@nestjs/common'
import type { TenantId, RFMProfile, RFMSegmentType } from '../marketing.entity'

/**
 * In-memory member record that RFM calculations reference.
 * Simplified; in production it comes from the member module.
 */
export interface MemberRecord {
  id: string
  tenantId: TenantId
  name: string
  joinedAt: string
}

/**
 * In-memory order record that RFM calculations reference.
 * Simplified; in production it comes from the transactions module.
 */
export interface OrderRecord {
  id: string
  memberId: string
  tenantId: TenantId
  status: 'COMPLETED' | 'CANCELLED' | 'PENDING'
  totalCents: number
  createdAt: string
}

/**
 * Phase-42 T172: RFMAdapter
 * RFM 分群持久化 (in-memory, 反模式 v4 ab-test-bias-pattern 自检)
 */
@Injectable()
export class RFMAdapter {
  private profiles = new Map<string, RFMProfile>()

  seed(profiles: RFMProfile[]): void {
    for (const p of profiles) {
      this.profiles.set(p.id, { ...p })
    }
  }

  save(profile: RFMProfile): RFMProfile {
    this.profiles.set(profile.id, { ...profile })
    return profile
  }

  query(tenantId: TenantId, profileId: string): RFMProfile | null {
    const p = this.profiles.get(profileId)
    if (!p || p.tenantId !== tenantId) return null
    return { ...p }
  }

  queryByMember(tenantId: TenantId, memberId: string): RFMProfile | null {
    for (const p of this.profiles.values()) {
      if (p.tenantId === tenantId && p.memberId === memberId) return { ...p }
    }
    return null
  }

  queryBySegment(tenantId: TenantId, segment: RFMSegmentType): RFMProfile[] {
    return Array.from(this.profiles.values())
      .filter(p => p.tenantId === tenantId && p.segment === segment)
      .map(p => ({ ...p }))
  }

  queryByTenant(tenantId: TenantId): RFMProfile[] {
    return Array.from(this.profiles.values())
      .filter(p => p.tenantId === tenantId)
      .map(p => ({ ...p }))
  }

  count(tenantId: TenantId): number {
    let n = 0
    for (const p of this.profiles.values()) {
      if (p.tenantId === tenantId) n++
    }
    return n
  }

  reset(): void {
    this.profiles.clear()
  }
}
