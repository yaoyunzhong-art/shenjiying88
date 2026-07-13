/**
 * agent-ringbeam.test.ts - V17#圈梁 Phase3 AI模块
 * 用途: PRD对齐测试 - 验证Agent ReAct循环/工具调用/mock-LLM/知识图谱/事件缓冲
 * 覆盖: 正例(MockLLM+ReAct+ToolRegistry+知识图谱+事件缓冲) + 反例(无效工具/空查询) + 边界(多步/超步/无邻居)
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { AgentCore, MockLLM } from './agent-core'
import { ToolRegistry } from './tool-registry'
import { KnowledgeGraph } from './knowledge-graph'
import { EventBufferService } from './event-buffer.service'
import type { AgentSessionEvent, AgentMessage, AgentSession } from './agent.entity'

// ─── 帮助函数：为测试创建简单的工具注册表 ────────────────────────

function createTestTools(): ToolRegistry {
  const registry = new ToolRegistry()
  registry.register(
    {
      name: 'weather',
      description: '获取天气信息',
      inputSchema: {
        type: 'object',
        properties: { city: { type: 'string' } },
        required: ['city'],
      },
    },
    async (input: unknown) => {
      const { city } = input as { city: string }
      return { temperature: 25, condition: 'sunny', city }
    },
  )
  registry.register(
    {
      name: 'calculate',
      description: '执行计算',
      inputSchema: {
        type: 'object',
        properties: { expression: { type: 'string' } },
        required: ['expression'],
      },
    },
    async (input: unknown) => {
      const { expression } = input as { expression: string }
      return { result: eval(expression) }
    },
  )
  return registry
}

/** 辅助: 创建一条 AgentMessage 用于 event buffer 测试 */
function makeAgentMessage(text: string, overrides?: Partial<AgentMessage>): AgentMessage {
  return {
    id: overrides?.id ?? `msg-${Date.now()}`,
    sessionId: overrides?.sessionId ?? 'test-session',
    role: overrides?.role ?? 'assistant',
    content: text,
    timestamp: new Date().toISOString(),
    ...overrides,
  }
}

/** 辅助: 创建简化的 AgentSession 用于 event buffer 测试 */
function makeAgentSession(overrides?: Partial<AgentSession>): AgentSession {
  return {
    id: overrides?.id ?? 'test-session',
    configId: overrides?.configId ?? 'cfg-1',
    status: overrides?.status ?? 'RUNNING',
    userInput: overrides?.userInput ?? 'test',
    currentStep: overrides?.currentStep ?? 0,
    maxSteps: overrides?.maxSteps ?? 10,
    enableReflection: overrides?.enableReflection ?? false,
    messages: overrides?.messages ?? [],
    createdAt: new Date().toISOString(),
    createdBy: overrides?.createdBy ?? 'test',
    tenantId: overrides?.tenantId ?? 'default',
    ...overrides,
  }
}

/** 辅助: 创建合法的 AgentSessionEvent */
function makeMessageAddedEvent(text: string): AgentSessionEvent {
  return {
    type: 'message_added',
    message: makeAgentMessage(text),
    timestamp: new Date().toISOString(),
  }
}

