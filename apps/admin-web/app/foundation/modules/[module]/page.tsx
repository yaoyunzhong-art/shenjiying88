'use client';

/**
 * Foundation 模块详情 — Foundation Module Detail Page
 * 功能: 查看模块职责、能力、契约、消费方依赖与治理基线
 *
 * 页面结构:
 * - params 解析路由参数, 读取模块 key
 * - 数据层加载模块详情快照
 * - 详情面板: 模块名称 / 状态 / 职责 / 能力列表 / 入向合约 / 出向合约
 * - 404: 模块不存在时显示 guide
 * - 返回链接至 Foundation 模块列表
 */

import React from 'react';
import {
  Badge, BreadcrumbPageHeader, DetailClosureBar, PageShell, Result, StatusBadge, Typography,
} from '@m5/ui';
import { readFoundationModuleDetailParam } from '@m5/types';

interface ModuleSnapshot {
  moduleKey: string;
  notFound: boolean;
  module?: {
    key: string;
    name: string;
    purpose: string;
    status: string;
    capabilities: Array<{ key: string; name: string; status: string; responsibilities: string[] }>;
    inboundContracts: string[];
    outboundContracts: string[];
  } | null;
}

interface PageProps { params: Promise<{ module?: string | string[] }>; }

function readParam(value: string | string[] | undefined): string | null {
  if (value === undefined || value === null) return null;
  return Array.isArray(value) ? (value.length > 0 ? value[0] : null) : value;
}

function DetailRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex gap-4 py-2.5 border-b border-slate-700 last:border-b-0">
      <span className="w-28 shrink-0 text-sm text-slate-400">{label}</span>
      <div className="flex-1">{children}</div>
    </div>
  );
}

const STATUS_MAP: Record<string, { label: string; variant: 'success' | 'warning' | 'default' }> = {
  active: { label: '活跃', variant: 'success' },
  deprecated: { label: '已废弃', variant: 'warning' },
  draft: { label: '草案', variant: 'default' },
};

const KNOWN_MODULES: Record<string, { name: string; purpose: string; status: string; capabilities: Array<{ key: string; name: string; status: string; responsibilities: string[] }>; inboundContracts: string[]; outboundContracts: string[] }> = {
  'trust-governance': {
    name: 'Trust Governance', purpose: '统一审计、审批、风控与限流治理。', status: 'active',
    capabilities: [
      { key: 'audit', name: '审计记录', status: 'active', responsibilities: ['记录审计事件', '审计日志查询', '事件归因分析'] },
      { key: 'approval', name: '审批流', status: 'active', responsibilities: ['多级审批', '审批超时升级', '审批历史快照'] },
      { key: 'risk-control', name: '风控引擎', status: 'active', responsibilities: ['实时风控评分', '规则引擎调度', '风险告警'] },
    ],
    inboundContracts: ['audit logs', 'approval requests', 'risk metrics'],
    outboundContracts: ['audit trail', 'approval notifications', 'risk assessment'],
  },
  'identity-access': {
    name: 'Identity & Access', purpose: '统一身份认证与权限管理。', status: 'active',
    capabilities: [
      { key: 'sso', name: '单点登录', status: 'active', responsibilities: ['OAuth2 认证', 'SAML 集成', 'JWT 签发管理'] },
      { key: 'rbac', name: '角色权限', status: 'active', responsibilities: ['角色定义', '权限分配', '权限审计'] },
    ],
    inboundContracts: ['user auth', 'role check'],
    outboundContracts: ['role binding', 'token validation'],
  },
  'data-platform': {
    name: 'Data Platform', purpose: '数据采集、清洗、分析与报表生成。', status: 'active',
    capabilities: [
      { key: 'ingestion', name: '数据采集', status: 'active', responsibilities: ['实时事件流采集', '批量数据导入', '数据格式校验'] },
      { key: 'analytics', name: '数据分析', status: 'deprecated', responsibilities: ['聚合查询', '报表生成', '数据导出'] },
    ],
    inboundContracts: ['raw events', 'batch files'],
    outboundContracts: ['analytics reports', 'data exports'],
  },
};

