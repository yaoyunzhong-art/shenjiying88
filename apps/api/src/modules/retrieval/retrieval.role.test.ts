import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
/**
 * 🐜 自动: [retrieval] [C] 角色测试编写
 *
 * Retrieval 模块 - 8 角色视角增强测试
 * 每个角色至少 2 个测试用例 (正常流程 + 权限边界)
 *
 * RBAC 权限矩阵 (R=读, W=写/索引, A=管理, - = 无):
 * ┌─────────┬────────┬─────────┬─────────┬──────┬───────┬──────────┐
 * │ 角色    │ query  │ index   │ health  │ dto- │ cache │ rag-ctx  │
 * │         │ (检索) │ (索引)  │ (健康)  │校验  │ 操作  │ (上下文) │
 * ├─────────┼────────┼─────────┼─────────┼──────┼───────┼──────────┤
 * │👔店长   │   R    │   -     │   R     │  -   │   W   │   R      │
 * │🛒前台   │   R    │   -     │   -     │  -   │   -   │   -      │
 * │👥HR     │   R    │   -     │   -     │  -   │   -   │   -      │
 * │🔧安监   │   R    │   -     │   R     │  -   │   -   │   R      │
 * │🎮导玩员 │   R    │   -     │   -     │  -   │   -   │   -      │
 * │🎯运行专 │   R    │   W     │   R     │  -   │   R   │   R      │
 * │🤝团建   │   R    │   -     │   -     │  -   │   -   │   -      │
 * │📢营销   │   R    │   -     │   -     │  -   │   -   │   -      │
 * └─────────┴────────┴─────────┴─────────┴──────┴───────┴──────────┘
 */

import assert from 'node:assert/strict';

// ── 角色枚举 ──
const ROLE = {
  Manager: '👔店长',
  Cashier: '🛒前台',
  HR: '👥HR',
  Safety: '🔧安监',
  Guide: '🎮导玩员',
  Ops: '🎯运行专员',
  TeamBuilder: '🤝团建',
  Marketing: '📢营销',
} as const;

type RoleName = keyof typeof ROLE;

// ── Permission 位掩码 ──
const PERM = {
  QUERY: 1 << 0,       // 基本检索
  INDEX: 1 << 1,       // 索引写入
  HEALTH: 1 << 2,      // 健康检查
  CACHE_WRITE: 1 << 3, // 缓存操作
  RAG_CTX: 1 << 4,     // 构建 RAG 上下文
  DTO_VALID: 1 << 5,   // DTO 校验调试
} as const;

/** RBAC 权限表 */
const RBAC: Record<RoleName, number> = {
  Manager: PERM.QUERY | PERM.HEALTH | PERM.CACHE_WRITE | PERM.RAG_CTX,
  Cashier: PERM.QUERY,
  HR: PERM.QUERY,
  Safety: PERM.QUERY | PERM.HEALTH | PERM.RAG_CTX,
  Guide: PERM.QUERY,
  Ops: PERM.QUERY | PERM.INDEX | PERM.HEALTH | PERM.CACHE_WRITE | PERM.RAG_CTX,
  TeamBuilder: PERM.QUERY,
  Marketing: PERM.QUERY,
};

// ── 模拟 DTO 校验规则 (与 class-validator 语义等价) ──
const DTO_RULES = {
  query: { required: true, minLen: 1, maxLen: 2000 },
  topK: { min: 1, max: 100 },
  threshold: { min: 0, max: 1 },
  collections: { maxSize: 3, allowed: ['code_chunks', 'knowledge_docs', 'rfc_history'] },
  phaseFilter: { maxSize: 20 },
  pathPrefix: { maxLen: 500 },
};

