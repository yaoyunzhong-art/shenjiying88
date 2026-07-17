/**
 * 设备详情页 — Device Detail (Next.js App Router Dynamic Route)
 *
 * 功能:
 * - 展示设备基本信息：名称、型号、序列号、固件版本、在线状态
 * - 设备运行状态诊断面板（CPU / 内存 / 网络 / 最后心跳）
 * - 关联告警 / 历史事件时间线
 * - 支持固件升级、重启、远程诊断等操作按钮
 * - 错误回退 / 加载中 / 设备未找到空状态
 */
import type { Metadata } from 'next';
import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import { LoadingSkeleton, EmptyState, ErrorBoundary } from '@m5/ui';
import { DeviceDetailClient } from './device-detail-client';

interface PageProps {
  params: Promise<{ id: string }>;
}

/** 从设备 ID 推断元数据标题 */
async function generateDeviceMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  return {
    title: `设备详情 ${id} - M5 指挥台`,
    description: `查看设备 ${id} 的实时运行状态、固件版本、最近告警与事件时间线。支持远程诊断和固件升级操作。`,
  };
}

export { generateDeviceMetadata as generateMetadata };

/** 加载占位 — 4 组卡片 + 标题骨架 */
function DeviceDetailLoadingFallback() {
  return (
    <div style={{ padding: 32, maxWidth: 1000, margin: '0 auto' }}>
      {/* 标题区 */}
      <LoadingSkeleton variant="default" rows={1} label="加载设备标题..." />
      <div style={{ height: 24 }} />

      {/* 信息卡片 */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24 }}>
        <LoadingSkeleton variant="card" rows={4} label="加载设备基本信息" />
        <LoadingSkeleton variant="card" rows={4} label="加载运行状态" />
      </div>

      {/* 事件时间线 */}
      <LoadingSkeleton variant="card" rows={5} label="加载事件时间线..." />
    </div>
  );
}

/** 设备未找到空状态 — 返回 404 */
function DeviceNotFoundState({ deviceId }: { deviceId: string }) {
  return (
    <EmptyState
      title="设备未找到"
      description={`设备 ${deviceId} 不存在或已被移除。请检查设备 ID 是否正确，或返回设备列表重新选择。`}
      action={<a href="/devices">返回设备列表</a>}
    />
  );
}

/** 错误回退 */
function DeviceDetailErrorFallback() {
  return (
    <EmptyState
      title="设备数据加载异常"
      description="无法加载设备详情数据。可能原因：设备离线、网络中断或后端服务不可用。"
      action={<a href="/devices">重试</a>}
    />
  );
}

export default async function DeviceDetailPage({ params }: PageProps) {
  const { id } = await params;

  // 基本 ID 合法性校验
  if (!id || typeof id !== 'string' || id.length < 1 || id.length > 64) {
    notFound();
  }

  return (
    <>
      {/* JSON-LD */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'Product',
            name: `设备 ${id}`,
            description: '门店设备在线状态监控与固件管理',
            category: 'IoT Device',
          }),
        }}
      />

      {/* 主内容区 */}
      <ErrorBoundary fallback={<DeviceDetailErrorFallback />}>
        <Suspense fallback={<DeviceDetailLoadingFallback />}>
          <DeviceDetailClient deviceId={id} />
        </Suspense>
      </ErrorBoundary>

      {/* 操作提示区 */}
      <div
        style={{
          marginTop: 24,
          padding: '12px 16px',
          borderRadius: 8,
          background: 'rgba(255,255,255,0.03)',
          border: '1px solid rgba(148,163,184,0.08)',
          fontSize: 12,
          color: '#94a3b8',
          lineHeight: 1.6,
          maxWidth: 1000,
          marginLeft: 'auto',
          marginRight: 'auto',
        }}
      >
        <strong style={{ color: '#e2e8f0' }}>设备操作提示</strong>
        <br />
        固件升级操作将会导致设备短暂重启（约 30-60s）。
        远程诊断会收集设备运行日志，诊断过程不影响正常使用。
        操作记录将写入审计日志，可在「审计跟踪」页面查看。
      </div>
    </>
  );
}
