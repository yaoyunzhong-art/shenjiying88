# 合同管理模块 (Contract Manager)

> 多租户合同全生命周期管理引擎。支持合同 CRUD、状态变更（草稿 → 待签 → 已签 → 生效 → 过期 / 终止）、条款增删改查与批量导入、到期 / 过期合同智能分析，提供 mock 数据种子辅助开发与演示。
> Phase-38 T168 财务冲刺 — 保底续产模块

---

## 一、模块概述

合同管理模块是 **shenjiying88 零售中台** 面向采购 / 销售 / 服务 / 租赁场景的核心合约管理组件。系统覆盖 **6 种合同类型**、**6 种合同状态**，附带独立的条款子模块（单条 / 批量操作），并通过到期分析引擎为财务团队提供合同履约成本预判能力。权限颗粒度到 `contract:read` / `contract:create` / `contract:update` / `contract:terminate` / `contract:clause:manage` 五个维度。

| 属性 | 值 |
|------|-----|
| **模块名** | `contract-manager` |
| **框架** | NestJS 10.x — 标准模块 |
| **接入位置** | `apps/api/src/modules/contract-manager/` |
| **路由前缀** | `/contracts` |
| **租户隔离** | TenantGuard + `@RequireTenantScope()` — 双重隔离 |
| **权限控制** | `@RequirePermissions()` — 5 种颗粒度权限 |
| **Swagger Tag** | *(由 Controller 隐式生成)* |
| **P-38 关联** | 合同到期分析 → 财务履约成本预警 |

---

## 二、核心功能

### 2.1 合同 CRUD
- **创建合同** — 填写双方主体、合同类型、金额、有效期、签署日期
- **列表查询** — 按状态、类型、关键词模糊搜索
- **合同详情** — 含关联条款列表
- **更新合同** — 修改合同主体、金额、有效期等
- **状态变更** — 草稿 → 待签 → 已签 → 生效 → 过期 / 终止

### 2.2 合同到期分析
- **即将到期分析** — 指定未来天数（默认 30 天）内即将到期的合同
- **已过期分析** — 已超过 endDate 且未终止的合同列表

### 2.3 条款管理
- **单条添加** — 指定条款标题、内容、排序权重
- **批量导入** — `POST /clauses/bulk` 一次创建多条条款
- **条款列表** — 按合同 ID 查询所有关联条款
- **条款更新** — 标题、内容、排序可单独修改
- **条款删除** — 按 clauseId 物理删除

### 2.4 合同状态机

| 枚举值 | 中文含义 | 说明 |
|--------|----------|------|
| `DRAFT` | 草稿 | 合同初始化，尚未签署 |
| `PENDING_SIGN` | 待签署 | 等待甲乙双方签署 |
| `SIGNED` | 已签署 | 协议已签署，未到生效日期 |
| `ACTIVE` | 生效中 | 合同在有效期内正常执行 |
| `EXPIRED` | 已过期 | 合同超过 endDate 自动过期 |
| `TERMINATED` | 已终止 | 提前终止（违约 / 协商 / 解约） |

### 2.5 合同类型

| 枚举值 | 中文含义 | 说明 |
|--------|----------|------|
| `PURCHASE` | 采购合同 | 原材料 / 成品采购 |
| `SALE` | 销售合同 | 商品 / 服务销售 |
| `SERVICE` | 服务合同 | 第三方服务提供 |
| `LEASE` | 租赁合同 | 场地 / 设备租赁 |
| `NDA` | 保密协议 | 信息保密约束 |

### 2.6 权限模型

| 权限标识 | 影响端点 | 说明 |
|----------|----------|------|
| `contracts:read` | 所有端点 | 类级别 — 合同阅读权限 |
| `contract:create` | `POST /contracts`, `POST /contracts/seed` | 创建合同 |
| `contract:update` | `PATCH /contracts/:contractId` | 修改合同信息 |
| `contract:terminate` | `PATCH /contracts/:contractId/status` | 终止 / 变更合同状态 |
| `contract:clause:manage` | 条款相关全部端点 | 条款增删改查 |

---

## 三、目录结构

