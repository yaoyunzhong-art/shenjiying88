'use client';

import { useState, useCallback } from 'react';
import Link from 'next/link';

import {
  DetailActionBar,
  DetailClosureBar,
  DetailShell,
  FormField,
  FormSubmitFeedback,
  InfoRow,
  StatusBadge,
  StatCard,
  CopyToClipboard,
  SubmitButton,
  WorkspaceBreadcrumb,
  useFormSubmit,
  Timeline,
  type DetailShellAction,
  type TimelineItem,
} from '@m5/ui';
import { useDetailActions } from '../../components/use-detail-actions';
import {
  buildStandardBreadcrumb,
  buildStandardClosureLinks,
} from '../../components/detail-workspace-registry';
import { getDevices } from '../devices-data';
import type { DeviceItem } from '../device-types';

// ---- 辅助 ----

const DEVICE_TYPE_LABELS: Record<string, string> = {
  POS: '收银机',
  printer: '打印机',
  scanner: '扫描枪',
  tablet: '平板',
  kiosk: '自助机',
  scale: '电子秤',
};

const STATUS_LABELS: Record<string, string> = {
  online: '在线',
  offline: '离线',
  warning: '告警',
  maintenance: '维护中',
};

function variantFor(s: string): 'success' | 'danger' | 'warning' | 'default' {
  if (s === 'online') return 'success';
  if (s === 'offline') return 'danger';
  if (s === 'warning') return 'warning';
  return 'default';
}

