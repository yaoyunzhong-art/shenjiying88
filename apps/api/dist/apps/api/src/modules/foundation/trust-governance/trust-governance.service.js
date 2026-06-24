"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TrustGovernanceService = void 0;
const client_1 = require("@prisma/client");
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../../prisma/prisma.service");
const governance_approval_1 = require("../governance-approval/governance-approval");
let TrustGovernanceService = class TrustGovernanceService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    aiBudgets = {
        'tenant-demo': { monthlyBudgetTokens: 50_000, remainingTokens: 18_000 },
        'tenant-premium': { monthlyBudgetTokens: 200_000, remainingTokens: 160_000 }
    };
    getManagementMetadata() {
        return [
            this.buildGovernanceMetadata('approval.read', {
                resource: 'approval',
                action: 'read',
                requiredRoles: ['SUPER_ADMIN', 'TENANT_ADMIN', 'SECURITY_ADMIN'],
                requiredPermissions: ['foundation.approval.read'],
                approvalRequired: false
            }),
            this.buildGovernanceMetadata('approval.decide', {
                resource: 'approval',
                action: 'decide',
                requiredRoles: ['SUPER_ADMIN', 'SECURITY_ADMIN'],
                requiredPermissions: ['foundation.approval.decide'],
                approvalRequired: false
            }),
            this.buildGovernanceMetadata('approval.lifecycle', {
                resource: 'approval',
                action: 'lifecycle',
                requiredRoles: ['SUPER_ADMIN', 'SECURITY_ADMIN'],
                requiredPermissions: ['foundation.approval.decide'],
                approvalRequired: false
            }),
            this.buildGovernanceMetadata('rate-limit-policy.write', {
                resource: 'rate-limit-policy',
                action: 'write',
                requiredRoles: ['SUPER_ADMIN', 'TENANT_ADMIN', 'SECURITY_ADMIN'],
                requiredPermissions: ['foundation.rate-limit-policy.write'],
                approvalRequired: false
            }),
            this.buildGovernanceMetadata('quota-ledger.reset', {
                resource: 'quota-ledger',
                action: 'reset',
                requiredRoles: ['SUPER_ADMIN', 'SECURITY_ADMIN'],
                requiredPermissions: ['foundation.quota-ledger.reset'],
                approvalRequired: true
            })
        ];
    }
    async listGovernanceApprovals(filters = {}) {
        return (0, governance_approval_1.listGovernanceApprovals)(this.prisma, filters);
    }
    async getGovernanceApprovalDetail(approvalTicket) {
        return (0, governance_approval_1.getGovernanceApprovalDetail)(this.prisma, approvalTicket);
    }
    async getGovernanceApprovalTimeline(approvalTicket, limit) {
        const approval = await this.getGovernanceApprovalDetail(approvalTicket);
        const audits = await this.getAuditRecords({
            approvalTicket,
            limit: limit ?? 20
        });
        return {
            approval,
            audits
        };
    }
    async getOperationsOverview() {
        const [approvals, audits, policies, ledgers] = await Promise.all([
            this.summarizeGovernanceApprovals({
                groupBy: ['operation', 'status', 'executionStatus', 'failureStatus']
            }),
            this.summarizeAuditRecords(),
            this.listRateLimitPolicies({}),
            this.listQuotaLedgers({ limit: 200 })
        ]);
        const now = Date.now();
        const blockedLedgers = ledgers.filter((ledger) => {
            const blockedUntil = typeof ledger.metadata.blockedUntil === 'string' ? Date.parse(ledger.metadata.blockedUntil) : Number.NaN;
            return Number.isFinite(blockedUntil) && blockedUntil > now;
        }).length;
        return {
            generatedAt: new Date().toISOString(),
            approvals,
            audits,
            rateLimit: {
                policies: {
                    total: policies.length,
                    tenantScoped: policies.filter((policy) => Boolean(policy.tenantId)).length,
                    runtimeManaged: policies.filter((policy) => Boolean(policy.metadata.runtimeManaged)).length
                },
                ledgers: {
                    total: ledgers.length,
                    blocked: blockedLedgers,
                    exhausted: ledgers.filter((ledger) => ledger.remaining === 0).length
                }
            }
        };
    }
    async summarizeGovernanceApprovals(filters = {}) {
        return (0, governance_approval_1.summarizeGovernanceApprovals)(this.prisma, filters);
    }
    async approveGovernanceApproval(approvalTicket, input) {
        const approval = await (0, governance_approval_1.decideGovernanceApproval)(this.prisma, {
            approvalTicket,
            decidedBy: input.decidedBy,
            decisionNote: input.decisionNote,
            expectedVersion: input.expectedVersion,
            status: 'APPROVED',
            summary: {
                decisionSource: 'trust-governance.approve'
            }
        });
        await this.recordAudit('foundation.approval.approved', {
            approvalTicket,
            operation: approval.operation,
            resourceType: approval.resourceType,
            resourceKey: approval.resourceKey
        }, {
            tenantId: nullToUndefined(approval.summary?.tenantId) ?? undefined,
            actorId: input.decidedBy,
            source: 'trust-governance',
            riskLevel: 'medium'
        });
        return {
            status: 'approved',
            approval,
            governance: this.buildGovernanceMetadata('approval.decide', {
                resource: 'approval',
                action: 'decide',
                requiredRoles: ['SUPER_ADMIN', 'SECURITY_ADMIN'],
                requiredPermissions: ['foundation.approval.decide'],
                approvalRequired: false
            })
        };
    }
    async rejectGovernanceApproval(approvalTicket, input) {
        const approval = await (0, governance_approval_1.decideGovernanceApproval)(this.prisma, {
            approvalTicket,
            decidedBy: input.decidedBy,
            decisionNote: input.decisionNote,
            expectedVersion: input.expectedVersion,
            status: 'REJECTED',
            summary: {
                decisionSource: 'trust-governance.reject'
            }
        });
        await this.recordAudit('foundation.approval.rejected', {
            approvalTicket,
            operation: approval.operation,
            resourceType: approval.resourceType,
            resourceKey: approval.resourceKey
        }, {
            tenantId: nullToUndefined(approval.summary?.tenantId) ?? undefined,
            actorId: input.decidedBy,
            source: 'trust-governance',
            riskLevel: 'medium'
        });
        return {
            status: 'rejected',
            approval,
            governance: this.buildGovernanceMetadata('approval.decide', {
                resource: 'approval',
                action: 'decide',
                requiredRoles: ['SUPER_ADMIN', 'SECURITY_ADMIN'],
                requiredPermissions: ['foundation.approval.decide'],
                approvalRequired: false
            })
        };
    }
    async cancelGovernanceApproval(approvalTicket, input) {
        const approval = await (0, governance_approval_1.cancelGovernanceApproval)(this.prisma, {
            approvalTicket,
            cancelledBy: input.operatorId,
            cancelReason: input.reason,
            expectedVersion: input.expectedVersion
        });
        await this.recordAudit('foundation.approval.cancelled', {
            approvalTicket,
            operation: approval.operation,
            resourceType: approval.resourceType,
            resourceKey: approval.resourceKey
        }, {
            tenantId: nullToUndefined(approval.summary?.tenantId) ?? undefined,
            actorId: input.operatorId,
            source: 'trust-governance',
            riskLevel: 'medium'
        });
        return {
            status: 'cancelled',
            approval,
            governance: this.buildGovernanceMetadata('approval.lifecycle', {
                resource: 'approval',
                action: 'cancel',
                requiredRoles: ['SUPER_ADMIN', 'SECURITY_ADMIN'],
                requiredPermissions: ['foundation.approval.decide'],
                approvalRequired: false
            })
        };
    }
    async resubmitGovernanceApproval(approvalTicket, input) {
        const result = await (0, governance_approval_1.resubmitGovernanceApproval)(this.prisma, {
            approvalTicket,
            resubmittedBy: input.operatorId,
            resubmitReason: input.reason,
            expectedVersion: input.expectedVersion
        });
        await this.recordAudit('foundation.approval.resubmitted', {
            approvalTicket,
            supersededTicket: result.supersededTicket,
            newApprovalTicket: result.approval.ticket,
            operation: result.approval.operation,
            resourceType: result.approval.resourceType,
            resourceKey: result.approval.resourceKey
        }, {
            tenantId: nullToUndefined(result.approval.summary?.tenantId) ?? undefined,
            actorId: input.operatorId,
            source: 'trust-governance',
            riskLevel: 'medium'
        });
        return {
            status: 'resubmitted',
            supersededTicket: result.supersededTicket,
            approval: result.approval,
            governance: this.buildGovernanceMetadata('approval.lifecycle', {
                resource: 'approval',
                action: 'resubmit',
                requiredRoles: ['SUPER_ADMIN', 'SECURITY_ADMIN'],
                requiredPermissions: ['foundation.approval.decide'],
                approvalRequired: false
            })
        };
    }
    async recordAudit(eventType, details, context) {
        const maskedDetails = this.maskPii(details);
        const persistedPayload = typeof details.approvalTicket === 'string'
            ? {
                ...maskedDetails,
                approvalTicket: details.approvalTicket
            }
            : maskedDetails;
        const persisted = await this.prisma.auditLog.create({
            data: {
                tenantId: context?.tenantId ?? 'tenant-demo',
                scopeType: client_1.FoundationScopeType.TENANT,
                action: eventType,
                operatorId: context?.actorId ?? 'foundation-system',
                operatorType: client_1.IdentitySubjectType.SERVICE_ACCOUNT,
                sourceChannel: context?.source,
                purpose: eventType,
                payload: this.toInputJsonValue(persistedPayload),
                metadata: this.toInputJsonValue({
                    riskLevel: context?.riskLevel ?? 'medium'
                })
            }
        });
        return {
            ...this.toAuditRecord({
                id: persisted.id,
                tenantId: persisted.tenantId,
                action: persisted.action,
                operatorId: persisted.operatorId,
                sourceChannel: persisted.sourceChannel,
                metadata: persisted.metadata,
                createdAt: persisted.createdAt,
                payload: persisted.payload
            }),
            retention: 'prisma'
        };
    }
    async getAuditRecords(filters = {}) {
        const from = this.getDate(filters.from);
        const to = this.getDate(filters.to);
        const records = await this.prisma.auditLog.findMany({
            where: {
                tenantId: filters.tenantId,
                action: filters.action,
                sourceChannel: filters.source,
                requestId: filters.requestId,
                operatorId: filters.actorId,
                createdAt: from || to
                    ? {
                        ...(from ? { gte: from } : {}),
                        ...(to ? { lte: to } : {})
                    }
                    : undefined
            },
            orderBy: [{ createdAt: 'desc' }],
            take: Math.max((filters.limit ?? 20) * 3, filters.limit ?? 20)
        });
        const filtered = records
            .map((record) => this.toAuditRecord({
            id: record.id,
            tenantId: record.tenantId,
            action: record.action,
            operatorId: record.operatorId,
            sourceChannel: record.sourceChannel,
            metadata: record.metadata,
            createdAt: record.createdAt,
            payload: record.payload
        }))
            .filter((record) => !filters.riskLevel || record.riskLevel === filters.riskLevel)
            .filter((record) => !filters.approvalTicket || record.details.approvalTicket === filters.approvalTicket);
        return filtered.slice(0, filters.limit ?? 20);
    }
    async summarizeAuditRecords(filters = {}) {
        const records = await this.getAuditRecords({
            ...filters,
            limit: Math.max((filters.limit ?? 20) * 5, filters.limit ?? 20)
        });
        return records.reduce((summary, record) => {
            summary.total += 1;
            summary.byAction[record.eventType] = (summary.byAction[record.eventType] ?? 0) + 1;
            if (record.source) {
                summary.bySource[record.source] = (summary.bySource[record.source] ?? 0) + 1;
            }
            summary.byRiskLevel[record.riskLevel] += 1;
            return summary;
        }, {
            total: 0,
            byAction: {},
            bySource: {},
            byRiskLevel: {
                low: 0,
                medium: 0,
                high: 0
            }
        });
    }
    async evaluateRateLimit(input) {
        const now = new Date();
        const period = this.resolveQuotaPeriod(input.windowSeconds);
        const resetAt = this.computeResetAt(now, input.windowSeconds);
        const policy = await this.ensureRuntimeRateLimitPolicy(input, period);
        const result = await this.prisma.$transaction(async (tx) => {
            let createdFresh = false;
            let ledger = await tx.quotaLedger.findUnique({
                where: {
                    rateLimitPolicyId_subjectKey_resetAt: {
                        rateLimitPolicyId: policy.id,
                        subjectKey: input.scopeKey,
                        resetAt
                    }
                }
            });
            if (!ledger) {
                try {
                    ledger = await tx.quotaLedger.create({
                        data: {
                            rateLimitPolicyId: policy.id,
                            subjectKey: input.scopeKey,
                            period,
                            consumed: 1,
                            remaining: Math.max(input.limit - 1, 0),
                            resetAt,
                            metadata: this.toInputJsonValue({
                                windowSeconds: input.windowSeconds,
                                blockSeconds: input.blockSeconds ?? input.windowSeconds,
                                lastSeenAt: now.toISOString()
                            })
                        }
                    });
                    createdFresh = true;
                }
                catch (error) {
                    if (!this.isUniqueConstraintError(error)) {
                        throw error;
                    }
                    ledger = await tx.quotaLedger.findUniqueOrThrow({
                        where: {
                            rateLimitPolicyId_subjectKey_resetAt: {
                                rateLimitPolicyId: policy.id,
                                subjectKey: input.scopeKey,
                                resetAt
                            }
                        }
                    });
                }
            }
            if (createdFresh) {
                return {
                    allowed: true,
                    scopeKey: input.scopeKey,
                    limit: input.limit,
                    remaining: Math.max(input.limit - ledger.consumed, 0),
                    retryAfterSeconds: 0,
                    state: this.serializeRateLimitState({
                        consumed: ledger.consumed,
                        remaining: ledger.remaining,
                        resetAt,
                        blockedUntil: null,
                        updatedAt: ledger.updatedAt
                    })
                };
            }
            const metadata = this.getJsonRecord(ledger.metadata);
            const blockedUntil = this.getDate(metadata.blockedUntil);
            if (blockedUntil && blockedUntil.getTime() > now.getTime()) {
                return {
                    allowed: false,
                    scopeKey: input.scopeKey,
                    limit: input.limit,
                    remaining: 0,
                    retryAfterSeconds: Math.ceil((blockedUntil.getTime() - now.getTime()) / 1000),
                    state: this.serializeRateLimitState({
                        consumed: ledger.consumed,
                        remaining: ledger.remaining,
                        resetAt,
                        blockedUntil,
                        updatedAt: ledger.updatedAt
                    })
                };
            }
            const nextConsumed = ledger.consumed + 1;
            if (nextConsumed > input.limit) {
                const nextBlockedUntil = new Date(now.getTime() + (input.blockSeconds ?? input.windowSeconds) * 1000);
                const blockedLedger = await tx.quotaLedger.update({
                    where: { id: ledger.id },
                    data: {
                        consumed: nextConsumed,
                        remaining: 0,
                        metadata: this.toInputJsonValue({
                            ...metadata,
                            windowSeconds: input.windowSeconds,
                            blockSeconds: input.blockSeconds ?? input.windowSeconds,
                            blockedUntil: nextBlockedUntil.toISOString(),
                            lastSeenAt: now.toISOString()
                        })
                    }
                });
                return {
                    allowed: false,
                    scopeKey: input.scopeKey,
                    limit: input.limit,
                    remaining: 0,
                    retryAfterSeconds: Math.ceil((nextBlockedUntil.getTime() - now.getTime()) / 1000),
                    state: this.serializeRateLimitState({
                        consumed: blockedLedger.consumed,
                        remaining: blockedLedger.remaining,
                        resetAt,
                        blockedUntil: nextBlockedUntil,
                        updatedAt: blockedLedger.updatedAt
                    })
                };
            }
            const updated = await tx.quotaLedger.update({
                where: { id: ledger.id },
                data: {
                    consumed: nextConsumed,
                    remaining: Math.max(input.limit - nextConsumed, 0),
                    metadata: this.toInputJsonValue({
                        ...metadata,
                        windowSeconds: input.windowSeconds,
                        blockSeconds: input.blockSeconds ?? input.windowSeconds,
                        blockedUntil: null,
                        lastSeenAt: now.toISOString()
                    })
                }
            });
            return {
                allowed: true,
                scopeKey: input.scopeKey,
                limit: input.limit,
                remaining: Math.max(input.limit - updated.consumed, 0),
                retryAfterSeconds: 0,
                state: this.serializeRateLimitState({
                    consumed: updated.consumed,
                    remaining: updated.remaining,
                    resetAt,
                    blockedUntil: null,
                    updatedAt: updated.updatedAt
                })
            };
        });
        return result;
    }
    async listRateLimitPolicies(filters) {
        const policies = await this.prisma.rateLimitPolicy.findMany({
            where: {
                code: filters.code,
                tenantId: filters.tenantId,
                brandId: filters.brandId,
                storeId: filters.storeId,
                integrationAppId: filters.integrationAppId
            },
            orderBy: [{ updatedAt: 'desc' }]
        });
        return policies.map((policy) => this.toRateLimitPolicyRecord(policy));
    }
    async upsertRateLimitPolicy(input) {
        const data = {
            scopeType: client_1.FoundationScopeType[input.scopeType],
            tenantId: input.tenantId ?? null,
            brandId: input.brandId ?? null,
            storeId: input.storeId ?? null,
            integrationAppId: input.integrationAppId ?? null,
            period: client_1.QuotaPeriod[input.period],
            limit: input.limit,
            burstLimit: input.burstLimit ?? input.limit,
            dimensionKeys: input.dimensionKeys?.length ? input.dimensionKeys : ['scopeKey'],
            algorithm: input.algorithm ?? 'FIXED_WINDOW',
            metadata: this.toInputJsonValue(input.metadata ?? {})
        };
        const existing = await this.prisma.rateLimitPolicy.findUnique({
            where: { code: input.code }
        });
        const persisted = existing
            ? await this.prisma.rateLimitPolicy.update({
                where: { id: existing.id },
                data
            })
            : await this.prisma.rateLimitPolicy.create({
                data: {
                    code: input.code,
                    ...data
                }
            });
        const approval = await (0, governance_approval_1.materializeGovernanceApproval)(this.prisma, {
            operation: 'rate-limit-policy.write',
            resourceType: 'rate-limit-policy',
            resourceKey: this.buildResourceKey(input.code, input.scopeType, input.tenantId, input.brandId, input.storeId),
            scopeType: input.scopeType,
            tenantId: input.tenantId,
            brandId: input.brandId,
            storeId: input.storeId,
            approvalRequired: false,
            requestedBy: input.requestedBy,
            approvalTicket: input.approvalTicket,
            approvalStatus: input.approvalStatus,
            summary: {
                code: input.code,
                mutation: existing ? 'updated' : 'created',
                period: input.period,
                limit: input.limit
            }
        });
        return {
            status: existing ? 'updated' : 'created',
            policy: this.toRateLimitPolicyRecord(persisted),
            governance: this.buildGovernanceMetadata('rate-limit-policy.write', {
                resource: 'rate-limit-policy',
                action: 'write',
                requiredRoles: ['SUPER_ADMIN', 'TENANT_ADMIN', 'SECURITY_ADMIN'],
                requiredPermissions: ['foundation.rate-limit-policy.write'],
                approvalRequired: false,
                requestedBy: input.requestedBy,
                ticket: input.approvalTicket,
                status: input.approvalStatus,
                approvalRecord: approval
            })
        };
    }
    async listQuotaLedgers(filters) {
        const ledgers = await this.prisma.quotaLedger.findMany({
            where: {
                subjectKey: filters.subjectKey,
                rateLimitPolicy: {
                    code: filters.policyCode,
                    tenantId: filters.tenantId
                }
            },
            include: {
                rateLimitPolicy: true
            },
            orderBy: [{ updatedAt: 'desc' }],
            take: filters.limit ?? 20
        });
        return ledgers.map((ledger) => this.toQuotaLedgerRecord(ledger));
    }
    async resetQuotaLedgers(input) {
        const requestPayload = {
            policyCode: input.policyCode ?? null,
            ledgerId: input.ledgerId ?? null,
            subjectKey: input.subjectKey ?? null,
            resetAllActive: input.resetAllActive ?? false
        };
        const approval = await (0, governance_approval_1.materializeGovernanceApproval)(this.prisma, {
            operation: 'quota-ledger.reset',
            resourceType: 'quota-ledger',
            resourceKey: this.buildResourceKey(input.policyCode, input.ledgerId, input.subjectKey),
            approvalRequired: true,
            requestedBy: input.requestedBy,
            approvalTicket: input.approvalTicket,
            approvalStatus: input.approvalStatus,
            requestPayload,
            summary: {
                ...requestPayload
            }
        });
        if (approval.status === 'REJECTED') {
            await this.recordAudit('foundation.approval.execution-blocked', {
                approvalTicket: approval.ticket,
                operation: approval.operation,
                resourceType: approval.resourceType,
                resourceKey: approval.resourceKey
            }, {
                actorId: input.requestedBy,
                source: 'trust-governance',
                riskLevel: 'medium'
            });
            return {
                status: 'approval-rejected',
                count: 0,
                ledgers: [],
                approvalRequest: approval,
                governance: this.buildGovernanceMetadata('quota-ledger.reset', {
                    resource: 'quota-ledger',
                    action: 'reset',
                    requiredRoles: ['SUPER_ADMIN', 'SECURITY_ADMIN'],
                    requiredPermissions: ['foundation.quota-ledger.reset'],
                    approvalRequired: true,
                    requestedBy: input.requestedBy,
                    ticket: approval.ticket ?? input.approvalTicket,
                    status: approval.status,
                    approvalRecord: approval
                })
            };
        }
        if (approval.status !== 'APPROVED') {
            return {
                status: 'pending-approval',
                count: 0,
                ledgers: [],
                approvalRequest: approval,
                governance: this.buildGovernanceMetadata('quota-ledger.reset', {
                    resource: 'quota-ledger',
                    action: 'reset',
                    requiredRoles: ['SUPER_ADMIN', 'SECURITY_ADMIN'],
                    requiredPermissions: ['foundation.quota-ledger.reset'],
                    approvalRequired: true,
                    requestedBy: input.requestedBy,
                    ticket: approval.ticket ?? input.approvalTicket,
                    status: approval.status,
                    approvalRecord: approval
                })
            };
        }
        if ((0, governance_approval_1.isGovernanceApprovalExecuted)(approval.summary)) {
            await this.recordAudit('foundation.approval.replay-blocked', {
                approvalTicket: approval.ticket,
                operation: approval.operation,
                resourceType: approval.resourceType,
                resourceKey: approval.resourceKey
            }, {
                actorId: input.requestedBy,
                source: 'trust-governance',
                riskLevel: 'medium'
            });
            return {
                status: 'already-executed',
                count: 0,
                ledgers: [],
                approvalRequest: approval,
                governance: this.buildGovernanceMetadata('quota-ledger.reset', {
                    resource: 'quota-ledger',
                    action: 'reset',
                    requiredRoles: ['SUPER_ADMIN', 'SECURITY_ADMIN'],
                    requiredPermissions: ['foundation.quota-ledger.reset'],
                    approvalRequired: true,
                    requestedBy: input.requestedBy,
                    ticket: approval.ticket ?? input.approvalTicket,
                    status: approval.status,
                    approvalRecord: approval
                })
            };
        }
        if (input.ledgerId) {
            try {
                const updated = await this.prisma.quotaLedger.update({
                    where: { id: input.ledgerId },
                    data: {
                        consumed: 0,
                        remaining: null,
                        metadata: this.toInputJsonValue({
                            resetAt: new Date().toISOString(),
                            resetReason: 'manual-ledger-reset',
                            blockedUntil: null
                        })
                    },
                    include: {
                        rateLimitPolicy: true
                    }
                });
                await this.recordAudit('foundation.approval.executed', {
                    approvalTicket: approval.ticket,
                    operation: approval.operation,
                    resourceType: approval.resourceType,
                    resourceKey: approval.resourceKey,
                    executionStatus: 'reset-single',
                    count: 1
                }, {
                    actorId: input.requestedBy,
                    source: 'trust-governance',
                    riskLevel: 'medium'
                });
                const finalizedApproval = await (0, governance_approval_1.markGovernanceApprovalExecuted)(this.prisma, {
                    approvalTicket: approval.ticket ?? input.approvalTicket ?? '',
                    executedBy: input.requestedBy ?? 'trust-governance',
                    expectedVersion: approval.version ?? undefined,
                    executionStatus: 'reset-single',
                    summary: {
                        mutation: 'reset-single',
                        ledgerId: input.ledgerId,
                        count: 1
                    }
                });
                return {
                    status: 'reset-single',
                    count: 1,
                    ledgers: [this.toQuotaLedgerRecord(updated)],
                    governance: this.buildGovernanceMetadata('quota-ledger.reset', {
                        resource: 'quota-ledger',
                        action: 'reset',
                        requiredRoles: ['SUPER_ADMIN', 'SECURITY_ADMIN'],
                        requiredPermissions: ['foundation.quota-ledger.reset'],
                        approvalRequired: true,
                        requestedBy: input.requestedBy,
                        ticket: finalizedApproval.ticket ?? input.approvalTicket,
                        status: finalizedApproval.status,
                        approvalRecord: finalizedApproval
                    })
                };
            }
            catch (error) {
                await this.handleApprovalExecutionFailure(approval, input.requestedBy, 'reset-single-failed', error, {
                    ledgerId: input.ledgerId
                });
                throw error;
            }
        }
        const targets = await this.prisma.quotaLedger.findMany({
            where: {
                subjectKey: input.subjectKey,
                ...(input.resetAllActive ? { resetAt: { gt: new Date() } } : {}),
                rateLimitPolicy: {
                    code: input.policyCode
                }
            },
            include: {
                rateLimitPolicy: true
            }
        });
        if (targets.length === 0) {
            await this.recordAudit('foundation.approval.executed', {
                approvalTicket: approval.ticket,
                operation: approval.operation,
                resourceType: approval.resourceType,
                resourceKey: approval.resourceKey,
                executionStatus: 'no-op',
                count: 0
            }, {
                actorId: input.requestedBy,
                source: 'trust-governance',
                riskLevel: 'low'
            });
            const finalizedApproval = await (0, governance_approval_1.markGovernanceApprovalExecuted)(this.prisma, {
                approvalTicket: approval.ticket ?? input.approvalTicket ?? '',
                executedBy: input.requestedBy ?? 'trust-governance',
                expectedVersion: approval.version ?? undefined,
                executionStatus: 'no-op',
                summary: {
                    mutation: 'no-op',
                    count: 0
                }
            });
            return {
                status: 'no-op',
                count: 0,
                ledgers: [],
                governance: this.buildGovernanceMetadata('quota-ledger.reset', {
                    resource: 'quota-ledger',
                    action: 'reset',
                    requiredRoles: ['SUPER_ADMIN', 'SECURITY_ADMIN'],
                    requiredPermissions: ['foundation.quota-ledger.reset'],
                    approvalRequired: true,
                    requestedBy: input.requestedBy,
                    ticket: finalizedApproval.ticket ?? input.approvalTicket,
                    status: finalizedApproval.status,
                    approvalRecord: finalizedApproval
                })
            };
        }
        try {
            const resetAt = new Date().toISOString();
            const updatedLedgers = await Promise.all(targets.map((ledger) => this.prisma.quotaLedger.update({
                where: { id: ledger.id },
                data: {
                    consumed: 0,
                    remaining: ledger.rateLimitPolicy.limit,
                    metadata: this.toInputJsonValue({
                        ...this.getJsonRecord(ledger.metadata),
                        blockedUntil: null,
                        resetAt,
                        resetReason: input.resetAllActive ? 'bulk-active-reset' : 'filtered-reset'
                    })
                },
                include: {
                    rateLimitPolicy: true
                }
            })));
            await this.recordAudit('foundation.approval.executed', {
                approvalTicket: approval.ticket,
                operation: approval.operation,
                resourceType: approval.resourceType,
                resourceKey: approval.resourceKey,
                executionStatus: 'reset-bulk',
                count: updatedLedgers.length
            }, {
                actorId: input.requestedBy,
                source: 'trust-governance',
                riskLevel: 'medium'
            });
            const finalizedApproval = await (0, governance_approval_1.markGovernanceApprovalExecuted)(this.prisma, {
                approvalTicket: approval.ticket ?? input.approvalTicket ?? '',
                executedBy: input.requestedBy ?? 'trust-governance',
                expectedVersion: approval.version ?? undefined,
                executionStatus: 'reset-bulk',
                summary: {
                    mutation: 'reset-bulk',
                    count: updatedLedgers.length
                }
            });
            return {
                status: 'reset-bulk',
                count: updatedLedgers.length,
                ledgers: updatedLedgers.map((ledger) => this.toQuotaLedgerRecord(ledger)),
                governance: this.buildGovernanceMetadata('quota-ledger.reset', {
                    resource: 'quota-ledger',
                    action: 'reset',
                    requiredRoles: ['SUPER_ADMIN', 'SECURITY_ADMIN'],
                    requiredPermissions: ['foundation.quota-ledger.reset'],
                    approvalRequired: true,
                    requestedBy: input.requestedBy,
                    ticket: finalizedApproval.ticket ?? input.approvalTicket,
                    status: finalizedApproval.status,
                    approvalRecord: finalizedApproval
                })
            };
        }
        catch (error) {
            await this.handleApprovalExecutionFailure(approval, input.requestedBy, 'reset-bulk-failed', error, {
                targetCount: targets.length
            });
            throw error;
        }
    }
    maskPii(payload) {
        return this.maskValue(payload);
    }
    reviewAiInvocation(modelCode, usage) {
        const maskedPrompt = this.maskPii(usage.prompt ?? '');
        const budget = this.aiBudgets[usage.tenantId] ?? {
            monthlyBudgetTokens: 20_000,
            remainingTokens: 10_000
        };
        const estimatedTokens = usage.estimatedTokens ?? 0;
        const findings = [];
        let riskScore = 0;
        const prompt = usage.prompt ?? '';
        if (/password|api[_-]?key|secret|身份证|银行卡/i.test(prompt)) {
            findings.push('提示词包含疑似敏感信息，建议先脱敏。');
            riskScore += 50;
        }
        if (/ignore previous|system prompt|越权|bypass/i.test(prompt)) {
            findings.push('提示词包含潜在越权或注入迹象。');
            riskScore += 40;
        }
        if (estimatedTokens > budget.remainingTokens) {
            findings.push('预计消耗超过剩余预算，建议降级或人工复核。');
            riskScore += 35;
        }
        if ((usage.toolAccess?.length ?? 0) > 3) {
            findings.push('工具权限过多，建议收敛到最小权限。');
            riskScore += 20;
        }
        const verdict = riskScore >= 70 ? 'manual-review' : riskScore >= 35 ? 'approved-with-guardrails' : 'approved';
        return {
            modelCode,
            tenantId: usage.tenantId,
            purpose: usage.purpose,
            verdict,
            riskScore,
            maskedPrompt,
            findings,
            budget,
            controls: ['prompt-template', 'tool-permission', 'cost-budget', 'content-safety', 'human-fallback']
        };
    }
    getGovernanceBaselines() {
        return [
            {
                key: 'rate-limit-quota',
                name: '限流、配额与防滥用',
                ownerModule: 'trust-governance',
                summary: '所有公网入口与高成本能力都必须先进入统一限流与异常行为识别链路。',
                controls: [
                    '默认按 tenant、user、device、IP 四层限流，并区分 burst 与 steady-state。',
                    '门户登录、开放 API、Webhook、AI 调用都要支持配额与熔断。',
                    '挑战机制、黑白名单和人工复核作为高风险场景兜底。',
                    '封禁、放行、挑战都要保留审计证据和过期时间。'
                ],
                evidence: ['docs/operations-governance-baseline.md', 'apps/api/src/modules/foundation/trust-governance/trust-governance.service.ts']
            },
            {
                key: 'ai-cost-governance',
                name: 'AI 成本治理',
                ownerModule: 'trust-governance',
                summary: '把模型选择、令牌预算、调用熔断和人工兜底纳入统一成本控制面。',
                controls: [
                    '按租户、场景、模型维护月度预算和单次 token 上限。',
                    '高成本模型默认走审批或灰度白名单，超预算自动降级。',
                    '记录 prompt、工具权限、token 消耗、命中缓存与人工接管结果。',
                    '运营看板按市场、租户、能力面追踪 AI ROI 和异常成本。'
                ],
                evidence: ['docs/operations-governance-baseline.md', 'docs/security-baseline.md']
            }
        ];
    }
    getDescriptor() {
        return {
            key: 'trust-governance',
            name: 'Trust Governance Module',
            purpose: '统一审计、防滥用、隐私治理和 AI 治理入口。',
            inboundContracts: [
                'Security-sensitive state change',
                'Public API / webhook request metadata',
                'PII access intents',
                'AI invocation payload'
            ],
            outboundContracts: ['Audit trail', 'Rate-limit / abuse-control decision', 'PII masking policy', 'AI governance verdict'],
            capabilities: [
                {
                    key: 'audit',
                    name: '审计入口',
                    responsibilities: ['记录配置/权限/关键状态变更', '关联操作者与来源端', '为恢复和合规提供追溯链'],
                    entrypoints: ['TrustGovernanceService.recordAudit'],
                    consumers: ['market', 'portal', 'workbench', 'lyt-adapter'],
                    status: 'active'
                },
                {
                    key: 'rate-limit-abuse-control',
                    name: '限流防滥用入口',
                    responsibilities: ['按租户/账号/IP/设备限流', '预留验证码与挑战机制', '沉淀黑白名单和异常行为', '输出配额与封禁决策'],
                    entrypoints: ['TrustGovernanceService.evaluateRateLimit'],
                    consumers: ['portal', 'workbench', 'lyt-adapter'],
                    status: 'active'
                },
                {
                    key: 'privacy-governance',
                    name: '隐私治理入口',
                    responsibilities: ['PII 识别与脱敏', '用途约束和授权审批', '保留删除与主体请求响应'],
                    entrypoints: ['TrustGovernanceService.maskPii'],
                    consumers: ['market', 'portal', 'workbench'],
                    status: 'active'
                },
                {
                    key: 'ai-governance',
                    name: 'AI 治理入口',
                    responsibilities: ['统一模型与提示词模板配置', '治理成本配额与安全策略', '提供失败降级和人工兜底', '汇总模型用量与预算告警'],
                    entrypoints: ['TrustGovernanceService.reviewAiInvocation'],
                    consumers: ['portal', 'workbench'],
                    status: 'active'
                }
            ]
        };
    }
    serializeRateLimitState(state) {
        return {
            count: state.consumed,
            remaining: state.remaining,
            resetAt: state.resetAt.toISOString(),
            blockedUntil: state.blockedUntil ? state.blockedUntil.toISOString() : null,
            lastSeenAt: state.updatedAt.toISOString()
        };
    }
    maskValue(value) {
        if (Array.isArray(value)) {
            return value.map((item) => this.maskValue(item));
        }
        if (value && typeof value === 'object') {
            return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, this.maskValue(item)]));
        }
        if (typeof value !== 'string') {
            return value;
        }
        return value
            .replace(/([A-Za-z0-9._%+-])[A-Za-z0-9._%+-]*(@[A-Za-z0-9.-]+\.[A-Za-z]{2,})/g, '$1***$2')
            .replace(/(?<!\d)(1\d{2})\d{4}(\d{4})(?!\d)/g, '$1****$2')
            .replace(/(?<!\d)(\d{4})\d{8,11}(\d{4})(?!\d)/g, '$1********$2')
            .replace(/(Bearer\s+)[A-Za-z0-9._-]+/gi, '$1***')
            .replace(/([A-Za-z0-9_-]{4})[A-Za-z0-9_-]{8,}([A-Za-z0-9_-]{4})/g, '$1***$2');
    }
    toAuditRecord(record) {
        const metadata = this.getJsonRecord(record.metadata);
        return {
            auditId: record.id,
            eventType: record.action,
            tenantId: record.tenantId,
            actorId: record.operatorId,
            source: record.sourceChannel ?? undefined,
            riskLevel: this.getRiskLevel(metadata.riskLevel),
            occurredAt: record.createdAt.toISOString(),
            details: this.getJsonRecord(record.payload)
        };
    }
    getJsonRecord(value) {
        return value && typeof value === 'object' && !Array.isArray(value) ? value : {};
    }
    getRiskLevel(value) {
        return value === 'low' || value === 'medium' || value === 'high' ? value : 'medium';
    }
    toRateLimitPolicyRecord(policy) {
        return {
            id: policy.id,
            code: policy.code,
            scopeType: policy.scopeType,
            tenantId: policy.tenantId,
            brandId: policy.brandId,
            storeId: policy.storeId,
            integrationAppId: policy.integrationAppId,
            period: policy.period,
            limit: policy.limit,
            burstLimit: policy.burstLimit,
            dimensionKeys: policy.dimensionKeys,
            algorithm: policy.algorithm,
            metadata: this.getJsonRecord(policy.metadata),
            updatedAt: policy.updatedAt.toISOString()
        };
    }
    toQuotaLedgerRecord(ledger) {
        return {
            id: ledger.id,
            subjectKey: ledger.subjectKey,
            period: ledger.period,
            consumed: ledger.consumed,
            remaining: ledger.remaining,
            resetAt: ledger.resetAt.toISOString(),
            policy: {
                id: ledger.rateLimitPolicy.id,
                code: ledger.rateLimitPolicy.code,
                limit: ledger.rateLimitPolicy.limit,
                period: ledger.rateLimitPolicy.period
            },
            metadata: this.getJsonRecord(ledger.metadata),
            updatedAt: ledger.updatedAt.toISOString()
        };
    }
    async ensureRuntimeRateLimitPolicy(input, period) {
        const code = this.buildRuntimePolicyCode(input, period);
        const existing = await this.prisma.rateLimitPolicy.findUnique({
            where: { code }
        });
        if (existing) {
            return existing;
        }
        try {
            return await this.prisma.rateLimitPolicy.create({
                data: {
                    code,
                    scopeType: client_1.FoundationScopeType.TENANT,
                    period,
                    limit: input.limit,
                    burstLimit: input.limit,
                    dimensionKeys: ['scopeKey'],
                    algorithm: 'FIXED_WINDOW',
                    metadata: this.toInputJsonValue({
                        runtimeManaged: true,
                        windowSeconds: input.windowSeconds,
                        blockSeconds: input.blockSeconds ?? input.windowSeconds
                    })
                }
            });
        }
        catch (error) {
            if (!this.isUniqueConstraintError(error)) {
                throw error;
            }
            return this.prisma.rateLimitPolicy.findUniqueOrThrow({
                where: { code }
            });
        }
    }
    buildRuntimePolicyCode(input, period) {
        return `runtime:${period}:${input.limit}:${input.windowSeconds}:${input.blockSeconds ?? input.windowSeconds}`;
    }
    resolveQuotaPeriod(windowSeconds) {
        if (windowSeconds <= 60) {
            return client_1.QuotaPeriod.MINUTE;
        }
        if (windowSeconds <= 60 * 60) {
            return client_1.QuotaPeriod.HOUR;
        }
        if (windowSeconds <= 24 * 60 * 60) {
            return client_1.QuotaPeriod.DAY;
        }
        return client_1.QuotaPeriod.MONTH;
    }
    computeResetAt(now, windowSeconds) {
        const windowMs = Math.max(windowSeconds, 1) * 1000;
        const nextWindow = Math.floor(now.getTime() / windowMs) * windowMs + windowMs;
        return new Date(nextWindow);
    }
    getDate(value) {
        if (typeof value !== 'string') {
            return null;
        }
        const parsed = new Date(value);
        return Number.isNaN(parsed.getTime()) ? null : parsed;
    }
    isUniqueConstraintError(error) {
        return Boolean(error) && typeof error === 'object' && error.code === 'P2002';
    }
    async handleApprovalExecutionFailure(approval, actorId, failureStatus, error, details) {
        const failureReason = error instanceof Error ? error.message : 'Unknown execution failure';
        const failedApproval = await (0, governance_approval_1.markGovernanceApprovalExecutionFailed)(this.prisma, {
            approvalTicket: approval.ticket ?? '',
            failedBy: actorId ?? 'trust-governance',
            expectedVersion: approval.version ?? undefined,
            failureStatus,
            failureReason,
            summary: details
        });
        await this.recordAudit('foundation.approval.execution-failed', {
            approvalTicket: failedApproval.ticket,
            operation: failedApproval.operation,
            resourceType: failedApproval.resourceType,
            resourceKey: failedApproval.resourceKey,
            failureStatus,
            failureReason,
            ...(details ?? {})
        }, {
            actorId,
            source: 'trust-governance',
            riskLevel: 'high'
        });
    }
    buildGovernanceMetadata(operation, input) {
        return {
            operation,
            rbac: {
                resource: input.resource,
                action: input.action,
                requiredRoles: input.requiredRoles,
                requiredPermissions: input.requiredPermissions
            },
            approval: {
                required: input.approvalRequired,
                approvalId: input.approvalRecord?.approvalId ?? null,
                version: input.approvalRecord?.version ?? null,
                requestedBy: input.approvalRecord?.requestedBy ?? input.requestedBy ?? null,
                ticket: input.approvalRecord?.ticket ?? input.ticket ?? null,
                status: input.approvalRecord?.status ?? (input.approvalRequired ? (input.status ?? 'PENDING') : 'NOT_REQUIRED'),
                submitted: input.approvalRecord?.submitted ?? Boolean(input.ticket),
                persisted: input.approvalRecord?.persisted ?? false,
                decidedBy: input.approvalRecord?.decidedBy ?? null,
                decidedAt: input.approvalRecord?.decidedAt ?? null,
                updatedAt: input.approvalRecord?.updatedAt ?? null,
                execution: input.approvalRecord?.execution ?? {
                    attempts: 0,
                    executed: false,
                    executionStatus: null,
                    executedAt: null,
                    executedBy: null,
                    lastFailure: null
                }
            }
        };
    }
    buildResourceKey(...parts) {
        return parts.filter((part) => Boolean(part)).join(':');
    }
    toInputJsonValue(value) {
        return JSON.parse(JSON.stringify(value));
    }
};
exports.TrustGovernanceService = TrustGovernanceService;
exports.TrustGovernanceService = TrustGovernanceService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], TrustGovernanceService);
function nullToUndefined(value) {
    return value == null ? undefined : String(value);
}
//# sourceMappingURL=trust-governance.service.js.map