'use client';

/**
 * 开发工具 — Dev Tools Hub Page
 *
 * 功能:
 *  - Brand 品牌运营管理入口
 *  - Deploy 部署管理入口
 *  - Platform 开放平台入口
 *  - 搜索过滤子页面
 *  - 统计概览面板
 *  - 最近活动/部署动态
 */

import { useState, useMemo } from 'react';

// ==================== 类型定义 ====================

interface DevToolEntry {
  id: string;
  label: string;
  description: string;
  icon: string;
  href: string;
  category: 'brand' | 'deploy' | 'platform';
  tags: string[];
  enabled: boolean;
}

interface ActivityItem {
  id: string;
  type: 'deploy' | 'brand' | 'platform';
  action: string;
  target: string;
  timestamp: string;
  status: 'success' | 'info' | 'warning';
}

// ==================== Mock 数据 ====================

const DEV_TOOLS: DevToolEntry[] = [
  {
    id: 'brand-main',
    label: '品牌概览',
    description: '查看所有品牌列表、状态、模板与活动概况',
    icon: '🏢',
    href: '/dev-tools/brand',
    category: 'brand',
    tags: ['品牌', '概览', '模板'],
    enabled: true,
  },
  {
    id: 'brand-dashboard',
    label: '运营看板',
    description: '品牌运营数据仪表盘，展示关键指标与趋势',
    icon: '📊',
    href: '/dev-tools/brand/dashboard',
    category: 'brand',
    tags: ['看板', '运营', '数据'],
    enabled: true,
  },
  {
    id: 'brand-campaigns',
    label: '营销活动',
    description: '品牌营销活动管理与投放效果追踪',
    icon: '📣',
    href: '/dev-tools/brand/campaigns',
    category: 'brand',
    tags: ['营销', '活动', '投放'],
    enabled: true,
  },
  {
    id: 'deploy-main',
    label: '部署管理',
    description: '多环境部署管理与回滚操作',
    icon: '🚀',
    href: '/dev-tools/deploy',
    category: 'deploy',
    tags: ['部署', '环境', '回滚'],
    enabled: true,
  },
  {
    id: 'platform-main',
    label: '开放平台',
    description: 'API 文档、开发者管理、QPS 监控',
    icon: '🔌',
    href: '/dev-tools/platform',
    category: 'platform',
    tags: ['API', '开发者', '文档'],
    enabled: true,
  },
];

const RECENT_ACTIVITIES: ActivityItem[] = [
  { id: 'a1', type: 'deploy', action: '发布成功', target: '收银系统 v2.3.1', timestamp: '2026-07-16 04:30', status: 'success' },
  { id: 'a2', type: 'brand', action: '新品牌上架', target: '极限攀岩馆', timestamp: '2026-07-16 02:15', status: 'info' },
  { id: 'a3', type: 'deploy', action: '回滚完成', target: '财务对账 v2.2.0', timestamp: '2026-07-15 22:30', status: 'warning' },
  { id: 'a4', type: 'platform', action: 'API 密钥轮换', target: '收银API v3', timestamp: '2026-07-15 18:00', status: 'info' },
  { id: 'a5', type: 'brand', action: '活动上线', target: '暑期大促 Campaign', timestamp: '2026-07-15 14:00', status: 'success' },
];

// ==================== 统计函数 ====================

function computeCategoryStats(entries: DevToolEntry[]) {
  const categories = new Map<string, number>();
  for (const e of entries) {
    categories.set(e.category, (categories.get(e.category) ?? 0) + 1);
  }
  return {
    total: entries.length,
    brand: categories.get('brand') ?? 0,
    deploy: categories.get('deploy') ?? 0,
    platform: categories.get('platform') ?? 0,
  };
}

function filterEntries(entries: DevToolEntry[], query: string, category: string): DevToolEntry[] {
  let result = entries;
  if (category !== 'all') {
    result = result.filter((e) => e.category === category);
  }
  if (query.trim()) {
    const q = query.toLowerCase();
    result = result.filter(
      (e) =>
        e.label.toLowerCase().includes(q) ||
        e.description.toLowerCase().includes(q) ||
        e.tags.some((t) => t.includes(q)),
    );
  }
  return result;
}

// ==================== 样式常量 ====================

