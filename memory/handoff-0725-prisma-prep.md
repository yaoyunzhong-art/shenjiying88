# P-47/P-30 Prisma 持久化手稿 (V23 Day5 首件)

## 目标
将 brand-operations.service.ts 和 logistics-management.service.ts 的 in-memory Map store 迁移为 Prisma entity

## 必须先做的（0号依赖）

### 1. Prisma schema model 定义
文件: `apps/api/prisma/schema.prisma`

```
model BrandAsset {
  id        String   @id @default(cuid())
  tenantId  String
  type      String
  url       String
  name      String
  metadata  Json?
  isDeleted Boolean  @default(false)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  deletedAt DateTime?

  @@index([tenantId, type])
  @@index([tenantId, isDeleted])
}

model BrandCampaign {
  id          String   @id @default(cuid())
  tenantId    String
  title       String
  description String
  status      String   @default("draft")
  storeIds    Json     // string[]
  startDate   DateTime
  endDate     DateTime
  createdBy   String
  approvedBy  String?
  rejectedBy  String?
  rejectReason String?
  publishedAt DateTime?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@index([tenantId, status])
  @@index([tenantId, startDate, endDate])
}
```

### 2. Migration
```bash
cd apps/api && npx prisma migrate dev --name add-brand-ops-logistics
```

### 3. Store 适配
在 `brand-operations.service.ts` 中新增 `private brandAssetStore: InMemoryStore<BrandAsset>` → 替换为 PrismaService

模式: 保持InMemoryStore作为fallback + prismaService

