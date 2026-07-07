import { describe, it, expect, test, beforeEach, afterEach, beforeAll, afterAll, vi } from 'vitest'
/**
 * 🐜 自动: [compliance] [A] 合约测试
 *
 * 验证 compliance 模块的实体 Shape、合约映射器、边界条件
 */

import 'reflect-metadata';
import assert from 'node:assert/strict'

import {
  toPIIScanResultContract,
  toPIIMaskResultContract,
  toErasureRequestContract,
  toAuditLogEntryContract,
  toAuditLogEntryContracts,
  toComplianceHealthContract,
} from './compliance.contract';
import {
  PIIScanResultEntity,
  MaskedDocumentEntity,
  ErasureRequestEntity,
  AuditLogEntryEntity,
  ComplianceHealthEntity,
} from './compliance.entity';
import type { PIIScanResultContract, PIIMaskResultContract, ErasureRequestContract, AuditLogEntryContract, ComplianceHealthContract } from './compliance.contract';

// ─── 辅助工厂 ─────────────────────────────────────────

function makeScanResult(overrides: Partial<PIIScanResultEntity> = {}): PIIScanResultEntity {
  const e = new PIIScanResultEntity();
  e.textId = overrides.textId ?? 'scan-001';
  e.scannedAt = overrides.scannedAt ?? '2026-06-27T05:00:00.000Z';
  e.matches = overrides.matches ?? [];
  e.grouped = overrides.grouped ?? { phone: [], email: [], idCard: [], creditCard: [], ip: [] };
  e.hasPII = overrides.hasPII ?? false;
  e.counts = overrides.counts ?? { phone: 0, email: 0, idCard: 0, creditCard: 0, ip: 0 };
  e.sensitivityScore = overrides.sensitivityScore ?? 0;
  return e;
}

function makeMaskedDoc(overrides: Partial<MaskedDocumentEntity> = {}): MaskedDocumentEntity {
  const e = new MaskedDocumentEntity();
  e.originalText = overrides.originalText ?? 'hello@example.com';
  e.maskedText = overrides.maskedText ?? '***@example.com';
  e.matchedCount = overrides.matchedCount ?? 1;
  e.maskRatio = overrides.maskRatio ?? 0.3;
  e.maskedAt = overrides.maskedAt ?? '2026-06-27T05:00:00.000Z';
  e.maskChar = overrides.maskChar ?? '*';
  return e;
}

function makeErasureRequest(overrides: Partial<ErasureRequestEntity> = {}): ErasureRequestEntity {
  const e = new ErasureRequestEntity();
  e.requestId = overrides.requestId ?? 'req-001';
  e.userId = overrides.userId ?? 'user-123';
  e.tenantId = overrides.tenantId ?? 'tenant-001';
  e.status = overrides.status ?? 'ACTIVE';
  e.requestedAt = overrides.requestedAt ?? '2026-06-27T05:00:00.000Z';
  e.graceDeadline = overrides.graceDeadline ?? '2026-07-27T05:00:00.000Z';
  e.erasedAt = overrides.erasedAt;
  e.restoredAt = overrides.restoredAt;
  e.reason = overrides.reason ?? 'User request';
  e.requestedBy = overrides.requestedBy ?? 'admin';
  return e;
}

function makeAuditEntry(overrides: Partial<AuditLogEntryEntity> = {}): AuditLogEntryEntity {
  const e = new AuditLogEntryEntity();
  e.seq = overrides.seq ?? 1;
  e.ts = overrides.ts ?? '2026-06-27T05:00:00.000Z';
  e.tenantId = overrides.tenantId ?? 'tenant-001';
  e.actorId = overrides.actorId ?? 'actor-001';
  e.action = overrides.action ?? 'CREATE' as any;
  e.customAction = overrides.customAction;
  e.resource = overrides.resource ?? 'user';
  e.resourceId = overrides.resourceId ?? 'user-123';
  e.before = overrides.before;
  e.after = overrides.after;
  e.ip = overrides.ip;
  e.userAgent = overrides.userAgent;
  e.prevHash = overrides.prevHash ?? '0000';
  e.hash = overrides.hash ?? 'abcd';
  return e;
}

function makeHealthEntity(overrides: Partial<ComplianceHealthEntity> = {}): ComplianceHealthEntity {
  const e = new ComplianceHealthEntity();
  e.status = overrides.status ?? 'healthy';
  e.piiDetector = overrides.piiDetector ?? 'UP';
  e.piiMasker = overrides.piiMasker ?? 'UP';
  e.gdprErasure = overrides.gdprErasure ?? 'UP';
  e.auditLog = overrides.auditLog ?? 'UP';
  e.auditQuery = overrides.auditQuery ?? 'UP';
  e.auditLogSize = overrides.auditLogSize ?? 100;
  e.pendingErasures = overrides.pendingErasures ?? 0;
  e.cascadeModules = overrides.cascadeModules ?? ['member', 'coupon'];
  e.checkedAt = overrides.checkedAt ?? '2026-06-27T05:00:00.000Z';
  return e;
}

// ─── 测试用例 ─────────────────────────────────────────

