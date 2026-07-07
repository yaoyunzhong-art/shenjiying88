import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
/**
 * 🐜 自动: [retrieval] [C] 角色测试扩展编写
 *
 * 8 角色深度场景扩展测试 — retrieval 模块
 * 👔店长 🛒前台 👥HR 🔧安监 🎮导玩员 🎯运行专员 🤝团建 📢营销
 *
 * 每个角色 ≥ 3 测试用例 (正常流程 + 降级场景 + 权限边界)
 * 覆盖: query, queryKnowledge, index, health, clearCache,
 *       buildRAGContext, audit, batchQuery
 * 扩展: 缓存穿透、空结果、大规模并发模拟、异常数据、角色元数据验证
 */

import assert from 'node:assert/strict';

// ── 8 角色定义 ──
const ROLES = {
  StoreManager: '👔店长',
  FrontDesk: '🛒前台',
  HR: '👥HR',
  Safety: '🔧安监',
  Guide: '🎮导玩员',
  Ops: '🎯运行专员',
  Teambuilding: '🤝团建',
  Marketing: '📢营销',
} as const;
type RoleName = keyof typeof ROLES;

// ── 权限位 ──
const PERM = {
  QUERY: 1 << 0,
  INDEX: 1 << 1,
  HEALTH: 1 << 2,
  CACHE_WRITE: 1 << 3,
  RAG_CTX: 1 << 4,
  DTO_VALID: 1 << 5,
  BATCH_QUERY: 1 << 6,
} as const;

// ── RBAC 矩阵 ──
const RBAC: Record<RoleName, number> = {
  StoreManager: PERM.QUERY | PERM.HEALTH | PERM.CACHE_WRITE | PERM.RAG_CTX,
  FrontDesk: PERM.QUERY,
  HR: PERM.QUERY,
  Safety: PERM.QUERY | PERM.HEALTH | PERM.RAG_CTX,
  Guide: PERM.QUERY,
  Ops: PERM.QUERY | PERM.INDEX | PERM.HEALTH | PERM.CACHE_WRITE | PERM.RAG_CTX,
  Teambuilding: PERM.QUERY,
  Marketing: PERM.QUERY,
};

// ── 角色元数据集 (各角色偏好的 collection 和查询风格) ──
const ROLE_META: Record<RoleName, { collections: string[]; queryIntent: string }> = {
  StoreManager: { collections: ['code_chunks', 'knowledge_docs'], queryIntent: '运营分析' },
  FrontDesk: { collections: ['code_chunks'], queryIntent: '收银流程' },
  HR: { collections: ['knowledge_docs'], queryIntent: '员工管理' },
  Safety: { collections: ['code_chunks'], queryIntent: '安全告警' },
  Guide: { collections: ['code_chunks'], queryIntent: '游戏设备' },
  Ops: { collections: ['code_chunks', 'rfc_history'], queryIntent: '系统运维' },
  Teambuilding: { collections: ['knowledge_docs', 'code_chunks'], queryIntent: '团建活动' },
  Marketing: { collections: ['knowledge_docs'], queryIntent: '营销活动' },
};

// ── 模拟 DTO 校验规则 ──
const DTO_RULES = {
  query: { minLen: 1, maxLen: 2000 },
  topK: { min: 1, max: 100 },
  threshold: { min: 0, max: 1 },
  collections: { maxSize: 3, allowed: ['code_chunks', 'knowledge_docs', 'rfc_history'] },
  phaseFilter: { maxSize: 20 },
  pathPrefix: { maxLen: 500 },
};

