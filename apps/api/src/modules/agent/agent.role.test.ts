import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
/**
 * 🐜 自动: [agent] [C] 角色测试
 * 
 * 8 角色视角的 agent 模块测试：
 * 👔店长 🛒前台 👥HR 🔧安监 🎮导玩员 🎯运行专员 🤝团建 📢营销
 * 
 * 每个角色至少 2 个测试用例（正常流程 + 权限边界）
 */

import 'reflect-metadata'
import assert from 'node:assert/strict'
import { AgentController } from './agent.controller'
import { AgentService } from './agent.service'
import { ToolRegistry } from './tool-registry'
import type { CreateSessionRequest, QualityEvaluation, BatchAgentRequest, AgentConfig } from './agent.entity'

// ── 角色定义 ──
const ROLES = {
  StoreManager: '👔店长',
  FrontDesk: '🛒前台',
  HR: '👥HR',
  Security: '🔧安监',
  Guide: '🎮导玩员',
  Operations: '🎯运行专员',
  Teambuilding: '🤝团建',
  Marketing: '📢营销',
} as const

// ── 测试数据工厂 ──
function createController() {
  const service = new AgentService(new ToolRegistry())
  return new AgentController(service, null as any)
}

const validConfig: AgentConfig = {
  id: 'cfg-test-001',
  name: 'Test Agent',
  systemPrompt: 'You are a test assistant.',
  model: 'deepseek-v4',
  maxSteps: 5,
  enableReflection: true,
  allowedTools: ['calculator'],
  timeoutMs: 30000,
  enabled: true,
  createdAt: '',
  updatedAt: '',
  tenantId: 't-001',
}

const validSessionRequest: CreateSessionRequest = {
  configId: 'default-agent-v1',
  userInput: 'Hello, how can I help customers today?',
  maxSteps: 5,
  enableReflection: true,
  createdBy: 'test-user',
  tenantId: 't-001',
}

const validEvaluation: Omit<QualityEvaluation, 'id' | 'evaluatedAt'> = {
  sessionId: '',
  userInput: 'test input',
  agentOutput: 'test output',
  relevanceScore: 0.9,
  accuracyScore: 0.8,
  completenessScore: 0.85,
  safetyScore: 1.0,
  helpfulnessScore: 0.9,
  concisenessScore: 0.8,
  feedback: 'Good response',
  evaluatedBy: 'reviewer',
  tenantId: 't-001',
  overallScore: 0.85,
}

function runSession(ctrl: AgentController): string {
  const result = ctrl.createAndRunSession(validSessionRequest as any)
  return result.session.id
}

// ── 👔店长 ──
describe(`${ROLES.StoreManager} agent 角色测试`, () => {
  it('店长创建 Agent 配置并查看配置列表（门店智能体配置管理）', () => {
    const ctrl = createController()
    const created = ctrl.createConfig(validConfig)
    assert.equal(created.id, 'cfg-test-001')
    assert.ok(created.createdAt)
    assert.ok(created.updatedAt)

    const configs = ctrl.getConfigs()
    const found = configs.find((c) => c.id === 'cfg-test-001')
    assert.ok(found)
    assert.equal(found!.name, 'Test Agent')
  })

  it('店长查看门店智能助手统计概览（管理决策辅助）', () => {
    const ctrl = createController()
    runSession(ctrl)

    // 运行一个额外会话
    ctrl.createAndRunSession({
      ...validSessionRequest,
      configId: 'default-agent-v1',
      userInput: 'How many customers visited today?',
    } as any)

    const stats = ctrl.getStats('t-001')
    assert.equal(stats.totalSessions, 2)
    assert.equal(stats.completedSessions, 2)
    assert.equal(stats.avgDurationMs, 0) // Duration mock returns 0 due to fast sync execution
    assert.equal(stats.avgSteps, 5)
    assert.equal(stats.avgLlmCalls > 0, true)
    assert.equal(stats.avgQualityScore, 0)
    assert.equal(stats.tenantId, 't-001')
  })

  it('店长禁用某个 Agent 配置（临时下架有问题的智能体）', () => {
    const ctrl = createController()
    ctrl.createConfig(validConfig)
    const updated = ctrl.updateConfig('cfg-test-001', { enabled: false })
    assert.equal(updated!.enabled, false)
    assert.throws(
      () => ctrl.createAndRunSession({ ...validSessionRequest, configId: 'cfg-test-001' } as any),
      /disabled/
    )
  })

  it('店长删除废弃的旧 Agent 配置', () => {
    const ctrl = createController()
    ctrl.createConfig(validConfig)
    const result = ctrl.deleteConfig('cfg-test-001')
    assert.equal(result.deleted, true)
    assert.throws(() => ctrl.getConfig('cfg-test-001'), /not found/)
  })
})

