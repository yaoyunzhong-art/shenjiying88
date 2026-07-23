import { createHash, randomUUID } from 'node:crypto'
import { ApprovalStatus, FoundationScopeType, Prisma } from '@prisma/client'
import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common'
import { PrismaService } from '../../../prisma/prisma.service'

export type GovernanceApprovalStatus =
  | 'NOT_REQUIRED'
  | 'PENDING'
  | 'APPROVED'
  | 'REJECTED'
  | 'CANCELLED'
  | 'SUPERSEDED'

export interface GovernanceApprovalSnapshot {
  approvalId: string | null
  operation?: string
  resourceType?: string
  resourceKey?: string
  required: boolean
  version: number | null
  requestedBy: string | null
  ticket: string | null
  status: GovernanceApprovalStatus
  submitted: boolean
  persisted: boolean
  decidedBy: string | null
  decidedAt: string | null
  updatedAt: string | null
  execution?: {
    attempts: number
    executed: boolean
    executionStatus: string | null
    executedAt: string | null
    executedBy: string | null
    lastFailure: {
      failureStatus: string | null
      failureReason: string | null
      failedAt: string | null
      failedBy: string | null
    } | null
  }
  summary?: Record<string, unknown> | null
}

export interface MaterializeGovernanceApprovalInput {
  operation: string
  resourceType: string
  resourceKey: string
  scopeType?: FoundationScopeType | keyof typeof FoundationScopeType
  tenantId?: string
  brandId?: string
  storeId?: string
  approvalRequired: boolean
  requestedBy?: string
  approvalTicket?: string
  approvalStatus?: GovernanceApprovalStatus
  requestPayload?: Record<string, unknown>
  summary?: Record<string, unknown>
}

export interface GovernanceApprovalQueryInput {
  limit?: number
  approvalTicket?: string
  operation?: string
  resourceType?: string
  resourceKey?: string
  requestedBy?: string
  decidedBy?: string
  status?: GovernanceApprovalStatus
  operationIn?: string[]
  resourceTypeIn?: string[]
  tenantId?: string
  from?: string
  to?: string
  executed?: boolean
  executionStatus?: string
  hasFailures?: boolean
  failureStatus?: string
  groupBy?: GovernanceApprovalGroupBy[]
}

export type GovernanceApprovalGroupBy =
  | 'operation'
  | 'resourceType'
  | 'status'
  | 'executionStatus'
  | 'failureStatus'
  | 'requestedBy'

export interface GovernanceApprovalDecisionInput {
  approvalTicket: string
  decidedBy: string
  decisionNote?: string
  summary?: Record<string, unknown>
  expectedVersion?: number
  status: 'APPROVED' | 'REJECTED'
}

export interface GovernanceApprovalCancelInput {
  approvalTicket: string
  cancelledBy: string
  cancelReason?: string
  expectedVersion?: number
}

export interface GovernanceApprovalResubmitInput {
  approvalTicket: string
  resubmittedBy: string
  resubmitReason?: string
  expectedVersion?: number
}

export interface GovernanceApprovalExecutionInput {
  approvalTicket: string
  executedBy: string
  executionStatus: string
  expectedVersion?: number
  summary?: Record<string, unknown>
}

export interface GovernanceApprovalExecutionFailureInput {
  approvalTicket: string
  failedBy: string
  failureStatus: string
  failureReason: string
  expectedVersion?: number
  summary?: Record<string, unknown>
}

interface GovernanceApprovalRecord {
  id: string
  approvalTicket: string | null
  operation: string
  resourceType: string
  resourceKey: string
  scopeType: FoundationScopeType
  tenantId: string | null
  brandId: string | null
  storeId: string | null
  required: boolean
  requestedBy: string | null
  status: ApprovalStatus
  version: number
  decisionNote: string | null
  decidedBy: string | null
  decidedAt: Date | null
  summary: unknown
  createdAt: Date
  updatedAt: Date
}

