/**
 * 预约看店 — booking-data.ts
 * B-页面: 面向C端用户的预约到店功能
 *
 * 功能: 用户选择门店 → 选择日期/时段 → 填写信息 → 提交预约
 * 角色: 🛒 前台消费者视角 — 预约到店看产品/体验设备
 *
 * 数据模型: BookingSlot (可预约时段)、BookingRequest (预约请求)、
 *           BookingRecord (已创建预约)、StoreBrief (门店摘要)
 */

// ============================================================
// 类型定义
// ============================================================

/** 预约状态 */
export type BookingStatus = 'pending' | 'confirmed' | 'completed' | 'cancelled';

/** 可预约时段 */
export interface BookingSlot {
  /** 时段ID */
  slotId: string;
  /** 时段标签（如"09:00-10:00"） */
  label: string;
  /** 开始时间 HH:mm */
  startTime: string;
  /** 结束时间 HH:mm */
  endTime: string;
  /** 是否可预约 */
  available: boolean;
  /** 剩余可预约数 */
  remaining: number;
}

/** 门店摘要（预约用） */
export interface StoreBrief {
  /** 门店Code */
  storeCode: string;
  /** 门店名称 */
  storeName: string;
  /** 门店地址 */
  address: string;
  /** 门店电话 */
  phone: string;
  /** 距离（米） */
  distance?: number;
  /** 封面图URL */
  coverImage?: string;
  /** 评分 */
  rating: number;
  /** 评价数 */
  reviewCount: number;
}

/** 预约请求 */
export interface BookingRequest {
  /** 门店Code */
  storeCode: string;
  /** 预约日期 YYYY-MM-DD */
  date: string;
  /** 时段ID */
  slotId: string;
  /** 预约人数 */
  guestCount: number;
  /** 联系人姓名 */
  contactName: string;
  /** 联系人手机号 */
  contactPhone: string;
  /** 备注 */
  note?: string;
}

/** 已创建预约记录 */
export interface BookingRecord {
  /** 预约编号 */
  bookingId: string;
  /** 门店Code */
  storeCode: string;
  /** 门店名称 */
  storeName: string;
  /** 预约日期 */
  date: string;
  /** 时段标签 */
  slotLabel: string;
  /** 开始时间 */
  startTime: string;
  /** 结束时间 */
  endTime: string;
  /** 预约人数 */
  guestCount: number;
  /** 联系人 */
  contactName: string;
  /** 联系人手机 */
  contactPhone: string;
  /** 备注 */
  note?: string;
  /** 预约状态 */
  status: BookingStatus;
  /** 创建时间 ISO */
  createdAt: string;
  /** 确认时间 ISO */
  confirmedAt?: string;
}

// ============================================================
// 常量
// ============================================================

/** 预约状态中文映射 */
export const BOOKING_STATUS_LABELS: Record<BookingStatus, string> = {
  pending: '待确认',
  confirmed: '已确认',
  completed: '已完成',
  cancelled: '已取消',
};

/** 预约状态颜色映射 */
export const BOOKING_STATUS_COLORS: Record<BookingStatus, string> = {
  pending: '#f59e0b',    // amber
  confirmed: '#10b981',  // emerald
  completed: '#6366f1',  // indigo
  cancelled: '#ef4444',  // red
};

/** 默认时段列表（每天通用） */
export const DEFAULT_SLOTS: BookingSlot[] = [
  { slotId: 'slot-1', label: '09:00-10:00', startTime: '09:00', endTime: '10:00', available: true, remaining: 3 },
  { slotId: 'slot-2', label: '10:00-11:00', startTime: '10:00', endTime: '11:00', available: true, remaining: 2 },
  { slotId: 'slot-3', label: '11:00-12:00', startTime: '11:00', endTime: '12:00', available: true, remaining: 4 },
  { slotId: 'slot-4', label: '13:00-14:00', startTime: '13:00', endTime: '14:00', available: true, remaining: 1 },
  { slotId: 'slot-5', label: '14:00-15:00', startTime: '14:00', endTime: '15:00', available: true, remaining: 3 },
  { slotId: 'slot-6', label: '15:00-16:00', startTime: '15:00', endTime: '16:00', available: true, remaining: 2 },
  { slotId: 'slot-7', label: '16:00-17:00', startTime: '16:00', endTime: '17:00', available: true, remaining: 0 },
  { slotId: 'slot-8', label: '17:00-18:00', startTime: '17:00', endTime: '18:00', available: false, remaining: 0 },
];

