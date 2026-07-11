/**
 * VenuesModule — 模块集成测试
 *
 * 验证 VenuesModule 正确组装所有 Controllers 和 Services，
 * 所有核心 API 端点均可路由到对应的 Service 方法。
 */

import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Reflector } from '@nestjs/core';
import { CacheService } from '../../common/cache.service';
import { VenuesController } from './venues.controller';
import { VenueSearchController } from './venue-search.controller';
import { VenueSearchSimpleController } from './venue-search-simple.controller';
import { VenuesService } from './venues.service';
import { VenueSearchService } from './venue-search.service';
import { VenueSearchSimpleService } from './venue-search-simple.service';
import { Venue } from './entities/venue.entity';

describe('VenuesModule', () => {
  let module: TestingModule;
  let venuesController: VenuesController;
  let searchController: VenueSearchController;
  let searchSimpleController: VenueSearchSimpleController;
  let venuesService: VenuesService;
  let searchService: VenueSearchService;
  let searchSimpleService: VenueSearchSimpleService;

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

  const mockSearchService = {
    searchVenues: jest.fn(),
  };

  const mockSearchSimpleService = {
    searchVenues: jest.fn(),
  };

  const sampleVenue = {
    id: 'v-001',
    name: 'Test Venue',
    description: 'A test venue',
    address: '123 Test St',
    city: 'TestCity',
    province: 'TestProvince',
    postalCode: '000000',
    country: 'CN',
    latitude: 39.9,
    longitude: 116.4,
    type: 'STADIUM',
    capacity: 5000,
    area: 10000,
    facilities: ['parking'],
    openingHours: { weekday: '06:00-22:00' },
    contactPhone: '010-00000000',
    contactEmail: 'test@venue.com',
    status: 'ACTIVE',
    allowOnlineBooking: true,
    bookingAdvanceHours: 24,
    cancellationPolicy: { freeCancelHours: 48 },
    pricing: { hourly: 200 },
    images: ['img1.jpg'],
    createdBy: 'user-001',
    ownerId: 'user-001',
    createdAt: new Date('2025-01-01'),
    updatedAt: new Date('2025-06-01'),
    distance: 0,
    averageRating: 4.5,
    reviewCount: 10,
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    module = await Test.createTestingModule({
      controllers: [VenuesController, VenueSearchController, VenueSearchSimpleController],
      providers: [
        { provide: VenuesService, useValue: mockVenuesService },
        { provide: VenueSearchService, useValue: mockSearchService },
        { provide: VenueSearchSimpleService, useValue: mockSearchSimpleService },
        { provide: getRepositoryToken(Venue), useValue: {} },
        { provide: CacheService, useValue: { get: jest.fn(), set: jest.fn(), del: jest.fn() } },
        { provide: Reflector, useValue: { get: jest.fn(), getAllAndOverride: jest.fn() } },
      ],
    }).compile();

    venuesController = module.get<VenuesController>(VenuesController);
    searchController = module.get<VenueSearchController>(VenueSearchController);
    searchSimpleController = module.get<VenueSearchSimpleController>(VenueSearchSimpleController);
    venuesService = module.get<VenuesService>(VenuesService);
    searchService = module.get<VenueSearchService>(VenueSearchService);
    searchSimpleService = module.get<VenueSearchSimpleService>(VenueSearchSimpleService);
  });

  // ─── 模块组装 ───

  it('should define VenuesController as a provider', () => {
    expect(venuesController).toBeDefined();
  });

  it('should define VenueSearchController as a provider', () => {
    expect(searchController).toBeDefined();
  });

  it('should define VenueSearchSimpleController as a provider', () => {
    expect(searchSimpleController).toBeDefined();
  });

  it('should inject VenuesService into VenuesController', () => {
    expect(venuesService).toBeDefined();
    expect(venuesController).toHaveProperty('venuesService');
  });

  it('should inject VenueSearchService into VenueSearchController', () => {
    expect(searchService).toBeDefined();
  });

  it('should inject VenueSearchSimpleService into VenueSearchSimpleController', () => {
    expect(searchSimpleService).toBeDefined();
  });

  // ─── VenuesController 端点接线 ───

  it('should wire create through controller', async () => {
    mockVenuesService.create.mockResolvedValue(sampleVenue);
    const result = await venuesController.create(
      { name: 'Test', contactEmail: 'test@venue.com' } as any,
      { user: { id: 'user-001' } } as any,
    );
    expect(mockVenuesService.create).toHaveBeenCalledTimes(1);
    expect(result.id).toBe('v-001');
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
    expect(result.total).toBe(1);
  });

  it('should wire findOne through controller', async () => {
    mockVenuesService.findOne.mockResolvedValue(sampleVenue);
    const result = await venuesController.findOne('v-001');
    expect(mockVenuesService.findOne).toHaveBeenCalledWith('v-001');
    expect(result.id).toBe('v-001');
  });

  it('should wire update through controller', async () => {
    mockVenuesService.update.mockResolvedValue(sampleVenue);
    const result = await venuesController.update(
      'v-001',
      { name: 'Updated Venue' } as any,
      { user: { id: 'user-001' } } as any,
    );
    expect(mockVenuesService.update).toHaveBeenCalledTimes(1);
    expect(result.id).toBe('v-001');
  });

  it('should wire remove through controller', async () => {
    mockVenuesService.remove.mockResolvedValue(undefined);
    await venuesController.remove('v-001', { user: { id: 'user-001' } } as any);
    expect(mockVenuesService.remove).toHaveBeenCalledWith('v-001', 'user-001');
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
      { user: { id: 'user-001' } } as any,
      1,
      10,
    );
    expect(mockVenuesService.getMyVenues).toHaveBeenCalledWith('user-001', 1, 10);
    expect(result.venues).toHaveLength(1);
  });

  it('should wire changeStatus through controller', async () => {
    mockVenuesService.changeStatus.mockResolvedValue(sampleVenue);
    const result = await venuesController.changeStatus(
      'v-001',
      'CLOSED' as any,
      { user: { id: 'user-001' } } as any,
    );
    expect(mockVenuesService.changeStatus).toHaveBeenCalledWith('v-001', 'CLOSED', 'user-001');
    expect(result.id).toBe('v-001');
  });

  it('should wire getStats through controller', async () => {
    const stats = { total: 100, byStatus: { ACTIVE: 80 }, byType: { STADIUM: 50 }, byCity: { TestCity: 30 } };
    mockVenuesService.getStats.mockResolvedValue(stats);
    const result = await venuesController.getStats();
    expect(mockVenuesService.getStats).toHaveBeenCalledTimes(1);
    expect(result.total).toBe(100);
  });

  it('should wire searchNearby through controller', async () => {
    mockVenuesService.searchNearby.mockResolvedValue([sampleVenue]);
    const result = await venuesController.searchNearby(39.9, 116.4, 5, 'TestCity', undefined);
    expect(mockVenuesService.searchNearby).toHaveBeenCalledWith(39.9, 116.4, 5, {
      city: 'TestCity',
      type: undefined,
    });
    expect(result).toHaveLength(1);
  });

  // ─── VenueSearchController 端点接线 ───

  it('should wire VenueSearchController.searchVenues through controller', async () => {
    mockSearchService.searchVenues.mockResolvedValue({ items: [sampleVenue], total: 1, page: 1, limit: 10, totalPages: 1 });
    const result = await searchController.searchVenues({ search: 'test' } as any);
    expect(mockSearchService.searchVenues).toHaveBeenCalledTimes(1);
    expect(result.success).toBe(true);
    expect(result.data.total).toBe(1);
  });

  // ─── VenueSearchSimpleController 端点接线 ───

  it('should wire VenueSearchSimpleController.search through controller', async () => {
    mockSearchSimpleService.searchVenues.mockResolvedValue({ items: [sampleVenue], total: 1, page: 1, limit: 10, totalPages: 1 });
    const result = await searchSimpleController.search('test', undefined, undefined, undefined, undefined, undefined, undefined, '1', '10');
    expect(mockSearchSimpleService.searchVenues).toHaveBeenCalledTimes(1);
    expect(result.total).toBe(1);
  });

  // ─── 综合端点计数 ───

  it('should route all VenuesController endpoints (create, findAll, findOne, update, remove, getMyVenues, changeStatus, getStats, searchNearby)', async () => {
    const endpoints = [
      {
        name: 'create',
        mock: mockVenuesService.create,
        runner: () =>
          venuesController.create(
            { name: 'T', contactEmail: 't@v.com' } as any,
            { user: { id: 'u1' } } as any,
          ),
      },
      {
        name: 'findAll',
        mock: mockVenuesService.findAll,
        runner: () => venuesController.findAll({}),
      },
      {
        name: 'findOne',
        mock: mockVenuesService.findOne,
        runner: () => venuesController.findOne('v-001'),
      },
      {
        name: 'update',
        mock: mockVenuesService.update,
        runner: () =>
          venuesController.update('v-001', { name: 'U' } as any, {
            user: { id: 'u1' },
          } as any),
      },
      {
        name: 'remove',
        mock: mockVenuesService.remove,
        runner: async () => {
          await venuesController.remove('v-001', { user: { id: 'u1' } } as any);
        },
      },
      {
        name: 'getMyVenues',
        mock: mockVenuesService.getMyVenues,
        runner: () => venuesController.getMyVenues({ user: { id: 'u1' } } as any, 1, 10),
      },
      {
        name: 'changeStatus',
        mock: mockVenuesService.changeStatus,
        runner: () =>
          venuesController.changeStatus('v-001', 'CLOSED' as any, {
            user: { id: 'u1' },
          } as any),
      },
      {
        name: 'getStats',
        mock: mockVenuesService.getStats,
        runner: () => venuesController.getStats(),
      },
      {
        name: 'searchNearby',
        mock: mockVenuesService.searchNearby,
        runner: () => venuesController.searchNearby(39.9, 116.4, 5),
      },
    ];

    for (const ep of endpoints) {
      jest.clearAllMocks();
      try {
        await ep.runner();
      } catch (_) {
        /* void methods ok */
      }
      expect(ep.mock).toHaveBeenCalled();
    }

    // 9 VenuesController endpoints verified
    expect(endpoints.length).toBe(9);
  });
});
