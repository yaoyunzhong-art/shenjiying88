/**
 * pad/page.tsx — Pad 工作台首页
 * 角色视角: 🖥️ 管理员
 * 功能: Pad 端角色工作台概览，展示所有 Pad 角色入口
 *
 * 页面结构:
 * - 概览统计卡片 (角色数 · 功能模块 · 覆盖市场)
 * - 搜索过滤 (按角色名称/标签搜索)
 * - 市场区域筛选 Tabs
 * - 角色工作台入口网格 (卡片展示)
 * - 统计详情面板 (按角色分类统计)
 */
'use client';

import { useMemo, useState, useCallback } from 'react';
import Link from 'next/link';
import {
  PageShell,
  StatCard,
  LoadingSkeleton,
  SearchFilterInput,
  Tabs,
  StatusBadge,
  Button,
} from '@m5/ui';
import { fallbackRoleWorkbenches } from '../workbench-data';
import type { RoleWorkbenchContract } from '@m5/types';

// ==================== 工具函数 ====================

export function normalizeWorkbenchRoleKey(role: string): string {
  return role.trim().toLowerCase().replace(/-/g, '_');
}

export function filterPadWorkbenches(workbenches: RoleWorkbenchContract[]): RoleWorkbenchContract[] {
  return workbenches.filter((wb) => wb.channel === 'PAD');
}

export function getUniqueMarketCodes(workbenches: RoleWorkbenchContract[]): string[] {
  return Array.from(new Set(workbenches.flatMap((wb) => wb.marketCodes ?? [])));
}

// ==================== 角色图标映射 ====================

const ROLE_EMOJI: Record<string, string> = {
  GUIDE: '🎙️',
  CASHIER: '🧾',
  FRONT_DESK: '🏪',
  STORE_MANAGER: '👔',
  INVENTORY_KEEPER: '📦',
  TRAINING_MANAGER: '📋',
  COACH: '🏋️',
  CUSTOMER_SERVICE: '📞',
  ASSISTANT_MANAGER: '👤',
  ENTERTAINMENT_GUIDE: '🎮',
  DELIVERY_PERSON: '🚚',
  SALES_CLERK: '🛍️',
  CONCIERGE: '🔔',
};

const ROLE_LABEL_MAP: Record<string, string> = {
  GUIDE: '导购接待',
  CASHIER: '收银工作台',
  FRONT_DESK: '前台接待',
  STORE_MANAGER: '店长工作台',
  INVENTORY_KEEPER: '库存管理',
  TRAINING_MANAGER: '培训管理',
  COACH: '教练工作台',
  CUSTOMER_SERVICE: '客服工作台',
  ASSISTANT_MANAGER: '经理助理',
  ENTERTAINMENT_GUIDE: '娱乐导览',
  DELIVERY_PERSON: '配送管理',
  SALES_CLERK: '销售工具',
  CONCIERGE: '礼宾服务',
};

const ROLE_CATEGORIES: Record<string, string> = {
  GUIDE: 'frontline',
  CASHIER: 'frontline',
  FRONT_DESK: 'frontline',
  STORE_MANAGER: 'management',
  INVENTORY_KEEPER: 'operations',
  TRAINING_MANAGER: 'operations',
  COACH: 'service',
  CUSTOMER_SERVICE: 'service',
  ASSISTANT_MANAGER: 'management',
  ENTERTAINMENT_GUIDE: 'service',
  DELIVERY_PERSON: 'operations',
  SALES_CLERK: 'frontline',
  CONCIERGE: 'service',
};

const CATEGORY_LABELS: Record<string, string> = {
  all: '全部',
  frontline: '一线岗位',
  management: '管理岗位',
  operations: '运营岗位',
  service: '服务岗位',
};

function getRoleLabel(role: string): string {
  return ROLE_LABEL_MAP[role] ?? role;
}

function getRoleEmoji(role: string): string {
  return ROLE_EMOJI[role] ?? '📱';
}

