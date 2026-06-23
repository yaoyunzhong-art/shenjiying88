import { ApiClient, getDefaultApiBaseUrl } from '@m5/sdk';
import type {
  FoundationBootstrapResponse,
  FoundationConsumerDescriptor,
  FoundationGovernanceBaseline,
  FoundationModuleDescriptor,
  FoundationModuleKey,
  FoundationOperationsOverviewResponse,
  FoundationWorkspaceQuery
} from '@m5/types';

const FALLBACK_TENANT_ID = 'tenant-demo';
const FALLBACK_BRAND_ID = 'brand-demo';
const FALLBACK_STORE_ID = 'store-001';
const FALLBACK_MARKET_CODE = 'cn-mainland';
const DEFAULT_MODULE_KEY: FoundationModuleKey = 'trust-governance';
const DEFAULT_CONSUMER = 'workbench';

interface FoundationModuleHealth {
  module: string;
  score: number;
  status: 'healthy' | 'warning' | 'critical';
  indicators: {
    highRiskAudits: number;
    pendingApprovals: number;
    executionFailures: number;
    blockedCount: number;
  };
}

export interface FoundationModuleDetailSnapshot {
  generatedAt: string;
  moduleKey: string;
  health?: FoundationModuleHealth;
  detail?: unknown;
  availableModuleKeys?: string[];
}

export interface FoundationWorkspaceData {
  generatedAt: string;
  blueprint: Pick<
    FoundationBootstrapResponse,
    'generatedAt' | 'docs' | 'guardrails' | 'modules' | 'consumers' | 'governanceBaselines'
  >;
  overview: FoundationOperationsOverviewResponse;
  selectedModule: FoundationModuleDescriptor | null;
  selectedModuleDetail: FoundationModuleDetailSnapshot;
  selectedConsumer: FoundationConsumerDescriptor | null;
  summary: {
    modules: number;
    capabilities: number;
    consumers: number;
    governanceBaselines: number;
    alerts: number;
    topRisks: number;
  };
}

export interface FoundationWorkspaceSnapshot {
  deliveryMode: 'api' | 'fallback';
  generatedAt: string;
  query: Required<FoundationWorkspaceQuery>;
  workspace: FoundationWorkspaceData;
}

function createFoundationWorkspaceClient() {
  return new ApiClient({
    baseUrl: getDefaultApiBaseUrl(),
    tenantId: FALLBACK_TENANT_ID,
    brandId: FALLBACK_BRAND_ID,
    storeId: FALLBACK_STORE_ID,
    marketCode: FALLBACK_MARKET_CODE
  });
}

function normalizeQuery(query: FoundationWorkspaceQuery = {}): Required<FoundationWorkspaceQuery> {
  return {
    moduleKey: query.moduleKey ?? DEFAULT_MODULE_KEY,
    consumer: query.consumer ?? DEFAULT_CONSUMER
  };
}

function buildFallbackModules(): FoundationModuleDescriptor[] {
  return [
    {
      key: 'identity-access',
      name: 'Identity Access',
      purpose: '统一 actor、角色、权限与租户边界校验。',
      inboundContracts: ['x-actor-* headers', 'tenant context'],
      outboundContracts: ['identity validation result'],
      capabilities: []
    },
    {
      key: 'configuration-governance',
      name: 'Configuration Governance',
      purpose: '统一功能开关、配置项、密钥和证书治理。',
      inboundContracts: ['config snapshot requests', 'approval context'],
      outboundContracts: ['feature flags', 'config entries', 'secret posture'],
      capabilities: []
    },
    {
      key: 'integration-orchestration',
      name: 'Integration Orchestration',
      purpose: '统一 webhook、事件信封、幂等与外部系统编排。',
      inboundContracts: ['webhook ingest', 'domain event publish'],
      outboundContracts: ['event envelopes', 'idempotency records'],
      capabilities: []
    },
    {
      key: 'trust-governance',
      name: 'Trust Governance',
      purpose: '统一审计、审批、风控与限流治理。',
      inboundContracts: ['audit logs', 'approval tickets'],
      outboundContracts: ['audit trail', 'rate-limit ledgers'],
      capabilities: []
    },
    {
      key: 'resilience-operations',
      name: 'Resilience Operations',
      purpose: '统一观测、重试、恢复与演练作战信息。',
      inboundContracts: ['signal ingestion', 'recovery plan reads'],
      outboundContracts: ['observability signals', 'recovery plans'],
      capabilities: []
    },
    {
      key: 'runtime-governance',
      name: 'Runtime Governance',
      purpose: '统一提交、同步、回调与 replay 真实执行闭环。',
      inboundContracts: ['runtime action submit', 'callback'],
      outboundContracts: ['runtime receipts', 'replay states'],
      capabilities: []
    }
  ];
}