// ── 🛒前台 ──
describe(`${ROLES.FrontDesk} agent 角色测试`, () => {
  it('前台使用默认智能体回答顾客常见问题', () => {
    const ctrl = createController()
    const result = ctrl.createAndRunSession({
      configId: 'default-agent-v1',
      userInput: 'Where is the restroom?',
      maxSteps: 3,
      enableReflection: false,
      createdBy: 'frontdesk-01',
      tenantId: 't-001',
    } as any)

    assert.equal(result.session.status, 'COMPLETED')
    assert.ok(result.session.finalOutput)
    assert.equal(result.execution.status, 'SUCCESS')
    assert.equal(result.execution.steps, 3) // maxSteps=3 passed through
    assert.equal(result.execution.totalDurationMs >= 0, true)
  })

  it('前台查询单个会话详情（跟进之前的问题处理）', () => {
    const ctrl = createController()
    const sessionId = runSession(ctrl)
    const session = ctrl.getSession(sessionId)
    assert.ok(session)
    assert.equal(session!.id, sessionId)
    assert.equal(session!.status, 'COMPLETED')
    // 5 steps × 2 msgs (thought + tool) + system + user + (optional reflection) = 12 or 13
    assert.ok(session!.messages.length >= 10)
  })

  it('前台查询不存在的会话得到错误（权限边界）', () => {
    const ctrl = createController()
    assert.throws(() => ctrl.getSession('non-existent-session'), /not found/)
  })
})

// ── 👥HR ──
describe(`${ROLES.HR} agent 角色测试`, () => {
  it('HR 使用智能体审核员工培训问答的响应质量', () => {
    const ctrl = createController()
    const { session } = ctrl.createAndRunSession({
      configId: 'default-agent-v1',
      userInput: 'What are the company policies on overtime?',
      createdBy: 'hr-reviewer',
      tenantId: 't-001',
    } as any)

    const evaluation = ctrl.submitEvaluation({
      ...validEvaluation,
      sessionId: session.id,
      userInput: session.userInput,
      agentOutput: session.finalOutput ?? '',
      evaluatedBy: 'hr-manager',
    } as any)

    assert.ok(evaluation.id)
    assert.equal(evaluation.sessionId, session.id)
    assert.ok(evaluation.overallScore > 0)
    assert.ok(evaluation.overallScore <= 1)
  })

  it('HR 查看某个 Agent 会话的质量评估', () => {
    const ctrl = createController()
    const { session } = ctrl.createAndRunSession(validSessionRequest as any)
    ctrl.submitEvaluation({
      ...validEvaluation,
      sessionId: session.id,
      evaluatedBy: 'hr-manager',
    } as any)

    const evalResult = ctrl.getSessionEvaluation(session.id)
    assert.ok(evalResult)
    assert.equal(evalResult!.evaluatedBy, 'hr-manager')
    assert.equal(evalResult!.sessionId, session.id)
  })

  it('HR 试图评估不存在的会话（权限边界）', () => {
    const ctrl = createController()
    assert.throws(() => ctrl.getSessionEvaluation('fake-session'), /not found/)
  })
})