function loadMockModule(moduleKey: string): ModuleSnapshot {
  if (!moduleKey) return { moduleKey: '', notFound: true, module: null };
  const mod = KNOWN_MODULES[moduleKey];
  if (!mod) return { moduleKey, notFound: true, module: null };
  return { moduleKey, notFound: false, module: { key: moduleKey, ...mod } };
}

export default async function FoundationModuleDetailPage({ params }: PageProps) {
  const resolved = await params;
  const moduleKey = readParam(resolved.module);
  const snapshot = loadMockModule(moduleKey ?? '');

  if (snapshot.notFound || !snapshot.module) {
    return (
      <main style={{ maxWidth: 1080, margin: '0 auto', padding: 32 }}>
        <PageShell title="Foundation 模块不存在" subtitle="该模块 key 不在当前 foundation blueprint 范围内。">
          <Result status="404" title="模块未找到" subTitle={`模块 key "${moduleKey}" 不存在`}
            extra={<a href="/foundation" className="inline-block px-5 py-2 bg-blue-600 text-white rounded-lg no-underline">返回模块列表</a>} />
        </PageShell>
      </main>
    );
  }

  const { module } = snapshot;
  const statusCfg = STATUS_MAP[module.status] ?? { label: module.status, variant: 'default' as const };

  return (
    <main style={{ maxWidth: 1080, margin: '0 auto', padding: 32 }}>
      <PageShell title={`Foundation 模块：${module.name}`} subtitle="查看模块职责、能力、契约、消费方依赖与治理基线。">
        <BreadcrumbPageHeader breadcrumbs={[{ label: 'Foundation 模块', href: '/foundation/modules' }, { label: module.name }]} title={module.name} />
        <div className="bg-white/5 border border-slate-700 rounded-xl p-6 mb-6">
          <div className="flex gap-2 items-center mb-5">
            <h3 className="text-base font-semibold text-white">基本信息</h3>
            <StatusBadge label={statusCfg.label} variant={statusCfg.variant} />
          </div>
          <DetailRow label="模块 Key"><span className="font-mono text-sm text-blue-400">{module.key}</span></DetailRow>
          <DetailRow label="名称"><span className="text-sm">{module.name}</span></DetailRow>
          <DetailRow label="状态"><StatusBadge label={statusCfg.label} variant={statusCfg.variant} /></DetailRow>
          <DetailRow label="职责"><span className="text-sm text-slate-300">{module.purpose}</span></DetailRow>
        </div>
        <div className="bg-white/5 border border-slate-700 rounded-xl p-6 mb-6">
          <h3 className="text-base font-semibold text-white mb-4">能力列表</h3>
          {module.capabilities.map((cap) => (
            <div key={cap.key} className="mb-4 pb-4 border-b border-slate-700 last:border-b-0 last:mb-0 last:pb-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="font-medium text-sm text-white">{cap.name}</span>
                <Badge variant={cap.status === 'active' ? 'success' : 'default'}>{cap.status}</Badge>
              </div>
              <ul className="list-disc list-inside text-xs text-slate-400 space-y-0.5">
                {cap.responsibilities.map((r, i) => <li key={i}>{r}</li>)}
              </ul>
            </div>
          ))}
        </div>
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-white/5 border border-slate-700 rounded-xl p-4">
            <h4 className="text-xs font-semibold text-slate-400 mb-2">入向合约</h4>
            {module.inboundContracts.length > 0 ? module.inboundContracts.map((c, i) => (
              <div key={i} className="text-sm font-mono text-slate-300 py-1">{c}</div>
            )) : <span className="text-xs text-slate-500">无入向合约</span>}
          </div>
          <div className="bg-white/5 border border-slate-700 rounded-xl p-4">
            <h4 className="text-xs font-semibold text-slate-400 mb-2">出向合约</h4>
            {module.outboundContracts.length > 0 ? module.outboundContracts.map((c, i) => (
              <div key={i} className="text-sm font-mono text-slate-300 py-1">{c}</div>
            )) : <span className="text-xs text-slate-500">无出向合约</span>}
          </div>
        </div>
        <DetailClosureBar links={[{ key: 'list', title: 'Foundation 模块列表', subtitle: '返回 Foundation 模块管理', href: '/foundation/modules' }]} />
      </PageShell>
    </main>
  );
}

