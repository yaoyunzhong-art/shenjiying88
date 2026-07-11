import { Test, TestingModule } from '@nestjs/testing';
import { VenueSearchController } from './venue-search.controller';
import { VenueSearchService } from './venue-search.service';

// ─── 模拟返回数据 ───

const mockSearchResponse = {
  total: 42,
  page: 1,
  limit: 20,
  totalPages: 3,
  results: [
    {
      venue: { id: 'v-1', name: '上海体育馆', city: '上海', type: 'STADIUM' },
      relevanceScore: 0.95,
      distanceKm: 2.3,
    },
  ],
  filters: {
    applied: { search: '篮球', city: '上海' },
    available: { cities: ['上海', '北京'], provinces: [], types: [], capacityRanges: [], priceRanges: [] },
  },
  metadata: { searchTimeMs: 45, searchRadiusKm: 10, locationUsed: false },
};

const mockVenueDetails = {
  venue: { id: 'v-1', name: '上海体育馆', city: '上海', type: 'STADIUM' },
  availability: { isAvailable: true, slots: [] },
  similarVenues: [],
  statistics: { totalBookings: 120, averageRating: 4.5 },
};

const mockPopularVenues = [
  { venue: { id: 'v-1', name: '上海体育馆', city: '上海' }, relevanceScore: 1.0 },
  { venue: { id: 'v-2', name: '北京奥体中心', city: '北京' }, relevanceScore: 0.95 },
];

const mockVenueStatistics = {
  totalBookings: 350,
  averageRating: 4.7,
  popularTimeSlots: ['09:00', '18:00'],
  revenue: { monthly: 50000, yearly: 600000 },
};

const mockAvailableFilters = {
  cities: ['上海', '北京', '广州'],
  provinces: ['上海', '北京', '广东'],
  types: ['STADIUM', 'GYM', 'POOL'],
  capacityRanges: [
    { min: 0, max: 100 },
    { min: 101, max: 500 },
  ],
  priceRanges: [
    { min: 0, max: 50 },
    { min: 51, max: 200 },
  ],
};

// ─── 构造可复用的 mock service ───

function createMockVenueSearchService() {
  return {
    searchVenues: jest.fn().mockResolvedValue(mockSearchResponse),
    getVenueDetails: jest.fn().mockResolvedValue(mockVenueDetails),
    getPopularVenues: jest.fn().mockResolvedValue(mockPopularVenues),
    getVenueStatistics: jest.fn().mockResolvedValue(mockVenueStatistics),
  } as any;
}