// ── 🔧安监 ──
describe(`${ROLES.Security} agent 角色测试`, () => {
  it('安监获取所有 Agent 配置列表（安全审计需要）', () => {
    const ctrl = createController()
    const configs = ctrl.getConfigs()
    assert.ok(Array.isArray(configs))
    assert.ok(configs.length >= 1)
    configs.forEach((c) => {
      assert.ok(c.id)
      assert.ok(c.systemPrompt)
      assert.ok(c.allowedTools)
    })
  })

  it('安监检查智能体执行中的工具调用记录（安全合规审查）', () => {
    const ctrl = createController()
    const { execution } = ctrl.createAndRunSession({
      configId: 'default-agent-v1',
      userInput: 'What is 42+58?',
      createdBy: 'guest',
      tenantId: 't-001',
    } as any)

    assert.equal(execution.toolCalls > 0, true, 'should have tool calls')
    assert.equal(execution.llmCalls > 0, true)
    assert.equal(execution.totalDurationMs >= 0, true)
  })

  it('安监验证禁用的智能体无法运行（安全边界）', () => {
    const ctrl = createController()
    // 禁用默认 config
    ctrl.updateConfig('default-agent-v1', { enabled: false })
    assert.throws(
      () => ctrl.createAndRunSession(validSessionRequest as any),
      /disabled/
    )
    // 恢复
    ctrl.updateConfig('default-agent-v1', { enabled: true })
  })
})

// ── 🎮导玩员 ──
describe(`${ROLES.Guide} agent 角色测试`, () => {
  it('导玩员使用智能体查询游戏规则说明', () => {
    const ctrl = createController()
    const result = ctrl.createAndRunSession({
      configId: 'default-agent-v1',
      userInput: 'Explain the rules of ping pong for beginners.',
      maxSteps: 4,
      enableReflection: false,
      createdBy: 'guide-wang',
      tenantId: 't-001',
    } as any)

    assert.equal(result.session.status, 'COMPLETED')
    assert.equal(result.execution.status, 'SUCCESS')
    assert.equal(result.execution.steps, 4)
  })

  it('导玩员查看会话执行详情（确认回答完整性）', () => {
    const ctrl = createController()
    const sessionId = runSession(ctrl)
    const execution = ctrl.getSessionExecution(sessionId)
    assert.ok(execution)
    assert.equal(execution!.sessionId, sessionId)
    assert.equal(execution!.status, 'SUCCESS')
    assert.ok(execution!.steps > 0)
    assert.ok(execution!.llmCalls > 0)
    assert.ok(execution!.toolCalls > 0)
  })

  it('导玩员查询不存在的会话执行记录（边界）', () => {
    const ctrl = createController()
    assert.throws(() => ctrl.getSessionExecution('nonexistent'), /not found/)
  })
})

// ── 🎯运行专员 ──
describe(`${ROLES.Operations} agent 角色测试`, () => {
  it('运行专员批量执行多个智能体任务（批量运维）', () => {
    const ctrl = createController()
    const batchResult = ctrl.batchExecute({
      items: [
        { configId: 'default-agent-v1', userInput: 'Check system health.' },
        { configId: 'default-agent-v1', userInput: 'Report server status.' },
      ],
      createdBy: 'ops-engineer',
      tenantId: 't-001',
    } as any)

    assert.equal(batchResult.total, 2)
    assert.equal(batchResult.succeeded, 2)
    assert.equal(batchResult.failed, 0)
    assert.equal(batchResult.results.length, 2)
    batchResult.results.forEach((r) => {
      assert.equal(r.execution.status, 'SUCCESS')
    })
  })

  it('运行专员查看所有 Agent 会话列表（运营监控）', () => {
    const ctrl = createController()
    runSession(ctrl)
    runSession(ctrl)

    const sessions = ctrl.getSessions()
    assert.ok(sessions.length >= 2)
    sessions.forEach((s) => {
      assert.ok(s.id)
      assert.ok(s.createdAt)
      assert.ok(s.createdBy)
    })
  })

  it('运行专员批量执行时单个任务失败不影响其他任务（容错边界）', () => {
    const ctrl = createController()
    const batchResult = ctrl.batchExecute({
      items: [
        { configId: 'non-existent-config', userInput: 'Should fail' },
        { configId: 'default-agent-v1', userInput: 'Should succeed' },
      ],
      createdBy: 'ops-tester',
      tenantId: 't-001',
    } as any)

    assert.equal(batchResult.total, 2)
    assert.equal(batchResult.succeeded, 1)
    assert.equal(batchResult.failed, 1)
    assert.equal(batchResult.results.length, 1) // 只有成功的 item
    assert.equal(batchResult.results[0].execution.status, 'SUCCESS')
  })
})

