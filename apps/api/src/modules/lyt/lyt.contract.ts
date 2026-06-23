import type { LytMemberProfile } from '@m5/domain'

/**
 * Standardized contracts for LYT module data exposed via API.
 * These mappers normalise internal types to stable, consumer-facing shapes.
 */

export interface LytDeviceStatusContract {
  deviceId: string
  status: 'ONLINE' | 'OFFLINE'
}

export interface LytMemberProfileContract {
  id: string
  name: string
  level: string
}

export interface LytBootstrapContract {
  adapter: string
  foundationDependencies: string[]
  foundationContracts: string[]
  availableAdapters?: Array<{
    adapterName: string
    adapterMode: 'mock' | 'sandbox' | 'real'
  }>
  selectionStrategy?: string
}

export interface LytStandardizedWebhookEventContract {
  aggregateId: string
  sourceEventName: string
  standardizedEventName: string
  capability: 'member' | 'payment' | 'order' | 'device' | 'gate' | 'coin' | 'coupon' | 'unknown'
  tenantId?: string
  brandId?: string
  storeId?: string
  idempotencyKey: string
  payload: Record<string, unknown>
}

export interface LytWebhookDrillContract {
  mode: 'dry-run' | 'published'
  standardizedEvent: LytStandardizedWebhookEventContract
  archiveRecord: LytWebhookArchiveRecordContract
  standardizedEnvelope:
    | {
        aggregateId?: string
        eventName?: string
        source?: string
      }
    | null
  standardizedPublicationStatus: string | null
}

export interface LytWebhookArchiveRecordContract {
  source: 'lyt-drill' | 'lyt-callback'
  eventId: string
  sourceEventName: string
  standardizedEventName: string
  capability: LytStandardizedWebhookEventContract['capability']
  fixtureKey?: string
  signatureStatus: 'verified' | 'unverified' | 'not-applicable'
  requestId?: string
  tenantId?: string
  brandId?: string
  storeId?: string
  occurredAt?: string
  receivedAt: string
  idempotencyKey: string
  mappingVersion: string
  rawPayload: Record<string, unknown>
  rawBody?: string
  rawHeaders?: Record<string, string>
  rawQuery?: Record<string, string>
}

export interface LytFixtureCatalogItemContract {
  key: string
  title: string
  transport: 'api' | 'webhook'
  capability: 'member' | 'order' | 'payment' | 'gate' | 'device'
  riskLevel: 'high' | 'medium'
  method: 'GET' | 'POST'
  path: string
  recommendedUsage: string
  eventType?: string
  mappingVersion: string
  requiredRawFields: string[]
  recommendedRawFields: string[]
  requiredHeaders: string[]
  recommendedHeaders: string[]
  requiredQueryParams: string[]
  recommendedQueryParams: string[]
  standardFieldChecklist: string[]
  schemaChecklist: string[]
  archiveChecklist: string[]
  validationStatus: 'ready-for-rehearsal' | 'needs-sample-completion'
  missingSampleFields: string[]
  missingChecklistItems: string[]
  samplePayload: Record<string, unknown>
  sampleHeaders: Record<string, string>
  sampleQueryParams: Record<string, string>
}

export interface LytFixtureChecklistSummaryContract {
  totalFixtures: number
  readyFixtures: number
  blockedFixtures: number
  highRiskBlockedFixtures: number
  blockedFixtureKeys: string[]
  transportBreakdown: Record<'api' | 'webhook', number>
  capabilityBreakdown: Partial<Record<'member' | 'order' | 'payment' | 'gate' | 'device', number>>
  missingFieldBreakdown: Record<string, number>
  missingChecklistBreakdown: Record<string, number>
  recommendedChecklistBreakdown: Record<string, number>
  recommendedNextActions: string[]
  fixtures: Array<{
    key: string
    riskLevel: 'high' | 'medium'
    validationStatus: 'ready-for-rehearsal' | 'needs-sample-completion'
    missingSampleFields: string[]
    missingChecklistItems: string[]
  }>
}

export interface LytFixtureCompareReportContract {
  fixtureKey: string
  readiness: 'ready' | 'missing-required'
  comparedAt: string
  payload: {
    missingRequired: string[]
    missingRecommended: string[]
    safeExtraObserved: string[]
    riskyExtraObserved: string[]
  }
  headers: {
    missingRequired: string[]
    missingRecommended: string[]
    safeExtraObserved: string[]
    riskyExtraObserved: string[]
  }
  query: {
    missingRequired: string[]
    missingRecommended: string[]
    safeExtraObserved: string[]
    riskyExtraObserved: string[]
  }
  recommendedNextActions: string[]
}

