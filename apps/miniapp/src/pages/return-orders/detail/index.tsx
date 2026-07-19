/**
 * 退货单详情页 — 小程序端 (Taro)
 * 角色视角: 🧾 仓管/售后
 * 功能: 详情展示、状态流转（质检→通过/拒绝→退款/换货/关闭）、编辑/删除
 */
import { View, Text, Button, ScrollView, Textarea } from '@tarojs/components';
import { useEffect, useMemo, useState, type CSSProperties } from 'react';
import Taro from '@tarojs/taro';
import {
  executeMiniappPurchaseReturnAction,
  loadMiniappPurchaseReturnDetail,
  type MiniappReturnOrderDetail,
} from '../../../supplychain-runtime';

// ---- 类型 ----

type ReturnStatus = MiniappReturnOrderDetail['status'];
type ReturnOrderDetail = MiniappReturnOrderDetail;

// ---- 常量 ----

const STATUS_FLOW: Record<ReturnStatus, ReturnStatus[]> = {
  pending: ['inspecting', 'closed'],
  inspecting: ['approved', 'rejected'],
  approved: ['refunded', 'exchanged', 'closed'],
  rejected: ['closed'],
  refunded: ['closed'],
  exchanged: ['closed'],
  closed: [],
};

const STATUS_LABELS: Record<ReturnStatus, string> = {
  pending: '待处理', inspecting: '质检中', approved: '已通过',
  rejected: '已拒绝', refunded: '已退款', exchanged: '已换货', closed: '已关闭',
};

const STATUS_COLORS: Record<ReturnStatus, string> = {
  pending: '#f97316', inspecting: '#3b82f6', approved: '#22c55e',
  rejected: '#ef4444', refunded: '#8b5cf6', exchanged: '#06b6d4', closed: '#64748b',
};

const STATUS_STEPS = ['pending', 'inspecting', 'approved', 'refunded'] as const;

function getStatusStepIndex(status: ReturnStatus): number {
  if (status === 'exchanged') return STATUS_STEPS.indexOf('approved');
  if (status === 'rejected' || status === 'closed') return STATUS_STEPS.indexOf('inspecting');
  return STATUS_STEPS.findIndex((s) => s === status);
}

const NEXT_ACTION_LABELS: Record<string, string> = {
  inspecting: '开始质检',
  approved: '同意退货',
  rejected: '拒绝退货',
  refunded: '确认退款',
  exchanged: '换货处理',
  closed: '关闭退单',
};

// ---- Mock Data ----

const MOCK_DETAIL: ReturnOrderDetail = {
  id: '2',
  returnNo: 'RT-20260702-002',
  customerName: '李芳',
  phone: '159****5678',
  productName: '防晒霜 SPF50',
  spec: '50ml / 支',
  qty: 1,
  reason: '包装破损',
  description: '收到快递时外包装有明显压痕，内部瓶身有裂纹，无法正常使用。已拍照留证。',
  amount: 168,
  status: 'inspecting',
  createdDate: '2026-07-02',
  evidenceImages: [],
};

// ---- 子组件：状态步骤条 ----

function StatusSteps({ status }: { status: ReturnStatus }) {
  const currentIdx = getStatusStepIndex(status);

  return (
    <View style={{ display: 'flex', alignItems: 'center', padding: '12px 0' }}>
      {STATUS_STEPS.map((s, i) => {
        const done = i <= currentIdx;
        const isCurrent = s === status;
        return (
          <View key={s} style={{ display: 'flex', alignItems: 'center', flex: 1 }}>
            {/* 步骤圆点 */}
            <View
              style={{
                width: 28, height: 28, borderRadius: 14,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: done ? STATUS_COLORS[s] : '#1e293b',
                border: `2px solid ${done ? STATUS_COLORS[s] : '#334155'}`,
              }}
            >
              <Text style={{ fontSize: 12, fontWeight: 700, color: done ? '#fff' : '#475569' }}>
                {i + 1}
              </Text>
            </View>
            {/* 连接线 */}
            {i < STATUS_STEPS.length - 1 && (
              <View
                style={{
                  flex: 1, height: 2,
                  background: done ? STATUS_COLORS[s] : '#1e293b',
                  margin: '0 4px',
                }}
              />
            )}
            {/* 标签 */}
            {isCurrent && (
              <View
                style={{
                  position: 'absolute', top: 36, left: 0, right: 0,
                  display: 'flex', justifyContent: 'center',
                }}
              >
                <Text style={{ fontSize: 11, color: STATUS_COLORS[s], textAlign: 'center' }}>
                  {STATUS_LABELS[s]}
                </Text>
              </View>
            )}
          </View>
        );
      })}
    </View>
  );
}

// ---- 子组件：操作按钮 ----

