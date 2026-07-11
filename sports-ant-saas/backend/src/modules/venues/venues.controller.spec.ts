import { Test, TestingModule } from '@nestjs/testing';
import { VenuesController } from './venues.controller';
import { VenuesService } from './venues.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CacheInterceptor } from '../../common/cache.interceptor';
import { VenueResponseDto } from './dto/venue-response.dto';
import { VenueStatus, VenueType } from './entities/venue.entity';

describe('VenuesController', () => {
  let controller: VenuesController;
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
    facilities: ['停车场', '淋浴', '储物柜'],
    openingHours: { weekday: '06:00-22:00' },
    contactPhone: '010-12345678',
    contactEmail: 'venue@olympic.cn',
    status: VenueStatus.ACTIVE,
    allowOnlineBooking: true,
    bookingAdvanceHours: 24,
    cancellationPolicy: { freeCancelHours: 48 },
    pricing: { hourly: 200 },
    images: ['img1.jpg', 'img2.jpg'],
    createdBy: 'user-001',
    ownerId: 'user-001',
    createdAt: new Date('2025-01-01'),
    updatedAt: new Date('2025-06-01'),
    distance: 1.5,
    averageRating: 4.5,
    reviewCount: 128,
  } as VenueResponseDto;

  beforeEach(async () => {
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
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .overrideInterceptor(CacheInterceptor)
      .useValue({ intercept: (_, next) => next.handle() })
      .compile();

    controller = module.get<VenuesController>(VenuesController);
    venuesService = module.get(VenuesService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  // ── create ──────────────────────────────────────────────────────

  describe('create', () => {
    it('should create a venue and return dto', async () => {
      venuesService.create.mockResolvedValue(mockVenueDto);
      const createDto = {
        name: '奥体中心',
        address: '北京市朝阳区奥运村路1号',
        city: '北京',
        province: '北京市',
        postalCode: '100000',
        type: VenueType.STADIUM,
        capacity: 50000,
        contactPhone: '010-12345678',
        contactEmail: 'venue@olympic.cn',
      };
      const req = { user: { id: 'user-001' } };

      const result = await controller.create(createDto as any, req as any);
      expect(result).toEqual(mockVenueDto);
      expect(venuesService.create).toHaveBeenCalledWith(createDto, 'user-001');
    });
  });

  // ── getStats ────────────────────────────────────────────────────

  describe('getStats', () => {
    it('should return venue statistics', async () => {
      const stats = {
        total: 3,
        byStatus: { active: 2, closed: 1 },
        byType: { stadium: 1, gym: 2 },
        byCity: { '北京': 2, '上海': 1 },
      };
      venuesService.getStats.mockResolvedValue(stats);

      const result = await controller.getStats();
      expect(result).toEqual(stats);
      expect(venuesService.getStats).toHaveBeenCalled();
    });
  });

  // ── searchNearby ────────────────────────────────────────────────

  describe('searchNearby', () => {
    it('should search nearby venues by coordinates', async () => {
      venuesService.searchNearby.mockResolvedValue([mockVenueDto]);

      const result = await controller.searchNearby(
        39.9 as any, 116.4 as any, 5 as any, '北京', VenueType.STADIUM,
      );
      expect(result).toEqual([mockVenueDto]);
      expect(venuesService.searchNearby).toHaveBeenCalledWith(39.9, 116.4, 5, {
        city: '北京',
        type: VenueType.STADIUM,
      });
    });
  });

  // ── getMyVenues ─────────────────────────────────────────────────

  describe('getMyVenues', () => {
    it("should return current user's venues", async () => {
      const paginatedResult = {
        venues: [mockVenueDto],
        total: 1,
        page: 1,
        limit: 10,
        totalPages: 1,
      };
      venuesService.getMyVenues.mockResolvedValue(paginatedResult);
      const req = { user: { id: 'user-001' } };

      const result = await controller.getMyVenues(req as any, 1 as any, 10 as any);
      expect(result).toEqual(paginatedResult);
      expect(venuesService.getMyVenues).toHaveBeenCalledWith('user-001', 1, 10);
    });
  });

  // ── findAll ─────────────────────────────────────────────────────

  describe('findAll', () => {
    it('should return paginated venue list', async () => {
      const paginatedResult = {
        venues: [mockVenueDto],
        total: 1,
        page: 1,
        limit: 10,
        totalPages: 1,
      };
      venuesService.findAll.mockResolvedValue(paginatedResult);

      const result = await controller.findAll({ page: 1, limit: 10, city: '北京' });
      expect(result).toEqual(paginatedResult);
      expect(venuesService.findAll).toHaveBeenCalledWith({ page: 1, limit: 10, city: '北京' });
    });
  });

  // ── findOne ─────────────────────────────────────────────────────

  describe('findOne', () => {
    it('should return a venue by id', async () => {
      venuesService.findOne.mockResolvedValue(mockVenueDto);

      const result = await controller.findOne('v-001');
      expect(result).toEqual(mockVenueDto);
      expect(venuesService.findOne).toHaveBeenCalledWith('v-001');
    });
  });

  // ── update ──────────────────────────────────────────────────────

  describe('update', () => {
    it('should update a venue', async () => {
      const updated = { ...mockVenueDto, name: '新名称' };
      venuesService.update.mockResolvedValue(updated);
      const updateDto = { name: '新名称' };
      const req = { user: { id: 'user-001' } };

      const result = await controller.update('v-001', updateDto as any, req as any);
      expect(result).toEqual(updated);
      expect(venuesService.update).toHaveBeenCalledWith('v-001', updateDto, 'user-001');
    });
  });

  // ── remove ──────────────────────────────────────────────────────

  describe('remove', () => {
    it('should soft-delete a venue', async () => {
      venuesService.remove.mockResolvedValue(undefined);
      const req = { user: { id: 'user-001' } };

      const result = await controller.remove('v-001', req as any);
      expect(result).toBeUndefined();
      expect(venuesService.remove).toHaveBeenCalledWith('v-001', 'user-001');
    });
  });

  // ── changeStatus ────────────────────────────────────────────────

  describe('changeStatus', () => {
    it('should change venue status', async () => {
      const closed = { ...mockVenueDto, status: VenueStatus.CLOSED };
      venuesService.changeStatus.mockResolvedValue(closed);
      const req = { user: { id: 'user-001' } };

      const result = await controller.changeStatus('v-001', VenueStatus.CLOSED, req as any);
      expect(result).toEqual(closed);
      expect(venuesService.changeStatus).toHaveBeenCalledWith(
        'v-001', VenueStatus.CLOSED, 'user-001',
      );
    });
  });
});
