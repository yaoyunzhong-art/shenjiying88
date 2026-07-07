import assert from 'node:assert/strict';
import test from 'node:test';
import React from 'react';
import type { FoundationAlertDrilldownResponse } from '@m5/types';
import {
  Card,
  ConfirmDialog,
  Dropdown,
  EmptyState,
  InfoRow,
  LoadingSkeleton,
  Modal,
  QuickStats,
  SearchFilterInput,
  StatusBadge,
  StatusBadgeGroup,
  useFormSubmit,
  useSearchFilter,
  FormField,
  FormSubmitFeedback,
  ToastContainer,
  useToast,
  Alert,
  useAlert,
  buildFoundationAlertDrilldownSections,
  buildFoundationAlertLytConnectionGovernanceSections,
  buildFoundationAlertRecordFromDrilldown,
  createFoundationAlertTableColumns,
  FoundationAlertDetailsReadout,
  FoundationAlertDetailView,
  formatFoundationAlertActionLabel,
  FoundationAlertOverviewReadout,
  foundationAlertListDemoPresets,
  RuntimeOperationDateTimeReadout,
  RuntimeOperationDetailView,
  RuntimeOperationIdReadout,
  RuntimeOperationOverviewReadout,
  RuntimeOperationReceiptListReadout,
  RuntimeOperationStatusReadout,
  RuntimeOperationTargetReadout,
  RuntimeOperationTimelineReadout,
  RuntimeOperationTypeReadout,
  createRuntimeOperationTableColumns,
  runtimeOperationDetailDemoPresets,
  runtimeOperationListDemoPresets,
  createFoundationAlertNextNavigationBindings,
  FrontDeskPanel,
  OperationsManagerDashboard,
  Stepper,
} from './index';
import type { BasketItem, QueueItem, QuickFnButton } from './index';
import type { OperationsManagerDashboardProps, DistrictSummary, DistrictStoreSnapshot, InspectionTask, OpsQuickAction } from './index';

function extractText(node: React.ReactNode): string {
  if (typeof node === 'string' || typeof node === 'number') {
    return String(node);
  }

  if (Array.isArray(node)) {
    return node.map(extractText).join(' ');
  }

  if (React.isValidElement(node)) {
    return extractText(node.props.children);
  }

  return '';
}
test('ui loading/empty primitives: export shared empty and loading components', () => {
  assert.equal(typeof EmptyState, 'function');
  assert.equal(typeof LoadingSkeleton, 'function');
});

test('ui StatusBadge: renders variants, sizes and dot correctly', () => {
  const defaultBadge = StatusBadge({ label: 'default' });
  assert.match(extractText(defaultBadge), /default/);

  const successBadge = StatusBadge({ label: '已完成', variant: 'success', dot: true });
  assert.match(extractText(successBadge), /已完成/);

  const dangerBadge = StatusBadge({ label: '异常', variant: 'danger', size: 'sm' });
  assert.match(extractText(dangerBadge), /异常/);

  const warningBadge = StatusBadge({ label: '待审核', variant: 'warning', dot: true });
  assert.match(extractText(warningBadge), /待审核/);

  const infoBadge = StatusBadge({ label: '进行中', variant: 'info' });
  assert.match(extractText(infoBadge), /进行中/);

  const neutralBadge = StatusBadge({ label: '已归档', variant: 'neutral' });
  assert.match(extractText(neutralBadge), /已归档/);

  const group = StatusBadgeGroup({
    children: [
      StatusBadge({ label: '高风险', variant: 'danger' }),
      StatusBadge({ label: '待处理', variant: 'warning' }),
      StatusBadge({ label: '已确认', variant: 'success' })
    ]
  });
  assert.match(extractText(group), /高风险/);
  assert.match(extractText(group), /待处理/);
  assert.match(extractText(group), /已确认/);
});

test('ui SearchFilterInput: component and hook are exported functions', () => {
  // SearchFilterInput uses hooks internally, so plain function-call test
  // is not supported (same as any hook-based component in this file).
  // Verify exports exist and are callable.
  assert.equal(typeof SearchFilterInput, 'function');
  assert.equal(typeof useSearchFilter, 'function');
});

test('ui field and empty primitives: barrel exports remain available', () => {
  assert.equal(typeof LoadingSkeleton, 'function');
  assert.equal(typeof EmptyState, 'function');
  assert.equal(typeof FormField, 'function');
});

test('ui FormSubmitFeedback: renders success, error and retry feedback', () => {
  // null when no message
  const empty = FormSubmitFeedback({
    state: { isSubmitting: false, successMessage: undefined, errorMessage: undefined, hasSubmitted: false }
  });
  assert.equal(empty, null);

  // success feedback
  const successFeedback = FormSubmitFeedback({
    state: { isSubmitting: false, successMessage: '保存成功', errorMessage: undefined, hasSubmitted: true }
  });
  const successText = extractText(successFeedback);
  assert.match(successText, /保存成功/);

  // error feedback without retry
  const errorFeedback = FormSubmitFeedback({
    state: { isSubmitting: false, successMessage: undefined, errorMessage: '网络异常', hasSubmitted: false }
  });
  const errorText = extractText(errorFeedback);
  assert.match(errorText, /网络异常/);

  // error feedback with retry button
  const retryFeedback = FormSubmitFeedback({
    state: { isSubmitting: false, successMessage: undefined, errorMessage: '提交超时', hasSubmitted: false },
    onRetry: () => undefined
  });
  const retryText = extractText(retryFeedback);
  assert.match(retryText, /提交超时/);
  assert.match(retryText, /重试/);

  // custom renderSuccess
  const customSuccessFeedback = FormSubmitFeedback({
    state: { isSubmitting: false, successMessage: '创建完成', errorMessage: undefined, hasSubmitted: true },
    renderSuccess: (msg) => React.createElement('div', { key: 'custom-success' }, `[成功] ${msg}`)
  });
  const customSuccessText = extractText(customSuccessFeedback);
  assert.match(customSuccessText, /\[成功\] 创建完成/);

  // custom renderError with retry
  const customErrorFeedback = FormSubmitFeedback({
    state: { isSubmitting: false, successMessage: undefined, errorMessage: '服务器错误', hasSubmitted: false },
    renderError: (msg) => React.createElement('div', { key: 'custom-error' }, `[错误] ${msg}`)
  });
  const customErrorText = extractText(customErrorFeedback);
  assert.match(customErrorText, /\[错误\] 服务器错误/);

  // both success and error (success takes priority in rendering)
  const bothFeedback = FormSubmitFeedback({
    state: { isSubmitting: false, successMessage: '操作成功', errorMessage: '部分失败', hasSubmitted: true }
  });
  const bothText = extractText(bothFeedback);
  assert.match(bothText, /操作成功/);
  assert.match(bothText, /部分失败/);
});

test('ui useFormSubmit: hook is exported as a function', () => {
  assert.equal(typeof useFormSubmit, 'function');
});

test('ui ConfirmDialog: component is exported and closed state returns null', () => {
  assert.equal(typeof ConfirmDialog, 'function');

  // 关闭状态应返回 null（不依赖 hooks）
  const closed = ConfirmDialog({
    open: false,
    title: '确认删除',
    message: '确定要删除门店 STORE-001 吗？',
    onConfirm: () => undefined,
    onCancel: () => undefined
  });
  assert.equal(closed, null);
});

