# 场地可用性工具函数 API 文档

## 概述

场地可用性工具函数提供了一系列用于检查和管理场地可用性的功能。这些函数封装了场地管理的核心业务逻辑，包括可用性检查、容量验证、时间计算等。

## 安装和导入

```typescript
import {
  checkVenueAvailability,
  calculateNextAvailableTime,
  validateVenueCapacity,
  getRecommendedTimeSlots,
  calculateVenueUtilization,
  VenueAvailabilityStatus,
  VenueAvailabilityOptions,
  VenueAvailabilityResult,
} from '../src/modules/venues/utils/venue-availability.utils';
import { Venue } from '../src/modules/venues/entities/venue.entity';
```

## 类型定义

### `VenueAvailabilityStatus`

场地可用性状态枚举。

```typescript
enum VenueAvailabilityStatus {
  AVAILABLE = 'available',      // 可用
  BOOKED = 'booked',            // 已预订
  MAINTENANCE = 'maintenance',  // 维护中
  CLOSED = 'closed',            // 已关闭
}
```

### `VenueAvailabilityOptions`

场地可用性检查选项。

```typescript
interface VenueAvailabilityOptions {
  date: Date;                   // 检查日期
  startTime: string;            // 开始时间 (HH:mm格式)
  endTime: string;              // 结束时间 (HH:mm格式)
  ignoreMaintenance?: boolean;  // 是否忽略维护状态
}
```

### `VenueAvailabilityResult`

场地可用性检查结果。

```typescript
interface VenueAvailabilityResult {
  status: VenueAvailabilityStatus;  // 可用性状态
  isAvailable: boolean;             // 是否可用
  reason?: string;                  // 原因说明（如果不可用）
  nextAvailableTime?: Date;         // 下次可用时间（如果不可用）
}
```

## API 参考

### `checkVenueAvailability(venue: Venue, options: VenueAvailabilityOptions): VenueAvailabilityResult`

检查场地是否可用。

**参数：**
- `venue`: Venue - 场地信息
- `options`: VenueAvailabilityOptions - 可用性检查选项

**检查逻辑：**
1. 检查场地状态 (`venue.status`)
   - `'active'`: 可用
   - `'maintenance'`: 维护中
   - `'inactive'` 或 `'closed'`: 已关闭
2. 检查营业时间
3. 检查场地容量

**返回值：**
- `VenueAvailabilityResult` - 可用性检查结果

**示例：**
```typescript
const venue: Venue = {
  id: 'venue-123',
  name: '篮球场',
  status: 'active',
  capacity: 50,
  openingHours: null,
};

const options: VenueAvailabilityOptions = {
  date: new Date('2026-03-31'),
  startTime: '10:00',
  endTime: '12:00',
};

const result = checkVenueAvailability(venue, options);
// result: { status: 'available', isAvailable: true }
```

### `calculateNextAvailableTime(venue: Venue, currentTime?: Date): Date | null`

计算场地的最早可用时间。

**参数：**
- `venue`: Venue - 场地信息
- `currentTime`: Date (可选) - 当前时间，默认值为 `new Date()`

**逻辑：**
- 如果场地状态为 `'active'`: 返回 `currentTime`
- 其他状态: 返回 `null`

**返回值：**
- Date - 最早可用时间
- `null` - 不可用或无法确定

**示例：**
```typescript
const venue: Venue = { status: 'active' } as Venue;
const nextTime = calculateNextAvailableTime(venue);
// nextTime: 当前时间

const inactiveVenue: Venue = { status: 'inactive' } as Venue;
const noTime = calculateNextAvailableTime(inactiveVenue);
// noTime: null
```

### `validateVenueCapacity(venue: Venue, requiredCapacity: number): boolean`

验证场地容量是否足够。

**参数：**
- `venue`: Venue - 场地信息
- `requiredCapacity`: number - 所需容量

**检查逻辑：**
1. 场地状态必须为 `'active'`
2. 场地容量 (`venue.capacity`) 必须大于0
3. 所需容量必须小于等于场地容量

**返回值：**
- boolean - 容量是否足够

**示例：**
```typescript
const venue: Venue = {
  status: 'active',
  capacity: 50,
} as Venue;

validateVenueCapacity(venue, 30); // true
validateVenueCapacity(venue, 60); // false
validateVenueCapacity(venue, 0);  // false
```

### `getRecommendedTimeSlots(venue: Venue, durationMinutes: number, date?: Date): Array<{ startTime: string; endTime: string }>`

获取场地的推荐时间段。

**参数：**
- `venue`: Venue - 场地信息
- `durationMinutes`: number - 持续时间（分钟）
- `date`: Date (可选) - 日期，默认值为 `new Date()`

**逻辑：**
- 基于默认营业时间 (09:00-21:00) 生成时间段
- 时间段间隔为 `Math.max(durationMinutes, 30)` 分钟

**返回值：**
- Array<{ startTime: string; endTime: string }> - 推荐时间段列表

**示例：**
```typescript
const venue: Venue = {} as Venue;
const slots = getRecommendedTimeSlots(venue, 60); // 1小时时间段

// slots: [
//   { startTime: '09:00', endTime: '10:00' },
//   { startTime: '10:00', endTime: '11:00' },
//   { startTime: '11:00', endTime: '12:00' },
//   // ...
// ]
```

### `calculateVenueUtilization(venue: Venue, bookedHours: number, periodHours: number): number`

计算场地的使用率。

**参数：**
- `venue`: Venue - 场地信息
- `bookedHours`: number - 已预订小时数
- `periodHours`: number - 统计周期小时数