```
apps/api/src/modules/contract-manager/
├── README.md                                              # 本文档
├── contract-manager.entity.ts                             # 实体 & 枚举定义
├── contract-manager.dto.ts                                # 请求/响应 DTO
├── contract-manager.service.ts                            # 业务逻辑层
├── contract-manager.service.test.ts                       # 服务单元测试
├── contract-manager.controller.ts                         # 路由控制器
├── contract-manager.controller.test.ts                    # 控制器单元测试
├── contract-manager.controller.metadata.test.ts           # 控制器元数据测试
├── contract-manager.module.ts                             # NestJS 模块定义
├── contract-manager.module.test.ts                        # 模块定义测试
├── contract-manager.role.test.ts                          # 角色基础权限测试
├── contract-manager.role-extended.test.ts                 # 角色扩展权限测试
└── zz-contract-manager.service-boost.test.ts              # 性能/边界测试
```

### 文件职责

| 文件 | 职责 |
|------|------|
| `.entity.ts` | `Contract` / `ContractClause` 接口 + `ContractStatus` / `ContractType` 枚举 |
| `.dto.ts` | `CreateContractDto` / `UpdateContractDto` / `UpdateContractStatusDto` / `ContractQueryDto` + 条款相关 DTO |
| `.service.ts` | 合同/条款全生命周期管理、到期分析、mock seed |
| `.controller.ts` | REST 端点 + TenantGuard + TenantScope + Permissions 多重守卫 |
| `.module.ts` | 标准 NestJS 模块，导出 Service |
| `*test.ts` / `*.spec.ts` | 全堆栈测试（见 §五） |

---

## 四、API 端点总览

### 4.1 合同 CRUD

| 方法 | 路由 | 权限 | 说明 |
|------|------|------|------|
| `POST` | `/contracts` | `contract:create` | 创建合同 |
| `GET` | `/contracts` | `contracts:read` | 合同列表（状态/类型/关键词筛选） |
| `GET` | `/contracts/:contractId` | `contracts:read` | 合同详情 |
| `PATCH` | `/contracts/:contractId` | `contract:update` | 更新合同信息 |
| `PATCH` | `/contracts/:contractId/status` | `contract:terminate` | 更新合同状态 |

### 4.2 合同分析

| 方法 | 路由 | 权限 | 说明 |
|------|------|------|------|
| `GET` | `/contracts/analysis/expiring` | `contracts:read` | 即将到期合同（默认 30 天） |
| `GET` | `/contracts/analysis/expired` | `contracts:read` | 已过期合同列表 |

### 4.3 条款管理

| 方法 | 路由 | 权限 | 说明 |
|------|------|------|------|
| `POST` | `/contracts/:contractId/clauses` | `contract:clause:manage` | 添加条款 |
| `POST` | `/contracts/:contractId/clauses/bulk` | `contract:clause:manage` | 批量导入条款 |
| `GET` | `/contracts/:contractId/clauses` | `contracts:read` | 条款列表 |
| `PATCH` | `/contracts/clauses/:clauseId` | `contract:clause:manage` | 更新条款 |
| `DELETE` | `/contracts/clauses/:clauseId` | `contract:clause:manage` | 删除条款 |

### 4.4 工具

| 方法 | 路由 | 权限 | 说明 |
|------|------|------|------|
| `POST` | `/contracts/seed` | `contract:create` | 种子 mock 合同数据 |

### 查询参数（GET list）

| 参数 | 类型 | 说明 |
|------|------|------|
| `status` | enum | 合同状态（DRAFT / PENDING_SIGN / SIGNED / ACTIVE / EXPIRED / TERMINATED） |
| `type` | enum | 合同类型（PURCHASE / SALE / SERVICE / LEASE / NDA） |
| `search` | string | 关键词模糊搜索（按名称/合同编号） |

---

## 五、测试覆盖率

### 测试文件清单

