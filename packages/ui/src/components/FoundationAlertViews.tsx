'use client';
import React, { useCallback, useMemo, useState } from 'react';
import {
  type FoundationAlertCatalogItem,
  type FoundationAlertDrilldownResponse,
  type FoundationOperationsAlert
} from '@m5/types';
import { type DataTableColumn } from './DataTable';
import { DetailShell } from './DetailShell';
import { FormSubmitFeedback } from './FormSubmitFeedback';
import { InfoRow } from './InfoRow';
import { listPageStatCardStyle, useListPageSectionState } from './ListPageScaffold';
import { SearchFilterInput, type DataTableSortConfig } from './LinkedOverviewStubs';
import { PaginatedDataTableCard } from './PaginatedDataTableCard';
import { PageShell } from './PageShell';
import { StatusBadge } from './StatusBadge';
import { Tabs } from './Tabs';

export interface FoundationAlertRecord {
  id: string;
  title: string;
  severity: string;
  source: string;
  status: string;
  createdAt: string;
  description?: string;
  owner?: string;
  updatedAt?: string;
}

interface FoundationAlertDetailSection {
  title: string;
  content: React.ReactNode;
}

interface FoundationAlertLytGovernanceAlertGroup {
  severity: 'high' | 'medium' | 'low';
  code: string;
  count: number;
  summary: string;
  affectedStoreIds: string[];
  affectedCapabilities: string[];
  recommendedNextActions: string[];
}

interface FoundationAlertLytConnectionGovernanceRiskDetail {
  total: number;
  scope: {
    tenantId?: string;
    brandId?: string;
  };
  alerts: FoundationAlertLytGovernanceAlertGroup[];
  topAlertCodes: string[];
  affectedStoreIds: string[];
  affectedCapabilities: string[];
  recommendedNextActions: string[];
}

export interface FoundationAlertDetailLabels {
  overviewTitle?: string;
  detailsTitle?: string;
  severity?: string;
  status?: string;
  source?: string;
  owner?: string;
  description?: string;
  createdAt?: string;
  updatedAt?: string;
  unassignedOwner?: string;
  noDescription?: string;
}

const defaultFoundationAlertDetailLabels: FoundationAlertDetailLabels = {
  overviewTitle: 'Overview',
  detailsTitle: 'Details',
  severity: 'Severity',
  status: 'Status',
  source: 'Source',
  owner: 'Owner',
  description: 'Description',
  createdAt: 'Created At',
  updatedAt: 'Updated At',
  unassignedOwner: 'Unassigned',
  noDescription: 'No description',
};

type SeverityVariant = 'info' | 'warning' | 'error' | 'success';
type StatusVariant = 'default' | 'warning' | 'success';

export interface FoundationAlertSeverityMeta {
  label: string;
  variant: SeverityVariant;
}

export interface FoundationAlertStatusMeta {
  label: string;
  variant: StatusVariant;
}

export const foundationAlertSeverityLabels: Record<string, FoundationAlertSeverityMeta> = {
  info: { label: 'Info', variant: 'info' },
  warning: { label: 'Warning', variant: 'warning' },
  error: { label: 'Error', variant: 'error' },
  success: { label: 'Success', variant: 'success' },
};

export const foundationAlertStatusLabels: Record<string, FoundationAlertStatusMeta> = {
  open: { label: 'Open', variant: 'default' },
  acknowledged: { label: 'Acknowledged', variant: 'warning' },
  resolved: { label: 'Resolved', variant: 'success' },
};

export interface CreateFoundationAlertMockRecordsOptions {
  count?: number;
  idPrefix?: string;
  titles: readonly string[];
  severityOrder: readonly string[];
  statusOrder: readonly string[];
  sourceOrder: readonly string[];
  createdAtStepMs?: number;
  acknowledgedAtStepMs?: number;
  resolvedAtStepMs?: number;
}

function createFoundationAlertDemoId(index: number, idPrefix = 'alert') {
  return `${idPrefix}-${String(index).padStart(4, '0')}`;
}

interface FoundationAlertDemoListPageProps {
  title: string;
  description?: string;
  preset: FoundationAlertListPreset;
  count?: number;
  detailHrefBase?: string;
  recordOptions?: Partial<
    Omit<CreateFoundationAlertMockRecordsOptions, 'count' | 'titles' | 'severityOrder' | 'statusOrder' | 'sourceOrder'>
  >;
  mapRecords?: (records: FoundationAlertRecord[]) => FoundationAlertRecord[];
  acknowledgeOptions?: UseFoundationAlertDemoAcknowledgeOptions;
}

export function createFoundationAlertMockRecords({
  count = 50,
  idPrefix = 'alert',
  titles,
  severityOrder,
  statusOrder,
  sourceOrder,
  createdAtStepMs = 3600000,
  acknowledgedAtStepMs = 1800000,
  resolvedAtStepMs = 900000,
}: CreateFoundationAlertMockRecordsOptions): FoundationAlertRecord[] {
  return Array.from({ length: count }, (_, index) => {
    const severity = severityOrder[index % severityOrder.length]!;
    const status = statusOrder[index % statusOrder.length]!;
    const source = sourceOrder[index % sourceOrder.length]!;
    const createdAt = new Date(Date.now() - index * createdAtStepMs).toISOString();

    return {
      id: createFoundationAlertDemoId(index + 1, idPrefix),
      title: titles[index % titles.length]!,
      severity,
      source,
      status,
      createdAt,
      updatedAt:
        status === 'resolved'
          ? new Date(Date.now() - index * resolvedAtStepMs).toISOString()
          : status !== 'open'
            ? new Date(Date.now() - index * acknowledgedAtStepMs).toISOString()
            : undefined,
    };
  });
}

export function FoundationAlertDemoListPage({
  title,
  description,
  preset,
  count = 50,
  detailHrefBase = '/alerts',
  recordOptions,
  mapRecords,
  acknowledgeOptions,
}: FoundationAlertDemoListPageProps) {
  const [alerts] = useState<FoundationAlertRecord[]>(() => {
    const records = createFoundationAlertMockRecords({
      count,
      titles: preset.titles,
      severityOrder: preset.severityOrder,
      statusOrder: preset.statusOrder,
      sourceOrder: preset.sourceOrder,
      ...recordOptions,
    });

    return mapRecords ? mapRecords(records) : records;
  });
  const acknowledgeAction = useFoundationAlertDemoAcknowledge(acknowledgeOptions);

  return (
    <FoundationAlertListPageSection
      title={title}
      description={description}
      alerts={alerts}
      preset={preset}
      detailHrefBase={detailHrefBase}
      feedback={acknowledgeAction.feedback}
      onDismissFeedback={acknowledgeAction.dismissFeedback}
      renderAction={(row) => (
        <FoundationAlertAcknowledgeActionButton
          alert={row}
          loading={acknowledgeAction.loading}
          onAcknowledge={acknowledgeAction.acknowledge}
          label={acknowledgeAction.actionLabel}
        />
      )}
    />
  );
}

export function createFoundationAlertDetailMockMap(
  alerts: FoundationAlertRecord[]
): Record<string, FoundationAlertRecord> {
  return Object.fromEntries(alerts.map((alert) => [alert.id, alert]));
}

