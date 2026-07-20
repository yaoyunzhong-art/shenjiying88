# PRD-012: 品牌运营 — Brand Operations (P-47)

> 版本: v1.1 · 签发人: 🦞 龙虾哥 · 对接专家: E30 品牌
> 发布日期: 2026-07-20 · 状态: 🟢 已签发
> 关联Phase: P-47
> 关联模块: brand-operations / brand-custom / content / marketing

## 1. 业务背景

店A是神机营品牌旗下门店。品牌运营包括官网管理、品牌内容、活动营销、品牌素材管理及门店同步展示。

## 2. 功能需求

| RQ | 标题 | 优先级 | 验收标准 | 覆盖模块 |
|:---|:-----|:------:|:---------|:---------|
| RQ-47-01 | 品牌官网管理 | P0 | 官网内容(介绍/活动/门店列表)可编辑 | content |
| RQ-47-02 | 品牌活动 | P0 | 创建品牌活动→全部门店同步展示 | marketing + brand-operations |
| RQ-47-03 | 品牌素材 | P1 | logo/banner/视频/文案素材管理 | brand-operations |
| RQ-47-04 | 门店品牌同步 | P1 | 品牌更新→各门店自动同步 | brand-operations |

## 3. 验收卡

| AC | 场景 | 预期 |
|:---|:-----|:-----|
| AC-47-01 | 编辑官网首页文案 | 官网更新成功 → content module |
| AC-47-02 | 创建"夏日狂欢"活动→选择3家门店 | 3店同步展示活动 → brand-operations |
| AC-47-03 | 上传新logo→更新品牌色 | 各页面品牌更新 → brand-custom + brand-operations |

## 4. 模块架构

```
brand-operations/          # P-47 品牌运营 (新增)
├── entity.ts              # BrandAsset / BrandCampaign / SyncRecord
├── service.ts             # 品牌素材CRUD + 活动管理 + 门店同步
├── controller.ts          # REST API 入口
├── module.ts              # NestJS Module 注册

brand-custom/              # P-47 品牌定制 (已有)
├── 主题管理 / 域名配置 / 邮件模板

content/                   # RQ-47-01 (已有)
├── 官网内容CRUD / 发布/归档

marketing/                 # RQ-47-02 (已有)
├── 营销活动 / A/B / 优惠券
```

## 5. 数据模型

```typescript
// brand-operations.entity.ts

interface BrandAsset {
  id: string
  type: 'logo' | 'banner' | 'video' | 'copy'
  url: string
  active: boolean
  tenantId: string
  brandId: string
  name: string
  description?: string
  fileSizeBytes?: number
  mimeType?: string
  createdAt: string
  updatedAt: string
}

interface BrandCampaign {
  id: string
  tenantId: string
  brandId: string
  title: string
  description: string
  storeIds: string[]
  startDate: string
  endDate: string
  status: 'draft' | 'active' | 'ended' | 'cancelled'
  assets: string[]
  coverImageUrl?: string
  createdBy: string
  createdAt: string
  updatedAt: string
}

interface BrandSyncRecord {
  id: string
  campaignId: string
  storeId: string
  status: 'pending' | 'synced' | 'failed'
  errorMessage?: string
  syncedAt?: string
  createdAt: string
}
```

## 6. API 路由

| Method | Path | 说明 |
|--------|------|------|
| POST | /brand-operations/assets | 创建品牌素材 |
| GET | /brand-operations/assets | 查询素材列表 |
| GET | /brand-operations/assets/:id | 查询单个素材 |
| PATCH | /brand-operations/assets/:id | 更新素材 |
| DELETE | /brand-operations/assets/:id | 删除素材 |
| POST | /brand-operations/campaigns | 创建品牌活动 |
| GET | /brand-operations/campaigns | 查询活动列表 |
| GET | /brand-operations/campaigns/:id | 查询单个活动 |
| PATCH | /brand-operations/campaigns/:id | 更新活动 |
| DELETE | /brand-operations/campaigns/:id | 删除活动 |
| POST | /brand-operations/campaigns/:id/sync | 同步活动到门店 |
| GET | /brand-operations/campaigns/:id/sync | 查询同步状态 |
| GET | /brand-operations/stores/:id/campaigns | 查询门店已同步活动 |
| GET | /brand-operations/metrics | 品牌运营统计 |