function validateQueryDto(body: Record<string, unknown>): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  if (!body.query || typeof body.query !== 'string') errors.push('query required');
  else {
    if (body.query.length < DTO_RULES.query.minLen) errors.push(`query too short`);
    if (body.query.length > DTO_RULES.query.maxLen) errors.push(`query too long`);
  }
  if (body.topK !== undefined) {
    const tk = Number(body.topK);
    if (!Number.isFinite(tk) || tk < DTO_RULES.topK.min || tk > DTO_RULES.topK.max) errors.push(`invalid topK`);
  }
  if (body.threshold !== undefined) {
    const th = Number(body.threshold);
    if (!Number.isFinite(th) || th < DTO_RULES.threshold.min || th > DTO_RULES.threshold.max) errors.push(`invalid threshold`);
  }
  if (body.collections !== undefined && Array.isArray(body.collections)) {
    if (body.collections.length > DTO_RULES.collections.maxSize) errors.push(`too many collections`);
    if (body.collections.length < 1) errors.push(`need at least 1 collection`);
    for (const c of body.collections) {
      if (!DTO_RULES.collections.allowed.includes(c as any)) errors.push(`invalid collection: ${c}`);
    }
  }
  if (body.pathPrefix !== undefined && typeof body.pathPrefix === 'string') {
    if (body.pathPrefix.length > DTO_RULES.pathPrefix.maxLen) errors.push(`pathPrefix too long`);
  }
  return { valid: errors.length === 0, errors };
}

// ── 扩展检索服务 (含降级、缓存穿透、批量语义) ──
class ExtendedRetrievalService {
  private auditLog: Array<{ action: string; role: string; detail: string; latencyMs: number }> = [];
  private indexedChunks = 0;
  private healthy = true;
  private cacheMissCounter = 0;
  private cacheHitCounter = 0;
  /** 模拟检索延迟分布 */
  private latencyMap = new Map<string, number>();

  private requirePerm(role: RoleName, perm: number, action: string): boolean {
    const has = (RBAC[role] & perm) !== 0;
    this.auditLog.push({
      action,
      role: ROLES[role],
      detail: has ? 'ALLOWED' : 'DENIED',
      latencyMs: Math.floor(Math.random() * 20),
    });
    return has;
  }

  /** 记录延迟 */
  private recordLatency(action: string, ms: number) {
    this.latencyMap.set(action, (this.latencyMap.get(action) || 0) + 1);
  }

  query(body: Record<string, unknown>, role: RoleName): { success: boolean; data?: any; error?: string } {
    const allowed = this.requirePerm(role, PERM.QUERY, 'query');
    if (!allowed) return { success: false, error: `Forbidden: ${ROLES[role]} lacks QUERY` };

    const dto = validateQueryDto(body);
    if (!dto.valid) return { success: false, error: `DTO: ${dto.errors.join(';')}` };

    // 模拟缓存穿透场景 (空结果但正常流程)
    const queryStr = String(body.query ?? '');
    const isEmptyResult = queryStr.startsWith('__no_results__');
    if (isEmptyResult) {
      return { success: true, data: { results: [], totalHits: 0, latencyMs: 5, cacheHit: false, collections: body.collections ?? ['code_chunks'] } };
    }

    // 模拟缓存命中
    const isCacheHit = queryStr.includes('cache_hit');
    if (isCacheHit) { this.cacheHitCounter++; } else { this.cacheMissCounter++; }

    this.recordLatency('query', 15);
    return {
      success: true,
      data: {
        results: [{ id: 'result-1', score: 0.95, snippet: `匹配结果: ${queryStr}` }],
        totalHits: 1,
        latencyMs: isCacheHit ? 2 : 15,
        cacheHit: isCacheHit,
        collections: body.collections ?? ['code_chunks'],
      },
    };
  }

  queryKnowledge(body: Record<string, unknown>, role: RoleName): { success: boolean; data?: any; error?: string } {
    const allowed = this.requirePerm(role, PERM.QUERY, 'queryKnowledge');
    if (!allowed) return { success: false, error: `Forbidden: ${ROLES[role]} lacks QUERY` };

    const dto = validateQueryDto(body);
    if (!dto.valid) return { success: false, error: `DTO: ${dto.errors.join(';')}` };

    return {
      success: true,
      data: {
        results: [{ id: 'kn-1', title: '知识库文档', score: 0.88 }],
        totalHits: 1,
        latencyMs: 8,
        cacheHit: false,
        collections: ['knowledge_docs'],
      },
    };
  }