export const foundationAlertDetailDemoPresets = {
  admin: createFoundationAlertDetailMockMap([
    {
      id: createFoundationAlertDemoId(1),
      title: '待处理审批积压',
      description: '审批执行队列中存在 18 条待处理记录，已超过 15 分钟未被运营工作台确认。',
      severity: 'critical',
      source: 'approval',
      status: 'open',
      owner: 'ops-oncall',
      createdAt: new Date(Date.now() - 2700000).toISOString(),
      updatedAt: new Date(Date.now() - 900000).toISOString(),
    },
    {
      id: createFoundationAlertDemoId(2),
      title: '高风险审计待复核',
      description: '审计风控命中 4 条高风险操作，仍缺少二次复核与处置结论。',
      severity: 'error',
      source: 'audit',
      status: 'acknowledged',
      owner: 'risk-reviewer',
      createdAt: new Date(Date.now() - 7200000).toISOString(),
      updatedAt: new Date(Date.now() - 2400000).toISOString(),
    },
    {
      id: createFoundationAlertDemoId(3),
      title: 'Runtime callback 超时待升级',
      description: '3 条 runtime callback 在超时阈值后仍未回写 receipt，建议立即升级处理。',
      severity: 'warning',
      source: 'runtime',
      status: 'open',
      owner: 'platform-runtime',
      createdAt: new Date(Date.now() - 5400000).toISOString(),
      updatedAt: new Date(Date.now() - 1800000).toISOString(),
    },
  ]),
  storefront: createFoundationAlertDetailMockMap([
    {
      id: createFoundationAlertDemoId(1),
      title: 'CPU 使用率峰值超过 90%',
      description: '生产环境 CPU 使用率连续 5 分钟超过 90%。',
      severity: 'error',
      source: 'monitoring',
      status: 'open',
      owner: 'user-1',
      createdAt: new Date(Date.now() - 3600000).toISOString(),
      updatedAt: new Date(Date.now() - 1800000).toISOString(),
    },
    {
      id: createFoundationAlertDemoId(2),
      title: '内存使用超过阈值 85%',
      description: '内存使用率达到 85%，且交换分区占用持续上升。',
      severity: 'warning',
      source: 'logging',
      status: 'acknowledged',
      owner: 'user-2',
      createdAt: new Date(Date.now() - 7200000).toISOString(),
      updatedAt: new Date(Date.now() - 3600000).toISOString(),
    },
    {
      id: createFoundationAlertDemoId(3),
      title: '磁盘空间不足 10% 剩余',
      description: '根分区可用空间低于 10%，需要尽快清理或扩容。',
      severity: 'error',
      source: 'monitoring',
      status: 'open',
      createdAt: new Date(Date.now() - 10800000).toISOString(),
      updatedAt: new Date(Date.now() - 5400000).toISOString(),
    },
  ]),
  tob: createFoundationAlertDetailMockMap([
    {
      id: createFoundationAlertDemoId(1),
      title: 'CPU 使用率峰值超过 90%',
      description: 'CPU 使用率连续 5 分钟超过 90%。',
      severity: 'error',
      source: 'monitoring',
      status: 'open',
      owner: 'user-1',
      createdAt: new Date(Date.now() - 3600000).toISOString(),
      updatedAt: new Date(Date.now() - 1800000).toISOString(),
    },
    {
      id: createFoundationAlertDemoId(2),
      title: '内存使用超过阈值 85%',
      description: '内存使用率已达到 85%。',
      severity: 'warning',
      source: 'logging',
      status: 'acknowledged',
      owner: 'user-2',
      createdAt: new Date(Date.now() - 7200000).toISOString(),
      updatedAt: new Date(Date.now() - 3600000).toISOString(),
    },
  ]),
} satisfies Record<string, Record<string, FoundationAlertRecord>>;

export interface FoundationAlertListPreset {
  titles: readonly string[];
  severityOrder: readonly string[];
  statusOrder: readonly string[];
  sourceOrder: readonly string[];
  searchFields?: Array<keyof FoundationAlertRecord | string>;
  severityMetaByCode?: Record<string, FoundationAlertSeverityMeta>;
  statusMetaByCode?: Record<string, FoundationAlertStatusMeta>;
  sourceLabels?: Record<string, string>;
  labels?: FoundationAlertListLabels;
  statsCopy?: FoundationAlertListStatsCopy;
  emptyTitle?: string;
  emptyDescription?: string;
  columnLabels?: FoundationAlertTableColumnLabels;
  showSourceFilter?: boolean;
  defaultPageSize?: number;
  pageSizeOptions?: number[];
  includeColumns?: FoundationAlertTableColumnKey[];
  omitColumns?: FoundationAlertTableColumnKey[];
  detailLabels?: FoundationAlertDetailLabels;
}

interface FoundationGovernanceAlertReadModelLike {
  generatedAt: string;
  alerts: FoundationAlertCatalogItem[];
  overviewAlerts: Array<Pick<FoundationOperationsAlert, 'code' | 'severity'>>;
}

interface MapFoundationGovernanceAlertsToRecordsOptions {
  sourceMap?: Record<string, string>;
  sourceFallback?: string;
  defaultSeverity?: string;
  mutedStatus?: string;
}

export const foundationAdminGovernanceSourceLabels = {
  approval: '审批',
  audit: '审计',
  security: '安全',
  runtime: '运行时',
  recovery: '恢复演练',
  observability: '可观测性',
  resilience: '韧性',
  identity: '身份',
  integration: '集成',
  trust: '信任',
  configuration: '配置',
} satisfies Record<string, string>;

export const foundationAdminGovernanceSourceMap = {
  'governance-approval': 'approval',
  'trust-governance': 'trust',
  'resilience-operations': 'recovery',
  'identity-access': 'identity',
  'configuration-governance': 'configuration',
  'integration-orchestration': 'integration',
  'runtime-governance': 'runtime',
} satisfies Record<string, string>;

export function mapFoundationGovernanceAlertsToRecords(
  governance: FoundationGovernanceAlertReadModelLike,
  options: MapFoundationGovernanceAlertsToRecordsOptions = {}
): FoundationAlertRecord[] {
  const {
    sourceMap = foundationAdminGovernanceSourceMap,
    sourceFallback = 'foundation',
    defaultSeverity = 'low',
    mutedStatus = 'muted',
  } = options;
  const overviewByCode = new Map(governance.overviewAlerts.map((item) => [item.code, item]));

  return governance.alerts.map((item) => {
    const source = item.sourceModules[0] ? sourceMap[item.sourceModules[0]] ?? item.sourceModules[0] : sourceFallback;
    const updatedAt = item.acknowledgement?.updatedAt ?? item.recentOperation?.createdAt ?? governance.generatedAt;
    const status =
      item.acknowledgement?.status === 'MUTED'
        ? mutedStatus
        : item.acknowledgement?.status === 'ACKED'
          ? 'acknowledged'
          : 'open';

    return {
      id: item.code,
      title: item.defaultSummary,
      description: item.severityPolicy,
      severity: overviewByCode.get(item.code)?.severity ?? defaultSeverity,
      source,
      status,
      owner: item.acknowledgement?.actorId ?? item.recentOperation?.actorId ?? undefined,
      createdAt: governance.generatedAt,
      updatedAt,
    };
  });
}