// ---- 辅助函数 ----

function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    active: 'text-emerald-400',
    deprecated: 'text-amber-400',
    draft: 'text-slate-400',
  };
  return colors[status] ?? 'text-slate-400';
}

function getCapabilityStatusColor(status: string): string {
  return status === 'active' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400';
}

function ModuleNotFound({ moduleKey }: { moduleKey: string | null }) {
  return (
    <div className="rounded-xl bg-slate-900/60 border border-slate-700 p-8 text-center">
      <div className="text-5xl mb-4">🏗️</div>
      <h3 className="text-lg font-semibold text-white mb-2">模块未找到</h3>
      <p className="text-sm text-slate-400 mb-4">
        模块 &quot;{moduleKey ?? '—'}&quot; 不在当前 Foundation Blueprint 范围内。
      </p>
      <a href="/foundation/modules" className="inline-block px-5 py-2 bg-blue-600 text-white rounded-lg no-underline text-sm">
        返回模块列表
      </a>
    </div>
  );
}

function CapabilityCard({ capability }: { capability: { key: string; name: string; status: string; responsibilities: string[] } }) {
  return (
    <div className="bg-slate-800/60 rounded-lg p-4 border border-slate-700">
      <div className="flex items-center gap-2 mb-2">
        <span className="font-medium text-sm text-white">{capability.name}</span>
        <span className={`text-xs px-2 py-0.5 rounded-full ${getCapabilityStatusColor(capability.status)}`}>{capability.status}</span>
      </div>
      <ul className="space-y-1">
        {capability.responsibilities.map((r, i) => (
          <li key={i} className="text-xs text-slate-400 flex items-start gap-1.5">
            <span className="text-slate-600 mt-0.5">•</span>
            {r}
          </li>
        ))}
      </ul>
    </div>
  );
}

function ContractSection({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="bg-slate-800/60 rounded-lg p-4 border border-slate-600">
      <h4 className="text-xs font-semibold text-slate-400 mb-2 uppercase tracking-wider">{title}</h4>
      {items.length > 0 ? (
        items.map((c, i) => (
          <div key={i} className="py-1.5 border-b border-slate-700 last:border-b-0">
            <span className="text-sm font-mono text-slate-300">{c}</span>
          </div>
        ))
      ) : (
        <span className="text-xs text-slate-500">未定义</span>
      )}
    </div>
  );
}

// ---- Foundation 模块辅助函数 ----

function getBlueprintVersion(): string {
  return 'v2.3.1 (Foundation-11)';
}

function formatModuleStatus(status: string): string {
  const labels: Record<string, string> = {
    active: '活跃', deprecated: '已废弃', draft: '草案', archived: '已归档',
  };
  return labels[status] ?? status;
}

function getBlueprintUrl(): string {
  return '/foundation/blueprint';
}

function countTotalCapabilities(module: NonNullable<ModuleSnapshot['module']>): number {
  return module.capabilities.length;
}

function countActiveCapabilities(module: NonNullable<ModuleSnapshot['module']>): number {
  return module.capabilities.filter((c) => c.status === 'active').length;
}

function getContractDirectionBadge(dir: 'inbound' | 'outbound'): { label: string; variant: 'info' | 'success' } {
  return dir === 'inbound' ? { label: '入向', variant: 'info' } : { label: '出向', variant: 'success' };
}

const FOUNDATION_PAGE_META = {
  title: 'Foundation 模块详情',
  subtitle: '查看模块职责、能力、契约、消费方依赖与治理基线',
} as const;

// ---- 新增: 模块依赖图 ----

interface DependencyNode {
  name: string;
  direction: 'inbound' | 'outbound';
  weight: 'high' | 'medium' | 'low';
}

function buildDependencyGraph(module: NonNullable<ModuleSnapshot['module']>): DependencyNode[] {
  const nodes: DependencyNode[] = [];
  for (const contract of module.inboundContracts) {
    nodes.push({ name: contract, direction: 'inbound', weight: 'medium' });
  }
  for (const contract of module.outboundContracts) {
    nodes.push({ name: contract, direction: 'outbound', weight: 'high' });
  }
  return nodes;
}