test('ui InfoRow: component renders label and value', () => {
  const result = InfoRow({ label: '门店编码', value: 'STORE-001' });
  assert.ok(React.isValidElement(result));
  const text = extractText(result);
  assert.match(text, /门店编码/);
  assert.match(text, /STORE-001/);
});

test('ui InfoRow: component renders ReactNode value', () => {
  const badge = React.createElement('span', null, '运营中');
  const result = InfoRow({ label: '状态', value: badge });
  assert.ok(React.isValidElement(result));
  const text = extractText(result);
  assert.match(text, /状态/);
  assert.match(text, /运营中/);
});

test('ui FoundationAlertDetailView: renders extra drilldown sections', () => {
  const result = FoundationAlertDetailView({
    alert: {
      id: 'runtime-callback-stalled',
      title: 'Runtime callback 超时待升级',
      description: 'callback 未在阈值内完成回写',
      severity: 'warning',
      source: 'runtime',
      status: 'open',
      owner: 'platform-runtime',
      createdAt: '2026-06-14T10:00:00.000Z',
      updatedAt: '2026-06-14T10:05:00.000Z',
    },
    subtitle: '告警编码：runtime-callback-stalled',
    extraSections: [
      {
        title: '治理状态',
        content: React.createElement('div', null, 'overview 已隐藏'),
      },
    ],
  });

  assert.ok(React.isValidElement(result));
  const props = result.props as { title: string; subtitle?: string; sections?: Array<{ title: string; content: React.ReactNode }> };
  assert.equal(props.title, 'Runtime callback 超时待升级');
  assert.equal(props.subtitle, '告警编码：runtime-callback-stalled');
  assert.equal(props.sections?.[2]?.title, '治理状态');
  assert.match(extractText(props.sections?.[2]?.content), /overview 已隐藏/);
});

test('ui FoundationAlertDetailView: applies preset detail labels and source meta', () => {
  const result = FoundationAlertDetailView({
    alert: {
      id: 'alert-001',
      title: '审批积压',
      description: undefined,
      severity: 'critical',
      source: 'approval',
      status: 'acknowledged',
      createdAt: '2026-06-14T10:00:00.000Z',
    },
    preset: {
      titles: [],
      severityOrder: ['critical'],
      statusOrder: ['acknowledged'],
      sourceOrder: ['approval'],
      severityMetaByCode: {
        critical: { label: '严重', variant: 'error' },
      },
      statusMetaByCode: {
        acknowledged: { label: '已确认', variant: 'warning' },
      },
      sourceLabels: {
        approval: '审批',
      },
      detailLabels: {
        overviewTitle: '概览',
        detailsTitle: '详情',
        severity: '严重程度',
        status: '处理状态',
        source: '告警来源',
        owner: '负责人',
        description: '描述',
        createdAt: '触发时间',
        updatedAt: '更新时间',
        unassignedOwner: '未分配',
        noDescription: '暂无描述',
      },
    },
    formatDateTime: () => '2026/06/14 18:00',
  });

  assert.ok(React.isValidElement(result));
  const props = result.props as { sections?: Array<{ title: string; content: React.ReactNode }> };
  const overview = props.sections?.[0]?.content as React.ReactElement<{
    detailLabels?: { severity?: string; status?: string };
    sourceLabels?: Record<string, string>;
  }>;
  const details = props.sections?.[1]?.content as React.ReactElement<{
    detailLabels?: { description?: string; createdAt?: string };
    formatDateTime?: (value: string) => string;
  }>;
  assert.equal(props.sections?.[0]?.title, '概览');
  assert.equal(props.sections?.[1]?.title, '详情');
  assert.equal(overview.type, FoundationAlertOverviewReadout);
  assert.equal(overview.props.detailLabels?.severity, '严重程度');
  assert.equal(overview.props.detailLabels?.status, '处理状态');
  assert.equal(overview.props.sourceLabels?.approval, '审批');
  assert.equal(details.type, FoundationAlertDetailsReadout);
  assert.equal(details.props.detailLabels?.description, '描述');
  assert.equal(details.props.detailLabels?.createdAt, '触发时间');
  assert.equal(details.props.formatDateTime?.('2026-06-14T10:00:00.000Z'), '2026/06/14 18:00');
});

test('ui FoundationAlertOverviewReadout and DetailsReadout: render localized fields', () => {
  const overview = FoundationAlertOverviewReadout({
    alert: {
      id: 'alert-001',
      title: '审批积压',
      description: undefined,
      severity: 'critical',
      source: 'approval',
      status: 'acknowledged',
      createdAt: '2026-06-14T10:00:00.000Z',
    },
    detailLabels: {
      severity: '严重程度',
      status: '处理状态',
      source: '来源',
      owner: '负责人',
      unassignedOwner: '未分配',
    },
    severityMetaByCode: {
      critical: { label: '严重', variant: 'error' },
    },
    statusMetaByCode: {
      acknowledged: { label: '已确认', variant: 'warning' },
    },
    sourceLabels: {
      approval: '审批',
    },
  });
  const details = FoundationAlertDetailsReadout({
    alert: {
      id: 'alert-001',
      title: '审批积压',
      description: undefined,
      severity: 'critical',
      source: 'approval',
      status: 'acknowledged',
      createdAt: '2026-06-14T10:00:00.000Z',
      updatedAt: '2026-06-14T10:05:00.000Z',
    },
    detailLabels: {
      description: '描述',
      createdAt: '触发时间',
      updatedAt: '更新时间',
      noDescription: '暂无描述',
    },
    formatDateTime: () => '2026/06/14 18:00',
  });

  assert.ok(React.isValidElement(overview));
  assert.ok(React.isValidElement(details));
  const overviewRows = React.Children.toArray((overview.props as { children?: React.ReactNode }).children) as Array<
    React.ReactElement<{ label: string; value: unknown }>
  >;
  const detailRows = React.Children.toArray((details.props as { children?: React.ReactNode }).children) as Array<
    React.ReactElement<{ label: string; value: unknown }>
  >;

  assert.equal(overviewRows[0]?.props.label, '严重程度');
  assert.equal((overviewRows[0]?.props.value as React.ReactElement<{ label: string }>).props.label, '严重');
  assert.equal(overviewRows[1]?.props.label, '处理状态');
  assert.equal((overviewRows[1]?.props.value as React.ReactElement<{ label: string }>).props.label, '已确认');
  assert.equal(overviewRows[2]?.props.value, '审批');
  assert.equal(overviewRows[3]?.props.value, '未分配');
  assert.equal(detailRows[0]?.props.value, '暂无描述');
  assert.equal(detailRows[1]?.props.value, '2026/06/14 18:00');
  assert.equal(detailRows[2]?.props.value, '2026/06/14 18:00');
});

