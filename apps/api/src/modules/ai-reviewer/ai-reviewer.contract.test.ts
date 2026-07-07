import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
/**
 * 🐜 自动: [ai-reviewer] [D] contract 测试
 *
 * 验证 ai-reviewer 模块的实体 Shape、合约映射、业务逻辑契约
 */

import 'reflect-metadata';
import assert from 'node:assert/strict';
import { AIReviewerService } from './ai-reviewer.service';
import { AIReviewerController } from './ai-reviewer.controller';
import {
  toReviewSessionContract,
  toReviewFindingContract,
  toReviewConfigContract,
  toReviewStatsContract,
  type ReviewFindingContract,
  type ReviewSessionContract,
  type ReviewConfigContract,
  type ReviewStatsContract,
  type ReviewRuleContract,
} from './ai-reviewer.contract';
import type { ReviewSession, ReviewConfig, ReviewStats, ReviewSeverity } from './ai-reviewer.entity';

// ─── Helpers ──────────────────────────────────────────

function makeService(): AIReviewerService {
  return new AIReviewerService();
}

function makeController(): AIReviewerController {
  return new AIReviewerController(makeService());
}

// ─── 合约: 映射器 Shape ───────────────────────────────

describe('[ai-reviewer] 合约: 映射器', () => {
  it('toReviewFindingContract 映射所有字段', () => {
    const input = {
      ruleId: 'test-rule',
      ruleName: 'Test Rule',
      severity: 'error' as ReviewSeverity,
      file: 'src/test.ts',
      line: 42,
      snippet: 'console.log(x)',
      message: 'Avoid console.log',
      suggestion: 'Use Logger instead',
      reference: 'docs/patterns.md',
    };
    const result = toReviewFindingContract(input);
    assert.equal(result.ruleId, 'test-rule');
    assert.equal(result.ruleName, 'Test Rule');
    assert.equal(result.severity, 'error');
    assert.equal(result.file, 'src/test.ts');
    assert.equal(result.line, 42);
    assert.equal(result.snippet, 'console.log(x)');
    assert.equal(result.message, 'Avoid console.log');
    assert.equal(result.suggestion, 'Use Logger instead');
    assert.equal(result.reference, 'docs/patterns.md');
  });

  it('toReviewFindingContract 可选字段 line=undefined', () => {
    const result = toReviewFindingContract({
      ruleId: 'r1',
      ruleName: 'R1',
      severity: 'warn',
      file: 'f.ts',
      snippet: '',
      message: '',
      suggestion: '',
      reference: '',
    });
    assert.equal(result.line, undefined);
  });

  it('toReviewSessionContract 映射嵌套 findings', () => {
    const entity: ReviewSession = {
      id: 'session-001',
      files: [{ path: 'a.ts', content: 'content-a' }],
      findings: [
        {
          ruleId: 'r1',
          ruleName: 'R1',
          severity: 'error',
          file: 'a.ts',
          line: 10,
          snippet: 'bad()',
          message: 'Bad pattern',
          suggestion: 'Fix it',
          reference: 'ref.md',
        },
      ],
      summary: { info: 0, warn: 0, error: 1 },
      verdict: { pass: false, errorCount: 1, warnCount: 0 },
      createdAt: '2026-01-01T00:00:00Z',
      triggeredBy: 'ci-bot',
      projectPath: '/repo',
    };
    const contract = toReviewSessionContract(entity);
    assert.equal(contract.id, 'session-001');
    assert.equal(contract.files.length, 1);
    assert.equal(contract.files[0].path, 'a.ts');
    assert.equal(contract.findings.length, 1);
    assert.equal(contract.findings[0].ruleId, 'r1');
    assert.equal(contract.verdict.pass, false);
    assert.equal(contract.summary.error, 1);
    assert.equal(contract.triggeredBy, 'ci-bot');
  });

  it('toReviewConfigContract 映射所有字段', () => {
    const entity: ReviewConfig = {
      id: 'cfg-1',
      name: 'Default Config',
      enabledRules: ['rule-a', 'rule-b'],
      ignorePatterns: ['*.test.ts'],
      ciMode: true,
      maxFiles: 50,
      maxLinesPerFile: 1000,
      updatedAt: '2026-06-01T00:00:00Z',
      tenantId: 't-001',
    };
    const contract = toReviewConfigContract(entity);
    assert.equal(contract.id, 'cfg-1');
    assert.equal(contract.name, 'Default Config');
    assert.deepStrictEqual(contract.enabledRules, ['rule-a', 'rule-b']);
    assert.deepStrictEqual(contract.ignorePatterns, ['*.test.ts']);
    assert.equal(contract.ciMode, true);
    assert.equal(contract.maxFiles, 50);
    assert.equal(contract.tenantId, 't-001');
  });

  it('toReviewStatsContract 映射统计字段', () => {
    const entity: ReviewStats = {
      totalSessions: 10,
      totalFiles: 100,
      totalFindings: 25,
      findingsBySeverity: { info: 5, warn: 10, error: 10 },
      findingsByRule: {},
      topRules: [],
      passRate: 0.5,
      lastSessionAt: '2026-06-27T00:00:00Z',
    };
    const contract = toReviewStatsContract(entity);
    assert.equal(contract.totalSessions, 10);
    assert.equal(contract.totalFiles, 100);
    assert.equal(contract.totalFindings, 25);
    assert.equal(contract.findingsBySeverity.error, 10);
    assert.equal(contract.passRate, 0.5);
    assert.equal(contract.lastSessionAt, '2026-06-27T00:00:00Z');
  });

  it('toReviewStatsContract lastSessionAt=null', () => {
    const entity: ReviewStats = {
      totalSessions: 0,
      totalFiles: 0,
      totalFindings: 0,
      findingsBySeverity: { info: 0, warn: 0, error: 0 },
      findingsByRule: {},
      topRules: [],
      passRate: 1,
      lastSessionAt: null,
    };
    const contract = toReviewStatsContract(entity);
    assert.equal(contract.lastSessionAt, null);
  });
});

