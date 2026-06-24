"use strict";
/**
 * 🦞 跨模块 E2E 测试链 #3: 身份认证 → 治理审批 → 运行时回调
 *
 * 模拟链路:
 *   identity-access (token/guard/roles)
 *   → trust-governance (approval submit → approve/reject → execution)
 *   → runtime-governance (submit → sync → callback → replay)
 *
 * 验证:
 *   - 审批提交到执行的全生命周期
 *   - runtime receipt 的 submit/sync/callback/replay 四阶段状态链
 *   - governance alert 与 drilldown 的正确组合
 *   - 幂等性与并发保护
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const strict_1 = __importDefault(require("node:assert/strict"));
const node_test_1 = __importDefault(require("node:test"));
// ---- 模拟实现: identity-access guard ---
class IdentityGuard {
    authorize(ctx, requiredRoles) {
        if (!ctx.tenantId)
            return false;
        if (!ctx.role)
            return false;
        return requiredRoles.includes(ctx.role);
    }
    extractTenantScope(ctx) {
        return `tenant:${ctx.tenantId}:${ctx.role}`;
    }
}
// ---- 模拟实现: trust-governance ----
class TrustGovernanceService {
    approvals = new Map();
    audits = [];
    idCounter = 0;
    submitApproval(operation, resourceType, resourceKey, payload, requestedBy) {
        const ticket = `approval-${++this.idCounter}`;
        const approval = {
            approvalTicket: ticket,
            operation,
            resourceType,
            resourceKey,
            status: 'pending-approval',
            requestedBy,
            payload,
        };
        this.approvals.set(ticket, approval);
        this.recordAudit(ticket, 'approval-submitted', 'trust-governance', 'low');
        return approval;
    }
    approve(ticket, decidedBy) {
        const approval = this.approvals.get(ticket);
        if (!approval)
            throw new Error('approval not found');
        if (approval.status === 'rejected')
            throw new Error('approval-rejected');
        if (approval.status === 'approved')
            throw new Error('already approved');
        if (approval.status === 'executed')
            throw new Error('already executed');
        approval.status = 'approved';
        approval.decidedBy = decidedBy;
        this.recordAudit(ticket, 'approval-approved', 'trust-governance', 'medium');
        return approval;
    }
    reject(ticket, decidedBy) {
        const approval = this.approvals.get(ticket);
        if (!approval)
            throw new Error('approval not found');
        approval.status = 'rejected';
        approval.decidedBy = decidedBy;
        this.recordAudit(ticket, 'approval-rejected', 'trust-governance', 'medium');
        return approval;
    }
    execute(ticket, payload) {
        const approval = this.approvals.get(ticket);
        if (!approval)
            throw new Error('approval not found');
        if (approval.status === 'rejected')
            throw new Error('approval-rejected: cannot execute rejected');
        if (approval.status !== 'approved')
            throw new Error('approval not yet approved');
        // guard against payload replay
        const submittedHash = JSON.stringify(approval.payload);
        const executeHash = JSON.stringify(payload);
        if (submittedHash !== executeHash)
            throw new Error('payload mismatch: potential replay attack');
        approval.status = 'executed';
        this.recordAudit(ticket, 'approval-executed', 'trust-governance', 'high');
        return approval;
    }
    recordAudit(ticket, action, source, riskLevel) {
        this.audits.push({
            id: `audit-${this.audits.length + 1}`,
            approvalTicket: ticket,
            action,
            source,
            riskLevel,
            timestamp: new Date().toISOString(),
        });
    }
    getAudits(ticket) {
        return this.audits.filter(a => a.approvalTicket === ticket);
    }
    getApproval(ticket) {
        return this.approvals.get(ticket);
    }
}
// ---- 模拟实现: runtime-governance ----
class RuntimeGovernanceService {
    receipts = new Map();
    alerts = [];
    receiptCounter = 0;
    submit(action, tenantScope, payload) {
        const code = `receipt-${++this.receiptCounter}`;
        const receipt = {
            receiptCode: code,
            action,
            tenantScope,
            status: 'awaiting-sync',
            submittedAt: new Date().toISOString(),
            replayable: true,
            retryCount: 0,
        };
        this.receipts.set(code, receipt);
        return receipt;
    }
    sync(receiptCode) {
        const receipt = this.receipts.get(receiptCode);
        if (!receipt)
            throw new Error('receipt not found');
        if (receipt.status !== 'awaiting-sync')
            throw new Error('already synced');
        receipt.status = 'awaiting-callback';
        receipt.syncedAt = new Date().toISOString();
        return receipt;
    }
    callback(receiptCode, success) {
        const receipt = this.receipts.get(receiptCode);
        if (!receipt)
            throw new Error('receipt not found');
        if (receipt.status !== 'awaiting-callback' && receipt.status !== 'callback-stalled') {
            throw new Error('not awaiting callback');
        }
        receipt.status = success ? 'completed' : 'failed';
        receipt.callbackAt = new Date().toISOString();
        return receipt;
    }
    replay(receiptCode) {
        const receipt = this.receipts.get(receiptCode);
        if (!receipt)
            throw new Error('receipt not found');
        if (!receipt.replayable)
            throw new Error('not replayable');
        if (receipt.status === 'awaiting-sync')
            throw new Error('replay-blocked: still awaiting sync');
        receipt.retryCount++;
        receipt.status = 'awaiting-sync';
        receipt.syncedAt = undefined;
        receipt.callbackAt = undefined;
        return receipt;
    }
    checkStalledCallback(receiptCode) {
        const receipt = this.receipts.get(receiptCode);
        if (!receipt)
            throw new Error('receipt not found');
        if (receipt.status === 'awaiting-callback') {
            receipt.status = 'callback-stalled';
            const alert = {
                code: 'runtime-callback-stalled',
                severity: 'critical',
                module: 'runtime-governance',
                message: `Receipt ${receiptCode} callback stalled for action ${receipt.action}`,
                timestamp: new Date().toISOString(),
                acknowledged: false,
                muted: false,
            };
            this.alerts.push(alert);
            return alert;
        }
        throw new Error('no stalled callback detected');
    }
    acknowledgeAlert(alertCode) {
        const alert = this.alerts.find(a => a.code === alertCode && !a.acknowledged);
        if (alert)
            alert.acknowledged = true;
        return alert;
    }
}
// ---- 测试链 #3 ----
(0, node_test_1.default)('E2E链#3 正例: 身份认证 → 审批提交 → 审批通过 → 执行 → 审计完整链', () => {
    const guard = new IdentityGuard();
    const trust = new TrustGovernanceService();
    // Step 1: 身份认证
    const ctx = { tenantId: 'demo', marketCode: 'cn-mainland', role: 'TENANT_ADMIN' };
    strict_1.default.ok(guard.authorize(ctx, ['TENANT_ADMIN', 'SUPER_ADMIN']));
    // Step 2: 提交审批
    const payload = { secretKey: 'sk-xxx', rotationDays: 90 };
    const approval = trust.submitApproval('secret.rotate', 'secret', 'sk-xxx', payload, ctx.tenantId);
    strict_1.default.equal(approval.status, 'pending-approval');
    strict_1.default.ok(approval.approvalTicket.startsWith('approval-'));
    // Step 3: 审计日志已记录 submit
    const submitAudits = trust.getAudits(approval.approvalTicket);
    strict_1.default.equal(submitAudits.length, 1);
    strict_1.default.equal(submitAudits[0].action, 'approval-submitted');
    // Step 4: 审批通过
    const approved = trust.approve(approval.approvalTicket, 'super-admin');
    strict_1.default.equal(approved.status, 'approved');
    strict_1.default.equal(approved.decidedBy, 'super-admin');
    // Step 5: 执行（payload match）
    const executed = trust.execute(approval.approvalTicket, payload);
    strict_1.default.equal(executed.status, 'executed');
    // Step 6: 审计链路完整
    const allAudits = trust.getAudits(approval.approvalTicket);
    strict_1.default.equal(allAudits.length, 3);
    strict_1.default.equal(allAudits[0].action, 'approval-submitted');
    strict_1.default.equal(allAudits[1].action, 'approval-approved');
    strict_1.default.equal(allAudits[2].action, 'approval-executed');
});
(0, node_test_1.default)('E2E链#3 反例: 无权限角色无法通过 identity guard', () => {
    const guard = new IdentityGuard();
    const ctx = { tenantId: 'demo', marketCode: 'cn-mainland', role: 'GUIDE' };
    // 导购没有 TENANT_ADMIN 权限
    strict_1.default.equal(guard.authorize(ctx, ['TENANT_ADMIN', 'SUPER_ADMIN']), false);
    strict_1.default.ok(guard.authorize(ctx, ['GUIDE', 'STORE_MANAGER']));
});
(0, node_test_1.default)('E2E链#3 反例: 已被拒绝的审批不能再次执行', () => {
    const trust = new TrustGovernanceService();
    const payload = { secretKey: 'sk-xxx', rotationDays: 90 };
    const approval = trust.submitApproval('secret.rotate', 'secret', 'sk-xxx', payload, 'demo');
    trust.reject(approval.approvalTicket, 'super-admin');
    strict_1.default.throws(() => trust.execute(approval.approvalTicket, payload), /approval-rejected/);
});
(0, node_test_1.default)('E2E链#3 反例: payload 不匹配应拒绝执行（防重放）', () => {
    const trust = new TrustGovernanceService();
    const originalPayload = { secretKey: 'sk-xxx', rotationDays: 90 };
    const approval = trust.submitApproval('secret.rotate', 'secret', 'sk-xxx', originalPayload, 'demo');
    trust.approve(approval.approvalTicket, 'super-admin');
    // 尝试用不同的 payload 执行
    strict_1.default.throws(() => trust.execute(approval.approvalTicket, { secretKey: 'sk-xxx', rotationDays: 7 }), /payload mismatch/);
});
(0, node_test_1.default)('E2E链#3 正例: runtime submit → sync → callback → replay 全生命周期', () => {
    const runtime = new RuntimeGovernanceService();
    // submit
    const receipt = runtime.submit('member-login', 'tenant:demo:TENANT_ADMIN', {});
    strict_1.default.equal(receipt.status, 'awaiting-sync');
    // sync
    const synced = runtime.sync(receipt.receiptCode);
    strict_1.default.equal(synced.status, 'awaiting-callback');
    strict_1.default.ok(synced.syncedAt);
    // callback successful
    const completed = runtime.callback(receipt.receiptCode, true);
    strict_1.default.equal(completed.status, 'completed');
    strict_1.default.ok(completed.callbackAt);
    // replay（从 completed 重新进入）
    const replayed = runtime.replay(receipt.receiptCode);
    strict_1.default.equal(replayed.status, 'awaiting-sync');
    strict_1.default.equal(replayed.retryCount, 1);
});
(0, node_test_1.default)('E2E链#3 反例: runtime 重复 sync 应拒绝', () => {
    const runtime = new RuntimeGovernanceService();
    const receipt = runtime.submit('coupon-claim', 'tenant:demo:STORE_MANAGER', {});
    runtime.sync(receipt.receiptCode);
    strict_1.default.throws(() => runtime.sync(receipt.receiptCode), /already synced/);
});
(0, node_test_1.default)('E2E链#3 反例: callback-stalled 检测与告警', () => {
    const runtime = new RuntimeGovernanceService();
    const receipt = runtime.submit('booking-submit', 'tenant:demo:STORE_MANAGER', {});
    runtime.sync(receipt.receiptCode);
    // 模拟 callback 长时间未响应 -> stall 检测
    const alert = runtime.checkStalledCallback(receipt.receiptCode);
    strict_1.default.equal(alert.code, 'runtime-callback-stalled');
    strict_1.default.equal(alert.severity, 'critical');
    strict_1.default.equal(alert.module, 'runtime-governance');
    strict_1.default.equal(alert.acknowledged, false);
    // 确认告警
    const acked = runtime.acknowledgeAlert(alert.code);
    strict_1.default.ok(acked);
    strict_1.default.equal(acked.acknowledged, true);
    // callback 即使在 stalled 后也可以恢复
    const recovered = runtime.callback(receipt.receiptCode, true);
    strict_1.default.equal(recovered.status, 'completed');
});
(0, node_test_1.default)('E2E链#3 边界: identity guard 空 context 拒绝', () => {
    const guard = new IdentityGuard();
    const emptyCtx = { tenantId: '', marketCode: '', role: '' };
    strict_1.default.equal(guard.authorize(emptyCtx, ['TENANT_ADMIN']), false);
});
(0, node_test_1.default)('E2E链#3 边界: 审批单不应同时被两个决定者处理', () => {
    const trust = new TrustGovernanceService();
    const payload = { quota: 100 };
    const approval = trust.submitApproval('quota-ledger.reset', 'quota', 'q-001', payload, 'demo');
    trust.approve(approval.approvalTicket, 'admin-a');
    // 已 approve 的审批不能再被 approve
    strict_1.default.throws(() => trust.approve(approval.approvalTicket, 'admin-b'), /already/);
});
(0, node_test_1.default)('E2E链#3 边界: runtime receipt 幂等性 - duplicate submit 应返回独立 receipt', () => {
    const runtime = new RuntimeGovernanceService();
    const r1 = runtime.submit('payment-submit', 'tenant:demo:GUIDE', { amount: 100 });
    const r2 = runtime.submit('payment-submit', 'tenant:demo:GUIDE', { amount: 100 });
    // 每次 submit 产生独立的 receipt
    strict_1.default.notEqual(r1.receiptCode, r2.receiptCode);
    strict_1.default.equal(r1.action, r2.action);
    strict_1.default.equal(r1.tenantScope, r2.tenantScope);
});
(0, node_test_1.default)('E2E链#3 端到端完整体验: 审批驱动的 runtime action', () => {
    const guard = new IdentityGuard();
    const trust = new TrustGovernanceService();
    const runtime = new RuntimeGovernanceService();
    // 1. 身份认证
    const ctx = { tenantId: 'demo', marketCode: 'cn-mainland', role: 'TENANT_ADMIN' };
    strict_1.default.ok(guard.authorize(ctx, ['TENANT_ADMIN']));
    // 2. 提交审批
    const payload = { featureFlag: 'enable_coupon_v2', targetMarkets: ['cn-mainland'] };
    const approval = trust.submitApproval('feature-flag.toggle', 'feature-flag', 'enable_coupon_v2', payload, ctx.tenantId);
    // 3. 审批通过
    trust.approve(approval.approvalTicket, 'super-admin');
    // 4. 执行
    trust.execute(approval.approvalTicket, payload);
    // 5. 触发 runtime action（审批已通过，执行实际操作）
    const receipt = runtime.submit('coupon-v2-release', `tenant:${ctx.tenantId}:${ctx.role}`, {
        approvalTicket: approval.approvalTicket,
        featureFlag: 'enable_coupon_v2',
    });
    // 6. sync + callback
    runtime.sync(receipt.receiptCode);
    runtime.callback(receipt.receiptCode, true);
    // 7. 验证全链路状态
    const finalApproval = trust.getApproval(approval.approvalTicket);
    strict_1.default.equal(finalApproval?.status, 'executed');
    const finalReceipt = runtime['receipts'].get(receipt.receiptCode);
    strict_1.default.equal(finalReceipt?.status, 'completed');
    // 8. 审计记录
    const audits = trust.getAudits(approval.approvalTicket);
    strict_1.default.equal(audits.length, 3);
});
//# sourceMappingURL=cross-module-e2e-3-governance-chain.test.js.map