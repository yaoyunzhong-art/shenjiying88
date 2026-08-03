# 低代码模块 (Lowcode Module) — API 接受度文档

## 1. 模块概述与业务目标

低代码模块提供页面构建器（Page Builder）和聚合管理功能，允许运营人员通过模板化方式创建和管理前端页面，无需编码即可完成页面组件的组装、发布、版本管理与跨环境迁移。

**业务目标：**
- 模板化管理：预置 tpl-dashboard / tpl-form / tpl-blank 三种模板，支持 CRUD
- 页面可视化构建：从模板创建页面 → 增删改组件 → 发布上线
- 版本快照：支持按页面维度创建快照，追溯变更历史
- 组件库：注册/查询可复用的组件类型及默认属性
- 页面导入导出：JSON 格式跨环境迁移，自动注册缺失模板
- 仪表盘统计：总页面/已发布/草稿/模板/组件/快照 六维统计
- 实时审计告警：支持自定义指标记录、阈值告警及趋势分析

## 2. 核心实体及字段说明

### LowcodeTemplate (低代码模板)

| 字段 | 类型 | 说明 |
|------|------|------|
| `id` | `UUID` | 主键 (PrimaryGeneratedColumn uuid) |
| `name` | `string(200)` | 模板名称，索引 |
| `description?` | `text` | 模板描述 |
| `status` | `LowcodeStatus` | 状态: active / archived / deprecated |
| `components` | `Array<{type, defaultProps}>` | 组件定义列表 (JSONB) |
| `metadata` | `Record<string, unknown>` | 元数据 (JSONB, default {}) |
| `createdBy?` | `string(64)` | 创建者 |
| `createdAt` | `Date` | 创建时间 (自动) |
| `updatedAt` | `Date` | 更新时间 (自动) |

### LowcodePage (页面)

| 字段 | 类型 | 说明 |
|------|------|------|
| `id` | `UUID` | 主键 |
| `name` | `string(200)` | 页面名称，索引 |
| `templateId` | `string(100)` | 页面所属模板 ID |
| `components` | `Record<string, unknown>[]` | 组件实例列表 (JSONB) |
| `status` | `LowcodePageStatus` | draft / published |
| `createdBy?` | `string(64)` | 创建者 |
| `createdAt` | `Date` | 创建时间 |
| `updatedAt` | `Date` | 更新时间 |

### LowcodePageSnapshot (页面快照/版本)

| 字段 | 类型 | 说明 |
|------|------|------|
| `id` | `UUID` | 主键 |
| `pageId` | `string(64)` | 关联页面 ID，索引 |
| `version` | `int` | 版本号 (递增 auto-increment) |
| `components` | `Record<string, unknown>[]` | 快照时的组件数据 (JSONB) |
| `changelog?` | `string(255)` | 变更日志 |
| `publishedBy?` | `string(64)` | 发布者 |
| `createdAt` | `Date` | 创建时间快照 |

### LowcodeComponentLibrary (组件库)

| 字段 | 类型 | 说明 |
|------|------|------|
| `id` | `UUID` | 主键 |
| `name` | `string(100)` | 组件名 |
| `type` | `string(50)` | 组件类型 (如 navbar, chart, button) |
| `defaultProps` | `Record<string, unknown>` | 默认属性 (JSONB) |
| `schema` | `Record<string, unknown>` | 组件 schema 定义 (JSONB) |
| `status` | `LowcodeStatus` | active / archived / deprecated |
| `createdAt` | `Date` | 创建时间 |
| `updatedAt` | `Date` | 更新时间 |

### LowcodeAuditMetric (审计指标)

| 字段 | 类型 | 说明 |
|------|------|------|
| `id` | `UUID` | 主键 |
| `name` | `string(200)` | 指标名称，索引 |
| `value` | `decimal(12,4)` | 指标数值 |
| `tags` | `Record<string, string>` | 标签 (JSONB) |
| `timestamp` | `timestamptz` | 记录时间，索引 |
| `createdAt` | `Date` | 创建时间 |

## 3. API 端点清单

### 基础路径 `/api/lowcode/admin` — 聚合管理

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/api/lowcode/admin/templates` | 创建模板 |
| GET | `/api/lowcode/admin/templates` | 获取模板列表 |
| GET | `/api/lowcode/admin/templates/:id` | 获取模板详情 |
| PUT | `/api/lowcode/admin/templates/:id` | 更新模板 |
| DELETE | `/api/lowcode/admin/templates/:id` | 删除模板 |
| POST | `/api/lowcode/admin/snapshots` | 创建页面快照 |
| GET | `/api/lowcode/admin/snapshots/:pageId` | 获取页面快照列表 |
| POST | `/api/lowcode/admin/components` | 注册组件 |
| GET | `/api/lowcode/admin/components` | 组件库列表 |
| GET | `/api/lowcode/admin/pages/:id/export` | 导出页面 JSON |
| POST | `/api/lowcode/admin/pages/import` | 导入页面 JSON |
| GET | `/api/lowcode/admin/dashboard` | 仪表盘统计 |

### 基础路径 `/api/lowcode` — 页面管理 & 审计

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/api/lowcode/pages` | 从模板创建页面 |
| GET | `/api/lowcode/pages/:id` | 获取页面详情 |
| PUT | `/api/lowcode/pages/:id` | 更新页面信息 |
| DELETE | `/api/lowcode/pages/:id` | 删除页面 |
| POST | `/api/lowcode/pages/:id/publish` | 发布页面 |
| GET | `/api/lowcode/pages/:id/render` | 渲染页面 HTML |
| POST | `/api/lowcode/pages/:pageId/components` | 添加组件 |
| PUT | `/api/lowcode/pages/:pageId/components/:componentId` | 更新组件属性 |
| DELETE | `/api/lowcode/pages/:pageId/components/:componentId` | 删除组件 |
| GET | `/api/lowcode/templates/:id` | 获取模板详情 |
| POST | `/api/lowcode/metrics` | 记录审计指标 |
| GET | `/api/lowcode/metrics/:name/trend` | 获取指标趋势 |
| GET | `/api/lowcode/alerts` | 获取告警历史 |