// ─── 合约: 业务逻辑验证 ───────────────────────────────

describe('[ai-reviewer] 合约: 审查服务', () => {
  it('reviewFile 发现 console.log 在业务代码中', () => {
    const svc = makeService();
    const findings = svc.reviewFile('src/service.ts', `
      import { Injectable } from '@nestjs/common';
      @Injectable()
      export class FooService {
        doStuff() {
          console.log('done'); // 应该用 Logger
        }
      }
    `);
    assert.ok(findings.length > 0);
    const clogFinding = findings.find((f) => f.ruleId === 'console-log-in-service');
    assert.ok(clogFinding);
    assert.equal(clogFinding.severity, 'info');
    assert.equal(clogFinding.file, 'src/service.ts');
    assert.equal(typeof clogFinding.line, 'number');
  });

  it('reviewFile 发现 unsafe-catch 空块', () => {
    const svc = makeService();
    const findings = svc.reviewFile('src/bad.ts', `
      try {
        doRiskyStuff();
      } catch (err) {}
    `);
    assert.ok(findings.length > 0);
    const unsafeFinding = findings.find((f) => f.ruleId === 'unsafe-catch');
    assert.ok(unsafeFinding);
    assert.equal(unsafeFinding.severity, 'warn');
    assert.ok(unsafeFinding.suggestion);
  });

  it('reviewFile 发现 quota-double-increment 模式', () => {
    const svc = makeService();
    const findings = svc.reviewFile('src/quota.ts', `
      quota.reserve(userId, 100);
      // ... biz logic ...
      quota.increment(userId, 100);
    `);
    const doubleFinding = findings.find((f) => f.ruleId === 'quota-double-increment');
    assert.ok(doubleFinding);
    assert.equal(doubleFinding.severity, 'error');
  });

  it('reviewFile 发现 missing-tenant-guard', () => {
    const svc = makeService();
    const findings = svc.reviewFile('src/repo.ts', `
      return this.repo.findOne({ where: { id: 1 } });
    `);
    const guardFinding = findings.find((f) => f.ruleId === 'missing-tenant-guard');
    // 这个模式比较复杂, 可能需要匹配 findOne 中 where 包含 id 但缺 tenantId
    // 因为当前 pattern 只匹配 findOne with where 结构, 所以能命中
    assert.ok(guardFinding);
  });

  it('reviewFile 干净的代码 → 无 finding', () => {
    const svc = makeService();
    const findings = svc.reviewFile('src/clean.ts', `
      import { Injectable, Logger } from '@nestjs/common';
      @Injectable()
      export class CleanService {
        private readonly logger = new Logger(CleanService.name);
        async doStuff() {
          this.logger.log('done');
          try { await risky(); } catch (err) { this.logger.error('failed', err); throw err; }
        }
      }
    `);
    // 干净代码: 有 Logger, catch 有 logger.error, 无 console.log, 无 findOne
    const clog = findings.find((f) => f.ruleId === 'console-log-in-service');
    const unsafe = findings.find((f) => f.ruleId === 'unsafe-catch');
    assert.ok(!clog, '不应有 console.log 发现');
    assert.ok(!unsafe, '不应有 unsafe-catch 发现');
  });
});

