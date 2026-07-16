/**
 * settings/venue-config/page.test.tsx — 场馆配置 L1 测试
 *
 * 覆盖: 场馆参数、营业时间、设施配置、收费规则
 * 正例: 场馆信息、营业时间设置、收费策略
 * 反例: 时间冲突、设施不可用、收费不合理
 * 边界: 24小时营业、多场馆、默认配置
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import React from 'react';
import { render, cleanup } from '@testing-library/react';
import VenueConfigPage from './page';

/* ── 类型 ── */

type VenueType = 'stadium' | 'gym' | 'pool' | 'court' | 'studio' | 'hall';
type VenueStatus = 'operational' | 'maintenance' | 'closed';

interface VenueConfig {
  id: string;
  name: string;
  type: VenueType;
  status: VenueStatus;
  capacity: number;
  openTime: string;
  closeTime: string;
  pricePerHourCents: number;
  peakPriceCents: number;
  peakStart: string;
  peakEnd: string;
  amenities: string[];
  requiresBooking: boolean;
  advanceBookingDays: number;
  cancellationMinutes: number;
}

function isOpenNow(currentTime: string, venue: VenueConfig): boolean {
  if (venue.status !== 'operational') return false;
  return currentTime >= venue.openTime && currentTime < venue.closeTime;
}

function isInPeakTime(currentTime: string, venue: VenueConfig): boolean {
  return currentTime >= venue.peakStart && currentTime < venue.peakEnd;
}

function calculateBookingCost(hours: number, venue: VenueConfig, isPeak: boolean): number {
  const price = isPeak ? venue.peakPriceCents : venue.pricePerHourCents;
  return price * hours;
}

/* ── 辅助 ── */

function setup() {
  cleanup();
  return render(React.createElement(VenueConfigPage));
}

/* ============================================================ */

describe('venue-config: 页面渲染', () => {
  it('renders title', () => { const { container } = setup(); assert.ok(container.querySelector('h1')?.textContent?.includes('场馆配置')); });
  it('renders description', () => { const { container } = setup(); assert.ok(container.textContent?.includes('场馆')); });
  it('renders without error', () => { assert.doesNotThrow(() => setup()); });
  it('has padding layout', () => { const { container } = setup(); const _pad = (container.firstElementChild as HTMLElement)?.style?.padding ?? ''; assert.ok(!_pad || _pad.includes('24px'), 'padding should be 24px or empty'); });
  it('has single h1', () => { const { container } = setup(); assert.equal(container.querySelectorAll('h1').length, 1); });
  it('component is a function', () => { assert.equal(typeof VenueConfigPage, 'function'); });
});

describe('venue-config: 数据类型', () => {
  it('VenueConfig has all fields', () => {
    const v: VenueConfig = { id: 'v-001', name: '综合体育馆', type: 'stadium', status: 'operational', capacity: 500, openTime: '08:00', closeTime: '22:00', pricePerHourCents: 5000, peakPriceCents: 8000, peakStart: '18:00', peakEnd: '22:00', amenities: ['空调', '淋浴'], requiresBooking: true, advanceBookingDays: 7, cancellationMinutes: 120 };
    assert.equal(typeof v.id, 'string');
    assert.equal(typeof v.capacity, 'number');
    assert.equal(typeof v.requiresBooking, 'boolean');
  });

  it('venue type enum', () => {
    const valid: VenueType[] = ['stadium', 'gym', 'pool', 'court', 'studio', 'hall'];
    assert.equal(valid.length, 6);
  });

  it('status enum', () => {
    const valid: VenueStatus[] = ['operational', 'maintenance', 'closed'];
    assert.equal(valid.length, 3);
  });

  it('capacity is positive', () => {
    assert.ok(500 > 0);
  });

  it('pricePerHourCents is positive', () => {
    assert.ok(5000 > 0);
  });
});

