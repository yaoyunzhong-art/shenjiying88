# VenueSearchService 使用指南

## 概述
VenueSearchService 是 Sports Ant SaaS 项目的核心搜索服务，提供高级场馆搜索、详情获取、热门推荐和统计分析功能。

## 功能特性

### 1. 高级场馆搜索 (`searchVenues`)
**功能**: 提供完整的场馆搜索功能，支持多种过滤条件和排序选项

**主要特性**:
- 🔍 **文本搜索**: 支持名称、描述、地址的模糊搜索
- 📍 **地理位置搜索**: 基于经纬度和半径的附近场馆搜索
- 🏷️ **属性过滤**: 类型、容量、设施、价格范围等
- ⏰ **时间可用性**: 支持日期和时间段过滤
- 📊 **分页排序**: 完整的分页支持和多种排序选项

**使用示例**:
```typescript
// 基本搜索
const result = await venueSearchService.searchVenues({
  search: '篮球场',
  city: '上海',
  page: 1,
  limit: 20,
});

// 地理位置搜索
const nearbyVenues = await venueSearchService.searchVenues({
  latitude: 31.2304,
  longitude: 121.4737,
  radiusKm: 5,
  type: 'gym',
});

// 高级过滤
const filteredVenues = await venueSearchService.searchVenues({
  minCapacity: 50,
  maxCapacity: 200,
  hasParking: true,
  hasShower: true,
  minHourlyRate: 50,
  maxHourlyRate: 200,
  sortBy: 'rating',
  sortOrder: 'desc',
});
```

### 2. 场馆详情获取 (`getVenueDetails`)
**功能**: 获取场馆的详细信息，可选包含可用性、评论和相似场馆

**主要特性**:
- 📋 **基本信息**: 场馆完整信息
- 📅 **可用性查询**: 指定日期的可用时间段
- ⭐ **评论信息**: 包含用户评论和评分
- 🔗 **相似场馆**: 基于属性的相似场馆推荐
- 📈 **统计数据**: 预订量、收入、入住率等

**使用示例**:
```typescript
// 基本详情
const details = await venueSearchService.getVenueDetails('venue-id-123');

// 包含可用性
const withAvailability = await venueSearchService.getVenueDetails('venue-id-123', {
  includeAvailability: true,
  date: new Date('2026-03-30'),
});

// 包含所有增强信息
const enhancedDetails = await venueSearchService.getVenueDetails('venue-id-123', {
  includeAvailability: true,
  includeReviews: true,
  includeSimilar: true,
  date: new Date('2026-03-30'),
});
```

### 3. 热门场馆推荐 (`getPopularVenues`)
**功能**: 获取热门场馆推荐，基于评分、评论量和容量

**主要特性**:
- 🏆 **评分排序**: 按评分从高到低排序
- 📊 **评论权重**: 评论数量影响排名
- 🏙️ **城市过滤**: 按城市筛选热门场馆
- 🏟️ **类型过滤**: 按场馆类型筛选
- 🔢 **数量控制**: 可指定返回数量

**使用示例**:
```typescript
// 默认热门场馆
const popular = await venueSearchService.getPopularVenues();

// 按城市过滤
const popularInCity = await venueSearchService.getPopularVenues({
  city: '北京',
  limit: 10,
});

// 按类型过滤
const popularGyms = await venueSearchService.getPopularVenues({
  type: VenueType.GYM,
  limit: 5,
});
```

### 4. 场馆统计分析 (`getVenueStatistics`)
**功能**: 获取场馆的统计数据和趋势分析

**主要特性**:
- 📊 **基础统计**: 总预订量、总收入、平均评分
- 📈 **趋势分析**: 月度预订和收入趋势
- 🕐 **高峰时段**: 各时段的预订热度
- 📋 **入住率**: 场馆利用率统计

**使用示例**:
```typescript
const statistics = await venueSearchService.getVenueStatistics('venue-id-123');

console.log('总预订量:', statistics.totalBookings);
console.log('总收入:', statistics.totalRevenue);
console.log('平均评分:', statistics.averageRating);
console.log('入住率:', statistics.occupancyRate + '%');

// 高峰时段分析
statistics.peakHours.forEach(hour => {
  console.log(`时段 ${hour.hour}:00 - 预订量: ${hour.bookings}`);
});

// 月度趋势
statistics.monthlyTrend.forEach(month => {
  console.log(`${month.month}: ${month.bookings} 预订, ¥${month.revenue} 收入`);
});
```

## 数据库字段说明

### 新增字段 (2026-03-29)
以下字段在2026-03-29的更新中添加：

