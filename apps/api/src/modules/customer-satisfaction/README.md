# 客户满意度模块 (Customer Satisfaction)

> 多租户客户满意度调查与评估引擎。支持满意度问卷评分、多维统计汇总、趋势分析，辅助门店/品牌运营团队掌握客户体验全貌，为服务质量改进提供数据支撑。
> Phase-38 T168 财务冲刺 — 保底续产模块

---

## 一、模块概述

客户满意度模块是 **shenjiying88 零售中台** 面向门店级运营的核心反馈采集与分析组件。系统覆盖 **5 大满意度维度**（服务、环境、价格、设备、综合），为每家门店提供从单条评价到整体趋势的可视化能力，支撑总部 / 品牌运营侧的服务质量 KPI 考核。

| 属性 | 值 |
|------|-----|
| **模块名** | `customer-satisfaction` |
| **框架** | NestJS 10.x — 标准模块 |
| **接入位置** | `apps/api/src/modules/customer-satisfaction/` |
| **路由前缀** | `/customer-satisfaction` |
| **租户隔离** | TenantGuard — `tenantId` 强隔离 |
| **Swagger Tag** | `客户满意度调查` |
| **P-38 关联** | 运营成本优化 → 服务质量 ROI 分析 |

---

## 二、核心功能

### 2.1 满意度评价 CRUD
- **创建评价** — 记录客户姓名、评分、评价类别、评价内容、到访日期
- **列表查询** — 支持按门店、类别、日期范围、最低评分多维筛选
- **单条详情** — 查看评价的完整上下文
- **删除** — 物理删除（管理后台权限控制）

### 2.2 满意度汇总统计
- **多维度聚合** — 按门店 / 类别 / 日期维度汇总
- **指标计算** — 平均评分、响应数量、评分分布（1-5 星）
- **最佳 / 最差类别识别** — 自动标记 bestCategory / worstCategory
- **反馈率** — 到访量 vs 反馈量的比率

### 2.3 评价维度体系

| 枚举值 | 中文名称 | 说明 |
|--------|----------|------|
| `service` | 服务 | 服务水平、态度、响应速度 |
| `environment` | 环境 | 店面清洁、装修、氛围 |
| `price` | 价格 | 性价比、定价合理性 |
| `device` | 设备 | 设备状态、易用性、故障率 |
| `overall` | 综合 | 整体体验评价 |

---

## 三、目录结构

```
apps/api/src/modules/customer-satisfaction/
├── README.md                                              # 本文档
├── customer-satisfaction.entity.ts                        # 实体 & 枚举定义
├── customer-satisfaction.dto.ts                           # 请求/响应 DTO
├── customer-satisfaction.service.ts                       # 业务逻辑层
├── customer-satisfaction.service.test.ts                  # 服务单元测试
├── customer-satisfaction.role-extended.test.ts            # 角色权限扩展测试
├── customer-satisfaction.controller.ts                    # 路由控制器
├── customer-satisfaction.controller.metadata.test.ts      # 控制器元数据测试
├── customer-satisfaction.module.ts                        # NestJS 模块定义
├── customer-satisfaction.test.ts                          # 集成测试
├── customer-satisfaction.service.boost.spec.ts            # 服务增强测试
└── zz-customer-satisfaction.service-boost.test.ts         # 性能/边界测试
```

### 文件职责

| 文件 | 职责 |
|------|------|
| `.entity.ts` | `CustomerSatisfaction` 接口 & `SatisfactionCategory` 枚举 |
| `.dto.ts` | `CreateSatisfactionDto` / `SatisfactionQueryDto` / `SatisfactionSummaryDto` / `SatisfactionListDto` |
| `.service.ts` | 业务逻辑：列表查询、创建、汇总、删除 |
| `.controller.ts` | REST 端点 + `TenantGuard` 保护 + Swagger 装饰 |
| `.module.ts` | 标准 NestJS 模块，导出 Service |
| `*test.ts` / `*.spec.ts` | 全堆栈测试（见 §五） |

---

## 四、API 端点总览

