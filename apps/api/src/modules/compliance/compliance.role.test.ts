import { describe, it, expect, test, beforeEach, afterEach, beforeAll, afterAll, vi } from 'vitest'
/**
 * 🐜 自动: [compliance] [A] 角色权限场景测试
 * 从 8 角色视角验证合规模块功能
 *
 * 覆盖:
 * - 👔店长: 全局合规审计视角
 * - 🛒前台: 简单 PII 检测和脱敏
 * - 👥HR: 员工数据 erasure 请求
 * - 🔧安监: 审计链完整性、安全审核
 * - 🎮导玩员: 客户信息检测
 * - 🎯运行专员: 批量处理、定时任务
 * - 🤝团建: 团体场景 erasure
 * - 📢营销: 导出审计日志
 */
import 'reflect-metadata';
import assert from 'node:assert/strict'
import { ComplianceController } from './compliance.controller';
import { PIIDetectorService } from './pii-detector.service';
import { PIIMaskerService } from './pii-masker.service';
import { GDPRErasureService } from './gdpr-erasure.service';
import { AuditLogService } from './audit-log.service';
import { AuditQueryService } from './audit-query.service';
import { ComplianceGateService } from './compliance-gate.service';

// ── 8 角色定义 ──
const ROLES = {
  TenantAdmin: '👔店长',
  Reception: '🛒前台',
  HR: '👥HR',
  Safety: '🔧安监',
  Guide: '🎮导玩员',
  Ops: '🎯运行专员',
  Teambuilding: '🤝团建',
  Marketing: '📢营销',
};

// ── 辅助工厂 ──
function makeController() {
  const piiDetector = new PIIDetectorService();
  const piiMasker = new PIIMaskerService(piiDetector);
  const gdprErasure = new GDPRErasureService();
  const auditLog = new AuditLogService();
  const auditQuery = new AuditQueryService(auditLog);
  const gateService = new ComplianceGateService(auditLog);
  const controller = new ComplianceController(
    piiDetector, piiMasker, gdprErasure, auditLog, auditQuery, gateService
  );
  return { controller, piiDetector, piiMasker, gdprErasure, auditLog, auditQuery, gateService };
}

// ── 👔店长 ──
describe(`${ROLES.TenantAdmin} compliance 角色测试`, () => {
  it('店长可以查看合规模块整体健康状况', () => {
    const { controller } = makeController();
    const health = controller.getHealth();
    assert.ok(health.status);
    assert.ok(health.services);
    assert.ok(health.services.piiDetector === 'UP');
    assert.ok(typeof health.auditLogSize === 'number');
    assert.ok(Array.isArray(health.cascadeModules));
  });

  it('店长可以校验审计链完整性（全局视角）', () => {
    const { controller } = makeController();
    // 追加多条日志
    for (let i = 0; i < 5; i++) {
      controller.appendAuditLog({
        tenantId: 't-global',
        actorId: `admin-${i}`,
        action: 'CREATE',
        resource: 'member',
        resourceId: `mem-${i}`,
      });
    }
    const result = controller.verifyAuditChain();
    assert.ok(result.valid);
    assert.equal(result.totalChecked, 5);
    assert.ok(result.checkedAt);
  });
});

// ── 🛒前台 ──
describe(`${ROLES.Reception} compliance 角色测试`, () => {
  it('前台可以检测客户信息中是否包含敏感数据', () => {
    const { controller } = makeController();
    const result = controller.detectPII({
      text: '王先生 13800138000 欢迎光临',
    });
    assert.ok(result.hasPII);
    assert.equal(result.counts.phone, 1);
    assert.ok(result.sensitivityScore > 0);
  });

  it('前台可以脱敏客户单据中的手机号', () => {
    const { controller } = makeController();
    const result = controller.maskPII({
      text: '客户电话 13800138000',
      maskChar: '*',
    });
    assert.ok(result.maskedText.includes('138****8000'));
    assert.equal(result.matchedCount, 1);
  });

  it('前台检测无 PII 文本返回正常（边界情况）', () => {
    const { controller } = makeController();
    const result = controller.detectPII({ text: '欢迎光临本店' });
    assert.ok(!result.hasPII);
    assert.equal(result.sensitivityScore, 0);
  });
});

// ── 👥HR ──
describe(`${ROLES.HR} compliance 角色测试`, () => {
  it('HR 可以发起员工数据 erasure 请求', () => {
    const { controller } = makeController();
    const result = controller.requestErasure({
      userId: 'emp-001',
      tenantId: 't-hr',
      reason: '员工离职数据删除',
      requestedBy: 'hr-manager',
    });
    assert.equal(result.userId, 'emp-001');
    assert.equal(result.status, 'PENDING_ERASURE');
    assert.ok(result.graceDeadline);
    assert.ok(result.requestedAt);
  });

  it('HR 查询 erasure 状态时如果记录不存在返回错误', () => {
    const { controller } = makeController();
    const result = controller.getErasureStatus('non-existent-employee');
    assert.ok((result as any).error);
    assert.ok((result as any).error.includes('not found'));
  });
});

