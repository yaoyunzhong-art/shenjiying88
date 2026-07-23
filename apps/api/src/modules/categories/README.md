# 商品分类模块

> 模块路径: `apps/api/src/modules/categories`  
> 更新: 2026-07-24 · Phase-17

---

## 业务概述

商品分类模块是 POS 系统的**基础元数据模块**，提供标准化的商品分类管理和查询能力。该模块采用**纯内存存储**（无数据库依赖），预置 10 个种子分类（餐饮、服装、数码、日用品、娱乐、饮品、零食、文具、医疗、其他），适用于门店 POS 前端的下拉选择、分类筛选和商品挂载场景。

**核心应用场景：**
- 前端商品选择界面：分类下拉选择器
- 库存管理：按分类维度统计商品数量
- 优惠券规则：限定优惠券适用分类范围
- POS 收银台：快速按分类筛选商品

---

## 领域模型 / 核心实体

### Category

| 字段 | 类型 | 说明 |
|------|------|------|
| `name` | `string` | 分类名称（主标识，区分大小写） |
| `description` | `string` | 分类描述 |
| `productCount` | `number` | 关联商品数量（快照值，需外部同步） |

### 错误码枚举 (CategoryErrorCode)

| 错误码 | 说明 |
|--------|------|
| `CATEGORY_NOT_FOUND` | 分类不存在 |
| `CATEGORY_DUPLICATE` | 分类名重复 |
| `CATEGORY_INVALID_NAME` | 分类名称为空 |

### 预置种子分类

```ts
export const SEED_CATEGORIES: Category[] = [
  { name: '餐饮',   description: '食品、饮料、熟食及原料',       productCount: 0 },
  { name: '服装',   description: '服饰、鞋帽、配饰',             productCount: 0 },
  { name: '数码',   description: '电子产品、手机、电脑及配件',   productCount: 0 },
  { name: '日用品', description: '家庭清洁、个人护理、日常消耗品', productCount: 0 },
  { name: '娱乐',   description: '玩具、游戏、文体用品',         productCount: 0 },
  { name: '饮品',   description: '瓶装饮料、茶饮、咖啡、酒水',   productCount: 0 },
  { name: '零食',   description: '休闲零食、糖果、糕点点心',     productCount: 0 },
  { name: '文具',   description: '办公用品、文具、纸张',         productCount: 0 },
  { name: '医疗',   description: '药品、医疗器械、保健品',       productCount: 0 },
  { name: '其他',   description: '未分类或其他商品',             productCount: 0 },
];
```

---

## API 端点一览

> 路由前缀: `/api/v1/categories`（全局前缀自动添加）

| 方法 | 路径 | 说明 |
|------|------|------|
| `GET` | `/categories` | 获取全部商品分类列表 |
| `GET` | `/categories/stats` | 获取分类统计信息（总数 + 名称列表） |
| `GET` | `/categories/:name` | 按名称查询分类详情 |

### 说明

- 所有端点均受 `TenantGuard` 保护（多租户上下文）
- `findByName` 已做 URL 编码兼容 (`decodeURIComponent`)
- `stats` 端点路由必须在 `:name` 参数路由之前注册（NestJS 路由顺序）

---

## 依赖模块

| 模块 | 用途 |
|------|------|
| `agent` | 租户守卫 (TenantGuard) |

**无数据库依赖** — 当前实现为纯内存存储，使用 `SEED_CATEGORIES` 数组初始化。

---

## 使用示例

### 获取全部分类

```ts
// GET /categories
// 响应:
[
  { "name": "餐饮", "description": "食品、饮料、熟食及原料", "productCount": 0 },
  { "name": "服装", "description": "服饰、鞋帽、配饰",       "productCount": 0 },
  ...
]
```

### 按名称查询分类

```ts
// GET /categories/餐饮
// 响应:
{ "name": "餐饮", "description": "食品、饮料、熟食及原料", "productCount": 0 }
```

### Service 层编程使用

```ts
import { CategoriesService } from './categories.service'

// 注入后使用
const all = this.categoriesService.findAll()
const stats = this.categoriesService.getCategoryStats()
const found = this.categoriesService.findByName('数码')
const created = this.categoriesService.create('生鲜', '新鲜水果蔬菜')
this.categoriesService.delete('其他')
const updated = this.categoriesService.update('餐饮', { productCount: 42 })
const results = this.categoriesService.findByKeyword('饮品')
```

---

## 配置项

| 配置项 | 类型 | 默认值 | 说明 |
|--------|------|--------|------|
| 种子分类 | `Category[]` | 10 个预设分类 | 构造时通过 `reset()` 加载 |
| 存储方式 | 内存 | — | 无数据库，重启后丢失自定义分类 |

> **注意**: 当前为纯内存实现，若需要持久化自定义分类，建议：
> - 短方案：添加 `TypeORM Entity` 和迁移脚本
> - 长方案：引入 Redis 或 MySQL 存储
