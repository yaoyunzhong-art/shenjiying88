# VenueSearchService 测试模板

## 测试文件结构
```
src/modules/venues/venue-search.service.spec.ts
```

## 基本测试结构
```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { VenueSearchService } from './venue-search.service';
import { Venue, VenueType, VenueStatus } from './entities/venue.entity';

describe('VenueSearchService', () => {
  let service: VenueSearchService;
  let venueRepository: Repository<Venue>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        VenueSearchService,
        {
          provide: getRepositoryToken(Venue),
          useValue: {
            createQueryBuilder: jest.fn(),
            findOne: jest.fn(),
            find: jest.fn(),
            count: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<VenueSearchService>(VenueSearchService);
    venueRepository = module.get<Repository<Venue>>(getRepositoryToken(Venue));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
```

## 需要测试的方法

### 1. searchVenues()
**测试场景**:
- 空搜索条件
- 带文本搜索
- 带地理位置搜索
- 带设施条件搜索
- 带价格范围搜索
- 分页和排序

**测试用例**:
```typescript
describe('searchVenues', () => {
  it('should return venues with default options', async () => {
    // 测试代码
  });

  it('should filter by search text', async () => {
    // 测试代码
  });

  it('should filter by location and radius', async () => {
    // 测试代码
  });

  it('should apply pagination correctly', async () => {
    // 测试代码
  });
});
```

### 2. getVenueDetails()
**测试场景**:
- 有效的venue ID
- 无效的venue ID
- 包含可用性信息
- 包含相似场馆
- 包含统计数据

### 3. getPopularVenues()
**测试场景**:
- 默认限制
- 指定城市过滤
- 指定类型过滤
- 排序正确性

### 4. getVenueStatistics()
**测试场景**:
- 有效的venue ID
- 统计数据完整性
- 模拟数据正确性

## 测试数据工厂

### 创建测试场馆数据
```typescript
const createMockVenue = (overrides = {}): Venue => ({
  id: 'test-venue-1',
  name: '测试场馆',
  description: '测试描述',
  address: '测试地址',
  city: '上海',
  province: '上海市',
  postalCode: '200000',
  country: '中国',
  latitude: 31.2304,
  longitude: 121.4737,
  type: VenueType.GYM,
  capacity: 100,
  area: 500,
  facilities: ['篮球场', '健身房'],
  openingHours: { weekday: '09:00-22:00' },
  contactPhone: '13800138000',
  contactEmail: 'test@example.com',
  status: VenueStatus.ACTIVE,
  allowOnlineBooking: true,
  bookingAdvanceHours: 24,
  cancellationPolicy: {},
  pricing: {},
  images: [],
  createdBy: 'admin',
  ownerId: 'owner-1',
  createdAt: new Date(),
  updatedAt: new Date(),
  deletedAt: null,
  hourlyRate: 100,
  rating: 4.5,
  reviewCount: 42,
  isFeatured: true,
  hasParking: true,
  hasShower: true,
  hasLocker: true,
  hasWifi: true,
  hasCafe: true,
  ...overrides,
});
```

## 模拟查询构建器

### 创建模拟QueryBuilder
```typescript
const createMockQueryBuilder = (mockData: any[] = []) => ({
  createQueryBuilder: jest.fn().mockReturnValue({
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    setParameter: jest.fn().mockReturnThis(),
    addSelect: jest.fn().mockReturnThis(),
    having: jest.fn().mockReturnThis(),
    skip: jest.fn().mockReturnThis(),
    take: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    addOrderBy: jest.fn().mockReturnThis(),
    getMany: jest.fn().mockResolvedValue(mockData),
    getCount: jest.fn().mockResolvedValue(mockData.length),
  }),
});
```

## 测试覆盖率目标

### 方法覆盖率
- [ ] searchVenues(): 100%
- [ ] getVenueDetails(): 100%
- [ ] getPopularVenues(): 100%
- [ ] getVenueStatistics(): 100%

### 分支覆盖率
- [ ] 所有条件分支
- [ ] 所有错误处理
- [ ] 所有边界情况

### 集成测试
- [ ] 数据库查询集成
- [ ] 地理位置计算
- [ ] 分页逻辑
- [ ] 排序逻辑

## 测试执行计划 (09:00-10:00)

### 时间分配
1. **09:00-09:15**: 创建测试文件和基本结构
2. **09:15-09:30**: 实现searchVenues()测试
3. **09:30-09:45**: 实现getVenueDetails()测试
4. **09:45-10:00**: 实现getPopularVenues()和getVenueStatistics()测试

### 成功标准
1. ✅ 所有测试通过
2. ✅ 测试覆盖率 ≥80%
3. ✅ 代码规范符合项目标准
4. ✅ 测试数据工厂完整
5. ✅ 模拟对象正确配置

---
*模板创建时间: 2026-03-29 07:52 AM (欧洲/罗马时间)*
*用于09:00-10:00测试开发阶段*