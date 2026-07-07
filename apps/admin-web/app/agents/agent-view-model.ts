import { ApiClient, getDefaultApiBaseUrl } from '@m5/sdk';
import type {
  AgentConfig,
  AgentExecution,
  AgentSession,
  AgentSessionEvent,
  AgentStats,
  BatchAgentRequest,
  BatchAgentResponse,
  CreateSessionRequest,
  QualityEvaluation,
  SessionExecutionResult
} from '@m5/types';

export const FALLBACK_TENANT_ID = 'tenant-demo';
export const FALLBACK_USER_ID = 'user-demo';

export function createAgentClient() {
  return new ApiClient({
    baseUrl: getDefaultApiBaseUrl(),
    tenantId: FALLBACK_TENANT_ID
  });
}

const nowIso = () => new Date().toISOString();

// ── Fallback 数据 (后端不可达时降级,字段对齐后端 entity) ──

export const FALLBACK_AGENT_CONFIGS: AgentConfig[] = [
  {
    id: 'agent-cfg-cs',
    name: '客服 Agent',
    systemPrompt: '你是一个专业的客服 Agent,需要礼貌、耐心地回答用户问题。',
    model: 'deepseek-v4',
    maxSteps: 10,
    enableReflection: true,
    allowedTools: ['order_query', 'refund_create', 'knowledge_search'],
    timeoutMs: 30000,
    enabled: true,
    createdAt: '2026-04-12T09:30:00.000Z',
    updatedAt: '2026-06-20T14:15:00.000Z',
    tenantId: FALLBACK_TENANT_ID
  },
  {
    id: 'agent-cfg-sales',
    name: '销售助手 Agent',
    systemPrompt: '你是一个资深的销售助手,根据客户画像推荐合适的产品组合。',
    model: 'deepseek-v4',
    maxSteps: 12,
    enableReflection: true,
    allowedTools: ['product_search', 'quote_builder', 'crm_lookup'],
    timeoutMs: 45000,
    enabled: true,
    createdAt: '2026-03-08T10:00:00.000Z',
    updatedAt: '2026-06-22T11:20:00.000Z',
    tenantId: FALLBACK_TENANT_ID
  },
  {
    id: 'agent-cfg-ops',
    name: '运营分析 Agent',
    systemPrompt: '你是一个数据分析师,基于实时数据生成结构化的运营洞察。',
    model: 'deepseek-v4',
    maxSteps: 6,
    enableReflection: false,
    allowedTools: ['metrics_query', 'anomaly_detect'],
    timeoutMs: 20000,
    enabled: false,
    createdAt: '2026-05-15T08:00:00.000Z',
    updatedAt: '2026-06-18T17:30:00.000Z',
    tenantId: FALLBACK_TENANT_ID
  }
];

export const FALLBACK_AGENT_SESSIONS: AgentSession[] = [
  {
    id: 'sess-001',
    configId: 'agent-cfg-cs',
    status: 'COMPLETED',
    userInput: '请问订单 ORD-20260618-001 现在的状态?',
    finalOutput: '订单 ORD-20260618-001 当前状态为「已发货」,预计 6 月 28 日送达。',
    currentStep: 3,
    maxSteps: 10,
    enableReflection: true,
    messages: [],
    startedAt: '2026-06-26T08:12:00.000Z',
    completedAt: '2026-06-26T08:12:05.000Z',
    createdAt: '2026-06-26T08:12:00.000Z',
    createdBy: FALLBACK_USER_ID,
    tenantId: FALLBACK_TENANT_ID
  },
  {
    id: 'sess-002',
    configId: 'agent-cfg-sales',
    status: 'RUNNING',
    userInput: '为客户 ABC 公司推荐合适的企业套餐组合。',
    currentStep: 2,
    maxSteps: 12,
    enableReflection: true,
    messages: [],
    startedAt: '2026-06-26T09:45:00.000Z',
    createdAt: '2026-06-26T09:45:00.000Z',
    createdBy: FALLBACK_USER_ID,
    tenantId: FALLBACK_TENANT_ID
  },
  {
    id: 'sess-003',
    configId: 'agent-cfg-cs',
    status: 'FAILED',
    userInput: '我买的商品质量有问题,我要退货。',
    finalOutput: '工具 refund_create 调用超时 (3000ms)',
    currentStep: 5,
    maxSteps: 10,
    enableReflection: true,
    messages: [],
    error: '工具 refund_create 调用超时',
    startedAt: '2026-06-26T10:01:00.000Z',
    completedAt: '2026-06-26T10:01:03.000Z',
    createdAt: '2026-06-26T10:01:00.000Z',
    createdBy: FALLBACK_USER_ID,
    tenantId: FALLBACK_TENANT_ID
  }
];

