import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
/**
 * agent-core.test.ts - Phase-23 T85
 * Agent 核心 (ReAct 循环) 单元测试
 */
import assert from 'node:assert/strict';
import { AgentCore, MockLLM, LLMResponse, LLMRequest } from './agent-core';
import { ToolRegistry, BUILTIN_TOOLS } from './tool-registry';

describe('MockLLM', () => {
  it('AC-1 有 tool 时返回 tool call', async () => {
    const llm = new MockLLM();
    const resp = await llm.complete({
      messages: [{ role: 'user', content: 'test' }],
      tools: [{ name: 'foo', description: 'Foo tool', inputSchema: { type: 'object', properties: {} } }],
    });
    assert.equal(resp.finishReason, 'tool_calls');
    assert.ok(resp.toolCalls);
    assert.equal(resp.toolCalls?.[0].name, 'foo');
  });

  it('AC-2 step 5 时返回 final answer', async () => {
    const llm = new MockLLM();
    llm.reset();
    const resp = await llm.complete({
      messages: [{ role: 'user', content: 'q1' }],
      tools: [{ name: 'foo', description: 'Foo', inputSchema: { type: 'object', properties: {} } }],
    });
    assert.equal(resp.finishReason, 'tool_calls');
    const resp2 = await llm.complete({
      messages: [{ role: 'user', content: 'q2' }],
      tools: [{ name: 'foo', description: 'Foo', inputSchema: { type: 'object', properties: {} } }],
    });
    assert.equal(resp2.finishReason, 'tool_calls');
    const resp3 = await llm.complete({
      messages: [{ role: 'user', content: 'q3' }],
      tools: [{ name: 'foo', description: 'Foo', inputSchema: { type: 'object', properties: {} } }],
    });
    assert.equal(resp3.finishReason, 'tool_calls');
    const resp4 = await llm.complete({
      messages: [{ role: 'user', content: 'q4' }],
      tools: [{ name: 'foo', description: 'Foo', inputSchema: { type: 'object', properties: {} } }],
    });
    assert.equal(resp4.finishReason, 'tool_calls');
    const resp5 = await llm.complete({
      messages: [{ role: 'user', content: 'q5' }],
      tools: [{ name: 'foo', description: 'Foo', inputSchema: { type: 'object', properties: {} } }],
    });
    assert.equal(resp5.finishReason, 'stop', 'step 5 应返回 final answer');
  });

  it('AC-3 无 tool 时返回 thought', async () => {
    const llm = new MockLLM();
    const resp = await llm.complete({
      messages: [{ role: 'user', content: 'test' }],
    });
    assert.equal(resp.finishReason, 'stop');
    assert.ok(resp.content.startsWith('Thought'));
  });
});

describe('AgentCore · ReAct 循环', () => {
  it('AC-4 单步 tool call → final answer', async () => {
    const llm = new MockLLM();
    const tools = new ToolRegistry();
    const agent = new AgentCore(llm, tools);
    const result = await agent.run('what is 2+2?');
    assert.ok(result.steps.length > 0);
    assert.ok(result.finalAnswer);
  });

  it('AC-5 step callback 触发', async () => {
    const llm = new MockLLM();
    const tools = new ToolRegistry();
    const agent = new AgentCore(llm, tools);
    const stepCount: number[] = [];
    await agent.run('test query', {
      onStep: (s) => stepCount.push(s.step),
    });
    assert.ok(stepCount.length > 0);
    assert.equal(stepCount[0], 1);
  });

  it('AC-6 maxSteps 限制', async () => {
    // 用一个总是返回 tool call 的 LLM
    const alwaysToolLLM = {
      complete: async (_req: LLMRequest): Promise<LLMResponse> => ({
        content: 'calling tool',
        toolCalls: [{ id: 'call-1', name: 'calculator', input: { expression: '1+1' } }],
        finishReason: 'tool_calls',
      }),
    };
    const tools = new ToolRegistry();
    const agent = new AgentCore(alwaysToolLLM, tools);
    const result = await agent.run('infinite loop test', { maxSteps: 3 });
    assert.equal(result.steps.length, 3);
    assert.equal(result.success, false, 'max steps 达到,success=false');
  });

  it('AC-7 AbortSignal 中断', async () => {
    const llm = new MockLLM();
    const tools = new ToolRegistry();
    const agent = new AgentCore(llm, tools);
    const controller = new AbortController();
    controller.abort();
    await assert.rejects(
      () => agent.run('test', { signal: controller.signal }),
      /aborted/,
    );
  });

  it('AC-8 step.action 记录 tool call', async () => {
    const llm = new MockLLM();
    const tools = new ToolRegistry();
    const agent = new AgentCore(llm, tools);
    const result = await agent.run('calculate 2+2');
    const actionStep = result.steps.find((s) => s.action);
    assert.ok(actionStep);
    assert.equal(actionStep?.action?.tool, 'calculator');
    assert.ok(actionStep?.observation);
  });
});

describe('AgentCore · Tool 调用', () => {
  it('AC-9 tool not found → observation error', async () => {
    const alwaysCallLLM = {
      complete: async (_req: LLMRequest): Promise<LLMResponse> => ({
        content: 'call missing',
        toolCalls: [{ id: 'call-1', name: 'nonexistent_tool', input: {} }],
        finishReason: 'tool_calls',
      }),
    };
    const tools = new ToolRegistry();
    const agent = new AgentCore(alwaysCallLLM, tools);
    const result = await agent.run('test');
    const step = result.steps[0];
    assert.ok(step.observation?.error, 'should record error');
  });

  it('AC-10 tool success → observation has result', async () => {
    const alwaysCallLLM = {
      complete: async (_req: LLMRequest): Promise<LLMResponse> => ({
        content: 'calc',
        toolCalls: [{ id: 'c1', name: 'calculator', input: { expression: '2+2' } }],
        finishReason: 'tool_calls',
      }),
    };
    const tools = new ToolRegistry();
    const agent = new AgentCore(alwaysCallLLM, tools);
    const result = await agent.run('calc 2+2', { maxSteps: 2 });
    const step = result.steps[0];
    assert.ok(step.observation?.result !== undefined);
  });
});

describe('BUILTIN_TOOLS', () => {
  it('AC-11 4 个内置工具', () => {
    assert.equal(BUILTIN_TOOLS.length, 4);
    const names = BUILTIN_TOOLS.map((t) => t.name);
    assert.ok(names.includes('calculator'));
    assert.ok(names.includes('web_search'));
    assert.ok(names.includes('knowledge_search'));
    assert.ok(names.includes('database_query'));
  });
});
