import { Test, TestingModule } from '@nestjs/testing';
import { Logger } from '@nestjs/common';
import { VenueSearchSimpleController } from './venue-search-simple.controller';
import { VenueSearchSimpleService } from './venue-search-simple.service';
import { VenueType, VenueStatus } from './entities/venue.entity';

// ─── 模拟返回数据 ───

const mockSearchResult = {
  total: 5,
  page: 1,
  limit: 10,
  totalPages: 1,
  results: [
    {
      venue: { id: 'v-1', name: '上海体育馆', city: '上海', type: 'STADIUM' },
      relevanceScore: 1,
    },
    {
      venue: { id: 'v-2', name: '北京奥体中心', city: '北京', type: 'STADIUM' },
      relevanceScore: 1,
    },
  ],
};

// ─── Mock Service 工厂 ───

function createMockService() {
  return {
    searchVenues: jest.fn().mockResolvedValue(mockSearchResult),
  } as any;
}

describe('VenueSearchSimpleController', () => {
  let controller: VenueSearchSimpleController;
  let service: ReturnType<typeof createMockService>;

  beforeEach(async () => {
    // 禁用 Logger 干扰测试输出
    jest.spyOn(Logger.prototype, 'log').mockImplementation(() => {});

    service = createMockService();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [VenueSearchSimpleController],
      providers: [
        {
          provide: VenueSearchSimpleService,
          useValue: service,
        },
      ],
    }).compile();

    controller = module.get<VenueSearchSimpleController>(VenueSearchSimpleController);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('search', () => {
    it('应使用默认分页参数搜索', async () => {
      const result = await controller.search();
      expect(result).toEqual(mockSearchResult);
      expect(service.searchVenues).toHaveBeenCalledWith({
        search: undefined,
        city: undefined,
        province: undefined,
        type: undefined,
        status: undefined,
        minCapacity: undefined,
        maxCapacity: undefined,
        page: 1,
        limit: 10,
      });
    });

    it('应正确解析 search 关键词', async () => {
      await controller.search('篮球场');
      expect(service.searchVenues).toHaveBeenCalledWith(
        expect.objectContaining({ search: '篮球场' }),
      );
    });

    it('应正确解析 city 参数', async () => {
      await controller.search(undefined, '上海');
      expect(service.searchVenues).toHaveBeenCalledWith(
        expect.objectContaining({ city: '上海' }),
      );
    });

    it('应正确解析 province 参数', async () => {
      await controller.search(undefined, undefined, '广东');
      expect(service.searchVenues).toHaveBeenCalledWith(
        expect.objectContaining({ province: '广东' }),
      );
    });

    it('应正确解析 type 参数', async () => {
      await controller.search(undefined, undefined, undefined, VenueType.GYM);
      expect(service.searchVenues).toHaveBeenCalledWith(
        expect.objectContaining({ type: VenueType.GYM }),
      );
    });

    it('应正确解析 status 参数', async () => {
      await controller.search(undefined, undefined, undefined, undefined, VenueStatus.ACTIVE);
      expect(service.searchVenues).toHaveBeenCalledWith(
        expect.objectContaining({ status: VenueStatus.ACTIVE }),
      );
    });

    it('应正确解析 minCapacity 字符串为数字', async () => {
      await controller.search(undefined, undefined, undefined, undefined, undefined, '50');
      expect(service.searchVenues).toHaveBeenCalledWith(
        expect.objectContaining({ minCapacity: 50 }),
      );
    });

    it('应正确解析 maxCapacity 字符串为数字', async () => {
      await controller.search(undefined, undefined, undefined, undefined, undefined, undefined, '200');
      expect(service.searchVenues).toHaveBeenCalledWith(
        expect.objectContaining({ maxCapacity: 200 }),
      );
    });

    it('应正确解析 page 字符串为数字', async () => {
      await controller.search(undefined, undefined, undefined, undefined, undefined, undefined, undefined, '3');
      expect(service.searchVenues).toHaveBeenCalledWith(
        expect.objectContaining({ page: 3 }),
      );
    });

    it('应正确解析 limit 字符串为数字', async () => {
      await controller.search(undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, '5');
      expect(service.searchVenues).toHaveBeenCalledWith(
        expect.objectContaining({ limit: 5 }),
      );
    });

    it('应正确处理全部参数组合', async () => {
      await controller.search(
        '篮球',
        '上海',
        '上海',
        VenueType.STADIUM,
        VenueStatus.ACTIVE,
        '100',
        '500',
        '2',
        '20',
      );
      expect(service.searchVenues).toHaveBeenCalledWith({
        search: '篮球',
        city: '上海',
        province: '上海',
        type: VenueType.STADIUM,
        status: VenueStatus.ACTIVE,
        minCapacity: 100,
        maxCapacity: 500,
        page: 2,
        limit: 20,
      });
    });

    it('应将无效 page 字符串转换为 NaN（parseInt 行为）', async () => {
      await controller.search(undefined, undefined, undefined, undefined, undefined, undefined, undefined, 'abc');
      expect(service.searchVenues).toHaveBeenCalledWith(
        expect.objectContaining({ page: NaN }),
      );
    });

    it('应记录搜索日志', async () => {
      const logSpy = jest.spyOn(Logger.prototype, 'log');
      await controller.search('test', '北京');
      expect(logSpy).toHaveBeenCalledWith('Simple search request: search=test, city=北京');
    });
  });
});
