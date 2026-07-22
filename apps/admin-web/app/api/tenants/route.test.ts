/**
 * api/tenants/route.test.ts — 租户管理 API L1 测试
 *
 * 覆盖: GET / POST / POST_SUSPEND / POST_REACTIVATE / GET_STATS
 * 策略: 静态源码分析 (因为 'use server' 环境无法直接导入 route handler)
 */
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const SRC = readFileSync(resolve(import.meta.dirname, 'route.ts'), 'utf-8');

describe('tenants — GET 列表', () => {
  it('G1. 应导出 GET 方法', () => {
    assert.ok(SRC.includes('export const GET'), '缺少 GET 导出');
  });

  it('G2. 应使用 createProxyHandler 代理', () => {
    assert.ok(SRC.includes('createProxyHandler'), '缺少代理处理器');
  });

  it('G3. 应构造 /tenant/lifecycle/active URL', () => {
    assert.ok(SRC.includes('lifecycle/active'), '缺少 lifecycle/active 路径');
  });

  it('G4. 应请求 GET 方法', () => {
    assert.ok(SRC.includes("'GET'"), '缺少 GET 请求方法');
  });

  it('G5. 应透传查询参数：status, plan, page, limit, search', () => {
    const params = ['status', 'plan', 'page', 'limit', 'search'];
    for (const p of params) {
      assert.ok(SRC.includes(`'${p}'`), `缺少查询参数 ${p}`);
    }
  });
});

describe('tenants — POST 初始化', () => {
  it('P1. 应导出 POST 方法', () => {
    assert.ok(SRC.includes('export const POST'), '缺少 POST 导出');
  });

  it('P2. 应使用 createProxyHandler 代理', () => {
    assert.ok(SRC.includes('createProxyHandler'), '缺少代理处理器');
  });

  it('P3. 应请求 POST 方法', () => {
    assert.ok(SRC.includes("'POST'"), '缺少 POST 请求方法');
  });

  it('P4. 应构造 /tenant/lifecycle/init URL', () => {
    assert.ok(SRC.includes('lifecycle/init'), '缺少 lifecycle/init 路径');
  });
});

describe('tenants — POST_SUSPEND 暂停', () => {
  it('S1. 应导出 POST_SUSPEND 函数', () => {
    assert.ok(SRC.includes('export async function POST_SUSPEND'), '缺少 POST_SUSPEND');
  });

  it('S2. 应解析请求体中的 tenantId, reason, actorId, note', () => {
    assert.ok(SRC.includes('tenantId'), '缺少 tenantId');
    assert.ok(SRC.includes('reason'), '缺少 reason');
    assert.ok(SRC.includes('actorId'), '缺少 actorId');
    assert.ok(SRC.includes('note'), '缺少 note');
  });

  it('S3. 应调用生命周期暂停 API', () => {
    assert.ok(SRC.includes('/lifecycle/suspend'), '缺少 suspend 路径');
  });

  it('S4. 应使用 POST 方法调用上游', () => {
    assert.ok(SRC.includes("method: 'POST'"), '缺少 POST method');
  });

  it('S5. 应发送 JSON 内容类型头', () => {
    assert.ok(SRC.includes('content-type'), '缺少 content-type');
    assert.ok(SRC.includes('application/json'), '缺少 application/json');
  });

  it('S6. 应处理 fetch 失败返回 502', () => {
    assert.ok(SRC.includes('502'), '应返回 502');
    assert.ok(SRC.includes('catch'), '应包含 try-catch');
  });

  it('S7. 应使用 no-store 缓存策略', () => {
    assert.ok(SRC.includes("'no-store'"), '缺少 no-store 缓存策略');
  });
});

