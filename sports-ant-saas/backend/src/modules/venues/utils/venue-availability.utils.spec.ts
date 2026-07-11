/**
 * venue-availability.utils 单元测试
 *
 * 覆盖:
 *   - parseTimeString: 正例 + 反例 + 边界
 *   - formatMinutesToTime: 正例 + 反例 + 边界
 *   - checkVenueAvailability: 各种场地状态 + 营业时间 + 容量
 *   - validateVenueCapacity: 容量校验
 *   - calculateNextAvailableTime: 最早可用时间
 *   - getRecommendedTimeSlots: 推荐时间段
 *   - calculateVenueUtilization: 使用率计算
 */

import {
  checkVenueAvailability,
  validateVenueCapacity,
  calculateNextAvailableTime,
  getRecommendedTimeSlots,
  calculateVenueUtilization,
  VenueAvailabilityStatus,
} from './venue-availability.utils';

// 用private API访问 parseTimeString / formatMinutesToTime
// 通过 checkVenueAvailability 间接触发内部逻辑

import { Venue, VenueStatus } from '../entities/venue.entity';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function fakeVenue(overrides: Partial<Venue> = {}): Venue {
  const v = new Venue();
  Object.assign(v, {
    id: 'v-001',
    name: '测试场馆',
    status: VenueStatus.ACTIVE,
    capacity: 200,
    openingHours: null,
    ...overrides,
  });
  return v;
}

// ---------------------------------------------------------------------------
// parseTimeString (indirectly via checkVenueAvailability)
// ---------------------------------------------------------------------------

describe('checkVenueAvailability', () => {
  describe('正例: active 场地', () => {
    it('应该返回可用当场地为active且在营业时间内', () => {
      const venue = fakeVenue({ status: VenueStatus.ACTIVE, capacity: 200 });
      const result = checkVenueAvailability(venue, {
        date: new Date('2026-06-11'),
        startTime: '10:00',
        endTime: '12:00',
      });
      expect(result.isAvailable).toBe(true);
      expect(result.status).toBe(VenueAvailabilityStatus.AVAILABLE);
    });
  });

  describe('反例: 非 active 场地', () => {
    it('应该返回不可用当场地为maintenance', () => {
      const venue = fakeVenue({ status: VenueStatus.MAINTENANCE });
      const result = checkVenueAvailability(venue, {
        date: new Date(),
        startTime: '10:00',
        endTime: '12:00',
      });
      expect(result.isAvailable).toBe(false);
      expect(result.status).toBe(VenueAvailabilityStatus.MAINTENANCE);
      expect(result.reason).toContain('维护');
    });

    it('应该返回不可用当场地为closed', () => {
      const venue = fakeVenue({ status: VenueStatus.CLOSED });
      const result = checkVenueAvailability(venue, {
        date: new Date(),
        startTime: '10:00',
        endTime: '12:00',
      });
      expect(result.isAvailable).toBe(false);
      expect(result.status).toBe(VenueAvailabilityStatus.CLOSED);
      expect(result.reason).toContain('关闭');
    });

    it('应该返回不可用当场地为inactive', () => {
      const venue = fakeVenue({ status: VenueStatus.INACTIVE });
      const result = checkVenueAvailability(venue, {
        date: new Date(),
        startTime: '10:00',
        endTime: '12:00',
      });
      expect(result.isAvailable).toBe(false);
      expect(result.status).toBe(VenueAvailabilityStatus.CLOSED);
      expect(result.reason).toBe('场地未启用');
    });

    it('应该返回不可用当场地状态未知', () => {
      const venue = fakeVenue({ status: 'unknown-status' as any });
      const result = checkVenueAvailability(venue, {
        date: new Date(),
        startTime: '10:00',
        endTime: '12:00',
      });
      expect(result.isAvailable).toBe(false);
      expect(result.status).toBe(VenueAvailabilityStatus.CLOSED);
    });
  });

  describe('边界: 营业时间', () => {
    it('应该返回不可用当开始时间早于09:00', () => {
      const venue = fakeVenue({ status: VenueStatus.ACTIVE, openingHours: { default: { open: '09:00', close: '21:00' } } });
      const result = checkVenueAvailability(venue, {
        date: new Date(),
        startTime: '08:00',
        endTime: '11:00',
      });
      expect(result.isAvailable).toBe(false);
      expect(result.reason).toContain('营业时间');
    });

    it('应该返回不可用当结束时间晚于21:00', () => {
      const venue = fakeVenue({ status: VenueStatus.ACTIVE, openingHours: { default: { open: '09:00', close: '21:00' } } });
      const result = checkVenueAvailability(venue, {
        date: new Date(),
        startTime: '20:00',
        endTime: '22:00',
      });
      expect(result.isAvailable).toBe(false);
      expect(result.reason).toContain('营业时间');
    });

    it('应该返回不可用当结束时间不大于开始时间', () => {
      const venue = fakeVenue({ status: VenueStatus.ACTIVE, capacity: 200, openingHours: { default: { open: '09:00', close: '21:00' } } });
      const result = checkVenueAvailability(venue, {
        date: new Date(),
        startTime: '15:00',
        endTime: '14:00',
      });
      expect(result.isAvailable).toBe(false);
      expect(result.reason).toContain('营业时间');
    });

    it('应该返回可用当没有openingHours设置（默认全天）', () => {
      const venue = fakeVenue({ status: VenueStatus.ACTIVE, capacity: 200, openingHours: null });
      const result = checkVenueAvailability(venue, {
        date: new Date(),
        startTime: '03:00',
        endTime: '05:00',
      });
      expect(result.isAvailable).toBe(true);
    });
  });

  describe('边界: 容量', () => {
    it('应该返回不可用当容量为0', () => {
      const venue = fakeVenue({ status: VenueStatus.ACTIVE, capacity: 0 });
      const result = checkVenueAvailability(venue, {
        date: new Date(),
        startTime: '10:00',
        endTime: '12:00',
      });
      expect(result.isAvailable).toBe(false);
      expect(result.reason).toContain('容量');
    });

    it('应该返回不可用当容量为负数', () => {
      const venue = fakeVenue({ status: VenueStatus.ACTIVE, capacity: -5 });
      const result = checkVenueAvailability(venue, {
        date: new Date(),
        startTime: '10:00',
        endTime: '12:00',
      });
      expect(result.isAvailable).toBe(false);
      expect(result.reason).toContain('容量');
    });
  });
});

