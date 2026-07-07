import { describe, it, expect, test, beforeEach, afterEach, beforeAll, afterAll, vi } from 'vitest'
import { AIReviewerService } from './ai-reviewer.service';

describe('AIReviewerService - Phase-18 T17', () => {
  let service: AIReviewerService;

  beforeEach(() => { service = new AIReviewerService(); });

  it('AC-1: 检测 quota 双重 increment', () => {
    const code = `
      const r = quota.reserve(tenantId, QuotaResourceKind.Coupon);
      if (success) quota.increment(tenantId, QuotaResourceKind.Coupon, 1);
    `;
    const findings = service.reviewFile('coupon.service.ts', code);
    expect(findings.some(f => f.ruleId === 'quota-double-increment')).toBe(true);
  });

  it('AC-2: 检测吞错 catch', () => {
    const code = `
      try { foo(); } catch (err) {}
    `;
    const findings = service.reviewFile('test.ts', code);
    expect(findings.some(f => f.ruleId === 'unsafe-catch')).toBe(true);
  });

  it('AC-3: 干净代码 - 0 错误', () => {
    const cleanCode = `
      import { Logger } from '@nestjs/common';
      @Injectable()
      export class GoodService {
        private readonly logger = new Logger(GoodService.name);
        async do() {
          try { await foo(); } catch (err) {
            this.logger.error(\`Failed: \${err.message}\`);
            throw err;
          }
        }
      }
    `;
    const findings = service.reviewFile('good.service.ts', cleanCode);
    const summary = service.summarize(findings);
    expect(summary.error).toBe(0);
  });

  it('AC-4: 多文件扫描', () => {
    const files = [
      { path: 'a.ts', content: 'console.log("hi");' },
      { path: 'b.ts', content: 'try {} catch (e) {}' },
    ];
    const findings = service.reviewFiles(files);
    expect(findings.length).toBeGreaterThan(0);
    expect(findings.some(f => f.file === 'a.ts' && f.ruleId === 'console-log-in-service')).toBe(true);
    expect(findings.some(f => f.file === 'b.ts' && f.ruleId === 'unsafe-catch')).toBe(true);
  });

  it('AC-5: CI 验证 (error > 0 则 fail)', () => {
    const findings = [
      { ruleId: 'x', ruleName: '', severity: 'error' as const, file: 't', snippet: '', message: '', suggestion: '', reference: '' },
      { ruleId: 'y', ruleName: '', severity: 'warn' as const, file: 't', snippet: '', message: '', suggestion: '', reference: '' },
    ];
    const verdict = service.ciVerdict(findings);
    expect(verdict.pass).toBe(false);
    expect(verdict.errorCount).toBe(1);
    expect(verdict.warnCount).toBe(1);
  });
});