**计算逻辑：**
1. 基于默认营业时间 (09:00-21:00，每天12小时) 计算最大可用小时数
2. 使用率 = `bookedHours / maxAvailableHours`
3. 使用率上限为1 (100%)

**返回值：**
- number - 使用率 (0-1)

**示例：**
```typescript
const venue: Venue = {} as Venue;

// 一周内预订了24小时
const utilization = calculateVenueUtilization(venue, 24, 168); // 168小时 = 7天
// utilization: 24 / (12 * 7) = 24 / 84 ≈ 0.2857
```

## 使用示例

### 示例1: 场地预订前的可用性检查
```typescript
async function checkVenueBeforeBooking(
  venueId: string,
  bookingDate: Date,
  startTime: string,
  endTime: string,
  participantCount: number,
): Promise<{ canBook: boolean; reason?: string }> {
  // 获取场地信息
  const venue = await venueService.findById(venueId);
  if (!venue) {
    return { canBook: false, reason: '场地不存在' };
  }

  // 检查可用性
  const availabilityOptions: VenueAvailabilityOptions = {
    date: bookingDate,
    startTime,
    endTime,
  };
  
  const availabilityResult = checkVenueAvailability(venue, availabilityOptions);
  if (!availabilityResult.isAvailable) {
    return { canBook: false, reason: availabilityResult.reason };
  }

  // 检查容量
  if (!validateVenueCapacity(venue, participantCount)) {
    return { canBook: false, reason: '场地容量不足' };
  }

  return { canBook: true };
}
```

### 示例2: 场地管理面板
```typescript
class VenueManagementPanel {
  async getVenueStatus(venueId: string) {
    const venue = await venueService.findById(venueId);
    if (!venue) return null;

    const now = new Date();
    const nextAvailable = calculateNextAvailableTime(venue, now);
    
    // 获取今日推荐时间段
    const todaySlots = getRecommendedTimeSlots(venue, 60, now);
    
    // 计算本周使用率
    const weeklyBookings = await bookingService.getWeeklyBookings(venueId);
    const bookedHours = weeklyBookings.reduce((total, booking) => {
      return total + (booking.durationMinutes / 60);
    }, 0);
    
    const utilization = calculateVenueUtilization(venue, bookedHours, 168);

    return {
      venue,
      nextAvailable,
      todaySlots,
      utilization: Math.round(utilization * 100), // 转换为百分比
      status: venue.status,
    };
  }
}
```

### 示例3: 场地搜索和过滤
```typescript
async function searchAvailableVenues(
  searchCriteria: VenueSearchCriteria,
): Promise<Venue[]> {
  const allVenues = await venueService.findAll();
  
  return allVenues.filter(venue => {
    // 检查基本状态
    if (venue.status !== 'active') {
      return false;
    }

    // 检查容量
    if (!validateVenueCapacity(venue, searchCriteria.participantCount)) {
      return false;
    }

    // 检查时间可用性
    const availabilityResult = checkVenueAvailability(
      venue,
      searchCriteria.availabilityOptions,
    );
    
    return availabilityResult.isAvailable;
  });
}
```

## 业务规则

### 可用性检查优先级
1. **场地状态**: 必须为 `'active'`
2. **营业时间**: 必须在营业时间内（如果设置了营业时间）
3. **场地容量**: 必须大于0且足够容纳参与者

### 时间处理
- 所有时间使用本地时区
- 时间字符串格式为 `HH:mm` (24小时制)
- 日期时间计算不考虑时区转换

### 容量管理
- 容量为0的场地视为不可用
- 容量检查不考虑当前预订情况，只检查理论容量
- 实际预订时应结合当前预订情况进行更精确的容量检查

## 测试

场地可用性工具函数有单元测试覆盖。测试文件位于：
```
src/modules/venues/utils/venue-availability.utils.minimal.spec.ts
```

运行测试：
```bash
npm test -- venue-availability.utils.minimal.spec.ts
```

## 扩展和自定义

### 自定义营业时间处理
当前实现使用默认营业时间 (09:00-21:00)。要支持自定义营业时间，可以：

1. 扩展 `Venue` 实体，添加详细的营业时间字段
2. 修改 `isWithinBusinessHours` 函数以解析 `venue.openingHours`
3. 更新 `getRecommendedTimeSlots` 和 `calculateVenueUtilization` 函数

### 添加预订冲突检查
当前实现不检查时间冲突。要添加此功能，可以：

1. 创建 `checkBookingConflicts` 函数
2. 集成到 `checkVenueAvailability` 中
3. 需要访问预订数据库或服务

### 支持多时区
要支持多时区，需要：
1. 在 `Venue` 实体中添加时区字段
2. 修改时间处理函数以考虑时区转换
3. 使用 UTC 时间进行存储和计算

## 最佳实践

1. **缓存结果**: 对于不经常变化的场地信息，考虑缓存可用性检查结果
2. **批量处理**: 检查多个场地时，使用批量查询提高性能
3. **错误处理**: 总是处理可能的错误情况，如无效的时间格式
4. **日志记录**: 记录重要的可用性检查事件，便于调试和监控
5. **性能监控**: 监控可用性检查的性能，确保响应时间可接受

## 更新日志

### v1.0.0 (2026-03-31)
- 初始版本发布
- 包含5个核心场地可用性函数
- 基本的单元测试覆盖
- 详细的API文档

## 贡献指南

1. 添加新功能时请更新相应的单元测试
2. 保持函数的业务逻辑清晰和可维护
3. 更新API文档以反映更改
4. 遵循现有的代码风格和命名约定
5. 考虑向后兼容性

## 许可证

MIT License