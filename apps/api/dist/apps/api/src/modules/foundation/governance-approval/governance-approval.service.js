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
exports.GovernanceApprovalService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../../prisma/prisma.service");
const governance_approval_1 = require("./governance-approval");
let GovernanceApprovalService = class GovernanceApprovalService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async listApprovals(query) {
        return (0, governance_approval_1.listGovernanceApprovals)(this.prisma, query);
    }
    async summarizeApprovals(query) {
        return (0, governance_approval_1.summarizeGovernanceApprovals)(this.prisma, query);
    }
    async getApproval(ticket) {
        return (0, governance_approval_1.getGovernanceApprovalByTicket)(this.prisma, ticket);
    }
    async materializeApproval(input) {
        return (0, governance_approval_1.materializeGovernanceApproval)(this.prisma, input);
    }
    // 从原始数据库记录获取层级上下文
    async getApprovalScope(approvalTicket) {
        try {
            const record = await this.prisma.governanceApproval?.findUnique({
                where: { approvalTicket }
            });
            if (record && typeof record === 'object') {
                return {
                    tenantId: record.tenantId ?? undefined,
                    brandId: record.brandId ?? undefined,
                    storeId: record.storeId ?? undefined
                };
            }
        }
        catch {
            // 不回退
        }
        return {};
    }
    async decideApproval(input) {
        // 获取当前状态（emit 需要 previousStatus）
        const before = await (0, governance_approval_1.getGovernanceApprovalByTicket)(this.prisma, input.approvalTicket);
        const scope = await this.getApprovalScope(input.approvalTicket);
        const result = await (0, governance_approval_1.decideGovernanceApproval)(this.prisma, input);
        await this.emitOutcomeEvent({
            resourceType: before.resourceType ?? 'unknown',
            resourceKey: before.resourceKey ?? 'unknown',
            ...scope,
            stage: input.status,
            previousStatus: before.status,
            decisionNote: input.decisionNote ?? null,
            approval: result
        });
        return result;
    }
    async cancelApproval(input) {
        const before = await (0, governance_approval_1.getGovernanceApprovalByTicket)(this.prisma, input.approvalTicket);
        const scope = await this.getApprovalScope(input.approvalTicket);
        const result = await (0, governance_approval_1.cancelGovernanceApproval)(this.prisma, input);
        await this.emitOutcomeEvent({
            resourceType: before.resourceType ?? 'unknown',
            resourceKey: before.resourceKey ?? 'unknown',
            ...scope,
            stage: 'CANCELLED',
            previousStatus: before.status,
            decisionNote: input.cancelReason ?? null,
            approval: result
        });
        return result;
    }
    async resubmitApproval(input) {
        const before = await (0, governance_approval_1.getGovernanceApprovalByTicket)(this.prisma, input.approvalTicket);
        const scope = await this.getApprovalScope(input.approvalTicket);
        const result = await (0, governance_approval_1.resubmitGovernanceApproval)(this.prisma, input);
        // 发出 SUPERSEDED 事件（原票据被替代）
        await this.emitOutcomeEvent({
            resourceType: before.resourceType ?? 'unknown',
            resourceKey: before.resourceKey ?? 'unknown',
            ...scope,
            stage: 'SUPERSEDED',
            previousStatus: before.status,
            decisionNote: input.resubmitReason ?? null,
            approval: {
                ...before,
                ticket: input.approvalTicket,
                status: 'SUPERSEDED'
            }
        });
        return result;
    }
    async markExecuted(input) {
        const before = await (0, governance_approval_1.getGovernanceApprovalByTicket)(this.prisma, input.approvalTicket);
        const scope = await this.getApprovalScope(input.approvalTicket);
        const result = await (0, governance_approval_1.markGovernanceApprovalExecuted)(this.prisma, input);
        await this.emitOutcomeEvent({
            resourceType: before.resourceType ?? 'unknown',
            resourceKey: before.resourceKey ?? 'unknown',
            ...scope,
            stage: 'EXECUTED',
            previousStatus: before.status,
            approval: result
        });
        return result;
    }
    async markExecutionFailed(input) {
        const before = await (0, governance_approval_1.getGovernanceApprovalByTicket)(this.prisma, input.approvalTicket);
        const scope = await this.getApprovalScope(input.approvalTicket);
        const result = await (0, governance_approval_1.markGovernanceApprovalExecutionFailed)(this.prisma, input);
        await this.emitOutcomeEvent({
            resourceType: before.resourceType ?? 'unknown',
            resourceKey: before.resourceKey ?? 'unknown',
            ...scope,
            stage: 'EXECUTION_FAILED',
            previousStatus: before.status,
            decisionNote: null,
            failureReason: input.failureReason ?? null,
            approval: result
        });
        return result;
    }
    // --------------- outcome 钩子管理 ---------------
    outcomeHooks = new Map();
    /**
     * 注册 outcome 钩子，返回断开函数
     */
    registerApprovalOutcomeHook(resourceType, hook) {
        const hooks = this.outcomeHooks.get(resourceType) ?? [];
        hooks.push(hook);
        this.outcomeHooks.set(resourceType, hooks);
        return () => {
            const list = this.outcomeHooks.get(resourceType);
            if (list) {
                const idx = list.indexOf(hook);
                if (idx >= 0)
                    list.splice(idx, 1);
            }
        };
    }
    /**
     * 触发 outcome 钩子（在审批决策/执行完成后由调用方调用）
     */
    async emitOutcomeEvent(event) {
        const hooks = this.outcomeHooks.get(event.resourceType) ?? [];
        const globalHooks = this.outcomeHooks.get('*') ?? [];
        await Promise.all([...hooks, ...globalHooks].map((h) => h(event)));
    }
    onModuleDestroy() {
        this.outcomeHooks.clear();
    }
};
exports.GovernanceApprovalService = GovernanceApprovalService;
exports.GovernanceApprovalService = GovernanceApprovalService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], GovernanceApprovalService);
//# sourceMappingURL=governance-approval.service.js.map