export interface LytFixtureImportPreviewContract {
  fixtureKey: string
  previewedAt: string
  readinessAfterImport: 'ready' | 'missing-required'
  changedSections: Array<'payload' | 'headers' | 'query'>
  changedKeys: {
    payload: string[]
    headers: string[]
    query: string[]
  }
  nextSamplePayload: Record<string, unknown>
  nextSampleHeaders: Record<string, string>
  nextSampleQueryParams: Record<string, string>
  compareReport: LytFixtureCompareReportContract
}

export interface LytFixtureImportPlanSectionContract {
  add: string[]
  update: string[]
  safeExtraCandidates: string[]
  riskyExtraCandidates: string[]
  unresolvedRequiredAfterImport: string[]
  unresolvedRecommendedAfterImport: string[]
}

export interface LytFixtureImportPlanContract {
  fixtureKey: string
  plannedAt: string
  importDecision: 'ready-to-promote' | 'needs-review' | 'blocked-by-required'
  readinessBeforeImport: 'ready' | 'missing-required'
  readinessAfterImport: 'ready' | 'missing-required'
  changedSections: Array<'payload' | 'headers' | 'query'>
  recommendedPromotions: string[]
  recommendedNextActions: string[]
  sections: {
    payload: LytFixtureImportPlanSectionContract
    headers: LytFixtureImportPlanSectionContract
    query: LytFixtureImportPlanSectionContract
  }
  preview: LytFixtureImportPreviewContract
}

export interface LytAdapterSelectionContract {
  adapterName: string
  adapterMode: 'mock' | 'sandbox' | 'real'
  reason: string
  vendor: string
  vendorTenantId: string
  vendorBrandId?: string
  vendorStoreId: string
  endpoint: string
  authMode: string
  capabilities: string[]
  connectionStatus: 'configured' | 'pending-configuration'
  credentialRef?: string
  resolutionLevel?: 'store' | 'brand' | 'tenant' | 'fallback'
  healthStatus?: 'healthy' | 'stale' | 'pending-configuration'
}

export interface LytConnectionCapabilityReadinessItemContract {
  capability: string
  enabled: boolean
  readiness: 'ready' | 'inherited-ready' | 'stale' | 'pending-configuration' | 'not-enabled'
}

export interface LytConnectionCapabilityReadinessContract {
  storeId: string
  storeCode?: string
  storeName?: string
  tenantId: string
  brandId?: string
  vendor: string
  vendorTenantId: string
  vendorBrandId?: string
  vendorStoreId: string
  connectionStatus: 'configured' | 'pending-configuration'
  resolutionLevel?: 'store' | 'brand' | 'tenant' | 'fallback'
  healthStatus?: 'healthy' | 'stale' | 'pending-configuration'
  hasCredential: boolean
  credentialRef?: string
  enabledCapabilities: string[]
  readinessByCapability: LytConnectionCapabilityReadinessItemContract[]
  missingRequirements: string[]
  recommendedNextActions: string[]
}

export interface LytConnectionGovernanceSummaryContract {
  generatedAt: string
  scope: {
    tenantId?: string
    brandId?: string
  }
  totalStores: number
  configuredStores: number
  pendingConfigurationStores: number
  staleStores: number
  inheritedStores: number
  storeLevelConfiguredStores: number
  capabilityBreakdown: Array<{
    capability: string
    readyStores: number
    inheritedReadyStores: number
    staleStores: number
    pendingStores: number
    notEnabledStores: number
  }>
  recommendedNextActions: string[]
  storeGroups: LytConnectionGovernanceStoreGroupContract[]
  stores: LytConnectionGovernanceSummaryStoreContract[]
}

export type LytGovernanceStoreIssueCode =
  | 'pending-configuration-stores'
  | 'vendor-mapping-gaps'
  | 'credential-missing-stores'
  | 'stale-connections'
  | 'inherited-store-verification'
  | 'capability-pending-stores'
  | 'healthy'

export type LytGovernanceStoreFocus =
  | 'connection-setup'
  | 'vendor-mapping'
  | 'credential-binding'
  | 'health-check'
  | 'inheritance-verification'
  | 'capability-rollout'
  | 'stable'

export interface LytConnectionGovernanceStoreActionContract {
  code: LytGovernanceStoreIssueCode
  focus: LytGovernanceStoreFocus
  label: string
}

