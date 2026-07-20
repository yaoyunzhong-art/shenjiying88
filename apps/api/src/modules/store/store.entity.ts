/**
 * store.entity.ts · 门店实体
 *
 * Phase 1 商店管理模块核心实体
 */

// ── 门店状态枚举 ──

export enum StoreStatus {
  Active = 'ACTIVE',
  Inactive = 'INACTIVE',
  Closed = 'CLOSED',
}

// ── 门店类型枚举 ──

export enum StoreType {
  SelfOwned = 'SELF_OWNED',     // 自营
  Franchise = 'FRANCHISE',      // 加盟
  Partner = 'PARTNER',          // 合作
}

// ── 门店实体接口 ──

export interface Store {
  /** 门店唯一标识 */
  id: string
  /** 租户 ID */
  tenantId: string
  /** 品牌 ID */
  brandId?: string
  /** 门店编码 */
  storeCode: string
  /** 门店名称 */
  name: string
  /** 门店地址 */
  address: string
  /** 联系电话 */
  phone?: string
  /** 门店状态 */
  status: StoreStatus
  /** 门店类型 */
  type: StoreType
  /** 营业面积（平方米） */
  area?: number
  /** 门店经理姓名 */
  managerName?: string
  /** 门店经理电话 */
  managerPhone?: string
  /** 营业开始时间 (HH:mm) */
  openingTime?: string
  /** 营业结束时间 (HH:mm) */
  closingTime?: string
  /** 门店描述 */
  description?: string
  /** 运营标签 */
  tags?: string[]
  /** 门店图片 URL */
  imageUrl?: string
  /** 经度 */
  longitude?: number
  /** 纬度 */
  latitude?: number
  /** 创建时间 */
  createdAt: string
  /** 更新时间 */
  updatedAt: string
}

// ── 门店统计接口 ──

export interface StoreStats {
  /** 门店 ID */
  storeId: string
  /** 门店名称 */
  storeName: string
  /** 总会员数 */
  totalMembers: number
  /** 今日新增会员 */
  newMembersToday: number
  /** 活跃会员数 */
  activeMembers: number
  /** 总设备数 */
  totalDevices: number
  /** 在线设备数 */
  onlineDevices: number
  /** 今日营收（分） */
  todayRevenue: number
  /** 昨日营收（分） */
  yesterdayRevenue: number
  /** 环比增长率 */
  revenueMoM?: number
  /** 当月营收（分） */
  monthlyRevenue: number
  /** 今日订单数 */
  todayOrders: number
  /** 库存预警数 */
  stockAlerts: number
  /** 员工人数 */
  employeeCount: number
  /** 更新时间 */
  updatedAt: string
}
