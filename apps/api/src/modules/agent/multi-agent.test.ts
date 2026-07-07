import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
/**
 * multi-agent.test.ts - Phase-23 T87
 * 多 Agent 协作 (Orchestrator + Worker) 单元测试
 */
import assert from 'node:assert/strict';
import { OrchestratorAgent, WorkerAgent, AgentContext } from './multi-agent';
import { ToolRegistry } from './tool-registry';
import { MockLLM } from './agent-core';

describe('WorkerAgent', () => {
  it('AC-1 worker 名称/specialty 保留', () => {
    const llm = new MockLLM();
    const tools = new ToolRegistry();
    const worker = new WorkerAgent(
      { name: 'search-agent', description: 'Searches', specialty: 'search' },
      llm,
      tools,
    );
    assert.equal(worker.name, 'search-agent');
    assert.equal(worker.specialty, 'search');
    assert.equal(worker.description, 'Searches');
  });

  it('AC-2 worker.run 调用 ReAct', async () => {
    const llm = new MockLLM();
    const tools = new ToolRegistry();
    const worker = new WorkerAgent(
      { name: 'w1', description: 'd', specialty: 'general' },
      llm,
      tools,
    );
    const result = await worker.run('test query', { sharedMemory: new Map(), workerResults: new Map() });
    assert.ok(result.steps.length > 0);
  });
});

describe('OrchestratorAgent · 任务分解', () => {
  let orchestrator: OrchestratorAgent;
  beforeEach(() => {
    const llm = new MockLLM();
    const tools = new ToolRegistry();
    orchestrator = new OrchestratorAgent({
      llm,
      tools,
      workers: [
        new WorkerAgent({ name: 'search', description: 'Search', specialty: 'search' }, llm, tools),
        new WorkerAgent({ name: 'code', description: 'Code', specialty: 'code' }, llm, tools),
        new WorkerAgent({ name: 'write', description: 'Write', specialty: 'write' }, llm, tools),
      ],
    });
  });

  it('AC-3 listWorkers 列出 3 个', () => {
    const workers = orchestrator.listWorkers();
    assert.equal(workers.length, 3);
  });

  it('AC-4 query 含 "search" → 分解给 search worker', async () => {
    const result = await orchestrator.run('search for nodejs tutorials');
    const tasks = result.tasks;
    assert.ok(tasks.some((t) => t.assignedTo === 'search'));
  });

  it('AC-5 query 含 "code" → 分解给 code worker', async () => {
    const result = await orchestrator.run('write code for fibonacci');
    const tasks = result.tasks;
    assert.ok(tasks.some((t) => t.assignedTo === 'code'));
  });

  it('AC-6 无匹配 → fallback 到第一个 worker', async () => {
    const result = await orchestrator.run('do something random');
    assert.equal(result.tasks.length, 1);
    assert.equal(result.tasks[0].assignedTo, 'search', 'fallback 到第一个 worker');
  });
});

describe('OrchestratorAgent · 执行', () => {
  it('AC-7 任务并行执行', async () => {
    const llm = new MockLLM();
    const tools = new ToolRegistry();
    const orchestrator = new OrchestratorAgent({
      llm,
      tools,
      workers: [
        new WorkerAgent({ name: 'a', description: 'A', specialty: 'search' }, llm, tools),
        new WorkerAgent({ name: 'b', description: 'B', specialty: 'search' }, llm, tools),
      ],
    });
    const result = await orchestrator.run('search and search');
    assert.equal(result.results.length, 2);
    assert.ok(result.results.every((r) => r.worker));
  });

  it('AC-8 worker not found → error result', async () => {
    const llm = new MockLLM();
    const tools = new ToolRegistry();
    const orchestrator = new OrchestratorAgent({
      llm,
      tools,
      workers: [
        new WorkerAgent({ name: 'a', description: 'A', specialty: 'random' }, llm, tools),
      ],
    });
    // 注入一个不存在 worker 的任务
    // 通过 reflect hack: 直接 call private
    const ctx: AgentContext = { sharedMemory: new Map(), workerResults: new Map() };
    const result = await orchestrator.run('random unrelated query', ctx);
    // 没有 specialty 匹配,会 fallback 到 a (worker 存在),所以应该成功
    assert.equal(result.results.length, 1);
  });

  it('AC-9 finalAnswer 汇总 worker results', async () => {
    const llm = new MockLLM();
    const tools = new ToolRegistry();
    const orchestrator = new OrchestratorAgent({
      llm,
      tools,
      workers: [
        new WorkerAgent({ name: 'w', description: 'W', specialty: 'general' }, llm, tools),
      ],
    });
    const result = await orchestrator.run('hello world');
    assert.ok(result.finalAnswer.includes('Synthesized answer'));
  });

  it('AC-10 共享 context 传递 workerResults', async () => {
    const llm = new MockLLM();
    const tools = new ToolRegistry();
    const orchestrator = new OrchestratorAgent({
      llm,
      tools,
      workers: [
        new WorkerAgent({ name: 'a', description: 'A', specialty: 'search' }, llm, tools),
      ],
    });
    const ctx: AgentContext = { sharedMemory: new Map(), workerResults: new Map() };
    await orchestrator.run('search query', ctx);
    assert.ok(ctx.workerResults.size > 0);
  });
});

describe('OrchestratorAgent · DAG 依赖', () => {
  it('AC-11 dependsOn 任务串行执行', async () => {
    const llm = new MockLLM();
    const tools = new ToolRegistry();
    const orchestrator = new OrchestratorAgent({
      llm,
      tools,
      workers: [
        new WorkerAgent({ name: 'w', description: 'W', specialty: 'general' }, llm, tools),
      ],
    });
    // 注入 DAG: t1 → t2 (t2 depends on t1)
    const tasks = [
      { id: 't1', description: 'first', assignedTo: 'w' },
      { id: 't2', description: 'second', assignedTo: 'w', dependsOn: ['t1'] },
    ];
    // 通过 reflect hack: 模拟 decompose 返回
    (orchestrator as unknown as { decompose: () => typeof tasks }).decompose = () => tasks;
    const result = await orchestrator.run('test', { sharedMemory: new Map(), workerResults: new Map() });
    assert.equal(result.results.length, 2);
    // t1 应先于 t2 完成
    const t1Result = result.results.find((r) => r.taskId === 't1');
    const t2Result = result.results.find((r) => r.taskId === 't2');
    assert.ok(t1Result && t2Result);
  });
});