export async function materializeGovernanceApproval(
  prisma: PrismaService,
  input: MaterializeGovernanceApprovalInput
): Promise<GovernanceApprovalSnapshot> {
  const normalizedStatus = normalizeRequestedStatus(input.approvalRequired, input.approvalStatus)
  const shouldPersist =
    input.approvalRequired ||
    Boolean(input.approvalTicket) ||
    Boolean(input.approvalStatus && input.approvalStatus !== 'NOT_REQUIRED')

  if (!shouldPersist) {
    return {
      approvalId: null,
      operation: input.operation,
      resourceType: input.resourceType,
      resourceKey: input.resourceKey,
      required: input.approvalRequired,
      version: null,
      requestedBy: input.requestedBy ?? null,
      ticket: input.approvalTicket ?? null,
      status: normalizedStatus,
      submitted: Boolean(input.approvalTicket),
      persisted: false,
      decidedBy: null,
      decidedAt: null,
      updatedAt: null,
      summary: input.summary ?? null
    }
  }

  const approvalTicket = input.approvalTicket ?? (input.approvalRequired ? buildInternalApprovalTicket(input.operation) : null)
  const existing = approvalTicket
    ? await prisma.governanceApproval.findUnique({
        where: {
          approvalTicket
        }
      }).then((record) => record as GovernanceApprovalRecord | null)
    : null

  if (existing) {
    assertApprovalBinding(existing, input)
  }

  const persistedStatus = existing?.status ?? (input.approvalRequired ? ApprovalStatus.PENDING : toPrismaApprovalStatus(normalizedStatus))
  const requestPayload = input.requestPayload ? toSerializableRecord(input.requestPayload) : null
  const requestDigest = requestPayload ? buildRequestDigest(requestPayload) : null
  if (existing) {
    assertRequestDigest(existing.summary, requestDigest)
  }
  const mergedSummary = {
    ...toJsonRecord(existing?.summary),
    ...(requestDigest
      ? {
          requestDigest,
          requestPayload
        }
      : {}),
    ...(input.summary ?? {}),
    submittedAt: new Date().toISOString()
  }
  const data = {
    operation: input.operation,
    resourceType: input.resourceType,
    resourceKey: input.resourceKey,
    scopeType: resolveScopeType(input.scopeType),
    tenantId: input.tenantId ?? null,
    brandId: input.brandId ?? null,
    storeId: input.storeId ?? null,
    required: input.approvalRequired,
    requestedBy: input.requestedBy ?? null,
    approvalTicket,
    status: persistedStatus,
    version: existing ? (existing.status !== persistedStatus ? existing.version + 1 : existing.version) : 1,
    summary: toInputJsonValue(mergedSummary)
  }

  const persisted = existing
    ? ((await prisma.governanceApproval.update({
        where: { id: existing.id },
        data: data as unknown as Prisma.GovernanceApprovalUpdateInput
      })) as GovernanceApprovalRecord)
    : ((await prisma.governanceApproval.create({
        data: data as unknown as Prisma.GovernanceApprovalCreateInput
      })) as GovernanceApprovalRecord)

  return {
    ...toApprovalSnapshot(persisted),
    submitted: Boolean(persisted.approvalTicket),
    persisted: true
  }
}

export async function listGovernanceApprovals(prisma: PrismaService, input: GovernanceApprovalQueryInput = {}) {
  return loadGovernanceApprovalSnapshots(prisma, input, input.limit ?? 20)
}

export async function summarizeGovernanceApprovals(prisma: PrismaService, input: GovernanceApprovalQueryInput = {}) {
  const approvals = await loadGovernanceApprovalSnapshots(prisma, input)
  const groupBy = normalizeGroupBy(input.groupBy)
  const summary = approvals.reduce((result, approval) => accumulateApprovalMetrics(result, approval), createApprovalMetrics())

  if (!groupBy.length) {
    return {
      ...summary,
      groups: []
    }
  }

  const grouped = new Map<string, { dimensions: Record<string, string | null>; metrics: ReturnType<typeof createApprovalMetrics> }>()
  for (const approval of approvals) {
    const dimensions: Record<string, string | null> = Object.fromEntries(
      groupBy.map((key: GovernanceApprovalGroupBy) => [key, getApprovalGroupValue(approval, key)])
    )
    const groupKey = stableStringify(dimensions)
    const existing = grouped.get(groupKey)
    if (existing) {
      accumulateApprovalMetrics(existing.metrics, approval)
    } else {
      grouped.set(groupKey, {
        dimensions,
        metrics: accumulateApprovalMetrics(createApprovalMetrics(), approval)
      })
    }
  }

  return {
    ...summary,
    groups: [...grouped.values()]
      .map((group) => ({
        ...group.metrics,
        dimensions: group.dimensions
      }))
      .sort((left, right) => right.total - left.total)
  }
}