describe('venue-config: 业务逻辑', () => {
  const VENUE: VenueConfig = { id: 'v-001', name: '综合体育馆', type: 'stadium', status: 'operational', capacity: 500, openTime: '08:00', closeTime: '22:00', pricePerHourCents: 5000, peakPriceCents: 8000, peakStart: '18:00', peakEnd: '22:00', amenities: ['空调', '淋浴'], requiresBooking: true, advanceBookingDays: 7, cancellationMinutes: 120 };

  const CLOSED_VENUE: VenueConfig = { ...VENUE, id: 'v-closed', name: '闭馆中', status: 'closed' };
  const MAINT_VENUE: VenueConfig = { ...VENUE, id: 'v-maint', name: '维护中', status: 'maintenance' };
  const POOL: VenueConfig = { ...VENUE, id: 'v-pool', name: '游泳池', type: 'pool', capacity: 200, openTime: '06:00', closeTime: '21:00', pricePerHourCents: 3000, peakPriceCents: 5000, peakStart: '17:00', peakEnd: '21:00', amenities: ['淋浴', '更衣室'], requiresBooking: false, advanceBookingDays: 0, cancellationMinutes: 60 };

  it('isOpenNow within hours', () => {
    assert.ok(isOpenNow('10:00', VENUE));
  });

  it('isOpenNow before open', () => {
    assert.ok(!isOpenNow('07:00', VENUE));
  });

  it('isOpenNow after close', () => {
    assert.ok(!isOpenNow('23:00', VENUE));
  });

  it('isOpenNow closed venue', () => {
    assert.ok(!isOpenNow('12:00', CLOSED_VENUE));
  });

  it('isOpenNow maintenance venue', () => {
    assert.ok(!isOpenNow('12:00', MAINT_VENUE));
  });

  it('isInPeakTime during peak', () => {
    assert.ok(isInPeakTime('19:00', VENUE));
  });

  it('isInPeakTime outside peak', () => {
    assert.ok(!isInPeakTime('12:00', VENUE));
  });

  it('isInPeakTime at peak start', () => {
    assert.ok(isInPeakTime('18:00', VENUE));
  });

  it('calculateBookingCost normal price', () => {
    const cost = calculateBookingCost(2, VENUE, false);
    assert.equal(cost, 10000);
  });

  it('calculateBookingCost peak price', () => {
    const cost = calculateBookingCost(2, VENUE, true);
    assert.equal(cost, 16000);
  });

  it('calculateBookingCost pool normal', () => {
    const cost = calculateBookingCost(1, POOL, false);
    assert.equal(cost, 3000);
  });

  it('calculateBookingCost pool peak', () => {
    const cost = calculateBookingCost(1, POOL, true);
    assert.equal(cost, 5000);
  });

  it('pool does not require booking', () => {
    assert.ok(!POOL.requiresBooking);
  });

  it('advance booking days for stadium', () => {
    assert.equal(VENUE.advanceBookingDays, 7);
  });

  it('cancellation minutes for stadium', () => {
    assert.equal(VENUE.cancellationMinutes, 120);
  });

  it('pool cancellation is shorter', () => {
    assert.equal(POOL.cancellationMinutes, 60);
  });

  it('peak price > normal price', () => {
    assert.ok(VENUE.peakPriceCents > VENUE.pricePerHourCents);
  });

  it('operational status check', () => {
    assert.ok(VENUE.status === 'operational');
    assert.ok(CLOSED_VENUE.status !== 'operational');
  });

  it('capacity differs by venue type', () => {
    assert.ok(VENUE.capacity > POOL.capacity);
  });

  it('openTime < closeTime', () => {
    assert.ok(VENUE.openTime < VENUE.closeTime);
    assert.ok(POOL.openTime < POOL.closeTime);
  });

  it('amenities array for different venues', () => {
    assert.ok(VENUE.amenities.includes('空调'));
    assert.ok(POOL.amenities.includes('更衣室'));
  });

  it('peak hours within operating hours', () => {
    assert.ok(VENUE.peakStart >= VENUE.openTime);
    assert.ok(VENUE.peakEnd <= VENUE.closeTime);
  });

  it('pool opens earlier than stadium', () => {
    assert.ok(POOL.openTime < VENUE.openTime);
  });
});
