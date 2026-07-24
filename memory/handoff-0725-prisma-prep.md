# P-47/P-30 Prisma 持久化手稿 (V23 Day5 首件)

> 🟢 **23:22 更新: Prisma schema 已就位**

## 状态
- ✅ **Prisma schema 15 entities 已写入** (commit `2ab98da82`)
- ✅ `prisma validate` 通过
- ✅ `prisma generate` 通过
- ✅ TSC 零错误
- ⏳ 还需要: `prisma migrate dev`

## 已写入的 Entity

### P-47 (11 entities)
BrandAsset, BrandCampaign, BrandCampaignTemplate, Collaboration,
BrandChannel, BrandKPI, RecycleBinItem, CollaborationContract,
CampaignABTest, ExportRecord, CampaignSchedule

### P-30 (6 entities)
Supplier, PurchaseOrder, StockMovement, StockItem,
MaintenanceTask, LogisticsKPI

## 今日必做 (7/25 截止!)

### Step 1: Migration
```bash
cd apps/api
pnpm exec prisma migrate dev --name add-brand-ops-logistics
```

### Step 2: Store 适配 (最大工作量)
- `brand-operations.service.ts`: 15处 InMemoryStore<BrandAsset> → PrismaService
- `logistics-management.service.ts`: 6处 InMemoryStore<Supplier> → PrismaService

### Step 3: Controller/Test 不变
- 已有controller全量CRUD端点完整 → 接口层不动
- 已有222+63测试 → 无修改
- 仅改service内部store实现

## 推荐策略
```typescript
// 渐进式迁移: 保留InMemory fallback
private brandAssetStore: PrismaService['brandAsset']

constructor(private prisma: PrismaService) {
  this.brandAssetStore = prisma.brandAsset
}
```

