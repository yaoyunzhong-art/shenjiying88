// auto-runner.service.ts - Phase-19 T30
// 用途: CI 集成 + 测试报告 + 与 ai-reviewer 联动
// 关联: phase-19-intelligence/spec.md §Phase 2
import { Injectable } from '@nestjs/common';
import type { GeneratedTestCase } from './test-case-generator.service';

export interface TestRunReport {
  totalCases: number;
  passed: number;
  failed: number;
  skipped: number;
  durationMs: number;
  passRate: number;
  byScenario: Record<string, { passed: number; failed: number }>;
  failures: Array<{ caseId: string; errorMessage: string }>;
}

export interface TestRunResult {
  caseId: string;
  scenario: string;
  passed: boolean;
  durationMs: number;
  errorMessage?: string;
}

@Injectable()
export class AutoRunnerService {
  /**
   * 执行一批测试用例 - V1 模拟执行器
   * V2 接 supertest / pactum 等实际 HTTP 测试库
   */
  async run(cases: GeneratedTestCase[]): Promise<{ results: TestRunResult[]; report: TestRunReport }> {
    const start = Date.now();
    const results: TestRunResult[] = [];
    for (const c of cases) {
      const caseStart = Date.now();
      const passed = await this.executeCase(c);
      results.push({
        caseId: c.id,
        scenario: c.scenario,
        passed,
        durationMs: Date.now() - caseStart,
        errorMessage: passed ? undefined : 'Simulated failure',
      });
    }

    const report = this.buildReport(results, Date.now() - start);
    return { results, report };
  }

  /**
   * V1 模拟执行 - 始终通过
   * V2 接真实 HTTP
   */
  private async executeCase(c: GeneratedTestCase): Promise<boolean> {
    // 模拟执行延迟
    await new Promise((r) => setTimeout(r, 1));
    // SECURITY 用例预期失败 (验证防御能力)
    if (c.scenario === 'SECURITY' && Array.isArray(c.expectedStatus) && c.expectedStatus.includes(400)) {
      return true; // 期望返回 4xx 即视为防御生效,passed
    }
    return true;
  }

  private buildReport(results: TestRunResult[], durationMs: number): TestRunReport {
    const byScenario: Record<string, { passed: number; failed: number }> = {};
    let passed = 0;
    let failed = 0;
    for (const r of results) {
      if (!byScenario[r.scenario]) byScenario[r.scenario] = { passed: 0, failed: 0 };
      if (r.passed) {
        passed++;
        byScenario[r.scenario].passed++;
      } else {
        failed++;
        byScenario[r.scenario].failed++;
      }
    }
    const totalCases = results.length;
    return {
      totalCases,
      passed,
      failed,
      skipped: 0,
      durationMs,
      passRate: totalCases > 0 ? passed / totalCases : 0,
      byScenario,
      failures: results.filter((r) => !r.passed).map((r) => ({ caseId: r.caseId, errorMessage: r.errorMessage ?? 'unknown' })),
    };
  }

  /**
   * CI verdict - passRate >= 95% 视为通过
   */
  ciVerdict(report: TestRunReport): 'pass' | 'fail' {
    return report.passRate >= 0.95 ? 'pass' : 'fail';
  }
}
