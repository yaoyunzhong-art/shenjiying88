"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const strict_1 = __importDefault(require("node:assert/strict"));
const node_test_1 = __importDefault(require("node:test"));
const client_1 = require("@prisma/client");
const governance_approval_service_1 = require("./governance-approval.service");
const runtime_governance_service_1 = require("../runtime-governance/runtime-governance.service");
function createApprovalRuntimeHarness() {
    const events = [];
    const audits = [];
    const rateLimitScopes = [];
    const approvals = [];
    const prisma = {
        domainEvent: {
            findMany: async ({ where } = {}) => events.filter((event) => (!where?.aggregateType || event.aggregateType === where.aggregateType) &&
                (!where?.aggregateId || event.aggregateId === where.aggregateId))
        },
        governanceApproval: {
            findUnique: async ({ where }) => {
                if (where.approvalTicket) {
                    return approvals.find((record) => record.approvalTicket === where.approvalTicket) ?? null;
                }
                if (where.id) {
                    return approvals.find((record) => record.id === where.id) ?? null;
                }
                return null;
            },
            create: async ({ data }) => {
                const now = new Date(Date.UTC(2026, 5, 12, 0, 0, approvals.length));
                const record = {
                    id: `apr_${approvals.length + 1}`,
                    approvalTicket: data.approvalTicket ?? null,
                    operation: data.operation,
                    resourceType: data.resourceType,
                    resourceKey: data.resourceKey,
                    scopeType: data.scopeType ?? client_1.FoundationScopeType.PLATFORM,
                    tenantId: data.tenantId ?? null,
                    brandId: data.brandId ?? null,
                    storeId: data.storeId ?? null,
                    required: data.required ?? false,
                    requestedBy: data.requestedBy ?? null,
                    status: data.status ?? client_1.ApprovalStatus.PENDING,
                    version: data.version ?? 1,
                    decisionNote: data.decisionNote ?? null,
                    decidedBy: null,
                    decidedAt: null,
                    summary: data.summary ?? null,
                    createdAt: now,
                    updatedAt: now
                };
                approvals.push(record);
                return record;
            },
            update: async ({ where, data }) => {
                const index = approvals.findIndex((record) => record.id === where.id);
                if (index === -1) {
                    throw new Error(`Approval ${where.id} not found`);
                }
                const existing = approvals[index];
                const updated = {
                    ...existing,
                    approvalTicket: data.approvalTicket ?? existing.approvalTicket,
                    operation: data.operation ?? existing.operation,
                    resourceType: data.resourceType ?? existing.resourceType,
                    resourceKey: data.resourceKey ?? existing.resourceKey,
                    status: data.status ?? existing.status,
                    version: data.version ?? existing.version,
                    decisionNote: data.decisionNote !== undefined ? data.decisionNote : existing.decisionNote,
                    decidedBy: data.decidedBy !== undefined ? data.decidedBy : existing.decidedBy,
                    decidedAt: data.decidedAt !== undefined ? data.decidedAt : existing.decidedAt,
                    summary: data.summary !== undefined ? data.summary : existing.summary,
                    updatedAt: new Date(Date.UTC(2026, 5, 12, 0, 1, index))
                };
                approvals[index] = updated;
                return updated;
            },
            findMany: async ({ where, take } = {}) => {
                let filtered = [...approvals];
                if (where?.approvalTicket) {
                    filtered = filtered.filter((record) => record.approvalTicket === where.approvalTicket);
                }
                if (where?.operation) {
                    filtered = filtered.filter((record) => record.operation === where.operation);
                }
                if (where?.resourceType) {
                    filtered = filtered.filter((record) => record.resourceType === where.resourceType);
                }
                if (where?.resourceKey) {
                    filtered = filtered.filter((record) => record.resourceKey === where.resourceKey);
                }
                if (where?.requestedBy) {
                    filtered = filtered.filter((record) => record.requestedBy === where.requestedBy);
                }
                if (where?.decidedBy) {
                    filtered = filtered.filter((record) => record.decidedBy === where.decidedBy);
                }
                if (where?.tenantId) {
                    filtered = filtered.filter((record) => record.tenantId === where.tenantId);
                }
                if (where?.status) {
                    filtered = filtered.filter((record) => record.status === where.status);
                }
                return typeof take === 'number' ? filtered.slice(0, take) : filtered;
            }
        }
    };
    const integrationOrchestrationService = {
        publishEvent: async (eventType, payload, meta) => {
            const duplicate = events.some((event) => event.aggregateId === meta.aggregateId && event.idempotencyKey === (meta.idempotencyKey ?? null));
            if (duplicate) {
                return {
                    status: 'duplicate',
                    eventId: `${meta.aggregateId}:duplicate`
                };
            }
            events.push({
                id: `evt_${events.length + 1}`,
                eventType,
                aggregateType: 'runtime-governance',
                aggregateId: meta.aggregateId,
                idempotencyKey: meta.idempotencyKey ?? null,
                payload,
                createdAt: new Date(Date.UTC(2026, 5, 12, 0, 0, events.length))
            });
            return {
                status: 'accepted',
                eventId: `evt_${events.length}`
            };
        }
    };
    const trustGovernanceService = {
        evaluateRateLimit: async ({ scopeKey, limit, blockSeconds, windowSeconds }) => {
            rateLimitScopes.push(scopeKey);
            return {
                scopeKey,
                limit,
                blockSeconds,
                windowSeconds,
                allowed: true,
                remaining: limit - 1,
                retryAfterSeconds: 0
            };
        },
        recordAudit: async (eventType, details, context) => {
            audits.push({ eventType, details, context });
            return {
                auditId: `audit_${audits.length}`,
                eventType
            };
        }
    };
    const runtimeGovernanceService = new runtime_governance_service_1.RuntimeGovernanceService(prisma, integrationOrchestrationService, trustGovernanceService);
    return {
        runtimeGovernanceService,
        governanceApprovalService: new governance_approval_service_1.GovernanceApprovalService(prisma, runtimeGovernanceService),
        audits,
        approvals,
        rateLimitScopes
    };
}
(0, node_test_1.default)('governance-approval service auto resumes approved runtime replay', async () => {
    const { runtimeGovernanceService, governanceApprovalService, audits } = createApprovalRuntimeHarness();
    const submitted = await runtimeGovernanceService.submitAction({
        app: 'admin-web',
        action: 'runtime-replay',
        nextStep: 'PROCEED',
        riskLevel: 'high',
        requestEndpoint: '/api/v1/foundation/runtime-governance/actions',
        payload: { sourceReceiptCode: 'ADMIN-WORKBENCH-RUNTIME-REPLAY-APPROVAL-001' },
        payloadSummary: '{"sourceReceiptCode":"ADMIN-WORKBENCH-RUNTIME-REPLAY-APPROVAL-001"}',
        recommendedAction: 'FOLLOW_SUBMIT_CALLBACK',
        handlerName: 'admin-runtime-replay-handler',
        idempotencyKey: 'admin-web:runtime-replay-auto-resume-001',
        actorId: 'ops.admin-web',
        tenantId: 'tenant-admin'
    });
    const pendingApproval = await runtimeGovernanceService.replayAction(submitted.receiptCode, {
        ledgerKey: submitted.ledger.ledgerKey,
        requestedFrom: 'ADMIN_WEB_RUNTIME',
        ticketCode: submitted.ticket.ticketCode,
        idempotencyKey: 'admin-web:runtime-replay-auto-resume-001:replay',
        actorId: 'ops.admin-web',
        tenantId: 'tenant-admin'
    });
    strict_1.default.equal(pendingApproval.approval?.status, 'PENDING');
    const decided = await governanceApprovalService.decideApproval({
        approvalTicket: pendingApproval.approval?.ticket ?? '',
        decidedBy: 'ops.approver',
        status: 'APPROVED'
    });
    strict_1.default.equal(decided.status, 'APPROVED');
    strict_1.default.equal(decided.execution?.executed, true);
    strict_1.default.equal(decided.execution?.executionStatus, 'runtime-replay-scheduled');
    const replayed = await runtimeGovernanceService.getActionReceipt(submitted.receiptCode);
    strict_1.default.equal(replayed.state, 'replay-scheduled');
    strict_1.default.equal(replayed.approval?.status, 'APPROVED');
    strict_1.default.equal(replayed.approval?.execution?.executed, true);
    strict_1.default.deepEqual(audits.map((item) => item.eventType), [
        'foundation.runtime-governance.submit',
        'foundation.runtime-governance.replay.approval-required',
        'foundation.runtime-governance.replay'
    ]);
});
(0, node_test_1.default)('governance-approval service does not auto resume rejected runtime replay', async () => {
    const { runtimeGovernanceService, governanceApprovalService } = createApprovalRuntimeHarness();
    const submitted = await runtimeGovernanceService.submitAction({
        app: 'admin-web',
        action: 'runtime-replay',
        nextStep: 'PROCEED',
        riskLevel: 'high',
        requestEndpoint: '/api/v1/foundation/runtime-governance/actions',
        payload: { sourceReceiptCode: 'ADMIN-WORKBENCH-RUNTIME-REPLAY-APPROVAL-REJECT-001' },
        payloadSummary: '{"sourceReceiptCode":"ADMIN-WORKBENCH-RUNTIME-REPLAY-APPROVAL-REJECT-001"}',
        recommendedAction: 'FOLLOW_SUBMIT_CALLBACK',
        handlerName: 'admin-runtime-replay-handler',
        idempotencyKey: 'admin-web:runtime-replay-auto-resume-002',
        actorId: 'ops.admin-web',
        tenantId: 'tenant-admin'
    });
    const pendingApproval = await runtimeGovernanceService.replayAction(submitted.receiptCode, {
        ledgerKey: submitted.ledger.ledgerKey,
        requestedFrom: 'ADMIN_WEB_RUNTIME',
        ticketCode: submitted.ticket.ticketCode,
        idempotencyKey: 'admin-web:runtime-replay-auto-resume-002:replay',
        actorId: 'ops.admin-web',
        tenantId: 'tenant-admin'
    });
    const decided = await governanceApprovalService.decideApproval({
        approvalTicket: pendingApproval.approval?.ticket ?? '',
        decidedBy: 'ops.approver',
        status: 'REJECTED'
    });
    strict_1.default.equal(decided.status, 'REJECTED');
    strict_1.default.equal(decided.execution?.executed, false);
    const current = await runtimeGovernanceService.getActionReceipt(submitted.receiptCode);
    strict_1.default.equal(current.state, 'submitted');
    strict_1.default.equal(current.approval?.status, 'PENDING');
});
//# sourceMappingURL=governance-approval.service.test.js.map