/**
 * booking/page.test.tsx — 预约看店页 L1 冒烟测试 (storefront-web)
 * 覆盖: A-共享数据完整 · B-页面结构 · C-边界防御
 *
 * 类型: B-页面 (多步表单: 选择门店 → 选择时段 → 填写信息 → 完成)
 * 角色: 🛒 前台消费者视角
 */
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { readFileSync } from 'node:fs';

const PROJECT_ROOT = '/Users/yaoyunzhong/Desktop/shenjiying/shenjiying88';
const PAGE_SOURCE = readFileSync(`${PROJECT_ROOT}/apps/storefront-web/app/booking/page.tsx`, 'utf-8');
const DATA_SOURCE = readFileSync(`${PROJECT_ROOT}/apps/storefront-web/app/booking/booking-data.ts`, 'utf-8');

// ============================================================
// 辅助检查
// ============================================================

function hasExport(source: string, name: string): boolean {
  const patterns = [
    `export function ${name}`,
    `export const ${name}`,
    `export type ${name}`,
    `export interface ${name}`,
    `export default function ${name}`,
    `export enum ${name}`,
  ];
  return patterns.some((p) => source.includes(p));
}

function hasImportSubstr(source: string, from: string): boolean {
  return source.includes(`from '${from}'`) || source.includes(`from "${from}"`);
}

function countOccurrence(source: string, pattern: RegExp): number {
  return (source.match(pattern) || []).length;
}

// ============================================================
// A-共享数据层完整性测试
// ============================================================

