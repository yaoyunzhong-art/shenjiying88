/**
 * store-locator-style.ts
 *
 * store-locator 页面 (列表 + 详情) 共享样式 + 过滤纯函数.
 *
 * 由来: 之前 store-locator/page.tsx 与 store-locator/[id]/page.tsx 各自内联了:
 *   - StatusLabel type + STATUS_INFO 常量 (10 行字节相同)
 *   - 门店卡片外壳 (borderRadius:16 + rgba(30,41,59,0.6) + 1px rgba 边框) 重复 1+3 次
 *   - 城市筛选按钮 2 段 (~30 行, 差异仅 active/inactive 状态)
 *   - 关键词过滤逻辑 (useMemo 内联, 不可测试)
 *   - 状态徽章 (列表 4/10 圆角 12 + 详情 6/14 圆角 16) 重复 2 段
 *   - 特色标签 chip (列表 4/8 圆角 6 + 详情 8/14 圆角 20) 重复 2 段
 *   - 行动按钮 (call 绿 / navigate 蓝 / navigate-primary 渐变) 重复 3 段, 跨两页
 *   - 底部固定栏 + 底部导航 tab 项 重复
 * 集中后: 单一来源, 详情/列表两页零漂移; 纯函数 + 样式辅助都在
 *   node:test 下可测可回归.
 */

import type { CSSProperties } from 'react';
import type { StoreLocator } from './store-locator-service';

// ─── 类型 ──────────────────────────────────────────────

/** 门店状态的视觉信息 (text 标签 + color 文字色 + bg 背景色) */
export interface StatusLabel {
  text: string;
  color: string;
  bg: string;
}

/** 门店状态联合类型 (与 StoreLocator.status 保持一致) */
export type StoreStatus = StoreLocator['status'];

// ─── STATUS_INFO ──────────────────────────────────────

/**
 * 状态 → 视觉信息映射.
 * 之前在 store-locator/page.tsx:15-19 与 [id]/page.tsx:15-19 字节相同地各定义一份;
 * 任何颜色 / 文案调整都要同步 2 处, 容易漂移.
 */
export const STATUS_INFO: Readonly<Record<StoreStatus, StatusLabel>> = {
  open:   { text: '营业中', color: '#4ade80', bg: 'rgba(74, 222, 128, 0.15)' },
  closed: { text: '已休息', color: '#94a3b8', bg: 'rgba(148, 163, 184, 0.15)' },
  busy:   { text: '繁忙',   color: '#fbbf24', bg: 'rgba(251, 191, 36, 0.15)' },
};

// ─── 城市筛选按钮 ──────────────────────────────────────

/**
 * 城市筛选按钮的 active/inactive 两态样式.
 * 之前 store-locator/page.tsx 中 2 段按钮 inline 重复 (30 行), 差异仅 isActive;
 * 抽出后两处都传 isActive 即可, 颜色/边框/背景调整 1 处生效.
 */
export function getCityButtonStyle(isActive: boolean): CSSProperties {
  return {
    padding: '8px 16px',
    borderRadius: 20,
    background: isActive
      ? 'rgba(102, 126, 234, 0.3)'
      : 'rgba(30, 41, 59, 0.8)',
    border: `1px solid ${
      isActive
        ? 'rgba(102, 126, 234, 0.5)'
        : 'rgba(148, 163, 184, 0.2)'
    }`,
    color: isActive ? '#a5b4fc' : '#94a3b8',
    fontSize: 13,
    cursor: 'pointer',
    whiteSpace: 'nowrap',
  };
}

// ─── 门店卡片外壳 ──────────────────────────────────────

/**
 * 门店卡片通用外壳 (列表页 article 包装 / 详情页基本信息+特色服务+门店环境 3 张卡).
 * 之前 4 处 inline 重复同一段 4 行样式, 任何 glass 风格调整 1 处变 4 处;
 * 抽出后调整 1 处生效.
 */
export function getStoreCardStyle(): CSSProperties {
  return {
    borderRadius: 16,
    background: 'rgba(30, 41, 59, 0.6)',
    border: '1px solid rgba(148, 163, 184, 0.1)',
  };
}

// ─── 关键词过滤纯函数 ──────────────────────────────────

/**
 * 按关键词过滤门店: 命中 storeName / address / district 任一字段 (大小写不敏感).
 * 之前内联在 store-locator/page.tsx:56-65 的 useMemo 中, 不可独立测试;
 * 抽出为纯函数后可在 node:test 下钉死大小写、空白、空关键词等边界.
 */
export function filterStoreByKeyword(
  stores: ReadonlyArray<StoreLocator>,
  keyword: string
): StoreLocator[] {
  const trimmed = keyword.trim();
  if (!trimmed) return [...stores];
  const lower = trimmed.toLowerCase();
  return stores.filter(
    (s) =>
      s.storeName.toLowerCase().includes(lower) ||
      s.address.toLowerCase().includes(lower) ||
      s.district.toLowerCase().includes(lower)
  );
}

// ─── 状态徽章 ──────────────────────────────────────────

/** 状态徽章尺寸: sm 列表卡, md 详情头图 */
export type StatusBadgeSize = 'sm' | 'md';

/**
 * 状态徽章完整样式: position 固定在右上, color/bg 从 STATUS_INFO 取.
 * 之前 list 页 (sm: top:12, padding 4/10, radius 12, font 12) + detail 页
 * (md: top:16, padding 6/14, radius 16, font 13) 各 1 段 6 行 inline;
 * 集中后 2 段变 1 个调用, status 颜色调整 1 处生效.
 */