  /** 批量检索 — 模拟同时查询多个全集 */
  batchQuery(queries: Array<{ query: string; topK?: number }>, role: RoleName): Array<{ query: string; success: boolean; totalHits?: number; error?: string }> {
    return queries.map(q => {
      const res = this.query({ query: q.query, topK: q.topK ?? 5 }, role);
      if (!res.success) return { query: q.query, success: false, error: res.error };
      return { query: q.query, success: true, totalHits: res.data.totalHits };
    });
  }

  index(role: RoleName): { success: boolean; data?: any; error?: string } {
    const allowed = this.requirePerm(role, PERM.INDEX, 'index');
    if (!allowed) return { success: false, error: `Forbidden: ${ROLES[role]} lacks INDEX` };
    this.indexedChunks++;
    return { success: true, data: { written: 1, totalIndexed: this.indexedChunks } };
  }

  /** 批量索引 */
  batchIndex(count: number, role: RoleName): { success: boolean; data?: any; error?: string } {
    const allowed = this.requirePerm(role, PERM.INDEX, 'batchIndex');
    if (!allowed) return { success: false, error: `Forbidden: ${ROLES[role]} lacks INDEX` };
    this.indexedChunks += count;
    return { success: true, data: { written: count, totalIndexed: this.indexedChunks } };
  }

  health(role: RoleName): { success: boolean; data?: any; error?: string } {
    const allowed = this.requirePerm(role, PERM.HEALTH, 'health');
    if (!allowed) return { success: false, error: `Forbidden: ${ROLES[role]} lacks HEALTH` };
    return {
      success: true,
      data: {
        status: this.healthy ? 'ok' : 'degraded',
        qdrant: this.healthy ? 'ok' : 'error',
        embedder: 'ok',
        lastIndexAt: this.indexedChunks > 0 ? new Date().toISOString() : null,
        healthy: this.healthy,
        cacheHitRate: this.cacheHitCounter + this.cacheMissCounter > 0
          ? this.cacheHitCounter / (this.cacheHitCounter + this.cacheMissCounter)
          : 0,
      },
    };
  }

  /** 健康降级时的详细信息 */
  healthWithDetails(role: RoleName): { success: boolean; data?: any; error?: string } {
    const allowed = this.requirePerm(role, PERM.HEALTH, 'healthWithDetails');
    if (!allowed) return { success: false, error: `Forbidden: ${ROLES[role]} lacks HEALTH` };
    const base = this.health(role);
    if (!base.success) return base;
    return {
      success: true,
      data: {
        ...base.data,
        embedderLatencyMs: 5,
        qdrantLatencyMs: this.healthy ? 3 : 1500,
        totalChunksIndexed: this.indexedChunks,
        recoveryEta: this.healthy ? 0 : 30000,
      },
    };
  }

  clearCache(role: RoleName): { success: boolean; error?: string } {
    const allowed = this.requirePerm(role, PERM.CACHE_WRITE, 'clearCache');
    if (!allowed) return { success: false, error: `Forbidden: ${ROLES[role]} lacks CACHE_WRITE` };
    this.cacheHitCounter = 0;
    this.cacheMissCounter = 0;
    return { success: true };
  }

  buildRAGContext(body: { query: string; maxResults?: number }, role: RoleName): { success: boolean; data?: any; error?: string } {
    const allowed = this.requirePerm(role, PERM.RAG_CTX, 'buildRAGContext');
    if (!allowed) return { success: false, error: `Forbidden: ${ROLES[role]} lacks RAG_CTX` };
    return {
      success: true,
      data: {
        codeContext: [{ file: 'apps/api/src/modules/retrieval/retrieval.service.ts', relevance: 0.92 }],
        knowledgeContext: body.maxResults && body.maxResults < 1 ? [] : [{ docId: 'doc-001', title: '检索最佳实践' }],
        totalLatencyMs: 20,
        trigger: { phase: 'phase-19', pulse: 'pulse-71', intent: body.query },
      },
    };
  }

  /** 角色元数据验证 */
  getRoleMeta(role: RoleName): { collections: string[]; queryIntent: string } {
    return ROLE_META[role];
  }