function buildFallbackConsumers(): FoundationConsumerDescriptor[] {
  return [
    {
      consumer: 'market',
      modulePath: 'src/modules/market',
      dependsOn: ['identity-access', 'configuration-governance', 'trust-governance', 'resilience-operations'],
      responsibility: '输出多市场默认值、覆盖链和区域配置快照。',
      handoffContracts: ['market bootstrap'],
      recommendedSequence: ['/api/v1/foundation/bootstrap', '/api/v1/markets/bootstrap'],
      governanceTouchpoints: ['/api/v1/foundation/bootstrap'],
      highRiskEntrypoints: [],
      actionGovernanceExamples: [],
      runtimeHandoffExamples: [],
      runtimeReceiptExamples: [],
      governanceAlertLifecycleExamples: []
    },
    {
      consumer: 'portal',
      modulePath: 'src/modules/portal',
      dependsOn: [
        'identity-access',
        'configuration-governance',
        'integration-orchestration',
        'trust-governance',
        'resilience-operations'
      ],
      responsibility: '装配 ToB/ToC 门户解析、域名策略和通知能力。',
      handoffContracts: ['portal bootstrap', 'notification handoff'],
      recommendedSequence: ['/api/v1/foundation/bootstrap', '/api/v1/portals/bootstrap'],
      governanceTouchpoints: ['/api/v1/foundation/bootstrap'],
      highRiskEntrypoints: [],
      actionGovernanceExamples: [],
      runtimeHandoffExamples: [],
      runtimeReceiptExamples: [],
      governanceAlertLifecycleExamples: []
    },
    {
      consumer: 'workbench',
      modulePath: 'src/modules/workbench',
      dependsOn: [
        'identity-access',
        'configuration-governance',
        'integration-orchestration',
        'trust-governance',
        'resilience-operations'
      ],
      responsibility: '装配 PC/PAD 工作台导航、权限边界与治理入口。',
      handoffContracts: ['workbench bootstrap', 'foundation alerts'],
      recommendedSequence: ['/api/v1/foundation/bootstrap', '/api/v1/workbenches/bootstrap'],
      governanceTouchpoints: ['/api/v1/foundation/overview/alerts/catalog'],
      highRiskEntrypoints: ['approval-execution', 'runtime-replay'],
      actionGovernanceExamples: [],
      runtimeHandoffExamples: [],
      runtimeReceiptExamples: [],
      governanceAlertLifecycleExamples: []
    },
    {
      consumer: 'lyt-adapter',
      modulePath: 'src/modules/lyt',
      dependsOn: ['identity-access', 'configuration-governance', 'integration-orchestration', 'resilience-operations'],
      responsibility: '承接 LYT 对接能力、webhook 与 capability readiness。',
      handoffContracts: ['webhook callback', 'capability readiness'],
      recommendedSequence: ['/api/v1/foundation/bootstrap', '/api/v1/lyt/connection/:storeId/readiness'],
      governanceTouchpoints: ['/api/v1/foundation/overview'],
      highRiskEntrypoints: [],
      actionGovernanceExamples: [],
      runtimeHandoffExamples: [],
      runtimeReceiptExamples: [],
      governanceAlertLifecycleExamples: []
    }
  ];
}

function buildFallbackGovernanceBaselines(): FoundationGovernanceBaseline[] {
  return [
    {
      key: 'tenant-scope',
      name: '租户边界',
      ownerModule: 'identity-access',
      summary: '所有治理动作必须绑定 tenant scope。',
      controls: ['租户校验', '角色校验'],
      evidence: ['identity-access validation']
    },
    {
      key: 'approval-trace',
      name: '审批留痕',
      ownerModule: 'trust-governance',
      summary: '高风险动作需审批、审计和运行回执闭环。',
      controls: ['approval', 'audit', 'runtime receipt'],
      evidence: ['audit trail', 'approval detail']
    },
    {
      key: 'recovery-readiness',
      name: '恢复预案',
      ownerModule: 'resilience-operations',
      summary: '异常场景需具备重试、演练与恢复计划。',
      controls: ['retry policy', 'recovery plan'],
      evidence: ['resilience overview']
    }
  ];
}

function buildFallbackOverview(generatedAt: string): FoundationOperationsOverviewResponse {
  return {
    generatedAt,
    summary: {
      approvalsPending: 0,
      approvalsWithFailures: 0,
      highRiskAudits: 0,
      blockedLedgers: 0,
      rotationDueSecrets: 0,
      expiredSecrets: 0,
      expiringCertificates: 0,
      expiredCertificates: 0,
      degradedSignals: 0,
      attentionRecoveryPlans: 0,
      staleDrills: 0,
      runtimeGovernanceBacklog: 0,
      stalledRuntimeCallbacks: 0,
      highRiskRuntimeBacklog: 0,
      runtimeBlockedActions: 0
    },
    alerts: [],
    topRisks: []
  };
}

