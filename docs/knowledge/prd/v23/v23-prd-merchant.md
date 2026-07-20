# 📄 V23 PRD: 商户/供应商管理模块

> **Phase:** P1 — 供应商管理核心  
> **版本:** v23.1  
> **状态:** ✅ 已完成  
> **生成日期:** 2026-07-21  

---

## 一、产品概述

### 1.1 问题描述

门店运营过程中涉及大量供应商合作（电子元器件、包装材料、五金配件、物流配送等），但缺乏统一的供应商管理体系，导致：

- 供应商信息分散在纸质合同和个人通讯录中，无法集中查询
- 供应商评估缺乏统一标准，评级体系混乱
- 供应商状态管理薄弱，无法及时掌握合作状态变化
- 多门店/多品牌场景下，供应商数据隔离难以保障
- 供应商的联系人、合同、评估记录无法有效关联

### 1.2 目标用户

| 角色 | 使用场景 | 权限 |
|:-----|:---------|:----:|
| 👔 店长 | 供应商全生命周期管理、评级、新增签约 | 全部供应商权限 |
| 🛒 前台 | 查看供应商联系方式（紧急联络场景） | 查询详情 |
| 🎯 运行专员 | 供应商评估、续约管理、搜索查询 | 列表/详情/创建/更新 |
| 👥 HR / 🔧 安监 / 🎮 导玩员 / 🤝 团建 / 📢 营销 | 无供应商管理权限 | 无 |

### 1.3 产品目标

1. **统一供应商视图** — 集中管理所有供应商信息、评级、状态
2. **标准化评级体系** — 通过 A/B/C/D 四级评级量化供应商质量
3. **全生命周期管理** — 从创建到暂停/启用的完整状态机
4. **多租户数据隔离** — 不同门店/品牌之间供应商数据完全隔离
5. **灵活搜索** — 支持按名称、编码、联系人、电话搜索

---

## 二、功能规格

### 2.1 供应商CRUD

| # | 功能 | 端点 | 方法 | 说明 |
|:-:|:-----|:-----|:----:|:-----|
| 1 | 供应商列表 | `/api/suppliers` | GET | 分页、过滤(status/rating/category)、搜索 |
| 2 | 供应商创建 | `/api/suppliers` | POST | 必填: name, code, contactPerson, phone, email, address, category |
| 3 | 供应商详情 | `/api/suppliers/:supplierId` | GET | 含全量供应商信息 |
| 4 | 供应商更新 | `/api/suppliers/:supplierId` | PATCH | 支持部分字段更新 |
| 5 | 供应商删除 | `/api/suppliers/:supplierId` | DELETE | 硬删除 |

### 2.2 状态和评级

| # | 功能 | 端点 | 方法 | 说明 |
|:-:|:-----|:-----|:----:|:-----|
| 6 | 状态切换 | `PATCH /api/suppliers/:supplierId` | PATCH | `ACTIVE` ↔ `INACTIVE` ↔ `SUSPENDED` |
| 7 | 评级更新 | `PATCH /api/suppliers/:supplierId` | PATCH | A/B/C/D 四级 |

### 2.3 搜索和过滤

| # | 功能 | 端点 | 方法 | 说明 |
|:-:|:-----|:-----|:----:|:-----|
| 8 | 按状态筛选 | `/api/suppliers?status=ACTIVE` | GET | ACTIVE/INACTIVE/SUSPENDED |
| 9 | 按评级筛选 | `/api/suppliers?rating=A` | GET | A/B/C/D |
| 10 | 按分类筛选 | `/api/suppliers?category=电子元器件` | GET | 精确匹配 |
| 11 | 关键词搜索 | `/api/suppliers?search=华强` | GET | 匹配名称/编码/联系人/电话 |

---

## 三、数据模型

### Supplier

```typescript
interface Supplier {
  id: string                    // 唯一标识 (supplier-uuid)
  name: string                  // 供应商名称
  code: string                  // 供应商编码
  contactPerson: string         // 联系人
  phone: string                 // 联系电话
  email: string                 // 邮箱
  address: string               // 地址
  status: SupplierStatus        // 状态
  rating: SupplierRating        // 评级
  category: string              // 分类
  remark?: string               // 备注(可选)
  tenantId: string              // 租户ID(多租户隔离)
  createdAt: string             // 创建时间
  updatedAt: string             // 更新时间
}
```

