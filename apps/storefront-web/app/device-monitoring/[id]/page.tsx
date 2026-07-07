/**
 * 设备详情页 — Device Detail Page (Next.js App Router Page)
 * 角色视角: 👔店长 / 🛠️运维
 * 功能: 查看设备详细信息、编辑设备信息、状态选择更新、删除设备
 */
'use client';

import React, { useMemo, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';

import {
  DetailShell,
  InfoRow,
  StatusBadge,
  Button,
  DetailActionBar,
  DetailClosureBar,
  DescriptionList,
  EmptyState,
  useToast,
  ConfirmDialog,
  type DetailShellAction,
  type DetailActionBarAction,
  type DetailClosureLink,
  type DescriptionItem,
} from '@m5/ui';

import type { DeviceItem, DeviceStatus } from '../model';
import { DEVICE_STATUS_LABELS, DEVICE_CATEGORY_LABELS, generateMockDevices } from '../model';

/* ── 工具函数 ── */

function formatSeconds(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h > 0) return `${h}h${m > 0 ? ` ${m}m` : ''}`;
  return `${m}m`;
}

function uptimeLabel(uptime: string): string {
  const match = uptime.match(/^(\d+)h$/);
  if (!match) return uptime;
  const h = parseInt(match[1]!, 10);
  const days = Math.floor(h / 24);
  const hours = h % 24;
  if (days > 0) return `${days}天 ${hours}小时`;
  return `${hours} 小时`;
}