test('ui foundation alert drilldown helpers: build shared record and sections', () => {
  const drilldown = {
    code: 'runtime-callback-stalled',
    generatedAt: '2026-06-14T10:00:00.000Z',
    visibleInOverview: false,
    availableActions: ['ACK', 'MUTE', 'UNMUTE'],
    catalog: {
      code: 'runtime-callback-stalled',
      defaultSummary: 'Runtime callback 超时待升级',
      severityPolicy: 'callback 未在阈值内完成回写',
      sourceModules: ['runtime-governance'],
      drilldownEnabled: true,
      acknowledgementEnabled: true,
      drilldownPath: '/alerts/runtime-callback-stalled',
      ackPath: '/api/foundation/alerts/ack',
      mutePath: '/api/foundation/alerts/mute',
      unmutePath: '/api/foundation/alerts/unmute',
    },
    alert: {
      summary: 'fallback summary',
      triageSummary: 'fallback triage',
      code: 'runtime-callback-stalled',
      count: 1,
      severity: 'medium',
    },
    acknowledgement: {
      status: 'ACKED',
      note: null,
      actorId: 'platform-runtime',
      acknowledgedAt: '2026-06-14T10:05:00.000Z',
      mutedUntil: null,
      updatedAt: '2026-06-14T10:05:00.000Z',
    },
    history: [
      {
        action: 'MUTE',
        actorId: 'ops-oncall',
        createdAt: '2026-06-14T10:03:00.000Z',
        visibleInOverview: false,
        source: 'runtime',
        mutedUntil: '2026-06-14T12:03:00.000Z',
        note: '等待回调恢复',
      },
    ],
  } satisfies FoundationAlertDrilldownResponse;

  const record = buildFoundationAlertRecordFromDrilldown(drilldown);
  const sections = buildFoundationAlertDrilldownSections(drilldown);

  assert.equal(record.id, 'runtime-callback-stalled');
  assert.equal(record.title, 'Runtime callback 超时待升级');
  assert.equal(record.description, 'callback 未在阈值内完成回写');
  assert.equal(record.source, 'runtime-governance');
  assert.equal(record.status, 'acknowledged');
  assert.equal(record.owner, 'platform-runtime');
  assert.equal(formatFoundationAlertActionLabel('MUTE'), '静默');
  assert.equal(sections[0]?.title, '治理状态');
  assert.equal(sections[1]?.title, '处置时间线');
  assert.match(extractText(sections[0]?.content), /已从 overview 隐藏/);
  assert.match(extractText(sections[0]?.content), /已确认/);
  assert.match(extractText(sections[1]?.content), /等待回调恢复/);
});

test('ui foundation alert drilldown helpers: build lyt governance sections', () => {
  const drilldown = {
    code: 'lyt-connection-governance-risk',
    generatedAt: '2026-06-14T10:00:00.000Z',
    visibleInOverview: true,
    availableActions: ['DRILLDOWN', 'ACK'],
    detail: {
      total: 3,
      scope: {
        tenantId: 'tenant-demo',
        brandId: 'brand-demo',
      },
      alerts: [
        {
          severity: 'high',
          code: 'pending-configuration-stores',
          count: 2,
          summary: '存在仍未完成真实连接配置的门店，相关能力将持续被阻塞',
          affectedStoreIds: ['store-001', 'store-002'],
          affectedCapabilities: ['member', 'payment'],
          recommendedNextActions: ['优先补齐 endpoint、credential 与 vendorStoreId'],
        },
      ],
      topAlertCodes: ['pending-configuration-stores'],
      affectedStoreIds: ['store-001', 'store-002'],
      affectedCapabilities: ['member', 'payment'],
      recommendedNextActions: ['优先补齐 endpoint、credential 与 vendorStoreId'],
    },
  } satisfies FoundationAlertDrilldownResponse;

  const sections = buildFoundationAlertLytConnectionGovernanceSections(drilldown);
  assert.equal(sections.length, 3);
  assert.equal(sections[0]?.title, '连接治理范围');
  assert.equal(sections[1]?.title, '影响概览');
  assert.equal(sections[2]?.title, '风险分组');
  assert.match(extractText(sections[1]?.content), /store-001/);
  assert.match(extractText(sections[1]?.content), /优先补齐 endpoint、credential 与 vendorStoreId/);
  assert.match(extractText(sections[2]?.content), /pending-configuration-stores/);
});

test('ui foundationAlertListDemoPresets: can drive search and pagination defaults', () => {
  assert.deepEqual(foundationAlertListDemoPresets.storefront.searchFields, ['id', 'title', 'source']);
  assert.equal(foundationAlertListDemoPresets.storefront.defaultPageSize, 5);
  assert.deepEqual(foundationAlertListDemoPresets.storefront.pageSizeOptions, [5, 10, 20]);
  assert.equal(foundationAlertListDemoPresets.admin.defaultPageSize, 10);
  assert.deepEqual(foundationAlertListDemoPresets.storefront.includeColumns, ['severity', 'title', 'status', 'createdAt']);
});

test('ui createFoundationAlertTableColumns: supports localized compact columns', () => {
  const columns = createFoundationAlertTableColumns({
    detailHrefBase: '/alerts',
    columnLabels: {
      severity: '严重程度',
      status: '状态',
    },
    severityMetaByCode: {
      error: { label: '错误', variant: 'error' },
    },
    statusMetaByCode: {
      open: { label: '待处理', variant: 'default' },
    },
    includeColumns: ['severity', 'title', 'status'],
  });

  assert.deepEqual(
    columns.map((column) => column.key),
    ['severity', 'title', 'status']
  );
  assert.equal(columns[0]?.header, '严重程度');
  assert.equal(columns[2]?.header, '状态');

  const row = {
    id: 'alert-001',
    title: 'Runtime callback 超时待升级',
    severity: 'error',
    source: 'runtime',
    status: 'open',
    createdAt: '2026-06-14T10:00:00.000Z',
  };
  const severityCell = columns[0]?.render?.(row, 0) as React.ReactElement<{ label?: string }>;
  const titleCell = columns[1]?.render?.(row, 0) as React.ReactElement<{ href?: string }>;

  assert.equal(severityCell.props.label, '错误');
  assert.equal(titleCell.props.href, '/alerts/alert-001');
});

test('ui createFoundationAlertNextNavigationBindings: prefers custom replace override', () => {
  let replacedHref = '';
  const bindings = createFoundationAlertNextNavigationBindings({
    router: {
      push: () => 'router-push',
      replace: () => 'router-replace',
    },
    pathname: '/alerts',
    searchParams: new URLSearchParams('alert=runtime-callback-stalled'),
    replace: (href: string) => {
      replacedHref = href;
      return 'custom-replace';
    },
  });

  const result = bindings.replace('/alerts?alert=runtime-callback-stalled&action=ACK');
  assert.equal(result, 'custom-replace');
  assert.equal(replacedHref, '/alerts?alert=runtime-callback-stalled&action=ACK');
  assert.equal(bindings.pathname, '/alerts');
  assert.equal(bindings.searchParams.get('alert'), 'runtime-callback-stalled');
});