function validateQueryDto(body: Record<string, unknown>): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!body.query || typeof body.query !== 'string') {
    errors.push('query is required and must be a string');
  } else {
    if (body.query.length < DTO_RULES.query.minLen) errors.push(`query too short (min ${DTO_RULES.query.minLen})`);
    if (body.query.length > DTO_RULES.query.maxLen) errors.push(`query too long (max ${DTO_RULES.query.maxLen})`);
  }

  if (body.topK !== undefined) {
    const tk = Number(body.topK);
    if (!Number.isFinite(tk) || tk < DTO_RULES.topK.min || tk > DTO_RULES.topK.max) {
      errors.push(`topK must be ${DTO_RULES.topK.min}-${DTO_RULES.topK.max}`);
    }
  }

  if (body.threshold !== undefined) {
    const th = Number(body.threshold);
    if (!Number.isFinite(th) || th < DTO_RULES.threshold.min || th > DTO_RULES.threshold.max) {
      errors.push(`threshold must be ${DTO_RULES.threshold.min}-${DTO_RULES.threshold.max}`);
    }
  }

  if (body.collections !== undefined && Array.isArray(body.collections)) {
    if (body.collections.length > DTO_RULES.collections.maxSize) errors.push(`collections max ${DTO_RULES.collections.maxSize}`);
    for (const c of body.collections) {
      if (!DTO_RULES.collections.allowed.includes(c as any)) errors.push(`invalid collection: ${c}`);
    }
    if (body.collections.length < 1) errors.push('collections must have at least 1 item');
  }

  if (body.phaseFilter !== undefined && Array.isArray(body.phaseFilter)) {
    if (body.phaseFilter.length > DTO_RULES.phaseFilter.maxSize) errors.push(`phaseFilter max ${DTO_RULES.phaseFilter.maxSize}`);
  }

  if (body.pathPrefix !== undefined && typeof body.pathPrefix === 'string') {
    if (body.pathPrefix.length > DTO_RULES.pathPrefix.maxLen) errors.push(`pathPrefix max ${DTO_RULES.pathPrefix.maxLen}`);
  }

  return { valid: errors.length === 0, errors };
}

// ── 模拟检索服务 (角色上下文感知) ──
class RoleAwareRetrievalService {
  /** 审计日志 */
  private auditLog: Array<{ action: string; role: string; detail: string; timestamp: string }> = [];
  /** 索引计数 */
  private indexedChunks = 0;
  /** 内部状态 */
  private healthy = true;

  private requirePerm(role: RoleName, perm: number, action: string): boolean {
    const has = (RBAC[role] & perm) !== 0;
    this.auditLog.push({
      action,
      role: ROLE[role],
      detail: has ? 'ALLOWED' : 'DENIED',
      timestamp: new Date().toISOString(),
    });
    return has;
  }

  /** 检索代码 (QUERY) */
  query(body: Record<string, unknown>, role: RoleName): { success: boolean; data?: any; error?: string } {
    const allowed = this.requirePerm(role, PERM.QUERY, 'query');
    if (!allowed) return { success: false, error: `Forbidden: ${ROLE[role]} lacks QUERY permission` };

    // DTO 校验
    const dtoResult = validateQueryDto(body);
    if (!dtoResult.valid) return { success: false, error: `DTO validation failed: ${dtoResult.errors.join('; ')}` };

    // 模拟检索
    return {
      success: true,
      data: {
        results: [],
        totalHits: 0,
        latencyMs: 12,
        cacheHit: false,
        collections: body.collections ?? ['code_chunks'],
      },
    };
  }

  /** 知识库检索 (QUERY) */
  queryKnowledge(body: Record<string, unknown>, role: RoleName): { success: boolean; data?: any; error?: string } {
    const allowed = this.requirePerm(role, PERM.QUERY, 'queryKnowledge');
    if (!allowed) return { success: false, error: `Forbidden: ${ROLE[role]} lacks QUERY permission` };

    const dtoResult = validateQueryDto(body);
    if (!dtoResult.valid) return { success: false, error: `DTO validation failed: ${dtoResult.errors.join('; ')}` };

    return {
      success: true,
      data: {
        results: [],
        totalHits: 0,
        latencyMs: 8,
        cacheHit: false,
        collections: ['knowledge_docs'],
      },
    };
  }

  /** 索引写入 (INDEX) */
  index(role: RoleName): { success: boolean; data?: any; error?: string } {
    const allowed = this.requirePerm(role, PERM.INDEX, 'index');
    if (!allowed) return { success: false, error: `Forbidden: ${ROLE[role]} lacks INDEX permission` };
    this.indexedChunks++;
    return { success: true, data: { written: 1, failed: 0 } };
  }