async function loadGovernanceApprovalSnapshots(
  prisma: PrismaService,
  input: GovernanceApprovalQueryInput,
  take?: number
) {
  const from = parseDate(input.from)
  const to = parseDate(input.to)
  let approvals: GovernanceApprovalRecord[]
  try {
    approvals = (await prisma.governanceApproval.findMany({
      where: {
        approvalTicket: input.approvalTicket,
        operation: input.operation,
        resourceType: input.resourceType,
        resourceKey: input.resourceKey,
        requestedBy: input.requestedBy,
        decidedBy: input.decidedBy,
        tenantId: input.tenantId,
        status: input.status ? toPrismaApprovalStatus(input.status) : undefined,
        updatedAt:
          from || to
            ? {
                ...(from ? { gte: from } : {}),
                ...(to ? { lte: to } : {})
              }
            : undefined
      },
      orderBy: [{ updatedAt: 'desc' }],
      take
    })) as GovernanceApprovalRecord[]
  } catch (error) {
    if (!shouldUseGovernanceApprovalFallback(error)) {
      throw error
    }
    approvals = []
  }

  return approvals
    .map((approval) => ({
      ...toApprovalSnapshot(approval),
      submitted: Boolean(approval.approvalTicket),
      persisted: true
    }))
    .filter((approval) => matchesApprovalListFilters(approval, input))
    .filter((approval) => matchesApprovalExecutionFilters(approval, input))
}

function shouldUseGovernanceApprovalFallback(error: unknown) {
  const code = typeof error === 'object' && error && 'code' in error ? (error as { code?: unknown }).code : undefined
  return code === 'P2021' || code === 'P1010' || code === 'P1001'
}

export async function getGovernanceApprovalDetail(prisma: PrismaService, approvalTicket: string) {
  return getGovernanceApprovalByTicket(prisma, approvalTicket)
}

export async function decideGovernanceApproval(prisma: PrismaService, input: GovernanceApprovalDecisionInput) {
  const existing = (await prisma.governanceApproval.findUnique({
    where: {
      approvalTicket: input.approvalTicket
    }
  })) as GovernanceApprovalRecord | null
  if (!existing) {
    throw new NotFoundException(`Approval ticket not found: ${input.approvalTicket}`)
  }
  assertExpectedVersion(existing.version, input.expectedVersion)
  if (matchesApprovalStatus(existing.status, 'CANCELLED') || matchesApprovalStatus(existing.status, 'SUPERSEDED')) {
    throw new ConflictException(`Approval ticket cannot be decided in ${existing.status} status.`)
  }

  const decidedAt = new Date()
  const persisted = (await prisma.governanceApproval.update({
    where: { id: existing.id },
    data: {
      status: toPrismaApprovalStatus(input.status),
      version: existing.version + 1,
      decidedBy: input.decidedBy,
      decisionNote: input.decisionNote ?? null,
      decidedAt,
      summary: toInputJsonValue({
        ...toJsonRecord(existing.summary),
        ...(input.summary ?? {}),
        decidedAt: decidedAt.toISOString(),
        decision: input.status
      })
    } as unknown as Prisma.GovernanceApprovalUpdateInput
  })) as GovernanceApprovalRecord

  return {
    ...toApprovalSnapshot(persisted),
    submitted: true,
    persisted: true
  }
}