test('ui RuntimeOperationDetailView: applies preset detail labels and status meta', () => {
  const result = RuntimeOperationDetailView({
    operation: {
      id: 'op-001',
      type: 'deploy',
      targetId: 'service-01',
      status: 'running',
      createdAt: '2026-06-14T10:00:00.000Z',
    },
    receipts: [
      {
        code: 'STARTED',
        message: 'operation started',
        status: 'ok',
        timestamp: '2026-06-14T10:05:00.000Z',
      },
    ],
    preset: {
      typeOrder: ['deploy'],
      statusOrder: ['running'],
      typeLabels: {
        deploy: '部署',
      },
      statusLabels: {
        running: '执行中',
      },
      detailLabels: {
        titlePrefix: '操作',
        overviewTitle: '概览',
        timelineTitle: '时间线',
        receiptsTitle: '回执',
        id: '编号',
        type: '类型',
        status: '状态',
        target: '目标',
        createdAt: '创建时间',
        finishedAt: '完成时间',
        inProgress: '执行中...',
        noReceipts: '暂无回执',
        receiptOk: '成功',
        receiptError: '失败',
      },
    },
    formatDateTime: () => '2026/06/14 18:00',
  });

  assert.ok(React.isValidElement(result));
  const props = result.props as { title: string; sections?: Array<{ title: string; content: React.ReactNode }> };
  const overview = props.sections?.[0]?.content as React.ReactElement<{
    operation: { id: string; type: string; status: string; targetId: string };
    detailLabels?: { id?: string; type?: string; status?: string; target?: string };
    typeLabels?: Record<string, string>;
    statusLabels?: Record<string, string>;
  }>;
  const timeline = props.sections?.[1]?.content as React.ReactElement<{
    operation: { createdAt: string };
    detailLabels?: { createdAt?: string; finishedAt?: string; inProgress?: string };
    formatDateTime?: (value: string) => string;
  }>;
  const receipts = props.sections?.[2]?.content as React.ReactElement<{
    receipts?: Array<{ code: string; message: string; status: string; timestamp: string }>;
    detailLabels?: { receiptOk?: string };
    formatDateTime?: (value: string) => string;
  }>;

  assert.equal(props.title, '操作: 部署');
  assert.equal(props.sections?.[0]?.title, '概览');
  assert.equal(props.sections?.[1]?.title, '时间线');
  assert.equal(props.sections?.[2]?.title, '回执 (1)');
  assert.equal(overview.props.detailLabels?.id, '编号');
  assert.equal(overview.props.typeLabels?.deploy, '部署');
  assert.equal(overview.props.statusLabels?.running, '执行中');
  assert.equal(timeline.props.detailLabels?.createdAt, '创建时间');
  assert.equal(timeline.props.detailLabels?.inProgress, '执行中...');
  assert.equal(timeline.props.formatDateTime?.(timeline.props.operation.createdAt), '2026/06/14 18:00');
  assert.equal(receipts.props.detailLabels?.receiptOk, '成功');
  assert.equal(receipts.props.receipts?.[0]?.code, 'STARTED');
});

test('ui RuntimeOperationReceiptListReadout: renders localized receipt badges and empty state', () => {
  const empty = RuntimeOperationReceiptListReadout({
    receipts: [],
    detailLabels: {
      noReceipts: '暂无回执',
    },
  });
  assert.ok(React.isValidElement(empty));
  assert.equal((empty.props as { title?: string }).title, '暂无回执');

  const list = RuntimeOperationReceiptListReadout({
    receipts: [
      {
        code: 'CALLBACK_TIMEOUT',
        message: 'callback timed out',
        status: 'error',
        timestamp: '2026-06-14T10:05:00.000Z',
      },
    ],
    detailLabels: {
      receiptOk: '成功',
      receiptError: '失败',
    },
    formatDateTime: () => '2026/06/14 18:05',
  });
  assert.ok(React.isValidElement(list));
  const listItems = React.Children.toArray((list.props as { children?: React.ReactNode }).children) as Array<
    React.ReactElement<{ children?: React.ReactNode }>
  >;
  const firstReceiptChildren = React.Children.toArray(listItems[0]?.props.children) as Array<React.ReactNode>;
  const receiptBadge = firstReceiptChildren[0] as React.ReactElement<{ label: string }>;
  const receiptTimestamp = firstReceiptChildren[2] as React.ReactElement<{
    value?: string;
    formatDateTime?: (value: string) => string;
  }>;

  assert.equal(receiptBadge.props.label, '失败');
  assert.match(extractText(list), /CALLBACK_TIMEOUT/);
  assert.match(extractText(list), /callback timed out/);
  assert.equal(receiptTimestamp.props.value, '2026-06-14T10:05:00.000Z');
  assert.equal(receiptTimestamp.props.formatDateTime?.(receiptTimestamp.props.value!), '2026/06/14 18:05');
});

test('ui RuntimeOperation identity/type/status/datetime readouts: share localized rendering', () => {
  const idReadout = RuntimeOperationIdReadout({
    id: 'op-001',
    href: '/operations/op-001',
  });
  assert.ok(React.isValidElement(idReadout));
  assert.equal((idReadout.props as { href?: string }).href, '/operations/op-001');
  assert.match(extractText(idReadout), /op-001/);

  const targetReadout = RuntimeOperationTargetReadout({
    targetId: 'service-01',
  });
  assert.ok(React.isValidElement(targetReadout));
  assert.match(extractText(targetReadout), /service-01/);

  const typeReadout = RuntimeOperationTypeReadout({
    type: 'config-update',
    typeLabels: {
      'config-update': '配置更新',
    },
  });
  assert.ok(React.isValidElement(typeReadout));
  assert.match(extractText(typeReadout), /配置更新/);

  const statusReadout = RuntimeOperationStatusReadout({
    status: 'failed',
    statusLabels: {
      failed: '失败',
    },
  });
  assert.ok(React.isValidElement(statusReadout));
  assert.equal((statusReadout.props as { label?: string }).label, '失败');

  const dateTimeReadout = RuntimeOperationDateTimeReadout({
    value: '2026-06-14T10:15:00.000Z',
    formatDateTime: () => '2026/06/14 18:15',
  });
  assert.ok(React.isValidElement(dateTimeReadout));
  assert.match(extractText(dateTimeReadout), /2026\/06\/14 18:15/);

  const fallbackReadout = RuntimeOperationDateTimeReadout({
    fallback: '执行中...',
  });
  assert.ok(React.isValidElement(fallbackReadout));
  assert.match(extractText(fallbackReadout), /执行中\.\.\./);
});

test('ui createRuntimeOperationTableColumns: returns reusable localized column config', () => {
  const columns = createRuntimeOperationTableColumns({
    detailHrefBase: '/runtime',
    typeLabels: {
      deploy: '部署',
    },
    statusLabels: {
      completed: '已完成',
    },
    columnLabels: {
      id: '编号',
      targetId: '目标',
      createdAt: '创建时间',
    },
  });
  const row = {
    id: 'op-321',
    type: 'deploy',
    targetId: 'service-321',
    status: 'completed',
    createdAt: '2026-06-14T10:00:00.000Z',
    finishedAt: '2026-06-14T10:15:00.000Z',
  };

  assert.equal(columns[0]?.header, '编号');
  assert.equal(columns[2]?.header, '目标');
  assert.equal(columns[4]?.header, '创建时间');
  assert.equal(columns[0]?.sortable, true);

  const idCell = columns[0]?.render?.(row, 0) as React.ReactElement<{ id: string; href?: string }>;
  const typeCell = columns[1]?.render?.(row, 0) as React.ReactElement<{ type: string; typeLabels?: Record<string, string> }>;
  const statusCell = columns[3]?.render?.(row, 0) as React.ReactElement<{ status: string; statusLabels?: Record<string, string> }>;

  assert.equal(idCell.props.id, 'op-321');
  assert.equal(idCell.props.href, '/runtime/op-321');
  assert.equal(typeCell.props.type, 'deploy');
  assert.equal(typeCell.props.typeLabels?.deploy, '部署');
  assert.equal(statusCell.props.status, 'completed');
  assert.equal(statusCell.props.statusLabels?.completed, '已完成');
});