// ─── 合约: 服务 API 契约 ──────────────────────────────

describe('[ai-reviewer] 合约: 规则管理', () => {
  it('listRules 返回 5 条内置规则', () => {
    const svc = makeService();
    const rules = svc.listRules();
    assert.equal(rules.length, 5);
    const ruleIds = rules.map((r) => r.ruleId);
    assert.ok(ruleIds.includes('quota-double-increment'));
    assert.ok(ruleIds.includes('unsafe-catch'));
    assert.ok(ruleIds.includes('missing-tenant-guard'));
    assert.ok(ruleIds.includes('undefined-data-source'));
    assert.ok(ruleIds.includes('console-log-in-service'));
  });

  it('每一条规则都有必要字段', () => {
    const svc = makeService();
    for (const rule of svc.listRules()) {
      assert.equal(typeof rule.ruleId, 'string');
      assert.equal(typeof rule.ruleName, 'string');
      assert.equal(typeof rule.description, 'string');
      assert.ok(['info', 'warn', 'error'].includes(rule.severity));
      assert.ok(rule.pattern instanceof RegExp);
      assert.equal(typeof rule.reference, 'string');
    }
  });

  it('registerRule 新增一条规则', () => {
    const svc = makeService();
    svc.registerRule({
      ruleId: 'custom-rule',
      ruleName: 'Custom Rule',
      description: 'A custom test rule',
      severity: 'error',
      pattern: /custom-pattern/g,
      reference: 'docs/custom.md',
    });
    const rules = svc.listRules();
    const custom = rules.find((r) => r.ruleId === 'custom-rule');
    assert.ok(custom);
    assert.equal(custom?.ruleName, 'Custom Rule');
    assert.equal(custom?.severity, 'error');
  });
});

// ─── 合约: 统计和 CI 验证 ─────────────────────────────

