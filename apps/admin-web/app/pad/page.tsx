/**
 * pad/page.tsx — Pad 工作台首页
 * 角色视角: 🖥️ 管理员
 * 功能: Pad 端角色工作台概览，展示所有 Pad 角色入口
 */
'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import {
  PageShell,
  StatCard,
  LoadingSkeleton,
} from '@m5/ui';
import { fallbackRoleWorkbenches } from '../workbench-data';
import type { RoleWorkbenchContract } from '@m5/types';

// ==================== 工具函数 ====================

export function normalizeWorkbenchRoleKey(role: string): string {
  return role.trim().toLowerCase().replace(/-/g, '_');
}

export function filterPadWorkbenches(
  workbenches: RoleWorkbenchContract[],
): RoleWorkbenchContract[] {
  return workbenches.filter((wb) => wb.channel === 'PAD');
}

export function getUniqueMarketCodes(
  workbenches: RoleWorkbenchContract[],
): string[] {
  return Array.from(
    new Set(workbenches.flatMap((wb) => wb.marketCodes ?? [])),
  );
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

function getRoleLabel(role: string): string {
  return ROLE_LABEL_MAP[role] ?? role;
}

function getRoleEmoji(role: string): string {
  return ROLE_EMOJI[role] ?? '📱';
}

// ==================== 主组件 ====================

export default function PadIndexPage() {
  const padWorkbenches = useMemo(() => filterPadWorkbenches(fallbackRoleWorkbenches), []);
  const marketCodes = useMemo(() => getUniqueMarketCodes(padWorkbenches), [padWorkbenches]);
  const totalNavItems = useMemo(
    () => padWorkbenches.reduce((sum, wb) => sum + wb.navItems.length, 0),
    [padWorkbenches],
  );

  return (
    <main style={{ maxWidth: 960, margin: '0 auto', padding: 20 }}>
      <PageShell
        title="Pad 工作台"
        subtitle="偏现场作业的 Pad 端多功能工作台，适配导购接待、收银、排队叫号、门店执行等多角色场景。"
      >
        {/* 概览统计 */}
        <div style={{ display: 'grid', gap: 14, gridTemplateColumns: 'repeat(3, minmax(0, 1fr))' }}>
          <StatCard label="Pad 角色数" value={String(padWorkbenches.length)} helper="适配不同岗位" />
          <StatCard label="功能模块数" value={String(totalNavItems)} helper="可执行功能模块" />
          <StatCard label="覆盖市场" value={String(marketCodes.length)} helper={marketCodes.join(' / ')} />
        </div>

        {/* 角色工作台入口网格 */}
        <div style={{ marginTop: 28 }}>
          <div style={{ fontSize: 18, fontWeight: 700, color: '#f8fafc', marginBottom: 4 }}>
            角色工作台
          </div>
          <div style={{ fontSize: 13, color: '#94a3b8', marginBottom: 16 }}>
            选择一个角色进入对应的 Pad 工作台
          </div>

          <div
            style={{
              display: 'grid',
              gap: 14,
              gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
            }}
          >
            {padWorkbenches.length === 0 ? (
              <LoadingSkeleton variant="card" rows={4} label="加载 Pad 工作台列表..." />
            ) : (
              padWorkbenches.map((wb) => (
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
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                      <span style={{ fontSize: 28, lineHeight: 1 }}>{getRoleEmoji(wb.role)}</span>
                      <div>
                        <div style={{ fontWeight: 700, color: '#f1f5f9', fontSize: 15 }}>
                          {getRoleLabel(wb.role)}
                        </div>
                        <div style={{ fontSize: 12, color: '#64748b' }}>
                          {wb.marketCodes.join(' · ')}
                        </div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
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
              ))
            )}
          </div>
        </div>
      </PageShell>
    </main>
  );
}