export interface LytConnectionGovernanceSummaryStoreContract {
  storeId: string
  storeCode?: string
  storeName?: string
  resolutionLevel?: 'store' | 'brand' | 'tenant' | 'fallback'
  healthStatus?: 'healthy' | 'stale' | 'pending-configuration'
  connectionStatus: 'configured' | 'pending-configuration'
  enabledCapabilities: string[]
  missingRequirements: string[]
  governanceRiskLevel: 'high' | 'medium' | 'low'
  alertCodes: LytConnectionGovernanceAlertContract['code'][]
  blockingIssueCount: number
  primaryIssueCode: LytGovernanceStoreIssueCode
  primaryFocus: LytGovernanceStoreFocus
  primaryActionLabel: string
  secondaryIssues: LytConnectionGovernanceStoreActionContract[]
  focusTrail: LytGovernanceStoreFocus[]
  recommendedNextActions: string[]
}

export interface LytConnectionGovernanceStoreGroupContract {
  code:
    | 'high-risk-stores'
    | 'pending-configuration-stores'
    | 'stale-stores'
    | 'vendor-mapping-gaps'
    | 'credential-missing-stores'
    | 'inherited-store-verification'
  label: string
  severity: 'high' | 'medium' | 'low'
  count: number
  storeIds: string[]
  recommendedFocus: 'high-risk' | Exclude<LytGovernanceStoreFocus, 'capability-rollout' | 'stable'>
  primaryActionLabel: string
  recommendedNextActions: string[]
}

export interface LytConnectionGovernanceAlertContract {
  severity: 'high' | 'medium' | 'low'
  code:
    | 'pending-configuration-stores'
    | 'stale-connections'
    | 'credential-missing-stores'
    | 'vendor-mapping-gaps'
    | 'inherited-store-verification'
    | 'capability-pending-stores'
    | 'capability-not-enabled-gaps'
  count: number
  summary: string
  affectedStoreIds: string[]
  affectedCapabilities: string[]
  recommendedNextActions: string[]
}

export interface LytConnectionGovernanceAlertsContract {
  generatedAt: string
  scope: {
    tenantId?: string
    brandId?: string
  }
  alerts: LytConnectionGovernanceAlertContract[]
}

export interface LytStoreCapabilityAccessItemContract {
  capability: string
  readiness: 'ready' | 'inherited-ready' | 'stale' | 'pending-configuration' | 'not-enabled'
  access: 'enabled' | 'degraded' | 'blocked' | 'hidden'
  reason: string
}

export interface LytStoreCapabilityAccessViewContract {
  storeId: string
  storeCode?: string
  storeName?: string
  connectionStatus: 'configured' | 'pending-configuration'
  resolutionLevel?: 'store' | 'brand' | 'tenant' | 'fallback'
  healthStatus?: 'healthy' | 'stale' | 'pending-configuration'
  accessByCapability: LytStoreCapabilityAccessItemContract[]
  recommendedNextActions: string[]
}

/** Map domain-level member profile to public contract. */
export function toLytMemberProfileContract(profile: LytMemberProfile): LytMemberProfileContract {
  return {
    id: profile.memberId,
    name: profile.nickname ?? profile.memberId,
    level: profile.levelName ?? 'N/A'
  }
}

/** Map device status to contract. */
export function toLytDeviceStatusContract(input: {
  deviceId: string
  status: 'ONLINE' | 'OFFLINE'
}): LytDeviceStatusContract {
  return {
    deviceId: input.deviceId,
    status: input.status
  }
}

/** Map service-level bootstrap to contract. */
export function toLytBootstrapContract(bootstrap: {
  adapter: string
  foundationDependencies: string[]
  foundationContracts: string[]
  availableAdapters?: Array<{
    adapterName: string
    adapterMode: 'mock' | 'sandbox' | 'real'
  }>
  selectionStrategy?: string
}): LytBootstrapContract {
  return {
    adapter: bootstrap.adapter,
    foundationDependencies: [...bootstrap.foundationDependencies],
    foundationContracts: [...bootstrap.foundationContracts],
    availableAdapters: bootstrap.availableAdapters?.map((item) => ({ ...item })),
    selectionStrategy: bootstrap.selectionStrategy
  }
}

function resolveCapability(sourceEventName: string): LytStandardizedWebhookEventContract['capability'] {
  if (sourceEventName.startsWith('member.')) return 'member'
  if (sourceEventName.startsWith('payment.')) return 'payment'
  if (sourceEventName.startsWith('order.')) return 'order'
  if (sourceEventName.startsWith('device.')) return 'device'
  if (sourceEventName.startsWith('gate.')) return 'gate'
  if (sourceEventName.startsWith('coin.')) return 'coin'
  if (sourceEventName.startsWith('coupon.')) return 'coupon'
  return 'unknown'
}