export function getStatusBadgeStyle(
  status: StoreStatus,
  size: StatusBadgeSize = 'sm'
): CSSProperties {
  const info = STATUS_INFO[status];
  const isSm = size === 'sm';
  return {
    position: 'absolute',
    top: isSm ? 12 : 16,
    right: isSm ? 12 : 16,
    padding: isSm ? '4px 10px' : '6px 14px',
    borderRadius: isSm ? 12 : 16,
    background: info.bg,
    color: info.color,
    fontSize: isSm ? 12 : 13,
    fontWeight: 500,
  };
}

// ─── 特色标签 chip ─────────────────────────────────────

/** 特色 chip 变体: compact 列表卡, comfortable 详情特色服务区 */
export type FeatureChipVariant = 'compact' | 'comfortable';

/**
 * 特色标签 chip: 紫色调 (rgba(102,126,234,0.15) + #a5b4fc).
 * 之前 list 页 compact (padding 4/8, radius 6, font 11) + detail 页 comfortable
 * (padding 8/14, radius 20, font 13) 各 1 段 inline; 集中后 2 段变 1 个调用.
 */
export function getFeatureChipStyle(
  variant: FeatureChipVariant = 'compact'
): CSSProperties {
  const isCompact = variant === 'compact';
  return {
    padding: isCompact ? '4px 8px' : '8px 14px',
    borderRadius: isCompact ? 6 : 20,
    background: 'rgba(102, 126, 234, 0.15)',
    color: '#a5b4fc',
    fontSize: isCompact ? 11 : 13,
  };
}

// ─── 行动按钮 (电话 / 导航) ────────────────────────────

/** 行动按钮变体: call 绿色 / navigate 蓝色边框 / navigate-primary 紫色渐变 */
export type ActionButtonVariant = 'call' | 'navigate' | 'navigate-primary';
/** 行动按钮尺寸: sm 列表卡, md 详情底部固定栏 */
export type ActionButtonSize = 'sm' | 'md';

const ACTION_BUTTON_PADDING: Record<ActionButtonSize, number> = { sm: 10, md: 14 };
const ACTION_BUTTON_RADIUS: Record<ActionButtonSize, number> = { sm: 8, md: 12 };
const ACTION_BUTTON_FONT_SIZE: Record<ActionButtonSize, number> = { sm: 13, md: 15 };

/**
 * 行动按钮样式: 3 变体 (call/navigate/navigate-primary) × 2 尺寸 (sm/md).
 * 之前 list 页 (sm call + sm navigate) + detail 页 (md call + md navigate-primary)
 * 共 4 段 inline 重复, 颜色/圆角/内边距/字体调整要同步 4 处;
 * 集中后 4 段变 1 个调用, 调整 1 处生效.
 */
export function getContactActionButtonStyle(
  variant: ActionButtonVariant,
  size: ActionButtonSize = 'sm'
): CSSProperties {
  const padding = ACTION_BUTTON_PADDING[size];
  const borderRadius = ACTION_BUTTON_RADIUS[size];
  const fontSize = ACTION_BUTTON_FONT_SIZE[size];
  const base: CSSProperties = {
    flex: 1,
    padding,
    borderRadius,
    fontSize,
    textAlign: 'center',
    textDecoration: 'none',
  };
  if (variant === 'call') {
    return {
      ...base,
      background: 'rgba(34, 197, 94, 0.15)',
      border: '1px solid rgba(34, 197, 94, 0.3)',
      color: '#4ade80',
    };
  }
  if (variant === 'navigate') {
    return {
      ...base,
      background: 'rgba(59, 130, 246, 0.15)',
      border: '1px solid rgba(59, 130, 246, 0.3)',
      color: '#60a5fa',
    };
  }
  // navigate-primary: 详情页底部主操作 (渐变紫色 + fontWeight 500)
  return {
    ...base,
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    border: 'none',
    color: '#fff',
    fontWeight: 500,
  };
}

// ─── 行动按钮行 (border-top 分隔) ─────────────────────

/**
 * 行动按钮行容器: 列表卡底部 actions 横排 + 顶部分隔线.
 * 之前 list 页 1 段 6 行 inline, 抽出后 1 处定义, 复用即可.
 */
export function getActionButtonRowStyle(): CSSProperties {
  return {
    display: 'flex',
    gap: 8,
    marginTop: 12,
    paddingTop: 12,
    borderTop: '1px solid rgba(148, 163, 184, 0.08)',
  };
}

// ─── 底部固定栏 (详情页电话+导航主操作) ───────────────

/**
 * 详情页底部固定栏: position:fixed + blur 背景 + 顶部分隔.
 * 之前 [id]/page.tsx 1 段 11 行 inline, 抽出后调用即可.
 */
export function getBottomActionBarStyle(): CSSProperties {
  return {
    position: 'fixed',
    bottom: 0,
    left: 0,
    right: 0,
    display: 'flex',
    gap: 12,
    padding: '16px',
    background: 'rgba(15, 23, 42, 0.95)',
    backdropFilter: 'blur(12px)',
    borderTop: '1px solid rgba(148, 163, 184, 0.1)',
  };
}

// ─── 底部导航 tab 项 ──────────────────────────────────

/**
 * 底部导航 tab 项样式: active 紫色, inactive 灰.
 * 之前 list 页底部 4 个 tab inline 重复, 抽出后 1 处定义, 颜色调整 1 处生效.
 */
export function getBottomNavItemStyle(isActive: boolean): CSSProperties {
  return {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 4,
    textDecoration: 'none',
    color: isActive ? '#667eea' : '#64748b',
  };
}
