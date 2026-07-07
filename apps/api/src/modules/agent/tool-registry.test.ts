import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
/**
 * tool-registry.test.ts - Phase-23 T86
 * 工具注册中心单元测试
 */
import assert from 'node:assert/strict';
import { ToolRegistry, BUILTIN_TOOLS } from './tool-registry';

describe('ToolRegistry · 基本', () => {
  let registry: ToolRegistry;
  beforeEach(() => {
    registry = new ToolRegistry();
  });

  it('AC-1 内置工具已注册', () => {
    assert.equal(registry.size(), BUILTIN_TOOLS.length);
    assert.equal(registry.size(), 4);
  });

  it('AC-2 list() 返回所有 tool definition', () => {
    const tools = registry.list();
    assert.equal(tools.length, 4);
    for (const t of tools) {
      assert.ok(t.name);
      assert.ok(t.description);
      assert.equal(t.inputSchema.type, 'object');
    }
  });

  it('AC-3 get() 返回指定 tool', () => {
    const calc = registry.get('calculator');
    assert.ok(calc);
    assert.equal(calc?.name, 'calculator');
  });

  it('AC-4 get() 不存在返回 undefined', () => {
    assert.equal(registry.get('nonexistent'), undefined);
  });
});

describe('ToolRegistry · 注册/注销', () => {
  let registry: ToolRegistry;
  beforeEach(() => {
    registry = new ToolRegistry();
  });

  it('AC-5 register 自定义工具', () => {
    registry.register(
      {
        name: 'custom_tool',
        description: 'My custom tool',
        inputSchema: { type: 'object', properties: { foo: { type: 'string' } } },
      },
      async (input) => `result: ${JSON.stringify(input)}`,
    );
    assert.equal(registry.get('custom_tool')?.name, 'custom_tool');
  });

  it('AC-6 重复注册抛错', () => {
    assert.throws(
      () => registry.register(
        { name: 'calculator', description: 'Dup', inputSchema: { type: 'object', properties: {} } },
        async () => null,
      ),
      /already registered/,
    );
  });

  it('AC-7 unregister 删除工具', () => {
    assert.equal(registry.unregister('calculator'), true);
    assert.equal(registry.get('calculator'), undefined);
    assert.equal(registry.unregister('calculator'), false, 'second unregister 返回 false');
  });
});

describe('ToolRegistry · 执行', () => {
  let registry: ToolRegistry;
  beforeEach(() => {
    registry = new ToolRegistry();
  });

  it('AC-8 calculator 执行正确', async () => {
    const result = await registry.execute('calculator', { expression: '2+3*4' });
    assert.equal(result, 14);
  });

  it('AC-9 calculator 拒绝非法表达式', async () => {
    await assert.rejects(
      () => registry.execute('calculator', { expression: 'alert(1)' }),
      /Invalid expression/,
    );
  });

  it('AC-10 web_search 返回结果', async () => {
    const result = await registry.execute('web_search', { query: 'nodejs' }) as { results: unknown[] };
    assert.ok(Array.isArray(result.results));
    assert.ok(result.results.length > 0);
  });

  it('AC-11 knowledge_search 返回 docs', async () => {
    const result = await registry.execute('knowledge_search', { query: 'foo' }) as { docs: unknown[] };
    assert.ok(Array.isArray(result.docs));
  });

  it('AC-12 database_query 只允许 SELECT', async () => {
    await assert.rejects(
      () => registry.execute('database_query', { sql: 'DROP TABLE users' }),
      /Only SELECT/,
    );
  });

  it('AC-13 执行不存在 tool 抛错', async () => {
    await assert.rejects(
      () => registry.execute('nonexistent', {}),
      /not found/,
    );
  });

  it('AC-14 执行超时保护', async () => {
    let pendingResolve: (() => void) | undefined;
    registry.register(
      { name: 'slow_tool', description: 'Slow', inputSchema: { type: 'object', properties: {} } },
      () => new Promise<void>((r) => { pendingResolve = r; }),
    );
    const promise = registry.execute('slow_tool', {}, { timeoutMs: 50 });
    await assert.rejects(() => promise, /timeout/);
    // 清理 pending promise (避免 Event Loop 阻塞)
    pendingResolve?.();
  });
});

describe('ToolRegistry · 审计', () => {
  it('AC-15 记录调用历史', async () => {
    const registry = new ToolRegistry();
    await registry.execute('calculator', { expression: '1+1' });
    await registry.execute('calculator', { expression: '2+2' }, { callerId: 'user-1' });
    const log = registry.getAuditLog();
    assert.equal(log.length, 2);
    assert.equal(log[0].tool, 'calculator');
    assert.equal(log[0].success, true);
    assert.equal(log[1].callerId, 'user-1');
  });

  it('AC-16 按 callerId 过滤', async () => {
    const registry = new ToolRegistry();
    await registry.execute('calculator', { expression: '1' }, { callerId: 'u1' });
    await registry.execute('calculator', { expression: '2' }, { callerId: 'u2' });
    const u1Log = registry.getAuditLog({ callerId: 'u1' });
    assert.equal(u1Log.length, 1);
    assert.equal(u1Log[0].callerId, 'u1');
  });
});

describe('ToolRegistry · 过滤', () => {
  it('AC-17 按 category 过滤', () => {
    const registry = new ToolRegistry();
    const searchTools = registry.listByCategory('search');
    assert.ok(searchTools.length >= 1);
    assert.ok(searchTools.every((t) => t.category === 'search'));
  });

  it('AC-18 按 riskLevel 过滤', () => {
    const registry = new ToolRegistry();
    const highRisk = registry.listByRiskLevel('high');
    assert.equal(highRisk.length, 1);
    assert.equal(highRisk[0].name, 'database_query');
  });
});