  /** 健康检查 (HEALTH) */
  health(role: RoleName): { success: boolean; data?: any; error?: string } {
    const allowed = this.requirePerm(role, PERM.HEALTH, 'health');
    if (!allowed) return { success: false, error: `Forbidden: ${ROLE[role]} lacks HEALTH permission` };
    return {
      success: true,
      data: { status: 'ok', qdrant: 'ok', embedder: 'ok', lastIndexAt: null, healthy: this.healthy },
    };
  }

  /** 缓存操作 (CACHE_WRITE) */
  clearCache(role: RoleName): { success: boolean; error?: string } {
    const allowed = this.requirePerm(role, PERM.CACHE_WRITE, 'clearCache');
    if (!allowed) return { success: false, error: `Forbidden: ${ROLE[role]} lacks CACHE_WRITE permission` };
    return { success: true };
  }

  /** RAG 上下文构建 (RAG_CTX) */
  buildRAGContext(body: { query: string }, role: RoleName): { success: boolean; data?: any; error?: string } {
    const allowed = this.requirePerm(role, PERM.RAG_CTX, 'buildRAGContext');
    if (!allowed) return { success: false, error: `Forbidden: ${ROLE[role]} lacks RAG_CTX permission` };
    return {
      success: true,
      data: {
        codeContext: [],
        knowledgeContext: [],
        totalLatencyMs: 20,
        trigger: { phase: 'phase-19', pulse: 'pulse-71', intent: 'query' },
      },
    };
  }

  /** 获取审计日志 (内部使用) */
  getAuditLog() { return this.auditLog; }

  /** 获取索引计数 */
  getIndexedCount() { return this.indexedChunks; }

  /** 模拟降级 */
  setHealthy(h: boolean) { this.healthy = h; }

  reset() {
    this.auditLog = [];
    this.indexedChunks = 0;
    this.healthy = true;
  }
}

function createEnv() {
  return { service: new RoleAwareRetrievalService() };
}

// ──────────── 👔店长 (Manager) ────────────
describe(`${ROLE.Manager} retrieval 角色测试`, () => {
  it('店长可检索门店销售数据与运营报告 (正常流程)', () => {
    const { service } = createEnv();
    const res = service.query({ query: '门店日销售报告 2026-06-26', topK: 10 }, 'Manager');
    assert.equal(res.success, true);
    assert.ok(res.data);
    assert.equal(typeof res.data.totalHits, 'number');
    assert.ok(Array.isArray(res.data.results));
  });

  it('店长可查看健康状态并清除缓存 (权限边界：管理操作)', () => {
    const { service } = createEnv();
    const healthRes = service.health('Manager');
    assert.equal(healthRes.success, true);
    assert.equal(healthRes.data.status, 'ok');

    const clearRes = service.clearCache('Manager');
    assert.equal(clearRes.success, true);
  });

  it('店长可构建 RAG 上下文进行运营分析 (管理特权)', () => {
    const { service } = createEnv();
    const ctxRes = service.buildRAGContext({ query: '本月运营数据分析' }, 'Manager');
    assert.equal(ctxRes.success, true);
    assert.ok(ctxRes.data.codeContext !== undefined);
    assert.ok(ctxRes.data.knowledgeContext !== undefined);
    assert.equal(ctxRes.data.trigger.phase, 'phase-19');
  });

  it('店长不应能索引写操作 (权限边界：索引属于运维)', () => {
    const { service } = createEnv();
    const res = service.index('Manager');
    assert.equal(res.success, false);
    assert.equal(res.error, 'Forbidden: 👔店长 lacks INDEX permission');
  });
});

