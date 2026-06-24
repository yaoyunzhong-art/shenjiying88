"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const strict_1 = __importDefault(require("node:assert/strict"));
const node_test_1 = __importStar(require("node:test"));
const approval = require('./governance-approval');
(0, node_test_1.describe)('governance-approval: isGovernanceApprovalExecuted', () => {
    (0, node_test_1.default)('returns false when summary is null', () => {
        strict_1.default.equal(approval.isGovernanceApprovalExecuted(null), false);
    });
    (0, node_test_1.default)('returns false when execution has no executedAt', () => {
        strict_1.default.equal(approval.isGovernanceApprovalExecuted({ execution: { attempts: 1 } }), false);
    });
    (0, node_test_1.default)('returns true when execution has an executedAt timestamp', () => {
        strict_1.default.equal(approval.isGovernanceApprovalExecuted({
            execution: { executedAt: '2026-06-13T11:00:00.000Z', executionStatus: 'SUCCESS' }
        }), true);
    });
    (0, node_test_1.default)('returns false when summary is empty object', () => {
        strict_1.default.equal(approval.isGovernanceApprovalExecuted({}), false);
    });
    (0, node_test_1.default)('returns false when summary is a string instead of object', () => {
        strict_1.default.equal(approval.isGovernanceApprovalExecuted('not-an-object'), false);
    });
});
(0, node_test_1.describe)('governance-approval: buildInternalApprovalTicket', () => {
    (0, node_test_1.default)('generates ticket with APR prefix and operation slug', () => {
        const ticket = approval.buildInternalApprovalTicket('create-user');
        strict_1.default.ok(ticket.startsWith('APR-CREATEUS'), `Expected ticket to start with APR-CREATEUS, got: ${ticket}`);
        strict_1.default.ok(ticket.length > 12, `Expected ticket to be longer than 12 chars, got: ${ticket.length}`);
    });
    (0, node_test_1.default)('generates ticket with uppercase operation prefix truncated to 8 chars', () => {
        const ticket = approval.buildInternalApprovalTicket('very-long-operation-name-here');
        strict_1.default.ok(ticket.startsWith('APR-VERYLONG'), `Expected ticket to start with APR-VERYLONG, got: ${ticket}`);
    });
    (0, node_test_1.default)('generates unique tickets for same operation', () => {
        const ticket1 = approval.buildInternalApprovalTicket('test');
        const ticket2 = approval.buildInternalApprovalTicket('test');
        strict_1.default.notEqual(ticket1, ticket2);
    });
    (0, node_test_1.default)('handles special characters in operation name', () => {
        const ticket = approval.buildInternalApprovalTicket('order/create@store!');
        strict_1.default.ok(ticket.startsWith('APR-ORDERCRE'), `Got: ${ticket}`);
        strict_1.default.ok(ticket.match(/^APR-[A-Z0-9]+-[A-Z0-9]+$/), `Got malformed ticket: ${ticket}`);
    });
    (0, node_test_1.default)('handles entirely non-alphanumeric operation as APR prefix default', () => {
        const ticket = approval.buildInternalApprovalTicket('!@#$%^&*()');
        strict_1.default.ok(ticket.startsWith('APR-APR-'), `Expected APR-APR- fallback, got: ${ticket}`);
    });
});
(0, node_test_1.describe)('governance-approval: assertExpectedVersion', () => {
    (0, node_test_1.default)('does not throw when expectedVersion is undefined', () => {
        strict_1.default.doesNotThrow(() => approval.assertExpectedVersion(3, undefined));
    });
    (0, node_test_1.default)('does not throw when expectedVersion is null', () => {
        strict_1.default.doesNotThrow(() => approval.assertExpectedVersion(3, null));
    });
    (0, node_test_1.default)('does not throw when versions match', () => {
        strict_1.default.doesNotThrow(() => approval.assertExpectedVersion(5, 5));
    });
    (0, node_test_1.default)('throws ConflictException when versions differ', () => {
        strict_1.default.throws(() => approval.assertExpectedVersion(3, 5), (err) => err.message.includes('version mismatch') || err.message.includes('Expected'));
    });
    (0, node_test_1.default)('throws when current version is newer than expected', () => {
        strict_1.default.throws(() => approval.assertExpectedVersion(10, 5), (err) => err.message.includes('10'));
    });
});
(0, node_test_1.describe)('governance-approval: normalizeRequestedStatus', () => {
    (0, node_test_1.default)('returns NOT_REQUIRED when not required and no status', () => {
        strict_1.default.equal(approval.normalizeRequestedStatus(false), 'NOT_REQUIRED');
    });
    (0, node_test_1.default)('returns provided status when not required', () => {
        strict_1.default.equal(approval.normalizeRequestedStatus(false, 'APPROVED'), 'APPROVED');
    });
    (0, node_test_1.default)('returns PENDING when required and no status', () => {
        strict_1.default.equal(approval.normalizeRequestedStatus(true), 'PENDING');
    });
    (0, node_test_1.default)('returns PENDING when required with APPROVED overridden', () => {
        strict_1.default.equal(approval.normalizeRequestedStatus(true, 'APPROVED'), 'PENDING');
    });
    (0, node_test_1.default)('returns PENDING when required with REJECTED overridden', () => {
        strict_1.default.equal(approval.normalizeRequestedStatus(true, 'REJECTED'), 'PENDING');
    });
    (0, node_test_1.default)('returns PENDING when required with CANCELLED overridden', () => {
        strict_1.default.equal(approval.normalizeRequestedStatus(true, 'CANCELLED'), 'PENDING');
    });
    (0, node_test_1.default)('returns PENDING when required with SUPERSEDED overridden', () => {
        strict_1.default.equal(approval.normalizeRequestedStatus(true, 'SUPERSEDED'), 'PENDING');
    });
    (0, node_test_1.default)('returns PENDING when required with explicit PENDING', () => {
        strict_1.default.equal(approval.normalizeRequestedStatus(true, 'PENDING'), 'PENDING');
    });
    (0, node_test_1.default)('returns NOT_REQUIRED when required flag is false and status NOT_REQUIRED', () => {
        strict_1.default.equal(approval.normalizeRequestedStatus(false, 'NOT_REQUIRED'), 'NOT_REQUIRED');
    });
});
(0, node_test_1.describe)('governance-approval: resolveScopeType', () => {
    (0, node_test_1.default)('returns PLATFORM when no scopeType provided', () => {
        strict_1.default.equal(approval.resolveScopeType(), 'PLATFORM');
    });
    (0, node_test_1.default)('returns PLATFORM when scopeType is undefined', () => {
        strict_1.default.equal(approval.resolveScopeType(undefined), 'PLATFORM');
    });
    (0, node_test_1.default)('returns the string scopeType directly when provided as enum-like value', () => {
        strict_1.default.equal(approval.resolveScopeType('PLATFORM'), 'PLATFORM');
    });
});
(0, node_test_1.describe)('governance-approval: toPrismaApprovalStatus', () => {
    (0, node_test_1.default)('returns the same status value', () => {
        strict_1.default.equal(approval.toPrismaApprovalStatus('PENDING'), 'PENDING');
    });
    (0, node_test_1.default)('returns APPROVED as-is', () => {
        strict_1.default.equal(approval.toPrismaApprovalStatus('APPROVED'), 'APPROVED');
    });
    (0, node_test_1.default)('returns CANCELLED as-is', () => {
        strict_1.default.equal(approval.toPrismaApprovalStatus('CANCELLED'), 'CANCELLED');
    });
});
(0, node_test_1.describe)('governance-approval: matchesApprovalStatus', () => {
    (0, node_test_1.default)('matches when string values are equal', () => {
        strict_1.default.equal(approval.matchesApprovalStatus('PENDING', 'PENDING'), true);
    });
    (0, node_test_1.default)('does not match when values differ', () => {
        strict_1.default.equal(approval.matchesApprovalStatus('APPROVED', 'REJECTED'), false);
    });
});
(0, node_test_1.describe)('governance-approval: createApprovalMetrics', () => {
    (0, node_test_1.default)('creates metrics with zero totals', () => {
        const metrics = approval.createApprovalMetrics();
        strict_1.default.equal(metrics.total, 0);
    });
    (0, node_test_1.default)('creates metrics with all statuses zeroed', () => {
        const metrics = approval.createApprovalMetrics();
        strict_1.default.equal(metrics.statuses.PENDING, 0);
        strict_1.default.equal(metrics.statuses.APPROVED, 0);
        strict_1.default.equal(metrics.statuses.REJECTED, 0);
        strict_1.default.equal(metrics.statuses.CANCELLED, 0);
        strict_1.default.equal(metrics.statuses.SUPERSEDED, 0);
        strict_1.default.equal(metrics.statuses.NOT_REQUIRED, 0);
    });
    (0, node_test_1.default)('creates metrics with execution counters zeroed', () => {
        const metrics = approval.createApprovalMetrics();
        strict_1.default.equal(metrics.execution.executed, 0);
        strict_1.default.equal(metrics.execution.pending, 0);
        strict_1.default.equal(metrics.execution.withFailures, 0);
        strict_1.default.deepStrictEqual(metrics.execution.byExecutionStatus, {});
        strict_1.default.deepStrictEqual(metrics.execution.byFailureStatus, {});
    });
});
(0, node_test_1.describe)('governance-approval: accumulateApprovalMetrics', () => {
    (0, node_test_1.default)('increments total count', () => {
        const metrics = approval.createApprovalMetrics();
        const snap = { status: 'PENDING', execution: { attempts: 0, executed: false, executionStatus: null, executedAt: null, executedBy: null, lastFailure: null } };
        approval.accumulateApprovalMetrics(metrics, snap);
        strict_1.default.equal(metrics.total, 1);
    });
    (0, node_test_1.default)('increments pending status counter', () => {
        const metrics = approval.createApprovalMetrics();
        const snap = { status: 'PENDING', execution: { attempts: 0, executed: false, executionStatus: null, executedAt: null, executedBy: null, lastFailure: null } };
        approval.accumulateApprovalMetrics(metrics, snap);
        strict_1.default.equal(metrics.statuses.PENDING, 1);
    });
    (0, node_test_1.default)('increments APPROVED status counter', () => {
        const metrics = approval.createApprovalMetrics();
        const snap = { status: 'APPROVED', execution: { attempts: 0, executed: false, executionStatus: null, executedAt: null, executedBy: null, lastFailure: null } };
        approval.accumulateApprovalMetrics(metrics, snap);
        strict_1.default.equal(metrics.statuses.APPROVED, 1);
    });
    (0, node_test_1.default)('counts executed flag', () => {
        const metrics = approval.createApprovalMetrics();
        const snap = {
            status: 'APPROVED',
            execution: { attempts: 1, executed: true, executionStatus: 'SUCCESS', executedAt: '2026-01-01T00:00:00Z', executedBy: 'test-user', lastFailure: null }
        };
        approval.accumulateApprovalMetrics(metrics, snap);
        strict_1.default.equal(metrics.execution.executed, 1);
    });
    (0, node_test_1.default)('counts pending execution', () => {
        const metrics = approval.createApprovalMetrics();
        const snap = {
            status: 'PENDING',
            execution: { attempts: 0, executed: false, executionStatus: null, executedAt: null, executedBy: null, lastFailure: null }
        };
        approval.accumulateApprovalMetrics(metrics, snap);
        strict_1.default.equal(metrics.execution.pending, 1);
    });
    (0, node_test_1.default)('counts withFailures flag', () => {
        const metrics = approval.createApprovalMetrics();
        const snap = {
            status: 'APPROVED',
            execution: {
                attempts: 2,
                executed: false,
                executionStatus: null,
                executedAt: null,
                executedBy: null,
                lastFailure: { failureStatus: 'NETWORK_ERROR', failureReason: 'timeout', failedAt: '2026-01-01T00:00:00Z', failedBy: 'system' }
            }
        };
        approval.accumulateApprovalMetrics(metrics, snap);
        strict_1.default.equal(metrics.execution.withFailures, 1);
        strict_1.default.equal(metrics.execution.byFailureStatus['NETWORK_ERROR'], 1);
    });
    (0, node_test_1.default)('accumulates multiple approvals correctly', () => {
        const metrics = approval.createApprovalMetrics();
        approval.accumulateApprovalMetrics(metrics, {
            status: 'PENDING',
            execution: { attempts: 0, executed: false, executionStatus: null, executedAt: null, executedBy: null, lastFailure: null }
        });
        approval.accumulateApprovalMetrics(metrics, {
            status: 'APPROVED',
            execution: { attempts: 1, executed: true, executionStatus: 'SUCCESS', executedAt: '2026-01-01T00:00:00Z', executedBy: 'user1', lastFailure: null }
        });
        approval.accumulateApprovalMetrics(metrics, {
            status: 'REJECTED',
            execution: { attempts: 0, executed: false, executionStatus: null, executedAt: null, executedBy: null, lastFailure: null }
        });
        strict_1.default.equal(metrics.total, 3);
        strict_1.default.equal(metrics.statuses.PENDING, 1);
        strict_1.default.equal(metrics.statuses.APPROVED, 1);
        strict_1.default.equal(metrics.statuses.REJECTED, 1);
        strict_1.default.equal(metrics.execution.executed, 1);
        strict_1.default.equal(metrics.execution.pending, 2);
    });
});
(0, node_test_1.describe)('governance-approval: toApprovalSnapshot', () => {
    (0, node_test_1.default)('maps approval record to snapshot with all fields', () => {
        const record = {
            id: 'approval-001',
            operation: 'create',
            resourceType: 'store',
            resourceKey: 'store-42',
            required: true,
            version: 3,
            requestedBy: 'user-abc',
            approvalTicket: 'APR-CREATE-XZ123ABC',
            status: 'PENDING',
            decidedBy: null,
            decidedAt: null,
            updatedAt: new Date('2026-06-13T12:00:00Z'),
            summary: null
        };
        const snap = approval.toApprovalSnapshot(record);
        strict_1.default.equal(snap.approvalId, 'approval-001');
        strict_1.default.equal(snap.operation, 'create');
        strict_1.default.equal(snap.resourceType, 'store');
        strict_1.default.equal(snap.resourceKey, 'store-42');
        strict_1.default.equal(snap.required, true);
        strict_1.default.equal(snap.version, 3);
        strict_1.default.equal(snap.requestedBy, 'user-abc');
        strict_1.default.equal(snap.ticket, 'APR-CREATE-XZ123ABC');
        strict_1.default.equal(snap.status, 'PENDING');
        strict_1.default.equal(snap.decidedBy, null);
        strict_1.default.equal(snap.decidedAt, null);
        strict_1.default.equal(snap.updatedAt, '2026-06-13T12:00:00.000Z');
        strict_1.default.equal(snap.execution.executed, false);
        strict_1.default.equal(snap.execution.attempts, 0);
    });
    (0, node_test_1.default)('maps execution summary from nested summary object', () => {
        const record = {
            id: 'approval-002',
            operation: 'update',
            resourceType: 'brand',
            resourceKey: 'brand-99',
            required: true,
            version: 1,
            requestedBy: 'user-xyz',
            approvalTicket: 'APR-UPDATE-XX123',
            status: 'APPROVED',
            decidedBy: 'admin',
            decidedAt: new Date('2026-06-13T10:00:00Z'),
            updatedAt: new Date('2026-06-13T11:00:00Z'),
            summary: {
                execution: {
                    executedAt: '2026-06-13T11:00:00.000Z',
                    executedBy: 'worker',
                    executionStatus: 'SUCCESS'
                }
            }
        };
        const snap = approval.toApprovalSnapshot(record);
        strict_1.default.equal(snap.execution.executed, true);
        strict_1.default.equal(snap.execution.executionStatus, 'SUCCESS');
        strict_1.default.equal(snap.execution.executedBy, 'worker');
        strict_1.default.equal(snap.execution.executedAt, '2026-06-13T11:00:00.000Z');
        strict_1.default.equal(snap.execution.attempts, 0);
    });
    (0, node_test_1.default)('maps execution failure from summary', () => {
        const record = {
            id: 'approval-003',
            operation: 'delete',
            resourceType: 'store',
            resourceKey: 'store-7',
            required: true,
            version: 2,
            requestedBy: 'user-xyz',
            approvalTicket: 'APR-DELETE-XX777',
            status: 'APPROVED',
            decidedBy: 'admin',
            decidedAt: new Date('2026-06-13T09:00:00Z'),
            updatedAt: new Date('2026-06-13T10:00:00Z'),
            summary: {
                executionAttempts: 3,
                executionFailure: {
                    failedAt: '2026-06-13T10:30:00.000Z',
                    failedBy: 'system',
                    failureStatus: 'NETWORK_ERROR',
                    failureReason: 'Connection timeout'
                }
            }
        };
        const snap = approval.toApprovalSnapshot(record);
        strict_1.default.equal(snap.execution.attempts, 3);
        strict_1.default.equal(snap.execution.executed, false);
        strict_1.default.equal(snap.execution.lastFailure?.failureStatus, 'NETWORK_ERROR');
        strict_1.default.equal(snap.execution.lastFailure?.failureReason, 'Connection timeout');
        strict_1.default.equal(snap.execution.lastFailure?.failedBy, 'system');
    });
    (0, node_test_1.default)('handles null approvalTicket', () => {
        const record = {
            id: 'approval-004',
            operation: 'read',
            resourceType: 'document',
            resourceKey: 'doc-1',
            required: false,
            version: 1,
            requestedBy: null,
            approvalTicket: null,
            status: 'NOT_REQUIRED',
            decidedBy: null,
            decidedAt: null,
            updatedAt: new Date('2026-06-13T08:00:00Z'),
            summary: null
        };
        const snap = approval.toApprovalSnapshot(record);
        strict_1.default.equal(snap.ticket, null);
        strict_1.default.equal(snap.requestedBy, null);
        strict_1.default.equal(snap.status, 'NOT_REQUIRED');
        strict_1.default.equal(snap.required, false);
    });
});
(0, node_test_1.describe)('governance-approval: toExecutionSummary', () => {
    (0, node_test_1.default)('returns empty summary for null input', () => {
        const summary = approval.toExecutionSummary(null);
        strict_1.default.equal(summary.attempts, 0);
        strict_1.default.equal(summary.executed, false);
        strict_1.default.equal(summary.executionStatus, null);
        strict_1.default.equal(summary.executedAt, null);
        strict_1.default.equal(summary.executedBy, null);
        strict_1.default.equal(summary.lastFailure, null);
    });
    (0, node_test_1.default)('maps execution details from summary object', () => {
        const summary = approval.toExecutionSummary({
            executionAttempts: 2,
            execution: {
                executedAt: '2026-06-13T12:00:00Z',
                executedBy: 'user1',
                executionStatus: 'SUCCESS'
            }
        });
        strict_1.default.equal(summary.attempts, 2);
        strict_1.default.equal(summary.executed, true);
        strict_1.default.equal(summary.executionStatus, 'SUCCESS');
        strict_1.default.equal(summary.executedBy, 'user1');
        strict_1.default.equal(summary.executedAt, '2026-06-13T12:00:00Z');
    });
});
(0, node_test_1.describe)('governance-approval: normalizeGroupBy', () => {
    (0, node_test_1.default)('returns empty array when value is undefined', () => {
        strict_1.default.deepStrictEqual(approval.normalizeGroupBy(undefined), []);
    });
    (0, node_test_1.default)('returns array as-is', () => {
        strict_1.default.deepStrictEqual(approval.normalizeGroupBy(['status', 'operation']), ['status', 'operation']);
    });
    (0, node_test_1.default)('parses comma-separated string', () => {
        strict_1.default.deepStrictEqual(approval.normalizeGroupBy('status,operation'), ['status', 'operation']);
    });
    (0, node_test_1.default)('parses single string value', () => {
        strict_1.default.deepStrictEqual(approval.normalizeGroupBy('status'), ['status']);
    });
    (0, node_test_1.default)('trims whitespace from string values', () => {
        strict_1.default.deepStrictEqual(approval.normalizeGroupBy(' status , operation '), ['status', 'operation']);
    });
});
(0, node_test_1.describe)('governance-approval: getApprovalGroupValue', () => {
    const snap = {
        approvalId: 'id-1',
        operation: 'create',
        resourceType: 'store',
        resourceKey: 'k1',
        required: true,
        version: 1,
        requestedBy: 'user-1',
        ticket: 'TICKET-1',
        status: 'PENDING',
        decidedBy: null,
        decidedAt: null,
        updatedAt: null,
        submitted: true,
        persisted: true,
        execution: {
            attempts: 0,
            executed: false,
            executionStatus: null,
            executedAt: null,
            executedBy: null,
            lastFailure: null
        },
        summary: null
    };
    (0, node_test_1.default)('returns operation value', () => {
        strict_1.default.equal(approval.getApprovalGroupValue(snap, 'operation'), 'create');
    });
    (0, node_test_1.default)('returns resourceType value', () => {
        strict_1.default.equal(approval.getApprovalGroupValue(snap, 'resourceType'), 'store');
    });
    (0, node_test_1.default)('returns status value', () => {
        strict_1.default.equal(approval.getApprovalGroupValue(snap, 'status'), 'PENDING');
    });
    (0, node_test_1.default)('returns requestedBy value', () => {
        strict_1.default.equal(approval.getApprovalGroupValue(snap, 'requestedBy'), 'user-1');
    });
    (0, node_test_1.default)('returns null for unknown groupBy key', () => {
        strict_1.default.equal(approval.getApprovalGroupValue(snap, 'unknown'), null);
    });
});
(0, node_test_1.describe)('governance-approval: assertApprovalBinding', () => {
    (0, node_test_1.default)('does not throw when all fields match', () => {
        const existing = {
            operation: 'create',
            resourceType: 'store',
            resourceKey: 'store-1',
            scopeType: 'PLATFORM',
            tenantId: null,
            brandId: null,
            storeId: null
        };
        const input = { operation: 'create', resourceType: 'store', resourceKey: 'store-1' };
        strict_1.default.doesNotThrow(() => approval.assertApprovalBinding(existing, input));
    });
    (0, node_test_1.default)('throws when operation differs', () => {
        const existing = {
            operation: 'create',
            resourceType: 'store',
            resourceKey: 'store-1',
            scopeType: 'PLATFORM',
            tenantId: null,
            brandId: null,
            storeId: null
        };
        const input = { operation: 'delete', resourceType: 'store', resourceKey: 'store-1' };
        strict_1.default.throws(() => approval.assertApprovalBinding(existing, input));
    });
    (0, node_test_1.default)('throws when resourceType differs', () => {
        const existing = {
            operation: 'create',
            resourceType: 'store',
            resourceKey: 'store-1',
            scopeType: 'PLATFORM',
            tenantId: null,
            brandId: null,
            storeId: null
        };
        const input = { operation: 'create', resourceType: 'brand', resourceKey: 'store-1' };
        strict_1.default.throws(() => approval.assertApprovalBinding(existing, input));
    });
    (0, node_test_1.default)('throws when resourceKey differs', () => {
        const existing = {
            operation: 'create',
            resourceType: 'store',
            resourceKey: 'store-1',
            scopeType: 'PLATFORM',
            tenantId: null,
            brandId: null,
            storeId: null
        };
        const input = { operation: 'create', resourceType: 'store', resourceKey: 'store-other' };
        strict_1.default.throws(() => approval.assertApprovalBinding(existing, input));
    });
});
(0, node_test_1.describe)('governance-approval: assertRequestDigest', () => {
    (0, node_test_1.default)('does not throw when existing digest is null', () => {
        strict_1.default.doesNotThrow(() => approval.assertRequestDigest(null, 'abc123'));
    });
    (0, node_test_1.default)('does not throw when no requestDigest is provided to compare', () => {
        strict_1.default.doesNotThrow(() => approval.assertRequestDigest({ requestDigest: 'existing-digest' }, null));
    });
    (0, node_test_1.default)('does not throw when digests match', () => {
        strict_1.default.doesNotThrow(() => approval.assertRequestDigest({ requestDigest: 'same-digest' }, 'same-digest'));
    });
    (0, node_test_1.default)('throws when digests differ', () => {
        strict_1.default.throws(() => approval.assertRequestDigest({ requestDigest: 'old-digest' }, 'new-digest'), (err) => err.message.includes('request payload') || err.message.includes('digest'));
    });
});
(0, node_test_1.describe)('governance-approval: stableStringify', () => {
    (0, node_test_1.default)('stringifies null', () => {
        strict_1.default.equal(approval.stableStringify(null), 'null');
    });
    (0, node_test_1.default)('stringifies number', () => {
        strict_1.default.equal(approval.stableStringify(42), '42');
    });
    (0, node_test_1.default)('stringifies string', () => {
        strict_1.default.equal(approval.stableStringify('hello'), '"hello"');
    });
    (0, node_test_1.default)('stringifies array', () => {
        strict_1.default.equal(approval.stableStringify([1, 2, 3]), '[1,2,3]');
    });
    (0, node_test_1.default)('stringifies object with sorted keys', () => {
        const result = approval.stableStringify({ z: 1, a: 2 });
        strict_1.default.equal(result, '{"a":2,"z":1}');
    });
    (0, node_test_1.default)('stable stringify produces same output for differently-ordered inputs', () => {
        const a = approval.stableStringify({ b: 1, a: 2, c: 3 });
        const b2 = approval.stableStringify({ a: 2, c: 3, b: 1 });
        strict_1.default.equal(a, b2);
    });
    (0, node_test_1.default)('stable stringify handles nested objects', () => {
        const result = approval.stableStringify({ user: { name: 'test', id: 1 } });
        strict_1.default.equal(result, '{"user":{"id":1,"name":"test"}}');
    });
    (0, node_test_1.default)('stable stringify handles nested arrays', () => {
        const result = approval.stableStringify({ items: [3, 1, 2] });
        strict_1.default.equal(result, '{"items":[3,1,2]}');
    });
});
(0, node_test_1.describe)('governance-approval: buildRequestDigest', () => {
    (0, node_test_1.default)('returns a hex string', () => {
        const digest = approval.buildRequestDigest({ key: 'value' });
        strict_1.default.ok(typeof digest === 'string');
        strict_1.default.ok(/^[0-9a-f]{64}$/.test(digest), `Expected 64-char hex, got: ${digest}`);
    });
    (0, node_test_1.default)('same input produces same digest', () => {
        const d1 = approval.buildRequestDigest({ a: 1, b: 2 });
        const d2 = approval.buildRequestDigest({ a: 1, b: 2 });
        strict_1.default.equal(d1, d2);
    });
    (0, node_test_1.default)('different inputs produce different digests', () => {
        const d1 = approval.buildRequestDigest({ a: 1 });
        const d2 = approval.buildRequestDigest({ a: 2 });
        strict_1.default.notEqual(d1, d2);
    });
});
(0, node_test_1.describe)('governance-approval: parseDate', () => {
    (0, node_test_1.default)('returns null for undefined', () => {
        strict_1.default.equal(approval.parseDate(undefined), null);
    });
    (0, node_test_1.default)('returns null for empty string', () => {
        strict_1.default.equal(approval.parseDate(''), null);
    });
    (0, node_test_1.default)('returns null for invalid date string', () => {
        strict_1.default.equal(approval.parseDate('not-a-date'), null);
    });
    (0, node_test_1.default)('parses valid ISO date string', () => {
        const result = approval.parseDate('2026-06-13T12:00:00Z');
        strict_1.default.ok(result instanceof Date);
        strict_1.default.equal(result.toISOString(), '2026-06-13T12:00:00.000Z');
    });
});
(0, node_test_1.describe)('governance-approval: matchesApprovalListFilters', () => {
    const baseSnap = {
        approvalId: 'id-1',
        operation: 'create',
        resourceType: 'store',
        resourceKey: 'k1',
        required: true,
        version: 1,
        requestedBy: 'user-1',
        ticket: 'TICKET-1',
        status: 'PENDING',
        decidedBy: null,
        decidedAt: null,
        updatedAt: null,
        submitted: true,
        persisted: true,
        execution: {
            attempts: 0,
            executed: false,
            executionStatus: null,
            executedAt: null,
            executedBy: null,
            lastFailure: null
        },
        summary: null
    };
    (0, node_test_1.default)('returns true with empty filters', () => {
        strict_1.default.equal(approval.matchesApprovalListFilters(baseSnap, {}), true);
    });
    (0, node_test_1.default)('returns true when operationIn includes approval operation', () => {
        strict_1.default.equal(approval.matchesApprovalListFilters(baseSnap, { operationIn: ['create', 'update'] }), true);
    });
    (0, node_test_1.default)('returns false when operationIn does not include approval operation', () => {
        strict_1.default.equal(approval.matchesApprovalListFilters(baseSnap, { operationIn: ['delete'] }), false);
    });
    (0, node_test_1.default)('returns true when resourceTypeIn includes approval resourceType', () => {
        strict_1.default.equal(approval.matchesApprovalListFilters(baseSnap, { resourceTypeIn: ['store', 'brand'] }), true);
    });
    (0, node_test_1.default)('returns false when resourceTypeIn does not include approval resourceType', () => {
        strict_1.default.equal(approval.matchesApprovalListFilters(baseSnap, { resourceTypeIn: ['brand'] }), false);
    });
});
(0, node_test_1.describe)('governance-approval: matchesApprovalExecutionFilters', () => {
    const baseSnap = {
        approvalId: 'id-1',
        operation: 'create',
        resourceType: 'store',
        resourceKey: 'k1',
        required: true,
        version: 1,
        requestedBy: 'user-1',
        ticket: 'TICKET-1',
        status: 'PENDING',
        decidedBy: null,
        decidedAt: null,
        updatedAt: null,
        submitted: true,
        persisted: true,
        execution: {
            attempts: 0,
            executed: false,
            executionStatus: null,
            executedAt: null,
            executedBy: null,
            lastFailure: null
        },
        summary: null
    };
    (0, node_test_1.default)('returns true with empty execution filters', () => {
        strict_1.default.equal(approval.matchesApprovalExecutionFilters(baseSnap, {}), true);
    });
    (0, node_test_1.default)('returns true when executed filter matches', () => {
        strict_1.default.equal(approval.matchesApprovalExecutionFilters(baseSnap, { executed: false }), true);
    });
    (0, node_test_1.default)('returns false when executed filter does not match', () => {
        strict_1.default.equal(approval.matchesApprovalExecutionFilters(baseSnap, { executed: true }), false);
    });
});
//# sourceMappingURL=governance-approval.test.js.map