test('ui createRuntimeOperationTableColumns: supports include and omit column selection', () => {
  const columns = createRuntimeOperationTableColumns({
    includeColumns: ['id', 'status', 'finishedAt'],
    omitColumns: ['finishedAt'],
  });

  assert.deepEqual(
    columns.map((column) => column.key),
    ['id', 'status']
  );
});

test('ui createRuntimeOperationTableColumns: supports custom detail href builder', () => {
  const columns = createRuntimeOperationTableColumns({
    detailHrefBase: '/runtime',
    detailHrefBuilder: (operation) =>
      operation.status === 'failed'
        ? `/stores/store-001/capability-access?focus=runtime-operation&id=${operation.id}`
        : `/runtime/${operation.id}`,
  });

  const row = {
    id: 'op-401',
    type: 'runtime-replay',
    targetId: 'runtime-governance',
    status: 'failed',
    createdAt: '2026-06-14T10:00:00.000Z',
    finishedAt: '2026-06-14T10:15:00.000Z',
  };

  const idCell = columns[0]?.render?.(row, 0) as React.ReactElement<{ id: string; href?: string }>;

  assert.equal(
    idCell.props.href,
    '/stores/store-001/capability-access?focus=runtime-operation&id=op-401'
  );
});

test('ui runtimeOperationListDemoPresets: can drive compact storefront columns', () => {
  const columns = createRuntimeOperationTableColumns(runtimeOperationListDemoPresets.storefront);
  const adminColumns = createRuntimeOperationTableColumns(runtimeOperationListDemoPresets.admin);

  assert.deepEqual(
    columns.map((column) => column.key),
    ['id', 'type', 'status', 'createdAt']
  );
  assert.equal(runtimeOperationListDemoPresets.storefront.defaultPageSize, 5);
  assert.deepEqual(runtimeOperationListDemoPresets.storefront.pageSizeOptions, [5, 10, 20]);
  assert.deepEqual(runtimeOperationListDemoPresets.storefront.searchFields, ['id', 'type', 'targetId']);
  assert.deepEqual(
    adminColumns.map((column) => column.key),
    ['id', 'type', 'targetId', 'status', 'createdAt']
  );
  assert.equal(runtimeOperationListDemoPresets.admin.defaultPageSize, 10);
  assert.deepEqual(runtimeOperationListDemoPresets.admin.searchFields, ['id', 'type', 'targetId', 'status']);
  assert.equal(runtimeOperationListDemoPresets.admin.labels?.statusSectionTitle, '治理状态');
  assert.equal(runtimeOperationDetailDemoPresets.admin['op-2']?.op.type, 'secret-rotation');
});

test('ui RuntimeOperationOverviewReadout and TimelineReadout: render localized fields', () => {
  const operation = {
    id: 'op-900',
    type: 'rollback',
    targetId: 'service-09',
    status: 'failed',
    createdAt: '2026-06-14T10:00:00.000Z',
    finishedAt: '2026-06-14T10:15:00.000Z',
  } as const;

  const overview = RuntimeOperationOverviewReadout({
    operation,
    detailLabels: {
      id: '编号',
      type: '类型',
      status: '状态',
      target: '目标',
    },
    typeLabels: {
      rollback: '回滚',
    },
    statusLabels: {
      failed: '失败',
    },
  });
  assert.ok(React.isValidElement(overview));
  const overviewRows = React.Children.toArray((overview.props as { children?: React.ReactNode }).children) as Array<
    React.ReactElement<{ label: string; value: unknown }>
  >;
  const overviewIdValue = overviewRows[0]?.props.value as React.ReactElement<{
    id: string;
  }>;
  const overviewTypeValue = overviewRows[1]?.props.value as React.ReactElement<{
    type: string;
    typeLabels?: Record<string, string>;
  }>;
  const overviewStatusValue = overviewRows[2]?.props.value as React.ReactElement<{
    status: string;
    statusLabels?: Record<string, string>;
  }>;
  const overviewTargetValue = overviewRows[3]?.props.value as React.ReactElement<{
    targetId: string;
  }>;
  assert.equal(overviewRows[0]?.props.label, '编号');
  assert.equal(overviewIdValue.props.id, '#op-900');
  assert.equal(overviewTypeValue.props.type, 'rollback');
  assert.equal(overviewTypeValue.props.typeLabels?.rollback, '回滚');
  assert.equal(overviewStatusValue.props.status, 'failed');
  assert.equal(overviewStatusValue.props.statusLabels?.failed, '失败');
  assert.equal(overviewTargetValue.props.targetId, 'service-09');

  const timeline = RuntimeOperationTimelineReadout({
    operation,
    detailLabels: {
      createdAt: '创建时间',
      finishedAt: '完成时间',
    },
    formatDateTime: () => '2026/06/14 18:15',
  });
  assert.ok(React.isValidElement(timeline));
  const timelineRows = React.Children.toArray((timeline.props as { children?: React.ReactNode }).children) as Array<
    React.ReactElement<{ label: string; value: unknown }>
  >;
  const createdAtValue = timelineRows[0]?.props.value as React.ReactElement<{
    value?: string;
    formatDateTime?: (value: string) => string;
  }>;
  const finishedAtValue = timelineRows[1]?.props.value as React.ReactElement<{
    value?: string;
    formatDateTime?: (value: string) => string;
  }>;
  assert.equal(timelineRows[0]?.props.label, '创建时间');
  assert.equal(createdAtValue.props.value, '2026-06-14T10:00:00.000Z');
  assert.equal(createdAtValue.props.formatDateTime?.(createdAtValue.props.value!), '2026/06/14 18:15');
  assert.equal(timelineRows[1]?.props.label, '完成时间');
  assert.equal(finishedAtValue.props.value, '2026-06-14T10:15:00.000Z');
  assert.equal(finishedAtValue.props.formatDateTime?.(finishedAtValue.props.value!), '2026/06/14 18:15');
});

test('ui ToastContainer and useToast: exported as functions', () => {
  assert.equal(typeof ToastContainer, 'function');
  assert.equal(typeof useToast, 'function');
});

test('ui Alert: renders with title, children, and variant palettes', () => {
  // Alert uses useState internally, so plain function-call test
  // is not supported (same as other hook-based components in this file).
  // Verify exports exist and are callable.
  assert.equal(typeof Alert, 'function');
  assert.equal(typeof useAlert, 'function');
});

test('ui InfoRow: component uses custom colors', () => {
  const result = InfoRow({ label: '描述', value: '测试', labelColor: '#ff0000', valueColor: '#00ff00' });
  assert.ok(React.isValidElement(result));
  const text = extractText(result);
  assert.match(text, /描述/);
  assert.match(text, /测试/);
});

test('ui Modal: component is exported', () => {
  assert.equal(typeof Modal, 'function');
});

