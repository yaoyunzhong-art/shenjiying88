import React from 'react';
/** 会员服务概览 */
export interface MemberServiceOverview {
    /** 总服务次数 */
    totalServices: number;
    /** 本月新增VIP */
    newVipCount: number;
    /** 待处理咨询 */
    pendingInquiries: number;
    /** 客户满意度 (0-100) */
    satisfactionScore: number;
    /** 满意度环比变化 */
    satisfactionTrend: number;
}
/** 积分操作记录 */
export interface PointsTransaction {
    id: string;
    memberName: string;
    memberId: string;
    memberLevel: 'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond';
    type: 'earn' | 'redeem' | 'adjust' | 'expire';
    points: number;
    reason: string;
    operatedBy: string;
    operatedAt: string;
}
/** 会员来访记录 */
export interface MemberVisitRecord {
    id: string;
    memberName: string;
    memberId: string;
    memberLevel: 'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond';
    visitTime: string;
    purpose: string;
    durationMin: number;
    staffName: string;
    notes?: string;
}
/** 个性化推荐项 */
export interface PersonalizedRecommendation {
    id: string;
    memberId: string;
    memberName: string;
    productName: string;
    productCategory: string;
    reason: string;
    confidence: 'high' | 'medium' | 'low';
    price?: number;
}
/** 快速服务操作 */
export interface ConciergeAction {
    key: string;
    label: string;
    icon?: string;
    primary?: boolean;
    onClick?: () => void;
}
/** 礼宾管家面板 Props */
export interface ConciergePanelProps {
    /** 会员服务概览统计 */
    overview?: MemberServiceOverview;
    /** 积分流水 */
    pointsTransactions?: PointsTransaction[];
    /** 来访记录 */
    visitRecords?: MemberVisitRecord[];
    /** 个性化推荐 */
    recommendations?: PersonalizedRecommendation[];
    /** 快速操作 */
    actions?: ConciergeAction[];
    /** 管家名称 */
    conciergeName?: string;
    /** 上次同步时间 */
    lastSyncAt?: string;
    /** 加载中 */
    loading?: boolean;
    /** 紧凑模式 */
    compact?: boolean;
    /** 自定义类名 */
    className?: string;
}
export declare const ConciergePanel: React.FC<ConciergePanelProps>;