### 请求/响应示例

**POST /api/lowcode/pages** (创建页面)
```json
// Request
{ "templateId": "tpl-dashboard", "name": "运营看板" }

// Response (201)
{
  "id": "page-1721682000000-abc123",
  "templateId": "tpl-dashboard",
  "name": "运营看板",
  "components": [
    { "id": "comp-0", "type": "navbar", "props": { "title": "仪表盘" } },
    { "id": "comp-1", "type": "chart", "props": { "type": "line" } }
  ],
  "status": "draft",
  "createdAt": "2025-07-22T10:00:00.000Z",
  "updatedAt": "2025-07-22T10:00:00.000Z"
}
```

**GET /api/lowcode/admin/dashboard** (仪表盘统计)
```json
{
  "totalPages": 5,
  "publishedPages": 2,
  "draftPages": 3,
  "totalTemplates": 3,
  "totalComponents": 8,
  "totalSnapshots": 12
}
```

## 4. 状态机流转图

### 页面生命周期
```
                    ┌──────────┐
                    │ Draft    │  ← 从模板创建
                    └────┬─────┘
                         │ publish
                    ┌────▼─────┐
                    │ Published│  → render → HTML
                    └────┬─────┘
                         │
              ╔══════════╪══════════╗
              ║ 编辑后再次 publish  ║
              ╚══════════╪══════════╝
                         │
                    ┌────▼─────┐
                    │ Published │ (v2/v3/...)
                    └──────────┘
```

### 快照版本链
```
Page(ID)
  ├── v1 snapshot (initial publish)
  ├── v2 snapshot (changelog: "添加 chart 组件")
  └── v3 snapshot (changelog: "更新 navbar 标题")
```

### 模板状态机
```
active ──→ archived ──→ deprecated
  ↑                          │
  └──────────────────────────┘ (reactive)
```

### 告警触发流
```
POST /api/lowcode/metrics → recordMetric(name, value)
  ↓
checkThresholds(name) → exceeded?
  ├── true → fireAlertIfExceeded → AlertRecord
  └── false → return result
  ↓
GET /metrics/:name/trend → filter by window (1h/30m/1d)
GET /alerts → filter by metricName+dateRange
```

## 5. 错误码清单

| HTTP Status | 错误场景 | 说明 |
|-------------|----------|------|
| `201` | 创建成功 | POST pages, templates, snapshots, components |
| `204` | 删除成功 | DELETE templates/:id, pages/:id/components/:id |
| `200` | 正常返回 | GET, PUT, POST/publish |
| `400` | 模板不存在 | 引用不存在的 templateId |
| `401` | 未认证 | TenantGuard 拒绝 |
| `404` | 页面/模板/组件不存在 | 查询 ID 不存在 |
| `500` | 内部服务错误 | 内存 Map 操作异常 |

具体错误如 `Page not found: xxx` 或 `Template not found: xxx` 以 `throw new Error()` 形式抛出，当前未捕获为结构化错误码。

## 6. 性能要求

| 指标 | 目标 | 说明 |
|------|------|------|
| P50 | ≤ 10ms | 单页面/模板/组件 CRUD（纯内存操作） |
| P95 | ≤ 30ms | 页面渲染 HTML（组件序列化） |
| P99 | ≤ 100ms | dashboard 统计聚合（遍历全量 Map） |
| P50 (快照) | ≤ 50ms | 快照创建含组件深拷贝 |
| P95 (导入) | ≤ 200ms | pages/import 含模板自动注册 + 组件重建 |

**优化策略（生产环境应替换为 DB）：**
- 当前为内存 Map 实现，重启后数据丢失
- 建议迁移至 Prisma + Redis，模板、页面、快照分别建表
- `getDashboardStats` 可加 Redis 缓存，TTL 60s
- `listSnapshots` 按 pageId 索引 + createdAt desc 排序

## 7. 安全约束

### RBAC 角色
| 角色 | 权限 | 适用端点 |
|------|------|----------|
| `lowcode:admin` | 完全访问 | 全部端点 |
| `lowcode:editor` | 页面 CRUD + 发布 | /pages/**, /templates/** GET |
| `lowcode:viewer` | 只读 | GET /pages/**, GET /templates/**, GET /dashboard |
| `lowcode:audit` | 审计指标 | /metrics/**, /alerts/** |
| `lowcode:component-engineer` | 组件库管理 | /components/** |

### 租户隔离
- 所有端点受 `TenantGuard` 保护，通过 `x-tenant-id` 头识别
- 当前内存实现未做租户间数据隔离（所有租户共享内存 Map）
- 生产环境需在查询层面加 `WHERE tenant_id = :tenantId` 过滤
- `LowcodeService` 的模板/快照/组件库需添加 tenantId 字段

### 审计合规
- `AuditAlertService` 支持自定义指标记录与阈值告警
- 页面发布前可通过 `LowcodeAuditService.recordAudit` 记录审阅动作
- 支持按 pageId 查询审计历史