function ActionButtons({
  status,
  onAction,
  onDelete,
}: {
  status: ReturnStatus;
  onAction: (action: ReturnStatus) => void;
  onDelete: () => void;
}) {
  const nextStatuses = STATUS_FLOW[status];

  const actionStyle = (color: string): CSSProperties => ({
    padding: '8px 18px',
    borderRadius: 10,
    border: 'none',
    background: color,
    color: '#fff',
    fontWeight: 600,
    fontSize: 13,
    cursor: 'pointer',
    minWidth: 80,
  });

  const buttonColor = (s: ReturnStatus): string => {
    if (s === 'approved') return '#22c55e';
    if (s === 'rejected' || s === 'closed') return '#ef4444';
    if (s === 'refunded') return '#8b5cf6';
    if (s === 'exchanged') return '#06b6d4';
    return '#3b82f6';
  };

  if (nextStatuses.length === 0) {
    return (
      <View style={{ marginTop: 16, display: 'flex', justifyContent: 'center' }}>
        <Text style={{ color: '#64748b', fontSize: 13 }}>该退货单已完结，无需操作</Text>
      </View>
    );
  }

  return (
    <View style={{ marginTop: 16, display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
      {nextStatuses.map((ns) => (
        <Button
          key={ns}
          style={actionStyle(buttonColor(ns))}
          onClick={() => onAction(ns)}
        >
          {NEXT_ACTION_LABELS[ns] || STATUS_LABELS[ns]}
        </Button>
      ))}
      {['closed', 'rejected'].includes(status) === false && (
        <Button
          style={{ ...actionStyle('#475569'), background: 'transparent', border: '1px solid #475569' }}
          onClick={onDelete}
        >
          删除
        </Button>
      )}
    </View>
  );
}

// ---- 子组件：基本信息卡片 ----

function InfoCard({ label, value }: { label: string; value: string }) {
  return (
    <View style={{ display: 'flex', justifyContent: 'space-between', paddingTop: 8, paddingBottom: 8, borderBottom: '1px solid rgba(148,163,184,0.08)' }}>
      <Text style={{ fontSize: 13, color: '#94a3b8' }}>{label}</Text>
      <Text style={{ fontSize: 13, color: '#e2e8f0', fontWeight: 500, textAlign: 'right', flex: 1 }}>{value}</Text>
    </View>
  );
}

// ---- 子组件：备注编辑 ----

function RemarkSection({
  remark,
  onChange,
}: {
  remark: string;
  onChange: (val: string) => void;
}) {
  return (
    <View style={{ marginTop: 16 }}>
      <Text style={{ fontSize: 14, fontWeight: 600, color: '#f1f5f9', marginBottom: 8 }}>备注信息</Text>
      <Textarea
        style={{
          width: '100%', minHeight: 60, padding: 10, borderRadius: 8,
          background: '#1e293b', color: '#e2e8f0', fontSize: 13,
          border: '1px solid rgba(148,163,184,0.15)',
        }}
        value={remark}
        onInput={(e) => onChange(e.detail.value)}
        placeholder="添加处理备注…"
      />
    </View>
  );
}

function resolveCurrentReturnId(): string {
  return Taro.getCurrentInstance()?.router?.params?.id ?? MOCK_DETAIL.id;
}

// ---- 主组件 ----

export default function ReturnOrderDetailPage() {
  const [detail, setDetail] = useState<ReturnOrderDetail>(MOCK_DETAIL);
  const [deliveryNote, setDeliveryNote] = useState('当前展示本地演示退货详情。');
  const [localStatus, setLocalStatus] = useState<ReturnStatus>(MOCK_DETAIL.status);
  const [remark, setRemark] = useState('');
  const returnId = useMemo(() => resolveCurrentReturnId(), []);

  useEffect(() => {
    let cancelled = false;

    loadMiniappPurchaseReturnDetail(returnId, MOCK_DETAIL).then((snapshot) => {
      if (!cancelled) {
        setDetail(snapshot.data);
        setDeliveryNote(snapshot.note);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [returnId]);

  useEffect(() => {
    setLocalStatus(detail.status);
  }, [detail.status]);

  const currentStepIndex = useMemo(
    () => getStatusStepIndex(localStatus),
    [localStatus],
  );

  const handleAction = (action: ReturnStatus) => {
    const actionLabel = NEXT_ACTION_LABELS[action] || STATUS_LABELS[action];
    Taro.showModal({
      title: '操作确认',
      content: `确定要${actionLabel}该退货单吗？${remark ? `\n备注: ${remark}` : ''}`,
      success: (res) => {
        if (res.confirm) {
          void executeMiniappPurchaseReturnAction(returnId, action, remark).then((result) => {
            setDeliveryNote(result.note);
            if (result.success) {
              setLocalStatus(result.nextStatus);
              Taro.showToast({
                title: `${actionLabel}已同步`,
                icon: 'success',
              });
              return;
            }

            Taro.showToast({
              title: `${actionLabel}失败`,
              icon: 'none',
            });
          });
        }
      },
    });
  };

  const handleDelete = () => {
    Taro.showModal({
      title: '删除确认',
      content: '确定要删除该退货单？此操作不可撤销。',
      success: (res) => {
        if (res.confirm) {
          Taro.showToast({ title: '暂未开放删除', icon: 'none' });
        }
      },
    });
  };

  return (
    <ScrollView style={{ padding: 16, background: '#0f172a', minHeight: '100vh', color: '#e2e8f0' }}>
      {/* 头部：单号 + 状态 */}
      <View style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <Text style={{ fontSize: 18, fontWeight: 700, color: '#f1f5f9' }}>{detail.returnNo}</Text>
        <View style={{
          padding: '4px 12px', borderRadius: 12,
          background: `${STATUS_COLORS[localStatus]}22`,
          border: `1px solid ${STATUS_COLORS[localStatus]}44`,
        }}>
          <Text style={{ fontSize: 13, fontWeight: 600, color: STATUS_COLORS[localStatus] }}>
            {STATUS_LABELS[localStatus]}
          </Text>
        </View>
      </View>
      <Text style={{ fontSize: 12, color: '#64748b', marginBottom: 12 }}>{deliveryNote}</Text>

      {/* 状态步骤条 */}
      {currentStepIndex >= 0 && currentStepIndex < STATUS_STEPS.length && (
        <View style={{
          padding: '12px 8px', borderRadius: 12,
          background: 'rgba(15,23,42,0.5)', border: '1px solid rgba(148,163,184,0.08)',
          marginBottom: 16,
        }}>
          <StatusSteps status={localStatus} />
        </View>
      )}

      {/* 基本信息 */}
      <View style={{
        padding: 16, borderRadius: 12,
        background: 'rgba(15,23,42,0.4)', border: '1px solid rgba(148,163,184,0.08)',
      }}>
        <Text style={{ fontSize: 15, fontWeight: 600, color: '#f1f5f9', marginBottom: 12 }}>基本信息</Text>
        <InfoCard label="退单编号" value={detail.returnNo} />
        <InfoCard label="客户姓名" value={detail.customerName} />
        <InfoCard label="联系电话" value={detail.phone} />
        <InfoCard label="商品名称" value={detail.productName} />
        <InfoCard label="商品规格" value={detail.spec} />
        <InfoCard label="数量" value={`${detail.qty} 件`} />
        <InfoCard label="退款金额" value={`¥${detail.amount.toLocaleString()}`} />
        <InfoCard label="申请日期" value={detail.createdDate} />
        {detail.processedDate && <InfoCard label="处理日期" value={detail.processedDate} />}
        {detail.processor && <InfoCard label="处理人" value={detail.processor} />}
      </View>

      {/* 退货原因 */}
      <View style={{
        padding: 16, borderRadius: 12, marginTop: 12,
        background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.12)',
      }}>
        <Text style={{ fontSize: 14, fontWeight: 600, color: '#fca5a5', marginBottom: 8 }}>退货原因</Text>
        <View style={{
          padding: '3px 10px', borderRadius: 6,
          background: 'rgba(239,68,68,0.1)', display: 'inline-block',
          marginBottom: 8,
        }}>
          <Text style={{ fontSize: 12, color: '#fca5a5' }}>{detail.reason}</Text>
        </View>
        <Text style={{ fontSize: 13, color: '#cbd5e1', lineHeight: 1.6 }}>{detail.description}</Text>
      </View>

      {/* 备注 */}
      <RemarkSection remark={remark} onChange={setRemark} />

      {/* 操作按钮 */}
      <ActionButtons status={localStatus} onAction={handleAction} onDelete={handleDelete} />

      {/* 操作历史 */}
      <View style={{
        marginTop: 24, padding: 16, borderRadius: 12,
        background: 'rgba(15,23,42,0.3)',
      }}>
        <Text style={{ fontSize: 13, fontWeight: 600, color: '#64748b', marginBottom: 8 }}>操作历史</Text>
        <View style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <View style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
            <View style={{ width: 6, height: 6, borderRadius: 3, background: '#3b82f6', marginTop: 6 }} />
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 12, color: '#cbd5e1' }}>创建退货申请</Text>
              <Text style={{ fontSize: 11, color: '#64748b' }}>{detail.createdDate} 由 {detail.customerName}</Text>
            </View>
          </View>
          {localStatus !== 'pending' && (
            <View style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
              <View style={{ width: 6, height: 6, borderRadius: 3, background: STATUS_COLORS[localStatus], marginTop: 6 }} />
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 12, color: '#cbd5e1' }}>{STATUS_LABELS[localStatus]}</Text>
                <Text style={{ fontSize: 11, color: '#64748b' }}>
                  {detail.processedDate || '处理中'} {detail.processor ? `由 ${detail.processor}` : ''}
                </Text>
              </View>
            </View>
          )}
        </View>
      </View>
    </ScrollView>
  );
}
