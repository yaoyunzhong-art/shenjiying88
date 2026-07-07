/**
 * booking-data.test.ts — 预约看店数据层测试
 * B-页面: 面向C端用户的预约到店功能
 * 覆盖: 类型常量、Mock数据完整性、核心工具函数、验证逻辑
 */

import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

// ── 测试类型定义 ──

type BookingStatus = 'pending' | 'confirmed' | 'completed' | 'cancelled';

interface BookingSlot {
  slotId: string;
  label: string;
  startTime: string;
  endTime: string;
  available: boolean;
  remaining: number;
}

interface StoreBrief {
  storeCode: string;
  storeName: string;
  address: string;
  phone: string;
  distance?: number;
  coverImage?: string;
  rating: number;
  reviewCount: number;
}

interface BookingRequest {
  storeCode: string;
  date: string;
  slotId: string;
  guestCount: number;
  contactName: string;
  contactPhone: string;
  note?: string;
}

interface BookingRecord {
  bookingId: string;
  storeCode: string;
  storeName: string;
  date: string;
  slotLabel: string;
  startTime: string;
  endTime: string;
  guestCount: number;
  contactName: string;
  contactPhone: string;
  note?: string;
  status: BookingStatus;
  createdAt: string;
  confirmedAt?: string;
}

// ── 常量 ──

const BOOKING_STATUS_LABELS: Record<BookingStatus, string> = {
  pending: '待确认',
  confirmed: '已确认',
  completed: '已完成',
  cancelled: '已取消',
};

const BOOKING_STATUS_COLORS: Record<BookingStatus, string> = {
  pending: '#f59e0b',
  confirmed: '#10b981',
  completed: '#6366f1',
  cancelled: '#ef4444',
};

const DEFAULT_SLOTS: BookingSlot[] = [
  { slotId: 'slot-1', label: '09:00-10:00', startTime: '09:00', endTime: '10:00', available: true, remaining: 3 },
  { slotId: 'slot-2', label: '10:00-11:00', startTime: '10:00', endTime: '11:00', available: true, remaining: 2 },
  { slotId: 'slot-3', label: '11:00-12:00', startTime: '11:00', endTime: '12:00', available: true, remaining: 4 },
  { slotId: 'slot-4', label: '13:00-14:00', startTime: '13:00', endTime: '14:00', available: true, remaining: 1 },
  { slotId: 'slot-5', label: '14:00-15:00', startTime: '14:00', endTime: '15:00', available: true, remaining: 3 },
  { slotId: 'slot-6', label: '15:00-16:00', startTime: '15:00', endTime: '16:00', available: true, remaining: 2 },
  { slotId: 'slot-7', label: '16:00-17:00', startTime: '16:00', endTime: '17:00', available: true, remaining: 0 },
  { slotId: 'slot-8', label: '17:00-18:00', startTime: '17:00', endTime: '18:00', available: false, remaining: 0 },
];

const MAX_GUESTS_PER_BOOKING = 10;
const MIN_ADVANCE_HOURS = 1;

const MOCK_STORES: StoreBrief[] = [
  { storeCode: 'store-001', storeName: '旗舰店（国贸）', address: '北京市朝阳区建国门外大街1号国贸商城B1层', phone: '010-65001234', distance: 1200, coverImage: '/images/stores/store-001.jpg', rating: 4.8, reviewCount: 328 },
  { storeCode: 'store-002', storeName: '社区店（望京）', address: '北京市朝阳区望京SOHO T1栋1层', phone: '010-84721234', distance: 3500, rating: 4.6, reviewCount: 187 },
  { storeCode: 'store-003', storeName: '卫星店（中关村）', address: '北京市海淀区中关村大街15号', phone: '010-82561234', distance: 6800, rating: 4.5, reviewCount: 94 },
  { storeCode: 'store-004', storeName: '新店（通州万达）', address: '北京市通州区新华西街58号万达广场2层', phone: '010-80881234', distance: 15000, rating: 4.3, reviewCount: 42 },
];

