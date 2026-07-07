# 反模式库 v4 · data-migration (数据迁移)

> **创建时间**: 2026-06-27 22:48 CST (1h 冲刺 Part 7)
> **分类**: 数据库 · 演进
> **目标读者**: 后端工程师 + DBA + DevOps

---

## 1. 迁移 4 阶段

```
Phase 1: Dual Write (双写)
Phase 2: Backfill (回填历史)
Phase 3: Cutover (切换读)
Phase 4: Decommission (下线旧)
```

---

## 2. ❌ 反模式 1: 直接 DROP COLUMN

```sql
-- BAD: 直接删字段,服务挂掉
ALTER TABLE users DROP COLUMN legacy_status;
-- 所有 SELECT legacy_status 的代码立即报 column not found
```

**问题**:
- 零回滚能力
- 多版本同时部署冲突
- 数据丢失

### ✅ 最佳实践: 4 阶段迁移

**Phase 1: Dual Write (双写 1 周)**
```typescript
// 写: 同时写新+旧
async function updateUser(id: string, data: UserUpdate) {
  await prisma.user.update({
    where: { id },
    data: {
      status: data.status,         // 新字段
      legacy_status: mapToLegacy(data.status)  // 旧字段同步
    }
  })
}

// 读: 优先新,fallback 旧
async function getUser(id: string) {
  const user = await prisma.user.findUnique({ where: { id } })
  return {
    ...user,
    status: user.status ?? mapFromLegacy(user.legacy_status)
  }
}
```

**Phase 2: Backfill (回填历史)**
```typescript
// 批量回填脚本 (idempotent)
async function backfillUsers() {
  const users = await prisma.$queryRaw<{ id: string, legacy_status: string }[]>`
    SELECT id, legacy_status FROM users WHERE status IS NULL
  `
  for (const u of users) {
    await prisma.user.update({
      where: { id: u.id },
      data: { status: mapFromLegacy(u.legacy_status) }
    })
  }
}
```

**Phase 3: Cutover (切换读)**
```typescript
// 只读新字段
async function getUser(id: string) {
  return prisma.user.findUnique({ where: { id } })  // status 必填
}
```

**Phase 4: Decommission (下线旧)**
```sql
-- 确认无引用后删除
ALTER TABLE users DROP COLUMN legacy_status;
```

---

## 3. ❌ 反模式 2: 大表 ALTER TABLE

```sql
-- BAD: 大表加 NOT NULL 列 (锁表 5+ 分钟)
ALTER TABLE orders ADD COLUMN new_status VARCHAR(20) NOT NULL DEFAULT 'DRAFT';
-- 1000 万行,每行更新,期间所有写阻塞
```

**问题**:
- 表锁 5+ 分钟
- 写入全部阻塞
- 生产事故

### ✅ 最佳实践: 无锁迁移

**PostgreSQL 11+:**
```sql
-- 1. 加可空列 (瞬时)
ALTER TABLE orders ADD COLUMN new_status VARCHAR(20);

-- 2. 批量更新 (分批,每次 1 万行)
DO $$
DECLARE
  affected INTEGER;
BEGIN
  LOOP
    UPDATE orders SET new_status = 'DRAFT'
    WHERE new_status IS NULL
    LIMIT 10000;
    GET DIAGNOSTICS affected = ROW_COUNT;
    EXIT WHEN affected = 0;
    PERFORM pg_sleep(0.1);  -- 让其他事务有机会执行
  END LOOP;
END $$;

-- 3. 加 NOT NULL 约束 (使用 NOT VALID + VALIDATE 避免锁)
ALTER TABLE orders ALTER COLUMN new_status SET NOT NULL;
-- 或: ALTER TABLE orders ADD CONSTRAINT ... CHECK (...) NOT VALID;
--     ALTER TABLE orders VALIDATE CONSTRAINT ...;
```

**Prisma 等价:**
```typescript
// 1. schema.prisma 加可空字段
model Order {
  newStatus String?  // 可空,先发布
}

// 2. 部署后,后台脚本批量回填
await prisma.$executeRaw`
  UPDATE orders SET new_status = 'DRAFT' WHERE new_status IS NULL
`

// 3. 字段改 NOT NULL (再次发布)
model Order {
  newStatus String  // NOT NULL
}
```

---

## 4. ❌ 反模式 3: 迁移脚本不幂等

```typescript
// BAD: 跑两次会重复处理
async function migrateUsers() {
  await prisma.user.updateMany({
    where: { tier: null },
    data: { tier: 'BRONZE' }
  })
}
```

### ✅ 最佳实践: 幂等迁移

```typescript
// GOOD: 检查后再更新
async function migrateUsersIdempotent() {
  // 用唯一 key 防止重复处理
  const processed = await prisma.migrationLog.findUnique({
    where: { key: 'user_tier_migration' }
  })
  if (processed) {
    console.log('already migrated')
    return
  }

  await prisma.user.updateMany({
    where: { tier: null },
    data: { tier: 'BRONZE' }
  })

  await prisma.migrationLog.create({
    data: { key: 'user_tier_migration', completedAt: new Date() }
  })
}
```

---

## 5. ❌ 反模式 4: 没有回滚方案

```typescript
// BAD: 单向迁移,出错无法回滚
async function migrate() {
  await prisma.$executeRaw`ALTER TABLE orders DROP COLUMN old_amount`
}
```