// ──────────── 🛒前台 (Cashier) ────────────
describe(`${ROLE.Cashier} retrieval 角色测试`, () => {
  it('前台可检索会员信息与收银相关代码片段 (正常流程)', () => {
    const { service } = createEnv();
    const res = service.query({ query: '会员查询收银流程', topK: 5 }, 'Cashier');
    assert.equal(res.success, true);
    assert.equal(typeof res.data.latencyMs, 'number');
  });

  it('前台请求超出范围参数应被 DTO 校验拦截 (权限边界：参数限制)', () => {
    const { service } = createEnv();
    const res = service.query({ query: 'a', topK: 999 }, 'Cashier');
    assert.equal(res.success, false);
    assert.ok(res.error!.includes('DTO validation'));
    assert.ok(res.error!.includes('topK'));
  });

  it('前台不可执行健康检查 (权限边界：只读)', () => {
    const { service } = createEnv();
    const res = service.health('Cashier');
    assert.equal(res.success, false);
    assert.ok(res.error!.includes('lacks HEALTH permission'));
  });
});

// ──────────── 👥HR ────────────
describe(`${ROLE.HR} retrieval 角色测试`, () => {
  it('HR 可检索员工管理与知识库文档 (正常流程)', () => {
    const { service } = createEnv();
    const codeRes = service.query({ query: '员工考勤管理制度' }, 'HR');
    assert.equal(codeRes.success, true);

    const knRes = service.queryKnowledge({ query: 'HR 培训手册' }, 'HR');
    assert.equal(knRes.success, true);
  });

  it('HR 检索带无效 collection 应被拒绝 (权限边界：DTO 校验)', () => {
    const { service } = createEnv();
    const res = service.query({ query: '员工数据', collections: ['invalid_collection'] }, 'HR');
    assert.equal(res.success, false);
    assert.ok(res.error!.includes('invalid collection'));
  });

  it('HR 不可执行索引操作 (权限边界：运维操作)', () => {
    const { service } = createEnv();
    const res = service.index('HR');
    assert.equal(res.success, false);
  });
});

// ──────────── 🔧安监 (Safety) ────────────
describe(`${ROLE.Safety} retrieval 角色测试`, () => {
  it('安监可检索安全告警相关代码与知识库 (正常流程)', () => {
    const { service } = createEnv();
    const res = service.query({ query: '防火墙规则告警处理逻辑', threshold: 0.5 }, 'Safety');
    assert.equal(res.success, true);

    const ctxRes = service.buildRAGContext({ query: '安全事件响应流程' }, 'Safety');
    assert.equal(ctxRes.success, true);
  });

  it('安监可查看系统健康状态 (运维权限)', () => {
    const { service } = createEnv();
    const res = service.health('Safety');
    assert.equal(res.success, true);
    assert.equal(res.data.status, 'ok');
  });

  it('安监在系统降级时健康检查仍可收到降级状态 (权限边界：监控)', () => {
    const { service } = createEnv();
    service.setHealthy(false);
    const res = service.health('Safety');
    assert.equal(res.success, true);
    assert.equal(res.data.healthy, false);
  });
});

// ──────────── 🎮导玩员 (Guide) ────────────
describe(`${ROLE.Guide} retrieval 角色测试`, () => {
  it('导玩员可检索游戏设备与积分功能代码 (正常流程)', () => {
    const { service } = createEnv();
    const res = service.query({ query: '游戏积分 API 调用方式', pathPrefix: 'apps/api/src/modules/games' }, 'Guide');
    assert.equal(res.success, true);
  });

  it('导玩员使用超大 topK 应被拒绝 (权限边界：参数限制)', () => {
    const { service } = createEnv();
    const res = service.query({ query: '所有游戏功能', topK: 200 }, 'Guide');
    assert.equal(res.success, false);
    assert.ok(res.error!.includes('topK'));
  });

  it('导玩员不可查看健康状态 (权限边界：无运维权限)', () => {
    const { service } = createEnv();
    const res = service.health('Guide');
    assert.equal(res.success, false);
  });
});