function buildFallbackModuleDetail(moduleKey: string, generatedAt: string): FoundationModuleDetailSnapshot {
  return {
    generatedAt,
    moduleKey,
    health: {
      module: moduleKey,
      score: 88,
      status: 'healthy',
      indicators: {
        highRiskAudits: 0,
        pendingApprovals: 0,
        executionFailures: 0,
        blockedCount: 0
      }
    },
    detail: { source: 'fallback' }
  };
}

function toBlueprintSubset(
  bootstrap: Pick<
    FoundationBootstrapResponse,
    'generatedAt' | 'docs' | 'guardrails' | 'modules' | 'consumers' | 'governanceBaselines'
  >
) {
  return {
    generatedAt: bootstrap.generatedAt,
    docs: bootstrap.docs,
    guardrails: bootstrap.guardrails,
    modules: bootstrap.modules,
    consumers: bootstrap.consumers,
    governanceBaselines: bootstrap.governanceBaselines
  };
}

function buildWorkspaceData(
  blueprint: Pick<
    FoundationBootstrapResponse,
    'generatedAt' | 'docs' | 'guardrails' | 'modules' | 'consumers' | 'governanceBaselines'
  >,
  overview: FoundationOperationsOverviewResponse,
  selectedModuleDetail: FoundationModuleDetailSnapshot,
  query: Required<FoundationWorkspaceQuery>
): FoundationWorkspaceData {
  const selectedModule = blueprint.modules.find((item) => item.key === query.moduleKey) ?? null;
  const selectedConsumer = blueprint.consumers.find((item) => item.consumer === query.consumer) ?? null;
  const capabilities = blueprint.modules.reduce((total, item) => total + item.capabilities.length, 0);

  return {
    generatedAt: blueprint.generatedAt,
    blueprint,
    overview,
    selectedModule,
    selectedModuleDetail,
    selectedConsumer,
    summary: {
      modules: blueprint.modules.length,
      capabilities,
      consumers: blueprint.consumers.length,
      governanceBaselines: blueprint.governanceBaselines.length,
      alerts: overview.alerts.length,
      topRisks: overview.topRisks.length
    }
  };
}

export async function loadFoundationWorkspace(
  query: FoundationWorkspaceQuery = {},
  init: RequestInit = {}
): Promise<FoundationWorkspaceSnapshot> {
  const normalized = normalizeQuery(query);
  const client = createFoundationWorkspaceClient();

  try {
    const [bootstrap, overview, selectedModuleDetail] = await Promise.all([
      client.getFoundationBootstrap(init),
      client.getFoundationOverview(init),
      client.getFoundationModuleDetail(normalized.moduleKey, init)
    ]);

    const blueprint = toBlueprintSubset(bootstrap);
    return {
      deliveryMode: 'api',
      generatedAt: new Date().toISOString(),
      query: normalized,
      workspace: buildWorkspaceData(blueprint, overview, selectedModuleDetail, normalized)
    };
  } catch {
    const generatedAt = new Date().toISOString();
    const blueprint = {
      generatedAt,
      docs: ['docs/knowledge-base/frontend-foundation-consumption-kb.md'],
      guardrails: ['foundation bootstrap 优先', '治理读面失败时走 fallback 只读'],
      modules: buildFallbackModules(),
      consumers: buildFallbackConsumers(),
      governanceBaselines: buildFallbackGovernanceBaselines()
    };

    return {
      deliveryMode: 'fallback',
      generatedAt,
      query: normalized,
      workspace: buildWorkspaceData(
        blueprint,
        buildFallbackOverview(generatedAt),
        buildFallbackModuleDetail(normalized.moduleKey, generatedAt),
        normalized
      )
    };
  }
}

export function summarizeFoundationModule(module: FoundationModuleDescriptor) {
  return `${module.key} · capabilities ${module.capabilities.length}`;
}

export function summarizeFoundationConsumer(consumer: FoundationConsumerDescriptor) {
  return `${consumer.consumer} · dependsOn ${consumer.dependsOn.length} modules`;
}

export function summarizeGovernanceBaseline(baseline: FoundationGovernanceBaseline) {
  return `${baseline.ownerModule} · controls ${baseline.controls.length}`;
}

export function formatFoundationHealthLabel(status?: FoundationModuleHealth['status']) {
  if (status === 'critical') {
    return '高风险';
  }
  if (status === 'warning') {
    return '注意';
  }
  return '健康';
}