export const foundationAlertListDemoPresets = {
  admin: {
    titles: [
      '待处理审批积压',
      '高风险审计待复核',
      '密钥轮换已逾期',
      '证书 7 天内到期',
      '恢复演练超过 30 天未执行',
      'Runtime callback 超时待升级',
      '限流账本触发封禁',
      '观测信号降级待确认',
    ],
    severityOrder: ['critical', 'error', 'warning', 'info'],
    statusOrder: ['open', 'acknowledged', 'resolved'],
    sourceOrder: ['approval', 'audit', 'security', 'runtime', 'recovery', 'observability'],
    searchFields: ['id', 'title', 'source'],
    severityMetaByCode: {
      critical: { label: '严重', variant: 'error' },
      error: { label: '错误', variant: 'error' },
      warning: { label: '警告', variant: 'warning' },
      info: { label: '信息', variant: 'info' },
    },
    statusMetaByCode: {
      open: { label: '待处理', variant: 'default' },
      acknowledged: { label: '已确认', variant: 'warning' },
      resolved: { label: '已解决', variant: 'success' },
    },
    sourceLabels: {
      approval: '审批',
      audit: '审计',
      security: '安全',
      runtime: '运行时',
      recovery: '恢复演练',
      observability: '可观测性',
    },
    labels: {
      all: '全部',
      searchPlaceholder: '搜索告警 ID / 标题 / 来源...',
      statusSectionTitle: '处理状态',
      sourceSectionTitle: '治理来源',
      tableTitle: (matched: number) => `指挥台告警（匹配 ${matched} 条）`,
    },
    statsCopy: {
      totalLabel: '告警总数',
      totalHint: (matched: number) => `当前匹配 ${matched} 条`,
      openLabel: '待处理',
      openHint: '需要运营台立即跟进',
      criticalLabel: '严重 / 错误',
      criticalHint: '优先升级处置',
      sourceLabel: '治理来源',
      sourceHint: '审批 / 审计 / 安全 / 运行时 / 演练 / 可观测性',
    },
    emptyTitle: '暂无待关注告警',
    emptyDescription: '当前筛选条件下没有需要指挥台处理的治理告警。',
    columnLabels: {
      severity: '严重程度',
      title: '告警标题',
      source: '来源',
      status: '状态',
      createdAt: '触发时间',
      actions: '操作',
    },
    showSourceFilter: true,
    defaultPageSize: 10,
    pageSizeOptions: [5, 10, 20, 50],
    detailLabels: {
      overviewTitle: '概览',
      detailsTitle: '详情',
      severity: '严重程度',
      status: '状态',
      source: '来源',
      owner: '负责人',
      description: '描述',
      createdAt: '触发时间',
      updatedAt: '更新时间',
      unassignedOwner: '未分配',
      noDescription: '暂无描述',
    },
  },
  storefront: {
    titles: [
      'CPU 使用率峰值超过 90%',
      '内存使用超过阈值 85%',
      '磁盘空间不足 10% 剩余',
      '服务响应超时 30 秒',
      '数据库连接被拒绝',
    ],
    severityOrder: ['error', 'warning', 'info'],
    statusOrder: ['open', 'acknowledged', 'resolved'],
    sourceOrder: ['monitoring', 'logging', 'tracing', 'security', 'infrastructure'],
    searchFields: ['id', 'title', 'source'],
    severityMetaByCode: {
      error: { label: '错误', variant: 'error' },
      warning: { label: '警告', variant: 'warning' },
      info: { label: '信息', variant: 'info' },
    },
    statusMetaByCode: {
      open: { label: '待处理', variant: 'default' },
      acknowledged: { label: '已确认', variant: 'warning' },
      resolved: { label: '已解决', variant: 'success' },
    },
    sourceLabels: {
      monitoring: '监控',
      logging: '日志',
      tracing: '链路追踪',
      security: '安全',
      infrastructure: '基础设施',
    },
    labels: {
      all: '全部',
      searchPlaceholder: '搜索门店告警...',
      statusSectionTitle: '处理状态',
      tableTitle: (matched: number) => `门店告警列表（匹配 ${matched} 条）`,
    },
    statsCopy: {
      totalLabel: '告警总数',
      totalHint: (matched: number) => `当前匹配 ${matched} 条`,
      openLabel: '待处理',
      openHint: '需要门店立即跟进',
      criticalLabel: '错误 / 高优先级',
      criticalHint: '优先升级处理',
      sourceLabel: '告警来源',
      sourceHint: '监控 / 日志 / 链路追踪 / 安全 / 基础设施',
    },
    emptyTitle: '暂无门店告警',
    emptyDescription: '当前筛选条件下没有需要关注的门店运行告警。',
    columnLabels: {
      severity: '严重程度',
      title: '告警标题',
      source: '来源',
      status: '状态',
      createdAt: '触发时间',
      actions: '操作',
    },
    showSourceFilter: false,
    defaultPageSize: 5,
    pageSizeOptions: [5, 10, 20],
    includeColumns: ['severity', 'title', 'status', 'createdAt'],
    detailLabels: {
      overviewTitle: '概览',
      detailsTitle: '详情',
      severity: '严重程度',
      status: '状态',
      source: '来源',
      owner: '负责人',
      description: '描述',
      createdAt: '触发时间',
      updatedAt: '更新时间',
      unassignedOwner: '未分配',
      noDescription: '暂无描述',
    },
  },
  tob: {
    titles: [
      'CPU 使用率峰值超过 90%',
      '内存使用超过阈值 85%',
      '磁盘空间不足 10% 剩余',
      '服务响应超时 30s',
      '数据库连接被拒绝',
      'API 错误率超过 5%',
      'TLS 证书即将过期',
      '容器重启次数异常',
    ],
    severityOrder: ['critical', 'error', 'warning', 'info'],
    statusOrder: ['open', 'acknowledged', 'resolved'],
    sourceOrder: ['monitoring', 'logging', 'tracing', 'security', 'infrastructure'],
    searchFields: ['id', 'title', 'source'],
    severityMetaByCode: {
      critical: { label: '严重', variant: 'error' },
      error: { label: '错误', variant: 'error' },
      warning: { label: '警告', variant: 'warning' },
      info: { label: '信息', variant: 'info' },
    },
    statusMetaByCode: {
      open: { label: '未处理', variant: 'default' },
      acknowledged: { label: '已确认', variant: 'warning' },
      resolved: { label: '已解决', variant: 'success' },
    },
    sourceLabels: {
      monitoring: '监控',
      logging: '日志',
      tracing: '链路追踪',
      security: '安全',
      infrastructure: '基础设施',
    },
    labels: {
      all: '全部',
      searchPlaceholder: '搜索告警 ID / 标题 / 来源...',
      statusSectionTitle: '处理状态',
      sourceSectionTitle: '告警来源',
      tableTitle: (matched: number) => `告警列表（匹配 ${matched} 条）`,
    },
    statsCopy: {
      totalLabel: '告警总数',
      totalHint: (matched: number) => `匹配 ${matched} 条`,
      openLabel: '未处理',
      openHint: '需要响应',
      criticalLabel: '严重 / 错误',
      criticalHint: '高优先级',
      sourceLabel: '告警来源',
      sourceHint: '监控 / 日志 / 链路 / 安全 / 基础设施',
    },
    emptyTitle: '暂无告警',
    emptyDescription: '当前筛选条件下没有匹配的告警。',
    columnLabels: {
      severity: '严重程度',
      title: '标题',
      source: '来源',
      status: '状态',
      createdAt: '创建时间',
    },
    showSourceFilter: true,
    defaultPageSize: 10,
    pageSizeOptions: [5, 10, 20, 50],
    detailLabels: {
      overviewTitle: '概览',
      detailsTitle: '详情',
      severity: '严重程度',
      status: '状态',
      source: '来源',
      owner: '负责人',
      description: '描述',
      createdAt: '创建时间',
      updatedAt: '更新时间',
      unassignedOwner: '未分配',
      noDescription: '暂无描述',
    },
  },
} satisfies Record<string, FoundationAlertListPreset>;

export function createFoundationAdminGovernanceStatsCopy(deliveryMode: 'api' | 'fallback'): FoundationAlertListStatsCopy {
  return {
    totalLabel: '告警总数',
    totalHint: (matched: number) => `当前匹配 ${matched} 条`,
    openLabel: '待处理',
    openHint: deliveryMode === 'api' ? '实时治理回读' : 'fallback 治理快照',
    criticalLabel: '高优先级',
    criticalHint: 'high severity / top risks',
    sourceLabel: '治理来源',
    sourceHint: '审批 / 审计 / 运行时 / 安全 / 演练',
  };
}

export const foundationAdminGovernanceListPreset: FoundationAlertListPreset = {
  titles: foundationAlertListDemoPresets.admin.titles,
  severityOrder: ['high', 'medium', 'low'],
  statusOrder: ['open', 'acknowledged', 'muted'],
  sourceOrder: Object.keys(foundationAdminGovernanceSourceLabels),
  searchFields: ['id', 'title', 'description', 'source', 'owner'],
  severityMetaByCode: {
    high: { label: '高', variant: 'error' },
    medium: { label: '中', variant: 'warning' },
    low: { label: '低', variant: 'info' },
  },
  statusMetaByCode: {
    open: { label: '待处理', variant: 'default' },
    acknowledged: { label: '已确认', variant: 'warning' },
    muted: { label: '已静音', variant: 'success' },
  },
  sourceLabels: foundationAdminGovernanceSourceLabels,
  labels: {
    all: '全部',
    searchPlaceholder: '搜索告警代码 / 摘要 / 来源 / 责任人...',
    statusSectionTitle: '处理状态',
    sourceSectionTitle: '治理来源',
    tableTitle: (matched: number) => `指挥台告警（匹配 ${matched} 条）`,
  },
  emptyTitle: '暂无待关注告警',
  emptyDescription: '当前筛选条件下没有需要指挥台处理的治理告警。',
  columnLabels: {
    severity: '严重程度',
    title: '告警标题',
    source: '来源',
    status: '状态',
    createdAt: '生成时间',
    actions: '操作',
  },
  showSourceFilter: true,
  defaultPageSize: 10,
  pageSizeOptions: [5, 10, 20, 50],
  detailLabels: foundationAlertListDemoPresets.admin.detailLabels,
};

function resolveFoundationAlertSeverityMeta(
  severity: string,
  severityMetaByCode: Record<string, FoundationAlertSeverityMeta> = foundationAlertSeverityLabels
) {
  return severityMetaByCode[severity] ?? foundationAlertSeverityLabels.info!;
}

function resolveFoundationAlertStatusMeta(
  status: string,
  statusMetaByCode: Record<string, FoundationAlertStatusMeta> = foundationAlertStatusLabels
) {
  return statusMetaByCode[status] ?? foundationAlertStatusLabels.open!;
}

interface FoundationAlertTableColumnLabels {
  severity?: string;
  title?: string;
  source?: string;
  status?: string;
  createdAt?: string;
  actions?: string;
}

type FoundationAlertTableColumnKey = 'severity' | 'title' | 'source' | 'status' | 'createdAt' | 'actions';

interface CreateFoundationAlertTableColumnsOptions {
  detailHrefBase?: string;
  renderAction?: (alert: FoundationAlertRecord) => React.ReactNode;
  severityMetaByCode?: Record<string, FoundationAlertSeverityMeta>;
  statusMetaByCode?: Record<string, FoundationAlertStatusMeta>;
  sourceLabels?: Record<string, string>;
  columnLabels?: FoundationAlertTableColumnLabels;
  includeColumns?: FoundationAlertTableColumnKey[];
  omitColumns?: FoundationAlertTableColumnKey[];
}