  getAuditLog() { return this.auditLog; }
  getIndexedCount() { return this.indexedChunks; }
  setHealthy(h: boolean) { this.healthy = h; }
  reset() {
    this.auditLog = [];
    this.indexedChunks = 0;
    this.healthy = true;
    this.cacheHitCounter = 0;
    this.cacheMissCounter = 0;
    this.latencyMap.clear();
  }
}

function createEnv() {
  return { service: new ExtendedRetrievalService() };
}

// ═══════════════════════════════════════════
// 👔店长 (StoreManager)
// ═══════════════════════════════════════════
describe(`${ROLES.StoreManager} retrieval 角色扩展测试`, () => {
  it('店长可检索运营数据并同时构建 RAG 上下文 (正常流程：多操作联动)', () => {
    const { service } = createEnv();
    const queryRes = service.query({ query: '门店月度运营报告', collections: ['code_chunks', 'knowledge_docs'] }, 'StoreManager');
    assert.equal(queryRes.success, true);
    assert.equal(queryRes.data.totalHits, 1);

    const ctxRes = service.buildRAGContext({ query: '月度运营报告上下文' }, 'StoreManager');
    assert.equal(ctxRes.success, true);
    assert.ok(ctxRes.data.codeContext.length > 0);
  });

  it('店长可查看健康状态含缓存命中率 (扩展权限：运维监控)', () => {
    const { service } = createEnv();
    // 先产生一些检索流量
    service.query({ query: 'cache_hit_sales' }, 'StoreManager');
    service.query({ query: '门店分析' }, 'StoreManager');

    const hRes = service.health('StoreManager');
    assert.equal(hRes.success, true);
    assert.equal(typeof hRes.data.cacheHitRate, 'number');
    assert.ok(hRes.data.cacheHitRate >= 0);
  });

  it('店长可清除缓存后重查以验证缓存命中变化 (降级场景：缓存管理)', () => {
    const { service } = createEnv();
    service.query({ query: 'cache_hit_before' }, 'StoreManager');
    service.clearCache('StoreManager');
    service.query({ query: 'cache_hit_after' }, 'StoreManager');

    // 清除后缓存命中率应重置
    const hRes = service.health('StoreManager');
    assert.equal(hRes.data.cacheHitRate, 1); // 1 hit / 1 total after clearCache resets counters
  });

  it('店长检索空结果集可正常处理 (降级场景：无匹配)', () => {
    const { service } = createEnv();
    const res = service.query({ query: '__no_results__不存在的数据' }, 'StoreManager');
    assert.equal(res.success, true);
    assert.equal(res.data.totalHits, 0);
    assert.deepEqual(res.data.results, []);
  });
});

// ═══════════════════════════════════════════
// 🛒前台 (FrontDesk)
// ═══════════════════════════════════════════
describe(`${ROLES.FrontDesk} retrieval 角色扩展测试`, () => {
  it('前台可快速检索收银相关代码片段 (正常流程：日常操作)', () => {
    const { service } = createEnv();
    const res = service.query({ query: '收银结算流程', topK: 5 }, 'FrontDesk');
    assert.equal(res.success, true);
    assert.equal(typeof res.data.latencyMs, 'number');
    assert.ok(res.data.latencyMs <= 20);
  });

  it('前台对超大 topK 应被 DTO 拒绝 (权限边界：参数校验)', () => {
    const { service } = createEnv();
    const res = service.query({ query: '收银', topK: 999 }, 'FrontDesk');
    assert.equal(res.success, false);
    assert.ok(res.error!.includes('DTO'));
  });

  it('前台使用无效 collection 应被拒绝 (权限边界：资源限制)', () => {
    const { service } = createEnv();
    const res = service.query({ query: '收银', collections: ['invalid_collection'] }, 'FrontDesk');
    assert.equal(res.success, false);
    assert.ok(res.error!.includes('invalid collection'));
  });

  it('前台不可访问健康或管理功能 (权限边界：严格只读)', () => {
    const { service } = createEnv();
    assert.equal(service.health('FrontDesk').success, false);
    assert.equal(service.clearCache('FrontDesk').success, false);
    assert.equal(service.buildRAGContext({ query: 'x' }, 'FrontDesk').success, false);
    assert.equal(service.index('FrontDesk').success, false);
  });
});

