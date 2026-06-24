import type {
  FoundationConsumerDescriptor,
  FoundationGovernanceBaseline,
  FoundationModuleDescriptor,
  FoundationWorkspaceQuery
} from '@m5/types';
import {
  buildFoundationModuleDetailHref,
  buildFoundationWorkspaceHref
} from '@m5/types';
import { adminGovernanceApprovalsRoute } from './approvals-data';
import { buildAuditTrailHref } from './audit-trail-view-model';
import {
  formatFoundationHealthLabel,
  loadFoundationWorkspace,
  summarizeFoundationConsumer,
  type FoundationModuleDetailSnapshot
} from './foundation-view-model';

export interface FoundationModuleDetail {
  deliveryMode: 'api' | 'fallback';
  generatedAt: string;
  query: Required<FoundationWorkspaceQuery>;
  moduleKey: string;
  module: FoundationModuleDescriptor | null;
  detail: FoundationModuleDetailSnapshot | null;
  healthLabel: string;
  consumers: FoundationConsumerDescriptor[];
  baselines: FoundationGovernanceBaseline[];
  notFound: boolean;
  moduleHref: string;
  workspaceHref: string;
  auditHref: string;
  approvalsHref: string;
}

export async function loadFoundationModuleDetail(
  moduleKey: string,
  query: FoundationWorkspaceQuery = {},
  init: RequestInit = {}
): Promise<FoundationModuleDetail> {
  const snapshot = await loadFoundationWorkspace({ ...query, moduleKey }, init);
  const moduleInfo =
    snapshot.workspace.blueprint.modules.find((item) => item.key === moduleKey) ?? null;
  const consumers = snapshot.workspace.blueprint.consumers.filter((item) =>
    item.dependsOn.includes(moduleKey as never)
  );
  const baselines = snapshot.workspace.blueprint.governanceBaselines.filter(
    (item) => item.ownerModule === moduleKey
  );
  const healthLabel = formatFoundationHealthLabel(
    snapshot.workspace.selectedModuleDetail.health?.status
  );

  return {
    deliveryMode: snapshot.deliveryMode,
    generatedAt: snapshot.generatedAt,
    query: snapshot.query,
    moduleKey,
    module: moduleInfo,
    detail: snapshot.workspace.selectedModuleDetail,
    healthLabel,
    consumers,
    baselines,
    notFound: !moduleInfo,
    moduleHref: buildFoundationModuleDetailHref(moduleKey),
    workspaceHref: buildFoundationWorkspaceHref(snapshot.query),
    auditHref: buildAuditTrailHref({
      source: 'foundation',
      purpose: `foundation-module:${moduleKey}`,
      limit: 50
    }),
    approvalsHref: adminGovernanceApprovalsRoute.href
  };
}

export function summarizeFoundationModuleDetail(snapshot: FoundationModuleDetail): string {
  if (!snapshot.module) {
    return `${snapshot.moduleKey} · 未在 blueprint 模块目录中`;
  }
  const capabilityCount = snapshot.module.capabilities.length;
  const consumerCount = snapshot.consumers.length;
  const baselineCount = snapshot.baselines.length;
  return `${snapshot.module.name} · ${capabilityCount} capabilities · ${consumerCount} consumers · ${baselineCount} baselines`;
}

export function formatFoundationIndicator(
  detail: FoundationModuleDetailSnapshot | null
): {
  highRiskAudits: number;
  pendingApprovals: number;
  executionFailures: number;
  blockedCount: number;
} {
  return {
    highRiskAudits: detail?.health?.indicators.highRiskAudits ?? 0,
    pendingApprovals: detail?.health?.indicators.pendingApprovals ?? 0,
    executionFailures: detail?.health?.indicators.executionFailures ?? 0,
    blockedCount: detail?.health?.indicators.blockedCount ?? 0
  };
}

export function summarizeConsumerForModule(consumer: FoundationConsumerDescriptor): string {
  return summarizeFoundationConsumer(consumer);
}
