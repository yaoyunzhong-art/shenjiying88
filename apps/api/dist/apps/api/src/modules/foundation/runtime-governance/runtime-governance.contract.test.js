"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const strict_1 = __importDefault(require("node:assert/strict"));
const node_test_1 = __importDefault(require("node:test"));
const client_1 = require("@prisma/client");
const governance_approval_1 = require("../governance-approval/governance-approval");
const runtime_governance_service_1 = require("./runtime-governance.service");
function createRuntimeGovernanceHarness() {
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
        publishEvent: async (eventType, payload, options) => {
            const existing = options?.idempotencyKey
                ? events.find((event) => event.idempotencyKey === options.idempotencyKey)
                : null;
            if (existing) {
                return {
                    status: 'duplicate',
                    envelope: null,
                    persistedEventId: existing.id
                };
            }
            const event = {
                id: `evt_${events.length + 1}`,
                eventType,
                aggregateType: 'runtime-governance',
                aggregateId: options?.aggregateId ?? `aggregate-${events.length + 1}`,
                idempotencyKey: options?.idempotencyKey ?? null,
                payload,
                createdAt: new Date(Date.UTC(2026, 5, 12, 0, 0, events.length))
            };
            events.push(event);
            return {
                status: 'accepted',
                envelope: null,
                persistedEventId: event.id
            };
        }
    };
    const trustGovernanceService = {
        evaluateRateLimit: async ({ scopeKey }) => ({
            ...(rateLimitScopes.push(scopeKey), {}),
            allowed: true,
            scopeKey,
            limit: 12,
            remaining: 11,
            retryAfterSeconds: 0
        }),
        recordAudit: async (eventType, details, context) => {
            audits.push({ eventType, details, context });
            return {
                auditId: `audit_${audits.length}`,
                eventType
            };
        }
    };
    return {
        service: new runtime_governance_service_1.RuntimeGovernanceService(prisma, integrationOrchestrationService, trustGovernanceService),
        audits,
        rateLimitScopes,
        prisma
    };
}
(0, node_test_1.default)('contract: runtime governance service persists submit -> sync -> callback -> replay chain', async () => {
    const { service, audits, rateLimitScopes } = createRuntimeGovernanceHarness();
    const submitted = await service.submitAction({
        app: 'miniapp',
        action: 'booking-submit',
        nextStep: 'PROCEED',
        riskLevel: 'medium',
        requestEndpoint: '/api/v1/storefront/bookings',
        payload: { bookingSlot: '2026-06-12T10:00:00+08:00' },
        payloadSummary: '{"bookingSlot":"2026-06-12T10:00:00+08:00"}',
        recommendedAction: 'FOLLOW_SUBMIT_CALLBACK',
        handlerName: 'miniapp-booking-submit-handler',
        idempotencyKey: 'miniapp-sync:booking-submit-001',
        actorId: 'ops.runtime',
        tenantId: 'tenant-runtime'
    });
    strict_1.default.equal(submitted.state, 'submitted');
    strict_1.default.equal(submitted.ticket.status, 'ready-for-handler');
    strict_1.default.equal(submitted.sync.ready, true);
    const synced = await service.syncAction(submitted.receiptCode, {
        handlerName: 'miniapp-booking-submit-handler',
        ticketCode: submitted.ticket.ticketCode,
        idempotencyKey: 'miniapp-handler-sync:booking-submit-001',
        actorId: 'ops.runtime',
        tenantId: 'tenant-runtime'
    });
    strict_1.default.equal(synced.callback.callbackStatus, 'awaiting-callback');
    const callbackRecorded = await service.recordCallback(submitted.receiptCode, {
        callbackStatus: 'callback-recorded',
        ackToken: `${submitted.receiptCode}-ACK`,
        lastEvent: 'HANDLER_COMPLETED',
        summary: 'handler completed',
        idempotencyKey: 'miniapp-callback:booking-submit-001',
        actorId: 'ops.runtime',
        tenantId: 'tenant-runtime'
    });
    strict_1.default.equal(callbackRecorded.state, 'callback-recorded');
    strict_1.default.equal(callbackRecorded.ledger.replayable, true);
    const replayed = await service.replayAction(submitted.receiptCode, {
        ledgerKey: callbackRecorded.ledger.ledgerKey,
        requestedFrom: 'MINIAPP_RUNTIME',
        ticketCode: callbackRecorded.ticket.ticketCode,
        idempotencyKey: 'miniapp-replay:booking-submit-001',
        actorId: 'ops.runtime',
        tenantId: 'tenant-runtime'
    });
    strict_1.default.equal(replayed.state, 'replay-scheduled');
    strict_1.default.equal(replayed.retry.currentAttempt, 1);
    strict_1.default.equal(replayed.retry.nextBackoffMs, 4000);
    strict_1.default.equal(replayed.retry.escalationAction, 'WAIT_CALLBACK');
    strict_1.default.equal(replayed.events.length, 4);
    strict_1.default.deepEqual(rateLimitScopes, ['miniapp:booking-submit:tenant-runtime']);
    strict_1.default.deepEqual(audits.map((item) => item.eventType), [
        'foundation.runtime-governance.submit',
        'foundation.runtime-governance.sync',
        'foundation.runtime-governance.callback',
        'foundation.runtime-governance.replay'
    ]);
    strict_1.default.deepEqual(audits.map((item) => item.context?.actorId), ['ops.runtime', 'ops.runtime', 'ops.runtime', 'ops.runtime']);
    strict_1.default.deepEqual(audits.map((item) => item.context?.tenantId), ['tenant-runtime', 'tenant-runtime', 'tenant-runtime', 'tenant-runtime']);
});
(0, node_test_1.default)('contract: runtime governance service keeps challenge replay policy on shared source', async () => {
    const { service } = createRuntimeGovernanceHarness();
    const challenged = await service.submitAction({
        app: 'app',
        action: 'payment-submit',
        nextStep: 'CHALLENGE',
        riskLevel: 'high',
        requestEndpoint: '/api/v1/app/payments/submit',
        payload: { orderNo: 'PAY-20260612-0001' },
        payloadSummary: '{"orderNo":"PAY-20260612-0001"}',
        recommendedAction: 'COMPLETE_CHALLENGE',
        handlerName: 'native-payment-submit-handler',
        idempotencyKey: 'app-submit:payment-submit-challenge',
        actorId: 'ops.risk',
        tenantId: 'tenant-runtime'
    });
    strict_1.default.equal(challenged.retry.maxAttempts, 2);
    strict_1.default.equal(challenged.retry.nextBackoffMs, 5000);
    strict_1.default.equal(challenged.retry.escalationAction, 'REFRESH_TICKET');
});
(0, node_test_1.default)('contract: runtime governance operations overview applies callback stall timeout by tenant', async () => {
    const { service } = createRuntimeGovernanceHarness();
    const tenantReceipt = await service.submitAction({
        app: 'miniapp',
        action: 'booking-submit',
        nextStep: 'PROCEED',
        requestEndpoint: '/api/v1/storefront/bookings',
        payload: { bookingSlot: '2026-06-12T10:00:00+08:00' },
        payloadSummary: '{"bookingSlot":"2026-06-12T10:00:00+08:00"}',
        riskLevel: 'high',
        recommendedAction: 'FOLLOW_SUBMIT_CALLBACK',
        handlerName: 'miniapp-booking-submit-handler',
        idempotencyKey: 'miniapp-sync:booking-submit-overview',
        actorId: 'ops.runtime',
        tenantId: 'tenant-runtime'
    });
    await service.syncAction(tenantReceipt.receiptCode, {
        handlerName: 'miniapp-booking-submit-handler',
        ticketCode: tenantReceipt.ticket.ticketCode,
        idempotencyKey: 'miniapp-handler-sync:booking-submit-overview',
        actorId: 'ops.runtime',
        tenantId: 'tenant-runtime'
    });
    await service.submitAction({
        app: 'app',
        action: 'member-login',
        nextStep: 'PROCEED',
        requestEndpoint: '/api/v1/app/member/session',
        payload: { memberId: 'member-002' },
        payloadSummary: '{"memberId":"member-002"}',
        riskLevel: 'medium',
        recommendedAction: 'FOLLOW_SUBMIT_CALLBACK',
        handlerName: 'native-member-session-handler',
        idempotencyKey: 'app-sync:member-login-overview',
        actorId: 'ops.other',
        tenantId: 'tenant-other'
    });
    const freshOverview = await service.getOperationsOverview('tenant-runtime', new Date(Date.UTC(2026, 5, 12, 0, 5, 0)));
    const stalledOverview = await service.getOperationsOverview('tenant-runtime', new Date(Date.UTC(2026, 5, 12, 0, 12, 0)));
    strict_1.default.equal(freshOverview.summary.backlog, 1);
    strict_1.default.equal(freshOverview.summary.stalledCallbacks, 0);
    strict_1.default.equal(stalledOverview.summary.backlog, 1);
    strict_1.default.equal(stalledOverview.summary.stalledCallbacks, 1);
    strict_1.default.equal(stalledOverview.summary.highRiskBacklog, 1);
    strict_1.default.equal(stalledOverview.summary.blockedActions, 0);
    strict_1.default.equal(stalledOverview.receipts.length, 1);
    strict_1.default.equal(stalledOverview.receipts[0]?.receiptCode, tenantReceipt.receiptCode);
    strict_1.default.equal(stalledOverview.stalledReceipts.length, 1);
    strict_1.default.deepEqual(stalledOverview.stalledReceipts[0] && {
        receiptCode: stalledOverview.stalledReceipts[0].receiptCode,
        escalationAction: stalledOverview.stalledReceipts[0].escalationAction,
        riskLevel: stalledOverview.stalledReceipts[0].riskLevel
    }, {
        receiptCode: tenantReceipt.receiptCode,
        escalationAction: 'SCHEDULE_REPLAY',
        riskLevel: 'high'
    });
});
(0, node_test_1.default)('contract: runtime governance stalled callback keeps original wait window after duplicate sync event', async () => {
    const { service } = createRuntimeGovernanceHarness();
    const receipt = await service.submitAction({
        app: 'miniapp',
        action: 'booking-submit',
        nextStep: 'PROCEED',
        requestEndpoint: '/api/v1/storefront/bookings',
        payload: { bookingSlot: '2026-06-12T10:30:00+08:00' },
        payloadSummary: '{"bookingSlot":"2026-06-12T10:30:00+08:00"}',
        riskLevel: 'high',
        recommendedAction: 'FOLLOW_SUBMIT_CALLBACK',
        handlerName: 'miniapp-booking-submit-handler',
        idempotencyKey: 'miniapp-sync:booking-submit-duplicate-window',
        actorId: 'ops.runtime',
        tenantId: 'tenant-runtime'
    });
    await service.syncAction(receipt.receiptCode, {
        handlerName: 'miniapp-booking-submit-handler',
        ticketCode: receipt.ticket.ticketCode,
        idempotencyKey: 'miniapp-handler-sync:booking-submit-duplicate-window',
        actorId: 'ops.runtime',
        tenantId: 'tenant-runtime'
    });
    await service.syncAction(receipt.receiptCode, {
        handlerName: 'miniapp-booking-submit-handler',
        ticketCode: receipt.ticket.ticketCode,
        idempotencyKey: 'miniapp-handler-sync:booking-submit-duplicate-window',
        actorId: 'ops.runtime',
        tenantId: 'tenant-runtime'
    });
    const overview = await service.getOperationsOverview('tenant-runtime', new Date(Date.UTC(2026, 5, 12, 0, 12, 0)));
    strict_1.default.equal(overview.summary.backlog, 1);
    strict_1.default.equal(overview.summary.stalledCallbacks, 1);
    strict_1.default.equal(overview.stalledReceipts.length, 1);
    strict_1.default.equal(overview.stalledReceipts[0]?.receiptCode, receipt.receiptCode);
    strict_1.default.equal(overview.stalledReceipts[0]?.escalationAction, 'SCHEDULE_REPLAY');
});
(0, node_test_1.default)('contract: runtime governance service supports batch replay with per-receipt results', async () => {
    const { service } = createRuntimeGovernanceHarness();
    const submitted = await service.submitAction({
        app: 'admin-web',
        action: 'runtime-replay',
        nextStep: 'PROCEED',
        riskLevel: 'medium',
        requestEndpoint: '/api/v1/foundation/runtime-governance/actions',
        payload: { sourceReceiptCode: 'SRC-001' },
        payloadSummary: '{"sourceReceiptCode":"SRC-001"}',
        recommendedAction: 'FOLLOW_SUBMIT_CALLBACK',
        handlerName: 'admin-runtime-replay-handler',
        idempotencyKey: 'admin-runtime:submit:001',
        actorId: 'ops.runtime',
        tenantId: 'tenant-runtime'
    });
    await service.syncAction(submitted.receiptCode, {
        handlerName: 'admin-runtime-replay-handler',
        ticketCode: submitted.ticket.ticketCode,
        idempotencyKey: 'admin-runtime:sync:001',
        actorId: 'ops.runtime',
        tenantId: 'tenant-runtime'
    });
    const callbackRecorded = await service.recordCallback(submitted.receiptCode, {
        callbackStatus: 'callback-recorded',
        ackToken: 'admin-runtime-ack',
        lastEvent: 'HANDLER_COMPLETED',
        summary: 'ready for replay',
        idempotencyKey: 'admin-runtime:callback:001',
        actorId: 'ops.runtime',
        tenantId: 'tenant-runtime'
    });
    const replayed = await service.batchReplayActions({
        items: [
            {
                receiptCode: submitted.receiptCode,
                ledgerKey: callbackRecorded.ledger.ledgerKey,
                requestedFrom: 'ADMIN_WEB_RUNTIME',
                ticketCode: callbackRecorded.ticket.ticketCode,
                idempotencyKey: 'admin-runtime:batch-replay:001',
                actorId: 'ops.runtime',
                tenantId: 'tenant-runtime'
            }
        ]
    });
    strict_1.default.equal(replayed.total, 1);
    strict_1.default.equal(replayed.items[0]?.receiptCode, submitted.receiptCode);
    strict_1.default.equal(replayed.items[0]?.receipt.state, 'replay-scheduled');
});
(0, node_test_1.default)('contract: runtime governance overview applies batch-replay and governance-audit filters', async () => {
    const { service } = createRuntimeGovernanceHarness();
    const replayable = await service.submitAction({
        app: 'admin-web',
        action: 'runtime-replay',
        nextStep: 'PROCEED',
        riskLevel: 'high',
        requestEndpoint: '/api/v1/foundation/runtime-governance/actions',
        payload: { sourceReceiptCode: 'SRC-REPLAY-001' },
        payloadSummary: '{"sourceReceiptCode":"SRC-REPLAY-001"}',
        recommendedAction: 'FOLLOW_SUBMIT_CALLBACK',
        handlerName: 'admin-runtime-replay-handler',
        idempotencyKey: 'admin-runtime:filter:submit',
        actorId: 'ops.runtime',
        tenantId: 'tenant-runtime'
    });
    await service.syncAction(replayable.receiptCode, {
        handlerName: 'admin-runtime-replay-handler',
        ticketCode: replayable.ticket.ticketCode,
        idempotencyKey: 'admin-runtime:filter:sync',
        actorId: 'ops.runtime',
        tenantId: 'tenant-runtime'
    });
    await service.recordCallback(replayable.receiptCode, {
        callbackStatus: 'callback-recorded',
        ackToken: 'admin-runtime:filter:ack',
        lastEvent: 'HANDLER_COMPLETED',
        summary: 'ready for replay',
        idempotencyKey: 'admin-runtime:filter:callback',
        actorId: 'ops.runtime',
        tenantId: 'tenant-runtime'
    });
    await service.submitAction({
        app: 'tob-web',
        action: 'member-login',
        nextStep: 'CHALLENGE',
        riskLevel: 'medium',
        requestEndpoint: '/api/v1/members/session/challenge',
        payload: { memberId: 'member-001' },
        payloadSummary: '{"memberId":"member-001"}',
        recommendedAction: 'COMPLETE_CHALLENGE',
        handlerName: 'tob-member-login-handler',
        idempotencyKey: 'tob-runtime:filter:submit',
        actorId: 'ops.runtime',
        tenantId: 'tenant-runtime'
    });
    const batchReplay = await service.getOperationsOverview('tenant-runtime', new Date(Date.UTC(2026, 5, 12, 0, 12, 0)), {
        focus: 'batch-replay',
        replayable: true
    });
    const governanceAudit = await service.getOperationsOverview('tenant-runtime', new Date(Date.UTC(2026, 5, 12, 0, 12, 0)), {
        focus: 'governance-audit'
    });
    strict_1.default.equal(batchReplay.summary.backlog, 1);
    strict_1.default.equal(batchReplay.batchSummary.replayableReceipts, 1);
    strict_1.default.equal(batchReplay.receipts[0]?.receiptCode, replayable.receiptCode);
    strict_1.default.equal(governanceAudit.batchSummary.governanceAuditReceipts, 1);
    strict_1.default.equal(governanceAudit.receipts.length, 1);
});
(0, node_test_1.default)('contract: runtime governance submit returns stable receipt on duplicate idempotency key', async () => {
    const { service, audits } = createRuntimeGovernanceHarness();
    const first = await service.submitAction({
        app: 'app',
        action: 'payment-submit',
        nextStep: 'CHALLENGE',
        riskLevel: 'high',
        requestEndpoint: '/api/v1/app/payments/submit',
        payload: { orderNo: 'PAY-20260612-0001' },
        payloadSummary: '{"orderNo":"PAY-20260612-0001"}',
        recommendedAction: 'COMPLETE_CHALLENGE',
        handlerName: 'native-payment-submit-handler',
        idempotencyKey: 'app-sync:payment-submit-001'
    });
    const duplicate = await service.submitAction({
        app: 'app',
        action: 'payment-submit',
        nextStep: 'CHALLENGE',
        riskLevel: 'high',
        requestEndpoint: '/api/v1/app/payments/submit',
        payload: { orderNo: 'PAY-20260612-0001' },
        payloadSummary: '{"orderNo":"PAY-20260612-0001"}',
        recommendedAction: 'COMPLETE_CHALLENGE',
        handlerName: 'native-payment-submit-handler',
        idempotencyKey: 'app-sync:payment-submit-001'
    });
    strict_1.default.equal(duplicate.receiptCode, first.receiptCode);
    strict_1.default.equal(duplicate.events.length, 2);
    strict_1.default.equal(duplicate.state, 'challenge-issued');
    strict_1.default.equal(duplicate.events[1]?.status, 'duplicate');
    strict_1.default.equal(duplicate.events[1]?.eventType, 'runtime-governance.action.duplicate');
    strict_1.default.deepEqual(audits.map((item) => item.details.publicationStatus), ['accepted', 'duplicate']);
});
(0, node_test_1.default)('contract: runtime governance callback keeps duplicate audit and timeline visibility', async () => {
    const { service, audits } = createRuntimeGovernanceHarness();
    const submitted = await service.submitAction({
        app: 'miniapp',
        action: 'booking-submit',
        nextStep: 'PROCEED',
        riskLevel: 'medium',
        requestEndpoint: '/api/v1/storefront/bookings',
        payload: { bookingSlot: '2026-06-12T10:00:00+08:00' },
        payloadSummary: '{"bookingSlot":"2026-06-12T10:00:00+08:00"}',
        recommendedAction: 'FOLLOW_SUBMIT_CALLBACK',
        handlerName: 'miniapp-booking-submit-handler',
        idempotencyKey: 'miniapp-submit:callback-duplicate-001',
        actorId: 'ops.runtime',
        tenantId: 'tenant-runtime'
    });
    await service.recordCallback(submitted.receiptCode, {
        callbackStatus: 'callback-recorded',
        ackToken: `${submitted.receiptCode}-ACK`,
        lastEvent: 'HANDLER_COMPLETED',
        summary: 'handler completed',
        idempotencyKey: 'miniapp-callback:duplicate-001',
        actorId: 'ops.runtime',
        tenantId: 'tenant-runtime'
    });
    const duplicateCallback = await service.recordCallback(submitted.receiptCode, {
        callbackStatus: 'callback-recorded',
        ackToken: `${submitted.receiptCode}-ACK`,
        lastEvent: 'HANDLER_COMPLETED',
        summary: 'handler completed',
        idempotencyKey: 'miniapp-callback:duplicate-001',
        actorId: 'ops.runtime',
        tenantId: 'tenant-runtime'
    });
    const callbackAudits = audits.filter((item) => item.eventType === 'foundation.runtime-governance.callback');
    strict_1.default.equal(duplicateCallback.events.length, 3);
    strict_1.default.equal(duplicateCallback.events[2]?.status, 'duplicate');
    strict_1.default.equal(duplicateCallback.events[2]?.eventType, 'runtime-governance.handler.callback.duplicate');
    strict_1.default.deepEqual(callbackAudits.map((item) => item.details.publicationStatus), ['accepted', 'duplicate']);
});
(0, node_test_1.default)('contract: runtime governance service supports admin-web submit and replay source', async () => {
    const { service, audits, rateLimitScopes } = createRuntimeGovernanceHarness();
    const submitted = await service.submitAction({
        app: 'admin-web',
        action: 'runtime-replay',
        nextStep: 'PROCEED',
        riskLevel: 'medium',
        requestEndpoint: '/api/v1/foundation/runtime-governance/actions',
        payload: { sourceReceiptCode: 'ADMIN-WORKBENCH-RUNTIME-REPLAY-001' },
        payloadSummary: '{"sourceReceiptCode":"ADMIN-WORKBENCH-RUNTIME-REPLAY-001"}',
        recommendedAction: 'FOLLOW_SUBMIT_CALLBACK',
        handlerName: 'admin-runtime-replay-handler',
        idempotencyKey: 'admin-web:runtime-replay-001',
        actorId: 'ops.admin-web',
        tenantId: 'tenant-admin'
    });
    strict_1.default.equal(submitted.app, 'admin-web');
    strict_1.default.equal(submitted.action, 'runtime-replay');
    strict_1.default.equal(submitted.ledger.replayable, true);
    const replayed = await service.replayAction(submitted.receiptCode, {
        ledgerKey: submitted.ledger.ledgerKey,
        requestedFrom: 'ADMIN_WEB_RUNTIME',
        ticketCode: submitted.ticket.ticketCode,
        idempotencyKey: 'admin-web:runtime-replay-001:replay',
        actorId: 'ops.admin-web',
        tenantId: 'tenant-admin'
    });
    strict_1.default.equal(replayed.state, 'replay-scheduled');
    strict_1.default.equal(replayed.ledger.summary.includes('ADMIN_WEB_RUNTIME'), true);
    strict_1.default.deepEqual(rateLimitScopes, ['admin-web:runtime-replay:tenant-admin']);
    strict_1.default.deepEqual(audits.map((item) => item.eventType), ['foundation.runtime-governance.submit', 'foundation.runtime-governance.replay']);
});
(0, node_test_1.default)('contract: high-risk runtime replay requires approval before execution', async () => {
    const { service, prisma, audits } = createRuntimeGovernanceHarness();
    const submitted = await service.submitAction({
        app: 'admin-web',
        action: 'runtime-replay',
        nextStep: 'PROCEED',
        riskLevel: 'high',
        requestEndpoint: '/api/v1/foundation/runtime-governance/actions',
        payload: { sourceReceiptCode: 'ADMIN-WORKBENCH-RUNTIME-REPLAY-APPROVAL-001' },
        payloadSummary: '{"sourceReceiptCode":"ADMIN-WORKBENCH-RUNTIME-REPLAY-APPROVAL-001"}',
        recommendedAction: 'FOLLOW_SUBMIT_CALLBACK',
        handlerName: 'admin-runtime-replay-handler',
        idempotencyKey: 'admin-web:runtime-replay-approval-001',
        actorId: 'ops.admin-web',
        tenantId: 'tenant-admin'
    });
    const pendingApproval = await service.replayAction(submitted.receiptCode, {
        ledgerKey: submitted.ledger.ledgerKey,
        requestedFrom: 'ADMIN_WEB_RUNTIME',
        ticketCode: submitted.ticket.ticketCode,
        idempotencyKey: 'admin-web:runtime-replay-approval-001:replay',
        actorId: 'ops.admin-web',
        tenantId: 'tenant-admin'
    });
    strict_1.default.equal(pendingApproval.state, 'submitted');
    strict_1.default.equal(pendingApproval.approval?.status, 'PENDING');
    strict_1.default.equal(pendingApproval.approval?.required, true);
    strict_1.default.equal(typeof pendingApproval.approval?.ticket, 'string');
    await (0, governance_approval_1.decideGovernanceApproval)(prisma, {
        approvalTicket: pendingApproval.approval?.ticket ?? '',
        decidedBy: 'ops.approver',
        status: 'APPROVED'
    });
    const replayed = await service.replayAction(submitted.receiptCode, {
        ledgerKey: submitted.ledger.ledgerKey,
        requestedFrom: 'ADMIN_WEB_RUNTIME',
        ticketCode: submitted.ticket.ticketCode,
        idempotencyKey: 'admin-web:runtime-replay-approval-001:replay-approved',
        actorId: 'ops.admin-web',
        tenantId: 'tenant-admin'
    });
    strict_1.default.equal(replayed.state, 'replay-scheduled');
    strict_1.default.equal(replayed.approval?.status, 'APPROVED');
    strict_1.default.equal(replayed.approval?.execution?.executed, true);
    strict_1.default.equal(replayed.approval?.execution?.executionStatus, 'runtime-replay-scheduled');
    strict_1.default.deepEqual(audits.map((item) => item.eventType), [
        'foundation.runtime-governance.submit',
        'foundation.runtime-governance.replay.approval-required',
        'foundation.runtime-governance.replay'
    ]);
});
(0, node_test_1.default)('contract: high-risk runtime replay approval keeps member operations context', async () => {
    const { service } = createRuntimeGovernanceHarness();
    const submitted = await service.submitAction({
        app: 'admin-web',
        action: 'runtime-replay',
        nextStep: 'PROCEED',
        riskLevel: 'high',
        requestEndpoint: '/api/v1/members/persistent/member-001/operations-receipts/ops-exec-001/runtime',
        payload: {
            memberId: 'member-001',
            taskId: 'ops-task-001',
            actionCode: 'assign-vip-concierge',
            executionLane: 'member-crm',
            targetType: 'crm-follow-up',
            targetId: 'crm-001',
            sourceOrderId: 'order-001',
            sourcePaymentId: 'payment-001'
        },
        payloadSummary: '{"memberId":"member-001","taskId":"ops-task-001","actionCode":"assign-vip-concierge","executionLane":"member-crm","targetType":"crm-follow-up","targetId":"crm-001","sourceOrderId":"order-001","sourcePaymentId":"payment-001"}',
        recommendedAction: 'FOLLOW_SUBMIT_CALLBACK',
        handlerName: 'member-operations-runtime-handler',
        idempotencyKey: 'admin-web:runtime-replay-member-approval-001',
        actorId: 'ops.admin-web',
        tenantId: 'tenant-admin'
    });
    const pendingApproval = await service.replayAction(submitted.receiptCode, {
        ledgerKey: submitted.ledger.ledgerKey,
        requestedFrom: 'ADMIN_WEB_RUNTIME',
        ticketCode: submitted.ticket.ticketCode,
        idempotencyKey: 'admin-web:runtime-replay-member-approval-001:replay',
        actorId: 'ops.admin-web',
        tenantId: 'tenant-admin'
    });
    strict_1.default.equal(pendingApproval.approval?.status, 'PENDING');
    strict_1.default.equal(pendingApproval.approval?.summary?.memberId, 'member-001');
    strict_1.default.equal(pendingApproval.approval?.summary?.executionId, 'ops-exec-001');
    strict_1.default.equal(pendingApproval.approval?.summary?.taskId, 'ops-task-001');
    strict_1.default.equal(pendingApproval.approval?.summary?.actionCode, 'assign-vip-concierge');
    strict_1.default.equal(pendingApproval.approval?.summary?.sourceOrderId, 'order-001');
});
(0, node_test_1.default)('contract: runtime governance service supports tob-web and storefront-web submit sources', async () => {
    const { service } = createRuntimeGovernanceHarness();
    const tobReceipt = await service.submitAction({
        app: 'tob-web',
        action: 'member-login',
        nextStep: 'CHALLENGE',
        riskLevel: 'medium',
        requestEndpoint: '/api/v1/members/session/challenge',
        payload: { loginChannel: 'tenant-portal' },
        payloadSummary: '{"loginChannel":"tenant-portal"}',
        recommendedAction: 'COMPLETE_CHALLENGE',
        handlerName: 'tob-member-login-handler',
        idempotencyKey: 'tob-web:member-login-001',
        actorId: 'ops.tob-web',
        tenantId: 'tenant-tob'
    });
    const storefrontReceipt = await service.submitAction({
        app: 'storefront-web',
        action: 'booking-submit',
        nextStep: 'PROCEED',
        riskLevel: 'high',
        requestEndpoint: '/api/v1/storefront/bookings',
        payload: { bookingCode: 'STORE-BOOKING-001' },
        payloadSummary: '{"bookingCode":"STORE-BOOKING-001"}',
        recommendedAction: 'FOLLOW_SUBMIT_CALLBACK',
        handlerName: 'storefront-booking-submit-handler',
        idempotencyKey: 'storefront-web:booking-submit-001',
        actorId: 'ops.storefront-web',
        tenantId: 'tenant-storefront',
        brandId: 'brand-demo',
        storeId: 'store-001'
    });
    strict_1.default.equal(tobReceipt.app, 'tob-web');
    strict_1.default.equal(tobReceipt.state, 'challenge-issued');
    strict_1.default.equal(storefrontReceipt.app, 'storefront-web');
    strict_1.default.equal(storefrontReceipt.ledger.replayable, true);
});
//# sourceMappingURL=runtime-governance.contract.test.js.map