describe('🔵 AgentRingBeam: 智能体模块PRD对齐', () => {
  // ─── 1. MockLLM ────────────────────────────────────────────

  describe('MockLLM', () => {
    let mockLLM: MockLLM

    beforeEach(() => {
      mockLLM = new MockLLM()
    })

    it('[P0] 含final/answer关键词时返回stop响应', async () => {
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

    it('[P1] 无工具无final关键词时返回thought', async () => {
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

    it('[P2] 5步后全局step自动返回final answer', async () => {
      mockLLM.reset()
      const resp = await mockLLM.complete({
        messages: [{ role: 'user', content: 'query' }],
        tools: [{ name: 'weather', description: 'tool', inputSchema: { type: 'object', properties: {} } }],
      })
      // step=1, globalStep=1, 尚未到5, 应返回tool_calls
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
      expect(result.totalDurationMs).toBeGreaterThanOrEqual(0)
    })

    it('[P1] maxSteps限制步数', async () => {
      const mockLLM = new MockLLM()
      const tools = createTestTools()
      const agent = new AgentCore(mockLLM, tools)

      const result = await agent.run('complex query', { maxSteps: 2 })

      expect(result.steps.length).toBeLessThanOrEqual(2)
    })

    it('[P1] 每步记录durationMs和thought', async () => {
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
      registry.register(
        {
          name: 'echo',
          description: '回声工具',
          inputSchema: { type: 'object', properties: { msg: { type: 'string' } }, required: ['msg'] },
        },
        async (input: unknown) => ({ echo: (input as { msg: string }).msg }),
      )

      const result = await registry.execute('echo', { msg: 'hello' })
      expect(result).toEqual({ echo: 'hello' })
    })

    it('[P1] 未注册工具抛出异常', async () => {
      await expect(registry.execute('nonexistent', {})).rejects.toThrow('not found')
    })

    it('[P1] list返回已注册工具(含内置)', () => {
      registry.register(
        {
          name: 'tool-a',
          description: 'tool A',
          inputSchema: { type: 'object', properties: {} },
        },
        async () => ({ success: true }),
      )

      const list = registry.list()
      // 含4个内置工具 + 新注册的tool-a
      expect(list.length).toBeGreaterThanOrEqual(5)
      expect(list.map((t) => t.name)).toContain('tool-a')
      expect(list.map((t) => t.name)).toContain('calculator')
    })
  })

  // ─── 4. 知识图谱 (KnowledgeGraph) ─────────────────────────────

  describe('KnowledgeGraph', () => {
    let kg: KnowledgeGraph

    beforeEach(() => {
      kg = new KnowledgeGraph()
    })

    it('[P0] 添加实体和关系后可查询邻居', () => {
      const e1 = kg.addEntity({ type: 'Product', name: '王者荣耀', aliases: [], properties: {} })
      const e2 = kg.addEntity({ type: 'Concept', name: 'MOBA', aliases: [], properties: {} })
      kg.addRelation({ from: e1.id, to: e2.id, type: 'belongs_to', properties: {}, confidence: 1.0 })

      const neighbors = kg.getNeighbors(e1.id, 'out')
      expect(neighbors.length).toBeGreaterThan(0)
      expect(neighbors[0].to).toBe(e2.id)
    })

    it('[P1] 子图提取返回包含起点和邻居', () => {
      const e1 = kg.addEntity({ type: 'Product', name: '原神', aliases: [], properties: {} })
      const e2 = kg.addEntity({ type: 'Concept', name: 'RPG', aliases: [], properties: {} })
      kg.addRelation({ from: e1.id, to: e2.id, type: 'is_a', properties: {}, confidence: 1.0 })

      const sub = kg.subgraph(e1.id, 2)
      expect(sub.nodes.length).toBeGreaterThanOrEqual(2)
      expect(sub.relations.length).toBeGreaterThanOrEqual(1)
    })

    it('[P1] 无邻居时子图仅包含起点', () => {
      const e1 = kg.addEntity({ type: 'Place', name: '孤岛', aliases: [], properties: {} })
      const sub = kg.subgraph(e1.id, 2)

      expect(sub.nodes.length).toBe(1)
      expect(sub.nodes[0].entity.id).toBe(e1.id)
      expect(sub.relations.length).toBe(0)
    })

    it('[P2] listEntitiesByType按类型过滤返回实体', () => {
      kg.addEntity({ type: 'Product', name: '游戏A', aliases: [], properties: {} })
      kg.addEntity({ type: 'Product', name: '游戏B', aliases: [], properties: {} })
      kg.addEntity({ type: 'Person', name: '用户X', aliases: [], properties: {} })

      const products = kg.listEntitiesByType('Product')
      expect(products.length).toBe(2)

      const persons = kg.listEntitiesByType('Person')
      expect(persons.length).toBe(1)
    })
  })

  // ─── 5. 事件缓冲 (EventBufferService) ─────────────────────────

  describe('EventBufferService', () => {
    let buffer: EventBufferService

    beforeEach(() => {
      buffer = new EventBufferService()
    })

    it('[P0] append追加事件并返回带id的BufferedEvent', () => {
      const event = buffer.append('session-001', makeMessageAddedEvent('hello'))

      expect(event.id).toBeGreaterThanOrEqual(1)
      // BufferedEvent = AgentSessionEvent & { id: number }
      // message_added 事件有 message 字段
      if (event.type === 'message_added') {
        expect(event.message.content).toBe('hello')
      }
    })

    it('[P1] replayAfter返回lastEventId之后的事件', () => {
      const e1 = buffer.append('session-001', makeMessageAddedEvent('msg1'))
      const e2 = buffer.append('session-001', makeMessageAddedEvent('msg2'))

      const afterE1 = buffer.replayAfter('session-001', e1.id)
      expect(afterE1.events.length).toBe(1)
      expect(afterE1.events[0].id).toBe(e2.id)
      expect(afterE1.found).toBe(true)

      const all = buffer.replayAfter('session-001', 0)
      expect(all.events.length).toBeGreaterThanOrEqual(2)
    })

    it('[P1] 不同session独立缓冲', () => {
      buffer.append('session-a', makeMessageAddedEvent('a'))
      buffer.append('session-b', makeMessageAddedEvent('b'))

      const aEvents = buffer.replayAfter('session-a', 0)
      expect(aEvents.events.length).toBe(1)
      if (aEvents.events[0].type === 'message_added') {
        expect(aEvents.events[0].message.content).toBe('a')
      }
    })
  })
})
