# 🗺️ PRD: 联名管理模块 (G10审计条件)
> 日期: 2026-07-21 | 圈梁: 代码✅ 测试✅(15+ tests) 审计✅ PRD已写入

**用途**: G10联名组审计有条件签署，联名管理模块基本CRUD。
**产出**: `apps/api/src/modules/collab/`
**作用**: V23 Phase 1核心功能

---

## 1. 概述

联名管理模块负责对联名项目的全生命周期管理，包括创建、查询、更新、状态流转和删除操作。本项目为Phase 1基础CRUD实现，使用内存存储（Map），后续可无缝替换为DB持久化。

### 核心功能

| 功能 | 描述 | 端点 |
|:----|:-----|:-----|
| 创建联名项目 | 新建联名项目（默认状态 DRAFT） | `POST /api/collab-projects` |
| 查询列表 | 按租户查询项目列表，支持状态/品牌/名称过滤 | `GET /api/collab-projects` |
| 查询详情 | 按ID查询单个项目 | `GET /api/collab-projects/:projectId` |
| 更新项目 | 部分更新项目字段 | `PATCH /api/collab-projects/:projectId` |
| 更新状态 | 单独更新项目状态（含合法性验证） | `PATCH /api/collab-projects/:projectId/status` |
| 删除项目 | 删除指定项目 | `DELETE /api/collab-projects/:projectId` |
| 按状态统计 | 按状态分组统计项目数量 | `GET /api/collab-projects/count-by-status` |

## 2. 实体定义

### CollabProject

| 字段 | 类型 | 必需 | 说明 |
|:----|:----|:----:|:-----|
| projectId | string | ✅ | 唯一标识 |
| tenantId | string | ✅ | 租户ID（RLS多租户隔离） |
| name | string | ✅ | 联名项目名称（1-128字符） |
| brandId | string | ✅ | 关联品牌ID |
| brandName | string | ❌ | 品牌名称冗余 |
| startDate | string(ISO8601) | ✅ | 项目开始日期 |
| endDate | string(ISO8601) | ✅ | 项目结束日期（须晚于开始日期） |
| status | CollabStatus | ✅ | 项目状态枚举 |
| revenueShareRate | number | ✅ | 分润比例（0-100，品牌方百分比） |
| budget | number | ✅ | 项目总预算（单位：分） |
| description | string | ❌ | 项目描述（最多500字符） |
| createdAt | string | ✅ | 创建时间 |
| updatedAt | string | ✅ | 更新时间 |

### CollabStatus 状态枚举

| 值 | 含义 | 可流转至 |
|:--|:-----|:---------|
| DRAFT | 草稿 | NEGOTIATING, CANCELLED |
| NEGOTIATING | 洽谈中 | ACTIVE, CANCELLED |
| ACTIVE | 进行中 | PAUSED, COMPLETED |
| PAUSED | 已暂停 | ACTIVE, CANCELLED |
| COMPLETED | 已完成（终结态） | — |
| CANCELLED | 已取消（终结态） | — |

## 3. API接口

### POST /api/collab-projects
创建联名项目。
- Guard: @UseGuards(TenantGuard)
- Header: `x-tenant-id`
- Body: CreateCollabProjectDto

### GET /api/collab-projects
查询联名项目列表。
- Query: status (optional), brandId (optional), name (optional)

### GET /api/collab-projects/count-by-status
按状态统计项目数量。

### GET /api/collab-projects/:projectId
查询联名项目详情。

### PATCH /api/collab-projects/:projectId
更新联名项目（部分更新）。

### PATCH /api/collab-projects/:projectId/status
更新联名项目状态（含合法性校验）。

### DELETE /api/collab-projects/:projectId
删除联名项目。

## 4. 测试覆盖

- ✅ 正例: create成功 / 携带所有可选字段 / findAll列表 / 状态过滤 / findById详情 / update更新 / updateStatus / delete删除 / countByStatus统计
- ✅ 反例: 分润比例>100 / 负数预算 / 非法状态转换 / 找不到返回null / 删除不存在
- ✅ 边界值: 空列表 / 分润0和100 / 预算0
- ✅ 状态流转组合: 完整生命周期 / 暂停恢复

**总计**: 15+ it 覆盖 CRUD + 状态 + 边界 + 错误

## 5. 安全

- 所有端点使用 `@UseGuards(TenantGuard)` 多租户隔离
- Service层按 `tenantId` 过滤数据，跨租户不可见
- 状态变更合法性验证

---

> 🐜 树哥 · V23 Phase 1 · 联名管理模块 PRD