| 方法 | 路由 | 说明 | 权限 |
|------|------|------|------|
| `GET` | `/customer-satisfaction` | 满意度列表（分页/筛选） | 租户隔离 |
| `GET` | `/customer-satisfaction/summary` | 满意度汇总统计 | 租户隔离 |
| `GET` | `/customer-satisfaction/:id` | 单条详情 | 租户隔离 |
| `POST` | `/customer-satisfaction` | 创建评价 | 租户隔离 |
| `DELETE` | `/customer-satisfaction/:id` | 删除评价 | 租户隔离 |

### 查询参数（GET list）

| 参数 | 类型 | 说明 |
|------|------|------|
| `storeId` | string | 门店 ID 精确过滤 |
| `category` | enum | 评价类别（service/environment/price/device/overall） |
| `startDate` | ISO date | 起始日期 |
| `endDate` | ISO date | 截止日期 |
| `minScore` | number (1-5) | 最低评分过滤 |

---

## 五、测试覆盖率

### 测试文件清单

| 测试文件 | 类型 | 覆盖场景 |
|----------|------|----------|
| `customer-satisfaction.service.test.ts` | 单元 | Service CRUD、汇总逻辑 |
| `customer-satisfaction.service.boost.spec.ts` | 单元 | 边界/异常路径 / 性能增强 |
| `customer-satisfaction.test.ts` | 集成 | 全链路调用 |
| `customer-satisfaction.controller.test.ts` | — | *（当前命名下可能缺失，由集成测试覆盖）* |
| `customer-satisfaction.controller.metadata.test.ts` | 元数据 | Swagger 装饰 & 路由元数据断言 |
| `customer-satisfaction.role-extended.test.ts` | 权限 | 角色扩展 / 多租户权限穿透 |
| `zz-customer-satisfaction.service-boost.test.ts` | 性能 | 大量数据压力 / 边界测试 |

**共 6 个测试文件**（6 test files），涵盖：
- ✅ 核心 CRUD 业务逻辑
- ✅ 汇总统计聚合运算
- ✅ Swagger 元数据一致性
- ✅ 多租户权限隔离
- ✅ 边界 & 增强测试

---

## 六、P-38 财务冲刺关联说明

### 6.1 保底续产定位

本模块纳入 **Phase-38 T168 财务冲刺** 的 **保底续产清单**，具有以下特征：

| 维度 | 说明 |
|------|------|
| 营运影响 | 准实时 — 客户满意度直接关联门店运营成本评估 |
| 数据依赖 | 自包含（in-memory list），零外部中间件依赖 |
| 风险等级 | 🟢 低风险 — 全链路测试覆盖，无扩散依赖 |
| 改造成本 | 极低 — 标准 CRUD，无复杂事务 |
| 续产优先级 | P1 — 保底续产模块 |

### 6.2 优化方向（T164~T168）

1. **持久化迁移** — 当前为内存存储，下阶段需对接 PostgreSQL
2. **趋势分析** — 增加同比 / 环比时间序列比较
3. **满意度预警** — 当评分低于阈值时自动触发运营工单
4. **多语言评价** — 支持 i18n 评价内容

---

## 七、使用方式

```bash
# 本地开发 — 在 api 目录下
cd apps/api
pnpm run start:dev

# 创建一条评价 (示例)
curl -X POST http://localhost:3000/customer-satisfaction \
  -H "Content-Type: application/json" \
  -H "x-tenant-id: demo-tenant" \
  -d '{
    "storeId": "store-001",
    "customerName": "张三",
    "score": 5,
    "category": "service",
    "comment": "服务态度很好，快捷高效",
    "visitDate": "2026-07-20"
  }'

# 获取汇总
curl http://localhost:3000/customer-satisfaction/summary \
  -H "x-tenant-id: demo-tenant"

# 运行测试
pnpm run test -- --testPathPattern=customer-satisfaction
```

---

## 八、依赖关系

| 依赖模块 | 用途 | 耦合类型 |
|----------|------|----------|
| `TenantGuard` (`../agent/tenant.guard`) | 租户身份隔离 | 强依赖 |
| `TenantContext` (`../tenant/`) | 从请求中提取租户上下文 | 强依赖 |
| `class-validator` / `class-transformer` | DTO 校验 & 类型转换 | 编译依赖 |
| `@nestjs/swagger` | OpenAPI 声明式文档 | 编译依赖 |

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