export async function cancelGovernanceApproval(prisma: PrismaService, input: GovernanceApprovalCancelInput) {
  const existing = (await prisma.governanceApproval.findUnique({
    where: { approvalTicket: input.approvalTicket }
  })) as GovernanceApprovalRecord | null
  if (!existing) {
    throw new NotFoundException(`Approval ticket not found: ${input.approvalTicket}`)
  }
  assertExpectedVersion(existing.version, input.expectedVersion)
  if (!matchesApprovalStatus(existing.status, 'PENDING')) {
    throw new ConflictException(`Only pending approvals can be cancelled. Current status: ${existing.status}`)
  }

  const decidedAt = new Date()
  const persisted = (await prisma.governanceApproval.update({
    where: { id: existing.id },
    data: {
      status: toPrismaApprovalStatus('CANCELLED'),
      version: existing.version + 1,
      decidedBy: input.cancelledBy,
      decisionNote: input.cancelReason ?? null,
      decidedAt,
      summary: toInputJsonValue({
        ...toJsonRecord(existing.summary),
        cancelledAt: decidedAt.toISOString(),
        cancellation: 'CANCELLED'
      })
    } as unknown as Prisma.GovernanceApprovalUpdateInput
  })) as GovernanceApprovalRecord

  return {
    ...toApprovalSnapshot(persisted),
    submitted: true,
    persisted: true
  }
}

export async function resubmitGovernanceApproval(prisma: PrismaService, input: GovernanceApprovalResubmitInput) {
  const existing = (await prisma.governanceApproval.findUnique({
    where: { approvalTicket: input.approvalTicket }
  })) as GovernanceApprovalRecord | null
  if (!existing) {
    throw new NotFoundException(`Approval ticket not found: ${input.approvalTicket}`)
  }
  assertExpectedVersion(existing.version, input.expectedVersion)
  if (!matchesApprovalStatus(existing.status, 'REJECTED') && !matchesApprovalStatus(existing.status, 'CANCELLED')) {
    throw new ConflictException(`Only rejected or cancelled approvals can be resubmitted. Current status: ${existing.status}`)
  }

  const supersededAt = new Date()
  await prisma.governanceApproval.update({
    where: { id: existing.id },
    data: {
      status: toPrismaApprovalStatus('SUPERSEDED'),
      version: existing.version + 1,
      decidedBy: input.resubmittedBy,
      decisionNote: input.resubmitReason ?? null,
      decidedAt: supersededAt,
      summary: toInputJsonValue({
        ...toJsonRecord(existing.summary),
        supersededAt: supersededAt.toISOString(),
        supersededBy: input.resubmittedBy,
        supersededTicket: input.approvalTicket
      })
    } as unknown as Prisma.GovernanceApprovalUpdateInput
  })

  const resubmitted = (await prisma.governanceApproval.create({
    data: {
      approvalTicket: buildInternalApprovalTicket(existing.operation),
      operation: existing.operation,
      resourceType: existing.resourceType,
      resourceKey: existing.resourceKey,
      scopeType: existing.scopeType,
      tenantId: existing.tenantId,
      brandId: existing.brandId,
      storeId: existing.storeId,
      required: existing.required,
      requestedBy: input.resubmittedBy,
      status: ApprovalStatus.PENDING,
      version: 1,
      summary: toInputJsonValue({
        ...toJsonRecord(existing.summary),
        resubmittedFromTicket: existing.approvalTicket,
        resubmittedAt: new Date().toISOString(),
        resubmitReason: input.resubmitReason ?? null
      })
    } as unknown as Prisma.GovernanceApprovalCreateInput
  })) as GovernanceApprovalRecord

  return {
    supersededTicket: existing.approvalTicket,
    approval: {
      ...toApprovalSnapshot(resubmitted),
      submitted: true,
      persisted: true
    }
  }
}

export async function getGovernanceApprovalByTicket(prisma: PrismaService, approvalTicket: string) {
  const existing = (await prisma.governanceApproval.findUnique({
    where: {
      approvalTicket
    }
  })) as GovernanceApprovalRecord | null
  if (!existing) {
    throw new NotFoundException(`Approval ticket not found: ${approvalTicket}`)
  }

  return {
    ...toApprovalSnapshot(existing),
    submitted: true,
    persisted: true
  }
}