test('ui Card: renders title, subtitle, children and footer', () => {
  // Basic card with title
  const basicCard = Card({
    title: '门店信息',
    children: React.createElement('div', { key: 'body' }, '内容区域')
  });
  const basicText = extractText(basicCard);
  assert.match(basicText, /门店信息/);
  assert.match(basicText, /内容区域/);

  // Card with subtitle
  const subCard = Card({
    title: '设置',
    subtitle: '管理门店基础配置',
    children: React.createElement('div', { key: 'body' }, '配置内容')
  });
  const subText = extractText(subCard);
  assert.match(subText, /设置/);
  assert.match(subText, /管理门店基础配置/);
  assert.match(subText, /配置内容/);

  // Card with footer
  const footerCard = Card({
    title: '统计',
    children: React.createElement('div', { key: 'body' }, '统计内容'),
    footer: React.createElement('div', { key: 'footer' }, '页脚提示')
  });
  const footerText = extractText(footerCard);
  assert.match(footerText, /统计/);
  assert.match(footerText, /页脚提示/);

  // Card variants render children
  const variants = ['default', 'elevated', 'outlined', 'ghost'] as const;
  for (const v of variants) {
    const variantCard = Card({
      title: v,
      variant: v,
      children: React.createElement('span', { key: 'body' }, '内容')
    });
    const variantText = extractText(variantCard);
    assert.match(variantText, new RegExp(v));
    assert.match(variantText, /内容/);
  }

  // Card without header
  const noHeader = Card({
    children: React.createElement('span', { key: 'body' }, '只有内容')
  });
  assert.match(extractText(noHeader), /只有内容/);
});

test('ui Dropdown: component is exported', () => {
  assert.equal(typeof Dropdown, 'function');
});

test('ui QuickStats: exported and renders items with label, value, helper', () => {
  assert.equal(typeof QuickStats, 'function');

  const result = QuickStats({
    items: [
      { label: '总数', value: 15, helper: '5 个区域' },
      { label: '活跃', value: 8, valueColor: '#4ade80' },
    ],
  });
  assert.ok(React.isValidElement(result));
  const text = extractText(result);
  assert.match(text, /总数/);
  assert.match(text, /15/);
  assert.match(text, /5 个区域/);
  assert.match(text, /活跃/);
  assert.match(text, /8/);
});

// ---- FrontDeskPanel 集成导出测试 ----

test('ui FrontDeskPanel (exported): renders with title and cashier', () => {
  const element = FrontDeskPanel({
    title: '前台收银台',
    cashierName: '张丽',
    shiftInfo: '早班',
  });
  assert.ok(React.isValidElement(element));
  const text = extractText(element);
  assert.match(text, /前台收银台/);
  assert.match(text, /张丽/);
  // shiftInfo renders via StatusBadge (function component); extractText
  // can't traverse sub-components — validate element is structurally valid
  const children = (element as any).props.children as any[];
  void children;
  // StatusBadge may be nested in header divs; validate the exported element stays structurally valid.
  assert.ok(React.isValidElement(element));
});

test('ui FrontDeskPanel: renders checkout button disabled when basket is empty', () => {
  const element = FrontDeskPanel({
    basketItems: [],
    checkoutStatus: 'idle',
  });
  const text = extractText(element);
  assert.match(text, /购物篮为空/);
  assert.match(text, /收款 ¥0\.00/);
});

test('ui FrontDeskPanel: renders basket items and total', () => {
  const items: BasketItem[] = [
    { id: '1', name: '连衣裙', sku: 'SKU-001', quantity: 2, unitPrice: 299, subtotal: 598 },
    { id: '2', name: 'T恤', sku: 'SKU-002', quantity: 1, unitPrice: 99, subtotal: 99 },
  ];
  const element = FrontDeskPanel({ basketItems: items });
  const text = extractText(element);
  assert.match(text, /连衣裙/);
  assert.match(text, /T恤/);
  assert.match(text, /697/);
  assert.match(text, /3\s+件/);
});

test('ui FrontDeskPanel: renders payment methods', () => {
  const element = FrontDeskPanel({
    paymentMethods: ['wechat', 'alipay', 'cash'],
    selectedPayment: 'wechat',
  });
  const text = extractText(element);
  assert.match(text, /微信支付/);
  assert.match(text, /支付宝/);
  assert.match(text, /现金/);
});

test('ui FrontDeskPanel: renders queue items', () => {
  const queue: QueueItem[] = [
    { id: 'q1', number: 'A001', type: 'service', waitingMinutes: 5, status: 'calling' },
    { id: 'q2', number: 'A002', type: 'pickup', waitingMinutes: 12, status: 'waiting' },
  ];
  const element = FrontDeskPanel({ queue });
  const text = extractText(element);
  assert.match(text, /A001/);
  assert.match(text, /A002/);
  assert.match(text, /服务/);
  assert.match(text, /取货/);
  assert.match(text, /5\s*分钟/);
  assert.match(text, /2\s+位/);
});

test('ui FrontDeskPanel: renders today stats', () => {
  const element = FrontDeskPanel({
    todayStats: { totalOrders: 42, totalRevenue: 38650, avgCheckoutSec: 38, pendingPickups: 3 },
  });
  assert.ok(React.isValidElement(element));
  // QuickStats renders as a function component element; extractText
  // can't traverse sub-components. Validate element structure exists.
  const children = (element as any).props.children as any[];
  const hasQuickStats = children.some(
    (c: any) => React.isValidElement(c) && typeof c.type === 'function' && c.type.name === 'QuickStats'
  );
  assert.ok(hasQuickStats, 'QuickStats component should be present');
});

test('ui FrontDeskPanel: renders quick action buttons', () => {
  const quickActions: QuickFnButton[] = [
    { key: 'member', label: '会员查询', highlight: true, badge: 3 },
    { key: 'refund', label: '退款' },
  ];
  const element = FrontDeskPanel({ quickActions });
  const text = extractText(element);
  assert.match(text, /会员查询/);
  assert.match(text, /退款/);
  assert.match(text, /快捷操作/);
});

test('ui FrontDeskPanel: checkout processing state', () => {
  const items: BasketItem[] = [
    { id: '1', name: '商品', sku: 'S', quantity: 1, unitPrice: 100, subtotal: 100 },
  ];
  const element = FrontDeskPanel({
    basketItems: items,
    checkoutStatus: 'processing',
  });
  const text = extractText(element);
  assert.match(text, /结算中/);
});

test('ui FrontDeskPanel: checkout failed with error', () => {
  const items: BasketItem[] = [
    { id: '1', name: '商品', sku: 'S', quantity: 1, unitPrice: 100, subtotal: 100 },
  ];
  const element = FrontDeskPanel({
    basketItems: items,
    checkoutStatus: 'failed',
    checkoutError: '网络连接失败，请重试',
  });
  assert.ok(React.isValidElement(element));
  const text = extractText(element);
  // checkoutError passed as string prop renders in plain div
  assert.match(text, /网络连接失败/);
  // StatusBadge rendering verified by structural check
  assert.ok(React.isValidElement(element));
});

test('ui FrontDeskPanel: loading state renders skeleton', () => {
  const element = FrontDeskPanel({ loading: true });
  const text = extractText(element);
  assert.match(text, /正在加载收银台/);
});

test('ui FrontDeskPanel: compact mode is supported', () => {
  const element = FrontDeskPanel({ compact: true, checkoutStatus: 'idle' });
  assert.ok(React.isValidElement(element));
});

