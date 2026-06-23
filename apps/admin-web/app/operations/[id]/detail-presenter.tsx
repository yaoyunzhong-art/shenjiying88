'use client';

import React, { useMemo } from 'react';
import {
  DetailActionBar,
  DetailClosureBar,
  RuntimeOperationDetailView,
  WorkspaceBreadcrumb,
} from '@m5/ui';
import type { RuntimeOperationRecord, RuntimeOperationReceiptRecord } from '@m5/ui';
import { adminRuntimeOperationsPreset } from '../../operations-data';
import { useDetailActions } from '../../components/use-detail-actions';
import {
  buildStandardBreadcrumb,
  buildStandardClosureLinks,
} from '../../components/detail-workspace-registry';
import type { AdminRuntimeOperationDetailSnapshot, MemberOperationsRuntimeContext } from '../../operations-view-model';

export interface AdminRuntimeOperationDetailViewModel {
  operation: RuntimeOperationRecord | null;
  receipts: RuntimeOperationReceiptRecord[];
  memberContext: MemberOperationsRuntimeContext | null;
  subtitle: string;
}

function buildOperationDetailViewModel(
  operationId: string,
  snapshot: AdminRuntimeOperationDetailSnapshot
): AdminRuntimeOperationDetailViewModel {
  const op = snapshot.operation;
  const subtitle = snapshot.deliveryMode === 'api'
    ? `治理操作 ${operationId} · API 实时数据`
    : snapshot.deliveryMode === 'fallback' && op
      ? `治理操作 ${operationId} · fallback 演示数据`
      : `治理操作 ${operationId}`;

  return {
    operation: op,
    receipts: snapshot.receipts,
    memberContext: snapshot.memberOperationsContext,
    subtitle,
  };
}

interface AdminRuntimeOperationDetailViewProps {
  operationId: string;
  snapshot: AdminRuntimeOperationDetailSnapshot;
}

export function AdminRuntimeOperationDetailView({
  operationId,
  snapshot,
}: AdminRuntimeOperationDetailViewProps) {
  const viewModel = useMemo(
    () => buildOperationDetailViewModel(operationId, snapshot),
    [operationId, snapshot],
  );

  const { actions: detailActions } = useDetailActions({
    workspace: 'operations',
    detailId: operationId,
    record: viewModel.operation ?? {},
    shareTitle: `治理操作 · ${operationId}`,
    shareText: `查看治理操作 ${operationId} 详情`,
  });

  const notFound = !viewModel.operation && snapshot.deliveryMode === 'fallback';

  return (
    <>
      <WorkspaceBreadcrumb
        {...buildStandardBreadcrumb({
          workspace: 'operations',
          detailLabel: viewModel.operation?.id ?? operationId,
        })}
      />

      <RuntimeOperationDetailView
        operation={viewModel.operation}
        receipts={viewModel.receipts}
        backHref="/operations"
        backLabel="返回运营工作台"
        notFoundTitle="治理操作不存在"
        notFoundMessage={
          notFound
            ? `未找到治理操作 ${operationId}，该操作暂不存在或已清理。`
            : undefined
        }
        preset={adminRuntimeOperationsPreset}
      />

      {viewModel.memberContext ? (
        <div
          style={{
            marginTop: 4,
            marginBottom: 24,
            borderRadius: 12,
            padding: '14px 16px',
            border: '1px solid rgba(148, 163, 184, 0.16)',
            background: 'rgba(15, 23, 42, 0.35)',
          }}
        >
          <div style={{ fontSize: 13, fontWeight: 600, color: '#e2e8f0', marginBottom: 10 }}>
            会员运营上下文
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 8 }}>
            <ContextItem label="会员 ID" value={viewModel.memberContext.memberId} />
            <ContextItem label="执行回执" value={viewModel.memberContext.executionId} />
            {viewModel.memberContext.taskId ? (
              <ContextItem label="任务 ID" value={viewModel.memberContext.taskId} />
            ) : null}
            {viewModel.memberContext.actionCode ? (
              <ContextItem label="动作码" value={viewModel.memberContext.actionCode} />
            ) : null}
            {viewModel.memberContext.executionLane ? (
              <ContextItem label="执行通道" value={viewModel.memberContext.executionLane} />
            ) : null}
            {viewModel.memberContext.targetType ? (
              <ContextItem label="目标类型" value={viewModel.memberContext.targetType} />
            ) : null}
            {viewModel.memberContext.targetId ? (
              <ContextItem label="目标 ID" value={viewModel.memberContext.targetId} />
            ) : null}
            {viewModel.memberContext.sourceOrderId ? (
              <ContextItem label="源订单" value={viewModel.memberContext.sourceOrderId} />
            ) : null}
            {viewModel.memberContext.sourcePaymentId ? (
              <ContextItem label="源支付" value={viewModel.memberContext.sourcePaymentId} />
            ) : null}
          </div>
        </div>
      ) : null}

      <DetailActionBar
        actions={detailActions}
        heading="详情收口动作"
        caption="复制 / 导出 / 分享当前治理操作详情"
      />

      <DetailClosureBar
        links={buildStandardClosureLinks({
          workspace: 'operations',
          detailId: operationId,
        })}
      />
    </>
  );
}

function ContextItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div style={{ fontSize: 11, color: '#64748b', marginBottom: 2 }}>{label}</div>
      <div style={{ fontSize: 13, color: '#cbd5e1', fontFamily: 'monospace' }}>{value}</div>
    </div>
  );
}
