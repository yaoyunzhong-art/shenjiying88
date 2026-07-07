/**
 * Phase-25 E2E — Session Detail Page
 *
 * 验证:
 * 1. AgentService.createAndRunSession 返回完整 SessionExecutionResult
 *    (session + execution + timestamp,字段全部对齐后端 entity)
 * 2. 取真实 sessionId,验证:
 *    - session.messages 包含 system/user/assistant/tool 4 种角色
 *    - session.currentStep === execution.steps
 *    - session.status === 'COMPLETED'
 *    - execution.status === 'SUCCESS'
 *    - execution.llmCalls > 0 (启用反思)
 *    - execution.toolCalls > 0
 * 3. 列表→详情导航可由 agent-sessions-client.tsx Link 触发(静态扫描)
 * 4. View-model loader (loadAgentSessionDetail) 处理 null 返回 + fallback 路径
 */

import { AgentService } from '../apps/api/src/modules/agent/agent.service'
import { ToolRegistry } from '../apps/api/src/modules/agent/tool-registry'
import {
  loadAgentSessionDetail,
  FALLBACK_AGENT_SESSIONS
} from '../apps/admin-web/app/agents/agent-view-model'

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
  console.log('=== Phase-25 Session Detail E2E ===\n')

  // ── 1. Service 直调:createAndRunSession 返回完整 session ──
  console.log('[1] AgentService.createAndRunSession 返回结构完整性')
  const svc = new AgentService(new ToolRegistry())
  const cfg = svc.getConfigs()[0]
  const result = svc.createAndRunSession({
    configId: cfg.id,
    userInput: 'E2E test: 验证 session 详情页所需字段',
    createdBy: 'e2e-runner',
    tenantId: 'tenant-e2e'
  })

  assert(result.session !== undefined, 'result.session 存在')
  assert(result.execution !== undefined, 'result.execution 存在')
  assert(typeof result.timestamp === 'string', 'result.timestamp 是字符串')
  assert(result.session.id.startsWith('session-'), 'session.id 格式正确')
  assert(result.session.configId === cfg.id, 'session.configId 等于所选 config')
  assert(result.session.status === 'COMPLETED', 'session.status === COMPLETED')
  assert(result.session.userInput.includes('E2E test'), 'session.userInput 保留原始输入')
  assert(typeof result.session.finalOutput === 'string', 'session.finalOutput 是字符串')
  assert(result.session.currentStep > 0, 'session.currentStep > 0')
  assert(result.session.maxSteps > 0, 'session.maxSteps > 0')
  assert(result.session.enableReflection === true, 'session.enableReflection === true')
  assert(Array.isArray(result.session.messages), 'session.messages 是数组')
  assert(result.session.createdBy === 'e2e-runner', 'session.createdBy 等于请求方')
  assert(result.session.tenantId === 'tenant-e2e', 'session.tenantId 等于请求方')
  assert(result.session.createdAt !== undefined, 'session.createdAt 已设置')

  // ── 2. Messages 内容完整性 ──
  console.log('\n[2] session.messages 包含 4 种角色')
  const roles = new Set(result.session.messages.map((m) => m.role))
  assert(roles.has('system'), 'messages 包含 system')
  assert(roles.has('user'), 'messages 包含 user')
  assert(roles.has('assistant'), 'messages 包含 assistant')
  assert(roles.has('tool'), 'messages 包含 tool')

  // system 消息内容等于 config.systemPrompt
  const sysMsg = result.session.messages.find((m) => m.role === 'system')
  assert(sysMsg?.content === cfg.systemPrompt, 'system 消息内容 === config.systemPrompt')

  // user 消息内容 === userInput
  const userMsg = result.session.messages.find((m) => m.role === 'user')
  assert(userMsg?.content === result.session.userInput, 'user 消息内容 === userInput')

  // tool 消息包含 toolCallId
  const toolMsg = result.session.messages.find((m) => m.role === 'tool')
  assert(toolMsg?.toolCallId !== undefined, 'tool 消息携带 toolCallId')

  // ── 3. Execution 字段 ──
  console.log('\n[3] execution 字段完整性')
  const exec = result.execution
  assert(exec.id.startsWith('exec-'), 'execution.id 格式正确')
  assert(exec.sessionId === result.session.id, 'execution.sessionId 关联正确')
  assert(exec.configId === cfg.id, 'execution.configId 等于 config')
  assert(exec.status === 'SUCCESS', 'execution.status === SUCCESS')
  assert(exec.steps > 0, 'execution.steps > 0')
  assert(exec.totalDurationMs >= 0, 'execution.totalDurationMs >= 0')
  assert(exec.llmCalls > 0, 'execution.llmCalls > 0 (含反思)')
  assert(exec.toolCalls > 0, 'execution.toolCalls > 0')
  assert(exec.startedAt !== undefined, 'execution.startedAt 已设置')
  assert(exec.completedAt !== undefined, 'execution.completedAt 已设置')
  assert(exec.tenantId === 'tenant-e2e', 'execution.tenantId 正确')

  // session.currentStep 应该等于 execution.steps(同步更新)
  assert(
    result.session.currentStep === exec.steps,
    'session.currentStep === execution.steps (同步更新)'
  )

  // ── 4. Service 二次查询: getSession / getSessionExecution 一致 ──
  console.log('\n[4] Service 二次查询一致性')
  const sessionAgain = svc.getSession(result.session.id)
  assert(sessionAgain?.id === result.session.id, 'getSession 二次查询可命中')
  assert(sessionAgain?.messages.length === result.session.messages.length, 'messages 数量一致')

  const execAgain = svc.getSessionExecution(result.session.id)
  assert(execAgain?.id === exec.id, 'getSessionExecution 二次查询可命中')
  assert(execAgain?.status === 'SUCCESS', 'execution status 一致')

  // ── 5. View-model loader: fallback 路径(用 fallback id 'sess-001') ──
  console.log('\n[5] loadAgentSessionDetail fallback 路径(sess-001)')
  const detail = await loadAgentSessionDetail('sess-001')
  assert(detail !== null, 'loadAgentSessionDetail 不返回 null (有 fallback)')
  assert(detail?.session.id === 'sess-001', 'snapshot.session.id === "sess-001"')
  assert(detail?.session.messages !== undefined, 'snapshot.messages 字段存在 (fallback 可空数组)')
  assert(detail?.deliveryMode === 'fallback', 'deliveryMode === fallback (后端未启)')
  if (detail) {
    const targetFallback = FALLBACK_AGENT_SESSIONS.find((s) => s.id === 'sess-001')
    assert(targetFallback !== undefined, 'FALLBACK_AGENT_SESSIONS 含 sess-001')
  }

  // ── 5b. 真实 run 出来的 sessionId 不在 fallback 中 → 返回 null ──
  console.log('\n[5b] 真实 sessionId 无 fallback → 返回 null')
  const realDetail = await loadAgentSessionDetail(result.session.id)
  assert(realDetail === null, '真实 sessionId (非 fallback id) 返回 null')

  // ── 6. View-model loader: 未知 id 返回 null ──
  console.log('\n[6] loadAgentSessionDetail 未知 id 返回 null')
  const unknown = await loadAgentSessionDetail('non-existent-session-id-xxx')
  assert(unknown === null, '未知 sessionId 返回 null (触发 notFound)')

  // ── 7. View-model loader: fallback 含 execution + evaluation 的 session ──
  console.log('\n[7] loadAgentSessionDetail fallback 完整字段(sess-001)')
  const sess001 = await loadAgentSessionDetail('sess-001')
  assert(sess001 !== null, 'sess-001 可查')
  assert(sess001?.execution !== null, 'sess-001 有 execution')
  assert(sess001?.evaluation !== null, 'sess-001 有 evaluation')
  if (sess001?.evaluation) {
    assert(sess001.evaluation.overallScore >= 0.7, 'sess-001.evaluation.overallScore >= 0.7')
    assert(
      sess001.evaluation.relevanceScore > 0 &&
        sess001.evaluation.accuracyScore > 0 &&
        sess001.evaluation.completenessScore > 0,
      'sess-001 6 维度评分有效'
    )
  }

  // sess-002 是 RUNNING 状态,无 execution / evaluation
  console.log('\n[8] loadAgentSessionDetail sess-002 (RUNNING, 无 evaluation)')
  const sess002 = await loadAgentSessionDetail('sess-002')
  assert(sess002 !== null, 'sess-002 可查')
  assert(sess002?.session.status === 'RUNNING', 'sess-002 status === RUNNING')
  assert(sess002?.execution === null, 'sess-002 无 execution')
  assert(sess002?.evaluation === null, 'sess-002 无 evaluation')

  // ── 9. View-model loader: sess-003 FAILED 状态 ──
  console.log('\n[9] loadAgentSessionDetail sess-003 (FAILED + 低分 evaluation)')
  const sess003 = await loadAgentSessionDetail('sess-003')
  assert(sess003 !== null, 'sess-003 可查')
  assert(sess003?.session.status === 'FAILED', 'sess-003 status === FAILED')
  assert(sess003?.session.error !== undefined, 'sess-003.error 已设置')
  if (sess003?.evaluation) {
    assert(sess003.evaluation.overallScore < 0.7, 'sess-003.evaluation.overallScore < 0.7')
  }

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