const CARD: React.CSSProperties = {
  background: '#fff',
  border: '1px solid #e5e7eb',
  borderRadius: 8,
  padding: 16,
  marginBottom: 16,
};

const INPUT: React.CSSProperties = {
  width: '100%',
  padding: '10px 12px',
  border: '1px solid #d1d5db',
  borderRadius: 6,
  fontSize: 14,
  boxSizing: 'border-box',
};

// ==================== 子组件 ====================

function StatCard({ label, value, sub, bg, color }: {
  label: string; value: number | string; sub?: string; bg: string; color: string;
}) {
  return (
    <div style={{ background: bg, borderRadius: 8, padding: '14px 16px', flex: 1, minWidth: 120 }}>
      <div style={{ fontSize: 12, color, opacity: 0.8 }}>{label}</div>
      <div style={{ fontSize: 28, fontWeight: 700, color, marginTop: 4 }}>{value}</div>
      {sub && <div style={{ fontSize: 11, color, opacity: 0.6, marginTop: 2 }}>{sub}</div>}
    </div>
  );
}

function CategoryNav({ categories, active, onChange }: {
  categories: Array<{ key: string; label: string; count: number }>;
  active: string;
  onChange: (k: string) => void;
}) {
  return (
    <div style={{ display: 'flex', gap: 6, marginBottom: 16, flexWrap: 'wrap' }}>
      {categories.map((cat) => (
        <button
          key={cat.key}
          onClick={() => onChange(cat.key)}
          style={{
            padding: '6px 14px',
            borderRadius: 20,
            fontSize: 13,
            cursor: 'pointer',
            background: active === cat.key ? '#2563eb' : '#f3f4f6',
            color: active === cat.key ? '#fff' : '#374151',
            border: active === cat.key ? 'none' : '1px solid #e5e7eb',
            fontWeight: active === cat.key ? 600 : 400,
          }}
        >
          {cat.label}
          <span style={{
            marginLeft: 6,
            padding: '1px 6px',
            borderRadius: 10,
            fontSize: 11,
            background: active === cat.key ? 'rgba(255,255,255,0.2)' : '#e5e7eb',
          }}>
            {cat.count}
          </span>
        </button>
      ))}
    </div>
  );
}

function EntryCard({ entry }: { entry: DevToolEntry }) {
  return (
    <a
      href={entry.href}
      onClick={(e) => {
        // 在 admin-web 中跳转子页面
        e.preventDefault();
        window.location.href = entry.href;
      }}
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: 14,
        padding: 16,
        background: '#f9fafb',
        borderRadius: 8,
        textDecoration: 'none',
        color: 'inherit',
        border: '1px solid transparent',
        transition: 'border-color 0.15s, box-shadow 0.15s',
        cursor: entry.enabled ? 'pointer' : 'not-allowed',
        opacity: entry.enabled ? 1 : 0.5,
      }}
    >
      <div style={{ fontSize: 32, lineHeight: 1 }}>{entry.icon}</div>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 4 }}>
          {entry.label}
          {!entry.enabled && (
            <span style={{
              marginLeft: 8, fontSize: 10, padding: '1px 6px',
              background: '#fef3c7', borderRadius: 3, color: '#92400e',
            }}>
              开发中
            </span>
          )}
        </div>
        <div style={{ fontSize: 13, color: '#6b7280', marginBottom: 6 }}>{entry.description}</div>
        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
          {entry.tags.map((t) => (
            <span
              key={t}
              style={{
                padding: '2px 8px',
                background: '#e5e7eb',
                borderRadius: 4,
                fontSize: 11,
                color: '#374151',
              }}
            >
              {t}
            </span>
          ))}
        </div>
      </div>
      <div style={{ color: '#9ca3af', fontSize: 20 }}>→</div>
    </a>
  );
}

function ActivityRow({ item }: { item: ActivityItem }) {
  const statusColor =
    item.status === 'success' ? '#22c55e' :
    item.status === 'warning' ? '#eab308' : '#3b82f6';

  const typeIcon =
    item.type === 'deploy' ? '🚀' :
    item.type === 'brand' ? '🏢' : '🔌';

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: 12,
      padding: '10px 0',
      borderBottom: '1px solid #f3f4f6',
    }}>
      <span style={{ fontSize: 16 }}>{typeIcon}</span>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 13, fontWeight: 500 }}>
          {item.action}
          <span style={{ fontWeight: 400, color: '#6b7280' }}> · {item.target}</span>
        </div>
        <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 2 }}>{item.timestamp}</div>
      </div>
      <span style={{
        width: 8, height: 8, borderRadius: '50%',
        background: statusColor, display: 'inline-block',
      }} />
    </div>
  );
}

