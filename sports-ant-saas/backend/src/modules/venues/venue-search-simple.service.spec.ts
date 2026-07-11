/**
 * VenueSearchSimpleService unit tests
 *
 * Covers:
 *   - 正例 (happy path): 基本搜索, 按城市/省份/类型/状态/容量范围过滤, 分页, 空结果
 *   - 反例 (edge/error): 无搜索条件, 默认分页参数, 数据库异常
 */

import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { VenueSearchSimpleService } from './venue-search-simple.service';
import { Venue, VenueStatus, VenueType } from './entities/venue.entity';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

type MockQueryBuilder = {
  andWhere: jest.Mock;
  where: jest.Mock;
  skip: jest.Mock;
  take: jest.Mock;
  orderBy: jest.Mock;
  getManyAndCount: jest.Mock;
};

function mockQueryBuilder(): MockQueryBuilder {
  return {
    andWhere: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    skip: jest.fn().mockReturnThis(),
    take: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    getManyAndCount: jest.fn().mockResolvedValue([[], 0]),
  };
}

function fakeVenue(overrides: Partial<Venue> = {}): Venue {
  const v = new Venue();
  Object.assign(v, {
    id: 'ven-001',
    name: '旗舰篮球馆',
    description: '市中心顶级篮球馆',
    address: '中山路100号',
    city: '上海',
    province: '上海',
    type: VenueType.COURT,
    capacity: 200,
    status: VenueStatus.ACTIVE,
    createdAt: new Date('2025-01-01'),
    updatedAt: new Date('2025-06-01'),
    ...overrides,
  });
  return v;
}

// ---------------------------------------------------------------------------
// Test suite
// ---------------------------------------------------------------------------

