/**
 * 设备管理 — Device List Page (Next.js App Router)
 *
 * 功能:
 * - 展示门店设备在线状态监控与固件管理
 * - 设备列表含搜索、状态筛选（在线/离线/故障/维护中）
 * - 设备分类统计：总设备数 / 在线率 / 故障率
 * - 空状态 / 加载中 / 搜索无结果 / 错误回退
 * - JSON-LD 结构化数据
 */
import type { Metadata } from 'next';
import { Suspense } from 'react';
import { LoadingSkeleton, EmptyState, ErrorBoundary } from '@m5/ui';
import { getDevices } from './devices-data';
import { DeviceListClient } from './device-list-client';

export const metadata: Metadata = {
  title: '设备管理 - M5 指挥台',
  description:
    '门店设备在线状态监控与固件管理。支持在线/离线/故障状态筛选，设备总数、在线率、故障率统计。支持批量固件升级和远程诊断。',
  openGraph: {
    title: '设备管理 | 门店设备监控',
    description: '门店设备在线状态监控与固件管理，支持状态筛选和批量操作',
    type: 'website',
  },
};

/** 模拟设备统计摘要 */
function DeviceSummaryStats({ devices }: { devices: unknown[] }) {
  const total = devices.length;
  const online = devices.filter((d: any) => d.status === 'online').length;
  const offline = devices.filter((d: any) => d.status === 'offline').length;
  const fault = devices.filter((d: any) => d.status === 'fault' || d.status === 'error').length;
  const onlineRate = total > 0 ? ((online / total) * 100).toFixed(1) : '0.0';

  const STATS = [
    { label: '设备总数', value: total.toString(), color: '#e2e8f0' },
    { label: '在线设备', value: online.toString(), color: '#34d399' },
    { label: '离线设备', value: offline.toString(), color: '#f87171' },
    { label: '故障设备', value: fault.toString(), color: '#fb923c' },
    { label: '在线率', value: `${onlineRate}%`, color: '#60a5fa' },
  ];

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
        gap: 12,
        marginBottom: 24,
      }}
    >
      {STATS.map((s) => (
        <div
          key={s.label}
          style={{
            padding: '16px 20px',
            borderRadius: 12,
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid rgba(148,163,184,0.08)',
            textAlign: 'center',
          }}
        >
          <div style={{ fontSize: 24, fontWeight: 700, color: s.color, marginBottom: 4 }}>
            {s.value}
          </div>
          <div style={{ fontSize: 12, color: '#94a3b8' }}>{s.label}</div>
        </div>
      ))}
    </div>
  );
}

/** 加载占位 */
function DeviceListLoadingFallback() {
  return (
    <div style={{ padding: 32 }}>
      {/* 统计骨架 */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 12, marginBottom: 24 }}>
        {[1, 2, 3, 4, 5].map((i) => (
          <LoadingSkeleton key={i} variant="card" rows={2} label={`加载统计项 ${i}`} />
        ))}
      </div>
      {/* 列表骨架 */}
      <LoadingSkeleton variant="card" rows={6} label="加载设备列表..." />
    </div>
  );
}

/** 错误回退 */
function DeviceListErrorFallback() {
  return (
    <EmptyState
      title="设备数据加载失败"
      description="无法获取设备列表数据，请检查网络连接并稍后重试。"
      action={<a href="/devices">重试</a>}
    />
  );
}

/** 搜索无结果 */
function DeviceSearchNoResults() {
  return (
    <EmptyState
      title="未找到匹配设备"
      description="尝试修改筛选条件或关键词重新搜索。"
      action={<a href="/devices">清除筛选</a>}
    />
  );
}

export default function DevicesPage() {
  const devices = getDevices();

  return (
    <>
      {/* JSON-LD */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'WebApplication',
            name: '设备管理',
            applicationCategory: 'BusinessApplication',
            description:
              '门店设备在线状态监控与固件管理。支持在线/离线/故障状态筛选和批量操作。',
          }),
        }}
      />

      {/* 统计摘要 */}
      {devices && devices.length > 0 && <DeviceSummaryStats devices={devices} />}

      {/* 主列表 */}
      <ErrorBoundary fallback={() => <DeviceListErrorFallback />}>
        <Suspense fallback={<DeviceListLoadingFallback />}>
          {devices && devices.length > 0 ? (
            <DeviceListClient devices={devices} />
          ) : devices && devices.length === 0 ? (
            <DeviceSearchNoResults />
          ) : null}
        </Suspense>
      </ErrorBoundary>

      {/* 操作提示 */}
      <div
        style={{
          marginTop: 24,
          padding: '8px 16px',
          borderRadius: 8,
          background: 'rgba(255,255,255,0.03)',
          border: '1px solid rgba(148,163,184,0.08)',
          fontSize: 12,
          color: '#94a3b8',
          lineHeight: 1.6,
        }}
      >
        <strong style={{ color: '#e2e8f0' }}>操作提示</strong>
        <br />
        固件升级前请确保设备电量充足（&gt;30%）。批量操作将同时发送指令至所选设备，建议分批操作。
        设备固件版本可设置自动更新策略。
      </div>
    </>
  );
}
