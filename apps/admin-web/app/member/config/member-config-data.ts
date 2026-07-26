export interface MemberConfig {
  points: {
    earnRate: number
    redeemRate: number
    enabled: boolean
    expiryDays: number
  }
  levels: {
    thresholds: {
      BRONZE: number
      SILVER: number
      GOLD: number
      PLATINUM: number
      DIAMOND: number
    }
  }
  lifecycle: {
    dormantDays: number
    churnedDays: number
  }
  phoneUniqueScope: 'global' | 'tenant'
  crossTenantEnabled: boolean
}

export interface MemberConfigSnapshotDelivery {
  deliveryMode: 'mock'
  config: MemberConfig
  generatedAt: string
}

export const DEFAULT_MEMBER_CONFIG: MemberConfig = {
  points: { earnRate: 1, redeemRate: 100, enabled: true, expiryDays: 365 },
  levels: {
    thresholds: {
      BRONZE: 0,
      SILVER: 100000,
      GOLD: 500000,
      PLATINUM: 2000000,
      DIAMOND: 5000000,
    },
  },
  lifecycle: { dormantDays: 90, churnedDays: 365 },
  phoneUniqueScope: 'global',
  crossTenantEnabled: false,
}

export async function loadMemberConfigSnapshot(): Promise<MemberConfigSnapshotDelivery> {
  return {
    deliveryMode: 'mock',
    config: DEFAULT_MEMBER_CONFIG,
    generatedAt: new Date().toISOString(),
  }
}