describe('VenueSearchController', () => {
  let controller: VenueSearchController;
  let service: ReturnType<typeof createMockVenueSearchService>;

  beforeEach(async () => {
    service = createMockVenueSearchService();

    // 为 getAvailableFilters 添加 spy（controller 直接访问 private 方法）
    (service as any).getAvailableFilters = jest.fn().mockResolvedValue(mockAvailableFilters);

    const module: TestingModule = await Test.createTestingModule({
      controllers: [VenueSearchController],
      providers: [
        { provide: VenueSearchService, useValue: service },
      ],
    }).compile();

    controller = module.get<VenueSearchController>(VenueSearchController);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // ==================================================================
  //  POST /search — 高级搜索
  // ==================================================================

  describe('POST /search — 高级场馆搜索', () => {
    it('应返回成功响应并包含 data 结构', async () => {
      const body = { search: '篮球场', city: '上海', page: 1, limit: 20 };
      const result = await controller.searchVenues(body);

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockSearchResponse);
      expect(result.timestamp).toBeDefined();
      expect(service.searchVenues).toHaveBeenCalledWith(body);
    });

    it('应调用 service.searchVenues 并传递搜索选项', async () => {
      const body = { search: '游泳馆', city: '北京', latitude: 39.9, longitude: 116.4, radiusKm: 5 };
      await controller.searchVenues(body);

      expect(service.searchVenues).toHaveBeenCalledTimes(1);
      expect(service.searchVenues).toHaveBeenCalledWith(
        expect.objectContaining({ search: '游泳馆', city: '北京' }),
      );
    });

    it('应返回空结果时仍保持结构完整性', async () => {
      const emptyResponse = { ...mockSearchResponse, total: 0, results: [] };
      service.searchVenues = jest.fn().mockResolvedValue(emptyResponse);

      const result = await controller.searchVenues({});
      expect(result.success).toBe(true);
      expect(result.data.total).toBe(0);
      expect(result.data.results).toEqual([]);
    });
  });

  // ==================================================================
  //  GET /search/quick — 快速搜索（查询参数版）
  // ==================================================================

  describe('GET /search/quick — 快速搜索', () => {
    it('应使用查询参数构造搜索选项', async () => {
      const result = await controller.quickSearch(
        '篮球场',
        '上海',
        'STADIUM',
        '31.2',
        '121.4',
        '10',
        '1',
        '15',
      );

      expect(result.success).toBe(true);
      expect(service.searchVenues).toHaveBeenCalledWith(
        expect.objectContaining({
          search: '篮球场',
          city: '上海',
          type: 'STADIUM',
          latitude: 31.2,
          longitude: 121.4,
          radiusKm: 10,
          page: 1,
          limit: 15,
        }),
      );
    });

    it('应只传部分参数时使用默认值', async () => {
      await controller.quickSearch('健身房', undefined, undefined, undefined, undefined, undefined, undefined, undefined);

      expect(service.searchVenues).toHaveBeenCalledWith(
        expect.objectContaining({
          search: '健身房',
          page: 1,
          limit: 20,
        }),
      );
    });

    it('应有 lat/lng 时默认 radiusKm = 10', async () => {
      await controller.quickSearch(undefined, undefined, undefined, '30.0', '120.0');

      expect(service.searchVenues).toHaveBeenCalledWith(
        expect.objectContaining({
          latitude: 30.0,
          longitude: 120.0,
          radiusKm: 10,
        }),
      );
    });
  });

  // ==================================================================
  //  GET /search/:id/details — 场馆详情
  // ==================================================================

  describe('GET /search/:id/details — 场馆详情', () => {
    it('应返回场馆详细信息', async () => {
      const result = await controller.getVenueDetails('v-1');

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockVenueDetails);
      expect(service.getVenueDetails).toHaveBeenCalledWith('v-1', {});
    });

    it('应传递 includeAvailability 选项', async () => {
      await controller.getVenueDetails('v-1', 'true', '2026-06-15', undefined, undefined);

      expect(service.getVenueDetails).toHaveBeenCalledWith('v-1', {
        includeAvailability: true,
        date: expect.any(Date),
      });
    });

    it('应传递 includeReviews 选项', async () => {
      await controller.getVenueDetails('v-1', undefined, undefined, 'true', undefined);

      expect(service.getVenueDetails).toHaveBeenCalledWith('v-1', {
        includeReviews: true,
      });
    });

    it('应传递 includeSimilar 选项', async () => {
      await controller.getVenueDetails('v-1', undefined, undefined, undefined, 'true');

      expect(service.getVenueDetails).toHaveBeenCalledWith('v-1', {
        includeSimilar: true,
      });
    });

    it('应同时传递所有选项', async () => {
      await controller.getVenueDetails('v-1', 'true', '2026-07-01', 'true', 'true');

      expect(service.getVenueDetails).toHaveBeenCalledWith('v-1', {
        includeAvailability: true,
        date: expect.any(Date),
        includeReviews: true,
        includeSimilar: true,
      });
    });

    it('query string 中的 "false" 不应被转换为 true', async () => {
      await controller.getVenueDetails('v-1', 'false', undefined, 'false', 'false');

      expect(service.getVenueDetails).toHaveBeenCalledWith('v-1', {});
    });
  });

  // ==================================================================
  //  GET /search/popular — 热门场馆
  // ==================================================================

  describe('GET /search/popular — 热门场馆', () => {
    it('应返回热门场馆列表', async () => {
      const result = await controller.getPopularVenues();

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockPopularVenues);
    });

    it('应传递城市和类型过滤', async () => {
      await controller.getPopularVenues('上海', 'STADIUM', '5');

      expect(service.getPopularVenues).toHaveBeenCalledWith({
        city: '上海',
        type: 'STADIUM',
        limit: 5,
      });
    });

    it('无参数时不应传递多余选项', async () => {
      await controller.getPopularVenues(undefined, undefined, undefined);

      expect(service.getPopularVenues).toHaveBeenCalledWith({});
    });
  });

  // ==================================================================
  //  GET /search/:id/statistics — 场馆统计
  // ==================================================================

  describe('GET /search/:id/statistics — 场馆统计', () => {
    it('应返回场馆统计数据', async () => {
      const result = await controller.getVenueStatistics('v-1');

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockVenueStatistics);
      expect(service.getVenueStatistics).toHaveBeenCalledWith('v-1');
    });
  });

  // ==================================================================
  //  GET /search/filters/available — 可用过滤器
  // ==================================================================

  describe('GET /search/filters/available — 可用过滤器', () => {
    it('应返回可用过滤器列表并附加 facilities', async () => {
      const result = await controller.getAvailableFilters();

      expect(result.success).toBe(true);
      expect(result.data.cities).toEqual(mockAvailableFilters.cities);
      expect(result.data.provinces).toEqual(mockAvailableFilters.provinces);
      expect(result.data.types).toEqual(mockAvailableFilters.types);
      expect(result.data.capacityRanges).toEqual(mockAvailableFilters.capacityRanges);
      expect(result.data.priceRanges).toEqual(mockAvailableFilters.priceRanges);
      // facilities 应由 controller 追加
      expect(result.data.facilities).toBeInstanceOf(Array);
      expect(result.data.facilities).toContain('parking');
      expect(result.data.facilities).toContain('wifi');
    });

    it('应传递城市和类型参数', async () => {
      await controller.getAvailableFilters('上海', 'STADIUM');

      expect((service as any).getAvailableFilters).toHaveBeenCalledWith({
        city: '上海',
        type: 'STADIUM',
      });
    });
  });

  // ==================================================================
  //  GET /search/nearby — 附近搜索
  // ==================================================================

  describe('GET /search/nearby — 附近搜索', () => {
    it('应使用位置参数进行附近搜索', async () => {
      const result = await controller.searchNearby(
        '31.23',
        '121.47',
        '3',
        'GYM',
        '10',
      );

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockSearchResponse);
      expect(service.searchVenues).toHaveBeenCalledWith(
        expect.objectContaining({
          latitude: 31.23,
          longitude: 121.47,
          radiusKm: 3,
          type: 'GYM',
          limit: 10,
          page: 1,
          sortBy: 'distance',
          sortOrder: 'asc',
        }),
      );
    });

    it('应使用默认 radius=5 当未传递', async () => {
      await controller.searchNearby('30.0', '120.0');

      expect(service.searchVenues).toHaveBeenCalledWith(
        expect.objectContaining({
          latitude: 30.0,
          longitude: 120.0,
          radiusKm: 5,
          limit: 20,
        }),
      );
    });

    it('缺少 lat 或 lng 时应抛出错误', async () => {
      await expect(controller.searchNearby('', '120.0')).rejects.toThrow(
        'Latitude and longitude are required',
      );
      await expect(controller.searchNearby('30.0', '')).rejects.toThrow(
        'Latitude and longitude are required',
      );
    });
  });

  // ==================================================================
  //  GET /search/suggestions — 搜索建议（自动完成）
  // ==================================================================

  describe('GET /search/suggestions — 搜索建议', () => {
    it('应返回搜索建议', async () => {
      const result = await controller.getSearchSuggestions('篮球');

      expect(result.success).toBe(true);
      expect(result.data.query).toBe('篮球');
      expect(result.data.suggestions).toBeInstanceOf(Array);
    });

    it('应返回多种类型的建议', async () => {
      const result = await controller.getSearchSuggestions('上海', '5');

      expect(result.data.suggestions.length).toBeGreaterThan(0);
      const types = result.data.suggestions.map((s) => s.type);
      expect(types).toContain('city');
    });

    it('query 少于 2 个字符时应返回空建议', async () => {
      const result = await controller.getSearchSuggestions('a');

      expect(result.success).toBe(true);
      expect(result.data.query).toBe('a');
      expect(result.data.suggestions).toEqual([]);
    });

    it('空 query 也应返回空建议', async () => {
      const result = await controller.getSearchSuggestions('');

      expect(result.success).toBe(true);
      expect(result.data.query).toBe('');
      expect(result.data.suggestions).toEqual([]);
    });

    it('应使用 limit 参数限制建议数量', async () => {
      const result = await controller.getSearchSuggestions('场', '3');

      expect(result.data.suggestions.length).toBeLessThanOrEqual(3);
    });

    it('默认应返回不超过 10 条建议', async () => {
      const result = await controller.getSearchSuggestions('上海');

      expect(result.data.suggestions.length).toBeLessThanOrEqual(10);
    });

    it('搜索 "广州" 应返回城市类型建议', async () => {
      const result = await controller.getSearchSuggestions('广州');

      const citySuggestion = result.data.suggestions.find((s) => s.type === 'city');
      expect(citySuggestion).toBeDefined();
      expect(citySuggestion!.value).toBe('广州');
    });
  });

  // ==================================================================
  //  GET /search/stats — 搜索统计
  // ==================================================================

  describe('GET /search/stats — 搜索统计', () => {
    it('应返回搜索统计数据', async () => {
      const result = await controller.getSearchStats();

      expect(result.success).toBe(true);
      expect(result.data.totalSearches).toBe(12500);
      expect(result.data.popularSearches).toBeInstanceOf(Array);
      expect(result.data.popularCities).toBeInstanceOf(Array);
      expect(result.data.popularTypes).toBeInstanceOf(Array);
      expect(result.data.searchTrend).toBeInstanceOf(Array);

      // 验证趋势数据有日期和计数
      for (const trend of result.data.searchTrend) {
        expect(trend).toHaveProperty('date');
        expect(trend).toHaveProperty('count');
        expect(typeof trend.count).toBe('number');
      }

      // 热门城市按计数降序
      const cityCounts = result.data.popularCities.map((c) => c.count);
      for (let i = 1; i < cityCounts.length; i++) {
        expect(cityCounts[i - 1]).toBeGreaterThanOrEqual(cityCounts[i]);
      }
    });

    it('应包含时间戳', async () => {
      const result = await controller.getSearchStats();
      expect(result.timestamp).toBeDefined();
      expect(new Date(result.timestamp).getTime()).not.toBeNaN();
    });
  });

  // ==================================================================
  //  GET /search/test — 测试端点
  // ==================================================================

  describe('GET /search/test — 搜索测试', () => {
    it('应返回服务状态信息', async () => {
      const result = await controller.testSearch();

      expect(result.success).toBe(true);
      expect(result.data.service).toBe('venue-search');
      expect(result.data.version).toBe('1.0.0');
      expect(result.data.status).toBe('operational');
    });

    it('应列出所有端点且均为 active', async () => {
      const result = await controller.testSearch();

      expect(result.data.endpoints.length).toBeGreaterThanOrEqual(6);
      // 所有端点状态为 active
      for (const ep of result.data.endpoints) {
        expect(ep.status).toBe('active');
        expect(ep).toHaveProperty('name');
        expect(ep).toHaveProperty('path');
        expect(ep).toHaveProperty('method');
      }
    });

    it('应包含性能指标', async () => {
      const result = await controller.testSearch();

      expect(result.data.performance.averageSearchTimeMs).toBe(125);
      expect(result.data.performance.successRate).toBe(98.5);
      expect(result.data.performance.cacheHitRate).toBe(65.2);
    });

    it('应包含时间戳', async () => {
      const result = await controller.testSearch();
      expect(result.timestamp).toBeDefined();
    });
  });

  // ==================================================================
  //  异常/边界测试
  // ==================================================================

  describe('异常场景', () => {
    it('searchVenues service 抛出错误时应向上传播', async () => {
      service.searchVenues = jest.fn().mockRejectedValue(new Error('DB connection failed'));

      await expect(controller.searchVenues({ search: 'test' }))
        .rejects.toThrow('DB connection failed');
    });

    it('getVenueDetails service 抛出 NOT_FOUND 时应传播', async () => {
      service.getVenueDetails = jest.fn().mockRejectedValue(
        new Error('Venue not found'),
      );

      await expect(controller.getVenueDetails('nonexistent'))
        .rejects.toThrow('Venue not found');
    });
  });
});
