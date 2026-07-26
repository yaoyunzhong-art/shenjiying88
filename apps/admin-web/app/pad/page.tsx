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

import type { RoleWorkbenchContract } from '@m5/types';
import { getAdminWorkbenchConsumerSnapshot } from '../bootstrap';
import PadIndexClient from './pad-index-client';

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

export default async function PadIndexPage() {
  const snapshot = await getAdminWorkbenchConsumerSnapshot();
  return <PadIndexClient snapshot={snapshot} />;
}