export async function markGovernanceApprovalExecuted(prisma: PrismaService, input: GovernanceApprovalExecutionInput) {
  const existing = (await prisma.governanceApproval.findUnique({
    where: { approvalTicket: input.approvalTicket }
  })) as GovernanceApprovalRecord | null
  if (!existing) {
    throw new NotFoundException(`Approval ticket not found: ${input.approvalTicket}`)
  }
  assertExpectedVersion(existing.version, input.expectedVersion)
  if (!matchesApprovalStatus(existing.status, 'APPROVED')) {
    throw new ConflictException(`Only approved approvals can be executed. Current status: ${existing.status}`)
  }
  if (isGovernanceApprovalExecuted(existing.summary)) {
    throw new ConflictException(`Approval ticket has already been executed: ${input.approvalTicket}`)
  }

  const executedAt = new Date()
  const existingSummary = toJsonRecord(existing.summary)
  const attemptCount = getExecutionAttemptCount(existingSummary) + 1
  const persisted = (await prisma.governanceApproval.update({
    where: { id: existing.id },
    data: {
      version: existing.version + 1,
      summary: toInputJsonValue({
        ...existingSummary,
        ...(input.summary ?? {}),
        executionAttempts: attemptCount,
        execution: {
          executedAt: executedAt.toISOString(),
          executedBy: input.executedBy,
          executionStatus: input.executionStatus
        }
      })
    } as unknown as Prisma.GovernanceApprovalUpdateInput
  })) as GovernanceApprovalRecord

  return {
    ...toApprovalSnapshot(persisted),
    submitted: true,
    persisted: true
  }
}

export async function markGovernanceApprovalExecutionFailed(
  prisma: PrismaService,
  input: GovernanceApprovalExecutionFailureInput
) {
  const existing = (await prisma.governanceApproval.findUnique({
    where: { approvalTicket: input.approvalTicket }
  })) as GovernanceApprovalRecord | null
  if (!existing) {
    throw new NotFoundException(`Approval ticket not found: ${input.approvalTicket}`)
  }
  assertExpectedVersion(existing.version, input.expectedVersion)
  if (!matchesApprovalStatus(existing.status, 'APPROVED')) {
    throw new ConflictException(`Only approved approvals can record execution failures. Current status: ${existing.status}`)
  }

  const failedAt = new Date()
  const existingSummary = toJsonRecord(existing.summary)
  const attemptCount = getExecutionAttemptCount(existingSummary) + 1
  const persisted = (await prisma.governanceApproval.update({
    where: { id: existing.id },
    data: {
      version: existing.version + 1,
      summary: toInputJsonValue({
        ...existingSummary,
        ...(input.summary ?? {}),
        executionAttempts: attemptCount,
        executionFailure: {
          failedAt: failedAt.toISOString(),
          failedBy: input.failedBy,
          failureStatus: input.failureStatus,
          failureReason: input.failureReason
        }
      })
    } as unknown as Prisma.GovernanceApprovalUpdateInput
  })) as GovernanceApprovalRecord

  return {
    ...toApprovalSnapshot(persisted),
    submitted: true,
    persisted: true
  }
}

export function isGovernanceApprovalExecuted(summary: unknown) {
  const summaryRecord = toJsonRecord(summary)
  const executionRecord = toJsonRecord(summaryRecord?.execution)
  return typeof executionRecord?.executedAt === 'string'
}

export function getExecutionAttemptCount(summary: Record<string, unknown> | null) {
  return typeof summary?.executionAttempts === 'number' ? summary.executionAttempts : 0
}

export function normalizeRequestedStatus(required: boolean, status?: GovernanceApprovalStatus): GovernanceApprovalStatus {
  if (!required) {
    return status ?? 'NOT_REQUIRED'
  }

  return status === 'APPROVED' || status === 'REJECTED' || status === 'CANCELLED' || status === 'SUPERSEDED'
    ? 'PENDING'
    : status ?? 'PENDING'
}

export function resolveScopeType(scopeType?: FoundationScopeType | keyof typeof FoundationScopeType) {
  if (!scopeType) {
    return FoundationScopeType.PLATFORM
  }

  return typeof scopeType === 'string' ? FoundationScopeType[scopeType] ?? FoundationScopeType.PLATFORM : scopeType
}

export function buildInternalApprovalTicket(operation: string) {
  const prefix = operation.replace(/[^a-z0-9]/gi, '').toUpperCase().slice(0, 8) || 'APR'
  return `APR-${prefix}-${randomUUID().slice(0, 8).toUpperCase()}`
}

