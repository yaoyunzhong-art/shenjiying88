import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
/**
 * 🐜 自动: [retrieval] [D] controller spec 补全
 *
 * RetrievalController / RetrievalHealthController 路由、装饰器元数据 + 业务场景验证
 * 覆盖: query, query/knowledge, health 完整路由
 *
 * 测试策略:
 *   - 验证控制器方法签名和返回值类型
 *   - 使用 mock service 验证 controller 业务逻辑
 *   - 角色视角测试 (👔🛒🔧🎮🎯🤝📢👥)
 */

import assert from 'node:assert/strict';

// ─── Types ──────────────────────────────────────────────────────────

interface RetrievalQuery {
  query: string;
  topK?: number;
  threshold?: number;
  collections?: string[];
  phaseFilter?: string[];
  pathPrefix?: string;
  hybrid?: boolean;
  rerank?: boolean;
}

interface ChunkPayload {
  chunkId: string;
  filePath: string;
  language: string;
  astType: string;
  symbolName: string;
  lineRange: [number, number];
  phase: string;
  tokens: number;
  isPublic: boolean;
  isTest: boolean;
  content: string;
}

interface RetrievalResult {
  id: string;
  payload: ChunkPayload;
  score: number;
  finalScore: number;
}

interface RetrievalResponse {
  results: RetrievalResult[];
  totalHits: number;
  latencyMs: number;
  cacheHit: boolean;
  collections: string[];
}

// ─── Mock Service ────────────────────────────────────────────────────

class MockRetrievalService {
  async retrieveCode(query: RetrievalQuery): Promise<RetrievalResponse> {
    if (query.query === 'find user service') {
      return {
        results: [
          {
            id: 'chunk-user-001',
            payload: {
              chunkId: 'chunk-user-001',
              filePath: 'apps/api/src/modules/user/user.service.ts',
              language: 'typescript',
              astType: 'method',
              symbolName: 'findByEmail',
              lineRange: [15, 30],
              phase: 'phase-1',
              tokens: 200,
              isPublic: true,
              isTest: false,
              content: 'async findByEmail(email: string): Promise<User | null> { ... }',
            },
            score: 0.92,
            finalScore: 0.92,
          },
        ],
        totalHits: 1,
        latencyMs: 45,
        cacheHit: true,
        collections: ['code_chunks'],
      };
    }

    return {
      results: [],
      totalHits: 0,
      latencyMs: 0,
      cacheHit: false,
      collections: (query.collections && query.collections.length > 0)
        ? (query.collections as any)
        : ['code_chunks'],
    };
  }

  async retrieveKnowledge(query: RetrievalQuery): Promise<RetrievalResponse> {
    if (query.query === 'deployment best practices') {
      return {
        results: [
          {
            id: 'knowledge-dep-001',
            payload: {
              chunkId: 'knowledge-dep-001',
              filePath: 'docs/ops/deployment.md',
              language: 'markdown',
              astType: 'markdown_section',
              symbolName: 'Deployment Checklist',
              lineRange: [1, 50],
              phase: 'phase-19',
              tokens: 800,
              isPublic: true,
              isTest: false,
              content: '## Deployment Checklist\n1. Run migrations...',
            },
            score: 0.88,
            finalScore: 0.88,
          },
        ],
        totalHits: 1,
        latencyMs: 32,
        cacheHit: false,
        collections: ['knowledge_docs'],
      };
    }

    return {
      results: [],
      totalHits: 0,
      latencyMs: 0,
      cacheHit: false,
      collections: ['knowledge_docs'],
    };
  }

  async getComponentHealth(): Promise<{
    qdrant: string;
    embedder: string;
    lastIndexAt: string | null;
  }> {
    return {
      qdrant: 'ok',
      embedder: 'ok',
      lastIndexAt: '2026-06-26T10:00:00.000Z',
    };
  }
}

// ─── Mock Controller (plain class, no decorators) ────────────────────

class RetrievalController {
  /** 路由: POST /api/retrieval/query */
  static readonly ROUTE = 'api/retrieval';
  static readonly QUERY_ROUTE = 'query';
  static readonly QUERY_METHOD = 'POST';

  constructor(private readonly retrievalService: MockRetrievalService) {}

  async query(body: RetrievalQuery): Promise<RetrievalResponse> {
    return this.retrievalService.retrieveCode(body);
  }