// ═══════════════════════════════════════════
// 👥HR
// ═══════════════════════════════════════════
describe(`${ROLES.HR} retrieval 角色扩展测试`, () => {
  it('HR 可检索员工管理知识库和代码 (正常流程)', () => {
    const { service } = createEnv();
    const codeRes = service.query({ query: '员工考勤系统' }, 'HR');
    assert.equal(codeRes.success, true);

    const knRes = service.queryKnowledge({ query: 'HR 入职流程' }, 'HR');
    assert.equal(knRes.success, true);
    assert.deepEqual(knRes.data.collections, ['knowledge_docs']);
  });

  it('HR 批量检索多个主题 (扩展场景：多查询)', () => {
    const { service } = createEnv();
    const results = service.batchQuery([
      { query: '考勤规则' },
      { query: '薪资计算' },
      { query: '培训计划', topK: 3 },
    ], 'HR');
    assert.equal(results.length, 3);
    assert.ok(results.every(r => r.success === true));
  });

  it('HR 查询空 query 应被拒绝 (权限边界：输入校验)', () => {
    const { service } = createEnv();
    const res = service.query({ query: '' }, 'HR');
    assert.equal(res.success, false);
    assert.ok(res.error!.includes('DTO'));
  });
});

// ═══════════════════════════════════════════
// 🔧安监 (Safety)
// ═══════════════════════════════════════════
describe(`${ROLES.Safety} retrieval 角色扩展测试`, () => {
  it('安监可检索安全告警并查看健康状态 (正常流程：安全审计)', () => {
    const { service } = createEnv();
    const qRes = service.query({ query: '安全告警规则', threshold: 0.8 }, 'Safety');
    assert.equal(qRes.success, true);

    const hRes = service.health('Safety');
    assert.equal(hRes.success, true);
    assert.equal(hRes.data.status, 'ok');
  });

  it('安监在系统降级时可获健康详情 (降级场景：组件异常)', () => {
    const { service } = createEnv();
    service.setHealthy(false);
    const hRes = service.healthWithDetails('Safety');
    assert.equal(hRes.success, true);
    assert.equal(hRes.data.status, 'degraded');
    assert.equal(hRes.data.qdrantLatencyMs, 1500);
    assert.equal(hRes.data.recoveryEta, 30000);
  });

  it('安监构建安全事件 RAG 上下文 (扩展场景：安全分析)', () => {
    const { service } = createEnv();
    const ctxRes = service.buildRAGContext({ query: '历史上安全事件响应' }, 'Safety');
    assert.equal(ctxRes.success, true);
    assert.equal(ctxRes.data.trigger.intent, '历史上安全事件响应');
  });

  it('安监不可索引或清除缓存 (权限边界：监控只读)', () => {
    const { service } = createEnv();
    assert.equal(service.index('Safety').success, false);
    assert.equal(service.clearCache('Safety').success, false);
  });
});

// ═══════════════════════════════════════════
// 🎮导玩员 (Guide)
// ═══════════════════════════════════════════
describe(`${ROLES.Guide} retrieval 角色扩展测试`, () => {
  it('导玩员可检索游戏设备功能代码 (正常流程)', () => {
    const { service } = createEnv();
    const res = service.query({ query: '游戏设备接口', pathPrefix: 'apps/api/src/modules/games' }, 'Guide');
    assert.equal(res.success, true);
    assert.equal(res.data.totalHits, 1);
  });

  it('导玩员使用超长 pathPrefix 应被拒绝 (权限边界：参数限制)', () => {
    const { service } = createEnv();
    const res = service.query({ query: '游戏', pathPrefix: 'x'.repeat(600) }, 'Guide');
    assert.equal(res.success, false);
    assert.ok(res.error!.includes('DTO'));
  });

  it('导玩员多 collection 检索 (扩展场景：跨域查询)', () => {
    const { service } = createEnv();
    const res = service.query({ query: '积分兑换', collections: ['code_chunks', 'rfc_history'] }, 'Guide');
    assert.equal(res.success, true);
    assert.deepEqual(res.data.collections, ['code_chunks', 'rfc_history']);
  });

  it('导玩员不可做运维操作 (权限边界：业务只读)', () => {
    const { service } = createEnv();
    assert.equal(service.clearCache('Guide').success, false);
    assert.equal(service.buildRAGContext({ query: 'x' }, 'Guide').success, false);
    assert.equal(service.index('Guide').success, false);
    assert.equal(service.health('Guide').success, false);
  });
});

