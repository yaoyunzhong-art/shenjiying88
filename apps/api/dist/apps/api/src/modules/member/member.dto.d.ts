import { MemberLevel, MemberStatus } from './member.entity';
/**
 * 会员查询参数 DTO
 */
export declare class MemberQueryDto {
    /** 会员等级筛选 */
    level?: string;
    /** 会员状态筛选 */
    status?: string;
    /** 搜索关键字（昵称/ID） */
    keyword?: string;
    /** 分页页码 */
    page?: number;
    /** 每页条数 */
    pageSize?: number;
}
/**
 * 会员创建 DTO
 */
export declare class MemberCreateDto {
    /** 会员昵称 */
    nickname: string;
    /** 初始积分 */
    points?: number;
    /** 会员等级 */
    level?: string;
}
/**
 * 会员更新 DTO
 */
export declare class MemberUpdateDto {
    /** 会员昵称 */
    nickname?: string;
    /** 会员等级 */
    level?: string;
    /** 会员状态 */
    status?: string;
    /** 积分增量（正数为加，负数为扣） */
    pointsDelta?: number;
}
/**
 * 会员 Bootstrap 响应 DTO
 */
export declare class MemberBootstrapResponseDto {
    tenantContext: Record<string, unknown>;
    capabilities: string[];
    phase: string;
}
/**
 * 会员持久化注册 DTO
 */
export declare class MemberPersistentRegisterDto {
    /** 登录手机号 */
    mobile: string;
    /** 会员昵称 */
    nickname: string;
    /** 初始积分 */
    initialPoints?: number;
}
/**
 * 会员登录 DTO
 */
export declare class MemberLoginDto {
    /** 登录手机号 */
    mobile: string;
}
/**
 * 会员积分调整 DTO
 */
export declare class MemberPointsAdjustDto {
    /** 调整积分 */
    points: number;
    /** 已审批工单号 */
    approvalTicket?: string;
}
/**
 * 会员支付活动 DTO
 */
export declare class MemberPaymentActivityDto {
    /** 订单 ID */
    orderId: string;
    /** 支付金额 */
    amount: number;
    /** 支付时间 */
    paidAt?: string;
    /** 支付渠道 */
    channel?: string;
    /** 支付来源 */
    source?: 'cashier' | 'lyt-snapshot';
}
/**
 * 会员状态调整 DTO
 */
export declare class MemberStatusAdjustDto {
    /** 目标状态 */
    status: MemberStatus;
    /** 已审批工单号 */
    approvalTicket?: string;
}
/**
 * 会员等级调整 DTO
 */
export declare class MemberLevelAdjustDto {
    /** 目标等级 */
    level: MemberLevel;
    /** 已审批工单号 */
    approvalTicket?: string;
}
/**
 * 持久化会员基础资料更新 DTO
 */
export declare class MemberPersistentProfileUpdateDto {
    /** 会员昵称 */
    nickname: string;
    /** 登录手机号 */
    mobile: string;
    /** 联系邮箱 */
    email?: string;
    /** 联系地址 */
    address?: string;
    /** 内部备注 */
    notes?: string;
}
//# sourceMappingURL=member.dto.d.ts.map