function heartbeatLabel(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return '刚刚';
  if (minutes < 60) return `${minutes} 分钟前`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} 小时前`;
  const days = Math.floor(hours / 24);
  return `${days} 天前`;
}

function formatDateTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString('zh-CN', {
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
  });
}

/* ── 状态映射 ── */

const STATUS_VARIANT: Record<DeviceStatus, 'success' | 'neutral' | 'warning' | 'error' | 'info'> = {
  online: 'success',
  offline: 'neutral',
  warning: 'warning',
  error: 'error',
  maintenance: 'info',
};

const STATUS_ACTIONS: { label: string; status: DeviceStatus }[] = [
  { label: '标记在线', status: 'online' },
  { label: '标记离线', status: 'offline' },
  { label: '标记警告', status: 'warning' },
  { label: '标记故障', status: 'error' },
  { label: '维护中', status: 'maintenance' },
];

/* ── Mock 数据集 ── */

function buildMockMap(): Record<string, DeviceItem> {
  const devices = generateMockDevices(25);
  const map: Record<string, DeviceItem> = {};
  for (const d of devices) {
    map[d.id] = d;
  }
  return map;
}

/* ── 页面组件 ── */

export default function DeviceDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [mockMap] = useState<Record<string, DeviceItem>>(buildMockMap);
  const [device, setDevice] = useState<DeviceItem | undefined>(mockMap[id]);
  const [currentStatus, setCurrentStatus] = useState<DeviceStatus | undefined>(device?.status);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [processing, setProcessing] = useState(false);
  const toast = useToast();

  /* ── 后退 ── */
  const handleBack = useCallback(() => router.push('/device-monitoring'), [router]);

  /* ── 编辑 ── */
  const handleEdit = useCallback(() => {
    toast.toast(`编辑设备 ${device?.name ?? id}`, { variant: 'info' });
  }, [toast, device, id]);

  /* ── 状态流转 ── */
  const handleStatusChange = useCallback(
    (newStatus: DeviceStatus) => {
      setProcessing(true);
      setTimeout(() => {
        setCurrentStatus(newStatus);
        setDevice((prev) => (prev ? { ...prev, status: newStatus } : prev));
        setProcessing(false);
        toast.toast(`设备状态已更新为「${DEVICE_STATUS_LABELS[newStatus]}」`, { variant: 'success' });
      }, 600);
    },
    [toast],
  );

  /* ── 删除 ── */
  const handleDelete = useCallback(() => {
    setProcessing(true);
    setTimeout(() => {
      setProcessing(false);
      toast.toast(`设备 ${device?.name ?? id} 已删除`, { variant: 'success' });
      router.push('/device-monitoring');
    }, 600);
  }, [toast, device, id, router]);

  /* ── DetailShell Actions ── */
  const actions: DetailShellAction[] = useMemo(
    () => [
      { key: 'edit', label: '编辑', onClick: handleEdit, variant: 'primary' },
      {
        key: 'delete',
        label: '删除',
        onClick: () => setDeleteDialogOpen(true),
        variant: 'danger',
      },
    ],
    [handleEdit],
  );

  /* ── 操作栏动作 ── */
  const actionBarActions: DetailActionBarAction[] = useMemo(
    () =>
      STATUS_ACTIONS
        .filter((a) => a.status !== currentStatus)
        .map((a) => ({
          key: a.status,
          label: a.label,
          onClick: () => handleStatusChange(a.status),
          variant: a.status === 'error' ? 'danger' as const : 'default' as const,
        })),
    [currentStatus, handleStatusChange],
  );

  /* ── 闭合栏链接 ── */
  const closureLinks: DetailClosureLink[] = useMemo(
    () => [
      {
        key: 'back-to-list',
        title: '返回设备列表',
        subtitle: '查看所有设备运行状态',
        href: '/device-monitoring',
      },
    ],
    [],
  );

  /* ── 描述信息 ── */
  const descriptionItems: DescriptionItem[] = useMemo(() => {
    if (!device) return [];
    return [
      { label: '设备 ID', value: device.id },
      { label: '设备名称', value: device.name },
      {
        label: '设备状态',
        value: (
          <StatusBadge
            label={DEVICE_STATUS_LABELS[device.status]}
            variant={STATUS_VARIANT[device.status]}
          />
        ),
      },
      { label: '设备分类', value: DEVICE_CATEGORY_LABELS[device.category] },
      { label: '门店', value: device.storeName },
      { label: 'IP 地址', value: device.ip },
      { label: '固件版本', value: device.firmware },
      { label: '在线时长', value: uptimeLabel(device.uptime) },
      { label: '最后心跳', value: heartbeatLabel(device.lastHeartbeat) },
      { label: '告警数量', value: String(device.alerts) },
    ];
  }, [device]);

  if (!device) {
    return (
      <DetailShell title="设备详情" backHref="/device-monitoring">
        <EmptyState
          title="设备未找到"
          description={`未找到 ID 为 "${id}" 的设备，可能已被删除。`}
          action={
            <Button variant="primary" onClick={handleBack}>返回设备列表</Button>
          }
        />
      </DetailShell>
    );
  }

  return (
    <>
      <DetailShell
        title={`设备详情: ${device.name}`}
        subtitle={`当前状态: ${DEVICE_STATUS_LABELS[currentStatus ?? device.status]}`}
        actions={actions}
        backHref="/device-monitoring"
      >
        {/* 状态徽章 */}
        <div className="mb-4">
          <StatusBadge
            label={DEVICE_STATUS_LABELS[currentStatus ?? device.status]}
            variant={STATUS_VARIANT[currentStatus ?? device.status]}
          />
        </div>

        {/* 基础信息 */}
        <DescriptionList items={descriptionItems} columns={2} />

        {/* 心跳时间线 */}
        <section className="mt-8">
          <h3 className="mb-2 text-lg font-semibold text-gray-800">心跳记录</h3>
          <InfoRow
            label="最后心跳时间"
            value={formatDateTime(device.lastHeartbeat)}
          />
          <InfoRow
            label="设备在线时长"
            value={uptimeLabel(device.uptime)}
          />
          <p className="mt-2 text-sm text-gray-500">
            {heartbeatLabel(device.lastHeartbeat)} 心跳已接收
            {device.status === 'offline' && '，设备处于离线状态'}
            {device.status === 'error' && `，存在 ${device.alerts} 条告警`}
          </p>
        </section>

        {/* 告警信息 */}
        {device.alerts > 0 && (
          <section className="mt-6 rounded-lg border border-red-200 bg-red-50 p-4">
            <h3 className="mb-2 font-semibold text-red-800">⚠️ 设备告警</h3>
            <p className="text-sm text-red-700">
              该设备当前有 {device.alerts} 条未处理告警，建议尽快排查。
            </p>
          </section>
        )}

        {/* 状态流转操作栏 */}
        <DetailActionBar
          heading="状态操作"
          caption="快速更新设备运行状态"
          actions={actionBarActions}
        />
      </DetailShell>

      {/* 闭合栏 */}
      <DetailClosureBar links={closureLinks} />

      {/* 删除确认对话框 */}
      <ConfirmDialog
        open={deleteDialogOpen}
        title="确认删除"
        message={`确定要删除设备「${device.name}」(${device.id}) 吗？此操作不可恢复。`}
        confirmLabel="删除"
        cancelLabel="取消"
        variant="danger"
        loading={processing}
        onConfirm={handleDelete}
        onCancel={() => setDeleteDialogOpen(false)}
      />
    </>
  );
}