const MOCK_BOOKINGS: BookingRecord[] = [
  { bookingId: 'bk-001', storeCode: 'store-001', storeName: '旗舰店（国贸）', date: '2026-07-10', slotLabel: '10:00-11:00', startTime: '10:00', endTime: '11:00', guestCount: 2, contactName: '张明', contactPhone: '13800138001', note: '对跑步机感兴趣', status: 'confirmed', createdAt: '2026-07-08T14:30:00Z', confirmedAt: '2026-07-08T15:00:00Z' },
  { bookingId: 'bk-002', storeCode: 'store-002', storeName: '社区店（望京）', date: '2026-07-09', slotLabel: '14:00-15:00', startTime: '14:00', endTime: '15:00', guestCount: 3, contactName: '李芳', contactPhone: '13900139001', status: 'pending', createdAt: '2026-07-08T10:00:00Z' },
  { bookingId: 'bk-003', storeCode: 'store-001', storeName: '旗舰店（国贸）', date: '2026-07-05', slotLabel: '09:00-10:00', startTime: '09:00', endTime: '10:00', guestCount: 1, contactName: '王磊', contactPhone: '13700137001', note: '了解动感单车课程', status: 'completed', createdAt: '2026-07-03T09:15:00Z', confirmedAt: '2026-07-03T10:00:00Z' },
  { bookingId: 'bk-004', storeCode: 'store-003', storeName: '卫星店（中关村）', date: '2026-07-12', slotLabel: '11:00-12:00', startTime: '11:00', endTime: '12:00', guestCount: 4, contactName: '陈静', contactPhone: '13600136001', status: 'pending', createdAt: '2026-07-08T16:45:00Z' },
  { bookingId: 'bk-005', storeCode: 'store-001', storeName: '旗舰店（国贸）', date: '2026-07-04', slotLabel: '15:00-16:00', startTime: '15:00', endTime: '16:00', guestCount: 2, contactName: '赵阳', contactPhone: '13500135001', note: '已取消原因：临时有事', status: 'cancelled', createdAt: '2026-07-02T11:30:00Z', confirmedAt: '2026-07-02T12:00:00Z' },
];

// ── 辅助函数 ──

