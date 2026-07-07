/**
 * Phase-26 E2E — Agent Studio 写操作
 *
 * 验证 SDK + view-model 暴露的 4 个写方法:
 * 1. submitAgentConfig (POST /agent/configs) — 创建 Config
 * 2. runAgentSession (POST /agent/sessions/run) — 运行单次会话
 * 3. batchRunAgent (POST /agent/sessions/batch) — 批量运行
 * 4. deleteAgentConfig (DELETE /agent/configs/:id) — 删除 Config
 *
 * 通过 AgentService 直调(Phase-25 沿用,绕开 Nest/PostgreSQL)
 */

import { AgentService } from '../apps/api/src/modules/agent/agent.service'
import { ToolRegistry } from '../apps/api/src/modules/agent/tool-registry'
import type {
  AgentConfig,
  BatchAgentRequest,
  CreateSessionRequest
} from '../packages/types/src'

let passed = 0
let failed = 0
const failures: string[] = []

function assert(cond: unknown, msg: string) {
  if (cond) {
    passed++
    console.log(`  ✓ ${msg}`)
  } else {
    failed++
    failures.push(msg)
    console.log(`  ✗ ${msg}`)
  }
}

async function main() {
  console.log('=== Phase-26 Agent Studio 写操作 E2E ===\n')

  const svc = new AgentService(new ToolRegistry())

  // ── 1. submitAgentConfig: 创建 Config ──
  console.log('[1] submitAgentConfig 创建 Config')
  const newConfig: AgentConfig = {
    id: `studio-cfg-${Date.now()}`,
    name: 'Studio Test Agent',
    systemPrompt: '你是一个测试 Agent,仅用于验证写接口。',
    model: 'deepseek-v4',
    maxSteps: 8,
    enableReflection: false,
    allowedTools: ['order_query', 'calculator'],
    timeoutMs: 20000,
    enabled: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    tenantId: 'studio-test'
  }

  const created = svc.createConfig(newConfig)
  assert(created.id === newConfig.id, 'createConfig 返回对象 id 一致')
  assert(created.name === newConfig.name, 'createConfig name 保留')
  assert(created.maxSteps === 8, 'createConfig maxSteps=8 保留')
  assert(created.enableReflection === false, 'createConfig enableReflection=false 保留')
  assert(created.allowedTools.length === 2, 'createConfig allowedTools 长度=2')
  assert(created.tenantId === 'studio-test', 'createConfig tenantId 保留')

  const refetched = svc.getConfig(created.id)
  assert(refetched !== undefined, 'getConfig 二次查询命中')
  assert(refetched?.id === created.id, 'getConfig id 一致')

  // ── 2. runAgentSession: 运行单次会话 ──
  console.log('\n[2] runAgentSession 运行单次会话')
  const sessionReq: CreateSessionRequest = {
    configId: created.id,
    userInput: '请计算 1+1=?',
    maxSteps: 5,
    enableReflection: false,
    createdBy: 'studio-tester',
    tenantId: 'studio-test'
  }

  const sessionResult = svc.createAndRunSession(sessionReq)
  assert(sessionResult.session !== undefined, 'sessionResult.session 存在')
  assert(sessionResult.execution !== undefined, 'sessionResult.execution 存在')
  assert(sessionResult.session.configId === created.id, 'session.configId === created.id')
  assert(sessionResult.session.userInput === '请计算 1+1=?', 'session.userInput 保留')
  assert(sessionResult.session.maxSteps === 5, 'session.maxSteps = 5 (覆盖配置 8)')
  assert(sessionResult.session.enableReflection === false, 'session.enableReflection=false (覆盖)')
  assert(sessionResult.session.createdBy === 'studio-tester', 'session.createdBy 保留')
  assert(sessionResult.session.tenantId === 'studio-test', 'session.tenantId 保留')
  assert(['COMPLETED', 'FAILED'].includes(sessionResult.session.status), 'session.status 是终态')
  if (sessionResult.session.status === 'COMPLETED') {
    assert(sessionResult.session.currentStep > 0, 'session.currentStep > 0')
    assert(sessionResult.session.finalOutput !== undefined, 'session.finalOutput 已生成')
    assert(sessionResult.execution.status === 'SUCCESS', 'execution.status === SUCCESS')
    assert(sessionResult.execution.llmCalls > 0, 'execution.llmCalls > 0')
  }

  // ── 3. batchRunAgent: 批量运行 ──
  console.log('\n[3] batchRunAgent 批量运行 3 个请求')
  const batchReq: BatchAgentRequest = {
    items: [
      { configId: created.id, userInput: '查询订单 #1' },
      { configId: created.id, userInput: '查询订单 #2' },
      { configId: created.id, userInput: '查询订单 #3', maxSteps: 3 }
    ],
    createdBy: 'studio-batch',
    tenantId: 'studio-test'
  }

  const batchResult = svc.batchExecute(batchReq)
  assert(batchResult.total === 3, 'batch.total === 3')
  assert(batchResult.succeeded === 3, 'batch.succeeded === 3')
  assert(batchResult.failed === 0, 'batch.failed === 0')
  assert(batchResult.results.length === 3, 'batch.results 长度 === 3')
  assert(batchResult.results[0].index === 0, 'results[0].index === 0')
  assert(batchResult.results[1].index === 1, 'results[1].index === 1')
  assert(batchResult.results[2].index === 2, 'results[2].index === 2')
  assert(batchResult.results[2].session.maxSteps === 3, 'results[2].session.maxSteps === 3 (per-item override)')
  assert(batchResult.results[0].session.createdBy === 'studio-batch', 'createdBy 传递正确')
  assert(batchResult.results[0].session.tenantId === 'studio-test', 'tenantId 传递正确')

  // ── 4. deleteAgentConfig: 删除 Config ──
  console.log('\n[4] deleteAgentConfig 删除 Config')
  const beforeDelete = svc.getConfigs().length
  const deleted = svc.deleteConfig(created.id)
  assert(deleted === true, 'deleteConfig 返回 true')
  const afterDelete = svc.getConfigs().length
  assert(afterDelete === beforeDelete - 1, '删除后 config 数量 -1')
  assert(svc.getConfig(created.id) === undefined, 'getConfig 返回 undefined (已删除)')

  const reDelete = svc.deleteConfig(created.id)
  assert(reDelete === false, '重复删除返回 false')

  // ── 5. 边界: 不存在的 configId 删除 ──
  console.log('\n[5] deleteConfig 不存在 id 返回 false')
  const ghostDelete = svc.deleteConfig('ghost-id-xxx')
  assert(ghostDelete === false, '删除不存在 id 返回 false')

  // ── 6. 边界: 不存在的 configId 启动会话失败 ──
  console.log('\n[6] createAndRunSession 不存在 config 抛错')
  let errorThrown = false
  let errorMessage = ''
  try {
    svc.createAndRunSession({
      configId: 'ghost-cfg',
      userInput: 'test',
      createdBy: 'studio',
      tenantId: 'studio-test'
    })
  } catch (e) {
    errorThrown = true
    errorMessage = e instanceof Error ? e.message : String(e)
  }
  assert(errorThrown, '不存在 config 触发错误')
  assert(errorMessage.includes('not found'), `错误信息包含 "not found" (实际: "${errorMessage}")`)

  // ── 7. 边界: 禁用的 config 启动会话失败 ──
  console.log('\n[7] createAndRunSession 禁用 config 抛错')
  const disabledCfg: AgentConfig = {
    id: `disabled-${Date.now()}`,
    name: 'Disabled',
    systemPrompt: 'x'.repeat(20),
    model: 'gpt-4o-mini',
    maxSteps: 5,
    enableReflection: false,
    allowedTools: [],
    timeoutMs: 10000,
    enabled: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    tenantId: 'studio-test'
  }
  svc.createConfig(disabledCfg)
  let disabledError = false
  let disabledMsg = ''
  try {
    svc.createAndRunSession({
      configId: disabledCfg.id,
      userInput: 'test',
      createdBy: 'studio',
      tenantId: 'studio-test'
    })
  } catch (e) {
    disabledError = true
    disabledMsg = e instanceof Error ? e.message : String(e)
  }
  assert(disabledError, '禁用 config 触发错误')
  assert(disabledMsg.includes('disabled'), `错误信息包含 "disabled" (实际: "${disabledMsg}")`)

  // ── 8. 更新 Config ──
  console.log('\n[8] updateConfig 更新字段')
  const updated = svc.updateConfig(disabledCfg.id, { name: 'Disabled (updated)', enabled: true })
  assert(updated !== undefined, 'updateConfig 返回对象')
  assert(updated?.name === 'Disabled (updated)', 'name 已更新')
  assert(updated?.enabled === true, 'enabled 已切换为 true')
  assert(updated?.id === disabledCfg.id, 'id 保持不变')

  // ── 9. stats 应包含新会话数据 ──
  console.log('\n[9] getStats 统计更新')
  const stats = svc.getStats('studio-test')
  assert(stats.tenantId === 'studio-test', 'stats.tenantId 正确')
  assert(stats.totalSessions >= 4, 'stats.totalSessions >= 4 (1 single + 3 batch)')
  assert(stats.completedSessions >= 4, 'stats.completedSessions >= 4')
  assert(stats.avgSteps > 0, 'stats.avgSteps > 0')

  // ── 总览 ──
  console.log(`\n=== 结果: ${passed} 通过, ${failed} 失败 ===`)
  if (failed > 0) {
    console.log('\n失败项:')
    failures.forEach((f) => console.log(`  - ${f}`))
    process.exit(1)
  }
  process.exit(0)
}

main().catch((err) => {
  console.error('E2E crashed:', err)
  process.exit(2)
})