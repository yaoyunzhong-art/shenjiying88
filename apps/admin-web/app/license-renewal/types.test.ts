/**
 * Test for license-renewal type definitions
 */
import { describe, it } from 'node:test';
import assert from 'node:assert';
import type { RenewalStrategy, RenewalRecord, RenewalQueryDto, RenewalCreateDto } from './types';

describe('license-renewal types', () => {
  it('RenewalStrategy shape', () => {
    const strategy: RenewalStrategy = {
      id: '1',
      name: 'Basic',
      description: 'Basic plan',
      price: 199,
      duration: 12,
      durationUnit: 'month',
      maxUsers: 10,
      maxStores: 1,
      features: ['basic'],
      isActive: true,
      createdAt: '2025-01-01T00:00:00Z',
      updatedAt: '2025-01-01T00:00:00Z',
    };
    assert.strictEqual(strategy.name, 'Basic');
    assert.strictEqual(strategy.durationUnit, 'month');
    assert.strictEqual(strategy.features?.length, 1);
  });

  it('RenewalStrategy with empty features', () => {
    const strategy: RenewalStrategy = {
      id: '2',
      name: 'Minimal',
      price: 0,
      duration: 1,
      durationUnit: 'month',
      maxUsers: 1,
      maxStores: 0,
      isActive: false,
      createdAt: '2025-06-01T00:00:00Z',
      updatedAt: '2025-06-01T00:00:00Z',
    };
    assert.strictEqual(strategy.features, undefined);
    assert.strictEqual(strategy.description, undefined);
    assert.strictEqual(strategy.isActive, false);
  });

  it('RenewalRecord shape', () => {
    const record: RenewalRecord = {
      id: 'r1',
      licenseId: 'l1',
      licenseName: 'License 1',
      strategyId: 's1',
      strategyName: 'Pro',
      amount: 299,
      status: 'success',
      autoRenewal: true,
      renewedAt: '2025-06-01T00:00:00Z',
      expiresAt: '2026-06-01T00:00:00Z',
    };
    assert.strictEqual(record.status, 'success');
    assert.strictEqual(record.autoRenewal, true);
  });

  it('RenewalRecord with failed status', () => {
    const record: RenewalRecord = {
      id: 'r2',
      licenseId: 'l1',
      licenseName: 'License 2',
      strategyId: 's2',
      strategyName: 'Pro',
      amount: 299,
      status: 'failed',
      autoRenewal: false,
      renewedAt: '2025-06-01T00:00:00Z',
      expiresAt: '2026-06-01T00:00:00Z',
    };
    assert.strictEqual(record.status, 'failed');
    assert.strictEqual(record.autoRenewal, false);
  });

  it('RenewalRecord with pending status and zero amount', () => {
    const record: RenewalRecord = {
      id: 'r3',
      licenseId: 'l3',
      licenseName: 'Trial',
      strategyId: 's3',
      strategyName: 'Trial',
      amount: 0,
      status: 'pending',
      autoRenewal: false,
      renewedAt: '2025-06-01T00:00:00Z',
      expiresAt: '2025-07-01T00:00:00Z',
    };
    assert.strictEqual(record.amount, 0);
    assert.strictEqual(record.status, 'pending');
  });

  it('RenewalQueryDto supports date range', () => {
    const query: RenewalQueryDto = {
      page: 1,
      pageSize: 20,
      status: 'success',
      licenseName: 'Test',
      dateRange: ['2025-01-01', '2025-12-31'],
    };
    assert.strictEqual(query.dateRange?.[0], '2025-01-01');
    assert.strictEqual(query.pageSize, 20);
  });

  it('RenewalQueryDto with only required fields', () => {
    const query: RenewalQueryDto = {
      page: 1,
      pageSize: 10,
    };
    assert.strictEqual(query.status, undefined);
    assert.strictEqual(query.licenseName, undefined);
    assert.strictEqual(query.dateRange, undefined);
  });

  it('RenewalQueryDto with single date', () => {
    const query: RenewalQueryDto = {
      page: 1,
      pageSize: 10,
      dateRange: ['2025-06-01'],
    };
    assert.strictEqual(query.dateRange?.length, 1);
    assert.strictEqual(query.dateRange?.[0], '2025-06-01');
  });

  it('RenewalCreateDto with all fields', () => {
    const dto: RenewalCreateDto = {
      name: 'Enterprise',
      description: 'Enterprise plan',
      price: 999,
      duration: 12,
      durationUnit: 'year',
      maxUsers: 1000,
      maxStores: 50,
      features: ['basic', 'analytics', 'api'],
      isActive: true,
    };
    assert.strictEqual(dto.price, 999);
    assert.strictEqual(dto.durationUnit, 'year');
  });

  it('RenewalCreateDto minimal fields', () => {
    const dto: RenewalCreateDto = {
      name: 'Basic',
      price: 99,
      duration: 1,
      durationUnit: 'month',
      maxUsers: 5,
      maxStores: 1,
      isActive: false,
    };
    assert.strictEqual(dto.features, undefined);
    assert.strictEqual(dto.description, undefined);
  });

  it('RenewalCreateDto with day duration unit', () => {
    const dto: RenewalCreateDto = {
      name: 'Daily',
      price: 5,
      duration: 7,
      durationUnit: 'day',
      maxUsers: 1,
      maxStores: 0,
      isActive: true,
    };
    assert.strictEqual(dto.durationUnit, 'day');
    assert.strictEqual(dto.duration, 7);
  });

  it('RenewalCreateDto with zero price (free plan)', () => {
    const dto: RenewalCreateDto = {
      name: 'Free',
      price: 0,
      duration: 30,
      durationUnit: 'day',
      maxUsers: 3,
      maxStores: 0,
      isActive: true,
    };
    assert.strictEqual(dto.price, 0);
  });

  it('RenewalStrategy with year duration unit', () => {
    const strategy: RenewalStrategy = {
      id: '3',
      name: 'Annual',
      price: 999,
      duration: 1,
      durationUnit: 'year',
      maxUsers: 100,
      maxStores: 10,
      features: ['basic', 'premium', 'support'],
      isActive: true,
      createdAt: '2025-01-01T00:00:00Z',
      updatedAt: '2025-01-01T00:00:00Z',
    };
    assert.strictEqual(strategy.durationUnit, 'year');
    assert.strictEqual(strategy.price, 999);
    assert.strictEqual(strategy.features?.length, 3);
  });
});
