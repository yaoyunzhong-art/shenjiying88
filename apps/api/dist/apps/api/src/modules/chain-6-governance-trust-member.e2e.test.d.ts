/**
 * 跨模块链 #6: governance-approval ↔ trust-governance ↔ member
 *
 * 链路:
 *   1. HTTP → GovernanceApprovalController
 *   2. GovernanceApprovalService 状态变化 → emit outcome event
 *   3. MemberApprovalOutcomeRecorder (member 模块) 监听 member-profile resourceType
 *      并把 outcome 写入 Prisma.auditLog
 *   4. TrustGovernanceService.getAuditRecords 可通过 approvalTicket 过滤查询
 *      还原治理审批历史主链
 *
 * 验证:
 *   - APPROVED / REJECTED / CANCELLED / RESUBMITTED / SUPERSEDED / EXECUTED /
 *     EXECUTION_FAILED 各阶段都能被 member recorder 写入 auditLog
 *   - member hook 只消费 member-profile resourceType，其它 resourceType 不触发
 *   - hook 的 disposer 能正确解除订阅
 *   - trust-governance 通过 approvalTicket 反查可还原审批时间线
 *   - 多 hook 并行触发不丢失事件
 *   - tenant 隔离 (auditLog.tenantId 与 approval.tenantId 一致)
 *   - payload 含 previousStatus / decisionNote / failureReason 等关键字段
 */
import 'reflect-metadata';
//# sourceMappingURL=chain-6-governance-trust-member.e2e.test.d.ts.map