// ai-reviewer.service.ts - Phase-18 T17
// 用途: 自动检测 lessons-learned 中的 anti-patterns
// 关联: phase-18-experience-ai/spec.md §2.2
import { Injectable, Logger } from '@nestjs/common';

export type ReviewSeverity = 'info' | 'warn' | 'error';

export interface ReviewFinding {
  ruleId: string;
  ruleName: string;
  severity: ReviewSeverity;
  file: string;
  line?: number;
  snippet: string;
  message: string;
  suggestion: string;
  reference: string;
}

export interface ReviewRule {
  ruleId: string;
  ruleName: string;
  description: string;
  severity: ReviewSeverity;
  pattern: RegExp;
  reference: string;  // link to lessons-learned/patterns doc
}

/**
 * AIReviewerService - AI Code Reviewer 雏形
 *
 * 当前规则 (Phase-18 T17 V1):
 * 1. quota-double-increment (Phase-17 retro 暴露的 bug)
 * 2. unsafe-catch (吞掉错误的 catch)
 * 3. missing-guard (缺 lifecycle/quota 守卫)
 * 4. cross-tenant-leak (跨租户查询缺 tenantId)
 * 5. stub-test-fragility (硬编码的 mock 占位)
 *
 * V2 计划: 接入 LLM 做语义级检查
 */
@Injectable()
export class AIReviewerService {
  private readonly logger = new Logger(AIReviewerService.name);
  private readonly rules: ReviewRule[] = [
    {
      ruleId: 'quota-double-increment',
      ruleName: 'Quota 双重 increment',
      description: 'reserve() 已自增,业务成功不应再 increment',
      severity: 'error',
      pattern: /quota\.reserve\([^)]+\)[\s\S]{0,500}?quota\.increment\([^)]+\)/m,
      reference: '.trae/specs/phase-17-marketing-community/anti-patterns/quota-double-increment.md',
    },
    {
      ruleId: 'unsafe-catch',
      ruleName: '吞掉错误的 catch',
      description: 'catch 块不应静默吞错,至少 logger.error',
      severity: 'warn',
      pattern: /catch\s*\([^)]*\)\s*\{\s*\}/m,
      reference: '.trae/specs/phase-17-marketing-community/patterns/cross-store-transaction.md',
    },
    {
      ruleId: 'missing-tenant-guard',
      ruleName: '跨租户查询缺 tenantId',
      description: 'findOne 应带 where.tenantId 防越权',
      severity: 'error',
      pattern: /\.findOne\([^)]*\{\s*where:\s*\{\s*[^}]*\}\s*\}\)/m,
      reference: '.trae/specs/phase-18-experience-ai/spec.md §2.4',
    },
    {
      ruleId: 'undefined-data-source',
      ruleName: 'Stub 测试硬编码 undefined',
      description: '测试不应硬编码 undefined,应 mock dataSource',
      severity: 'info',
      pattern: /new\s+\w+Service\([^)]*undefined[^)]*undefined/m,
      reference: '.trae/specs/phase-17-marketing-community/lessons-learned/phase-17.md',
    },
    {
      ruleId: 'console-log-in-service',
      ruleName: '业务代码用 console.log 而非 Logger',
      description: 'NestJS 应使用内置 Logger',
      severity: 'info',
      pattern: /console\.log\(/,
      reference: 'NestJS Logger 文档',
    },
  ];

  /** 注册自定义规则 */
  registerRule(rule: ReviewRule): void {
    this.rules.push(rule);
  }

  /** 列出所有规则 */
  listRules(): ReviewRule[] {
    return [...this.rules];
  }

  /** 审查单个文件 */
  reviewFile(filePath: string, content: string): ReviewFinding[] {
    const findings: ReviewFinding[] = [];
    const lines = content.split('\n');
    for (const rule of this.rules) {
      const matches = content.matchAll(new RegExp(rule.pattern.source, rule.pattern.flags + 'g'));
      for (const match of matches) {
        const lineNo = content.substring(0, match.index).split('\n').length;
        const snippet = lines[lineNo - 1]?.trim() ?? match[0].slice(0, 80);
        findings.push({
          ruleId: rule.ruleId,
          ruleName: rule.ruleName,
          severity: rule.severity,
          file: filePath,
          line: lineNo,
          snippet: snippet.slice(0, 100),
          message: rule.description,
          suggestion: this.suggestForRule(rule.ruleId),
          reference: rule.reference,
        });
      }
    }
    return findings;
  }

  /** 审查多个文件 */
  reviewFiles(files: { path: string; content: string }[]): ReviewFinding[] {
    const all: ReviewFinding[] = [];
    for (const f of files) {
      all.push(...this.reviewFile(f.path, f.content));
    }
    return all;
  }

  private suggestForRule(ruleId: string): string {
    const map: Record<string, string> = {
      'quota-double-increment': '改用 quota.check() 替代 quota.reserve(),业务成功时再 increment',
      'unsafe-catch': 'catch 块应 logger.error + 重新抛出或返回结构化错误',
      'missing-tenant-guard': 'findOne 必须带 where: { tenantId, ... }',
      'undefined-data-source': '用 mock DataSource: { transaction: async (cb) => cb(...) }',
      'console-log-in-service': '改用 new Logger(ClassName.name)',
    };
    return map[ruleId] ?? '见 reference 文档';
  }

  /** 按严重度统计 */
  summarize(findings: ReviewFinding[]): Record<ReviewSeverity, number> {
    const summary: Record<ReviewSeverity, number> = { info: 0, warn: 0, error: 0 };
    for (const f of findings) summary[f.severity]++;
    return summary;
  }

  /** CI 集成 - 错误数 > 0 则失败 */
  ciVerdict(findings: ReviewFinding[]): { pass: boolean; errorCount: number; warnCount: number } {
    const summary = this.summarize(findings);
    return {
      pass: summary.error === 0,
      errorCount: summary.error,
      warnCount: summary.warn,
    };
  }
}
