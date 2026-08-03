# RBAC 模块 · 角色权限控制 / Role-Based Access Control

## 概述 / Overview

5 级角色权限控制模块。提供角色分配、权限校验、权限继承、显式拒绝、多租户支持。内置 owner / admin / manager / staff / guest 五级默认策略，支持自定义 Policy 注册和 Controller 动作保护。

**Tech Stack:** NestJS · TypeScript · TypeORM (rbac_* 实体表) · TenantGuard

## 核心实体 / Core Entities

### TypeORM 实体
| Entity | Table | 描述 |
|--------|-------|------|
| `RBACRole` | `rbac_roles` | 角色定义 (`owner` / `admin` / `manager` / `staff` / `guest`) |
| `RBACPermission` | `rbac_permissions` | 权限定义 (`user:read`, `order:refund`, ...) |
| `RBACRolePermission` | `rbac_role_permissions` | 角色-权限关联（含 `isDenied` 显式拒绝） |
| `RBACAssignment` | `rbac_assignments` | 用户角色分配（含 `tenantId` 多租户） |

### 内存类型
| Type | 描述 |
|------|------|
| `Role` | `'owner' \| 'admin' \| 'manager' \| 'staff' \| 'guest'` |
| `Permission` | 35 种权限跨 10 资源域 (user/order/points/coupon/payment/inventory/report/config/audit/compliance/settlement) |
| `RBACPolicy` | 角色策略 `{ role, permissions[], deniedPermissions[], conditions? }` |
| `RoleAssignment` | 角色分配 `{ userId, role, tenantId?, assignedAt, assignedBy }` |

### 权限继承链
```
owner → admin (80%) → manager (50%) → staff (40%) → guest (30%)
```

## API 端点 / Endpoints

Prefix: `/rbac` (protected by `TenantGuard`)

### 角色管理
| Method | Path | 说明 |
|--------|------|------|
| POST | `/assign` | 为用户分配角色（支持多租户） |
| POST | `/revoke` | 撤销用户角色（按租户/全局） |
| GET | `/roles/:userId` | 查询用户的角色分配 |

### 权限校验
| Method | Path | 说明 |
|--------|------|------|
| POST | `/check` | 检查用户是否有某权限 |
| POST | `/authorize` | 验证权限（无权限返回 400） |
| GET | `/report/:userId` | 用户完整权限报告 |

### 策略与配置
| Method | Path | 说明 |
|--------|------|------|
| GET | `/permissions/:role` | 获取角色所有权限（含继承） |
| POST | `/policy` | 注册/覆盖角色策略 |
| POST | `/protected-actions` | 注册 Controller 受保护动作 |
| GET | `/protected-actions/:controllerName` | 获取 Controller 受保护动作列表 |

## 使用示例 / Usage

```typescript
// 分配角色
POST /rbac/assign
{ "userId": "u-001", "role": "manager", "tenantId": "t-store-a" }

// 校验权限
POST /rbac/check
{ "userId": "u-001", "permission": "order:refund", "tenantId": "t-store-a" }

// 自定义策略
POST /rbac/policy
{
  "role": "staff",
  "permissions": ["order:read", "order:write"],
  "deniedPermissions": ["order:refund"]
}

// 注册 Controller 保护
POST /rbac/protected-actions
{
  "controllerName": "OrderController",
  "actions": {
    "refundOrder": ["order:refund"],
    "cancelOrder": ["order:cancel"]
  }
}

// 服务层直接调用
import { RBACService, Role, Permission } from './rbac.service'
svc.authorize(userId, 'order:refund', tenantId) // throws RBACAuthorizationError
```

## 依赖关系 / Dependencies

- **NestJS** — Controller/Service 框架
- **TypeORM** — `rbac_roles` / `rbac_permissions` / `rbac_role_permissions` / `rbac_assignments` 实体
- **`class-validator`** — DTO 校验 (UserId/Role/Permission 合法性)
- **`agent/tenant.guard`** — 多租户保护

## 配置项 / Configuration

| 项 | 类型 | 说明 |
|----|------|------|
| `ROLE_DEFAULT_POLICIES` | `RBACPolicy[]` | 5 级角色默认权限策略 |
| `INHERITANCE_CHAIN` | `Record<Role, {parent, percentage}>` | 权限继承链与继承比例 |
| `assignRole()` | 多租户 | 同一租户分配新角色时自动撤销旧角色 |
| `checkPermission()` | 租户优先 | 先查租户角色，回退到全局角色 |

## 权限定义 / Permission Catalog

35 种权限分布:

| 资源域 | 权限 | 适用角色 |
|--------|------|----------|
| `user` | read/write/delete/impersonate | owner全开; admin无impersonate |
| `order` | read/write/refund/cancel | manager可退款; staff只读写 |
| `points` | read/write/convert/adjust | 仅 owner/admin/manager |
| `coupon` | read/write/issue/revoke | staff只发不撤 |
| `payment` | read/write/refund | staff只读 |
| `inventory` | read/write/transfer | manager无 transfer |
| `report` | read/export/financial | 仅 owner/admin 可见财务 |
| `config` | read/write/delete | admin 不可删除 |
| `audit` | read/export | manager只读 |
| `compliance` | manage/dsr | 仅 owner/admin |
| `settlement` | read/approve/pay | manager 可审批 |

## 错误码 / Error Codes

| 场景 | HTTP | 原因 |
|------|------|------|
| 参数校验失败 | 400 | 角色名/权限名非法 |
| 无权限 (authorize) | 400 | `RBACAuthorizationError`: 用户权限不足 |
| 角色无效 | 400 | 不在 owner/admin/manager/staff/guest 范围 |
| 服务内部错误 | 500 | Role assignment / Policy registration 异常 |