interface FoundationAlertTableCardProps {
  alerts: FoundationAlertRecord[];
  detailHrefBase?: string;
  loading?: boolean;
  title?: React.ReactNode;
  sort?: DataTableSortConfig | null;
  onSortChange?: React.Dispatch<React.SetStateAction<DataTableSortConfig | null>>;
  striped?: boolean;
  compact?: boolean;
  renderAction?: (alert: FoundationAlertRecord) => React.ReactNode;
  emptyTitle?: string;
  emptyDescription?: string;
  severityMetaByCode?: Record<string, FoundationAlertSeverityMeta>;
  statusMetaByCode?: Record<string, FoundationAlertStatusMeta>;
  sourceLabels?: Record<string, string>;
  columnLabels?: FoundationAlertTableColumnLabels;
  includeColumns?: FoundationAlertTableColumnKey[];
  omitColumns?: FoundationAlertTableColumnKey[];
  pagination?: {
    page: number;
    totalPages: number;
    total: number;
    onPageChange: (page: number) => void;
  };
}

export function FoundationAlertTableCard({
  alerts,
  detailHrefBase = '/alerts',
  loading = false,
  title,
  sort,
  onSortChange,
  striped = false,
  compact = false,
  renderAction,
  emptyTitle = 'No alerts found',
  emptyDescription = 'All clear! No alerts match your current filters.',
  severityMetaByCode = foundationAlertSeverityLabels,
  statusMetaByCode = foundationAlertStatusLabels,
  sourceLabels,
  columnLabels,
  includeColumns,
  omitColumns,
  pagination,
}: FoundationAlertTableCardProps) {
  const columns = useMemo<DataTableColumn<FoundationAlertRecord>[]>(
    () =>
      createFoundationAlertTableColumns({
        detailHrefBase,
        renderAction,
        severityMetaByCode,
        statusMetaByCode,
        sourceLabels,
        columnLabels,
        includeColumns,
        omitColumns,
      }),
    [
      columnLabels,
      detailHrefBase,
      includeColumns,
      omitColumns,
      renderAction,
      severityMetaByCode,
      sourceLabels,
      statusMetaByCode,
    ]
  );

  return (
    <PaginatedDataTableCard
      title={title}
      columns={columns}
      rows={alerts}
      rowKey={(row) => row.id}
      loading={loading}
      sort={sort}
      onSortChange={onSortChange}
      striped={striped}
      compact={compact}
      emptyTitle={emptyTitle}
      emptyDescription={emptyDescription}
      pagination={pagination}
    />
  );
}

export function createFoundationAlertTableColumns({
  detailHrefBase = '/alerts',
  renderAction,
  severityMetaByCode = foundationAlertSeverityLabels,
  statusMetaByCode = foundationAlertStatusLabels,
  sourceLabels,
  columnLabels,
  includeColumns,
  omitColumns = [],
}: CreateFoundationAlertTableColumnsOptions = {}): DataTableColumn<FoundationAlertRecord>[] {
  const columns: Array<DataTableColumn<FoundationAlertRecord> & { key: FoundationAlertTableColumnKey }> = [
    {
      key: 'severity',
      header: columnLabels?.severity ?? 'Severity',
      width: '100px',
      sortable: true,
      render: (row) => {
        const severity = resolveFoundationAlertSeverityMeta(row.severity, severityMetaByCode);
        return <StatusBadge label={severity.label} variant={severity.variant} size="sm" />;
      },
    },
    {
      key: 'title',
      header: columnLabels?.title ?? 'Title',
      sortable: true,
      render: (row) => (
        <a href={`${detailHrefBase}/${row.id}`} style={{ color: '#e2e8f0', textDecoration: 'none', fontWeight: 500 }}>
          {row.title}
        </a>
      ),
    },
    {
      key: 'source',
      header: columnLabels?.source ?? 'Source',
      width: '120px',
      sortable: true,
      render: (row) => <span style={{ color: '#94a3b8', fontSize: 13 }}>{sourceLabels?.[row.source] ?? row.source}</span>,
    },
    {
      key: 'status',
      header: columnLabels?.status ?? 'Status',
      width: '140px',
      sortable: true,
      render: (row) => {
        const status = resolveFoundationAlertStatusMeta(row.status, statusMetaByCode);
        return <StatusBadge label={status.label} variant={status.variant} size="sm" />;
      },
    },
    {
      key: 'createdAt',
      header: columnLabels?.createdAt ?? 'Created',
      width: '160px',
      sortable: true,
      render: (row) => <span style={{ color: '#94a3b8', fontSize: 13 }}>{new Date(row.createdAt).toLocaleString()}</span>,
    },
  ];

  if (renderAction) {
    columns.push({
      key: 'actions',
      header: columnLabels?.actions ?? 'Actions',
      width: '100px',
      align: 'right',
      render: (row) => renderAction(row),
    });
  }

  const allowedKeys = includeColumns ?? columns.map((column) => column.key);

  return columns.filter((column) => allowedKeys.includes(column.key) && !omitColumns.includes(column.key));
}

interface FoundationAlertDetailViewProps {
  alert?: FoundationAlertRecord | null;
  preset?: FoundationAlertListPreset;
  backHref?: string;
  backLabel?: string;
  notFoundTitle?: string;
  notFoundMessage?: string;
  subtitle?: string;
  extraSections?: FoundationAlertDetailSection[];
  severityMetaByCode?: Record<string, FoundationAlertSeverityMeta>;
  statusMetaByCode?: Record<string, FoundationAlertStatusMeta>;
  sourceLabels?: Record<string, string>;
  detailLabels?: FoundationAlertDetailLabels;
  formatDateTime?: (value: string) => string;
}

interface FoundationAlertPresetDetailRouteProps {
  alertId: string;
  alerts: Record<string, FoundationAlertRecord>;
  preset?: FoundationAlertListPreset;
  backHref?: string;
  backLabel?: string;
  notFoundTitle?: string;
  notFoundMessage?: string | ((alertId: string) => string);
  severityMetaByCode?: Record<string, FoundationAlertSeverityMeta>;
  statusMetaByCode?: Record<string, FoundationAlertStatusMeta>;
  sourceLabels?: Record<string, string>;
  detailLabels?: FoundationAlertDetailLabels;
  formatDateTime?: (value: string) => string;
}

interface FoundationAlertOverviewReadoutProps {
  alert: FoundationAlertRecord;
  detailLabels?: FoundationAlertDetailLabels;
  severityMetaByCode?: Record<string, FoundationAlertSeverityMeta>;
  statusMetaByCode?: Record<string, FoundationAlertStatusMeta>;
  sourceLabels?: Record<string, string>;
}

interface FoundationAlertDetailsReadoutProps {
  alert: FoundationAlertRecord;
  detailLabels?: FoundationAlertDetailLabels;
  formatDateTime?: (value: string) => string;
}

export interface FoundationAlertDrilldownSectionLabels {
  governanceTitle?: string;
  timelineTitle?: string;
  overviewVisibility?: string;
  overviewVisible?: string;
  overviewHidden?: string;
  acknowledgementStatus?: string;
  acknowledgementPending?: string;
  acknowledgementAcked?: string;
  acknowledgementMuted?: string;
  recentActor?: string;
  recentUpdatedAt?: string;
  availableActions?: string;
  noAvailableActions?: string;
  actionDrilldown?: string;
  actionAcknowledge?: string;
  actionMute?: string;
  actionUnmute?: string;
  systemActor?: string;
  timelineNoHistory?: string;
  actor?: string;
  source?: string;
  mutedUntil?: string;
  note?: string;
  noNote?: string;
  noTimestamp?: string;
}

interface BuildFoundationAlertDrilldownSectionsOptions {
  labels?: FoundationAlertDrilldownSectionLabels;
  formatDateTime?: (value?: string | null) => string;
}

const defaultFoundationAlertDrilldownSectionLabels: FoundationAlertDrilldownSectionLabels = {
  governanceTitle: '治理状态',
  timelineTitle: '处置时间线',
  overviewVisibility: '总览可见性',
  overviewVisible: '仍在 overview 展示',
  overviewHidden: '已从 overview 隐藏',
  acknowledgementStatus: '当前确认状态',
  acknowledgementPending: '待处理',
  acknowledgementAcked: '已确认',
  acknowledgementMuted: '静默中',
  recentActor: '最近处置人',
  recentUpdatedAt: '最近处置时间',
  availableActions: '可用动作',
  noAvailableActions: '当前 drilldown 未返回可执行动作。',
  actionDrilldown: '查看详情',
  actionAcknowledge: '确认',
  actionMute: '静默',
  actionUnmute: '取消静默',
  systemActor: '系统',
  timelineNoHistory: '当前告警还没有任何 ACK / MUTE / UNMUTE 的历史记录。',
  actor: '执行人',
  source: '来源',
  mutedUntil: '静默截止',
  note: '备注',
  noNote: '无备注',
  noTimestamp: '未记录',
};

