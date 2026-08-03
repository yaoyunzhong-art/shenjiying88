# Delivery Tracking — 配送追踪模块

> 多租户配送物流追踪服务。管理配送订单全生命周期（创建 → 分配 → 运输 → 签收），支持配送事件时间线记录、多种配送方式（自提 / 快递 / 第三方物流），为门店运营和客户提供实时物流可视化能力。
> Phase-38 T168 财务冲刺 — 保底续产模块

---

## 一、模块概述

配送追踪模块是 **shenjiying88 零售中台** 面向门店 / 仓储物流链路的核心组件，管理从订单下发到最终签收的完整运输过程。系统支持 **4 种配送方式**（自提 / 快递 / 快递 / 第三方物流）、**6 种配送状态**，并基于事件驱动记录完整物流时间线，为客户端与运营后台提供一致的配送进度视图。

| 属性 | 值 |
|------|-----|
| **模块名** | `delivery-tracking` |
| **框架** | NestJS 10.x — 标准模块 |
| **接入位置** | `apps/api/src/modules/delivery-tracking/` |
| **路由前缀** | `/delivery-tracking` |
| **租户隔离** | TenantGuard — `tenantId` 强隔离 |
| **P-38 关联** | 物流成本优化 → 配送履约效率分析 |

---

## 二、核心功能

### 2.1 配送订单管理（CRUD）
- **创建配送** — 记录商品配送方式、承运商、收件信息、预计到达日期
- **配送列表** — 按配送状态、方式、关联订单号精确筛选
- **配送详情** — 单笔配送完整信息查询
- **更新配送** — 承运商、地址、预计时间等信息变更
- **状态更新** — 配送状态流转（含可选备注）

### 2.2 配送事件时间线
- **事件记录** — 每个状态变更自动生成物流事件（含地点、描述、时间戳）
- **时间线查询** — 按配送单号获取完整跟踪链路

### 2.3 Mock 数据种子

提供 `POST /delivery-tracking/seed` 端点，用于本地开发 / 演示环境快速生成模拟配送数据。

### 2.4 配送状态机

| 枚举值 | 中文含义 | 说明 |
|--------|----------|------|
| `PENDING` | 待处理 | 配送单已创建，等待分配承运商 |
| `PICKED_UP` | 已揽收 | 包裹已被承运商揽收 |
| `IN_TRANSIT` | 运输中 | 包裹正在运输途中 |
| `ARRIVED` | 已到达 | 到达目的地站点/仓库 |
| `DELIVERED` | 已签收 | 客户已签收 |
| `FAILED` | 配送失败 | 异常情况导致配送失败 |

### 2.5 配送方式

| 枚举值 | 中文含义 | 说明 |
|--------|----------|------|
| `SELF_PICKUP` | 自提 | 客户到店自取 |
| `COURIER` | 同城快递 | 同城即时配送 |
| `EXPRESS` | 快递 | 标准快递配送 |
| `THIRD_PARTY` | 第三方物流 | 合作第三方物流平台 |

---

## 三、目录结构

```
apps/api/src/modules/delivery-tracking/
├── README.md                                              # 本文档
├── delivery-tracking.entity.ts                            # 实体 & 枚举定义
├── delivery-tracking.dto.ts                               # 请求/响应 DTO
├── delivery-tracking.service.ts                           # 业务逻辑层
├── delivery-tracking.service.test.ts                      # 服务单元测试
├── delivery-tracking.controller.ts                        # 路由控制器
├── delivery-tracking.controller.test.ts                   # 控制器单元测试
├── delivery-tracking.controller.metadata.test.ts          # 控制器元数据测试
├── delivery-tracking.module.ts                            # NestJS 模块定义
├── delivery-tracking.module.test.ts                       # 模块定义测试
├── delivery-tracking.role.test.ts                         # 角色基础权限测试
└── delivery-tracking.role-extended.test.ts                # 角色扩展权限测试
```

### 文件职责

| 文件 | 职责 |
|------|------|
| `.entity.ts` | `DeliveryRecord` / `DeliveryEvent` 接口 + `DeliveryStatus` / `DeliveryMethod` 枚举 |
| `.dto.ts` | `CreateDeliveryDto` / `UpdateDeliveryDto` / `UpdateDeliveryStatusDto` / `DeliveryQueryDto` / `CreateDeliveryEventDto` |
| `.service.ts` | 配送全生命周期管理、事件记录、mock seed |
| `.controller.ts` | REST 端点 + TenantGuard + 配送事件与时间线端点 |
| `.module.ts` | 标准 NestJS 模块，导出 Service |
| `*test.ts` | 全堆栈测试（见 §五） |

---

## 四、API 端点总览

### 4.1 配送 CRUD

| 方法 | 路由 | 说明 | 权限 |
|------|------|------|------|
| `POST` | `/delivery-tracking` | 创建配送订单 | 租户隔离 |
| `GET` | `/delivery-tracking` | 配送列表（支持筛选） | 租户隔离 |
| `GET` | `/delivery-tracking/:deliveryId` | 配送详情 | 租户隔离 |
| `PATCH` | `/delivery-tracking/:deliveryId` | 更新配送信息 | 租户隔离 |
| `PATCH` | `/delivery-tracking/:deliveryId/status` | 更新配送状态 | 租户隔离 |

### 4.2 事件与时间线

| 方法 | 路由 | 说明 | 权限 |
|------|------|------|------|
| `POST` | `/delivery-tracking/:deliveryId/events` | 追加物流事件 | 租户隔离 |
| `GET` | `/delivery-tracking/:deliveryId/timeline` | 获取完整追踪时间线 | 租户隔离 |

### 4.3 工具