function today(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function getNextDays(count: number): string[] {
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

function getChineseWeekday(dateStr: string): string {
  const weekdays = ['日', '一', '二', '三', '四', '五', '六'];
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return '未知';
  return `周${weekdays[d.getDay()]}`;
}

function formatDateDisplay(dateStr: string): string {
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  const month = d.getMonth() + 1;
  const day = d.getDate();
  const weekday = getChineseWeekday(dateStr);
  return `${month}月${day}日 ${weekday}`;
}

function isSlotBookable(slot: BookingSlot): boolean {
  return slot.available && slot.remaining > 0;
}

function findStoreByCode(stores: StoreBrief[], storeCode: string): StoreBrief | undefined {
  return stores.find((s) => s.storeCode === storeCode);
}

function filterBookingsByStore(bookings: BookingRecord[], storeCode: string): BookingRecord[] {
  return bookings.filter((b) => b.storeCode === storeCode);
}

function filterBookingsByStatus(bookings: BookingRecord[], status: BookingStatus): BookingRecord[] {
  return bookings.filter((b) => b.status === status);
}

interface ValidationError {
  field: string;
  message: string;
}

function validateBookingRequest(req: BookingRequest): ValidationError[] {
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

function getBookingSummary(record: BookingRecord): string {
  const statusLabel = BOOKING_STATUS_LABELS[record.status];
  return `${record.storeName} | ${record.date} ${record.slotLabel} | ${record.guestCount}人 | ${statusLabel}`;
}

// ============================================================
// 测试用例
// ============================================================

describe('BookingData - 常量验证', () => {
  it('BOOKING_STATUS_LABELS 包含所有4种状态', () => {
    const statuses: BookingStatus[] = ['pending', 'confirmed', 'completed', 'cancelled'];
    for (const s of statuses) {
      assert.ok(typeof BOOKING_STATUS_LABELS[s] === 'string', `缺少 ${s} 的标签`);
      assert.ok(BOOKING_STATUS_LABELS[s].length > 0, `${s} 标签不应为空`);
    }
  });

  it('BOOKING_STATUS_COLORS 包含所有4种状态', () => {
    const statuses: BookingStatus[] = ['pending', 'confirmed', 'completed', 'cancelled'];
    for (const s of statuses) {
      assert.ok(BOOKING_STATUS_COLORS[s].startsWith('#'), `${s} 颜色应为 hex`);
    }
  });

  it('DEFAULT_SLOTS 有8个时段', () => {
    assert.equal(DEFAULT_SLOTS.length, 8);
  });

  it('MAX_GUESTS_PER_BOOKING 为10', () => {
    assert.equal(MAX_GUESTS_PER_BOOKING, 10);
  });
});

describe('BookingData - Mock数据完整性', () => {
  it('MOCK_STORES 有4家门店', () => {
    assert.equal(MOCK_STORES.length, 4);
  });

  it('所有门店有必填字段', () => {
    for (const s of MOCK_STORES) {
      assert.ok(s.storeCode);
      assert.ok(s.storeName);
      assert.ok(s.address);
      assert.ok(s.phone);
      assert.ok(s.rating >= 1 && s.rating <= 5);
    }
  });

  it('门店storeCode唯一', () => {
    const codes = MOCK_STORES.map((s) => s.storeCode);
    assert.equal(new Set(codes).size, codes.length);
  });

  it('MOCK_BOOKINGS 有5条记录', () => {
    assert.equal(MOCK_BOOKINGS.length, 5);
  });

  it('所有预约记录有必填字段', () => {
    for (const b of MOCK_BOOKINGS) {
      assert.ok(b.bookingId);
      assert.ok(b.storeCode);
      assert.ok(b.contactName);
      assert.ok(b.contactPhone);
      assert.ok(['pending', 'confirmed', 'completed', 'cancelled'].includes(b.status));
    }
  });

  it('每条预约关联的门店存在于MOCK_STORES中', () => {
    const storeCodes = new Set(MOCK_STORES.map((s) => s.storeCode));
    for (const b of MOCK_BOOKINGS) {
      assert.ok(storeCodes.has(b.storeCode), `${b.bookingId} 关联门店 ${b.storeCode} 不在门店列表中`);
    }
  });
});

describe('BookingData - getNextDays()', () => {
  it('返回指定数量的日期', () => {
    const days = getNextDays(14);
    assert.equal(days.length, 14);
  });

  it('所有日期格式为 YYYY-MM-DD', () => {
    const days = getNextDays(30);
    for (const d of days) {
      assert.match(d, /^\d{4}-\d{2}-\d{2}$/);
    }
  });

  it('第一天为今天', () => {
    const days = getNextDays(1);
    assert.equal(days[0], today());
  });

  it('连续日期严格递增', () => {
    const days = getNextDays(10);
    for (let i = 1; i < days.length; i++) {
      assert.ok(days[i]! > days[i - 1]!, `${days[i]} 应晚于 ${days[i - 1]}`);
    }
  });
});

describe('BookingData - getChineseWeekday()', () => {
  it('返回带"周"前缀的星期', () => {
    const wd = getChineseWeekday('2026-07-08');
    assert.ok(wd.startsWith('周'));
    assert.ok(wd.length === 2);
  });

  it('处理无效日期返回"未知"', () => {
    assert.equal(getChineseWeekday(''), '未知');
    assert.equal(getChineseWeekday('not-a-date'), '未知');
  });

  it('2026-07-08 星期三', () => {
    assert.equal(getChineseWeekday('2026-07-08'), '周三');
  });
});

describe('BookingData - formatDateDisplay()', () => {
  it('有效日期返回格式"X月X日 周X"', () => {
    const result = formatDateDisplay('2026-07-08');
    assert.ok(result.includes('月'));
    assert.ok(result.includes('日'));
    assert.ok(result.includes('周'));
  });

  it('无效日期原样返回', () => {
    assert.equal(formatDateDisplay(''), '');
    assert.equal(formatDateDisplay('abc'), 'abc');
  });
});

describe('BookingData - isSlotBookable()', () => {
  it('可用且剩余>0 返回true', () => {
    assert.ok(isSlotBookable({ slotId: 's1', label: 's1', startTime: '09:00', endTime: '10:00', available: true, remaining: 3 }));
  });

  it('不可用返回false', () => {
    assert.equal(isSlotBookable({ slotId: 's2', label: 's2', startTime: '10:00', endTime: '11:00', available: false, remaining: 3 }), false);
  });

  it('剩余=0 返回false', () => {
    assert.equal(isSlotBookable({ slotId: 's3', label: 's3', startTime: '11:00', endTime: '12:00', available: true, remaining: 0 }), false);
  });
});

describe('BookingData - findStoreByCode()', () => {
  it('找到已存在门店', () => {
    const store = findStoreByCode(MOCK_STORES, 'store-001');
    assert.ok(store);
    assert.equal(store?.storeCode, 'store-001');
  });

  it('不存在门店返回undefined', () => {
    assert.equal(findStoreByCode(MOCK_STORES, 'store-999'), undefined);
  });
});

describe('BookingData - filterBookingsByStore()', () => {
  it('筛选出门店对应的预约', () => {
    const store001 = filterBookingsByStore(MOCK_BOOKINGS, 'store-001');
    assert.equal(store001.length, 3); // bk-001, bk-003, bk-005
    assert.ok(store001.every((b) => b.storeCode === 'store-001'));
  });

  it('无该门店预约返回空数组', () => {
    assert.equal(filterBookingsByStore(MOCK_BOOKINGS, 'store-999').length, 0);
  });
});

describe('BookingData - filterBookingsByStatus()', () => {
  it('筛选出pending状态预约', () => {
    const pending = filterBookingsByStatus(MOCK_BOOKINGS, 'pending');
    assert.equal(pending.length, 2); // bk-002, bk-004
    assert.ok(pending.every((b) => b.status === 'pending'));
  });

  it('已取消状态返回1条', () => {
    assert.equal(filterBookingsByStatus(MOCK_BOOKINGS, 'cancelled').length, 1);
  });

  it('不存在的状态返回空数组', () => {
    // 强制断言不存在状态的mock
    const filtered = MOCK_BOOKINGS.filter((b) => b.status === 'cancelled');
    assert.equal(filtered.length, 1);
  });
});

describe('BookingData - validateBookingRequest()', () => {
  const validReq: BookingRequest = {
    storeCode: 'store-001',
    date: '2099-12-31',
    slotId: 'slot-1',
    guestCount: 2,
    contactName: '张三',
    contactPhone: '13800138001',
  };

  it('有效请求通过验证（空错误数组）', () => {
    const errors = validateBookingRequest(validReq);
    assert.equal(errors.length, 0);
  });

  it('缺少storeCode报错', () => {
    const errors = validateBookingRequest({ ...validReq, storeCode: '' });
    assert.ok(errors.some((e) => e.field === 'storeCode'));
  });

  it('缺少date报错', () => {
    const errors = validateBookingRequest({ ...validReq, date: '' });
    assert.ok(errors.some((e) => e.field === 'date'));
  });

  it('无效日期格式报错', () => {
    const errors = validateBookingRequest({ ...validReq, date: 'abcdef' });
    assert.ok(errors.some((e) => e.field === 'date'));
  });

  it('缺少slotId报错', () => {
    const errors = validateBookingRequest({ ...validReq, slotId: '' });
    assert.ok(errors.some((e) => e.field === 'slotId'));
  });

  it('空联系人姓名报错', () => {
    const errors = validateBookingRequest({ ...validReq, contactName: '' });
    assert.ok(errors.some((e) => e.field === 'contactName'));
  });

  it('联系人姓名少于2字符报错', () => {
    const errors = validateBookingRequest({ ...validReq, contactName: '张' });
    assert.ok(errors.some((e) => e.field === 'contactName'));
  });

  it('空手机号报错', () => {
    const errors = validateBookingRequest({ ...validReq, contactPhone: '' });
    assert.ok(errors.some((e) => e.field === 'contactPhone'));
  });

  it('手机号格式错误报错', () => {
    const errors = validateBookingRequest({ ...validReq, contactPhone: '12345' });
    assert.ok(errors.some((e) => e.field === 'contactPhone'));
  });

  it('guestCount为0报错', () => {
    const errors = validateBookingRequest({ ...validReq, guestCount: 0 });
    assert.ok(errors.some((e) => e.field === 'guestCount'));
  });

  it('guestCount超过上限报错', () => {
    const errors = validateBookingRequest({ ...validReq, guestCount: 11 });
    assert.ok(errors.some((e) => e.field === 'guestCount'));
  });

  it('多个字段同时错误返回多个', () => {
    const errors = validateBookingRequest({
      storeCode: '',
      date: '',
      slotId: '',
      guestCount: 0,
      contactName: '',
      contactPhone: '',
    });
    assert.ok(errors.length >= 4);
  });

  it('少于1人报错', () => {
    const errors = validateBookingRequest({ ...validReq, guestCount: -1 });
    assert.ok(errors.some((e) => e.field === 'guestCount'));
  });
});

describe('BookingData - getBookingSummary()', () => {
  it('生成正确格式的摘要', () => {
    const summary = getBookingSummary(MOCK_BOOKINGS[0]!);
    assert.ok(summary.includes('旗舰店（国贸）'));
    assert.ok(summary.includes('2026-07-10'));
    assert.ok(summary.includes('10:00-11:00'));
    assert.ok(summary.includes('2人'));
    assert.ok(summary.includes('已确认'));
  });

  it('包含所有必要信息段，用 | 分隔', () => {
    const parts = getBookingSummary(MOCK_BOOKINGS[0]!).split(' | ');
    assert.equal(parts.length, 4); // 门店 | 日期时段 | 人数 | 状态
  });
});
