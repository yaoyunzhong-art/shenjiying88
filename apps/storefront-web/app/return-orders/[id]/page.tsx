'use client';

import { useParams, useRouter } from 'next/navigation';
import React, { useMemo, useState, useCallback } from 'react';

import {
  PageShell,
  DetailShell,
  StatusBadge,
  SubmitButton,
  FormField,
  FormSubmitFeedback,
  useFormSubmit,
  Timeline,
  type DetailShellAction,
  type TimelineItem,
} from '@m5/ui';

// ---- 类型 ----

type ReturnStatus = 'pending' | 'inspecting' | 'approved' | 'rejected' | 'refunded' | 'exchanged' | 'closed';

interface ReturnOrderDetail {
  id: string;
  returnNo: string;
  customerName: string;
  phone: string;
  productName: string;
  productId: string;
  reason: string;
  detail: string;
  amount: number;
  status: ReturnStatus;
  createdDate: string;
  updatedDate: string;
  storeName: string;
  handlerName?: string;
  remark?: string;
}

const STATUS_LABELS: Record<ReturnStatus, string> = {
  pending: '待处理',
  inspecting: '质检中',
  approved: '已通过',
  rejected: '已拒绝',
  refunded: '已退款',
  exchanged: '已换货',
  closed: '已关闭',
};

const STATUS_VARIANTS: Record<ReturnStatus, 'info' | 'warning' | 'success' | 'error' | 'neutral' | 'default' | 'pending' | 'danger'> = {
  pending: 'warning',
  inspecting: 'info',
  approved: 'success',
  rejected: 'danger',
  refunded: 'pending',
  exchanged: 'info',
  closed: 'neutral',
};

const NEXT_STATUS: Partial<Record<ReturnStatus, ReturnStatus>> = {
  pending: 'inspecting',
  inspecting: 'approved',
  approved: 'refunded',
};

const STATUS_ACTION_LABELS: Partial<Record<ReturnStatus, string>> = {
  pending: '开始质检',
  inspecting: '通过审核',
  approved: '执行退款',
};

// ---- Mock 数据 ----

const MOCK_RETURN_DETAILS: Record<string, ReturnOrderDetail> = {
  r1: {
    id: 'r1', returnNo: 'RT20260701-001', customerName: '张三', phone: '138****0001',
    productName: '瑜伽初级课', productId: 'o1', reason: '课程时间冲突无法参加',
    detail: '客户表示每周二四的安排与工作时间冲突，无法继续完成课程，申请退款。',
    amount: 199, status: 'pending', createdDate: '2026-07-01', updatedDate: '2026-07-01',
    storeName: 'Demo Store 旗舰店',
  },
  r2: {
    id: 'r2', returnNo: 'RT20260701-002', customerName: '李四', phone: '138****0002',
    productName: '蛋白粉（乳清）', productId: 'o4', reason: '产品质量问题包装破损',
    detail: '收到商品时发现外包装有破损，内部密封口也已开封，疑似运输过程中受损。',
    amount: 299, status: 'inspecting', createdDate: '2026-07-01', updatedDate: '2026-07-02',
    storeName: 'Demo Store 旗舰店', handlerName: '质检员小王',
  },
  r3: {
    id: 'r3', returnNo: 'RT20260630-001', customerName: '王五', phone: '139****0003',
    productName: '运动毛巾套装', productId: 'o5', reason: '颜色与描述不符',
    detail: '页面展示为深蓝色，实际收到为浅灰色，与商品描述存在明显色差。',
    amount: 89, status: 'approved', createdDate: '2026-06-30', updatedDate: '2026-07-01',
    storeName: 'Demo Store 社区店', handlerName: '售后专员李婷', remark: '已确认色差问题，同意退货退款。',
  },
  r4: {
    id: 'r4', returnNo: 'RT20260630-002', customerName: '赵六', phone: '137****0004',
    productName: '游泳季卡', productId: 'o15', reason: '门店搬迁不方便继续使用',
    detail: '客户住所附近的门店已搬迁至新地址，距离较远不便继续使用季卡。',
    amount: 1999, status: 'rejected', createdDate: '2026-06-30', updatedDate: '2026-07-01',
    storeName: 'Demo Store 旗舰店', handlerName: '店长张伟',
    remark: '已使用超过30天，按会员协议不予退款；已电话沟通并提供附近合作门店信息。',
  },
  r5: {
    id: 'r5', returnNo: 'RT20260629-001', customerName: '孙七', phone: '136****0005',
    productName: '私教一对一', productId: 'o6', reason: '教练离职更换',
    detail: '原指定教练已离职，更换的新教练训练风格和沟通方式客户不习惯。',
    amount: 499, status: 'refunded', createdDate: '2026-06-29', updatedDate: '2026-07-01',
    storeName: 'Demo Store 旗舰店', handlerName: '售后专员李婷',
    remark: '已核实情况，按实际消耗扣费后退还剩余金额。',
  },
};

