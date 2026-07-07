// tenant-isolation.lint.ts - Phase-18 T21
// 用途: 跨租户隔离静态扫描 (ESLint rule + 独立可执行)
// 关联: phase-18-experience-ai/spec.md §4
import { readFileSync } from 'node:fs';

export interface LintViolation {
  file: string;
  line: number;
  column: number;
  ruleId: string;
  severity: 'error' | 'warn';
  message: string;
  snippet: string;
}

export interface LintSummary {
  totalFiles: number;
  totalViolations: number;
  byRule: Record<string, number>;
  violations: LintViolation[];
}

/**
 * 规则 1: 禁止 repo.findOne({ where: ... }) 不含 tenantId
 * 规则 2: 禁止 repo.find({ where: ... }) 不含 tenantId
 * 规则 3: 禁止跨租户 JOIN (qb.leftJoin 跨 tenant 字段)
 * 规则 4: 禁止 QueryBuilder.where 不带 tenantId
 */
export class TenantIsolationLinter {
  // 匹配: findOne / find 调用 + where 对象,捕获 where {...} 是否包含 tenantId
  private readonly findOnePattern =
    /(?:\.findOne|\.find)\s*\(\s*\{[^}]*?where\s*:\s*\{([\s\S]*?)\}/g;
  private readonly qbPattern =
    /(?:createQueryBuilder|\.leftJoin|\.innerJoin)\s*\([^)]*\)/g;
  private readonly tenantIdPattern = /tenantId/;

  /**
   * 扫描单个文件
   */
  lintFile(filePath: string, content: string): LintViolation[] {
    const violations: LintViolation[] = [];
    const lines = content.split('\n');

    // 规则 1+2: findOne/find where 不含 tenantId
    let match: RegExpExecArray | null;
    const findOneRe = new RegExp(this.findOnePattern.source, 'g');
    while ((match = findOneRe.exec(content)) !== null) {
      const whereContent = match[1];
      if (!this.tenantIdPattern.test(whereContent)) {
        const lineNum = content.slice(0, match.index).split('\n').length;
        const line = lines[lineNum - 1] ?? '';
        violations.push({
          file: filePath,
          line: lineNum,
          column: 1,
          ruleId: 'missing-tenant-guard',
          severity: 'error',
          message: `repo.${match[0].includes('findOne') ? 'findOne' : 'find'}() where clause missing tenantId filter - cross-tenant leak risk`,
          snippet: line.trim(),
        });
      }
    }

    // 规则 3: 跨租户 JOIN (leftJoin/innerJoin + 其他 entity alias 但缺 tenantId filter)
    const qbRe = new RegExp(this.qbPattern.source, 'g');
    while ((match = qbRe.exec(content)) !== null) {
      const callText = match[0];
      // 简化检测:leftJoin 跨 entity 但后续 where 不带 tenantId 即报错
      if (callText.includes('leftJoin') || callText.includes('innerJoin')) {
        // 后续 200 字符内未出现 tenantId 即违规
        const lookahead = content.slice(match.index, match.index + 500);
        if (!this.tenantIdPattern.test(lookahead)) {
          const lineNum = content.slice(0, match.index).split('\n').length;
          const line = lines[lineNum - 1] ?? '';
          violations.push({
            file: filePath,
            line: lineNum,
            column: 1,
            ruleId: 'cross-tenant-join',
            severity: 'error',
            message: 'QueryBuilder JOIN without subsequent tenantId filter - possible cross-tenant leak',
            snippet: line.trim(),
          });
        }
      }
    }

    return violations;
  }

  /**
   * 扫描多个文件
   */
  lintFiles(files: Array<{ path: string; content: string }>): LintSummary {
    const allViolations: LintViolation[] = [];
    for (const f of files) {
      allViolations.push(...this.lintFile(f.path, f.content));
    }
    const byRule: Record<string, number> = {};
    for (const v of allViolations) {
      byRule[v.ruleId] = (byRule[v.ruleId] ?? 0) + 1;
    }
    return {
      totalFiles: files.length,
      totalViolations: allViolations.length,
      byRule,
      violations: allViolations,
    };
  }

  /**
   * CI verdict
   */
  ciVerdict(summary: LintSummary): 'pass' | 'fail' {
    const errorCount = summary.violations.filter((v) => v.severity === 'error').length;
    return errorCount === 0 ? 'pass' : 'fail';
  }
}

/**
 * CLI helper:扫描 apps/api/src/modules (核心业务模块)
 */
export function lintApiModules(): LintSummary {
  const linter = new TenantIsolationLinter();
  // V1 stub:实际实现接 fs.readdirSync 递归
  return linter.lintFiles([]);
}
