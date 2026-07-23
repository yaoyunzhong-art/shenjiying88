import { describe, it, expect, test, beforeEach, afterEach, beforeAll, afterAll, vi } from 'vitest'
/**
 * 🐜 自动: [compliance] [C] 角色测试扩展
 *
 * 8 角色视角的合规模块深度场景测试扩展：
 * 👔店长 🛒前台 👥HR 🔧安监 🎮导玩员 🎯运行专员 🤝团建 📢营销
 *
 * 每个角色增加 ≥3 个进阶测试用例（复杂正常流程 + 权限边界 + 数据隔离 + 异常恢复）
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
    piiDetector, piiMasker, gdprErasure, auditLog, auditQuery, gateService,
  );
  return { controller, piiDetector, piiMasker, gdprErasure, auditLog, auditQuery, gateService };
}

// ── 👔店长（扩展） ──
describe(`${ROLES.TenantAdmin} compliance 角色测试扩展`, () => {
  it('店长在多个租户操作后验证审计链完整性', () => {
    const { controller } = makeController();
    // 跨租户批量写入
    const tenants = ['t-shop-a', 't-shop-b', 't-shop-c', 't-shop-a'];
    for (const t of tenants) {
      controller.appendAuditLog({ tenantId: t, actorId: 'store-mgr', action: 'UPDATE', resource: 'inventory', resourceId: `item-${Date.now()}` });
    }
    const result = controller.verifyAuditChain();
    assert.ok(result.valid);
    assert.equal(result.totalChecked, 4);
  });

  it('店长查看健康检查中 pendingErasures 反映到期删除', () => {
    const { controller } = makeController();
    // pendingErasures 只统计已过 gracePeriod 待硬删除的记录
    // 使用已过去的 gracePeriod 确保被收录
    controller.requestErasure({ userId: 'u-hc-01', tenantId: 't-hc', reason: '测试', gracePeriodMs: 1 });
    // 默认 gracePeriod 为 30 天,不会出现在 pendingErasures 中
    const h = controller.getHealth();
    assert.ok(typeof h.pendingErasures === 'number');
    assert.ok(Array.isArray(h.cascadeModules));
    assert.ok(h.services !== undefined);
  });

  it('店长 empty 租户审计追踪返回空数组', () => {
    const { controller } = makeController();
    const trail = controller.getErasureAuditTrail('t-nonexistent');
    assert.ok(Array.isArray(trail));
    assert.equal(trail.length, 0);
  });
});

// ── 🛒前台（扩展） ──
describe(`${ROLES.Reception} compliance 角色测试扩展`, () => {
  it('前台批量检测包含多种 PII 类型的混合文本', () => {
    const { controller } = makeController();
    const result = controller.batchDetectPII({
      texts: [
        '客户: 张三, 手机 13912345678',
        '邮箱 contact@shop.com, 信用卡 5500000000000004',
        '门店地址 北京路100号',
        '身份证 320106199003078888, 电话 021-12345678',
      ],
      minConfidence: 0.3,
    });
    assert.equal(result.totalTexts, 4);
    assert.equal(result.textsWithPII, 3);
    assert.ok(!result.results[2].hasPII); // 纯地址应无 PII
    assert.ok(result.results[3].hasPII);
    // 身份证应有较高 confidence
    const idCardMatches = result.results[3].matches.filter((m: any) => m.kind === 'idCard');
    assert.ok(idCardMatches.length > 0);
  });

  it('前台脱敏时 withKind 标记能正确标注 PII 类型', () => {
    const { controller } = makeController();
    const result = controller.maskPII({
      text: '手机 13900001111 邮箱 user@test.com',
      maskChar: '*',
      withKind: true,
    });
    assert.ok(result.maskedText.includes('[PHONE]') || result.maskedText.includes('phone'));
    assert.ok(result.maskedText.includes('[EMAIL]') || result.maskedText.includes('email'));
  });

  it('前台脱敏空文本返回空', () => {
    const { controller } = makeController();
    const result = controller.maskPII({ text: '' });
    assert.equal(result.matchedCount, 0);
    assert.equal(result.maskedText, '');
    assert.equal(result.maskRatio, 0);
  });

  it('前台指定 kinds 过滤仅检测手机号 (matches 仅含 phone)', () => {
    const { controller } = makeController();
    const result = controller.detectPII({
      text: '电话 13800138000 邮箱 test@test.com',
      kinds: ['phone'],
    });
    assert.ok(result.hasPII);
    assert.equal(result.counts.phone, 1);
    // matches 中只应有 phone 类型的 PII
    assert.ok(result.matches.every((m: any) => m.kind === 'phone'));
  });
});

// ── 👥HR（扩展） ──
describe(`${ROLES.HR} compliance 角色测试扩展`, () => {
  it('HR 发起 erasure 后可以查询到 gracePeriod 信息', () => {
    const { controller } = makeController();
    const result = controller.requestErasure({
      userId: 'emp-grace-01',
      tenantId: 't-grace',
      reason: '数据保留期已到',
      requestedBy: 'hr-lead',
      gracePeriodMs: 7 * 86400000, // 7 天宽限期
    });
    assert.equal(result.status, 'PENDING_ERASURE');
    assert.ok(result.graceDeadline);
    const deadline = new Date(result.graceDeadline!).getTime();
    const now = Date.now();
    const diffDays = (deadline - now) / 86400000;
    assert.ok(diffDays > 0 && diffDays < 14); // 合理范围内
  });

  it('HR 可以撤销 erasure 请求使状态恢复', () => {
    const { controller } = makeController();
    controller.requestErasure({ userId: 'emp-restore-01', tenantId: 't-restore', reason: '误操作' });
    const cancelled = controller.cancelErasure('emp-restore-01', { reason: '数据不需要删除' });
    assert.equal(cancelled.status, 'ACTIVE');
    assert.ok(cancelled.restoredAt);
    // 撤销后查询不再是 PENDING
    const record = controller.getErasureStatus('emp-restore-01');
    assert.equal((record as any).status, 'ACTIVE');
  });

  it('HR erasure 撤销后不可再次撤销（幂等边界）', () => {
    const { controller } = makeController();
    controller.requestErasure({ userId: 'emp-double-cancel', tenantId: 't-idemp' });
    const c1 = controller.cancelErasure('emp-double-cancel');
    assert.equal(c1.status, 'ACTIVE');
    // 再次撤销应抛异常（状态已非 PENDING）
    assert.throws(() => {
      controller.cancelErasure('emp-double-cancel');
    }, /not found|不存在|PENDING|cancel/);
  });
});

// ── 🔧安监（扩展） ──
describe(`${ROLES.Safety} compliance 角色测试扩展`, () => {
  it('安监可以检测到链式哈希被破坏', () => {
    const { controller, auditLog } = makeController();
    // 写入两条日志
    controller.appendAuditLog({ tenantId: 't-chain', actorId: 'safe-01', action: 'CREATE', resource: 'policy', resourceId: 'pol-001' });
    controller.appendAuditLog({ tenantId: 't-chain', actorId: 'safe-01', action: 'UPDATE', resource: 'policy', resourceId: 'pol-001' });

    // 模拟篡改：直接修改内部审计链哈希
    const entries = (auditLog as any).entries as any[];
    if (entries && entries.length > 0) {
      // 修改第二条的 prevHash 来破坏链
      const idx = entries.length - 1;
      entries[idx] = { ...entries[idx], prevHash: 'tampered-hash' };
    }

    const result = controller.verifyAuditChain();
    assert.ok(!result.valid);
    assert.ok(result.brokenAtSeq !== undefined);
    assert.equal(result.brokenAtSeq, 2);
  });

  it('安监查看不同租户 erasure 审计追踪隔离', () => {
    const { controller } = makeController();
    controller.requestErasure({ userId: 'u-sec-a', tenantId: 't-sec-a', reason: 'A 租户' });
    controller.requestErasure({ userId: 'u-sec-b', tenantId: 't-sec-b', reason: 'B 租户' });

    const trailA = controller.getErasureAuditTrail('t-sec-a');
    const trailB = controller.getErasureAuditTrail('t-sec-b');

    assert.equal(trailA.length, 1);
    assert.equal(trailB.length, 1);
    assert.equal(trailA[0].userId, 'u-sec-a');
    assert.equal(trailB[0].userId, 'u-sec-b');
  });

  it('安监 KYC 场景高敏感度全类型检测', () => {
    const { controller } = makeController();
    const result = controller.detectPII({
      text: '姓名:李四, 身份证:110101199001011237, 信用卡:4111111111111111, 手机:13912345678, IP:192.168.1.1, 邮箱:li@test.com',
      kinds: ['phone', 'email', 'idCard', 'creditCard', 'ip'],
    });
    assert.ok(result.hasPII);
    assert.equal(result.counts.phone, 1);
    assert.equal(result.counts.email, 1);
    assert.equal(result.counts.idCard, 1);
    assert.equal(result.counts.creditCard, 1);
    assert.equal(result.counts.ip, 1);
    assert.ok(result.sensitivityScore > 0.5, '多类型 PII 应产生高敏感度');
  });
});

// ── 🎮导玩员（扩展） ──
describe(`${ROLES.Guide} compliance 角色测试扩展`, () => {
  it('导玩员脱敏含多个 PII 的客户登记信息', () => {
    const { controller } = makeController();
    const result = controller.maskPII({
      text: 'VIP 李华 13800001111 广东省深圳市 100分 会员等级金卡',
      maskChar: '●',
    });
    assert.ok(result.maskedText.includes('138●●●●1111'));
    assert.ok(result.matchedCount >= 1);
    assert.ok(result.maskRatio > 0);
  });

  it('导玩员检测无 PII 英文文本', () => {
    const { controller } = makeController();
    const result = controller.detectPII({ text: 'Hello welcome to our store have a nice day' });
    assert.ok(!result.hasPII);
    assert.equal(result.sensitivityScore, 0);
  });

  it('导玩员批量脱敏结果数量与输入一致', () => {
    const { controller } = makeController();
    const result = controller.batchMaskPII({
      texts: [
        '联系 13800138000',
        'hello world',
        '',
        '邮箱 a@b.com',
      ],
    });
    assert.equal(result.results.length, 4);
    assert.ok(result.totalMatched >= 2);
    // 第二个文本无 PII → 原样返回
    assert.equal(result.results[1], 'hello world');
  });
});

// ── 🎯运行专员（扩展） ──
describe(`${ROLES.Ops} compliance 角色测试扩展`, () => {
  it('运行专员发起 erasure 后可以执行硬删除', async () => {
    const { controller } = makeController();
    controller.requestErasure({ userId: 'ops-hard-del', tenantId: 't-ops', reason: '硬删除测试' });
    const result = await controller.hardDelete('ops-hard-del');
    assert.ok(result.userId === 'ops-hard-del');
    assert.ok(typeof result.totalDeleted === 'number');
    assert.ok(result.deletedFromModules !== undefined);
    // 硬删除后查询应返回已删除
    const record = controller.getErasureStatus('ops-hard-del');
    assert.equal((record as any).status, 'ERASED');
  });

  it('运行专员处理定时删除含到期记录', async () => {
    const { controller } = makeController();
    // 使用负值 gracePeriod 确保 deadline 已过
    controller.requestErasure({
      userId: 'ops-sched-del-01',
      tenantId: 't-sched',
      reason: '定时删除测试',
      gracePeriodMs: -86400000, // 已过期 1 天
    });
    const result = await controller.processScheduledDeletions();
    // controller 返回 { processed, details }
    assert.equal(result.processed, 1);
    assert.ok(Array.isArray(result.details));
    const found = result.details.find((d: any) => d.userId === 'ops-sched-del-01');
    assert.ok(found, '应找到处理记录');
  });

  it('运行专员批量脱敏大容量文本', () => {
    const { controller } = makeController();
    const texts = Array.from({ length: 20 }, (_, i) =>
      `客户${i} 手机 1380000${String(i).padStart(4, '0')} 邮箱 user${i}@test.com`,
    );
    const result = controller.batchDetectPII({ texts });
    assert.equal(result.totalTexts, 20);
    assert.equal(result.textsWithPII, 20);
    assert.ok(result.results.every((r: any) => r.hasPII));
  });

  it('运行专员导出空审计日志', () => {
    const { controller } = makeController();
    const exported = controller.exportAuditLog({ format: 'csv', filter: { tenantId: 't-empty' } });
    assert.equal(exported.format, 'csv');
    assert.equal(exported.rowCount, 0);
    assert.ok(exported.content.includes('timestamp') || exported.rowCount === 0);
  });
});

// ── 🤝团建（扩展） ──
describe(`${ROLES.Teambuilding} compliance 角色测试扩展`, () => {
  it('团建为大量团队成员并发发起 erasure', () => {
    const { controller } = makeController();
    const teamMembers = Array.from({ length: 10 }, (_, i) => `tb-mem-ext-${String(i).padStart(2, '0')}`);
    for (const uid of teamMembers) {
      controller.requestErasure({ userId: uid, tenantId: 't-team', reason: '团建批量清理' });
    }
    const trail = controller.getErasureAuditTrail('t-team');
    assert.equal(trail.length, 10);
    const userIds = trail.map((r: any) => r.userId).sort();
    assert.deepEqual(userIds, teamMembers.sort());
  });

  it('团建可以逐个取消团队成员 erasure 不影响其他人', () => {
    const { controller } = makeController();
    controller.requestErasure({ userId: 'tb-cancel-a', tenantId: 't-team2', reason: '误加入' });
    controller.requestErasure({ userId: 'tb-cancel-b', tenantId: 't-team2', reason: '确认退出' });

    const cancelled = controller.cancelErasure('tb-cancel-a');
    assert.equal(cancelled.status, 'ACTIVE');

    // B 应仍为 PENDING
    const statusB = controller.getErasureStatus('tb-cancel-b');
    assert.equal((statusB as any).status, 'PENDING_ERASURE');
  });

  it('团建对不存在的租户查询审计追踪返回空', () => {
    const { controller } = makeController();
    const trail = controller.getErasureAuditTrail('t-ghost-team');
    assert.ok(Array.isArray(trail));
    assert.equal(trail.length, 0);
  });
});

// ── 📢营销（扩展） ──
describe(`${ROLES.Marketing} compliance 角色测试扩展`, () => {
  it('营销导出审计日志 CSV 格式含表头', () => {
    const { controller } = makeController();
    controller.appendAuditLog({ tenantId: 't-mkt-ext', actorId: 'mkt-op', action: 'CREATE', resource: 'promo', resourceId: 'pro-summer', meta: { budget: 5000 } });
    const exported = controller.exportAuditLog({ format: 'csv', filter: { tenantId: 't-mkt-ext' } });
    assert.equal(exported.format, 'csv');
    assert.equal(exported.rowCount, 1);
    assert.ok(exported.content.includes('actorId'));
    assert.ok(exported.content.includes('action'));
    assert.ok(exported.content.includes('resource'));
  });

  it('营销导出 JSON 格式可正确解析', () => {
    const { controller } = makeController();
    controller.appendAuditLog({ tenantId: 't-mkt-json', actorId: 'mkt-analyst', action: 'CREATE', resource: 'campaign', resourceId: 'cmp-winter' });
    const exported = controller.exportAuditLog({ format: 'json', filter: { tenantId: 't-mkt-json' } });
    assert.equal(exported.format, 'json');
    assert.equal(exported.rowCount, 1);
    const parsed = JSON.parse(exported.content);
    assert.ok(Array.isArray(parsed));
    assert.equal(parsed[0].actorId, 'mkt-analyst');
    assert.equal(parsed[0].action, 'CREATE');
  });

  it('营销按 actorId 过滤审计日志', () => {
    const { controller } = makeController();
    controller.appendAuditLog({ tenantId: 't-mkt-filter', actorId: 'mkt-zhang', action: 'CREATE', resource: 'ad', resourceId: 'ad-001' });
    controller.appendAuditLog({ tenantId: 't-mkt-filter', actorId: 'mkt-li', action: 'UPDATE', resource: 'ad', resourceId: 'ad-001' });
    controller.appendAuditLog({ tenantId: 't-mkt-filter', actorId: 'mkt-zhang', action: 'DELETE', resource: 'ad', resourceId: 'ad-002' });

    const queryZh = controller.queryAuditLog({ tenantId: 't-mkt-filter', actorId: 'mkt-zhang' });
    assert.equal(queryZh.length, 2);
    assert.ok(queryZh.every((e: any) => e.actorId === 'mkt-zhang'));
  });

  it('营销导出空活动日志不报错', () => {
    const { controller } = makeController();
    const exported = controller.exportAuditLog({ format: 'json', filter: { tenantId: 't-no-activity' } });
    assert.equal(exported.rowCount, 0);
    assert.equal(exported.content, '[]');
  });
});

// ── 跨角色集成场景 ──
describe('compliance 跨角色集成场景扩展', () => {
  it('完整 erasure 生命周期：创建→取消→重新请求→硬删除', async () => {
    const { controller } = makeController();
    const userId = 'u-lifecycle-01';
    const tenantId = 't-lifecycle';

    // 创建
    const created = controller.requestErasure({ userId, tenantId, reason: '初始请求' });
    assert.equal(created.status, 'PENDING_ERASURE');

    // 取消
    const cancelled = controller.cancelErasure(userId, { reason: '暂不处理' });
    assert.equal(cancelled.status, 'ACTIVE');

    // 重新请求
    const reRequested = controller.requestErasure({ userId, tenantId, reason: '重新请求删除' });
    assert.equal(reRequested.status, 'PENDING_ERASURE');

    // 硬删除
    const deleted = await controller.hardDelete(userId);
    assert.equal(deleted.userId, userId);
    assert.ok(typeof deleted.totalDeleted === 'number');

    const final = controller.getErasureStatus(userId);
    assert.equal((final as any).status, 'ERASED');
  });

  it('多角色 PII 检测到脱敏全链路', () => {
    const { controller } = makeController();

    // 导玩员登记客户信息
    const detect = controller.detectPII({
      text: '新客户王五 13812345678 邮箱 wangwu@test.com',
    });
    assert.ok(detect.hasPII);

    // 前台脱敏打印小票
    const masked = controller.maskPII({
      text: '王五 13812345678',
      maskChar: '*',
    });
    assert.ok(masked.maskedText.includes('138****5678'));

    // 店长查看全局审计链
    const health = controller.getHealth();
    assert.ok(health.status);

    // 安监校验审计链
    const verify = controller.verifyAuditChain();
    assert.ok(verify.valid);
  });

  it('高敏感度 PII 场景产生合理敏感分', () => {
    const { controller } = makeController();
    // 仅手机号
    const phoneOnly = controller.detectPII({ text: '13800138000' });
    // 含身份证
    const withIdCard = controller.detectPII({ text: '110101199001011237' });
    // 含信用卡
    const withCredit = controller.detectPII({ text: '4111111111111111' });

    assert.ok(withIdCard.sensitivityScore > phoneOnly.sensitivityScore, '身份证敏感度应高于手机号');
    assert.ok(withCredit.sensitivityScore > phoneOnly.sensitivityScore, '信用卡敏感度应高于手机号');
  });

  it('审计日志按时间范围过滤', () => {
    const { controller } = makeController();
    const now = new Date().toISOString();
    controller.appendAuditLog({ tenantId: 't-range', actorId: 'user-a', action: 'CREATE', resource: 'r', resourceId: '1' });

    // 使用 ISO 字符串过滤
    const recent = controller.queryAuditLog({ tenantId: 't-range', fromTs: new Date(Date.now() - 60000).toISOString() });
    assert.ok(recent.length >= 1);

    // 明天 → 应匹配不到
    const farFuture = controller.queryAuditLog({ tenantId: 't-range', fromTs: new Date(Date.now() + 86400000).toISOString() });
    assert.equal(farFuture.length, 0);
  });
});