| 测试文件 | 类型 | 覆盖场景 |
|----------|------|----------|
| `contract-manager.service.test.ts` | 单元 | Service 层合同 CRUD、状态变更、条款增删改查、到期分析 |
| `contract-manager.service.boost.spec.ts` | — | *（当前使用命名 zz- 测试文件替代）* |
| `contract-manager.controller.test.ts` | 单元 | 控制器端点路由、请求/响应映射 |
| `contract-manager.controller.metadata.test.ts` | 元数据 | Swagger 装饰 & Nest 路由元数据 |
| `contract-manager.module.test.ts` | 单元 | 模块依赖注入验证 |
| `contract-manager.role.test.ts` | 权限 | 角色基础权限校验 |
| `contract-manager.role-extended.test.ts` | 权限 | 角色扩展 / 多租户穿透场景 |
| `zz-contract-manager.service-boost.test.ts` | 性能 | 边界条件 / 大量数据压力测试 |

**共 7 个测试文件**（7 test files），涵盖：
- ✅ 合同 CRUD 完整业务逻辑
- ✅ 条款增删改查 + 批量导入
- ✅ 到期 / 过期智能分析
- ✅ 路由元数据 & Swagger 一致性
- ✅ 模块依赖注入正确性
- ✅ 5 种权限颗粒度校验
- ✅ 边界 & 增强测试

---

## 六、P-38 财务冲刺关联说明

### 6.1 保底续产定位

本模块纳入 **Phase-38 T168 财务冲刺** 的 **保底续产清单**，具有以下特征：

| 维度 | 说明 |
|------|------|
| 营运影响 | 准实时 — 合同到期分析与财务履约成本直接挂钩 |
| 数据依赖 | 自包含（in-memory list），零外部中间件依赖 |
| 风险等级 | 🟢 低风险 — 全链路测试覆盖，无扩散依赖 |
| 改造成本 | 低 — 复杂度略高于纯 CRUD（条款子模块 + 到期分析），但逻辑封闭 |
| 续产优先级 | P1 — 保底续产模块 |

### 6.2 优化方向（T164~T168）

1. **持久化迁移** — 当前为内存存储，下阶段需对接 PostgreSQL
2. **合同模板** — 支持合同模板化创建，减少重复填写
3. **自动状态流转** — 基于定时任务自动将过期合同标记为 `EXPIRED`
4. **合同提醒** — 到期前 N 天通过通知模块推送提醒给相关人员
5. **附件管理** — 集成 OSS 模块支持合同 PDF 上传 / 预览
6. **审计日志** — 每次状态变更和条款修改写入 audit 模块

---

## 七、使用方式

```bash
# 本地开发 — 在 api 目录下
cd apps/api
pnpm run start:dev

# 创建合同 (示例)
curl -X POST http://localhost:3000/contracts \
  -H "Content-Type: application/json" \
  -H "x-tenant-id: demo-tenant" \
  -d '{
    "name": "2026年度门店设备采购合同",
    "type": "PURCHASE",
    "partyA": "shenjiying88 运营主体",
    "partyB": "某某设备供应商",
    "amount": 500000.00,
    "startDate": "2026-01-01",
    "endDate": "2026-12-31",
    "signedDate": "2026-01-10"
  }'

# 添加条款
curl -X POST http://localhost:3000/contracts/{contractId}/clauses \
  -H "Content-Type: application/json" \
  -H "x-tenant-id: demo-tenant" \
  -d '{
    "title": "付款方式",
    "content": "合同签订后支付50%，验收后支付50%",
    "sortOrder": 1
  }'

# 查看即将到期合同
curl "http://localhost:3000/contracts/analysis/expiring?withinDays=30" \
  -H "x-tenant-id: demo-tenant"

# 运行测试
pnpm run test -- --testPathPattern=contract-manager
```

---

## 八、依赖关系

| 依赖模块 | 用途 | 耦合类型 |
|----------|------|----------|
| `TenantGuard` (`../agent/tenant.guard`) | 租户身份隔离 | 强依赖 |
| `TenantContext` (`../tenant/`) | 从请求中提取租户上下文 | 强依赖 |
| `@RequireTenantScope()` | 租户作用域守卫 | 强依赖 |
| `@RequirePermissions()` (`../foundation/identity-access/`) | 细粒度权限控制 | 强依赖 |
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