// ==================== 主页面 ====================

export default function DevToolsPage() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');

  if (loading) return <div>加载中...</div>
  if (error) return <div>数据获取失败: {error}</div>
  if (!DEV_TOOLS || DEV_TOOLS.length === 0) return <div>暂无数据</div>

  const filtered = useMemo(
    () => filterEntries(DEV_TOOLS, searchQuery, categoryFilter),
    [searchQuery, categoryFilter],
  );

  const stats = useMemo(() => computeCategoryStats(DEV_TOOLS), []);

  const categoryNav = useMemo(
    () => [
      { key: 'all', label: '全部', count: stats.total },
      { key: 'brand', label: '品牌运营', count: stats.brand },
      { key: 'deploy', label: '部署管理', count: stats.deploy },
      { key: 'platform', label: '开放平台', count: stats.platform },
    ],
    [stats],
  );

  return (
    <div style={{ padding: 24, background: '#f9fafb', minHeight: '100vh' }}>
      {/* ===== 页面头部 ===== */}
      <header style={{ marginBottom: 20 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700 }}>🛠️ 开发工具</h1>
        <p style={{ fontSize: 14, color: '#6b7280', marginTop: 4 }}>
          品牌运营 · 部署管理 · 开放平台
        </p>
      </header>

      {/* ===== 统计面板 ===== */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
        <StatCard label="工具总数" value={stats.total} bg="#eff6ff" color="#1d4ed8" />
        <StatCard label="品牌运营" value={stats.brand} sub="品牌、看板、活动" bg="#f0fdf4" color="#16a34a" />
        <StatCard label="部署管理" value={stats.deploy} sub="发布、回滚、环境" bg="#fefce8" color="#ca8a04" />
        <StatCard label="开放平台" value={stats.platform} sub="API、文档、开发者" bg="#fdf2f8" color="#db2777" />
      </div>

      {/* ===== 搜索和过滤 ===== */}
      <div style={CARD}>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 12 }}>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="搜索工具名称、描述、标签..."
            style={{ ...INPUT, maxWidth: 360 }}
          />
          <span style={{ fontSize: 13, color: '#9ca3af' }}>
            {filtered.length} / {DEV_TOOLS.length} 个工具
          </span>
        </div>

        <CategoryNav categories={categoryNav} active={categoryFilter} onChange={setCategoryFilter} />

        {/* 空状态 */}
        {filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 20px', color: '#9ca3af' }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>🔍</div>
            <div style={{ fontSize: 15, marginBottom: 8 }}>没有匹配的开发工具</div>
            <button
              onClick={() => { setSearchQuery(''); setCategoryFilter('all'); }}
              style={{
                padding: '8px 20px', border: '1px solid #d1d5db', borderRadius: 6,
                background: '#fff', cursor: 'pointer', fontSize: 13, color: '#374151',
              }}
            >
              清除过滤
            </button>
          </div>
        ) : (
          <div style={{ display: 'grid', gap: 10 }}>
            {filtered.map((entry) => (
              <EntryCard key={entry.id} entry={entry} />
            ))}
          </div>
        )}
      </div>

      {/* ===== 最近动态 ===== */}
      <div style={CARD}>
        <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 12 }}>
          📋 最近动态
        </h3>
        <div style={{ fontSize: 12, color: '#9ca3af', marginBottom: 10 }}>最近 5 条系统动态，包含部署、品牌、平台变更</div>
        {RECENT_ACTIVITIES.map((item) => (
          <ActivityRow key={item.id} item={item} />
        ))}
      </div>

      {/* ===== 快速入口 ===== */}
      <div style={CARD}>
        <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 12 }}>
          ⚡ 快速入口
        </h3>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          {DEV_TOOLS.filter((e) => e.enabled).map((entry) => (
            <a
              key={entry.id}
              href={entry.href}
              onClick={(e) => {
                e.preventDefault();
                window.location.href = entry.href;
              }}
              style={{
                padding: '10px 18px',
                background: '#f3f4f6',
                borderRadius: 8,
                textDecoration: 'none',
                color: '#374151',
                fontSize: 13,
                fontWeight: 500,
                border: '1px solid #e5e7eb',
                cursor: 'pointer',
              }}
            >
              {entry.icon} {entry.label}
            </a>
          ))}
        </div>
      </div>

      {/* ===== 环境概览 ===== */}
      <div style={CARD}>
        <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 12 }}>
          🌐 环境概览
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
          <div style={{ padding: 14, background: '#f0fdf4', borderRadius: 8, border: '1px solid #bbf7d0' }}>
            <div style={{ fontSize: 12, color: '#16a34a' }}>生产环境</div>
            <div style={{ fontSize: 14, fontWeight: 600, color: '#166534', marginTop: 4 }}>🟢 正常运行</div>
            <div style={{ fontSize: 11, color: '#16a34a', marginTop: 4 }}>最新: v2.3.1 · 2026-07-16</div>
          </div>
          <div style={{ padding: 14, background: '#fefce8', borderRadius: 8, border: '1px solid #fde68a' }}>
            <div style={{ fontSize: 12, color: '#ca8a04' }}>预发环境</div>
            <div style={{ fontSize: 14, fontWeight: 600, color: '#854d0e', marginTop: 4 }}>🟡 待验收</div>
            <div style={{ fontSize: 11, color: '#ca8a04', marginTop: 4 }}>最新: v2.4.0 · 2026-07-15</div>
          </div>
          <div style={{ padding: 14, background: '#eff6ff', borderRadius: 8, border: '1px solid #bfdbfe' }}>
            <div style={{ fontSize: 12, color: '#2563eb' }}>测试环境</div>
            <div style={{ fontSize: 14, fontWeight: 600, color: '#1e40af', marginTop: 4 }}>🔵 可部署</div>
            <div style={{ fontSize: 11, color: '#2563eb', marginTop: 4 }}>最新: v2.3.0 · 2026-07-13</div>
          </div>
          <div style={{ padding: 14, background: '#fef2f2', borderRadius: 8, border: '1px solid #fecaca' }}>
            <div style={{ fontSize: 12, color: '#dc2626' }}>回滚记录</div>
            <div style={{ fontSize: 14, fontWeight: 600, color: '#991b1b', marginTop: 4 }}>🔴 1 次回滚</div>
            <div style={{ fontSize: 11, color: '#dc2626', marginTop: 4 }}>原因: 配置错误</div>
          </div>
        </div>
      </div>

      {/* ===== 系统状态 ===== */}
      <div style={{ ...CARD, marginBottom: 0 }}>
        <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 12 }}>
          📡 系统状态
        </h3>
        <div style={{ fontSize: 13, color: '#6b7280', marginBottom: 8 }}>
          以下为当前开发环境关键服务状态
        </div>
        <div style={{ display: 'grid', gap: 6 }}>
          {[
            { name: 'API Gateway', status: 'healthy', latency: '12ms' },
            { name: 'Brand Service', status: 'healthy', latency: '8ms' },
            { name: 'Deploy Pipeline', status: 'healthy', latency: '3s' },
            { name: 'Platform API', status: 'degraded', latency: '450ms' },
            { name: 'Database', status: 'healthy', latency: '5ms' },
            { name: 'Cache (Redis)', status: 'healthy', latency: '2ms' },
          ].map((svc) => (
            <div
              key={svc.name}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                padding: '8px 12px',
                borderRadius: 6,
                background: svc.status === 'healthy' ? '#f9fafb' : '#fef2f2',
                fontSize: 13,
              }}
            >
              <span>
                <span style={{
                  display: 'inline-block',
                  width: 8, height: 8,
                  borderRadius: '50%',
                  background: svc.status === 'healthy' ? '#22c55e' : '#ef4444',
                  marginRight: 8,
                }} />
                {svc.name}
              </span>
              <span style={{ color: '#6b7280' }}>{svc.latency}</span>
            </div>
          ))}
        </div>
      </div>
      <div style={{ marginTop: 16, fontSize: 12, color: '#9ca3af', textAlign: 'center' }}>
        开发工具面板 · 品牌运营 / 部署管理 / 开放平台
      </div>
    </div>
  );
}