describe('[ai-reviewer] 合约: 统计与CI', () => {
  it('summarize 正确统计严重度分布', () => {
    const svc = makeService();
    const findings = svc.reviewFile('src/test.ts', `
      console.log('a');
      catch (e) {}
      console.log('b');
    `);
    const summary = svc.summarize(findings);
    assert.ok(summary.info >= 0);
    assert.ok(summary.warn >= 0);
    assert.ok(summary.error >= 0);
    assert.equal(summary.info + summary.warn + summary.error, findings.length);
  });

  it('ciVerdict 有 error → pass=false', () => {
    const svc = makeService();
    const findings = svc.reviewFile('src/quota.ts', `
      quota.reserve(userId, 100);
      quota.increment(userId, 100);
    `);
    const verdict = svc.ciVerdict(findings);
    if (findings.some((f) => f.severity === 'error')) {
      assert.equal(verdict.pass, false);
    }
    assert.ok(verdict.errorCount >= 0);
    assert.ok(verdict.warnCount >= 0);
  });

  it('ciVerdict 无 error → pass=true', () => {
    const svc = makeService();
    const verdict = svc.ciVerdict([]);
    assert.equal(verdict.pass, true);
    assert.equal(verdict.errorCount, 0);
    assert.equal(verdict.warnCount, 0);
  });
});

// ─── 合约: Controller 端点 Shape ──────────────────────

describe('[ai-reviewer] 合约: Controller 响应', () => {
  it('POST /ai-reviewer/review 返回 ReviewResponse 结构', () => {
    const controller = makeController();
    const response = controller.review({
      files: [{ path: 'src/test.ts', content: 'console.log("hi");' }],
    });
    assert.equal(typeof response.sessionId, 'string');
    assert.ok(response.sessionId.startsWith('review-'));
    assert.equal(response.totalFiles, 1);
    assert.equal(typeof response.totalFindings, 'number');
    assert.ok(typeof response.summary.info === 'number');
    assert.ok(typeof response.summary.warn === 'number');
    assert.ok(typeof response.summary.error === 'number');
    assert.equal(typeof response.verdict.pass, 'boolean');
    assert.equal(typeof response.createdAt, 'string');
    assert.ok(Array.isArray(response.findings));
  });

  it('POST /ai-reviewer/review 空文件返回空发现', () => {
    const controller = makeController();
    const response = controller.review({
      files: [{ path: 'src/empty.ts', content: '' }],
    });
    assert.equal(response.totalFindings, 0);
    assert.equal(response.findings.length, 0);
  });

  it('GET /ai-reviewer/rules 返回规则列表', () => {
    const controller = makeController();
    const rules = controller.listRules();
    assert.ok(Array.isArray(rules));
    assert.equal(rules.length, 5);
    for (const rule of rules) {
      assert.equal(typeof rule.ruleId, 'string');
      assert.equal(typeof rule.ruleName, 'string');
    }
  });

  it('POST /ai-reviewer/rules 注册自定义规则', () => {
    const controller = makeController();
    const result = controller.registerRule({
      ruleId: 'my-custom-rule',
      ruleName: 'My Custom',
      description: 'Custom rule test',
      severity: 'warn',
      pattern: 'my-pattern',
      reference: 'docs/custom.md',
    });
    assert.equal(result.ruleId, 'my-custom-rule');
    assert.ok(result.message.includes('registered'));
  });

  it('POST /ai-reviewer/ci-verify 返回 CI 结论', () => {
    const controller = makeController();
    const result = controller.ciVerify({
      files: [{ path: 'src/bad.ts', content: 'console.log("x");' }],
    });
    assert.equal(typeof result.pass, 'boolean');
    assert.equal(typeof result.errorCount, 'number');
    assert.equal(typeof result.warnCount, 'number');
    assert.equal(typeof result.findings, 'number');
  });

  it('GET /ai-reviewer/rules/:ruleId 返回指定规则', () => {
    const controller = makeController();
    const rule = controller.getRule('unsafe-catch');
    assert.ok(!('error' in rule));
    assert.equal((rule as { ruleId: string }).ruleId, 'unsafe-catch');
  });

  it('GET /ai-reviewer/rules/:ruleId 不存在的规则返回 error', () => {
    const controller = makeController();
    const result = controller.getRule('non-existent');
    assert.ok('error' in result);
    assert.ok((result as { error: string }).error.includes('not found'));
  });
});