export const FALLBACK_AGENT_STATS: AgentStats = {
  totalSessions: 1287,
  completedSessions: 1180,
  failedSessions: 104,
  runningSessions: 3,
  avgSteps: 4.2,
  avgDurationMs: 5230,
  avgLlmCalls: 3.8,
  avgQualityScore: 0.842,
  tenantId: FALLBACK_TENANT_ID,
  timestamp: nowIso()
};

export interface FallbackTool {
  name: string;
  description: string;
  category: string;
  riskLevel: 'low' | 'medium' | 'high';
  inputSchema?: {
    type: 'object';
    properties?: Record<string, unknown>;
    required?: string[];
  };
}

export const FALLBACK_AGENT_TOOLS: FallbackTool[] = [
  {
    name: 'order_query',
    description: '根据订单号查询订单详情、物流、支付状态。',
    category: 'commerce',
    riskLevel: 'low',
    inputSchema: {
      type: 'object',
      properties: { orderId: { type: 'string', description: '订单号' } },
      required: ['orderId']
    }
  },
  {
    name: 'refund_create',
    description: '为已完成订单发起退款流程。',
    category: 'commerce',
    riskLevel: 'high',
    inputSchema: {
      type: 'object',
      properties: { orderId: { type: 'string' }, reason: { type: 'string' }, amount: { type: 'number' } },
      required: ['orderId', 'reason']
    }
  },
  {
    name: 'knowledge_search',
    description: '在指定知识库中检索相关内容。',
    category: 'rag',
    riskLevel: 'low',
    inputSchema: {
      type: 'object',
      properties: { query: { type: 'string' }, knowledgeBaseIds: { type: 'array' } },
      required: ['query']
    }
  },
  {
    name: 'crm_lookup',
    description: '查询 CRM 中的客户档案与历史交互。',
    category: 'crm',
    riskLevel: 'medium',
    inputSchema: {
      type: 'object',
      properties: { customerId: { type: 'string' } },
      required: ['customerId']
    }
  }
];

export const FALLBACK_AGENT_EVALUATIONS: QualityEvaluation[] = [
  {
    id: 'eval-001',
    sessionId: 'sess-001',
    userInput: '请问订单 ORD-20260618-001 现在的状态?',
    agentOutput: '订单 ORD-20260618-001 当前状态为「已发货」,预计 6 月 28 日送达。',
    relevanceScore: 0.95,
    accuracyScore: 0.92,
    completenessScore: 0.88,
    safetyScore: 1.0,
    helpfulnessScore: 0.93,
    concisenessScore: 0.9,
    overallScore: 0.93,
    feedback: '准确识别用户意图,数据与订单系统一致,响应简洁。',
    evaluatedAt: '2026-06-26T08:12:07.000Z',
    evaluatedBy: 'eval-system',
    tenantId: FALLBACK_TENANT_ID
  },
  {
    id: 'eval-002',
    sessionId: 'sess-003',
    userInput: '我买的商品质量有问题,我要退货。',
    agentOutput: '工具 refund_create 调用超时 (3000ms)',
    relevanceScore: 0.7,
    accuracyScore: 0.4,
    completenessScore: 0.3,
    safetyScore: 1.0,
    helpfulnessScore: 0.2,
    concisenessScore: 0.5,
    overallScore: 0.52,
    feedback: '识别到退货意图但工具超时,用户未被有效服务。',
    evaluatedAt: '2026-06-26T10:01:05.000Z',
    evaluatedBy: 'eval-system',
    tenantId: FALLBACK_TENANT_ID
  }
];