export function formatFoundationAlertDrilldownDateTime(value?: string | null) {
  return value ? new Date(value).toLocaleString() : defaultFoundationAlertDrilldownSectionLabels.noTimestamp!;
}

export function formatFoundationAlertActionLabel(
  action: string,
  labels: FoundationAlertDrilldownSectionLabels = defaultFoundationAlertDrilldownSectionLabels
) {
  switch (action) {
    case 'DRILLDOWN':
      return labels.actionDrilldown ?? defaultFoundationAlertDrilldownSectionLabels.actionDrilldown!;
    case 'ACK':
      return labels.actionAcknowledge ?? defaultFoundationAlertDrilldownSectionLabels.actionAcknowledge!;
    case 'MUTE':
      return labels.actionMute ?? defaultFoundationAlertDrilldownSectionLabels.actionMute!;
    case 'UNMUTE':
      return labels.actionUnmute ?? defaultFoundationAlertDrilldownSectionLabels.actionUnmute!;
    default:
      return action;
  }
}

function renderFoundationAlertDetailTag(label: string, palette: 'default' | 'success' | 'warning' = 'default') {
  const colors =
    palette === 'success'
      ? {
          background: 'rgba(34,197,94,0.14)',
          border: '1px solid rgba(74,222,128,0.26)',
          color: '#bbf7d0',
        }
      : palette === 'warning'
        ? {
            background: 'rgba(245,158,11,0.14)',
            border: '1px solid rgba(251,191,36,0.28)',
            color: '#fde68a',
          }
        : {
            background: 'rgba(59,130,246,0.14)',
            border: '1px solid rgba(96,165,250,0.24)',
            color: '#dbeafe',
          };

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        padding: '4px 10px',
        borderRadius: 999,
        fontSize: 12,
        fontWeight: 600,
        whiteSpace: 'nowrap',
        ...colors,
      }}
    >
      {label}
    </span>
  );
}

export function buildFoundationAlertRecordFromDrilldown(drilldown: FoundationAlertDrilldownResponse): FoundationAlertRecord {
  const status =
    drilldown.acknowledgement?.status === 'MUTED'
      ? 'resolved'
      : drilldown.acknowledgement?.status === 'ACKED'
        ? 'acknowledged'
        : 'open';

  return {
    id: String(drilldown.code),
    title: drilldown.catalog?.defaultSummary ?? drilldown.alert?.summary ?? String(drilldown.code),
    description:
      drilldown.catalog?.severityPolicy ??
      drilldown.alert?.triageSummary ??
      `可用动作：${drilldown.availableActions?.join(' / ') ?? '无'}`,
    severity: drilldown.alert?.severity ?? 'info',
    source: drilldown.catalog?.sourceModules?.join(', ') ?? 'foundation',
    status,
    owner: drilldown.acknowledgement?.actorId ?? drilldown.history?.[0]?.actorId ?? undefined,
    createdAt: drilldown.generatedAt,
    updatedAt: drilldown.acknowledgement?.updatedAt ?? drilldown.history?.[0]?.createdAt ?? drilldown.generatedAt,
  };
}

export function buildFoundationAlertDrilldownSections(
  drilldown: FoundationAlertDrilldownResponse,
  options: BuildFoundationAlertDrilldownSectionsOptions = {}
): FoundationAlertDetailSection[] {
  const labels = { ...defaultFoundationAlertDrilldownSectionLabels, ...options.labels };
  const formatDateTime = options.formatDateTime ?? formatFoundationAlertDrilldownDateTime;
  const availableActions = drilldown.availableActions ?? [];
  const history = drilldown.history ?? [];

  return [
    {
      title: labels.governanceTitle ?? defaultFoundationAlertDrilldownSectionLabels.governanceTitle!,
      content: (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 16 }}>
            <div>
              <div style={{ fontSize: 12, color: '#94a3b8', marginBottom: 6 }}>
                {labels.overviewVisibility ?? defaultFoundationAlertDrilldownSectionLabels.overviewVisibility!}
              </div>
              {renderFoundationAlertDetailTag(
                drilldown.visibleInOverview === false
                  ? labels.overviewHidden ?? defaultFoundationAlertDrilldownSectionLabels.overviewHidden!
                  : labels.overviewVisible ?? defaultFoundationAlertDrilldownSectionLabels.overviewVisible!,
                drilldown.visibleInOverview === false ? 'warning' : 'success'
              )}
            </div>
            <div>
              <div style={{ fontSize: 12, color: '#94a3b8', marginBottom: 6 }}>
                {labels.acknowledgementStatus ?? defaultFoundationAlertDrilldownSectionLabels.acknowledgementStatus!}
              </div>
              {renderFoundationAlertDetailTag(
                drilldown.acknowledgement?.status === 'MUTED'
                  ? labels.acknowledgementMuted ?? defaultFoundationAlertDrilldownSectionLabels.acknowledgementMuted!
                  : drilldown.acknowledgement?.status === 'ACKED'
                    ? labels.acknowledgementAcked ?? defaultFoundationAlertDrilldownSectionLabels.acknowledgementAcked!
                    : labels.acknowledgementPending ?? defaultFoundationAlertDrilldownSectionLabels.acknowledgementPending!,
                drilldown.acknowledgement?.status ? 'success' : 'default'
              )}
            </div>
            <div>
              <div style={{ fontSize: 12, color: '#94a3b8', marginBottom: 6 }}>
                {labels.recentActor ?? defaultFoundationAlertDrilldownSectionLabels.recentActor!}
              </div>
              <div style={{ color: '#e2e8f0', fontSize: 14 }}>
                {drilldown.acknowledgement?.actorId ?? history[0]?.actorId ?? labels.systemActor ?? defaultFoundationAlertDrilldownSectionLabels.systemActor!}
              </div>
            </div>
            <div>
              <div style={{ fontSize: 12, color: '#94a3b8', marginBottom: 6 }}>
                {labels.recentUpdatedAt ?? defaultFoundationAlertDrilldownSectionLabels.recentUpdatedAt!}
              </div>
              <div style={{ color: '#e2e8f0', fontSize: 14 }}>
                {formatDateTime(drilldown.acknowledgement?.updatedAt ?? history[0]?.createdAt ?? drilldown.generatedAt)}
              </div>
            </div>
          </div>
          <div>
            <div style={{ fontSize: 12, color: '#94a3b8', marginBottom: 8 }}>
              {labels.availableActions ?? defaultFoundationAlertDrilldownSectionLabels.availableActions!}
            </div>
            {availableActions.length ? (
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {availableActions.map((action) => (
                  <span key={action}>
                    {renderFoundationAlertDetailTag(
                      formatFoundationAlertActionLabel(action, labels),
                      action === 'MUTE' ? 'warning' : 'default'
                    )}
                  </span>
                ))}
              </div>
            ) : (
              <div style={{ color: '#94a3b8', fontSize: 14 }}>
                {labels.noAvailableActions ?? defaultFoundationAlertDrilldownSectionLabels.noAvailableActions!}
              </div>
            )}
          </div>
        </div>
      ),
    },
    {
      title: labels.timelineTitle ?? defaultFoundationAlertDrilldownSectionLabels.timelineTitle!,
      content: history.length ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {history.map((entry, index) => (
            <div
              key={`${entry.action}-${entry.createdAt}-${index}`}
              style={{
                borderRadius: 12,
                border: '1px solid rgba(148,163,184,0.12)',
                background: 'rgba(15,23,42,0.38)',
                padding: 16,
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', marginBottom: 10 }}>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                  {renderFoundationAlertDetailTag(
                    formatFoundationAlertActionLabel(entry.action, labels),
                    entry.action === 'MUTE' ? 'warning' : 'default'
                  )}
                  {renderFoundationAlertDetailTag(
                    entry.visibleInOverview
                      ? labels.overviewVisible ?? defaultFoundationAlertDrilldownSectionLabels.overviewVisible!
                      : labels.overviewHidden ?? defaultFoundationAlertDrilldownSectionLabels.overviewHidden!,
                    entry.visibleInOverview ? 'success' : 'warning'
                  )}
                </div>
                <div style={{ color: '#94a3b8', fontSize: 12 }}>{formatDateTime(entry.createdAt)}</div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 12 }}>
                <div>
                  <div style={{ fontSize: 12, color: '#94a3b8', marginBottom: 4 }}>
                    {labels.actor ?? defaultFoundationAlertDrilldownSectionLabels.actor!}
                  </div>
                  <div style={{ color: '#e2e8f0', fontSize: 14 }}>
                    {entry.actorId ?? labels.systemActor ?? defaultFoundationAlertDrilldownSectionLabels.systemActor!}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: 12, color: '#94a3b8', marginBottom: 4 }}>
                    {labels.source ?? defaultFoundationAlertDrilldownSectionLabels.source!}
                  </div>
                  <div style={{ color: '#e2e8f0', fontSize: 14 }}>{entry.source ?? 'foundation'}</div>
                </div>
                <div>
                  <div style={{ fontSize: 12, color: '#94a3b8', marginBottom: 4 }}>
                    {labels.mutedUntil ?? defaultFoundationAlertDrilldownSectionLabels.mutedUntil!}
                  </div>
                  <div style={{ color: '#e2e8f0', fontSize: 14 }}>{formatDateTime(entry.mutedUntil)}</div>
                </div>
                <div>
                  <div style={{ fontSize: 12, color: '#94a3b8', marginBottom: 4 }}>
                    {labels.note ?? defaultFoundationAlertDrilldownSectionLabels.note!}
                  </div>
                  <div style={{ color: '#e2e8f0', fontSize: 14 }}>
                    {entry.note ?? labels.noNote ?? defaultFoundationAlertDrilldownSectionLabels.noNote!}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div style={{ color: '#94a3b8', fontSize: 14 }}>
          {labels.timelineNoHistory ?? defaultFoundationAlertDrilldownSectionLabels.timelineNoHistory!}
        </div>
      ),
    },
  ];
}