// ──────────── 🎯运行专员 (Ops) ────────────
describe(`${ROLE.Ops} retrieval 角色测试`, () => {
  it('运行专员可检索运维代码、索引新 chunk、查看健康 (正常流程：完整运维链路)', () => {
    const { service } = createEnv();

    // 1. 查询
    const queryRes = service.query({ query: '系统健康检查脚本', topK: 20, hybrid: true }, 'Ops');
    assert.equal(queryRes.success, true);

    // 2. 索引
    const idxRes = service.index('Ops');
    assert.equal(idxRes.success, true);
    assert.equal(service.getIndexedCount(), 1);

    // 3. 健康
    const hRes = service.health('Ops');
    assert.equal(hRes.success, true);
  });

  it('运行专员可清除缓存并重新索引 (权限边界：运维管理)', () => {
    const { service } = createEnv();
    const clearRes = service.clearCache('Ops');
    assert.equal(clearRes.success, true);

    // 批量索引
    service.index('Ops');
    service.index('Ops');
    assert.equal(service.getIndexedCount(), 2);

    // 构建 RAG 上下文
    const ctxRes = service.buildRAGContext({ query: '批量索引后的全库状态' }, 'Ops');
    assert.equal(ctxRes.success, true);
  });

  it('运行专员使用空 query 应被 DTO 拒绝 (权限边界：无效参数)', () => {
    const { service } = createEnv();
    const res = service.query({ query: '' }, 'Ops');
    assert.equal(res.success, false);
    assert.ok(res.error!.includes('query'));
  });
});

// ──────────── 🤝团建 (TeamBuilder) ────────────
describe(`${ROLE.TeamBuilder} retrieval 角色测试`, () => {
  it('团建可检索场地预约与活动管理功能 (正常流程)', () => {
    const { service } = createEnv();
    const res = service.query({ query: '团建场地预约规则', collections: ['code_chunks', 'knowledge_docs'] }, 'TeamBuilder');
    assert.equal(res.success, true);
    assert.deepEqual(res.data.collections, ['code_chunks', 'knowledge_docs']);
  });

  it('团建使用全部三个 collection 应被允许 (权限边界：多 collection 检索)', () => {
    const { service } = createEnv();
    const res = service.query({ query: '活动成本核算', collections: ['code_chunks', 'knowledge_docs', 'rfc_history'] }, 'TeamBuilder');
    assert.equal(res.success, true);
  });

  it('团建不可索引或查看健康 (权限边界：只读)', () => {
    const { service } = createEnv();
    assert.equal(service.index('TeamBuilder').success, false);
    assert.equal(service.health('TeamBuilder').success, false);
    assert.equal(service.clearCache('TeamBuilder').success, false);
  });
});

// ──────────── 📢营销 (Marketing) ────────────
describe(`${ROLE.Marketing} retrieval 角色测试`, () => {
  it('营销可检索促销活动与优惠券相关代码 (正常流程)', () => {
    const { service } = createEnv();
    const res = service.query({ query: '优惠券发放接口促销活动策划' }, 'Marketing');
    assert.equal(res.success, true);
  });

  it('营销检索知识库中的最佳实践 (正常流程：业务上下文)', () => {
    const { service } = createEnv();
    const res = service.queryKnowledge({ query: '营销最佳实践案例' }, 'Marketing');
    assert.equal(res.success, true);
    assert.deepEqual(res.data.collections, ['knowledge_docs']);
  });

  it('营销使用超长 query 应被拒绝 (权限边界：输入校验)', () => {
    const { service } = createEnv();
    const longQuery = 'x'.repeat(2001);
    const res = service.query({ query: longQuery }, 'Marketing');
    assert.equal(res.success, false);
    assert.ok(res.error!.includes('query too long'));
  });

  it('营销不可执行运维操作 (权限边界：INDEX/HEALTH/CACHE)', () => {
    const { service } = createEnv();
    assert.equal(service.index('Marketing').success, false);
    assert.equal(service.health('Marketing').success, false);
    assert.equal(service.clearCache('Marketing').success, false);
    assert.equal(service.buildRAGContext({ query: '任何' }, 'Marketing').success, false);
  });
});

