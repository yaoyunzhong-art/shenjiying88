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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.GovernanceApprovalController = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../../prisma/prisma.service");
const governance_approval_1 = require("./governance-approval");
let GovernanceApprovalController = class GovernanceApprovalController {
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
    async decideApproval(input) {
        return (0, governance_approval_1.decideGovernanceApproval)(this.prisma, input);
    }
    async cancelApproval(input) {
        return (0, governance_approval_1.cancelGovernanceApproval)(this.prisma, input);
    }
    async resubmitApproval(input) {
        return (0, governance_approval_1.resubmitGovernanceApproval)(this.prisma, input);
    }
    async markExecuted(input) {
        return (0, governance_approval_1.markGovernanceApprovalExecuted)(this.prisma, input);
    }
    async markExecutionFailed(input) {
        return (0, governance_approval_1.markGovernanceApprovalExecutionFailed)(this.prisma, input);
    }
};
exports.GovernanceApprovalController = GovernanceApprovalController;
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], GovernanceApprovalController.prototype, "listApprovals", null);
__decorate([
    (0, common_1.Get)('summarize'),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], GovernanceApprovalController.prototype, "summarizeApprovals", null);
__decorate([
    (0, common_1.Get)(':ticket'),
    __param(0, (0, common_1.Param)('ticket')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], GovernanceApprovalController.prototype, "getApproval", null);
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], GovernanceApprovalController.prototype, "materializeApproval", null);
__decorate([
    (0, common_1.Post)('decide'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], GovernanceApprovalController.prototype, "decideApproval", null);
__decorate([
    (0, common_1.Post)('cancel'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], GovernanceApprovalController.prototype, "cancelApproval", null);
__decorate([
    (0, common_1.Post)('resubmit'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], GovernanceApprovalController.prototype, "resubmitApproval", null);
__decorate([
    (0, common_1.Post)('execute'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], GovernanceApprovalController.prototype, "markExecuted", null);
__decorate([
    (0, common_1.Post)('execute-failure'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], GovernanceApprovalController.prototype, "markExecutionFailed", null);
exports.GovernanceApprovalController = GovernanceApprovalController = __decorate([
    (0, common_1.Controller)('foundation/governance-approval'),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], GovernanceApprovalController);
//# sourceMappingURL=governance-approval.controller.js.map