function formatTime(iso: string): string {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

function getDeviceById(id: string): DeviceItem | undefined {
  return getDevices().find((d) => d.id === id);
}

function buildDeviceTimeline(device: DeviceItem): TimelineItem[] {
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  const fmt = (d: Date) =>
    `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;

  const items: TimelineItem[] = [
    {
      key: 'last-check',
      heading: '最近检测',
      subtitle: formatTime(device.lastCheckAt),
      content: device.status === 'online' ? '设备心跳正常' : device.status === 'offline' ? '设备无响应' : device.status === 'warning' ? '检测到异常指标' : '设备处于维护模式',
      variant: device.status === 'online' ? 'success' : device.status === 'warning' ? 'warning' : 'default',
    },
  ];

  // 模拟历史事件
  const lastCheck = new Date(device.lastCheckAt);
  for (let i = 1; i <= 3; i++) {
    const d = new Date(lastCheck.getTime() - i * 3600000);
    const variants: TimelineItem['variant'][] = ['success', 'default', 'warning'];
    items.push({
      key: `check-${i}`,
      heading: '历史检测',
      subtitle: fmt(d),
      content: `第 ${i} 次周期检测完成，设备运行正常`,
      variant: variants[i % variants.length]!,
    });
  }

  items.push({
    key: 'registered',
    heading: '设备注册',
    subtitle: fmt(new Date(lastCheck.getTime() - 7 * 24 * 3600000)),
    content: `设备首次注册，序列号 ${device.serialNumber}`,
    variant: 'default',
  });

  return items;
}

// ---- 编辑表单类型 ----

interface EditFormData {
  name: string;
  ip: string;
  firmwareVersion: string;
}

interface EditFormErrors {
  name?: string;
  ip?: string;
  firmwareVersion?: string;
}

function validateForm(data: EditFormData): EditFormErrors {
  const errors: EditFormErrors = {};
  if (!data.name.trim()) errors.name = '设备名称不能为空';
  if (!data.ip.trim()) errors.ip = 'IP 地址不能为空';
  if (!data.firmwareVersion.trim()) errors.firmwareVersion = '固件版本不能为空';
  return errors;
}

async function submitDeviceEdit(_form: EditFormData): Promise<{ success: boolean }> {
  await new Promise((resolve) => setTimeout(resolve, 600));
  return { success: true };
}

// ---- 主组件 ----

export interface DeviceDetailClientProps {
  deviceId: string;
}

export function DeviceDetailClient({ deviceId }: DeviceDetailClientProps) {
  const device = getDeviceById(deviceId);

  const [editOpen, setEditOpen] = useState(false);
  const [formData, setFormData] = useState<EditFormData>({
    name: device?.name ?? '',
    ip: device?.ip ?? '',
    firmwareVersion: device?.firmwareVersion ?? '',
  });
  const [errors, setErrors] = useState<EditFormErrors>({});

  const {
    submit,
    state: submitState,
    reset: resetSubmit,
  } = useFormSubmit<{ success: boolean }>({
    async onSubmit() {
      const validationErrors = validateForm(formData);
      if (Object.keys(validationErrors).length > 0) {
        setErrors(validationErrors);
        throw new Error(Object.values(validationErrors)[0]);
      }
      setErrors({});
      return submitDeviceEdit(formData);
    },
    successMessage: '设备信息已更新成功。',
  });

  const handleSave = useCallback(async () => {
    const result = await submit();
    if (result) {
      setEditOpen(false);
      resetSubmit();
    }
  }, [submit, resetSubmit]);

  const handleFieldChange = useCallback(
    (field: keyof EditFormData, value: string) => {
      setFormData((prev) => ({ ...prev, [field]: value }));
      if (errors[field]) {
        setErrors((prev) => {
          const next = { ...prev };
          delete next[field];
          return next;
        });
      }
    },
    [errors],
  );

  const handleCancel = useCallback(() => {
    setEditOpen(false);
    setErrors({});
    resetSubmit();
    if (device) {
      setFormData({
        name: device.name,
        ip: device.ip,
        firmwareVersion: device.firmwareVersion,
      });
    }
  }, [device, resetSubmit]);

  // Hook 必须在所有条件返回之前调用
  const { actions: detailActions } = useDetailActions({
    workspace: 'devices',
    detailId: device?.id ?? deviceId,
    record: device ?? {},
    shareTitle: device ? `设备 · ${device.name}` : '设备详情',
    shareText: device ? `查看设备 ${device.name} (${device.serialNumber}) 详情` : '查看设备详情',
  });

  // 未找到设备
  if (!device) {
    return (
      <div style={{ maxWidth: 1120, margin: '0 auto', padding: 32 }}>
        <WorkspaceBreadcrumb
          homeLabel="总览"
          workspaceLabel="设备管理"
          workspaceHref="/devices"
          detailLabel="未找到设备"
        />
        <div
          style={{
            textAlign: 'center',
            padding: '80px 24px',
            color: '#94a3b8',
            fontSize: 16,
          }}
        >
          未找到设备 {deviceId}
          <br />
          <Link href="/devices" style={{ color: '#93c5fd', fontSize: 14 }}>
            返回设备列表
          </Link>
        </div>
      </div>
    );
  }

  const actions: DetailShellAction[] = [
    {
      key: 'edit',
      label: editOpen ? '保存中...' : '编辑',
      variant: 'primary',
      loading: submitState.isSubmitting,
      disabled: submitState.isSubmitting,
      onClick: editOpen ? handleSave : () => setEditOpen(true),
    },
  ];

  if (editOpen) {
    actions.push({
      key: 'cancel',
      label: '取消',
      variant: 'secondary',
      onClick: handleCancel,
    });
  }

  const timeline = buildDeviceTimeline(device);

  return (
    <div style={{ display: 'grid', gap: 16 }}>
      <WorkspaceBreadcrumb
        {...buildStandardBreadcrumb({ workspace: 'devices', detailLabel: device.name })}
      />
      <DetailShell
        title={device.name}
        subtitle={`${DEVICE_TYPE_LABELS[device.type] ?? device.type} · ${device.serialNumber}`}
        breadcrumbs={[
          { label: '设备管理', href: '/devices' },
          { label: device.name },
        ]}
        backLink={{ label: '返回设备列表', href: '/devices' }}
        actions={actions}
      >
        {/* 统计卡片 */}
        <div
          style={{
            display: 'grid',
            gap: 14,
            gridTemplateColumns: 'repeat(4, minmax(0, 1fr))',
            marginBottom: 24,
          }}
        >
          <StatCard
            label="设备状态"
            value={STATUS_LABELS[device.status] ?? device.status}
            helper={`最近检测: ${formatTime(device.lastCheckAt)}`}
          />
          <StatCard label="设备类型" value={DEVICE_TYPE_LABELS[device.type] ?? device.type} helper={`序列号: ${device.serialNumber}`} />
          <StatCard label="固件版本" value={device.firmwareVersion} helper={`IP: ${device.ip}`} />
          <StatCard label="所属门店" value={device.storeName} helper={`门店ID: ${device.storeId}`} />
        </div>

        {/* 编辑模式 */}
        {editOpen ? (
          <section
            style={{
              borderRadius: 16,
              padding: 24,
              background: 'rgba(15, 23, 42, 0.35)',
              border: '1px solid rgba(148, 163, 184, 0.18)',
              marginBottom: 24,
            }}
          >
            <h2 style={{ margin: '0 0 20px', fontSize: 18, fontWeight: 700 }}>
              编辑设备信息
            </h2>

            {submitState.isSubmitting ||
            submitState.errorMessage ||
            submitState.successMessage ? (
              <div style={{ marginBottom: 16 }}>
                <FormSubmitFeedback state={submitState} />
              </div>
            ) : null}

            <div style={{ display: 'grid', gap: 16 }}>
              <FormField label="设备名称" required error={errors.name}>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleFieldChange('name', e.target.value)}
                  disabled={submitState.isSubmitting}
                  style={inputStyle}
                  placeholder="输入设备名称"
                />
              </FormField>
              <FormField label="IP 地址" required error={errors.ip}>
                <input
                  type="text"
                  value={formData.ip}
                  onChange={(e) => handleFieldChange('ip', e.target.value)}
                  disabled={submitState.isSubmitting}
                  style={inputStyle}
                  placeholder="输入 IP 地址"
                />
              </FormField>
              <FormField label="固件版本" required error={errors.firmwareVersion}>
                <input
                  type="text"
                  value={formData.firmwareVersion}
                  onChange={(e) => handleFieldChange('firmwareVersion', e.target.value)}
                  disabled={submitState.isSubmitting}
                  style={inputStyle}
                  placeholder="输入固件版本"
                />
              </FormField>

              <div
                style={{ display: 'flex', gap: 12, alignItems: 'center', marginTop: 8 }}
              >
                <SubmitButton
                  loading={submitState.isSubmitting}
                  disabled={submitState.isSubmitting}
                  onClick={handleSave}
                  variant="primary"
                >
                  保存修改
                </SubmitButton>
                <SubmitButton
                  disabled={submitState.isSubmitting}
                  onClick={handleCancel}
                  variant="secondary"
                >
                  取消
                </SubmitButton>
              </div>
            </div>
          </section>
        ) : null}

        {/* 设备详情信息卡片 */}
        <div
          style={{
            borderRadius: 16,
            padding: 24,
            background: 'rgba(15, 23, 42, 0.35)',
            border: '1px solid rgba(148, 163, 184, 0.18)',
            marginBottom: 24,
          }}
        >
          <h2 style={{ margin: '0 0 16px', fontSize: 18, fontWeight: 700 }}>
            设备信息
          </h2>
          <div
            style={{
              display: 'grid',
              gap: 12,
              gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
            }}
          >
            <InfoRow
              label="设备 ID"
              value={
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                  {device.id}
                  <CopyToClipboard text={device.id} size="sm" iconOnly />
                </span>
              }
            />
            <InfoRow label="设备名称" value={device.name} />
            <InfoRow label="设备类型" value={DEVICE_TYPE_LABELS[device.type] ?? device.type} />
            <InfoRow
              label="运行状态"
              value={
                <StatusBadge
                  label={STATUS_LABELS[device.status] ?? device.status}
                  variant={variantFor(device.status)}
                  size="sm"
                  dot
                />
              }
            />
            <InfoRow
              label="IP 地址"
              value={
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                  {device.ip}
                  <CopyToClipboard text={device.ip} size="sm" iconOnly />
                </span>
              }
            />
            <InfoRow label="序列号" value={device.serialNumber} />
            <InfoRow label="所属门店" value={device.storeName} />
            <InfoRow label="门店 ID" value={device.storeId} />
            <InfoRow label="固件版本" value={device.firmwareVersion} />
            <InfoRow label="最近检测" value={formatTime(device.lastCheckAt)} />
          </div>

          <DetailActionBar
            actions={detailActions}
            heading="详情收口动作"
            caption="复制 / 导出 / 分享当前设备详情"
          />
        </div>

        {/* 设备时间线 */}
        <div
          style={{
            borderRadius: 16,
            padding: 24,
            background: 'rgba(15, 23, 42, 0.35)',
            border: '1px solid rgba(148, 163, 184, 0.18)',
            marginBottom: 24,
          }}
        >
          <h2 style={{ margin: '0 0 16px', fontSize: 18, fontWeight: 700 }}>
            检测记录
          </h2>
          <Timeline items={timeline} />
        </div>
      </DetailShell>
      <DetailClosureBar
        links={buildStandardClosureLinks({ workspace: 'devices', detailId: device.id })}
      />
    </div>
  );
}

// ---- 样式 ----

const inputStyle: React.CSSProperties = {
  width: '100%',
  borderRadius: 10,
  padding: '10px 14px',
  border: '1px solid rgba(148, 163, 184, 0.2)',
  background: 'rgba(15, 23, 42, 0.4)',
  color: '#f1f5f9',
  fontSize: 14,
  outline: 'none',
  boxSizing: 'border-box',
};