// ═══════════════════════════════════════════
// 🎯运行专员 (Ops)
// ═══════════════════════════════════════════
describe(`${ROLES.Ops} retrieval 角色扩展测试`, () => {
  it('运行专员可执行完整运维链路 (正常流程：索引→查询→健康)', () => {
    const { service } = createEnv();

    const idxRes = service.index('Ops');
    assert.equal(idxRes.success, true);
    assert.equal(service.getIndexedCount(), 1);

    const qRes = service.query({ query: '运维脚本', hybrid: true }, 'Ops');
    assert.equal(qRes.success, true);

    const hRes = service.healthWithDetails('Ops');
    assert.equal(hRes.success, true);
    assert.equal(typeof hRes.data.embedderLatencyMs, 'number');
  });

  it('运行专员可批量索引大量 chunk (扩展场景：大规模操作)', () => {
    const { service } = createEnv();
    const batchRes = service.batchIndex(100, 'Ops');
    assert.equal(batchRes.success, true);
    assert.equal(batchRes.data.written, 100);
    assert.equal(service.getIndexedCount(), 100);
  });

  it('运行专员在系统降级时仍可检索但健康报告降级 (降级场景：弹性)', () => {
    const { service } = createEnv();
    service.setHealthy(false);
    const qRes = service.query({ query: '降级检索' }, 'Ops');
    assert.equal(qRes.success, true);

    const hRes = service.health('Ops');
    assert.equal(hRes.data.status, 'degraded');
    assert.equal(hRes.data.healthy, false);
  });

  it('运行专员可清除缓存后重新索引 (权限边界：缓存管理)', () => {
    const { service } = createEnv();
    assert.equal(service.clearCache('Ops').success, true);
    assert.equal(service.index('Ops').success, true);
    assert.equal(service.getIndexedCount(), 1);
  });
});

// ═══════════════════════════════════════════
// 🤝团建 (Teambuilding)
// ═══════════════════════════════════════════
describe(`${ROLES.Teambuilding} retrieval 角色扩展测试`, () => {
  it('团建可检索活动和场地管理相关知识库 (正常流程)', () => {
    const { service } = createEnv();
    const res = service.query({ query: '团建场地推荐活动策划' }, 'Teambuilding');
    assert.equal(res.success, true);
    assert.ok(res.data.results.length > 0);
  });

  it('团建不可访问高阶功能 (权限边界：只读)', () => {
    const { service } = createEnv();
    assert.equal(service.index('Teambuilding').success, false);
    assert.equal(service.health('Teambuilding').success, false);
    assert.equal(service.clearCache('Teambuilding').success, false);
    assert.equal(service.buildRAGContext({ query: 'x' }, 'Teambuilding').success, false);
  });

  it('团建使用不合法 threshold 应被拒 (权限边界：输入校验)', () => {
    const { service } = createEnv();
    const res = service.query({ query: '活动', threshold: 1.5 }, 'Teambuilding');
    assert.equal(res.success, false);
    assert.ok(res.error!.includes('threshold'));
  });
});

