'use client';

import { useState, useMemo, type CSSProperties } from 'react';
import { mapToBackendRole, type RoleWorkbenchContract } from '@m5/types';
import { PageShell, StatusBadge } from '@m5/ui';

import { AdminPermissionGate } from '../../components/admin-permission-gate';

type ServiceType =
  | 'device_help'
  | 'game_instruction'
  | 'member_register'
  | 'complaint'
  | 'general';
type ServiceStatus = 'waiting' | 'in_progress' | 'resolved';
type DeviceCheckStatus = 'normal' | 'warning' | 'fault';

interface ServiceItem {
  id: string;
  time: string;
  customer: string;
  type: ServiceType;
  description: string;
  status: ServiceStatus;
  priority: 'high' | 'medium' | 'low';
}

interface GuideWorkbenchClientProps {
  deliveryMode: 'api' | 'fallback';
  roleWorkbench?: RoleWorkbenchContract;
}

const SERVICE_TYPE: Record<ServiceType, string> = {
  device_help: '设备协助',
  game_instruction: '游戏指导',
  member_register: '会员注册',
  complaint: '客诉处理',
  general: '一般咨询',
};

const STATUS_V: Record<ServiceStatus, { l: string; v: 'danger' | 'warning' | 'success' }> = {
  waiting: { l: '等待中', v: 'danger' },
  in_progress: { l: '处理中', v: 'warning' },
  resolved: { l: '已解决', v: 'success' },
};

function generateServices(): ServiceItem[] {
  const customers = ['张先生', '李女士', '小朋友A', '王妈妈', '赵同学', '陈阿姨', '刘哥', '小美'];
  const descriptions = [
    '游戏币卡住了',
    '不会操作赛车',
    '要办会员卡',
    '娃娃机爪子太松',
    '想玩但不会规则',
    '设备不找零',
    '投诉噪音大',
    '问路问价格',
  ];

  return Array.from({ length: 12 }, (_, index) => ({
    id: `SV-${index + 1}`,
    time: `${String(8 + Math.floor(Math.random() * 14)).padStart(2, '0')}:${String(
      Math.floor(Math.random() * 60),
    ).padStart(2, '0')}`,
    customer: customers[Math.floor(Math.random() * customers.length)]!,
    type: (
      ['device_help', 'game_instruction', 'member_register', 'complaint', 'general'] as ServiceType[]
    )[Math.floor(Math.random() * 5)]!,
    description: descriptions[Math.floor(Math.random() * descriptions.length)]!,
    status: (['waiting', 'in_progress', 'resolved'] as ServiceStatus[])[
      Math.floor(Math.random() * 3)
    ]!,
    priority: (['high', 'medium', 'low'] as const)[Math.floor(Math.random() * 3)]!,
  }));
}

const permissionGate = {
  requiredPermission: 'workbench.read',
  title: '导玩工作台访问受限',
  description:
    '导玩工作台已接入管理员本地 session，只有具备 workbench.read 的账号才能查看服务队列、设备巡检与接待统计。',
} as const;