/** 每次预约的最大人数 */
export const MAX_GUESTS_PER_BOOKING = 10;

/** 最少提前预约小时 */
export const MIN_ADVANCE_HOURS = 1;

// ============================================================
// Mock 门店数据
// ============================================================

export const MOCK_STORES: StoreBrief[] = [
  {
    storeCode: 'store-001',
    storeName: '旗舰店（国贸）',
    address: '北京市朝阳区建国门外大街1号国贸商城B1层',
    phone: '010-65001234',
    distance: 1200,
    coverImage: '/images/stores/store-001.jpg',
    rating: 4.8,
    reviewCount: 328,
  },
  {
    storeCode: 'store-002',
    storeName: '社区店（望京）',
    address: '北京市朝阳区望京SOHO T1栋1层',
    phone: '010-84721234',
    distance: 3500,
    coverImage: '/images/stores/store-002.jpg',
    rating: 4.6,
    reviewCount: 187,
  },
  {
    storeCode: 'store-003',
    storeName: '卫星店（中关村）',
    address: '北京市海淀区中关村大街15号',
    phone: '010-82561234',
    distance: 6800,
    coverImage: '/images/stores/store-003.jpg',
    rating: 4.5,
    reviewCount: 94,
  },
  {
    storeCode: 'store-004',
    storeName: '新店（通州万达）',
    address: '北京市通州区新华西街58号万达广场2层',
    phone: '010-80881234',
    distance: 15000,
    coverImage: '/images/stores/store-004.jpg',
    rating: 4.3,
    reviewCount: 42,
  },
];

// ============================================================
// Mock 预约记录
// ============================================================

export const MOCK_BOOKINGS: BookingRecord[] = [
  {
    bookingId: 'bk-001',
    storeCode: 'store-001',
    storeName: '旗舰店（国贸）',
    date: '2026-07-10',
    slotLabel: '10:00-11:00',
    startTime: '10:00',
    endTime: '11:00',
    guestCount: 2,
    contactName: '张明',
    contactPhone: '13800138001',
    note: '对跑步机感兴趣，请安排导购',
    status: 'confirmed',
    createdAt: '2026-07-08T14:30:00Z',
    confirmedAt: '2026-07-08T15:00:00Z',
  },
  {
    bookingId: 'bk-002',
    storeCode: 'store-002',
    storeName: '社区店（望京）',
    date: '2026-07-09',
    slotLabel: '14:00-15:00',
    startTime: '14:00',
    endTime: '15:00',
    guestCount: 3,
    contactName: '李芳',
    contactPhone: '13900139001',
    status: 'pending',
    createdAt: '2026-07-08T10:00:00Z',
  },
  {
    bookingId: 'bk-003',
    storeCode: 'store-001',
    storeName: '旗舰店（国贸）',
    date: '2026-07-05',
    slotLabel: '09:00-10:00',
    startTime: '09:00',
    endTime: '10:00',
    guestCount: 1,
    contactName: '王磊',
    contactPhone: '13700137001',
    note: '了解动感单车课程',
    status: 'completed',
    createdAt: '2026-07-03T09:15:00Z',
    confirmedAt: '2026-07-03T10:00:00Z',
  },
  {
    bookingId: 'bk-004',
    storeCode: 'store-003',
    storeName: '卫星店（中关村）',
    date: '2026-07-12',
    slotLabel: '11:00-12:00',
    startTime: '11:00',
    endTime: '12:00',
    guestCount: 4,
    contactName: '陈静',
    contactPhone: '13600136001',
    status: 'pending',
    createdAt: '2026-07-08T16:45:00Z',
  },
  {
    bookingId: 'bk-005',
    storeCode: 'store-001',
    storeName: '旗舰店（国贸）',
    date: '2026-07-04',
    slotLabel: '15:00-16:00',
    startTime: '15:00',
    endTime: '16:00',
    guestCount: 2,
    contactName: '赵阳',
    contactPhone: '13500135001',
    note: '已取消原因：临时有事',
    status: 'cancelled',
    createdAt: '2026-07-02T11:30:00Z',
    confirmedAt: '2026-07-02T12:00:00Z',
  },
];