| 方法 | 路由 | 说明 | 权限 |
|------|------|------|------|
| `POST` | `/delivery-tracking/seed` | 种子 mock 配送数据 | 租户隔离 |

### 查询参数（GET list）

| 参数 | 类型 | 说明 |
|------|------|------|
| `status` | enum | 配送状态（PENDING / PICKED_UP / IN_TRANSIT / ARRIVED / DELIVERED / FAILED） |
| `method` | enum | 配送方式（SELF_PICKUP / COURIER / EXPRESS / THIRD_PARTY） |
| `orderNo` | string | 关联订单号精确匹配 |

---

## 五、测试覆盖率

### 测试文件清单

| 测试文件 | 类型 | 覆盖场景 |
|----------|------|----------|
| `delivery-tracking.service.test.ts` | 单元 | Service 层 CRUD、事件添加、mock seed |
| `delivery-tracking.controller.test.ts` | 单元 | 控制器端点路由、请求/响应映射 |
| `delivery-tracking.controller.metadata.test.ts` | 元数据 | Swagger 装饰 & Nest 路由元数据 |
| `delivery-tracking.module.test.ts` | 单元 | 模块依赖注入验证 |
| `delivery-tracking.role.test.ts` | 权限 | 角色基础权限校验 |
| `delivery-tracking.role-extended.test.ts` | 权限 | 角色扩展 / 多租户穿透场景 |

**共 6 个测试文件**（6 test files），涵盖：
- ✅ 配送 CRUD 完整业务逻辑
- ✅ 配送事件时间线管理
- ✅ 路由元数据 & Swagger 一致性
- ✅ 模块依赖注入正确性
- ✅ 角色 / 租户权限隔离

---

## 六、P-38 财务冲刺关联说明

### 6.1 保底续产定位

本模块纳入 **Phase-38 T168 财务冲刺** 的 **保底续产清单**，具有以下特征：

| 维度 | 说明 |
|------|------|
| 营运影响 | 准实时 — 配送履约效率直接影响客户体验与退货率 |
| 数据依赖 | 自包含（in-memory list），零外部中间件依赖 |
| 风险等级 | 🟢 低风险 — 全链路测试覆盖，无扩散依赖 |
| 改造成本 | 极低 — 标准 CRUD + 事件追踪，无复杂事务 |
| 续产优先级 | P1 — 保底续产模块 |

### 6.2 优化方向（T164~T168）

1. **持久化迁移** — 当前为内存存储，下阶段需对接 PostgreSQL
2. **第三方物流对接** — 集成快递鸟 / 顺丰等物流 API 实现自动状态同步
3. **配送时效分析** — 按承运商 / 区域统计平均配送时长
4. **异常预警** — 超时未签收自动触发运营告警
5. **客户通知** — 状态变更时通过消息队列推送客户通知

---

## 七、使用方式

```bash
# 本地开发 — 在 api 目录下
cd apps/api
pnpm run start:dev

# 创建配送订单 (示例)
curl -X POST http://localhost:3000/delivery-tracking \
  -H "Content-Type: application/json" \
  -H "x-tenant-id: demo-tenant" \
  -d '{
    "orderNo": "ORD-202607-001",
    "method": "EXPRESS",
    "carrier": "顺丰速运",
    "trackingNo": "SF1234567890",
    "sender": "深圳南山旗舰店",
    "receiver": "张三",
    "receiverPhone": "13800138000",
    "receiverAddress": "北京市朝阳区建国路88号",
    "estimatedAt": "2026-07-30T18:00:00.000Z"
  }'

# 更新配送状态
curl -X PATCH http://localhost:3000/delivery-tracking/{deliveryId}/status \
  -H "Content-Type: application/json" \
  -H "x-tenant-id: demo-tenant" \
  -d '{"status": "IN_TRANSIT", "remark": "已从分拨中心发出"}'

# 查看时间线
curl http://localhost:3000/delivery-tracking/{deliveryId}/timeline \
  -H "x-tenant-id: demo-tenant"

# 运行测试
pnpm run test -- --testPathPattern=delivery-tracking
```

---

## 八、依赖关系

| 依赖模块 | 用途 | 耦合类型 |
|----------|------|----------|
| `TenantGuard` (`../agent/tenant.guard`) | 租户身份隔离 | 强依赖 |
| `TenantContext` (`../tenant/`) | 从请求中提取租户上下文 | 强依赖 |
| `class-validator` | DTO 校验 | 编译依赖 |

---

> **TSC 0 铁律**：本文件不修改任何源代码，仅作为模块文档补充。所有业务逻辑以 `.entity.ts` / `.service.ts` / `.controller.ts` 为准。

<!--
╔══════════════════════════════════════════════════════════════════╗
║                                                                  ║
║         圈梁五道箍指令 — 树哥A README 补全规范                   ║
║                                                                  ║
║  ① 模块概述：说明模块定位、技术栈、路由前缀、P-38关联           ║
║  ② 核心功能：详细列出所有功能点，含枚举值和参数说明            ║
║  ③ 目录结构：列出所有文件并解释每个文件的职责                  ║
║  ④ 测试覆盖率：逐一说明测试文件的覆盖场景                      ║
║  ⑤ P-38财务冲刺关联：保底续产定位、优化方向                    ║
║  ⑥ API端点：完整路由表 + 查询参数说明                          ║
║  ⑦ 使用方式：curl示例 + 测试运行命令                           ║
║  ⑧ 依赖关系：模块间耦合关系清晰标注                            ║
║  ⑨ TSC 0铁律：不修改任何源代码                                ║
║                                                                  ║
╚══════════════════════════════════════════════════════════════════╝
-->
