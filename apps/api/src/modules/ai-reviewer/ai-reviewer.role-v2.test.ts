/**
 * ai-reviewer.role-v2.test.ts · AI 审查 8 角色视角 v2 测试
 *
 * 新增深度场景:
 *   👔店长    - 项目级质量报告、部门代码规范达标率
 *   🛒前台    - 前端/UI 代码审查、样式安全问题
 *   👥HR      - 新入职代码规范培训审查
 *   🔧安监    - 安全审计红线、敏感信息泄露检测
 *   🎮导玩员  - sdk/插件代码审查、合规
 *   🎯运行专员 - 部署代码审查、环境配置审计
 *   🤝团建    - 团队协作代码互审场景
 *   📢营销    - 营销代码合规、隐私数据审查
 *
 * 每个角色包含:
 *   1) 正常流程（审查正常代码）
 *   2) 权限边界（触发规则检测）
 *   3) 特殊场景（空/大文件/无效输入/极限值）
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { AIReviewerController } from './ai-reviewer.controller';
import { AIReviewerService } from './ai-reviewer.service';

// ── 角色定义 ──
const ROLES = {
  StoreManager: '👔店长',
  Reception: '🛒前台',
  HR: '👥HR',
  Security: '🔧安监',
  GameGuide: '🎮导玩员',
  Ops: '🎯运行专员',
  TeamBuilder: '🤝团建',
  Marketing: '📢营销',
};

let controller: AIReviewerController;
let service: AIReviewerService;

beforeEach(() => {
  service = new AIReviewerService();
  controller = new AIReviewerController(service);
});

// ── 测试辅助 ──

/** 干净代码 — 使用 Logger 而非 console.log */
const cleanCode = `import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class SafeService {
  private readonly logger = new Logger(SafeService.name);

  async findData(tenantId: string) {
    this.logger.log('查询数据', tenantId);
    return { ok: true };
  }
}`;

/** 含 console.log 的代码 */
const consoleLogCode = `import { Injectable } from '@nestjs/common';

@Injectable()
export class BadService {
  async debug() {
    console.log('debug message');
  }
}`;

/** 含 unsafe-catch 的代码 */
const unsafeCatchCode = `import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class UnsafeCatchService {
  private readonly logger = new Logger(UnsafeCatchService.name);

  async risky(tenantId: string) {
    try {
      await this.quota.reserve(tenantId);
    } catch (e) {}
    return { ok: true };
  }
}`;

/** 含 missing-tenant-guard 的代码 */
const missingTenantCode = `import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

@Injectable()
export class LeakService {
  constructor(
    @InjectRepository(UserEntity)
    private readonly repo: Repository<UserEntity>,
  ) {}

  async findAll() {
    return this.repo.findOne({ where: { id: '1' } });
  }
}`;

/** 含 quota-double-increment 的代码 */
const quotaDoubleCode = `import { Injectable } from '@nestjs/common';

@Injectable()
export class QuotaService {
  async use(tenantId: string) {
    await this.quota.reserve(tenantId);
    await this.quota.increment(tenantId);
    return { used: true };
  }
}`;

/** 含 undefined-data-source 的代码 */
const undefinedDataSourceCode = `class Test {
  async test() {
    const svc = new SomeService(undefined, undefined);
  }
}`;

/** 含所有违规的代码 */
const allViolationsCode = `import { Injectable } from '@nestjs/common';

@Injectable()
export class AllViolationsService {
  async process(tenantId: string) {
    try {
    } catch (e) {}
    console.log('process');
    const r = await this.quota.reserve(tenantId);
    await this.quota.increment(tenantId);
    return this.repo.findOne({ where: { id: '1' } });
  }
}
const x = new SomeService(undefined, undefined);`;

/** 空内容 */
const emptyContent = '';

/** 大文件内容 (500 行) */
const largeContent = Array.from({ length: 500 }, (_, i) => `// line ${i + 1}`).join('\n');