// ============================================================
// 辅助函数
// ============================================================

/** 获取今日日期 YYYY-MM-DD */
export function today(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/** 获取未来 N 天的日期数组 */
export function getNextDays(count: number): string[] {
  const result: string[] = [];
  const now = new Date();
  for (let i = 0; i < count; i++) {
    const d = new Date(now);
    d.setDate(d.getDate() + i);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    result.push(`${y}-${m}-${day}`);
  }
  return result;
}

/** 日期 -> 中文星期 */
export function getChineseWeekday(dateStr: string): string {
  const weekdays = ['日', '一', '二', '三', '四', '五', '六'];
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return '未知';
  return `周${weekdays[d.getDay()]}`;
}

/** 格式化日期：YYYY-MM-DD -> MM月DD日 周X */
export function formatDateDisplay(dateStr: string): string {
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  const month = d.getMonth() + 1;
  const day = d.getDate();
  const weekday = getChineseWeekday(dateStr);
  return `${month}月${day}日 ${weekday}`;
}

/** 检查时段是否可预约（剩余 > 0 且 available = true） */
export function isSlotBookable(slot: BookingSlot): boolean {
  return slot.available && slot.remaining > 0;
}

/** 根据门店Code查找门店 */
export function findStoreByCode(stores: StoreBrief[], storeCode: string): StoreBrief | undefined {
  return stores.find((s) => s.storeCode === storeCode);
}

/** 根据门店Code过滤预约记录 */
export function filterBookingsByStore(bookings: BookingRecord[], storeCode: string): BookingRecord[] {
  return bookings.filter((b) => b.storeCode === storeCode);
}

/** 根据状态过滤预约记录 */
export function filterBookingsByStatus(bookings: BookingRecord[], status: BookingStatus): BookingRecord[] {
  return bookings.filter((b) => b.status === status);
}

/** 验证预约请求字段 */
export interface ValidationError {
  field: string;
  message: string;
}

/** 验证预约请求，返回错误数组（空数组表示通过） */
export function validateBookingRequest(req: BookingRequest): ValidationError[] {
  const errors: ValidationError[] = [];

  if (!req.storeCode) {
    errors.push({ field: 'storeCode', message: '请选择门店' });
  }

  if (!req.date) {
    errors.push({ field: 'date', message: '请选择预约日期' });
  } else {
    const d = new Date(req.date);
    if (isNaN(d.getTime())) {
      errors.push({ field: 'date', message: '日期格式不正确' });
    } else {
      const now = new Date();
      now.setHours(now.getHours() + MIN_ADVANCE_HOURS);
      if (d < now) {
        errors.push({ field: 'date', message: '预约日期不能早于当前时间' });
      }
    }
  }

  if (!req.slotId) {
    errors.push({ field: 'slotId', message: '请选择预约时段' });
  }

  if (!req.contactName || req.contactName.trim().length === 0) {
    errors.push({ field: 'contactName', message: '请填写联系人姓名' });
  } else if (req.contactName.trim().length < 2) {
    errors.push({ field: 'contactName', message: '联系人姓名至少2个字符' });
  }

  if (!req.contactPhone) {
    errors.push({ field: 'contactPhone', message: '请填写联系电话' });
  } else if (!/^1\d{10}$/.test(req.contactPhone)) {
    errors.push({ field: 'contactPhone', message: '手机号格式不正确（11位以1开头）' });
  }

  if (req.guestCount < 1) {
    errors.push({ field: 'guestCount', message: '预约人数至少为1' });
  } else if (req.guestCount > MAX_GUESTS_PER_BOOKING) {
    errors.push({ field: 'guestCount', message: `单次预约最多${MAX_GUESTS_PER_BOOKING}人` });
  }

  return errors;
}

/** 从预约记录中提取摘要文本 */
export function getBookingSummary(record: BookingRecord): string {
  const statusLabel = BOOKING_STATUS_LABELS[record.status];
  return `${record.storeName} | ${record.date} ${record.slotLabel} | ${record.guestCount}人 | ${statusLabel}`;
}