describe('VenueSearchSimpleService', () => {
  let service: VenueSearchSimpleService;
  let qb: MockQueryBuilder;

  beforeEach(async () => {
    qb = mockQueryBuilder();

    const mockRepository = {
      createQueryBuilder: jest.fn().mockReturnValue(qb),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        VenueSearchSimpleService,
        {
          provide: getRepositoryToken(Venue),
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<VenueSearchSimpleService>(VenueSearchSimpleService);
  });

  // -----------------------------------------------------------------------
  // searchVenues
  // -----------------------------------------------------------------------
  describe('searchVenues', () => {
    it('应返回基本搜索结果', async () => {
      const venue = fakeVenue();
      qb.getManyAndCount.mockResolvedValue([[venue], 1]);

      const result = await service.searchVenues({ search: '篮球' });

      expect(result.total).toBe(1);
      expect(result.page).toBe(1);
      expect(result.limit).toBe(10);
      expect(result.totalPages).toBe(1);
      expect(result.results).toHaveLength(1);
      expect(result.results[0].venue.id).toBe('ven-001');
      expect(result.results[0].relevanceScore).toBe(1.0);
    });

    it('应支持关键词搜索', async () => {
      qb.getManyAndCount.mockResolvedValue([[], 0]);

      await service.searchVenues({ search: '游泳馆' });

      expect(qb.where).toHaveBeenCalledWith(
        '(venue.name LIKE :search OR venue.description LIKE :search OR venue.address LIKE :search)',
        { search: '%游泳馆%' },
      );
    });

    it('应支持城市过滤', async () => {
      qb.getManyAndCount.mockResolvedValue([[], 0]);

      await service.searchVenues({ city: '北京' });

      expect(qb.andWhere).toHaveBeenCalledWith('venue.city = :city', { city: '北京' });
    });

    it('应支持省份过滤', async () => {
      qb.getManyAndCount.mockResolvedValue([[], 0]);

      await service.searchVenues({ province: '浙江' });

      expect(qb.andWhere).toHaveBeenCalledWith('venue.province = :province', { province: '浙江' });
    });

    it('应支持类型过滤', async () => {
      qb.getManyAndCount.mockResolvedValue([[], 0]);

      await service.searchVenues({ type: VenueType.GYM });

      expect(qb.andWhere).toHaveBeenCalledWith('venue.type = :type', { type: VenueType.GYM });
    });

    it('应支持状态过滤', async () => {
      qb.getManyAndCount.mockResolvedValue([[], 0]);

      await service.searchVenues({ status: VenueStatus.MAINTENANCE });

      expect(qb.andWhere).toHaveBeenCalledWith('venue.status = :status', { status: VenueStatus.MAINTENANCE });
    });

    it('应支持最小容量过滤', async () => {
      qb.getManyAndCount.mockResolvedValue([[], 0]);

      await service.searchVenues({ minCapacity: 100 });

      expect(qb.andWhere).toHaveBeenCalledWith('venue.capacity >= :minCapacity', { minCapacity: 100 });
    });

    it('应支持最大容量过滤', async () => {
      qb.getManyAndCount.mockResolvedValue([[], 0]);

      await service.searchVenues({ maxCapacity: 500 });

      expect(qb.andWhere).toHaveBeenCalledWith('venue.capacity <= :maxCapacity', { maxCapacity: 500 });
    });

    it('应支持容量范围过滤', async () => {
      qb.getManyAndCount.mockResolvedValue([[], 0]);

      await service.searchVenues({ minCapacity: 50, maxCapacity: 300 });

      expect(qb.andWhere).toHaveBeenCalledWith('venue.capacity >= :minCapacity', { minCapacity: 50 });
      expect(qb.andWhere).toHaveBeenCalledWith('venue.capacity <= :maxCapacity', { maxCapacity: 300 });
    });

    it('应支持组合过滤条件', async () => {
      qb.getManyAndCount.mockResolvedValue([[], 0]);

      await service.searchVenues({
        search: '篮球',
        city: '上海',
        type: VenueType.COURT,
        status: VenueStatus.ACTIVE,
      });

      expect(qb.where).toHaveBeenCalledWith(
        '(venue.name LIKE :search OR venue.description LIKE :search OR venue.address LIKE :search)',
        { search: '%篮球%' },
      );
      expect(qb.andWhere).toHaveBeenCalledWith('venue.city = :city', { city: '上海' });
      expect(qb.andWhere).toHaveBeenCalledWith('venue.type = :type', { type: VenueType.COURT });
      expect(qb.andWhere).toHaveBeenCalledWith('venue.status = :status', { status: VenueStatus.ACTIVE });
    });

    it('应返回空结果', async () => {
      qb.getManyAndCount.mockResolvedValue([[], 0]);

      const result = await service.searchVenues({ city: '月球' });

      expect(result.total).toBe(0);
      expect(result.results).toHaveLength(0);
      expect(result.totalPages).toBe(0);
    });

    it('应支持自定义分页', async () => {
      qb.getManyAndCount.mockResolvedValue([[], 50]);

      const result = await service.searchVenues({ page: 3, limit: 20 });

      expect(result.page).toBe(3);
      expect(result.limit).toBe(20);
      expect(qb.skip).toHaveBeenCalledWith(40); // (3-1) * 20
      expect(qb.take).toHaveBeenCalledWith(20);
    });

    it('应使用默认分页参数', async () => {
      qb.getManyAndCount.mockResolvedValue([[], 0]);

      const result = await service.searchVenues({});

      expect(result.page).toBe(1);
      expect(result.limit).toBe(10);
      expect(qb.skip).toHaveBeenCalledWith(0);
      expect(qb.take).toHaveBeenCalledWith(10);
    });

    it('应按创建时间降序排序', async () => {
      qb.getManyAndCount.mockResolvedValue([[], 0]);

      await service.searchVenues({});

      expect(qb.orderBy).toHaveBeenCalledWith('venue.createdAt', 'DESC');
    });

    it('应正确计算总页数', async () => {
      qb.getManyAndCount.mockResolvedValue([[], 25]);

      const result = await service.searchVenues({ limit: 10 });

      expect(result.total).toBe(25);
      expect(result.totalPages).toBe(3); // Math.ceil(25/10)
    });

    it('多个场馆应有相同相关度分数', async () => {
      const venues = [fakeVenue(), fakeVenue({ id: 'ven-002', name: '第二球馆' })];
      qb.getManyAndCount.mockResolvedValue([venues, 2]);

      const result = await service.searchVenues({});

      expect(result.results).toHaveLength(2);
      expect(result.results[0].relevanceScore).toBe(1.0);
      expect(result.results[1].relevanceScore).toBe(1.0);
    });

    it('数据库异常应向上抛出', async () => {
      const error = new Error('Connection lost');
      qb.getManyAndCount.mockRejectedValue(error);

      await expect(service.searchVenues({ search: 'test' })).rejects.toThrow('Connection lost');
    });
  });
});