### ✅ 最佳实践: 双写期可回滚

```typescript
// GOOD: 双写期任意时刻可回滚
async function migrateStep1() {
  // 只加字段,不动旧数据
  await prisma.$executeRaw`ALTER TABLE orders ADD COLUMN amount_new INT`
}

async function migrateStep2() {
  // 同步双写 (代码层)
  // ... (上面 Phase 1)
}

async function rollback() {
  // 停止双写,只写旧字段
  await prisma.$executeRaw`UPDATE orders SET amount = amount_new WHERE ...`
}
```

**迁移 checklist:**
- [ ] 每步可回滚
- [ ] 每步幂等
- [ ] 每步有监控
- [ ] 切流量开关 (Feature Flag)
- [ ] 出问题一键回滚

---

## 6. ❌ 反模式 5: 生产直接跑迁移

```bash
# BAD: 直接在生产执行
psql -h prod-db -c "ALTER TABLE orders ADD COLUMN ..."
```

### ✅ 最佳实践: 阶梯式环境

```
dev → staging → canary (5%) → prod (100%)
  ↓        ↓          ↓              ↓
测试     集成测试    5% 流量        100% 流量
```

**每环境 checklist:**
- [ ] dev: 完整测试通过
- [ ] staging: 性能测试 (10x 数据量)
- [ ] canary: 5% 流量 24h 监控
- [ ] prod: 100% + 1h 监控

---

## 7. ❌ 反模式 6: 长事务

```typescript
// BAD: 迁移跑 1 小时,长事务
await prisma.$transaction(async (tx) => {
  const allUsers = await tx.user.findMany()  // 100 万行
  for (const u of allUsers) {
    await tx.user.update({ where: { id: u.id }, data: { tier: ... } })
  }
})
```

**问题**:
- 长事务持有锁 1 小时
- WAL 暴涨 (崩溃恢复慢)
- vacuum 无法清理

### ✅ 最佳实践: 批处理 + 短事务

```typescript
// GOOD: 分批 + 独立事务
async function migrateBatch(batchSize = 1000) {
  while (true) {
    const users = await prisma.user.findMany({
      where: { tier: null },
      take: batchSize
    })
    if (users.length === 0) break

    await prisma.$transaction(
      users.map(u => prisma.user.update({
        where: { id: u.id },
        data: { tier: calculateTier(u) }
      }))
    )

    await new Promise(r => setTimeout(r, 100))  // 让其他事务有机会
  }
}
```

---

## 8. ❌ 反模式 7: 不备份就迁移

```bash
# BAD: 没有备份
psql -c "ALTER TABLE orders DROP COLUMN ..."
```

### ✅ 最佳实践: 备份 + 验证

```bash
# 1. 全量备份
pg_dump orders_table > orders_backup_20260627.sql

# 2. 验证备份可恢复
createdb test_restore
psql test_restore < orders_backup_20260627.sql
psql test_restore -c "SELECT COUNT(*) FROM orders"

# 3. 正式迁移
psql prod_db -c "ALTER TABLE orders ..."

# 4. 保留备份 30 天
mv orders_backup_20260627.sql /backup/30days/
```

---

## 9. 实战 checklist

迁移前:

- [ ] 备份完整数据
- [ ] staging 环境跑通
- [ ] 备份可恢复验证
- [ ] 4 阶段计划 (Dual Write / Backfill / Cutover / Decommission)
- [ ] 每步可回滚
- [ ] 幂等性保证
- [ ] 监控指标 (查询延迟、错误率)
- [ ] oncall 通知
- [ ] 维护窗口 (避开业务高峰)
- [ ] FF 开关 (远程回滚)

迁移中:

- [ ] 监控 DB CPU / 连接数
- [ ] 监控慢查询
- [ ] 监控应用错误率
- [ ] 暂停 → 检查 → 继续

迁移后:

- [ ] 数据完整性验证 (count / checksum)
- [ ] 应用功能验证
- [ ] 性能基准对比
- [ ] 7 天观察期
- [ ] 清理临时字段

---

## 10. 神机营配置

```typescript
// prisma/migrations/ 目录约定
prisma/
  migrations/
    20260627_add_user_tier/
      migration.sql
      README.md       // 迁移说明
      rollback.sql    // 回滚脚本 (重要!)
```

**README.md 模板:**
```markdown
# Migration: add_user_tier

## 目的
会员等级字段从硬编码改为可配置

## 影响范围
- users 表
- 所有 User 实体相关代码

## 步骤
1. 加可空字段 (立即生效,无锁)
2. 批量回填 (后台脚本,5 分钟)
3. 加 NOT NULL 约束 (轻量锁)
4. 清理旧字段 (回滚可恢复 7 天)

## 回滚
参见 rollback.sql

## 监控
- users.tier IS NULL 比例 (应降到 0)
- 用户查询 P99 延迟 (无变化)

## 负责人
@龙虾哥
```

---

## 11. 关联反模式

- [db-index.md](db-index.md): 迁移时索引
- [concurrency-safety.md](concurrency-safety.md): 迁移时锁
- [performance-optimization.md](performance-optimization.md): 性能验证

---

> 🦞 **"数据迁移不是一次性事件 = 4 阶段可回滚的演进过程"**
> **"无锁 + 幂等 + 可回滚 = 生产零事故迁移"**