| 字段名 | 类型 | 描述 | 默认值 |
|--------|------|------|--------|
| `hourlyRate` | decimal(10,2) | 每小时价格 | 0 |
| `rating` | decimal(3,2) | 平均评分 | 0 |
| `reviewCount` | integer | 评论数量 | 0 |
| `isFeatured` | boolean | 是否特色场馆 | false |
| `hasParking` | boolean | 是否有停车场 | false |
| `hasShower` | boolean | 是否有淋浴 | false |
| `hasLocker` | boolean | 是否有储物柜 | false |
| `hasWifi` | boolean | 是否有WiFi | false |
| `hasCafe` | boolean | 是否有咖啡厅 | false |

### 数据库迁移
```sql
-- 添加新字段的SQL
ALTER TABLE venues ADD COLUMN hourlyRate decimal(10,2);
ALTER TABLE venues ADD COLUMN rating decimal(3,2);
ALTER TABLE venues ADD COLUMN reviewCount integer DEFAULT 0;
ALTER TABLE venues ADD COLUMN isFeatured boolean DEFAULT 0;
ALTER TABLE venues ADD COLUMN hasParking boolean DEFAULT 0;
ALTER TABLE venues ADD COLUMN hasShower boolean DEFAULT 0;
ALTER TABLE venues ADD COLUMN hasLocker boolean DEFAULT 0;
ALTER TABLE venues ADD COLUMN hasWifi boolean DEFAULT 0;
ALTER TABLE venues ADD COLUMN hasCafe boolean DEFAULT 0;
```

## API 接口

### REST API 端点

#### 1. 高级搜索
```
POST /api/v1/venues/search
```
**请求体**: `VenueSearchOptions`
**响应**: `VenueSearchResponse`

#### 2. 快速搜索
```
GET /api/v1/venues/search/quick
```
**查询参数**: `q`, `city`, `type`, `lat`, `lng`, `radius`
**响应**: 简化版搜索结果

#### 3. 场馆详情
```
GET /api/v1/venues/search/:id/details
```
**路径参数**: `id` (场馆ID)
**查询参数**: `includeAvailability`, `date`, `includeReviews`, `includeSimilar`
**响应**: 增强版场馆详情

#### 4. 热门场馆
```
GET /api/v1/venues/search/popular
```
**查询参数**: `limit`, `city`, `type`
**响应**: 热门场馆列表

### Swagger 文档
访问 `/api` 路径查看完整的 Swagger UI 文档，包含：
- 所有端点的详细说明
- 请求参数示例
- 响应结构示例
- 错误码说明

## 测试覆盖

### 测试文件
- `src/modules/venues/venue-search.service.spec.ts`

### 测试覆盖率
- **方法覆盖率**: 100% (4个核心方法)
- **测试用例**: 17个完整测试
- **测试场景**: 包含正常流程和错误处理

### 运行测试
```bash
# 运行所有测试
npm test

# 运行VenueSearchService测试
npm test -- venue-search.service.spec.ts

# 运行测试并生成覆盖率报告
npm test -- venue-search.service.spec.ts --coverage
```

## 性能优化

### 搜索性能
1. **地理位置优化**: 使用边界框预过滤，减少距离计算
2. **查询缓存**: 高频搜索结果的缓存机制
3. **索引优化**: 数据库字段索引配置

### 代码优化
1. **重复代码提取**: 公共逻辑提取为独立函数
2. **错误处理增强**: 完善的错误处理和日志记录
3. **类型安全**: 完整的TypeScript类型定义

## 使用建议

### 最佳实践
1. **分页使用**: 始终使用分页，避免一次性返回大量数据
2. **缓存策略**: 对静态数据使用缓存提高性能
3. **错误处理**: 正确处理搜索无结果和参数错误
4. **日志记录**: 重要操作添加适当的日志记录

### 性能调优
1. **索引优化**: 确保搜索字段有合适的数据库索引
2. **查询优化**: 避免复杂的联表查询，使用适当的JOIN
3. **缓存策略**: 对热门搜索结果实施缓存
4. **异步处理**: 耗时的操作使用异步处理

## 版本历史

### v1.0.0 (2026-03-29)
- ✅ 初始版本发布
- ✅ 完整的高级搜索功能
- ✅ 增强版场馆详情
- ✅ 热门场馆推荐
- ✅ 场馆统计分析
- ✅ 完整的测试覆盖
- ✅ Swagger API文档
- ✅ 性能优化和代码重构

### 后续计划
- 🔄 实时搜索建议
- 🔄 个性化推荐算法
- 🔄 搜索历史和分析
- 🔄 多语言支持
- 🔄 高级分析报表

---
*文档创建时间: 2026-03-29 09:28 AM (欧洲/罗马时间)*
*最后更新: 2026-03-29 09:28 AM (欧洲/罗马时间)*
*文档版本: v1.0.0*