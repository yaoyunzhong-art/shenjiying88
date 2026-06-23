'use client';

import { Suspense, useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  DetailActionBar,
  RuntimeOperationsListPageSection,
} from '@m5/ui';
import { deriveScopedCapabilityActionItem, type GatedCapabilityActionItem } from '../lyt-capability-access';
import { StoreCapabilityActionStrip } from '../components/store-capability-action-strip';
import { adminRuntimeOperationsPreset, adminRuntimeOperationsRoute } from '../operations-data';
import {
  batchReplayAdminRuntimeReceipts,
  filterAdminRuntimeOperationsByFocus,
  getReplayableAdminRuntimeReceipts,
  loadAdminRuntimeOperations,
  type AdminRuntimeOperationsFocus,
} from '../operations-view-model';
import { StoreCapabilityGatingBanner } from '../components/store-capability-gating-banner';
import { useStoreCapabilityGating } from '../components/use-store-capability-gating';
import { RuntimeGovernancePanel } from '../components/runtime-governance-panel';
import { useDetailActions } from '../components/use-detail-actions';

function OperationsListPageContent() {
  const searchParams = useSearchParams();
  const [snapshot, setSnapshot] = useState<{
    deliveryMode: 'api' | 'fallback';
    generatedAt: string;
    operations: Parameters<typeof RuntimeOperationsListPageSection>[0]['operations'];
    receipts: Parameters<typeof getReplayableAdminRuntimeReceipts>[0]['receipts'];
    stalledReceipts: Array<{
      receiptCode: string;
      escalationAction: string;
      summary: string;
    }>;
    batchSummary: {
      filteredReceipts: number;
      replayableReceipts: number;
      governanceAuditReceipts: number;
      stalledReceipts: number;
      blockedReceipts: number;
      highRiskReceipts: number;
    };
    summary: {
      backlog: number;
      stalledCallbacks: number;
      highRiskBacklog: number;
      blockedActions: number;
    };
  }>({
    deliveryMode: 'fallback',
    generatedAt: new Date().toISOString(),
    operations: [],
    receipts: [],
    stalledReceipts: [],
    batchSummary: {
      filteredReceipts: 0,
      replayableReceipts: 0,
      governanceAuditReceipts: 0,
      stalledReceipts: 0,
      blockedReceipts: 0,
      highRiskReceipts: 0,
    },
    summary: {
      backlog: 0,
      stalledCallbacks: 0,
      highRiskBacklog: 0,
      blockedActions: 0,
    },
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isBatchReplaying, setIsBatchReplaying] = useState(false);
  const [batchReplayMessage, setBatchReplayMessage] = useState<string | null>(null);
  const operationsGating = useStoreCapabilityGating({
    targetCapabilities: ['payment', 'order', 'device', 'gate', 'coin']
  });
  const focus = useMemo<AdminRuntimeOperationsFocus>(() => {
    const raw = searchParams.get('focus');
    if (raw === 'batch-replay' || raw === 'governance-audit') {
      return raw;
    }
    return 'all';
  }, [searchParams]);

  useEffect(() => {
    let disposed = false;

    async function hydrateOperations() {
      try {
        const nextSnapshot = await loadAdminRuntimeOperations(focus);
        if (!disposed) {
          setSnapshot(nextSnapshot);
        }
      } finally {
        if (!disposed) {
          setIsLoading(false);
        }
      }
    }

    void hydrateOperations();

    return () => {
      disposed = true;
    };
  }, [focus]);

  const replayableReceipts = useMemo(
    () => getReplayableAdminRuntimeReceipts(snapshot),
    [snapshot]
  );
  const filteredOperations = useMemo(
    () => filterAdminRuntimeOperationsByFocus(snapshot, focus),
    [focus, snapshot]
  );
  const focusDescription = useMemo(() => {
    if (focus === 'batch-replay') {
      return `当前聚焦 ${snapshot.batchSummary.replayableReceipts} 条可回放治理回执。`;
    }
    if (focus === 'governance-audit') {
      return `当前聚焦 ${snapshot.batchSummary.governanceAuditReceipts} 条高风险、阻塞或 stalled 治理回执。`;
    }
    return '当前展示全部 runtime governance backlog。';
  }, [focus, snapshot.batchSummary.governanceAuditReceipts, snapshot.batchSummary.replayableReceipts]);
  const handleBatchReplay = useCallback(async () => {
    const targetReceipts = replayableReceipts;
    if (targetReceipts.length === 0) {
      setBatchReplayMessage('当前没有可批量回放的治理回执。');
      return;
    }

    setIsBatchReplaying(true);
    setBatchReplayMessage(null);
    try {
      const result = await batchReplayAdminRuntimeReceipts(targetReceipts);
      const nextSnapshot = await loadAdminRuntimeOperations(focus);
      setSnapshot(nextSnapshot);
      const approvalsPending = result.items.filter((item) => item.receipt.approval?.status === 'PENDING').length;
      const dispatched = result.total - approvalsPending;
      setBatchReplayMessage(
        approvalsPending > 0
          ? `已调度 ${dispatched} 条治理回执，另有 ${approvalsPending} 条高风险回执已转入审批。`
          : `已提交 ${result.total} 条治理回执的批量 replay。`
      );
    } catch {
      setBatchReplayMessage('批量 replay 失败，请检查 foundation.runtime-governance.write 权限或 API 可达性。');
    } finally {
      setIsBatchReplaying(false);
    }
  }, [focus, replayableReceipts]);

  const description = `${adminRuntimeOperationsRoute.description} 当前数据源：${
    snapshot.deliveryMode === 'api' ? 'foundation runtime backlog' : 'fallback'
  }。${focusDescription}`;
  const gatedBulkActions = useMemo<GatedCapabilityActionItem[]>(
    () => [
      ...(operationsGating.visibleActions[0]
        ? [
            deriveScopedCapabilityActionItem(operationsGating.visibleActions[0], {
              key: 'operations-bulk-replay',
              label:
                operationsGating.visibleActions[0].isDisabled
                  ? '等待批量回放'
                  : operationsGating.visibleActions[0].access === 'degraded'
                    ? '降级批量回放'
                    : '批量回放',
              href: `/operations?storeId=${operationsGating.storeId}&focus=batch-replay`,
              hint: `${operationsGating.visibleActions[0].hint} 用于治理回执批量回放。`
            })
          ]
        : []),
      ...(operationsGating.visibleActions[1]
        ? [
            deriveScopedCapabilityActionItem(operationsGating.visibleActions[1], {
              key: 'operations-bulk-audit',
              label:
                operationsGating.visibleActions[1].isDisabled
                  ? '等待治理巡检'
                  : operationsGating.visibleActions[1].access === 'degraded'
                    ? '降级治理巡检'
                    : '治理巡检',
              href: `/operations?storeId=${operationsGating.storeId}&focus=governance-audit`,
              hint: `${operationsGating.visibleActions[1].hint} 用于治理异常批量巡检。`
            })
          ]
        : [])
    ],
    [operationsGating.storeId, operationsGating.visibleActions]
  );
  const canOpenOperationDetail = Boolean(operationsGating.primaryNavigableAction);

  const { actions } = useDetailActions({
    workspace: 'operations',
    detailId: focus,
    record: { snapshot, focus, deliveryMode: snapshot.deliveryMode },
    shareTitle: '运营工作台',
    shareText: '查看治理操作 backlog / 批量回放 / 治理巡检'
  });

  return (
    <>
      {isLoading ? (
        <div
          style={{
            marginBottom: 16,
            borderRadius: 12,
            padding: '12px 14px',
            border: '1px solid rgba(148, 163, 184, 0.18)',
            background: 'rgba(15, 23, 42, 0.35)',
            color: '#cbd5e1',
            fontSize: 13,
          }}
        >
          正在同步真实治理操作...
        </div>
      ) : null}
      <StoreCapabilityGatingBanner
        title="运营入口治理"
        description="治理操作页会联合 payment、order、device、gate、coin 能力判断是否允许直接进入、降级进入或先阻塞相关运营动作。"
        targetCapabilities={['payment', 'order', 'device', 'gate', 'coin']}
        surfaceHref="/stores"
        surfaceLabel="返回门店列表"
      />
      <StoreCapabilityActionStrip
        title="运营批量动作"
        description="批量回放和治理巡检会直接复用 payment / order / device / gate / coin capability gating。"
        actions={gatedBulkActions}
        emptyHint="当前门店没有可执行的运营批量动作，请先检查对应 capability access。"
      />
      {!canOpenOperationDetail && !operationsGating.isLoading ? (
        <div
          style={{
            marginBottom: 16,
            borderRadius: 12,
            padding: '12px 14px',
            border: '1px solid rgba(248, 113, 113, 0.24)',
            background: 'rgba(127, 29, 29, 0.22)',
            color: '#fecaca',
            fontSize: 13,
          }}
        >
          当前门店治理相关 capability 处于阻塞或隐藏状态，运营列表详情入口已回退到能力矩阵，请先处理治理问题。
        </div>
      ) : null}
      {focus === 'batch-replay' ? (
        <div
          style={{
            marginBottom: 16,
            borderRadius: 12,
            padding: '14px 16px',
            border: '1px solid rgba(96, 165, 250, 0.24)',
            background: 'rgba(15, 23, 42, 0.45)',
          }}
        >
          <div style={{ fontSize: 16, fontWeight: 600, color: '#e2e8f0', marginBottom: 6 }}>
            批量回放工作台
          </div>
          <div style={{ fontSize: 13, color: '#94a3b8', marginBottom: 12 }}>
            当前可批量回放 {snapshot.batchSummary.replayableReceipts} 条治理回执；执行后会自动刷新 backlog。
          </div>
          <button
            type="button"
            disabled={snapshot.deliveryMode !== 'api' || isBatchReplaying || replayableReceipts.length === 0}
            onClick={() => void handleBatchReplay()}
            style={{
              borderRadius: 10,
              border: '1px solid rgba(96, 165, 250, 0.35)',
              background: isBatchReplaying ? 'rgba(59, 130, 246, 0.2)' : 'rgba(59, 130, 246, 0.28)',
              color: '#dbeafe',
              padding: '10px 14px',
              cursor:
                snapshot.deliveryMode !== 'api' || isBatchReplaying || replayableReceipts.length === 0
                  ? 'not-allowed'
                  : 'pointer',
              fontSize: 13,
              fontWeight: 600,
            }}
          >
            {isBatchReplaying ? '批量回放中...' : '执行批量回放'}
          </button>
          {batchReplayMessage ? (
            <div style={{ marginTop: 10, fontSize: 12, color: '#cbd5e1' }}>{batchReplayMessage}</div>
          ) : null}
          <div style={{ marginTop: 10, fontSize: 12, color: '#94a3b8' }}>
            过滤后 {snapshot.batchSummary.filteredReceipts} 条，stalled {snapshot.batchSummary.stalledReceipts} 条，高风险 {snapshot.batchSummary.highRiskReceipts} 条。
          </div>
          <div style={{ marginTop: 14 }}>
            <RuntimeGovernancePanel
              tenantContext={{
                tenantId: 'tenant-demo',
                brandId: 'brand-demo',
                storeId: operationsGating.storeId,
                marketCode: 'cn-mainland'
              }}
            />
          </div>
        </div>
      ) : null}
      {focus === 'governance-audit' ? (
        <div
          style={{
            marginBottom: 16,
            borderRadius: 12,
            padding: '14px 16px',
            border: '1px solid rgba(250, 204, 21, 0.24)',
            background: 'rgba(15, 23, 42, 0.42)',
            color: '#fde68a',
          }}
        >
          <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 6 }}>治理巡检视图</div>
          <div style={{ fontSize: 13, color: '#fef3c7' }}>
            已聚焦 {snapshot.batchSummary.governanceAuditReceipts} 条高风险、阻塞或 stalled 回执，便于运营先看异常再决定是否重放。
          </div>
          <div style={{ marginTop: 8, fontSize: 12, color: '#fde68a' }}>
            其中 stalled {snapshot.batchSummary.stalledReceipts} 条，blocked {snapshot.batchSummary.blockedReceipts} 条，高风险 {snapshot.batchSummary.highRiskReceipts} 条。
          </div>
        </div>
      ) : null}
      <RuntimeOperationsListPageSection
        title={adminRuntimeOperationsRoute.title}
        description={description}
        operations={filteredOperations}
        preset={adminRuntimeOperationsPreset}
        detailHrefBase={adminRuntimeOperationsRoute.detailHrefBase}
        detailHrefBuilder={(operation) =>
          canOpenOperationDetail
            ? `${adminRuntimeOperationsRoute.detailHrefBase}/${operation.id}`
            : `/stores/${operationsGating.storeId}/capability-access?focus=runtime-operation&id=${operation.id}`
        }
        statsCopy={{
          totalLabel: '治理回执',
          totalHint: (matched) =>
            snapshot.deliveryMode === 'api'
              ? `${matched} 条 backlog 回执`
              : `${matched} 条 fallback 记录`,
          runningLabel: '阻塞中',
          runningHint:
            snapshot.deliveryMode === 'api'
              ? `${snapshot.summary.blockedActions} 条 blocked`
              : '等待真实 API 接入',
          failedLabel: '等待回写',
          failedHint:
            snapshot.deliveryMode === 'api'
              ? `${snapshot.summary.stalledCallbacks} 条 callback stalled`
              : '关注回放与回写',
          typeLabel: '高风险积压',
          typeHint:
            snapshot.deliveryMode === 'api'
              ? `${snapshot.summary.highRiskBacklog} 条 high-risk backlog`
              : 'fallback 分类统计',
        }}
        emptyTitle="当前没有治理操作 backlog"
        emptyDescription="真实 runtime governance backlog 清空后，这里会显示空态。"
      />

      <DetailActionBar
        actions={actions}
        heading="工作台收口动作"
        caption="复制 / 导出 / 分享当前运营工作台筛选快照"
      />
    </>
  );
}

export default function OperationsListPage() {
  return (
    <Suspense fallback={<OperationsPageFallback />}>
      <OperationsListPageContent />
    </Suspense>
  );
}

function OperationsPageFallback() {
  return (
    <main style={{ maxWidth: 1280, margin: '0 auto', padding: 32, color: '#cbd5e1' }}>
      正在加载治理操作中心...
    </main>
  );
}
