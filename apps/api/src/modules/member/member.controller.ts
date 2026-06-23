import { Controller, Get, Post, Param, Body } from '@nestjs/common';
import type {
  LytMemberSnapshotContract,
  MemberOperationsExecutionReceiptContract,
  MemberOperationsProfileContract,
  MemberOperationsTaskContract,
  MemberProfileContract,
  RuntimeGovernanceReceipt
} from '@m5/types';
import { TenantContext } from '../tenant/tenant.decorator';
import type { RequestTenantContext } from '../tenant/tenant.types';
import { MemberService } from './member.service';
import type {
  MemberMutationApprovalResult,
  MemberProfile,
  MemberProfileMutationHistoryEntry
} from './member.entity';
import {
  MemberLevelAdjustDto,
  MemberLoginDto,
  MemberPaymentActivityDto,
  MemberPersistentProfileUpdateDto,
  MemberPersistentRegisterDto,
  MemberPointsAdjustDto,
  MemberStatusAdjustDto
} from './member.dto';

@Controller('members')
export class MemberController {
  constructor(private readonly memberService: MemberService) {}

  @Get('bootstrap')
  getBootstrap(@TenantContext() tenantContext: RequestTenantContext) {
    return this.memberService.getBootstrap(tenantContext);
  }

  /** 列出持久化会员 */
  @Get('persistent')
  async listPersistentProfiles(@TenantContext() tenantContext: RequestTenantContext): Promise<MemberProfileContract[]> {
    return this.memberService.listPersistentProfiles(tenantContext);
  }

  /** 列出 LYT 标准会员快照 */
  @Get('persistent/snapshots')
  async listLytMemberSnapshots(
    @TenantContext() tenantContext: RequestTenantContext
  ): Promise<LytMemberSnapshotContract[]> {
    return this.memberService.listLytMemberSnapshots(tenantContext);
  }

  /** 获取 LYT 标准会员快照 */
  @Get('persistent/snapshots/:externalMemberId')
  async getLytMemberSnapshot(
    @Param('externalMemberId') externalMemberId: string,
    @TenantContext() tenantContext: RequestTenantContext
  ): Promise<LytMemberSnapshotContract> {
    const snapshot = await this.memberService.getLytMemberSnapshot(externalMemberId, tenantContext);
    if (!snapshot) {
      throw new Error(`LYT member snapshot ${externalMemberId} not found`);
    }
    return snapshot;
  }

  /** 获取持久化会员档案 */
  @Get('persistent/:memberId')
  async getPersistentProfile(
    @Param('memberId') memberId: string,
    @TenantContext() tenantContext: RequestTenantContext
  ): Promise<MemberProfileContract> {
    const profile = await this.memberService.getPersistentProfile(memberId, tenantContext);
    if (!profile) {
      throw new Error(`Persistent member ${memberId} not found`);
    }
    return profile;
  }

  /** 获取持久化会员最近操作历史 */
  @Get('persistent/:memberId/history')
  async listPersistentMutationHistory(
    @Param('memberId') memberId: string,
    @TenantContext() tenantContext: RequestTenantContext
  ): Promise<MemberProfileMutationHistoryEntry[]> {
    return this.memberService.listPersistentMutationHistory(memberId, tenantContext);
  }

  /** 获取会员运营画像与动作建议 */
  @Get('persistent/:memberId/operations-profile')
  async getOperationsProfile(
    @Param('memberId') memberId: string,
    @TenantContext() tenantContext: RequestTenantContext
  ): Promise<MemberOperationsProfileContract> {
    const operationsProfile = await this.memberService.getOperationsProfile(memberId, tenantContext);
    if (!operationsProfile) {
      throw new Error(`Member operations profile ${memberId} not found`);
    }
    return operationsProfile;
  }

  /** 获取会员运营任务队列 */
  @Get('persistent/:memberId/operations-tasks')
  async listOperationsTasks(
    @Param('memberId') memberId: string,
    @TenantContext() tenantContext: RequestTenantContext
  ): Promise<MemberOperationsTaskContract[]> {
    return this.memberService.listOperationsTasks(memberId, tenantContext);
  }

  /** 获取会员运营执行回执 */
  @Get('persistent/:memberId/operations-receipts')
  async listOperationsReceipts(
    @Param('memberId') memberId: string,
    @TenantContext() tenantContext: RequestTenantContext
  ): Promise<MemberOperationsExecutionReceiptContract[]> {
    return this.memberService.listOperationsReceipts(memberId, tenantContext);
  }

  /** 获取某条会员运营执行回执对应的 runtime 治理轨迹 */
  @Get('persistent/:memberId/operations-receipts/:executionId/runtime')
  async getOperationsRuntimeReceipt(
    @Param('memberId') memberId: string,
    @Param('executionId') executionId: string,
    @TenantContext() tenantContext: RequestTenantContext
  ): Promise<RuntimeGovernanceReceipt> {
    const receipt = await this.memberService.getOperationsRuntimeReceipt(memberId, executionId, tenantContext);
    if (!receipt) {
      throw new Error(`Member operations runtime receipt ${executionId} not found`);
    }
    return receipt;
  }