export function assertApprovalBinding(
  existing: {
    operation: string
    resourceType: string
    resourceKey: string
    scopeType: FoundationScopeType
    tenantId: string | null
    brandId: string | null
    storeId: string | null
  },
  input: MaterializeGovernanceApprovalInput
) {
  const expectedScopeType = resolveScopeType(input.scopeType)
  if (
    existing.operation !== input.operation ||
    existing.resourceType !== input.resourceType ||
    existing.resourceKey !== input.resourceKey ||
    existing.scopeType !== expectedScopeType ||
    existing.tenantId !== (input.tenantId ?? null) ||
    existing.brandId !== (input.brandId ?? null) ||
    existing.storeId !== (input.storeId ?? null)
  ) {
    throw new BadRequestException('Approval ticket does not match the current governance request.')
  }
}

export function assertRequestDigest(summary: unknown, requestDigest: string | null) {
  const summaryRecord = toJsonRecord(summary)
  const existingDigest = typeof summaryRecord?.requestDigest === 'string' ? summaryRecord.requestDigest : null
  if (existingDigest && requestDigest && existingDigest !== requestDigest) {
    throw new BadRequestException('Approval ticket request payload does not match the original submitted request.')
  }
}

export function toApprovalSnapshot(approval: {
  id: string
  operation: string
  resourceType: string
  resourceKey: string
  required: boolean
  version: number
  requestedBy: string | null
  approvalTicket: string | null
  status: ApprovalStatus
  decidedBy: string | null
  decidedAt: Date | null
  updatedAt: Date
  summary: unknown
}) {
  const summary = toJsonRecord(approval.summary)
  const execution = toExecutionSummary(summary)
  return {
    approvalId: approval.id,
    operation: approval.operation,
    resourceType: approval.resourceType,
    resourceKey: approval.resourceKey,
    required: approval.required,
    version: approval.version,
    requestedBy: approval.requestedBy ?? null,
    ticket: approval.approvalTicket ?? null,
    status: approval.status,
    decidedBy: approval.decidedBy ?? null,
    decidedAt: approval.decidedAt?.toISOString() ?? null,
    updatedAt: approval.updatedAt.toISOString(),
    execution,
    summary
  }
}

export function toJsonRecord(value: unknown) {
  return value && typeof value === 'object' && !Array.isArray(value) ? (value as Record<string, unknown>) : null
}

export function toSerializableRecord(value: Record<string, unknown>) {
  return JSON.parse(stableStringify(value)) as Record<string, unknown>
}

export function buildRequestDigest(value: Record<string, unknown>) {
  return createHash('sha256').update(stableStringify(value)).digest('hex')
}

export function stableStringify(value: unknown): string {
  if (Array.isArray(value)) {
    return `[${value.map((item) => stableStringify(item)).join(',')}]`
  }

  if (value && typeof value === 'object') {
    const entries = Object.entries(value as Record<string, unknown>).sort(([left], [right]) => left.localeCompare(right))
    return `{${entries.map(([key, item]) => `${JSON.stringify(key)}:${stableStringify(item)}`).join(',')}}`
  }

  return JSON.stringify(value)
}

export function parseDate(value?: string) {
  if (!value) {
    return null
  }

  const parsed = new Date(value)
  return Number.isNaN(parsed.getTime()) ? null : parsed
}

export function toExecutionSummary(summary: Record<string, unknown> | null) {
  const execution = toJsonRecord(summary?.execution)
  const failure = toJsonRecord(summary?.executionFailure)
  return {
    attempts: getExecutionAttemptCount(summary),
    executed: Boolean(execution?.executedAt),
    executionStatus: typeof execution?.executionStatus === 'string' ? execution.executionStatus : null,
    executedAt: typeof execution?.executedAt === 'string' ? execution.executedAt : null,
    executedBy: typeof execution?.executedBy === 'string' ? execution.executedBy : null,
    lastFailure: failure
      ? {
          failureStatus: typeof failure.failureStatus === 'string' ? failure.failureStatus : null,
          failureReason: typeof failure.failureReason === 'string' ? failure.failureReason : null,
          failedAt: typeof failure.failedAt === 'string' ? failure.failedAt : null,
          failedBy: typeof failure.failedBy === 'string' ? failure.failedBy : null
        }
      : null
  }
}

export function createApprovalMetrics() {
  return {
    total: 0,
    statuses: {
      NOT_REQUIRED: 0,
      PENDING: 0,
      APPROVED: 0,
      REJECTED: 0,
      CANCELLED: 0,
      SUPERSEDED: 0
    } satisfies Record<GovernanceApprovalStatus, number>,
    execution: {
      executed: 0,
      pending: 0,
      withFailures: 0,
      byExecutionStatus: {} as Record<string, number>,
      byFailureStatus: {} as Record<string, number>
    }
  }
}