// ── 🔧安监 ──
describe(`${ROLES.Safety} compliance 角色测试`, () => {
  it('安监可以校验审计日志链完整性', () => {
    const { controller } = makeController();
    controller.appendAuditLog({
      tenantId: 't-safety',
      actorId: 'safety-01',
      action: 'UPDATE',
      resource: 'config',
      resourceId: 'cfg-firewall',
    });
    controller.appendAuditLog({
      tenantId: 't-safety',
      actorId: 'safety-01',
      action: 'UPDATE',
      resource: 'config',
      resourceId: 'cfg-firewall',
    });
    const result = controller.verifyAuditChain();
    assert.ok(result.valid);
    assert.equal(result.totalChecked, 2);
  });

  it('安监查看 erasure 审计追踪记录', () => {
    const { controller } = makeController();
    controller.requestErasure({ userId: 'u-safety-1', tenantId: 't-safety', reason: '安全审计删除' });
    controller.requestErasure({ userId: 'u-safety-2', tenantId: 't-safety', reason: '违规账号清除' });
    const trail = controller.getErasureAuditTrail('t-safety');
    assert.equal(trail.length, 2);
    assert.ok(trail.every((r: any) => r.status === 'PENDING_ERASURE'));
  });
});

// ── 🎮导玩员 ──
describe(`${ROLES.Guide} compliance 角色测试`, () => {
  it('导玩员可以检测客户登记表中的 PII', () => {
    const { controller } = makeController();
    const result = controller.detectPII({
      text: 'VIP 客户邮箱 abc@example.com, 电话 13912345678',
    });
    assert.ok(result.hasPII);
    assert.equal(result.counts.email, 1);
    assert.equal(result.counts.phone, 1);
  });

  it('导玩员可以脱敏打印出的小票上的客户信息', () => {
    const { controller } = makeController();
    const result = controller.maskPII({
      text: '会员: 13800138000',
      maskChar: '#',
      withKind: true,
    });
    assert.ok(result.maskedText.includes('138####8000'));
    assert.equal(result.matchedCount, 1);
    assert.ok(result.maskRatio > 0);
  });
});

// ── 🎯运行专员 ──
describe(`${ROLES.Ops} compliance 角色测试`, () => {
  it('运行专员可以批量检测多个文本', () => {
    const { controller } = makeController();
    const result = controller.batchDetectPII({
      texts: [
        'hello world',
        '联系 13800138000',
        '邮箱 test@example.com',
      ],
    });
    assert.equal(result.totalTexts, 3);
    assert.equal(result.textsWithPII, 2);
    assert.ok(!result.results[0].hasPII);
    assert.ok(result.results[1].hasPII);
    assert.ok(result.results[2].hasPII);
  });

  it('运行专员可以批量脱敏多个文本', () => {
    const { controller } = makeController();
    const result = controller.batchMaskPII({
      texts: [
        '手机 13800138000',
        '邮箱 test@example.com',
      ],
    });
    assert.equal(result.results.length, 2);
    assert.ok(result.totalMatched >= 2);
  });

  it('运行专员可以处理定时删除任务（无到期数据时正常返回）', async () => {
    const { controller } = makeController();
    const result = await controller.processScheduledDeletions();
    assert.equal(result.processed, 0);
    assert.ok(Array.isArray(result.details));
    assert.equal(result.details.length, 0);
  });
});

// ── 🤝团建 ──
describe(`${ROLES.Teambuilding} compliance 角色测试`, () => {
  it('团建可以为团队成员发起批量 erasure 审计追踪', () => {
    const { controller } = makeController();
    // 为团建的多个成员申请 erasure
    controller.requestErasure({ userId: 'tb-mem-01', tenantId: 't-tb' });
    controller.requestErasure({ userId: 'tb-mem-02', tenantId: 't-tb' });
    controller.requestErasure({ userId: 'tb-mem-03', tenantId: 't-tb' });

    const trail = controller.getErasureAuditTrail('t-tb');
    assert.equal(trail.length, 3);
    const userIds = trail.map((r: any) => r.userId).sort();
    assert.deepEqual(userIds, ['tb-mem-01', 'tb-mem-02', 'tb-mem-03']);
  });

  it('团建可以取消某成员的 erasure 请求', () => {
    const { controller } = makeController();
    controller.requestErasure({ userId: 'tb-cancel-01', tenantId: 't-tb', reason: '已联系到成员' });
    const cancelled = controller.cancelErasure('tb-cancel-01');
    assert.equal(cancelled.status, 'ACTIVE');
    assert.ok(cancelled.restoredAt);
  });

  it('取消不存在的 erasure 应报错（权限边界）', () => {
    const { controller } = makeController();
    assert.throws(() => {
      controller.cancelErasure('tb-ghost');
    }, /not found|不存在/);
  });
});

