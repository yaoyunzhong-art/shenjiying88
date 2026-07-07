// scripts/phase24-e2e-agent.ts
// Phase-24 T103 E2E 验证 — 直接调用 AgentService,验证 15 个端点业务逻辑
// (绕开 HTTP/Nest 启动,绕过 PostgreSQL 依赖)

import { AgentService } from '../src/modules/agent/agent.service'
import { ToolRegistry } from '../src/modules/agent/tool-registry'

const service = new AgentService(new ToolRegistry())

let pass = 0
let fail = 0
const failures: string[] = []

function assert(label: string, cond: boolean, detail?: unknown) {
  if (cond) {
    pass++
    console.log(`✅ ${label}`)
  } else {
    fail++
    failures.push(label)
    console.log(`❌ ${label}${detail ? ' — ' + JSON.stringify(detail).slice(0, 200) : ''}`)
  }
}

async function main() {
  console.log('═══ Phase-24 T103 — Agent E2E 验证 (协议对齐后) ═══\n')

  // ── Configs (5 端点) ──
  console.log('📋 Configs 端点')
  const configs = service.getConfigs()
  assert('GET /agent/configs 返回数组', Array.isArray(configs))
  assert('configs 至少 1 条', configs.length >= 1, { count: configs.length })

  const firstConfig = configs[0]
  assert('GET /agent/configs/:id 返回单个', service.getConfig(firstConfig.id)?.id === firstConfig.id)

  const newConfig = service.createConfig({
    id: 'e2e-test-cfg',
    name: 'E2E 测试配置',
    systemPrompt: 'You are a test agent.',
    model: 'deepseek-v4',
    maxSteps: 5,
    enableReflection: true,
    allowedTools: ['calculator'],
    timeoutMs: 10000,
    enabled: true,
    tenantId: 'tenant-test'
  })
  assert('POST /agent/configs 创建成功', newConfig.id === 'e2e-test-cfg')

  const updated = service.updateConfig('e2e-test-cfg', { name: 'E2E 测试配置 (已更新)' })
  assert('PUT /agent/configs/:id 更新成功', updated?.name.includes('已更新'))

  // ── Sessions (Run + Batch) ──
  console.log('\n🤖 Sessions 端点 (Run + Batch)')
  const runResult = await service.createAndRunSession({
    configId: firstConfig.id,
    userInput: '测试用户输入',
    createdBy: 'user-e2e',
    tenantId: 'tenant-test'
  })
  assert('POST /agent/sessions/run 返回 session', typeof runResult.session === 'object')
  assert('POST /agent/sessions/run 返回 execution', typeof runResult.execution === 'object')
  assert('result.session.userInput === 输入', runResult.session.userInput === '测试用户输入')
  assert('result.session.status 是 SessionStatus', typeof runResult.session.status === 'string')
  assert('result.execution.steps >= 0', runResult.execution.steps >= 0)
  assert('result.execution.totalDurationMs >= 0', runResult.execution.totalDurationMs >= 0)
  assert('result.timestamp 是 ISO 字符串', /^\d{4}-\d{2}-\d{2}T/.test(runResult.timestamp))

  const batchResult = await service.batchExecute({
    items: [
      { configId: firstConfig.id, userInput: '查询1' },
      { configId: firstConfig.id, userInput: '查询2' }
    ],
    createdBy: 'user-e2e',
    tenantId: 'tenant-test'
  })
  assert('POST /agent/sessions/batch 返回 total', batchResult.total === 2)
  assert('batch succeeded + failed === total',
    batchResult.succeeded + batchResult.failed === batchResult.total)
  assert('batch.results 长度 === total', batchResult.results.length === batchResult.total)

  // ── Session List/Get/Execution/Evaluation ──
  console.log('\n📊 Session 详情端点')
  const sessions = service.getSessions()
  assert('GET /agent/sessions 返回数组', Array.isArray(sessions))

  const sessionId = runResult.session.id
  assert('GET /agent/sessions/:id 返回 session', service.getSession(sessionId)?.id === sessionId)

  const execution = service.getSessionExecution(sessionId)
  assert('GET /agent/sessions/:id/execution 返回 execution', execution?.sessionId === sessionId)
  assert('execution 含 llmCalls/toolCalls/duration 字段',
    typeof execution?.llmCalls === 'number' &&
    typeof execution?.toolCalls === 'number' &&
    typeof execution?.totalDurationMs === 'number')

  const evaluation = service.getEvaluation(sessionId)
  // evaluation 可能为空 (取决于 service 是否自动评估)
  if (evaluation) {
    assert('GET /agent/sessions/:id/evaluation 字段结构正确',
      typeof evaluation.overallScore === 'number' &&
      typeof evaluation.relevanceScore === 'number')
  } else {
    console.log('ℹ️  service 未自动评估,跳过 evaluation 字段检查')
  }

  // ── Evaluations ──
  console.log('\n⭐ Evaluations 端点')
  const evaluations = service.getEvaluations()
  assert('GET /agent/evaluations 返回数组', Array.isArray(evaluations))

  // ── Stats ──
  console.log('\n📈 Stats 端点')
  const stats = service.getStats('tenant-test')
  assert('GET /agent/stats 返回 totalSessions >= 0', stats.totalSessions >= 0)
  assert('stats 含 avgSteps/avgDurationMs/avgLlmCalls/avgQualityScore',
    typeof stats.avgSteps === 'number' &&
    typeof stats.avgDurationMs === 'number' &&
    typeof stats.avgLlmCalls === 'number' &&
    typeof stats.avgQualityScore === 'number')

  // ── Tools ──
  console.log('\n🔧 Tools 端点')
  const tools = service.getTools()
  assert('GET /agent/tools 返回数组', Array.isArray(tools))
  assert('tools 至少 1 个 (calculator)', tools.length >= 1, { count: tools.length })

  // ── Delete ──
  console.log('\n🗑️  Delete 端点')
  const deleted = service.deleteConfig('e2e-test-cfg')
  assert('DELETE /agent/configs/:id 返回 true', deleted === true)

  // ── 总结 ──
  console.log(`\n═══════════════════════════════════════`)
  console.log(`✅ 通过: ${pass}`)
  console.log(`❌ 失败: ${fail}`)
  if (failures.length > 0) {
    console.log(`\n失败项:`)
    failures.forEach((f) => console.log(`  - ${f}`))
  }
  console.log(`═══════════════════════════════════════\n`)
  process.exit(fail > 0 ? 1 : 0)
}

main().catch((e) => {
  console.error('E2E 验证异常:', e)
  process.exit(2)
})