export function accumulateApprovalMetrics(metrics: ReturnType<typeof createApprovalMetrics>, approval: GovernanceApprovalSnapshot) {
  metrics.total += 1
  metrics.statuses[approval.status] += 1

  if (approval.execution?.executed) {
    metrics.execution.executed += 1
  } else {
    metrics.execution.pending += 1
  }

  if (approval.execution?.executionStatus) {
    metrics.execution.byExecutionStatus[approval.execution.executionStatus] =
      (metrics.execution.byExecutionStatus[approval.execution.executionStatus] ?? 0) + 1
  }

  if (approval.execution?.lastFailure?.failureStatus) {
    metrics.execution.withFailures += 1
    metrics.execution.byFailureStatus[approval.execution.lastFailure.failureStatus] =
      (metrics.execution.byFailureStatus[approval.execution.lastFailure.failureStatus] ?? 0) + 1
  }

  return metrics
}

export function getApprovalGroupValue(approval: GovernanceApprovalSnapshot, groupBy: GovernanceApprovalGroupBy) {
  switch (groupBy) {
    case 'operation':
      return approval.operation ?? null
    case 'resourceType':
      return approval.resourceType ?? null
    case 'status':
      return approval.status ?? null
    case 'executionStatus':
      return approval.execution?.executionStatus ?? null
    case 'failureStatus':
      return approval.execution?.lastFailure?.failureStatus ?? null
    case 'requestedBy':
      return approval.requestedBy ?? null
    default:
      return null
  }
}

export function normalizeGroupBy(value: GovernanceApprovalQueryInput['groupBy'] | string | undefined): GovernanceApprovalGroupBy[] {
  if (Array.isArray(value)) {
    return value
  }

  if (typeof value === 'string') {
    return value
      .split(',')
      .map((item: string) => item.trim())
      .filter((item: string): item is GovernanceApprovalGroupBy => Boolean(item))
  }

  return []
}

export function matchesApprovalExecutionFilters(
  approval: GovernanceApprovalSnapshot,
  input: Pick<GovernanceApprovalQueryInput, 'executed' | 'executionStatus' | 'hasFailures' | 'failureStatus'>
) {
  if (typeof input.executed === 'boolean' && Boolean(approval.execution?.executed) !== input.executed) {
    return false
  }

  if (input.executionStatus && approval.execution?.executionStatus !== input.executionStatus) {
    return false
  }

  const hasFailures = Boolean(approval.execution?.lastFailure)
  if (typeof input.hasFailures === 'boolean' && hasFailures !== input.hasFailures) {
    return false
  }

  if (input.failureStatus && approval.execution?.lastFailure?.failureStatus !== input.failureStatus) {
    return false
  }

  return true
}

export function matchesApprovalListFilters(
  approval: GovernanceApprovalSnapshot,
  input: Pick<GovernanceApprovalQueryInput, 'operationIn' | 'resourceTypeIn'>
) {
  if (input.operationIn?.length && (!approval.operation || !input.operationIn.includes(approval.operation))) {
    return false
  }

  if (input.resourceTypeIn?.length && (!approval.resourceType || !input.resourceTypeIn.includes(approval.resourceType))) {
    return false
  }

  return true
}

export function toPrismaApprovalStatus(status: GovernanceApprovalStatus | 'APPROVED' | 'REJECTED') {
  return status as unknown as ApprovalStatus
}

export function matchesApprovalStatus(current: ApprovalStatus, expected: GovernanceApprovalStatus) {
  return String(current) === expected
}

export function assertExpectedVersion(currentVersion: number, expectedVersion?: number) {
  if (expectedVersion == null) {
    return
  }

  if (currentVersion !== expectedVersion) {
    throw new ConflictException(`Approval version mismatch. Expected ${expectedVersion}, current ${currentVersion}.`)
  }
}

function toInputJsonValue(value: unknown): Prisma.InputJsonValue {
  return JSON.parse(JSON.stringify(value ?? null)) as Prisma.InputJsonValue
}