export default function GuideWorkbenchClient({
  deliveryMode,
  roleWorkbench,
}: GuideWorkbenchClientProps) {
  const [loading] = useState(false);
  const [error] = useState<string | null>(null);
  const backendRole = mapToBackendRole(roleWorkbench?.role ?? 'GUIDE');

  const sourceEvidence = useMemo(
    () => ({
      deliveryMode,
      controlPlaneSource:
        deliveryMode === 'api'
          ? 'getAdminWorkbenchConsumerSnapshot / getRoleWorkbench'
          : 'fallbackRoleWorkbenches',
      businessDataSource: 'generateServices + local deviceChecks mock array',
      note:
        deliveryMode === 'api'
          ? '导玩工作台壳层已接入 bootstrap snapshot，但服务队列和设备巡检仍为本地 mock 样本。'
          : '导玩工作台壳层当前回退到 fallbackRoleWorkbenches，服务队列和设备巡检仍为本地 mock 样本。',
    }),
    [deliveryMode],
  );

  if (loading) {
    return (
      <AdminPermissionGate {...permissionGate}>
        <div>加载中...</div>
      </AdminPermissionGate>
    );
  }
  if (error) {
    return (
      <AdminPermissionGate {...permissionGate}>
        <div>数据获取失败: {error}</div>
      </AdminPermissionGate>
    );
  }

  // 数据条件守卫 — 常量mock数据，默认非空
  const isEmpty = false;
  const services = useMemo(() => generateServices(), []);
  const waitingCount = services.filter((item) => item.status === 'waiting').length;
  const resolvedCount = services.filter((item) => item.status === 'resolved').length;
  const marketLabel = roleWorkbench?.marketCodes.join(' / ') || '未标注';
  const navItemCount = roleWorkbench?.navItems.length ?? 0;
  const usesOperatorBridge = backendRole === 'operator';

  const deviceChecks = [
    { name: '拳皇街机', status: 'normal' as DeviceCheckStatus, lastCheck: '10:30', note: '正常' },
    { name: '赛车模拟器', status: 'normal' as DeviceCheckStatus, lastCheck: '10:30', note: '正常' },
    { name: '娃娃机(大)', status: 'warning' as DeviceCheckStatus, lastCheck: '09:00', note: '爪子略松,已报修' },
    { name: '娃娃机(小)', status: 'normal' as DeviceCheckStatus, lastCheck: '10:30', note: '正常' },
    { name: 'VR体验', status: 'normal' as DeviceCheckStatus, lastCheck: '10:00', note: '正常' },
    { name: '投篮机', status: 'fault' as DeviceCheckStatus, lastCheck: '08:30', note: '计分故障,待维修' },
  ];

  // E54 控制面证据：导玩工作台已接入角色快照，但业务明细仍是 mock 数据。
  return (
    <AdminPermissionGate {...permissionGate}>
      <main style={{ maxWidth: 1200, margin: '0 auto', padding: 24 }}>
        <PageShell
          title="🎮 导玩员工作台"
          subtitle={roleWorkbench?.description ?? '今日客户服务·设备巡检·活动推荐'}
        >
          <div style={evidenceCard}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              <StatusBadge label={`Delivery ${sourceEvidence.deliveryMode}`} variant="neutral" size="sm" />
              <span style={{ fontSize: 12, color: '#cbd5e1' }}>
                控制面来源: {sourceEvidence.controlPlaneSource}
              </span>
            </div>
            <div style={{ fontSize: 12, color: '#cbd5e1', marginTop: 8, lineHeight: 1.7 }}>
              业务数据: {sourceEvidence.businessDataSource} · tenant-config 角色映射:{' '}
              {backendRole ?? '未映射'} · 工作台模块: {navItemCount} · 市场: {marketLabel}
            </div>
            <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 8 }}>
              {usesOperatorBridge
                ? `${sourceEvidence.note} 当前导玩角色仍通过 operator 桥接到 tenant-config，属于 E54 M1 过渡态。`
                : sourceEvidence.note}
            </div>
          </div>

          {isEmpty ? (
            <div style={card}>暂无导玩工作台数据</div>
          ) : (
            <>
              <div
                style={{
                  display: 'grid',
                  gap: 14,
                  gridTemplateColumns: 'repeat(4,1fr)',
                  marginBottom: 20,
                }}
              >
                <div style={card}>
                  <div style={{ fontSize: 13, color: '#cbd5e1' }}>待服务</div>
                  <div
                    style={{
                      marginTop: 6,
                      fontSize: 28,
                      fontWeight: 700,
                      color: '#ef4444',
                    }}
                  >
                    {waitingCount}
                  </div>
                </div>
                <div style={card}>
                  <div style={{ fontSize: 13, color: '#cbd5e1' }}>已处理</div>
                  <div
                    style={{
                      marginTop: 6,
                      fontSize: 28,
                      fontWeight: 700,
                      color: '#22c55e',
                    }}
                  >
                    {resolvedCount}
                  </div>
                </div>
                <div style={card}>
                  <div style={{ fontSize: 13, color: '#cbd5e1' }}>设备巡检</div>
                  <div
                    style={{
                      marginTop: 6,
                      fontSize: 28,
                      fontWeight: 700,
                      color: deviceChecks.some((item) => item.status === 'fault')
                        ? '#ef4444'
                        : '#22c55e',
                    }}
                  >
                    {deviceChecks.filter((item) => item.status !== 'normal').length}项异常
                  </div>
                </div>
                <div style={card}>
                  <div style={{ fontSize: 13, color: '#cbd5e1' }}>今日接待</div>
                  <div
                    style={{
                      marginTop: 6,
                      fontSize: 28,
                      fontWeight: 700,
                      color: '#3b82f6',
                    }}
                  >
                    {services.length}人
                  </div>
                </div>
              </div>

              <div style={{ display: 'grid', gap: 20, gridTemplateColumns: '1fr 1fr' }}>
                <section style={card}>
                  <h3 style={{ margin: '0 0 16px', fontSize: 16, fontWeight: 700 }}>
                    📋 服务队列
                  </h3>
                  <div style={{ display: 'grid', gap: 8 }}>
                    {services.slice(0, 8).map((item) => (
                      <div
                        key={item.id}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 10,
                          padding: '10px 14px',
                          borderRadius: 10,
                          background: 'rgba(15,23,42,0.3)',
                          border:
                            item.status === 'waiting'
                              ? '1px solid rgba(239,68,68,0.2)'
                              : 'none',
                        }}
                      >
                        <StatusBadge
                          label={STATUS_V[item.status].l}
                          variant={STATUS_V[item.status].v}
                          size="sm"
                          dot
                        />
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: 14, fontWeight: 600 }}>
                            {item.description}
                          </div>
                          <div style={{ fontSize: 12, color: '#94a3b8' }}>
                            {item.customer} · {SERVICE_TYPE[item.type]} · {item.time}
                          </div>
                        </div>
                        <span
                          style={{
                            fontSize: 12,
                            color: item.priority === 'high' ? '#ef4444' : '#94a3b8',
                            fontWeight: 600,
                          }}
                        >
                          {item.priority === 'high' ? '优先' : ''}
                        </span>
                      </div>
                    ))}
                  </div>
                </section>

                <section style={card}>
                  <h3 style={{ margin: '0 0 16px', fontSize: 16, fontWeight: 700 }}>
                    🔍 设备巡检
                  </h3>
                  <div style={{ display: 'grid', gap: 8 }}>
                    {deviceChecks.map((item) => (
                      <div
                        key={item.name}
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          padding: '10px 14px',
                          borderRadius: 10,
                          background: 'rgba(15,23,42,0.3)',
                        }}
                      >
                        <div>
                          <span style={{ fontWeight: 600, fontSize: 14 }}>
                            🎮 {item.name}
                          </span>
                          <span
                            style={{ marginLeft: 8, fontSize: 12, color: '#94a3b8' }}
                          >
                            {item.note}
                          </span>
                        </div>
                        <StatusBadge
                          label={
                            item.status === 'normal'
                              ? '正常'
                              : item.status === 'warning'
                                ? '需关注'
                                : '故障'
                          }
                          variant={
                            item.status === 'normal'
                              ? 'success'
                              : item.status === 'warning'
                                ? 'warning'
                                : 'danger'
                          }
                          size="sm"
                          dot
                        />
                      </div>
                    ))}
                  </div>
                  <div style={{ marginTop: 12, display: 'flex', gap: 8 }}>
                    <button style={btnStyle('#3b82f6', '#93c5fd')}>✅ 完成巡检</button>
                    <button style={btnStyle('#eab308', '#fbbf24')}>📋 报修</button>
                  </div>
                </section>
              </div>
            </>
          )}
        </PageShell>
      </main>
    </AdminPermissionGate>
  );
}

const evidenceCard: CSSProperties = {
  marginBottom: 16,
  padding: '12px 14px',
  borderRadius: 12,
  background: 'rgba(15, 23, 42, 0.38)',
  border: '1px solid rgba(148, 163, 184, 0.12)',
};

const card: CSSProperties = {
  borderRadius: 16,
  padding: 18,
  background: 'rgba(15,23,42,0.38)',
  border: '1px solid rgba(148,163,184,0.18)',
};

const btnStyle = (background: string, color: string): CSSProperties => ({
  borderRadius: 8,
  padding: '8px 14px',
  background: `${background}22`,
  color,
  border: 'none',
  cursor: 'pointer',
  fontSize: 13,
  fontWeight: 600,
});
