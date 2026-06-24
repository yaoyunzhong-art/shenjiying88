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
exports.MemberController = void 0;
const common_1 = require("@nestjs/common");
const tenant_decorator_1 = require("../tenant/tenant.decorator");
const member_service_1 = require("./member.service");
const member_dto_1 = require("./member.dto");
let MemberController = class MemberController {
    memberService;
    constructor(memberService) {
        this.memberService = memberService;
    }
    getBootstrap(tenantContext) {
        return this.memberService.getBootstrap(tenantContext);
    }
    /** 列出持久化会员 */
    async listPersistentProfiles(tenantContext) {
        return this.memberService.listPersistentProfiles(tenantContext);
    }
    /** 列出 LYT 标准会员快照 */
    async listLytMemberSnapshots(tenantContext) {
        return this.memberService.listLytMemberSnapshots(tenantContext);
    }
    /** 获取 LYT 标准会员快照 */
    async getLytMemberSnapshot(externalMemberId, tenantContext) {
        const snapshot = await this.memberService.getLytMemberSnapshot(externalMemberId, tenantContext);
        if (!snapshot) {
            throw new Error(`LYT member snapshot ${externalMemberId} not found`);
        }
        return snapshot;
    }
    /** 获取持久化会员档案 */
    async getPersistentProfile(memberId, tenantContext) {
        const profile = await this.memberService.getPersistentProfile(memberId, tenantContext);
        if (!profile) {
            throw new Error(`Persistent member ${memberId} not found`);
        }
        return profile;
    }
    /** 获取持久化会员最近操作历史 */
    async listPersistentMutationHistory(memberId, tenantContext) {
        return this.memberService.listPersistentMutationHistory(memberId, tenantContext);
    }
    /** 获取会员运营画像与动作建议 */
    async getOperationsProfile(memberId, tenantContext) {
        const operationsProfile = await this.memberService.getOperationsProfile(memberId, tenantContext);
        if (!operationsProfile) {
            throw new Error(`Member operations profile ${memberId} not found`);
        }
        return operationsProfile;
    }
    /** 获取会员运营任务队列 */
    async listOperationsTasks(memberId, tenantContext) {
        return this.memberService.listOperationsTasks(memberId, tenantContext);
    }
    /** 获取会员运营执行回执 */
    async listOperationsReceipts(memberId, tenantContext) {
        return this.memberService.listOperationsReceipts(memberId, tenantContext);
    }
    /** 获取某条会员运营执行回执对应的 runtime 治理轨迹 */
    async getOperationsRuntimeReceipt(memberId, executionId, tenantContext) {
        const receipt = await this.memberService.getOperationsRuntimeReceipt(memberId, executionId, tenantContext);
        if (!receipt) {
            throw new Error(`Member operations runtime receipt ${executionId} not found`);
        }
        return receipt;
    }
    /** 对某条会员运营执行回执触发 runtime replay */
    async replayOperationsExecution(memberId, executionId, tenantContext) {
        const replayed = await this.memberService.replayOperationsExecution(memberId, executionId, tenantContext);
        if (!replayed) {
            throw new Error(`Member operations runtime replay ${executionId} not found`);
        }
        return replayed;
    }
    /** 注册新会员 */
    register(tenantContext, body) {
        return this.memberService.register({
            memberId: body.memberId,
            tenantContext,
            nickname: body.nickname
        });
    }
    /** 持久化注册会员 */
    async registerPersistent(tenantContext, body) {
        return this.memberService.registerPersistent({
            tenantContext,
            mobile: body.mobile,
            nickname: body.nickname,
            initialPoints: body.initialPoints
        });
    }
    /** 更新持久化会员基础资料 */
    async updatePersistentProfile(memberId, tenantContext, body) {
        return this.memberService.updatePersistentProfile({
            memberId,
            tenantContext,
            nickname: body.nickname,
            mobile: body.mobile,
            email: body.email,
            address: body.address,
            notes: body.notes
        });
    }
    /** 持久化会员加积分 */
    async awardPersistentPoints(memberId, tenantContext, body) {
        return this.memberService.awardPoints(memberId, body.points, tenantContext, body.approvalTicket);
    }
    /** 持久化会员扣减积分 */
    async rollbackPersistentPoints(memberId, tenantContext, body) {
        return this.memberService.rollbackPoints(memberId, body.points, tenantContext, body.approvalTicket);
    }
    /** 更新持久化会员状态 */
    async updatePersistentStatus(memberId, tenantContext, body) {
        return this.memberService.updatePersistentStatus(memberId, body.status, tenantContext, body.approvalTicket);
    }
    /** 手工调整持久化会员等级 */
    async overridePersistentLevel(memberId, tenantContext, body) {
        return this.memberService.overridePersistentLevel(memberId, body.level, tenantContext, body.approvalTicket);
    }
    /** 记录持久化会员支付行为 */
    async recordPersistentPaymentActivity(memberId, tenantContext, body) {
        return this.memberService.recordPaymentActivity({
            memberId,
            tenantContext,
            orderId: body.orderId,
            amount: body.amount,
            paidAt: body.paidAt,
            channel: body.channel,
            source: body.source
        });
    }
    /** 会员登录 */
    async login(tenantContext, body) {
        return this.memberService.login({
            tenantContext,
            mobile: body.mobile
        });
    }
    /** 查询登录态 */
    getSession(sessionToken) {
        const session = this.memberService.getSession(sessionToken);
        if (!session) {
            throw new Error(`Member session ${sessionToken} not found`);
        }
        return session;
    }
    /** 获取会员档案 */
    getProfile(memberId) {
        const profile = this.memberService.getProfile(memberId);
        if (!profile) {
            throw new Error(`Member ${memberId} not found`);
        }
        return profile;
    }
    /** 列出所有会员 */
    listProfiles() {
        return this.memberService.listProfiles();
    }
    /** 增加积分 */
    addPoints(memberId, body) {
        return this.memberService.addPoints(memberId, body.points);
    }
    /** 检查是否可升级 */
    checkUpgrade(memberId) {
        return this.memberService.checkUpgrade(memberId);
    }
};
exports.MemberController = MemberController;
__decorate([
    (0, common_1.Get)('bootstrap'),
    __param(0, (0, tenant_decorator_1.TenantContext)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], MemberController.prototype, "getBootstrap", null);
__decorate([
    (0, common_1.Get)('persistent'),
    __param(0, (0, tenant_decorator_1.TenantContext)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], MemberController.prototype, "listPersistentProfiles", null);
__decorate([
    (0, common_1.Get)('persistent/snapshots'),
    __param(0, (0, tenant_decorator_1.TenantContext)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], MemberController.prototype, "listLytMemberSnapshots", null);
__decorate([
    (0, common_1.Get)('persistent/snapshots/:externalMemberId'),
    __param(0, (0, common_1.Param)('externalMemberId')),
    __param(1, (0, tenant_decorator_1.TenantContext)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], MemberController.prototype, "getLytMemberSnapshot", null);
__decorate([
    (0, common_1.Get)('persistent/:memberId'),
    __param(0, (0, common_1.Param)('memberId')),
    __param(1, (0, tenant_decorator_1.TenantContext)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], MemberController.prototype, "getPersistentProfile", null);
__decorate([
    (0, common_1.Get)('persistent/:memberId/history'),
    __param(0, (0, common_1.Param)('memberId')),
    __param(1, (0, tenant_decorator_1.TenantContext)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], MemberController.prototype, "listPersistentMutationHistory", null);
__decorate([
    (0, common_1.Get)('persistent/:memberId/operations-profile'),
    __param(0, (0, common_1.Param)('memberId')),
    __param(1, (0, tenant_decorator_1.TenantContext)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], MemberController.prototype, "getOperationsProfile", null);
__decorate([
    (0, common_1.Get)('persistent/:memberId/operations-tasks'),
    __param(0, (0, common_1.Param)('memberId')),
    __param(1, (0, tenant_decorator_1.TenantContext)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], MemberController.prototype, "listOperationsTasks", null);
__decorate([
    (0, common_1.Get)('persistent/:memberId/operations-receipts'),
    __param(0, (0, common_1.Param)('memberId')),
    __param(1, (0, tenant_decorator_1.TenantContext)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], MemberController.prototype, "listOperationsReceipts", null);
__decorate([
    (0, common_1.Get)('persistent/:memberId/operations-receipts/:executionId/runtime'),
    __param(0, (0, common_1.Param)('memberId')),
    __param(1, (0, common_1.Param)('executionId')),
    __param(2, (0, tenant_decorator_1.TenantContext)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", Promise)
], MemberController.prototype, "getOperationsRuntimeReceipt", null);
__decorate([
    (0, common_1.Post)('persistent/:memberId/operations-receipts/:executionId/replay'),
    __param(0, (0, common_1.Param)('memberId')),
    __param(1, (0, common_1.Param)('executionId')),
    __param(2, (0, tenant_decorator_1.TenantContext)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", Promise)
], MemberController.prototype, "replayOperationsExecution", null);
__decorate([
    (0, common_1.Post)('register'),
    __param(0, (0, tenant_decorator_1.TenantContext)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Object)
], MemberController.prototype, "register", null);
__decorate([
    (0, common_1.Post)('persistent/register'),
    __param(0, (0, tenant_decorator_1.TenantContext)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, member_dto_1.MemberPersistentRegisterDto]),
    __metadata("design:returntype", Promise)
], MemberController.prototype, "registerPersistent", null);
__decorate([
    (0, common_1.Post)('persistent/:memberId/profile'),
    __param(0, (0, common_1.Param)('memberId')),
    __param(1, (0, tenant_decorator_1.TenantContext)()),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, member_dto_1.MemberPersistentProfileUpdateDto]),
    __metadata("design:returntype", Promise)
], MemberController.prototype, "updatePersistentProfile", null);
__decorate([
    (0, common_1.Post)('persistent/:memberId/points/award'),
    __param(0, (0, common_1.Param)('memberId')),
    __param(1, (0, tenant_decorator_1.TenantContext)()),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, member_dto_1.MemberPointsAdjustDto]),
    __metadata("design:returntype", Promise)
], MemberController.prototype, "awardPersistentPoints", null);
__decorate([
    (0, common_1.Post)('persistent/:memberId/points/rollback'),
    __param(0, (0, common_1.Param)('memberId')),
    __param(1, (0, tenant_decorator_1.TenantContext)()),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, member_dto_1.MemberPointsAdjustDto]),
    __metadata("design:returntype", Promise)
], MemberController.prototype, "rollbackPersistentPoints", null);
__decorate([
    (0, common_1.Post)('persistent/:memberId/status'),
    __param(0, (0, common_1.Param)('memberId')),
    __param(1, (0, tenant_decorator_1.TenantContext)()),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, member_dto_1.MemberStatusAdjustDto]),
    __metadata("design:returntype", Promise)
], MemberController.prototype, "updatePersistentStatus", null);
__decorate([
    (0, common_1.Post)('persistent/:memberId/level'),
    __param(0, (0, common_1.Param)('memberId')),
    __param(1, (0, tenant_decorator_1.TenantContext)()),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, member_dto_1.MemberLevelAdjustDto]),
    __metadata("design:returntype", Promise)
], MemberController.prototype, "overridePersistentLevel", null);
__decorate([
    (0, common_1.Post)('persistent/:memberId/payment-activity'),
    __param(0, (0, common_1.Param)('memberId')),
    __param(1, (0, tenant_decorator_1.TenantContext)()),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, member_dto_1.MemberPaymentActivityDto]),
    __metadata("design:returntype", Promise)
], MemberController.prototype, "recordPersistentPaymentActivity", null);
__decorate([
    (0, common_1.Post)('login'),
    __param(0, (0, tenant_decorator_1.TenantContext)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, member_dto_1.MemberLoginDto]),
    __metadata("design:returntype", Promise)
], MemberController.prototype, "login", null);
__decorate([
    (0, common_1.Get)('sessions/:sessionToken'),
    __param(0, (0, common_1.Param)('sessionToken')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], MemberController.prototype, "getSession", null);
__decorate([
    (0, common_1.Get)(':memberId'),
    __param(0, (0, common_1.Param)('memberId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Object)
], MemberController.prototype, "getProfile", null);
__decorate([
    (0, common_1.Get)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Array)
], MemberController.prototype, "listProfiles", null);
__decorate([
    (0, common_1.Post)(':memberId/add-points'),
    __param(0, (0, common_1.Param)('memberId')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Object)
], MemberController.prototype, "addPoints", null);
__decorate([
    (0, common_1.Get)(':memberId/upgrade-check'),
    __param(0, (0, common_1.Param)('memberId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], MemberController.prototype, "checkUpgrade", null);
exports.MemberController = MemberController = __decorate([
    (0, common_1.Controller)('members'),
    __metadata("design:paramtypes", [member_service_1.MemberService])
], MemberController);
//# sourceMappingURL=member.controller.js.map