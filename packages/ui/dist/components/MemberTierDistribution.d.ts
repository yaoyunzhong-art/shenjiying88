import React from 'react';
/** 会员等级信息 */
export interface MemberTier {
    /** 等级名称 */
    tier: string;
    /** 等级标识（如 Gold/Silver） */
    key: string;
    /** 人数 */
    count: number;
    /** 环比增长率 (0.1 = +10%) */
    growth?: number;
    /** 等级颜色 */
    color?: string;
    /** 等级图标 */
    icon?: string;
}
/** 会员等级分布组件 Props */
export interface MemberTierDistributionProps {
    /** 等级数据 */
    tiers: MemberTier[];
    /** 图表宽度 */
    width?: number;
    /** 图表高度 */
    height?: number;
    /** 标题 */
    title?: string;
    /** 是否显示总数 */
    showTotal?: boolean;
    /** 是否显示趋势箭头 */
    showTrends?: boolean;
    /** 自定义类名 */
    className?: string;
    /** 空状态文案 */
    emptyText?: string;
    /** 点击等级回调 */
    onTierClick?: (tier: MemberTier) => void;
}
/**
 * MemberTierDistribution — 会员等级分布可视化组件。
 *
 * 使用环形图展示各等级占比，配合列表展示详细信息
 * （等级名称、人数、占比、环比增长趋势）。
 *
 * 适用于会员管理后台、运营看板等场景。
 *
 * @example
 * // 基本用法
 * <MemberTierDistribution
 *   title="会员等级分布"
 *   tiers={[
 *     { tier: '钻石会员', key: 'diamond', count: 128, growth: 0.12 },
 *     { tier: '黄金会员', key: 'gold', count: 450, growth: 0.05 },
 *     { tier: '白银会员', key: 'silver', count: 620, growth: -0.03 },
 *     { tier: '青铜会员', key: 'bronze', count: 890, growth: 0.01 },
 *   ]}
 *   showTrends
 *   onTierClick={(tier) => console.log('Clicked', tier)}
 * />
 *
 * @example
 * // 紧凑模式（不显示趋势）
 * <MemberTierDistribution
 *   tiers={[...]}
 *   showTotal={false}
 *   showTrends={false}
 * />
 */
export declare function MemberTierDistribution({ tiers, width, height, title, showTotal, showTrends, className, emptyText, onTierClick, }: MemberTierDistributionProps): React.JSX.Element;
