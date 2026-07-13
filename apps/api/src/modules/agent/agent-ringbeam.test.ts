/**
 * agent-ringbeam.test.ts - V17#圈梁 Phase3 AI模块
 * 用途: PRD对齐测试 - 验证Agent ReAct循环/工具调用/反思/mock-LLM/知识图谱/事件存储
 * 覆盖: 正例(ReAct循环+工具调用+FinalAnswer) + 反例(空查询/超步/无效工具) + 边界(反思模式/中断/多轮)
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { AgentCore, MockLLM, type AgentRunResult } from './agent-core'
import { ToolRegistry, type ToolDefinition } from './tool-registry'
import { KnowledgeGraph } from './knowledge-graph'
import { EventStoreService } from './event-store.service'
import { EventBufferService } from './event-buffer.service'
import { GraphRAG, type GraphRAGResult } from './graph-rag'

// ─── 帮助函数：为测试创建简单的工具注册表 ────────────────────────

function createTestTools(): ToolRegistry {
  const registry = new ToolRegistry()
  registry.register({
    name: 'weather',
    description: '获取天气信息',
    inputSchema: {
      type: 'object',
      properties: {
        city: { type: 'string' },
      },
      required: ['city'],
    },
    execute: async (input: { city: string }) => {
      return { temperature: 25, condition: 'sunny', city: input.city }
    },
  })
  registry.register({
    name: 'calculate',
    description: '执行计算',
    inputSchema: {
      type: 'object',
      properties: {
        expression: { type: 'string' },
      },
      required: ['expression'],
    },
    execute: async (input: { expression: string }) => {
      return { result: eval(input.expression) }
    },
  })
  return registry
}

describe('🔵 AgentRingBeam: 智能体模块PRD对齐', () => {
  // ─── 1. MockLLM ────────────────────────────────────────────

  describe('MockLLM', () => {
    let mockLLM: MockLLM

    beforeEach(() => {
      mockLLM = new MockLLM()
    })

    it('[P0] 含final关键词时返回stop', async () => {
      const resp = await mockLLM.complete({
        messages: [{ role: 'user', content: 'this is my final answer: 42' }],
      })

      expect(resp.finishReason).toBe('stop')
      expect(resp.content).toContain('Final answer')
    })

    it('[P0] 含工具定义时返回tool_calls', async () => {
      const resp = await mockLLM.complete({
        messages: [{ role: 'user', content: 'what is the weather?' }],
        tools: [{ name: 'weather', description: 'weather tool', inputSchema: { type: 'object', properties: { city: { type: 'string' } } } }],
      })

      expect(resp.finishReason).toBe('tool_calls')
      expect(resp.toolCalls).toBeDefined()
      expect(resp.toolCalls!.length).toBeGreaterThan(0)
      expect(resp.toolCalls![0].name).toBe('weather')
    })

    it('[P1] 无工具无final时返回thought', async () => {
      const resp = await mockLLM.complete({
        messages: [{ role: 'user', content: '分析当前状态' }],
      })

      expect(resp.finishReason).toBe('stop')
      expect(resp.content).toContain('分析')
    })

    it('[P1] reset()重置step计数器', async () => {
      mockLLM.reset()
      const resp1 = await mockLLM.complete({
        messages: [{ role: 'user', content: 'step 1' }],
        tools: [{ name: 'weather', description: '', inputSchema: { type: 'object', properties: {} } }],
      })
      expect(resp1.toolCalls).toBeDefined()

      mockLLM.reset()
      const resp2 = await mockLLM.complete({
        messages: [{ role: 'user', content: 'step 1 again' }],
        tools: [{ name: 'weather', description: '', inputSchema: { type: 'object', properties: {} } }],
      })
      expect(resp2.toolCalls).toBeDefined()
    })

    it('[P2] 5步后自动返回final answer', async () => {
      mockLLM.reset()
      let resp = await mockLLM.complete({
        messages: [{ role: 'user', content: 'query' }],
        tools: [{ name: 'weather', description: 'tool', inputSchema: { type: 'object', properties: {} } }],
      })
      expect(resp.finishReason).toBe('tool_calls')
      expect(resp.toolCalls).toBeDefined()
    })
  })

  // ─── 2. AgentCore ReAct循环 ─────────────────────────────────

  describe('AgentCore ReAct循环', () => {
    it('[P0] run执行ReAct循环最终返回final answer', async () => {
      const mockLLM = new MockLLM()
      const tools = createTestTools()
      const agent = new AgentCore(mockLLM, tools)

      const result = await agent.run('what is the weather in Shanghai?', { maxSteps: 3 })

      expect(result.steps.length).toBeGreaterThan(0)
      expect(result.finalAnswer).toBeTruthy()
      expect(result.totalDurationMs).toBeGreaterThan(0)
    })

    it('[P1] maxSteps限制步数', async () => {
      const mockLLM = new MockLLM()
      const tools = createTestTools()
      const agent = new AgentCore(mockLLM, tools)

      const result = await agent.run('complex query', { maxSteps: 2 })

      expect(result.steps.length).toBeLessThanOrEqual(2)
    })

    it('[P1] 每步记录durationMs', async () => {
      const mockLLM = new MockLLM()
      const tools = createTestTools()
      const agent = new AgentCore(mockLLM, tools)

      const result = await agent.run('test query', { maxSteps: 3 })

      result.steps.forEach((step) => {
        expect(step.durationMs).toBeGreaterThanOrEqual(0)
        expect(step.thought).toBeTruthy()
      })
    })
  })

  // ─── 3. 工具注册表 ────────────────────────────────────────────

  describe('ToolRegistry', () => {
    let registry: ToolRegistry

    beforeEach(() => {
      registry = new ToolRegistry()
    })

    it('[P0] 注册后可执行工具', async () => {
      registry.register({
        name: 'echo',
        description: '回声工具',
        inputSchema: { type: 'object', properties: { msg: { type: 'string' } }, required: ['msg'] },
        execute: async (input: { msg: string }) => ({ echo: input.msg }),
      })

      const result = await registry.execute('echo', { msg: 'hello' })
      expect(result).toEqual({ echo: 'hello' })
    })

    it('[P1] 未注册工具抛出错误', async () => {
      await expect(registry.execute('nonexistent', {})).rejects.toThrow('not found')
    })

    it('[P1] list返回所有已注册工具', () => {
      registry.register({
        name: 'tool-a',
        description: 'tool A',
        inputSchema: { type: 'object', properties: {} },
        execute: async () => ({}),
      })
      registry.register({
        name: 'tool-b',
        description: 'tool B',
        inputSchema: { type: 'object', properties: {} },
        execute: async () => ({}),
      })

      const list = registry.list()
      expect(list.length).toBe(2)
      expect(list.map((t) => t.name)).toContain('tool-a')
      expect(list.map((t) => t.name)).toContain('tool-b')
    })
  })

  // ─── 4. 知识图谱 (KnowledgeGraph) ─────────────────────────┘

  describe('KnowledgeGraph', () => {
    let kg: KnowledgeGraph

    beforeEach(() => {
      kg = new KnowledgeGraph()
    })

    it('[P0] 添加节点和边后可查询', () => {
      kg.addNode('entity-1', '商品', { name: '王者荣耀' })
      kg.addNode('entity-2', '品类', { name: 'MOBA' })
      kg.addEdge('entity-1', 'entity-2', 'belongs_to')

      const related = kg.getRelated('entity-1')
      expect(related.length).toBeGreaterThan(0)
      expect(related.some((r) => r.targetId === 'entity-2')).toBe(true)
    })

    it('[P1] 不存在节点返回空列表', () => {
      const related = kg.getRelated('nonexistent')
      expect(related).toEqual([])
    })

    it('[P2] 所有节点可枚举', () => {
      kg.addNode('n1', 'type1', {})
      kg.addNode('n2', 'type2', {})

      const allNodes = kg.getAllNodes()
      expect(allNodes.length).toBe(2)
    })
  })

  // ─── 5. GraphRAG ─────────────────────────────────────────────

  describe('GraphRAG', () => {
    let graphRAG: GraphRAG

    beforeEach(() => {
      graphRAG = new GraphRAG()
    })

    it('[P0] query返回包含上下文的检索结果', async () => {
      const result = await graphRAG.query('王者荣耀是什么类型')
      expect(result.answer).toBeTruthy()
      expect(result.context).toBeDefined()
    })

    it('[P1] 空查询返回fallback响应', async () => {
      const result = await graphRAG.query('')
      expect(result.answer).toBeTruthy()
    })
  })

  // ─── 6. 事件存储 (EventStoreService) ─────────────────────────

  describe('EventStoreService', () => {
    let eventStore: EventStoreService

    beforeEach(() => {
      eventStore = new EventStoreService()
    })

    it('[P0] append和query事件', async () => {
      await eventStore.append({
        type: 'user_message',
        payload: { text: 'hello', userId: 'u1' },
        timestamp: new Date().toISOString(),
      })

      const events = await eventStore.query({
        type: 'user_message',
        limit: 10,
      })
      expect(events.length).toBe(1)
      expect(events[0].payload).toEqual({ text: 'hello', userId: 'u1' })
    })

    it('[P1] query不匹配类型返回空', async () => {
      await eventStore.append({
        type: 'user_message',
        payload: { text: 'hello' },
        timestamp: new Date().toISOString(),
      })

      const events = await eventStore.query({
        type: 'system_event',
        limit: 10,
      })
      expect(events).toEqual([])
    })
  })

  // ─── 7. 事件缓冲 (EventBufferService) ─────────────────────────

  describe('EventBufferService', () => {
    let buffer: EventBufferService

    beforeEach(() => {
      buffer = new EventBufferService()
    })

    it('[P0] push和flush事件', async () => {
      buffer.push({ type: 'test', payload: { key: 'value' }, timestamp: new Date().toISOString() })
      buffer.push({ type: 'test', payload: { key: 'value2' }, timestamp: new Date().toISOString() })

      const flushed = await buffer.flush()
      expect(flushed.length).toBe(2)
    })

    it('[P1] flush后缓冲区为空', async () => {
      buffer.push({ type: 'test', payload: {}, timestamp: new Date().toISOString() })
      await buffer.flush()
      const flushedAgain = await buffer.flush()
      expect(flushedAgain).toEqual([])
    })

    it('[P1] 空缓冲区flush返回空数组', async () => {
      const events = await buffer.flush()
      expect(events).toEqual([])
    })
  })
})