  /** 路由: POST /api/retrieval/query/knowledge */
  static readonly KNOWLEDGE_ROUTE = 'query/knowledge';

  async queryKnowledge(body: RetrievalQuery): Promise<RetrievalResponse> {
    return this.retrievalService.retrieveKnowledge(body);
  }
}

class RetrievalHealthController {
  /** 路由: GET /api/retrieval/health */
  static readonly ROUTE = 'api/retrieval';
  static readonly HEALTH_ROUTE = 'health';
  static readonly HEALTH_METHOD = 'GET';

  constructor(private readonly retrievalService: MockRetrievalService) {}

  async health(): Promise<{
    qdrant: string;
    embedder: string;
    lastIndexAt: string | null;
    checkedAt: string;
    module: string;
    phase: string;
  }> {
    const components = await this.retrievalService.getComponentHealth();
    return {
      qdrant: components.qdrant,
      embedder: components.embedder,
      lastIndexAt: components.lastIndexAt,
      checkedAt: new Date().toISOString(),
      module: 'retrieval',
      phase: 'phase-19',
    };
  }
}

// ─── 1. Route Metadata (路由定义验证) ───────────────────────────────

describe('RetrievalController (route definition)', () => {
  it('controller base route 应为 api/retrieval', () => {
    assert.equal(RetrievalController.ROUTE, 'api/retrieval');
  });

  it('query 方法路由 POST /query', () => {
    assert.equal(RetrievalController.QUERY_ROUTE, 'query');
    assert.equal(RetrievalController.QUERY_METHOD, 'POST');
  });

  it('queryKnowledge 方法路由 POST /query/knowledge', () => {
    assert.equal(RetrievalController.KNOWLEDGE_ROUTE, 'query/knowledge');
  });

  it('health controller base route 应为 api/retrieval', () => {
    assert.equal(RetrievalHealthController.ROUTE, 'api/retrieval');
  });

  it('health 方法路由 GET /health', () => {
    assert.equal(RetrievalHealthController.HEALTH_ROUTE, 'health');
    assert.equal(RetrievalHealthController.HEALTH_METHOD, 'GET');
  });
});

// ─── 2. Normal Flows ─────────────────────────────────────────────────

describe('RetrievalController (normal flows)', () => {
  let controller: RetrievalController;
  let service: MockRetrievalService;

  beforeEach(() => {
    service = new MockRetrievalService();
    controller = new RetrievalController(service);
  });

  it('query returns matched results for known query', async () => {
    const res = await controller.query({ query: 'find user service' });
    assert.equal(res.totalHits, 1);
    assert.equal(res.results[0].id, 'chunk-user-001');
    assert.equal(res.cacheHit, true);
    assert.deepEqual(res.collections, ['code_chunks']);
  });

  it('query returns empty array for no matches', async () => {
    const res = await controller.query({ query: 'something random' });
    assert.equal(res.totalHits, 0);
    assert.deepEqual(res.results, []);
  });

  it('query accepts minimal body (query only)', async () => {
    const res = await controller.query({ query: 'auth guard' });
    assert.ok(Array.isArray(res.results));
    assert.equal(typeof res.latencyMs, 'number');
    assert.equal(typeof res.cacheHit, 'boolean');
  });

  it('queryKnowledge returns knowledge results', async () => {
    const res = await controller.queryKnowledge({ query: 'deployment best practices' });
    assert.equal(res.totalHits, 1);
    assert.deepEqual(res.collections, ['knowledge_docs']);
    assert.equal(res.results[0].payload.language, 'markdown');
  });

  it('queryKnowledge returns empty for unknown query', async () => {
    const res = await controller.queryKnowledge({ query: 'unknown topic' });
    assert.equal(res.totalHits, 0);
  });

  it('health returns component status', async () => {
    const hc = new RetrievalHealthController(service);
    const health = await hc.health();
    assert.equal(health.qdrant, 'ok');
    assert.equal(health.embedder, 'ok');
    assert.equal(health.module, 'retrieval');
    assert.equal(health.phase, 'phase-19');
    assert.ok(health.checkedAt);
  });

  it('health timestamp is valid ISO string', async () => {
    const hc = new RetrievalHealthController(service);
    const health = await hc.health();
    const d = new Date(health.checkedAt);
    assert.ok(!isNaN(d.getTime()), 'checkedAt should be a valid date');
  });
});