describe('[compliance] 合约: PII 扫描结果映射', () => {
  it('无 PII 实体映射正确', () => {
    const e = makeScanResult();
    const c = toPIIScanResultContract(e);
    assert.equal(c.textId, 'scan-001');
    assert.equal(c.hasPII, false);
    assert.equal(c.matchCount, 0);
    assert.equal(c.sensitivityScore, 0);
    assert.deepEqual(c.groupedCounts, { phone: 0, email: 0, idCard: 0, creditCard: 0, ip: 0 });
  });

  it('含 PII 实体映射正确', () => {
    const e = makeScanResult({
      hasPII: true,
      counts: { phone: 2, email: 1, idCard: 0, creditCard: 1, ip: 0 },
      sensitivityScore: 0.75,
    });
    const c = toPIIScanResultContract(e);
    assert.equal(c.hasPII, true);
    assert.equal(c.matchCount, 4);
    assert.equal(c.sensitivityScore, 0.75);
    assert.equal(c.groupedCounts.phone, 2);
    assert.equal(c.groupedCounts.email, 1);
  });
});

describe('[compliance] 合约: PII 脱敏映射', () => {
  it('全覆盖映射', () => {
    const e = makeMaskedDoc();
    const c: PIIMaskResultContract = toPIIMaskResultContract(e);
    assert.equal(c.maskedText, '***@example.com');
    assert.equal(c.matchedCount, 1);
    assert.equal(c.maskRatio, 0.3);
  });

  it('空文本映射', () => {
    const e = makeMaskedDoc({ originalText: '', maskedText: '', matchedCount: 0, maskRatio: 0 });
    const c = toPIIMaskResultContract(e);
    assert.equal(c.maskedText, '');
    assert.equal(c.matchedCount, 0);
    assert.equal(c.maskRatio, 0);
  });
});

describe('[compliance] 合约: 删除请求映射', () => {
  it('正常请求映射', () => {
    const e = makeErasureRequest();
    const c: ErasureRequestContract = toErasureRequestContract(e);
    assert.equal(c.requestId, 'req-001');
    assert.equal(c.userId, 'user-123');
    assert.equal(c.tenantId, 'tenant-001');
    assert.equal(c.status, 'ACTIVE');
    assert.ok(c.requestedAt);
    assert.ok(c.graceDeadline);
    assert.equal(c.reason, 'User request');
  });

  it('已删除的请求状态正确', () => {
    const e = makeErasureRequest({
      status: 'ERASED',
      erasedAt: '2026-07-28T05:00:00.000Z',
      graceDeadline: '',
    });
    const c = toErasureRequestContract(e);
    assert.equal(c.status, 'ERASED');
    assert.equal(c.erasedAt, '2026-07-28T05:00:00.000Z');
    // graceDeadline 为空字符串表示已过 grace period
    assert.equal(c.graceDeadline, '');
  });
});

describe('[compliance] 合约: 审计日志映射', () => {
  it('单条目映射所有字段', () => {
    const e = makeAuditEntry();
    const c: AuditLogEntryContract = toAuditLogEntryContract(e);
    assert.equal(c.seq, 1);
    assert.equal(c.actorId, 'actor-001');
    assert.equal(c.action, 'CREATE');
    assert.equal(c.resource, 'user');
    assert.equal(c.resourceId, 'user-123');
    assert.equal(c.hash, 'abcd');
    assert.equal(c.prevHash, '0000');
  });

  it('批量映射', () => {
    const entries = [makeAuditEntry({ seq: 1 }), makeAuditEntry({ seq: 2, hash: 'ef01', prevHash: 'abcd' })];
    const contracts = toAuditLogEntryContracts(entries);
    assert.equal(contracts.length, 2);
    assert.equal(contracts[1].prevHash, 'abcd');
    assert.equal(contracts[1].hash, 'ef01');
  });

  it('空数组批量映射', () => {
    const contracts = toAuditLogEntryContracts([]);
    assert.equal(contracts.length, 0);
  });
});

describe('[compliance] 合约: 健康检查映射', () => {
  it('健康状态映射正确', () => {
    const e = makeHealthEntity();
    const c: ComplianceHealthContract = toComplianceHealthContract(e);
    assert.equal(c.status, 'healthy');
    assert.equal(c.services.piiDetector, 'UP');
    assert.equal(c.services.auditLog, 'UP');
    assert.equal(c.auditLogSize, 100);
    assert.equal(c.pendingErasures, 0);
    assert.deepEqual(c.cascadeModules, ['member', 'coupon']);
    assert.ok(c.checkedAt);
  });

  it('降级状态映射正确', () => {
    const e = makeHealthEntity({
      status: 'degraded',
      piiDetector: 'DOWN',
      auditLogSize: 0,
      cascadeModules: [],
    });
    const c = toComplianceHealthContract(e);
    assert.equal(c.status, 'degraded');
    assert.equal(c.services.piiDetector, 'DOWN');
    assert.equal(c.auditLogSize, 0);
    assert.equal(c.cascadeModules.length, 0);
  });

  it('cascadeModules 不可变', () => {
    const e = makeHealthEntity();
    const c = toComplianceHealthContract(e);
    const origLen = c.cascadeModules.length;
    c.cascadeModules.push('new-module');
    assert.equal(e.cascadeModules.length, origLen); // 原实体未受影响
  });
});