function resolveStandardizedEventName(sourceEventName: string) {
  switch (sourceEventName) {
    case 'member.sync':
      return 'member.profile-synced'
    case 'payment.success':
      return 'cashier.payment-succeeded'
    case 'payment.failed':
      return 'cashier.payment-failed'
    case 'order.updated':
      return 'cashier.order-updated'
    case 'device.status.changed':
      return 'store.device-status-changed'
    case 'gate.pass':
      return 'store.gate-pass-recorded'
    case 'coin.issue':
      return 'store.coin-issued'
    case 'coupon.redeemed':
      return 'promotion.coupon-redeemed'
    default:
      return 'lyt.unmapped-webhook-received'
  }
}

export function toLytStandardizedWebhookEventContract(input: {
  eventId: string
  eventType?: string
  payload: Record<string, unknown>
}): LytStandardizedWebhookEventContract {
  const sourceEventName = input.eventType ?? 'lyt.webhook.received'
  const tenantId = typeof input.payload.tenantId === 'string' ? input.payload.tenantId : undefined
  const brandId = typeof input.payload.brandId === 'string' ? input.payload.brandId : undefined
  const storeId = typeof input.payload.storeId === 'string' ? input.payload.storeId : undefined

  return {
    aggregateId: input.eventId,
    sourceEventName,
    standardizedEventName: resolveStandardizedEventName(sourceEventName),
    capability: resolveCapability(sourceEventName),
    tenantId,
    brandId,
    storeId,
    idempotencyKey: `lyt-standardized:${input.eventId}`,
    payload: {
      ...input.payload,
      sourceEventName,
      aggregateId: input.eventId
    }
  }
}

export function toLytWebhookArchiveRecordContract(input: {
  source: 'lyt-drill' | 'lyt-callback'
  standardizedEvent: LytStandardizedWebhookEventContract
  rawPayload: Record<string, unknown>
  receivedAt?: string
  signatureVerified?: boolean
  fixtureKey?: string
  rawBody?: string
  rawHeaders?: Record<string, string>
  rawQuery?: Record<string, string>
}): LytWebhookArchiveRecordContract {
  return {
    source: input.source,
    eventId: input.standardizedEvent.aggregateId,
    sourceEventName: input.standardizedEvent.sourceEventName,
    standardizedEventName: input.standardizedEvent.standardizedEventName,
    capability: input.standardizedEvent.capability,
    fixtureKey: input.fixtureKey,
    signatureStatus:
      input.source === 'lyt-drill'
        ? 'not-applicable'
        : input.signatureVerified
          ? 'verified'
          : 'unverified',
    requestId: typeof input.rawPayload.requestId === 'string' ? input.rawPayload.requestId : undefined,
    tenantId: input.standardizedEvent.tenantId,
    brandId: input.standardizedEvent.brandId,
    storeId: input.standardizedEvent.storeId,
    occurredAt: typeof input.rawPayload.occurredAt === 'string' ? input.rawPayload.occurredAt : undefined,
    receivedAt: input.receivedAt ?? new Date().toISOString(),
    idempotencyKey: input.standardizedEvent.idempotencyKey,
    mappingVersion: 'lyt-field-mapping-spec-v1',
    rawPayload: { ...input.rawPayload },
    rawBody: input.rawBody,
    rawHeaders: input.rawHeaders ? { ...input.rawHeaders } : undefined,
    rawQuery: input.rawQuery ? { ...input.rawQuery } : undefined
  }
}

export function toLytFixtureCatalogItemContract(input: LytFixtureCatalogItemContract): LytFixtureCatalogItemContract {
  return {
    ...input,
    requiredRawFields: [...input.requiredRawFields],
    recommendedRawFields: [...input.recommendedRawFields],
    requiredHeaders: [...input.requiredHeaders],
    recommendedHeaders: [...input.recommendedHeaders],
    requiredQueryParams: [...input.requiredQueryParams],
    recommendedQueryParams: [...input.recommendedQueryParams],
    standardFieldChecklist: [...input.standardFieldChecklist],
    schemaChecklist: [...input.schemaChecklist],
    archiveChecklist: [...input.archiveChecklist],
    missingSampleFields: [...input.missingSampleFields],
    missingChecklistItems: [...input.missingChecklistItems],
    samplePayload: { ...input.samplePayload },
    sampleHeaders: { ...input.sampleHeaders },
    sampleQueryParams: { ...input.sampleQueryParams }
  }
}