### SupplierStatus

```typescript
enum SupplierStatus {
  Active = 'ACTIVE',            // 合作中
  Inactive = 'INACTIVE',        // 暂停合作
  Suspended = 'SUSPENDED',      // 中止合作
}
```

### SupplierRating

```typescript
enum SupplierRating {
  A = 'A',   // 优秀
  B = 'B',   // 良好
  C = 'C',   // 一般
  D = 'D',   // 差 - 需整改
}
```

---

## 四、API 接口规范

### 通用响应格式

```json
{
  "success": true,
  "data": { ... },
  "message": "(可选)"
}
```

### 错误响应

```json
{
  "success": false,
  "code": 404,
  "message": "Supplier not found: xxx"
}
```

### 错误码

| HTTP | 场景 |
|:----:|:-----|
| 200 | 成功 |
| 201 | 创建成功 |
| 400 | 参数校验失败 |
| 401 | 缺少 x-tenant-id 头 |
| 404 | 供应商不存在 |
| 409 | 业务冲突 |

### 完整端点列表

| 方法 | 路径 | Body/Query | 说明 |
|:----:|:-----|:-----------|:-----|
| POST | `/api/suppliers` | CreateSupplierDto | 创建供应商 |
| GET | `/api/suppliers` | SupplierQueryDto | 列表+过滤+搜索 |
| GET | `/api/suppliers/:supplierId` | — | 获取详情 |
| PATCH | `/api/suppliers/:supplierId` | UpdateSupplierDto | 更新供应商 |
| DELETE | `/api/suppliers/:supplierId` | — | 删除供应商 |

### 安全

所有供应商端点由 `TenantGuard` 保护，需要 `x-tenant-id` 头。  
每个操作自动注入 `tenantId`，实现多租户数据隔离。

---

## 五、圈梁检查清单

| # | 箍 | 状态 | 备注 |
|:-:|:----|:----:|:-----|
| ① | TSC 通过 | ✅ | ≤5 错误 |
| ② | 测试 ≥10 | ✅ | controller 26 + service 22 + role 12 + dto 7 + entity 4 + module 2 = 73 |
| ③ | 圈梁表更新 | ✅ | Supplier-manager 已加入 Phase 1 |
| ④ | PRD 文件 | ✅ | 本文 |
| ⑤ | E2E 链 | ✅ | cross-module-e2e-59-merchant |
| ⑥ | 知识赋能 | ✅ | 本PRD可被知识库检索 |
| ⑦ | 角色旅程 | ✅ | 8角色全覆盖 (supplier-manager.role.test.ts) |
| ⑧ | 基建 | ✅ | CI/Docker/Build |
| ⑨ | 性能基线 | 🟡 | 内存Map模式，后续可迁移DB |

---

## 六、后续演进

| 版本 | 计划内容 | 优先级 |
|:----|:---------|:------:|
| v23.2 | 数据库持久化(PG迁移) | P1 |
| v23.3 | 供应商合同管理 - 到期提醒 | P1 |
| v23.4 | 供应商评估记录 - 按季度自动打分 | P2 |
| v23.5 | 供应商导入/导出(CSV) | P2 |
| v23.6 | 供应商物料关联 - 商品/SKU级联 | P3 |
| v23.7 | 供应商对账/结算模块 | P3 |

---

## 七、知识赋能关联

| 知识卡片 | 关联内容 |
|:---------|:---------|
| KB-SUPPLIER-01 | 供应商状态机: ACTIVE ↔ INACTIVE ↔ SUSPENDED |
| KB-SUPPLIER-02 | 供应商评级体系: A(优秀)→B(良好)→C(一般)→D(差) |
| KB-SUPPLIER-03 | 多租户隔离策略: 每个tenantId独立数据空间 |
| KB-SUPPLIER-04 | 8角色权限矩阵: 仅店长和运行专员可操作 |