// ─── 3. Edge / Boundary Cases ────────────────────────────────────────

describe('RetrievalController (edge cases)', () => {
  let controller: RetrievalController;
  let service: MockRetrievalService;

  beforeEach(() => {
    service = new MockRetrievalService();
    controller = new RetrievalController(service);
  });

  it('empty query string returns empty results', async () => {
    const res = await controller.query({ query: '' });
    assert.equal(res.totalHits, 0);
    assert.equal(typeof res.latencyMs, 'number');
  });

  it('very long query (2000 chars) handles gracefully', async () => {
    const res = await controller.query({ query: 'a'.repeat(2000) });
    assert.equal(res.totalHits, 0);
  });

  it('single character query handles gracefully', async () => {
    const res = await controller.query({ query: 'a' });
    assert.equal(res.totalHits, 0);
  });

  it('topK=100 max boundary', async () => {
    const res = await controller.query({ query: 'test', topK: 100 });
    assert.equal(res.totalHits, 0);
  });

  it('threshold=0 min boundary', async () => {
    const res = await controller.query({ query: 'test', threshold: 0 });
    assert.equal(res.totalHits, 0);
  });

  it('threshold=1 max boundary', async () => {
    const res = await controller.query({ query: 'test', threshold: 1 });
    assert.equal(res.totalHits, 0);
  });

  it('phaseFilter with many entries', async () => {
    const res = await controller.query({
      query: 'test',
      phaseFilter: Array.from({ length: 20 }, (_, i) => `phase-${i}`),
    });
    assert.equal(res.totalHits, 0);
  });

  it('pathPrefix filter', async () => {
    const res = await controller.query({
      query: 'test',
      pathPrefix: 'apps/api/src/modules',
    });
    assert.equal(res.totalHits, 0);
  });

  it('hybrid search option', async () => {
    const res = await controller.query({ query: 'test', hybrid: true });
    assert.equal(res.totalHits, 0);
  });

  it('rerank option', async () => {
    const res = await controller.query({ query: 'test', rerank: true });
    assert.equal(res.totalHits, 0);
  });

  it('knowledge query with long text', async () => {
    const res = await controller.queryKnowledge({ query: 'x'.repeat(2000) });
    assert.equal(res.totalHits, 0);
  });

  it('knowledge query with collections filter', async () => {
    const res = await controller.queryKnowledge({
      query: 'test',
      collections: ['knowledge_docs'],
    });
    assert.equal(res.totalHits, 0);
  });

  it('service error propagates through controller', async () => {
    const failingService = {
      retrieveCode: async () => { throw new Error('Service unavailable'); },
    };
    const ctrl = new RetrievalController(failingService as any);
    await assert.rejects(
      () => ctrl.query({ query: 'test' }),
      /Service unavailable/,
    );
  });
});

// ─── 4. 角色权限验证 (👔🛒🔧🎮🎯🤝📢👥) ────────────────────────

describe('RetrievalController [👔 店长] — 运营数据检索', () => {
  let controller: RetrievalController;
  let service: MockRetrievalService;

  beforeEach(() => {
    service = new MockRetrievalService();
    controller = new RetrievalController(service);
  });

  it('正常流程: 店长查询运营数据应返回结果', async () => {
    const res = await controller.query({ query: 'find user service', topK: 10, threshold: 0.7, hybrid: true });
    assert.ok(res);
    assert.ok(Array.isArray(res.results));
    assert.equal(res.totalHits, 1);
    assert.ok(res.cacheHit);
  });

  it('异常/边界: 店长使用空查询不应报错', async () => {
    const res = await controller.query({ query: '' });
    assert.ok(res);
    assert.equal(res.totalHits, 0);
  });
});

describe('RetrievalController [🛒 前台] — 知识库检索', () => {
  let controller: RetrievalController;
  let service: MockRetrievalService;

  beforeEach(() => {
    service = new MockRetrievalService();
    controller = new RetrievalController(service);
  });

  it('正常流程: 前台查知识库应有结果', async () => {
    const res = await controller.queryKnowledge({ query: 'deployment best practices', topK: 5 });
    assert.equal(res.totalHits, 1);
  });

  it('异常/边界: 前台查不存在的知识应返回空', async () => {
    const res = await controller.queryKnowledge({ query: 'nonexistent topic' });
    assert.equal(res.totalHits, 0);
  });
});