function getCategoryCounts(workbenches: RoleWorkbenchContract[]): Record<string, number> {
  const counts: Record<string, number> = { all: workbenches.length };
  for (const wb of workbenches) {
    const cat = ROLE_CATEGORIES[wb.role] ?? 'other';
    counts[cat] = (counts[cat] ?? 0) + 1;
  }
  return counts;
}

// ==================== 主组件 ====================

export default function PadIndexPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [selectedWorkbench, setSelectedWorkbench] = useState<RoleWorkbenchContract | null>(null);

  const allPadWorkbenches = useMemo(() => filterPadWorkbenches(fallbackRoleWorkbenches), []);
  const marketCodes = useMemo(() => getUniqueMarketCodes(allPadWorkbenches), [allPadWorkbenches]);

  // 搜索 + 分类筛选
  const filteredWorkbenches = useMemo(() => {
    let result = allPadWorkbenches;

    if (categoryFilter !== 'all') {
      result = result.filter((wb) => (ROLE_CATEGORIES[wb.role] ?? 'other') === categoryFilter);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (wb) =>
          getRoleLabel(wb.role).toLowerCase().includes(q) ||
          wb.navItems.some((item) => item.label.toLowerCase().includes(q)) ||
          wb.marketCodes.some((mc) => mc.toLowerCase().includes(q)),
      );
    }

    return result;
  }, [allPadWorkbenches, categoryFilter, searchQuery]);

  const totalNavItems = useMemo(
    () => allPadWorkbenches.reduce((sum, wb) => sum + wb.navItems.length, 0),
    [allPadWorkbenches],
  );

  const categoryCounts = useMemo(() => getCategoryCounts(allPadWorkbenches), [allPadWorkbenches]);

  const handleRefresh = useCallback(() => {
    // 模拟刷新
  }, []);

  const handleExport = useCallback(() => {
    const lines = ['角色,标签,功能数,市场'];
    for (const wb of allPadWorkbenches) {
      lines.push(`${getRoleLabel(wb.role)},${wb.navItems.map((n) => n.label).join(';')},${wb.navItems.length},${wb.marketCodes.join(';')}`);
    }
    const csv = lines.join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `pad-workbenches-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }, [allPadWorkbenches]);

  // 按分类统计
  const categoryStats = useMemo(() => {
    const stats: Record<string, { count: number; navItems: number }> = {};
    for (const wb of allPadWorkbenches) {
      const cat = ROLE_CATEGORIES[wb.role] ?? 'other';
      if (!stats[cat]) stats[cat] = { count: 0, navItems: 0 };
      stats[cat].count += 1;
      stats[cat].navItems += wb.navItems.length;
    }
    return stats;
  }, [allPadWorkbenches]);

  return (
    <main style={{ maxWidth: 1024, margin: '0 auto', padding: 20 }}>
      <PageShell
        title="Pad 工作台"
        subtitle="偏现场作业的 Pad 端多功能工作台，适配导购接待、收银、排队叫号、门店执行等多角色场景。"
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <div style={{ fontSize: 12, color: '#64748b' }}>
            {allPadWorkbenches.length} 个角色 · {totalNavItems} 个模块 · {marketCodes.length} 个市场
          </div>
        </div>

        {/* 概览统计 */}
        <div style={{ display: 'grid', gap: 14, gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', marginBottom: 20 }}>
          <StatCard label="Pad 角色数" value={String(allPadWorkbenches.length)} helper="适配不同岗位" />
          <StatCard label="功能模块数" value={String(totalNavItems)} helper="可执行功能模块" />
          <StatCard label="覆盖市场" value={String(marketCodes.length)} helper={marketCodes.join(' / ') || '—'} />
        </div>

        <div style={{ marginBottom: 12, fontSize: 12, color: '#64748b' }}>角色按职能分类统计，点击卡片可展开详情</div>

        {/* 角色分类指标 */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, marginBottom: 16 }}>
          <div style={{ padding: '12px 14px', borderRadius: 8, background: 'rgba(34, 197, 94, 0.08)', border: '1px solid rgba(34, 197, 94, 0.2)' }}>
            <div style={{ fontSize: 11, color: '#16a34a' }}>导购角色</div>
            <div style={{ fontSize: 18, fontWeight: 700, color: '#166534', marginTop: 2 }}>{categoryStats.sales?.count ?? 0}</div>
            <div style={{ fontSize: 11, color: '#16a34a', marginTop: 2 }}>{categoryStats.sales?.navItems ?? 0} 模块</div>
          </div>
          <div style={{ padding: '12px 14px', borderRadius: 8, background: 'rgba(59, 130, 246, 0.08)', border: '1px solid rgba(59, 130, 246, 0.2)' }}>
            <div style={{ fontSize: 11, color: '#2563eb' }}>运营角色</div>
            <div style={{ fontSize: 18, fontWeight: 700, color: '#1e40af', marginTop: 2 }}>{categoryStats.operations?.count ?? 0}</div>
            <div style={{ fontSize: 11, color: '#2563eb', marginTop: 2 }}>{categoryStats.operations?.navItems ?? 0} 模块</div>
          </div>
          <div style={{ padding: '12px 14px', borderRadius: 8, background: 'rgba(234, 179, 8, 0.08)', border: '1px solid rgba(234, 179, 8, 0.2)' }}>
            <div style={{ fontSize: 11, color: '#ca8a04' }}>收银角色</div>
            <div style={{ fontSize: 18, fontWeight: 700, color: '#854d0e', marginTop: 2 }}>{categoryStats.cashier?.count ?? 0}</div>
            <div style={{ fontSize: 11, color: '#ca8a04', marginTop: 2 }}>{categoryStats.cashier?.navItems ?? 0} 模块</div>
          </div>
          <div style={{ padding: '12px 14px', borderRadius: 8, background: 'rgba(168, 85, 247, 0.08)', border: '1px solid rgba(168, 85, 247, 0.2)' }}>
            <div style={{ fontSize: 11, color: '#9333ea' }}>其他角色</div>
            <div style={{ fontSize: 18, fontWeight: 700, color: '#7e22ce', marginTop: 2 }}>{categoryStats.other?.count ?? 0}</div>
            <div style={{ fontSize: 11, color: '#9333ea', marginTop: 2 }}>{categoryStats.other?.navItems ?? 0} 模块</div>
          </div>
        </div>

        {/* 按分类统计详情 */}
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 16 }}>
          {Object.entries(categoryStats).map(([cat, stat]) => (
            <div
              key={cat}
              style={{
                padding: '8px 14px',
                borderRadius: 8,
                background: 'rgba(59, 130, 246, 0.06)',
                border: '1px solid rgba(59, 130, 246, 0.12)',
                fontSize: 13,
              }}
            >
              <span style={{ color: '#94a3b8' }}>{CATEGORY_LABELS[cat] ?? cat}:</span>{' '}
              <strong style={{ color: '#93c5fd' }}>{stat.count}</strong>{' '}
              <span style={{ color: '#64748b' }}>({stat.navItems} 模块)</span>
            </div>
          ))}
        </div>

        {/* 工具栏 */}
        <div style={{ display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
          <SearchFilterInput
            placeholder="搜索角色名称、功能标签..."
            value={searchQuery}
            onChange={setSearchQuery}
            width="auto"
          />
          <Tabs
            items={Object.entries(CATEGORY_LABELS).map(([key, label]) => ({
              key,
              label,
              count: categoryCounts[key] ?? 0,
            }))}
            activeKey={categoryFilter}
            onChange={setCategoryFilter}
            variant="pills"
            size="sm"
          />
          <div style={{ flex: 1 }} />
          <Button variant="outline" onClick={handleExport}>📥 导出角色清单</Button>
          <Button variant="outline" onClick={handleRefresh}>🔄 刷新</Button>
        </div>

        {/* 角色工作台入口网格 */}
        <div style={{ marginTop: 8 }}>
          <div style={{ fontSize: 13, color: '#94a3b8', marginBottom: 14 }}>
            {filteredWorkbenches.length === 0
              ? '没有匹配的角色工作台'
              : `共 ${filteredWorkbenches.length} 个角色工作台`}
          </div>

          <div
            style={{
              display: 'grid',
              gap: 14,
              gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
            }}
          >
            {filteredWorkbenches.length === 0 ? (
              <div style={{ gridColumn: '1 / -1', padding: 40, textAlign: 'center', color: '#64748b' }}>
                {searchQuery || categoryFilter !== 'all' ? '没有匹配的角色，请调整筛选条件' : '暂无 Pad 角色数据'}
              </div>
            ) : (
              filteredWorkbenches.map((wb) => {
                const category = ROLE_CATEGORIES[wb.role] ?? 'other';
                return (
                  <Link
                    key={wb.role}
                    href={`/pad/${normalizeWorkbenchRoleKey(wb.role)}`}
                    style={{ textDecoration: 'none' }}
                  >
                    <div
                      style={{
                        background: '#1e293b',
                        borderRadius: 12,
                        padding: 18,
                        border: '1px solid #334155',
                        transition: 'border-color 0.2s, box-shadow 0.2s',
                        cursor: 'pointer',
                        height: '100%',
                        display: 'flex',
                        flexDirection: 'column',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.borderColor = '#3b82f6';
                        e.currentTarget.style.boxShadow = '0 0 0 1px #3b82f6';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.borderColor = '#334155';
                        e.currentTarget.style.boxShadow = 'none';
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 10 }}>
                        <span style={{ fontSize: 28, lineHeight: 1 }}>{getRoleEmoji(wb.role)}</span>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: 700, color: '#f1f5f9', fontSize: 15 }}>
                            {getRoleLabel(wb.role)}
                          </div>
                          <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>
                            {wb.marketCodes.join(' · ') || '全市场'}
                          </div>
                        </div>
                        <StatusBadge
                          label={CATEGORY_LABELS[category] ?? category}
                          variant="neutral"
                          size="sm"
                        />
                      </div>
                      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 'auto' }}>
                        {wb.navItems.slice(0, 5).map((item) => (
                          <span
                            key={item.key}
                            style={{
                              fontSize: 11,
                              padding: '2px 8px',
                              borderRadius: 4,
                              background: '#0f172a',
                              color: '#94a3b8',
                              border: '1px solid #334155',
                            }}
                          >
                            {item.label}
                          </span>
                        ))}
                        {wb.navItems.length > 5 && (
                          <span style={{ fontSize: 11, color: '#64748b', lineHeight: '22px' }}>
                            +{wb.navItems.length - 5}
                          </span>
                        )}
                      </div>
                    </div>
                  </Link>
                );
              })
            )}
          </div>
        </div>

        {/* 详情面板 (选择时展开) */}
        {selectedWorkbench && (
          <div
            style={{
              marginTop: 20,
              padding: 18,
              borderRadius: 12,
              background: 'rgba(30, 41, 59, 0.6)',
              border: '1px solid #334155',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontSize: 24 }}>{getRoleEmoji(selectedWorkbench.role)}</span>
                <div>
                  <div style={{ fontWeight: 700, color: '#f1f5f9', fontSize: 16 }}>
                    {getRoleLabel(selectedWorkbench.role)}
                  </div>
                  <div style={{ fontSize: 12, color: '#64748b' }}>
                    role key: {selectedWorkbench.role}
                  </div>
                </div>
              </div>
              <Button variant="outline" size="sm" onClick={() => setSelectedWorkbench(null)}>
                关闭
              </Button>
            </div>
            <div style={{ fontSize: 13, color: '#94a3b8', marginBottom: 12 }}>
              市场: {selectedWorkbench.marketCodes.join(', ') || '全市场'} · 功能模块: {selectedWorkbench.navItems.length} 个
            </div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {selectedWorkbench.navItems.map((item) => (
                <span
                  key={item.key}
                  style={{
                    fontSize: 12,
                    padding: '4px 10px',
                    borderRadius: 6,
                    background: 'rgba(59, 130, 246, 0.1)',
                    color: '#93c5fd',
                    border: '1px solid rgba(59, 130, 246, 0.2)',
                  }}
                >
                  {item.label}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* 角色分布面板 */}
        <div style={{ display: 'flex', gap: 12, marginTop: 16 }}>
          {Object.entries(categoryStats).map(([cat, stat]) => {
            const catLabel = CATEGORY_LABELS[cat] ?? cat;
            const pct = totalNavItems > 0 ? Math.round((stat.navItems / totalNavItems) * 100) : 0;
            return (
              <div
                key={cat}
                style={{
                  flex: 1,
                  padding: '12px 14px',
                  borderRadius: 8,
                  background: 'rgba(59, 130, 246, 0.06)',
                  border: '1px solid rgba(59, 130, 246, 0.12)',
                }}
              >
                <div style={{ fontSize: 12, color: '#94a3b8' }}>{catLabel}</div>
                <div style={{ fontSize: 20, fontWeight: 700, color: '#93c5fd', marginTop: 2 }}>
                  {stat.count}
                </div>
                <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>
                  {stat.navItems} 模块 ({pct}%)
                </div>
              </div>
            );
          })}
        </div>

        <div style={{ fontSize: 11, color: '#475569', marginTop: 8, textAlign: 'center' }}>
          数据更新时间: {new Date().toLocaleDateString('zh-CN')} · 版本 v2 · 共 {totalNavItems} 个可用功能模块
        </div>

        {/* 提示 */}
        <div style={{ marginTop: 16, padding: '10px 14px', borderRadius: 8, background: 'rgba(15, 23, 42, 0.38)', border: '1px solid rgba(148, 163, 184, 0.12)', fontSize: 12, color: '#94a3b8' }}>
          💡 选择一个角色进入对应工作台。角色权限由管理员统一配置，不同市场的角色入口可能不同。
        </div>

        {/* 功能模块分布 */}
        <div style={{ marginTop: 16 }}>
          <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 10, color: '#e2e8f0' }}>📋 功能模块分布</h3>
          <div style={{ fontSize: 12, color: '#64748b', marginBottom: 8 }}>各分类模块占总功能模块比例</div>
          <div style={{ display: 'grid', gap: 8 }}>
            {Object.entries(CATEGORY_LABELS).map(([key, label]) => {
              const sc = categoryStats[key] ?? { count: 0, navItems: 0 };
              if (sc.count === 0) return null;
              const pct = totalNavItems > 0 ? Math.round((sc.navItems / totalNavItems) * 100) : 0;
              return (
                <div
                  key={key}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    padding: '8px 12px',
                    borderRadius: 6,
                    background: 'rgba(15, 23, 42, 0.3)',
                  }}
                >
                  <span style={{ width: 60, fontSize: 13, color: '#94a3b8' }}>{label}</span>
                  <div style={{ flex: 1, height: 8, background: 'rgba(148, 163, 184, 0.15)', borderRadius: 4 }}>
                    <div
                      style={{
                        height: '100%',
                        width: `${pct}%`,
                        background: '#3b82f6',
                        borderRadius: 4,
                        transition: 'width 0.3s',
                      }}
                    />
                  </div>
                  <span style={{ fontSize: 12, color: '#94a3b8', width: 80, textAlign: 'right' }}>
                    {sc.navItems} ({pct}%)
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </PageShell>
    </main>
  );
}