export function buildFoundationAlertLytConnectionGovernanceSections(
  drilldown: FoundationAlertDrilldownResponse
): FoundationAlertDetailSection[] {
  const detail = getFoundationAlertLytConnectionGovernanceRiskDetail(drilldown);
  if (!detail) {
    return [];
  }

  return [
    {
      title: '连接治理范围',
      content: (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 16 }}>
          <InfoRow label="租户" value={detail.scope.tenantId ?? '未指定'} />
          <InfoRow label="品牌" value={detail.scope.brandId ?? '未指定'} />
          <InfoRow label="受影响门店数" value={String(detail.affectedStoreIds.length)} />
          <InfoRow label="风险分组数" value={String(detail.alerts.length)} />
        </div>
      )
    },
    {
      title: '影响概览',
      content: (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <div style={{ fontSize: 12, color: '#94a3b8', marginBottom: 8 }}>受影响门店</div>
            {detail.affectedStoreIds.length ? (
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {detail.affectedStoreIds.map((storeId: string) => (
                  <span key={storeId}>{renderFoundationAlertDetailTag(storeId, 'warning')}</span>
                ))}
              </div>
            ) : (
              <div style={{ color: '#94a3b8', fontSize: 14 }}>暂无受影响门店</div>
            )}
          </div>
          <div>
            <div style={{ fontSize: 12, color: '#94a3b8', marginBottom: 8 }}>受影响能力</div>
            {detail.affectedCapabilities.length ? (
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {detail.affectedCapabilities.map((capability: string) => (
                  <span key={capability}>{renderFoundationAlertDetailTag(capability, 'default')}</span>
                ))}
              </div>
            ) : (
              <div style={{ color: '#94a3b8', fontSize: 14 }}>暂无能力影响明细</div>
            )}
          </div>
          <div>
            <div style={{ fontSize: 12, color: '#94a3b8', marginBottom: 8 }}>建议动作</div>
            {detail.recommendedNextActions.length ? (
              <ul style={{ margin: 0, paddingLeft: 18, color: '#e2e8f0', display: 'grid', gap: 8 }}>
                {detail.recommendedNextActions.map((action: string) => (
                  <li key={action}>{action}</li>
                ))}
              </ul>
            ) : (
              <div style={{ color: '#94a3b8', fontSize: 14 }}>暂无建议动作</div>
            )}
          </div>
        </div>
      )
    },
    {
      title: '风险分组',
      content: detail.alerts.length ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {detail.alerts.map((alert: FoundationAlertLytGovernanceAlertGroup) => (
            <div
              key={`${alert.code}-${alert.severity}`}
              style={{
                borderRadius: 12,
                border: '1px solid rgba(148,163,184,0.12)',
                background: 'rgba(15,23,42,0.38)',
                padding: 16
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', marginBottom: 8 }}>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {renderFoundationAlertDetailTag(alert.code, alert.severity === 'high' ? 'warning' : 'default')}
                  {renderFoundationAlertDetailTag(`影响 ${alert.count}`, 'default')}
                </div>
                <div style={{ color: '#94a3b8', fontSize: 12 }}>{alert.severity.toUpperCase()}</div>
              </div>
              <div style={{ color: '#e2e8f0', fontSize: 14, marginBottom: 8 }}>{alert.summary}</div>
              {alert.recommendedNextActions.length ? (
                <ul style={{ margin: 0, paddingLeft: 18, color: '#cbd5e1', display: 'grid', gap: 6 }}>
                  {alert.recommendedNextActions.map((action: string) => (
                    <li key={action}>{action}</li>
                  ))}
                </ul>
              ) : null}
            </div>
          ))}
        </div>
      ) : (
        <div style={{ color: '#94a3b8', fontSize: 14 }}>暂无风险分组</div>
      )
    }
  ];
}

function getFoundationAlertLytConnectionGovernanceRiskDetail(
  drilldown: Pick<FoundationAlertDrilldownResponse, 'code' | 'detail'> | null | undefined
) {
  if (!drilldown || drilldown.code !== 'lyt-connection-governance-risk' || !drilldown.detail || typeof drilldown.detail !== 'object') {
    return null;
  }

  const detailRecord = drilldown.detail as Record<string, unknown>;
  if (
    typeof detailRecord.total !== 'number' ||
    !detailRecord.scope ||
    typeof detailRecord.scope !== 'object' ||
    !Array.isArray(detailRecord.alerts) ||
    !Array.isArray(detailRecord.topAlertCodes) ||
    !Array.isArray(detailRecord.affectedStoreIds) ||
    !Array.isArray(detailRecord.affectedCapabilities) ||
    !Array.isArray(detailRecord.recommendedNextActions)
  ) {
    return null;
  }

  return detailRecord as unknown as FoundationAlertLytConnectionGovernanceRiskDetail;
}

export function FoundationAlertOverviewReadout({
  alert,
  detailLabels,
  severityMetaByCode = foundationAlertSeverityLabels,
  statusMetaByCode = foundationAlertStatusLabels,
  sourceLabels,
}: FoundationAlertOverviewReadoutProps) {
  const resolvedDetailLabels = detailLabels ?? defaultFoundationAlertDetailLabels;
  const severity = resolveFoundationAlertSeverityMeta(alert.severity, severityMetaByCode);
  const status = resolveFoundationAlertStatusMeta(alert.status, statusMetaByCode);

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 16 }}>
      <InfoRow
        label={resolvedDetailLabels.severity ?? defaultFoundationAlertDetailLabels.severity!}
        value={<StatusBadge label={severity.label} variant={severity.variant} size="sm" />}
      />
      <InfoRow
        label={resolvedDetailLabels.status ?? defaultFoundationAlertDetailLabels.status!}
        value={<StatusBadge label={status.label} variant={status.variant} size="sm" />}
      />
      <InfoRow
        label={resolvedDetailLabels.source ?? defaultFoundationAlertDetailLabels.source!}
        value={sourceLabels?.[alert.source] ?? alert.source}
      />
      <InfoRow
        label={resolvedDetailLabels.owner ?? defaultFoundationAlertDetailLabels.owner!}
        value={alert.owner ?? resolvedDetailLabels.unassignedOwner ?? defaultFoundationAlertDetailLabels.unassignedOwner!}
      />
    </div>
  );
}

export function FoundationAlertDetailsReadout({
  alert,
  detailLabels,
  formatDateTime = (value: string) => new Date(value).toLocaleString(),
}: FoundationAlertDetailsReadoutProps) {
  const resolvedDetailLabels = detailLabels ?? defaultFoundationAlertDetailLabels;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <InfoRow
        label={resolvedDetailLabels.description ?? defaultFoundationAlertDetailLabels.description!}
        value={alert.description ?? resolvedDetailLabels.noDescription ?? defaultFoundationAlertDetailLabels.noDescription!}
      />
      <InfoRow
        label={resolvedDetailLabels.createdAt ?? defaultFoundationAlertDetailLabels.createdAt!}
        value={formatDateTime(alert.createdAt)}
      />
      {alert.updatedAt ? (
        <InfoRow
          label={resolvedDetailLabels.updatedAt ?? defaultFoundationAlertDetailLabels.updatedAt!}
          value={formatDateTime(alert.updatedAt)}
        />
      ) : null}
    </div>
  );
}