// ── 📢营销 ──
describe(`${ROLES.Marketing} compliance 角色测试`, () => {
  it('营销可以导出审计日志用于活动复盘', () => {
    const { controller } = makeController();
    controller.appendAuditLog({
      tenantId: 't-mkt',
      actorId: 'mkt-user',
      action: 'CREATE',
      resource: 'campaign',
      resourceId: 'cmp-summer',
    });
    controller.appendAuditLog({
      tenantId: 't-mkt',
      actorId: 'mkt-user',
      action: 'UPDATE',
      resource: 'campaign',
      resourceId: 'cmp-summer',
    });
    const exported = controller.exportAuditLog({
      format: 'csv',
      filter: { tenantId: 't-mkt' },
    });
    assert.equal(exported.format, 'csv');
    assert.equal(exported.rowCount, 2);
    assert.ok(exported.content.includes('campaign'));
  });

  it('营销可以导出 JSON 格式审计日志', () => {
    const { controller } = makeController();
    controller.appendAuditLog({
      tenantId: 't-mkt',
      actorId: 'mkt-user',
      action: 'CREATE',
      resource: 'activity',
      resourceId: 'act-spring',
    });
    const exported = controller.exportAuditLog({
      format: 'json',
    });
    assert.equal(exported.format, 'json');
    assert.equal(exported.rowCount, 1);
    const parsed = JSON.parse(exported.content);
    assert.ok(Array.isArray(parsed));
  });
});

// ──────────── 跨角色边界测试 ────────────
describe('compliance 跨角色边界测试', () => {
  it('不同租户的审计日志隔离', () => {
    const { controller } = makeController();
    // 租户 A 追加日志
    controller.appendAuditLog({ tenantId: 't-a', actorId: 'a1', action: 'CREATE', resource: 'r', resourceId: '1' });
    controller.appendAuditLog({ tenantId: 't-a', actorId: 'a1', action: 'UPDATE', resource: 'r', resourceId: '1' });
    // 租户 B 追加日志
    controller.appendAuditLog({ tenantId: 't-b', actorId: 'b1', action: 'DELETE', resource: 'r', resourceId: '2' });

    const queryA = controller.queryAuditLog({ tenantId: 't-a' });
    const queryB = controller.queryAuditLog({ tenantId: 't-b' });
    assert.equal(queryA.length, 2);
    assert.equal(queryB.length, 1);
  });

  it('KYC 场景：检测身份证和信用卡 PII', () => {
    const { controller } = makeController();
    // 使用有效的身份证校验码（110101199001011237，校验位=7）
    const result = controller.detectPII({
      text: '身份证 110101199001011237, 信用卡 4111111111111111',
    });
    assert.ok(result.hasPII);
    assert.ok(result.counts.idCard >= 1, '应检测到身份证');
    assert.ok(result.counts.creditCard >= 1, '应检测到信用卡');
  });

  it('硬删除不存在的用户应报错', async () => {
    const { controller } = makeController();
    await assert.rejects(async () => {
      await controller.hardDelete('ghost-user');
    });
  });

  it('追加审计日志产生链式哈希', () => {
    const { controller } = makeController();
    const e1 = controller.appendAuditLog({ tenantId: 't', actorId: 'a', action: 'CREATE', resource: 'r', resourceId: '1' });
    const e2 = controller.appendAuditLog({ tenantId: 't', actorId: 'a', action: 'UPDATE', resource: 'r', resourceId: '1' });
    assert.equal(e2.prevHash, e1.hash);
    assert.equal(e2.seq, 2);
  });

  it('多个角色串联操作不相互污染服务状态', () => {
    const { controller } = makeController();

    // 店长查询健康
    const healthBefore = controller.getHealth();
    const initialLogSize = healthBefore.auditLogSize;

    // HR 发起 erasure
    controller.requestErasure({ userId: 'u-cross-1', tenantId: 't-cross' });

    // 营销追加审计日志
    controller.appendAuditLog({ tenantId: 't-cross', actorId: 'mkt', action: 'CREATE', resource: 'order', resourceId: 'ord-001' });

    // 安监检查
    const verify = controller.verifyAuditChain();
    assert.ok(verify.valid);
    assert.equal(verify.totalChecked, initialLogSize + 1);

    // 运行专员查看 erasure 追踪
    const trail = controller.getErasureAuditTrail('t-cross');
    assert.equal(trail.length, 1);
  });
});