// ── 🤝团建 ──
describe(`${ROLES.Teambuilding} agent 角色测试`, () => {
  it('团建专员查看已注册工具列表（了解智能体能力边界）', () => {
    const ctrl = createController()
    const tools = ctrl.getTools()
    assert.ok(Array.isArray(tools))
    const calcTool = tools.find((t: any) => t.name === 'calculator')
    assert.ok(calcTool)
  })

  it('团建专员使用默认智能体查询团建活动建议', () => {
    const ctrl = createController()
    const result = ctrl.createAndRunSession({
      configId: 'default-agent-v1',
      userInput: 'Suggest team building activities for 20 people.',
      maxSteps: 5,
      enableReflection: true,
      createdBy: 'team-builder',
      tenantId: 't-001',
    } as any)

    assert.equal(result.session.status, 'COMPLETED')
    assert.equal(result.execution.status, 'SUCCESS')
    assert.equal(result.execution.steps, 5)
    // 启用了反思，应有额外的 LLM 调用
    assert.ok(result.execution.llmCalls > result.execution.steps)
  })

  it('团建专员查看所有质量评估列表（监督智能体服务品质）', () => {
    const ctrl = createController()
    const { session } = ctrl.createAndRunSession(validSessionRequest as any)
    ctrl.submitEvaluation({
      ...validEvaluation,
      sessionId: session.id,
      evaluatedBy: 'quality-reviewer',
    } as any)

    const evals = ctrl.getEvaluations()
    assert.ok(evals.length >= 1)
    const found = evals.find((e) => e.sessionId === session.id)
    assert.ok(found)
    assert.equal(found!.evaluatedBy, 'quality-reviewer')
  })
})

// ── 📢营销 ──
describe(`${ROLES.Marketing} agent 角色测试`, () => {
  it('营销专员创建专用营销 Agent 配置', () => {
    const ctrl = createController()
    const marketingConfig: AgentConfig = {
      ...validConfig,
      id: 'cfg-marketing-v1',
      name: 'Marketing Assistant',
      systemPrompt: 'You are a marketing assistant specializing in promotional campaigns.',
      allowedTools: ['calculator'],
    }
    const created = ctrl.createConfig(marketingConfig)
    assert.equal(created.id, 'cfg-marketing-v1')
    assert.equal(created.name, 'Marketing Assistant')
    assert.ok(created.systemPrompt.includes('marketing'))
  })

  it('营销专员用营销智能体生成促销文案', () => {
    const ctrl = createController()
    // 先创建营销配置
    ctrl.createConfig({
      ...validConfig,
      id: 'cfg-marketing-v2',
      name: 'Marketing Copywriter',
      systemPrompt: 'You are a creative copywriter for game center promotions.',
    })
    const result = ctrl.createAndRunSession({
      configId: 'cfg-marketing-v2',
      userInput: 'Write a promotion message for summer holiday.',
      createdBy: 'marketing-lead',
      tenantId: 't-001',
    } as any)

    assert.equal(result.session.status, 'COMPLETED')
    assert.equal(result.execution.status, 'SUCCESS')
    assert.ok(result.session.finalOutput)
    assert.ok(result.session.finalOutput!.includes('completed'))
  })

  it('营销专员查看统计分析（了解智能体活跃度）', () => {
    const ctrl = createController()
    // 混入其他租户的会话
    ctrl.createAndRunSession({
      ...validSessionRequest,
      tenantId: 't-002',
    } as any)

    const statsT1 = ctrl.getStats('t-001')
    const statsAll = ctrl.getStats(undefined)

    assert.equal(statsT1.tenantId, 't-001')
    assert.ok(statsAll.totalSessions > statsT1.totalSessions,
      'all tenant stats should be >= filtered')
  })
})