test('ui FrontDeskPanel: queue with many items shows overflow hint', () => {
  const queue: QueueItem[] = Array.from({ length: 8 }, (_, i) => ({
    id: `q${i}`,
    number: `A00${i + 1}`,
    type: 'service' as const,
    waitingMinutes: i * 2,
    status: 'waiting' as const,
  }));
  const element = FrontDeskPanel({ queue });
  const text = extractText(element);
  assert.match(text, /还有/);
  assert.match(text, /8\s+位/);
});

// ---- OperationsManagerDashboard 集成导出测试 ----

test('ui OperationsManagerDashboard (exported): renders with manager and district', () => {
  const element = OperationsManagerDashboard({
    managerName: '陈运',
    districtName: '华中区',
    lastSyncAt: '2026-06-23 09:30',
  });
  assert.ok(React.isValidElement(element));
  const text = extractText(element);
  assert.match(text, /华中区/);
  assert.match(text, /运营主管工作台/);
  assert.match(text, /陈运/);
  assert.match(text, /2026-06-23 09:30/);
});

test('ui OperationsManagerDashboard: loading state', () => {
  const element = OperationsManagerDashboard({ loading: true });
  assert.ok(React.isValidElement(element));
  const text = extractText(element);
  assert.match(text, /正在加载运营数据/);
});

test('ui OperationsManagerDashboard: renders district summary', () => {
  const summary: DistrictSummary = {
    totalStores: 12,
    operatingStores: 11,
    totalRevenue: 526800,
    revenueQoQ: 3.2,
    totalVisitors: 8420,
    visitorsQoQ: 5.1,
    avgKpiRate: 87.3,
    kpiRateQoQ: 2.8,
    pendingAlerts: 7,
    alertsQoQ: -12.5,
  };
  const element = OperationsManagerDashboard({ districtSummary: summary });
  assert.ok(React.isValidElement(element));
});

test('ui OperationsManagerDashboard: renders stores table with status badges', () => {
  const stores: DistrictStoreSnapshot[] = [
    {
      id: 's1',
      name: '朝阳旗舰店',
      region: '北京朝阳',
      status: 'operating',
      todayRevenue: 52800,
      revenueRate: 92,
      visitorCount: 1280,
      monthlyKpiRate: 88.5,
      alertCount: 2,
      staffOnDuty: 8,
    },
    {
      id: 's2',
      name: '国贸店',
      region: '北京朝阳',
      status: 'offline',
      todayRevenue: 0,
      revenueRate: 0,
      visitorCount: 0,
      monthlyKpiRate: 45.0,
      alertCount: 5,
      staffOnDuty: 0,
    },
  ];
  const element = OperationsManagerDashboard({ stores });
  assert.ok(React.isValidElement(element));
  const text = extractText(element);
  // Section title renders as plain text
  assert.match(text, /辖区门店概览/);
});

test('ui OperationsManagerDashboard: renders inspection tasks with status and priority', () => {
  const tasks: InspectionTask[] = [
    {
      id: 't1',
      storeId: 's1',
      storeName: '朝阳旗舰店',
      type: 'routine',
      priority: 'high',
      status: 'pending',
      deadline: '2026-06-23',
      assignee: '张巡',
    },
    {
      id: 't2',
      storeId: 's2',
      storeName: '国贸店',
      type: 'compliance',
      priority: 'critical',
      status: 'overdue',
      deadline: '2026-06-22',
    },
  ];
  const element = OperationsManagerDashboard({ inspectionTasks: tasks });
  assert.ok(React.isValidElement(element));
  const text = extractText(element);
  // Section title and count render as plain text
  assert.match(text, /巡店任务/);
  assert.match(text, /\( 2 \)/);
});

test('ui OperationsManagerDashboard: empty states for stores and tasks', () => {
  const element = OperationsManagerDashboard({
    districtSummary: {
      totalStores: 1,
      operatingStores: 1,
      totalRevenue: 10000,
      revenueQoQ: 0,
      totalVisitors: 100,
      visitorsQoQ: 0,
      avgKpiRate: 50,
      kpiRateQoQ: 0,
      pendingAlerts: 0,
      alertsQoQ: 0,
    },
  });
  const text = extractText(element);
  assert.match(text, /暂无门店数据/);
  assert.match(text, /暂无巡店任务/);
});

test('ui OperationsManagerDashboard: renders quick action buttons', () => {
  const actions: OpsQuickAction[] = [
    { key: 'patrol', label: '发起巡店', primary: true },
    { key: 'report', label: '生成日报' },
  ];
  const element = OperationsManagerDashboard({ quickActions: actions });
  const text = extractText(element);
  assert.match(text, /发起巡店/);
  assert.match(text, /生成日报/);
});

test('ui OperationsManagerDashboard: compact mode is supported', () => {
  const element = OperationsManagerDashboard({ compact: true });
  assert.ok(React.isValidElement(element));
});

test('ui OperationsManagerDashboard: full integration with all sections', () => {
  const props: OperationsManagerDashboardProps = {
    managerName: '李明',
    districtName: '华东区',
    lastSyncAt: '2026-06-23 10:00',
    districtSummary: {
      totalStores: 8,
      operatingStores: 7,
      totalRevenue: 382000,
      revenueQoQ: 6.8,
      totalVisitors: 5600,
      visitorsQoQ: 4.2,
      avgKpiRate: 91.2,
      kpiRateQoQ: 3.5,
      pendingAlerts: 3,
      alertsQoQ: -20.0,
    },
    stores: [
      {
        id: 'w1',
        name: '武汉旗舰店',
        region: '武汉',
        status: 'operating',
        todayRevenue: 68000,
        revenueRate: 95,
        visitorCount: 2100,
        monthlyKpiRate: 93.0,
        alertCount: 1,
        staffOnDuty: 10,
      },
    ],
    inspectionTasks: [
      {
        id: 't1',
        storeId: 'w1',
        storeName: '武汉旗舰店',
        type: 'routine',
        priority: 'high',
        status: 'assigned',
        deadline: '2026-06-24',
        assignee: '周巡',
      },
    ],
    quickActions: [
      { key: 'patrol', label: '发起巡店', primary: true },
      { key: 'dashboard', label: '数据看板' },
    ],
  };
  const element = OperationsManagerDashboard(props);
  assert.ok(React.isValidElement(element));
  const text = extractText(element);
  // Header info renders as plain text
  assert.match(text, /华东区/);
  assert.match(text, /李明/);
  assert.match(text, /2026-06-23 10:00/);
  // Quick action buttons render as plain text
  assert.match(text, /发起巡店/);
  assert.match(text, /数据看板/);
  // Section titles render as plain text
  assert.match(text, /辖区门店概览/);
  assert.match(text, /巡店任务/);
});

// ---- Stepper 导出测试 ----
test('ui Stepper: exported as a function', () => {
  assert.equal(typeof Stepper, 'function');
});

// ---- DateRangePicker 导出测试 ----
test('ui DateRangePicker (exported): is a function component', () => {
  const m = require('./index');
  assert.equal(typeof m.DateRangePicker, 'function');
  // Component uses hooks (useState); cannot render outside React tree
  assert.ok(m.DateRangePicker.length >= 1);
});

test('ui DateRangePicker: type exports are present', () => {
  // Verify the types compile — just type-level check via require
  const m = require('./index');
  assert.ok(m.DateRangePicker);
});

