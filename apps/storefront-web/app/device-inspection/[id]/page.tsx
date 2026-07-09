/**
 * 设备巡检详情页 — Device Inspection Detail Page (Next.js App Router Page)
 * 角色视角: 🔧设备巡检员 / 🎯运营专员
 * 功能: 巡检任务详情、检查项清单、异常上报、状态流转
 */
'use client';

import React, { use, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';

import {
  DetailShell,
  StatusBadge,
  DetailActionBar,
  DetailClosureBar,
  Timeline,
  DescriptionList,
  DataTable,
  EmptyState,
  useToast,
  ConfirmDialog,
  type DetailShellAction,
  type DetailActionBarAction,
  type DetailClosureLink,
  type DescriptionItem,
  type DataTableColumn,
} from '@m5/ui';

/* ===================================================================
   类型定义
   =================================================================== */

type InspectionStatus = 'pending' | 'in_progress' | 'passed' | 'failed' | 'skipped';
type DeviceCategory = 'electrical' | 'hvac' | 'fire_safety' | 'elevator' | 'plumbing' | 'security' | 'it';
type RiskLevel = 'low' | 'medium' | 'high' | 'critical';

interface InspectionItem {
  checkPoint: string;
  standard: string;
  result: 'pass' | 'fail' | 'na';
  remark: string;
}

interface DeviceInspection {
  id: string;
  taskNo: string;
  deviceName: string;
  deviceCode: string;
  deviceCategory: DeviceCategory;
  location: string;
  riskLevel: RiskLevel;
  inspector: string;
  scheduledDate: string;
  status: InspectionStatus;
  completedAt: string | null;
  duration: string;
  totalItems: number;
  passItems: number;
  failItems: number;
  anomalies: number;
  notes: string;
  updatedAt: string;
  items: InspectionItem[];
}

/* ===================================================================
   常量
   =================================================================== */

const STATUS_LABELS: Record<InspectionStatus, string> = {
  pending: '待巡检',
  in_progress: '巡检中',
  passed: '已通过',
  failed: '未通过',
  skipped: '已跳过',
};

const STATUS_VARIANTS: Record<InspectionStatus, 'info' | 'warning' | 'success' | 'error' | 'neutral'> = {
  pending: 'info',
  in_progress: 'warning',
  passed: 'success',
  failed: 'error',
  skipped: 'neutral',
};

const CATEGORY_LABELS: Record<DeviceCategory, string> = {
  electrical: '电气设备',
  hvac: '暖通空调',
  fire_safety: '消防设施',
  elevator: '电梯',
  plumbing: '给排水',
  security: '安防监控',
  it: 'IT设备',
};

const RISK_LABELS: Record<RiskLevel, string> = {
  low: '低风险',
  medium: '中风险',
  high: '高风险',
  critical: '严重风险',
};

const STATUS_TRANSITIONS: Record<InspectionStatus, InspectionStatus[]> = {
  pending: ['in_progress', 'skipped'],
  in_progress: ['passed', 'failed'],
  passed: [],
  failed: ['pending'],
  skipped: ['pending'],
};

const TRANSITION_LABELS: Record<string, string> = {
  in_progress: '开始巡检',
  passed: '标记通过',
  failed: '标记未通过',
  skipped: '跳过巡检',
  pending: '重新分配',
};

const RESULT_LABELS: Record<string, string> = {
  pass: '✓ 通过',
  fail: '✗ 不通过',
  na: '— 不适用',
};

const RESULT_VARIANTS: Record<string, 'success' | 'error' | 'neutral'> = {
  pass: 'success',
  fail: 'error',
  na: 'neutral',
};

/* ===================================================================
   Mock 历史
   =================================================================== */

const MOCK_HISTORY = [
  { time: '2026-07-07 08:00', action: '巡检任务分配', user: '运营专员张伟', status: 'pending' },
  { time: '2026-07-07 08:30', action: '巡检员接单', user: '李师傅', status: 'in_progress' },
  { time: '2026-07-07 09:15', action: '完成第1项检查', user: '李师傅', status: 'in_progress' },
  { time: '2026-07-07 09:45', action: '完成全部检查，2项异常上报', user: '李师傅', status: 'passed' },
];

/* ===================================================================
   Mock 数据
   =================================================================== */

const MOCK_INSPECTION: DeviceInspection = {
  id: 'di-001',
  taskNo: 'INS-20260707-001',
  deviceName: '中央空调主机系统 #3',
  deviceCode: 'HVAC-003',
  deviceCategory: 'hvac',
  location: 'B1层设备机房',
  riskLevel: 'medium',
  inspector: '李师傅',
  scheduledDate: '2026-07-07',
  status: 'passed',
  completedAt: '2026-07-07 09:45',
  duration: '1小时15分',
  totalItems: 8,
  passItems: 6,
  failItems: 2,
  anomalies: 2,
  notes: '冷凝管有轻微渗漏，需要安排维修。过滤网已清洁。',
  updatedAt: '2026-07-07 09:45',
  items: [
    { checkPoint: '运行声音检查', standard: '无异响、无共振', result: 'pass', remark: '运行平稳' },
    { checkPoint: '温度输出检测', standard: '出风口温度 7-12°C', result: 'pass', remark: '出风口温度 9°C' },
    { checkPoint: '冷凝管渗漏检查', standard: '无渗漏', result: 'fail', remark: '轻微渗漏，需维修' },
    { checkPoint: '过滤网清洁度', standard: '无明显积尘', result: 'pass', remark: '已清洁' },
    { checkPoint: '制冷剂压力', standard: '低压0.4-0.6MPa 高压1.5-2.0MPa', result: 'pass', remark: '低压0.5MPa 高压1.7MPa' },
    { checkPoint: '电气接线检查', standard: '无松动、无氧化', result: 'pass', remark: '接线良好' },
    { checkPoint: '排水系统', standard: '排水畅通', result: 'fail', remark: '排水管轻微堵塞' },
    { checkPoint: '安全防护装置', standard: '防护罩完好、急停按钮正常', result: 'pass', remark: '全部正常' },
  ],
};

/* ===================================================================
   子组件：检查项结果徽标
   =================================================================== */

function InspectionResultBadge({ result }: { result: 'pass' | 'fail' | 'na' }) {
  return (
    <StatusBadge
      label={RESULT_LABELS[result] ?? result}
      variant={RESULT_VARIANTS[result] ?? 'neutral'}
      size="sm"
    />
  );
}

/* ===================================================================
   页面组件
   =================================================================== */

export default function DeviceInspectionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}): React.ReactElement {
  const { id } = use(params);
  const router = useRouter();
  const toast = useToast();
  const [inspection, setInspection] = useState<DeviceInspection>({ ...MOCK_INSPECTION, id });
  const [showConfirm, setShowConfirm] = useState(false);
  const [pendingAction, setPendingAction] = useState<InspectionStatus | null>(null);

  const canTransition: InspectionStatus[] = STATUS_TRANSITIONS[inspection.status] ?? [];

  const handleTransition = useCallback(
    async (targetStatus: InspectionStatus) => {
      if (targetStatus === 'failed') {
        setPendingAction(targetStatus);
        setShowConfirm(true);
        return;
      }
      await new Promise((r) => setTimeout(r, 400));
      setInspection((prev) => ({
        ...prev,
        status: targetStatus,
        updatedAt: new Date().toISOString(),
        completedAt: (['passed', 'failed'] as InspectionStatus[]).includes(targetStatus) ? new Date().toISOString() : prev.completedAt,
      }));
      toast.success(`巡检单已${TRANSITION_LABELS[targetStatus] ?? targetStatus}`);
    },
    [toast],
  );

  const handleConfirmTransition = useCallback(async () => {
    if (!pendingAction) return;
    await new Promise((r) => setTimeout(r, 400));
    setInspection((prev) => ({
      ...prev,
      status: pendingAction,
      updatedAt: new Date().toISOString(),
      completedAt: (['passed', 'failed'] as InspectionStatus[]).includes(pendingAction) ? new Date().toISOString() : prev.completedAt,
    }));
    toast.success(`巡检单已${TRANSITION_LABELS[pendingAction] ?? pendingAction}`);
    setShowConfirm(false);
    setPendingAction(null);
  }, [toast, pendingAction]);

  const handleEdit = useCallback(async () => {
    toast.info('编辑巡检任务（跳转至编辑页）');
  }, [toast]);

  const handleDelete = useCallback(async () => {
    await new Promise((r) => setTimeout(r, 400));
    toast.success('巡检任务已删除');
    router.push('/device-inspection');
  }, [toast, router]);

  if (!inspection) {
    return <EmptyState title="巡检单未找到" description="指定巡检单不存在或已被删除" />;
  }

  const headerActions: DetailShellAction[] = [
    ...canTransition.map((target) => ({
      key: `transition-${target}`,
      label: TRANSITION_LABELS[target] ?? target,
      variant: (target === 'failed' ? 'danger' : target === 'passed' ? 'primary' : 'secondary') as 'primary' | 'secondary' | 'danger',
      onClick: () => handleTransition(target),
    })),
    {
      key: 'edit',
      label: '编辑',
      variant: 'secondary' as const,
      onClick: handleEdit,
    },
  ];

  const barActions: DetailActionBarAction[] = canTransition.map((target) => ({
    key: `bar-${target}`,
    label: TRANSITION_LABELS[target] ?? target,
    variant: target === 'failed' ? 'danger' : target === 'passed' ? 'primary' : 'default',
    onClick: () => handleTransition(target),
  }));

  const closureLinks: DetailClosureLink[] = [
    {
      key: 'back-to-list',
      title: '返回巡检任务列表',
      subtitle: '查看所有设备巡检任务',
      href: '/device-inspection',
    },
    {
      key: 'device-monitoring',
      title: '设备监控面板',
      subtitle: '实时查看设备运行状态',
      href: '/device-monitoring',
    },
  ];

  const itemColumns: DataTableColumn<InspectionItem>[] = [
    { key: 'checkPoint', header: '检查项', dataKey: 'checkPoint' },
    { key: 'standard', header: '标准要求', dataKey: 'standard' },
    {
      key: 'result',
      header: '结果',
      dataKey: 'result',
      render: (row) => <InspectionResultBadge result={row.result} />,
    },
    { key: 'remark', header: '备注', dataKey: 'remark' },
  ];

  const passRate = inspection.totalItems > 0
    ? Math.round((inspection.passItems / inspection.totalItems) * 100)
    : 0;

  const basicInfoItems: DescriptionItem[] = [
    { label: '任务编号', value: inspection.taskNo },
    { label: '设备名称', value: inspection.deviceName },
    { label: '设备编号', value: inspection.deviceCode },
    { label: '设备分类', value: CATEGORY_LABELS[inspection.deviceCategory] },
    { label: '所在位置', value: inspection.location },
    { label: '风险等级', value: RISK_LABELS[inspection.riskLevel] },
    { label: '巡检员', value: inspection.inspector },
    { label: '计划日期', value: inspection.scheduledDate },
    {
      label: '状态',
      value: <StatusBadge label={STATUS_LABELS[inspection.status] ?? inspection.status} variant={STATUS_VARIANTS[inspection.status] ?? 'info'} size="sm" />,
    },
    { label: '完成时间', value: inspection.completedAt ?? '—' },
    { label: '耗时', value: inspection.duration },
    { label: '备注', value: inspection.notes || '—' },
  ];

  return (
    <DetailShell
      backHref="/device-inspection"
      title={`${inspection.deviceName}`}
      subtitle={`${inspection.taskNo} · 计划 ${inspection.scheduledDate} · 耗时 ${inspection.duration}`}
      actions={headerActions}
    >
      {/* 基本信息 */}
      <DescriptionList title="巡检信息" columns={2} items={basicInfoItems} />

      {/* 检查项统计 */}
      <div style={{ marginTop: 32 }}>
        <h3 style={{ fontSize: 16, fontWeight: 600, color: '#f1f5f9', marginBottom: 12 }}>检查结果统计</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 16 }}>
          {[
            { label: '总检查项', value: `${inspection.totalItems} 项` },
            { label: '通过', value: `${inspection.passItems} 项`, color: '#22c55e' },
            { label: '不通过', value: `${inspection.failItems} 项`, color: '#ef4444' },
            { label: '通过率', value: `${passRate}%`, color: passRate >= 80 ? '#22c55e' : '#eab308' },
          ].map((item) => (
            <div
              key={item.label}
              style={{
                padding: '16px',
                borderRadius: 12,
                background: 'rgba(148,163,184,0.06)',
                border: '1px solid rgba(148,163,184,0.12)',
              }}
            >
              <div style={{ fontSize: 12, color: '#94a3b8', marginBottom: 6 }}>{item.label}</div>
              <div style={{ fontSize: 20, fontWeight: 700, color: item.color ?? '#f1f5f9' }}>{item.value}</div>
            </div>
          ))}
        </div>
      </div>

      {/* 检查明细 */}
      <div style={{ marginTop: 32 }}>
        <h3 style={{ fontSize: 16, fontWeight: 600, color: '#f1f5f9', marginBottom: 12 }}>
          检查明细（{inspection.totalItems} 项）
        </h3>
        <DataTable
          rows={inspection.items}
          columns={itemColumns}
          rowKey={(row) => row.checkPoint}
        />
      </div>

      {/* 历史记录 */}
      <div style={{ marginTop: 32 }}>
        <h3 style={{ fontSize: 16, fontWeight: 600, color: '#f1f5f9', marginBottom: 12 }}>
          操作历史
        </h3>
        <Timeline
          items={MOCK_HISTORY.map((h) => ({
            key: h.time,
            heading: `${h.action} · ${h.user}`,
            subtitle: h.time,
            variant: h.status === 'failed' ? ('error' as const) : h.status === 'passed' ? ('success' as const) : ('default' as const),
          }))}
        />
      </div>

      {/* 动作栏 */}
      {barActions.length > 0 && (
        <DetailActionBar actions={barActions} />
      )}

      {/* 导航 */}
      <DetailClosureBar links={closureLinks} />

      {/* 确认对话框 */}
      <ConfirmDialog
        open={showConfirm}
        title="确认标记为未通过？"
        message={`确定要将此巡检任务标记为"未通过"吗？未通过项需要安排整改复检。`}
        confirmLabel="确认未通过"
        cancelLabel="返回"
        onConfirm={handleConfirmTransition}
        onCancel={() => { setShowConfirm(false); setPendingAction(null); }}
        variant="danger"
      />
    </DetailShell>
  );
}
