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
});
