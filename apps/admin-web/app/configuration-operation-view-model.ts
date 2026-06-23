import {
  type ConfigurationGovernanceMetadataEntry,
  type ConfigurationGovernanceMetadataStatus,
  buildConfigurationHref,
  buildConfigurationOperationDetailHref,
  buildFoundationWorkspaceHref
} from '@m5/types';
import { ApiClient, getDefaultApiBaseUrl } from '@m5/sdk';
import { adminGovernanceApprovalsRoute } from './approvals-data';
import { buildAuditTrailHref } from './audit-trail-view-model';

export interface ConfigurationOperationDetailHrefOptions {
  consumer?: string;
  tenantId?: string;
  brandId?: string;
  storeId?: string;
  marketCode?: string;
}

export interface ConfigurationOperationDetailDelivery {
  deliveryMode: 'api' | 'fallback';
  generatedAt: string;
  operation: string;
  entry: ConfigurationGovernanceMetadataEntry | null;
  related: ConfigurationGovernanceMetadataEntry[];
  notFound: boolean;
}

export interface ConfigurationOperationDeepLinks {
  approvalsHref: string;
  auditHref: string;
  foundationHref: string;
  workspaceHref: string;
  operationHref: string;
}

const FALLBACK_TENANT_ID = 'tenant-demo';

const APPROVAL_STATUS_LABEL: Record<ConfigurationGovernanceMetadataStatus, string> = {
  NOT_REQUIRED: '无需审批',
  PENDING: '审批中',
  APPROVED: '已通过',
  REJECTED: '已驳回',
  CANCELLED: '已撤回',
  SUPERSEDED: '已替代'
} as Record<ConfigurationGovernanceMetadataStatus, string>;

const APPROVAL_STATUS_VARIANT: Record<
  ConfigurationGovernanceMetadataStatus,
  'success' | 'warning' | 'danger' | 'neutral' | 'info'
> = {
  NOT_REQUIRED: 'neutral',
  PENDING: 'warning',
  APPROVED: 'success',
  REJECTED: 'danger',
  CANCELLED: 'neutral',
  SUPERSEDED: 'info'
} as Record<ConfigurationGovernanceMetadataStatus, 'success' | 'warning' | 'danger' | 'neutral' | 'info'>;

function createClient(): ApiClient {
  return new ApiClient({
    baseUrl: getDefaultApiBaseUrl(),
    tenantId: FALLBACK_TENANT_ID,
    brandId: 'brand-demo',
    storeId: 'store-001',
    marketCode: 'cn-mainland'
  });
}

function fallbackEntry(operation: string): ConfigurationGovernanceMetadataEntry {
  return {
    operation,
    rbac: {
      resource: 'configuration-governance',
      action: 'fallback-read',
      requiredRoles: ['SUPER_ADMIN', 'TENANT_ADMIN'],
      requiredPermissions: ['foundation.governance.read']
    },
    approval: {
      required: false,
      approvalId: null,
      version: null,
      requestedBy: null,
      ticket: null,
      status: 'NOT_REQUIRED',
      submitted: false,
      persisted: false,
      decidedBy: null,
      decidedAt: null,
      updatedAt: null,
      execution: {
        attempts: 0,
        executed: false,
        executionStatus: null,
        executedAt: null,
        executedBy: null
      }
    }
  };
}

export function getConfigurationOperationApprovalLabel(
  status: ConfigurationGovernanceMetadataStatus
): string {
  return APPROVAL_STATUS_LABEL[status] ?? status;
}

export function getConfigurationOperationApprovalVariant(
  status: ConfigurationGovernanceMetadataStatus
): 'success' | 'warning' | 'danger' | 'neutral' | 'info' {
  return APPROVAL_STATUS_VARIANT[status] ?? 'neutral';
}

export function buildConfigurationOperationDeepLinks(
  entry: ConfigurationGovernanceMetadataEntry,
  options: ConfigurationOperationDetailHrefOptions = {}
): ConfigurationOperationDeepLinks {
  const operationHref = buildConfigurationOperationDetailHref(entry.operation);
  const auditHref = buildAuditTrailHref({
    source: 'configuration-governance',
    purpose: `configuration-${entry.operation}`,
    limit: 50
  });
  const foundationHref = buildFoundationWorkspaceHref({
    moduleKey: 'configuration-governance',
    consumer: options.consumer ?? 'workbench'
  });
  const approvalsHref = entry.approval.required
    ? `${adminGovernanceApprovalsRoute.href}?status=${entry.approval.status === 'PENDING' ? 'PENDING' : 'ALL'}`
    : adminGovernanceApprovalsRoute.href;
  const workspaceHref = buildConfigurationHref({
    tenantId: options.tenantId,
    brandId: options.brandId,
    storeId: options.storeId,
    marketCode: options.marketCode
  });

  return { approvalsHref, auditHref, foundationHref, workspaceHref, operationHref };
}

export async function loadConfigurationOperationDetail(
  operation: string,
  init: RequestInit = {}
): Promise<ConfigurationOperationDetailDelivery> {
  if (!operation || operation.trim().length === 0) {
    return {
      deliveryMode: 'fallback',
      generatedAt: new Date().toISOString(),
      operation,
      entry: null,
      related: [],
      notFound: true
    };
  }

  try {
    const items = await createClient().getConfigurationManagementMetadata(init);
    const matched = items.find((item) => item.operation === operation);
    if (!matched) {
      return {
        deliveryMode: 'api',
        generatedAt: new Date().toISOString(),
        operation,
        entry: null,
        related: items.filter((item) => item.operation !== operation).slice(0, 4),
        notFound: true
      };
    }
    return {
      deliveryMode: 'api',
      generatedAt: new Date().toISOString(),
      operation,
      entry: matched,
      related: items.filter((item) => item.operation !== operation).slice(0, 4),
      notFound: false
    };
  } catch {
    return {
      deliveryMode: 'fallback',
      generatedAt: new Date().toISOString(),
      operation,
      entry: fallbackEntry(operation),
      related: [],
      notFound: false
    };
  }
}

export {
  buildConfigurationOperationDetailHref,
  buildConfigurationHref,
  buildFoundationWorkspaceHref
};
