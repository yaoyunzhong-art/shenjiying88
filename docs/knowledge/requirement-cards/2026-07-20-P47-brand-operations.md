# P-47 品牌运营 · PRD 摘要卡
> 创建: 2026-07-20 · PRD-012: Brand Operations (v1.1)
> 状态: 🟢 Phase 100% 完成 (Phase 40%→60%→80%→100%)

## 业务概述
P-47 品牌运营模块提供"品牌素材管理 + 品牌活动管理 + 门店同步 + 联名合作 + 活动模板"五大子模块，支撑品牌方对线上官网、线下门店的品牌统一管控。

## 5 个子模块功能列表

### 1️⃣ BrandAsset (品牌素材)
- **实体**: `BrandAsset` — id / type(logo|banner|video|copy) / url / active / tenantId / brandId / name / fileSizeBytes / mimeType
- **Service**: create / get / list / update / delete / getActiveAssets(type过滤)
- **Controller**: 6 个 REST 路由 (全 CRUD + active 过滤查询)
- **DTO**: CreateBrandAssetDto / UpdateBrandAssetDto

### 2️⃣ BrandCampaign (品牌活动)
- **实体**: `BrandCampaign` — id / title / description / storeIds / startDate / endDate / status(draft→pending_review→approved→active→ended→cancelled) / approval / assets / coverImageUrl
- **Service**: create / get / list / update / delete + 状态流转校验 + 日期冲突校验 + publish/review/approve/cancel/end
- **Controller**: 12 个 REST 路由 (CRUD + 状态操作 + 活动调度)
- **DTO**: CreateBrandCampaignDto / UpdateBrandCampaignDto / CampaignActionDto

### 3️⃣ BrandSyncRecord (门店同步)
- **实体**: `BrandSyncRecord` — id / campaignId / storeId / tenantId / status(pending|synced|failed) / errorMessage
- **Service**: syncToStores(创建全门店同步记录) / getSyncedCampaigns / getSyncRecordsByCampaign / updateSyncStatus
- **能力**: 活动发布时同步到指定门店列表，记录同步状态与失败原因

### 4️⃣ Collaboration (联名合作)
- **实体**: `Collaboration` — id / partner(ParterInfo含name/contactPhone/grade) / type(co_branding|sponsorship|joint_promotion|cross_marketing) / revenueShare(RevenueShareConfig) / campaignIds / terms
- **Service**: 全 CRUD + 状态流转(negotiating→active→ended→terminated) + getMetrics
- **能力**: 供应商/合作方管理、分润配置、活动关联

### 5️⃣ BrandCampaignTemplate (活动模板)
- **实体**: `BrandCampaignTemplate` — id / name / description / defaultStoreIds / defaultAssets / defaultDurationDays / tags / published
- **Service**: 全 CRUD + 模板发布
- **能力**: 预设活动模板，快速创建标准化品牌活动

## 扩展能力 (Phase 80%/100%)
- **CampaignSchedule** — 活动排期甘特图/日历视图
- **RevenueShareRecord** — 合作方分润记录与结算
- **AssetCategory/AssetTag** — 素材分类标签体系
- **CollaborationContract** — 联名合作合同管理
- **CampaignABTest/CampaignVariant** — A/B 活动测试
- **ExportRecord** — 数据导出(Excel/PDF)
- **RecycleBinItem** — 软删除/回收站恢复

## 测试覆盖
- unit: 81 tests (entity 10 + service 31 + controller 13 + module 9 + dto 2 + ringbeam 2 + phase-p47 16)
- Phase 80%: +22 tests (entity/dto/service三层)
- Phase 100%: +22 tests (contract/abtest/export/recycle等)

## 关键文件
```
apps/api/src/modules/brand-operations/
├── brand-operations.entity.ts        # 5核心实体定义
├── brand-operations.service.ts        # 完整业务逻辑
├── brand-operations.controller.ts     # REST 路由
├── brand-operations.dto.ts            # 请求/响应 DTO
├── brand-operations.module.ts         # NestJS Module
├── brand-operations.*.test.ts         # 全量测试 (81+22+22)
```

## 验证
```bash
pnpm --dir apps/api exec vitest run src/modules/brand-operations/    # ✓ 81 passed
pnpm --dir apps/api exec vitest run src/modules/brand-operations/brand-operations.phase60.test.ts # ✓
```