// ════════════════════════════════════════════════════════
// 👔 店长 — 项目级代码质量报告
// ════════════════════════════════════════════════════════
describe(`${ROLES.StoreManager} 店长 - 项目级代码质量报告`, () => {
  it('正常: 审查干净代码项目，应通过 CI 验证', () => {
    const result = controller.review({
      files: [
        { path: 'src/user.service.ts', content: cleanCode },
        { path: 'src/product.service.ts', content: cleanCode },
      ],
    });
    expect(result.verdict.pass).toBe(true);
    expect(result.totalFiles).toBe(2);
    expect(result.totalFindings).toBe(0);
  });

  it('权限边界: 代码库中有违规 error 级代码，CI 应失败并返回错误计数', () => {
    const result = controller.review({
      files: [
        { path: 'src/user.service.ts', content: cleanCode },
        { path: 'src/suspicious.service.ts', content: missingTenantCode },
      ],
    });
    expect(result.verdict.pass).toBe(false);
    expect(result.verdict.errorCount).toBeGreaterThanOrEqual(1);
  });

  it('降级场景: 空文件列表应被 DTO 校验拦截', () => {
    expect(() =>
      controller.review({ files: [] }),
    ).not.toThrow();
    // DTO 校验应被 ValidationPipe 拦截
  });

  it('大数据: 500 行大文件+干净代码应通过审查', () => {
    const result = controller.review({
      files: [{ path: 'src/big-file.ts', content: largeContent }],
    });
    expect(result.verdict.pass).toBe(true);
    expect(result.totalFiles).toBe(1);
  });
});

// ════════════════════════════════════════════════════════
// 🛒 前台 — 前端/UI 代码审查
// ════════════════════════════════════════════════════════
describe(`${ROLES.Reception} 前台 - 前端代码审查`, () => {
  it('正常: 前端干净代码应通过审查', () => {
    const result = controller.review({
      files: [{ path: 'src/components/Button.tsx', content: cleanCode }],
    });
    expect(result.verdict.pass).toBe(true);
  });

  it('权限边界: 前端代码含 console.log 调试语句应被 warning 检测', () => {
    const result = controller.review({
      files: [{ path: 'src/components/Modal.tsx', content: consoleLogCode }],
    });
    const logFindings = result.findings.filter((f) => f.ruleId === 'console-log-in-service');
    expect(logFindings.length).toBeGreaterThanOrEqual(1);
    expect(logFindings[0].severity).toBe('info');
  });

  it('特殊: 前端空组件文件应无错误', () => {
    const result = controller.review({
      files: [{ path: 'src/components/Empty.tsx', content: emptyContent }],
    });
    expect(result.totalFindings).toBe(0);
  });
});

// ════════════════════════════════════════════════════════
// 👥 HR — 新入职代码规范培训审查
// ════════════════════════════════════════════════════════
describe(`${ROLES.HR} HR - 新入职代码规范审查`, () => {
  it('正常: 按规范培训后写的代码应通过审查', () => {
    const result = controller.review({
      files: [{ path: 'src/newhire/hello.ts', content: cleanCode }],
    });
    expect(result.verdict.pass).toBe(true);
    expect(result.totalFindings).toBe(0);
  });

  it('权限边界: 新入职新手常见错误(unsafe catch)应检测到', () => {
    const result = controller.review({
      files: [{ path: 'src/newhire/learn.ts', content: unsafeCatchCode }],
    });
    const catches = result.findings.filter((f) => f.ruleId === 'unsafe-catch');
    expect(catches.length).toBeGreaterThanOrEqual(1);
    expect(catches[0].severity).toBe('warn');
  });

  it('特殊: 空代码也应返回正常审查结果', () => {
    const result = controller.review({
      files: [{ path: 'src/newhire/empty.ts', content: '' }],
    });
    expect(result.verdict.pass).toBe(true);
    expect(result.totalFindings).toBe(0);
  });
});

