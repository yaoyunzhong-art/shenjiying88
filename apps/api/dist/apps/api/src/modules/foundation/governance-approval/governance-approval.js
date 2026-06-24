"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.materializeGovernanceApproval = materializeGovernanceApproval;
exports.listGovernanceApprovals = listGovernanceApprovals;
exports.summarizeGovernanceApprovals = summarizeGovernanceApprovals;
exports.getGovernanceApprovalDetail = getGovernanceApprovalDetail;
exports.decideGovernanceApproval = decideGovernanceApproval;
exports.cancelGovernanceApproval = cancelGovernanceApproval;
exports.resubmitGovernanceApproval = resubmitGovernanceApproval;
exports.getGovernanceApprovalByTicket = getGovernanceApprovalByTicket;
exports.markGovernanceApprovalExecuted = markGovernanceApprovalExecuted;
exports.markGovernanceApprovalExecutionFailed = markGovernanceApprovalExecutionFailed;
exports.isGovernanceApprovalExecuted = isGovernanceApprovalExecuted;
exports.getExecutionAttemptCount = getExecutionAttemptCount;
exports.normalizeRequestedStatus = normalizeRequestedStatus;
exports.resolveScopeType = resolveScopeType;
exports.buildInternalApprovalTicket = buildInternalApprovalTicket;
exports.assertApprovalBinding = assertApprovalBinding;
exports.assertRequestDigest = assertRequestDigest;
exports.toApprovalSnapshot = toApprovalSnapshot;
exports.toJsonRecord = toJsonRecord;
exports.toSerializableRecord = toSerializableRecord;
exports.buildRequestDigest = buildRequestDigest;
exports.stableStringify = stableStringify;
exports.parseDate = parseDate;
exports.toExecutionSummary = toExecutionSummary;
exports.createApprovalMetrics = createApprovalMetrics;
exports.accumulateApprovalMetrics = accumulateApprovalMetrics;
exports.getApprovalGroupValue = getApprovalGroupValue;
exports.normalizeGroupBy = normalizeGroupBy;
exports.matchesApprovalExecutionFilters = matchesApprovalExecutionFilters;
exports.matchesApprovalListFilters = matchesApprovalListFilters;
exports.toPrismaApprovalStatus = toPrismaApprovalStatus;
exports.matchesApprovalStatus = matchesApprovalStatus;
exports.assertExpectedVersion = assertExpectedVersion;
const node_crypto_1 = require("node:crypto");
const client_1 = require("@prisma/client");
const common_1 = require("@nestjs/common");
async function materializeGovernanceApproval(prisma, input) {
    const normalizedStatus = normalizeRequestedStatus(input.approvalRequired, input.approvalStatus);
    const shouldPersist = input.approvalRequired ||
        Boolean(input.approvalTicket) ||
        Boolean(input.approvalStatus && input.approvalStatus !== 'NOT_REQUIRED');
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
        };
    }
    const approvalTicket = input.approvalTicket ?? (input.approvalRequired ? buildInternalApprovalTicket(input.operation) : null);
    const existing = approvalTicket
        ? await prisma.governanceApproval.findUnique({
            where: {
                approvalTicket
            }
        }).then((record) => record)
        : null;
    if (existing) {
        assertApprovalBinding(existing, input);
    }
    const persistedStatus = existing?.status ?? (input.approvalRequired ? client_1.ApprovalStatus.PENDING : toPrismaApprovalStatus(normalizedStatus));
    const requestPayload = input.requestPayload ? toSerializableRecord(input.requestPayload) : null;
    const requestDigest = requestPayload ? buildRequestDigest(requestPayload) : null;
    if (existing) {
        assertRequestDigest(existing.summary, requestDigest);
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
    };
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
    };
    const persisted = existing
        ? (await prisma.governanceApproval.update({
            where: { id: existing.id },
            data: data
        }))
        : (await prisma.governanceApproval.create({
            data: data
        }));
    return {
        ...toApprovalSnapshot(persisted),
        submitted: Boolean(persisted.approvalTicket),
        persisted: true
    };
}
async function listGovernanceApprovals(prisma, input = {}) {
    return loadGovernanceApprovalSnapshots(prisma, input, input.limit ?? 20);
}
async function summarizeGovernanceApprovals(prisma, input = {}) {
    const approvals = await loadGovernanceApprovalSnapshots(prisma, input);
    const groupBy = normalizeGroupBy(input.groupBy);
    const summary = approvals.reduce((result, approval) => accumulateApprovalMetrics(result, approval), createApprovalMetrics());
    if (!groupBy.length) {
        return {
            ...summary,
            groups: []
        };
    }
    const grouped = new Map();
    for (const approval of approvals) {
        const dimensions = Object.fromEntries(groupBy.map((key) => [key, getApprovalGroupValue(approval, key)]));
        const groupKey = stableStringify(dimensions);
        const existing = grouped.get(groupKey);
        if (existing) {
            accumulateApprovalMetrics(existing.metrics, approval);
        }
        else {
            grouped.set(groupKey, {
                dimensions,
                metrics: accumulateApprovalMetrics(createApprovalMetrics(), approval)
            });
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
    };
}
async function loadGovernanceApprovalSnapshots(prisma, input, take) {
    const from = parseDate(input.from);
    const to = parseDate(input.to);
    const approvals = (await prisma.governanceApproval.findMany({
        where: {
            approvalTicket: input.approvalTicket,
            operation: input.operation,
            resourceType: input.resourceType,
            resourceKey: input.resourceKey,
            requestedBy: input.requestedBy,
            decidedBy: input.decidedBy,
            tenantId: input.tenantId,
            status: input.status ? toPrismaApprovalStatus(input.status) : undefined,
            updatedAt: from || to
                ? {
                    ...(from ? { gte: from } : {}),
                    ...(to ? { lte: to } : {})
                }
                : undefined
        },
        orderBy: [{ updatedAt: 'desc' }],
        take
    }));
    return approvals
        .map((approval) => ({
        ...toApprovalSnapshot(approval),
        submitted: Boolean(approval.approvalTicket),
        persisted: true
    }))
        .filter((approval) => matchesApprovalListFilters(approval, input))
        .filter((approval) => matchesApprovalExecutionFilters(approval, input));
}
async function getGovernanceApprovalDetail(prisma, approvalTicket) {
    return getGovernanceApprovalByTicket(prisma, approvalTicket);
}
async function decideGovernanceApproval(prisma, input) {
    const existing = (await prisma.governanceApproval.findUnique({
        where: {
            approvalTicket: input.approvalTicket
        }
    }));
    if (!existing) {
        throw new common_1.NotFoundException(`Approval ticket not found: ${input.approvalTicket}`);
    }
    assertExpectedVersion(existing.version, input.expectedVersion);
    if (matchesApprovalStatus(existing.status, 'CANCELLED') || matchesApprovalStatus(existing.status, 'SUPERSEDED')) {
        throw new common_1.ConflictException(`Approval ticket cannot be decided in ${existing.status} status.`);
    }
    const decidedAt = new Date();
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
        }
    }));
    return {
        ...toApprovalSnapshot(persisted),
        submitted: true,
        persisted: true
    };
}
async function cancelGovernanceApproval(prisma, input) {
    const existing = (await prisma.governanceApproval.findUnique({
        where: { approvalTicket: input.approvalTicket }
    }));
    if (!existing) {
        throw new common_1.NotFoundException(`Approval ticket not found: ${input.approvalTicket}`);
    }
    assertExpectedVersion(existing.version, input.expectedVersion);
    if (!matchesApprovalStatus(existing.status, 'PENDING')) {
        throw new common_1.ConflictException(`Only pending approvals can be cancelled. Current status: ${existing.status}`);
    }
    const decidedAt = new Date();
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
        }
    }));
    return {
        ...toApprovalSnapshot(persisted),
        submitted: true,
        persisted: true
    };
}
async function resubmitGovernanceApproval(prisma, input) {
    const existing = (await prisma.governanceApproval.findUnique({
        where: { approvalTicket: input.approvalTicket }
    }));
    if (!existing) {
        throw new common_1.NotFoundException(`Approval ticket not found: ${input.approvalTicket}`);
    }
    assertExpectedVersion(existing.version, input.expectedVersion);
    if (!matchesApprovalStatus(existing.status, 'REJECTED') && !matchesApprovalStatus(existing.status, 'CANCELLED')) {
        throw new common_1.ConflictException(`Only rejected or cancelled approvals can be resubmitted. Current status: ${existing.status}`);
    }
    const supersededAt = new Date();
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
        }
    });
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
            status: client_1.ApprovalStatus.PENDING,
            version: 1,
            summary: toInputJsonValue({
                ...toJsonRecord(existing.summary),
                resubmittedFromTicket: existing.approvalTicket,
                resubmittedAt: new Date().toISOString(),
                resubmitReason: input.resubmitReason ?? null
            })
        }
    }));
    return {
        supersededTicket: existing.approvalTicket,
        approval: {
            ...toApprovalSnapshot(resubmitted),
            submitted: true,
            persisted: true
        }
    };
}
async function getGovernanceApprovalByTicket(prisma, approvalTicket) {
    const existing = (await prisma.governanceApproval.findUnique({
        where: {
            approvalTicket
        }
    }));
    if (!existing) {
        throw new common_1.NotFoundException(`Approval ticket not found: ${approvalTicket}`);
    }
    return {
        ...toApprovalSnapshot(existing),
        submitted: true,
        persisted: true
    };
}
async function markGovernanceApprovalExecuted(prisma, input) {
    const existing = (await prisma.governanceApproval.findUnique({
        where: { approvalTicket: input.approvalTicket }
    }));
    if (!existing) {
        throw new common_1.NotFoundException(`Approval ticket not found: ${input.approvalTicket}`);
    }
    assertExpectedVersion(existing.version, input.expectedVersion);
    if (!matchesApprovalStatus(existing.status, 'APPROVED')) {
        throw new common_1.ConflictException(`Only approved approvals can be executed. Current status: ${existing.status}`);
    }
    if (isGovernanceApprovalExecuted(existing.summary)) {
        throw new common_1.ConflictException(`Approval ticket has already been executed: ${input.approvalTicket}`);
    }
    const executedAt = new Date();
    const existingSummary = toJsonRecord(existing.summary);
    const attemptCount = getExecutionAttemptCount(existingSummary) + 1;
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
        }
    }));
    return {
        ...toApprovalSnapshot(persisted),
        submitted: true,
        persisted: true
    };
}
async function markGovernanceApprovalExecutionFailed(prisma, input) {
    const existing = (await prisma.governanceApproval.findUnique({
        where: { approvalTicket: input.approvalTicket }
    }));
    if (!existing) {
        throw new common_1.NotFoundException(`Approval ticket not found: ${input.approvalTicket}`);
    }
    assertExpectedVersion(existing.version, input.expectedVersion);
    if (!matchesApprovalStatus(existing.status, 'APPROVED')) {
        throw new common_1.ConflictException(`Only approved approvals can record execution failures. Current status: ${existing.status}`);
    }
    const failedAt = new Date();
    const existingSummary = toJsonRecord(existing.summary);
    const attemptCount = getExecutionAttemptCount(existingSummary) + 1;
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
        }
    }));
    return {
        ...toApprovalSnapshot(persisted),
        submitted: true,
        persisted: true
    };
}
function isGovernanceApprovalExecuted(summary) {
    const summaryRecord = toJsonRecord(summary);
    const executionRecord = toJsonRecord(summaryRecord?.execution);
    return typeof executionRecord?.executedAt === 'string';
}
function getExecutionAttemptCount(summary) {
    return typeof summary?.executionAttempts === 'number' ? summary.executionAttempts : 0;
}
function normalizeRequestedStatus(required, status) {
    if (!required) {
        return status ?? 'NOT_REQUIRED';
    }
    return status === 'APPROVED' || status === 'REJECTED' || status === 'CANCELLED' || status === 'SUPERSEDED'
        ? 'PENDING'
        : status ?? 'PENDING';
}
function resolveScopeType(scopeType) {
    if (!scopeType) {
        return client_1.FoundationScopeType.PLATFORM;
    }
    return typeof scopeType === 'string' ? client_1.FoundationScopeType[scopeType] ?? client_1.FoundationScopeType.PLATFORM : scopeType;
}
function buildInternalApprovalTicket(operation) {
    const prefix = operation.replace(/[^a-z0-9]/gi, '').toUpperCase().slice(0, 8) || 'APR';
    return `APR-${prefix}-${(0, node_crypto_1.randomUUID)().slice(0, 8).toUpperCase()}`;
}
function assertApprovalBinding(existing, input) {
    const expectedScopeType = resolveScopeType(input.scopeType);
    if (existing.operation !== input.operation ||
        existing.resourceType !== input.resourceType ||
        existing.resourceKey !== input.resourceKey ||
        existing.scopeType !== expectedScopeType ||
        existing.tenantId !== (input.tenantId ?? null) ||
        existing.brandId !== (input.brandId ?? null) ||
        existing.storeId !== (input.storeId ?? null)) {
        throw new common_1.BadRequestException('Approval ticket does not match the current governance request.');
    }
}
function assertRequestDigest(summary, requestDigest) {
    const summaryRecord = toJsonRecord(summary);
    const existingDigest = typeof summaryRecord?.requestDigest === 'string' ? summaryRecord.requestDigest : null;
    if (existingDigest && requestDigest && existingDigest !== requestDigest) {
        throw new common_1.BadRequestException('Approval ticket request payload does not match the original submitted request.');
    }
}
function toApprovalSnapshot(approval) {
    const summary = toJsonRecord(approval.summary);
    const execution = toExecutionSummary(summary);
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
    };
}
function toJsonRecord(value) {
    return value && typeof value === 'object' && !Array.isArray(value) ? value : null;
}
function toSerializableRecord(value) {
    return JSON.parse(stableStringify(value));
}
function buildRequestDigest(value) {
    return (0, node_crypto_1.createHash)('sha256').update(stableStringify(value)).digest('hex');
}
function stableStringify(value) {
    if (Array.isArray(value)) {
        return `[${value.map((item) => stableStringify(item)).join(',')}]`;
    }
    if (value && typeof value === 'object') {
        const entries = Object.entries(value).sort(([left], [right]) => left.localeCompare(right));
        return `{${entries.map(([key, item]) => `${JSON.stringify(key)}:${stableStringify(item)}`).join(',')}}`;
    }
    return JSON.stringify(value);
}
function parseDate(value) {
    if (!value) {
        return null;
    }
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
}
function toExecutionSummary(summary) {
    const execution = toJsonRecord(summary?.execution);
    const failure = toJsonRecord(summary?.executionFailure);
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
    };
}
function createApprovalMetrics() {
    return {
        total: 0,
        statuses: {
            NOT_REQUIRED: 0,
            PENDING: 0,
            APPROVED: 0,
            REJECTED: 0,
            CANCELLED: 0,
            SUPERSEDED: 0
        },
        execution: {
            executed: 0,
            pending: 0,
            withFailures: 0,
            byExecutionStatus: {},
            byFailureStatus: {}
        }
    };
}
function accumulateApprovalMetrics(metrics, approval) {
    metrics.total += 1;
    metrics.statuses[approval.status] += 1;
    if (approval.execution?.executed) {
        metrics.execution.executed += 1;
    }
    else {
        metrics.execution.pending += 1;
    }
    if (approval.execution?.executionStatus) {
        metrics.execution.byExecutionStatus[approval.execution.executionStatus] =
            (metrics.execution.byExecutionStatus[approval.execution.executionStatus] ?? 0) + 1;
    }
    if (approval.execution?.lastFailure?.failureStatus) {
        metrics.execution.withFailures += 1;
        metrics.execution.byFailureStatus[approval.execution.lastFailure.failureStatus] =
            (metrics.execution.byFailureStatus[approval.execution.lastFailure.failureStatus] ?? 0) + 1;
    }
    return metrics;
}
function getApprovalGroupValue(approval, groupBy) {
    switch (groupBy) {
        case 'operation':
            return approval.operation ?? null;
        case 'resourceType':
            return approval.resourceType ?? null;
        case 'status':
            return approval.status ?? null;
        case 'executionStatus':
            return approval.execution?.executionStatus ?? null;
        case 'failureStatus':
            return approval.execution?.lastFailure?.failureStatus ?? null;
        case 'requestedBy':
            return approval.requestedBy ?? null;
        default:
            return null;
    }
}
function normalizeGroupBy(value) {
    if (Array.isArray(value)) {
        return value;
    }
    if (typeof value === 'string') {
        return value
            .split(',')
            .map((item) => item.trim())
            .filter((item) => Boolean(item));
    }
    return [];
}
function matchesApprovalExecutionFilters(approval, input) {
    if (typeof input.executed === 'boolean' && Boolean(approval.execution?.executed) !== input.executed) {
        return false;
    }
    if (input.executionStatus && approval.execution?.executionStatus !== input.executionStatus) {
        return false;
    }
    const hasFailures = Boolean(approval.execution?.lastFailure);
    if (typeof input.hasFailures === 'boolean' && hasFailures !== input.hasFailures) {
        return false;
    }
    if (input.failureStatus && approval.execution?.lastFailure?.failureStatus !== input.failureStatus) {
        return false;
    }
    return true;
}
function matchesApprovalListFilters(approval, input) {
    if (input.operationIn?.length && (!approval.operation || !input.operationIn.includes(approval.operation))) {
        return false;
    }
    if (input.resourceTypeIn?.length && (!approval.resourceType || !input.resourceTypeIn.includes(approval.resourceType))) {
        return false;
    }
    return true;
}
function toPrismaApprovalStatus(status) {
    return status;
}
function matchesApprovalStatus(current, expected) {
    return String(current) === expected;
}
function assertExpectedVersion(currentVersion, expectedVersion) {
    if (expectedVersion == null) {
        return;
    }
    if (currentVersion !== expectedVersion) {
        throw new common_1.ConflictException(`Approval version mismatch. Expected ${expectedVersion}, current ${currentVersion}.`);
    }
}
function toInputJsonValue(value) {
    return JSON.parse(JSON.stringify(value ?? null));
}
//# sourceMappingURL=governance-approval.js.map