export function FoundationAlertDetailView({
  alert,
  preset,
  backHref = '/alerts',
  backLabel,
  notFoundTitle = 'Not Found',
  notFoundMessage,
  subtitle,
  extraSections,
  severityMetaByCode,
  statusMetaByCode,
  sourceLabels,
  detailLabels,
  formatDateTime,
}: FoundationAlertDetailViewProps) {
  const resolvedSeverityMetaByCode = severityMetaByCode ?? preset?.severityMetaByCode ?? foundationAlertSeverityLabels;
  const resolvedStatusMetaByCode = statusMetaByCode ?? preset?.statusMetaByCode ?? foundationAlertStatusLabels;
  const resolvedSourceLabels = sourceLabels ?? preset?.sourceLabels;
  const resolvedDetailLabels = detailLabels ?? preset?.detailLabels ?? defaultFoundationAlertDetailLabels;
  const resolvedFormatDateTime = formatDateTime ?? ((value: string) => new Date(value).toLocaleString());

  if (!alert) {
    return (
      <DetailShell
        title={notFoundTitle}
        backHref={backHref}
        backLabel={backLabel}
        sections={[]}
        error={notFoundMessage ?? 'Alert not found'}
      />
    );
  }

  const sections: FoundationAlertDetailSection[] = [
    {
      title: resolvedDetailLabels.overviewTitle ?? defaultFoundationAlertDetailLabels.overviewTitle!,
      content: (
        <FoundationAlertOverviewReadout
          alert={alert}
          detailLabels={resolvedDetailLabels}
          severityMetaByCode={resolvedSeverityMetaByCode}
          statusMetaByCode={resolvedStatusMetaByCode}
          sourceLabels={resolvedSourceLabels}
        />
      ),
    },
    {
      title: resolvedDetailLabels.detailsTitle ?? defaultFoundationAlertDetailLabels.detailsTitle!,
      content: (
        <FoundationAlertDetailsReadout
          alert={alert}
          detailLabels={resolvedDetailLabels}
          formatDateTime={resolvedFormatDateTime}
        />
      ),
    },
    ...(extraSections ?? []),
  ];

  return (
    <DetailShell
      title={alert.title}
      backHref={backHref}
      backLabel={backLabel}
      subtitle={subtitle}
      sections={sections}
    />
  );
}

export function FoundationAlertPresetDetailRoute({
  alertId,
  alerts,
  preset,
  backHref = '/alerts',
  backLabel,
  notFoundTitle = 'Not Found',
  notFoundMessage,
  severityMetaByCode,
  statusMetaByCode,
  sourceLabels,
  detailLabels,
  formatDateTime,
}: FoundationAlertPresetDetailRouteProps) {
  return (
    <FoundationAlertDetailView
      alert={alerts[alertId]}
      preset={preset}
      backHref={backHref}
      backLabel={backLabel}
      notFoundTitle={notFoundTitle}
      severityMetaByCode={severityMetaByCode}
      statusMetaByCode={statusMetaByCode}
      sourceLabels={sourceLabels}
      detailLabels={detailLabels}
      formatDateTime={formatDateTime}
      notFoundMessage={
        typeof notFoundMessage === 'function' ? notFoundMessage(alertId) : notFoundMessage ?? `Alert ${alertId} not found`
      }
    />
  );
}

export interface FoundationAlertListFeedback {
  type: 'error' | 'success';
  message: string;
}

interface FoundationAlertDemoAcknowledgeCopy {
  actionLabel?: string;
  successMessage?: (alertId: string) => string;
  errorMessage?: (alertId: string) => string;
}

interface UseFoundationAlertDemoAcknowledgeOptions {
  delayMs?: number;
  copy?: FoundationAlertDemoAcknowledgeCopy;
}

interface FoundationAlertAcknowledgeActionButtonProps {
  alert: FoundationAlertRecord;
  loading?: boolean;
  onAcknowledge: (alertId: string) => Promise<void> | void;
  label?: string;
}

export function useFoundationAlertDemoAcknowledge({
  delayMs = 300,
  copy,
}: UseFoundationAlertDemoAcknowledgeOptions = {}) {
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<FoundationAlertListFeedback | null>(null);

  const acknowledge = useCallback(
    async (alertId: string) => {
      setLoading(true);
      try {
        await new Promise((resolve) => setTimeout(resolve, delayMs));
        setFeedback({
          type: 'success',
          message: copy?.successMessage?.(alertId) ?? `Alert ${alertId} acknowledged`,
        });
      } catch {
        setFeedback({
          type: 'error',
          message: copy?.errorMessage?.(alertId) ?? `Failed to acknowledge alert ${alertId}`,
        });
      } finally {
        setLoading(false);
      }
    },
    [copy, delayMs]
  );

  const dismissFeedback = useCallback(() => {
    setFeedback(null);
  }, []);

  return {
    loading,
    feedback,
    acknowledge,
    dismissFeedback,
    actionLabel: copy?.actionLabel ?? 'Ack',
  };
}

export function FoundationAlertAcknowledgeActionButton({
  alert,
  loading = false,
  onAcknowledge,
  label = 'Ack',
}: FoundationAlertAcknowledgeActionButtonProps) {
  if (alert.status === 'resolved') {
    return null;
  }

  return (
    <button
      type="button"
      onClick={() => void onAcknowledge(alert.id)}
      disabled={loading}
      style={{
        padding: '4px 10px',
        fontSize: 12,
        borderRadius: 6,
        border: '1px solid rgba(245,158,11,0.3)',
        background: 'transparent',
        color: '#fcd34d',
        cursor: loading ? 'not-allowed' : 'pointer',
        opacity: loading ? 0.72 : 1,
      }}
    >
      {label}
    </button>
  );
}

interface FoundationAlertListStatsCopy {
  totalLabel?: string;
  totalHint?: (matched: number) => string;
  openLabel?: string;
  openHint?: string;
  criticalLabel?: string;
  criticalHint?: string;
  sourceLabel?: string;
  sourceHint?: string;
}

interface FoundationAlertListLabels {
  all?: string;
  searchPlaceholder?: string;
  statusSectionTitle?: string;
  sourceSectionTitle?: string;
  tableTitle?: (matched: number) => React.ReactNode;
}

interface FoundationAlertListPageSectionProps {
  title: string;
  description?: string;
  alerts: FoundationAlertRecord[];
  preset?: FoundationAlertListPreset;
  detailHrefBase?: string;
  searchFields?: Array<keyof FoundationAlertRecord | string>;
  severityOrder?: string[];
  statusOrder?: string[];
  sourceOrder?: string[];
  severityMetaByCode?: Record<string, FoundationAlertSeverityMeta>;
  statusMetaByCode?: Record<string, FoundationAlertStatusMeta>;
  sourceLabels?: Record<string, string>;
  labels?: FoundationAlertListLabels;
  statsCopy?: FoundationAlertListStatsCopy;
  showSourceFilter?: boolean;
  renderAction?: (alert: FoundationAlertRecord) => React.ReactNode;
  feedback?: FoundationAlertListFeedback | null;
  onDismissFeedback?: () => void;
  emptyTitle?: string;
  emptyDescription?: string;
  defaultPageSize?: number;
  pageSizeOptions?: number[];
  columnLabels?: FoundationAlertTableColumnLabels;
  includeColumns?: FoundationAlertTableColumnKey[];
  omitColumns?: FoundationAlertTableColumnKey[];
}