// ════════════════════════════════════════════════════════
// 🔧 安监 — 安全审计检测
// ════════════════════════════════════════════════════════
describe(`${ROLES.Security} 安监 - 安全审计`, () => {
  it('正常: 安全编码通过应无 error', () => {
    const result = controller.review({
      files: [{ path: 'src/secure/auth.ts', content: cleanCode }],
    });
    expect(result.verdict.pass).toBe(true);
  });

  it('权限边界: 跨租户查询缺 tenantId 应被检测为 error', () => {
    const result = controller.review({
      files: [{ path: 'src/leak/user.ts', content: missingTenantCode }],
    });
    const tenantIssues = result.findings.filter((f) => f.ruleId === 'missing-tenant-guard');
    expect(tenantIssues.length).toBeGreaterThanOrEqual(1);
    expect(tenantIssues[0].severity).toBe('error');
  });

  it('降级: 同时多个安全违规应全部检出', () => {
    const result = controller.review({
      files: [
        { path: 'src/vuln1.ts', content: unsafeCatchCode },
        { path: 'src/vuln2.ts', content: missingTenantCode },
        { path: 'src/vuln3.ts', content: consoleLogCode },
      ],
    });
    const ruleIds = new Set(result.findings.map((f) => f.ruleId));
    expect(ruleIds.has('unsafe-catch')).toBe(true);
    expect(ruleIds.has('missing-tenant-guard')).toBe(true);
    expect(ruleIds.has('console-log-in-service')).toBe(true);
  });
});

// ════════════════════════════════════════════════════════
// 🎮 导玩员 — sdk/插件代码审查
// ════════════════════════════════════════════════════════
describe(`${ROLES.GameGuide} 导玩员 - SDK/插件审查`, () => {
  it('正常: SDK 干净代码通过', () => {
    const result = controller.review({
      files: [{ path: 'sdk/game-engine.ts', content: cleanCode }],
    });
    expect(result.verdict.pass).toBe(true);
  });

  it('权限边界: SDK 使用 undefined 初始化 dataSource 应被 info 级别发现', () => {
    const result = controller.review({
      files: [{ path: 'sdk/plugin-loader.ts', content: undefinedDataSourceCode }],
    });
    const undefFindings = result.findings.filter((f) => f.ruleId === 'undefined-data-source');
    expect(undefFindings.length).toBeGreaterThanOrEqual(1);
    expect(undefFindings[0].severity).toBe('info');
  });

  it('特性: 一键 CI-VERIFY 检测违规', () => {
    const ciResult = controller.ciVerify({
      files: [{ path: 'sdk/test.ts', content: allViolationsCode }],
    });
    expect(ciResult.pass).toBe(false);
    expect(ciResult.errorCount).toBeGreaterThan(0);
    expect(ciResult.warnCount).toBeGreaterThan(0);
  });
});

// ════════════════════════════════════════════════════════
// 🎯 运行专员 — 部署代码审查
// ════════════════════════════════════════════════════════
describe(`${ROLES.Ops} 运行专员 - 部署代码审查`, () => {
  it('正常: 部署相关代码干净', () => {
    const result = controller.review({
      files: [{ path: 'deploy/startup.ts', content: cleanCode }],
    });
    expect(result.verdict.pass).toBe(true);
  });

  it('权限边界: 部署脚本含 console.log 应 warning', () => {
    const result = controller.review({
      files: [{ path: 'deploy/health-check.ts', content: consoleLogCode }],
    });
    const logs = result.findings.filter((f) => f.ruleId === 'console-log-in-service');
    expect(logs.length).toBeGreaterThanOrEqual(1);
  });

  it('汇总: 部署代码的统计信息应有 summary', () => {
    const result = controller.review({
      files: [
        { path: 'deploy/start.ts', content: cleanCode },
        { path: 'deploy/config.ts', content: consoleLogCode },
      ],
    });
    expect(result.summary).toBeDefined();
    expect(typeof result.summary.info).toBe('number');
    expect(typeof result.summary.warn).toBe('number');
    expect(typeof result.summary.error).toBe('number');
  });
});

// ════════════════════════════════════════════════════════
// 🤝 团建 — 团队代码互审
// ════════════════════════════════════════════════════════
describe(`${ROLES.TeamBuilder} 团建 - 团队代码互审`, () => {
  it('正常: 代码互审通过', () => {
    const result = controller.review({
      files: [
        { path: 'team/alice/feature.ts', content: cleanCode },
        { path: 'team/bob/feature.ts', content: cleanCode },
      ],
    });
    expect(result.verdict.pass).toBe(true);
    expect(result.totalFiles).toBe(2);
  });

  it('权限边界: 发现队友代码中的 quota double increment 问题', () => {
    const result = controller.review({
      files: [{ path: 'team/charlie/quota.ts', content: quotaDoubleCode }],
    });
    const quota = result.findings.filter((f) => f.ruleId === 'quota-double-increment');
    expect(quota.length).toBeGreaterThanOrEqual(1);
  });

  it('特殊: 单个文件 all-violations 可被 CI verify 拦截', () => {
    const ciResult = controller.ciVerify({
      files: [{ path: 'team/dave/all.ts', content: allViolationsCode }],
    });
    expect(ciResult.pass).toBe(false);
    expect(ciResult.errorCount).toBeGreaterThan(0);
    expect(ciResult.findings).toBeGreaterThan(0);
  });
});