function getTimelineItems(record: ReturnOrderDetail): TimelineItem[] {
  const items: TimelineItem[] = [
    { key: 'created', heading: '提交退货申请', subtitle: record.createdDate, variant: 'info' as const },
  ];

  if (record.status === 'inspecting' || ['approved', 'rejected', 'refunded', 'exchanged', 'closed'].includes(record.status)) {
    items.push({
      key: 'inspecting', heading: '质检中', subtitle: `处理人: ${record.handlerName ?? '系统'}`, variant: 'info' as const,
    });
  }
  if (record.status === 'approved') {
    items.push({
      key: 'approved', heading: '审核通过', subtitle: `处理人: ${record.handlerName ?? '系统'}`, variant: 'success' as const,
    });
  }
  if (record.status === 'rejected') {
    items.push({
      key: 'rejected', heading: '审核拒绝', subtitle: record.remark ?? '', variant: 'error' as const,
    });
  }
  if (record.status === 'refunded') {
    items.push({
      key: 'refunded', heading: '已退款', subtitle: `处理人: ${record.handlerName ?? '系统'}`, variant: 'success' as const,
    });
  }
  if (record.status === 'exchanged') {
    items.push({
      key: 'exchanged', heading: '已换货', subtitle: `处理人: ${record.handlerName ?? '系统'}`, variant: 'info' as const,
    });
  }
  if (record.status === 'closed') {
    items.push({
      key: 'closed', heading: '已关闭', subtitle: record.remark ?? '', variant: 'default' as const,
    });
  }
  return items;
}

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', gap: 12, padding: '10px 0', borderBottom: '1px solid rgba(148,163,184,0.12)' }}>
      <span style={{ width: 100, flexShrink: 0, fontSize: 13, color: '#94a3b8' }}>{label}</span>
      <span style={{ fontSize: 14, color: '#e2e8f0' }}>{value}</span>
    </div>
  );
}

// ---- 详情页面 ----

export default function ReturnOrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const record = useMemo(() => MOCK_RETURN_DETAILS[id], [id]);
  const [localStatus, setLocalStatus] = useState<ReturnStatus>(record?.status ?? 'closed');

  const { state: formState, submit: handleFormSubmit, submitting } = useFormSubmit({
    onSubmit: async () => {
      const next = NEXT_STATUS[localStatus];
      if (!next) return undefined;
      // 模拟 API 调用
      await new Promise((r) => setTimeout(r, 600));
      setLocalStatus(next);
      return `状态已更新为: ${STATUS_LABELS[next]}`;
    },
    successMessage: (result) => result ?? '操作成功',
  });

  const handleStatusTransition = useCallback(() => {
    handleFormSubmit();
  }, [handleFormSubmit]);

  if (!record) {
    return (
      <PageShell title="退货详情" description="未找到该退货单">
        <div style={{ textAlign: 'center', padding: 80, color: '#64748b', fontSize: 16 }}>该退货单不存在</div>
      </PageShell>
    );
  }

  const actions: DetailShellAction[] = [
    {
      key: 'back',
      label: '返回列表',
      onClick: () => router.push('/return-orders'),
      variant: 'secondary',
    },
  ];

  const nextStatus = NEXT_STATUS[localStatus];
  if (nextStatus) {
    actions.push({
      key: 'transition',
      label: STATUS_ACTION_LABELS[localStatus] ?? '状态流转',
      onClick: handleStatusTransition,
      variant: 'primary',
      loading: submitting,
    });
  }

  const timelineItems = useMemo(() => getTimelineItems({ ...record, status: localStatus }), [record, localStatus]);

  return (
    <PageShell title={`退货单 ${record.returnNo}`} description={STATUS_LABELS[localStatus]}>
      <DetailShell title={`退货单 ${record.returnNo}`} actions={actions}>

        {/* 表单反馈 */}
        <FormSubmitFeedback submitting={submitting} error={formState.errorMessage} success={formState.successMessage} />

        {/* 基础信息 */}
        <div
          style={{
            background: 'rgba(15,23,42,0.4)',
            borderRadius: 12,
            padding: '4px 20px',
            marginBottom: 24,
            border: '1px solid rgba(148,163,184,0.1)',
          }}
        >
          <InfoRow label="状态" value={<StatusBadge label={STATUS_LABELS[localStatus]} variant={STATUS_VARIANTS[localStatus]} size="sm" />} />
          <InfoRow label="客户姓名" value={record.customerName} />
          <InfoRow label="联系电话" value={record.phone} />
          <InfoRow label="商品名称" value={record.productName} />
          <InfoRow label="退货金额" value={`¥${record.amount.toLocaleString()}`} />
          <InfoRow label="退货原因" value={record.reason} />
          <InfoRow label="详细说明" value={record.detail} />
          <InfoRow label="门店" value={record.storeName} />
          <InfoRow label="处理人" value={record.handlerName ?? '-'} />
          <InfoRow label="备注" value={record.remark ?? '-'} />
          <InfoRow label="创建时间" value={record.createdDate} />
          <InfoRow label="更新时间" value={record.updatedDate} />
        </div>

        {/* 处理操作区 */}
        {nextStatus && (
          <div style={{ marginBottom: 24 }}>
            <SubmitButton
              onClick={handleStatusTransition}
              loading={submitting}
              variant="primary"
            >
              {STATUS_ACTION_LABELS[localStatus]}
            </SubmitButton>
          </div>
        )}

        {/* 时间线 */}
        <div style={{ marginTop: 24 }}>
          <h3 style={{ fontSize: 16, fontWeight: 600, color: '#e2e8f0', marginBottom: 12 }}>处理记录</h3>
          <Timeline items={timelineItems} />
        </div>

      </DetailShell>
    </PageShell>
  );
}