  /** 对某条会员运营执行回执触发 runtime replay */
  @Post('persistent/:memberId/operations-receipts/:executionId/replay')
  async replayOperationsExecution(
    @Param('memberId') memberId: string,
    @Param('executionId') executionId: string,
    @TenantContext() tenantContext: RequestTenantContext
  ) {
    const replayed = await this.memberService.replayOperationsExecution(memberId, executionId, tenantContext);
    if (!replayed) {
      throw new Error(`Member operations runtime replay ${executionId} not found`);
    }
    return replayed;
  }

  /** 注册新会员 */
  @Post('register')
  register(
    @TenantContext() tenantContext: RequestTenantContext,
    @Body() body: { memberId: string; nickname: string }
  ): MemberProfile {
    return this.memberService.register({
      memberId: body.memberId,
      tenantContext,
      nickname: body.nickname
    });
  }

  /** 持久化注册会员 */
  @Post('persistent/register')
  async registerPersistent(
    @TenantContext() tenantContext: RequestTenantContext,
    @Body() body: MemberPersistentRegisterDto
  ) {
    return this.memberService.registerPersistent({
      tenantContext,
      mobile: body.mobile,
      nickname: body.nickname,
      initialPoints: body.initialPoints
    });
  }

  /** 更新持久化会员基础资料 */
  @Post('persistent/:memberId/profile')
  async updatePersistentProfile(
    @Param('memberId') memberId: string,
    @TenantContext() tenantContext: RequestTenantContext,
    @Body() body: MemberPersistentProfileUpdateDto
  ) {
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
  @Post('persistent/:memberId/points/award')
  async awardPersistentPoints(
    @Param('memberId') memberId: string,
    @TenantContext() tenantContext: RequestTenantContext,
    @Body() body: MemberPointsAdjustDto
  ): Promise<MemberProfileContract | MemberMutationApprovalResult> {
    return this.memberService.awardPoints(memberId, body.points, tenantContext, body.approvalTicket);
  }

  /** 持久化会员扣减积分 */
  @Post('persistent/:memberId/points/rollback')
  async rollbackPersistentPoints(
    @Param('memberId') memberId: string,
    @TenantContext() tenantContext: RequestTenantContext,
    @Body() body: MemberPointsAdjustDto
  ): Promise<MemberProfileContract | MemberMutationApprovalResult> {
    return this.memberService.rollbackPoints(memberId, body.points, tenantContext, body.approvalTicket);
  }

  /** 更新持久化会员状态 */
  @Post('persistent/:memberId/status')
  async updatePersistentStatus(
    @Param('memberId') memberId: string,
    @TenantContext() tenantContext: RequestTenantContext,
    @Body() body: MemberStatusAdjustDto
  ): Promise<MemberProfileContract | MemberMutationApprovalResult> {
    return this.memberService.updatePersistentStatus(memberId, body.status, tenantContext, body.approvalTicket);
  }

  /** 手工调整持久化会员等级 */
  @Post('persistent/:memberId/level')
  async overridePersistentLevel(
    @Param('memberId') memberId: string,
    @TenantContext() tenantContext: RequestTenantContext,
    @Body() body: MemberLevelAdjustDto
  ): Promise<MemberProfileContract | MemberMutationApprovalResult> {
    return this.memberService.overridePersistentLevel(memberId, body.level, tenantContext, body.approvalTicket);
  }

  /** 记录持久化会员支付行为 */
  @Post('persistent/:memberId/payment-activity')
  async recordPersistentPaymentActivity(
    @Param('memberId') memberId: string,
    @TenantContext() tenantContext: RequestTenantContext,
    @Body() body: MemberPaymentActivityDto
  ) {
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
  @Post('login')
  async login(
    @TenantContext() tenantContext: RequestTenantContext,
    @Body() body: MemberLoginDto
  ) {
    return this.memberService.login({
      tenantContext,
      mobile: body.mobile
    });
  }

  /** 查询登录态 */
  @Get('sessions/:sessionToken')
  getSession(@Param('sessionToken') sessionToken: string) {
    const session = this.memberService.getSession(sessionToken);
    if (!session) {
      throw new Error(`Member session ${sessionToken} not found`);
    }
    return session;
  }

  /** 获取会员档案 */
  @Get(':memberId')
  getProfile(@Param('memberId') memberId: string): MemberProfile {
    const profile = this.memberService.getProfile(memberId);
    if (!profile) {
      throw new Error(`Member ${memberId} not found`);
    }
    return profile;
  }

  /** 列出所有会员 */
  @Get()
  listProfiles(): MemberProfile[] {
    return this.memberService.listProfiles();
  }

  /** 增加积分 */
  @Post(':memberId/add-points')
  addPoints(
    @Param('memberId') memberId: string,
    @Body() body: { points: number }
  ): MemberProfile {
    return this.memberService.addPoints(memberId, body.points);
  }

  /** 检查是否可升级 */
  @Get(':memberId/upgrade-check')
  checkUpgrade(@Param('memberId') memberId: string) {
    return this.memberService.checkUpgrade(memberId);
  }
}
