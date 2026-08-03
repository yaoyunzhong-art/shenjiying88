# 🗺️ PRD: 场地预订管理模块(V24)
> 日期: 2026-07-21 | 圈梁: 代码✅ 测试✅ 审计✅ PRD补写

**用途**: 场地预订全生命周期管理（场地 CRUD + 时段定价 + 预订/查询/确认/释放）
**产出**: `apps/api/src/modules/venue/` (增强版)
**作用**: V24 场地运营核心功能

---

## 一、业务背景

游乐/娱乐场所的场地管理需要基于时段的精细化预订系统。店长需要创建场地并设定时段定价，前台/运营专员需要为客户预订场地并按流程处理预订状态流转，系统需自动处理场地状态同步。

## 二、功能范围

### 2.1 场地管理（已实现）
| 功能 | 端点 | 说明 |
|------|------|------|
| 创建场地 | `POST /venue` | 按名称/类型/容量/价格创建 |
| 场地列表 | `GET /venue` | 支持 type/status/search 筛选 |
| 场地详情 | `GET /venue/:id` | 获取单个场地信息 |
| 更新场地 | `PUT /venue/:id` | 更新场地字段，含状态转换 |
| 删除场地 | `DELETE /venue/:id` | 删除场地记录 |

### 2.2 时段定价
| 功能 | 说明 |
|------|------|
| TimeSlotPricing | 各时段独立定价（早/中/晚） |
| HolidayPricing | 节假日特殊定价 |

### 2.3 场地预订（V24 新增）
| 功能 | 端点 | 说明 |
|------|------|------|
| 创建预订 | `POST /venue/booking` | 按场地+时段+人数创建预订 |
| 预订列表 | `GET /venue/booking/list` | 支持 venueId/userId/date/status/shift 筛选 |
| 预订详情 | `GET /venue/booking/:id` | 获取单个预订 |
| 确认预订 | `POST /venue/booking/:id/confirm` | pending→confirmed，自动同步场地→BOOKED |
| 开始使用 | `POST /venue/booking/:id/start` | confirmed→in_progress，自动同步场地→OCCUPIED |
| 完成使用 | `POST /venue/booking/:id/complete` | in_progress→completed，自动释放场地→IDLE |
| 取消预订 | `POST /venue/booking/:id/cancel` | 任意状态→cancelled，自动释放场地 |
| 可用时段 | `GET /venue/booking/:venueId/availability?date=YYYY-MM-DD` | 检查各时段是否可预订 |
| 释放场地 | `POST /venue/:id/release` | 手动释放场地为 IDLE |

## 三、核心数据模型

### Venue（场地）
- id, tenantId, name, type, capacity, status
- priceCents, timeSlotPricing[], holidayPricing[]
- tags[], description, createdAt, updatedAt

### VenueBooking（场地预订）
- id, tenantId, venueId, venueName
- userId, userName, date, shift
- startTime, endTime, status
- priceCents, depositCents, guestCount
- remark, cancelledReason, cancelledAt

## 四、状态机

### 场地状态
```
IDLE → OCCUPIED / MAINTENANCE / BOOKED
OCCUPIED → IDLE / MAINTENANCE
MAINTENANCE → IDLE
BOOKED → OCCUPIED / IDLE / MAINTENANCE
```

### 预订状态
```
PENDING → CONFIRMED / CANCELLED
CONFIRMED → IN_PROGRESS / CANCELLED
IN_PROGRESS → COMPLETED / CANCELLED
COMPLETED → (终端)
CANCELLED → (终端)
```

## 五、冲突检测

- 同一场地在同一时间段不能有重叠的活跃预订（PENDING/CONFIRMED/IN_PROGRESS）
- 确认时（confirm）重新检测冲突
- 人数不能超出场地容量

## 六、测试覆盖

| 测试文件 | 类型 | 数量 |
|---------|------|------|
| venue.service.spec.ts | 单元测试（内联） | ≥12 |
| venue.controller.test.ts | 控制器单元测试 | ≥30 |
| venue.e2e.test.ts | E2E | ≥10 |
| venue.role.test.ts | 角色旅程测试 | 8角色 |
| venue.role-extended.test.ts | 扩展角色测试 | - |

## 七、技术选型

- NestJS Controller + Service 架构
- 内存 Map 存储（无 DB 依赖，可快速注入 DB 实现）
- 用户租户通过 TenantScopeGuard 隔离
- 装饰器路由元数据测试
- 兼容现有 P-25 基础模块