describe('tenants — POST_REACTIVATE 恢复', () => {
  it('R1. 应导出 POST_REACTIVATE 函数', () => {
    assert.ok(SRC.includes('export async function POST_REACTIVATE'), '缺少 POST_REACTIVATE');
  });

  it('R2. 应解析请求体中的 tenantId, actorId, note', () => {
    assert.ok(SRC.includes('tenantId'), '缺少 tenantId');
    assert.ok(SRC.includes('actorId'), '缺少 actorId');
    assert.ok(SRC.includes('note'), '缺少 note');
  });

  it('R3. 应调用生命周期恢复 API', () => {
    assert.ok(SRC.includes('/lifecycle/reactivate'), '缺少 reactivate 路径');
  });

  it('R4. 应使用 POST 方法调用上游', () => {
    assert.ok(SRC.includes("method: 'POST'"), '缺少 POST method');
  });

  it('R5. 应处理 fetch 失败返回 502', () => {
    assert.ok(SRC.includes('502'), '应返回 502');
    assert.ok(SRC.includes('catch'), '应包含 try-catch');
  });

  it('R6. reactivate 请求不应包含 reason 字段', () => {
    // reactivate 使用 tenantId, actorId, note，不含 reason
    const reactivateSection = SRC.substring(
      SRC.indexOf('POST_REACTIVATE'),
      SRC.indexOf('// GET /api/tenants/stats')
    );
    const reasonCount = (reactivateSection.match(/'reason'/g) || []).length +
                        (reactivateSection.match(/"reason"/g) || []).length;
    assert.strictEqual(reasonCount, 0, 'reactivate should not include reason');
  });
});

describe('tenants — GET_STATS 统计', () => {
  it('T1. 应导出 GET_STATS 函数', () => {
    assert.ok(SRC.includes('export async function GET_STATS'), '缺少 GET_STATS');
  });

  it('T2. 应同时查询活跃和暂停的租户', () => {
    assert.ok(SRC.includes('lifecycle/active'), '缺少 active 查询');
    assert.ok(SRC.includes('lifecycle/suspended'), '缺少 suspended 查询');
  });

  it('T3. 应使用 Promise.all 并发查询', () => {
    assert.ok(SRC.includes('Promise.all'), '缺少 Promise.all 并发');
  });

  it('T4. 应计算 total / active / suspended 统计', () => {
    assert.ok(SRC.includes('total:'), '缺少 total 统计');
    assert.ok(SRC.includes('active:'), '缺少 active 统计');
    assert.ok(SRC.includes('suspended:'), '缺少 suspended 统计');
  });

  it('T5. 应安全处理 data 为空的情况（?? 0）', () => {
    assert.ok(SRC.includes('?? 0'), '缺少 ?? 0 处理');
  });

  it('T6. 应处理 fetch 失败返回 502', () => {
    assert.ok(SRC.includes('502'), '应返回 502');
    assert.ok(SRC.includes('catch'), '应包含 try-catch');
  });
});

describe('tenants — 导入 & 防御', () => {
  it('D1. 应从 _proxy/utils 导入 createProxyHandler', () => {
    assert.ok(SRC.includes('createProxyHandler'), '缺少 createProxyHandler 导入');
  });

  it('D2. 应从 _proxy/utils 导入 API_BASE_URL', () => {
    assert.ok(SRC.includes('API_BASE_URL'), '缺少 API_BASE_URL 导入');
  });

  it('D3. 应导入 NextRequest 和 NextResponse', () => {
    assert.ok(SRC.includes('NextRequest'), '缺少 NextRequest');
    assert.ok(SRC.includes('NextResponse'), '缺少 NextResponse');
  });

  it('D4. 应定义 TENANT_API 常量', () => {
    assert.ok(SRC.includes('const TENANT_API'), '缺少 TENANT_API 常量');
  });

  it('D5. TENANT_API 应引用 API_BASE_URL', () => {
    assert.ok(SRC.includes('API_BASE_URL'), 'API_BASE_URL 引用');
    assert.ok(SRC.includes('/tenant'), '应包含 tenant 路径');
  });

  it('D6. 无危险 HTML', () => {
    assert.ok(!SRC.includes('dangerouslySetInnerHTML'));
  });

  it('D7. 无 any 类型', () => {
    assert.ok(!/:\s*any\b/.test(SRC));
  });

  it('D8. 路由文件不应包含页面组件导出', () => {
    assert.ok(!SRC.includes('export default'), 'API 路由不应有 default 导出');
  });
});
