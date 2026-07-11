/**
 * VenuesModuleSimple — 模块集成测试
 *
 * 验证 VenuesModuleSimple 正确组装 VenuesController 和 VenuesService，
 * 所有基本 CRUD 端点均可路由到对应的 Service 方法。
 */

import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Reflector } from '@nestjs/core';
import { CacheService } from '../../common/cache.service';
import { VenuesController } from './venues.controller';
import { VenuesService } from './venues.service';
import { Venue } from './entities/venue.entity';

describe('VenuesModuleSimple', () => {
  let module: TestingModule;
  let venuesController: VenuesController;
  let venuesService: VenuesService;

  const mockVenuesService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
    getMyVenues: jest.fn(),
    changeStatus: jest.fn(),
    getStats: jest.fn(),
    searchNearby: jest.fn(),
  };

  const sampleVenue = {
    id: 'v-simple-001',
    name: 'Simple Venue',
    description: 'A simplified venue',
    address: '1 Simple St',
    city: 'SimpleCity',
    province: 'SP',
    postalCode: '111111',
    country: 'CN',
    latitude: 31.2,
    longitude: 121.4,
    type: 'GYM',
    capacity: 200,
    area: 5000,
    facilities: ['locker'],
    openingHours: { weekday: '08:00-20:00' },
    contactPhone: '021-11111111',
    contactEmail: 'simple@venue.com',
    status: 'ACTIVE',
    allowOnlineBooking: true,
    bookingAdvanceHours: 12,
    cancellationPolicy: { freeCancelHours: 24 },
    pricing: { hourly: 100 },
    images: ['simple.jpg'],
    createdBy: 'user-simple',
    ownerId: 'user-simple',
    createdAt: new Date('2025-03-01'),
    updatedAt: new Date('2025-03-15'),
    distance: 0,
    averageRating: 4.0,
    reviewCount: 5,
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    module = await Test.createTestingModule({
      controllers: [VenuesController],
      providers: [
        { provide: VenuesService, useValue: mockVenuesService },
        { provide: getRepositoryToken(Venue), useValue: {} },
        { provide: CacheService, useValue: { get: jest.fn(), set: jest.fn(), del: jest.fn() } },
        { provide: Reflector, useValue: { get: jest.fn(), getAllAndOverride: jest.fn() } },
      ],
    }).compile();

    venuesController = module.get<VenuesController>(VenuesController);
    venuesService = module.get<VenuesService>(VenuesService);
  });

  // ─── 模块组装 ───

  it('should compile the module', () => {
    expect(module).toBeDefined();
  });

  it('should define VenuesController as a provider', () => {
    expect(venuesController).toBeDefined();
  });

  it('should inject VenuesService into VenuesController', () => {
    expect(venuesService).toBeDefined();
    expect(venuesController).toHaveProperty('venuesService');
  });

  // ─── CRUD 端点接线 ───

  it('should wire create through controller', async () => {
    mockVenuesService.create.mockResolvedValue(sampleVenue);
    const result = await venuesController.create(
      { name: 'Simple Venue', contactEmail: 'simple@venue.com' } as any,
      { user: { id: 'user-simple' } } as any,
    );
    expect(mockVenuesService.create).toHaveBeenCalledTimes(1);
    expect(result.id).toBe('v-simple-001');
  });

  it('should wire findAll through controller', async () => {
    mockVenuesService.findAll.mockResolvedValue({
      venues: [sampleVenue],
      total: 1,
      page: 1,
      limit: 10,
      totalPages: 1,
    });
    const result = await venuesController.findAll({});
    expect(mockVenuesService.findAll).toHaveBeenCalledTimes(1);
    expect(result.venues).toHaveLength(1);
  });

  it('should wire findOne through controller', async () => {
    mockVenuesService.findOne.mockResolvedValue(sampleVenue);
    const result = await venuesController.findOne('v-simple-001');
    expect(mockVenuesService.findOne).toHaveBeenCalledWith('v-simple-001');
    expect(result.id).toBe('v-simple-001');
  });

  it('should wire update through controller', async () => {
    mockVenuesService.update.mockResolvedValue(sampleVenue);
    const result = await venuesController.update(
      'v-simple-001',
      { name: 'Updated Simple Venue' } as any,
      { user: { id: 'user-simple' } } as any,
    );
    expect(mockVenuesService.update).toHaveBeenCalledTimes(1);
    expect(result.id).toBe('v-simple-001');
  });

  it('should wire remove through controller', async () => {
    mockVenuesService.remove.mockResolvedValue(undefined);
    await venuesController.remove('v-simple-001', { user: { id: 'user-simple' } } as any);
    expect(mockVenuesService.remove).toHaveBeenCalledWith('v-simple-001', 'user-simple');
  });

  it('should wire getMyVenues through controller', async () => {
    mockVenuesService.getMyVenues.mockResolvedValue({
      venues: [sampleVenue],
      total: 1,
      page: 1,
      limit: 10,
      totalPages: 1,
    });
    const result = await venuesController.getMyVenues(
      { user: { id: 'user-simple' } } as any,
      1,
      10,
    );
    expect(mockVenuesService.getMyVenues).toHaveBeenCalledWith('user-simple', 1, 10);
    expect(result.venues).toHaveLength(1);
  });

  it('should wire changeStatus through controller', async () => {
    mockVenuesService.changeStatus.mockResolvedValue(sampleVenue);
    const result = await venuesController.changeStatus(
      'v-simple-001',
      'MAINTENANCE' as any,
      { user: { id: 'user-simple' } } as any,
    );
    expect(mockVenuesService.changeStatus).toHaveBeenCalledWith('v-simple-001', 'MAINTENANCE', 'user-simple');
    expect(result.id).toBe('v-simple-001');
  });

  it('should wire getStats through controller', async () => {
    const stats = { total: 50, byStatus: { ACTIVE: 40 }, byType: { GYM: 25 }, byCity: { SimpleCity: 15 } };
    mockVenuesService.getStats.mockResolvedValue(stats);
    const result = await venuesController.getStats();
    expect(mockVenuesService.getStats).toHaveBeenCalledTimes(1);
    expect(result.total).toBe(50);
  });

  it('should wire searchNearby through controller', async () => {
    mockVenuesService.searchNearby.mockResolvedValue([sampleVenue]);
    const result = await venuesController.searchNearby(31.2, 121.4, 3, 'SimpleCity', undefined);
    expect(mockVenuesService.searchNearby).toHaveBeenCalledWith(31.2, 121.4, 3, {
      city: 'SimpleCity',
      type: undefined,
    });
    expect(result).toHaveLength(1);
  });
});