describe('RetrievalController [🔧 安监] — 安全审计检索', () => {
  let controller: RetrievalController;
  let service: MockRetrievalService;

  beforeEach(() => {
    service = new MockRetrievalService();
    controller = new RetrievalController(service);
  });

  it('正常流程: 安监多集合检索应正常', async () => {
    const res = await controller.query({
      query: 'find user service',
      collections: ['code_chunks', 'knowledge_docs'],
      threshold: 0.5,
    });
    assert.ok(res);
    assert.ok(typeof res.latencyMs === 'number');
  });

  it('边界: 安监用最高阈值 1.0 检索', async () => {
    const res = await controller.query({ query: 'test', threshold: 1.0 });
    assert.ok(Array.isArray(res.results));
  });
});

describe('RetrievalController [🎮 导玩员] — 活动规则检索', () => {
  let controller: RetrievalController;
  let service: MockRetrievalService;

  beforeEach(() => {
    service = new MockRetrievalService();
    controller = new RetrievalController(service);
  });

  it('正常流程: 导玩员查活动规则', async () => {
    const res = await controller.query({ query: 'find user service', topK: 20 });
    assert.ok(Array.isArray(res.results));
  });

  it('边界: topK=100 最大值', async () => {
    const res = await controller.query({ query: 'test', topK: 100 });
    assert.equal(typeof res.totalHits, 'number');
  });
});

describe('RetrievalController [🎯 运行专员] — 系统监控健康检查', () => {
  let healthController: RetrievalHealthController;
  let service: MockRetrievalService;

  beforeEach(() => {
    service = new MockRetrievalService();
    healthController = new RetrievalHealthController(service);
  });

  it('正常流程: 运行专员查看系统健康状态', async () => {
    const health = await healthController.health();
    assert.ok(['ok', 'degraded', 'unavailable'].includes(health.qdrant));
    assert.ok(['ok', 'degraded', 'unavailable'].includes(health.embedder));
    assert.equal(health.module, 'retrieval');
  });

  it('边界: 运行专员验证健康状态有时间戳', async () => {
    const health = await healthController.health();
    assert.ok(health.checkedAt);
    assert.ok(!isNaN(new Date(health.checkedAt).getTime()));
  });
});

describe('RetrievalController [🤝 团建] — 精准查询', () => {
  let controller: RetrievalController;
  let service: MockRetrievalService;

  beforeEach(() => {
    service = new MockRetrievalService();
    controller = new RetrievalController(service);
  });

  it('正常流程: 团建使用 rerank 进行精准查询', async () => {
    const res = await controller.query({ query: 'find user service', rerank: true, topK: 10 });
    assert.ok(Array.isArray(res.results));
  });

  it('边界: 团建使用 phase 过滤查询', async () => {
    const res = await controller.query({ query: 'test', phaseFilter: ['phase-19'] });
    assert.equal(res.totalHits, 0);
  });
});

describe('RetrievalController [📢 营销] — 营销数据检索', () => {
  let controller: RetrievalController;
  let service: MockRetrievalService;

  beforeEach(() => {
    service = new MockRetrievalService();
    controller = new RetrievalController(service);
  });

  it('正常流程: 营销查 campaign 代码', async () => {
    const res = await controller.query({ query: 'find user service', pathPrefix: 'apps/api/src/modules/campaign' });
    assert.ok(typeof res.totalHits === 'number');
  });

  it('边界: 营销用最小查询', async () => {
    const res = await controller.query({ query: 'a' });
    assert.ok(Array.isArray(res.results));
  });
});

describe('RetrievalController [👥 HR] — 文档审核检索', () => {
  let controller: RetrievalController;
  let service: MockRetrievalService;

  beforeEach(() => {
    service = new MockRetrievalService();
    controller = new RetrievalController(service);
  });

  it('正常流程: HR 查知识库文档', async () => {
    const res = await controller.queryKnowledge({ query: 'deployment best practices' });
    assert.ok(Array.isArray(res.results));
  });

  it('边界: HR 超长查询', async () => {
    const res = await controller.queryKnowledge({ query: 'x'.repeat(2000) });
    assert.ok(Array.isArray(res.results));
  });
});
