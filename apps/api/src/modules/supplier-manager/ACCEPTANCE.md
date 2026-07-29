# ✅ ACCEPTANCE: supplier-manager
> 2026-07-29 | V23 圈梁: 代码✅ 测试✅ | 供应商管理模块

## 模块功能说明

供应商管理模块提供供应商全生命周期管理能力，包括供应商创建、查询、更新和删除操作。支持按状态、评级、分类和关键词搜索多维度筛选。所有操作受多租户隔离保护，数据按 tenantId 范围隔离。

### 供应商评级体系

| 评级 | 含义 |
|------|------|
| A | 优质供应商 |
| B | 合格供应商 |
| C | 待观察供应商 |
| D | 风险供应商 |

### 供应商状态

| 状态 | 含义 |
|------|------|
| Active | 合作中 |
| Inactive | 暂停合作 |
| Suspended | 冻结合作 |

## API 端点列表

| 方法 | 路径 | 说明 | 鉴权 |
|------|------|------|------|
| POST | `/suppliers` | 创建供应商 | TenantGuard |
| GET | `/suppliers` | 供应商列表（支持多维筛选） | TenantGuard |
| GET | `/suppliers/:supplierId` | 供应商详情 | TenantGuard |
| PATCH | `/suppliers/:supplierId` | 更新供应商信息 | TenantGuard |
| DELETE | `/suppliers/:supplierId` | 删除供应商 | TenantGuard |

### 查询参数 (SupplierQueryDto)

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| status | enum | N | Active / Inactive / Suspended |
| rating | enum | N | A / B / C / D |
| category | string | N | 供应商分类 |
| search | string | N | 关键词搜索（匹配名称/编码） |

### 创建/更新请求体

**CreateSupplierDto（必填）**

| 字段 | 类型 | 说明 |
|------|------|------|
| name | string | 供应商名称 |
| code | string | 供应商编码 |
| contactPerson | string | 联系人 |
| phone | string | 联系电话 |
| email | string | 邮箱 |
| address | string | 地址 |
| status | enum | 状态（可选，默认 Active） |
| rating | enum | 评级（可选，默认 B） |
| category | string | 分类 |
| remark | string | 备注（可选） |

**UpdateSupplierDto（全部可选）**: 与 CreateSupplierDto 字段相同但均为可选项

## 测试覆盖

| 测试文件 | 覆盖内容 |
|----------|----------|
| `supplier-manager.controller.test.ts` | Controller 正例/反例测试 |
| `supplier-manager.controller.metadata.test.ts` | Controller 路由元数据 |
| `supplier-manager.service.test.ts` | Service CRUD 全场景测试 |
| `supplier-manager.service.spec.ts` | Service 单元测试 |
| `supplier-manager.module.test.ts` | 模块元数据（Controller/Service/Export） |
| `supplier-manager.dto.test.ts` | DTO 验证规则测试 |
| `supplier-manager.entity.test.ts` | 实体定义与状态枚举测试 |
| `supplier-manager.role.test.ts` | 角色场景测试 |
| `supplier-manager.role-extended.test.ts` | 角色扩展测试 |

## 验收标准

### 功能性

- [x] 供应商创建：全套必填字段校验 + 自动分配 ID + 设置新建时间
- [x] 供应商列表：支持状态/评级/分类/关键词 4 种筛选方式
- [x] 供应商详情：按 supplierId + tenantId 双键查询
- [x] 供应商更新：支持部分更新（PATCH 语义）
- [x] 供应商删除：软删除或物理删除，返回 `{ success: true }`
- [x] 不存在的供应商返回 Error（404 语义）

### 安全性

- [x] Controller 使用 `TenantGuard` 多租户隔离
- [x] 所有 CRUD 操作均通过 `@TenantContext()` 注入租户上下文
- [x] 数据按 tenantId 范围隔离，跨租户不可见

### 数据完整性

- [x] 状态枚举限制（Active / Inactive / Suspended）
- [x] 评级枚举限制（A / B / C / D）
- [x] 邮箱格式验证（@IsEmail）
- [x] 必填字段拒绝空值
- [x] 分类分类体系（电子元器件 / 包装材料 / 食品原料 / 物流配送 等）

### 代码质量

- [x] Service 有单元测试
- [x] Controller 有 AuthGuard
- [x] TSC 零错误
- [x] 零 skip/only
- [x] DTO 使用 class-validator 严格校验
- [x] 测试覆盖正例/反例/角色场景 3 种类型
- [x] Module 元数据测试验证 controller/provider/export 注册正确
