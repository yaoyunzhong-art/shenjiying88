"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MemberPersistentProfileUpdateDto = exports.MemberLevelAdjustDto = exports.MemberStatusAdjustDto = exports.MemberPaymentActivityDto = exports.MemberPointsAdjustDto = exports.MemberLoginDto = exports.MemberPersistentRegisterDto = exports.MemberBootstrapResponseDto = exports.MemberUpdateDto = exports.MemberCreateDto = exports.MemberQueryDto = void 0;
/**
 * 会员查询参数 DTO
 */
class MemberQueryDto {
    /** 会员等级筛选 */
    level;
    /** 会员状态筛选 */
    status;
    /** 搜索关键字（昵称/ID） */
    keyword;
    /** 分页页码 */
    page;
    /** 每页条数 */
    pageSize;
}
exports.MemberQueryDto = MemberQueryDto;
/**
 * 会员创建 DTO
 */
class MemberCreateDto {
    /** 会员昵称 */
    nickname;
    /** 初始积分 */
    points;
    /** 会员等级 */
    level;
}
exports.MemberCreateDto = MemberCreateDto;
/**
 * 会员更新 DTO
 */
class MemberUpdateDto {
    /** 会员昵称 */
    nickname;
    /** 会员等级 */
    level;
    /** 会员状态 */
    status;
    /** 积分增量（正数为加，负数为扣） */
    pointsDelta;
}
exports.MemberUpdateDto = MemberUpdateDto;
/**
 * 会员 Bootstrap 响应 DTO
 */
class MemberBootstrapResponseDto {
    tenantContext;
    capabilities;
    phase;
}
exports.MemberBootstrapResponseDto = MemberBootstrapResponseDto;
/**
 * 会员持久化注册 DTO
 */
class MemberPersistentRegisterDto {
    /** 登录手机号 */
    mobile;
    /** 会员昵称 */
    nickname;
    /** 初始积分 */
    initialPoints;
}
exports.MemberPersistentRegisterDto = MemberPersistentRegisterDto;
/**
 * 会员登录 DTO
 */
class MemberLoginDto {
    /** 登录手机号 */
    mobile;
}
exports.MemberLoginDto = MemberLoginDto;
/**
 * 会员积分调整 DTO
 */
class MemberPointsAdjustDto {
    /** 调整积分 */
    points;
    /** 已审批工单号 */
    approvalTicket;
}
exports.MemberPointsAdjustDto = MemberPointsAdjustDto;
/**
 * 会员支付活动 DTO
 */
class MemberPaymentActivityDto {
    /** 订单 ID */
    orderId;
    /** 支付金额 */
    amount;
    /** 支付时间 */
    paidAt;
    /** 支付渠道 */
    channel;
    /** 支付来源 */
    source;
}
exports.MemberPaymentActivityDto = MemberPaymentActivityDto;
/**
 * 会员状态调整 DTO
 */
class MemberStatusAdjustDto {
    /** 目标状态 */
    status;
    /** 已审批工单号 */
    approvalTicket;
}
exports.MemberStatusAdjustDto = MemberStatusAdjustDto;
/**
 * 会员等级调整 DTO
 */
class MemberLevelAdjustDto {
    /** 目标等级 */
    level;
    /** 已审批工单号 */
    approvalTicket;
}
exports.MemberLevelAdjustDto = MemberLevelAdjustDto;
/**
 * 持久化会员基础资料更新 DTO
 */
class MemberPersistentProfileUpdateDto {
    /** 会员昵称 */
    nickname;
    /** 登录手机号 */
    mobile;
    /** 联系邮箱 */
    email;
    /** 联系地址 */
    address;
    /** 内部备注 */
    notes;
}
exports.MemberPersistentProfileUpdateDto = MemberPersistentProfileUpdateDto;
//# sourceMappingURL=member.dto.js.map