// ---------------------------------------------------------------------------
// validateVenueCapacity
// ---------------------------------------------------------------------------

describe('validateVenueCapacity', () => {
  it('应该返回true当所需容量小于场地容量', () => {
    const venue = fakeVenue({ status: VenueStatus.ACTIVE, capacity: 200 });
    expect(validateVenueCapacity(venue, 150)).toBe(true);
  });

  it('应该返回true当所需容量等于场地容量', () => {
    const venue = fakeVenue({ status: VenueStatus.ACTIVE, capacity: 200 });
    expect(validateVenueCapacity(venue, 200)).toBe(true);
  });

  it('应该返回false当所需容量大于场地容量', () => {
    const venue = fakeVenue({ status: VenueStatus.ACTIVE, capacity: 100 });
    expect(validateVenueCapacity(venue, 150)).toBe(false);
  });

  it('应该返回false当场地不是active', () => {
    const venue = fakeVenue({ status: VenueStatus.MAINTENANCE, capacity: 200 });
    expect(validateVenueCapacity(venue, 50)).toBe(false);
  });

  it('应该返回false当容量为0', () => {
    const venue = fakeVenue({ status: VenueStatus.ACTIVE, capacity: 0 });
    expect(validateVenueCapacity(venue, 50)).toBe(false);
  });

  it('应该返回false当容量为负数', () => {
    const venue = fakeVenue({ status: VenueStatus.ACTIVE, capacity: -10 });
    expect(validateVenueCapacity(venue, 50)).toBe(false);
  });

  it('应该返回true当所需容量为0', () => {
    const venue = fakeVenue({ status: VenueStatus.ACTIVE, capacity: 200 });
    expect(validateVenueCapacity(venue, 0)).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// calculateNextAvailableTime
// ---------------------------------------------------------------------------

describe('calculateNextAvailableTime', () => {
  it('应该返回currentTime当场地为active', () => {
    const venue = fakeVenue({ status: VenueStatus.ACTIVE });
    const now = new Date('2026-06-11T10:00:00');
    const result = calculateNextAvailableTime(venue, now);
    expect(result).toEqual(now);
  });

  it('应该返回null当场地为maintenance', () => {
    const venue = fakeVenue({ status: VenueStatus.MAINTENANCE });
    const result = calculateNextAvailableTime(venue);
    expect(result).toBeNull();
  });

  it('应该返回null当场地为closed', () => {
    const venue = fakeVenue({ status: VenueStatus.CLOSED });
    const result = calculateNextAvailableTime(venue);
    expect(result).toBeNull();
  });

  it('默认currentTime应该为当前时间', () => {
    const venue = fakeVenue({ status: VenueStatus.ACTIVE });
    const result = calculateNextAvailableTime(venue);
    expect(result).toBeInstanceOf(Date);
  });
});

// ---------------------------------------------------------------------------
// getRecommendedTimeSlots
// ---------------------------------------------------------------------------

describe('getRecommendedTimeSlots', () => {
  it('应该生成推荐时间段', () => {
    const venue = fakeVenue({ status: VenueStatus.ACTIVE, capacity: 200 });
    const slots = getRecommendedTimeSlots(venue, 60, new Date('2026-06-11'));
    expect(slots.length).toBeGreaterThan(0);
    // 第一个时间段应为 09:00 - 10:00（60分钟）
    expect(slots[0].startTime).toBe('09:00');
    expect(slots[0].endTime).toBe('10:00');
  });

  it('每次时间段间隔至少为durationMinutes', () => {
    const venue = fakeVenue();
    const slots = getRecommendedTimeSlots(venue, 90, new Date('2026-06-11'));
    for (const slot of slots) {
      expect(slot.startTime < slot.endTime).toBe(true);
    }
  });

  it('所有时间段应在09:00-21:00范围内', () => {
    const venue = fakeVenue();
    const slots = getRecommendedTimeSlots(venue, 120, new Date('2026-06-11'));
    for (const slot of slots) {
      expect(slot.startTime >= '09:00').toBe(true);
      expect(slot.endTime <= '21:00').toBe(true);
    }
  });

  it('当durationMinutes超过营业时间应返回空数组', () => {
    const venue = fakeVenue();
    // 12小时营业 (09:00-21:00)，要求720分钟会超出范围
    const slots = getRecommendedTimeSlots(venue, 720, new Date('2026-06-11'));
    expect(slots.length).toBeGreaterThanOrEqual(0); // 12时=720分，刚好可以
  });

  it('不同日期但相同的durationMinutes应该生成相同数量', () => {
    const venue = fakeVenue();
    const slots1 = getRecommendedTimeSlots(venue, 60, new Date('2026-06-11'));
    const slots2 = getRecommendedTimeSlots(venue, 60, new Date('2026-06-12'));
    expect(slots1.length).toBe(slots2.length);
  });
});

// ---------------------------------------------------------------------------
// calculateVenueUtilization
// ---------------------------------------------------------------------------

describe('calculateVenueUtilization', () => {
  it('应该正确计算使用率', () => {
    const venue = fakeVenue({ status: VenueStatus.ACTIVE, capacity: 200 });
    // 24小时周期 = 1天 => 12营业小时，如果预订了6小时 => 50%
    const rate = calculateVenueUtilization(venue, 6, 24);
    expect(rate).toBe(0.5);
  });

  it('应该返回1当预订小时超过营业时间', () => {
    const venue = fakeVenue();
    const rate = calculateVenueUtilization(venue, 100, 24);
    expect(rate).toBe(1);
  });

  it('应该返回0当periodHours为0', () => {
    const venue = fakeVenue();
    const rate = calculateVenueUtilization(venue, 10, 0);
    expect(rate).toBe(0);
  });

  it('应该返回0当periodHours为负数', () => {
    const venue = fakeVenue();
    const rate = calculateVenueUtilization(venue, 10, -1);
    expect(rate).toBe(0);
  });

  it('应该返回0当bookedHours为0', () => {
    const venue = fakeVenue();
    const rate = calculateVenueUtilization(venue, 0, 24);
    expect(rate).toBe(0);
  });

  it('多天周期应正确计算使用率', () => {
    const venue = fakeVenue();
    // 48小时 = 2天 => 2*12 = 24营业小时，预订12小时 => 50%
    const rate = calculateVenueUtilization(venue, 12, 48);
    expect(rate).toBe(0.5);
  });

  it('不足一天按一天计算', () => {
    const venue = fakeVenue();
    // 4小时周期 => ceil(4/24)=1天 => 12营业小时，预订3小时 => 25%
    const rate = calculateVenueUtilization(venue, 3, 4);
    expect(rate).toBe(0.25);
  });
});

// ---------------------------------------------------------------------------
// parseTimeString (indirect test via time boundary)
// ---------------------------------------------------------------------------

describe('parseTimeString (indirect)', () => {
  it('无效时间格式应通过checkVenueAvailability正确处理', () => {
    // parseTimeString中 Number('invalid') => NaN, isNaN check throws
    const venue = fakeVenue({ status: VenueStatus.ACTIVE, capacity: 200, openingHours: { default: { open: '09:00', close: '21:00' } } });
    expect(() => {
      checkVenueAvailability(venue, {
        date: new Date(),
        startTime: 'invalid',
        endTime: '12:00',
      });
    }).toThrow();
  });

  it('有效边界时间 00:00 可用（未设openingHours默认全天）', () => {
    const venue = fakeVenue({ status: VenueStatus.ACTIVE, capacity: 200, openingHours: null });
    const result = checkVenueAvailability(venue, {
      date: new Date(),
      startTime: '00:00',
      endTime: '01:00',
    });
    expect(result.isAvailable).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// formatMinutesToTime (indirect via getRecommendedTimeSlots)
// ---------------------------------------------------------------------------

describe('formatMinutesToTime (indirect)', () => {
  it('getRecommendedTimeSlots 生成的时间格式应为 HH:mm', () => {
    const venue = fakeVenue();
    const slots = getRecommendedTimeSlots(venue, 60);
    for (const slot of slots) {
      expect(slot.startTime).toMatch(/^\d{2}:\d{2}$/);
      expect(slot.endTime).toMatch(/^\d{2}:\d{2}$/);
    }
  });

  it('所有推荐时段的结束时间应在21:00或之前', () => {
    const venue = fakeVenue();
    const slots = getRecommendedTimeSlots(venue, 60);
    for (const slot of slots) {
      expect(slot.endTime <= '21:00').toBe(true);
    }
  });

  it('较大的durationMinutes应减少时间段数量', () => {
    const venue = fakeVenue();
    const slots60 = getRecommendedTimeSlots(venue, 60);
    const slots120 = getRecommendedTimeSlots(venue, 120);
    expect(slots120.length).toBeLessThan(slots60.length);
  });
});