describe('A: booking-data.ts — 共享数据层', () => {
  // ---- 正例 ----

  describe('类型定义', () => {
    it('BookingStatus 四个状态值完整', () => {
      assert.ok(hasExport(DATA_SOURCE, 'BookingStatus'), '缺少 BookingStatus 类型');
      assert.ok(DATA_SOURCE.includes("'pending'"), '缺少 pending');
      assert.ok(DATA_SOURCE.includes("'confirmed'"), '缺少 confirmed');
      assert.ok(DATA_SOURCE.includes("'completed'"), '缺少 completed');
      assert.ok(DATA_SOURCE.includes("'cancelled'"), '缺少 cancelled');
    });

    it('BookingSlot 所有必需字段', () => {
      assert.ok(hasExport(DATA_SOURCE, 'BookingSlot'), '缺少 BookingSlot 类型');
      assert.ok(DATA_SOURCE.includes('slotId'), '缺少 slotId');
      assert.ok(DATA_SOURCE.includes('label'), '缺少 label');
      assert.ok(DATA_SOURCE.includes('startTime'), '缺少 startTime');
      assert.ok(DATA_SOURCE.includes('endTime'), '缺少 endTime');
      assert.ok(DATA_SOURCE.includes('available'), '缺少 available');
      assert.ok(DATA_SOURCE.includes('remaining'), '缺少 remaining');
    });

    it('StoreBrief 包含门店全部基本信息', () => {
      assert.ok(hasExport(DATA_SOURCE, 'StoreBrief'), '缺少 StoreBrief 类型');
      assert.ok(DATA_SOURCE.includes('storeCode'), '缺少 storeCode');
      assert.ok(DATA_SOURCE.includes('storeName'), '缺少 storeName');
      assert.ok(DATA_SOURCE.includes('address'), '缺少 address');
      assert.ok(DATA_SOURCE.includes('phone'), '缺少 phone');
      assert.ok(DATA_SOURCE.includes('rating'), '缺少 rating');
      assert.ok(DATA_SOURCE.includes('reviewCount'), '缺少 reviewCount');
      assert.ok(DATA_SOURCE.includes('distance'), '缺少 distance');
    });

    it('BookingRequest 包含预约全部提交字段', () => {
      assert.ok(hasExport(DATA_SOURCE, 'BookingRequest'), '缺少 BookingRequest 类型');
      assert.ok(DATA_SOURCE.includes('storeCode'), '缺少 storeCode');
      assert.ok(DATA_SOURCE.includes('date'), '缺少 date');
      assert.ok(DATA_SOURCE.includes('slotId'), '缺少 slotId');
      assert.ok(DATA_SOURCE.includes('guestCount'), '缺少 guestCount');
      assert.ok(DATA_SOURCE.includes('contactName'), '缺少 contactName');
      assert.ok(DATA_SOURCE.includes('contactPhone'), '缺少 contactPhone');
    });

    it('BookingRecord 包含完整记录字段', () => {
      assert.ok(hasExport(DATA_SOURCE, 'BookingRecord'), '缺少 BookingRecord 类型');
      assert.ok(DATA_SOURCE.includes('bookingId'), '缺少 bookingId');
      assert.ok(DATA_SOURCE.includes('status'), '缺少 status');
      assert.ok(DATA_SOURCE.includes('createdAt'), '缺少 createdAt');
      assert.ok(DATA_SOURCE.includes('storeName'), '缺少 storeName');
      assert.ok(DATA_SOURCE.includes('slotLabel'), '缺少 slotLabel');
      assert.ok(DATA_SOURCE.includes('guestCount'), '缺少 guestCount');
      assert.ok(DATA_SOURCE.includes('contactPhone'), '缺少 contactPhone');
    });
  });

  describe('常量和Mock数据', () => {
    it('BOOKING_STATUS_LABELS 覆盖四种状态中文标签', () => {
      assert.ok(DATA_SOURCE.includes('BOOKING_STATUS_LABELS'), '缺少 BOOKING_STATUS_LABELS');
      assert.ok(DATA_SOURCE.includes('待确认'), '缺少 待确认');
      assert.ok(DATA_SOURCE.includes('已确认'), '缺少 已确认');
      assert.ok(DATA_SOURCE.includes('已完成'), '缺少 已完成');
      assert.ok(DATA_SOURCE.includes('已取消'), '缺少 已取消');
    });

    it('BOOKING_STATUS_COLORS 四种颜色值正确', () => {
      assert.ok(DATA_SOURCE.includes('BOOKING_STATUS_COLORS'), '缺少 BOOKING_STATUS_COLORS');
      assert.ok(DATA_SOURCE.includes('#f59e0b') || DATA_SOURCE.includes('#fbbf24'), '缺少 amber');
      assert.ok(DATA_SOURCE.includes('#10b981') || DATA_SOURCE.includes('#34d399'), '缺少 emerald');
      assert.ok(DATA_SOURCE.includes('#6366f1'), '缺少 indigo');
      assert.ok(DATA_SOURCE.includes('#ef4444'), '缺少 red');
    });

    it('DEFAULT_SLOTS 包含8个时段', () => {
      const slotCount = countOccurrence(DATA_SOURCE, /slotId:\s*'/g);
      assert.equal(slotCount, 8, `应有8个时段, 实际${slotCount}`);
    });

    it('MAX_GUESTS_PER_BOOKING = 10', () => {
      assert.ok(DATA_SOURCE.includes('MAX_GUESTS_PER_BOOKING = 10'), 'MAX_GUESTS_PER_BOOKING 未设为10');
    });

    it('MOCK_STORES 包含4家门店', () => {
      assert.ok(DATA_SOURCE.includes('MOCK_STORES'), '缺少 MOCK_STORES');
      // 验证四家门店的 storeCode 都存在
      assert.ok(DATA_SOURCE.includes("storeCode: 'store-001'"), '缺少 store-001');
      assert.ok(DATA_SOURCE.includes("storeCode: 'store-002'"), '缺少 store-002');
      assert.ok(DATA_SOURCE.includes("storeCode: 'store-003'"), '缺少 store-003');
      assert.ok(DATA_SOURCE.includes("storeCode: 'store-004'"), '缺少 store-004');
    });

    it('MOCK_BOOKINGS 包含5条预约记录', () => {
      const bookingCount = countOccurrence(DATA_SOURCE, /bookingId:\s*'/g);
      assert.equal(bookingCount, 5, `应有5条预约记录, 实际${bookingCount}`);
    });

    it('预约记录覆盖四种状态', () => {
      assert.ok(DATA_SOURCE.includes("status: 'pending'"), '缺少 pending 状态记录');
      assert.ok(DATA_SOURCE.includes("status: 'confirmed'"), '缺少 confirmed 状态记录');
      assert.ok(DATA_SOURCE.includes("status: 'completed'"), '缺少 completed 状态记录');
      assert.ok(DATA_SOURCE.includes("status: 'cancelled'"), '缺少 cancelled 状态记录');
    });
  });

  describe('工具函数导出', () => {
    it('today() 导出', () => {
      assert.ok(hasExport(DATA_SOURCE, 'today'), '缺少 today()');
    });
    it('getNextDays(count) 导出且支持参数', () => {
      assert.ok(hasExport(DATA_SOURCE, 'getNextDays'), '缺少 getNextDays()');
      assert.ok(DATA_SOURCE.includes('count'), '缺少 count 参数引用');
    });
    it('getChineseWeekday() 导出且包含全部中文字符', () => {
      assert.ok(hasExport(DATA_SOURCE, 'getChineseWeekday'), '缺少 getChineseWeekday()');
      // 验证星期一到星期日全部覆盖
      assert.ok(DATA_SOURCE.includes("'一'"), '缺少 一');
      assert.ok(DATA_SOURCE.includes("'二'"), '缺少 二');
      assert.ok(DATA_SOURCE.includes("'三'"), '缺少 三');
      assert.ok(DATA_SOURCE.includes("'四'"), '缺少 四');
      assert.ok(DATA_SOURCE.includes("'五'"), '缺少 五');
      assert.ok(DATA_SOURCE.includes("'六'"), '缺少 六');
      assert.ok(DATA_SOURCE.includes("'日'"), '缺少 日');
    });
    it('formatDateDisplay() 导出', () => {
      assert.ok(hasExport(DATA_SOURCE, 'formatDateDisplay'), '缺少 formatDateDisplay()');
      assert.ok(DATA_SOURCE.includes('月') && DATA_SOURCE.includes('日'), '缺少月日格式');
    });
    it('isSlotBookable() 导出且含可用性判断逻辑', () => {
      assert.ok(hasExport(DATA_SOURCE, 'isSlotBookable'), '缺少 isSlotBookable()');
      assert.ok(DATA_SOURCE.includes('slot.available'), '缺少 available 检查');
      assert.ok(DATA_SOURCE.includes('remaining > 0'), '缺少 remaining 检查');
    });
    it('findStoreByCode() 导出', () => {
      assert.ok(hasExport(DATA_SOURCE, 'findStoreByCode'), '缺少 findStoreByCode()');
      assert.ok(DATA_SOURCE.includes('stores.find'), '缺少 Array.find()');
    });
    it('validateBookingRequest() 导出', () => {
      assert.ok(hasExport(DATA_SOURCE, 'validateBookingRequest'), '缺少 validateBookingRequest()');
    });
    it('getBookingSummary() 导出', () => {
      assert.ok(hasExport(DATA_SOURCE, 'getBookingSummary'), '缺少 getBookingSummary()');
    });
    it('filterBookingsByStore() 和 filterBookingsByStatus() 导出', () => {
      assert.ok(hasExport(DATA_SOURCE, 'filterBookingsByStore'), '缺少 filterBookingsByStore()');
      assert.ok(hasExport(DATA_SOURCE, 'filterBookingsByStatus'), '缺少 filterBookingsByStatus()');
    });
  });

  // ---- 反例 (防御性检查) ----

  describe('反例 — 防御性', () => {
    it('空storeCode 应触发门店为空错误提示', () => {
      assert.ok(DATA_SOURCE.includes('请选择门店'), '缺少"请选择门店"错误提示');
    });

    it('空date 应触发日期为空错误提示', () => {
      assert.ok(DATA_SOURCE.includes('请选择预约日期'), '缺少"请选择预约日期"错误提示');
    });

    it('空contactName 应触发姓名为空错误提示', () => {
      assert.ok(DATA_SOURCE.includes('请填写联系人姓名'), '缺少"请填写联系人姓名"错误提示');
    });

    it('空contactPhone 应触发电话为空错误提示', () => {
      assert.ok(DATA_SOURCE.includes('请填写联系电话'), '缺少"请填写联系电话"错误提示');
    });

    it('手机号格式校验规则存在', () => {
      assert.ok(DATA_SOURCE.includes('/^1') || DATA_SOURCE.includes('phoneRegex'), '缺少手机号正则');
      assert.ok(DATA_SOURCE.includes('手机号格式不正确'), '缺少"手机号格式不正确"提示');
    });

    it('人数校验包含MAX_GUESTS_PER_BOOKING上限', () => {
      assert.ok(DATA_SOURCE.includes('MAX_GUESTS_PER_BOOKING'), '缺少最大人数引用');
      assert.ok(DATA_SOURCE.includes('单次预约最多'), '缺少"单次预约最多"提示');
    });
  });

  // ---- 边界 ----

  describe('边界 — 特殊场景', () => {
    it('findStoreByCode 对不存在的code应返回 undefined', () => {
      assert.ok(DATA_SOURCE.includes('.find('), '缺少 Array.find 用法');
      assert.ok(DATA_SOURCE.includes('=>'), '箭头函数查找');
    });

    it('getNextDays 应生成 count 天数据且不包含过去日期', () => {
      assert.ok(DATA_SOURCE.includes('getNextDays'), '导出');
      assert.ok(DATA_SOURCE.includes('today'), '引用 today()');
    });

    it('getBookingSummary 应拼接门店+时段+人数+标签', () => {
      assert.ok(DATA_SOURCE.includes('getBookingSummary'), '导出');
      assert.ok(DATA_SOURCE.includes('storeName'), '引用 门店名');
      assert.ok(DATA_SOURCE.includes('slotLabel'), '引用 时段名');
      assert.ok(DATA_SOURCE.includes('guestCount'), '引用 人数');
    });
  });
});

// ============================================================
// B-页面结构完整性测试
// ============================================================

describe('B: page.tsx — 预约看店页面结构', () => {
  // ---- 正例 ----

  it("'use client' 指令存在", () => {
    assert.ok(PAGE_SOURCE.includes("'use client'"), '缺少 use client 指令');
  });

  it('默认导出函数 BookingPage', () => {
    assert.ok(PAGE_SOURCE.includes('export default function BookingPage'), '缺少 BookingPage 默认导出');
  });

  it('导入 booking-data 全部必需数据', () => {
    assert.ok(PAGE_SOURCE.includes("./booking-data"), '未从 booking-data 导入');
    assert.ok(PAGE_SOURCE.includes('MOCK_STORES'), '缺少 MOCK_STORES 导入');
    assert.ok(PAGE_SOURCE.includes('DEFAULT_SLOTS'), '缺少 DEFAULT_SLOTS 导入');
  });

  it('五步表单状态类型', () => {
    assert.ok(PAGE_SOURCE.includes("'select-store'"), '缺少 select-store 状态');
    assert.ok(PAGE_SOURCE.includes("'select-slot'"), '缺少 select-slot 状态');
    assert.ok(PAGE_SOURCE.includes("'fill-info'"), '缺少 fill-info 状态');
    assert.ok(PAGE_SOURCE.includes("'confirm'"), '缺少 confirm 状态');
    assert.ok(PAGE_SOURCE.includes("'done'"), '缺少 done 状态');
  });

  it('非活跃状态（select-store）渲染门店列表', () => {
    assert.ok(PAGE_SOURCE.includes('select-store'), 'select-store 步骤条件');
    assert.ok(PAGE_SOURCE.includes('预约看店'), '页面标题');
  });

  it('select-slot 步骤包含日期和时段选择', () => {
    assert.ok(PAGE_SOURCE.includes('select-slot'), 'select-slot 步骤条件');
    assert.ok(PAGE_SOURCE.includes('选择日期'), '日期选择器');
    assert.ok(PAGE_SOURCE.includes('选择时段'), '时段选择器');
    assert.ok(PAGE_SOURCE.includes('下一步'), '下一步按钮');
  });

  it('fill-info 步骤包含表单输入', () => {
    assert.ok(PAGE_SOURCE.includes('fill-info'), 'fill-info 步骤条件');
    assert.ok(PAGE_SOURCE.includes('联系人姓名'), '姓名输入');
    assert.ok(PAGE_SOURCE.includes('联系电话'), '电话输入');
    assert.ok(PAGE_SOURCE.includes('预约人数'), '人数选择');
  });

  it('done 步骤展示成功结果', () => {
    assert.ok(PAGE_SOURCE.includes('预约提交成功'), '成功提示');
    assert.ok(PAGE_SOURCE.includes('继续预约'), '重置按钮');
  });

  it('包含状态对应的 React hooks', () => {
    assert.ok(PAGE_SOURCE.includes('useState'), '缺少 useState');
    assert.ok(PAGE_SOURCE.includes('useCallback'), '缺少 useCallback');
    assert.ok(PAGE_SOURCE.includes('useMemo'), '缺少 useMemo');
  });

  // ---- 反例 ----
  describe('反例 — 防御检查', () => {
    it('提交中 disabled 状态存在', () => {
      assert.ok(PAGE_SOURCE.includes('submitting'), '缺少 submitting 状态');
    });

    it('错误提示展示逻辑存在', () => {
      assert.ok(PAGE_SOURCE.includes('errors'), '缺少 errors 状态');
      assert.ok(PAGE_SOURCE.includes('error'), '错误渲染区');
    });

    it('时段不可用时 disabled 处理', () => {
      assert.ok(PAGE_SOURCE.includes('disabled'), 'disabled 属性');
      assert.ok(PAGE_SOURCE.includes('bookable'), '可预约判断');
    });
  });

  // ---- 边界 ----
  describe('边界', () => {
    it('预约人数含 min=1 max=MAX_GUESTS_PER_BOOKING 限制', () => {
      assert.ok(PAGE_SOURCE.includes('Math.max(1,'), '最小值限制');
      assert.ok(PAGE_SOURCE.includes('MAX_GUESTS_PER_BOOKING'), '最大值引用');
    });

    it('电话号码限制11位', () => {
      assert.ok(PAGE_SOURCE.includes('maxLength'), 'maxLength 属性');
      assert.ok(PAGE_SOURCE.includes('11'), '11位限制');
    });

    it('手机号 input 使用数字键盘提示', () => {
      assert.ok(PAGE_SOURCE.includes('contactPhone'), 'contactPhone 字段');
    });
  });
});