// ── 业务封装 (含 fallback) ──

export interface AgentConfigsSnapshot {
  deliveryMode: 'api' | 'fallback';
  configs: AgentConfig[];
  error?: string;
}

export async function loadAgentConfigs(init?: RequestInit): Promise<AgentConfigsSnapshot> {
  try {
    const configs = await createAgentClient().listAgentConfigs(init);
    return { deliveryMode: 'api', configs };
  } catch (error) {
    return {
      deliveryMode: 'fallback',
      configs: FALLBACK_AGENT_CONFIGS,
      error: error instanceof Error ? error.message : 'unknown'
    };
  }
}

export interface AgentSessionsSnapshot {
  deliveryMode: 'api' | 'fallback';
  sessions: AgentSession[];
  stats: AgentStats;
  error?: string;
}

export async function loadAgentSessions(init?: RequestInit): Promise<AgentSessionsSnapshot> {
  try {
    const client = createAgentClient();
    const [sessions, stats] = await Promise.all([
      client.listAgentSessions(init),
      client.getAgentStats(init)
    ]);
    return { deliveryMode: 'api', sessions, stats };
  } catch (error) {
    return {
      deliveryMode: 'fallback',
      sessions: FALLBACK_AGENT_SESSIONS,
      stats: FALLBACK_AGENT_STATS,
      error: error instanceof Error ? error.message : 'unknown'
    };
  }
}

export interface AgentToolsSnapshot {
  deliveryMode: 'api' | 'fallback';
  tools: FallbackTool[];
  error?: string;
}

// ── Dashboard (Phase-29) ──

export interface AgentDashboardSnapshot {
  deliveryMode: 'api' | 'fallback';
  sessions: AgentSession[];
  runningCount: number;
  completedCount: number;
  failedCount: number;
  avgSteps: number;
  avgDurationMs: number;
  totalConfigs: number;
  totalExecutions: number;
  timestamp: string;
  error?: string;
}

export async function loadAgentDashboardSnapshot(
  init?: RequestInit
): Promise<AgentDashboardSnapshot> {
  try {
    const client = createAgentClient();
    const [sessions, stats] = await Promise.all([
      client.listAgentSessions(init),
      client.getAgentStats(init)
    ]);
    const configIds = new Set(sessions.map((s) => s.configId));
    return {
      deliveryMode: 'api',
      sessions,
      runningCount: stats.runningSessions,
      completedCount: stats.completedSessions,
      failedCount: stats.failedSessions,
      avgSteps: stats.avgSteps,
      avgDurationMs: stats.avgDurationMs,
      totalConfigs: configIds.size,
      totalExecutions: stats.totalSessions,
      timestamp: stats.timestamp
    };
  } catch (error) {
    const sessions = FALLBACK_AGENT_SESSIONS;
    return {
      deliveryMode: 'fallback',
      sessions,
      runningCount: sessions.filter((s) => s.status === 'RUNNING').length,
      completedCount: sessions.filter((s) => s.status === 'COMPLETED').length,
      failedCount: sessions.filter((s) => s.status === 'FAILED').length,
      avgSteps: FALLBACK_AGENT_STATS.avgSteps,
      avgDurationMs: FALLBACK_AGENT_STATS.avgDurationMs,
      totalConfigs: new Set(sessions.map((s) => s.configId)).size,
      totalExecutions: FALLBACK_AGENT_STATS.totalSessions,
      timestamp: nowIso(),
      error: error instanceof Error ? error.message : 'unknown'
    };
  }
}