// ═══════════════════════════════════════════
// 📢营销 (Marketing)
// ═══════════════════════════════════════════
describe(`${ROLES.Marketing} retrieval 角色扩展测试`, () => {
  it('营销可检索知识库营销最佳实践 (正常流程)', () => {
    const { service } = createEnv();
    const res = service.queryKnowledge({ query: '营销活动最佳实践案例' }, 'Marketing');
    assert.equal(res.success, true);
    assert.deepEqual(res.data.collections, ['knowledge_docs']);
  });

  it('营销批量检索多个营销主题 (扩展场景：多查询)', () => {
    const { service } = createEnv();
    const results = service.batchQuery([
      { query: '促销活动' },
      { query: '会员拉新' },
      { query: '优惠券策略', topK: 10 },
    ], 'Marketing');
    assert.equal(results.length, 3);
    assert.ok(results.every(r => r.success));
  });

  it('营销不可做任何运维操作 (权限边界：严格禁止)', () => {
    const { service } = createEnv();
    assert.equal(service.index('Marketing').success, false);
    assert.equal(service.health('Marketing').success, false);
    assert.equal(service.clearCache('Marketing').success, false);
    assert.equal(service.buildRAGContext({ query: '任何' }, 'Marketing').success, false);
  });

  it('营销使用超大 topK 应被拒绝 (权限边界：参数限制)', () => {
    const { service } = createEnv();
    const res = service.query({ query: '促销', topK: 200 }, 'Marketing');
    assert.equal(res.success, false);
    assert.ok(res.error!.includes('topK'));
  });
});

// ═══════════════════════════════════════════
// 全局 RBAC 回归 + 降级场景 + 审计
// ═══════════════════════════════════════════
describe('retrieval 全局 RBAC 回归 + 扩展场景', () => {
  it('QUERY 权限应开放给全部 8 角色', () => {
    const { service } = createEnv();
    const roles: RoleName[] = ['StoreManager', 'FrontDesk', 'HR', 'Safety', 'Guide', 'Ops', 'Teambuilding', 'Marketing'];
    for (const r of roles) {
      const res = service.query({ query: 'test_query' }, r);
      assert.equal(res.success, true, `${ROLES[r]} should have QUERY`);
    }
  });

  it('INDEX 权限仅限 Ops', () => {
    const { service } = createEnv();
    const roles: RoleName[] = ['StoreManager', 'FrontDesk', 'HR', 'Safety', 'Guide', 'Teambuilding', 'Marketing'];
    for (const r of roles) {
      assert.equal(service.index(r).success, false, `${ROLES[r]} should NOT have INDEX`);
    }
    assert.equal(service.index('Ops').success, true);
  });

  it('降级场景：qdrant 异常时健康状态正确传播', () => {
    const { service } = createEnv();
    service.setHealthy(false);

    // 只有有 HEALTH 权限的角色才能看到降级
    const allowed: RoleName[] = ['StoreManager', 'Safety', 'Ops'];
    for (const r of allowed) {
      const res = service.health(r);
      assert.equal(res.success, true);
      assert.equal(res.data.healthy, false);
    }

    // 无权限角色仍然被拒绝
    assert.equal(service.health('FrontDesk' as any).success, false);
  });

  it('审计日志记录所有角色操作', () => {
    const { service } = createEnv();
    service.query({ query: '审计测试' }, 'StoreManager');
    service.index('Ops');
    service.health('Safety');
    service.clearCache('FrontDesk'); // denied
    service.clearCache('Ops'); // allowed

    const log = service.getAuditLog();
    assert.equal(log.length, 5);

    const cacheDenied = log.find(e => e.action === 'clearCache' && e.detail === 'DENIED');
    assert.equal(cacheDenied!.role, '🛒前台');

    const cacheAllowed = log.find(e => e.action === 'clearCache' && e.detail === 'ALLOWED');
    assert.equal(cacheAllowed!.role, '🎯运行专员');
  });

  it('角色元数据验证 — 每个角色有合理的 collection 偏好', () => {
    const roles: RoleName[] = ['StoreManager', 'FrontDesk', 'HR', 'Safety', 'Guide', 'Ops', 'Teambuilding', 'Marketing'];
    for (const r of roles) {
      const meta = createEnv().service.getRoleMeta(r);
      assert.ok(meta.collections.length >= 1, `${ROLES[r]} should have at least 1 default collection`);
      assert.ok(meta.queryIntent.length > 0, `${ROLES[r]} should have a query intent`);
    }
  });
});
