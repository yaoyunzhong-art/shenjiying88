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
exports.MEMBER_APPROVAL_OUTCOME_RESOURCE_TYPE = exports.MemberApprovalOutcomeRecorder = void 0;
const common_1 = require("@nestjs/common");
const governance_approval_service_1 = require("../foundation/governance-approval/governance-approval.service");
const prisma_service_1 = require("../../prisma/prisma.service");
const RESOURCE_TYPE = 'member-profile';
/**
 * 会员审批结果回写器：把 governance approval 的 outcome 事件
 * 落进 member-profile 专属 AuditLog，作为真实持久化的审批历史主链。
 *
 * 由 MemberModule 初始化，不依赖已移除的 outcome hook 机制。
 */
let MemberApprovalOutcomeRecorder = class MemberApprovalOutcomeRecorder {
    prisma;
    governanceApprovalService;
    constructor(prisma, governanceApprovalService) {
        this.prisma = prisma;
        this.governanceApprovalService = governanceApprovalService;
    }
    async recordOutcome(event) {
        if (event.resourceType !== RESOURCE_TYPE) {
            return;
        }
        const auditLogModel = this.getAuditLogModel();
        if (!auditLogModel?.create) {
            return;
        }
        const tenantId = event.tenantId ?? '';
        if (!tenantId) {
            return;
        }
        const action = `member.approval.${event.stage.toLowerCase()}`;
        const summary = this.buildOutcomeSummary(event);
        await auditLogModel.create({
            data: {
                tenantId,
                brandId: event.brandId ?? null,
                storeId: event.storeId ?? null,
                action,
                operatorId: this.resolveOperatorId(event),
                resourceType: RESOURCE_TYPE,
                resourceId: event.resourceKey,
                sourceChannel: 'governance-approval',
                purpose: 'member-approval-outcome',
                payload: this.buildPayload(event),
                beforeValue: this.buildBeforeValue(event),
                afterValue: this.buildAfterValue(event),
                metadata: {
                    summary,
                    stage: event.stage,
                    previousStatus: event.previousStatus ?? null
                }
            }
        });
    }
    getAuditLogModel() {
        const candidate = this.prisma.auditLog;
        if (candidate?.create) {
            return candidate;
        }
        const fallback = this.prisma.auditlog;
        return fallback ?? null;
    }
    buildOutcomeSummary(event) {
        const op = String(event.approval.operation ?? 'member.action');
        switch (event.stage) {
            case 'APPROVED':
                return `审批通过：${op}`;
            case 'REJECTED':
                return `审批驳回：${op}`;
            case 'CANCELLED':
                return `审批撤销：${op}`;
            case 'EXECUTED':
                return `审批动作已执行：${op}`;
            case 'EXECUTION_FAILED':
                return `审批动作执行失败：${op}`;
            case 'RESUBMITTED':
                return `审批重新提交：${op}`;
            case 'SUPERSEDED':
                return `审批已被替代：${op}`;
            default:
                return `审批状态变化：${op}`;
        }
    }
    resolveOperatorId(event) {
        if (event.stage === 'APPROVED' || event.stage === 'REJECTED') {
            return event.approval.decidedBy ?? event.approval.requestedBy ?? 'governance-approval';
        }
        if (event.stage === 'CANCELLED') {
            return event.approval.decidedBy ?? 'governance-approval';
        }
        if (event.stage === 'EXECUTED' || event.stage === 'EXECUTION_FAILED') {
            return event.approval.requestedBy ?? 'governance-approval';
        }
        return event.approval.requestedBy ?? 'governance-approval';
    }
    buildPayload(event) {
        return {
            stage: event.stage,
            approvalTicket: event.approval.ticket ?? null,
            approvalStatus: event.approval.status,
            operation: event.approval.operation,
            resourceKey: event.resourceKey,
            decisionNote: event.decisionNote ?? null,
            failureReason: event.failureReason ?? null,
            previousStatus: event.previousStatus ?? null,
            requestedBy: event.approval.requestedBy ?? null,
            summary: event.approval.summary ?? null
        };
    }
    buildBeforeValue(event) {
        if (!event.previousStatus) {
            return undefined;
        }
        return {
            approvalStatus: event.previousStatus
        };
    }
    buildAfterValue(event) {
        return {
            approvalStatus: event.approval.status,
            stage: event.stage
        };
    }
};
exports.MemberApprovalOutcomeRecorder = MemberApprovalOutcomeRecorder;
exports.MemberApprovalOutcomeRecorder = MemberApprovalOutcomeRecorder = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        governance_approval_service_1.GovernanceApprovalService])
], MemberApprovalOutcomeRecorder);
exports.MEMBER_APPROVAL_OUTCOME_RESOURCE_TYPE = RESOURCE_TYPE;
//# sourceMappingURL=member-approval-recorder.js.map