export function FoundationAlertListPageSection({
  title,
  description,
  alerts,
  preset,
  detailHrefBase = '/alerts',
  searchFields,
  severityOrder,
  statusOrder,
  sourceOrder,
  severityMetaByCode,
  statusMetaByCode,
  sourceLabels,
  labels,
  statsCopy,
  showSourceFilter,
  renderAction,
  feedback,
  onDismissFeedback,
  emptyTitle,
  emptyDescription,
  defaultPageSize,
  pageSizeOptions,
  columnLabels,
  includeColumns,
  omitColumns,
}: FoundationAlertListPageSectionProps) {
  const resolvedSeverityOrder = severityOrder ?? [...(preset?.severityOrder ?? [])];
  const resolvedStatusOrder = statusOrder ?? [...(preset?.statusOrder ?? [])];
  const resolvedSourceOrder = sourceOrder ?? [...(preset?.sourceOrder ?? [])];
  const resolvedSeverityMetaByCode = severityMetaByCode ?? preset?.severityMetaByCode ?? foundationAlertSeverityLabels;
  const resolvedStatusMetaByCode = statusMetaByCode ?? preset?.statusMetaByCode ?? foundationAlertStatusLabels;
  const resolvedSourceLabels = sourceLabels ?? preset?.sourceLabels;
  const resolvedLabels = labels ?? preset?.labels;
  const resolvedStatsCopy = statsCopy ?? preset?.statsCopy;
  const resolvedShowSourceFilter = showSourceFilter ?? preset?.showSourceFilter ?? true;
  const resolvedEmptyTitle = emptyTitle ?? preset?.emptyTitle;
  const resolvedEmptyDescription = emptyDescription ?? preset?.emptyDescription;
  const resolvedColumnLabels = columnLabels ?? preset?.columnLabels;
  const resolvedSearchFields = searchFields ?? preset?.searchFields ?? ['id', 'title', 'source'];
  const resolvedDefaultPageSize = defaultPageSize ?? preset?.defaultPageSize ?? 10;
  const resolvedPageSizeOptions = pageSizeOptions ?? preset?.pageSizeOptions ?? [5, 10, 20, 50];
  const resolvedIncludeColumns = includeColumns ?? preset?.includeColumns;
  const resolvedOmitColumns = omitColumns ?? preset?.omitColumns;

  const listState = useListPageSectionState({
    items: alerts,
    searchFields: resolvedSearchFields,
    defaultPageSize: resolvedDefaultPageSize,
    pageSizeOptions: resolvedPageSizeOptions,
    facets: [
      {
        key: 'severity',
        order: resolvedSeverityOrder,
        getValue: (alert) => alert.severity,
      },
      {
        key: 'status',
        order: resolvedStatusOrder,
        getValue: (alert) => alert.status,
      },
      {
        key: 'source',
        order: resolvedSourceOrder,
        enabled: resolvedShowSourceFilter,
        getValue: (alert) => alert.source,
      },
    ],
  });
  const severityFacet = listState.facets[0];
  const statusFacet = listState.facets[1];
  const sourceFacet = listState.facets[2];
  const stats = useMemo(
    () => ({
      total: alerts.length,
      open: alerts.filter((alert) => alert.status === 'open').length,
      critical: alerts.filter((alert) => ['critical', 'error'].includes(alert.severity)).length,
      matched: listState.sortedItems.length,
      sources: sourceFacet?.order.length ?? 0,
    }),
    [alerts, listState.sortedItems.length, sourceFacet?.order.length]
  );

  return (
    <PageShell
      title={title}
      description={description}
      actions={
        <SearchFilterInput
          value={listState.searchTerm}
          onChange={listState.setSearchTerm}
          placeholder={resolvedLabels?.searchPlaceholder ?? 'Search alerts...'}
        />
      }
    >
      <div
        style={{
          display: 'grid',
          gap: 14,
          gridTemplateColumns: 'repeat(4, minmax(0, 1fr))',
          marginBottom: 20,
        }}
      >
        <article style={listPageStatCardStyle}>
          <div style={{ fontSize: 13, color: '#cbd5e1' }}>{resolvedStatsCopy?.totalLabel ?? 'Total Alerts'}</div>
          <div style={{ marginTop: 6, fontSize: 24, fontWeight: 700 }}>{stats.total}</div>
          <div style={{ marginTop: 4, fontSize: 12, color: '#94a3b8' }}>
            {resolvedStatsCopy?.totalHint?.(stats.matched) ?? `${stats.matched} matched`}
          </div>
        </article>
        <article style={listPageStatCardStyle}>
          <div style={{ fontSize: 13, color: '#cbd5e1' }}>{resolvedStatsCopy?.openLabel ?? 'Open'}</div>
          <div style={{ marginTop: 6, fontSize: 24, fontWeight: 700, color: '#f87171' }}>{stats.open}</div>
          <div style={{ marginTop: 4, fontSize: 12, color: '#94a3b8' }}>{resolvedStatsCopy?.openHint ?? 'Needs response'}</div>
        </article>
        <article style={listPageStatCardStyle}>
          <div style={{ fontSize: 13, color: '#cbd5e1' }}>{resolvedStatsCopy?.criticalLabel ?? 'Critical / Error'}</div>
          <div style={{ marginTop: 6, fontSize: 24, fontWeight: 700, color: '#facc15' }}>{stats.critical}</div>
          <div style={{ marginTop: 4, fontSize: 12, color: '#94a3b8' }}>{resolvedStatsCopy?.criticalHint ?? 'High priority'}</div>
        </article>
        <article style={listPageStatCardStyle}>
          <div style={{ fontSize: 13, color: '#cbd5e1' }}>{resolvedStatsCopy?.sourceLabel ?? 'Sources'}</div>
          <div style={{ marginTop: 6, fontSize: 24, fontWeight: 700, color: '#93c5fd' }}>{stats.sources}</div>
          <div style={{ marginTop: 4, fontSize: 12, color: '#94a3b8' }}>
            {resolvedStatsCopy?.sourceHint ?? 'Monitoring / logging / tracing'}
          </div>
        </article>
      </div>

      <div style={{ marginBottom: 12 }}>
        <Tabs
          items={[
            { key: 'ALL', label: resolvedLabels?.all ?? 'All', count: listState.searchFilteredItems.length },
            ...(severityFacet?.order ?? []).map((severity) => ({
              key: severity,
              label: resolvedSeverityMetaByCode[severity]?.label ?? severity,
              count: severityFacet?.baseItems.filter((alert) => alert.severity === severity).length ?? 0,
            })),
          ]}
          activeKey={severityFacet?.value ?? 'ALL'}
          onChange={(value) => listState.setFacetValue('severity', value)}
          variant="pills"
          size="sm"
        />
      </div>

      <div style={{ marginBottom: 16, display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'flex-start' }}>
        <div>
          <div style={{ fontSize: 12, color: '#94a3b8', marginBottom: 6 }}>
            {resolvedLabels?.statusSectionTitle ?? 'Status'}
          </div>
          <Tabs
            items={[
              { key: 'ALL', label: resolvedLabels?.all ?? 'All', count: statusFacet?.baseItems.length ?? 0 },
              ...(statusFacet?.order ?? []).map((status) => ({
                key: status,
                label: resolvedStatusMetaByCode[status]?.label ?? status,
                count: statusFacet?.baseItems.filter((alert) => alert.status === status).length ?? 0,
              })),
            ]}
            activeKey={statusFacet?.value ?? 'ALL'}
            onChange={(value) => listState.setFacetValue('status', value)}
            variant="pills"
            size="sm"
          />
        </div>
        {resolvedShowSourceFilter ? (
          <div>
            <div style={{ fontSize: 12, color: '#94a3b8', marginBottom: 6 }}>
              {resolvedLabels?.sourceSectionTitle ?? 'Source'}
            </div>
            <Tabs
              items={[
                { key: 'ALL', label: resolvedLabels?.all ?? 'All', count: sourceFacet?.baseItems.length ?? 0 },
                ...(sourceFacet?.order ?? []).map((source) => ({
                  key: source,
                  label: resolvedSourceLabels?.[source] ?? source,
                  count: sourceFacet?.baseItems.filter((alert) => alert.source === source).length ?? 0,
                })),
              ]}
              activeKey={sourceFacet?.value ?? 'ALL'}
              onChange={(value) => listState.setFacetValue('source', value)}
              variant="pills"
              size="sm"
            />
          </div>
        ) : null}
      </div>

      {feedback ? (
        <div style={{ marginBottom: 12 }}>
          <FormSubmitFeedback
            submitting={false}
            error={feedback.type === 'error' ? feedback.message : undefined}
            success={feedback.type === 'success' ? feedback.message : undefined}
            onDismissError={onDismissFeedback}
            onDismissSuccess={onDismissFeedback}
          />
        </div>
      ) : null}

      <FoundationAlertTableCard
        alerts={listState.pagedItems}
        detailHrefBase={detailHrefBase}
        title={resolvedLabels?.tableTitle?.(listState.sortedItems.length)}
        sort={listState.sortConfig}
        onSortChange={listState.setSortConfig}
        striped
        compact
        renderAction={renderAction}
        emptyTitle={resolvedEmptyTitle}
        emptyDescription={resolvedEmptyDescription}
        severityMetaByCode={resolvedSeverityMetaByCode}
        statusMetaByCode={resolvedStatusMetaByCode}
        sourceLabels={resolvedSourceLabels}
        columnLabels={resolvedColumnLabels}
        includeColumns={resolvedIncludeColumns}
        omitColumns={resolvedOmitColumns}
        pagination={{
          page: listState.pagination.page,
          totalPages: listState.totalPages,
          total: listState.sortedItems.length,
          onPageChange: listState.pagination.setPage,
        }}
      />
    </PageShell>
  );
}