function DependencyGraphView({ nodes }: { nodes: DependencyNode[] }) {
  if (nodes.length === 0) {
    return <span className="text-xs text-slate-500">无依赖关系</span>;
  }
  const inbound = nodes.filter((n) => n.direction === 'inbound');
  const outbound = nodes.filter((n) => n.direction === 'outbound');
  return (
    <div className="space-y-4">
      <div>
        <h5 className="text-xs font-semibold text-slate-400 mb-2">入向依赖 ({inbound.length})</h5>
        <div className="flex flex-wrap gap-2">
          {inbound.map((n, i) => (
            <span key={i}
              className="px-2.5 py-1 bg-blue-500/10 border border-blue-500/30 rounded-full text-xs text-blue-400">
              ← {n.name}
            </span>
          ))}
        </div>
      </div>
      <div>
        <h5 className="text-xs font-semibold text-slate-400 mb-2">出向依赖 ({outbound.length})</h5>
        <div className="flex flex-wrap gap-2">
          {outbound.map((n, i) => (
            <span key={i}
              className="px-2.5 py-1 bg-emerald-500/10 border border-emerald-500/30 rounded-full text-xs text-emerald-400">
              → {n.name}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

// ---- 新增: API 端点列表 ----

interface ApiEndpoint {
  path: string;
  method: string;
  description: string;
  status: 'active' | 'deprecated' | 'experimental';
}

function buildMockEndpoints(moduleKey: string): ApiEndpoint[] {
  const endpoints: Record<string, ApiEndpoint[]> = {
    'trust-governance': [
      { path: '/api/v1/audit/events', method: 'GET', description: '获取审计事件列表', status: 'active' },
      { path: '/api/v1/audit/events/:id', method: 'GET', description: '获取审计事件详情', status: 'active' },
      { path: '/api/v1/approval/requests', method: 'POST', description: '创建审批请求', status: 'active' },
      { path: '/api/v1/risk/assess', method: 'POST', description: '风控评估', status: 'active' },
      { path: '/api/v1/risk/rules', method: 'GET', description: '获取风控规则列表', status: 'deprecated' },
    ],
    'identity-access': [
      { path: '/api/v1/auth/login', method: 'POST', description: '用户登录', status: 'active' },
      { path: '/api/v1/auth/refresh', method: 'POST', description: '令牌刷新', status: 'active' },
      { path: '/api/v1/roles', method: 'GET', description: '角色列表', status: 'active' },
      { path: '/api/v1/permissions/check', method: 'POST', description: '权限校验', status: 'active' },
    ],
    'data-platform': [
      { path: '/api/v1/ingestion/events', method: 'POST', description: '采集事件', status: 'active' },
      { path: '/api/v1/analytics/reports', method: 'GET', description: '获取报表', status: 'deprecated' },
      { path: '/api/v1/analytics/query', method: 'POST', description: '数据查询', status: 'experimental' },
    ],
  };
  return endpoints[moduleKey] ?? [];
}

function ApiEndpointList({ endpoints }: { endpoints: ApiEndpoint[] }) {
  if (endpoints.length === 0) {
    return <span className="text-xs text-slate-500">暂无 API 端点</span>;
  }
  return (
    <div className="space-y-2">
      {endpoints.map((ep, i) => (
        <div key={i} className="flex items-center gap-3 py-2 border-b border-slate-700 last:border-b-0">
          <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
            ep.method === 'GET' ? 'bg-emerald-500/20 text-emerald-400' :
            ep.method === 'POST' ? 'bg-blue-500/20 text-blue-400' :
            'bg-amber-500/20 text-amber-400'
          }`}>
            {ep.method}
          </span>
          <span className="font-mono text-xs text-slate-300 flex-1">{ep.path}</span>
          <span className="text-xs text-slate-400 flex-1">{ep.description}</span>
          <span className={`text-[10px] px-1.5 py-0.5 rounded ${
            ep.status === 'active' ? 'bg-emerald-500/10 text-emerald-400' :
            ep.status === 'deprecated' ? 'bg-red-500/10 text-red-400' :
            'bg-amber-500/10 text-amber-400'
          }`}>{ep.status}</span>
        </div>
      ))}
    </div>
  );
}

// ---- 新增: 状态历史 ----

interface StatusChangeEvent {
  date: string;
  fromStatus: string;
  toStatus: string;
  reason: string;
}

function buildMockStatusHistory(): StatusChangeEvent[] {
  return [
    { date: '2025-01-15', fromStatus: 'draft', toStatus: 'active', reason: '模块初始化完成' },
    { date: '2025-06-01', fromStatus: 'active', toStatus: 'active', reason: '能力扩展: 新增审计记录功能' },
    { date: '2026-01-10', fromStatus: 'active', toStatus: 'active', reason: '安全加固: 增加访问审计' },
    { date: '2026-03-20', fromStatus: 'active', toStatus: 'active', reason: '性能优化: 请求限流支持' },
  ];
}

function buildModuleStatusHistory(moduleKey: string): StatusChangeEvent[] {
  if (moduleKey === 'data-platform') {
    return [
      { date: '2025-02-01', fromStatus: 'draft', toStatus: 'active', reason: '数据平台上线' },
      { date: '2026-04-15', fromStatus: 'active', toStatus: 'deprecated', reason: 'analytics 能力标记废弃' },
    ];
  }
  return buildMockStatusHistory();
}

function StatusHistoryTimeline({ events }: { events: StatusChangeEvent[] }) {
  if (events.length === 0) {
    return <span className="text-xs text-slate-500">暂无状态历史</span>;
  }
  return (
    <div className="relative pl-5 space-y-3">
      {events.map((evt, i) => (
        <div key={i} className="relative">
          <div className={`absolute -left-[17px] w-2.5 h-2.5 rounded-full mt-1.5 ${
            evt.toStatus === 'active' ? 'bg-emerald-500' :
            evt.toStatus === 'deprecated' ? 'bg-red-500' :
            evt.toStatus === 'draft' ? 'bg-slate-400' : 'bg-blue-500'
          }`} />
          <div className="bg-slate-800/60 rounded-lg p-3 border border-slate-700">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-mono text-slate-500">{evt.date}</span>
            </div>
            <p className="text-xs text-slate-300">{evt.reason}</p>
            <div className="flex gap-1 mt-1">
              <span className="text-[10px] bg-slate-700 px-1.5 py-0.5 rounded text-slate-400">{evt.fromStatus}</span>
              <span className="text-[10px] text-slate-500">→</span>
              <span className={`text-[10px] px-1.5 py-0.5 rounded ${
                evt.toStatus === 'active' ? 'bg-emerald-500/20 text-emerald-400' :
                evt.toStatus === 'deprecated' ? 'bg-red-500/20 text-red-400' :
                'bg-slate-700 text-slate-300'
              }`}>{evt.toStatus}</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ---- 新增: 模块概览统计 ----

function moduleHealthScore(module: NonNullable<ModuleSnapshot['module']>): { score: number; label: string } {
  const activeCaps = module.capabilities.filter((c) => c.status === 'active').length;
  const totalCaps = module.capabilities.length;
  const ratio = totalCaps > 0 ? activeCaps / totalCaps : 0;
  if (ratio >= 0.8) return { score: 90, label: '健康' };
  if (ratio >= 0.5) return { score: 60, label: '需关注' };
  return { score: 30, label: '需修复' };
}

function countDeprecatedCapabilities(module: NonNullable<ModuleSnapshot['module']>): number {
  return module.capabilities.filter((c) => c.status === 'deprecated').length;
}

function getModuleAgeInMonths(module: NonNullable<ModuleSnapshot['module']>): number {
  // 基于能力数量估算模块年龄（模拟）
  return module.capabilities.length * 3;
}

export {
  getBlueprintVersion, formatModuleStatus, getBlueprintUrl,
  countTotalCapabilities, countActiveCapabilities,
  getContractDirectionBadge, FOUNDATION_PAGE_META,
  buildDependencyGraph, DependencyGraphView,
  buildMockEndpoints, ApiEndpointList,
  buildMockStatusHistory, buildModuleStatusHistory, StatusHistoryTimeline,
  moduleHealthScore, countDeprecatedCapabilities, getModuleAgeInMonths,
};
