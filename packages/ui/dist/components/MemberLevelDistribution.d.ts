import React from 'react';
export interface MemberLevel {
    /** 等级名称 */
    name: string;
    /** 会员数量 */
    count: number;
    /** 等级颜色 */
    color?: string;
}
export interface MemberLevelDistributionProps {
    /** 会员等级数据 */
    data: MemberLevel[];
    /** 组件宽度 */
    width?: number;
    /** 组件高度 */
    height?: number;
    /** 标题 */
    title?: string;
    /** 是否显示数值 */
    showValues?: boolean;
    /** 是否显示百分比 */
    showPercentage?: boolean;
    /** 自定义类名 */
    className?: string;
    /** 空状态文案 */
    emptyText?: string;
}
export declare const MemberLevelDistribution: React.FC<MemberLevelDistributionProps>;
export default MemberLevelDistribution;
