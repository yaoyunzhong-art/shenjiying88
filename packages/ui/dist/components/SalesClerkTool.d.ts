import React from 'react';
/** 当日接待统计 */
export interface DailyReceptionStats {
    /** 接待总数 */
    totalReceptions: number;
    /** 新增线索 */
    newLeads: number;
    /** 转化数 */
    conversions: number;
    /** 转化率 (0-100) */
    conversionRate: number;
    /** 平均响应时间 (分钟) */
    avgResponseMin: number;
}
/** 待跟进客户 */
export interface FollowUpClient {
    id: string;
    name: string;
    phone: string;
    /** 会员等级 */
    tier: 'VIP' | 'GOLD' | 'SILVER' | 'REGULAR';
    /** 最近到店时间 */
    lastVisit: string;
    /** 待跟进原因 */
    reason: string;
    /** 紧急程度 */
    priority: 'high' | 'medium' | 'low';
}
/** 推荐话术 */
export interface SalesScript {
    id: string;
    scenario: string;
    text: string;
    tags: string[];
}
/** 会员快速查询结果 */
export interface MemberQuickLookup {
    id: string;
    name: string;
    phone: string;
    tier: 'VIP' | 'GOLD' | 'SILVER' | 'REGULAR';
    points: number;
    totalSpent: number;
    visitCount: number;
    tags: string[];
}
export interface SalesClerkToolProps {
    /** 当日接待统计 */
    stats: DailyReceptionStats;
    /** 待跟进客户列表 */
    followUpClients: FollowUpClient[];
    /** 推荐话术列表 */
    scripts: SalesScript[];
    /** 导购员姓名 */
    clerkName?: string;
    /** 门店名称 */
    storeName?: string;
    /** 会员查询回调 */
    onMemberSearch?: (query: string) => Promise<MemberQuickLookup[]>;
    /** 客户跟进回调 */
    onFollowUp?: (clientId: string) => void;
    /** 话术复制回调 */
    onScriptCopy?: (scriptId: string) => void;
}
export declare function SalesClerkTool({ stats, followUpClients, scripts, clerkName, storeName, onMemberSearch, onFollowUp, onScriptCopy, }: SalesClerkToolProps): React.JSX.Element;
