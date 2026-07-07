# Best Practice · Database Migration (数据库迁移规范)

> 创建: 2026-06-26 · Pulse-68 Day 2
> 强制: 🔴 P0
> 来源: TypeORM + NestJS + Phase-15+ 实战

---

## 1. 🎯 目标

数据库变更可控:
- ✅ 所有变更可追溯 (git)
- ✅ 前向 + 后向兼容
- ✅ 大表变更安全 (不锁表)
- ✅ 紧急回滚能力

---

## 2. ✅ 迁移命令

```bash
# TypeORM 迁移
pnpm migration:generate src/database/migrations/AddMemberPhoneIndex
pnpm migration:create src/database/migrations/AddCouponTable

# 运行迁移
pnpm migration:run

# 回滚
pnpm migration:revert

# 查看状态
pnpm migration:show
```

---

## 3. 📐 迁移文件模板

```typescript
// src/database/migrations/1719427200000-AddMemberPhoneIndex.ts
import { MigrationInterface, QueryRunner } from 'typeorm'

export class AddMemberPhoneIndex1719427200000 implements MigrationInterface {
  name = 'AddMemberPhoneIndex1719427200000'

  public async up(queryRunner: QueryRunner): Promise<void> {
    // ⚠️ 必须: 使用 CONCURRENTLY (大表不锁)
    await queryRunner.query(`
      CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_member_phone
      ON members (tenant_id, phone)
      WHERE phone IS NOT NULL
    `)
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX CONCURRENTLY IF EXISTS idx_member_phone`)
  }
}
```

---

## 4. ✅ 字段添加规范 (向后兼容)

```typescript
// Phase 1: 添加 nullable 字段
public async up(queryRunner: QueryRunner): Promise<void> {
  await queryRunner.query(`ALTER TABLE members ADD COLUMN avatar_url VARCHAR(500)`)
  // ✅ 不锁表 (nullable)
}

// Phase 2 (后续部署): 填充默认值
public async up(queryRunner: QueryRunner): Promise<void> {
  await queryRunner.query(`
    UPDATE members SET avatar_url = '/default.png' WHERE avatar_url IS NULL
  `)
}

// Phase 3 (后续部署): 添加 NOT NULL 约束
public async up(queryRunner: QueryRunner): Promise<void> {
  await queryRunner.query(`ALTER TABLE members ALTER COLUMN avatar_url SET NOT NULL`)
}

// ❌ 一次性: NOT NULL + 无默认值 → 大表锁死
ALTER TABLE members ADD COLUMN avatar_url VARCHAR(500) NOT NULL
```

---

## 5. ✅ 字段删除规范 (向后兼容)

```typescript
// ❌ 直接 DROP COLUMN → 立即破坏旧代码
ALTER TABLE members DROP COLUMN old_field

// ✅ Phase 1: 代码停止使用 old_field
// ✅ Phase 2: 部署确认无引用
// ✅ Phase 3: 后续迁移 DROP COLUMN
public async up(queryRunner: QueryRunner): Promise<void> {
  await queryRunner.query(`ALTER TABLE members DROP COLUMN old_field`)
}
```

---

## 6. ✅ 重命名 / 类型变更

```typescript
// ❌ 直接 ALTER COLUMN TYPE → 大表重写 + 锁表
ALTER TABLE orders ALTER COLUMN amount TYPE DECIMAL(15,2)

// ✅ 多步骤:
// 1. 添加新字段 amount_new
// 2. 触发器同步 (insert/update)
// 3. 代码切换读新字段
// 4. 同步历史数据
// 5. 代码切换写新字段
// 6. 删除旧字段
```

---

## 7. ✅ 必须遵守

- [ ] 所有迁移有 up + down
- [ ] 大表用 `CONCURRENTLY` (PG) / `ALGORITHM=INPLACE` (MySQL)
- [ ] 字段添加分 3 阶段 (nullable → 默认值 → NOT NULL)
- [ ] 字段删除先停用再 DROP
- [ ] 迁移文件名含时间戳
- [ ] 迁移前备份 (生产)
- [ ] CI 检查迁移一致性

---

## 8. ❌ 反模式

- ❌ 一次性 ALTER (破坏性)
- ❌ 无 down (无法回滚)
- ❌ 生产直接跑 (无备份 / 无灰度)
- ❌ 多人同时改同一字段 (冲突)

---

## 9. 🔗 关联

- [multi-tenant-isolation.md](./multi-tenant-isolation.md) · tenant 字段
- [cqrs-pattern.md](../patterns/cqrs-pattern.md) · CQRS 读模型迁移