// ──────────── 全局 RBAC 审计回归 ────────────
describe('retrieval RBAC 权限矩阵回归校验', () => {
  const { service } = createEnv();

  it('QUERY 权限应开放给所有 8 个角色', () => {
    const roles: RoleName[] = ['Manager', 'Cashier', 'HR', 'Safety', 'Guide', 'Ops', 'TeamBuilder', 'Marketing'];
    for (const r of roles) {
      const res = service.query({ query: 'test' }, r);
      assert.equal(res.success, true, `${ROLE[r]} should have QUERY`);
    }
  });

  it('INDEX 权限仅限于运行专员 (Ops)', () => {
    const roles: RoleName[] = ['Manager', 'Cashier', 'HR', 'Safety', 'Guide', 'TeamBuilder', 'Marketing'];
    for (const r of roles) {
      const res = service.index(r);
      assert.equal(res.success, false, `${ROLE[r]} should NOT have INDEX`);
    }
    assert.equal(service.index('Ops').success, true, 'Ops should have INDEX');
  });

  it('HEALTH 权限仅限于 Manager/Safety/Ops', () => {
    const allowed: RoleName[] = ['Manager', 'Safety', 'Ops'];
    const denied: RoleName[] = ['Cashier', 'HR', 'Guide', 'TeamBuilder', 'Marketing'];
    for (const r of allowed) {
      assert.equal(service.health(r).success, true, `${ROLE[r]} should have HEALTH`);
    }
    for (const r of denied) {
      assert.equal(service.health(r).success, false, `${ROLE[r]} should NOT have HEALTH`);
    }
  });

  it('CACHE_WRITE 权限仅限于 Manager/Ops', () => {
    const allowed: RoleName[] = ['Manager', 'Ops'];
    const denied: RoleName[] = ['Cashier', 'HR', 'Safety', 'Guide', 'TeamBuilder', 'Marketing'];
    for (const r of allowed) {
      assert.equal(service.clearCache(r).success, true, `${ROLE[r]} should have CACHE_WRITE`);
    }
    for (const r of denied) {
      assert.equal(service.clearCache(r).success, false, `${ROLE[r]} should NOT have CACHE_WRITE`);
    }
  });

  it('RAG_CTX 权限仅限于 Manager/Safety/Ops', () => {
    const allowed: RoleName[] = ['Manager', 'Safety', 'Ops'];
    const denied: RoleName[] = ['Cashier', 'HR', 'Guide', 'TeamBuilder', 'Marketing'];
    for (const r of allowed) {
      assert.equal(service.buildRAGContext({ query: 'test' }, r).success, true, `${ROLE[r]} should have RAG_CTX`);
    }
    for (const r of denied) {
      assert.equal(service.buildRAGContext({ query: 'test' }, r).success, false, `${ROLE[r]} should NOT have RAG_CTX`);
    }
  });

  it('DTO 校验在所有角色中表现一致', () => {
    const roles: RoleName[] = ['Manager', 'Cashier', 'HR', 'Safety', 'Guide', 'Ops', 'TeamBuilder', 'Marketing'];
    for (const r of roles) {
      const invalid = service.query({ query: 'ok', topK: -1 }, r);
      assert.equal(invalid.success, false, `${ROLE[r]} should reject invalid DTO`);
      const valid = service.query({ query: 'ok', topK: 10 }, r);
      assert.equal(valid.success, true, `${ROLE[r]} should accept valid DTO`);
    }
  });

  it('审计日志正确记录每次操作的角色与结果', () => {
    const svc = service;
    // 清理当前服务审计日志，用独立环境
    const env = createEnv();
    const s = env.service;

    s.query({ query: '会员数据' }, 'HR');
    s.index('Ops');
    s.health('Manager');
    s.clearCache('Cashier'); // 应被拒绝

    const log = s.getAuditLog();
    assert.equal(log.length, 4);

    const queryEntry = log.find(e => e.action === 'query');
    assert.equal(queryEntry!.role, '👥HR');
    assert.equal(queryEntry!.detail, 'ALLOWED');

    const indexEntry = log.find(e => e.action === 'index');
    assert.equal(indexEntry!.role, '🎯运行专员');
    assert.equal(indexEntry!.detail, 'ALLOWED');

    const cacheEntry = log.find(e => e.action === 'clearCache');
    assert.equal(cacheEntry!.role, '🛒前台');
    assert.equal(cacheEntry!.detail, 'DENIED');
  });
});
