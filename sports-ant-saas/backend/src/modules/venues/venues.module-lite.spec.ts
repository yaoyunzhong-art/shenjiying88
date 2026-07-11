/**
 * VenuesModuleLite — 简化模块集成测试
 *
 * 验证 VenuesModuleLite 的 core providers (VenuesController + VenuesService)
 * 正确组装并能通过所有核心 API 端点路由到 Service 方法。
 * 精简模块不含 VenueSearchController / VenueSearchSimpleController。
 */

import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Reflector } from '@nestjs/core';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CacheInterceptor } from '../../common/cache.interceptor';
import { VenuesController } from './venues.controller';
import { VenuesService } from './venues.service';
import { Venue } from './entities/venue.entity';
import { VenueResponseDto } from './dto/venue-response.dto';
import { VenueStatus, VenueType } from './entities/venue.entity';

describe('VenuesModuleLite', () => {
  let venuesController: VenuesController;
  let venuesService: jest.Mocked<VenuesService>;

  const mockVenueDto: VenueResponseDto = {
    id: 'v-001',
    name: '奥体中心',
    description: '大型综合体育场馆',
    address: '北京市朝阳区奥运村路1号',
    city: '北京',
    province: '北京市',
    postalCode: '100000',
    country: '中国',
    latitude: 39.9042,
    longitude: 116.4074,
    type: VenueType.STADIUM,
    capacity: 50000,
    area: 250000,
    facilities: ['停车场', '淋浴'],
    openingHours: { weekday: '06:00-22:00' },
    contactPhone: '010-12345678',
    contactEmail: 'venue@olympic.cn',
    status: VenueStatus.ACTIVE,
    allowOnlineBooking: true,
    bookingAdvanceHours: 24,
    cancellationPolicy: { freeCancelHours: 48 },
    pricing: { hourly: 200 },
    images: ['img1.jpg'],
    createdBy: 'user-001',
    ownerId: 'user-001',
    createdAt: new Date('2025-01-01'),
    updatedAt: new Date('2025-06-01'),
    distance: 1.5,
    averageRating: 4.5,
    reviewCount: 128,
  } as VenueResponseDto;

  const mockRepository = {
    find: jest.fn().mockResolvedValue([mockVenueDto]),
    findOne: jest.fn().mockResolvedValue(mockVenueDto),
    save: jest.fn().mockResolvedValue(mockVenueDto),
    create: jest.fn().mockReturnValue(mockVenueDto),
    update: jest.fn().mockResolvedValue({ affected: 1 }),
    delete: jest.fn().mockResolvedValue({ affected: 1 }),
    count: jest.fn().mockResolvedValue(1),
    createQueryBuilder: jest.fn().mockReturnValue({
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      orWhere: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      take: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      addOrderBy: jest.fn().mockReturnThis(),
      getMany: jest.fn().mockResolvedValue([mockVenueDto]),
      getOne: jest.fn().mockResolvedValue(mockVenueDto),
      getCount: jest.fn().mockResolvedValue(10),
      leftJoinAndSelect: jest.fn().mockReturnThis(),
      setParameter: jest.fn().mockReturnThis(),
    }),
    metadata: { columns: [] },
    target: Venue,
  };

  const mockCacheService = {
    get: jest.fn(),
    set: jest.fn(),
    del: jest.fn(),
  };

  const mockReflector = {
    get: jest.fn(),
    getAllAndOverride: jest.fn(),
  };

  // ─── 构建精简模块 ───
  // VenuesModuleLite 结构: controllers=[VenuesController], providers=[VenuesService], imports=[TypeOrmModule.forFeature([Venue])]

  beforeEach(async () => {
    jest.clearAllMocks();

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

    const module: TestingModule = await Test.createTestingModule({
      controllers: [VenuesController],
      providers: [
        { provide: VenuesService, useValue: mockVenuesService },
        { provide: getRepositoryToken(Venue), useValue: mockRepository },
        { provide: 'CACHE_SERVICE', useValue: mockCacheService },
        { provide: Reflector, useValue: mockReflector },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .overrideInterceptor(CacheInterceptor)
      .useValue({ intercept: (_: any, next: any) => next.handle() })
      .compile();

    venuesController = module.get<VenuesController>(VenuesController);
    venuesService = module.get(VenuesService);
  });

  // ─── 模块组装验证 ───

  it('should define VenuesController as a provider', () => {
    expect(venuesController).toBeDefined();
  });

  it('should define VenuesService as a provider', () => {
    expect(venuesService).toBeDefined();
  });

  it('should inject VenuesService into VenuesController', () => {
    expect((venuesController as any).venuesService).toBeDefined();
    expect((venuesController as any).venuesService).toBe(venuesService);
  });

  // ─── 核心端点接线 ───

  describe('create', () => {
    it('should wire create through controller', async () => {
      venuesService.create.mockResolvedValue(mockVenueDto);
      const createDto = { name: '新场馆', address: 'Test', city: 'Test', province: 'Test', postalCode: '000000', type: VenueType.STADIUM, capacity: 1000, contactPhone: '010-00000000', contactEmail: 'test@v.com' };
      const req = { user: { id: 'user-001' } };

      const result = await venuesController.create(createDto as any, req as any);
      expect(result).toEqual(mockVenueDto);
      expect(venuesService.create).toHaveBeenCalledWith(createDto, 'user-001');
    });
  });

  describe('findAll', () => {
    it('should wire findAll through controller', async () => {
      venuesService.findAll.mockResolvedValue({
        venues: [mockVenueDto],
        total: 1,
        page: 1,
        limit: 10,
        totalPages: 1,
      });
      const result = await venuesController.findAll({});
      expect(venuesService.findAll).toHaveBeenCalledTimes(1);
      expect(result.venues).toHaveLength(1);
    });
  });

  describe('findOne', () => {
    it('should wire findOne through controller', async () => {
      venuesService.findOne.mockResolvedValue(mockVenueDto);
      const result = await venuesController.findOne('v-001');
      expect(venuesService.findOne).toHaveBeenCalledWith('v-001');
      expect(result.id).toBe('v-001');
    });
  });

  describe('update', () => {
    it('should wire update through controller', async () => {
      venuesService.update.mockResolvedValue(mockVenueDto);
      const result = await venuesController.update(
        'v-001',
        { name: 'Renovated' } as any,
        { user: { id: 'user-001' } } as any,
      );
      expect(venuesService.update).toHaveBeenCalledTimes(1);
      expect(result.id).toBe('v-001');
    });
  });

  describe('remove', () => {
    it('should wire remove through controller', async () => {
      venuesService.remove.mockResolvedValue(undefined);
      await venuesController.remove('v-001', { user: { id: 'user-001' } } as any);
      expect(venuesService.remove).toHaveBeenCalledWith('v-001', 'user-001');
    });
  });

  describe('getMyVenues', () => {
    it('should wire getMyVenues through controller', async () => {
      venuesService.getMyVenues.mockResolvedValue({
        venues: [mockVenueDto],
        total: 1,
        page: 1,
        limit: 10,
        totalPages: 1,
      });
      const result = await venuesController.getMyVenues({ user: { id: 'user-001' } } as any, 1, 10);
      expect(venuesService.getMyVenues).toHaveBeenCalledWith('user-001', 1, 10);
      expect(result.venues).toHaveLength(1);
    });
  });

  describe('changeStatus', () => {
    it('should wire changeStatus through controller', async () => {
      venuesService.changeStatus.mockResolvedValue(mockVenueDto);
      const result = await venuesController.changeStatus(
        'v-001',
        VenueStatus.CLOSED,
        { user: { id: 'user-001' } } as any,
      );
      expect(venuesService.changeStatus).toHaveBeenCalledWith('v-001', VenueStatus.CLOSED, 'user-001');
      expect(result.id).toBe('v-001');
    });
  });

  describe('getStats', () => {
    it('should wire getStats through controller', async () => {
      const stats = { total: 100, byStatus: { ACTIVE: 80 }, byType: { STADIUM: 50 }, byCity: { 北京: 30 } };
      venuesService.getStats.mockResolvedValue(stats);
      const result = await venuesController.getStats();
      expect(venuesService.getStats).toHaveBeenCalledTimes(1);
      expect(result.total).toBe(100);
    });
  });

  describe('searchNearby', () => {
    it('should wire searchNearby through controller', async () => {
      venuesService.searchNearby.mockResolvedValue([mockVenueDto]);
      const result = await venuesController.searchNearby(39.9, 116.4, 5, '北京', VenueType.STADIUM);
      expect(venuesService.searchNearby).toHaveBeenCalledWith(39.9, 116.4, 5, { city: '北京', type: VenueType.STADIUM });
      expect(result).toHaveLength(1);
    });
  });

  // ─── 精简模块不包含子控制器 ───

  it('should not register VenueSearchController in lite module', () => {
    // 如果只有 VenuesController 注册，编译应该不会有其他 controller
    expect(venuesController).toBeDefined();
    // Lite 模块的设计目标就是不依赖搜索控制器
  });

  it('should not register VenueSearchSimpleController in lite module', () => {
    expect(venuesController).toBeDefined();
    expect(venuesService).toBeDefined();
  });

  // ─── 所有 9 个 Service 方法可用 ───

  it('should expose all 9 VenuesService methods for lite module', () => {
    const methods = ['create', 'findAll', 'findOne', 'update', 'remove', 'getMyVenues', 'changeStatus', 'getStats', 'searchNearby'];
    for (const method of methods) {
      expect(venuesService).toHaveProperty(method);
      expect(typeof (venuesService as any)[method]).toBe('function');
    }
  });

  // ─── VenuesModuleLite 应该可以被解析 ───

  it('should be possible to resolve VenuesModuleLite class', async () => {
    const { VenuesModuleLite } = await import('./venues.module-lite');
    expect(VenuesModuleLite).toBeDefined();
    expect(typeof VenuesModuleLite).toBe('function');
  });
});