export async function loadAgentTools(init?: RequestInit): Promise<AgentToolsSnapshot> {
  try {
    const tools = (await createAgentClient().listAgentTools(init)) as FallbackTool[];
    return { deliveryMode: 'api', tools };
  } catch (error) {
    return {
      deliveryMode: 'fallback',
      tools: FALLBACK_AGENT_TOOLS,
      error: error instanceof Error ? error.message : 'unknown'
    };
  }
}

export interface AgentEvaluationsSnapshot {
  deliveryMode: 'api' | 'fallback';
  evaluations: QualityEvaluation[];
  error?: string;
}

export async function loadAgentEvaluations(init?: RequestInit): Promise<AgentEvaluationsSnapshot> {
  try {
    const evaluations = await createAgentClient().listQualityEvaluations(init);
    return { deliveryMode: 'api', evaluations };
  } catch (error) {
    return {
      deliveryMode: 'fallback',
      evaluations: FALLBACK_AGENT_EVALUATIONS,
      error: error instanceof Error ? error.message : 'unknown'
    };
  }
}

// ── Session Detail (Phase-25) ──

export interface AgentSessionDetailSnapshot {
  deliveryMode: 'api' | 'fallback';
  session: AgentSession;
  execution: AgentExecution | null;
  evaluation: QualityEvaluation | null;
  config: AgentConfig | null;
  error?: string;
}

const FALLBACK_AGENT_EXECUTION: AgentExecution = {
  id: 'exec-fallback-1',
  sessionId: 'sess-001',
  configId: 'agent-cfg-cs',
  status: 'SUCCESS',
  steps: 3,
  totalDurationMs: 5230,
  llmCalls: 4,
  toolCalls: 3,
  startedAt: '2026-06-26T08:12:00.000Z',
  completedAt: '2026-06-26T08:12:05.000Z',
  tenantId: FALLBACK_TENANT_ID
};

export async function loadAgentSessionDetail(
  sessionId: string,
  init?: RequestInit
): Promise<AgentSessionDetailSnapshot | null> {
  try {
    const client = createAgentClient();
    const [session, execution, evaluation] = await Promise.all([
      client.getAgentSession(sessionId, init),
      client.getAgentExecution(sessionId, init).catch(() => null),
      client.getSessionEvaluation(sessionId, init).catch(() => null)
    ]);
    const config = await client.getAgentConfig(session.configId, init).catch(() => null);
    return {
      deliveryMode: 'api',
      session,
      execution,
      evaluation,
      config
    };
  } catch {
    const session = FALLBACK_AGENT_SESSIONS.find((s) => s.id === sessionId);
    if (!session) return null;
    const evaluation = FALLBACK_AGENT_EVALUATIONS.find((e) => e.sessionId === sessionId) ?? null;
    const config = FALLBACK_AGENT_CONFIGS.find((c) => c.id === session.configId) ?? null;
    const execution =
      session.id === 'sess-001' || session.id === 'sess-003' ? FALLBACK_AGENT_EXECUTION : null;
    return {
      deliveryMode: 'fallback',
      session,
      execution,
      evaluation,
      config,
      error: '后端不可达,展示 fallback 数据'
    };
  }
}

// ── 写操作 (无 fallback,失败抛错) ──

export async function submitAgentConfig(body: AgentConfig): Promise<AgentConfig> {
  return createAgentClient().createAgentConfig(body);
}

export async function runAgentSession(body: CreateSessionRequest): Promise<SessionExecutionResult> {
  return createAgentClient().runAgentSession(body);
}

export async function* runAgentSessionStream(
  body: CreateSessionRequest
): AsyncGenerator<AgentSessionEvent, void, undefined> {
  yield* createAgentClient().runAgentSessionStream(body);
}

export async function batchRunAgent(body: BatchAgentRequest): Promise<BatchAgentResponse> {
  return createAgentClient().batchRunAgent(body);
}

export async function deleteAgentConfig(id: string): Promise<{ deleted: boolean }> {
  return createAgentClient().deleteAgentConfig(id);
}