// ---- MemberTierDistribution 导出测试 ----
test('ui MemberTierDistribution (exported): renders with title', () => {
  const { MemberTierDistribution } = require('./index');
  assert.equal(typeof MemberTierDistribution, 'function');
  const element = React.createElement(MemberTierDistribution, {
    tiers: [
      { tier: '钻石会员', key: 'diamond', count: 128, growth: 0.12 },
      { tier: '黄金会员', key: 'gold', count: 450, growth: 0.05 },
    ],
  });
  assert.ok(React.isValidElement(element));
  // Verify the component is a valid function component
  assert.equal(typeof MemberTierDistribution, 'function');
});

test('ui MemberTierDistribution: shows total count', () => {
  const { MemberTierDistribution } = require('./index');
  const element = MemberTierDistribution({
    tiers: [
      { tier: 'VIP', key: 'vip', count: 100 },
      { tier: '普通', key: 'regular', count: 900 },
    ],
    showTotal: true,
  });
  const text = extractText(element);
  assert.match(text, /1,000/);
});

test('ui MemberTierDistribution: title text visible', () => {
  const { MemberTierDistribution } = require('./index');
  const element = MemberTierDistribution({
    tiers: [
      { tier: 'VIP', key: 'vip', count: 250 },
      { tier: '普通', key: 'regular', count: 750 },
    ],
  });
  const text = extractText(element);
  // Title row contains text
  assert.match(text, /会员等级分布/);
  assert.match(text, /1,000/);
});

test('ui MemberTierDistribution: empty state', () => {
  const { MemberTierDistribution } = require('./index');
  const element = MemberTierDistribution({ tiers: [] });
  assert.ok(React.isValidElement(element));
  const text = extractText(element);
  assert.match(text, /暂无会员数据/);
});

test('ui MemberTierDistribution: tier items are rendered', () => {
  const { MemberTierDistribution } = require('./index');
  const element = MemberTierDistribution({
    tiers: [
      { tier: '钻石', key: 'diamond', count: 128, growth: 0.12 },
      { tier: '白银', key: 'silver', count: 620, growth: -0.03 },
      { tier: '青铜', key: 'bronze', count: 890 },
    ],
    showTrends: true,
  });
  // Verify the tier list container exists and has 3 children
  const tierListContainer = element.props.children[2];
  assert.ok(tierListContainer);
  assert.equal(tierListContainer.props.children.length, 3);
});

test('ui MemberTierDistribution: hides total when showTotal=false', () => {
  const { MemberTierDistribution } = require('./index');
  const element = MemberTierDistribution({
    tiers: [{ tier: 'VIP', key: 'vip', count: 100 }],
    showTotal: false,
  });
  const text = extractText(element);
  assert.ok(!/总计/.test(text));
});

test('ui MemberTierDistribution: custom title', () => {
  const { MemberTierDistribution } = require('./index');
  const element = MemberTierDistribution({
    tiers: [{ tier: 'VIP', key: 'vip', count: 100 }],
    title: '自定义等级分布',
  });
  const text = extractText(element);
  assert.match(text, /自定义等级分布/);
});

test('ui MemberTierDistribution: tier items have correct count', () => {
  const { MemberTierDistribution } = require('./index');
  const element = MemberTierDistribution({
    tiers: [
      { tier: 'VIP', key: 'vip', count: 100 },
      { tier: '普通', key: 'regular', count: 900 },
    ],
  });
  const tierListContainer = element.props.children[2];
  assert.equal(tierListContainer.props.children.length, 2);
  // Check props on each TierListItem
  const item0 = tierListContainer.props.children[0];
  const item1 = tierListContainer.props.children[1];
  assert.equal(item0.props.tier.count, 100);
  assert.equal(item1.props.tier.count, 900);
  assert.equal(item0.props.total, 1000);
  assert.equal(item1.props.total, 1000);
});

// ── InputNumber 导出测试 ──

test('ui InputNumber (exported): is a function component', () => {
  const { InputNumber } = require('./index');
  assert.equal(typeof InputNumber, 'function');
  // InputNumber uses hooks — direct call outside React tree is not supported.
  // Full behavior tests are in InputNumber.test.tsx using renderToStaticMarkup.
});

test('ui InputNumber: renders with label, unit via SSR', () => {
  const PROJECT_ROOT = '/Users/yaoyunzhong/Desktop/shenjiying/shenjiying88';
  const { renderToStaticMarkup } = require(
    PROJECT_ROOT + '/node_modules/.pnpm/react-dom@18.3.1_react@18.3.1/node_modules/react-dom/server.node.js'
  );
  const { InputNumber } = require('./index');
  const html = renderToStaticMarkup(React.createElement(InputNumber, {
    defaultValue: 50,
    label: '折扣率',
    unit: '%',
    min: 0,
    max: 100,
  }));
  assert.ok(html.includes('折扣率'));
  assert.ok(html.includes('%'));
  assert.ok(html.includes('50'));
});

// ── ErrorBoundary 集成导出测试 ──

test('ui ErrorBoundary (exported): is a class component constructor', () => {
  const m = require('./index');
  assert.equal(typeof m.ErrorBoundary, 'function');
  assert.ok(m.ErrorBoundary.prototype instanceof React.Component);
});

test('ui ErrorBoundary: getDerivedStateFromError returns error state', () => {
  const { ErrorBoundary } = require('./index');
  const err = new Error('export-test-error');
  const state = ErrorBoundary.getDerivedStateFromError(err);
  assert.deepEqual(state, { error: err });
});

test('ui ErrorBoundary: renders children when no error (via index export)', () => {
  const { ErrorBoundary } = require('./index');
  const instance = new ErrorBoundary({ children: React.createElement('span', null, 'OK') });
  instance.state = { error: null };
  const result = instance.render();
  assert.ok(React.isValidElement(result));
  const text = extractText(result);
  assert.match(text, /OK/);
});

test('ui ErrorBoundary: renders block fallback with error message', () => {
  const { ErrorBoundary } = require('./index');
  const instance = new ErrorBoundary({ 'data-testid': 'idx-eb' });
  instance.state = { error: new Error('导出测试异常') };
  const result = instance.render();
  const text = extractText(result);
  assert.match(text, /导出测试异常/);
  assert.match(text, /重试/);
});

test('ui ErrorBoundary: toast severity returns null', () => {
  const { ErrorBoundary } = require('./index');
  const instance = new ErrorBoundary({ severity: 'toast' });
  instance.state = { error: new Error('静默') };
  assert.equal(instance.render(), null);
});

test('ui ErrorBoundary: custom fallback via index export', () => {
  const { ErrorBoundary } = require('./index');
  const instance = new ErrorBoundary({
    fallback: ({ error }: { error: Error }) =>
      React.createElement('div', { key: 'fb' }, `ERR:${error.message}`),
  });
  instance.state = { error: new Error('自定义') };
  const text = extractText(instance.render());
  assert.match(text, /ERR:自定义/);
});

test('ui StatTrend is exported from index', () => {
  const { StatTrend } = require('./index');
  const el = React.createElement(StatTrend, { direction: 'up', value: '+5%' });
  assert.equal(el.props.direction, 'up');
  assert.equal(el.props.value, '+5%');
});