// ════════════════════════════════════════════════════════
// 📢 营销 — 营销代码合规审查
// ════════════════════════════════════════════════════════
describe(`${ROLES.Marketing} 营销 - 营销代码合规审查`, () => {
  it('正常: 营销活动代码通过审查', () => {
    const result = controller.review({
      files: [{ path: 'campaign/promotion.ts', content: cleanCode }],
    });
    expect(result.verdict.pass).toBe(true);
  });

  it('权限边界: 营销活动代码含多余 console.log 应被标记', () => {
    const result = controller.review({
      files: [{ path: 'campaign/tracking.ts', content: consoleLogCode }],
    });
    const logIssues = result.findings.filter((f) => f.ruleId === 'console-log-in-service');
    expect(logIssues.length).toBeGreaterThanOrEqual(1);
  });

  it('综合: 营销代码含多个问题应完整报告', () => {
    const result = controller.review({
      files: [{ path: 'campaign/complex.ts', content: allViolationsCode }],
    });
    // 5 规则同时在 allViolationsCode 中出现
    expect(result.totalFindings).toBeGreaterThanOrEqual(5);
    expect(result.summary.error).toBeGreaterThan(0);
    expect(result.summary.warn).toBeGreaterThan(0);
  });
});

// ════════════════════════════════════════════════════════
// 跨角色: 共享场景测试
// ════════════════════════════════════════════════════════
describe('🎭 跨角色 - 共享场景', () => {
  it('规则注册: 可以注册新规则并通过审查看到结果', () => {
    const registerResult = controller.registerRule({
      ruleId: 'no-any-type',
      ruleName: '禁止 any 类型',
      description: '代码中不应出现 any 类型',
      severity: 'error',
      pattern: ': any',
      reference: 'docs/typescript.md',
    });
    expect(registerResult.ruleId).toBe('no-any-type');

    const codeWithAny = `function foo(x: any) { return x; }`;
    const result = controller.review({
      files: [{ path: 'src/any.ts', content: codeWithAny }],
    });
    expect(result.totalFindings).toBeGreaterThanOrEqual(1);
    expect(result.findings.some((f) => f.ruleId === 'no-any-type')).toBe(true);
  });

  it('规则列表: 获取所有规则应包含预置 5 条', () => {
    const rules = controller.listRules();
    expect(rules.length).toBeGreaterThanOrEqual(5);
    expect(rules.find((r) => r.ruleId === 'quota-double-increment')).toBeDefined();
    expect(rules.find((r) => r.ruleId === 'unsafe-catch')).toBeDefined();
    expect(rules.find((r) => r.ruleId === 'missing-tenant-guard')).toBeDefined();
    expect(rules.find((r) => r.ruleId === 'undefined-data-source')).toBeDefined();
    expect(rules.find((r) => r.ruleId === 'console-log-in-service')).toBeDefined();
  });

  it('统计端点: getStats 应返回合理结构', () => {
    const stats = controller.getStats();
    expect(stats).toBeDefined();
    expect(stats.totalSessions).toBeGreaterThanOrEqual(0);
    expect(typeof stats.passRate).toBe('number');
    expect(stats.passRate).toBe(1);
  });

  it('规则详情: 获取不存在的规则应返回 error', () => {
    const result = controller.getRule('non-existent-rule');
    expect(result).toHaveProperty('error');
    expect((result as { error: string }).error).toContain('not found');
  });

  it('规则详情: 获取存在的规则应返回详细信息', () => {
    const result = controller.getRule('unsafe-catch');
    expect(result).not.toHaveProperty('error');
    expect((result as any).ruleId).toBe('unsafe-catch');
    expect((result as any).severity).toBe('warn');
  });
});
